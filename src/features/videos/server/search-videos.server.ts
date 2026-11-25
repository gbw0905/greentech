import type { LiveVideo } from "@/features/videos/contracts";
import type { Json } from "@/integrations/supabase/types";

// ---------------------------------------------------------------------------
// Supabase cache helpers
// ---------------------------------------------------------------------------

type CacheKind = "youtube_search" | "youtube_related";

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
  await supabaseAdmin
    .from("video_cache")
    .upsert(
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

async function searchYouTube(keyword: string, limit: number): Promise<LiveVideo[]> {
  // Official YouTube Data API only. No key means no videos — never scraping.
  if (!process.env["YOUTUBE_API_KEY"]) return [];
  return searchYouTubeApi(keyword, limit);
}

// ---------------------------------------------------------------------------
// Public API: fetchLiveMedia
// ---------------------------------------------------------------------------

const YOUTUBE_CACHE_TTL = 2 * 60 * 60_000; // 2 hours

/**
 * Visitors cannot force a cache bypass: every miss costs YouTube API quota, so
 * results are served from the Supabase cache for two hours.
 */
export async function fetchLiveMedia(keywords: string[], perKeyword = 6) {
  const cacheKey = `media:${keywords.sort().join("|")}:${perKeyword}`;
  const cached = await cacheRead<{ videos: LiveVideo[] }>(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < YOUTUBE_CACHE_TTL) {
    return { videos: cached.value.videos, cachedAt: cached.fetchedAt, stale: false };
  }
  try {
    const results = await Promise.all(
      keywords.map((keyword) => searchYouTube(keyword, perKeyword).catch(() => [])),
    );
    const videos = [...new Map(results.flat().map((video) => [video.id, video])).values()];
    if (videos.length) {
      await cacheWrite(cacheKey, "youtube_search", { videos }).catch(() => {});
    }
    return { videos, cachedAt: Date.now(), stale: false };
  } catch {
    if (cached) return { videos: cached.value.videos, cachedAt: cached.fetchedAt, stale: true };
    return { videos: [] as LiveVideo[], cachedAt: Date.now(), stale: true };
  }
}
