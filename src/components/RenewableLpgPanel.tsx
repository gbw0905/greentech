import { useState } from "react";
import { ChartMap } from "@/components/ChartMap";
import { Cylinder } from "lucide-react";
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
import { RLPG_TICKERS } from "@/lib/entity-tickers";

type Supplier = {
  name: string;
  country: string;
  flag: string;
  /** BioLPG / rDME production capacity, thousand tonnes per year */
  capacityKtY: number;
  /** Renewable LPG volume distributed to customers, thousand tonnes per year */
  supplyKtY: number;
  role: string;
  note: string;
};

/**
 * Renewable LPG suppliers — bioLPG produced as a co-product of HVO and SAF
 * refining, renewable dimethyl ether (rDME) plants, and the distributors
 * blending those molecules into off-grid heating and autogas.
 */
const SUPPLIERS: Supplier[] = [
  // ---------- Producers ----------
  { name: "Neste bioLPG", country: "Netherlands", flag: "🇳🇱", capacityKtY: 40, supplyKtY: 40, role: "Producer", note: "Rotterdam HVO co-product, the anchor of Europe's bioLPG supply" },
  { name: "Neste Singapore bioLPG", country: "Singapore", flag: "🇸🇬", capacityKtY: 30, supplyKtY: 28, role: "Producer", note: "Singapore refinery expansion supplying Asian and export markets" },
  { name: "Eni Biorefineries LPG", country: "Italy", flag: "🇮🇹", capacityKtY: 22, supplyKtY: 20, role: "Producer", note: "Venice, Gela and Livorno biorefinery LPG co-product" },
  { name: "Repsol Cartagena", country: "Spain", flag: "🇪🇸", capacityKtY: 18, supplyKtY: 16, role: "Producer", note: "Advanced biofuels plant yielding renewable propane and butane" },
  { name: "TotalEnergies La Mède", country: "France", flag: "🇫🇷", capacityKtY: 15, supplyKtY: 14, role: "Producer", note: "HVO biorefinery LPG stream feeding French heating and autogas" },
  { name: "Preem Gothenburg", country: "Sweden", flag: "🇸🇪", capacityKtY: 10, supplyKtY: 9, role: "Producer", note: "Renewable propane from the Gothenburg HVO units" },
  { name: "Moeve (Cepsa) Huelva", country: "Spain", flag: "🇪🇸", capacityKtY: 12, supplyKtY: 10, role: "Producer", note: "Second-generation biofuels park with renewable LPG output" },
  { name: "Galp Sines", country: "Portugal", flag: "🇵🇹", capacityKtY: 9, supplyKtY: 8, role: "Producer", note: "HVO/SAF unit producing bio-propane alongside diesel and jet" },
  { name: "Shell Rotterdam HEFA", country: "Netherlands", flag: "🇳🇱", capacityKtY: 20, supplyKtY: 18, role: "Producer", note: "Energy and Chemicals Park biofuels plant LPG co-product" },
  { name: "BP Castellón", country: "Spain", flag: "🇪🇸", capacityKtY: 8, supplyKtY: 7, role: "Producer", note: "Co-processing renewable feedstocks with an LPG stream" },
  { name: "Chevron Renewable Energy Group", country: "United States", flag: "🇺🇸", capacityKtY: 25, supplyKtY: 22, role: "Producer", note: "Geismar renewable diesel complex propane co-product" },
  { name: "Diamond Green Diesel (Valero)", country: "United States", flag: "🇺🇸", capacityKtY: 45, supplyKtY: 40, role: "Producer", note: "Largest US renewable propane volumes from Norco and Port Arthur" },
  { name: "Phillips 66 Rodeo", country: "United States", flag: "🇺🇸", capacityKtY: 30, supplyKtY: 26, role: "Producer", note: "Rodeo Renewed complex supplying California renewable propane" },
  { name: "Marathon Martinez Renewables", country: "United States", flag: "🇺🇸", capacityKtY: 28, supplyKtY: 24, role: "Producer", note: "Martinez joint venture with Neste producing renewable LPG" },
  { name: "Vertex Energy / Gulf renewables", country: "United States", flag: "🇺🇸", capacityKtY: 6, supplyKtY: 5, role: "Producer", note: "Mobile Alabama renewable diesel unit with propane co-product" },
  { name: "Oberon Fuels", country: "United States", flag: "🇺🇸", capacityKtY: 5, supplyKtY: 4, role: "rDME producer", note: "First commercial rDME plant in Brawley, California" },
  { name: "Dimeta (SHV Energy & UGI)", country: "Netherlands", flag: "🇳🇱", capacityKtY: 12, supplyKtY: 8, role: "rDME producer", note: "Joint venture building waste-to-rDME plants in the UK and US" },
  { name: "Tirex / Circular Fuels Teesside", country: "United Kingdom", flag: "🇬🇧", capacityKtY: 10, supplyKtY: 6, role: "rDME producer", note: "Teesside waste-to-rDME project for the UK off-grid market" },
  { name: "Ekobenz", country: "Poland", flag: "🇵🇱", capacityKtY: 4, supplyKtY: 4, role: "Producer", note: "Bio-LPG and bio-hydrocarbons from bioethanol conversion" },
  { name: "Sasol renewable LPG", country: "South Africa", flag: "🇿🇦", capacityKtY: 7, supplyKtY: 6, role: "Producer", note: "Secunda renewable-route LPG streams for domestic markets" },
  { name: "Petrobras renewable LPG", country: "Brazil", flag: "🇧🇷", capacityKtY: 14, supplyKtY: 12, role: "Producer", note: "HVO co-processing at Riograndense and Paraná refineries" },
  { name: "Eneos renewable LPG", country: "Japan", flag: "🇯🇵", capacityKtY: 8, supplyKtY: 7, role: "Producer", note: "Wakayama and Sakai co-processing yields renewable propane" },
  { name: "Indian Oil bio-LPG", country: "India", flag: "🇮🇳", capacityKtY: 6, supplyKtY: 5, role: "Producer", note: "Panipat 2G biorefinery LPG co-product for domestic cylinders" },
  { name: "Pertamina renewable LPG", country: "Indonesia", flag: "🇮🇩", capacityKtY: 9, supplyKtY: 8, role: "Producer", note: "Cilacap and Plaju green refinery LPG streams" },
  { name: "Ampol renewable LPG", country: "Australia", flag: "🇦🇺", capacityKtY: 4, supplyKtY: 4, role: "Producer", note: "Lytton renewable fuels programme with LPG co-product" },

  // ---------- Distributors and marketers ----------
  { name: "SHV Energy (Calor, Primagas)", country: "Netherlands", flag: "🇳🇱", capacityKtY: 0, supplyKtY: 55, role: "Distributor", note: "Largest global renewable LPG distributor across 20+ markets" },
  { name: "Calor UK", country: "United Kingdom", flag: "🇬🇧", capacityKtY: 0, supplyKtY: 22, role: "Distributor", note: "BioLPG for off-grid homes, business heating and Futuria autogas" },
  { name: "Flogas UK", country: "United Kingdom", flag: "🇬🇧", capacityKtY: 0, supplyKtY: 14, role: "Distributor", note: "Biopropane supply to rural heating and commercial customers" },
  { name: "Flogas Ireland (DCC)", country: "Ireland", flag: "🇮🇪", capacityKtY: 0, supplyKtY: 8, role: "Distributor", note: "Irish BioLPG for hospitality, agriculture and industry" },
  { name: "Primagaz France", country: "France", flag: "🇫🇷", capacityKtY: 0, supplyKtY: 12, role: "Distributor", note: "Biopropane for rural heating under the SHV Energy group" },
  { name: "Butagaz", country: "France", flag: "🇫🇷", capacityKtY: 0, supplyKtY: 10, role: "Distributor", note: "BioGPL cylinders and bulk supply across France" },
  { name: "Primagas Germany", country: "Germany", flag: "🇩🇪", capacityKtY: 0, supplyKtY: 9, role: "Distributor", note: "BioLPG and rDME blends for off-grid German industry" },
  { name: "PROGAS", country: "Germany", flag: "🇩🇪", capacityKtY: 0, supplyKtY: 6, role: "Distributor", note: "Renewable LPG for heating and process gas customers" },
  { name: "Kosan Gas (UGI)", country: "Denmark", flag: "🇩🇰", capacityKtY: 0, supplyKtY: 5, role: "Distributor", note: "Nordic BioLPG for hospitality and industry" },
  { name: "AvantiGas", country: "United Kingdom", flag: "🇬🇧", capacityKtY: 0, supplyKtY: 4, role: "Distributor", note: "Rural bulk renewable LPG supply in the UK" },
  { name: "Repsol Butano", country: "Spain", flag: "🇪🇸", capacityKtY: 0, supplyKtY: 11, role: "Distributor", note: "Renewable LPG cylinders and bulk delivery in Spain" },
  { name: "Liquigas (UGI Italy)", country: "Italy", flag: "🇮🇹", capacityKtY: 0, supplyKtY: 9, role: "Distributor", note: "BioGPL for Italian off-grid heating and autogas" },
  { name: "AmeriGas (UGI)", country: "United States", flag: "🇺🇸", capacityKtY: 0, supplyKtY: 18, role: "Distributor", note: "Renewable propane blends across US residential and commercial" },
  { name: "Suburban Propane", country: "United States", flag: "🇺🇸", capacityKtY: 0, supplyKtY: 12, role: "Distributor", note: "Renewable propane and rDME pilots with Oberon Fuels" },
  { name: "Ferrellgas / Blue Rhino", country: "United States", flag: "🇺🇸", capacityKtY: 0, supplyKtY: 9, role: "Distributor", note: "Renewable propane offering for fleets and cylinder exchange" },
  { name: "Superior Plus", country: "Canada", flag: "🇨🇦", capacityKtY: 0, supplyKtY: 7, role: "Distributor", note: "Canadian renewable propane supply for heating and transport" },
  { name: "Elgas (SHV Australia)", country: "Australia", flag: "🇦🇺", capacityKtY: 0, supplyKtY: 6, role: "Distributor", note: "Renewable LPG entering Australian and NZ heating markets" },
  { name: "Origin LPG", country: "Australia", flag: "🇦🇺", capacityKtY: 0, supplyKtY: 4, role: "Distributor", note: "Renewable LPG trials for commercial customers" },
  { name: "Iwatani renewable LPG", country: "Japan", flag: "🇯🇵", capacityKtY: 0, supplyKtY: 5, role: "Distributor", note: "Japanese renewable propane and green LP gas supply chain" },
  { name: "SK Gas", country: "South Korea", flag: "🇰🇷", capacityKtY: 0, supplyKtY: 4, role: "Distributor", note: "Renewable LPG and rDME import programme for Korea" },
  { name: "Supergasbras (Copagaz)", country: "Brazil", flag: "🇧🇷", capacityKtY: 0, supplyKtY: 6, role: "Distributor", note: "Renewable LPG pilots in Brazilian bottled gas markets" },
  { name: "Ultragaz", country: "Brazil", flag: "🇧🇷", capacityKtY: 0, supplyKtY: 7, role: "Distributor", note: "Ultrapar bottled-gas network trialling renewable propane" },
  { name: "Oryx Energies", country: "Switzerland", flag: "🇨🇭", capacityKtY: 0, supplyKtY: 3, role: "Distributor", note: "African LPG distributor introducing renewable-content supply" },
];

