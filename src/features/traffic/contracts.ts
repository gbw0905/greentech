export type TrafficStats = {
  total_views: number;
  unique_visitors: number;
  views_today: number;
  views_7d: number;
  live_now: number;
  daily: Array<{ day: string; views: number }>;
  top_paths: Array<{ path: string; views: number }>;
  top_countries: Array<{ country: string; views: number; visitors: number }>;
  top_sources: Array<{ source: string; views: number }>;
};
