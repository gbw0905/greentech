import { cacheGet, cacheSet } from "./market-cache.server";

export interface HiringItem {
  title: string;
  source: string;
  published: string;
  url: string;
  keyword: string;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

function decode(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function searchNews(keyword: string, limit: number): Promise<HiringItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) return [];
  const xml = await res.text();
  return xml
    .split("<item>")
    .slice(1, limit + 1)
    .map((item) => {
      const get = (tag: string) => {
        const m = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
        return m && m[1] ? decode(m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim()) : "";
      };
      const rawTitle = get("title");
      const source = get("source") || rawTitle.split(" - ").pop() || "Web";
      return {
        title: rawTitle.replace(new RegExp(` - ${source}$`), ""),
        source,
        published: get("pubDate"),
        url: get("link"),
        keyword,
      };
    });
}

export async function fetchHiringNews(keywords: string[], perKeyword = 5) {
  const key = `jobs:${keywords.join("|")}:${perKeyword}`;
  const cached = cacheGet<{ items: HiringItem[] }>(key);
  if (cached && Date.now() - cached.at < 30 * 60_000) {
    return { items: cached.value.items, cachedAt: cached.at, stale: false };
  }
  try {
    const results = await Promise.all(keywords.map((k) => searchNews(k, perKeyword).catch(() => [])));
    const items: HiringItem[] = [];
    for (const list of results) {
      for (const it of list) if (!items.some((x) => x.url === it.url)) items.push(it);
    }
    if (items.length) cacheSet(key, { items });
    return { items, cachedAt: Date.now(), stale: false };
  } catch {
    if (cached) return { items: cached.value.items, cachedAt: cached.at, stale: true };
    return { items: [] as HiringItem[], cachedAt: Date.now(), stale: true };
  }
}