type Metric = "capacity" | "supply" | "marketcap" | "price" | "ghg";

const METRICS: Record<
  Metric,
  { label: string; unit: string; help: string; decimals: number; value: (s: Supplier) => number }
> = {
  supply: {
    label: "Renewable LPG supplied (kt/yr)",
    unit: "thousand tonnes of renewable LPG delivered / year",
    help: "Volume of bioLPG and rDME delivered to customers each year. Bigger tiles mean more renewable propane reaching heating, cooking and autogas users.",
    decimals: 1,
    value: (s) => s.supplyKtY,
  },
  capacity: {
    label: "Production capacity (kt/yr)",
    unit: "thousand tonnes of bioLPG / rDME produced / year",
    help: "BioLPG produced as an HVO/SAF co-product plus dedicated rDME capacity. Pure distributors show zero because they buy rather than make the molecule.",
    decimals: 1,
    value: (s) => s.capacityKtY,
  },
  price: {
    label: "Share price (listing currency)",
    unit: "share price, primary listing currency",
    help: "Latest traded share price on the company's primary listing, in that exchange's currency. Private, state-owned or unlisted suppliers have no price and sit at the end.",
    decimals: 2,
    value: () => 0,
  },
  marketcap: {
    label: "Market cap (approx.)",
    unit: "approximate market capitalisation, USD billions",
    help: "Approximate latest market capitalisation in USD billions, converted at recent exchange rates. Private, state-owned or unlisted entities rank last.",
    decimals: 1,
    value: (s) => marketCapValue(RLPG_TICKERS[s.name]),
  },
  ghg: {
    label: "GHG savings (reported)",
    unit: "million tonnes CO₂e avoided per year",
    help: GHG_NOTE,
    decimals: 1,
    value: (s) => ghgSavingsMt(s.name),
  },
};

