import { useState } from "react";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { ChartSummaryAssistant } from "@/components/ChartSummaryAssistant";
import { Fuel } from "lucide-react";
import { ChartHeat, ChartPanel, ChartScatter, chartFmt as fmt, type ScatterPoint } from "@/components/chart-kit";
import { ChartFilterBar, countryFilterOptions, useChartFilter } from "@/components/chart-filters";
import { entityLogoByName } from "@/lib/entity-logos";
import type { FuelType } from "@/lib/policy-taxonomy";
import { openEntityNews } from "@/lib/open-news";
import { STATION_TICKERS } from "@/lib/entity-tickers";
import { priceMeta, priceTone, useEntityQuotes } from "@/lib/use-entity-quotes";

type Station = {
  name: string;
  country: string;
  flag: string;
  /** approx. number of retail sites offering biofuel blends */
  sites: number;
  /** approx. biofuel volume sold per year, million litres */
  volumeMnL: number;
  /** biofuel products offered at the forecourt */
  fuels: FuelType[];
  note: string;
  color: string;
};

/** Largest retail fuel-station networks that sell biofuel blends at the pump. */
const STATIONS: Station[] = [
  { name: "Petrobras BR", country: "Brazil", flag: "🇧🇷", volumeMnL: 9800, sites: 7800, fuels: ["Ethanol", "Biodiesel"], note: "E100 hydrous ethanol at nearly every site", color: "var(--primary)" },
  { name: "Ipiranga", country: "Brazil", flag: "🇧🇷", volumeMnL: 7200, sites: 6000, fuels: ["Ethanol", "Biodiesel"], note: "E27 blend + hydrous ethanol", color: "var(--accent)" },
  { name: "Raízen / Shell Brazil", country: "Brazil", flag: "🇧🇷", volumeMnL: 7000, sites: 5800, fuels: ["Ethanol", "Biodiesel"], note: "Sugarcane ethanol retail arm", color: "var(--signal)" },
  { name: "Indian Oil", country: "India", flag: "🇮🇳", volumeMnL: 5200, sites: 5400, fuels: ["Ethanol", "Biodiesel"], note: "E20 rollout across retail outlets", color: "var(--primary-glow)" },
  { name: "Sinopec", country: "China", flag: "🇨🇳", volumeMnL: 2600, sites: 3200, fuels: ["Ethanol", "Biodiesel"], note: "E10 provinces + B5 pilots", color: "var(--muted-foreground)" },
  { name: "Pertamina", country: "Indonesia", flag: "🇮🇩", volumeMnL: 6400, sites: 3000, fuels: ["Biodiesel"], note: "B35 mandate at all forecourts", color: "var(--primary)" },
  { name: "Casey's", country: "United States", flag: "🇺🇸", volumeMnL: 1400, sites: 2600, fuels: ["Ethanol"], note: "E15 / E85 flex pumps", color: "var(--accent)" },
  { name: "Sheetz", country: "United States", flag: "🇺🇸", volumeMnL: 900, sites: 1800, fuels: ["Ethanol"], note: "Unleaded 88 (E15) chainwide", color: "var(--signal)" },
  { name: "Kwik Trip", country: "United States", flag: "🇺🇸", volumeMnL: 800, sites: 1500, fuels: ["Ethanol", "Biogas"], note: "E85 plus renewable natural gas", color: "var(--primary-glow)" },
  { name: "Preem", country: "Sweden", flag: "🇸🇪", volumeMnL: 1100, sites: 950, fuels: ["Renewable Diesel", "Ethanol"], note: "HVO100 widely available", color: "var(--muted-foreground)" },
  { name: "Neste retail", country: "Finland", flag: "🇫🇮", volumeMnL: 950, sites: 900, fuels: ["Renewable Diesel"], note: "MY renewable diesel network", color: "var(--primary)" },
  { name: "TotalEnergies", country: "France", flag: "🇫🇷", volumeMnL: 700, sites: 850, fuels: ["Renewable Diesel", "Biodiesel"], note: "B100 and HVO truck lanes", color: "var(--accent)" },
  { name: "Circle K Europe", country: "Norway", flag: "🇳🇴", volumeMnL: 620, sites: 800, fuels: ["Renewable Diesel", "Ethanol"], note: "HVO100 + E85 in Nordics", color: "var(--signal)" },
  { name: "OMV", country: "Austria", flag: "🇦🇹", volumeMnL: 540, sites: 700, fuels: ["Renewable Diesel", "Biodiesel"], note: "HVO diesel across CEE", color: "var(--primary-glow)" },
  { name: "Shell US", country: "United States", flag: "🇺🇸", volumeMnL: 700, sites: 650, fuels: ["Renewable Diesel", "Biogas"], note: "R99 renewable diesel + RNG sites", color: "var(--muted-foreground)" },
  { name: "Repsol", country: "Spain", flag: "🇪🇸", volumeMnL: 480, sites: 600, fuels: ["Renewable Diesel"], note: "100% renewable diesel rollout", color: "var(--primary)" },
  { name: "Certas / Shell UK", country: "United Kingdom", flag: "🇬🇧", volumeMnL: 300, sites: 450, fuels: ["Renewable Diesel"], note: "Shell Renewable Diesel fleet sites", color: "var(--accent)" },
  { name: "Clean Energy Fuels", country: "United States", flag: "🇺🇸", volumeMnL: 520, sites: 550, fuels: ["Biogas"], note: "Renewable natural gas stations", color: "var(--signal)" },
  { name: "Bharat Petroleum", country: "India", flag: "🇮🇳", volumeMnL: 3100, sites: 3300, fuels: ["Ethanol"], note: "E20 petrol network", color: "var(--primary-glow)" },
  { name: "YPF", country: "Argentina", flag: "🇦🇷", volumeMnL: 1200, sites: 1600, fuels: ["Ethanol", "Biodiesel"], note: "E12 / B10 mandated blends", color: "var(--muted-foreground)" },
];


