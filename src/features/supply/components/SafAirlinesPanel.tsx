import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChartMap } from "@/components/ChartMap";
import { Plane } from "lucide-react";
import {
  ChartBars,
  ChartHeat,
  ChartPanel,
  ChartScatter,
  ChartTable,
  ChartTrend,
  PANEL_VIEWS,
  chartFmt as fmt,
  type PanelView,
  type ScatterPoint,
  PanelActions,
  summaryOf,
} from "@/components/chart-kit";
import { ghgSavingsMt, GHG_NOTE } from "@/shared/ghg-savings";
import { GhgEmptyNotice } from "@/components/GhgEmptyNotice";
import {
  useEntityDetail,
  type GraphContext,
} from "@/features/markets/components/EntityDetailSheet";
import { ChartFilterBar, countryFilterOptions, useChartFilter } from "@/components/chart-filters";
import { entityLogoByName } from "@/features/markets/entity-logos";
import { AIRLINE_TICKERS } from "@/features/markets/entity-tickers";
import { listingMeta } from "@/features/markets/lib/listing";
import { marketCapValue, marketCapLabel, MARKET_CAP_NOTE } from "@/features/markets/market-caps";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { getSupplyDatasetFn } from "@/features/supply/server-functions";
import type { SupplyDatasetPayload } from "@/features/supply/contracts";
import { SupplySourceFacts } from "./SupplySourceFacts";
import { metaString, metricRows, metricValue } from "./dynamic-supply-rows";

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
  {
    code: "UA",
    name: "United Airlines",
    country: "United States",
    flag: "🇺🇸",
    volume: 40,
    share: 0.35,
    note: "Largest US SAF offtake portfolio and Sustainable Flight Fund.",
  },
  {
    code: "AF/KL",
    name: "Air France-KLM",
    country: "France / Netherlands",
    flag: "🇫🇷",
    volume: 38,
    share: 1.1,
    note: "Meets French and Dutch blending mandates; long-term Neste supply.",
  },
  {
    code: "LH",
    name: "Lufthansa Group",
    country: "Germany",
    flag: "🇩🇪",
    volume: 30,
    share: 0.6,
    note: "EU ReFuelEU blending plus corporate SAF programmes.",
  },
  {
    code: "BA/IAG",
    name: "IAG (British Airways)",
    country: "United Kingdom",
    flag: "🇬🇧",
    volume: 28,
    share: 1.4,
    note: "Targets 10% SAF by 2030; UK mandate compliance.",
  },
  {
    code: "DL",
    name: "Delta Air Lines",
    country: "United States",
    flag: "🇺🇸",
    volume: 25,
    share: 0.2,
    note: "Multiple US offtakes incl. Gevo and Neste.",
  },
  {
    code: "SQ",
    name: "Singapore Airlines",
    country: "Singapore",
    flag: "🇸🇬",
    volume: 18,
    share: 0.5,
    note: "Singapore 1% SAF levy from 2026.",
  },
  {
    code: "AA",
    name: "American Airlines",
    country: "United States",
    flag: "🇺🇸",
    volume: 16,
    share: 0.15,
    note: "Gevo and Infinium supply agreements.",
  },
  {
    code: "QF",
    name: "Qantas",
    country: "Australia",
    flag: "🇦🇺",
    volume: 12,
    share: 0.4,
    note: "London and California uplift, domestic SAF fund.",
  },
  {
    code: "JL",
    name: "Japan Airlines",
    country: "Japan",
    flag: "🇯🇵",
    volume: 10,
    share: 0.3,
    note: "Japan 10% SAF-by-2030 target.",
  },
  {
    code: "EK",
    name: "Emirates",
    country: "UAE",
    flag: "🇦🇪",
    volume: 9,
    share: 0.1,
    note: "Neste supply at DXB and Amsterdam.",
  },
  {
    code: "AC",
    name: "Air Canada",
    country: "Canada",
    flag: "🇨🇦",
    volume: 8.5,
    share: 0.25,
    note: "Canadian SAF coalition and California uplift.",
  },
  {
    code: "CX",
    name: "Cathay Pacific",
    country: "Hong Kong",
    flag: "🇭🇰",
    volume: 8,
    share: 0.3,
    note: "Targets 10% SAF by 2030; corporate SAF programme.",
  },
  {
    code: "KE",
    name: "Korean Air",
    country: "South Korea",
    flag: "🇰🇷",
    volume: 7.5,
    share: 0.2,
    note: "Korea 1% SAF mandate from 2027.",
  },
  {
    code: "AZ/ITA",
    name: "ITA Airways",
    country: "Italy",
    flag: "🇮🇹",
    volume: 7,
    share: 0.9,
    note: "ReFuelEU compliance with Eni Enilive supply.",
  },
  {
    code: "IB",
    name: "Iberia",
    country: "Spain",
    flag: "🇪🇸",
    volume: 6.5,
    share: 0.8,
    note: "Repsol SAF supply across Spanish hubs.",
  },
  {
    code: "SK",
    name: "SAS",
    country: "Scandinavia",
    flag: "🇸🇪",
    volume: 6,
    share: 1.0,
    note: "Nordic blending mandates in Sweden and Norway.",
  },
  {
    code: "LX",
    name: "Swiss International",
    country: "Switzerland",
    flag: "🇨🇭",
    volume: 5.5,
    share: 0.7,
    note: "Swiss CO2 Act SAF blending obligation.",
  },
  {
    code: "AS",
    name: "Alaska Airlines",
    country: "United States",
    flag: "🇺🇸",
    volume: 5,
    share: 0.2,
    note: "West-coast SAF corridors and Gevo offtake.",
  },
  {
    code: "WN",
    name: "Southwest Airlines",
    country: "United States",
    flag: "🇺🇸",
    volume: 4.5,
    share: 0.1,
    note: "USA BioEnergy and LanzaJet offtakes.",
  },
  {
    code: "NZ",
    name: "Air New Zealand",
    country: "New Zealand",
    flag: "🇳🇿",
    volume: 4,
    share: 0.4,
    note: "Neste imports and domestic SAF development.",
  },
  {
    code: "TK",
    name: "Turkish Airlines",
    country: "Türkiye",
    flag: "🇹🇷",
    volume: 6,
    share: 0.15,
    note: "SAF blending at Istanbul with Turkish refiner supply.",
  },
  {
    code: "QR",
    name: "Qatar Airways",
    country: "Qatar",
    flag: "🇶🇦",
    volume: 5.5,
    share: 0.1,
    note: "SAF uplift at European hubs and Doha trials.",
  },
  {
    code: "EY",
    name: "Etihad Airways",
    country: "UAE",
    flag: "🇦🇪",
    volume: 4.2,
    share: 0.15,
    note: "Sustainable flight programme with World Energy and Neste.",
  },
  {
    code: "SV",
    name: "Saudia",
    country: "Saudi Arabia",
    flag: "🇸🇦",
    volume: 3,
    share: 0.08,
    note: "Aramco-linked SAF supply for Jeddah and Riyadh.",
  },
  {
    code: "AI",
    name: "Air India",
    country: "India",
    flag: "🇮🇳",
    volume: 3.5,
    share: 0.1,
    note: "Indian 1% SAF-by-2027 international target.",
  },
  {
    code: "6E",
    name: "IndiGo",
    country: "India",
    flag: "🇮🇳",
    volume: 2.8,
    share: 0.05,
    note: "Domestic SAF trials with Indian Oil and Praj.",
  },
  {
    code: "CA",
    name: "Air China",
    country: "China",
    flag: "🇨🇳",
    volume: 5,
    share: 0.1,
    note: "Domestic SAF from Sinopec Zhenhai HEFA unit.",
  },
  {
    code: "MU",
    name: "China Eastern",
    country: "China",
    flag: "🇨🇳",
    volume: 4.8,
    share: 0.1,
    note: "State SAF pilot programme on selected routes.",
  },
  {
    code: "CZ",
    name: "China Southern",
    country: "China",
    flag: "🇨🇳",
    volume: 4.5,
    share: 0.09,
    note: "SAF pilot flights under CAAC blending trials.",
  },
  {
    code: "NH",
    name: "ANA",
    country: "Japan",
    flag: "🇯🇵",
    volume: 9,
    share: 0.28,
    note: "Corporate SAF programme and Neste offtake at Japanese hubs.",
  },
  {
    code: "TG",
    name: "Thai Airways",
    country: "Thailand",
    flag: "🇹🇭",
    volume: 3.2,
    share: 0.12,
    note: "Bangchak SAF supply ahead of Thailand's 1% mandate.",
  },
  {
    code: "GA",
    name: "Garuda Indonesia",
    country: "Indonesia",
    flag: "🇮🇩",
    volume: 2.2,
    share: 0.08,
    note: "Pertamina J2.4 bioavtur trials on domestic routes.",
  },
  {
    code: "MH",
    name: "Malaysia Airlines",
    country: "Malaysia",
    flag: "🇲🇾",
    volume: 2.4,
    share: 0.1,
    note: "Petronas SAF supply and Neste-fuelled long-haul flights.",
  },
  {
    code: "VN",
    name: "Vietnam Airlines",
    country: "Vietnam",
    flag: "🇻🇳",
    volume: 1.8,
    share: 0.06,
    note: "First SAF-powered flights from European departures.",
  },
  {
    code: "BR",
    name: "EVA Air",
    country: "Taiwan",
    flag: "🇹🇼",
    volume: 2.6,
    share: 0.12,
    note: "SAF uplift on trans-Pacific and European routes.",
  },
  {
    code: "TP",
    name: "TAP Air Portugal",
    country: "Portugal",
    flag: "🇵🇹",
    volume: 3.4,
    share: 0.7,
    note: "ReFuelEU compliance with Galp SAF supply.",
  },
  {
    code: "FR",
    name: "Ryanair",
    country: "Ireland",
    flag: "🇮🇪",
    volume: 9.5,
    share: 0.6,
    note: "Targets 12.5% SAF by 2030 with OMV and Neste deals.",
  },
  {
    code: "U2",
    name: "easyJet",
    country: "United Kingdom",
    flag: "🇬🇧",
    volume: 7,
    share: 0.55,
    note: "UK SAF mandate compliance across the short-haul network.",
  },
  {
    code: "W6",
    name: "Wizz Air",
    country: "Hungary",
    flag: "🇭🇺",
    volume: 4,
    share: 0.4,
    note: "Central European SAF purchases under ReFuelEU.",
  },
  {
    code: "AY",
    name: "Finnair",
    country: "Finland",
    flag: "🇫🇮",
    volume: 4.4,
    share: 0.9,
    note: "Neste supply at Helsinki plus corporate SAF programme.",
  },
  {
    code: "OS",
    name: "Austrian Airlines",
    country: "Austria",
    flag: "🇦🇹",
    volume: 3,
    share: 0.6,
    note: "OMV SAF supply at Vienna under the EU mandate.",
  },
  {
    code: "SN",
    name: "Brussels Airlines",
    country: "Belgium",
    flag: "🇧🇪",
    volume: 2.6,
    share: 0.6,
    note: "Belgian SAF blending obligation from 2025.",
  },
  {
    code: "LO",
    name: "LOT Polish Airlines",
    country: "Poland",
    flag: "🇵🇱",
    volume: 2.4,
    share: 0.5,
    note: "Orlen SAF supply at Warsaw Chopin.",
  },
  {
    code: "AV",
    name: "Avianca",
    country: "Colombia",
    flag: "🇨🇴",
    volume: 2,
    share: 0.1,
    note: "Latin America's largest SAF pilot programme.",
  },
  {
    code: "LA",
    name: "LATAM Airlines",
    country: "Chile",
    flag: "🇨🇱",
    volume: 2.8,
    share: 0.12,
    note: "Regional SAF agreements across Chile and Brazil.",
  },
  {
    code: "G3",
    name: "GOL Linhas Aéreas",
    country: "Brazil",
    flag: "🇧🇷",
    volume: 2.2,
    share: 0.1,
    note: "Brazilian Fuel of the Future law compliance with domestic SAF.",
  },
  {
    code: "AM",
    name: "Aeroméxico",
    country: "Mexico",
    flag: "🇲🇽",
    volume: 1.6,
    share: 0.07,
    note: "SAF uplift on European departures and Mexico City trials.",
  },
  {
    code: "ET",
    name: "Ethiopian Airlines",
    country: "Ethiopia",
    flag: "🇪🇹",
    volume: 1.4,
    share: 0.05,
    note: "Africa's largest carrier running first SAF-powered flights.",
  },
  {
    code: "SA",
    name: "South African Airways",
    country: "South Africa",
    flag: "🇿🇦",
    volume: 0.9,
    share: 0.05,
    note: "Historic Sasol SAF flights and renewed blending plans.",
  },
  {
    code: "MS",
    name: "EgyptAir",
    country: "Egypt",
    flag: "🇪🇬",
    volume: 1.1,
    share: 0.05,
    note: "SAF-powered departures from European airports.",
  },
  {
    code: "VS",
    name: "Virgin Atlantic",
    country: "United Kingdom",
    flag: "🇬🇧",
    volume: 5.2,
    share: 1.2,
    note: "Flew the first 100% SAF transatlantic flight.",
  },
  {
    code: "DY",
    name: "Norwegian",
    country: "Norway",
    flag: "🇳🇴",
    volume: 2.8,
    share: 0.8,
    note: "Norwegian SAF blending mandate compliance.",
  },
];

