import { useQuery } from "@tanstack/react-query";
import { Activity, Eye, Users, TrendingUp } from "lucide-react";
import { fetchTrafficStats } from "@/lib/traffic";
import { Counter } from "@/components/Counter";
function Sparkline({ data }: { data: Array<{ day: string; views: number }> }) {
  const w = 100;
  const h = 34;
  if (data.length < 2) {
    return (
      <div className="label-mono flex h-[70px] items-center justify-center text-muted-foreground">
        Collecting traffic…
      </div>
    );
  }
  const max = Math.max(1, ...data.map((d) => d.views));
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (d.views / max) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-[70px] w-full">
        <defs>
          <linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#trafficFill)" />
        <path
          d={line}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.4"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="spark-draw"
        />
        <circle
          cx={pts[pts.length - 1]![0]}
          cy={pts[pts.length - 1]![1]}
          r="1.8"
          fill="var(--primary)"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="label-mono mt-1 flex justify-between text-muted-foreground">
        <span>14 days ago</span>
        <span>today</span>
      </div>
    </div>
  );
}

export function TrafficPanel() {
  const { data } = useQuery({
    queryKey: ["traffic-stats"],
    queryFn: fetchTrafficStats,
    refetchInterval: 30_000,
  });

  const stats = data ?? {
    total_views: 0,
    unique_visitors: 0,
    views_today: 0,
    views_7d: 0,
    live_now: 0,
    daily: [],
    top_paths: [],
  };

  const tiles = [
    { label: "Reading now", value: stats.live_now, icon: Activity },
    { label: "Views today", value: stats.views_today, icon: Eye },
    { label: "Unique visitors", value: stats.unique_visitors, icon: Users },
    { label: "Total views", value: stats.total_views, icon: TrendingUp },
  ];

  return (
    <section className="glass-panel rise overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <h2 className="label-mono text-muted-foreground">Live audience</h2>
        <span className="label-mono inline-flex items-center gap-1.5 text-primary">
          <span className="pulse-dot size-2 rounded-full bg-primary" />
          live
        </span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
        {tiles.map(({ label, value, icon: Icon }) => (
          <div key={label} className="px-5 py-4">
            <div className="label-mono flex items-center gap-1.5 text-muted-foreground">
              <Icon className="size-3.5" /> {label}
            </div>
            <Counter
              value={value}
              className="mt-1 block font-display text-2xl font-bold tabular-nums text-gradient"
            />
          </div>
        ))}
      </div>

      <div className="border-t border-border px-5 py-4">
        <Sparkline data={stats.daily} />
      </div>
    </section>
  );
}
