import { useState } from "react";
import { ChartMap } from "@/components/ChartMap";
import { FlaskConical } from "lucide-react";
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
} from "@/components/chart-kit";
import { ghgSavingsMt, GHG_NOTE } from "@/lib/ghg-savings";
import { GhgEmptyNotice } from "@/components/GhgEmptyNotice";
import { detailTone, useEntityDetail, type GraphContext } from "@/components/EntityDetailSheet";
import { priceMeta, priceTone, useEntityQuotes } from "@/lib/use-entity-quotes";
import { ChartFilterBar, countryFilterOptions, useChartFilter } from "@/components/chart-filters";
import { entityLogoByName } from "@/lib/entity-logos";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { marketCapValue, marketCapLabel, MARKET_CAP_NOTE } from "@/lib/market-caps";
import { METHANOL_TICKERS } from "@/lib/entity-tickers";

type Producer = {
  name: string;
  country: string;
  flag: string;
  /** Bio- or e-methanol capacity, thousand tonnes per year (operating + sanctioned) */
  capacityKtY: number;
  /** Fossil CO2 displaced, thousand tonnes CO2e per year */
  co2AvoidedKtY: number;
  route: string;
  note: string;
};

/**
 * Bio-methanol and e-methanol producers — gasification of biomass and waste,
 * black-liquor and biogas routes, and green-hydrogen e-methanol plants
 * supplying shipping, chemicals and blended road fuel.
 */