function scatterAxes(metricKey: Metric) {
  if (metricKey === "supply") {
    return {
      x: { metric: METRICS.capacity, help: "X-axis shows production capacity; Y-axis shows volume supplied." },
      size: { label: "Renewable LPG supplied", unit: "kt/yr", value: (s: Supplier) => s.supplyKtY },
    };
  }
  return {
    x: { metric: METRICS.supply, help: "X-axis shows volume supplied; Y-axis shows the selected measure." },
    size: { label: "Production capacity", unit: "kt/yr", value: (s: Supplier) => s.capacityKtY },
  };
}

const TITLE = "Global renewable LPG suppliers";
const NEWS_SUFFIX = "renewable LPG bioLPG rDME";

export function RenewableLpgPanel() {
  const [metricKey, setMetricKey] = useState<Metric>("supply");
  const [view, setView] = useState<PanelView>("heat");
  const detail = useEntityDetail();
  const { get } = useEntityQuotes();
  const metric = METRICS[metricKey];
  const valueOf = (s: Supplier) =>
    metricKey === "price" ? (get(RLPG_TICKERS[s.name])?.price ?? 0) : metric.value(s);

  const f = useChartFilter(SUPPLIERS, {
    text: (s) => `${s.name} ${s.country} ${s.role} ${s.note}`,
    facetA: (s) => s.country,
    facetB: (s) => s.role,
  });
  const ranked = f.filtered.slice().sort((a, b) => valueOf(b) - valueOf(a));
  const isFiltered = Boolean(f.a || f.b || f.query.trim());
  const rows = view === "table" || view === "map" ? ranked : ranked.slice(0, isFiltered ? 20 : 10);
  const ghgEmpty =
    metricKey === "ghg" && ranked.length > 0 && !ranked.some((x) => ghgSavingsMt(x.name) > 0);

  const axes = scatterAxes(metricKey);
  const scatterPoints: ScatterPoint[] = rows.map((s) => ({
    key: s.name,
    label: s.name,
    sub: `${s.country} · ${s.role}`,
    x: axes.x.metric.value(s),
    y: valueOf(s),
    size: axes.size.value(s),
    group: s.country,
    logo: entityLogoByName(s.name),
    meta: priceMeta(get(RLPG_TICKERS[s.name])),
    changePct: get(RLPG_TICKERS[s.name])?.changePct,
    newsTarget: { name: s.name, query: `"${s.name}" ${NEWS_SUFFIX}` },
  }));

  const items = rows.map((s) => ({
    key: s.name,
    label: s.name,
    sub: `${s.role} · ${s.note}`,
    value: valueOf(s),
    logo: entityLogoByName(s.name),
    meta: priceMeta(get(RLPG_TICKERS[s.name])),
    tone: priceTone(get(RLPG_TICKERS[s.name])),
    changePct: get(RLPG_TICKERS[s.name])?.changePct,
  }));
  const newsMap = Object.fromEntries(
    rows.map((s) => [s.name, { name: s.name, query: `"${s.name}" ${NEWS_SUFFIX}` }]),
  );
  const filters: [string, string][] = [
    ["Country", f.a || "All countries"],
    ["Role", f.b || "All roles"],
  ];
  if (f.query.trim()) filters.push(["Search", `"${f.query.trim()}"`]);
  const graph: GraphContext = {
    measure: metric.label,
    unit: metric.unit,
    view: PANEL_VIEWS.find((v) => v.value === view)?.label ?? view,
    filters,
    items: rows.map((s) => ({ name: s.name, value: valueOf(s) })),
    format: (n: number) => fmt(n, metric.decimals),
  };
  const onSelect = detail.onSelect((target) => {
    const s = rows.find((r) => r.name === target?.name);
    if (!s) return null;
    return {
      name: s.name,
      sub: `${s.flag} ${s.country}`,
      logo: entityLogoByName(s.name),
      note: s.note,
      stats: [
        { label: "Ticker", value: RLPG_TICKERS[s.name] ?? "Not listed" },
        {
          label: "Share price",
          value: get(RLPG_TICKERS[s.name]) ? fmt(get(RLPG_TICKERS[s.name])!.price, 2) : "—",
        },
        {
          label: "1-day change",
          value: get(RLPG_TICKERS[s.name])
            ? `${get(RLPG_TICKERS[s.name])!.changePct >= 0 ? "+" : ""}${get(RLPG_TICKERS[s.name])!.changePct.toFixed(2)}%`
            : "—",
          tone: detailTone(get(RLPG_TICKERS[s.name])?.changePct),
        },
        { label: "Renewable LPG supplied", value: `${fmt(s.supplyKtY, 1)} kt/yr` },
        { label: "Production capacity", value: `${fmt(s.capacityKtY, 1)} kt/yr` },
        { label: "Role", value: s.role },
        { label: "Market cap (approx.)", value: marketCapLabel(RLPG_TICKERS[s.name]) ?? "Private / state-owned" },
      ],
      news: { name: s.name, query: `"${s.name}" ${NEWS_SUFFIX}` },
    };
  }, graph);

  return (
    <>
      {detail.sheet}
      <ChartPanel
        icon={Cylinder}
        title={TITLE}
        blurb="BioLPG produced alongside HVO and SAF, renewable DME plants, and the distributors delivering renewable propane to off-grid heating, cooking and autogas."
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
              filename: "global-renewable-lpg-suppliers",
              note: `Measure shown: ${metric.label}`,
              header: [
                "Ticker",
                "Share price",
                "1-day change %",
                "Company",
                "Country",
                "Role",
                "Renewable LPG supplied (kt/yr)",
                "Production capacity (kt/yr)",
                "Market cap (approx., USD bn)",
                "Note",
              ],
              rows: ranked.map((s) => [
                RLPG_TICKERS[s.name] ?? "Not listed",
                get(RLPG_TICKERS[s.name])?.price ?? "",
                get(RLPG_TICKERS[s.name])?.changePct?.toFixed(2) ?? "",
                s.name,
                s.country,
                s.role,
                s.supplyKtY,
                s.capacityKtY,
                marketCapValue(RLPG_TICKERS[s.name]),
                s.note,
              ]),
            })}
          />
        }
        filters={
          <ChartFilterBar
            query={f.query}
            onQueryChange={f.setQuery}
            placeholder="Search renewable LPG suppliers…"
            selects={[
              {
                label: "Country",
                value: f.a,
                options: countryFilterOptions(SUPPLIERS.map((s) => s.country)),
                onChange: f.setA,
                allLabel: "All countries",
              },
              {
                label: "Role",
                value: f.b,
                options: countryFilterOptions(SUPPLIERS.map((s) => s.role)),
                onChange: f.setB,
                allLabel: "All roles",
              },
            ]}
            shown={rows.length}
            total={SUPPLIERS.length}
            matched={ranked.length}
          />
        }
        footnote={`Indicative volumes compiled from company disclosures, Liquid Gas Europe and WLPGA renewable LPG reporting. BioLPG is largely an HVO/SAF co-product, so producer volumes track renewable diesel runs. Click any tile for the latest news. ${MARKET_CAP_NOTE}`}
        import { useState } from "react";