type StationMetric = "sites" | "volume" | "perSite" | "price";

const STATION_METRICS: Record<
  StationMetric,
  { label: string; unit: string; help: string; decimals: number; value: (s: Station) => number }
> = {
  sites: {
    label: "Retail sites offering biofuels",
    unit: "retail sites offering biofuels",
    help: "Number of forecourts in the network that sell at least one biofuel blend (ethanol, biodiesel, renewable diesel or renewable gas). Bigger tiles mean wider pump coverage.",
    decimals: 0,
    value: (s) => s.sites,
  },
  volume: {
    label: "Biofuel volume sold (Ml/yr)",
    unit: "million litres of biofuel sold / year",
    help: "Estimated biofuel volume sold across the whole network each year, in million litres. This measures total throughput, not how many stations there are.",
    decimals: 0,
    value: (s) => s.volumeMnL,
  },
  perSite: {
    label: "Volume per site (litres x1000/yr)",
    unit: "thousand litres of biofuel sold per site / year",
    help: "Average biofuel sold per station per year (thousand litres) — volume divided by sites. It shows how intensively each forecourt sells biofuel, regardless of network size.",
    decimals: 1,
    value: (s) => (s.volumeMnL * 1000) / Math.max(s.sites, 1),
  },
  price: {
    label: "Share price (listing currency)",
    unit: "share price, primary listing currency",
    help: "Latest traded share price of the parent company on its primary listing, in that exchange's currency. State-owned or private networks have no listing and sit at the end.",
    decimals: 2,
    value: () => 0,
  },
};

function perSiteValue(s: Station) {
  return (s.volumeMnL * 1000) / Math.max(s.sites, 1);
}

