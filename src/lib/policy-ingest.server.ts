import {
  COUNTRIES,
  FUEL_KEYWORDS,
  FUEL_TYPES,
  type FuelType,
} from "./policy-taxonomy";
import { FEED_SOURCES } from "./policy-sources";

interface FeedItem {
  title: string;
  link: string;
  summary: string;
  publishedAt: string | null;
  source: string;
}

const entities = (s: string): string =>
  s
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

/** Feeds nest escaped markup inside CDATA, so decode entities first, then strip tags. */
const decode = (s: string): string =>
  entities(entities(s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")).replace(/<[^>]+>/g, " "))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m?.[1] ? decode(m[1]) : "";
}

function linkOf(block: string): string {
  const rss = tag(block, "link");
  if (rss) return rss;
  const atom = block.match(/<link[^>]*href="([^"]+)"/i);
  return atom?.[1] ?? "";
}

function parseFeed(xml: string, fallbackSource: string): FeedItem[] {
  const blocks = xml.match(/<(item|entry)[\s\S]*?<\/(item|entry)>/gi) ?? [];
  const items: FeedItem[] = [];
  for (const block of blocks) {
    const title = tag(block, "title");
    const link = linkOf(block);
    if (!title || !link) continue;
    const rawDate =
      tag(block, "pubDate") || tag(block, "updated") || tag(block, "published") || "";
    const parsed = rawDate ? Date.parse(rawDate) : Number.NaN;
    const sourceTag = tag(block, "source");
    items.push({
      title,
      link,
      summary: (tag(block, "description") || tag(block, "summary") || tag(block, "content")).slice(0, 600),
      publishedAt: Number.isNaN(parsed) ? null : new Date(parsed).toISOString(),
      source: sourceTag || fallbackSource,
    });
  }
  return items;
}

function classify(text: string) {
  const haystack = ` ${text.toLowerCase()} `;
  const country = COUNTRIES.find((c) => c.aliases.some((a) => haystack.includes(a))) ?? null;
  const fuels: FuelType[] = FUEL_TYPES.filter((f) =>
    FUEL_KEYWORDS[f].some((k) =>
      k.length <= 4 ? new RegExp(`\\b${k}\\b`).test(haystack) : haystack.includes(k),
    ),
  );
  return { country, fuels };
}

const POLICY_SIGNALS = [
  "policy", "mandate", "blend", "regulation", "regulator", "law", "bill", "ruling",
  "government", "ministry", "parliament", "directive", "target", "subsidy", "tax credit",
  "incentive", "standard", "quota", "tariff", "epa", "rule", "decree", "legislation",
  "approval", "waiver", "obligation", "irs", "treasury", "guidance", "final rule",
  "notice", "credit",
];

const BIO_SIGNALS = [
  "biofuel", "bioenergy", "ethanol", "biodiesel", "renewable diesel", "hvo",
  "sustainable aviation fuel", "saf", "biogas", "biomethane", "renewable fuel",
  "low carbon fuel", "feedstock", "biomass",
  "45z", "45v", "clean fuel production credit", "clean hydrogen production credit",
  "renewable fuel standard", "e15", "rin",
];

function isRelevant(text: string): boolean {
  const t = text.toLowerCase();
  return BIO_SIGNALS.some((s) => t.includes(s)) && POLICY_SIGNALS.some((s) => t.includes(s));
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

async function loadFeed(url: string, name: string): Promise<FeedItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "GlobalBioenergyWatch/1.0 (+policy tracker)" },
    });
    if (!res.ok) return [];
    return parseFeed(await res.text(), name);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export interface IngestResult {
  scanned: number;
  kept: number;
  upserted: number;
  feedsOk: number;
  feedsTotal: number;
}

export async function ingestPolicyUpdates(): Promise<IngestResult> {
  const results = await Promise.all(
    FEED_SOURCES.map(async (f) => ({ name: f.name, items: await loadFeed(f.url, f.name) })),
  );

  const feedsOk = results.filter((r) => r.items.length > 0).length;
  const all = results.flatMap((r) => r.items);

  const seenUrl = new Set<string>();
  const seenTitle = new Set<string>();
  const rows = [];

  for (const item of all) {
    const text = `${item.title} ${item.summary}`;
    if (!isRelevant(text)) continue;
    const titleKey = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 90);
    if (seenUrl.has(item.link) || seenTitle.has(titleKey)) continue;
    seenUrl.add(item.link);
    seenTitle.add(titleKey);

    const { country, fuels } = classify(text);
    let summary = item.summary;
    if (summary.toLowerCase().startsWith(item.title.toLowerCase())) {
      summary = summary.slice(item.title.length).trim();
    }
    summary = summary.replace(/^[-–—·|\s]+/, "").slice(0, 320);
    rows.push({
      url: item.link,
      title: item.title.slice(0, 400),
      summary,
      source: item.source.includes(".") ? hostOf(`https://${item.source}`) : item.source,
      published_at: item.publishedAt,
      region: country?.region ?? "Global",
      country_slug: country?.slug ?? null,
      country_name: country?.name ?? null,
      fuels,
    });
  }

  let upserted = 0;
  if (rows.length > 0) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200);
      const { error } = await supabaseAdmin
        .from("policy_updates")
        .upsert(chunk, { onConflict: "url", ignoreDuplicates: false });
      if (error) throw new Error(error.message);
      upserted += chunk.length;
    }
    // Keep the archive tidy: drop anything older than 180 days.
    const cutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin.from("policy_updates").delete().lt("published_at", cutoff);
  }

  return {
    scanned: all.length,
    kept: rows.length,
    upserted,
    feedsOk,
    feedsTotal: FEED_SOURCES.length,
  };
}