import { ChartMap } from "@/components/ChartMap";
import { Cylinder } from "lucide-react";
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
import { RLPG_TICKERS } from "@/lib/entity-tickers";

type Supplier = {
  name: string;
  country: string;
  flag: string;
  /** BioLPG / rDME production capacity, thousand tonnes per year */
  capacityKtY: number;
  /** Renewable LPG volume distributed to customers, thousand tonnes per year */
  supplyKtY: number;
  role: string;
  note: string;
};

/**
 * Renewable LPG suppliers — bioLPG produced as a co-product of HVO and SAF
 * refining, renewable dimethyl ether (rDME) plants, and the distributors
 * blending those molecules into off-grid heating and autogas.
 */
const SUPPLIERS: Supplier[] = [
  // ---------- Producers ----------
  { name: "Neste bioLPG", country: "Netherlands", flag: "🇳🇱", capacityKtY: 40, supplyKtY: 40, role: "Producer", note: "Rotterdam HVO co-product, the anchor of Europe's bioLPG supply" },
  { name: "Neste Singapore bioLPG", country: "Singapore", flag: "🇸🇬", capacityKtY: 30, supplyKtY: 28, role: "Producer", note: "Singapore refinery expansion supplying Asian and export markets" },
  { name: "Eni Biorefineries LPG", country: "Italy", flag: "🇮🇹", capacityKtY: 22, supplyKtY: 20, role: "Producer", note: "Venice, Gela and Livorno biorefinery LPG co-product" },
  { name: "Repsol Cartagena", country: "Spain", flag: "🇪🇸", capacityKtY: 18, supplyKtY: 16, role: "Producer", note: "Advanced biofuels plant yielding renewable propane and butane" },
  { name: "TotalEnergies La Mède", country: "France", flag: "🇫🇷", capacityKtY: 15, supplyKtY: 14, role: "Producer", note: "HVO biorefinery LPG stream feeding French heating and autogas" },
  { name: "Preem Gothenburg", country: "Sweden", flag: "🇸🇪", capacityKtY: 10, supplyKtY: 9, role: "Producer", note: "Renewable propane from the Gothenburg HVO units" },
  { name: "Moeve (Cepsa) Huelva", country: "Spain", flag: "🇪🇸", capacityKtY: 12, supplyKtY: 10, role: "Producer", note: "Second-generation biofuels park with renewable LPG output" },
  { name: "Galp Sines", country: "Portugal", flag: "🇵🇹", capacityKtY: 9, supplyKtY: 8, role: "Producer", note: "HVO/SAF unit producing bio-propane alongside diesel and jet" },
  { name: "Shell Rotterdam HEFA", country: "Netherlands", flag: "🇳🇱", capacityKtY: 20, supplyKtY: 18, role: "Producer", note: "Energy and Chemicals Park biofuels plant LPG co-product" },
  { name: "BP Castellón", country: "Spain", flag: "🇪🇸", capacityKtY: 8, supplyKtY: 7, role: "Producer", note: "Co-processing renewable feedstocks with an LPG stream" },
  { name: "Chevron Renewable Energy Group", country: "United States", flag: "🇺🇸", capacityKtY: 25, supplyKtY: 22, role: "Producer", note: "Geismar renewable diesel complex propane co-product" },
  { name: "Diamond Green Diesel (Valero)", country: "United States", flag: "🇺🇸", capacityKtY: 45, supplyKtY: 40, role: "Producer", note: "Largest US renewable propane volumes from Norco and Port Arthur" },
  { name: "Phillips 66 Rodeo", country: "United States", flag: "🇺🇸", capacityKtY: 30, supplyKtY: 26, role: "Producer", note: "Rodeo Renewed complex supplying California renewable propane" },
  { name: "Marathon Martinez Renewables", country: "United States", flag: "🇺🇸", capacityKtY: 28, supplyKtY: 24, role: "Producer", note: "Martinez joint venture with Neste producing renewable LPG" },
  { name: "Vertex Energy / Gulf renewables", country: "United States", flag: "🇺🇸", capacityKtY: 6, supplyKtY: 5, role: "Producer", note: "Mobile Alabama renewable diesel unit with propane co-product" },
  { name: "Oberon Fuels", country: "United States", flag: "🇺🇸", capacityKtY: 5, supplyKtY: 4, role: "rDME producer", note: "First commercial rDME plant in Brawley, California" },
  { name: "Dimeta (SHV Energy & UGI)", country: "Netherlands", flag: "🇳🇱", capacityKtY: 12, supplyKtY: 8, role: "rDME producer", note: "Joint venture building waste-to-rDME plants in the UK and US" },
  { name: "Tirex / Circular Fuels Teesside", country: "United Kingdom", flag: "🇬🇧", capacityKtY: 10, supplyKtY: 6, role: "rDME producer", note: "Teesside waste-to-rDME project for the UK off-grid market" },
  { name: "Ekobenz", country: "Poland", flag: "🇵🇱", capacityKtY: 4, supplyKtY: 4, role: "Producer", note: "Bio-LPG and bio-hydrocarbons from bioethanol conversion" },
  { name: "Sasol renewable LPG", country: "South Africa", flag: "🇿🇦", capacityKtY: 7, supplyKtY: 6, role: "Producer", note: "Secunda renewable-route LPG streams for domestic markets" },
  { name: "Petrobras renewable LPG", country: "Brazil", flag: "🇧🇷", capacityKtY: 14, supplyKtY: 12, role: "Producer", note: "HVO co-processing at Riograndense and Paraná refineries" },
  { name: "Eneos renewable LPG", country: "Japan", flag: "🇯🇵", capacityKtY: 8, supplyKtY: 7, role: "Producer", note: "Wakayama and Sakai co-processing yields renewable propane" },
  { name: "Indian Oil bio-LPG", country: "India", flag: "🇮🇳", capacityKtY: 6, supplyKtY: 5, role: "Producer", note: "Panipat 2G biorefinery LPG co-product for domestic cylinders" },
  { name: "Pertamina renewable LPG", country: "Indonesia", flag: "🇮🇩", capacityKtY: 9, supplyKtY: 8, role: "Producer", note: "Cilacap and Plaju green refinery LPG streams" },
  { name: "Ampol renewable LPG", country: "Australia", flag: "🇦🇺", capacityKtY: 4, supplyKtY: 4, role: "Producer", note: "Lytton renewable fuels programme with LPG co-product" },

  // ---------- Distributors and marketers ----------
  { name: "SHV Energy (Calor, Primagas)", country: "Netherlands", flag: "🇳🇱", capacityKtY: 0, supplyKtY: 55, role: "Distributor", note: "Largest global renewable LPG distributor across 20+ markets" },
  { name: "Calor UK", country: "United Kingdom", flag: "🇬🇧", capacityKtY: 0, supplyKtY: 22, role: "Distributor", note: "BioLPG for off-grid homes, business heating and Futuria autogas" },
  { name: "Flogas UK", country: "United Kingdom", flag: "🇬🇧", capacityKtY: 0, supplyKtY: 14, role: "Distributor", note: "Biopropane supply to rural heating and commercial customers" },
  { name: "Flogas Ireland (DCC)", country: "Ireland", flag: "🇮🇪", capacityKtY: 0, supplyKtY: 8, role: "Distributor", note: "Irish BioLPG for hospitality, agriculture and industry" },
  { name: "Primagaz France", country: "France", flag: "🇫🇷", capacityKtY: 0, supplyKtY: 12, role: "Distributor", note: "Biopropane for rural heating under the SHV Energy group" },
  { name: "Butagaz", country: "France", flag: "🇫🇷", capacityKtY: 0, supplyKtY: 10, role: "Distributor", note: "BioGPL cylinders and bulk supply across France" },
  { name: "Primagas Germany", country: "Germany", flag: "🇩🇪", capacityKtY: 0, supplyKtY: 9, role: "Distributor", note: "BioLPG and rDME blends for off-grid German industry" },
  { name: "PROGAS", country: "Germany", flag: "🇩🇪", capacityKtY: 0, supplyKtY: 6, role: "Distributor", note: "Renewable LPG for heating and process gas customers" },
  { name: "Kosan Gas (UGI)", country: "Denmark", flag: "🇩🇰", capacityKtY: 0, supplyKtY: 5, role: "Distributor", note: "Nordic BioLPG for hospitality and industry" },
  { name: "AvantiGas", country: "United Kingdom", flag: "🇬🇧", capacityKtY: 0, supplyKtY: 4, role: "Distributor", note: "Rural bulk renewable LPG supply in the UK" },
  { name: "Repsol Butano", country: "Spain", flag: "🇪🇸", capacityKtY: 0, supplyKtY: 11, role: "Distributor", note: "Renewable LPG cylinders and bulk delivery in Spain" },
  { name: "Liquigas (UGI Italy)", country: "Italy", flag: "🇮🇹", capacityKtY: 0, supplyKtY: 9, role: "Distributor", note: "BioGPL for Italian off-grid heating and autogas" },
  { name: "AmeriGas (UGI)", country: "United States", flag: "🇺🇸", capacityKtY: 0, supplyKtY: 18, role: "Distributor", note: "Renewable propane blends across US residential and commercial" },
  { name: "Suburban Propane", country: "United States", flag: "🇺🇸", capacityKtY: 0, supplyKtY: 12, role: "Distributor", note: "Renewable propane and rDME pilots with Oberon Fuels" },
  { name: "Ferrellgas / Blue Rhino", country: "United States", flag: "🇺🇸", capacityKtY: 0, supplyKtY: 9, role: "Distributor", note: "Renewable propane offering for fleets and cylinder exchange" },
  { name: "Superior Plus", country: "Canada", flag: "🇨🇦", capacityKtY: 0, supplyKtY: 7, role: "Distributor", note: "Canadian renewable propane supply for heating and transport" },
  { name: "Elgas (SHV Australia)", country: "Australia", flag: "🇦🇺", capacityKtY: 0, supplyKtY: 6, role: "Distributor", note: "Renewable LPG entering Australian and NZ heating markets" },
  { name: "Origin LPG", country: "Australia", flag: "🇦🇺", capacityKtY: 0, supplyKtY: 4, role: "Distributor", note: "Renewable LPG trials for commercial customers" },
  { name: "Iwatani renewable LPG", country: "Japan", flag: "🇯🇵", capacityKtY: 0, supplyKtY: 5, role: "Distributor", note: "Japanese renewable propane and green LP gas supply chain" },
  { name: "SK Gas", country: "South Korea", flag: "🇰🇷", capacityKtY: 0, supplyKtY: 4, role: "Distributor", note: "Renewable LPG and rDME import programme for Korea" },
  { name: "Supergasbras (Copagaz)", country: "Brazil", flag: "🇧🇷", capacityKtY: 0, supplyKtY: 6, role: "Distributor", note: "Renewable LPG pilots in Brazilian bottled gas markets" },
  { name: "Ultragaz", country: "Brazil", flag: "🇧🇷", capacityKtY: 0, supplyKtY: 7, role: "Distributor", note: "Ultrapar bottled-gas network trialling renewable propane" },
  { name: "Oryx Energies", country: "Switzerland", flag: "🇨🇭", capacityKtY: 0, supplyKtY: 3, role: "Distributor", note: "African LPG distributor introducing renewable-content supply" },
];

