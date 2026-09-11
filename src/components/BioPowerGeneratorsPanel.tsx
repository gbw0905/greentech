import { useState } from "react";
import { ChartMap } from "@/components/ChartMap";
import { Zap } from "lucide-react";
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
import { ChartFilterBar, countryFilterOptions, useChartFilter } from "@/components/chart-filters";
import { entityLogoByName } from "@/lib/entity-logos";
import { BIOPOWER_TICKERS } from "@/lib/entity-tickers";
import { priceMeta, priceTone, useEntityQuotes } from "@/lib/use-entity-quotes";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { marketCapValue, marketCapLabel, MARKET_CAP_NOTE } from "@/lib/market-caps";

type Generator = {
  name: string;
  country: string;
  flag: string;
  /** Installed biomass / biofuel generating capacity, MW */
  capacityMw: number;
  /** Annual electricity generated from biofuels, GWh per year */
  generationGwh: number;
  feedstock: string;
  note: string;
};

/**
 * Global electricity generators burning biofuels — solid biomass, bagasse,
 * biogas, waste-to-energy and co-firing fleets. Capacities are indicative
 * installed MW of biofuel-fired generation.
 */
const GENERATORS: Generator[] = [
  // ---------- United Kingdom & Europe ----------
  { name: "Drax Power", country: "United Kingdom", flag: "🇬🇧", capacityMw: 2600, generationGwh: 14000, feedstock: "Wood pellets", note: "World's largest single-site biomass plant, former coal station fully converted" },
  { name: "Lynemouth Power (EPH)", country: "United Kingdom", flag: "🇬🇧", capacityMw: 420, generationGwh: 2900, feedstock: "Wood pellets", note: "Coal-to-biomass conversion supplying UK capacity market" },
  { name: "Ørsted bioenergy", country: "Denmark", flag: "🇩🇰", capacityMw: 800, generationGwh: 3600, feedstock: "Wood chips / straw", note: "Biomass CHP fleet across Greater Copenhagen and Jutland" },
  { name: "RWE bioenergy", country: "Netherlands", flag: "🇳🇱", capacityMw: 700, generationGwh: 4100, feedstock: "Wood pellets", note: "Amer and Eemshaven co-firing ahead of planned full biomass conversion" },
  { name: "Uniper Maasvlakte", country: "Netherlands", flag: "🇳🇱", capacityMw: 180, generationGwh: 900, feedstock: "Biomass / waste", note: "Maasvlakte co-firing and Provence biomass conversion projects" },
  { name: "E.ON bioenergy & waste", country: "Germany", flag: "🇩🇪", capacityMw: 450, generationGwh: 2400, feedstock: "Biogas / biomass", note: "Distributed biomass CHP and biogas plants across Germany and Sweden" },
  { name: "RWE Americas biomass", country: "United States", flag: "🇺🇸", capacityMw: 200, generationGwh: 1400, feedstock: "Biomass", note: "Legacy US biomass fleet inside the RWE clean energy portfolio" },
  { name: "Fortum CHP", country: "Finland", flag: "🇫🇮", capacityMw: 950, generationGwh: 3800, feedstock: "Forest residues / waste", note: "Nordic bio-CHP and waste-to-energy fleet after the Polish divestment" },
  { name: "Vattenfall biomass", country: "Sweden", flag: "🇸🇪", capacityMw: 600, generationGwh: 2100, feedstock: "Wood chips / residues", note: "District-heating biomass boilers in Uppsala and Berlin joint operations" },
  { name: "Statkraft bioenergy", country: "Norway", flag: "🇳🇴", capacityMw: 260, generationGwh: 1100, feedstock: "Forest biomass", note: "Tofte and district-heating bioenergy plants in Norway" },
  { name: "Engie bioenergy", country: "France", flag: "🇫🇷", capacityMw: 800, generationGwh: 3200, feedstock: "Biomass / biogas / RDF", note: "Biomass CHP, biogas-to-grid and waste recovery plants across France" },
  { name: "Veolia waste-to-energy", country: "France", flag: "🇫🇷", capacityMw: 1300, generationGwh: 5600, feedstock: "Municipal waste / biogas", note: "Global EfW fleet plus landfill and digester biogas generation" },
  { name: "PGE biomass cofiring", country: "Poland", flag: "🇵🇱", capacityMw: 350, generationGwh: 1800, feedstock: "Wood biomass", note: "Co-firing biomass in Polish lignite and hard-coal stations" },
  { name: "A2A waste-to-energy", country: "Italy", flag: "🇮🇹", capacityMw: 700, generationGwh: 3200, feedstock: "Waste / biogas", note: "Milan-area EfW fleet and anaerobic digestion generation" },
  { name: "Ence biomass", country: "Spain", flag: "🇪🇸", capacityMw: 270, generationGwh: 1700, feedstock: "Forest residues / agro", note: "Iberia's largest dedicated biomass generation fleet" },

  // ---------- United States & Canada ----------
  { name: "Georgia-Pacific", country: "United States", flag: "🇺🇸", capacityMw: 900, generationGwh: 5200, feedstock: "Black liquor / wood waste", note: "Pulp-mill biomass cogeneration across US Southeast mills" },
  { name: "Duke Energy bioenergy", country: "United States", flag: "🇺🇸", capacityMw: 250, generationGwh: 1400, feedstock: "Biogas / wood", note: "Swine and landfill biogas generation plus biomass co-firing" },
  { name: "Southern Company biomass", country: "United States", flag: "🇺🇸", capacityMw: 300, generationGwh: 1900, feedstock: "Wood / landfill gas", note: "Georgia biomass and landfill-gas fleet under state PPAs" },
  { name: "Dominion biomass", country: "United States", flag: "🇺🇸", capacityMw: 230, generationGwh: 1600, feedstock: "Wood", note: "Three 51 MW woody-biomass stations in Virginia" },
  { name: "We Energies biomass", country: "United States", flag: "🇺🇸", capacityMw: 50, generationGwh: 300, feedstock: "Wood waste", note: "Rothschild biomass plant running on sawmill residues" },
  { name: "Boralex biomass", country: "Canada", flag: "🇨🇦", capacityMw: 300, generationGwh: 1800, feedstock: "Wood residues", note: "Biomass cogeneration in Quebec, France and the US Northeast" },
  { name: "BC Hydro biomass IPPs", country: "Canada", flag: "🇨🇦", capacityMw: 800, generationGwh: 4800, feedstock: "Sawmill residues", note: "Independent biomass projects under BC Hydro electricity purchase agreements" },

  // ---------- Brazil & Latin America ----------
  { name: "Raízen bioenergy", country: "Brazil", flag: "🇧🇷", capacityMw: 1100, generationGwh: 5200, feedstock: "Sugarcane bagasse", note: "Largest bagasse cogeneration exporter to Brazil's grid" },
  { name: "Copersucar mills", country: "Brazil", flag: "🇧🇷", capacityMw: 900, generationGwh: 4300, feedstock: "Bagasse", note: "Mill cooperative fleet exporting surplus bagasse power" },
  { name: "FS Bioenergia cogeneration", country: "Brazil", flag: "🇧🇷", capacityMw: 180, generationGwh: 900, feedstock: "Bagasse / wood", note: "Mato Grosso corn-ethanol plants with biomass self-generation" },
  { name: "Suzano bioenergy", country: "Brazil", flag: "🇧🇷", capacityMw: 500, generationGwh: 2400, feedstock: "Black liquor", note: "Pulp mill cogeneration exporting renewable power to the grid" },

  // ---------- Asia Pacific ----------
  { name: "eREX biomass", country: "Japan", flag: "🇯🇵", capacityMw: 350, generationGwh: 2000, feedstock: "Wood pellets / PKS", note: "Japan's largest independent biomass IPP across Tohoku and Kyushu" },
  { name: "Renova", country: "Japan", flag: "🇯🇵", capacityMw: 330, generationGwh: 1800, feedstock: "Wood pellets / PKS", note: "Tokyo-listed biomass developer with plants from Akita to Okinawa" },
  { name: "Sumitomo Forestry power", country: "Japan", flag: "🇯🇵", capacityMw: 250, generationGwh: 1600, feedstock: "Wood biomass", note: "Woody-biomass plants in Mombetsu, Hachinohe and Tomakomai" },
  { name: "KEPCO biomass cofiring", country: "South Korea", flag: "🇰🇷", capacityMw: 300, generationGwh: 1500, feedstock: "Wood pellets", note: "Biomass co-firing in coal fleet under Korea's RPS obligations" },
  { name: "NTPC biomass cofiring", country: "India", flag: "🇮🇳", capacityMw: 400, generationGwh: 2200, feedstock: "Agro-residue pellets", note: "National SAMARTH co-firing programme replacing coal with crop residue" },
  { name: "Gulf Energy bioenergy", country: "Thailand", flag: "🇹🇭", capacityMw: 220, generationGwh: 1300, feedstock: "Rice husk / bagasse", note: "Agro-waste biomass plants across Thailand" },
  { name: "Medco biomass & WtE", country: "Indonesia", flag: "🇮🇩", capacityMw: 90, generationGwh: 450, feedstock: "Palm waste", note: "Palm-oil-mill-waste generation in Sumatra" },
  { name: "Cleanaway WtE", country: "Australia", flag: "🇦🇺", capacityMw: 70, generationGwh: 420, feedstock: "Waste / landfill gas", note: "Landfill-gas generation and Kwinana waste-to-energy participation" },

  // ---------- Nordics & other regions ----------
  { name: "UPM bioenergy", country: "Finland", flag: "🇫🇮", capacityMw: 1000, generationGwh: 4800, feedstock: "Black liquor / residues", note: "Pulp mill CHP fleet in Finland, Germany and Uruguay" },
  { name: "Stora Enso energy", country: "Sweden", flag: "🇸🇪", capacityMw: 950, generationGwh: 4600, feedstock: "Black liquor / wood", note: "Mill bioenergy across Sweden, Finland, Poland and Brazil" },
  { name: "SCA biomass", country: "Sweden", flag: "🇸🇪", capacityMw: 600, generationGwh: 2800, feedstock: "Forest residues", note: "Östrand and Obbola mills among Europe's largest bio-CHP sites" },
  { name: "Södra bioenergy", country: "Sweden", flag: "🇸🇪", capacityMw: 450, generationGwh: 2200, feedstock: "Black liquor", note: "Member-owned pulp mills exporting surplus biomass power" },
  { name: "Mondi bioenergy", country: "South Africa", flag: "🇿🇦", capacityMw: 250, generationGwh: 1300, feedstock: "Black liquor / bark", note: "Mill biomass cogeneration across Europe and South Africa" },
  { name: "MPC Biomass (Muara Enim)", country: "Indonesia", flag: "🇮🇩", capacityMw: 130, generationGwh: 700, feedstock: "Empty fruit bunches", note: "Palm-waste biomass projects replacing diesel gensets" },
  { name: "Essex Bioenergy / Renewi EfW", country: "United Kingdom", flag: "🇬🇧", capacityMw: 260, generationGwh: 1500, feedstock: "Municipal waste", note: "UK waste-to-energy fleet under long-term council contracts" },
  { name: "Hitachi Zosen Inova", country: "Switzerland", flag: "🇨🇭", capacityMw: 900, generationGwh: 5200, feedstock: "Municipal waste / biogas", note: "Global EfW EPC and operator with plants on four continents" },
  // ---------- Added global coverage ----------
  { name: "PLN co-firing programme", country: "Indonesia", flag: "🇮🇩", capacityMw: 4200, generationGwh: 12000, feedstock: "Wood pellets / sawdust", note: "State utility co-firing biomass at dozens of coal units" },
  { name: "Korea Southern Power (KOSPO)", country: "South Korea", flag: "🇰🇷", capacityMw: 1100, generationGwh: 6200, feedstock: "Wood pellets", note: "Biomass units under Korea's Renewable Portfolio Standard" },
  { name: "Korea East-West Power", country: "South Korea", flag: "🇰🇷", capacityMw: 900, generationGwh: 5000, feedstock: "Wood pellets", note: "Dedicated biomass and co-firing plants at Dangjin" },
  { name: "Sumitomo Forestry biomass", country: "Japan", flag: "🇯🇵", capacityMw: 700, generationGwh: 4200, feedstock: "Wood chips / PKS", note: "FIT-supported biomass plants across Japan" },
  { name: "eREX", country: "Japan", flag: "🇯🇵", capacityMw: 600, generationGwh: 3800, feedstock: "PKS / wood pellets", note: "Independent biomass generator with Vietnam expansion" },
  { name: "Renova Inc.", country: "Japan", flag: "🇯🇵", capacityMw: 550, generationGwh: 3400, feedstock: "Wood pellets / PKS", note: "Japanese renewable IPP with large biomass pipeline" },
  { name: "NTPC biomass co-firing", country: "India", flag: "🇮🇳", capacityMw: 2000, generationGwh: 5500, feedstock: "Agri-residue pellets", note: "Paddy-straw pellet co-firing mandated across NTPC coal units" },
  { name: "Bajaj / Indian bagasse cogeneration", country: "India", flag: "🇮🇳", capacityMw: 1500, generationGwh: 4800, feedstock: "Bagasse", note: "Sugar-mill cogeneration exporting surplus power to the grid" },
  { name: "Guangdong Yudean biomass", country: "China", flag: "🇨🇳", capacityMw: 1800, generationGwh: 9000, feedstock: "Straw / wood residues", note: "Provincial biomass fleet under China's renewable tariff" },
  { name: "China Everbright Environment", country: "China", flag: "🇨🇳", capacityMw: 3800, generationGwh: 20000, feedstock: "Municipal waste / biomass", note: "World's largest waste-to-energy operator with biomass plants" },
  { name: "Kanden / Thai bagasse IPPs", country: "Thailand", flag: "🇹🇭", capacityMw: 900, generationGwh: 4200, feedstock: "Bagasse / rice husk", note: "Small power producers under Thailand's ADDER scheme" },
  { name: "Mitr Phol Bio-Power", country: "Thailand", flag: "🇹🇭", capacityMw: 600, generationGwh: 3000, feedstock: "Bagasse", note: "Sugar-group cogeneration exporting to the Thai grid" },
  { name: "TSH Resources biomass", country: "Malaysia", flag: "🇲🇾", capacityMw: 250, generationGwh: 1300, feedstock: "Palm residues / biogas", note: "Palm-mill power from EFB and POME biogas" },
  { name: "Green Earth / Philippine biomass IPPs", country: "Philippines", flag: "🇵🇭", capacityMw: 300, generationGwh: 1500, feedstock: "Bagasse / rice husk", note: "Feed-in-tariff biomass plants in Negros and Luzon" },
  { name: "Vinh Tan / Vietnam bagasse power", country: "Vietnam", flag: "🇻🇳", capacityMw: 400, generationGwh: 1800, feedstock: "Bagasse", note: "Sugar-mill cogeneration selling to EVN" },
  { name: "Cosan / Raízen bioelectricity", country: "Brazil", flag: "🇧🇷", capacityMw: 1200, generationGwh: 6000, feedstock: "Bagasse / cane straw", note: "Largest cane bioelectricity exporter in Brazil" },
  { name: "São Martinho cogeneration", country: "Brazil", flag: "🇧🇷", capacityMw: 500, generationGwh: 2400, feedstock: "Bagasse", note: "Mill cogeneration selling into the free power market" },
  { name: "Ledesma cogeneration", country: "Argentina", flag: "🇦🇷", capacityMw: 150, generationGwh: 700, feedstock: "Bagasse", note: "Sugar complex power exports under RenovAr" },
  { name: "Ingenio Providencia power", country: "Colombia", flag: "🇨🇴", capacityMw: 120, generationGwh: 600, feedstock: "Bagasse", note: "Cauca Valley cane cogeneration" },
  { name: "Proenergia / Mexican biomass", country: "Mexico", flag: "🇲🇽", capacityMw: 200, generationGwh: 900, feedstock: "Bagasse / agri waste", note: "Sugar-mill and agri-residue generation for industry" },
  { name: "Tongaat Hulett cogeneration", country: "South Africa", flag: "🇿🇦", capacityMw: 180, generationGwh: 800, feedstock: "Bagasse", note: "KwaZulu-Natal mill power supplying Eskom" },
  { name: "Mumias / Kenyan bagasse power", country: "Kenya", flag: "🇰🇪", capacityMw: 90, generationGwh: 400, feedstock: "Bagasse", note: "Sugar-mill cogeneration feeding the national grid" },
  { name: "Kinyara / Ugandan cogeneration", country: "Uganda", flag: "🇺🇬", capacityMw: 70, generationGwh: 320, feedstock: "Bagasse", note: "Sugar-estate biomass power under GET FiT Uganda" },
  { name: "Illovo Zambia power", country: "Zambia", flag: "🇿🇲", capacityMw: 60, generationGwh: 280, feedstock: "Bagasse", note: "Nakambala mill cogeneration" },
  { name: "Fortum biomass CHP", country: "Finland", flag: "🇫🇮", capacityMw: 900, generationGwh: 4200, feedstock: "Wood chips", note: "Nordic and Baltic biomass CHP for heat and power" },
  { name: "Vattenfall biomass CHP", country: "Sweden", flag: "🇸🇪", capacityMw: 700, generationGwh: 3200, feedstock: "Wood chips / pellets", note: "Uppsala and Berlin biomass conversions" },
  { name: "HOFOR Amagerværket", country: "Denmark", flag: "🇩🇰", capacityMw: 500, generationGwh: 2400, feedstock: "Wood chips", note: "Copenhagen CHP converted from coal to sustainable biomass" },
  { name: "Veolia biomass Europe", country: "France", flag: "🇫🇷", capacityMw: 800, generationGwh: 3600, feedstock: "Wood / waste", note: "District heating and industrial biomass boilers across Europe" },
  { name: "Enel Green Power biomass", country: "Italy", flag: "🇮🇹", capacityMw: 350, generationGwh: 1700, feedstock: "Agri residues", note: "Italian biomass and biogas generation fleet" },
  { name: "MVV Energie", country: "Germany", flag: "🇩🇪", capacityMw: 600, generationGwh: 3000, feedstock: "Waste wood", note: "Waste-wood CHP plants in Mannheim and Ridham Dock" },
  { name: "Enviva-supplied Mitsubishi units", country: "Japan", flag: "🇯🇵", capacityMw: 450, generationGwh: 2600, feedstock: "Wood pellets", note: "Long-term pellet offtake plants under Japan's FIT" },
  { name: "Genesis Energy biomass", country: "New Zealand", flag: "🇳🇿", capacityMw: 90, generationGwh: 420, feedstock: "Wood residues", note: "Huntly co-firing trials with torrefied biomass" },
];

