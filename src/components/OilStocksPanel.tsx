import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, TrendingDown, TrendingUp } from "lucide-react";
import { getOilStocksFn, type OilQuote } from "@/lib/oil.functions";

const fmt = (n: number, d = 2) =>
  n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

const newsUrl = (q: string) =>
  `https://news.google.com/search?q=${encodeURIComponent(`${q} biofuel OR renewable OR energy`)}`;

function BarChart({
  quotes,
  hover,
  setHover,
}: {
  quotes: OilQuote[];
  hover: string | null;
  setHover: (s: string | null) => void;
}) {
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);

  const sorted = [...quotes].sort((a, b) => b.price - a.price);
  const maxPrice = Math.max(...sorted.map((q) => q.price), 1);
  const niceMax = Math.ceil(maxPrice / 25) * 25;

  // Layout — horizontal bars
  const rowH = 30;
  const gap = 10;
  const rankW = 28;
  const labelW = 210; // rank + ticker + company
  const valueW = 168; // price + change badge
  const w = 860;
  const padTop = 30;
  const padBottom = 34;
  const chartW = w - labelW - valueW;
  const h = padTop + sorted.length * (rowH + gap) - gap + padBottom;

  const activeQuote = sorted.find((q) => q.symbol === (hoveredSymbol ?? hover)) ?? null;
  const anyActive = hover !== null || hoveredSymbol !== null;

  const xFor = (price: number) => (price / niceMax) * chartW;
  const yFor = (idx: number) => padTop + idx * (rowH + gap);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full overflow-visible" style={{ minHeight: h }}>
        <defs>
          <linearGradient id="bar-fill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="bar-fill-active" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.75" />
          </linearGradient>
        </defs>

        {/* X-axis gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const x = labelW + t * chartW;
          return (
            <g key={t}>
              <line
                x1={x}
                x2={x}
                y1={padTop - 8}
                y2={h - padBottom + 4}
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray={t === 0 ? undefined : "3 5"}
                opacity={t === 0 ? 0.9 : 0.35}
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={x}
                y={h - padBottom + 22}
                textAnchor="middle"
                className="font-mono text-[10px] fill-muted-foreground tabular-nums"
              >
                ${Math.round(t * niceMax)}
              </text>
            </g>
          );
        })}

        {/* Column headers */}
        <text x={0} y={padTop - 14} className="font-mono text-[9px] fill-muted-foreground tracking-[0.14em]">
          RANK · COMPANY
        </text>
        <text
          x={w}
          y={padTop - 14}
          textAnchor="end"
          className="font-mono text-[9px] fill-muted-foreground tracking-[0.14em]"
        >
          PRICE · 1D
        </text>

        {/* Bars */}
        {sorted.map((q, idx) => {
          const active = hover === q.symbol || hoveredSymbol === q.symbol;
          const y = yFor(idx);
          const bw = xFor(q.price);
          const up = q.changePct >= 0;
          const dim = anyActive && !active;
          const trackW = chartW;

          return (
            <a
              key={q.symbol}
              href={newsUrl(q.label)}
              target="_blank"
              rel="noopener noreferrer"
            >
            <g
              onMouseEnter={() => setHoveredSymbol(q.symbol)}
              onMouseLeave={() => setHoveredSymbol(null)}
              className="cursor-pointer"
              style={{ transition: "opacity 0.2s ease" }}
              opacity={dim ? 0.4 : 1}
            >
              {/* Row hover background */}
              <rect
                x={0}
                y={y - 2}
                width={w}
                height={rowH + 4}
                rx={6}
                fill="var(--foreground)"
                opacity={active ? 0.04 : 0}
                className="transition-opacity duration-200"
              />
              {/* Track */}
              <rect
                x={labelW}
                y={y + 8}
                width={trackW}
                height={rowH - 16}
                rx={3}
                fill="var(--surface-1)"
                opacity={0.5}
              />
              {/* Filled bar */}
              <rect
                x={labelW}
                y={y + 8}
                width={bw}
                height={rowH - 16}
                rx={3}
                fill={active ? "url(#bar-fill-active)" : "url(#bar-fill)"}
                className="transition-all duration-300"
              />
              {/* Rank */}
              <text
                x={rankW - 10}
                y={y + rowH / 2 + 1}
                textAnchor="end"
                className="font-mono text-[11px] fill-muted-foreground tabular-nums"
              >
                {String(idx + 1).padStart(2, "0")}
              </text>
              {/* Ticker */}
              <text
                x={rankW}
                y={y + rowH / 2 + 1}
                className="font-mono text-[12px] font-bold fill-foreground"
              >
                {q.symbol}
              </text>
              {/* Company */}
              <text
                x={rankW + 52}
                y={y + rowH / 2 + 1}
                className="text-[12px] fill-muted-foreground"
                style={{ fontFamily: "Calibri, sans-serif" }}
              >
                {q.label.length > 18 ? `${q.label.slice(0, 18)}…` : q.label}
              </text>
              {/* Price */}
              <text
                x={w - 92}
                y={y + rowH / 2 + 1}
                textAnchor="end"
                className="font-mono text-[12.5px] font-semibold fill-foreground tabular-nums"
              >
                ${fmt(q.price)}
              </text>
              {/* Change badge */}
              <g transform={`translate(${w}, ${y + rowH / 2 - 8})`}>
                <rect
                  x={-58}
                  y={0}
                  width={58}
                  height={16}
                  rx={3}
                  fill={up ? "var(--primary)" : "var(--destructive)"}
                  opacity={active ? 1 : 0.14}
                />
                <text
                  x={-29}
                  y={12}
                  textAnchor="middle"
                  className="font-mono text-[10px] font-bold tabular-nums"
                  fill={
                    active
                      ? "var(--primary-foreground)"
                      : up
                        ? "var(--primary)"
                        : "var(--destructive)"
                  }
                >
                  {up ? "▲ +" : "▼ "}
                  {q.changePct.toFixed(2)}%
                </text>
              </g>
            </g>
            </a>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {activeQuote && (
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 w-max max-w-[300px] -translate-x-1/2 rounded-xl border border-border bg-surface-2 px-4 py-3 shadow-xl">
          <div className="flex items-center gap-2 border-b border-border pb-2 mb-2">
            <span className="font-display text-base font-bold text-foreground">
              {activeQuote.symbol}
            </span>
            <span className="text-sm text-muted-foreground">{activeQuote.label}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 text-sm">
            <span className="text-muted-foreground">Price</span>
            <span className="font-mono text-right font-semibold text-foreground">
              ${fmt(activeQuote.price)}
            </span>
            <span className="text-muted-foreground">Change</span>
            <span
              className={`font-mono text-right font-semibold ${
                activeQuote.changePct >= 0 ? "text-primary" : "text-destructive"
              }`}
            >
              {activeQuote.changePct >= 0 ? "+" : ""}
              {fmt(activeQuote.changePct, 2)}%
            </span>
            <span className="text-muted-foreground">Prev close</span>
            <span className="font-mono text-right font-semibold text-foreground">
              ${fmt(activeQuote.prevClose)}
            </span>
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
    <div className="glass-panel rise flex h-full flex-col p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="max-w-2xl">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
            <Building2 className="size-5 text-primary" />
            Top 10 oil companies by NYSE stock price
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Live share price of the largest NYSE-listed oil & gas majors. Hover any row to see the
            exact price, daily change, and previous close.
          </p>
        </div>
        <span className="label-mono rounded-full border border-border bg-surface-2 px-3 py-1.5 text-sm text-muted-foreground">
          {isLoading ? "Loading…" : "Live · USD / share"}
        </span>
      </div>

      {quotes.length === 0 && !isLoading ? (
        <p className="text-sm text-muted-foreground">Market data is unavailable right now.</p>
      ) : (
        <div className="min-h-0 flex-1">
          <BarChart quotes={quotes} hover={hover} setHover={setHover} />
        </div>
      )}

      <div className="mt-4 space-y-2 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">
          Prices are quoted in USD per share and refresh every 5 minutes. Bar length shows the current
          price level; percentages reflect the latest session change. Click any company to open its
          latest news.
        </p>
        <div className="rounded-lg border border-border/60 bg-surface-2/50 p-2.5">
          <p className="text-xs font-semibold text-foreground">Note</p>
          <p className="text-xs text-muted-foreground">
            Oil majors influence biofuel economics through refining margins, renewable diesel capacity and
            feedstock demand. A rising oil price normally improves the relative competitiveness of ethanol,
            biodiesel and HVO.
          </p>
        </div>
      </div>
    </div>
  );
}
