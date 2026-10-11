import type { LiveVideo } from "./contracts";

export const WATCH_HISTORY_KEY = "gbw.video-history.v1";
export const WATCH_HISTORY_LIMIT = 100;
export type WatchedVideo = LiveVideo & { watchedAt: number };

export function parseWatchHistory(raw: string | null): WatchedVideo[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    return value
      .flatMap((entry): WatchedVideo[] => {
        if (!entry || typeof entry !== "object") return [];
        const row = entry as Record<string, unknown>;
        if (
          typeof row["id"] !== "string" ||
          !/^[\w-]{11}$/.test(row["id"]) ||
          seen.has(row["id"]) ||
          typeof row["title"] !== "string" ||
          typeof row["channel"] !== "string" ||
          typeof row["watchedAt"] !== "number" ||
          !Number.isFinite(row["watchedAt"]) ||
          !Number.isFinite(new Date(row["watchedAt"]).getTime())
        )
          return [];
        seen.add(row["id"]);
        return [
          {
            id: row["id"],
            title: row["title"].slice(0, 512),
            channel: row["channel"].slice(0, 200),
            duration: typeof row["duration"] === "string" ? row["duration"].slice(0, 30) : "",
            published: typeof row["published"] === "string" ? row["published"].slice(0, 100) : "",
            keyword: typeof row["keyword"] === "string" ? row["keyword"].slice(0, 200) : "",
            thumbnail: `https://i.ytimg.com/vi/${row["id"]}/hqdefault.jpg`,
            url: `https://www.youtube.com/watch?v=${row["id"]}`,
            kind: "youtube",
            watchedAt: row["watchedAt"],
          },
        ];
      })
      .sort((a, b) => b.watchedAt - a.watchedAt)
      .slice(0, WATCH_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

export function addToWatchHistory(
  history: WatchedVideo[],
  video: LiveVideo,
  now = Date.now(),
): WatchedVideo[] {
  if (!/^[\w-]{11}$/.test(video.id)) return history;
  return [{ ...video, watchedAt: now }, ...history.filter((row) => row["id"] !== video.id)].slice(
    0,
    WATCH_HISTORY_LIMIT,
  );
}
