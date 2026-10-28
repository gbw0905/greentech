import { z } from "zod";
import type { LiveVideo } from "../contracts";
import type { Json } from "@/integrations/supabase/types";
import { collectYouTubeVideos } from "./search-videos.server";

const UA = "GlobalBioenergyWatch/1.0 (+https://globalbioenergywatch.org)";

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
    { cache_key: key, kind: "youtube_related" as const, payload: payload as Json, fetched_at: new Date().toISOString() },
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
    ? Buffer.from(JSON.stringify({ pageToken: json.nextPageToken, mode: "api" })).toString("base64url")
    : null;

  return { videos, nextCursor };
}

// ---------------------------------------------------------------------------
// Scraping fallback (when YOUTUBE_API_KEY is not set)
// ---------------------------------------------------------------------------

const scrapeCursorSchema = z.object({
  token: z.string().min(1).max(16000),
  version: z.string().regex(/^[a-zA-Z0-9._-]{1,80}$/),
});

function continuation(node: unknown): string | null {
  if (!node || typeof node !== "object") return null;
  const record = node as Record<string, unknown>;
  const item = record["continuationItemRenderer"] as
    | { continuationEndpoint?: { continuationCommand?: { token?: unknown } } }
    | undefined;
  const token = item?.continuationEndpoint?.continuationCommand?.token;
  if (typeof token === "string" && token.length <= 16000) return token;
  for (const child of Object.values(record)) {
    const found = continuation(child);
    if (found) return found;
  }
  return null;
}

async function fetchRecommendationsScrape(
  keyword: string,
  cursor?: string,
): Promise<RecommendationPage> {
  let data: unknown;
  let version: string;
  if (cursor) {
    const decoded = scrapeCursorSchema.parse(
      JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")),
    );
    version = decoded.version;
    const response = await fetch("https://www.youtube.com/youtubei/v1/search?prettyPrint=false", {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: { "content-type": "application/json", "user-agent": UA },
      body: JSON.stringify({
        context: { client: { clientName: "WEB", clientVersion: version, hl: "en", gl: "US" } },
        continuation: decoded.token,
      }),
    });
    if (!response.ok) throw new Error("More videos could not be loaded. Please try again.");
    data = await response.json();
  } else {
    const response = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}&sp=CAI%253D`,
      {
        signal: AbortSignal.timeout(15000),
        headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9" },
      },
    );
    if (!response.ok) throw new Error("More videos could not be loaded. Please try again.");
    const html = await response.text();
    const marker = "var ytInitialData = ";
    const start = html.indexOf(marker);
    const end = html.indexOf("};", start);
    if (start < 0 || end < 0) throw new Error("More videos are temporarily unavailable.");
    data = JSON.parse(html.slice(start + marker.length, end + 1));
    version = html.match(/"INNERTUBE_CONTEXT_CLIENT_VERSION":"([^"]+)"/)?.[1] ?? "";
  }
  const videos: LiveVideo[] = [];
  collectYouTubeVideos(data, videos, keyword);
  const token = continuation(data);
  const nextCursor =
    token && version && videos.length
      ? Buffer.from(JSON.stringify({ token, version })).toString("base64url")
      : null;
  if (!videos.length && !cursor) throw new Error("More videos are temporarily unavailable.");
  return { videos, nextCursor: nextCursor === cursor ? null : nextCursor };
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

  const useApi = !!process.env["YOUTUBE_API_KEY"];

  let result: RecommendationPage;
  if (useApi) {
    // Decode cursor to extract API pageToken if it came from a previous API response
    let pageToken: string | undefined;
    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
        if (decoded.mode === "api" && typeof decoded.pageToken === "string") {
          pageToken = decoded.pageToken;
        } else {
          // Cursor from old scraping session — start fresh with API
          pageToken = undefined;
        }
      } catch {
        pageToken = undefined;
      }
    }
    result = await fetchRecommendationsApi(keyword, pageToken);
  } else {
    result = await fetchRecommendationsScrape(keyword, cursor);
  }

  await cacheWrite(cacheKey, result).catch(() => {});
  return result;
}