type AirlineMetric = "volume" | "share" | "marketcap" | "ghg";

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
  marketcap: {
    label: "Market cap (approx.)",
    unit: "approximate market capitalisation, USD billions",
    help: "Approximate latest market capitalisation in USD billions, converted at recent exchange rates. Private, state-owned or unlisted entities rank last.",
    decimals: 1,
    value: (a) => marketCapValue(AIRLINE_TICKERS[a.code]),
  },

  ghg: {
    label: "GHG savings (reported)",
    unit: "million tonnes CO₂e avoided per year",
    help: GHG_NOTE,
    decimals: 1,
    value: (a) => ghgSavingsMt(a.name),
  },
};

/** Defines the scatter-plot axes for each selected metric so X and Y never collide. */
function scatterAxes(metricKey: AirlineMetric) {
  if (metricKey === "share") {
    return {
      x: {
        metric: AIRLINE_METRICS.volume,
        help: "X-axis shows absolute SAF volume; Y-axis shows SAF intensity.",
      },
      y: AIRLINE_METRICS.share,
      size: { label: "SAF share of fuel burn", unit: "%", value: (a: Airline) => a.share },
    };
  }
  if (metricKey === "marketcap") {
    return {
      x: {
        metric: AIRLINE_METRICS.volume,
        help: "X-axis shows absolute SAF volume; Y-axis shows market cap.",
      },
      y: AIRLINE_METRICS.marketcap,
      size: { label: "SAF uplift volume", unit: "Ml/yr", value: (a: Airline) => a.volume },
    };
  }
  return {
    x: {
      metric: AIRLINE_METRICS.share,
      help: "X-axis shows SAF intensity; Y-axis shows absolute SAF volume.",
    },
    y: AIRLINE_METRICS.volume,
    size: { label: "SAF share of fuel burn", unit: "%", value: (a: Airline) => a.share },
  };
}

