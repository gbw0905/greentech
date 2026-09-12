import { useState } from "react";
import { ChartMap } from "@/components/ChartMap";
import { Atom } from "lucide-react";
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
  type ScatterPoint, PanelActions, summaryOf, } from "@/components/chart-kit";
import { ghgSavingsMt, GHG_NOTE } from "@/lib/ghg-savings";
import { GhgEmptyNotice } from "@/components/GhgEmptyNotice";
import { detailTone, useEntityDetail, type GraphContext } from "@/components/EntityDetailSheet";
import { priceMeta, priceTone, useEntityQuotes } from "@/lib/use-entity-quotes";
import { ChartFilterBar, countryFilterOptions, useChartFilter } from "@/components/chart-filters";
import { entityLogoByName } from "@/lib/entity-logos";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { marketCapValue, marketCapLabel, MARKET_CAP_NOTE } from "@/lib/market-caps";
import { HYDROGEN_TICKERS } from "@/lib/entity-tickers";

type Producer = {
  name: string;
  country: string;
  flag: string;
  /** Renewable hydrogen output, thousand tonnes H2 per year (operating + sanctioned) */
  capacityKtY: number;
  /** Installed or sanctioned electrolyser capacity, MW */
  electrolyserMw: number;
  route: string;
  note: string;
};

/**
 * Renewable hydrogen producers — electrolytic (wind/solar/hydro powered) and
 * biomass-derived hydrogen developers with operating or sanctioned capacity.
 * Figures are indicative, compiled from company disclosures and the IEA
 * Hydrogen Projects Database.
 */
