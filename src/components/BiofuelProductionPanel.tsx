import { useState } from "react";
import { Fuel, Users } from "lucide-react";
import type { FuelType } from "@/lib/policy-taxonomy";
import { openEntityNews, type NewsTarget } from "@/lib/open-news";

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

type Mix = Partial<Record<FuelType, number>>;
type Entity = { name: string; flag: string; color: string; mix: Mix };
const sumMix = (mix: Mix, fuels: FuelType[]) =>
  Object.entries(mix).reduce(
    (a, [f, v]) => (fuels.length === 0 || fuels.includes(f as FuelType) ? a + (v ?? 0) : a),
    0,
  );

/** Largest biofuel consuming markets — billion litres per year (all liquid biofuels). */
const CONSUMERS: Entity[] = [
  { name: "United States", flag: "🇺🇸", color: "var(--primary)", mix: { Ethanol: 55, Biodiesel: 6, "Renewable Diesel": 5 } },
  { name: "Brazil", flag: "🇧🇷", color: "var(--accent)", mix: { Ethanol: 33, Biodiesel: 6 } },
  { name: "Indonesia", flag: "🇮🇩", color: "var(--signal)", mix: { Biodiesel: 12.5, Ethanol: 0.5 } },
  { name: "European Union", flag: "🇪🇺", color: "var(--primary-glow)", mix: { Biodiesel: 6, Ethanol: 4, "Renewable Diesel": 2, Biogas: 3 } },
  { name: "China", flag: "🇨🇳", color: "var(--muted-foreground)", mix: { Ethanol: 4, Biodiesel: 1, Biogas: 1 } },
  { name: "India", flag: "🇮🇳", color: "var(--primary)", mix: { Ethanol: 4.8, Biodiesel: 0.2 } },
];

/** Largest corporate biofuel producers/offtakers — billion litres per year (all liquid biofuels). */
const COMPANIES: Entity[] = [
  { name: "POET", flag: "🇺🇸", color: "var(--primary)", mix: { Ethanol: 12 } },
  { name: "ADM", flag: "🇺🇸", color: "var(--accent)", mix: { Ethanol: 8, Biodiesel: 1 } },
  { name: "Valero / Diamond Green", flag: "🇺🇸", color: "var(--signal)", mix: { Ethanol: 5.5, "Renewable Diesel": 2.5 } },
  { name: "Raízen", flag: "🇧🇷", color: "var(--primary-glow)", mix: { Ethanol: 6 } },
  { name: "Neste", flag: "🇫🇮", color: "var(--muted-foreground)", mix: { "Renewable Diesel": 4.7, SAF: 0.8 } },
  { name: "Green Plains", flag: "🇺🇸", color: "var(--primary)", mix: { Ethanol: 4 } },
  { name: "Flint Hills Resources", flag: "🇺🇸", color: "var(--accent)", mix: { Ethanol: 3.6 } },
  { name: "Marathon Petroleum", flag: "🇺🇸", color: "var(--signal)", mix: { Ethanol: 3.4, "Renewable Diesel": 1.5 } },
  { name: "Cargill", flag: "🇺🇸", color: "var(--primary-glow)", mix: { Ethanol: 2.5, Biodiesel: 1.2 } },
  { name: "Wilmar International", flag: "🇸🇬", color: "var(--muted-foreground)", mix: { Biodiesel: 3.2 } },
  { name: "Musim Mas", flag: "🇮🇩", color: "var(--primary)", mix: { Biodiesel: 2.4 } },
  { name: "Sinar Mas / Golden Agri", flag: "🇮🇩", color: "var(--accent)", mix: { Biodiesel: 2.2 } },
  { name: "Louis Dreyfus Company", flag: "🇳🇱", color: "var(--signal)", mix: { Biodiesel: 1.6, Ethanol: 0.8 } },
  { name: "Bunge", flag: "🇺🇸", color: "var(--primary-glow)", mix: { Biodiesel: 1.8 } },
  { name: "Eni Enilive", flag: "🇮🇹", color: "var(--muted-foreground)", mix: { "Renewable Diesel": 1.5, SAF: 0.3 } },
  { name: "TotalEnergies", flag: "🇫🇷", color: "var(--primary)", mix: { "Renewable Diesel": 1.2, SAF: 0.3 } },
  { name: "Repsol", flag: "🇪🇸", color: "var(--accent)", mix: { "Renewable Diesel": 0.9, SAF: 0.25 } },
  { name: "Chevron REG", flag: "🇺🇸", color: "var(--signal)", mix: { Biodiesel: 1.7, "Renewable Diesel": 0.8 } },
  { name: "Darling / Diamond Green", flag: "🇺🇸", color: "var(--primary-glow)", mix: { "Renewable Diesel": 2.4 } },
  { name: "BP Bunge Bioenergia", flag: "🇧🇷", color: "var(--muted-foreground)", mix: { Ethanol: 2.1 } },
];

