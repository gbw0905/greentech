import {
  COUNTRIES,
  FUEL_KEYWORDS,
  FUEL_TYPES,
  type FuelType,
} from "./policy-taxonomy";
import { FEED_SOURCES, backfillSources } from "./policy-sources";
import { isTrustedOutlet, isOfficialSource } from "./policy-outlets";

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
  // Prefer the most specific jurisdiction: a named member state beats the EU-wide
  // entry, and a longer alias beats an incidental short one.
  let country: (typeof COUNTRIES)[number] | null = null;
  let best = 0;
  for (const c of COUNTRIES) {
    for (const a of c.aliases) {
      if (!haystack.includes(a)) continue;
      const score = a.trim().length + (c.slug === "european-union" ? 0 : 2);
      if (score > best) {
        best = score;
        country = c;
      }
    }
  }
  const fuels: FuelType[] = FUEL_TYPES.filter((f) =>
    FUEL_KEYWORDS[f].some((k) =>
      k.length <= 4 ? new RegExp(`\\b${k}\\b`).test(haystack) : haystack.includes(k),
    ),
  );
  return { country, fuels };
}

/** Who acted — an official body or lawmaking process must be named. */
const GOVERNMENT_ACTORS = [
  "government", "ministry", "minister", "ministerial", "parliament", "congress", "senate",
  "house of representatives", "cabinet", "president", "prime minister", "governor",
  "european commission", "european union", "eu ", "council of the eu", "regulator",
  "agency", "authority", "department of energy", "department of agriculture", "usda",
  "epa", "irs", "treasury", "doe", "carb", "federal register", "commission", "state",
  "administration", "lawmakers", "legislature", "court", "supreme court", "petrobras policy",
  "national assembly", "gazette", "official journal",
];

/** What happened — a policy instrument or legislative action. */
const POLICY_ACTIONS = [
  "policy", "mandate", "blending obligation", "blend mandate", "regulation", "regulatory",
  "law", "bill", "ruling", "directive", "decree", "legislation", "rulemaking", "final rule",
  "proposed rule", "guidance", "waiver", "obligation", "quota", "subsidy", "tax credit",
  "incentive scheme", "standard", "tariff", "target", "framework", "act", "amendment",
  "consultation", "notice", "exemption", "compliance", "enacted", "approved", "signed into law",
];

/** Substantive market moves worth publishing alongside policy. */
const MARKET_ACTIONS = [
  "price", "prices", "demand", "supply", "output", "production", "capacity", "exports",
  "imports", "margin", "spread", "investment", "invests", "plant", "refinery", "facility",
  "offtake", "supply deal", "contract", "acquisition", "acquires", "merger", "joint venture",
  "expansion", "expands", "shutdown", "halts", "forecast", "outlook", "market", "trade",
  "tender", "auction", "credits", "shipment", "blending rate", "consumption",
];

/** Pure promotional / people noise — never published. */
const NOISE_SIGNALS = [
  "webinar", "conference", "award", "sponsor", "appoints", "hires", "promoted to",
  "job opening", "press release distribution", "market research report", "market size",
  "cagr", "forecast period 20",
];

const BIO_SIGNALS = [
  "biofuel", "bioenergy", "ethanol", "biodiesel", "renewable diesel", "hvo",
  "sustainable aviation fuel", "saf", "biogas", "biomethane", "renewable fuel",
  "low carbon fuel", "feedstock", "biomass",
  "45z", "45v", "clean fuel production credit", "clean hydrogen production credit",
  "renewable fuel standard", "e15 ", "rin credit", "rins",
];

/** Named official instruments — the document itself signals a government act. */
const OFFICIAL_DOCUMENTS = [
  "federal register", "official journal", "gazette", "statutory instrument",
  "notice of proposed rulemaking", "final rule", "proposed rule", "delegated act",
  "implementing regulation", "royal decree", "executive order", "presidential decree",
  "ministerial order", "ministerial decree", "ordinance", "public consultation",
  "draft regulation", "signed into law", "enters into force", "council directive",
  "council regulation", "national gazette", "notification issued",
];

export type UpdateCategory = "policy" | "market";

