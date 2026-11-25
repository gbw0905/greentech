import type { LiveVideo } from "../contracts";
import type { Json } from "@/integrations/supabase/types";

export interface RecommendationPage {
  videos: LiveVideo[];
  nextCursor: string | null;
}

// ---------------------------------------------------------------------------
// Supabase cache helpers (same pattern as search-videos.server)
// ---------------------------------------------------------------------------

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

async function cacheWrite(key: string, payload: unknown): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("video_cache").upsert(
    {
      cache_key: key,
      kind: "youtube_related" as const,
      payload: payload as Json,
      fetched_at: new Date().toISOString(),
    },
    { onConflict: "cache_key" },
  );
}

const CACHE_TTL = 2 * 60 * 60_000; // 2 hours

// ---------------------------------------------------------------------------
// YouTube Data API v3 — related/search with pagination
// ---------------------------------------------------------------------------

interface YTSearchItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    publishedAt?: string;
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

async function fetchRecommendationsApi(
  keyword: string,
  pageToken?: string,
): Promise<RecommendationPage> {
  const apiKey = process.env["YOUTUBE_API_KEY"];
  if (!apiKey) throw new Error("YOUTUBE_API_KEY is not set");

  const params = new URLSearchParams({
    part: "snippet",
    q: keyword,
    type: "video",
    order: "relevance",
    maxResults: "12",
    relevanceLanguage: "en",
    key: apiKey,
  });
  if (pageToken) params.set("pageToken", pageToken);

  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error("More videos could not be loaded. Please try again.");
  const json = (await res.json()) as {
    items?: YTSearchItem[];
    nextPageToken?: string;
  };
  const items = (json.items ?? []).filter(
    (item): item is YTSearchItem & { id: { videoId: string } } =>
      typeof item.id?.videoId === "string" && /^[A-Za-z0-9_-]{11}$/.test(item.id.videoId),
  );

  // Batch-fetch durations
  const durations = new Map<string, string>();
  if (items.length) {
    const ids = items.map((item) => item.id.videoId).join(",");
    const detailParams = new URLSearchParams({
      part: "contentDetails",
      id: ids,
      key: apiKey,
    });
    const detailRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?${detailParams}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (detailRes.ok) {
      const detailJson = (await detailRes.json()) as { items?: YTVideoItem[] };
      for (const v of detailJson.items ?? []) {
        if (v.id && v.contentDetails?.duration) {
          durations.set(v.id, parseIsoDuration(v.contentDetails.duration));
        }
      }
    }
  }

  const videos: LiveVideo[] = items.map((item) => ({
    id: item.id.videoId,
    title: item.snippet?.title ?? "Untitled",
    channel: item.snippet?.channelTitle ?? "YouTube",
    published: item.snippet?.publishedAt ? relativeTime(item.snippet.publishedAt) : "",
    duration: durations.get(item.id.videoId) ?? "",
    thumbnail: `https://i.ytimg.com/vi/${item.id.videoId}/mqdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    keyword,
    kind: "youtube",
  }));

  const nextCursor = json.nextPageToken
    ? Buffer.from(JSON.stringify({ pageToken: json.nextPageToken, mode: "api" })).toString(
        "base64url",
      )
    : null;

  return { videos, nextCursor };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchRecommendationPage(
  keyword: string,
  cursor?: string,
): Promise<RecommendationPage> {
  const cacheKey = `recommendations:${keyword}:${cursor ?? "first"}`;
  const cached = await cacheRead<RecommendationPage>(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached.value;

  // Only the official YouTube Data API is used. Without a key there is nothing
  // more to load — we never fall back to scraping YouTube pages.
  if (!process.env["YOUTUBE_API_KEY"]) return { videos: [], nextCursor: null };

  // Decode cursor to extract the API pageToken from a previous API response.
  let pageToken: string | undefined;
  if (cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
      if (decoded.mode === "api" && typeof decoded.pageToken === "string") {
        pageToken = decoded.pageToken;
      }
    } catch {
      pageToken = undefined;
    }
  }
  const result = await fetchRecommendationsApi(keyword, pageToken);

  await cacheWrite(cacheKey, result).catch(() => {});
  return result;
}