const DYNAMIC_METRICS = ["safUpliftMl", "volume", "safVolumeMl"];

function mergeDynamicAirlines(payload: SupplyDatasetPayload | undefined): Airline[] {
  const rows = metricRows(payload, DYNAMIC_METRICS);
  if (rows.length === 0) return AIRLINES;
  const byName = new Map(AIRLINES.map((airline) => [airline.name, airline]));
  for (const row of rows) {
    const volume = metricValue(row, DYNAMIC_METRICS);
    if (volume === null) continue;
    const fallback = byName.get(row.name);
    byName.set(row.name, {
      code: metaString(row.metadata["code"], fallback?.code ?? row.name.slice(0, 3).toUpperCase()),
      name: row.name,
      country: row.country ?? metaString(row.metadata["country"], fallback?.country ?? "Unknown"),
      flag: fallback?.flag ?? "",
      volume,
      share: metricValue(row, ["safSharePct", "share"]) ?? fallback?.share ?? 0,
      note: metaString(row.metadata["note"], fallback?.note ?? "Source-backed SAF airline row"),
    });
  }
  return [...byName.values()];
}

export function SafAirlinesPanel() {
  const [metricKey, setMetricKey] = useState<AirlineMetric>("volume");
  const [view, setView] = useState<PanelView>("heat");
  const detail = useEntityDetail();
  const { data: dynamicPayload } = useQuery({
    queryKey: ["supply-dataset", "saf-airlines"],
    queryFn: () => getSupplyDatasetFn({ data: { datasetId: "saf-airlines" } }),
    staleTime: 15 * 60 * 1000,
  });
  const airlines = useMemo(() => mergeDynamicAirlines(dynamicPayload), [dynamicPayload]);
  const metric = AIRLINE_METRICS[metricKey];
  const valueOf = (a: Airline) => metric.value(a);
  const f = useChartFilter(airlines, {
    text: (a) => `${a.name} ${a.code} ${a.country} ${a.note}`,
    facetA: (a) => a.country,
  });
  const ranked = [...f.filtered].sort((a, b) => valueOf(b) - valueOf(a));
  // Default view is the global top 10; once a country or search filter is
  // applied we show every matching airline in that selection (capped at 20).
  const isFiltered = Boolean(f.a || f.b || f.query.trim());
  const sorted =
    view === "table" || view === "map" ? ranked : ranked.slice(0, isFiltered ? 20 : 10);
  const ghgEmpty =
    metricKey === "ghg" && ranked.length > 0 && !ranked.some((x) => ghgSavingsMt(x.name) > 0);

  const axes = scatterAxes(metricKey);
  const scatterPoints: ScatterPoint[] = sorted.map((a) => ({
    key: a.code,
    label: a.name,
    sub: `${a.code} · ${a.country}`,
    x: axes.x.metric.value(a),
    y: valueOf(a),
    size: axes.size.value(a),
    group: a.country,
    logo: entityLogoByName(a.name),
    meta: listingMeta(AIRLINE_TICKERS[a.code]),
    newsTarget: { name: a.name, query: `${a.name} sustainable aviation fuel OR SAF` },
  }));

  const items = sorted.map((a) => ({
    key: a.code,
    label: a.name,
    sub: a.note,
    value: valueOf(a),
    logo: entityLogoByName(a.name),
    meta: listingMeta(AIRLINE_TICKERS[a.code]),
  }));
  const newsMap = Object.fromEntries(
    sorted.map((a) => [
      a.code,
      { name: a.name, query: `${a.name} sustainable aviation fuel OR SAF` },
    ]),
  );
  const filters: [string, string][] = [["Country", f.a || "All countries"]];
  if (f.query.trim()) filters.push(["Search", `"${f.query.trim()}"`]);
  const graph: GraphContext = {
    measure: metric.label,
    unit: metric.unit,
    view: PANEL_VIEWS.find((v) => v.value === view)?.label ?? view,
    filters,
    items: sorted.map((a) => ({ name: a.name, value: valueOf(a) })),
    format: (n: number) => fmt(n, metric.decimals),
  };
  const onSelect = detail.onSelect((t) => {
    const a = sorted.find((x) => x.name === t?.name);
    if (!a) return null;
    return {
      name: a.name,
      sub: `${a.flag} ${a.country} · ${a.code}`,
      logo: entityLogoByName(a.name),
      note: a.note,
      stats: [
        { label: "SAF uplift", value: `${fmt(a.volume, 0)} Ml/yr` },
        { label: "SAF share of fuel burn", value: `${fmt(a.share, 2)}%` },
        { label: "Ticker", value: AIRLINE_TICKERS[a.code] ?? "Not listed" },
        {
          label: "Market cap (approx.)",
          value: marketCapLabel(AIRLINE_TICKERS[a.code]) ?? "Private / state-owned",
        },
      ],
      news: { name: a.name, query: `${a.name} sustainable aviation fuel OR SAF` },
    };
  }, graph);

  return (
    <>
      {detail.sheet}
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
        viewValue={view}
        viewOptions={PANEL_VIEWS}
        onViewChange={(v) => setView(v as PanelView)}
        actions={
          <PanelActions
            summaryBuild={() =>
              summaryOf({
                panel: "Top airlines using SAF globally",
                measureLabel: metric.label,
                unit: metric.unit,
                filters: [f.a, f.b],
                items,
                total: ranked.length,
              })
            }
          >
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
                  "Market cap (approx., USD bn)",
                  "Note",
                ],
                rows: ranked.map((a) => {
                  return [
                    a.name,
                    a.code,
                    a.country,
                    a.volume,
                    a.share,
                    AIRLINE_TICKERS[a.code] ?? "",
                    marketCapLabel(AIRLINE_TICKERS[a.code]) ?? "",
                    a.note,
                  ];
                }),
              })}
            />
          </PanelActions>
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
                options: countryFilterOptions(airlines.map((a) => a.country)),
                onChange: f.setA,
                allLabel: "All countries",
              },
            ]}
            shown={sorted.length}
            total={airlines.length}
            matched={ranked.length}
          />
        }
        footnote={
          view === "scatter"
            ? `Scatter plot: X = ${axes.x.metric.label}, Y = ${metric.label}, bubble size = ${axes.size.label}. ${axes.x.help} Estimates from airline sustainability reports, offtake announcements and regulatory disclosures. Click any bubble for the latest SAF news for that carrier. ${MARKET_CAP_NOTE}`
            : `Estimates from airline sustainability reports, offtake announcements and regulatory disclosures. Click any row for the latest SAF news for that carrier. ${MARKET_CAP_NOTE}`
        }
      >
        {ghgEmpty ? (
          <GhgEmptyNotice />
        ) : sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No listed airlines for this filter — open that country's profile page for its policy and
            market updates.
          </p>
        ) : view === "line" ? (
          <ChartTrend panel="saf" />
        ) : view === "scatter" ? (
          <ChartScatter
            points={scatterPoints}
            xAxis={{ label: axes.x.metric.label, unit: axes.x.metric.unit, help: axes.x.help }}
            yAxis={{ label: metric.label, unit: metric.unit, help: metric.help }}
            sizeAxis={{ label: axes.size.label, unit: axes.size.unit }}
            formatX={(n) => fmt(n, axes.x.metric.decimals)}
            formatY={(n) => fmt(n, metric.decimals)}
            formatSize={(n) => fmt(n, 0)}
            onSelect={onSelect}
            indexLabel="Global listed airlines index"
          />
        ) : view === "map" ? (
          <ChartMap
            points={sorted.map((a) => ({
              key: a.code,
              label: a.name,
              country: a.country,
              value: valueOf(a),
              sub: a.note,
              newsTarget: { name: a.name, query: `${a.name} sustainable aviation fuel OR SAF` },
            }))}
            measureLabel={metric.label}
            unitLabel={metric.unit}
            format={(n: number) => fmt(n, metric.decimals)}
            onSelect={onSelect}
          />
        ) : view === "bars" ? (
          <ChartBars
            items={items}
            unitLabel={metric.unit}
            yLabel="Airline"
            metaHeader="Market"
            format={(n: number) => fmt(n, metric.decimals)}
            news={newsMap}
            onSelect={onSelect}
          />
        ) : view === "table" ? (
          <ChartTable
            items={items}
            measureLabel={metric.label}
            unitLabel={metric.unit}
            format={(n: number) => fmt(n, metric.decimals)}
            news={newsMap}
            onSelect={onSelect}
          />
        ) : (
          <ChartHeat
            unitLabel={metric.unit}
            measureLabel={metric.label}
            measureHelp={metric.help}
            indexLabel="Global listed airlines index"
            format={(n: number) => fmt(n, metric.decimals)}
            items={items}
            onSelect={onSelect}
            news={newsMap}
          />
        )}
      </ChartPanel>
      <SupplySourceFacts payload={dynamicPayload} />
    </>
  );
}
