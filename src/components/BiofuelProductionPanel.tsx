import { useState } from "react";
import { Fuel } from "lucide-react";
import { ChartBars, ChartPanel, chartFmt as fmt } from "@/components/chart-kit";
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
  { label: string; unit: string; decimals: number; value: (s: Station) => number }
> = {
  sites: {
    label: "Retail sites offering biofuels",
    unit: "retail sites offering biofuels",
    decimals: 0,
    value: (s) => s.sites,
  },
  volume: {
    label: "Biofuel volume sold (Ml/yr)",
    unit: "million litres of biofuel sold / year",
    decimals: 0,
    value: (s) => s.volumeMnL,
  },
  perSite: {
    label: "Volume per site (litres x1000/yr)",
    unit: "thousand litres of biofuel sold per site / year",
    decimals: 1,
    value: (s) => (s.volumeMnL * 1000) / Math.max(s.sites, 1),
  },
  price: {
    label: "Share price (listing currency)",
    unit: "share price, primary listing currency",
    decimals: 2,
    value: () => 0,
  },
};

export function BiofuelProductionPanel({ fuels = [] }: { fuels?: FuelType[] }) {
  const [stationMetric, setStationMetric] = useState<StationMetric>("sites");
  const { get } = useEntityQuotes();
  const metric = STATION_METRICS[stationMetric];
  const valueOf = (s: Station) =>
    stationMetric === "price" ? (get(STATION_TICKERS[s.name])?.price ?? 0) : metric.value(s);

  const matched = STATIONS.filter((s) => fuels.length === 0 || s.fuels.some((f) => fuels.includes(f)));
  const stations = (matched.length > 0 ? matched : STATIONS)
    .slice()
    .sort((a, b) => valueOf(b) - valueOf(a));

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
      footnote="Approximate site counts from company retail disclosures and national blending programmes. Click any row to open the latest news for that network."
    >
      <ChartBars
        unitLabel={metric.unit}
        yLabel="Retail fuel network"
        metaHeader="Share price"
        format={(n) => fmt(n, metric.decimals)}
        items={stations.map((s) => ({
          key: s.name,
          label: s.name,
          sub: s.note,
          value: valueOf(s),
          meta: priceMeta(get(STATION_TICKERS[s.name])),
          tone: priceTone(get(STATION_TICKERS[s.name])),
        }))}
        onSelect={openEntityNews}
        news={Object.fromEntries(
          stations.map((s) => [
            s.name,
            { name: s.name, query: `"${s.name}" biofuel OR ethanol OR renewable diesel station` },
          ])
        )}
      />
    </ChartPanel>
  );
}
