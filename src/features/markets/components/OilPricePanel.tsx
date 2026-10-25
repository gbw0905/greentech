import { MARKET_BENCHMARKS as BENCHMARKS } from "@/features/markets/benchmarks";
import { MotionReveal } from "@/components/MotionReveal";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import {
  ChevronDown,
  Loader2,
  Minus,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  BIOFUEL_STOCKS,
  getBiofuelStocksFn,
  getMarketHistoryFn,
  getOilPricesFn,
  type MarketHistoryRange,
  type OilQuote,
} from "@/features/markets/oil-server-functions";
import { marketOutlookFn } from "@/features/markets/outlook-server-functions";
import { windowChange } from "@/features/markets/lib/window-change";
import { compareCloses } from "@/features/markets/lib/comparison";
import benchmarkStyles from "./BenchmarkPanel.module.css";
import periodStyles from "./MarketPeriod.module.css";

const assetColor = (symbol: string) =>
  BENCHMARKS.find((benchmark) => benchmark.symbol === symbol)?.color ?? "#0e2a43";
const number = (value: number) =>
  value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const price = (q: OilQuote, value: number) =>
  (q.unit === "index"
    ? ""
    : q.currency === "EUR"
      ? "€"
      : q.currency === "GBP"
        ? "£"
        : q.currency === "USD"
          ? "$"
          : `${q.currency} `) + number(value);
const percent = (value: number) => (value >= 0 ? "+" : "") + value.toFixed(2) + "%";
const date = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
const marketStyle = (symbol: string): CSSProperties =>
  ({ "--market-color": assetColor(symbol) }) as CSSProperties;
type ChartRange = "1mo" | MarketHistoryRange;
const historyFetchRange: Record<ChartRange, MarketHistoryRange> = {
  "1mo": "1y",
  "3mo": "1y",
  "1y": "5y",
  "5y": "max",
  max: "max",
};
const visibleMonths: Record<ChartRange, number | null> = {
  "1mo": 1,
  "3mo": 3,
  "1y": 12,
  "5y": 60,
  max: null,
};
const CHART_RANGES: Array<{ value: ChartRange; label: string; description: string }> = [
  { value: "1mo", label: "1M", description: "1 month" },
  { value: "3mo", label: "3M", description: "3 months" },
  { value: "1y", label: "1Y", description: "1 year" },
  { value: "5y", label: "5Y", description: "5 years" },
  { value: "max", label: "All", description: "All available history" },
];

function stats(q: OilQuote) {
  const closes = q.series.map((point) => point.c);
  const first = closes[0];
  const last = closes.at(-1);
  return {
    low: closes.length ? Math.min(...closes) : null,
    high: closes.length ? Math.max(...closes) : null,
    last: last ?? null,
    trend:
      first !== undefined && first !== 0 && last !== undefined
        ? ((last - first) / first) * 100
        : null,
  };
}

// Use the same daily-close series for both chart sizes; never substitute demo data.
function curve(points: Array<[number, number]>) {
  return points
    .map(([x, y], i) => {
      if (i === 0) return "M" + x.toFixed(2) + "," + y.toFixed(2);
      const [x0, y0] = points[i - 1]!;
      const [xp, yp] = points[i - 2] ?? points[i - 1]!;
      const [xn, yn] = points[i + 1] ?? points[i]!;
      return (
        "C" +
        (x0 + (x - xp) / 6).toFixed(2) +
        "," +
        (y0 + (y - yp) / 6).toFixed(2) +
        " " +
        (x - (xn - x0) / 6).toFixed(2) +
        "," +
        (y - (yn - y0) / 6).toFixed(2) +
        " " +
        x.toFixed(2) +
        "," +
        y.toFixed(2)
      );
    })
    .join(" ");
}

function DailyBadge({ q }: { q: OilQuote }) {
  const Icon = q.change >= 0 ? TrendingUp : TrendingDown;
  return (
    <span className={"benchmark-badge " + (q.change >= 0 ? "positive" : "negative")}>
      <Icon size={14} aria-hidden="true" />
      {percent(q.changePct)}
    </span>
  );
}