type Metric = "capacity" | "generation" | "price" | "marketcap" | "ghg";

const METRICS: Record<
  Metric,
  { label: string; unit: string; help: string; decimals: number; value: (g: Generator) => number }
> = {
  capacity: {
    label: "Biofuel capacity (MW)",
    unit: "MW of installed biofuel-fired generation",
    help: "Installed generating capacity that runs on solid biomass, bagasse, biogas or waste-derived fuels. Bigger tiles mean more biofuel-fired megawatts.",
    decimals: 0,
    value: (g) => g.capacityMw,
  },
  generation: {
    label: "Biofuel generation (GWh/yr)",
    unit: "GWh of electricity generated from biofuels / year",
    help: "Indicative annual electricity generated from biofuels. High capacity factors on biomass mean the biggest plants here punch above their MW.",
    decimals: 0,
    value: (g) => g.generationGwh,
  },
  price: {
    label: "Share price (listing currency)",
    unit: "share price, primary listing currency",
    help: "Latest traded share price on the generator's primary listing. State-owned and private operators have no listing and sit at the end.",
    decimals: 2,
    value: () => 0,
  },
  marketcap: {
    label: "Market cap (approx.)",
    unit: "approximate market capitalisation, USD billions",
    help: "Approximate latest market capitalisation in USD billions, converted at recent exchange rates. Private, state-owned or unlisted entities rank last.",
    decimals: 1,
    value: (g) => marketCapValue(BIOPOWER_TICKERS[g.name]),
  },

  ghg: {
    label: "GHG savings (reported)",
    unit: "million tonnes CO₂e avoided per year",
    help: GHG_NOTE,
    decimals: 1,
    value: (g) => ghgSavingsMt(g.name),
  },
};

