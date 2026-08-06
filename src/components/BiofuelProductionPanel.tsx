import { useState } from "react";
import { Droplets, Factory } from "lucide-react";

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

export function BiofuelProductionPanel() {
  const [unit, setUnit] = useState<"litres" | "barrels">("litres");

  const rows = STREAMS.map((s) => ({
    ...s,
    daily: unit === "litres" ? (s.annualBnL * 1e9) / 365 : s.barrelsPerDay,
  }));
  const total = rows.reduce((a, r) => a + r.daily, 0);
  const max = Math.max(...rows.map((r) => r.daily));
  const unitLabel = unit === "litres" ? "million litres / day" : "thousand barrels / day";
  const scale = (v: number) => (unit === "litres" ? v / 1e6 : v / 1e3);

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

      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.name}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                <Droplets className="size-3.5 shrink-0" style={{ color: r.color }} />
                <span className="truncate">{r.name}</span>
              </span>
              <span className="font-mono text-sm tabular-nums">
                {fmt(scale(r.daily), scale(r.daily) < 100 ? 1 : 0)}
                <span className="ml-1 text-xs text-muted-foreground">
                  ({((r.daily / total) * 100).toFixed(1)}%)
                </span>
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{ width: `${(r.daily / max) * 100}%`, background: r.color }}
              />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{r.note}</div>
          </li>
        ))}
      </ul>

      <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
        Reference figures, not a live meter: national statistics agencies report biofuel output
        monthly or annually, so daily values are annualised estimates and should be cross-verified
        against IEA and EIA releases.
      </p>
    </div>
  );
}