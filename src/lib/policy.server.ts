import {
  COUNTRIES,
  FUEL_KEYWORDS,
  FUEL_TYPES,
  type FuelType,
  type Region,
} from "./policy-taxonomy";

export interface PolicyUpdate {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string | null;
  region: Region;
  countrySlug: string | null;
  countryName: string | null;
  fuels: FuelType[];
}

export interface PolicyFeed {
  updates: PolicyUpdate[];
  fetchedAt: string;
  error: string | null;
}

const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";

const QUERIES = [
  "biofuel policy mandate update government",
  "ethanol blending mandate policy announcement",
  "sustainable aviation fuel mandate policy regulation",
];

const CACHE_TTL_MS = 30 * 60 * 1000;
let cache: { feed: PolicyFeed; at: number } | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface RawResult {
  url?: string;
  title?: string;
  description?: string;
  snippet?: string;
  publishedDate?: string;
  date?: string;
}

function collect(payload: unknown): RawResult[] {
  const data = (payload as { data?: unknown })?.data;
  if (Array.isArray(data)) return data as RawResult[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    return [...(obj["news"] as RawResult[] | undefined ?? []), ...(obj["web"] as RawResult[] | undefined ?? [])];
  }
  return [];
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

function classify(text: string) {
  const haystack = ` ${text.toLowerCase()} `;
  const country =
    COUNTRIES.find((c) => c.aliases.some((a) => haystack.includes(a))) ?? null;
  const fuels = FUEL_TYPES.filter((f) =>
    FUEL_KEYWORDS[f].some((k) =>
      k.length <= 4 ? new RegExp(`\\b${k}\\b`).test(haystack) : haystack.includes(k),
    ),
  );
  return { country, fuels };
}

async function search(query: string, apiKey: string, lovableKey: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`${GATEWAY}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": apiKey,
      },
      body: JSON.stringify({ query, limit: 10, tbs: "qdr:m", sources: ["news", "web"] }),
    });
    const body = await res.text();
    const rateLimited = res.status === 429 || body.includes("Rate limit exceeded");
    if (res.ok && !rateLimited) {
      return collect(JSON.parse(body));
    }
    if (rateLimited && attempt < 4) {
      const m = body.match(/retry after (\d+)s/i);
      const waitSec = m?.[1] ? Number(m[1]) : 15;
      await sleep(Math.min(waitSec + 3, 45) * 1000);
      continue;
    }
    throw new Error(`Firecrawl search failed [${res.status}]: ${body.slice(0, 200)}`);
  }
  return [];
}

export async function fetchPolicyFeed(): Promise<PolicyFeed> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const apiKey = process.env["FIRECRAWL_API_KEY"];
  const fetchedAt = new Date().toISOString();

  if (!lovableKey || !apiKey) {
    return { updates: [], fetchedAt, error: "Live search is not configured." };
  }

  // Sequential with spacing: the search API is aggressively rate limited.
  const settled: PromiseSettledResult<RawResult[]>[] = [];
  for (const q of QUERIES) {
    try {
      settled.push({ status: "fulfilled", value: await search(q, apiKey, lovableKey) });
    } catch (e) {
      settled.push({ status: "rejected", reason: e });
    }
    await sleep(1500);
  }

  const failures = settled.filter((s) => s.status === "rejected");
  const raw = settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));

  if (raw.length === 0) {
    const reason =
      failures[0] && failures[0].status === "rejected"
        ? String((failures[0] as PromiseRejectedResult).reason)
        : "No results returned.";
    return { updates: [], fetchedAt, error: reason };
  }

  const seen = new Set<string>();
  const updates: PolicyUpdate[] = [];

  for (const item of raw) {
    const url = item.url;
    const title = (item.title ?? "").trim();
    if (!url || !title || seen.has(url)) continue;
    seen.add(url);

    const summary = (item.description ?? item.snippet ?? "").trim();
    const { country, fuels } = classify(`${title} ${summary}`);
    const published = item.publishedDate ?? item.date ?? null;

    updates.push({
      id: url,
      title,
      summary,
      url,
      source: hostOf(url),
      publishedAt: published ? new Date(published).toISOString() : null,
      region: country?.region ?? "Global",
      countrySlug: country?.slug ?? null,
      countryName: country?.name ?? null,
      fuels: fuels.length ? fuels : [],
    });
  }

  updates.sort((a, b) => {
    const at = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bt = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return bt - at;
  });

  return {
    updates,
    fetchedAt,
    error: failures.length === settled.length ? "All searches failed." : null,
  };
}

export async function getCachedPolicyFeed(): Promise<PolicyFeed> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS && cache.feed.updates.length > 0) {
    return cache.feed;
  }
  const feed = await fetchPolicyFeed();
  if (feed.updates.length > 0) {
    cache = { feed, at: Date.now() };
    return feed;
  }
  // Serve the last good scan rather than an empty screen when sources are throttled.
  if (cache) return { ...cache.feed, error: feed.error };
  return feed;
}