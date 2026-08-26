import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Building2, Download } from "lucide-react";
import { getOilStocksFn, type OilQuote } from "@/lib/oil.functions";
import { openEntityNews } from "@/lib/open-news";
import { entityLogo } from "@/lib/entity-logos";
import { ChartHeat, ChartPanel, ChartScatter, chartFmt, type ScatterPoint } from "@/components/chart-kit";
import { ChartFilterBar, countryFilterOptions, useChartFilter } from "@/components/chart-filters";
import { downloadBrandedCsv, type BrandedExport } from "@/lib/branded-export";
import { ChartSummaryAssistant } from "@/components/ChartSummaryAssistant";

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

/** Home jurisdiction of each listed major, used by the country filter. */
const COMPANY_COUNTRY: Record<string, string> = {
  "2222.SR": "Saudi Arabia",
  XOM: "United States",
  CVX: "United States",
  SHEL: "United Kingdom",
  TTE: "France",
  BP: "United Kingdom",
  "0857.HK": "China",
  "0386.HK": "China",
  "0883.HK": "China",
  COP: "United States",
  PSX: "United States",
  MPC: "United States",
  OXY: "United States",
  PBR: "Brazil",
  E: "Italy",
  EQNR: "Norway",
  "RELIANCE.NS": "India",
  "ONGC.NS": "India",
  SU: "Canada",
  CNQ: "Canada",
};

const countryOf = (symbol: string) => COMPANY_COUNTRY[symbol] ?? "Other";

function oilExport(rows: OilQuote[]): BrandedExport {
  const header = [
    "Company",
    "Ticker",
    "Share price",
    "Currency",
    "Previous close",
    "1-day change",
    "1-day change %",
    "Annual capacity (MMboe/yr)",
    "Capacity type",
  ];
  const body = rows.map((q) => [
    q.label,
    q.symbol,
    q.price.toFixed(2),
    q.currency,
    q.prevClose.toFixed(2),
    q.change.toFixed(2),
    q.changePct.toFixed(2),
    capOf(q.symbol).mmboe || "",
    capOf(q.symbol).kind,
  ]);
  return {
    title: "Top global oil companies — share price & output capacity",
    filename: "global-oil-companies",
    header,
    rows: body,
    note: "Source: Global Bioenergy Watch. Prices via public market data; capacity approximate.",
  };
}

type StockMetric = "price" | "change" | "capacity";

const STOCK_METRICS: Record<
  StockMetric,
  {
    label: string;
    unit: string;
    help: string;
    decimals: number;
    value: (q: OilQuote) => number;
  }
> = {
  price: {
    label: "Share price (listing currency)",
    unit: "share price, primary listing currency",
    help: "The latest traded share price on the company's primary stock exchange, shown in that exchange's currency. Bigger, redder tiles mean a higher price per share — not a bigger company.",
    decimals: 2,
    value: (q) => q.price,
  },
  change: {
    label: "1-day change (%)",
    unit: "absolute 1-day price change, %",
    help: "How far the share price moved since the previous close, as a percentage. Tile size uses the size of the move; the figure under the name shows its direction (+ up, − down).",
    decimals: 2,
    value: (q) => Math.abs(q.changePct),
  },
  capacity: {
    label: "Annual capacity (MMboe/yr)",
    unit: "annual output capacity, million barrels of oil equivalent / year",
    help: "Approximate yearly output in million barrels of oil equivalent — upstream production for producers, crude throughput for refiners. Bigger tiles mean more barrels moved per year.",
    decimals: 0,
    value: (q) => capOf(q.symbol).mmboe,
  },
};

