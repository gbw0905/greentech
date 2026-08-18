import { useState } from "react";
import { Plane } from "lucide-react";
import { openEntityNews, type NewsTarget } from "@/lib/open-news";

type Airline = {
  code: string;
  name: string;
  country: string;
  flag: string;
  /** Estimated SAF uplift, million litres per year */
  volume: number;
  /** SAF share of total jet fuel burn, % */
  share: number;
  note: string;
};

/**
 * Curated estimates of the airlines using the most sustainable aviation fuel
 * globally, based on published sustainability reports, offtake agreements and
 * regulatory disclosures. Volumes are indicative annual uplift figures.
 */
const AIRLINES: Airline[] = [
  { code: "UA", name: "United Airlines", country: "United States", flag: "🇺🇸", volume: 40, share: 0.35, note: "Largest US SAF offtake portfolio and Sustainable Flight Fund." },
  { code: "AF/KL", name: "Air France-KLM", country: "France / Netherlands", flag: "🇫🇷", volume: 38, share: 1.1, note: "Meets French and Dutch blending mandates; long-term Neste supply." },
  { code: "LH", name: "Lufthansa Group", country: "Germany", flag: "🇩🇪", volume: 30, share: 0.6, note: "EU ReFuelEU blending plus corporate SAF programmes." },
  { code: "BA/IAG", name: "IAG (British Airways)", country: "United Kingdom", flag: "🇬🇧", volume: 28, share: 1.4, note: "Targets 10% SAF by 2030; UK mandate compliance." },
  { code: "DL", name: "Delta Air Lines", country: "United States", flag: "🇺🇸", volume: 25, share: 0.2, note: "Multiple US offtakes incl. Gevo and Neste." },
  { code: "SQ", name: "Singapore Airlines", country: "Singapore", flag: "🇸🇬", volume: 18, share: 0.5, note: "Singapore 1% SAF levy from 2026." },
  { code: "AA", name: "American Airlines", country: "United States", flag: "🇺🇸", volume: 16, share: 0.15, note: "Gevo and Infinium supply agreements." },
  { code: "QF", name: "Qantas", country: "Australia", flag: "🇦🇺", volume: 12, share: 0.4, note: "London and California uplift, domestic SAF fund." },
  { code: "JL", name: "Japan Airlines", country: "Japan", flag: "🇯🇵", volume: 10, share: 0.3, note: "Japan 10% SAF-by-2030 target." },
  { code: "EK", name: "Emirates", country: "UAE", flag: "🇦🇪", volume: 9, share: 0.1, note: "Neste supply at DXB and Amsterdam." },
  { code: "AC", name: "Air Canada", country: "Canada", flag: "🇨🇦", volume: 8.5, share: 0.25, note: "Canadian SAF coalition and California uplift." },
  { code: "CX", name: "Cathay Pacific", country: "Hong Kong", flag: "🇭🇰", volume: 8, share: 0.3, note: "Targets 10% SAF by 2030; corporate SAF programme." },
  { code: "KE", name: "Korean Air", country: "South Korea", flag: "🇰🇷", volume: 7.5, share: 0.2, note: "Korea 1% SAF mandate from 2027." },
  { code: "AZ/ITA", name: "ITA Airways", country: "Italy", flag: "🇮🇹", volume: 7, share: 0.9, note: "ReFuelEU compliance with Eni Enilive supply." },
  { code: "IB", name: "Iberia", country: "Spain", flag: "🇪🇸", volume: 6.5, share: 0.8, note: "Repsol SAF supply across Spanish hubs." },
  { code: "SK", name: "SAS", country: "Scandinavia", flag: "🇸🇪", volume: 6, share: 1.0, note: "Nordic blending mandates in Sweden and Norway." },
  { code: "LX", name: "Swiss International", country: "Switzerland", flag: "🇨🇭", volume: 5.5, share: 0.7, note: "Swiss CO2 Act SAF blending obligation." },
  { code: "AS", name: "Alaska Airlines", country: "United States", flag: "🇺🇸", volume: 5, share: 0.2, note: "West-coast SAF corridors and Gevo offtake." },
  { code: "WN", name: "Southwest Airlines", country: "United States", flag: "🇺🇸", volume: 4.5, share: 0.1, note: "USA BioEnergy and LanzaJet offtakes." },
  { code: "NZ", name: "Air New Zealand", country: "New Zealand", flag: "🇳🇿", volume: 4, share: 0.4, note: "Neste imports and domestic SAF development." },
];

type AirlineMetric = "volume" | "share";

const AIRLINE_METRICS: Record<
  AirlineMetric,
  { label: string; badge: string; axis: string; value: (a: Airline) => number; format: (n: number) => string }
> = {
  volume: {
    label: "SAF uplift (Ml/yr)",
    badge: "Million litres / year",
    axis: "SAF uplift, million litres per year (bar length)",
    value: (a) => a.volume,
    format: (n) => `${n} ML`,
  },
  share: {
    label: "SAF share of fuel burn (%)",
    badge: "% of total jet fuel burn",
    axis: "SAF share of total jet fuel burn, percent (bar length)",
    value: (a) => a.share,
    format: (n) => `${n.toFixed(2)}%`,
  },
};

