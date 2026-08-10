import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, TrendingDown, TrendingUp } from "lucide-react";
import { getOilStocksFn, type OilQuote } from "@/lib/oil.functions";

const COLORS = [
  "var(--primary)",
  "var(--accent)",
  "var(--signal)",
  "var(--primary-glow)",
  "var(--muted-foreground)",
];

const fmt = (n: number, d = 2) =>
  n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

export function OilStocksPanel() {
  const [hover, setHover] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["oil-stocks"],
    queryFn: () => getOilStocksFn(),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  });

  const quotes: OilQuote[] = data?.quotes ?? [];
  const max = Math.max(1, ...quotes.map((q) => q.price));
  const ticks = [1, 0.75, 0.5, 0.25, 0];

  return (
    <div className="glass-panel rise lg:col-span-2 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
            <Building2 className="size-4 text-primary" />
            Top 10 oil companies by NYSE stock price
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Live last-traded share price for the largest NYSE-listed oil &amp; gas majors, ranked
            high to low. Hover a column for the exact price and daily move.
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
          <div className="flex gap-2">
            <div
              className="flex w-14 shrink-0 flex-col justify-between text-right font-mono text-[10px] text-muted-foreground tabular-nums"
              style={{ height: 220 }}
              aria-hidden
            >
              {ticks.map((t) => (
                <span key={t}>${fmt(max * t, 0)}</span>
              ))}
            </div>
            <div className="relative min-w-0 flex-1" style={{ height: 220 }}>
              <div
                className="pointer-events-none absolute inset-0 flex flex-col justify-between"
                aria-hidden
              >
                {ticks.map((t) => (
                  <div key={t} className="border-t border-border/60" />
                ))}
              </div>
              <div className="relative flex h-full items-end gap-1.5 sm:gap-2.5">
                {quotes.map((q, idx) => {
                  const color = COLORS[idx % COLORS.length]!;
                  const active = hover === q.symbol;
                  const up = q.changePct >= 0;
                  return (
                    <div
                      key={q.symbol}
                      className="relative flex h-full min-w-0 flex-1 cursor-default flex-col items-center justify-end"
                      onMouseEnter={() => setHover(q.symbol)}
                      onMouseLeave={() => setHover((h) => (h === q.symbol ? null : h))}
                      onFocus={() => setHover(q.symbol)}
                      onBlur={() => setHover(null)}
                      tabIndex={0}
                      role="img"
                      aria-label={`${q.label} (${q.symbol}): $${fmt(q.price)}, ${q.changePct.toFixed(2)}% today`}
                    >
                      {active ? (
                        <div className="pointer-events-none absolute bottom-full z-20 mb-1 w-max max-w-[200px] rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-left shadow-lg">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                            <span
                              className="inline-block size-2 rounded-full"
                              style={{ background: color }}
                            />
                            {q.label} · {q.symbol}
                          </div>
                          <div className="font-mono text-[11px] tabular-nums">${fmt(q.price)}</div>
                          <div
                            className={`font-mono text-[10px] tabular-nums ${
                              up ? "text-signal" : "text-destructive"
                            }`}
                          >
                            {up ? "+" : ""}
                            {fmt(q.change)} ({up ? "+" : ""}
                            {q.changePct.toFixed(2)}%) today
                          </div>
                        </div>
                      ) : null}
                      <span className="mb-1 font-mono text-[10px] tabular-nums">
                        ${fmt(q.price, 0)}
                      </span>
                      <div
                        className="w-full rounded-t-md transition-all duration-300"
                        style={{
                          height: `${Math.max((q.price / max) * 88, 2)}%`,
                          background: `linear-gradient(180deg, ${color}, color-mix(in oklch, ${color} 55%, transparent))`,
                          outline: active ? `2px solid ${color}` : "none",
                          opacity: hover && !active ? 0.45 : 1,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-2 flex gap-2 border-t border-border pt-2 sm:gap-2.5">
            <div className="w-14 shrink-0" aria-hidden />
            {quotes.map((q) => {
              const up = q.changePct >= 0;
              return (
                <div
                  key={q.symbol}
                  className={`min-w-0 flex-1 text-center transition-opacity ${
                    hover && hover !== q.symbol ? "opacity-50" : "opacity-100"
                  }`}
                >
                  <div className="truncate text-[11px] font-semibold leading-tight" title={q.label}>
                    {q.symbol}
                  </div>
                  <div
                    className={`inline-flex items-center gap-0.5 font-mono text-[10px] tabular-nums ${
                      up ? "text-signal" : "text-destructive"
                    }`}
                  >
                    {up ? (
                      <TrendingUp className="size-2.5" />
                    ) : (
                      <TrendingDown className="size-2.5" />
                    )}
                    {q.changePct.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-border pt-3">
            {quotes.map((q, idx) => (
              <button
                key={q.symbol}
                type="button"
                onMouseEnter={() => setHover(q.symbol)}
                onMouseLeave={() => setHover(null)}
                className={`flex items-center gap-1.5 text-[11px] transition-opacity ${
                  hover && hover !== q.symbol ? "opacity-45" : "opacity-100"
                }`}
              >
                <span
                  className="inline-block size-2.5 rounded-sm"
                  style={{ background: COLORS[idx % COLORS.length] }}
                />
                <span className="max-w-[150px] truncate">{q.label}</span>
                <span className="font-mono text-muted-foreground tabular-nums">
                  ${fmt(q.price)}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
        Share price alone does not rank company size — it reflects price per share, not market
        capitalisation. Quotes refresh every 5 minutes and may lag the exchange.
      </p>
    </div>
  );
}