export function OilStocksPanel() {
  const [metricKey, setMetricKey] = useState<StockMetric>("capacity");
  const { data, isLoading } = useQuery({
    queryKey: ["oil-stocks"],
    queryFn: () => getOilStocksFn(),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
    gcTime: Infinity,
  });

  const metric = STOCK_METRICS[metricKey];
  const quotes: OilQuote[] = data?.quotes ?? [];
  const stale = data?.stale ?? false;
  const f = useChartFilter(quotes, {
    text: (q) => `${q.label} ${q.symbol} ${countryOf(q.symbol)}`,
    facetA: (q) => countryOf(q.symbol),
    facetB: (q) => capOf(q.symbol).kind,
  });
  const ranked = [...f.filtered].sort((a, b) => metric.value(b) - metric.value(a));
  const sorted = ranked.slice(0, 10);

  return (
    <ChartPanel
      icon={Building2}
      title="Top global oil companies"
      blurb="The world's largest oil and gas majors, with live share prices from their primary listing and approximate annual output capacity."
      metricValue={metricKey}
      metricOptions={(Object.keys(STOCK_METRICS) as StockMetric[]).map((m) => ({
        value: m,
        label: STOCK_METRICS[m].label,
      }))}
      onMetricChange={(v) => setMetricKey(v as StockMetric)}
      actions={
        <button
          type="button"
          onClick={() => downloadBrandedCsv(oilExport(ranked))}
          disabled={ranked.length === 0}
          className="inline-flex items-center gap-1.5 border border-ink bg-ink px-2.5 py-1.5 text-xs font-semibold text-ink-foreground transition-opacity hover:opacity-85 disabled:opacity-40"
        >
          <Download className="size-3.5" />
          Export CSV
        </button>
      }
      filters={
        <ChartFilterBar
          query={f.query}
          onQueryChange={f.setQuery}
          placeholder="Search companies or tickers…"
          selects={[
            {
              label: "Country",
              value: f.a,
              options: countryFilterOptions(quotes.map((q) => countryOf(q.symbol))),
              onChange: f.setA,
              allLabel: "All countries",
            },
            { label: "Type", value: f.b, options: f.optionsB, onChange: f.setB, allLabel: "All types" },
          ]}
          shown={sorted.length}
          total={quotes.length}
          matched={ranked.length}
        />
      }
      status={isLoading ? "Loading" : stale ? "Last close" : "Live"}
      assistant={
        <ChartSummaryAssistant
          disabled={sorted.length === 0}
          build={() => ({
            panel: "Top global oil companies",
            measureLabel: metric.label,
            unit: metric.unit,
            filterLabel: [f.a || "All countries", f.b || "All types", f.query ? `search "${f.query}"` : ""]
              .filter(Boolean)
              .join(" · "),
            shown: sorted.length,
            total: quotes.length,
            rows: sorted.map((q) => ({
              label: q.label,
              sub: `${countryOf(q.symbol)} · ${capOf(q.symbol).kind}`,
              value: metric.value(q),
              price: q.price,
              changePct: q.changePct,
            })),
          })}
        />
      }
      footnote="Capacity is approximate annual output in million barrels of oil equivalent per year (upstream production, or crude throughput for refiners). Prices refresh every five minutes and are quoted in each company's primary listing currency. Click any row for that company's latest news."
    >
      {sorted.length === 0 && !isLoading ? (
        <p className="text-sm text-muted-foreground">
          {quotes.length === 0
            ? "Market data is unavailable right now."
            : "No listed oil companies for this filter — open that country's profile page for its policy and market updates."}
        </p>
      ) : (
        <ChartHeat
          unitLabel={metric.unit}
          measureLabel={metric.label}
          measureHelp={metric.help}
          indexLabel="NYSE / global energy majors index"
          format={(n) => chartFmt(n, metric.decimals)}
          items={sorted.map((q) => ({
            key: q.symbol,
            label: q.label,
            sub: `${q.symbol.replace(/\.[A-Z]+$/, "")} · ${chartFmt(q.price, 2)}`,
            value: metric.value(q),
            logo: entityLogo(q.symbol),
            meta: `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%`,
            tone: q.changePct >= 0 ? ("up" as const) : ("down" as const),
            changePct: q.changePct,
          }))}
          onSelect={openEntityNews}
          news={Object.fromEntries(
            sorted.map((q) => [q.symbol, { name: q.label, query: `"${q.label}" oil company news` }]),
          )}
        />
      )}
    </ChartPanel>
  );
}
