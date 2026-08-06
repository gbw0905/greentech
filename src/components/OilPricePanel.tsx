import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { getOilPricesFn, type OilQuote } from "@/lib/oil.functions";

function Chart({ q }: { q: OilQuote }) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 220;
  const h = 74;
  const pts = q.series;
  if (pts.length < 2) return null;
  const lo = Math.min(...pts.map((p) => p.c));
  const hi = Math.max(...pts.map((p) => p.c));
  const span = hi - lo || 1;
  const xy = pts.map((p, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = h - ((p.c - lo) / span) * (h - 8) - 4;
    return [x, y] as const;
  });
  const line = xy.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const up = q.change >= 0;
  const stroke = up ? "var(--primary)" : "var(--destructive)";
  const active = hover ?? pts.length - 1;
  const id = `oilFill-${q.symbol.replace(/\W/g, "")}`;
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="h-[74px] w-full"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - r.left) / r.width;
          setHover(Math.max(0, Math.min(pts.length - 1, Math.round(ratio * (pts.length - 1)))));
        }}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.3" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={xy[active]![0]} cy={xy[active]![1]} r="2" fill={stroke} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="label-mono mt-1 flex justify-between text-muted-foreground">
        <span>30 days</span>
        <span className="font-mono">
          {q.unit === "index" ? "" : "$"}
          {fmt(pts[active]!.c)} ·{" "}
          {new Date(pts[active]!.t).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      </div>
    </div>
  );
}

export function OilPricePanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["oil-prices"],
    queryFn: () => getOilPricesFn(),
    refetchInterval: 60_000,
  });

  const quotes = data?.quotes ?? [];

  return (
    <div className="glass-panel rise space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="label-mono text-muted-foreground">WTI crude &amp; S&amp;P 500 · live</h2>
        <span className="label-mono inline-flex items-center gap-1.5 text-primary">
          <span className="pulse-dot size-2 rounded-full bg-primary" />
          real time
        </span>
      </div>

      {isLoading && quotes.length === 0 && (
        <div className="scanning-bar h-24 rounded-[var(--radius)]" />
      )}
      {!isLoading && quotes.length === 0 && (
        <p className="text-sm text-muted-foreground">Price feed unavailable right now.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {quotes.map((q) => {
          const up = q.change >= 0;
          return (
            <div key={q.symbol} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold">{q.label}</span>
              <span
                className={`label-mono inline-flex items-center gap-1 ${up ? "text-primary" : "text-destructive"}`}
              >
                {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {up ? "+" : ""}
                {q.changePct.toFixed(2)}%
              </span>
            </div>
            <div className="font-display text-2xl font-bold tabular-nums text-gradient">
              {q.unit === "index" ? "" : "$"}
              {q.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="ml-1 font-mono text-xs font-normal text-muted-foreground">
                {q.unit}
              </span>
            </div>
            <Chart q={q} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
