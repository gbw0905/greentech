import {
  COMPANY_PLACEHOLDER,
  companyNameLogo,
  domainForName,
  domainIcon,
} from "@/features/markets/entity-logos";
import { cloneElement, isValidElement, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { Link } from "@tanstack/react-router";
import { REFERENCE_NOTE, sourcesFor } from "@/shared/data/data-sources";
import { certificationLabel } from "@/features/markets/certifications";
import { datasetFor } from "@/shared/data/provenance";

import { useIsMobile } from "@/shared/hooks/use-mobile";
import type { LucideIcon } from "lucide-react";
import type { NewsTarget } from "@/features/markets/open-news";
import {
  ResponsiveContainer,
  ScatterChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Scatter,
  ReferenceLine,
  ReferenceDot,
  LineChart,
  Line,
} from "recharts";
import { panelTrend, totalSeries } from "@/features/markets/history-series";
import {
  ChartSummaryAssistant,
  type ChartSummaryPayload,
} from "@/features/chart-summary/components/ChartSummaryAssistant";

/**
 * Download & share actions for every panel: the panel's own export button
 * (passed as children) plus the shared "Email summary" action. PanelShell
 * injects `portalTarget` via cloneElement; both buttons forward their
 * sign-in / email form there so it renders inside the panel, not the toolbar.
 */
export function PanelActions({
  children,
  summaryBuild,
  disabled,
  portalTarget,
}: {
  children: React.ReactNode;
  summaryBuild: () => ChartSummaryPayload;
  disabled?: boolean;
  portalTarget?: HTMLElement | null;
}) {
  return (
    <>
      {isValidElement(children)
        ? cloneElement(children as ReactElement<{ portalTarget?: HTMLElement | null }>, {
            portalTarget: portalTarget ?? null,
          })
        : children}
      <ChartSummaryAssistant
        build={summaryBuild}
        {...(disabled !== undefined ? { disabled } : {})}
        {...(portalTarget ? { portalTarget } : {})}
      />
    </>
  );
}

/** Build the email-summary payload for a panel's current view from its chart items. */
export function summaryOf(opts: {
  panel: string;
  measureLabel: string;
  unit: string;
  /** Raw active filter values; falsy entries are dropped. */
  filters?: (string | null | undefined)[];
  items: ChartItem[];
  total: number;
}): ChartSummaryPayload {
  const fl = (opts.filters ?? []).filter(Boolean).join(" · ");
  return {
    panel: opts.panel,
    measureLabel: opts.measureLabel,
    unit: opts.unit,
    filterLabel: fl || "None (full dataset)",
    shown: opts.items.length,
    total: opts.total,
    rows: opts.items.map((i) => ({
      label: i.label,
      sub: i.sub,
      value: i.value,
      changePct: i.changePct,
    })),
  };
}

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
  /** Optional 1-day price move in percent, used for the trend layer. */
  changePct?: number | undefined;
  /** Optional brand logo URL, rendered in heat-map tiles. */
  logo?: string | undefined;
};

/** Small brand mark rendered inside a heat-map tile. */
function TileLogo({ src, alt, size }: { src: string; alt: string; size: number }) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const domain = domainForName(alt);
  const candidates = [
    src,
    companyNameLogo(alt),
    domain ? domainIcon(domain) : undefined,
    COMPANY_PLACEHOLDER,
  ];
  const current =
    candidates.find(
      (candidate): candidate is string => !!candidate && !failedSources.includes(candidate),
    ) ?? COMPANY_PLACEHOLDER;
  const placeholder = current === COMPANY_PLACEHOLDER;
  return (
    <img
      src={current}
      alt={placeholder ? `${alt}: logo unavailable` : `${alt} logo`}
      title={alt}
      loading="lazy"
      onError={() =>
        setFailedSources((previous) =>
          previous.includes(current) ? previous : [...previous, current],
        )
      }
      className="shrink-0 rounded-sm bg-white/90 object-contain p-0.5 shadow-sm"
      style={{ width: size, height: size }}
    />
  );
}

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
                onClick={
                  target
                    ? (event) => {
                        event.currentTarget.focus({ preventScroll: true });
                        onSelect?.(target);
                      }
                    : undefined
                }
                onKeyDown={
                  target
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelect?.(target);
                        }
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

/** The four chart types every Supply & producers panel offers. */
export const PANEL_VIEWS = [
  { value: "heat", label: "Heat map" },
  { value: "line", label: "Trend line (2000–2026)" },
  { value: "map", label: "Location map" },
  { value: "table", label: "Data table" },
];

export type PanelView = "heat" | "scatter" | "bars" | "line" | "map" | "table";