/** Defines the scatter-plot axes for each selected metric so X and Y never collide. */
function scatterAxes(metricKey: StationMetric) {
  if (metricKey === "sites") {
    return {
      x: { metric: STATION_METRICS.volume, help: "X-axis shows total volume sold; Y-axis shows number of sites." },
      y: STATION_METRICS.sites,
      size: { label: "Volume per site", unit: "litres x1000/yr", value: perSiteValue },
    };
  }
  if (metricKey === "volume") {
    return {
      x: { metric: STATION_METRICS.perSite, help: "X-axis shows throughput per site; Y-axis shows total volume sold." },
      y: STATION_METRICS.volume,
      size: { label: "Retail sites", unit: "sites", value: (s: Station) => s.sites },
    };
  }
  if (metricKey === "perSite") {
    return {
      x: { metric: STATION_METRICS.sites, help: "X-axis shows network size; Y-axis shows throughput per site." },
      y: STATION_METRICS.perSite,
      size: { label: "Biofuel volume sold", unit: "Ml/yr", value: (s: Station) => s.volumeMnL },
    };
  }
  return {
    x: { metric: STATION_METRICS.volume, help: "X-axis shows total volume sold; Y-axis shows share price." },
    y: STATION_METRICS.price,
    size: { label: "Retail sites", unit: "sites", value: (s: Station) => s.sites },
  };
}

