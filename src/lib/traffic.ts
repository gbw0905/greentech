import { supabase } from "@/integrations/supabase/client";

export type TrafficStats = {
  total_views: number;
  unique_visitors: number;
  views_today: number;
  views_7d: number;
  live_now: number;
  daily: Array<{ day: string; views: number }>;
  top_paths: Array<{ path: string; views: number }>;
};

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
  await supabase.rpc("record_visit", {
    _path: path,
    _visitor_id: visitorId,
    _referrer:
      typeof document !== "undefined" && document.referrer ? document.referrer : undefined,
  });
}

const EMPTY: TrafficStats = {
  total_views: 0,
  unique_visitors: 0,
  views_today: 0,
  views_7d: 0,
  live_now: 0,
  daily: [],
  top_paths: [],
};

export async function fetchTrafficStats(): Promise<TrafficStats> {
  const { data, error } = await supabase.rpc("get_traffic_stats");
  if (error || !data) return EMPTY;
  return { ...EMPTY, ...(data as unknown as TrafficStats) };
}