function scatterAxes(metricKey: Metric) {
  if (metricKey === "capacity") {
    return {
      x: { metric: METRICS.generation, help: "X-axis shows annual biofuel generation; Y-axis shows installed biofuel capacity." },
      size: { label: "Biofuel capacity", unit: "MW", value: (g: Generator) => g.capacityMw },
    };
  }
  if (metricKey === "marketcap") {
    return {
      x: { metric: METRICS.capacity, help: "X-axis shows installed biofuel capacity; Y-axis shows approximate market cap." },
      size: { label: "Biofuel capacity", unit: "MW", value: (g: Generator) => g.capacityMw },
    };
  }
  return {
    x: { metric: METRICS.capacity, help: "X-axis shows installed biofuel capacity; Y-axis shows the selected measure." },
    size: { label: "Biofuel generation", unit: "GWh/yr", value: (g: Generator) => g.generationGwh },
  };
}

const TITLE = "Global electricity generators using biofuel";
const NEWS_SUFFIX = "biomass biogas power generation";

export function BioPowerGeneratorsPanel() {
  const [metricKey, setMetricKey] = useState<Metric>("capacity");
  const [view, setView] = useState<PanelView>("heat");
  const detail = useEntityDetail();
  const { get } = useEntityQuotes();
  const metric = METRICS[metricKey];
  const valueOf = (g: Generator) =>
    metricKey === "price" ? (get(BIOPOWER_TICKERS[g.name])?.price ?? 0) : metric.value(g);

  const f = useChartFilter(GENERATORS, {
    text: (g) => `${g.name} ${g.country} ${g.feedstock} ${g.note}`,
    facetA: (g) => g.country,
    facetB: (g) => g.feedstock,
  });
  const ranked = f.filtered.slice().sort((a, b) => valueOf(b) - valueOf(a));
  const isFiltered = Boolean(f.a || f.b || f.query.trim());
  const rows = view === "table" || view === "map" ? ranked : ranked.slice(0, isFiltered ? 20 : 10);
  const ghgEmpty =
    metricKey === "ghg" && ranked.length > 0 && !ranked.some((x) => ghgSavingsMt(x.name) > 0);

  const axes = scatterAxes(metricKey);
  const scatterPoints: ScatterPoint[] = rows.map((g) => ({
    key: g.name,
    label: g.name,
    sub: `${g.country} · ${g.feedstock}`,
    x: axes.x.metric.value(g),
    y: valueOf(g),
    size: axes.size.value(g),
    group: g.country,
    logo: entityLogoByName(g.name),
    meta: priceMeta(get(BIOPOWER_TICKERS[g.name])),
    changePct: get(BIOPOWER_TICKERS[g.name])?.changePct,
    newsTarget: { name: g.name, query: `"${g.name}" ${NEWS_SUFFIX}` },
  }));

  const items = rows.map((g) => ({
    key: g.name,
    label: g.name,
    sub: `${g.feedstock} · ${g.note}`,
    value: valueOf(g),
    logo: entityLogoByName(g.name),
    meta: priceMeta(get(BIOPOWER_TICKERS[g.name])),
    tone: priceTone(get(BIOPOWER_TICKERS[g.name])),
    changePct: get(BIOPOWER_TICKERS[g.name])?.changePct,
  }));
  const newsMap = Object.fromEntries(
    rows.map((g) => [g.name, { name: g.name, query: `"${g.name}" ${NEWS_SUFFIX}` }]),
  );
  const filters: [string, string][] = [
    ["Country", f.a || "All countries"],
    ["Feedstock", f.b || "All feedstocks"],
  ];
  if (f.query.trim()) filters.push(["Search", `"${f.query.trim()}"`]);
  const graph: GraphContext = {
    measure: metric.label,
    unit: metric.unit,
    view: PANEL_VIEWS.find((v) => v.value === view)?.label ?? view,
    filters,
    items: rows.map((g) => ({ name: g.name, value: valueOf(g) })),
    format: (n: number) => fmt(n, metric.decimals),
  };
  const onSelect = detail.onSelect((target) => {
    const g = rows.find((r) => r.name === target?.name);
    if (!g) return null;
    const q = get(BIOPOWER_TICKERS[g.name]);
    return {
      name: g.name,
      sub: `${g.flag} ${g.country}`,
      logo: entityLogoByName(g.name),
      note: g.note,
      stats: [
        { label: "Biofuel capacity", value: `${fmt(g.capacityMw, 0)} MW` },
        { label: "Biofuel generation", value: `${fmt(g.generationGwh, 0)} GWh/yr` },
        { label: "Feedstock", value: g.feedstock },
        { label: "Ticker", value: BIOPOWER_TICKERS[g.name] ?? "Not listed" },
        { label: "Share price", value: q ? fmt(q.price, 2) : "—" },
        {
          label: "1-day change",
          value: q ? `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%` : "—",
          tone: detailTone(q?.changePct),
        },
        { label: "Market cap (approx.)", value: marketCapLabel(BIOPOWER_TICKERS[g.name]) ?? "Private / state-owned" },
      ],
      news: { name: g.name, query: `"${g.name}" ${NEWS_SUFFIX}` },
    };
  }, graph);

  return (
    <>
      {detail.sheet}
      <ChartPanel
        icon={Zap}
        title={TITLE}
        blurb="Power utilities and IPPs generating electricity from solid biomass, sugarcane bagasse, biogas and waste-derived fuels."
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
              filename: "global-biopower-generators",
              note: `Measure shown: ${metric.label}`,
              header: [
                "Generator",
                "Country",
                "Feedstock",
                "Biofuel capacity (MW)",
                "Biofuel generation (GWh/yr)",
                "Ticker",
                "Share price",
                "1-day change %",
                "Market cap (approx., USD bn)",
                "Note",
              ],
              rows: ranked.map((g) => {
                const q = get(BIOPOWER_TICKERS[g.name]);
                return [
                  g.name,
                  g.country,
                  g.feedstock,
                  g.capacityMw,
                  g.generationGwh,
                  BIOPOWER_TICKERS[g.name] ?? "",
                  q ? q.price.toFixed(2) : "",
                  q ? q.changePct.toFixed(2) : "",
                  marketCapLabel(BIOPOWER_TICKERS[g.name]) ?? "",
                  g.note,
                ];
              }),
            })}
          />
        }
        filters={
          <ChartFilterBar
            query={f.query}
            onQueryChange={f.setQuery}
            placeholder="Search biofuel generators…"
            selects={[
              {
                label: "Country",
                value: f.a,
                options: countryFilterOptions(GENERATORS.map((g) => g.country)),
                onChange: f.setA,
                allLabel: "All countries",
              },
              {
                label: "Feedstock",
                value: f.b,
                options: countryFilterOptions(GENERATORS.map((g) => g.feedstock)),
                onChange: f.setB,
                allLabel: "All feedstocks",
              },
            ]}
            shown={rows.length}
            total={GENERATORS.length}
            matched={ranked.length}
          />
        }
        footnote={`Indicative biofuel-fired capacities from generator annual reports, IEA Bioenergy and national renewables registries. Click any tile for the latest news. ${MARKET_CAP_NOTE}`}
        import { useState } from "react";
