import type { LiveArticle, LiveVideo } from "@/features/videos/contracts";
import type { Json } from "@/integrations/supabase/types";

const UA = "GlobalBioenergyWatch/1.0 (+https://globalbioenergywatch.org)";

// ---------------------------------------------------------------------------
// Supabase cache helpers
// ---------------------------------------------------------------------------

type CacheKind = "youtube_search" | "news_search" | "youtube_related";

async function cacheRead<T>(key: string): Promise<{ value: T; fetchedAt: number } | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("video_cache")
    .select("payload, fetched_at")
    .eq("cache_key", key)
    .maybeSingle();
  if (!data) return null;
  return { value: data.payload as T, fetchedAt: new Date(data.fetched_at).getTime() };
}

async function cacheWrite(key: string, kind: CacheKind, payload: unknown): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("video_cache").upsert(
    { cache_key: key, kind, payload: payload as Json, fetched_at: new Date().toISOString() },
    { onConflict: "cache_key" },
  );
}

// ---------------------------------------------------------------------------
// YouTube Data API v3
// ---------------------------------------------------------------------------

function youtubeApiKey(): string {
  const key = process.env["YOUTUBE_API_KEY"];
  if (!key) throw new Error("YOUTUBE_API_KEY is not set");
  return key;
}

interface YTSearchItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    publishedAt?: string;
    liveBroadcastContent?: string;
    thumbnails?: { medium?: { url?: string } };
  };
}

interface YTVideoItem {
  id?: string;
  contentDetails?: { duration?: string };
}

function parseIsoDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const h = m[1] ? `${m[1]}:` : "";
  const min = m[2] ?? "0";
  const sec = (m[3] ?? "0").padStart(2, "0");
  return h ? `${h}${min.padStart(2, "0")}:${sec}` : `${min}:${sec}`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

async function searchYouTubeApi(keyword: string, limit: number): Promise<LiveVideo[]> {
  const apiKey = youtubeApiKey();
  const params = new URLSearchParams({
    part: "snippet",
    q: keyword,
    type: "video",
    order: "date",
    maxResults: String(Math.min(limit, 50)),
    relevanceLanguage: "en",
    key: apiKey,
  });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { items?: YTSearchItem[] };
  const items = json.items ?? [];
  const validItems = items.filter(
    (item): item is YTSearchItem & { id: { videoId: string } } =>
      typeof item.id?.videoId === "string" && /^[A-Za-z0-9_-]{11}$/.test(item.id.videoId),
  );
  if (!validItems.length) return [];

  // Fetch durations in a single batch call (1 quota unit)
  const ids = validItems.map((item) => item.id.videoId).join(",");
  const detailParams = new URLSearchParams({
    part: "contentDetails",
    id: ids,
    key: apiKey,
  });
  const detailRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?${detailParams}`, {
    signal: AbortSignal.timeout(10_000),
  });
  const durations = new Map<string, string>();
  if (detailRes.ok) {
    const detailJson = (await detailRes.json()) as { items?: YTVideoItem[] };
    for (const v of detailJson.items ?? []) {
      if (v.id && v.contentDetails?.duration) {
        durations.set(v.id, parseIsoDuration(v.contentDetails.duration));
      }
    }
  }

  return validItems.map((item) => ({
    id: item.id.videoId,
    title: item.snippet?.title ?? "Untitled",
    channel: item.snippet?.channelTitle ?? "YouTube",
    published: item.snippet?.publishedAt ? relativeTime(item.snippet.publishedAt) : "",
    duration: durations.get(item.id.videoId) ?? "",
    thumbnail: `https://i.ytimg.com/vi/${item.id.videoId}/mqdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    keyword,
    kind: "youtube" as const,
  }));
}

// ---------------------------------------------------------------------------
// YouTube HTML scraping fallback (used when API key is not set)
// ---------------------------------------------------------------------------

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

async function searchYouTubeScrape(keyword: string, limit: number): Promise<LiveVideo[]> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}&sp=CAI%253D`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
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
  return out
    .filter((video) => !recent || publishedAgeMinutes(video.published) <= 60 * 24 * 60)
    .sort((a, b) => publishedAgeMinutes(a.published) - publishedAgeMinutes(b.published))
    .slice(0, limit);
}

async function searchYouTube(keyword: string, limit: number): Promise<LiveVideo[]> {
  if (process.env["YOUTUBE_API_KEY"]) {
    return searchYouTubeApi(keyword, limit);
  }
  return searchYouTubeScrape(keyword, limit);
}

// ---------------------------------------------------------------------------
// Google News RSS (unchanged — RSS is stable and TOS-friendly)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Public API: fetchLiveMedia
// ---------------------------------------------------------------------------

const YOUTUBE_CACHE_TTL = 2 * 60 * 60_000; // 2 hours
const NEWS_CACHE_TTL = 30 * 60_000; // 30 minutes

export async function fetchLiveMedia(keywords: string[], perKeyword = 6) {
  const cacheKey = `media:${keywords.sort().join("|")}:${perKeyword}`;
  const cached = await cacheRead<{ videos: LiveVideo[]; articles: LiveArticle[] }>(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < YOUTUBE_CACHE_TTL) {
    return { ...cached.value, cachedAt: cached.fetchedAt, stale: false };
  }
  try {
    const recent = await Promise.all(
      keywords.map((keyword) => searchYouTube(keyword, perKeyword, true).catch(() => [])),
    );
    let videos = [...new Map(recent.flat().map((video) => [video.id, video])).values()];
    if (!videos.length) {
      const fallback = await Promise.all(
        keywords.map((keyword) => searchYouTube(keyword, perKeyword, false).catch(() => [])),
      );
      videos = [...new Map(fallback.flat().map((video) => [video.id, video])).values()];
    }
    if (videos.length || articles.length) {
      await cacheWrite(cacheKey, "youtube_search", { videos, articles }).catch(() => {});
    }
    return { videos, articles, cachedAt: Date.now(), stale: false };
  } catch {
    if (cached) return { ...cached.value, cachedAt: cached.fetchedAt, stale: true };
    return { videos: [], articles: [], cachedAt: Date.now(), stale: true };
  }
}

// ---------------------------------------------------------------------------
// Public API: fetchEntityNews
// ---------------------------------------------------------------------------

export async function fetchEntityNews(query: string, limit = 8) {
  const cacheKey = `entity-news:${query}:${limit}`;
  const cached = await cacheRead<{ articles: LiveArticle[] }>(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < NEWS_CACHE_TTL) {
    return { articles: cached.value.articles, cachedAt: cached.fetchedAt, stale: false };
  }
  try {
    const articles = await searchWeb(query, limit);
    if (articles.length) {
      await cacheWrite(cacheKey, "news_search", { articles }).catch(() => {});
    }
    return { articles, cachedAt: Date.now(), stale: false };
  } catch {
    if (cached) return { articles: cached.value.articles, cachedAt: cached.fetchedAt, stale: true };
    return { articles: [] as LiveArticle[], cachedAt: Date.now(), stale: true };
  }
}
