import { useState } from "react";
import { Factory, Users } from "lucide-react";
import type { FuelType } from "@/lib/policy-taxonomy";

type Stream = {
  name: string;
  note: string;
  /** taxonomy fuel type this stream maps to */
  fuel: FuelType;
  /** billion litres per year (latest full-year global estimate) */
  annualBnL: number;
  /** litres per barrel-of-oil-equivalent style conversion for display */
  barrelsPerDay: number;
  color: string;
};

// Latest full-year global output estimates (IEA Renewables / EIA international data).
// Divided by 365 for the daily figures shown below.
const STREAMS: Stream[] = [
  {
    name: "Fuel ethanol",
    note: "Corn, sugarcane, wheat & cellulosic",
    fuel: "Ethanol",
    annualBnL: 114,
    barrelsPerDay: 1_965_000,
    color: "var(--primary)",
  },
  {
    name: "Biodiesel (FAME)",
    note: "Palm, soy, rapeseed & used cooking oil esters",
    fuel: "Biodiesel",
    annualBnL: 55,
    barrelsPerDay: 948_000,
    color: "var(--accent)",
  },
  {
    name: "Renewable diesel (HVO)",
    note: "Hydrotreated vegetable oils & waste fats",
    fuel: "Renewable Diesel",
    annualBnL: 30,
    barrelsPerDay: 517_000,
    color: "var(--signal)",
  },
  {
    name: "Sustainable aviation fuel",
    note: "HEFA jet, alcohol-to-jet, synthetics",
    fuel: "SAF",
    annualBnL: 2.4,
    barrelsPerDay: 41_000,
    color: "var(--primary-glow)",
  },
  {
    name: "Biomethane (liquid-equiv.)",
    note: "Upgraded biogas injected or used as fuel",
    fuel: "Biogas",
    annualBnL: 12,
    barrelsPerDay: 207_000,
    color: "var(--muted-foreground)",
  },
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

function ColumnChart({
  items,
  unitLabel,
  decimals = 1,
  legendNotes,
  news,
  onSelect,
}: {
  items: { key: string; label: string; sub?: string; value: number; color: string }[];
  unitLabel: string;
  decimals?: number;
  legendNotes?: Record<string, string>;
  news?: Record<string, { name: string; query: string }>;
  onSelect?: (t: NewsTarget) => void;
}) {
  const max = Math.max(...items.map((i) => i.value));
  const total = items.reduce((a, i) => a + i.value, 0);
  const [hover, setHover] = useState<string | null>(null);
  const ticks = [1, 0.75, 0.5, 0.25, 0];
  return (
    <div>
      <div className="flex gap-2">
        {/* y axis */}
        <div
          className="flex w-12 shrink-0 flex-col justify-between text-right font-mono text-[10px] text-muted-foreground tabular-nums"
          style={{ height: 210 }}
          aria-hidden
        >
          {ticks.map((t) => (
            <span key={t}>{fmt(max * t, max * t < 100 ? decimals : 0)}</span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1" style={{ height: 210 }}>
          {/* gridlines */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden>
            {ticks.map((t) => (
              <div key={t} className="border-t border-border/60" />
            ))}
          </div>

          <div className="relative flex h-full items-end gap-2 sm:gap-3">
            {items.map((i) => {
              const active = hover === i.key;
              const target = news?.[i.key];
              const href = target ? "#" : undefined;
              const Bar = (
                <div
                  key={i.key}
                  className={`group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end ${href ? "cursor-pointer" : "cursor-default"}`}
                  onMouseEnter={() => setHover(i.key)}
                  onMouseLeave={() => setHover((h) => (h === i.key ? null : h))}
                  onFocus={() => setHover(i.key)}
                  onBlur={() => setHover(null)}
                  tabIndex={href ? 0 : -1}
                  role="img"
                  aria-label={`${i.label}: ${fmt(i.value, decimals)} ${unitLabel}`}
                >
                  {active ? (
                    <div className="pointer-events-none absolute bottom-full z-20 mb-1 w-max max-w-[180px] rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-left shadow-lg">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                        <span
                          className="inline-block size-2 rounded-full"
                          style={{ background: i.color }}
                        />
                        {i.label}
                      </div>
                      <div className="font-mono text-[11px] tabular-nums">
                        {fmt(i.value, decimals)} <span className="text-muted-foreground">{unitLabel}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {((i.value / total) * 100).toFixed(1)}% of shown total
                      </div>
                      {href ? <div className="text-[10px] text-primary mt-1">Click to open latest news</div> : null}
                    </div>
                  ) : null}
                  <span className="mb-1 font-mono text-[11px] tabular-nums">
                    {fmt(i.value, i.value < 100 ? decimals : 0)}
                  </span>
                  <div
                    className="w-full rounded-t-md transition-all duration-300"
                    style={{
                      height: `${Math.max((i.value / max) * 88, 2)}%`,
                      background: `linear-gradient(180deg, ${i.color}, color-mix(in oklch, ${i.color} 55%, transparent))`,
                      outline: active ? `2px solid ${i.color}` : "none",
                      opacity: hover && !active ? 0.45 : 1,
                    }}
                  />
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
                  {Bar}
                </div>
              ) : (
                Bar
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-2 border-t border-border pt-2 sm:gap-3">
        <div className="w-12 shrink-0" aria-hidden />
        {items.map((i) => {
          const target = news?.[i.key];
          const Label = (
            <div
              key={i.key}
              className={`min-w-0 flex-1 text-center transition-opacity ${
                hover && hover !== i.key ? "opacity-50" : "opacity-100"
              }`}
            >
              <div className="truncate text-[11px] font-semibold leading-tight" title={i.label}>
                {i.label}
              </div>
              {i.sub ? (
                <div className="truncate text-[10px] text-muted-foreground">{i.sub}</div>
              ) : null}
            </div>
          );
          return target ? (
            <div
              key={i.key}
              className="contents cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(target);
              }}
            >
              {Label}
            </div>
          ) : (
            Label
          );
        })}
      </div>

      {/* legend / colour key */}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-border pt-3">
        {items.map((i) => {
          const target = news?.[i.key];
          const Legend = (
            <button
              key={i.key}
              type="button"
              onClick={() => target && onSelect?.(target)}
              onMouseEnter={() => setHover(i.key)}
              onMouseLeave={() => setHover(null)}
              className={`flex items-center gap-1.5 text-[11px] transition-opacity ${
                hover && hover !== i.key ? "opacity-45" : "opacity-100"
              } ${target ? "hover:underline" : ""}`}
            >
              <span className="inline-block size-2.5 rounded-sm" style={{ background: i.color }} />
              <span className="max-w-[150px] truncate">{i.label}</span>
              <span className="font-mono text-muted-foreground tabular-nums">
                {fmt(i.value, i.value < 100 ? decimals : 0)}
              </span>
              {legendNotes?.[i.key] ? (
                <span className="text-muted-foreground">· {legendNotes[i.key]}</span>
              ) : null}
            </button>
          );
          return Legend;
        })}
      </div>
      <div className="label-mono mt-2 text-muted-foreground">Y axis: {unitLabel}</div>
    </div>
  );
}

export function BiofuelProductionPanel({ fuels = [] }: { fuels?: FuelType[] }) {
  const [unit, setUnit] = useState<"litres" | "barrels">("litres");
  const [userView, setUserView] = useState<"countries" | "companies">("countries");

  const activeStreams = STREAMS.filter((s) => fuels.length === 0 || fuels.includes(s.fuel));
  const shownStreams = activeStreams.length > 0 ? activeStreams : STREAMS;
  const rows = shownStreams.map((s) => ({
    ...s,
    daily: unit === "litres" ? (s.annualBnL * 1e9) / 365 : s.barrelsPerDay,
  }));
  const total = rows.reduce((a, r) => a + r.daily, 0);
  const unitLabel = unit === "litres" ? "million litres / day" : "thousand barrels / day";
  const scale = (v: number) => (unit === "litres" ? v / 1e6 : v / 1e3);
  const mixFuels = activeStreams.length > 0 ? fuels : [];
  const users = (userView === "countries" ? CONSUMERS : COMPANIES)
    .map((e) => ({ ...e, annualBnL: sumMix(e.mix, mixFuels) }))
    .filter((e) => e.annualBnL > 0)
    .sort((a, b) => b.annualBnL - a.annualBnL);
  const usersTotal = users.reduce((a, c) => a + c.annualBnL, 0) || 1;
  const filterNote =
    fuels.length > 0
      ? activeStreams.length > 0
        ? `Filtered to ${fuels.join(", ")}`
        : `No production data for ${fuels.join(", ")} — showing all fuels`
      : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {filterNote ? (
        <div className="label-mono lg:col-span-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-muted-foreground">
          {filterNote}
        </div>
      ) : null}
      <div className="glass-panel rise p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              <Factory className="size-4 text-primary" />
              Global daily biofuel output
            </h3>
            <div className="mt-1 font-display text-3xl font-black tracking-tight">
              {fmt(scale(total), unit === "litres" ? 0 : 0)}{" "}
              <span className="text-base font-semibold text-muted-foreground">{unitLabel}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              All biofuel types combined, derived from the latest full-year global production
              estimates (÷ 365).
            </p>
          </div>
          <div className="flex rounded-full border border-border bg-surface-2 p-0.5">
            {(["litres", "barrels"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`label-mono rounded-full px-3 py-1.5 transition-colors ${
                  unit === u
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {u === "litres" ? "Litres" : "Barrels"}
              </button>
            ))}
          </div>
        </div>

        <section className="mt-5">
          <h4 className="mb-3 flex items-center gap-2 font-display text-sm font-bold tracking-tight text-foreground">
            <span className="inline-block size-2 rounded-full bg-signal" />
            Output by fuel type
          </h4>
          <ColumnChart
            unitLabel={unitLabel}
            legendNotes={Object.fromEntries(shownStreams.map((s) => [s.name, s.note]))}
            items={rows.map((r) => ({
              key: r.name,
              label: r.name,
              sub: `${((r.daily / total) * 100).toFixed(1)}%`,
              value: scale(r.daily),
              color: r.color,
            }))}
          />
        </section>

        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          Reference figures, not a live meter: national statistics agencies report biofuel output
          monthly or annually, so daily values are annualised estimates and should be cross-verified
          against IEA and EIA releases.
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
        <ColumnChart
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
          links={Object.fromEntries(
            users.map((c) => [
              c.name,
              `https://news.google.com/rss/search?q=${encodeURIComponent(
                `"${c.name}" biofuel OR renewable OR clean energy when:30d`
              )}&hl=en-US&gl=US&ceid=US:en`,
            ])
          )}
        />
        )}
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          Top consumers and producers by annual liquid biofuel volume. Click any bar to open the latest news for that entity. Source: IEA/EIA estimates and company reports.
        </p>
      </div>
    </div>
  );
}