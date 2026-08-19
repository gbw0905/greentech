import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { NewsTarget } from "@/lib/open-news";

/** Shared number formatter for every chart in the app. */
export const chartFmt = (n: number, d = 0) =>
  n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

export type ChartItem = {
  key: string;
  /** Primary row label (entity name). */
  label: string;
  /** Small muted second line. */
  sub?: string;
  value: number;
  /** Optional right-hand secondary figure (already formatted). */
  meta?: string;
  /** Optional tone for the value text: default | up | down. */
  tone?: "default" | "up" | "down";
};

/**
 * The single bar chart used by every panel: identical row height, bar colour,
 * fonts, gridlines and axis labels so no two graphs look different.
 */
export function ChartBars({
  items,
  unitLabel,
  yLabel,
  format,
  news,
  onSelect,
  metaHeader,
}: {
  items: ChartItem[];
  unitLabel: string;
  yLabel: string;
  format: (n: number) => string;
  news?: Record<string, NewsTarget>;
  onSelect?: (t: NewsTarget) => void;
  metaHeader?: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(...items.map((i) => i.value), 1);
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div>
      {/* header row: axis ticks */}
      <div className="flex items-end gap-2 pb-1 sm:gap-3">
        <div className="w-[7.5rem] shrink-0 sm:w-[13.5rem]">
          <span className="chart-axis uppercase tracking-[0.1em]">{yLabel}</span>
        </div>
        <div className="relative h-4 min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-0 flex justify-between">
            {ticks.map((t) => (
              <span
                key={t}
                className={`chart-axis ${t !== 0 && t !== 1 ? "hidden sm:inline" : ""}`}
              >
                {format(max * t)}
              </span>
            ))}
          </div>
        </div>
        <div className="w-[4rem] shrink-0 text-right sm:w-[5.5rem]">
          <span className="chart-axis uppercase tracking-[0.1em]">{metaHeader ?? ""}</span>
        </div>
      </div>

      <div className="relative">
        {/* gridlines */}
        <div
          className="pointer-events-none absolute inset-y-0 left-[8.25rem] right-[4.75rem] flex justify-between sm:left-[14.25rem] sm:right-[6.25rem]"
          aria-hidden
        >
          {ticks.map((t) => (
            <div key={t} className="w-px bg-border/50" />
          ))}
        </div>

        <div className="flex flex-col">
          {items.map((item, idx) => {
            const target = news?.[item.key];
            const active = hover === item.key;
            const widthPct = Math.max((item.value / max) * 100, 1.5);
            return (
              <div
                key={item.key}
                role={target ? "button" : undefined}
                tabIndex={target ? 0 : -1}
                onClick={target ? () => onSelect?.(target) : undefined}
                onKeyDown={
                  target
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") onSelect?.(target);
                      }
                    : undefined
                }
                onMouseEnter={() => setHover(item.key)}
                onMouseLeave={() => setHover((h) => (h === item.key ? null : h))}
                className={`flex items-center gap-2 sm:gap-3 border-b border-border/40 py-1.5 transition-colors ${
                  target ? "cursor-pointer" : ""
                } ${active ? "bg-foreground/[0.04]" : ""}`}
                aria-label={`${item.label}: ${format(item.value)} ${unitLabel}`}
              >
                <div className="flex w-[7.5rem] shrink-0 items-baseline gap-2 sm:w-[13.5rem]">
                  <span className="chart-axis w-5 shrink-0 text-right">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="chart-label truncate text-foreground" title={item.label}>
                      {item.label}
                    </div>
                    {item.sub ? (
                      <div className="chart-sub truncate" title={item.sub}>
                        {item.sub}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="relative min-w-0 flex-1">
                  <div className="h-3 w-full rounded-sm bg-surface-2">
                    <div
                      className="h-3 rounded-sm bg-chart-2 transition-[width,opacity] duration-300"
                      style={{
                        width: `${widthPct}%`,
                        opacity: hover && !active ? 0.45 : 1,
                      }}
                    />
                  </div>
                </div>

                <div className="w-[4rem] shrink-0 text-right sm:w-[5.5rem]">
                  <div className="chart-value text-foreground">{format(item.value)}</div>
                  {item.meta ? (
                    <div
                      className={`chart-sub font-mono tabular-nums ${
                        item.tone === "up"
                          ? "text-primary"
                          : item.tone === "down"
                            ? "text-destructive"
                            : ""
                      }`}
                    >
                      {item.meta}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="chart-axis mt-2 flex flex-wrap gap-x-4 gap-y-1">
        <span>X axis: {unitLabel}</span>
        <span>Y axis: {yLabel} (ranked, highest first)</span>
      </div>
    </div>
  );
}

/** Identical frame (title, blurb, measure select, footnote) for every graph. */
export function ChartHeat({
  items,
  unitLabel,
  format,
  news,
  onSelect,
}: {
  items: ChartItem[];
  unitLabel: string;
  format: (n: number) => string;
  news?: Record<string, NewsTarget>;
  onSelect?: (t: NewsTarget) => void;
}) {
  const values = items.map((i) => i.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const intensity = (v: number) => 0.12 + ((v - min) / span) * 0.88;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {items.map((item) => {
          const target = news?.[item.key];
          const a = intensity(item.value);
          return (
            <div
              key={item.key}
              role={target ? "button" : undefined}
              tabIndex={target ? 0 : -1}
              onClick={target ? () => onSelect?.(target) : undefined}
              onKeyDown={
                target
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") onSelect?.(target);
                    }
                  : undefined
              }
              title={`${item.label}: ${format(item.value)} ${unitLabel}`}
              aria-label={`${item.label}: ${format(item.value)} ${unitLabel}`}
              className={`rounded-sm border border-border/60 p-2.5 transition-transform hover:-translate-y-0.5 ${
                target ? "cursor-pointer" : ""
              }`}
              style={{
                backgroundColor: `color-mix(in srgb, var(--chart-2) ${Math.round(a * 100)}%, var(--surface-2))`,
              }}
            >
              <div className="chart-label truncate text-foreground" title={item.label}>
                {item.label}
              </div>
              {item.sub ? <div className="chart-sub truncate">{item.sub}</div> : null}
              <div className="chart-value mt-1.5 text-foreground">{format(item.value)}</div>
              {item.meta ? (
                <div
                  className={`chart-sub font-mono tabular-nums ${
                    item.tone === "up"
                      ? "text-primary"
                      : item.tone === "down"
                        ? "text-destructive"
                        : ""
                  }`}
                >
                  {item.meta}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="chart-axis mt-3 flex flex-wrap items-center gap-2">
        <span>{format(min)}</span>
        <span
          className="h-2 w-28 rounded-sm border border-border/60"
          style={{
            background:
              "linear-gradient(to right, color-mix(in srgb, var(--chart-2) 12%, var(--surface-2)), var(--chart-2))",
          }}
          aria-hidden
        />
        <span>{format(max)}</span>
        <span className="ml-1">Colour scale: {unitLabel}</span>
      </div>
    </div>
  );
}

/** Identical frame (title, blurb, measure select, footnote) for every graph. */
export function ChartPanel({
  icon: Icon,
  title,
  blurb,
  metricLabel = "Measure",
  metricValue,
  metricOptions,
  onMetricChange,
  status,
  footnote,
  children,
}: {
  icon: LucideIcon;
  title: string;
  blurb: string;
  metricLabel?: string;
  metricValue?: string;
  metricOptions?: { value: string; label: string }[];
  onMetricChange?: (v: string) => void;
  status?: string;
  footnote?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-panel rise flex h-full flex-col p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground">
            <Icon className="size-5 text-primary" />
            {title}
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{blurb}</p>
        </div>
        {metricOptions ? (
          <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-auto sm:items-end">
            <label className="flex min-w-0 items-center gap-2">
              <span className="label-mono shrink-0 text-muted-foreground">{metricLabel}</span>
              <select
                className="chart-select min-w-0 max-w-full flex-1 sm:flex-none"
                value={metricValue}
                onChange={(e) => onMetricChange?.(e.target.value)}
                aria-label={`Choose the value shown in the ${title} chart`}
              >
                {metricOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            {status ? <span className="label-mono text-muted-foreground">{status}</span> : null}
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1">{children}</div>

      {footnote ? (
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">{footnote}</p>
      ) : null}
    </div>
  );
}