const PRODUCERS: Producer[] = [
  // ---------- Europe ----------
  { name: "European Energy Kassø", country: "Denmark", flag: "🇩🇰", capacityKtY: 42, co2AvoidedKtY: 90, route: "E-methanol", note: "World's first commercial e-methanol plant, supplying Maersk and Novo Nordisk" },
  { name: "Liquid Wind FlagshipONE (Ørsted)", country: "Sweden", flag: "🇸🇪", capacityKtY: 50, co2AvoidedKtY: 105, route: "E-methanol", note: "Örnsköldsvik project pairing green hydrogen with biogenic CO₂" },
  { name: "Södra Cell Mönsterås", country: "Sweden", flag: "🇸🇪", capacityKtY: 6, co2AvoidedKtY: 13, route: "Black liquor / pulp mill", note: "First commercial biomethanol from crude sulphate methanol" },
  { name: "VärmlandsMetanol", country: "Sweden", flag: "🇸🇪", capacityKtY: 100, co2AvoidedKtY: 210, route: "Biomass gasification", note: "Hagfors forest-residue gasification project in development" },
  { name: "Meva Energy", country: "Sweden", flag: "🇸🇪", capacityKtY: 8, co2AvoidedKtY: 17, route: "Biomass gasification", note: "Industrial residue gasification for renewable gas and methanol" },
  { name: "St1 / Nordic e-methanol", country: "Finland", flag: "🇫🇮", capacityKtY: 30, co2AvoidedKtY: 63, route: "E-methanol", note: "Nordic power-to-methanol projects tied to Baltic shipping" },
  { name: "Nordic Ren-Gas", country: "Finland", flag: "🇫🇮", capacityKtY: 20, co2AvoidedKtY: 42, route: "E-methanol / e-methane", note: "Power-to-X plants using municipal CHP CO₂ and waste heat" },
  { name: "Nordic Electrofuel", country: "Norway", flag: "🇳🇴", capacityKtY: 12, co2AvoidedKtY: 25, route: "E-fuels", note: "Herøya e-fuel plant producing methanol and synthetic crude" },
  { name: "Statkraft Emden", country: "Germany", flag: "🇩🇪", capacityKtY: 25, co2AvoidedKtY: 52, route: "E-methanol", note: "German power-to-X project targeting shipping offtake" },
  { name: "BioMCN (OCI Global)", country: "Netherlands", flag: "🇳🇱", capacityKtY: 60, co2AvoidedKtY: 120, route: "Biogas-to-methanol", note: "Delfzijl plant, Europe's largest certified biomethanol supply" },
  { name: "OCI HyFuels", country: "Netherlands", flag: "🇳🇱", capacityKtY: 45, co2AvoidedKtY: 95, route: "Bio & e-methanol trading", note: "Rotterdam green methanol bunkering and marketing arm" },
  { name: "Enerkem Rotterdam", country: "Netherlands", flag: "🇳🇱", capacityKtY: 80, co2AvoidedKtY: 170, route: "Waste gasification", note: "Port of Rotterdam municipal-waste-to-methanol project" },
  { name: "Zeeland Refinery / Power2X", country: "Netherlands", flag: "🇳🇱", capacityKtY: 35, co2AvoidedKtY: 74, route: "E-methanol", note: "North Sea Port e-methanol development for marine fuel" },
  { name: "Advanced Biofuel Solutions", country: "United Kingdom", flag: "🇬🇧", capacityKtY: 15, co2AvoidedKtY: 32, route: "Waste gasification", note: "Swindon RadGas plant converting residual waste to methanol and BioSNG" },
  { name: "Carbon Neutral Fuels / Highland e-methanol", country: "United Kingdom", flag: "🇬🇧", capacityKtY: 18, co2AvoidedKtY: 38, route: "E-methanol", note: "Scottish wind-powered methanol development for shipping" },
  { name: "Repsol Bilbao e-methanol", country: "Spain", flag: "🇪🇸", capacityKtY: 22, co2AvoidedKtY: 46, route: "E-methanol", note: "Petronor synthetic fuels plant using captured CO₂" },
  { name: "Moeve (Cepsa) Huelva methanol", country: "Spain", flag: "🇪🇸", capacityKtY: 20, co2AvoidedKtY: 42, route: "E-methanol", note: "Andalusian hydrogen valley methanol for marine fuel" },
  { name: "Iberdrola / Foresa", country: "Spain", flag: "🇪🇸", capacityKtY: 10, co2AvoidedKtY: 21, route: "E-methanol", note: "Galicia green methanol joint venture with a chemicals producer" },
  { name: "Ørsted FlagshipONE partners", country: "Denmark", flag: "🇩🇰", capacityKtY: 30, co2AvoidedKtY: 63, route: "E-methanol", note: "Green fuels pipeline supplying container-line offtakers" },
  { name: "Eni bio-methanol", country: "Italy", flag: "🇮🇹", capacityKtY: 14, co2AvoidedKtY: 30, route: "Biogas-to-methanol", note: "Biorefinery-linked methanol and marine fuel supply" },
  { name: "Fintoil / Baltic biomethanol", country: "Estonia", flag: "🇪🇪", capacityKtY: 9, co2AvoidedKtY: 19, route: "Tall oil / pulp residues", note: "Baltic pulp-residue methanol for regional shipping" },
  { name: "PKN Orlen methanol", country: "Poland", flag: "🇵🇱", capacityKtY: 12, co2AvoidedKtY: 25, route: "Waste & e-methanol", note: "Polish green methanol studies tied to Baltic bunkering" },

  // ---------- Asia ----------
  { name: "Geely / Henan Shuncheng", country: "China", flag: "🇨🇳", capacityKtY: 110, co2AvoidedKtY: 230, route: "Coke-oven gas & CO₂", note: "Anyang plant producing recycled-carbon methanol for Geely vehicles" },
  { name: "Carbon Recycling International (Shunli)", country: "China", flag: "🇨🇳", capacityKtY: 110, co2AvoidedKtY: 230, route: "CO₂-to-methanol", note: "Henan Shunli plant using CRI Emissions-to-Liquids technology" },
  { name: "Jiangsu Sailboat Petrochemical", country: "China", flag: "🇨🇳", capacityKtY: 100, co2AvoidedKtY: 210, route: "CO₂-to-methanol", note: "First large CRI-licensed CO₂ methanol unit in Lianyungang" },
  { name: "Envision Chifeng methanol", country: "China", flag: "🇨🇳", capacityKtY: 50, co2AvoidedKtY: 105, route: "E-methanol", note: "Wind-powered green methanol at the net-zero industrial park" },
  { name: "China Energy / Jilin e-methanol", country: "China", flag: "🇨🇳", capacityKtY: 60, co2AvoidedKtY: 126, route: "E-methanol", note: "State-backed green methanol for shipping and chemicals" },
  { name: "Goldwind Xinghua", country: "China", flag: "🇨🇳", capacityKtY: 50, co2AvoidedKtY: 105, route: "E-methanol", note: "First Chinese green methanol cargo delivered to Maersk" },
  { name: "Carbon Recycling International", country: "Iceland", flag: "🇮🇸", capacityKtY: 4, co2AvoidedKtY: 9, route: "CO₂-to-methanol", note: "George Olah plant, the original geothermal CO₂ methanol facility" },
  { name: "Mitsui / Japan green methanol", country: "Japan", flag: "🇯🇵", capacityKtY: 20, co2AvoidedKtY: 42, route: "E-methanol", note: "Trading-house offtake building Japanese green methanol supply" },
  { name: "Mitsubishi Gas Chemical", country: "Japan", flag: "🇯🇵", capacityKtY: 18, co2AvoidedKtY: 38, route: "CO₂-to-methanol", note: "Carbon-recycled methanol development with domestic partners" },
  { name: "HMM / Korea green methanol", country: "South Korea", flag: "🇰🇷", capacityKtY: 15, co2AvoidedKtY: 32, route: "E-methanol", note: "Korean bunkering supply chain for methanol-fuelled boxships" },
  { name: "Thermax / Indian bio-methanol", country: "India", flag: "🇮🇳", capacityKtY: 12, co2AvoidedKtY: 25, route: "Biomass gasification", note: "Methanol blending programme pilots under NITI Aayog roadmap" },
  { name: "Assam Petrochemicals", country: "India", flag: "🇮🇳", capacityKtY: 10, co2AvoidedKtY: 21, route: "Gas & biomass routes", note: "Methanol producer supporting India's M15 blending trials" },

  // ---------- Americas & Oceania ----------
  { name: "Enerkem Alberta Biofuels", country: "Canada", flag: "🇨🇦", capacityKtY: 38, co2AvoidedKtY: 80, route: "Waste gasification", note: "Edmonton plant converting municipal waste to methanol and ethanol" },
  { name: "Varennes Carbon Recycling", country: "Canada", flag: "🇨🇦", capacityKtY: 45, co2AvoidedKtY: 95, route: "Waste & hydrogen", note: "Quebec biofuel plant combining gasification with electrolysis" },
  { name: "Methanex low-carbon methanol", country: "Canada", flag: "🇨🇦", capacityKtY: 30, co2AvoidedKtY: 63, route: "Bio & e-methanol", note: "Geismar Green marketing programme for marine customers" },
  { name: "Proman green methanol", country: "United States", flag: "🇺🇸", capacityKtY: 25, co2AvoidedKtY: 52, route: "Bio & e-methanol", note: "Gulf Coast methanol producer developing renewable-content supply" },
  { name: "HIF Global e-methanol", country: "United States", flag: "🇺🇸", capacityKtY: 40, co2AvoidedKtY: 84, route: "E-methanol", note: "Matagorda Texas e-fuels facility using captured CO₂" },
  { name: "Infinium", country: "United States", flag: "🇺🇸", capacityKtY: 22, co2AvoidedKtY: 46, route: "E-fuels", note: "Project Roadrunner electrofuels for aviation and shipping" },
  { name: "Pacifico Mexinol (Transition Industries)", country: "Mexico", flag: "🇲🇽", capacityKtY: 350, co2AvoidedKtY: 500, route: "Blue & green methanol", note: "Sinaloa mega-project, the largest sanctioned low-carbon methanol plant" },
  { name: "Fortescue Holmaneset methanol", country: "Australia", flag: "🇦🇺", capacityKtY: 18, co2AvoidedKtY: 38, route: "E-methanol", note: "Green methanol stream from the Fortescue green energy portfolio" },
  { name: "ABEL Energy Bell Bay", country: "Australia", flag: "🇦🇺", capacityKtY: 60, co2AvoidedKtY: 126, route: "Biomass & e-methanol", note: "Tasmanian green methanol project for marine bunkering" },
  { name: "Vale / Brazil green methanol", country: "Brazil", flag: "🇧🇷", capacityKtY: 20, co2AvoidedKtY: 42, route: "Biomass gasification", note: "Biogenic methanol studies for mining logistics and shipping" },
  { name: "Raízen bio-methanol", country: "Brazil", flag: "🇧🇷", capacityKtY: 15, co2AvoidedKtY: 32, route: "Bagasse gasification", note: "Sugarcane residue routes to marine methanol" },
  { name: "HIF Global Chile", country: "Chile", flag: "🇨🇱", capacityKtY: 16, co2AvoidedKtY: 34, route: "E-methanol", note: "Haru Oni methanol upstream of the e-gasoline unit in Magallanes" },
];