import { ChartMap } from "@/components/ChartMap";
import { Zap } from "lucide-react";
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
import { ChartFilterBar, countryFilterOptions, useChartFilter } from "@/components/chart-filters";
import { entityLogoByName } from "@/lib/entity-logos";
import { BIOPOWER_TICKERS } from "@/lib/entity-tickers";
import { priceMeta, priceTone, useEntityQuotes } from "@/lib/use-entity-quotes";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { marketCapValue, marketCapLabel, MARKET_CAP_NOTE } from "@/lib/market-caps";

type Generator = {
  name: string;
  country: string;
  flag: string;
  /** Installed biomass / biofuel generating capacity, MW */
  capacityMw: number;
  /** Annual electricity generated from biofuels, GWh per year */
  generationGwh: number;
  feedstock: string;
  note: string;
};

/**
 * Global electricity generators burning biofuels — solid biomass, bagasse,
 * biogas, waste-to-energy and co-firing fleets. Capacities are indicative
 * installed MW of biofuel-fired generation.
 */
const GENERATORS: Generator[] = [
  // ---------- United Kingdom & Europe ----------
  { name: "Drax Power", country: "United Kingdom", flag: "🇬🇧", capacityMw: 2600, generationGwh: 14000, feedstock: "Wood pellets", note: "World's largest single-site biomass plant, former coal station fully converted" },
  { name: "Lynemouth Power (EPH)", country: "United Kingdom", flag: "🇬🇧", capacityMw: 420, generationGwh: 2900, feedstock: "Wood pellets", note: "Coal-to-biomass conversion supplying UK capacity market" },
  { name: "Ørsted bioenergy", country: "Denmark", flag: "🇩🇰", capacityMw: 800, generationGwh: 3600, feedstock: "Wood chips / straw", note: "Biomass CHP fleet across Greater Copenhagen and Jutland" },
  { name: "RWE bioenergy", country: "Netherlands", flag: "🇳🇱", capacityMw: 700, generationGwh: 4100, feedstock: "Wood pellets", note: "Amer and Eemshaven co-firing ahead of planned full biomass conversion" },
  { name: "Uniper Maasvlakte", country: "Netherlands", flag: "🇳🇱", capacityMw: 180, generationGwh: 900, feedstock: "Biomass / waste", note: "Maasvlakte co-firing and Provence biomass conversion projects" },
  { name: "E.ON bioenergy & waste", country: "Germany", flag: "🇩🇪", capacityMw: 450, generationGwh: 2400, feedstock: "Biogas / biomass", note: "Distributed biomass CHP and biogas plants across Germany and Sweden" },
  { name: "RWE Americas biomass", country: "United States", flag: "🇺🇸", capacityMw: 200, generationGwh: 1400, feedstock: "Biomass", note: "Legacy US biomass fleet inside the RWE clean energy portfolio" },
  { name: "Fortum CHP", country: "Finland", flag: "🇫🇮", capacityMw: 950, generationGwh: 3800, feedstock: "Forest residues / waste", note: "Nordic bio-CHP and waste-to-energy fleet after the Polish divestment" },
  { name: "Vattenfall biomass", country: "Sweden", flag: "🇸🇪", capacityMw: 600, generationGwh: 2100, feedstock: "Wood chips / residues", note: "District-heating biomass boilers in Uppsala and Berlin joint operations" },
  { name: "Statkraft bioenergy", country: "Norway", flag: "🇳🇴", capacityMw: 260, generationGwh: 1100, feedstock: "Forest biomass", note: "Tofte and district-heating bioenergy plants in Norway" },
  { name: "Engie bioenergy", country: "France", flag: "🇫🇷", capacityMw: 800, generationGwh: 3200, feedstock: "Biomass / biogas / RDF", note: "Biomass CHP, biogas-to-grid and waste recovery plants across France" },
  { name: "Veolia waste-to-energy", country: "France", flag: "🇫🇷", capacityMw: 1300, generationGwh: 5600, feedstock: "Municipal waste / biogas", note: "Global EfW fleet plus landfill and digester biogas generation" },
  { name: "PGE biomass cofiring", country: "Poland", flag: "🇵🇱", capacityMw: 350, generationGwh: 1800, feedstock: "Wood biomass", note: "Co-firing biomass in Polish lignite and hard-coal stations" },
  { name: "A2A waste-to-energy", country: "Italy", flag: "🇮🇹", capacityMw: 700, generationGwh: 3200, feedstock: "Waste / biogas", note: "Milan-area EfW fleet and anaerobic digestion generation" },
  { name: "Ence biomass", country: "Spain", flag: "🇪🇸", capacityMw: 270, generationGwh: 1700, feedstock: "Forest residues / agro", note: "Iberia's largest dedicated biomass generation fleet" },

  // ---------- United States & Canada ----------
  { name: "Georgia-Pacific", country: "United States", flag: "🇺🇸", capacityMw: 900, generationGwh: 5200, feedstock: "Black liquor / wood waste", note: "Pulp-mill biomass cogeneration across US Southeast mills" },
  { name: "Duke Energy bioenergy", country: "United States", flag: "🇺🇸", capacityMw: 250, generationGwh: 1400, feedstock: "Biogas / wood", note: "Swine and landfill biogas generation plus biomass co-firing" },
  { name: "Southern Company biomass", country: "United States", flag: "🇺🇸", capacityMw: 300, generationGwh: 1900, feedstock: "Wood / landfill gas", note: "Georgia biomass and landfill-gas fleet under state PPAs" },
  { name: "Dominion biomass", country: "United States", flag: "🇺🇸", capacityMw: 230, generationGwh: 1600, feedstock: "Wood", note: "Three 51 MW woody-biomass stations in Virginia" },
  { name: "We Energies biomass", country: "United States", flag: "🇺🇸", capacityMw: 50, generationGwh: 300, feedstock: "Wood waste", note: "Rothschild biomass plant running on sawmill residues" },
  { name: "Boralex biomass", country: "Canada", flag: "🇨🇦", capacityMw: 300, generationGwh: 1800, feedstock: "Wood residues", note: "Biomass cogeneration in Quebec, France and the US Northeast" },
  { name: "BC Hydro biomass IPPs", country: "Canada", flag: "🇨🇦", capacityMw: 800, generationGwh: 4800, feedstock: "Sawmill residues", note: "Independent biomass projects under BC Hydro electricity purchase agreements" },

  // ---------- Brazil & Latin America ----------
  { name: "Raízen bioenergy", country: "Brazil", flag: "🇧🇷", capacityMw: 1100, generationGwh: 5200, feedstock: "Sugarcane bagasse", note: "Largest bagasse cogeneration exporter to Brazil's grid" },
  { name: "Copersucar mills", country: "Brazil", flag: "🇧🇷", capacityMw: 900, generationGwh: 4300, feedstock: "Bagasse", note: "Mill cooperative fleet exporting surplus bagasse power" },
  { name: "FS Bioenergia cogeneration", country: "Brazil", flag: "🇧🇷", capacityMw: 180, generationGwh: 900, feedstock: "Bagasse / wood", note: "Mato Grosso corn-ethanol plants with biomass self-generation" },
  { name: "Suzano bioenergy", country: "Brazil", flag: "🇧🇷", capacityMw: 500, generationGwh: 2400, feedstock: "Black liquor", note: "Pulp mill cogeneration exporting renewable power to the grid" },

  // ---------- Asia Pacific ----------
  { name: "eREX biomass", country: "Japan", flag: "🇯🇵", capacityMw: 350, generationGwh: 2000, feedstock: "Wood pellets / PKS", note: "Japan's largest independent biomass IPP across Tohoku and Kyushu" },
  { name: "Renova", country: "Japan", flag: "🇯🇵", capacityMw: 330, generationGwh: 1800, feedstock: "Wood pellets / PKS", note: "Tokyo-listed biomass developer with plants from Akita to Okinawa" },
  { name: "Sumitomo Forestry power", country: "Japan", flag: "🇯🇵", capacityMw: 250, generationGwh: 1600, feedstock: "Wood biomass", note: "Woody-biomass plants in Mombetsu, Hachinohe and Tomakomai" },
  { name: "KEPCO biomass cofiring", country: "South Korea", flag: "🇰🇷", capacityMw: 300, generationGwh: 1500, feedstock: "Wood pellets", note: "Biomass co-firing in coal fleet under Korea's RPS obligations" },
  { name: "NTPC biomass cofiring", country: "India", flag: "🇮🇳", capacityMw: 400, generationGwh: 2200, feedstock: "Agro-residue pellets", note: "National SAMARTH co-firing programme replacing coal with crop residue" },
  { name: "Gulf Energy bioenergy", country: "Thailand", flag: "🇹🇭", capacityMw: 220, generationGwh: 1300, feedstock: "Rice husk / bagasse", note: "Agro-waste biomass plants across Thailand" },
  { name: "Medco biomass & WtE", country: "Indonesia", flag: "🇮🇩", capacityMw: 90, generationGwh: 450, feedstock: "Palm waste", note: "Palm-oil-mill-waste generation in Sumatra" },
  { name: "Cleanaway WtE", country: "Australia", flag: "🇦🇺", capacityMw: 70, generationGwh: 420, feedstock: "Waste / landfill gas", note: "Landfill-gas generation and Kwinana waste-to-energy participation" },

  // ---------- Nordics & other regions ----------
  { name: "UPM bioenergy", country: "Finland", flag: "🇫🇮", capacityMw: 1000, generationGwh: 4800, feedstock: "Black liquor / residues", note: "Pulp mill CHP fleet in Finland, Germany and Uruguay" },
  { name: "Stora Enso energy", country: "Sweden", flag: "🇸🇪", capacityMw: 950, generationGwh: 4600, feedstock: "Black liquor / wood", note: "Mill bioenergy across Sweden, Finland, Poland and Brazil" },
  { name: "SCA biomass", country: "Sweden", flag: "🇸🇪", capacityMw: 600, generationGwh: 2800, feedstock: "Forest residues", note: "Östrand and Obbola mills among Europe's largest bio-CHP sites" },
  { name: "Södra bioenergy", country: "Sweden", flag: "🇸🇪", capacityMw: 450, generationGwh: 2200, feedstock: "Black liquor", note: "Member-owned pulp mills exporting surplus biomass power" },
  { name: "Mondi bioenergy", country: "South Africa", flag: "🇿🇦", capacityMw: 250, generationGwh: 1300, feedstock: "Black liquor / bark", note: "Mill biomass cogeneration across Europe and South Africa" },
  { name: "MPC Biomass (Muara Enim)", country: "Indonesia", flag: "🇮🇩", capacityMw: 130, generationGwh: 700, feedstock: "Empty fruit bunches", note: "Palm-waste biomass projects replacing diesel gensets" },
  { name: "Essex Bioenergy / Renewi EfW", country: "United Kingdom", flag: "🇬🇧", capacityMw: 260, generationGwh: 1500, feedstock: "Municipal waste", note: "UK waste-to-energy fleet under long-term council contracts" },
  { name: "Hitachi Zosen Inova", country: "Switzerland", flag: "🇨🇭", capacityMw: 900, generationGwh: 5200, feedstock: "Municipal waste / biogas", note: "Global EfW EPC and operator with plants on four continents" },
  // ---------- Added global coverage ----------
  { name: "PLN co-firing programme", country: "Indonesia", flag: "🇮🇩", capacityMw: 4200, generationGwh: 12000, feedstock: "Wood pellets / sawdust", note: "State utility co-firing biomass at dozens of coal units" },
  { name: "Korea Southern Power (KOSPO)", country: "South Korea", flag: "🇰🇷", capacityMw: 1100, generationGwh: 6200, feedstock: "Wood pellets", note: "Biomass units under Korea's Renewable Portfolio Standard" },
  { name: "Korea East-West Power", country: "South Korea", flag: "🇰🇷", capacityMw: 900, generationGwh: 5000, feedstock: "Wood pellets", note: "Dedicated biomass and co-firing plants at Dangjin" },
  { name: "Sumitomo Forestry biomass", country: "Japan", flag: "🇯🇵", capacityMw: 700, generationGwh: 4200, feedstock: "Wood chips / PKS", note: "FIT-supported biomass plants across Japan" },
  { name: "eREX", country: "Japan", flag: "🇯🇵", capacityMw: 600, generationGwh: 3800, feedstock: "PKS / wood pellets", note: "Independent biomass generator with Vietnam expansion" },
  { name: "Renova Inc.", country: "Japan", flag: "🇯🇵", capacityMw: 550, generationGwh: 3400, feedstock: "Wood pellets / PKS", note: "Japanese renewable IPP with large biomass pipeline" },
  { name: "NTPC biomass co-firing", country: "India", flag: "🇮🇳", capacityMw: 2000, generationGwh: 5500, feedstock: "Agri-residue pellets", note: "Paddy-straw pellet co-firing mandated across NTPC coal units" },
  { name: "Bajaj / Indian bagasse cogeneration", country: "India", flag: "🇮🇳", capacityMw: 1500, generationGwh: 4800, feedstock: "Bagasse", note: "Sugar-mill cogeneration exporting surplus power to the grid" },
  { name: "Guangdong Yudean biomass", country: "China", flag: "🇨🇳", capacityMw: 1800, generationGwh: 9000, feedstock: "Straw / wood residues", note: "Provincial biomass fleet under China's renewable tariff" },
  { name: "China Everbright Environment", country: "China", flag: "🇨🇳", capacityMw: 3800, generationGwh: 20000, feedstock: "Municipal waste / biomass", note: "World's largest waste-to-energy operator with biomass plants" },
  { name: "Kanden / Thai bagasse IPPs", country: "Thailand", flag: "🇹🇭", capacityMw: 900, generationGwh: 4200, feedstock: "Bagasse / rice husk", note: "Small power producers under Thailand's ADDER scheme" },
  { name: "Mitr Phol Bio-Power", country: "Thailand", flag: "🇹🇭", capacityMw: 600, generationGwh: 3000, feedstock: "Bagasse", note: "Sugar-group cogeneration exporting to the Thai grid" },
  { name: "TSH Resources biomass", country: "Malaysia", flag: "🇲🇾", capacityMw: 250, generationGwh: 1300, feedstock: "Palm residues / biogas", note: "Palm-mill power from EFB and POME biogas" },
  { name: "Green Earth / Philippine biomass IPPs", country: "Philippines", flag: "🇵🇭", capacityMw: 300, generationGwh: 1500, feedstock: "Bagasse / rice husk", note: "Feed-in-tariff biomass plants in Negros and Luzon" },
  { name: "Vinh Tan / Vietnam bagasse power", country: "Vietnam", flag: "🇻🇳", capacityMw: 400, generationGwh: 1800, feedstock: "Bagasse", note: "Sugar-mill cogeneration selling to EVN" },
  { name: "Cosan / Raízen bioelectricity", country: "Brazil", flag: "🇧🇷", capacityMw: 1200, generationGwh: 6000, feedstock: "Bagasse / cane straw", note: "Largest cane bioelectricity exporter in Brazil" },
  { name: "São Martinho cogeneration", country: "Brazil", flag: "🇧🇷", capacityMw: 500, generationGwh: 2400, feedstock: "Bagasse", note: "Mill cogeneration selling into the free power market" },
  { name: "Ledesma cogeneration", country: "Argentina", flag: "🇦🇷", capacityMw: 150, generationGwh: 700, feedstock: "Bagasse", note: "Sugar complex power exports under RenovAr" },
  { name: "Ingenio Providencia power", country: "Colombia", flag: "🇨🇴", capacityMw: 120, generationGwh: 600, feedstock: "Bagasse", note: "Cauca Valley cane cogeneration" },
  { name: "Proenergia / Mexican biomass", country: "Mexico", flag: "🇲🇽", capacityMw: 200, generationGwh: 900, feedstock: "Bagasse / agri waste", note: "Sugar-mill and agri-residue generation for industry" },
  { name: "Tongaat Hulett cogeneration", country: "South Africa", flag: "🇿🇦", capacityMw: 180, generationGwh: 800, feedstock: "Bagasse", note: "KwaZulu-Natal mill power supplying Eskom" },
  { name: "Mumias / Kenyan bagasse power", country: "Kenya", flag: "🇰🇪", capacityMw: 90, generationGwh: 400, feedstock: "Bagasse", note: "Sugar-mill cogeneration feeding the national grid" },
  { name: "Kinyara / Ugandan cogeneration", country: "Uganda", flag: "🇺🇬", capacityMw: 70, generationGwh: 320, feedstock: "Bagasse", note: "Sugar-estate biomass power under GET FiT Uganda" },
  { name: "Illovo Zambia power", country: "Zambia", flag: "🇿🇲", capacityMw: 60, generationGwh: 280, feedstock: "Bagasse", note: "Nakambala mill cogeneration" },
  { name: "Fortum biomass CHP", country: "Finland", flag: "🇫🇮", capacityMw: 900, generationGwh: 4200, feedstock: "Wood chips", note: "Nordic and Baltic biomass CHP for heat and power" },
  { name: "Vattenfall biomass CHP", country: "Sweden", flag: "🇸🇪", capacityMw: 700, generationGwh: 3200, feedstock: "Wood chips / pellets", note: "Uppsala and Berlin biomass conversions" },
  { name: "HOFOR Amagerværket", country: "Denmark", flag: "🇩🇰", capacityMw: 500, generationGwh: 2400, feedstock: "Wood chips", note: "Copenhagen CHP converted from coal to sustainable biomass" },
  { name: "Veolia biomass Europe", country: "France", flag: "🇫🇷", capacityMw: 800, generationGwh: 3600, feedstock: "Wood / waste", note: "District heating and industrial biomass boilers across Europe" },
  { name: "Enel Green Power biomass", country: "Italy", flag: "🇮🇹", capacityMw: 350, generationGwh: 1700, feedstock: "Agri residues", note: "Italian biomass and biogas generation fleet" },
  { name: "MVV Energie", country: "Germany", flag: "🇩🇪", capacityMw: 600, generationGwh: 3000, feedstock: "Waste wood", note: "Waste-wood CHP plants in Mannheim and Ridham Dock" },
  { name: "Enviva-supplied Mitsubishi units", country: "Japan", flag: "🇯🇵", capacityMw: 450, generationGwh: 2600, feedstock: "Wood pellets", note: "Long-term pellet offtake plants under Japan's FIT" },
  { name: "Genesis Energy biomass", country: "New Zealand", flag: "🇳🇿", capacityMw: 90, generationGwh: 420, feedstock: "Wood residues", note: "Huntly co-firing trials with torrefied biomass" },
];

