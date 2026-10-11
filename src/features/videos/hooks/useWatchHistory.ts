import { useCallback, useEffect, useRef, useState } from "react";
import {
  addToWatchHistory,
  parseWatchHistory,
  WATCH_HISTORY_KEY,
  type WatchedVideo,
} from "../watch-history";
import type { LiveVideo } from "../contracts";

export function useWatchHistory() {
  const [history, setHistory] = useState<WatchedVideo[]>([]);
  const entries = useRef<WatchedVideo[]>([]);
  useEffect(() => {
    const read = () => {
      try {
        entries.current = parseWatchHistory(localStorage.getItem(WATCH_HISTORY_KEY));
      } catch {
        entries.current = [];
      }
      setHistory(entries.current);
    };
    read();
    const sync = (event: StorageEvent) => {
      if (event.key === WATCH_HISTORY_KEY || event.key === null) read();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const save = useCallback((next: WatchedVideo[]) => {
    entries.current = next;
    setHistory(next);
    try {
      localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(next));
    } catch {
      /* Keep this session usable when browser storage is unavailable. */
    }
  }, []);
  const record = useCallback(
    (video: LiveVideo) => save(addToWatchHistory(entries.current, video)),
    [save],
  );
  const remove = useCallback(
    (id: string) => save(entries.current.filter((video) => video.id !== id)),
    [save],
  );
  const clear = useCallback(() => save([]), [save]);
  return { history, record, remove, clear };
}