const PRODUCERS: Producer[] = [
  // ---------- Europe ----------
  { name: "Iberdrola", country: "Spain", flag: "🇪🇸", capacityKtY: 45, electrolyserMw: 520, route: "Solar electrolysis", note: "Puertollano green ammonia plant plus Spanish and UK electrolyser pipeline" },
  { name: "Repsol", country: "Spain", flag: "🇪🇸", capacityKtY: 32, electrolyserMw: 350, route: "Electrolysis", note: "Cartagena and Petronor refinery hydrogen for HVO and SAF units" },
  { name: "Moeve (Cepsa)", country: "Spain", flag: "🇪🇸", capacityKtY: 28, electrolyserMw: 300, route: "Solar electrolysis", note: "Andalusian Green Hydrogen Valley at Huelva and San Roque" },
  { name: "Air Liquide", country: "France", flag: "🇫🇷", capacityKtY: 60, electrolyserMw: 620, route: "Electrolysis", note: "Normand'Hy 200 MW plus Becancour and Antwerp electrolysers" },
  { name: "TotalEnergies", country: "France", flag: "🇫🇷", capacityKtY: 55, electrolyserMw: 580, route: "Electrolysis", note: "Refinery hydrogen swap at Normandy, Zeeland and Leuna" },
  { name: "Engie", country: "France", flag: "🇫🇷", capacityKtY: 24, electrolyserMw: 280, route: "Electrolysis", note: "HyNetherlands, Yuri Australia and French mobility hubs" },
  { name: "Lhyfe", country: "France", flag: "🇫🇷", capacityKtY: 6, electrolyserMw: 90, route: "Offshore & onshore wind", note: "Distributed green hydrogen sites across France and Germany" },
  { name: "Linde", country: "Germany", flag: "🇩🇪", capacityKtY: 48, electrolyserMw: 500, route: "Electrolysis", note: "Leuna 24 MW plus industrial gas supply contracts worldwide" },
  { name: "RWE", country: "Germany", flag: "🇩🇪", capacityKtY: 40, electrolyserMw: 450, route: "Wind electrolysis", note: "Lingen GET H2 cluster scaling toward 300 MW" },
  { name: "Uniper", country: "Germany", flag: "🇩🇪", capacityKtY: 18, electrolyserMw: 220, route: "Electrolysis", note: "Humber H2ub and Wilhelmshaven green hydrogen hub" },
  { name: "Thyssenkrupp Nucera", country: "Germany", flag: "🇩🇪", capacityKtY: 12, electrolyserMw: 900, route: "Alkaline electrolysers", note: "Electrolyser supplier for NEOM and European steel projects" },
  { name: "Shell", country: "Netherlands", flag: "🇳🇱", capacityKtY: 60, electrolyserMw: 200, route: "Offshore wind electrolysis", note: "Holland Hydrogen I at Rotterdam, Europe's largest under construction" },
  { name: "Ørsted", country: "Denmark", flag: "🇩🇰", capacityKtY: 20, electrolyserMw: 250, route: "Offshore wind electrolysis", note: "Green fuels developer supplying e-methanol and e-fuel partners" },
  { name: "Everfuel", country: "Denmark", flag: "🇩🇰", capacityKtY: 8, electrolyserMw: 120, route: "Electrolysis", note: "HySynergy Fredericia supplying refineries and mobility" },
  { name: "European Energy", country: "Denmark", flag: "🇩🇰", capacityKtY: 10, electrolyserMw: 130, route: "Solar & wind electrolysis", note: "Kassø hydrogen feeding the world's first commercial e-methanol plant" },
  { name: "Statkraft", country: "Norway", flag: "🇳🇴", capacityKtY: 14, electrolyserMw: 180, route: "Hydropower electrolysis", note: "Nordic hydrogen hubs for shipping and heavy transport" },
  { name: "Nel", country: "Norway", flag: "🇳🇴", capacityKtY: 5, electrolyserMw: 500, route: "Electrolyser manufacturing", note: "Herøya alkaline gigafactory supplying global projects" },
  { name: "Yara Clean Ammonia", country: "Norway", flag: "🇳🇴", capacityKtY: 22, electrolyserMw: 240, route: "Electrolysis to ammonia", note: "Herøya and Sluiskil renewable ammonia for fuel and fertiliser" },
  { name: "Fortescue (Holmaneset)", country: "Norway", flag: "🇳🇴", capacityKtY: 30, electrolyserMw: 300, route: "Hydropower electrolysis", note: "Norwegian green ammonia project of the Fortescue energy arm" },
  { name: "St1", country: "Finland", flag: "🇫🇮", capacityKtY: 12, electrolyserMw: 150, route: "Wind electrolysis", note: "Lappeenranta and Gothenburg hydrogen for renewable fuels" },
  { name: "P2X Solutions", country: "Finland", flag: "🇫🇮", capacityKtY: 4, electrolyserMw: 20, route: "Electrolysis", note: "Harjavalta plant, Finland's first industrial green hydrogen site" },
  { name: "ITM Power", country: "United Kingdom", flag: "🇬🇧", capacityKtY: 4, electrolyserMw: 350, route: "PEM electrolysers", note: "Sheffield gigafactory supplying UK and EU hydrogen projects" },
  { name: "BP", country: "United Kingdom", flag: "🇬🇧", capacityKtY: 35, electrolyserMw: 380, route: "Electrolysis", note: "HyGreen Teesside and Castellón refinery hydrogen" },
  { name: "EDP / Ren", country: "Portugal", flag: "🇵🇹", capacityKtY: 9, electrolyserMw: 110, route: "Solar electrolysis", note: "Sines hydrogen cluster serving industry and export" },
  { name: "Galp", country: "Portugal", flag: "🇵🇹", capacityKtY: 15, electrolyserMw: 100, route: "Electrolysis", note: "Sines refinery electrolyser paired with the HVO/SAF unit" },
  { name: "Eni", country: "Italy", flag: "🇮🇹", capacityKtY: 20, electrolyserMw: 210, route: "Electrolysis", note: "Refinery hydrogen at Taranto, Gela and Venice biorefineries" },
  { name: "Snam Hydrogen", country: "Italy", flag: "🇮🇹", capacityKtY: 7, electrolyserMw: 80, route: "Electrolysis", note: "Hydrogen-ready network and power-to-gas demonstration plants" },
  { name: "Orlen Hydrogen", country: "Poland", flag: "🇵🇱", capacityKtY: 16, electrolyserMw: 170, route: "Electrolysis", note: "Włocławek and Płock hydrogen hubs plus refuelling network" },
  { name: "MOL Hydrogen", country: "Hungary", flag: "🇭🇺", capacityKtY: 6, electrolyserMw: 10, route: "Electrolysis", note: "Százhalombatta 10 MW electrolyser feeding the Danube refinery" },
  { name: "OMV", country: "Austria", flag: "🇦🇹", capacityKtY: 11, electrolyserMw: 140, route: "Electrolysis", note: "Schwechat 10 MW plus Bruck electrolyser for refinery use" },

  // ---------- Middle East & Africa ----------
  { name: "NEOM Green Hydrogen (ACWA Power)", country: "Saudi Arabia", flag: "🇸🇦", capacityKtY: 219, electrolyserMw: 2200, route: "Solar & wind electrolysis", note: "World's largest sanctioned green hydrogen-to-ammonia plant at Oxagon" },
  { name: "Masdar", country: "United Arab Emirates", flag: "🇦🇪", capacityKtY: 40, electrolyserMw: 420, route: "Solar electrolysis", note: "Abu Dhabi green hydrogen and e-SAF partnerships" },
  { name: "Fertiglobe", country: "United Arab Emirates", flag: "🇦🇪", capacityKtY: 35, electrolyserMw: 100, route: "Electrolysis to ammonia", note: "Egypt and UAE renewable ammonia supply for bunkering" },
  { name: "Oman Hydrom licensees", country: "Oman", flag: "🇴🇲", capacityKtY: 90, electrolyserMw: 1200, route: "Solar & wind electrolysis", note: "Duqm and Dhofar blocks awarded to international consortia" },
  { name: "Sasol", country: "South Africa", flag: "🇿🇦", capacityKtY: 25, electrolyserMw: 280, route: "Electrolysis", note: "Secunda green hydrogen and sustainable aviation fuel programme" },
  { name: "Hive Hydrogen South Africa", country: "South Africa", flag: "🇿🇦", capacityKtY: 45, electrolyserMw: 600, route: "Wind & solar electrolysis", note: "Coega green ammonia export project in the Eastern Cape" },
  { name: "Scatec Egypt", country: "Egypt", flag: "🇪🇬", capacityKtY: 15, electrolyserMw: 100, route: "Solar electrolysis", note: "Ain Sokhna green ammonia for ship bunkering" },
  { name: "CWP Global (Morocco/Mauritania)", country: "Morocco", flag: "🇲🇦", capacityKtY: 50, electrolyserMw: 700, route: "Wind & solar electrolysis", note: "Large-scale African export projects at early construction stage" },

  // ---------- Asia-Pacific ----------
  { name: "Sinopec", country: "China", flag: "🇨🇳", capacityKtY: 130, electrolyserMw: 1000, route: "Solar electrolysis", note: "Kuqa Xinjiang 20,000 t/yr plant and Ordos follow-on" },
  { name: "State Power Investment Corp", country: "China", flag: "🇨🇳", capacityKtY: 60, electrolyserMw: 700, route: "Wind electrolysis", note: "Inner Mongolia hydrogen-to-ammonia and methanol clusters" },
  { name: "Envision Energy", country: "China", flag: "🇨🇳", capacityKtY: 70, electrolyserMw: 650, route: "Wind electrolysis", note: "Chifeng net-zero industrial park supplying green ammonia" },
  { name: "Adani New Industries", country: "India", flag: "🇮🇳", capacityKtY: 80, electrolyserMw: 900, route: "Solar & wind electrolysis", note: "Mundra hydrogen ecosystem with integrated electrolyser manufacturing" },
  { name: "Reliance New Energy", country: "India", flag: "🇮🇳", capacityKtY: 75, electrolyserMw: 850, route: "Solar electrolysis", note: "Jamnagar giga-complex hydrogen for refining and chemicals" },
  { name: "NTPC Green Energy", country: "India", flag: "🇮🇳", capacityKtY: 30, electrolyserMw: 320, route: "Solar electrolysis", note: "Pudimadaka hub and hydrogen blending pilots" },
  { name: "ACME Group", country: "India", flag: "🇮🇳", capacityKtY: 40, electrolyserMw: 450, route: "Solar electrolysis", note: "Oman Duqm and Odisha green ammonia export plants" },
  { name: "Indian Oil green hydrogen", country: "India", flag: "🇮🇳", capacityKtY: 20, electrolyserMw: 200, route: "Electrolysis", note: "Panipat refinery tender for renewable hydrogen supply" },
  { name: "L&T Green Hydrogen", country: "India", flag: "🇮🇳", capacityKtY: 10, electrolyserMw: 120, route: "Electrolysis", note: "Hazira electrolyser manufacturing plus Kakinada projects" },
  { name: "Eneos", country: "Japan", flag: "🇯🇵", capacityKtY: 18, electrolyserMw: 150, route: "Electrolysis & MCH import", note: "Refinery hydrogen and methylcyclohexane carrier supply chain" },
  { name: "Toshiba ESS", country: "Japan", flag: "🇯🇵", capacityKtY: 5, electrolyserMw: 60, route: "Electrolysis", note: "Fukushima Hydrogen Energy Research Field operations" },
  { name: "Hanwha Impact", country: "South Korea", flag: "🇰🇷", capacityKtY: 12, electrolyserMw: 130, route: "Electrolysis", note: "Korean hydrogen turbine and green ammonia co-firing supply" },
  { name: "Fortescue Energy", country: "Australia", flag: "🇦🇺", capacityKtY: 65, electrolyserMw: 750, route: "Solar & wind electrolysis", note: "Gladstone electrolyser factory plus Pilbara and Arizona projects" },
  { name: "Origin Energy", country: "Australia", flag: "🇦🇺", capacityKtY: 20, electrolyserMw: 220, route: "Electrolysis", note: "Hunter Valley hydrogen hub for industry and export" },
  { name: "Woodside Energy", country: "Australia", flag: "🇦🇺", capacityKtY: 26, electrolyserMw: 290, route: "Solar electrolysis", note: "H2OK Oklahoma and Kwinana liquid hydrogen developments" },
  { name: "Hiringa Energy", country: "New Zealand", flag: "🇳🇿", capacityKtY: 4, electrolyserMw: 40, route: "Wind electrolysis", note: "Taranaki refuelling network for heavy trucking" },

  // ---------- Americas ----------
  { name: "Air Products", country: "United States", flag: "🇺🇸", capacityKtY: 110, electrolyserMw: 1100, route: "Solar & wind electrolysis", note: "NEOM partner plus Texas and New York green hydrogen plants" },
  { name: "Plug Power", country: "United States", flag: "🇺🇸", capacityKtY: 25, electrolyserMw: 300, route: "PEM electrolysis", note: "Georgia, Tennessee and New York liquid hydrogen plants" },
  { name: "Chevron renewable hydrogen", country: "United States", flag: "🇺🇸", capacityKtY: 15, electrolyserMw: 160, route: "Electrolysis", note: "California ACES and refinery hydrogen decarbonisation" },
  { name: "Constellation Energy", country: "United States", flag: "🇺🇸", capacityKtY: 8, electrolyserMw: 90, route: "Clean power electrolysis", note: "Nine Mile Point demonstration and Midwest hub participation" },
  { name: "Monolith / clean hydrogen", country: "United States", flag: "🇺🇸", capacityKtY: 14, electrolyserMw: 0, route: "Methane pyrolysis", note: "Nebraska turquoise hydrogen with solid carbon co-product" },
  { name: "Hydrogen Optimized / Hydrogenics Canada", country: "Canada", flag: "🇨🇦", capacityKtY: 6, electrolyserMw: 70, route: "Hydropower electrolysis", note: "Ontario and Quebec electrolysis for fuels and fertiliser" },
  { name: "Air Liquide Bécancour", country: "Canada", flag: "🇨🇦", capacityKtY: 8, electrolyserMw: 20, route: "Hydropower electrolysis", note: "20 MW PEM plant serving Quebec industry and mobility" },
  { name: "Unigel", country: "Brazil", flag: "🇧🇷", capacityKtY: 10, electrolyserMw: 60, route: "Electrolysis", note: "Camaçari green hydrogen and ammonia unit in Bahia" },
  { name: "Casa dos Ventos / Pecém hub", country: "Brazil", flag: "🇧🇷", capacityKtY: 35, electrolyserMw: 400, route: "Wind electrolysis", note: "Ceará export hub agreements with European offtakers" },
  { name: "HIF Global", country: "Chile", flag: "🇨🇱", capacityKtY: 12, electrolyserMw: 130, route: "Wind electrolysis", note: "Haru Oni e-fuels plant in Magallanes plus US and Australia sites" },
  { name: "Total Eren / Chile Magallanes", country: "Chile", flag: "🇨🇱", capacityKtY: 30, electrolyserMw: 350, route: "Wind electrolysis", note: "H2 Magallanes green ammonia export development" },
  { name: "YPF Luz hydrogen", country: "Argentina", flag: "🇦🇷", capacityKtY: 7, electrolyserMw: 80, route: "Wind electrolysis", note: "Patagonian wind-based hydrogen pilots for industry" },
];