export function SafAirlinesPanel() {
  const [active, setActive] = useState<string | null>(null);
  const [metricKey, setMetricKey] = useState<AirlineMetric>("volume");
  const metric = AIRLINE_METRICS[metricKey];
  const sorted = [...AIRLINES].sort((a, b) => metric.value(b) - metric.value(a));
  const max = Math.max(...sorted.map((a) => metric.value(a)));
  const activeRow = sorted.find((a) => a.code === active) ?? null;

  return (
    <div className="glass-panel rise flex h-full flex-col p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="max-w-2xl">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
            <Plane className="size-5 text-accent" />
            Top airlines using SAF globally
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Indicative annual sustainable aviation fuel uplift by carrier. Hover a row for SAF share
            of total fuel burn and the programme behind it.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <label className="flex items-center gap-2">
            <span className="label-mono text-muted-foreground">Measure</span>
            <select
              className="chart-select"
              value={metricKey}
              onChange={(e) => setMetricKey(e.target.value as AirlineMetric)}
              aria-label="Choose the value shown in the chart"
            >
              {(Object.keys(AIRLINE_METRICS) as AirlineMetric[]).map((m) => (
                <option key={m} value={m}>
                  {AIRLINE_METRICS[m].label}
                </option>
              ))}
            </select>
          </label>
          <span className="label-mono text-muted-foreground">{metric.badge}</span>
        </div>
      </div>

      <div className="relative flex-1 space-y-1.5">
        {sorted.map((a, idx) => {
          const isActive = active === a.code;
          const dim = active !== null && !isActive;
          return (
            <button
              key={a.code}
              type="button"
              onClick={() =>
                openEntityNews({
                  name: a.name,
                  query: `${a.name} sustainable aviation fuel OR SAF`,
                })
              }
              onMouseEnter={() => setActive(a.code)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(a.code)}
              onBlur={() => setActive(null)}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-all duration-200 hover:bg-foreground/[0.05] ${
                dim ? "opacity-40" : ""
              } ${isActive ? "bg-foreground/[0.05]" : idx % 2 === 0 ? "bg-foreground/[0.015]" : ""}`}
            >
              <span className="chart-axis w-6 shrink-0">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="chart-label w-[9.5rem] shrink-0 truncate text-foreground">
                <span className="mr-1.5">{a.flag}</span>
                {a.name}
              </span>
              <span className="relative h-3.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-2 ring-1 ring-inset ring-border/60">
                <span
                  className="chart-bar-x absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max((metric.value(a) / max) * 100, 1.5)}%`,
                    background: isActive
                      ? "linear-gradient(90deg, var(--accent), var(--primary))"
                      : "linear-gradient(90deg, color-mix(in oklab, var(--accent) 75%, transparent), color-mix(in oklab, var(--primary) 55%, transparent))",
                    boxShadow: isActive
                      ? "0 0 12px color-mix(in oklab, var(--accent) 60%, transparent)"
                      : undefined,
                    animationDelay: `${idx * 25}ms`,
                  }}
                />
              </span>
              <span className="chart-value w-16 shrink-0 text-right text-foreground">
                {metric.format(metric.value(a))}
              </span>
              <span className="chart-axis w-12 shrink-0 text-right">
                {metricKey === "volume" ? `${a.share.toFixed(2)}%` : `${a.volume} ML`}
              </span>
            </button>
          );
        })}

        {activeRow && (
          <div className="chart-tip pointer-events-none absolute left-1/2 top-0 z-20 w-max max-w-[300px] -translate-x-1/2 rounded-xl px-4 py-3">
            <div className="mb-2 flex items-center gap-2 border-b border-border pb-2">
              <span className="font-display text-base font-bold text-foreground">
                {activeRow.flag} {activeRow.name}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 text-sm">
              <span className="text-muted-foreground">Home market</span>
              <span className="text-right font-semibold text-foreground">{activeRow.country}</span>
              <span className="text-muted-foreground">SAF uplift</span>
              <span className="text-right font-mono font-semibold text-foreground">
                {activeRow.volume} ML/yr
              </span>
              <span className="text-muted-foreground">SAF share</span>
              <span className="text-right font-mono font-semibold text-accent">
                {activeRow.share.toFixed(2)}%
              </span>
            </div>
            <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
              {activeRow.note}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2 border-t border-border pt-3">
        <div className="label-mono flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
          <span>X axis: {metric.axis}</span>
          <span>Y axis: airline, ranked by the selected measure</span>
          <span>
            Right column: {metricKey === "volume" ? "SAF share of total fuel burn (%)" : "SAF uplift (Ml/yr)"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Estimates compiled from airline sustainability reports, published offtake agreements and
          national SAF mandates. Click any airline to open its latest SAF news. Cross-verify
          against primary disclosures before use.
        </p>
        <div className="rounded-lg border border-border/60 bg-surface-2/50 p-2.5">
          <p className="text-xs font-semibold text-foreground">Note</p>
          <p className="text-xs text-muted-foreground">
            SAF demand from international carriers is driven by ReFuelEU, UK, US and Singapore mandates.
            Airlines with the largest offtake portfolios typically operate under the strictest blending rules.
          </p>
        </div>
      </div>
    </div>
  );
}