type Metric = "capacity" | "supply" | "marketcap" | "price" | "ghg";

const METRICS: Record<
  Metric,
  { label: string; unit: string; help: string; decimals: number; value: (s: Supplier) => number }
> = {
  supply: {
    label: "Renewable LPG supplied (kt/yr)",
    unit: "thousand tonnes of renewable LPG delivered / year",
    help: "Volume of bioLPG and rDME delivered to customers each year. Bigger tiles mean more renewable propane reaching heating, cooking and autogas users.",
    decimals: 1,
    value: (s) => s.supplyKtY,
  },
  capacity: {
    label: "Production capacity (kt/yr)",
    unit: "thousand tonnes of bioLPG / rDME produced / year",
    help: "BioLPG produced as an HVO/SAF co-product plus dedicated rDME capacity. Pure distributors show zero because they buy rather than make the molecule.",
    decimals: 1,
    value: (s) => s.capacityKtY,
  },
  price: {
    label: "Share price (listing currency)",
    unit: "share price, primary listing currency",
    help: "Latest traded share price on the company's primary listing, in that exchange's currency. Private, state-owned or unlisted suppliers have no price and sit at the end.",
    decimals: 2,
    value: () => 0,
  },
  marketcap: {
    label: "Market cap (approx.)",
    unit: "approximate market capitalisation, USD billions",
    help: "Approximate latest market capitalisation in USD billions, converted at recent exchange rates. Private, state-owned or unlisted entities rank last.",
    decimals: 1,
    value: (s) => marketCapValue(RLPG_TICKERS[s.name]),
  },
  ghg: {
    label: "GHG savings (reported)",
    unit: "million tonnes CO₂e avoided per year",
    help: GHG_NOTE,
    decimals: 1,
    value: (s) => ghgSavingsMt(s.name),
  },
};