type Metric = "capacity" | "generation" | "price" | "marketcap" | "ghg";

const METRICS: Record<
  Metric,
  { label: string; unit: string; help: string; decimals: number; value: (g: Generator) => number }
> = {
  capacity: {
    label: "Biofuel capacity (MW)",
    unit: "MW of installed biofuel-fired generation",
    help: "Installed generating capacity that runs on solid biomass, bagasse, biogas or waste-derived fuels. Bigger tiles mean more biofuel-fired megawatts.",
    decimals: 0,
    value: (g) => g.capacityMw,
  },
  generation: {
    label: "Biofuel generation (GWh/yr)",
    unit: "GWh of electricity generated from biofuels / year",
    help: "Indicative annual electricity generated from biofuels. High capacity factors on biomass mean the biggest plants here punch above their MW.",
    decimals: 0,
    value: (g) => g.generationGwh,
  },
  price: {
    label: "Share price (listing currency)",
    unit: "share price, primary listing currency",
    help: "Latest traded share price on the generator's primary listing. State-owned and private operators have no listing and sit at the end.",
    decimals: 2,
    value: () => 0,
  },
  marketcap: {
    label: "Market cap (approx.)",
    unit: "approximate market capitalisation, USD billions",
    help: "Approximate latest market capitalisation in USD billions, converted at recent exchange rates. Private, state-owned or unlisted entities rank last.",
    decimals: 1,
    value: (g) => marketCapValue(BIOPOWER_TICKERS[g.name]),
  },

  ghg: {
    label: "GHG savings (reported)",
    unit: "million tonnes CO₂e avoided per year",
    help: GHG_NOTE,
    decimals: 1,
    value: (g) => ghgSavingsMt(g.name),
  },
};

