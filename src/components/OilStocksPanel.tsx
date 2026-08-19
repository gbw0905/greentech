import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Building2, TrendingDown, TrendingUp } from "lucide-react";
import { getOilStocksFn, type OilQuote } from "@/lib/oil.functions";
import { openEntityNews, type NewsTarget } from "@/lib/open-news";

const fmt = (n: number, d = 2) =>
  n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

/**
 * Approximate annual output capacity, million barrels of oil equivalent per year
 * (upstream production, or crude throughput for refiners). Company reports / EIA.
 */
const CAPACITY: Record<string, { mmboe: number; kind: string }> = {
  "2222.SR": { mmboe: 4745, kind: "Upstream production" },
  XOM: { mmboe: 1570, kind: "Upstream production" },
  CVX: { mmboe: 1205, kind: "Upstream production" },
  SHEL: { mmboe: 1022, kind: "Upstream production" },
  TTE: { mmboe: 913, kind: "Upstream production" },
  BP: { mmboe: 840, kind: "Upstream production" },
  "0857.HK": { mmboe: 1690, kind: "Upstream production" },
  "0386.HK": { mmboe: 1650, kind: "Refining throughput" },
  "0883.HK": { mmboe: 700, kind: "Upstream production" },
  COP: { mmboe: 694, kind: "Upstream production" },
  PSX: { mmboe: 657, kind: "Refining throughput" },
  MPC: { mmboe: 1095, kind: "Refining throughput" },
  OXY: { mmboe: 438, kind: "Upstream production" },
  PBR: { mmboe: 986, kind: "Upstream production" },
  E: { mmboe: 621, kind: "Upstream production" },
  EQNR: { mmboe: 730, kind: "Upstream production" },
  "RELIANCE.NS": { mmboe: 511, kind: "Refining throughput" },
  "ONGC.NS": { mmboe: 168, kind: "Upstream production" },
  SU: { mmboe: 292, kind: "Upstream production" },
  CNQ: { mmboe: 493, kind: "Upstream production" },
};

const capOf = (symbol: string) => CAPACITY[symbol] ?? { mmboe: 0, kind: "Not disclosed" };

type StockMetric = "price" | "change" | "capacity";

const STOCK_METRICS: Record<
  StockMetric,
  {
    label: string;
    axis: string;
    badge: string;
    value: (q: OilQuote) => number;
    format: (n: number) => string;
    tick: (n: number) => string;
  }
> = {
  price: {
    label: "Share price (listing currency)",
    axis: "X AXIS · SHARE PRICE (PRIMARY LISTING CURRENCY)",
    badge: "price / share",
    value: (q) => q.price,
    format: (n) => fmt(n),
    tick: (n) => fmt(Math.round(n), 0),
  },
  change: {
    label: "1-day change (%)",
    axis: "X AXIS · ABSOLUTE 1-DAY CHANGE (%)",
    badge: "% change · 1 day",
    value: (q) => Math.abs(q.changePct),
    format: (n) => `${fmt(n, 2)}%`,
    tick: (n) => `${n.toFixed(1)}%`,
  },
  capacity: {
    label: "Annual capacity (MMboe/yr)",
    axis: "X AXIS · ANNUAL OUTPUT CAPACITY (MMboe / YEAR)",
    badge: "MMboe / year",
    value: (q) => capOf(q.symbol).mmboe,
    format: (n) => (n > 0 ? fmt(n, 0) : "—"),
    tick: (n) => fmt(Math.round(n), 0),
  },
};