function MarketCard({
  q,
  active,
  onSelect,
}: {
  q: OilQuote;
  active: boolean;
  onSelect: () => void;
}) {
  const { low, high, trend } = stats(q);
  const points: Array<[number, number]> = q.series.map((point, i) => [
    2 + (i / Math.max(1, q.series.length - 1)) * 276,
    36 - ((point.c - (low ?? point.c)) / ((high ?? point.c) - (low ?? point.c) || 1)) * 30,
  ]);
  const line = curve(points);
  return (
    <button
      type="button"
      className="benchmark-card"
      aria-pressed={active}
      aria-controls="benchmark-detail"
      onClick={onSelect}
      style={marketStyle(q.symbol)}
    >
      <span className="benchmark-card-row">
        <span className="benchmark-card-name">{q.label}</span>
        <span className="benchmark-symbol">{q.symbol}</span>
      </span>
      <span className="benchmark-card-row">
        <span className="benchmark-card-price">
          {price(q, q.price)}
          <small>{q.unit}</small>
        </span>
        <DailyBadge q={q} />
      </span>
      <svg
        className="benchmark-spark"
        viewBox="0 0 280 42"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {points.length > 1 && (
          <path d={line + " L278,42 L2,42 Z"} className="benchmark-spark-area" />
        )}
        <path
          d={line}
          pathLength={1}
          className="benchmark-spark-line"
          vectorEffect="non-scaling-stroke"
        />
        {points.length === 1 && (
          <circle cx={points[0]![0]} cy={points[0]![1]} r={3} fill="var(--market-color)" />
        )}
      </svg>
      <span className="benchmark-card-row benchmark-card-foot">
        <span>30-day trend</span>
        <b className={trend !== null && trend < 0 ? "negative" : "positive"}>
          {trend === null ? "—" : percent(trend)}
        </b>
      </span>
    </button>
  );
}

function UnavailableMarketCard({
  benchmark,
  loading,
}: {
  benchmark: (typeof BENCHMARKS)[number];
  loading: boolean;
}) {
  return (
    <button
      type="button"
      className="benchmark-card benchmark-card-unavailable"
      disabled
      aria-label={`${benchmark.label}: ${loading ? "loading" : "data unavailable"}`}
      style={marketStyle(benchmark.symbol)}
    >
      <span className="benchmark-card-row">
        <span className="benchmark-card-name">{benchmark.label}</span>
        <span className="benchmark-symbol">{benchmark.symbol}</span>
      </span>
      <span className="benchmark-card-row">
        <span className="benchmark-card-price">
          —<small>{benchmark.unit}</small>
        </span>
      </span>
      <span className="benchmark-missing-history">
        {loading ? "Loading prices…" : "Price data unavailable"}
      </span>
      <span className="benchmark-card-row benchmark-card-foot">
        <span>30-day trend</span>
        <b>—</b>
      </span>
    </button>
  );
}