type Metric = "capacity" | "co2" | "marketcap" | "price" | "ghg";

const METRICS: Record<
  Metric,
  { label: string; unit: string; help: string; decimals: number; value: (p: Producer) => number }
> = {
  capacity: {
    label: "Methanol capacity (kt/yr)",
    unit: "thousand tonnes of bio/e-methanol / year",
    help: "Operating plus sanctioned bio-methanol and e-methanol capacity. Bigger tiles mean more green methanol available for shipping, chemicals and blended fuel.",
    decimals: 1,
    value: (p) => p.capacityKtY,
  },
  co2: {
    label: "Fossil CO₂ displaced (kt/yr)",
    unit: "thousand tonnes CO₂e displaced / year",
    help: "Fossil methanol or marine fuel displaced by the plant's output, using typical well-to-wake intensities. Indicative rather than certified.",
    decimals: 0,
    value: (p) => p.co2AvoidedKtY,
  },
  price: {
    label: "Share price (listing currency)",
    unit: "share price, primary listing currency",
    help: "Latest traded share price on the producer's primary listing, in that exchange's currency. Private, state-owned or unlisted producers have no price and sit at the end.",
    decimals: 2,
    value: () => 0,
  },
  marketcap: {
    label: "Market cap (approx.)",
    unit: "approximate market capitalisation, USD billions",
    help: "Approximate latest market capitalisation in USD billions, converted at recent exchange rates. Private, state-owned or unlisted entities rank last.",
    decimals: 1,
    value: (p) => marketCapValue(METHANOL_TICKERS[p.name]),
  },
  ghg: {
    label: "GHG savings (reported)",
    unit: "million tonnes CO₂e avoided per year",
    help: GHG_NOTE,
    decimals: 1,
    value: (p) => ghgSavingsMt(p.name),
  },
};

function scatterAxes(metricKey: Metric) {
  if (metricKey === "capacity") {
    return {
      x: { metric: METRICS.co2, help: "X-axis shows fossil CO₂ displaced; Y-axis shows methanol capacity." },
      size: { label: "Methanol capacity", unit: "kt/yr", value: (p: Producer) => p.capacityKtY },
    };
  }
  return {
    x: { metric: METRICS.capacity, help: "X-axis shows methanol capacity; Y-axis shows the selected measure." },
    size: { label: "Fossil CO₂ displaced", unit: "kt/yr", value: (p: Producer) => p.co2AvoidedKtY },
  };
}

const TITLE = "Global bio-methanol producers";
const NEWS_SUFFIX = "bio-methanol green methanol plant";

