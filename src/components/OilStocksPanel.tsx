import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, TrendingDown, TrendingUp } from "lucide-react";
import { getOilStocksFn, type OilQuote } from "@/lib/oil.functions";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
  "var(--chart-9)",
  "var(--chart-10)",
];

const fmt = (n: number, d = 2) =>
  n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

function CylinderChart({ quotes, hover, setHover }: { quotes: OilQuote[]; hover: string | null; setHover: (s: string | null) => void }) {
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);

  const sorted = [...quotes].sort((a, b) => b.price - a.price);
  const maxPrice = Math.max(...sorted.map((q) => q.price), 1);
  const niceMax = Math.ceil(maxPrice / 50) * 50;

  const w = 720;
  const h = 420;
  const padLeft = 72;
  const padRight = 24;
  const padTop = 42;
  const padBottom = 88;
  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBottom;

  const barCount = sorted.length;
  const gap = 12;
  const barW = (chartW - gap * (barCount - 1)) / barCount;
  const yFor = (price: number) => padTop + chartH - (price / niceMax) * chartH;
  const yTicks = 5;

  const activeQuote = sorted.find((q) => q.symbol === (hoveredSymbol ?? hover)) ?? null;
  const anyActive = hover !== null || hoveredSymbol !== null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full overflow-visible" style={{ minHeight: 420 }}>
        <defs>
          {sorted.map((q, idx) => {
            const color = CHART_COLORS[idx % CHART_COLORS.length]!;
            return (
              <linearGradient key={q.symbol} id={`bar-${q.symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="1" />
                <stop offset="60%" stopColor={color} stopOpacity="0.75" />
                <stop offset="100%" stopColor={color} stopOpacity="0.35" />
              </linearGradient>
            );
          })}
          <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Subtle chart background */}
        <rect
          x={padLeft}
          y={padTop}
          width={chartW}
          height={chartH}
          rx={12}
          fill="var(--surface-1)"
          opacity={0.4}
        />

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
              strokeDasharray={i === 0 ? undefined : "4 6"}
              opacity={0.5}
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
              x={padLeft - 12}
              y={padTop + (1 - t) * chartH + 4}
              textAnchor="end"
              className="font-mono text-xs fill-muted-foreground tabular-nums"
            >
              ${price.toFixed(0)}
            </text>
          );
        })}

        {/* Y-axis title */}
        <text
          x={padLeft - 12}
          y={padTop - 18}
          textAnchor="end"
          className="font-semibold text-xs fill-muted-foreground"
        >
          USD / share
        </text>

        {/* Bars as 3D cylinders */}
        {sorted.map((q, idx) => {
          const color = CHART_COLORS[idx % CHART_COLORS.length]!;
          const active = hover === q.symbol || hoveredSymbol === q.symbol;
          const x = padLeft + idx * (barW + gap);
          const y = yFor(q.price);
          const up = q.changePct >= 0;
          const barHeight = padTop + chartH - y;
          const rx = barW / 2;
          const opacity = anyActive ? (active ? 1 : 0.35) : 0.95;

          return (
            <g
              key={q.symbol}
              onMouseEnter={() => setHoveredSymbol(q.symbol)}
              onMouseLeave={() => setHoveredSymbol(null)}
              onClick={() => setHover(active ? null : q.symbol)}
              className="cursor-pointer"
              style={{ transition: "opacity 0.2s ease" }}
            >
              {/* Cylinder body */}
              <rect
                x={x}
                y={y}
                width={barW}
                height={barHeight}
                rx={rx}
                fill={`url(#bar-${q.symbol})`}
                stroke={color}
                strokeWidth={active ? 2 : 0}
                opacity={opacity}
                className="transition-all duration-300"
                style={active ? { filter: "url(#neon-glow)" } : undefined}
              />
              {/* Cylinder top cap */}
              <ellipse
                cx={x + barW / 2}
                cy={y}
                rx={rx}
                ry={rx * 0.35}
                fill={hexToRgba(color, 0.9)}
                stroke={color}
                strokeWidth={active ? 2 : 0}
                opacity={opacity}
                className="transition-all duration-300"
              />
              {/* Cylinder bottom cap */}
              <ellipse
                cx={x + barW / 2}
                cy={padTop + chartH}
                rx={rx}
                ry={rx * 0.35}
                fill={hexToRgba(color, 0.3)}
                opacity={opacity}
                className="transition-all duration-300"
              />
              {/* Price label on top of bar */}
              <text
                x={x + barW / 2}
                y={y - 14}
                textAnchor="middle"
                className="font-mono text-sm font-bold fill-foreground tabular-nums"
                opacity={active ? 1 : 0.9}
              >
                ${fmt(q.price)}
              </text>
              {/* Symbol label below X-axis */}
              <text
                x={x + barW / 2}
                y={h - padBottom + 22}
                textAnchor="middle"
                className="font-mono text-sm font-bold fill-foreground"
              >
                {q.symbol}
              </text>
              {/* Company name below symbol */}
              <text
                x={x + barW / 2}
                y={h - padBottom + 42}
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
                style={{ fontFamily: "Calibri, sans-serif" }}
              >
                {q.label.length > 14 ? `${q.label.slice(0, 14)}…` : q.label}
              </text>
              {/* Change badge inside bar if tall enough */}
              {barHeight > 56 && (
                <g>
                  <rect
                    x={x + 4}
                    y={padTop + chartH - 28}
                    width={barW - 8}
                    height={20}
                    rx={10}
                    fill={up ? "var(--signal)" : "var(--destructive)"}
                    opacity={active ? 0.95 : 0.75}
                  />
                  <text
                    x={x + barW / 2}
                    y={padTop + chartH - 14}
                    textAnchor="middle"
                    className="font-mono text-[11px] font-bold tabular-nums"
                    fill={up ? "var(--signal-foreground)" : "var(--destructive-foreground)"}
                  >
                    {up ? "+" : ""}
                    {q.changePct.toFixed(1)}%
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {activeQuote && (
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 w-max max-w-[300px] -translate-x-1/2 rounded-xl border border-border bg-surface-2 px-4 py-3 shadow-xl">
          <div className="flex items-center gap-2 border-b border-border pb-2 mb-2">
            <span className="font-display text-base font-bold text-foreground">{activeQuote.symbol}</span>
            <span className="text-sm text-muted-foreground">{activeQuote.label}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 text-sm">
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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="max-w-2xl">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
            <Building2 className="size-5 text-primary" />
            Top 10 oil companies by NYSE stock price
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Live share price of the largest NYSE-listed oil &amp; gas majors. Hover any column to see the exact price, daily change, and previous close.
          </p>
        </div>
        <span className="label-mono rounded-full border border-border bg-surface-2 px-3 py-1.5 text-sm text-muted-foreground">
          {isLoading ? "Loading…" : "Live · USD / share"}
        </span>
      </div>

      {quotes.length === 0 && !isLoading ? (
        <p className="text-sm text-muted-foreground">Market data is unavailable right now.</p>
      ) : (
        <>
          <div className="min-h-0">
            <CylinderChart quotes={quotes} hover={hover} setHover={setHover} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
            {quotes.map((q, idx) => {
              const up = q.changePct >= 0;
              const color = CHART_COLORS[idx % CHART_COLORS.length]!;
              const active = hover === q.symbol;
              return (
                <button
                  key={q.symbol}
                  type="button"
                  onMouseEnter={() => setHover(q.symbol)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setHover(active ? null : q.symbol)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm transition-all ${
                    active
                      ? "border-border bg-surface-2 shadow-md"
                      : "border-transparent opacity-85 hover:opacity-100"
                  }`}
                >
                  <span className="inline-block size-3 rounded-full shadow-sm" style={{ background: color }} />
                  <span className="font-semibold">{q.symbol}</span>
                  <span className="hidden truncate text-muted-foreground sm:inline max-w-[140px]">{q.label}</span>
                  <span className={`font-mono tabular-nums ${up ? "text-signal" : "text-destructive"}`}>
                    {up ? <TrendingUp className="inline size-3.5" /> : <TrendingDown className="inline size-3.5" />}
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