function MarketChart({
  q,
  comparison,
  range,
  onRangeChange,
}: {
  q: OilQuote;
  comparison: OilQuote | undefined;
  range: ChartRange;
  onRangeChange: (range: ChartRange) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; start: number; count: number } | null>(null);
  const [size, setSize] = useState({ width: 640, height: 300 });
  const [hover, setHover] = useState<number | null>(null);
  const [view, setView] = useState<{ start: number; count: number } | null>(null);
  const fillId = useId();
  const fetchRange = historyFetchRange[range];
  const primaryHistory = useQuery({
    queryKey: ["market-history", q.symbol, fetchRange],
    queryFn: () => getMarketHistoryFn({ data: { symbol: q.symbol, range: fetchRange } }),
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const comparisonHistory = useQuery({
    queryKey: ["market-history", comparison?.symbol, fetchRange],
    queryFn: () =>
      getMarketHistoryFn({
        data: { symbol: comparison!.symbol, range: fetchRange },
      }),
    enabled: !!comparison,
    staleTime: 5 * 60_000,
    retry: 1,
  });
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ width, height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setView(null);
    setHover(null);
  }, [range, q.symbol, comparison?.symbol]);
  const primarySeries = primaryHistory.data?.quote?.series ?? (range === "1mo" ? q.series : []);
  const secondarySeries = comparison
    ? (comparisonHistory.data?.quote?.series ?? (range === "1mo" ? comparison.series : []))
    : [];
  const granularity = primaryHistory.data?.quote?.granularity ?? "1d";
  const groupByMonth =
    range === "max" &&
    (granularity !== "1d" || comparisonHistory.data?.quote?.granularity !== "1d");
  const allShared = comparison ? compareCloses(primarySeries, secondarySeries, groupByMonth) : [];
  const allHistory = comparison ? allShared : primarySeries;
  const total = allHistory.length;
  const months = visibleMonths[range];
  const cutoff =
    months === null || !total
      ? 0
      : (() => {
          const latest = new Date(allHistory[total - 1]!.t);
          latest.setUTCMonth(latest.getUTCMonth() - months);
          return latest.getTime();
        })();
  const matchingIndex = allHistory.findIndex((p) => p.t >= cutoff);
  const firstVisible =
    months === null ? 0 : matchingIndex < 0 ? Math.max(0, total - 1) : matchingIndex;
  const defaultCount = Math.max(1, total - firstVisible);
  const count = view ? Math.min(view.count, total) : defaultCount;
  const start = view ? Math.min(view.start, Math.max(0, total - count)) : firstVisible;
  const history = allHistory.slice(start, start + count);
  const shared = comparison ? allShared.slice(start, start + count) : [];
  const values = comparison
    ? shared.flatMap((p) => [p.value, p.otherValue])
    : history.map((p) => p.c);
  const low = values.length ? Math.min(...values) : null;
  const high = values.length ? Math.max(...values) : null;
  const left = size.width < 400 ? 48 : 56;
  const right = size.width - 14;
  const top = 22;
  const bottom = size.height - 32;
  const span = low !== null && high !== null ? high - low || Math.max(Math.abs(low) * 0.02, 1) : 1;
  const floor = (low ?? 0) - span * 0.12;
  const ceiling = (high ?? 0) + span * 0.12;
  const scale = ceiling - floor || 1;
  const x = (t: number) =>
    left +
    ((t - (history[0]?.t ?? t)) / ((history.at(-1)?.t ?? t) - (history[0]?.t ?? t) || 1)) *
      (right - left);
  const y = (value: number) => bottom - ((value - floor) / scale) * (bottom - top);
  const points: Array<[number, number]> = comparison
    ? shared.map((p) => [x(p.t), y(p.value)])
    : history.map((p) => [x(p.t), y(p.c)]);
  const secondaryPoints: Array<[number, number]> = shared.map((p) => [x(p.t), y(p.otherValue)]);
  const line = curve(points);
  const active = hover === null ? points.length - 1 : Math.min(hover, points.length - 1);
  const point = points[active] ?? [left, bottom];
  const quotePoint = history[active];
  const comparisonPoint = shared[active];
  const primaryIndex = quotePoint
    ? primarySeries.findIndex(
        (p) => Math.floor(p.t / 86_400_000) === Math.floor(quotePoint.t / 86_400_000),
      )
    : -1;
  const previous = primarySeries[primaryIndex - 1]?.c;
  const daily =
    quotePoint && previous !== undefined && previous !== 0
      ? ((quotePoint.c - previous) / previous) * 100
      : null;
  const dateIndices = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  const longDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: granularity === "1d" || granularity === "1wk" ? "numeric" : undefined,
      year: "numeric",
      timeZone: "UTC",
    });
  const period = CHART_RANGES.find((option) => option.value === range)!.description;
  const frequency =
    granularity === "1d"
      ? "Daily"
      : granularity === "1wk"
        ? "Weekly"
        : granularity === "1mo"
          ? "Monthly"
          : granularity === "3mo"
            ? "Quarterly"
            : "Historical";
  const historyLoading =
    (range !== "1mo" && primaryHistory.isPending) ||
    (!!comparison && range !== "1mo" && comparisonHistory.isPending);
  const zoom = (factor: number) => {
    if (total < 7) return;
    const nextCount = Math.min(total, Math.max(6, Math.round(count * factor)));
    if (nextCount === count) return;
    const anchor = hover === null ? count - 1 : hover;
    const anchorRatio = count > 1 ? anchor / (count - 1) : 1;
    const nextStart = Math.max(
      0,
      Math.min(total - nextCount, Math.round(start + anchor - anchorRatio * (nextCount - 1))),
    );
    setView(nextCount === total ? null : { start: nextStart, count: nextCount });
    setHover(null);
  };
  const pan = (nextStart: number) => {
    setView({ start: Math.max(0, Math.min(total - count, nextStart)), count });
    setHover(null);
  };

  return (
    <>
      <div className="market-history-toolbar">
        <div className="market-range-tabs" role="group" aria-label="Price chart timeframe">
          {CHART_RANGES.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-label={option.description}
              aria-pressed={range === option.value}
              onClick={() => onRangeChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="market-zoom-controls" role="group" aria-label="Chart zoom">
          <button
            type="button"
            aria-label="Zoom in on price chart"
            disabled={total < 7 || count <= 6}
            onClick={() => zoom(0.6)}
          >
            +
          </button>
          <button
            type="button"
            aria-label="Zoom out of price chart"
            disabled={count >= total}
            onClick={() => zoom(1.6)}
          >
            −
          </button>
          <button
            type="button"
            aria-label="Reset price chart zoom"
            disabled={count >= total}
            onClick={() => {
              setView(null);
              setHover(null);
            }}
          >
            Reset
          </button>
        </div>
      </div>
      <div
        ref={container}
        className="benchmark-chart-wrap"
        data-can-pan={count < total}
        tabIndex={points.length ? 0 : undefined}
        role="group"
        aria-label={
          q.label +
          (comparison ? " compared with " + comparison.label + ", start = 100. " : "") +
          ` ${frequency.toLowerCase()} closing prices for ${period}. ` +
          "Use left and right arrow keys to inspect prices, or shift and arrow keys to pan when zoomed. " +
          (quotePoint
            ? longDate(quotePoint.t) + ": " + price(q, quotePoint.c)
            : "History unavailable.")
        }
        onPointerDown={(event) => {
          if (event.button !== 0 || count >= total) return;
          drag.current = { x: event.clientX, start, count };
          event.currentTarget.setPointerCapture(event.pointerId);
          setHover(null);
        }}
        onPointerMove={(event) => {
          if (drag.current) {
            const shift = Math.round(
              ((drag.current.x - event.clientX) / Math.max(1, right - left)) * drag.current.count,
            );
            pan(drag.current.start + shift);
            return;
          }
          if (!points.length) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const ratio = Math.max(
            0,
            Math.min(1, (event.clientX - bounds.left - left) / (right - left)),
          );
          const target = history[0]!.t + ratio * (history.at(-1)!.t - history[0]!.t);
          let nearest = 0;
          for (let index = 1; index < history.length; index++) {
            if (Math.abs(history[index]!.t - target) < Math.abs(history[nearest]!.t - target))
              nearest = index;
          }
          setHover(nearest);
        }}
        onPointerUp={(event) => {
          drag.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setHover(null);
        }}
        onPointerLeave={() => {
          if (!drag.current) setHover(null);
        }}
        onBlur={() => setHover(null)}
        onKeyDown={(event) => {
          if (!points.length) return;
          if (event.shiftKey && count < total && event.key === "ArrowLeft") {
            pan(start - Math.max(1, Math.round(count * 0.2)));
            event.preventDefault();
            return;
          }
          if (event.shiftKey && count < total && event.key === "ArrowRight") {
            pan(start + Math.max(1, Math.round(count * 0.2)));
            event.preventDefault();
            return;
          }
          const index = hover ?? points.length - 1;
          if (event.key === "ArrowLeft") setHover(Math.max(0, index - 1));
          else if (event.key === "ArrowRight") setHover(Math.min(points.length - 1, index + 1));
          else if (event.key === "Home") setHover(0);
          else if (event.key === "End") setHover(points.length - 1);
          else if (event.key === "Escape") setHover(null);
          else return;
          event.preventDefault();
        }}
      >
        {points.length ? (
          <svg
            className="benchmark-chart"
            viewBox={"0 0 " + size.width + " " + size.height}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--market-color)" stopOpacity=".26" />
                <stop offset="100%" stopColor="var(--market-color)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 0.5, 1].map((fraction) => {
              const y = bottom - fraction * (bottom - top);
              const value = floor + scale * fraction;
              return (
                <g key={fraction}>
                  <line className="benchmark-grid" x1={left} x2={right} y1={y} y2={y} />
                  <text className="benchmark-tick" x={left - 10} y={y + 4} textAnchor="end">
                    {value.toLocaleString("en-US", {
                      maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 1,
                    })}
                  </text>
                </g>
              );
            })}
            {points.length > 1 && !comparison && (
              <path
                className="benchmark-area"
                d={line + " L" + right + "," + bottom + " L" + left + "," + bottom + " Z"}
                fill={"url(#" + fillId + ")"}
              />
            )}
            {comparison && secondaryPoints.length > 1 && (
              <path
                className="benchmark-line benchmark-comparison-line"
                pathLength={1}
                d={curve(secondaryPoints)}
                style={{ stroke: assetColor(comparison.symbol) }}
              />
            )}
            <path className="benchmark-line" pathLength={1} d={line} />
            {dateIndices.map((index) => (
              <text
                className="benchmark-tick"
                key={index}
                x={points[index]![0]}
                y={size.height - 8}
                textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}
              >
                {range === "1mo" ? date(history[index]!.t) : longDate(history[index]!.t)}
              </text>
            ))}
            {hover !== null && (
              <line
                x1={point[0]}
                x2={point[0]}
                y1={top}
                y2={bottom}
                className="benchmark-crosshair"
              />
            )}
            {comparison && secondaryPoints[active] && (
              <circle
                cx={secondaryPoints[active]![0]}
                cy={secondaryPoints[active]![1]}
                r={5}
                fill="#fff"
                stroke={assetColor(comparison.symbol)}
                strokeWidth={2.5}
              />
            )}
            <g className="benchmark-end">
              <circle cx={point[0]} cy={point[1]} r={10} fill="var(--market-color)" opacity=".14" />
              <circle cx={point[0]} cy={point[1]} r={5} className="benchmark-point" />
            </g>
          </svg>
        ) : (
          <p className="benchmark-history-empty" role="status">
            {historyLoading
              ? "Loading historical prices…"
              : comparison
                ? "Not enough shared closing dates to compare these markets."
                : "Price history unavailable right now."}
          </p>
        )}
        {hover !== null && quotePoint && (
          <div
            className="benchmark-tooltip"
            aria-hidden="true"
            style={{
              left: Math.max(105, Math.min(size.width - 105, point[0])),
              top: Math.max(88, point[1]! - 14),
            }}
          >
            <span>{longDate(quotePoint.t)}</span>
            <b>{price(q, quotePoint.c)}</b>
            {comparison && comparisonPoint && (
              <span>
                {comparison.label}: {price(comparison, comparisonPoint.other)}
              </span>
            )}
            <span className={daily !== null && daily < 0 ? "negative" : "positive"}>
              {daily === null
                ? "First available close"
                : percent(daily) +
                  (granularity === "1d" ? " vs previous close" : " vs previous point")}
            </span>
          </div>
        )}
        <span className="sr-only" aria-live="polite">
          {hover !== null && quotePoint
            ? longDate(quotePoint.t) +
              ", " +
              price(q, quotePoint.c) +
              (comparison && comparisonPoint
                ? ", " + comparison.label + ": " + price(comparison, comparisonPoint.other)
                : "")
            : ""}
        </span>
      </div>
      <p className="benchmark-caption">
        <span>
          {comparison
            ? "Indexed comparison · shared dates · start = 100"
            : q.unit === "index"
              ? "Index level"
              : "Price (" + q.currency + " " + q.unit + ")"}
        </span>
        <span>
          {frequency} close · {period}
          {count < total ? " · drag chart to see earlier prices" : " · zoom for detail"}
        </span>
      </p>
    </>
  );
}

