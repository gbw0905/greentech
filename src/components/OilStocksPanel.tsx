import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, TrendingDown, TrendingUp } from "lucide-react";
import { getOilStocksFn, type OilQuote } from "@/lib/oil.functions";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

const fmt = (n: number, d = 2) =>
  n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

function MultiLineChart({ quotes, hover, setHover }: { quotes: OilQuote[]; hover: string | null; setHover: (s: string | null) => void }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Build normalized series: each line starts at 0% on its first day
  const normalized = quotes.map((q, idx) => {
    const base = q.series[0]?.c ?? q.price;
    const pts = q.series.map((p) => ({ t: p.t, pct: base ? ((p.c - base) / base) * 100 : 0 }));
    return { ...q, color: COLORS[idx % COLORS.length]!, pts };
  });

  const allPct = normalized.flatMap((n) => n.pts.map((p) => p.pct));
  const lo = Math.min(0, ...allPct);
  const hi = Math.max(0, ...allPct);
  const span = hi - lo || 1;

  const w = 320;
  const h = 140;
  const padLeft = 36;
  const padRight = 12;
  const padTop = 8;
  const padBottom = 24;
  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBottom;

  const xFor = (i: number, len: number) => padLeft + (len <= 1 ? 0 : (i / (len - 1)) * chartW);
  const yFor = (pct: number) => padTop + chartH - ((pct - lo) / span) * chartH;

  const maxLen = Math.max(1, ...normalized.map((n) => n.pts.length));
  const activeIdx = hoverIdx ?? maxLen - 1;

  const yTicks = 5;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full overflow-visible" style={{ minHeight: 240 }}>
        {/* Gridlines */}
        {Array.from({ length: yTicks }).map((_, i) => {
          const t = i / (yTicks - 1);
          const y = padTop + t * chartH;
          return (
            <line
              key={i}
              x1={padLeft}
              x2={w - padRight}
              y1={y}
              y2={y}
              stroke="var(--border)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {/* Y-axis labels */}
        {Array.from({ length: yTicks }).map((_, i) => {
          const t = i / (yTicks - 1);
          const pct = lo + (1 - t) * span;
          return (
            <text
              key={i}
              x={padLeft - 6}
              y={padTop + t * chartH + 3}
              textAnchor="end"
              className="font-mono text-[8px] fill-muted-foreground tabular-nums"
            >
              {pct >= 0 ? "+" : ""}
              {pct.toFixed(0)}%
            </text>
          );
        })}

        {/* X-axis labels */}
        {[0, Math.floor((maxLen - 1) / 2), maxLen - 1].map((i, k) => {
          const x = xFor(i, maxLen);
          return (
            <text
              key={k}
              x={x}
              y={h - 6}
              textAnchor={k === 0 ? "start" : k === 2 ? "end" : "middle"}
              className="font-mono text-[8px] fill-muted-foreground"
            >
              {new Date(normalized[0]?.pts[i]?.t ?? Date.now()).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </text>
          );
        })}

        {/* Hover guideline */}
        {hoverIdx !== null && (
          <line
            x1={xFor(activeIdx, maxLen)}
            x2={xFor(activeIdx, maxLen)}
            y1={padTop}
            y2={padTop + chartH}
            stroke="var(--muted-foreground)"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.5"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Lines */}
        {normalized.map((n) => {
          const active = hover === n.symbol || hover === null;
          const path = n.pts
            .map((p, i) => `${i === 0 ? "M" : "L"}${xFor(i, n.pts.length).toFixed(2)},${yFor(p.pct).toFixed(2)}`)
            .join(" ");
          return (
            <path
              key={n.symbol}
              d={path}
              fill="none"
              stroke={n.color}
              strokeWidth={active ? 2.2 : 1.2}
              opacity={active ? 1 : 0.25}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {/* Invisible hover overlay */}
        <rect
          x={padLeft}
          y={padTop}
          width={chartW}
          height={chartH}
          fill="transparent"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - r.left) / r.width;
            setHoverIdx(Math.max(0, Math.min(maxLen - 1, Math.round(ratio * (maxLen - 1)))));
          }}
          onMouseLeave={() => setHoverIdx(null)}
        />
      </svg>

      {/* Hover tooltip */}
      {hoverIdx !== null && (
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 w-max max-w-[260px] -translate-x-1/2 rounded-md border border-border bg-surface-2 px-3 py-2 shadow-lg">
          <div className="label-mono mb-1 text-muted-foreground">
            {new Date(normalized[0]?.pts[activeIdx]?.t ?? Date.now()).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </div>
          <ul className="space-y-1">
            {normalized
              .filter((n) => hover === null || hover === n.symbol)
              .map((n) => {
                const pct = n.pts[activeIdx]?.pct ?? 0;
                const up = pct >= 0;
                return (
                  <li key={n.symbol} className="flex items-center justify-between gap-4 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block size-2 rounded-full" style={{ background: n.color }} />
                      <span className="font-semibold">{n.symbol}</span>
                      <span className="truncate text-muted-foreground max-w-[90px]">{n.label}</span>
                    </span>
                    <span className={`font-mono tabular-nums ${up ? "text-signal" : "text-destructive"}`}>
                      {up ? "+" : ""}
                      {pct.toFixed(1)}%
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      {/* Selected-day legend */}
      <div className="label-mono mt-1 flex items-center justify-between gap-2 rounded-md border border-border bg-surface-2 px-2 py-1 text-muted-foreground">
        <span>{hoverIdx === null ? "latest close" : "hover date"}</span>
        <span className="font-mono tabular-nums text-foreground">
          {new Date(normalized[0]?.pts[activeIdx]?.t ?? Date.now()).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}

export function OilStocksPanel() {
  const [hover, setHover] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["oil-stocks"],
    queryFn: () => getOilStocksFn(),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  });

  const quotes: OilQuote[] = data?.quotes ?? [];

  return (
    <div className="glass-panel rise p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
            <Building2 className="size-4 text-primary" />
            Top oil companies · 30-day price trend
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Relative price movement of the largest NYSE-listed oil &amp; gas majors, rebased to zero
            at the start of the window. Hover the chart to compare exact daily moves.
          </p>
        </div>
        <span className="label-mono rounded-full border border-border bg-surface-2 px-2.5 py-1 text-muted-foreground">
          {isLoading ? "Loading…" : "Live · USD / share"}
        </span>
      </div>

      {quotes.length === 0 && !isLoading ? (
        <p className="text-sm text-muted-foreground">Market data is unavailable right now.</p>
      ) : (
        <>
          <div className="min-h-0">
            <MultiLineChart quotes={quotes} hover={hover} setHover={setHover} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            {quotes.map((q, idx) => {
              const up = q.changePct >= 0;
              const color = COLORS[idx % COLORS.length]!;
              const active = hover === q.symbol;
              return (
                <button
                  key={q.symbol}
                  type="button"
                  onMouseEnter={() => setHover(q.symbol)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setHover(active ? null : q.symbol)}
                  className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] transition-all ${
                    active
                      ? "border-border bg-surface-2"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                >
                  <span className="inline-block size-2.5 rounded-full" style={{ background: color }} />
                  <span className="font-semibold">{q.symbol}</span>
                  <span className="hidden truncate text-muted-foreground sm:inline max-w-[110px]">{q.label}</span>
                  <span className={`font-mono tabular-nums ${up ? "text-signal" : "text-destructive"}`}>
                    {up ? <TrendingUp className="inline size-2.5" /> : <TrendingDown className="inline size-2.5" />}
                    {up ? "+" : ""}
                    {q.changePct.toFixed(1)}%
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
        Trends are rebased to show relative performance, not absolute share price. Positive lines
        outperformed the start of the window; negative lines fell. Quotes refresh every 5 minutes.
      </p>
    </div>
  );
}