type Metric = "capacity" | "electrolyser" | "marketcap" | "price" | "ghg";

const METRICS: Record<
  Metric,
  { label: string; unit: string; help: string; decimals: number; value: (p: Producer) => number }
> = {
  capacity: {
    label: "Renewable H₂ output (kt/yr)",
    unit: "thousand tonnes of renewable hydrogen / year",
    help: "Operating plus sanctioned renewable hydrogen output. Bigger tiles mean more low-carbon hydrogen reaching refineries, ammonia plants and fuel markets.",
    decimals: 1,
    value: (p) => p.capacityKtY,
  },
  electrolyser: {
    label: "Electrolyser capacity (MW)",
    unit: "megawatts of electrolyser capacity",
    help: "Installed or sanctioned electrolyser capacity in megawatts. Pyrolysis and non-electrolytic routes show zero.",
    decimals: 0,
    value: (p) => p.electrolyserMw,
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
    value: (p) => marketCapValue(HYDROGEN_TICKERS[p.name]),
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
      x: { metric: METRICS.electrolyser, help: "X-axis shows electrolyser capacity; Y-axis shows renewable hydrogen output." },
      size: { label: "Renewable H₂ output", unit: "kt/yr", value: (p: Producer) => p.capacityKtY },
    };
  }
  return {
    x: { metric: METRICS.capacity, help: "X-axis shows renewable hydrogen output; Y-axis shows the selected measure." },
    size: { label: "Electrolyser capacity", unit: "MW", value: (p: Producer) => p.electrolyserMw },
  };
}

