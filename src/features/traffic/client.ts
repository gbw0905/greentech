import { getTrafficStatsFn, recordVisitFn } from "@/features/traffic/server-functions";
import type { TrafficStats } from "@/features/traffic/contracts";

const STORAGE_KEY = "gbw_visitor_id";

export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export async function recordVisit(path: string): Promise<void> {
  const visitorId = getVisitorId();
  if (!visitorId) return;
  const referrer = typeof document !== "undefined" && document.referrer ? document.referrer : "";
  // Tagged sharing links carry utm_source in the landing URL; capture it so
  // email/messaging visits stop showing up as unknown "Direct".
  const utmSource =
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("utm_source") ?? "").slice(0, 100)
      : "";
  try {
    await recordVisitFn({
      data: {
        path: path.slice(0, 200),
        visitorId,
        ...(referrer ? { referrer: referrer.slice(0, 200) } : {}),
        ...(utmSource ? { utmSource } : {}),
      },
    });
  } catch {
    // analytics is best-effort
  }
}

const EMPTY: TrafficStats = {
  total_views: 0,
  unique_visitors: 0,
  views_today: 0,
  views_7d: 0,
  live_now: 0,
  daily: [],
  top_paths: [],
  top_countries: [],
  top_sources: [],
};

export async function fetchTrafficStats(): Promise<TrafficStats> {
  try {
    const data = await getTrafficStatsFn();
    if (!data) return EMPTY;
    return { ...EMPTY, ...(data as unknown as TrafficStats) };
  } catch {
    return EMPTY;
  }
}