export function BioMethanolPanel() {
  const [metricKey, setMetricKey] = useState<Metric>("capacity");
  const [view, setView] = useState<PanelView>("heat");
  const detail = useEntityDetail();
  const { get } = useEntityQuotes();
  const metric = METRICS[metricKey];
  const valueOf = (p: Producer) =>
    metricKey === "price" ? (get(METHANOL_TICKERS[p.name])?.price ?? 0) : metric.value(p);

  const f = useChartFilter(PRODUCERS, {
    text: (p) => `${p.name} ${p.country} ${p.route} ${p.note}`,
    facetA: (p) => p.country,
    facetB: (p) => p.route,
  });
  const ranked = f.filtered.slice().sort((a, b) => valueOf(b) - valueOf(a));
  const isFiltered = Boolean(f.a || f.b || f.query.trim());
  const rows = view === "table" || view === "map" ? ranked : ranked.slice(0, isFiltered ? 20 : 10);
  const ghgEmpty =
    metricKey === "ghg" && ranked.length > 0 && !ranked.some((x) => ghgSavingsMt(x.name) > 0);

  const axes = scatterAxes(metricKey);
  const scatterPoints: ScatterPoint[] = rows.map((p) => ({
    key: p.name,
    label: p.name,
    sub: `${p.country} · ${p.route}`,
    x: axes.x.metric.value(p),
    y: valueOf(p),
    size: axes.size.value(p),
    group: p.country,
    logo: entityLogoByName(p.name),
    meta: priceMeta(get(METHANOL_TICKERS[p.name])),
    changePct: get(METHANOL_TICKERS[p.name])?.changePct,
    newsTarget: { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` },
  }));

  const items = rows.map((p) => ({
    key: p.name,
    label: p.name,
    sub: `${p.route} · ${p.note}`,
    value: valueOf(p),
    logo: entityLogoByName(p.name),
    meta: priceMeta(get(METHANOL_TICKERS[p.name])),
    tone: priceTone(get(METHANOL_TICKERS[p.name])),
    changePct: get(METHANOL_TICKERS[p.name])?.changePct,
  }));
  const newsMap = Object.fromEntries(
    rows.map((p) => [p.name, { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` }]),
  );
  const filters: [string, string][] = [
    ["Country", f.a || "All countries"],
    ["Route", f.b || "All routes"],
  ];
  if (f.query.trim()) filters.push(["Search", `"${f.query.trim()}"`]);
  const graph: GraphContext = {
    measure: metric.label,
    unit: metric.unit,
    view: PANEL_VIEWS.find((v) => v.value === view)?.label ?? view,
    filters,
    items: rows.map((p) => ({ name: p.name, value: valueOf(p) })),
    format: (n: number) => fmt(n, metric.decimals),
  };
  const onSelect = detail.onSelect((target) => {
    const p = rows.find((r) => r.name === target?.name);
    if (!p) return null;
    return {
      name: p.name,
      sub: `${p.flag} ${p.country}`,
      logo: entityLogoByName(p.name),
      note: p.note,
      stats: [
        { label: "Ticker", value: METHANOL_TICKERS[p.name] ?? "Not listed" },
        {
          label: "Share price",
          value: get(METHANOL_TICKERS[p.name]) ? fmt(get(METHANOL_TICKERS[p.name])!.price, 2) : "—",
        },
        {
          label: "1-day change",
          value: get(METHANOL_TICKERS[p.name])
            ? `${get(METHANOL_TICKERS[p.name])!.changePct >= 0 ? "+" : ""}${get(METHANOL_TICKERS[p.name])!.changePct.toFixed(2)}%`
            : "—",
          tone: detailTone(get(METHANOL_TICKERS[p.name])?.changePct),
        },
        { label: "Methanol capacity", value: `${fmt(p.capacityKtY, 1)} kt/yr` },
        { label: "Fossil CO₂ displaced", value: `${fmt(p.co2AvoidedKtY, 0)} kt/yr` },
        { label: "Production route", value: p.route },
        { label: "Market cap (approx.)", value: marketCapLabel(METHANOL_TICKERS[p.name]) ?? "Private / state-owned" },
      ],
      news: { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` },
    };
  }, graph);

  return (
    <>
      {detail.sheet}
      <ChartPanel
        icon={FlaskConical}
        title={TITLE}
        blurb="Biomass, waste and green-hydrogen methanol plants supplying shipping fuel, chemicals and blended road fuel worldwide."
        metricValue={metricKey}
        metricOptions={(Object.keys(METRICS) as Metric[]).map((m) => ({
          value: m,
          label: METRICS[m].label,
        }))}
        onMetricChange={(v) => setMetricKey(v as Metric)}
        viewValue={view}
        viewOptions={PANEL_VIEWS}
        onViewChange={(v) => setView(v as PanelView)}
        actions={
          <ExportCsvButton
            disabled={ranked.length === 0}
            build={() => ({
              title: TITLE,
              filename: "global-bio-methanol-producers",
              note: `Measure shown: ${metric.label}`,
              header: [
                "Ticker",
                "Share price",
                "1-day change %",
                "Producer",
                "Country",
                "Route",
                "Methanol capacity (kt/yr)",
                "Fossil CO2 displaced (kt/yr)",
                "Market cap (approx., USD bn)",
                "Note",
              ],
              rows: ranked.map((p) => [
                METHANOL_TICKERS[p.name] ?? "Not listed",
                get(METHANOL_TICKERS[p.name])?.price ?? "",
                get(METHANOL_TICKERS[p.name])?.changePct?.toFixed(2) ?? "",
                p.name,
                p.country,
                p.route,
                p.capacityKtY,
                p.co2AvoidedKtY,
                marketCapValue(METHANOL_TICKERS[p.name]),
                p.note,
              ]),
            })}
          />
        }
        filters={
          <ChartFilterBar
            query={f.query}
            onQueryChange={f.setQuery}
            placeholder="Search bio-methanol producers…"
            selects={[
              {
                label: "Country",
                value: f.a,
                options: countryFilterOptions(PRODUCERS.map((p) => p.country)),
                onChange: f.setA,
                allLabel: "All countries",
              },
              {
                label: "Route",
                value: f.b,
                options: countryFilterOptions(PRODUCERS.map((p) => p.route)),
                onChange: f.setB,
                allLabel: "All routes",
              },
            ]}
            shown={rows.length}
            total={PRODUCERS.length}
            matched={ranked.length}
          />
        }
        footnote={`Indicative operating and sanctioned capacities from company disclosures, the Methanol Institute renewable methanol tracker and IRENA. Click any tile for the latest news. ${MARKET_CAP_NOTE}`}
        import { useState } from "react";
import { ChartMap } from "@/components/ChartMap";
import { FlaskConical } from "lucide-react";
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
} from "@/components/chart-kit";
import { ghgSavingsMt, GHG_NOTE } from "@/lib/ghg-savings";
import { GhgEmptyNotice } from "@/components/GhgEmptyNotice";
import { detailTone, useEntityDetail, type GraphContext } from "@/components/EntityDetailSheet";
import { priceMeta, priceTone, useEntityQuotes } from "@/lib/use-entity-quotes";
import { ChartFilterBar, countryFilterOptions, useChartFilter } from "@/components/chart-filters";
import { entityLogoByName } from "@/lib/entity-logos";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { marketCapValue, marketCapLabel, MARKET_CAP_NOTE } from "@/lib/market-caps";
import { METHANOL_TICKERS } from "@/lib/entity-tickers";

type Producer = {
  name: string;
  country: string;
  flag: string;
  /** Bio- or e-methanol capacity, thousand tonnes per year (operating + sanctioned) */
  capacityKtY: number;
  /** Fossil CO2 displaced, thousand tonnes CO2e per year */
  co2AvoidedKtY: number;
  route: string;
  note: string;
};

/**
 * Bio-methanol and e-methanol producers — gasification of biomass and waste,
 * black-liquor and biogas routes, and green-hydrogen e-methanol plants
 * supplying shipping, chemicals and blended road fuel.
 */
const PRODUCERS: Producer[] = [
  // ---------- Europe ----------
  { name: "European Energy Kassø", country: "Denmark", flag: "🇩🇰", capacityKtY: 42, co2AvoidedKtY: 90, route: "E-methanol", note: "World's first commercial e-methanol plant, supplying Maersk and Novo Nordisk" },
  { name: "Liquid Wind FlagshipONE (Ørsted)", country: "Sweden", flag: "🇸🇪", capacityKtY: 50, co2AvoidedKtY: 105, route: "E-methanol", note: "Örnsköldsvik project pairing green hydrogen with biogenic CO₂" },
  { name: "Södra Cell Mönsterås", country: "Sweden", flag: "🇸🇪", capacityKtY: 6, co2AvoidedKtY: 13, route: "Black liquor / pulp mill", note: "First commercial biomethanol from crude sulphate methanol" },
  { name: "VärmlandsMetanol", country: "Sweden", flag: "🇸🇪", capacityKtY: 100, co2AvoidedKtY: 210, route: "Biomass gasification", note: "Hagfors forest-residue gasification project in development" },
  { name: "Meva Energy", country: "Sweden", flag: "🇸🇪", capacityKtY: 8, co2AvoidedKtY: 17, route: "Biomass gasification", note: "Industrial residue gasification for renewable gas and methanol" },
  { name: "St1 / Nordic e-methanol", country: "Finland", flag: "🇫🇮", capacityKtY: 30, co2AvoidedKtY: 63, route: "E-methanol", note: "Nordic power-to-methanol projects tied to Baltic shipping" },
  { name: "Nordic Ren-Gas", country: "Finland", flag: "🇫🇮", capacityKtY: 20, co2AvoidedKtY: 42, route: "E-methanol / e-methane", note: "Power-to-X plants using municipal CHP CO₂ and waste heat" },
  { name: "Nordic Electrofuel", country: "Norway", flag: "🇳🇴", capacityKtY: 12, co2AvoidedKtY: 25, route: "E-fuels", note: "Herøya e-fuel plant producing methanol and synthetic crude" },
  { name: "Statkraft Emden", country: "Germany", flag: "🇩🇪", capacityKtY: 25, co2AvoidedKtY: 52, route: "E-methanol", note: "German power-to-X project targeting shipping offtake" },
  { name: "BioMCN (OCI Global)", country: "Netherlands", flag: "🇳🇱", capacityKtY: 60, co2AvoidedKtY: 120, route: "Biogas-to-methanol", note: "Delfzijl plant, Europe's largest certified biomethanol supply" },
  { name: "OCI HyFuels", country: "Netherlands", flag: "🇳🇱", capacityKtY: 45, co2AvoidedKtY: 95, route: "Bio & e-methanol trading", note: "Rotterdam green methanol bunkering and marketing arm" },
  { name: "Enerkem Rotterdam", country: "Netherlands", flag: "🇳🇱", capacityKtY: 80, co2AvoidedKtY: 170, route: "Waste gasification", note: "Port of Rotterdam municipal-waste-to-methanol project" },
  { name: "Zeeland Refinery / Power2X", country: "Netherlands", flag: "🇳🇱", capacityKtY: 35, co2AvoidedKtY: 74, route: "E-methanol", note: "North Sea Port e-methanol development for marine fuel" },
  { name: "Advanced Biofuel Solutions", country: "United Kingdom", flag: "🇬🇧", capacityKtY: 15, co2AvoidedKtY: 32, route: "Waste gasification", note: "Swindon RadGas plant converting residual waste to methanol and BioSNG" },
  { name: "Carbon Neutral Fuels / Highland e-methanol", country: "United Kingdom", flag: "🇬🇧", capacityKtY: 18, co2AvoidedKtY: 38, route: "E-methanol", note: "Scottish wind-powered methanol development for shipping" },
  { name: "Repsol Bilbao e-methanol", country: "Spain", flag: "🇪🇸", capacityKtY: 22, co2AvoidedKtY: 46, route: "E-methanol", note: "Petronor synthetic fuels plant using captured CO₂" },
  { name: "Moeve (Cepsa) Huelva methanol", country: "Spain", flag: "🇪🇸", capacityKtY: 20, co2AvoidedKtY: 42, route: "E-methanol", note: "Andalusian hydrogen valley methanol for marine fuel" },
  { name: "Iberdrola / Foresa", country: "Spain", flag: "🇪🇸", capacityKtY: 10, co2AvoidedKtY: 21, route: "E-methanol", note: "Galicia green methanol joint venture with a chemicals producer" },
  { name: "Ørsted FlagshipONE partners", country: "Denmark", flag: "🇩🇰", capacityKtY: 30, co2AvoidedKtY: 63, route: "E-methanol", note: "Green fuels pipeline supplying container-line offtakers" },
  { name: "Eni bio-methanol", country: "Italy", flag: "🇮🇹", capacityKtY: 14, co2AvoidedKtY: 30, route: "Biogas-to-methanol", note: "Biorefinery-linked methanol and marine fuel supply" },
  { name: "Fintoil / Baltic biomethanol", country: "Estonia", flag: "🇪🇪", capacityKtY: 9, co2AvoidedKtY: 19, route: "Tall oil / pulp residues", note: "Baltic pulp-residue methanol for regional shipping" },
  { name: "PKN Orlen methanol", country: "Poland", flag: "🇵🇱", capacityKtY: 12, co2AvoidedKtY: 25, route: "Waste & e-methanol", note: "Polish green methanol studies tied to Baltic bunkering" },

  // ---------- Asia ----------
  { name: "Geely / Henan Shuncheng", country: "China", flag: "🇨🇳", capacityKtY: 110, co2AvoidedKtY: 230, route: "Coke-oven gas & CO₂", note: "Anyang plant producing recycled-carbon methanol for Geely vehicles" },
  { name: "Carbon Recycling International (Shunli)", country: "China", flag: "🇨🇳", capacityKtY: 110, co2AvoidedKtY: 230, route: "CO₂-to-methanol", note: "Henan Shunli plant using CRI Emissions-to-Liquids technology" },
  { name: "Jiangsu Sailboat Petrochemical", country: "China", flag: "🇨🇳", capacityKtY: 100, co2AvoidedKtY: 210, route: "CO₂-to-methanol", note: "First large CRI-licensed CO₂ methanol unit in Lianyungang" },
  { name: "Envision Chifeng methanol", country: "China", flag: "🇨🇳", capacityKtY: 50, co2AvoidedKtY: 105, route: "E-methanol", note: "Wind-powered green methanol at the net-zero industrial park" },
  { name: "China Energy / Jilin e-methanol", country: "China", flag: "🇨🇳", capacityKtY: 60, co2AvoidedKtY: 126, route: "E-methanol", note: "State-backed green methanol for shipping and chemicals" },
  { name: "Goldwind Xinghua", country: "China", flag: "🇨🇳", capacityKtY: 50, co2AvoidedKtY: 105, route: "E-methanol", note: "First Chinese green methanol cargo delivered to Maersk" },
  { name: "Carbon Recycling International", country: "Iceland", flag: "🇮🇸", capacityKtY: 4, co2AvoidedKtY: 9, route: "CO₂-to-methanol", note: "George Olah plant, the original geothermal CO₂ methanol facility" },
  { name: "Mitsui / Japan green methanol", country: "Japan", flag: "🇯🇵", capacityKtY: 20, co2AvoidedKtY: 42, route: "E-methanol", note: "Trading-house offtake building Japanese green methanol supply" },
  { name: "Mitsubishi Gas Chemical", country: "Japan", flag: "🇯🇵", capacityKtY: 18, co2AvoidedKtY: 38, route: "CO₂-to-methanol", note: "Carbon-recycled methanol development with domestic partners" },
  { name: "HMM / Korea green methanol", country: "South Korea", flag: "🇰🇷", capacityKtY: 15, co2AvoidedKtY: 32, route: "E-methanol", note: "Korean bunkering supply chain for methanol-fuelled boxships" },
  { name: "Thermax / Indian bio-methanol", country: "India", flag: "🇮🇳", capacityKtY: 12, co2AvoidedKtY: 25, route: "Biomass gasification", note: "Methanol blending programme pilots under NITI Aayog roadmap" },
  { name: "Assam Petrochemicals", country: "India", flag: "🇮🇳", capacityKtY: 10, co2AvoidedKtY: 21, route: "Gas & biomass routes", note: "Methanol producer supporting India's M15 blending trials" },

  // ---------- Americas & Oceania ----------
  { name: "Enerkem Alberta Biofuels", country: "Canada", flag: "🇨🇦", capacityKtY: 38, co2AvoidedKtY: 80, route: "Waste gasification", note: "Edmonton plant converting municipal waste to methanol and ethanol" },
  { name: "Varennes Carbon Recycling", country: "Canada", flag: "🇨🇦", capacityKtY: 45, co2AvoidedKtY: 95, route: "Waste & hydrogen", note: "Quebec biofuel plant combining gasification with electrolysis" },
  { name: "Methanex low-carbon methanol", country: "Canada", flag: "🇨🇦", capacityKtY: 30, co2AvoidedKtY: 63, route: "Bio & e-methanol", note: "Geismar Green marketing programme for marine customers" },
  { name: "Proman green methanol", country: "United States", flag: "🇺🇸", capacityKtY: 25, co2AvoidedKtY: 52, route: "Bio & e-methanol", note: "Gulf Coast methanol producer developing renewable-content supply" },
  { name: "HIF Global e-methanol", country: "United States", flag: "🇺🇸", capacityKtY: 40, co2AvoidedKtY: 84, route: "E-methanol", note: "Matagorda Texas e-fuels facility using captured CO₂" },
  { name: "Infinium", country: "United States", flag: "🇺🇸", capacityKtY: 22, co2AvoidedKtY: 46, route: "E-fuels", note: "Project Roadrunner electrofuels for aviation and shipping" },
  { name: "Pacifico Mexinol (Transition Industries)", country: "Mexico", flag: "🇲🇽", capacityKtY: 350, co2AvoidedKtY: 500, route: "Blue & green methanol", note: "Sinaloa mega-project, the largest sanctioned low-carbon methanol plant" },
  { name: "Fortescue Holmaneset methanol", country: "Australia", flag: "🇦🇺", capacityKtY: 18, co2AvoidedKtY: 38, route: "E-methanol", note: "Green methanol stream from the Fortescue green energy portfolio" },
  { name: "ABEL Energy Bell Bay", country: "Australia", flag: "🇦🇺", capacityKtY: 60, co2AvoidedKtY: 126, route: "Biomass & e-methanol", note: "Tasmanian green methanol project for marine bunkering" },
  { name: "Vale / Brazil green methanol", country: "Brazil", flag: "🇧🇷", capacityKtY: 20, co2AvoidedKtY: 42, route: "Biomass gasification", note: "Biogenic methanol studies for mining logistics and shipping" },
  { name: "Raízen bio-methanol", country: "Brazil", flag: "🇧🇷", capacityKtY: 15, co2AvoidedKtY: 32, route: "Bagasse gasification", note: "Sugarcane residue routes to marine methanol" },
  { name: "HIF Global Chile", country: "Chile", flag: "🇨🇱", capacityKtY: 16, co2AvoidedKtY: 34, route: "E-methanol", note: "Haru Oni methanol upstream of the e-gasoline unit in Magallanes" },
];

type Metric = "capacity" | "co2" | "marketcap" | "price" | "ghg";

const METRICS: Record<
  Metric,
  { label: string; unit: string; help: string; decimals: number; value: (p: Producer) => number }
> = {
  capacity: {
    label: "Methanol capacity (kt/yr)",
    unit: "thousand tonnes of bio/e-methanol / year",
    help: "Operating plus sanctioned bio-methanol and e-methanol capacity. Bigger tiles mean more green methanol available for shipping, chemicals and blended fuel.",
    decimals: 1,
    value: (p) => p.capacityKtY,
  },
  co2: {
    label: "Fossil CO₂ displaced (kt/yr)",
    unit: "thousand tonnes CO₂e displaced / year",
    help: "Fossil methanol or marine fuel displaced by the plant's output, using typical well-to-wake intensities. Indicative rather than certified.",
    decimals: 0,
    value: (p) => p.co2AvoidedKtY,
  },
  price: {
    label: "Share price (listing currency)",
    unit: "share price, primary listing currency",
    help: "Latest traded share price on the producer's primary listing, in that exchange's currency. Private, state-owned or unlisted producers have no price and sit at the end.",
    decimals: 2,
    value: () => 0,
  },
  marketcap: {
    label: "Market cap (approx.)",
    unit: "approximate market capitalisation, USD billions",
    help: "Approximate latest market capitalisation in USD billions, converted at recent exchange rates. Private, state-owned or unlisted entities rank last.",
    decimals: 1,
    value: (p) => marketCapValue(METHANOL_TICKERS[p.name]),
  },
  ghg: {
    label: "GHG savings (reported)",
    unit: "million tonnes CO₂e avoided per year",
    help: GHG_NOTE,
    decimals: 1,
    value: (p) => ghgSavingsMt(p.name),
  },
};

function scatterAxes(metricKey: Metric) {
  if (metricKey === "capacity") {
    return {
      x: { metric: METRICS.co2, help: "X-axis shows fossil CO₂ displaced; Y-axis shows methanol capacity." },
      size: { label: "Methanol capacity", unit: "kt/yr", value: (p: Producer) => p.capacityKtY },
    };
  }
  return {
    x: { metric: METRICS.capacity, help: "X-axis shows methanol capacity; Y-axis shows the selected measure." },
    size: { label: "Fossil CO₂ displaced", unit: "kt/yr", value: (p: Producer) => p.co2AvoidedKtY },
  };
}

const TITLE = "Global bio-methanol producers";
const NEWS_SUFFIX = "bio-methanol green methanol plant";

export function BioMethanolPanel() {
  const [metricKey, setMetricKey] = useState<Metric>("capacity");
  const [view, setView] = useState<PanelView>("heat");
  const detail = useEntityDetail();
  const { get } = useEntityQuotes();
  const metric = METRICS[metricKey];
  const valueOf = (p: Producer) =>
    metricKey === "price" ? (get(METHANOL_TICKERS[p.name])?.price ?? 0) : metric.value(p);

  const f = useChartFilter(PRODUCERS, {
    text: (p) => `${p.name} ${p.country} ${p.route} ${p.note}`,
    facetA: (p) => p.country,
    facetB: (p) => p.route,
  });
  const ranked = f.filtered.slice().sort((a, b) => valueOf(b) - valueOf(a));
  const isFiltered = Boolean(f.a || f.b || f.query.trim());
  const rows = view === "table" || view === "map" ? ranked : ranked.slice(0, isFiltered ? 20 : 10);
  const ghgEmpty =
    metricKey === "ghg" && ranked.length > 0 && !ranked.some((x) => ghgSavingsMt(x.name) > 0);

  const axes = scatterAxes(metricKey);
  const scatterPoints: ScatterPoint[] = rows.map((p) => ({
    key: p.name,
    label: p.name,
    sub: `${p.country} · ${p.route}`,
    x: axes.x.metric.value(p),
    y: valueOf(p),
    size: axes.size.value(p),
    group: p.country,
    logo: entityLogoByName(p.name),
    meta: priceMeta(get(METHANOL_TICKERS[p.name])),
    changePct: get(METHANOL_TICKERS[p.name])?.changePct,
    newsTarget: { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` },
  }));

  const items = rows.map((p) => ({
    key: p.name,
    label: p.name,
    sub: `${p.route} · ${p.note}`,
    value: valueOf(p),
    logo: entityLogoByName(p.name),
    meta: priceMeta(get(METHANOL_TICKERS[p.name])),
    tone: priceTone(get(METHANOL_TICKERS[p.name])),
    changePct: get(METHANOL_TICKERS[p.name])?.changePct,
  }));
  const newsMap = Object.fromEntries(
    rows.map((p) => [p.name, { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` }]),
  );
  const filters: [string, string][] = [
    ["Country", f.a || "All countries"],
    ["Route", f.b || "All routes"],
  ];
  if (f.query.trim()) filters.push(["Search", `"${f.query.trim()}"`]);
  const graph: GraphContext = {
    measure: metric.label,
    unit: metric.unit,
    view: PANEL_VIEWS.find((v) => v.value === view)?.label ?? view,
    filters,
    items: rows.map((p) => ({ name: p.name, value: valueOf(p) })),
    format: (n: number) => fmt(n, metric.decimals),
  };
  const onSelect = detail.onSelect((target) => {
    const p = rows.find((r) => r.name === target?.name);
    if (!p) return null;
    return {
      name: p.name,
      sub: `${p.flag} ${p.country}`,
      logo: entityLogoByName(p.name),
      note: p.note,
      stats: [
        { label: "Ticker", value: METHANOL_TICKERS[p.name] ?? "Not listed" },
        {
          label: "Share price",
          value: get(METHANOL_TICKERS[p.name]) ? fmt(get(METHANOL_TICKERS[p.name])!.price, 2) : "—",
        },
        {
          label: "1-day change",
          value: get(METHANOL_TICKERS[p.name])
            ? `${get(METHANOL_TICKERS[p.name])!.changePct >= 0 ? "+" : ""}${get(METHANOL_TICKERS[p.name])!.changePct.toFixed(2)}%`
            : "—",
          tone: detailTone(get(METHANOL_TICKERS[p.name])?.changePct),
        },
        { label: "Methanol capacity", value: `${fmt(p.capacityKtY, 1)} kt/yr` },
        { label: "Fossil CO₂ displaced", value: `${fmt(p.co2AvoidedKtY, 0)} kt/yr` },
        { label: "Production route", value: p.route },
        { label: "Market cap (approx.)", value: marketCapLabel(METHANOL_TICKERS[p.name]) ?? "Private / state-owned" },
      ],
      news: { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` },
    };
  }, graph);

  return (
    <>
      {detail.sheet}
      <ChartPanel
        icon={FlaskConical}
        title={TITLE}
        blurb="Biomass, waste and green-hydrogen methanol plants supplying shipping fuel, chemicals and blended road fuel worldwide."
        metricValue={metricKey}
        metricOptions={(Object.keys(METRICS) as Metric[]).map((m) => ({
          value: m,
          label: METRICS[m].label,
        }))}
        onMetricChange={(v) => setMetricKey(v as Metric)}
        viewValue={view}
        viewOptions={PANEL_VIEWS}
        onViewChange={(v) => setView(v as PanelView)}
        actions={
          <ExportCsvButton
            disabled={ranked.length === 0}
            build={() => ({
              title: TITLE,
              filename: "global-bio-methanol-producers",
              note: `Measure shown: ${metric.label}`,
              header: [
                "Ticker",
                "Share price",
                "1-day change %",
                "Producer",
                "Country",
                "Route",
                "Methanol capacity (kt/yr)",
                "Fossil CO2 displaced (kt/yr)",
                "Market cap (approx., USD bn)",
                "Note",
              ],
              rows: ranked.map((p) => [
                METHANOL_TICKERS[p.name] ?? "Not listed",
                get(METHANOL_TICKERS[p.name])?.price ?? "",
                get(METHANOL_TICKERS[p.name])?.changePct?.toFixed(2) ?? "",
                p.name,
                p.country,
                p.route,
                p.capacityKtY,
                p.co2AvoidedKtY,
                marketCapValue(METHANOL_TICKERS[p.name]),
                p.note,
              ]),
            })}
          />
        }
        filters={
          <ChartFilterBar
            query={f.query}
            onQueryChange={f.setQuery}
            placeholder="Search bio-methanol producers…"
            selects={[
              {
                label: "Country",
                value: f.a,
                options: countryFilterOptions(PRODUCERS.map((p) => p.country)),
                onChange: f.setA,
                allLabel: "All countries",
              },
              {
                label: "Route",
                value: f.b,
                options: countryFilterOptions(PRODUCERS.map((p) => p.route)),
                onChange: f.setB,
                allLabel: "All routes",
              },
            ]}
            shown={rows.length}
            total={PRODUCERS.length}
            matched={ranked.length}
          />
        }
        footnote={`Indicative operating and sanctioned capacities from company disclosures, the Methanol Institute renewable methanol tracker and IRENA. Click any tile for the latest news. ${MARKET_CAP_NOTE}`}
              >
        {ghgEmpty ? (
          <GhgEmptyNotice />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No bio-methanol producers listed for this filter — open that country's profile page for
            its policy and market updates.
          </p>
        ) : view === "line" ? (
          <ChartTrend panel="methanol" />
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
            indexLabel="Global bio-methanol index"
          />
        ) : view === "map" ? (
          <ChartMap
            points={rows.map((p) => ({
              key: p.name,
              label: p.name,
              country: p.country,
              value: valueOf(p),
              sub: p.note,
              newsTarget: { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` },
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
            yLabel="Methanol producer"
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
            indexLabel="Global bio-methanol index"
            format={(n: number) => fmt(n, metric.decimals)}
            items={items}
            onSelect={onSelect}
            news={newsMap}
          />
        )}
      </ChartPanel>
    </>
  );
}
