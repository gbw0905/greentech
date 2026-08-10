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

function ColumnChart({ quotes, hover, setHover }: { quotes: OilQuote[]; hover: string | null; setHover: (s: string | null) => void }) {
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);

  const sorted = [...quotes].sort((a, b) => b.price - a.price);
  const maxPrice = Math.max(...sorted.map((q) => q.price), 1);
  const niceMax = Math.ceil(maxPrice / 50) * 50;

  const w = 640;
  const h = 360;
  const padLeft = 62;
  const padRight = 18;
  const padTop = 34;
  const padBottom = 64;
  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBottom;

  const barCount = sorted.length;
  const gap = 10;
  const barW = (chartW - gap * (barCount - 1)) / barCount;
  const yFor = (price: number) => padTop + chartH - (price / niceMax) * chartH;

  const yTicks = 5;
  const activeQuote = sorted.find((q) => q.symbol === (hoveredSymbol ?? hover)) ?? null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full overflow-visible" style={{ minHeight: 360 }}>
        <defs>
          {sorted.map((q, idx) => {
            const color = COLORS[idx % COLORS.length]!;
            return (
              <linearGradient key={q.symbol} id={`bar-${q.symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="1" />
                <stop offset="100%" stopColor={color} stopOpacity="0.45" />
              </linearGradient>
            );
          })}
        </defs>
        {/* Gridlines */}
        {Array.from({ length: yTicks }).map((_, i) => {
          const t = i / (yTicks - 1);
          const y = padTop + (1 - t) * chartH;
          return (
            <line
              key={i}
              x1={padLeft}
              x2={w - padRight}
              y1={y}
              y2={y}
              stroke="var(--border)"
              strokeWidth="1"
              strokeDasharray={i === 0 ? undefined : "3 5"}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {/* Y-axis labels */}
        {Array.from({ length: yTicks }).map((_, i) => {
          const t = i / (yTicks - 1);
          const price = t * niceMax;
          return (
            <text
              key={i}
              x={padLeft - 8}
              y={padTop + (1 - t) * chartH + 4}
              textAnchor="end"
              className="font-mono text-[11px] fill-muted-foreground tabular-nums"
            >
              ${price.toFixed(0)}
            </text>
          );
        })}

        {/* Y-axis title */}
        <text
          x={padLeft - 8}
          y={padTop - 14}
          textAnchor="end"
          className="font-mono text-[11px] fill-muted-foreground font-semibold"
        >
          USD / share
        </text>

        {/* Bars */}
        {sorted.map((q, idx) => {
          const color = COLORS[idx % COLORS.length]!;
          const active = hover === q.symbol || hoveredSymbol === q.symbol;
          const x = padLeft + idx * (barW + gap);
          const y = yFor(q.price);
          const up = q.changePct >= 0;
          return (
            <g
              key={q.symbol}
              onMouseEnter={() => setHoveredSymbol(q.symbol)}
              onMouseLeave={() => setHoveredSymbol(null)}
              onClick={() => setHover(active ? null : q.symbol)}
              className="cursor-pointer"
            >
              <rect
                x={x}
                y={y}
                width={barW}
                height={padTop + chartH - y}
                rx={6}
                fill={`url(#bar-${q.symbol})`}
                stroke={color}
                strokeWidth={active ? 1.5 : 0}
                opacity={active ? 1 : hover === null ? 0.92 : 0.32}
                className="transition-all duration-200"
                style={active ? { filter: `drop-shadow(0 0 10px ${color})` } : undefined}
              />
              <rect
                x={x}
                y={y}
                width={barW}
                height={4}
                rx={2}
                fill={color}
                opacity={active ? 1 : hover === null ? 1 : 0.35}
              />
              {/* Price label on top of bar */}
              <text
                x={x + barW / 2}
                y={y - 10}
                textAnchor="middle"
                className="font-mono text-[11px] fill-foreground font-bold tabular-nums"
                opacity={active ? 1 : 0.85}
              >
                ${fmt(q.price)}
              </text>
              {/* Symbol label below X-axis */}
              <text
                x={x + barW / 2}
                y={h - padBottom + 18}
                textAnchor="middle"
                className="font-mono text-[12px] fill-foreground font-bold"
              >
                {q.symbol}
              </text>
              {/* Company name below symbol */}
              <text
                x={x + barW / 2}
                y={h - padBottom + 35}
                textAnchor="middle"
                className="text-[10px] fill-muted-foreground"
                style={{ fontFamily: "Calibri, sans-serif" }}
              >
                {q.label.length > 12 ? `${q.label.slice(0, 12)}…` : q.label}
              </text>
              {/* Change badge inside bar if tall enough */}
              {padTop + chartH - y > 44 && (
                <text
                  x={x + barW / 2}
                  y={padTop + chartH - 12}
                  textAnchor="middle"
                  className={`font-mono text-[11px] font-bold tabular-nums ${up ? "fill-emerald-950" : "fill-red-950"}`}
                >
                  {up ? "+" : ""}
                  {q.changePct.toFixed(1)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {activeQuote && (
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 w-max max-w-[280px] -translate-x-1/2 rounded-md border border-border bg-surface-2 px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-bold text-foreground">{activeQuote.symbol}</span>
            <span className="text-xs text-muted-foreground">{activeQuote.label}</span>
          </div>
          <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-muted-foreground">Price</span>
            <span className="font-mono text-right font-semibold text-foreground">${fmt(activeQuote.price)}</span>
            <span className="text-muted-foreground">Change</span>
            <span className={`font-mono text-right font-semibold ${activeQuote.changePct >= 0 ? "text-signal" : "text-destructive"}`}>
              {activeQuote.changePct >= 0 ? "+" : ""}
              {fmt(activeQuote.changePct, 2)}%
            </span>
            <span className="text-muted-foreground">Prev close</span>
            <span className="font-mono text-right font-semibold text-foreground">${fmt(activeQuote.prevClose)}</span>
          </div>
        </div>
      )}
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
            Top 10 oil companies by NYSE stock price
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Live share price of the largest NYSE-listed oil &amp; gas majors. Hover any column to see the exact price, daily change, and previous close.
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
            <ColumnChart quotes={quotes} hover={hover} setHover={setHover} />
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
        Prices are quoted in USD per share and refresh every 5 minutes. The column height shows the current price level; percentages reflect the latest session change.
      </p>
    </div>
  );
}