/**
 * Classify an item as a government policy move, a market update, or noise.
 * Anything published by an official body (federal register notices, ministry
 * releases, EU institutions) counts as policy on the strength of the publisher.
 */
export function categorise(text: string, source = "", link = ""): UpdateCategory | null {
  const t = ` ${text.toLowerCase()} `;
  if (!BIO_SIGNALS.some((s) => t.includes(s))) return null;
  if (NOISE_SIGNALS.some((s) => t.includes(s))) return null;
  if (isOfficialSource(source, link)) return "policy";
  if (OFFICIAL_DOCUMENTS.some((s) => t.includes(s))) return "policy";
  if (GOVERNMENT_ACTORS.some((s) => t.includes(s)) && POLICY_ACTIONS.some((s) => t.includes(s))) {
    return "policy";
  }
  if (MARKET_ACTIONS.some((s) => t.includes(s))) return "market";
  return null;
}

/** Kept for existing callers: true when the item is publishable at all. */
export function isRelevant(text: string, source = "", link = ""): boolean {
  return categorise(text, source, link) !== null;
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
  purged: number;
  scannedExisting: number;
  purgeError: string | null;
}

export async function ingestPolicyUpdates(): Promise<IngestResult> {
  // Live sweeps plus month-by-month backfill so the archive spans all months.
  const sources = [...FEED_SOURCES, ...backfillSources(6)];
  const results: { name: string; items: FeedItem[] }[] = [];
  for (let i = 0; i < sources.length; i += 12) {
    const batch = sources.slice(i, i + 12);
    results.push(
      ...(await Promise.all(
        batch.map(async (f) => ({ name: f.name, items: await loadFeed(f.url, f.name) })),
      )),
    );
  }

  const feedsOk = results.filter((r) => r.items.length > 0).length;
  const all = results.flatMap((r) => r.items);

  const seenUrl = new Set<string>();
  const seenTitle = new Set<string>();
  const rows = [];

  for (const item of all) {
    const text = `${item.title} ${item.summary}`;
    const category = categorise(text, item.source, item.link);
    if (!category) continue;
    // Only authentic global media, trade journals and official publishers.
    if (!isTrustedOutlet(item.source, item.link)) continue;
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
      category,
      source: item.source.includes(".") ? hostOf(`https://${item.source}`) : item.source,
      published_at: item.publishedAt,
      region: country?.region ?? "Global",
      country_slug: country?.slug ?? null,
      country_name: country?.name ?? null,
      fuels,
    });
  }

  let upserted = 0;
  let purged = 0;
  let scannedExisting = 0;
  let purgeError: string | null = null;
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

    // Purge previously stored items that are not government policy moves.
    const { data: existing } = await supabaseAdmin
      .from("policy_updates")
      .select("url,title,summary,source")
      .limit(2000);
    const stale = (existing ?? [])
      .filter(
        (r) =>
          !isRelevant(`${r.title} ${r.summary ?? ""}`, r.source ?? "", r.url) ||
          !isTrustedOutlet(r.source ?? "", r.url),
      )
      .map((r) => r.url);
    for (let i = 0; i < stale.length; i += 20) {
      const { error: delErr } = await supabaseAdmin
        .from("policy_updates")
        .delete()
        .in("url", stale.slice(i, i + 20));
      if (delErr) purgeError = delErr.message;
    }
    purged = stale.length;
    scannedExisting = (existing ?? []).length;

    // Re-attribute rows stored before the taxonomy improved.
    const { data: unattributed } = await supabaseAdmin
      .from("policy_updates")
      .select("url,title,summary")
      .is("country_slug", null)
      .limit(1000);
    for (const r of unattributed ?? []) {
      const { country, fuels } = classify(`${r.title} ${r.summary ?? ""}`);
      if (!country) continue;
      await supabaseAdmin
        .from("policy_updates")
        .update({
          country_slug: country.slug,
          country_name: country.name,
          region: country.region,
          fuels,
        })
        .eq("url", r.url);
    }
  }

  return {
    scanned: all.length,
    kept: rows.length,
    upserted,
    feedsOk,
    feedsTotal: sources.length,
    purged,
    scannedExisting,
    purgeError,
  };
}