function scatterAxes(metricKey: Metric) {
  if (metricKey === "supply") {
    return {
      x: { metric: METRICS.capacity, help: "X-axis shows production capacity; Y-axis shows volume supplied." },
      size: { label: "Renewable LPG supplied", unit: "kt/yr", value: (s: Supplier) => s.supplyKtY },
    };
  }
  return {
    x: { metric: METRICS.supply, help: "X-axis shows volume supplied; Y-axis shows the selected measure." },
    size: { label: "Production capacity", unit: "kt/yr", value: (s: Supplier) => s.capacityKtY },
  };
}

const TITLE = "Global renewable LPG suppliers";
const NEWS_SUFFIX = "renewable LPG bioLPG rDME";

export function RenewableLpgPanel() {
  const [metricKey, setMetricKey] = useState<Metric>("supply");
  const [view, setView] = useState<PanelView>("heat");
  const detail = useEntityDetail();
  const { get } = useEntityQuotes();
  const metric = METRICS[metricKey];
  const valueOf = (s: Supplier) =>
    metricKey === "price" ? (get(RLPG_TICKERS[s.name])?.price ?? 0) : metric.value(s);

  const f = useChartFilter(SUPPLIERS, {
    text: (s) => `${s.name} ${s.country} ${s.role} ${s.note}`,
    facetA: (s) => s.country,
    facetB: (s) => s.role,
  });
  const ranked = f.filtered.slice().sort((a, b) => valueOf(b) - valueOf(a));
  const isFiltered = Boolean(f.a || f.b || f.query.trim());
  const rows = view === "table" || view === "map" ? ranked : ranked.slice(0, isFiltered ? 20 : 10);
  const ghgEmpty =
    metricKey === "ghg" && ranked.length > 0 && !ranked.some((x) => ghgSavingsMt(x.name) > 0);

  const axes = scatterAxes(metricKey);
  const scatterPoints: ScatterPoint[] = rows.map((s) => ({
    key: s.name,
    label: s.name,
    sub: `${s.country} · ${s.role}`,
    x: axes.x.metric.value(s),
    y: valueOf(s),
    size: axes.size.value(s),
    group: s.country,
    logo: entityLogoByName(s.name),
    meta: priceMeta(get(RLPG_TICKERS[s.name])),
    changePct: get(RLPG_TICKERS[s.name])?.changePct,
    newsTarget: { name: s.name, query: `"${s.name}" ${NEWS_SUFFIX}` },
  }));

  const items = rows.map((s) => ({
    key: s.name,
    label: s.name,
    sub: `${s.role} · ${s.note}`,
    value: valueOf(s),
    logo: entityLogoByName(s.name),
    meta: priceMeta(get(RLPG_TICKERS[s.name])),
    tone: priceTone(get(RLPG_TICKERS[s.name])),
    changePct: get(RLPG_TICKERS[s.name])?.changePct,
  }));
  const newsMap = Object.fromEntries(
    rows.map((s) => [s.name, { name: s.name, query: `"${s.name}" ${NEWS_SUFFIX}` }]),
  );
  const filters: [string, string][] = [
    ["Country", f.a || "All countries"],
    ["Role", f.b || "All roles"],
  ];
  if (f.query.trim()) filters.push(["Search", `"${f.query.trim()}"`]);
  const graph: GraphContext = {
    measure: metric.label,
    unit: metric.unit,
    view: PANEL_VIEWS.find((v) => v.value === view)?.label ?? view,
    filters,
    items: rows.map((s) => ({ name: s.name, value: valueOf(s) })),
    format: (n: number) => fmt(n, metric.decimals),
  };
  const onSelect = detail.onSelect((target) => {
    const s = rows.find((r) => r.name === target?.name);
    if (!s) return null;
    return {
      name: s.name,
      sub: `${s.flag} ${s.country}`,
      logo: entityLogoByName(s.name),
      note: s.note,
      stats: [
        { label: "Ticker", value: RLPG_TICKERS[s.name] ?? "Not listed" },
        {
          label: "Share price",
          value: get(RLPG_TICKERS[s.name]) ? fmt(get(RLPG_TICKERS[s.name])!.price, 2) : "—",
        },
        {
          label: "1-day change",
          value: get(RLPG_TICKERS[s.name])
            ? `${get(RLPG_TICKERS[s.name])!.changePct >= 0 ? "+" : ""}${get(RLPG_TICKERS[s.name])!.changePct.toFixed(2)}%`
            : "—",
          tone: detailTone(get(RLPG_TICKERS[s.name])?.changePct),
        },
        { label: "Renewable LPG supplied", value: `${fmt(s.supplyKtY, 1)} kt/yr` },
        { label: "Production capacity", value: `${fmt(s.capacityKtY, 1)} kt/yr` },
        { label: "Role", value: s.role },
        { label: "Market cap (approx.)", value: marketCapLabel(RLPG_TICKERS[s.name]) ?? "Private / state-owned" },
      ],
      news: { name: s.name, query: `"${s.name}" ${NEWS_SUFFIX}` },
    };
  }, graph);

  return (
    <>
      {detail.sheet}
      <ChartPanel
        icon={Cylinder}
        title={TITLE}
        blurb="BioLPG produced alongside HVO and SAF, renewable DME plants, and the distributors delivering renewable propane to off-grid heating, cooking and autogas."
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
              filename: "global-renewable-lpg-suppliers",
              note: `Measure shown: ${metric.label}`,
              header: [
                "Ticker",
                "Share price",
                "1-day change %",
                "Company",
                "Country",
                "Role",
                "Renewable LPG supplied (kt/yr)",
                "Production capacity (kt/yr)",
                "Market cap (approx., USD bn)",
                "Note",
              ],
              rows: ranked.map((s) => [
                RLPG_TICKERS[s.name] ?? "Not listed",
                get(RLPG_TICKERS[s.name])?.price ?? "",
                get(RLPG_TICKERS[s.name])?.changePct?.toFixed(2) ?? "",
                s.name,
                s.country,
                s.role,
                s.supplyKtY,
                s.capacityKtY,
                marketCapValue(RLPG_TICKERS[s.name]),
                s.note,
              ]),
            })}
          />
        }
        filters={
          <ChartFilterBar
            query={f.query}
            onQueryChange={f.setQuery}
            placeholder="Search renewable LPG suppliers…"
            selects={[
              {
                label: "Country",
                value: f.a,
                options: countryFilterOptions(SUPPLIERS.map((s) => s.country)),
                onChange: f.setA,
                allLabel: "All countries",
              },
              {
                label: "Role",
                value: f.b,
                options: countryFilterOptions(SUPPLIERS.map((s) => s.role)),
                onChange: f.setB,
                allLabel: "All roles",
              },
            ]}
            shown={rows.length}
            total={SUPPLIERS.length}
            matched={ranked.length}
          />
        }
        footnote={`Indicative volumes compiled from company disclosures, Liquid Gas Europe and WLPGA renewable LPG reporting. BioLPG is largely an HVO/SAF co-product, so producer volumes track renewable diesel runs. Click any tile for the latest news. ${MARKET_CAP_NOTE}`}
              >
        {ghgEmpty ? (
          <GhgEmptyNotice />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No renewable LPG suppliers listed for this filter — open that country's profile page for
            its policy and market updates.
          </p>
        ) : view === "line" ? (
          <ChartTrend panel="rlpg" />
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
            indexLabel="Global renewable LPG index"
          />
        ) : view === "map" ? (
          <ChartMap
            points={rows.map((s) => ({
              key: s.name,
              label: s.name,
              country: s.country,
              value: valueOf(s),
              sub: s.note,
              newsTarget: { name: s.name, query: `"${s.name}" ${NEWS_SUFFIX}` },
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
            yLabel="Renewable LPG supplier"
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
            indexLabel="Global renewable LPG index"
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
