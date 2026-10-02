import { MotionReveal } from "@/components/MotionReveal";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import {
  ChevronDown,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getOilPricesFn, type OilQuote } from "@/features/markets/oil-server-functions";
import { marketOutlookFn } from "@/features/markets/outlook-server-functions";

const assetColor = (symbol: string) =>
  symbol === "^GSPC" ? "#178a6b" : symbol === "NG=F" ? "#8262b5" : "#0e2a43";
const number = (value: number) =>
  value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const price = (q: OilQuote, value: number) => (q.unit === "index" ? "" : "$") + number(value);
const percent = (value: number) => (value >= 0 ? "+" : "") + value.toFixed(2) + "%";
const date = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
const marketStyle = (symbol: string): CSSProperties =>
  ({ "--market-color": assetColor(symbol) }) as CSSProperties;

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

function MarketChart({ q }: { q: OilQuote }) {
  const container = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 640, height: 300 });
  const [hover, setHover] = useState<number | null>(null);
  const fillId = useId();
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
  const { low, high } = stats(q);
  const left = size.width < 400 ? 48 : 56;
  const right = size.width - 14;
  const top = 22;
  const bottom = size.height - 32;
  const span = low !== null && high !== null ? high - low || Math.max(Math.abs(low) * 0.02, 1) : 1;
  const floor = (low ?? 0) - span * 0.12;
  const ceiling = (high ?? 0) + span * 0.12;
  const scale = ceiling - floor || 1;
  const points: Array<[number, number]> = q.series.map((point, i) => [
    left + (i / Math.max(1, q.series.length - 1)) * (right - left),
    bottom - ((point.c - floor) / scale) * (bottom - top),
  ]);
  const line = curve(points);
  const active = hover === null ? points.length - 1 : Math.min(hover, points.length - 1);
  const point = points[active] ?? [left, bottom];
  const quotePoint = q.series[active];
  const previous = q.series[active - 1]?.c;
  const daily =
    quotePoint && previous !== undefined && previous !== 0
      ? ((quotePoint.c - previous) / previous) * 100
      : null;
  const dateIndices = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];

  return (
    <>
      <div
        ref={container}
        className="benchmark-chart-wrap"
        tabIndex={points.length ? 0 : undefined}
        role="group"
        aria-label={
          q.label +
          " daily closing prices. Use left and right arrow keys to explore. " +
          (quotePoint ? date(quotePoint.t) + ": " + price(q, quotePoint.c) : "History unavailable.")
        }
        onPointerMove={(event) => {
          if (!points.length) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const ratio = (event.clientX - bounds.left - left) / (right - left);
          setHover(
            Math.max(0, Math.min(points.length - 1, Math.round(ratio * (points.length - 1)))),
          );
        }}
        onPointerLeave={() => setHover(null)}
        onBlur={() => setHover(null)}
        onKeyDown={(event) => {
          if (!points.length) return;
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
            {points.length > 1 && (
              <path
                d={line + " L" + right + "," + bottom + " L" + left + "," + bottom + " Z"}
                fill={"url(#" + fillId + ")"}
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
                {date(q.series[index]!.t)}
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
            <circle cx={point[0]} cy={point[1]} r={10} fill="var(--market-color)" opacity=".14" />
            <circle cx={point[0]} cy={point[1]} r={5} className="benchmark-point" />
          </svg>
        ) : (
          <p className="benchmark-history-empty">Price history unavailable right now.</p>
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
            <span>{date(quotePoint.t)}</span>
            <b>{price(q, quotePoint.c)}</b>
            <span className={daily !== null && daily < 0 ? "negative" : "positive"}>
              {daily === null ? "First available close" : percent(daily) + " vs previous close"}
            </span>
          </div>
        )}
        <span className="sr-only" aria-live="polite">
          {hover !== null && quotePoint ? date(quotePoint.t) + ", " + price(q, quotePoint.c) : ""}
        </span>
      </div>
      <p className="benchmark-caption">
        <span>
          {q.unit === "index" ? "Index level" : "Price (" + q.currency + " " + q.unit + ")"}
        </span>
        <span>Daily close, last 30 days</span>
      </p>
    </>
  );
}

function MarketStats({ q }: { q: OilQuote }) {
  const { low, high, last } = stats(q);
  const position =
    last !== null && low !== null && high !== null && high !== low
      ? Math.max(0, Math.min(1, (last - low) / (high - low)))
      : 0.5;
  return (
    <div className="benchmark-stats">
      <div
        className="benchmark-stat benchmark-range-box"
        role="group"
        aria-label="30-day closing price range"
      >
        <div className="benchmark-stat-label">30-day range</div>
        {low !== null && high !== null && last !== null ? (
          <>
            <div className="benchmark-range" aria-hidden="true">
              <span className="benchmark-range-fill" style={{ width: position * 100 + "%" }} />
              <span className="benchmark-range-dot" style={{ left: position * 100 + "%" }} />
              <span
                className="benchmark-range-chip"
                style={{
                  left: position * 100 + "%",
                  transform: "translateX(-" + position * 100 + "%)",
                }}
              >
                {price(q, last)}
              </span>
            </div>
            <div className="benchmark-range-ends">
              <span>{price(q, low)}</span>
              <span>{price(q, high)}</span>
            </div>
            <span className="sr-only">
              Low {price(q, low)}, high {price(q, high)}, latest close {price(q, last)}.
            </span>
          </>
        ) : (
          <div className="benchmark-stat-value">—</div>
        )}
      </div>
      <div className="benchmark-stat">
        <div className="benchmark-stat-label">Latest close</div>
        <div className="benchmark-stat-value">{last === null ? "—" : price(q, last)}</div>
      </div>
      <div className="benchmark-stat">
        <div className="benchmark-stat-label">Previous close</div>
        <div className="benchmark-stat-value">{price(q, q.prevClose)}</div>
      </div>
    </div>
  );
}

type Outlook = { text: string; loading: boolean; error?: string };

export function OilPricePanel() {
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["oil-prices"],
    queryFn: () => getOilPricesFn(),
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const [selected, setSelected] = useState<string | null>(null);
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
  const quotes = data?.quotes ?? [];
  const q = quotes.find((quote) => quote.symbol === selected) ?? quotes[0];
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
    <div className="benchmark-inner">
      <MotionReveal as="header" className="benchmark-header">
        <div>
          <h2 id="markets-title">Crude oil, S&amp;P 500 and natural gas prices in real time</h2>
          <p>
            Live benchmark markets that move biofuel economics: 30-day trend, daily change and last
            close for each.
          </p>
        </div>
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
      </MotionReveal>
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
      {q && (
        <div className="benchmark-layout">
          <div className="benchmark-cards" role="group" aria-label="Choose a benchmark">
            {quotes.map((quote) => (
              <MarketCard
                key={quote.symbol}
                q={quote}
                active={q.symbol === quote.symbol}
                onSelect={() => {
                  if (q.symbol !== quote.symbol) {
                    setSelected(quote.symbol);
                    setOutlookOpen(false);
                  }
                }}
              />
            ))}
          </div>
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
                    "benchmark-trend " + (trend !== null && trend < 0 ? "negative" : "positive")
                  }
                >
                  {trend === null ? "—" : percent(trend)} 30D
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
              <MarketChart q={q} />
              <MarketStats q={q} />
            </div>
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
                  AI-generated from the 30-day price series shown above. May contain errors — always
                  cross-verify before acting.
                </small>
              </div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
