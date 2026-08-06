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

function ColumnChart({
  items,
  unitLabel,
  decimals = 1,
}: {
  items: { key: string; label: string; sub?: string; value: number; color: string }[];
  unitLabel: string;
  decimals?: number;
}) {
  const max = Math.max(...items.map((i) => i.value));
  return (
    <div>
      <div className="flex items-end gap-2 sm:gap-3" style={{ height: 200 }}>
        {items.map((i) => (
          <div key={i.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className="font-mono text-[11px] tabular-nums">
              {fmt(i.value, i.value < 100 ? decimals : 0)}
            </span>
            <div
              className="w-full rounded-t-md transition-[height] duration-700"
              style={{
                height: `${Math.max((i.value / max) * 100, 2)}%`,
                background: `linear-gradient(180deg, ${i.color}, color-mix(in oklch, ${i.color} 55%, transparent))`,
              }}
              title={`${i.label}: ${fmt(i.value, decimals)} ${unitLabel}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 border-t border-border pt-2 sm:gap-3">
        {items.map((i) => (
          <div key={i.key} className="min-w-0 flex-1 text-center">
            <div className="truncate text-[11px] font-semibold leading-tight" title={i.label}>
              {i.label}
            </div>
            {i.sub ? (
              <div className="truncate text-[10px] text-muted-foreground">{i.sub}</div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="label-mono mt-2 text-muted-foreground">{unitLabel}</div>
    </div>
  );
}

export function BiofuelProductionPanel() {
  const [unit, setUnit] = useState<"litres" | "barrels">("litres");

  const rows = STREAMS.map((s) => ({
    ...s,
    daily: unit === "litres" ? (s.annualBnL * 1e9) / 365 : s.barrelsPerDay,
  }));
  const total = rows.reduce((a, r) => a + r.daily, 0);
  const unitLabel = unit === "litres" ? "million litres / day" : "thousand barrels / day";
  const scale = (v: number) => (unit === "litres" ? v / 1e6 : v / 1e3);
  const consumerTotal = CONSUMERS.reduce((a, c) => a + c.annualBnL, 0);

  return (
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

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <section>
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

        <section>
          <h3 className="label-mono mb-2 flex items-center gap-2 text-muted-foreground">
            <Users className="size-3.5" />
            Global top biofuel users
          </h3>
          <ColumnChart
            unitLabel="billion litres / year consumed"
            items={CONSUMERS.map((c) => ({
              key: c.name,
              label: `${c.flag} ${c.name}`,
              sub: `${((c.annualBnL / consumerTotal) * 100).toFixed(0)}% of top-6`,
              value: c.annualBnL,
              color: c.color,
            }))}
          />
        </section>
      </div>

      <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
        Reference figures, not a live meter: national statistics agencies report biofuel output
        monthly or annually, so daily values are annualised estimates and should be cross-verified
        against IEA and EIA releases.
      </p>
    </div>
  );
}