function BarChart({
  quotes,
  hover,
  setHover,
  onSelect,
  metricKey,
}: {
  quotes: OilQuote[];
  hover: string | null;
  setHover: (s: string | null) => void;
  onSelect: (t: NewsTarget) => void;
  metricKey: StockMetric;
}) {
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);
  const metric = STOCK_METRICS[metricKey];

  const sorted = [...quotes].sort((a, b) => metric.value(b) - metric.value(a));
  const maxValue = Math.max(...sorted.map((q) => metric.value(q)), 1);
  const step = metricKey === "price" ? 25 : metricKey === "capacity" ? 250 : 1;
  const niceMax = Math.max(Math.ceil(maxValue / step) * step, step);

  // Layout — horizontal bars
  const rowH = 42;
  const gap = 12;
  const rankW = 32;
  const labelW = 230; // rank + ticker + company
  const valueW = 256; // capacity + price + change badge
  const w = 860;
  const padTop = 34;
  const padBottom = 56;
  const chartW = w - labelW - valueW;
  const h = padTop + sorted.length * (rowH + gap) - gap + padBottom;

  const activeQuote = sorted.find((q) => q.symbol === (hoveredSymbol ?? hover)) ?? null;
  const anyActive = hover !== null || hoveredSymbol !== null;

  const xFor = (value: number) => (value / niceMax) * chartW;
  const yFor = (idx: number) => padTop + idx * (rowH + gap);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full overflow-visible">
        <defs>
          <linearGradient id="bar-fill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.95" />
            <stop offset="60%" stopColor="var(--primary-glow)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="bar-fill-active" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="1" />
            <stop offset="60%" stopColor="var(--primary-glow)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="bar-gloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <filter id="bar-glow" x="-15%" y="-60%" width="130%" height="220%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
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
                className="chart-axis fill-muted-foreground"
              >
                {metric.tick(t * niceMax)}
              </text>
            </g>
          );
        })}

        {/* Column headers */}
        <text
          x={0}
          y={padTop - 16}
          className="font-sans text-[0.6875rem] font-semibold tracking-[0.12em] fill-muted-foreground"
        >
          Y AXIS · RANK &amp; COMPANY
        </text>
        <text
          x={w - 176}
          y={padTop - 16}
          textAnchor="end"
          className="font-sans text-[0.6875rem] font-semibold tracking-[0.12em] fill-muted-foreground"
        >
          CAPACITY (MMboe/yr)
        </text>
        <text
          x={w}
          y={padTop - 16}
          textAnchor="end"
          className="font-sans text-[0.6875rem] font-semibold tracking-[0.12em] fill-muted-foreground"
        >
          PRICE · 1D
        </text>
        {/* X-axis title */}
        <text
          x={labelW + chartW / 2}
          y={h - 4}
          textAnchor="middle"
          className="font-sans text-[0.6875rem] font-semibold tracking-[0.1em] fill-muted-foreground"
        >
          {metric.axis}
        </text>

        {/* Bars */}
        {sorted.map((q, idx) => {
          const active = hover === q.symbol || hoveredSymbol === q.symbol;
          const y = yFor(idx);
          const bw = xFor(metric.value(q));
          const up = q.changePct >= 0;
          const dim = anyActive && !active;
          const trackW = chartW;

          return (
            <g
              key={q.symbol}
              onClick={() =>
                onSelect({
                  name: q.label,
                  query: `${q.label} energy OR biofuel OR renewable`,
                })
              }
              onMouseEnter={() => setHoveredSymbol(q.symbol)}
              onMouseLeave={() => setHoveredSymbol(null)}
              className="cursor-pointer"
              style={{ transition: "opacity 0.2s ease" }}
              opacity={dim ? 0.4 : 1}
            >
              {/* Row zebra + hover background */}
              <rect
                x={0}
                y={y - 2}
                width={w}
                height={rowH + 4}
                rx={6}
                fill="var(--foreground)"
                opacity={active ? 0.06 : idx % 2 === 0 ? 0.02 : 0}
                className="transition-opacity duration-200"
              />
              {/* Track */}
              <rect
                x={labelW}
                y={y + 6}
                width={trackW}
                height={rowH - 12}
                rx={(rowH - 12) / 2}
                fill="var(--surface-1)"
                opacity={0.6}
              />
              {/* Filled bar */}
              <rect
                x={labelW}
                y={y + 6}
                width={bw}
                height={rowH - 12}
                rx={(rowH - 12) / 2}
                fill={active ? "url(#bar-fill-active)" : "url(#bar-fill)"}
                
                className="transition-all duration-300"
              />
              {/* Gloss highlight */}
              <rect
                x={labelW}
                y={y + 6}
                width={bw}
                height={(rowH - 12) / 2}
                rx={(rowH - 12) / 4}
                fill="url(#bar-gloss)"
                pointerEvents="none"
              />
              {/* Leading cap */}
              {bw > 6 && (
                <circle
                  cx={labelW + bw - (rowH - 12) / 2}
                  cy={y + rowH / 2}
                  r={active ? 3 : 2}
                  fill="var(--primary-foreground)"
                  opacity={active ? 0.9 : 0.45}
                  className="transition-all duration-300"
                />
              )}
              {/* Rank */}
              <text
                x={rankW - 10}
                y={y + rowH / 2 + 1}
                textAnchor="end"
                className="font-sans text-[0.6875rem] font-semibold tabular-nums fill-muted-foreground"
              >
                {String(idx + 1).padStart(2, "0")}
              </text>
              {/* Ticker */}
              <text
                x={rankW}
                y={y + rowH / 2 + 1}
                className="font-sans text-[0.75rem] font-bold tabular-nums tracking-tight fill-foreground"
              >
                {q.symbol}
              </text>
              {/* Company */}
              <text
                x={rankW + 56}
                y={y + rowH / 2 + 1}
                className="font-sans text-[0.75rem] font-medium fill-muted-foreground"
              >
                {q.label.length > 20 ? `${q.label.slice(0, 20)}…` : q.label}
              </text>
              {/* Price */}
              <text
                x={w - 92}
                y={y + rowH / 2 + 1}
                textAnchor="end"
                className="font-mono text-[0.75rem] font-semibold tabular-nums fill-foreground"
              >
                ${fmt(q.price)}
              </text>
              {/* Annual production / throughput capacity */}
              <text
                x={w - 176}
                y={y + rowH / 2 + 1}
                textAnchor="end"
                className="font-mono text-[0.75rem] font-semibold tabular-nums fill-muted-foreground"
              >
                {capOf(q.symbol).mmboe > 0 ? fmt(capOf(q.symbol).mmboe, 0) : "—"}
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
                  className="chart-axis font-bold"
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
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {activeQuote && (
        <div className="chart-tip pointer-events-none absolute left-1/2 top-0 z-20 w-max max-w-[300px] -translate-x-1/2 rounded-xl px-4 py-3">
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
            <span className="text-muted-foreground">Capacity</span>
            <span className="font-mono text-right font-semibold text-foreground">
              {capOf(activeQuote.symbol).mmboe > 0
                ? `${fmt(capOf(activeQuote.symbol).mmboe, 0)} MMboe/yr`
                : "n/a"}
            </span>
          </div>
          <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
            {capOf(activeQuote.symbol).kind}
          </p>
        </div>
      )}
    </div>
  );
}

export function OilStocksPanel() {
  const [hover, setHover] = useState<string | null>(null);
  const [metricKey, setMetricKey] = useState<StockMetric>("price");
  const { data, isLoading } = useQuery({
    queryKey: ["oil-stocks"],
    queryFn: () => getOilStocksFn(),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
    gcTime: Infinity,
  });

  const quotes: OilQuote[] = data?.quotes ?? [];
  const stale = data?.stale ?? false;

  return (
    <div className="glass-panel rise flex h-full flex-col p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="max-w-2xl">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
            <Building2 className="size-5 text-primary" />
            Top global oil companies
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            The world's twenty largest oil &amp; gas companies — national and international majors
            across the US, Europe, the Middle East, Asia and Latin America — with live share
            prices from their primary listing and annual output capacity. Hover any row for
            price, daily change and capacity.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <label className="flex items-center gap-2">
            <span className="label-mono text-muted-foreground">Measure</span>
            <select
              className="chart-select"
              value={metricKey}
              onChange={(e) => setMetricKey(e.target.value as StockMetric)}
              aria-label="Choose the value shown in the chart"
            >
              {(Object.keys(STOCK_METRICS) as StockMetric[]).map((m) => (
                <option key={m} value={m}>
                  {STOCK_METRICS[m].label}
                </option>
              ))}
            </select>
          </label>
          <span className="label-mono text-muted-foreground">
            {isLoading ? "Loading…" : stale ? "Last close" : "Live"} · {STOCK_METRICS[metricKey].badge}
          </span>
        </div>
      </div>

      {quotes.length === 0 && !isLoading ? (
        <p className="text-sm text-muted-foreground">Market data is unavailable right now.</p>
      ) : (
        <div className="min-h-0 flex-1">
          <BarChart
            quotes={quotes}
            hover={hover}
            setHover={setHover}
            onSelect={openEntityNews}
            metricKey={metricKey}
          />
        </div>
      )}

      <div className="mt-4 space-y-2 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">
          X axis: share price in USD per share (bar length). Y axis: company, ranked by share price.
          Capacity column: approximate annual output in million barrels of oil equivalent per year
          (upstream production, or crude throughput for refiners; services firms show "—"). Prices
          refresh every 5 minutes. Click any company to read its latest global news.
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
