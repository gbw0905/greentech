import { useQuery } from "@tanstack/react-query";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { getOilPricesFn } from "@/lib/oil.functions";
import { fetchTrafficStats } from "@/lib/traffic";
import { getPolicyFeed } from "@/lib/policy.functions";
import type { PolicyUpdate } from "@/lib/policy-types";

function PricePill({
  label,
  price,
  change,
  changePct,
  symbol,
}: {
  label: string;
  price: number;
  change: number;
  changePct: number;
  symbol: string;
}) {
  const up = change >= 0;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="font-mono text-[10px] opacity-80">{symbol}</span>
      <span className="font-semibold">{label}</span>
      <span className="font-mono tabular-nums">${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      <span
        className={`inline-flex items-center gap-0.5 font-mono text-[10px] tabular-nums ${up ? "text-emerald-300" : "text-rose-300"}`}
      >
        {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
        {up ? "+" : ""}
        {changePct.toFixed(2)}%
      </span>
    </span>
  );
}

export function LiveMarquee() {
  const { data: oilData } = useQuery({
    queryKey: ["oil-prices"],
    queryFn: () => getOilPricesFn(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const { data: trafficData } = useQuery({
    queryKey: ["traffic-stats"],
    queryFn: fetchTrafficStats,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const { data: feedData } = useQuery({
    queryKey: ["policy-feed"],
    queryFn: () => loadFeed(),
    refetchInterval: 60_000,
  });

  const quotes = oilData?.quotes ?? [];
  const latest = feedData?.updates?.slice(0, 4) ?? [];
  const liveNow = trafficData?.live_now ?? 0;
  const totalViews = trafficData?.total_views ?? 0;

  return (
    <div className="marquee-bar overflow-hidden border-y border-menubar-fg/10 bg-menubar-bg text-menubar-fg">
      <div className="marquee-track flex items-center gap-6 py-1.5 text-xs">
        <span className="inline-flex shrink-0 items-center gap-1.5 px-3 font-bold text-menubar-fg">
          <Activity className="size-3.5" /> Live desk
        </span>

        {quotes.map((q) => (
          <span key={q.symbol} className="marquee-item shrink-0">
            <PricePill
              label={q.label}
              price={q.price}
              change={q.change}
              changePct={q.changePct}
              symbol={q.symbol}
            />
          </span>
        ))}

        {latest.map((u) => (
          <span key={u.id} className="marquee-item shrink-0 max-w-[28ch] truncate opacity-90">
            <span className="font-mono text-[10px] opacity-70">{u.country ?? "Global"}</span>
            <span className="mx-1.5 opacity-40">·</span>
            <span className="truncate">{u.title}</span>
          </span>
        ))}

        <span className="marquee-item inline-flex shrink-0 items-center gap-1.5 opacity-90">
          <span className="pulse-dot size-2 rounded-full bg-emerald-400" />
          <span className="font-semibold">{liveNow}</span>
          <span className="opacity-80">viewing now</span>
          <span className="mx-1 opacity-40">·</span>
          <span className="font-mono tabular-nums">{totalViews.toLocaleString()}</span>
          <span className="opacity-80">total views</span>
        </span>
      </div>
    </div>
  );
}