function scatterAxes(metricKey: Metric) {
  if (metricKey === "capacity") {
    return {
      x: { metric: METRICS.generation, help: "X-axis shows annual biofuel generation; Y-axis shows installed biofuel capacity." },
      size: { label: "Biofuel capacity", unit: "MW", value: (g: Generator) => g.capacityMw },
    };
  }
  if (metricKey === "marketcap") {
    return {
      x: { metric: METRICS.capacity, help: "X-axis shows installed biofuel capacity; Y-axis shows approximate market cap." },
      size: { label: "Biofuel capacity", unit: "MW", value: (g: Generator) => g.capacityMw },
    };
  }
  return {
    x: { metric: METRICS.capacity, help: "X-axis shows installed biofuel capacity; Y-axis shows the selected measure." },
    size: { label: "Biofuel generation", unit: "GWh/yr", value: (g: Generator) => g.generationGwh },
  };
}

const TITLE = "Global electricity generators using biofuel";
const NEWS_SUFFIX = "biomass biogas power generation";

export function BioPowerGeneratorsPanel() {
  const [metricKey, setMetricKey] = useState<Metric>("capacity");
  const [view, setView] = useState<PanelView>("heat");
  const detail = useEntityDetail();
  const { get } = useEntityQuotes();
  const metric = METRICS[metricKey];
  const valueOf = (g: Generator) =>
    metricKey === "price" ? (get(BIOPOWER_TICKERS[g.name])?.price ?? 0) : metric.value(g);

  const f = useChartFilter(GENERATORS, {
    text: (g) => `${g.name} ${g.country} ${g.feedstock} ${g.note}`,
    facetA: (g) => g.country,
    facetB: (g) => g.feedstock,
  });
  const ranked = f.filtered.slice().sort((a, b) => valueOf(b) - valueOf(a));
  const isFiltered = Boolean(f.a || f.b || f.query.trim());
  const rows = view === "table" || view === "map" ? ranked : ranked.slice(0, isFiltered ? 20 : 10);
  const ghgEmpty =
    metricKey === "ghg" && ranked.length > 0 && !ranked.some((x) => ghgSavingsMt(x.name) > 0);

  const axes = scatterAxes(metricKey);
  const scatterPoints: ScatterPoint[] = rows.map((g) => ({
    key: g.name,
    label: g.name,
    sub: `${g.country} · ${g.feedstock}`,
    x: axes.x.metric.value(g),
    y: valueOf(g),
    size: axes.size.value(g),
    group: g.country,
    logo: entityLogoByName(g.name),
    meta: priceMeta(get(BIOPOWER_TICKERS[g.name])),
    changePct: get(BIOPOWER_TICKERS[g.name])?.changePct,
    newsTarget: { name: g.name, query: `"${g.name}" ${NEWS_SUFFIX}` },
  }));

  const items = rows.map((g) => ({
    key: g.name,
    label: g.name,
    sub: `${g.feedstock} · ${g.note}`,
    value: valueOf(g),
    logo: entityLogoByName(g.name),
    meta: priceMeta(get(BIOPOWER_TICKERS[g.name])),
    tone: priceTone(get(BIOPOWER_TICKERS[g.name])),
    changePct: get(BIOPOWER_TICKERS[g.name])?.changePct,
  }));
  const newsMap = Object.fromEntries(
    rows.map((g) => [g.name, { name: g.name, query: `"${g.name}" ${NEWS_SUFFIX}` }]),
  );
  const filters: [string, string][] = [
    ["Country", f.a || "All countries"],
    ["Feedstock", f.b || "All feedstocks"],
  ];
  if (f.query.trim()) filters.push(["Search", `"${f.query.trim()}"`]);
  const graph: GraphContext = {
    measure: metric.label,
    unit: metric.unit,
    view: PANEL_VIEWS.find((v) => v.value === view)?.label ?? view,
    filters,
    items: rows.map((g) => ({ name: g.name, value: valueOf(g) })),
    format: (n: number) => fmt(n, metric.decimals),
  };
  const onSelect = detail.onSelect((target) => {
    const g = rows.find((r) => r.name === target?.name);
    if (!g) return null;
    const q = get(BIOPOWER_TICKERS[g.name]);
    return {
      name: g.name,
      sub: `${g.flag} ${g.country}`,
      logo: entityLogoByName(g.name),
      note: g.note,
      stats: [
        { label: "Biofuel capacity", value: `${fmt(g.capacityMw, 0)} MW` },
        { label: "Biofuel generation", value: `${fmt(g.generationGwh, 0)} GWh/yr` },
        { label: "Feedstock", value: g.feedstock },
        { label: "Ticker", value: BIOPOWER_TICKERS[g.name] ?? "Not listed" },
        { label: "Share price", value: q ? fmt(q.price, 2) : "—" },
        {
          label: "1-day change",
          value: q ? `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%` : "—",
          tone: detailTone(q?.changePct),
        },
        { label: "Market cap (approx.)", value: marketCapLabel(BIOPOWER_TICKERS[g.name]) ?? "Private / state-owned" },
      ],
      news: { name: g.name, query: `"${g.name}" ${NEWS_SUFFIX}` },
    };
  }, graph);

  return (
    <>
      {detail.sheet}
      <ChartPanel
        icon={Zap}
        title={TITLE}
        blurb="Power utilities and IPPs generating electricity from solid biomass, sugarcane bagasse, biogas and waste-derived fuels."
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
              filename: "global-biopower-generators",
              note: `Measure shown: ${metric.label}`,
              header: [
                "Generator",
                "Country",
                "Feedstock",
                "Biofuel capacity (MW)",
                "Biofuel generation (GWh/yr)",
                "Ticker",
                "Share price",
                "1-day change %",
                "Market cap (approx., USD bn)",
                "Note",
              ],
              rows: ranked.map((g) => {
                const q = get(BIOPOWER_TICKERS[g.name]);
                return [
                  g.name,
                  g.country,
                  g.feedstock,
                  g.capacityMw,
                  g.generationGwh,
                  BIOPOWER_TICKERS[g.name] ?? "",
                  q ? q.price.toFixed(2) : "",
                  q ? q.changePct.toFixed(2) : "",
                  marketCapLabel(BIOPOWER_TICKERS[g.name]) ?? "",
                  g.note,
                ];
              }),
            })}
          />
        }
        filters={
          <ChartFilterBar
            query={f.query}
            onQueryChange={f.setQuery}
            placeholder="Search biofuel generators…"
            selects={[
              {
                label: "Country",
                value: f.a,
                options: countryFilterOptions(GENERATORS.map((g) => g.country)),
                onChange: f.setA,
                allLabel: "All countries",
              },
              {
                label: "Feedstock",
                value: f.b,
                options: countryFilterOptions(GENERATORS.map((g) => g.feedstock)),
                onChange: f.setB,
                allLabel: "All feedstocks",
              },
            ]}
            shown={rows.length}
            total={GENERATORS.length}
            matched={ranked.length}
          />
        }
        footnote={`Indicative biofuel-fired capacities from generator annual reports, IEA Bioenergy and national renewables registries. Click any tile for the latest news. ${MARKET_CAP_NOTE}`}
              >
        {ghgEmpty ? (
          <GhgEmptyNotice />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No biofuel generators listed for this filter — open that country's profile page for its
            policy and market updates.
          </p>
        ) : view === "line" ? (
        <ChartTrend panel="biopower" />
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
            indexLabel="Global biofuel power generation index"
          />
        ) : view === "map" ? (
          <ChartMap
            points={rows.map((g) => ({
              key: g.name,
              label: g.name,
              country: g.country,
              value: valueOf(g),
              sub: g.note,
              newsTarget: { name: g.name, query: `"${g.name}" ${NEWS_SUFFIX}` },
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
            yLabel="Biofuel generator"
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
            indexLabel="Global biofuel power generation index"
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
