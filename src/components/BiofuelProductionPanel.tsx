import { useState } from "react";
import { Factory, Users } from "lucide-react";

type Stream = {
  name: string;
  note: string;
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
    annualBnL: 114,
    barrelsPerDay: 1_965_000,
    color: "var(--primary)",
  },
  {
    name: "Biodiesel (FAME)",
    note: "Palm, soy, rapeseed & used cooking oil esters",
    annualBnL: 55,
    barrelsPerDay: 948_000,
    color: "var(--accent)",
  },
  {
    name: "Renewable diesel (HVO)",
    note: "Hydrotreated vegetable oils & waste fats",
    annualBnL: 30,
    barrelsPerDay: 517_000,
    color: "var(--signal)",
  },
  {
    name: "Sustainable aviation fuel",
    note: "HEFA jet, alcohol-to-jet, synthetics",
    annualBnL: 2.4,
    barrelsPerDay: 41_000,
    color: "var(--primary-glow)",
  },
  {
    name: "Biomethane (liquid-equiv.)",
    note: "Upgraded biogas injected or used as fuel",
    annualBnL: 12,
    barrelsPerDay: 207_000,
    color: "var(--muted-foreground)",
  },
];

const fmt = (n: number, d = 0) =>
  n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

/** Largest biofuel consuming markets — billion litres per year (all liquid biofuels). */
const CONSUMERS = [
  { name: "United States", flag: "🇺🇸", annualBnL: 66, color: "var(--primary)" },
  { name: "Brazil", flag: "🇧🇷", annualBnL: 39, color: "var(--accent)" },
  { name: "Indonesia", flag: "🇮🇩", annualBnL: 13, color: "var(--signal)" },
  { name: "European Union", flag: "🇪🇺", annualBnL: 12, color: "var(--primary-glow)" },
  { name: "China", flag: "🇨🇳", annualBnL: 5, color: "var(--muted-foreground)" },
  { name: "India", flag: "🇮🇳", annualBnL: 5, color: "var(--primary)" },
];

/** Largest corporate biofuel producers/offtakers — billion litres per year (all liquid biofuels). */
const COMPANIES = [
  { name: "POET", flag: "🇺🇸", annualBnL: 12, color: "var(--primary)" },
  { name: "ADM", flag: "🇺🇸", annualBnL: 9, color: "var(--accent)" },
  { name: "Valero / Diamond Green", flag: "🇺🇸", annualBnL: 8, color: "var(--signal)" },
  { name: "Raízen", flag: "🇧🇷", annualBnL: 6, color: "var(--primary-glow)" },
  { name: "Neste", flag: "🇫🇮", annualBnL: 5.5, color: "var(--muted-foreground)" },
  { name: "Green Plains", flag: "🇺🇸", annualBnL: 4, color: "var(--primary)" },
];

function ColumnChart({
  items,
  unitLabel,
  decimals = 1,
  legendNotes,
}: {
  items: { key: string; label: string; sub?: string; value: number; color: string }[];
  unitLabel: string;
  decimals?: number;
  legendNotes?: Record<string, string>;
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
              return (
                <div
                  key={i.key}
                  className="group relative flex h-full min-w-0 flex-1 cursor-default flex-col items-center justify-end"
                  onMouseEnter={() => setHover(i.key)}
                  onMouseLeave={() => setHover((h) => (h === i.key ? null : h))}
                  onFocus={() => setHover(i.key)}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
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
            })}
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-2 border-t border-border pt-2 sm:gap-3">
        <div className="w-12 shrink-0" aria-hidden />
        {items.map((i) => (
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
        ))}
      </div>

      {/* legend / colour key */}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-border pt-3">
        {items.map((i) => (
          <button
            key={i.key}
            type="button"
            onMouseEnter={() => setHover(i.key)}
            onMouseLeave={() => setHover(null)}
            className={`flex items-center gap-1.5 text-[11px] transition-opacity ${
              hover && hover !== i.key ? "opacity-45" : "opacity-100"
            }`}
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
        ))}
      </div>
      <div className="label-mono mt-2 text-muted-foreground">Y axis: {unitLabel}</div>
    </div>
  );
}

export function BiofuelProductionPanel() {
  const [unit, setUnit] = useState<"litres" | "barrels">("litres");
  const [userView, setUserView] = useState<"countries" | "companies">("countries");

  const rows = STREAMS.map((s) => ({
    ...s,
    daily: unit === "litres" ? (s.annualBnL * 1e9) / 365 : s.barrelsPerDay,
  }));
  const total = rows.reduce((a, r) => a + r.daily, 0);
  const unitLabel = unit === "litres" ? "million litres / day" : "thousand barrels / day";
  const scale = (v: number) => (unit === "litres" ? v / 1e6 : v / 1e3);
  const users = userView === "countries" ? CONSUMERS : COMPANIES;
  const usersTotal = users.reduce((a, c) => a + c.annualBnL, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="glass-panel rise p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="label-mono flex items-center gap-2 text-muted-foreground">
              <Factory className="size-3.5" />
              Global daily biofuel output
            </div>
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
          <h3 className="label-mono mb-2 text-muted-foreground">Output by fuel type</h3>
          <ColumnChart
            unitLabel={unitLabel}
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
          <h3 className="label-mono flex items-center gap-2 text-muted-foreground">
            <Users className="size-3.5" />
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
        <ColumnChart
          unitLabel={
            userView === "countries"
              ? "billion litres / year consumed"
              : "billion litres / year (corporate capacity)"
          }
          items={users.map((c) => ({
            key: c.name,
            label: `${c.flag} ${c.name}`,
            sub: `${((c.annualBnL / usersTotal) * 100).toFixed(0)}% of top-6`,
            value: c.annualBnL,
            color: c.color,
          }))}
        />
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          Top consumers and producers by annual liquid biofuel volume. Source: IEA/EIA estimates and
          company reports.
        </p>
      </div>
    </div>
  );
}