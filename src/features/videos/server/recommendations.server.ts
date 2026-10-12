import { z } from "zod";
import type { LiveVideo } from "../contracts";
import { cacheGet, cacheSet } from "@/features/markets/server/market-cache.server";
import { collectYouTubeVideos } from "./search-videos.server";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const cursorSchema = z.object({
  token: z.string().min(1).max(16000),
  version: z.string().regex(/^[a-zA-Z0-9._-]{1,80}$/),
});
export interface RecommendationPage {
  videos: LiveVideo[];
  nextCursor: string | null;
}

/** The provider's continuation points to the next page, rather than repeating seed videos. */
function continuation(node: unknown): string | null {
  if (!node || typeof node !== "object") return null;
  const record = node as Record<string, unknown>;
  const item = record["continuationItemRenderer"] as
    { continuationEndpoint?: { continuationCommand?: { token?: unknown } } } | undefined;
  const token = item?.continuationEndpoint?.continuationCommand?.token;
  if (typeof token === "string" && token.length <= 16000) return token;
  for (const child of Object.values(record)) {
    const found = continuation(child);
    if (found) return found;
  }
  return null;
}

export async function fetchRecommendationPage(
  keyword: string,
  cursor?: string,
): Promise<RecommendationPage> {
  const cacheKey = `video-recommendations:${keyword}:${cursor ?? "first"}`;
  const cached = cacheGet<RecommendationPage>(cacheKey);
  if (cached && Date.now() - cached.at < 10 * 60_000) return cached.value;
  let data: unknown;
  let version: string;
  if (cursor) {
    const decoded = cursorSchema.parse(
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
  const result = { videos, nextCursor: nextCursor === cursor ? null : nextCursor };
  if (!videos.length && !cursor) throw new Error("More videos are temporarily unavailable.");
  cacheSet(cacheKey, result);
  return result;
}
