import type { LiveArticle, LiveVideo } from "@/features/videos/contracts";
import { cacheGet, cacheSet } from "@/features/markets/server/market-cache.server";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

interface YouTubeText {
  simpleText?: string;
  runs?: Array<{ text?: string }>;
}

interface YouTubeVideoRenderer {
  videoId?: unknown;
  title?: YouTubeText;
  ownerText?: YouTubeText;
  longBylineText?: YouTubeText;
  publishedTimeText?: YouTubeText;
  lengthText?: YouTubeText;
}

export function collectYouTubeVideos(node: unknown, out: LiveVideo[], keyword: string) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const n of node) collectYouTubeVideos(n, out, keyword);
    return;
  }
  const rec = node as Record<string, unknown>;
  const vr = rec["videoRenderer"] as YouTubeVideoRenderer | undefined;
  if (vr && typeof vr.videoId === "string" && /^[A-Za-z0-9_-]{11}$/.test(vr.videoId)) {
    const id = String(vr.videoId);
    if (!out.some((v) => v.id === id)) {
      out.push({
        id,
        title:
          vr.title?.simpleText ??
          vr.title?.runs?.map((run) => run.text ?? "").join("") ??
          "Untitled",
        channel: vr.ownerText?.runs?.[0]?.text ?? vr.longBylineText?.runs?.[0]?.text ?? "YouTube",
        published: vr.publishedTimeText?.simpleText ?? "",
        duration: vr.lengthText?.simpleText ?? "",
        thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${id}`,
        keyword,
        kind: "youtube",
      });
    }
  }
  for (const key of Object.keys(rec)) collectYouTubeVideos(rec[key], out, keyword);
}

async function searchYouTube(keyword: string, limit: number): Promise<LiveVideo[]> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}&sp=CAI%253D`;
  const res = await fetch(url, {
    headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9" },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const marker = "var ytInitialData = ";
  const start = html.indexOf(marker);
  if (start === -1) return [];
  const end = html.indexOf("};", start);
  if (end === -1) return [];
  let data: unknown;
  try {
    data = JSON.parse(html.slice(start + marker.length, end + 1));
  } catch {
    return [];
  }
  const out: LiveVideo[] = [];
  collectYouTubeVideos(data, out, keyword);
  return out.slice(0, limit);
}

function decode(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function searchWeb(keyword: string, limit: number): Promise<LiveArticle[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) return [];
  const xml = await res.text();
  const items = xml.split("<item>").slice(1, limit + 1);
  return items.map((item) => {
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
      kind: "web" as const,
    };
  });
}

export async function fetchLiveMedia(keywords: string[], perKeyword = 6) {
  const key = `media:${keywords.join("|")}:${perKeyword}`;
  const cached = cacheGet<{ videos: LiveVideo[]; articles: LiveArticle[] }>(key);
  if (cached && Date.now() - cached.at < 30 * 60_000) {
    return { ...cached.value, cachedAt: cached.at, stale: false };
  }
  try {
    const results = await Promise.all(
      keywords.map(async (k) => ({
        videos: await searchYouTube(k, perKeyword).catch(() => []),
        articles: await searchWeb(k, perKeyword).catch(() => []),
      })),
    );
    const videos: LiveVideo[] = [];
    const articles: LiveArticle[] = [];
    for (const r of results) {
      for (const v of r.videos) if (!videos.some((x) => x.id === v.id)) videos.push(v);
      for (const a of r.articles) if (!articles.some((x) => x.url === a.url)) articles.push(a);
    }
    if (videos.length || articles.length) cacheSet(key, { videos, articles });
    return { videos, articles, cachedAt: Date.now(), stale: false };
  } catch {
    if (cached) return { ...cached.value, cachedAt: cached.at, stale: true };
    return { videos: [], articles: [], cachedAt: Date.now(), stale: true };
  }
}

/** Latest headlines for a single entity (company, airline, terminal…). */
export async function fetchEntityNews(query: string, limit = 8) {
  const key = `entity-news:${query}:${limit}`;
  const cached = cacheGet<{ articles: LiveArticle[] }>(key);
  if (cached && Date.now() - cached.at < 20 * 60_000) {
    return { articles: cached.value.articles, cachedAt: cached.at, stale: false };
  }
  try {
    const articles = await searchWeb(query, limit);
    if (articles.length) cacheSet(key, { articles });
    return { articles, cachedAt: Date.now(), stale: false };
  } catch {
    if (cached) return { articles: cached.value.articles, cachedAt: cached.at, stale: true };
    return { articles: [] as LiveArticle[], cachedAt: Date.now(), stale: true };
  }
}