const TITLE = "Global renewable hydrogen producers";
const NEWS_SUFFIX = "green hydrogen electrolyser project";

export function RenewableHydrogenPanel() {
  const [metricKey, setMetricKey] = useState<Metric>("capacity");
  const [view, setView] = useState<PanelView>("heat");
  const detail = useEntityDetail();
  const { get } = useEntityQuotes();
  const metric = METRICS[metricKey];
  const valueOf = (p: Producer) =>
    metricKey === "price" ? (get(HYDROGEN_TICKERS[p.name])?.price ?? 0) : metric.value(p);

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
    meta: priceMeta(get(HYDROGEN_TICKERS[p.name])),
    changePct: get(HYDROGEN_TICKERS[p.name])?.changePct,
    newsTarget: { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` },
  }));

  const items = rows.map((p) => ({
    key: p.name,
    label: p.name,
    sub: `${p.route} · ${p.note}`,
    value: valueOf(p),
    logo: entityLogoByName(p.name),
    meta: priceMeta(get(HYDROGEN_TICKERS[p.name])),
    tone: priceTone(get(HYDROGEN_TICKERS[p.name])),
    changePct: get(HYDROGEN_TICKERS[p.name])?.changePct,
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
        { label: "Ticker", value: HYDROGEN_TICKERS[p.name] ?? "Not listed" },
        {
          label: "Share price",
          value: get(HYDROGEN_TICKERS[p.name]) ? fmt(get(HYDROGEN_TICKERS[p.name])!.price, 2) : "—",
        },
        {
          label: "1-day change",
          value: get(HYDROGEN_TICKERS[p.name])
            ? `${get(HYDROGEN_TICKERS[p.name])!.changePct >= 0 ? "+" : ""}${get(HYDROGEN_TICKERS[p.name])!.changePct.toFixed(2)}%`
            : "—",
          tone: detailTone(get(HYDROGEN_TICKERS[p.name])?.changePct),
        },
        { label: "Renewable H₂ output", value: `${fmt(p.capacityKtY, 1)} kt/yr` },
        { label: "Electrolyser capacity", value: `${fmt(p.electrolyserMw, 0)} MW` },
        { label: "Production route", value: p.route },
        { label: "Market cap (approx.)", value: marketCapLabel(HYDROGEN_TICKERS[p.name]) ?? "Private / state-owned" },
      ],
      news: { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` },
    };
  }, graph);

  return (
    <>
      {detail.sheet}
      <ChartPanel
        icon={Atom}
        title={TITLE}
        blurb="Electrolytic and biomass-derived hydrogen producers supplying refineries, ammonia plants, e-fuels and heavy transport worldwide."
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
          <PanelActions summaryBuild={() => summaryOf({ panel: TITLE, measureLabel: metric.label, unit: metric.unit, filters: [f.a, f.b], items, total: ranked.length })}>
          <ExportCsvButton
            disabled={ranked.length === 0}
            build={() => ({
              title: TITLE,
              filename: "global-renewable-hydrogen-producers",
              note: `Measure shown: ${metric.label}`,
              header: [
                "Ticker",
                "Share price",
                "1-day change %",
                "Producer",
                "Country",
                "Route",
                "Renewable H2 output (kt/yr)",
                "Electrolyser capacity (MW)",
                "Market cap (approx., USD bn)",
                "Note",
              ],
              rows: ranked.map((p) => [
                HYDROGEN_TICKERS[p.name] ?? "Not listed",
                get(HYDROGEN_TICKERS[p.name])?.price ?? "",
                get(HYDROGEN_TICKERS[p.name])?.changePct?.toFixed(2) ?? "",
                p.name,
                p.country,
                p.route,
                p.capacityKtY,
                p.electrolyserMw,
                marketCapValue(HYDROGEN_TICKERS[p.name]),
                p.note,
              ]),
            })}
          />
          </PanelActions>
        }
        filters={
          <ChartFilterBar
            query={f.query}
            onQueryChange={f.setQuery}
            placeholder="Search hydrogen producers…"
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
        footnote={`Indicative operating and sanctioned capacities compiled from company disclosures, the IEA Hydrogen Projects Database and national hydrogen strategies. Click any tile for the latest news. ${MARKET_CAP_NOTE}`}
              >
        {ghgEmpty ? (
          <GhgEmptyNotice />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No renewable hydrogen producers listed for this filter — open that country's profile page
            for its policy and market updates.
          </p>
        ) : view === "line" ? (
          <ChartTrend panel="hydrogen" />
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
            indexLabel="Global renewable hydrogen index"
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
            yLabel="Hydrogen producer"
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
            indexLabel="Global renewable hydrogen index"
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
