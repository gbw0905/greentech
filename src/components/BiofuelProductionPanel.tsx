import { useState } from "react";
import { Fuel } from "lucide-react";
import type { FuelType } from "@/lib/policy-taxonomy";
import { openEntityNews } from "@/lib/open-news";

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

const fmt = (n: number, d = 0) =>
  n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

type NewsTarget = { name: string; query: string };

export function BarChart({
  items,
  unitLabel,
  decimals = 1,
  news,
  onSelect,
  yLabel = "Entity",
}: {
  items: { key: string; label: string; sub?: string; value: number; color: string }[];
  unitLabel: string;
  decimals?: number;
  news?: Record<string, NewsTarget>;
  onSelect?: (t: NewsTarget) => void;
  yLabel?: string;
}) {
  const max = Math.max(...items.map((i) => i.value));
  const total = items.reduce((a, i) => a + i.value, 0);
  const [hover, setHover] = useState<string | null>(null);
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div>
      {/* top x-axis labels */}
      <div className="flex gap-2 pl-[152px]">
        <div className="relative h-5 flex-1" aria-hidden>
          <div className="pointer-events-none absolute inset-0 flex justify-between">
            {ticks.map((t) => (
              <div key={t} className="flex flex-col items-center">
                <div className="h-1.5 w-px bg-border" />
                <span className="chart-axis">
                  {fmt(max * t, max * t < 100 ? decimals : 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* bars */}
      <div className="relative">
        {/* background gridlines */}
        <div className="pointer-events-none absolute inset-0 flex justify-between pl-[152px]" aria-hidden>
          {ticks.map((t) => (
            <div key={t} className="h-full w-px bg-border/40" />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {items.map((item, idx) => {
            const i = {
              ...item,
              color: `oklch(${(0.44 + (idx / Math.max(items.length - 1, 1)) * 0.26).toFixed(3)} ${(0.13 - (idx / Math.max(items.length - 1, 1)) * 0.06).toFixed(3)} 245)`,
            };
            const active = hover === i.key;
            const target = news?.[i.key];
            const widthPct = Math.max((i.value / max) * 100, 1.5);
            const Row = (
              <div
                key={i.key}
                className={`group relative flex items-center gap-3 ${target ? "cursor-pointer" : "cursor-default"}`}
                onMouseEnter={() => setHover(i.key)}
                onMouseLeave={() => setHover((h) => (h === i.key ? null : h))}
                onFocus={() => setHover(i.key)}
                onBlur={() => setHover(null)}
                tabIndex={target ? 0 : -1}
                role="img"
                aria-label={`${i.label}: ${fmt(i.value, decimals)} ${unitLabel}`}
              >
                <div className="w-[140px] shrink-0 text-right">
                  <div className="chart-label truncate" title={i.label}>
                    {i.label}
                  </div>
                  {i.sub ? (
                    <div className="chart-sub truncate">{i.sub}</div>
                  ) : null}
                </div>

                <div className="relative min-w-0 flex-1 py-1.5">
                  <div
                    className="chart-bar-x h-8 rounded-r-full transition-all duration-300"
                    style={{
                      width: `${widthPct}%`,
                      background: i.color,
                      boxShadow: active
                        ? `0 0 0 1.5px color-mix(in oklch, ${i.color} 70%, black)`
                        : undefined,
                      opacity: hover && !active ? 0.4 : 1,
                    }}
                  />
                  <span className="chart-value pointer-events-none absolute left-[calc(var(--w)+6px)] top-1/2 -translate-y-1/2 text-foreground"
                    style={{ "--w": `${widthPct}%` } as React.CSSProperties}
                  >
                    {fmt(i.value, i.value < 100 ? decimals : 0)}
                  </span>

                  {active ? (
                    <div className="chart-tip pointer-events-none absolute left-[calc(var(--w)+8px)] top-1/2 z-20 w-max max-w-[200px] -translate-y-1/2 rounded-lg px-2.5 py-1.5"
                      style={{ "--w": `${widthPct}%` } as React.CSSProperties}
                    >
                      <div className="chart-label flex items-center gap-1.5">
                        <span className="inline-block size-2 rounded-full" style={{ background: i.color }} />
                        {i.label}
                      </div>
                      <div className="chart-value">
                        {fmt(i.value, decimals)} <span className="text-muted-foreground">{unitLabel}</span>
                      </div>
                      <div className="chart-sub">
                        {((i.value / total) * 100).toFixed(1)}% of shown total
                      </div>
                      {target ? <div className="chart-sub mt-1 text-primary">Click to open latest news</div> : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
            return target ? (
              <div
                key={i.key}
                className="contents"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(target);
                }}
              >
                {Row}
              </div>
            ) : (
              Row
            );
          })}
        </div>
      </div>

      <div className="label-mono mt-3 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
        <span>X axis: {unitLabel}</span>
        <span>Y axis: {yLabel} (ranked, highest first)</span>
      </div>
    </div>
  );
}

type StationMetric = "sites" | "volume" | "perSite";

const STATION_METRICS: Record<
  StationMetric,
  { label: string; unit: string; short: string; decimals: number; value: (s: Station) => number }
> = {
  sites: {
    label: "Retail sites offering biofuels",
    unit: "retail sites offering biofuels",
    short: "sites shown",
    decimals: 0,
    value: (s) => s.sites,
  },
  volume: {
    label: "Biofuel volume sold (Ml/yr)",
    unit: "million litres of biofuel sold / year",
    short: "million litres / year shown",
    decimals: 0,
    value: (s) => s.volumeMnL,
  },
  perSite: {
    label: "Volume per site (litres ×1000/yr)",
    unit: "thousand litres of biofuel sold per site / year",
    short: "avg. thousand litres per site",
    decimals: 1,
    value: (s) => (s.volumeMnL * 1000) / Math.max(s.sites, 1),
  },
};

export function BiofuelProductionPanel({ fuels = [] }: { fuels?: FuelType[] }) {
  const [stationMetric, setStationMetric] = useState<StationMetric>("sites");
  const metric = STATION_METRICS[stationMetric];

  const matched = STATIONS.filter((s) => fuels.length === 0 || s.fuels.some((f) => fuels.includes(f)));
  const stations = (matched.length > 0 ? matched : STATIONS)
    .slice()
    .sort((a, b) => metric.value(b) - metric.value(a));
  const stationTotal =
    stationMetric === "perSite"
      ? stations.reduce((a, s) => a + metric.value(s), 0) / Math.max(stations.length, 1)
      : stations.reduce((a, s) => a + metric.value(s), 0) || 1;
  const filterNote =
    fuels.length > 0
      ? matched.length > 0
        ? `Filtered to ${fuels.join(", ")}`
        : `No station data for ${fuels.join(", ")} — showing all networks`
      : null;

  return (
    <div className="space-y-4">
      {filterNote ? (
        <div className="label-mono rounded-full border border-border bg-surface-2 px-3 py-1.5 text-muted-foreground">
          {filterNote}
        </div>
      ) : null}
      <div className="glass-panel rise p-5">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              <Fuel className="size-4 text-primary" />
              Top global fuel stations selling biofuels
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Retail networks offering ethanol, biodiesel, renewable diesel or renewable gas at the pump.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <label className="flex items-center gap-2">
              <span className="label-mono text-muted-foreground">Measure</span>
              <select
                className="chart-select"
                value={stationMetric}
                onChange={(e) => setStationMetric(e.target.value as StationMetric)}
                aria-label="Choose the value shown in the chart"
              >
                {(Object.keys(STATION_METRICS) as StationMetric[]).map((m) => (
                  <option key={m} value={m}>
                    {STATION_METRICS[m].label}
                  </option>
                ))}
              </select>
            </label>
            <div className="text-right">
              <div className="font-display text-2xl font-bold tracking-tight tabular-nums">
                {fmt(stationTotal, metric.decimals)}
              </div>
              <div className="label-mono text-muted-foreground">{metric.short}</div>
            </div>
          </div>
        </div>
        <BarChart
          unitLabel={metric.unit}
          yLabel="Retail fuel network"
          decimals={metric.decimals}
          items={stations.map((s) => ({
            key: s.name,
            label: `${s.flag} ${s.name}`,
            sub:
              stationMetric === "sites"
                ? `${fmt(s.volumeMnL)} Ml/yr · ${s.note}`
                : `${fmt(s.sites)} sites · ${s.note}`,
            value: metric.value(s),
            color: s.color,
          }))}
          onSelect={openEntityNews}
          news={Object.fromEntries(
            stations.map((s) => [
              s.name,
              { name: s.name, query: `"${s.name}" biofuel OR ethanol OR renewable diesel station` },
            ])
          )}
        />
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          Approximate site counts from company retail disclosures and national blending programmes. Click any bar to open the latest news for that network.
        </p>
      </div>
    </div>
  );
}