function MarketStats({ q }: { q: OilQuote }) {
  const { last } = stats(q);
  const [days, setDays] = useState(14);
  const sliderId = useId();
  const olderCloses = useQuery({
    queryKey: ["market-history", q.symbol, "1y"],
    queryFn: () => getMarketHistoryFn({ data: { symbol: q.symbol, range: "1y" } }),
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const result = windowChange(olderCloses.data?.quote?.series ?? q.series, days);
  const direction =
    !result || result.change === 0 ? "neutral" : result.change > 0 ? "positive" : "negative";
  const ChangeIcon =
    direction === "positive" ? TrendingUp : direction === "negative" ? TrendingDown : Minus;
  const rangeStyle = { "--period-progress": ((days - 1) / 29) * 100 + "%" } as CSSProperties;
  return (
    <div className={periodStyles["card"]}>
      <div role="group" aria-label={q.label + " period change calculator"}>
        <div className={periodStyles["main"]}>
          <div className={periodStyles["control"]}>
            <div className={periodStyles["heading"]}>
              <label htmlFor={sliderId}>Recent comparison</label>
              <span className={periodStyles["days"]}>
                {days} {days === 1 ? "day" : "days"}
              </span>
            </div>
            <input
              id={sliderId}
              type="range"
              min={1}
              max={30}
              step={1}
              value={days}
              disabled={!result}
              aria-label={q.label + " comparison period"}
              aria-valuetext={days + " calendar " + (days === 1 ? "day" : "days")}
              aria-describedby={sliderId + "-result"}
              className={periodStyles["slider"]}
              style={rangeStyle}
              onChange={(event) => setDays(Number(event.currentTarget.value))}
            />
            <div className={periodStyles["ends"]} aria-hidden="true">
              <span>1 day</span>
              <span>30 days</span>
            </div>
          </div>
          <div id={sliderId + "-result"} aria-live="polite" aria-atomic="true">
            {result ? (
              <div
                className={periodStyles["result"]}
                data-direction={direction}
                key={days + ":" + result.latest.t + ":" + result.latest.c}
              >
                <div className={periodStyles["resultTop"]}>
                  <strong>{result.changePct === null ? "—" : percent(result.changePct)}</strong>
                  <span className={periodStyles["trend"]}>
                    <ChangeIcon size={14} aria-hidden="true" />
                    {result.change > 0 ? "Increase" : result.change < 0 ? "Decrease" : "Unchanged"}
                  </span>
                </div>
                <div className={periodStyles["prices"]}>
                  <span>{price(q, result.baseline.c)}</span>
                  <span className={periodStyles["priceArrow"]} aria-hidden="true">
                    →
                  </span>
                  <span className="sr-only">to</span>
                  <span>{price(q, result.latest.c)}</span>
                </div>
                <p className={periodStyles["dates"]}>
                  {date(result.baseline.t)} – {date(result.latest.t)}
                </p>
                {(result.partial || result.elapsedDays !== days || result.changePct === null) && (
                  <p className={periodStyles["note"]}>
                    {result.partial
                      ? olderCloses.isPending
                        ? "Loading older closes for the full comparison…"
                        : `Only ${result.elapsedDays} days of daily closes available for this ${days}-day selection.`
                      : result.elapsedDays !== days
                        ? `Previous trading close used (${result.elapsedDays} days ago).`
                        : ""}
                    {result.changePct === null
                      ? " Percentage unavailable: starting close is zero."
                      : ""}
                  </p>
                )}
              </div>
            ) : (
              <p className={periodStyles["note"]}>
                At least two daily closes are needed to calculate a change.
              </p>
            )}
          </div>
          <dl className={periodStyles["closes"]}>
            <div>
              <dt>Latest close</dt>
              <dd>{last === null ? "—" : price(q, last)}</dd>
            </div>
            <div>
              <dt>Previous close</dt>
              <dd>{price(q, q.prevClose)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

type Outlook = { text: string; loading: boolean; error?: string };

function BiofuelStockWorkspace() {
  const { data, isLoading } = useQuery({
    queryKey: ["biofuel-stocks"],
    queryFn: () => getBiofuelStocksFn(),
    refetchInterval: 60_000,
    staleTime: 60_000,
  });
  const [selected, setSelected] = useState<string>(BIOFUEL_STOCKS[0].symbol);
  const [historyRange, setHistoryRange] = useState<ChartRange>("1mo");
  const quotes = data?.quotes ?? [];
  const active = quotes.find((quote) => quote.symbol === selected) ?? quotes[0];
  const selectedInfo = BIOFUEL_STOCKS.find((stock) => stock.symbol === active?.symbol);
  const activeTrend = active ? stats(active).trend : null;

  return (
    <div className="stock-workspace">
      <div className="stock-workspace-heading">
        <div>
          <h3>Biofuel company shares</h3>
          <p>
            Ten listed companies from the Global Bioenergy Watch desk. Select one to inspect its
            price history.
          </p>
        </div>
      </div>
      <div className="stock-workspace-grid">
        <MotionReveal
          as="article"
          key={active?.symbol ?? "empty"}
          delay={0.12}
          duration={0.9}
          id="stock-chart-detail"
          className="stock-chart-panel"
        >
          {active ? (
            <>
              <div className="stock-chart-summary" key={active.symbol}>
                <div className="stock-chart-head">
                  <div className="stock-chart-name">
                    <img src={`/market-logos/${active.symbol}.png`} alt="" aria-hidden="true" />
                    <div>
                      <div className="stock-chart-id">
                        <h4>{active.label}</h4>
                        <span className="benchmark-symbol">{active.symbol}</span>
                      </div>
                      <p>{selectedInfo?.focus}</p>
                    </div>
                  </div>
                  <span
                    className={`benchmark-trend ${activeTrend !== null && activeTrend < 0 ? "negative" : "positive"}`}
                  >
                    {activeTrend === null ? "—" : percent(activeTrend)} · 30-day change
                  </span>
                </div>
                <div className="benchmark-price-row stock-price-row">
                  <div className="benchmark-price">
                    {price(active, active.price)} <small>{active.currency} / share</small>
                  </div>
                  <DailyBadge q={active} />
                  <span className="benchmark-daily">
                    1D change{" "}
                    <b className={active.change >= 0 ? "positive" : "negative"}>
                      {active.change >= 0 ? "+" : ""}
                      {number(active.change)}
                    </b>
                  </span>
                </div>
              </div>
              <MarketChart
                key={active.symbol}
                q={active}
                comparison={undefined}
                range={historyRange}
                onRangeChange={setHistoryRange}
              />
              <MarketStats key={active.symbol + "-period"} q={active} />
              <p className="stock-quote-note">
                Last market quote:{" "}
                {new Date(active.updatedAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "UTC",
                })}{" "}
                UTC. Prices may be delayed; closed exchanges show their last trade.
              </p>
            </>
          ) : (
            <div className="stock-chart-empty" role="status">
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Loading stock prices…
                </>
              ) : (
                "Stock prices are unavailable right now. Please try refreshing."
              )}
            </div>
          )}
        </MotionReveal>
        <MotionReveal className="stock-list-panel" delay={0.22} duration={0.9}>
          <div className="stock-list-title">
            <span>Company</span>
            <span>Share price / 1D</span>
          </div>
          <div className="stock-list" role="group" aria-label="Choose a biofuel stock">
            {BIOFUEL_STOCKS.map((stock, index) => {
              const quote = quotes.find((item) => item.symbol === stock.symbol);
              return (
                <button
                  type="button"
                  key={stock.symbol}
                  className="stock-row"
                  style={{ "--row-index": index } as CSSProperties}
                  aria-pressed={active?.symbol === stock.symbol}
                  aria-controls="stock-chart-detail"
                  disabled={!quote}
                  onClick={() => setSelected(stock.symbol)}
                >
                  <span className="stock-row-number">{String(index + 1).padStart(2, "0")}</span>
                  <img
                    className="stock-row-logo"
                    src={`/market-logos/${stock.symbol}.png`}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                  />
                  <span className="stock-row-identity">
                    <strong>{stock.label}</strong>
                    <small>
                      {stock.symbol} · {stock.focus}
                    </small>
                  </span>
                  <span className="stock-row-quote">
                    <strong>{quote ? price(quote, quote.price) : "—"}</strong>
                    <small className={quote && quote.change < 0 ? "negative" : "positive"}>
                      {quote ? percent(quote.changePct) : isLoading ? "Loading" : "Unavailable"}
                    </small>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="stock-list-note">
            Prices are shown in each listing currency. The ten companies are a curated list, not a
            comparable price or market-cap ranking.
          </p>
        </MotionReveal>
      </div>
    </div>
  );
}

export function OilPricePanel({
  initialMarket,
}: {
  initialMarket?: Awaited<ReturnType<typeof getOilPricesFn>> | null;
}) {
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["oil-prices"],
    queryFn: () => getOilPricesFn(),
    initialData: initialMarket ?? undefined,
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [marketView, setMarketView] = useState<"benchmarks" | "stocks">("benchmarks");
  const [historyRange, setHistoryRange] = useState<ChartRange>("1mo");
  const [compareSymbol, setCompareSymbol] = useState<string | null>(null);
  const [outlookOpen, setOutlookOpen] = useState(false);
  const [outlook, setOutlook] = useState<Record<string, Outlook>>({});
  const pendingOutlook = useRef(new Set<string>());
  const outlookId = useId();
  const requestOutlook = async (q: OilQuote) => {
    if (pendingOutlook.current.has(q.symbol)) return;
    pendingOutlook.current.add(q.symbol);
    setOutlook((s) => ({ ...s, [q.symbol]: { text: "", loading: true } }));
    try {
      const { outlook: text } = await marketOutlookFn({
        data: {
          label: q.label,
          symbol: q.symbol,
          unit: q.unit,
          price: q.price,
          change: q.change,
          changePct: q.changePct,
          prevClose: q.prevClose,
          series: q.series,
        },
      });
      setOutlook((s) => ({ ...s, [q.symbol]: { text, loading: false } }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Outlook failed";
      const error = /unauthori[sz]ed|401/i.test(msg)
        ? "Please sign in to generate an AI outlook."
        : msg;
      setOutlook((s) => ({ ...s, [q.symbol]: { text: "", loading: false, error } }));
      toast.error(error);
    } finally {
      pendingOutlook.current.delete(q.symbol);
    }
  };
  const quotes = BENCHMARKS.flatMap((benchmark) => {
    const quote = data?.quotes.find((item) => item.symbol === benchmark.symbol);
    return quote ? [quote] : [];
  });
  const q = quotes.find((quote) => quote.symbol === selected) ?? quotes[0];
  const comparison = quotes.find(
    (quote) => quote.symbol === compareSymbol && quote.symbol !== q?.symbol,
  );
  const selectedOutlook = q ? outlook[q.symbol] : undefined;
  const stale = data?.stale ?? false;
  const asOf = data?.asOf ?? dataUpdatedAt;
  const stamp = asOf
    ? new Date(asOf).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      }) + " UTC"
    : "—";
  const trend = q ? stats(q).trend : null;

  return (
    <div className={`benchmark-inner ${benchmarkStyles["presentation"]}`}>
      <MotionReveal as="header" className="benchmark-header">
        <div>
          <h2 id="markets-title">Markets that move biofuel economics</h2>
          <p>Explore benchmark prices and the share performance of listed biofuel companies.</p>
        </div>
        {marketView === "benchmarks" && (
          <div className="benchmark-meta">
            <span className="benchmark-live">
              <span
                className={quotes.length && !stale ? "benchmark-live-dot" : "benchmark-offline-dot"}
              />
              {quotes.length
                ? stale
                  ? "Last close"
                  : "Live"
                : isLoading
                  ? "Loading"
                  : "Unavailable"}
            </span>
            <span>
              {stale ? "As of" : "Updated"} <b>{stamp}</b>
            </span>
          </div>
        )}
      </MotionReveal>
      <div
        className="market-view-tabs"
        role="tablist"
        aria-label="Market data"
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const next =
            event.key === "Home"
              ? "benchmarks"
              : event.key === "End"
                ? "stocks"
                : marketView === "benchmarks"
                  ? "stocks"
                  : "benchmarks";
          setMarketView(next);
          const tabs = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
          tabs[next === "benchmarks" ? 0 : 1]?.focus();
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={marketView === "benchmarks"}
          aria-controls="market-benchmarks-panel"
          onClick={() => setMarketView("benchmarks")}
        >
          Benchmark markets
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={marketView === "stocks"}
          aria-controls="market-stocks-panel"
          onClick={() => setMarketView("stocks")}
        >
          Biofuel stocks <span>10</span>
        </button>
      </div>
      {marketView === "stocks" ? (
        <div id="market-stocks-panel" role="tabpanel">
          <BiofuelStockWorkspace />
        </div>
      ) : (
        <div id="market-benchmarks-panel" role="tabpanel">
          {isLoading && !quotes.length && (
            <div className="benchmark-loading" role="status">
              <Loader2 size={20} className="animate-spin" />
              Loading benchmark markets…
            </div>
          )}
          {!isLoading && !quotes.length && (
            <p className="benchmark-loading" role="status">
              Price feed unavailable right now.
            </p>
          )}
          <div className="benchmark-layout">
            <div className="benchmark-cards" role="group" aria-label="Choose a benchmark">
              {BENCHMARKS.map((benchmark, index) => {
                const quote = quotes.find((item) => item.symbol === benchmark.symbol);
                return (
                  <MotionReveal
                    key={benchmark.symbol}
                    delay={(index + 1) * 0.09}
                    className="benchmark-card-reveal"
                  >
                    {quote ? (
                      <MarketCard
                        q={quote}
                        active={q?.symbol === quote.symbol}
                        onSelect={() => {
                          if (q?.symbol !== quote.symbol) {
                            setSelected(quote.symbol);
                            setCompareSymbol(null);
                            setOutlookOpen(false);
                          }
                        }}
                      />
                    ) : (
                      <UnavailableMarketCard benchmark={benchmark} loading={isLoading} />
                    )}
                  </MotionReveal>
                );
              })}
            </div>
            {q && (
              <MotionReveal
                key={`${q.symbol}:${comparison?.symbol ?? "price"}`}
                delay={0.18}
                className="benchmark-panel-reveal"
              >
                <article
                  className="benchmark-panel"
                  id="benchmark-detail"
                  aria-label={q.label + " market details"}
                  style={marketStyle(q.symbol)}
                >
                  <div className="benchmark-body" key={q.symbol}>
                    <div className="benchmark-panel-top">
                      <div className="benchmark-id">
                        <h3>{q.label}</h3>
                        <span className="benchmark-symbol">{q.symbol}</span>
                      </div>
                      <span
                        className={
                          "benchmark-trend " +
                          (trend !== null && trend < 0 ? "negative" : "positive")
                        }
                      >
                        {trend === null ? "—" : percent(trend)} · 30-day change
                      </span>
                    </div>
                    <div className="benchmark-price-row">
                      <div className="benchmark-price">
                        {price(q, q.price)}
                        <small>{q.unit}</small>
                      </div>
                      <DailyBadge q={q} />
                      <span className="benchmark-daily">
                        1D change{" "}
                        <b className={q.change >= 0 ? "positive" : "negative"}>
                          {q.change >= 0 ? "+" : ""}
                          {number(q.change)}
                        </b>
                      </span>
                    </div>
                    <div
                      className="benchmark-compare"
                      role="group"
                      aria-label="Compare with another benchmark"
                    >
                      <span>Compare with</span>
                      {BENCHMARKS.filter((benchmark) => benchmark.symbol !== q.symbol).map(
                        (benchmark) => {
                          const quote = quotes.find((item) => item.symbol === benchmark.symbol);
                          return (
                            <button
                              type="button"
                              key={benchmark.symbol}
                              disabled={!quote}
                              title={!quote ? "Price data unavailable" : undefined}
                              aria-pressed={comparison?.symbol === benchmark.symbol}
                              style={marketStyle(benchmark.symbol)}
                              onClick={() =>
                                setCompareSymbol((current) =>
                                  current === benchmark.symbol ? null : benchmark.symbol,
                                )
                              }
                            >
                              <i aria-hidden="true" />
                              {benchmark.label}
                            </button>
                          );
                        },
                      )}
                    </div>
                    {comparison && (
                      <div className="benchmark-comparison-legend" aria-live="polite">
                        <span style={marketStyle(q.symbol)}>
                          <i />
                          {q.label}
                        </span>
                        <span style={marketStyle(comparison.symbol)}>
                          <i />
                          {comparison.label}
                        </span>
                      </div>
                    )}
                    <MarketChart
                      key={`${q.symbol}:${comparison?.symbol ?? "price"}`}
                      q={q}
                      comparison={comparison}
                      range={historyRange}
                      onRangeChange={setHistoryRange}
                    />
                    <MarketStats q={q} />
                  </div>
                  <p className="benchmark-why">
                    <b>Why it matters:</b>{" "}
                    {q.symbol === "CL=F" || q.symbol === "BZ=F"
                      ? "Crude oil prices help explain the relative economics of biodiesel, renewable diesel and ethanol blending."
                      : q.symbol === "^GSPC" || q.symbol === "^NYA"
                        ? "US equity benchmarks provide context for investment conditions across listed energy companies and biofuel producers."
                        : "Natural gas is an operating cost for biofuel plants and a benchmark for renewable natural gas markets."}
                  </p>
                  <div className="benchmark-outlook">
                    <button
                      type="button"
                      className="benchmark-ai"
                      aria-expanded={outlookOpen}
                      aria-controls={outlookId}
                      onClick={() => {
                        setOutlookOpen(!outlookOpen);
                        if (!outlookOpen && !selectedOutlook?.text) void requestOutlook(q);
                      }}
                    >
                      <Sparkles size={16} aria-hidden="true" />
                      AI market outlook
                      <ChevronDown size={14} aria-hidden="true" />
                    </button>
                    <div id={outlookId} hidden={!outlookOpen} className="benchmark-ai-content">
                      <div className="benchmark-ai-actions">
                        <span>{q.label}</span>
                        <button
                          type="button"
                          onClick={() => void requestOutlook(q)}
                          disabled={selectedOutlook?.loading}
                        >
                          <RefreshCw size={13} aria-hidden="true" />
                          Regenerate
                        </button>
                        <button type="button" onClick={() => setOutlookOpen(false)}>
                          <X size={13} aria-hidden="true" />
                          Close
                        </button>
                      </div>
                      <p aria-live="polite">
                        {selectedOutlook?.loading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                            Writing an outlook from the latest price action…
                          </>
                        ) : (
                          selectedOutlook?.error ||
                          selectedOutlook?.text ||
                          "Generate an outlook from this market’s current price series."
                        )}
                      </p>
                      <small>
                        AI-generated from the latest 30-day price series. May contain errors —
                        always cross-verify before acting.
                      </small>
                    </div>
                  </div>
                </article>
              </MotionReveal>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
