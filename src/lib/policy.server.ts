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
  "biodiesel mandate B40 B30 government decision",
  "sustainable aviation fuel mandate policy regulation",
  "renewable fuel standard low carbon fuel standard rulemaking",
  "RED III ReFuelEU biofuel regulation news",
];

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
  const res = await fetch(`${GATEWAY}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": apiKey,
    },
    body: JSON.stringify({ query, limit: 10, tbs: "qdr:m", sources: ["news", "web"] }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firecrawl search failed [${res.status}]: ${body.slice(0, 300)}`);
  }
  return collect(await res.json());
}

export async function fetchPolicyFeed(): Promise<PolicyFeed> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const apiKey = process.env["FIRECRAWL_API_KEY"];
  const fetchedAt = new Date().toISOString();

  if (!lovableKey || !apiKey) {
    return { updates: [], fetchedAt, error: "Live search is not configured." };
  }

  const settled = await Promise.allSettled(
    QUERIES.map((q) => search(q, apiKey, lovableKey)),
  );

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