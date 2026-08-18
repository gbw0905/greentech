import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { getOilPricesFn, type OilQuote } from "@/lib/oil.functions";

const assetColor = (symbol: string) => {
  if (symbol === "CL=F") return "var(--market-crude)";
  if (symbol === "^GSPC") return "var(--market-equity)";
  if (symbol === "GC=F") return "var(--market-gold)";
  return "var(--primary)";
};

function Chart({ q, color }: { q: OilQuote; color: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 220;
  const h = 72;
  const padL = 34; // room for y-axis labels
  const plotW = w - padL;
  const pts = q.series;
  if (pts.length < 2) return null;
  const lo = Math.min(...pts.map((p) => p.c));
  const hi = Math.max(...pts.map((p) => p.c));
  const span = hi - lo || 1;
  const xy = pts.map((p, i) => {
    const x = padL + (i / (pts.length - 1)) * plotW;
    const y = h - ((p.c - lo) / span) * (h - 12) - 6;
    return [x, y] as const;
  });
  // Smooth the polyline with a Catmull-Rom → cubic bezier conversion.
  const line = xy
    .map(([x, y], i) => {
      if (i === 0) return `M${x.toFixed(2)},${y.toFixed(2)}`;
      const [x0, y0] = xy[i - 1]!;
      const [xp, yp] = xy[i - 2] ?? xy[i - 1]!;
      const [xn, yn] = xy[i + 1] ?? xy[i]!;
      const c1x = x0 + (x - xp) / 6;
      const c1y = y0 + (y - yp) / 6;
      const c2x = x - (xn - x0) / 6;
      const c2y = y - (yn - y0) / 6;
      return `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const up = q.change >= 0;
  const stroke = color;
  const active = hover ?? pts.length - 1;
  const id = `oilFill-${q.symbol.replace(/\W/g, "")}`;
  const glowId = `${id}-glow`;
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const compact = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: n >= 1000 ? 0 : 1 });
  const cur = q.unit === "index" ? "" : "$";
  const first = pts[0]!.c;
  const last = pts[pts.length - 1]!.c;
  const periodPct = first ? ((last - first) / first) * 100 : 0;
  const dateOf = (t: number) =>
    new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const yTicks = [0, 0.5, 1].map((t) => ({ v: lo + span * t, y: h - t * (h - 12) - 6 }));

  return (
    <div className="relative flex h-full flex-col">
      <div className="label-mono flex items-center justify-between text-muted-foreground">
        <span>30-day trend</span>
        <span
          className="font-mono font-semibold tabular-nums"
          style={{ color }}
        >
          {periodPct >= 0 ? "+" : ""}
          {periodPct.toFixed(2)}% 30D
        </span>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mt-1 min-h-[72px] flex-1 w-full overflow-visible"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const ratio = ((e.clientX - r.left) / r.width - padL / w) / (plotW / w);
          setHover(Math.max(0, Math.min(pts.length - 1, Math.round(ratio * (pts.length - 1)))));
        }}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.45" />
            <stop offset="55%" stopColor={stroke} stopOpacity="0.14" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {yTicks.map((t) => (
          <g key={t.v}>
            <line
              x1={padL}
              x2={w}
              y1={t.y}
              y2={t.y}
              stroke="var(--border)"
              strokeWidth="1"
              strokeDasharray="2 3"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={padL - 4}
              y={t.y + 3}
              textAnchor="end"
              className="fill-muted-foreground font-mono"
              style={{ fontSize: 7 }}
            >
              {compact(t.v)}
            </text>
          </g>
        ))}
        <path d={`${line} L${w},${h} L${padL},${h} Z`} fill={`url(#${id})`} />
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2.25"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          filter={`url(#${glowId})`}
          className="spark-draw"
        />
        <line
          x1={xy[active]![0]}
          x2={xy[active]![0]}
          y1="0"
          y2={h}
          stroke={stroke}
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.5"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={xy[active]![0]}
          cy={xy[active]![1]}
          r="7"
          fill={stroke}
          opacity="0.18"
        />
        <circle
          cx={xy[active]![0]}
          cy={xy[active]![1]}
          r="3.5"
          fill="var(--surface)"
          stroke={stroke}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="label-mono mt-1 flex justify-between px-0.5 text-muted-foreground">
        <span className="font-mono">{dateOf(pts[0]!.t)}</span>
        <span className="font-mono">{dateOf(pts[Math.floor(pts.length / 2)]!.t)}</span>
        <span className="font-mono">{dateOf(pts[pts.length - 1]!.t)}</span>
      </div>
      <div className="label-mono mt-0.5 flex justify-between text-[9px] text-muted-foreground">
        <span>Y axis: {q.unit === "index" ? "index level" : `price USD ${q.unit}`}</span>
        <span>X axis: date (last 30 days)</span>
      </div>
      <div className="label-mono mt-1.5 flex items-center justify-between gap-2 rounded-md border border-border/70 bg-surface-2/70 px-2 py-1 text-muted-foreground backdrop-blur-sm">
        <span>{hover === null ? "latest close" : dateOf(pts[active]!.t)}</span>
        <span className="font-mono font-semibold tabular-nums" style={{ color }}>
          {cur}
          {fmt(pts[active]!.c)}
        </span>
      </div>
      <dl className="mt-1.5 grid grid-cols-3 gap-1 text-center">
        {[
          ["30d high", hi],
          ["30d low", lo],
          ["prev close", q.prevClose],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-md border border-border/60 bg-surface-2/40 px-1 py-1">
            <dt className="label-mono text-muted-foreground">{k as string}</dt>
            <dd className="font-mono text-[11px] font-semibold tabular-nums text-foreground">
              {cur}
              {fmt(v as number)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function OilPricePanel() {
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["oil-prices"],
    queryFn: () => getOilPricesFn(),
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const quotes = data?.quotes ?? [];
  const stale = data?.stale ?? false;
  const asOf = data?.asOf ?? dataUpdatedAt;
  const stamp = asOf
    ? new Date(asOf).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      }) + " UTC"
    : "—";

  return (
    <div className="glass-panel rise flex h-full flex-col space-y-3 p-4">
      <header className="flex flex-wrap items-end justify-between gap-x-5 gap-y-2 border-b border-border/70 pb-2.5">
        <div className="min-w-0">
          <p className="label-mono text-muted-foreground">Benchmark markets</p>
          <h2 className="mt-0.5 font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
            Crude Oil, Equities &amp; Gold
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {[
              ["CL=F", "WTI crude"],
              ["^GSPC", "S&P 500"],
              ["GC=F", "Gold"],
            ].map(([sym, name]) => (
              <span
                key={sym}
                className="label-mono inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2/70 px-2 py-0.5 text-muted-foreground"
              >
                <span className="font-mono font-semibold text-foreground">{sym}</span>
                {name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          {stale ? (
            <span className="label-mono inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/70 px-2.5 py-1 text-muted-foreground">
              <span className="size-2 rounded-full bg-muted-foreground" />
              last close
            </span>
          ) : (
            <span className="label-mono inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-primary">
              <span className="pulse-dot size-2 rounded-full bg-primary" />
              live
            </span>
          )}
          <span className="label-mono text-muted-foreground">
            {stale ? "as of" : "updated"}{" "}
            <span className="font-mono tabular-nums text-foreground">{stamp}</span>
          </span>
        </div>
      </header>

      {isLoading && quotes.length === 0 && (
        <div className="scanning-bar h-24 flex-1 rounded-[var(--radius)]" />
      )}
      {!isLoading && quotes.length === 0 && (
        <p className="text-sm text-muted-foreground">Price feed unavailable right now.</p>
      )}

      <div className="grid min-h-0 flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {quotes.map((q) => {
          const up = q.change >= 0;
          const color = assetColor(q.symbol);
          return (
            <div
              key={q.symbol}
              className="flex flex-col space-y-1 rounded-[var(--radius)] border border-border bg-surface-2/60 p-3 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                boxShadow: `inset 0 2px 0 0 ${color}`,
                borderColor: `${color}40`,
              }}
            >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold">{q.label}</span>
              <span
                className="label-mono inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                style={{ backgroundColor: `${color}14`, color }}
              >
                {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {up ? "+" : ""}
                {q.changePct.toFixed(2)}%
              </span>
            </div>
            <div className="font-display text-lg font-bold tabular-nums" style={{ color }}>
              {q.unit === "index" ? "" : "$"}
              {q.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="ml-1 font-mono text-xs font-normal text-muted-foreground">
                {q.unit}
              </span>
            </div>
            <div className="label-mono text-muted-foreground">
              1D change{" "}
              <span className="font-mono font-semibold tabular-nums" style={{ color }}>
                {up ? "+" : ""}
                {q.change.toFixed(2)}
              </span>{" "}
              · <span className="font-mono tabular-nums">{q.symbol}</span>
            </div>
            <div className="min-h-0 flex-1">
              <Chart q={q} color={color} />
            </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