/** Vivid, clearly separated RGB palette so trend lines never blend together. */
const LINE_COLORS = [
  "rgb(220, 38, 38)", // red
  "rgb(37, 99, 235)", // blue
  "rgb(22, 163, 74)", // green
  "rgb(217, 119, 6)", // amber
  "rgb(147, 51, 234)", // purple
  "rgb(8, 145, 178)", // cyan
  "rgb(219, 39, 119)", // pink
  "rgb(77, 124, 15)", // olive
];

/** Max simultaneous lines in "by region" mode before overlap hurts readability. */
const MAX_TREND_LINES = 6;

/**
 * Yearly trend view, 2000–2026, for the datasets where official agencies
 * publish an annual series. Users can switch between one line per
 * country/region and a single sector-total line.
 */
export function ChartTrend({ panel }: { panel: string }) {
  const [mode, setMode] = useState<"series" | "total">("series");
  const trend = panelTrend(panel);

  if (!trend) {
    return (
      <p className="text-sm text-muted-foreground">
        No official body publishes a consistent yearly series for this dataset, so there is no
        2000–2026 trend to show. The other views use the latest verified snapshot instead.
      </p>
    );
  }

  // In "by region" mode keep only the strongest lines (ranked by their latest
  // value) so the chart stays readable instead of a tangle of overlapping
  // lines. "Sector total" is always a single line.
  const rankedSeries = [...trend.series].sort(
    (a, b) => (b.points.at(-1)?.value ?? 0) - (a.points.at(-1)?.value ?? 0),
  );
  const capped = rankedSeries.length > MAX_TREND_LINES;
  const series = mode === "total" ? [totalSeries(trend)] : rankedSeries.slice(0, MAX_TREND_LINES);
  const years = Array.from(new Set(series.flatMap((sr) => sr.points.map((p) => p.year)))).sort(
    (a, b) => a - b,
  );
  const rows = years.map((year) => {
    const row: Record<string, number | null> = { year };
    for (const sr of series) row[sr.key] = sr.points.find((p) => p.year === year)?.value ?? null;
    return row;
  });

  return (
    <div className="min-w-0">
      <div
        className="chart-trend-tabs mb-5 flex w-fit flex-wrap items-center gap-1 rounded-xl border border-border bg-surface-2 p-1"
        role="group"
        aria-label="Trend grouping"
      >
        {(["series", "total"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              mode === m
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-white/60"
            }`}
          >
            {m === "series" ? "By country / region" : "Sector total"}
          </button>
        ))}
      </div>

      <div className="h-[22rem] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 12, right: 12, bottom: 24, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 14 }}
              stroke="var(--muted-foreground)"
              tickLine={false}
              label={{ value: "Year", position: "insideBottom", offset: -14, fontSize: 14 }}
            />
            <YAxis
              tick={{ fontSize: 14 }}
              stroke="var(--muted-foreground)"
              tickLine={false}
              axisLine={false}
              width={56}
              label={{ value: trend.unit, angle: -90, position: "insideLeft", fontSize: 14 }}
            />
            <Tooltip
              formatter={(v: number | string, n: string) => [chartFmt(Number(v), 1), n]}
              labelFormatter={(l) => `Year ${l}`}
              contentStyle={{ fontSize: 14 }}
            />
            {series.map((sr, i) => (
              <Line
                key={sr.key}
                type="monotone"
                dataKey={sr.key}
                name={sr.label}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={mode === "total" ? 2.5 : 1.8}
                strokeOpacity={0.95}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul
        className="chart-trend-legend mt-6 mb-3 flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm text-muted-foreground"
        aria-label="Chart series"
      >
        {series.map((sr, index) => (
          <li key={sr.key} className="flex items-center gap-2">
            <span
              className="h-0.5 w-5 rounded-full"
              style={{ background: LINE_COLORS[index % LINE_COLORS.length] }}
              aria-hidden="true"
            />
            {sr.label}
          </li>
        ))}
      </ul>

      <div className="chart-axis mt-2 flex flex-wrap gap-x-4 gap-y-1">
        <span>X axis: Year (2000–2026)</span>
        <span>
          Y axis: {trend.measure} ({trend.unit})
        </span>
      </div>
      <p className="chart-sub mt-1">
        Source: {trend.source}. {trend.note}
        {mode === "series" && capped
          ? ` Showing the top ${MAX_TREND_LINES} of ${rankedSeries.length} regions by latest value to keep the lines readable — switch to “Sector total” for the full aggregate.`
          : ""}
      </p>
    </div>
  );
}

/** Plain ranked table view — same data, same typography, no visual encoding. */
export function ChartTable({
  items,
  measureLabel,
  unitLabel,
  format,
  news,
  onSelect,
  metaHeader = "Market",
  complianceHeader = "Compliance & certification",
}: {
  items: ChartItem[];
  measureLabel: string;
  unitLabel: string;
  format: (n: number) => string;
  news?: Record<string, NewsTarget>;
  onSelect?: (t: NewsTarget) => void;
  metaHeader?: string;
  complianceHeader?: string;
}) {
  return (
    <div className="chart-data-table overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-left">
        <caption className="chart-axis pb-2 text-left">
          {measureLabel} — {unitLabel}
        </caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="chart-axis w-8 py-1.5 uppercase tracking-[0.1em]">
              #
            </th>
            <th scope="col" className="chart-axis py-1.5 uppercase tracking-[0.1em]">
              Entity
            </th>
            <th scope="col" className="chart-axis py-1.5 text-right uppercase tracking-[0.1em]">
              {measureLabel}
            </th>
            <th scope="col" className="chart-axis py-1.5 text-right uppercase tracking-[0.1em]">
              {metaHeader}
            </th>
            <th scope="col" className="chart-axis py-1.5 pl-4 uppercase tracking-[0.1em]">
              {complianceHeader}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const target = news?.[item.key];
            return (
              <tr
                key={item.key}
                tabIndex={target ? 0 : undefined}
                onKeyDown={
                  target
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onSelect?.(target);
                        }
                      }
                    : undefined
                }
                onClick={
                  target
                    ? (event) => {
                        event.currentTarget.focus({ preventScroll: true });
                        onSelect?.(target);
                      }
                    : undefined
                }
                className={`border-b border-border/50 transition-colors hover:bg-foreground/[0.04] ${
                  target ? "cursor-pointer" : ""
                }`}
              >
                <td className="chart-axis py-1.5 tabular-nums">
                  {String(idx + 1).padStart(2, "0")}
                </td>
                <td className="py-1.5">
                  <div className="flex items-center gap-2">
                    {item.logo ? <TileLogo src={item.logo} alt={item.label} size={16} /> : null}
                    <div className="min-w-0">
                      <div className="chart-label truncate text-foreground">{item.label}</div>
                      {item.sub ? <div className="chart-sub truncate">{item.sub}</div> : null}
                    </div>
                  </div>
                </td>
                <td className="chart-value py-1.5 text-right tabular-nums text-foreground">
                  {format(item.value)}
                </td>
                <td
                  className={`chart-sub py-1.5 text-right font-mono tabular-nums ${
                    item.tone === "up"
                      ? "text-primary"
                      : item.tone === "down"
                        ? "text-destructive"
                        : ""
                  }`}
                >
                  {item.meta ?? "—"}
                </td>
                <td className="chart-sub max-w-56 py-1.5 pl-4 text-muted-foreground">
                  <span className="line-clamp-2">{certificationLabel(item.label)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Blue -> cyan -> green -> yellow -> red RGB ramp, t in [0,1]. */
const RGB_STOPS: Array<[number, number, number]> = [
  [37, 99, 235],
  [6, 182, 212],
  [34, 197, 94],
  [250, 204, 21],
  [239, 68, 68],
];

export function heatColor(t: number) {
  const x = Math.min(Math.max(t, 0), 1) * (RGB_STOPS.length - 1);
  const i = Math.min(Math.floor(x), RGB_STOPS.length - 2);
  const f = x - i;
  const a = RGB_STOPS[i]!;
  const b = RGB_STOPS[i + 1]!;
  const c = a.map((v, k) => Math.round(v + (b[k]! - v) * f));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/** Squarified treemap layout (Bruls/Huizing/van Wijk) in 0..100 percent space. */
type Tile = { key: string; x: number; y: number; w: number; h: number };

function squarify(values: { key: string; value: number }[], W = 100, H = 100): Tile[] {
  const total = values.reduce((s, v) => s + v.value, 0) || 1;
  const items = values.map((v) => ({ key: v.key, area: (v.value / total) * W * H }));
  const out: Tile[] = [];
  let x = 0,
    y = 0,
    w = W,
    h = H;
  let i = 0;
  while (i < items.length) {
    const short = Math.min(w, h);
    const row: typeof items = [];
    let rowArea = 0;
    // Worst aspect ratio of the row if it also contained `extra` area.
    const worst = (extra: number) => {
      const areas = extra > 0 ? [...row.map((r) => r.area), extra] : row.map((r) => r.area);
      const total2 = areas.reduce((s, a) => s + a, 0);
      if (!total2 || !areas.length) return Infinity;
      const thickness = total2 / short;
      let bad = 0;
      for (const a of areas) {
        const len = a / thickness;
        bad = Math.max(bad, Math.max(thickness / len, len / thickness));
      }
      return bad;
    };
    while (i < items.length) {
      const next = items[i]!;
      if (row.length && worst(next.area) > worst(0)) break;
      row.push(next);
      rowArea += next.area;
      i += 1;
    }
    const side = rowArea / short;
    let offset = 0;
    for (const r of row) {
      const len = (r.area / rowArea) * short;
      if (w >= h) {
        out.push({ key: r.key, x, y: y + offset, w: side, h: len });
      } else {
        out.push({ key: r.key, x: x + offset, y, w: len, h: side });
      }
      offset += len;
    }
    if (w >= h) {
      x += side;
      w -= side;
    } else {
      y += side;
      h -= side;
    }
  }
  return out;
}

/** NYSE-style treemap: tile area = value share, colour = RGB heat scale. */
export function ChartHeat({
  items,
  unitLabel,
  format,
  news,
  onSelect,
  measureLabel,
  measureHelp,
  indexLabel,
}: {
  items: ChartItem[];
  unitLabel: string;
  format: (n: number) => string;
  news?: Record<string, NewsTarget>;
  onSelect?: (t: NewsTarget) => void;
  /** Name of the currently selected dropdown measure, e.g. "SAF uplift (Ml/yr)". */
  measureLabel?: string;
  /** Plain-language explanation of what that measure means. */
  measureHelp?: string;
  /** Name of the market index / benchmark the listed entities belong to. */
  indexLabel?: string;
}) {
  const [hover, setHover] = useState<{ key: string; x: number; y: number } | null>(null);
  const isMobile = useIsMobile();
  const values = items.map((i) => i.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const norm = (v: number) => (v - min) / span;
  // Sort largest first; treemaps require descending input.
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const floor = Math.max(max * 0.05, 0.0001); // keep tiny entities legible
  // Lay out in aspect-correct space then scale to percent. Desktop containers
  // are wide (~2.6:1); phones are portrait (~0.8:1), which keeps tiles wide
  // enough for labels and values instead of thin clipped columns.
  const ASPECT = isMobile ? 0.8 : 2.6;
  const tiles = squarify(
    sorted.map((i) => ({ key: i.key, value: Math.max(i.value, floor) })),
    ASPECT,
    1,
  ).map((t) => ({
    ...t,
    x: (t.x / ASPECT) * 100,
    w: (t.w / ASPECT) * 100,
    y: t.y * 100,
    h: t.h * 100,
  }));
  // Compact figures (4.7K, 1.2M) keep small tiles readable on narrow screens.
  const compactFmt = (n: number) =>
    Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);
  const byKey = new Map(sorted.map((i) => [i.key, i]));
  const hovered = hover ? byKey.get(hover.key) : null;

  // Market trend layer: derived from the live 1-day moves attached to items.
  const moves = items
    .map((i) => i.changePct)
    .filter((c): c is number => typeof c === "number" && Number.isFinite(c));
  const up = moves.filter((c) => c > 0).length;
  const down = moves.filter((c) => c < 0).length;
  const avg = moves.length ? moves.reduce((s, c) => s + c, 0) / moves.length : 0;
  const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
  const best = items
    .filter((i) => typeof i.changePct === "number")
    .sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0));

  return (
    <div>
      {moves.length ? (
        <div className="chart-index-strip mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-sm border border-border/60 bg-card p-2.5">
          <span className="chart-sub uppercase tracking-wide text-muted-foreground">
            {indexLabel ? `${indexLabel} · 1-day` : "Market trend (1-day)"}
          </span>
          <span
            className={`chart-index-change chart-value ${avg >= 0 ? "text-primary" : "text-destructive"}`}
            title="Average 1-day share price move across the listed entities shown"
          >
            {avg >= 0 ? "▲" : "▼"} {pct(avg)} avg
          </span>
          <span className="chart-sub text-muted-foreground">
            <span className="chart-index-up text-primary">{up} advancing</span>
            {" · "}
            <span className="chart-index-down text-destructive">{down} declining</span>
            {" · "}
            {moves.length} listed
          </span>
          {best.length ? (
            <span className="chart-sub text-muted-foreground">
              Top: {best[0]!.label} {pct(best[0]!.changePct ?? 0)} · Worst:{" "}
              {best[best.length - 1]!.label} {pct(best[best.length - 1]!.changePct ?? 0)}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="chart-measure-note mb-3 rounded-sm border border-border/60 bg-muted/40 p-2.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="chart-sub uppercase tracking-wide text-muted-foreground">
            Measure shown
          </span>
          <span className="chart-label text-foreground">{measureLabel ?? "Measure"}</span>
          <span className="chart-sub text-muted-foreground">— unit: {unitLabel}</span>
        </div>
        {measureHelp ? (
          <p className="chart-sub mt-1 leading-snug text-muted-foreground">{measureHelp}</p>
        ) : null}
        <p className="chart-sub mt-1 leading-snug text-muted-foreground">
          Tile size and colour both scale with the value ({format(min)} – {format(max)} {unitLabel}
          ). Hover a tile for its own figures.
        </p>
      </div>
      <div
        className="chart-heat-map relative h-[28rem] w-full overflow-hidden rounded-sm border border-border/60 bg-border/40 sm:h-[30rem]"
        onMouseLeave={() => setHover(null)}
      >
        {tiles.map((tile) => {
          const item = byKey.get(tile.key)!;
          const target = news?.[item.key];
          const t = norm(item.value);
          const big = tile.w > 6.5 && tile.h > (isMobile ? 14 : 20);
          const mid = tile.w > 4 && tile.h > (isMobile ? 7 : 11);
          const logoSize = big ? 26 : 16;
          const showLogo = Boolean(item.logo) && tile.w > 3.2 && tile.h > (isMobile ? 6 : 9);
          return (
            <div
              key={tile.key}
              role={target ? "button" : undefined}
              tabIndex={target ? 0 : -1}
              onClick={
                target
                  ? (event) => {
                      event.currentTarget.focus({ preventScroll: true });
                      onSelect?.(target);
                    }
                  : undefined
              }
              onKeyDown={
                target
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect?.(target);
                      }
                    }
                  : undefined
              }
              aria-label={`${item.label}: ${format(item.value)} ${unitLabel}`}
              onMouseMove={(e) => {
                const box = e.currentTarget.parentElement!.getBoundingClientRect();
                setHover({ key: tile.key, x: e.clientX - box.left, y: e.clientY - box.top });
              }}
              className={`chart-heat-tile absolute flex flex-col justify-between overflow-hidden p-1.5 text-white outline-hidden ring-inset transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white ${
                target ? "cursor-pointer" : ""
              }`}
              style={{
                left: `${tile.x}%`,
                top: `${tile.y}%`,
                width: `${tile.w}%`,
                height: `${tile.h}%`,
                backgroundColor: heatColor(t),
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.22)",
              }}
            >
              <div className="flex min-w-0 items-start gap-1.5">
                {showLogo ? <TileLogo src={item.logo!} alt={item.label} size={logoSize} /> : null}
                <div className="min-w-0">
                  <div
                    className="chart-label truncate leading-tight"
                    style={{ fontSize: "0.875rem" }}
                  >
                    {item.label}
                  </div>
                  {big && item.sub ? (
                    <div className="chart-sub truncate text-white/80">{item.sub}</div>
                  ) : null}
                </div>
                {typeof item.changePct === "number" && mid ? (
                  <span
                    className="ml-auto shrink-0 rounded-sm bg-black/25 px-1 font-mono text-[0.875rem] leading-4 tabular-nums text-white"
                    title={`1-day move: ${pct(item.changePct)}`}
                  >
                    {item.changePct >= 0 ? "▲" : "▼"}
                    {big ? ` ${pct(item.changePct)}` : ""}
                  </span>
                ) : null}
              </div>
              {mid ? (
                <div className="min-w-0">
                  <div
                    className="chart-value truncate"
                    style={{ fontSize: big ? "1rem" : "0.875rem" }}
                  >
                    {big ? format(item.value) : compactFmt(item.value)}
                  </div>
                  {big && item.meta ? (
                    <div className="chart-sub truncate font-mono tabular-nums text-white/85">
                      {item.meta}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}

        {hover && hovered ? (
          <div
            className="chart-heat-tooltip pointer-events-none absolute z-30 w-72 max-w-[85%] border border-border bg-card p-4 shadow-lg"
            style={{
              left: `clamp(8px, ${hover.x + 14}px, calc(100% - 19rem))`,
              top: `clamp(8px, ${hover.y + 14}px, calc(100% - 19rem))`,
            }}
          >
            <div className="chart-label text-foreground">{hovered.label}</div>
            {hovered.sub ? (
              <div className="chart-sub mt-0.5 text-muted-foreground">{hovered.sub}</div>
            ) : null}
            <div className="mt-2 border-t border-border/60 pt-2">
              <div className="chart-sub uppercase tracking-wide text-muted-foreground">
                {measureLabel ?? "Measure"}
              </div>
              <div className="chart-value text-foreground">
                {format(hovered.value)}
                <span className="chart-sub ml-1 font-normal text-muted-foreground">
                  {unitLabel}
                </span>
              </div>
              {measureHelp ? (
                <p className="chart-sub mt-1 leading-snug text-muted-foreground">{measureHelp}</p>
              ) : null}
              {hovered.meta ? (
                <div className="chart-sub mt-1 font-mono tabular-nums text-muted-foreground">
                  {hovered.meta}
                </div>
              ) : null}
              {typeof hovered.changePct === "number" ? (
                <div
                  className={`chart-sub mt-1 font-mono tabular-nums ${
                    hovered.changePct >= 0 ? "text-primary" : "text-destructive"
                  }`}
                >
                  {hovered.changePct >= 0 ? "▲" : "▼"} {pct(hovered.changePct)} today
                  {" · "}
                  {hovered.changePct >= 0 ? "rising" : "falling"} vs previous close
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="chart-heat-legend chart-axis mt-3 flex flex-wrap items-center gap-2">
        <span>{format(min)}</span>
        <span
          className="h-2 w-28 rounded-sm border border-border/60"
          style={{
            background: `linear-gradient(to right, ${heatColor(0)}, ${heatColor(0.25)}, ${heatColor(0.5)}, ${heatColor(0.75)}, ${heatColor(1)})`,
          }}
          aria-hidden
        />
        <span>{format(max)}</span>
        <span className="ml-1">Colour and tile size: {unitLabel}</span>
      </div>
    </div>
  );
}
export type ScatterPoint = {
  key: string;
  label: string;
  sub?: string | undefined;
  x: number;
  y: number;
  size: number;
  /** Group name used for color (usually country or region). */
  group: string;
  logo?: string | undefined;
  meta?: string | undefined;
  changePct?: number | undefined;
  newsTarget?: NewsTarget | undefined;
};

/** Deterministic, readable color for a group name. */
const GROUP_COLORS = [
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

function groupColor(group: string) {
  let h = 0;
  for (let i = 0; i < group.length; i += 1) h = (h << 5) - h + group.charCodeAt(i);
  return GROUP_COLORS[Math.abs(h) % GROUP_COLORS.length];
}

/** Linear regression (least squares) through points. */
function regression(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return null;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;
  const m = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - m * sumX) / n;
  return { m, b };
}

function corrCoeff(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return null;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const sumYY = points.reduce((s, p) => s + p.y * p.y, 0);
  const denom = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  if (denom === 0) return null;
  return (n * sumXY - sumX * sumY) / denom;
}

/**
 * Dual-metric scatter plot with bubble size and a trend/regression line.
 * Useful for showing market-vs-sustainability relationships (e.g. share price vs SAF use).
 */
export function ChartScatter({
  points,
  xAxis,
  yAxis,
  sizeAxis,
  formatX,
  formatY,
  formatSize,
  onSelect,
  indexLabel,
}: {
  points: ScatterPoint[];
  xAxis: { label: string; unit: string; help?: string };
  yAxis: { label: string; unit: string; help?: string };
  sizeAxis: { label: string; unit: string; help?: string };
  formatX: (n: number) => string;
  formatY: (n: number) => string;
  formatSize?: (n: number) => string;
  onSelect?: (target: NewsTarget) => void;
  indexLabel?: string;
}) {
  const isMobile = useIsMobile();
  const data = useMemo(() => points, [points]);

  const xs = data.map((d) => d.x);
  const ys = data.map((d) => d.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xPad = Math.max((xMax - xMin) * 0.08, Math.abs(xMax) * 0.02, 1e-6);
  const yPad = Math.max((yMax - yMin) * 0.08, Math.abs(yMax) * 0.02, 1e-6);
  const xDomain = [xMin - xPad, xMax + xPad];
  const yDomain = [Math.max(0, yMin - yPad), yMax + yPad];

  const reg = regression(data);
  const r = corrCoeff(data);
  const trendDomain: [number, number] | null = reg
    ? ([xMin - xPad, xMax + xPad] as [number, number])
    : null;
  const trendY = (x: number) => reg!.m * x + reg!.b;

  const groups = [...new Set(data.map((d) => d.group))].sort();
  const groupMap = Object.fromEntries(groups.map((g) => [g, groupColor(g)]));

  const moves = data
    .map((d) => d.changePct)
    .filter((c): c is number => typeof c === "number" && Number.isFinite(c));
  const avgMove = moves.length ? moves.reduce((s, c) => s + c, 0) / moves.length : 0;
  const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { payload?: ScatterPoint }[];
  }) => {
    const p = payload?.[0]?.payload;
    if (!active || !p) return null;
    return (
      <div className="rounded-sm border border-border bg-card p-3 shadow-lg">
        <div className="chart-label text-foreground">{p.label}</div>
        {p.sub ? <div className="chart-sub mt-0.5 text-muted-foreground">{p.sub}</div> : null}
        <div className="mt-2 border-t border-border/60 pt-2 space-y-1">
          <div className="flex justify-between gap-4">
            <span className="chart-sub text-muted-foreground">{xAxis.label}</span>
            <span className="chart-value text-foreground">{formatX(p.x)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="chart-sub text-muted-foreground">{yAxis.label}</span>
            <span className="chart-value text-foreground">{formatY(p.y)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="chart-sub text-muted-foreground">{sizeAxis.label}</span>
            <span className="chart-value text-foreground">
              {formatSize ? formatSize(p.size) : formatY(p.size)}
            </span>
          </div>
          {typeof p.changePct === "number" ? (
            <div
              className={`chart-sub font-mono tabular-nums ${p.changePct >= 0 ? "text-primary" : "text-destructive"}`}
            >
              {p.changePct >= 0 ? "▲" : "▼"} {pct(p.changePct)} today
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div>
      {moves.length ? (
        <div className="chart-index-strip mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-sm border border-border/60 bg-card p-2.5">
          <span className="chart-sub uppercase tracking-wide text-muted-foreground">
            {indexLabel ? `${indexLabel} · 1-day` : "Market trend (1-day)"}
          </span>
          <span
            className={`chart-value ${avgMove >= 0 ? "text-primary" : "text-destructive"}`}
            title="Average 1-day share price move across the listed entities shown"
          >
            {avgMove >= 0 ? "▲" : "▼"} {pct(avgMove)} avg
          </span>
          {reg && r !== null ? (
            <span className="chart-sub text-muted-foreground">
              Trend slope: {reg.m >= 0 ? "+" : ""}
              {reg.m.toExponential(2)} · R² {(r * r).toFixed(2)}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mb-3 rounded-sm border border-border/60 bg-muted/40 p-2.5 space-y-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="chart-sub uppercase tracking-wide text-muted-foreground">X axis</span>
          <span className="chart-label text-foreground">{xAxis.label}</span>
          <span className="chart-sub text-muted-foreground">— {xAxis.unit}</span>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="chart-sub uppercase tracking-wide text-muted-foreground">Y axis</span>
          <span className="chart-label text-foreground">{yAxis.label}</span>
          <span className="chart-sub text-muted-foreground">— {yAxis.unit}</span>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="chart-sub uppercase tracking-wide text-muted-foreground">
            Bubble size
          </span>
          <span className="chart-label text-foreground">{sizeAxis.label}</span>
          <span className="chart-sub text-muted-foreground">— {sizeAxis.unit}</span>
        </div>
        {xAxis.help ? (
          <p className="chart-sub leading-snug text-muted-foreground">{xAxis.help}</p>
        ) : null}
        {yAxis.help ? (
          <p className="chart-sub leading-snug text-muted-foreground">{yAxis.help}</p>
        ) : null}
      </div>

      <div className="h-[22rem] w-full min-w-0 overflow-hidden rounded-sm border border-border/60 bg-card p-1.5 sm:h-[26rem] lg:h-[30rem]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={
              isMobile
                ? { top: 8, right: 8, bottom: 32, left: 0 }
                : { top: 10, right: 20, bottom: 40, left: 10 }
            }
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis
              type="number"
              dataKey="x"
              name={xAxis.label}
              domain={xDomain as [number, number]}
              tickFormatter={formatX}
              stroke="var(--muted-foreground)"
              tick={{ fill: "var(--muted-foreground)", fontSize: 14 }}
              label={{
                value: `${xAxis.label} (${xAxis.unit})`,
                position: "insideBottom",
                offset: isMobile ? -18 : -25,
                fill: "var(--foreground)",
                fontSize: 14,
                fontWeight: 600,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yAxis.label}
              domain={yDomain as [number, number]}
              tickFormatter={formatY}
              stroke="var(--muted-foreground)"
              tick={{ fill: "var(--muted-foreground)", fontSize: 14 }}
              {...(isMobile
                ? {}
                : {
                    label: {
                      value: `${yAxis.label} (${yAxis.unit})`,
                      angle: -90,
                      position: "insideLeft",
                      fill: "var(--foreground)",
                      fontSize: 14,
                      fontWeight: 600,
                    },
                  })}
            />
            <ZAxis type="number" dataKey="size" range={isMobile ? [24, 160] : [60, 600]} />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
            />
            {groups.map((g) => (
              <Scatter
                key={g}
                name={g}
                data={data.filter((d) => d.group === g)}
                fill={groupMap[g]}
                stroke="var(--card-foreground)"
                strokeWidth={1}
                onClick={(p) => p?.newsTarget && onSelect?.(p.newsTarget)}
              />
            ))}
            {trendDomain && (
              <>
                {(() => {
                  const [x0, x1] = trendDomain;
                  return (
                    <ReferenceLine
                      segment={[
                        { x: x0, y: trendY(x0) },
                        { x: x1, y: trendY(x1) },
                      ]}
                      stroke="var(--primary)"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                    />
                  );
                })()}
              </>
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-axis mt-3 flex flex-wrap items-center gap-3">
        <span className="text-muted-foreground">Color = country/region</span>
        <div className="flex flex-wrap gap-2">
          {groups.slice(0, isMobile ? 5 : 10).map((g) => (
            <span key={g} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ background: groupMap[g] }}
              />
              <span>{g}</span>
            </span>
          ))}
          {groups.length > (isMobile ? 5 : 10) ? (
            <span className="text-muted-foreground">
              +{groups.length - (isMobile ? 5 : 10)} more
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ChartPanel({
  icon: Icon,
  title,
  blurb,
  metricLabel = "Measure",
  metricValue,
  metricOptions,
  onMetricChange,
  limitValue,
  limitOptions,
  onLimitChange,
  viewValue,
  viewOptions,
  onViewChange,
  viewLabel = "View",
  status,
  footnote,
  sourceMeta,
  filters,
  actions,

  children,
}: {
  icon: LucideIcon;
  title: string;
  blurb: string;
  metricLabel?: string;
  metricValue?: string;
  metricOptions?: { value: string; label: string }[];
  onMetricChange?: (v: string) => void;
  /** Optional "how many entities to show" control, e.g. Top 10 / Top 20 / All. */
  limitValue?: string;
  limitOptions?: { value: string; label: string }[];
  onLimitChange?: (v: string) => void;
  /** Optional chart-type switcher, e.g. Heat map / Scatter. */
  viewValue?: string;
  viewOptions?: { value: string; label: string }[];
  onViewChange?: (v: string) => void;
  viewLabel?: string;
  status?: string;
  footnote?: string;
  sourceMeta?: React.ReactNode;
  /** Optional buttons (e.g. export) rendered in the header. */
  actions?: React.ReactNode;
  /** Optional filter/search bar rendered between the header and the chart. */
  filters?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [panelNode, setPanelNode] = useState<HTMLDivElement | null>(null);
  return (
    <div className="dataset-chart-panel glass-panel rise flex h-full flex-col p-5">
      <div className="dataset-panel-heading mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="dataset-panel-title flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground">
            <Icon className="size-5 text-primary" />
            {title}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{blurb}</p>
        </div>
        {status ? <span className="label-mono text-muted-foreground">{status}</span> : null}
      </div>

      {metricOptions || limitOptions || viewOptions || actions || filters ? (
        <div className="dataset-toolbar mb-3 flex flex-col gap-3 rounded-md border border-border bg-surface-2/60 p-3">
          <div className="dataset-filter-row grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap">
            {filters
              ? isValidElement(filters)
                ? cloneElement(filters as ReactElement<{ bare?: boolean }>, { bare: true })
                : filters
              : null}
            {viewOptions ? (
              <label className="dataset-field order-2 flex min-w-0 flex-col gap-1.5 sm:min-w-40 sm:flex-1 xl:w-auto xl:flex-none">
                <span className="label-mono text-muted-foreground">{viewLabel}</span>
                <select
                  className="chart-select h-10 w-full min-w-0 xl:w-44"
                  value={viewValue}
                  onChange={(e) => onViewChange?.(e.target.value)}
                  aria-label={`Choose the chart type for ${title}`}
                >
                  {viewOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {metricOptions ? (
              <label className="dataset-field order-3 flex min-w-0 flex-col gap-1.5 sm:min-w-40 sm:flex-1 xl:w-auto xl:flex-none">
                <span className="label-mono text-muted-foreground">{metricLabel}</span>
                <select
                  className="chart-select h-10 w-full min-w-0 xl:min-w-52"
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
            ) : null}
            {limitOptions ? (
              <label className="dataset-field order-4 flex min-w-0 flex-col gap-1.5 sm:min-w-40 sm:flex-1 xl:w-auto xl:flex-none">
                <span className="label-mono text-muted-foreground">Show</span>
                <select
                  className="chart-select h-10 w-full min-w-0 xl:w-40"
                  value={limitValue}
                  onChange={(e) => onLimitChange?.(e.target.value)}
                  aria-label={`Choose how many entities the ${title} chart shows`}
                >
                  {limitOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          {actions ? (
            <div className="dataset-actions grid grid-cols-2 items-center gap-2 border-t border-border/70 pt-3 sm:flex sm:justify-end [&>button]:h-10 [&>button]:w-full [&>button]:justify-center sm:[&>button]:w-auto">
              {actions
                ? isValidElement(actions)
                  ? cloneElement(actions as ReactElement<{ portalTarget?: HTMLElement | null }>, {
                      portalTarget: panelNode,
                    })
                  : actions
                : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div ref={setPanelNode} className="dataset-action-feedback relative" />

      <div className="min-h-0 flex-1">
        <div key={viewValue ?? "default"} className="view-swap h-full">
          {children}
        </div>
      </div>

      {footnote ? (
        <p className="dataset-footnote mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          {footnote}
        </p>
      ) : null}

      {sourceMeta}

      {title ? (
        <>
          {datasetFor(title) ? (
            <p className="dataset-provenance label-mono mt-2 text-xs text-muted-foreground">
              Figures as reported for {datasetFor(title)!.reportingYear} · last reviewed{" "}
              {datasetFor(title)!.lastReviewed} ·{" "}
              <Link
                to="/data-sources"
                hash={datasetFor(title)!.id}
                className="text-primary underline underline-offset-4"
              >
                Sources &amp; method
              </Link>
            </p>
          ) : null}
          <details className="dataset-sources mt-2 text-xs text-muted-foreground">
            <summary className="label-mono cursor-pointer text-foreground">
              Data sources &amp; references
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {sourcesFor(title).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <p className="mt-2">{REFERENCE_NOTE}</p>
          </details>
        </>
      ) : null}
    </div>
  );
}