export function BiofuelProductionPanel({ fuels = [] }: { fuels?: FuelType[] }) {
  const [stationMetric, setStationMetric] = useState<StationMetric>("sites");
  const [view, setView] = useState<"heat" | "scatter">("heat");
  const { get } = useEntityQuotes();
  const metric = STATION_METRICS[stationMetric];
  const valueOf = (s: Station) =>
    stationMetric === "price" ? (get(STATION_TICKERS[s.name])?.price ?? 0) : metric.value(s);

  const matched = STATIONS.filter((s) => fuels.length === 0 || s.fuels.some((f) => fuels.includes(f)));
  const base = matched.length > 0 ? matched : STATIONS;
  const f = useChartFilter(base, {
    text: (s) => `${s.name} ${s.country} ${s.note} ${s.fuels.join(" ")}`,
    facetA: (s) => s.country,
    facetB: (s) => s.fuels as string[],
  });
  const ranked = f.filtered.slice().sort((a, b) => valueOf(b) - valueOf(a));
  const stations = ranked.slice(0, 10);

  const axes = scatterAxes(stationMetric);
  const scatterPoints: ScatterPoint[] = stations.map((s) => ({
    key: s.name,
    label: s.name,
    sub: `${s.country} · ${s.fuels.join(" / ")}`,
    x: axes.x.metric.value(s),
    y: valueOf(s),
    size: axes.size.value(s),
    group: s.country,
    logo: entityLogoByName(s.name),
    meta: priceMeta(get(STATION_TICKERS[s.name])),
    changePct: get(STATION_TICKERS[s.name])?.changePct,
    newsTarget: { name: s.name, query: `"${s.name}" biofuel OR ethanol OR renewable diesel station` },
  }));

  return (
    <ChartPanel
      icon={Fuel}
      title="Top global fuel stations selling biofuels"
      blurb="Retail networks offering ethanol, biodiesel, renewable diesel or renewable gas at the pump."
      metricValue={stationMetric}
      metricOptions={(Object.keys(STATION_METRICS) as StationMetric[]).map((m) => ({
        value: m,
        label: STATION_METRICS[m].label,
      }))}
      onMetricChange={(v) => setStationMetric(v as StationMetric)}
      viewValue={view}
      viewOptions={[
        { value: "heat", label: "Heat map" },
        { value: "scatter", label: "Scatter plot" },
      ]}
      onViewChange={(v) => setView(v as "heat" | "scatter")}
      actions={
        <ExportCsvButton
          disabled={ranked.length === 0}
          build={() => ({
            title: "Top global fuel stations selling biofuels",
            filename: "biofuel-station-networks",
            note: `Measure shown: ${metric.label}`,
            header: [
              "Network",
              "Country",
              "Retail sites offering biofuels",
              "Biofuel volume sold (Ml/yr)",
              "Volume per site (litres x1000/yr)",
              "Fuels",
              "Ticker",
              "Share price",
              "1-day change %",
              "Note",
            ],
            rows: ranked.map((s) => {
              const q = get(STATION_TICKERS[s.name]);
              return [
                s.name,
                s.country,
                s.sites,
                s.volumeMnL,
                ((s.volumeMnL * 1000) / Math.max(s.sites, 1)).toFixed(1),
                s.fuels.join(" / "),
                STATION_TICKERS[s.name] ?? "",
                q ? q.price.toFixed(2) : "",
                q ? q.changePct.toFixed(2) : "",
                s.note,
              ];
            }),
          })}
        />
      }
      filters={
        <ChartFilterBar
          query={f.query}
          onQueryChange={f.setQuery}
          placeholder="Search networks…"
          selects={[
            {
              label: "Country",
              value: f.a,
              options: countryFilterOptions(base.map((s) => s.country)),
              onChange: f.setA,
              allLabel: "All countries",
            },
            { label: "Fuel", value: f.b, options: f.optionsB, onChange: f.setB, allLabel: "All fuels" },
          ]}
          shown={stations.length}
          total={base.length}
          matched={ranked.length}
        />
      }
      footnote={
        view === "scatter"
          ? `Scatter plot: X = ${axes.x.metric.label}, Y = ${metric.label}, bubble size = ${axes.size.label}. ${axes.x.help} Approximate site counts from company retail disclosures and national blending programmes. Click any bubble to open the latest news for that network.`
          : "Approximate site counts from company retail disclosures and national blending programmes. Click any row to open the latest news for that network."
      }
      assistant={
        <ChartSummaryAssistant
          disabled={stations.length === 0}
          build={() => ({
            panel: "Top global fuel stations selling biofuels",
            measureLabel: metric.label,
            unit: metric.unit,
            filterLabel: [f.a || "All countries", f.b || "All fuels", f.query ? `search "${f.query}"` : ""]
              .filter(Boolean)
              .join(" · "),
            shown: stations.length,
            total: base.length,
            rows: stations.map((s) => ({
              label: s.name,
              sub: `${s.country} · ${s.note}`,
              value: valueOf(s),
              price: get(STATION_TICKERS[s.name])?.price,
              changePct: get(STATION_TICKERS[s.name])?.changePct,
            })),
          })}
        />
      }
    >
      {stations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No listed station networks for this filter — open that country's profile page for its
          policy and market updates.
        </p>
      ) : view === "scatter" ? (
        <ChartScatter
          points={scatterPoints}
          xAxis={{ label: axes.x.metric.label, unit: axes.x.metric.unit, help: axes.x.help }}
          yAxis={{ label: metric.label, unit: metric.unit, help: metric.help }}
          sizeAxis={{ label: axes.size.label, unit: axes.size.unit }}
          formatX={(n) => fmt(n, axes.x.metric.decimals)}
          formatY={(n) => fmt(n, metric.decimals)}
          formatSize={(n) => fmt(n, 0)}
          onSelect={openEntityNews}
          indexLabel="Listed fuel retailers & producers index"
        />
      ) : (
        <ChartHeat
          unitLabel={metric.unit}
          measureLabel={metric.label}
          measureHelp={metric.help}
          indexLabel="Listed fuel retailers & producers index"
          format={(n: number) => fmt(n, metric.decimals)}
          items={stations.map((s) => ({
            key: s.name,
            label: s.name,
            sub: s.note,
            value: valueOf(s),
            logo: entityLogoByName(s.name),
            meta: priceMeta(get(STATION_TICKERS[s.name])),
            tone: priceTone(get(STATION_TICKERS[s.name])),
            changePct: get(STATION_TICKERS[s.name])?.changePct,
          }))}
          onSelect={openEntityNews}
          news={Object.fromEntries(
            stations.map((s) => [
              s.name,
              { name: s.name, query: `"${s.name}" biofuel OR ethanol OR renewable diesel station` },
            ])
          )}
        />
      )}
    </ChartPanel>
  );
}