function BarChart({
  items,
  unitLabel,
  decimals = 1,
  news,
  onSelect,
}: {
  items: { key: string; label: string; sub?: string; value: number; color: string }[];
  unitLabel: string;
  decimals?: number;
  news?: Record<string, { name: string; query: string }>;
  onSelect?: (t: NewsTarget) => void;
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
                <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
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
          {items.map((i) => {
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
                  <div
                    className="truncate text-xs font-semibold leading-tight"
                    title={i.label}
                  >
                    {i.label}
                  </div>
                  {i.sub ? (
                    <div className="truncate text-[10px] text-muted-foreground">{i.sub}</div>
                  ) : null}
                </div>

                <div className="relative min-w-0 flex-1 py-1.5">
                  <div
                    className="chart-bar-x h-7 rounded-r-full transition-all duration-300"
                    style={{
                      width: `${widthPct}%`,
                      background: `linear-gradient(90deg, color-mix(in oklch, ${i.color} 92%, white), ${i.color} 45%, color-mix(in oklch, ${i.color} 50%, transparent))`,
                      boxShadow: active
                        ? `0 0 0 1.5px ${i.color}, 0 8px 20px -10px ${i.color}`
                        : `inset 0 0 0 1px color-mix(in oklch, ${i.color} 35%, transparent)`,
                      opacity: hover && !active ? 0.4 : 1,
                    }}
                  />
                  <span className="pointer-events-none absolute left-[calc(var(--w)+6px)] top-1/2 -translate-y-1/2 font-mono text-[11px] tabular-nums text-foreground"
                    style={{ "--w": `${widthPct}%` } as React.CSSProperties}
                  >
                    {fmt(i.value, i.value < 100 ? decimals : 0)}
                  </span>

                  {active ? (
                    <div className="chart-tip pointer-events-none absolute left-[calc(var(--w)+8px)] top-1/2 z-20 w-max max-w-[200px] -translate-y-1/2 rounded-lg px-2.5 py-1.5"
                      style={{ "--w": `${widthPct}%` } as React.CSSProperties}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                        <span className="inline-block size-2 rounded-full" style={{ background: i.color }} />
                        {i.label}
                      </div>
                      <div className="font-mono text-[11px] tabular-nums">
                        {fmt(i.value, decimals)} <span className="text-muted-foreground">{unitLabel}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {((i.value / total) * 100).toFixed(1)}% of shown total
                      </div>
                      {target ? <div className="text-[10px] text-primary mt-1">Click to open latest news</div> : null}
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

      <div className="label-mono mt-3 text-muted-foreground">X axis: {unitLabel}</div>
    </div>
  );
}

export function BiofuelProductionPanel({ fuels = [] }: { fuels?: FuelType[] }) {
  const [userView, setUserView] = useState<"countries" | "companies">("countries");

  const matched = STATIONS.filter((s) => fuels.length === 0 || s.fuels.some((f) => fuels.includes(f)));
  const stations = (matched.length > 0 ? matched : STATIONS).slice().sort((a, b) => b.sites - a.sites);
  const stationTotal = stations.reduce((a, s) => a + s.sites, 0) || 1;

  const mixFuels = fuels;
  const users = (userView === "countries" ? CONSUMERS : COMPANIES)
    .map((e) => ({ ...e, annualBnL: sumMix(e.mix, mixFuels) }))
    .filter((e) => e.annualBnL > 0)
    .sort((a, b) => b.annualBnL - a.annualBnL);
  const usersTotal = users.reduce((a, c) => a + c.annualBnL, 0) || 1;
  const filterNote =
    fuels.length > 0
      ? matched.length > 0
        ? `Filtered to ${fuels.join(", ")}`
        : `No station data for ${fuels.join(", ")} — showing all networks`
      : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {filterNote ? (
        <div className="label-mono lg:col-span-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-muted-foreground">
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
          <div className="text-right">
            <div className="font-display text-2xl font-black tracking-tight tabular-nums">
              {fmt(stationTotal)}
            </div>
            <div className="label-mono text-muted-foreground">sites shown</div>
          </div>
        </div>
        <BarChart
          unitLabel="retail sites offering biofuels"
          decimals={0}
          items={stations.map((s) => ({
            key: s.name,
            label: `${s.flag} ${s.name}`,
            sub: s.note,
            value: s.sites,
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

      <div className="glass-panel rise p-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
            <Users className="size-4 text-accent" />
            Global top biofuel users
          </h3>
          <div className="flex rounded-full border border-border bg-surface-2 p-0.5">
            {(["countries", "companies"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setUserView(v)}
                className={`label-mono rounded-full px-2.5 py-1 transition-colors ${
                  userView === v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v === "countries" ? "Countries" : "Companies"}
              </button>
            ))}
          </div>
        </div>
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matching users for this fuel filter.</p>
        ) : (
        <BarChart
          unitLabel={
            userView === "countries"
              ? "billion litres / year consumed"
              : "billion litres / year (corporate capacity)"
          }
          items={users.map((c) => ({
            key: c.name,
            label: `${c.flag} ${c.name}`,
            sub: `${((c.annualBnL / usersTotal) * 100).toFixed(0)}% of shown`,
            value: c.annualBnL,
            color: c.color,
          }))}
          onSelect={openEntityNews}
          news={Object.fromEntries(
            users.map((c) => [
              c.name,
              { name: c.name, query: `"${c.name}" biofuel OR renewable OR clean energy` },
            ])
          )}
        />
        )}
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          Top consumers and producers by annual liquid biofuel volume. Click any bar to open its latest global news. Source: IEA/EIA estimates and company reports.
        </p>
      </div>
    </div>
  );
}