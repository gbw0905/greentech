import { useState } from "react";
import { Plane } from "lucide-react";
import { openEntityNews } from "@/lib/open-news";
import { ChartHeat, ChartPanel, ChartScatter, chartFmt as fmt, type ScatterPoint } from "@/components/chart-kit";
import { ChartFilterBar, countryFilterOptions, useChartFilter } from "@/components/chart-filters";
import { entityLogoByName } from "@/lib/entity-logos";
import { AIRLINE_TICKERS } from "@/lib/entity-tickers";
import { priceMeta, priceTone, useEntityQuotes } from "@/lib/use-entity-quotes";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { ChartSummaryAssistant } from "@/components/ChartSummaryAssistant";

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

type AirlineMetric = "volume" | "share" | "price";

const AIRLINE_METRICS: Record<
  AirlineMetric,
  { label: string; unit: string; help: string; decimals: number; value: (a: Airline) => number }
> = {
  volume: {
    label: "SAF uplift (Ml/yr)",
    unit: "million litres of SAF uplifted / year",
    help: "Estimated sustainable aviation fuel the carrier actually uplifts into its aircraft each year, in million litres. Bigger tiles mean more SAF burned in absolute terms.",
    decimals: 0,
    value: (a) => a.volume,
  },
  share: {
    label: "SAF share of fuel burn (%)",
    unit: "% of total jet fuel burn from SAF",
    help: "Share of the airline's total jet fuel burn that is SAF. A small airline can rank high here even with modest volumes, because it measures intensity rather than scale.",
    decimals: 2,
    value: (a) => a.share,
  },
  price: {
    label: "Share price (listing currency)",
    unit: "share price, primary listing currency",
    help: "Latest traded share price on the carrier's primary listing, in that exchange's currency. State-owned or private carriers have no listing and sit at the end.",
    decimals: 2,
    value: () => 0,
  },
};

export function SafAirlinesPanel() {
  const [metricKey, setMetricKey] = useState<AirlineMetric>("volume");
  const { get } = useEntityQuotes();
  const metric = AIRLINE_METRICS[metricKey];
  const valueOf = (a: Airline) =>
    metricKey === "price" ? (get(AIRLINE_TICKERS[a.code])?.price ?? 0) : metric.value(a);
  const f = useChartFilter(AIRLINES, {
    text: (a) => `${a.name} ${a.code} ${a.country} ${a.note}`,
    facetA: (a) => a.country,
  });
  const ranked = [...f.filtered].sort((a, b) => valueOf(b) - valueOf(a));
  const sorted = ranked.slice(0, 10);

  return (
    <ChartPanel
      icon={Plane}
      title="Top airlines using SAF globally"
      blurb="Indicative annual sustainable aviation fuel uplift by carrier, with SAF share of total fuel burn."
      metricValue={metricKey}
      metricOptions={(Object.keys(AIRLINE_METRICS) as AirlineMetric[]).map((m) => ({
        value: m,
        label: AIRLINE_METRICS[m].label,
      }))}
      onMetricChange={(v) => setMetricKey(v as AirlineMetric)}
      actions={
        <ExportCsvButton
          disabled={ranked.length === 0}
          build={() => ({
            title: "Top airlines using SAF globally",
            filename: "saf-airlines",
            note: `Measure shown: ${metric.label}`,
            header: [
              "Airline",
              "Code",
              "Country",
              "SAF uplift (Ml/yr)",
              "SAF share of fuel burn (%)",
              "Ticker",
              "Share price",
              "1-day change %",
              "Note",
            ],
            rows: ranked.map((a) => {
              const q = get(AIRLINE_TICKERS[a.code]);
              return [
                a.name,
                a.code,
                a.country,
                a.volume,
                a.share,
                AIRLINE_TICKERS[a.code] ?? "",
                q ? q.price.toFixed(2) : "",
                q ? q.changePct.toFixed(2) : "",
                a.note,
              ];
            }),
          })}
        />
      }
      filters={
        <ChartFilterBar
          query={f.query}
          onQueryChange={f.setQuery}
          placeholder="Search airlines…"
          selects={[
            {
              label: "Country",
              value: f.a,
              options: countryFilterOptions(AIRLINES.map((a) => a.country)),
              onChange: f.setA,
              allLabel: "All countries",
            },
          ]}
          shown={sorted.length}
          total={AIRLINES.length}
          matched={ranked.length}
        />
      }
      assistant={
        <ChartSummaryAssistant
          disabled={sorted.length === 0}
          build={() => ({
            panel: "Top airlines using SAF globally",
            measureLabel: metric.label,
            unit: metric.unit,
            filterLabel: [f.a || "All countries", f.query ? `search "${f.query}"` : ""]
              .filter(Boolean)
              .join(" · "),
            shown: sorted.length,
            total: AIRLINES.length,
            rows: sorted.map((a) => ({
              label: a.name,
              sub: `${a.country} · ${a.note}`,
              value: valueOf(a),
              price: get(AIRLINE_TICKERS[a.code])?.price,
              changePct: get(AIRLINE_TICKERS[a.code])?.changePct,
            })),
          })}
        />
      }
      footnote="Estimates from airline sustainability reports, offtake announcements and regulatory disclosures. Click any row for the latest SAF news for that carrier."
    >
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No listed airlines for this filter — open that country's profile page for its policy and
          market updates.
        </p>
      ) : (
      <ChartHeat
        unitLabel={metric.unit}
        measureLabel={metric.label}
        measureHelp={metric.help}
        indexLabel="Global listed airlines index"
        format={(n: number) => fmt(n, metric.decimals)}
        items={sorted.map((a) => ({
          key: a.code,
          label: a.name,
          sub: a.note,
          value: valueOf(a),
          logo: entityLogoByName(a.name),
          meta: priceMeta(get(AIRLINE_TICKERS[a.code])),
          tone: priceTone(get(AIRLINE_TICKERS[a.code])),
          changePct: get(AIRLINE_TICKERS[a.code])?.changePct,
        }))}
        onSelect={openEntityNews}
        news={Object.fromEntries(
          sorted.map((a) => [
            a.code,
            { name: a.name, query: `${a.name} sustainable aviation fuel OR SAF` },
          ]),
        )}
      />
      )}
    </ChartPanel>
  );
}
