import { useState } from "react";
import { ChartMap } from "@/components/ChartMap";
import { Trees } from "lucide-react";
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
  detailTone,
  useEntityDetail,
  type GraphContext,
} from "@/features/markets/components/EntityDetailSheet";
import { priceMeta, priceTone, useEntityQuotes } from "@/features/markets/hooks/useEntityQuotes";
import { ChartFilterBar, countryFilterOptions, useChartFilter } from "@/components/chart-filters";
import { entityLogoByName } from "@/features/markets/entity-logos";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { marketCapValue, marketCapLabel, MARKET_CAP_NOTE } from "@/features/markets/market-caps";
import { PELLET_TICKERS } from "@/features/markets/entity-tickers";

type Producer = {
  name: string;
  country: string;
  flag: string;
  /** Nameplate pellet production capacity, thousand tonnes per year */
  capacityKt: number;
  /** Operating pellet plants */
  plants: number;
  feedstock: string;
  note: string;
};

/**
 * Industrial and heating wood pellet producers — the solid biomass supply
 * chain feeding power stations, district heating and residential markets.
 */
const PRODUCERS: Producer[] = [
  // ---------- North America ----------
  {
    name: "Enviva",
    country: "United States",
    flag: "🇺🇸",
    capacityKt: 6300,
    plants: 10,
    feedstock: "Southern yellow pine",
    note: "World's largest industrial pellet producer, US Southeast plants and export terminals",
  },
  {
    name: "Drax Biomass",
    country: "United States",
    flag: "🇺🇸",
    capacityKt: 5000,
    plants: 17,
    feedstock: "Forest residues",
    note: "Self-supply pellet fleet for Drax Power plus third-party sales",
  },
  {
    name: "Pinnacle Renewable Energy (Drax)",
    country: "Canada",
    flag: "🇨🇦",
    capacityKt: 2500,
    plants: 11,
    feedstock: "Sawmill residues",
    note: "British Columbia and Alberta plants shipping to Asia and Europe",
  },
  {
    name: "Fram Renewable Fuels",
    country: "United States",
    flag: "🇺🇸",
    capacityKt: 1200,
    plants: 4,
    feedstock: "Pine roundwood",
    note: "Georgia producer exporting through Savannah to European utilities",
  },
  {
    name: "Highland Pellets",
    country: "United States",
    flag: "🇺🇸",
    capacityKt: 750,
    plants: 1,
    feedstock: "Pine residues",
    note: "Arkansas plant under long-term UK utility contracts",
  },
  {
    name: "Westervelt Renewable Energy",
    country: "United States",
    flag: "🇺🇸",
    capacityKt: 300,
    plants: 1,
    feedstock: "Hardwood residues",
    note: "Alabama pellet mill integrated with Westervelt timberlands",
  },
  {
    name: "Georgia Biomass (Enviva)",
    country: "United States",
    flag: "🇺🇸",
    capacityKt: 800,
    plants: 1,
    feedstock: "Pine",
    note: "Waycross plant, one of the largest single pellet mills in the world",
  },
  {
    name: "Woodville Pellets",
    country: "United States",
    flag: "🇺🇸",
    capacityKt: 500,
    plants: 1,
    feedstock: "Pine",
    note: "East Texas producer serving Japanese and Korean utilities",
  },
  {
    name: "Lignetics",
    country: "United States",
    flag: "🇺🇸",
    capacityKt: 900,
    plants: 12,
    feedstock: "Sawmill residues",
    note: "Largest US residential heating pellet brand",
  },
  {
    name: "EPC / Energex",
    country: "Canada",
    flag: "🇨🇦",
    capacityKt: 600,
    plants: 5,
    feedstock: "Hardwood residues",
    note: "Premium heating pellets for the US Northeast and Ontario",
  },
  {
    name: "Groupe Savoie",
    country: "Canada",
    flag: "🇨🇦",
    capacityKt: 250,
    plants: 3,
    feedstock: "Hardwood residues",
    note: "New Brunswick hardwood pellet and pallet producer",
  },
  {
    name: "Granules LG",
    country: "Canada",
    flag: "🇨🇦",
    capacityKt: 280,
    plants: 2,
    feedstock: "Sawmill residues",
    note: "Quebec heating pellet producer supplying Eastern Canada",
  },
  {
    name: "Shaw Resources",
    country: "Canada",
    flag: "🇨🇦",
    capacityKt: 150,
    plants: 2,
    feedstock: "Softwood residues",
    note: "Nova Scotia pellet producer for Atlantic Canada heating",
  },
  {
    name: "Pacific BioEnergy",
    country: "Canada",
    flag: "🇨🇦",
    capacityKt: 350,
    plants: 1,
    feedstock: "Sawmill residues",
    note: "Prince George plant shipping through Vancouver to Asia",
  },
  {
    name: "Vermont Wood Pellet",
    country: "United States",
    flag: "🇺🇸",
    capacityKt: 40,
    plants: 1,
    feedstock: "Hardwood",
    note: "Small hardwood heating pellet producer in New England",
  },
  {
    name: "Canada Wood Pellet Association members",
    country: "Canada",
    flag: "🇨🇦",
    capacityKt: 4600,
    plants: 42,
    feedstock: "Mixed residues",
    note: "Aggregate national capacity reported by the industry association",
  },

  // ---------- Europe ----------
  {
    name: "Graanul Invest",
    country: "Estonia",
    flag: "🇪🇪",
    capacityKt: 2600,
    plants: 12,
    feedstock: "Baltic softwood",
    note: "Europe's largest pellet producer with Baltic plants and CHP integration",
  },
  {
    name: "German Pellets",
    country: "Germany",
    flag: "🇩🇪",
    capacityKt: 900,
    plants: 6,
    feedstock: "Sawmill residues",
    note: "Long-running German heating pellet supplier",
  },
  {
    name: "Stora Enso pellets",
    country: "Finland",
    flag: "🇫🇮",
    capacityKt: 700,
    plants: 6,
    feedstock: "Mill residues",
    note: "Pellets produced alongside pulp and sawmill operations",
  },
  {
    name: "UPM pellets",
    country: "Finland",
    flag: "🇫🇮",
    capacityKt: 300,
    plants: 3,
    feedstock: "Mill residues",
    note: "Pellet output integrated with UPM biorefinery and mill sites",
  },
  {
    name: "SCA BioNorr",
    country: "Sweden",
    flag: "🇸🇪",
    capacityKt: 350,
    plants: 3,
    feedstock: "Sawmill residues",
    note: "Sweden's largest pellet producer for heating and industry",
  },
  {
    name: "Södra pellets",
    country: "Sweden",
    flag: "🇸🇪",
    capacityKt: 250,
    plants: 3,
    feedstock: "Sawdust",
    note: "Member-owned forestry group supplying Nordic heating markets",
  },
  {
    name: "Neova / Vapo",
    country: "Finland",
    flag: "🇫🇮",
    capacityKt: 300,
    plants: 5,
    feedstock: "Forest residues",
    note: "Nordic bioenergy supplier of pellets and wood chips",
  },
  {
    name: "Lantmännen Agroenergi",
    country: "Sweden",
    flag: "🇸🇪",
    capacityKt: 200,
    plants: 4,
    feedstock: "Sawdust / agri",
    note: "Farmer-cooperative pellet brand for heating markets",
  },
  {
    name: "Vida Energi",
    country: "Sweden",
    flag: "🇸🇪",
    capacityKt: 180,
    plants: 3,
    feedstock: "Sawmill residues",
    note: "Sawmill-integrated pellet production in southern Sweden",
  },
  {
    name: "Fortum pellets",
    country: "Finland",
    flag: "🇫🇮",
    capacityKt: 120,
    plants: 2,
    feedstock: "Forest residues",
    note: "Pellets supplied alongside Nordic district heating",
  },
  {
    name: "Barlinek / Olczyk",
    country: "Poland",
    flag: "🇵🇱",
    capacityKt: 400,
    plants: 4,
    feedstock: "Sawmill residues",
    note: "Polish flooring and pellet producer serving EU heating demand",
  },
  {
    name: "Enplus Baltic producers",
    country: "Latvia",
    flag: "🇱🇻",
    capacityKt: 1800,
    plants: 25,
    feedstock: "Softwood residues",
    note: "ENplus-certified Latvian and Lithuanian mills exporting to Western Europe",
  },
  {
    name: "Pellets LSP (Latvia)",
    country: "Latvia",
    flag: "🇱🇻",
    capacityKt: 300,
    plants: 2,
    feedstock: "Softwood",
    note: "Latvian exporter shipping through Riga and Liepāja",
  },
  {
    name: "AS Graanul Baltics",
    country: "Lithuania",
    flag: "🇱🇹",
    capacityKt: 500,
    plants: 4,
    feedstock: "Softwood residues",
    note: "Baltic arm of the Graanul group with CHP-integrated drying",
  },
  {
    name: "Ence pellets",
    country: "Spain",
    flag: "🇪🇸",
    capacityKt: 150,
    plants: 2,
    feedstock: "Forest residues",
    note: "Iberian pellet output alongside Ence's biomass power fleet",
  },
  {
    name: "Segezha Group",
    country: "Russia",
    flag: "🇷🇺",
    capacityKt: 400,
    plants: 4,
    feedstock: "Softwood residues",
    note: "Russian producer redirected to Asian and domestic markets after EU sanctions",
  },

  // ---------- Asia Pacific, Latin America & Oceania ----------
  {
    name: "Vietnam pellet exporters (An Viet Phat)",
    country: "Vietnam",
    flag: "🇻🇳",
    capacityKt: 2500,
    plants: 20,
    feedstock: "Acacia / rubberwood",
    note: "Vietnam is the second-largest pellet exporter to Japan and Korea",
  },
  {
    name: "Thanh Thanh Cong biomass",
    country: "Vietnam",
    flag: "🇻🇳",
    capacityKt: 400,
    plants: 3,
    feedstock: "Bagasse / wood",
    note: "Agri-industrial group exporting pellets and bagasse briquettes",
  },
  {
    name: "Malaysia PKS / pellet exporters",
    country: "Malaysia",
    flag: "🇲🇾",
    capacityKt: 900,
    plants: 12,
    feedstock: "Palm kernel shell / wood",
    note: "PKS and wood pellet supply into Japanese FIT biomass plants",
  },
  {
    name: "Australian Wood Pellets",
    country: "Australia",
    flag: "🇦🇺",
    capacityKt: 120,
    plants: 2,
    feedstock: "Plantation residues",
    note: "Domestic heating and industrial pellet supply",
  },
  {
    name: "Suzano pellets",
    country: "Brazil",
    flag: "🇧🇷",
    capacityKt: 300,
    plants: 2,
    feedstock: "Eucalyptus residues",
    note: "Pellet output from eucalyptus plantations and mill residues",
  },
  {
    name: "Arauco biomass",
    country: "Chile",
    flag: "🇨🇱",
    capacityKt: 250,
    plants: 3,
    feedstock: "Radiata pine residues",
    note: "Pellets and biomass power from integrated forestry operations",
  },
  {
    name: "CMPC bioenergy",
    country: "Chile",
    flag: "🇨🇱",
    capacityKt: 200,
    plants: 2,
    feedstock: "Pine / eucalyptus",
    note: "Pellet and biomass energy arm of the Chilean forestry group",
  },
  {
    name: "Rentech / Wawa",
    country: "Canada",
    flag: "🇨🇦",
    capacityKt: 450,
    plants: 2,
    feedstock: "Softwood residues",
    note: "Ontario pellet mills historically contracted to UK utilities",
  },
  // ---------- Added global coverage ----------
  {
    name: "An Viet Phat Energy",
    country: "Vietnam",
    flag: "🇻🇳",
    capacityKt: 1200,
    plants: 6,
    feedstock: "Acacia / rubberwood",
    note: "Vietnam's largest exporter of pellets to Japan and South Korea",
  },
  {
    name: "Vinh Phat Wood Pellet",
    country: "Vietnam",
    flag: "🇻🇳",
    capacityKt: 600,
    plants: 4,
    feedstock: "Acacia residues",
    note: "FSC-certified pellet supply for Asian utilities",
  },
  {
    name: "Thai Pellet Energy",
    country: "Thailand",
    flag: "🇹🇭",
    capacityKt: 350,
    plants: 3,
    feedstock: "Rubberwood / cane trash",
    note: "Agri-residue pellets for domestic and Japanese demand",
  },
  {
    name: "Malaysian Pellet Industries",
    country: "Malaysia",
    flag: "🇲🇾",
    capacityKt: 420,
    plants: 4,
    feedstock: "Palm kernel shell / EFB",
    note: "Palm-residue pellets exported to Japan and Korea",
  },
  {
    name: "Indonesia Wood Pellet (Bio Energi)",
    country: "Indonesia",
    flag: "🇮🇩",
    capacityKt: 700,
    plants: 5,
    feedstock: "Energy plantations",
    note: "Plantation pellets supplying PLN co-firing and Japanese buyers",
  },
  {
    name: "Perum Perhutani biomass",
    country: "Indonesia",
    flag: "🇮🇩",
    capacityKt: 300,
    plants: 3,
    feedstock: "Calliandra / sawmill residue",
    note: "State forestry pellet mills for coal co-firing",
  },
  {
    name: "Vyborgskaya / Baltic mills",
    country: "Latvia",
    flag: "🇱🇻",
    capacityKt: 900,
    plants: 6,
    feedstock: "Softwood residues",
    note: "Baltic pellet cluster supplying EU heating markets",
  },
  {
    name: "SBE / Lithuanian pellets",
    country: "Lithuania",
    flag: "🇱🇹",
    capacityKt: 500,
    plants: 5,
    feedstock: "Sawmill residues",
    note: "Heating pellets traded on the Baltpool exchange",
  },
  {
    name: "Barlinek / Polish pellets",
    country: "Poland",
    flag: "🇵🇱",
    capacityKt: 450,
    plants: 4,
    feedstock: "Sawmill residues",
    note: "Flooring-industry residues pelletised for EU heating",
  },
  {
    name: "Holzindustrie Schweighofer",
    country: "Romania",
    flag: "🇷🇴",
    capacityKt: 600,
    plants: 4,
    feedstock: "Spruce residues",
    note: "Integrated sawmilling and pellet production in the Carpathians",
  },
  {
    name: "Enerstena / Nordic Pellets",
    country: "Finland",
    flag: "🇫🇮",
    capacityKt: 400,
    plants: 4,
    feedstock: "Softwood residues",
    note: "Pellets for Finnish district heating plants",
  },
  {
    name: "Pellets Deutschland / German Pellets successors",
    country: "Germany",
    flag: "🇩🇪",
    capacityKt: 800,
    plants: 9,
    feedstock: "Sawmill residues",
    note: "Domestic heating pellet cluster serving DIN-plus market",
  },
  {
    name: "EO2 / Biosyl",
    country: "France",
    flag: "🇫🇷",
    capacityKt: 320,
    plants: 4,
    feedstock: "Softwood residues",
    note: "French heating-pellet producers with ENplus certification",
  },
  {
    name: "Portucel / Navigator pellets",
    country: "Portugal",
    flag: "🇵🇹",
    capacityKt: 500,
    plants: 3,
    feedstock: "Eucalyptus residues",
    note: "Iberian pellets exported to UK and Northern Europe",
  },
  {
    name: "Rendisa / Spanish pellets",
    country: "Spain",
    flag: "🇪🇸",
    capacityKt: 280,
    plants: 4,
    feedstock: "Pine residues",
    note: "Domestic heating pellets for Iberian boilers",
  },
  {
    name: "Groupe Rémabec pellets",
    country: "Canada",
    flag: "🇨🇦",
    capacityKt: 300,
    plants: 3,
    feedstock: "Forest residues",
    note: "Quebec forestry group with pellet and biochar lines",
  },
  {
    name: "CM Biomass sourcing",
    country: "Denmark",
    flag: "🇩🇰",
    capacityKt: 1500,
    plants: 8,
    feedstock: "Mixed residues",
    note: "Global pellet trader with owned mills in Asia and the Americas",
  },
  {
    name: "Bahia Pellets / Suzano residues",
    country: "Brazil",
    flag: "🇧🇷",
    capacityKt: 350,
    plants: 3,
    feedstock: "Eucalyptus residues",
    note: "Brazilian pellets for industrial heat and export",
  },
  {
    name: "NGE / Chilean pellets",
    country: "Chile",
    flag: "🇨🇱",
    capacityKt: 260,
    plants: 4,
    feedstock: "Radiata pine residues",
    note: "Heating pellets for southern Chile's air-quality programme",
  },
  {
    name: "Sylvamo / South African pellets",
    country: "South Africa",
    flag: "🇿🇦",
    capacityKt: 180,
    plants: 2,
    feedstock: "Plantation residues",
    note: "Pellets for industrial boilers and export to Europe",
  },
];

type Metric = "capacity" | "plants" | "marketcap" | "price" | "ghg";

const METRICS: Record<
  Metric,
  { label: string; unit: string; help: string; decimals: number; value: (p: Producer) => number }
> = {
  capacity: {
    label: "Pellet capacity (kt/yr)",
    unit: "thousand tonnes of pellets / year",
    help: "Nameplate pellet production capacity. Bigger tiles mean more solid biomass shipped to power stations and heating markets.",
    decimals: 0,
    value: (p) => p.capacityKt,
  },
  plants: {
    label: "Pellet plants",
    unit: "operating pellet mills",
    help: "Number of operating pellet mills. Many small heating mills can rank high here but low on tonnage.",
    decimals: 0,
    value: (p) => p.plants,
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
    value: (p) => marketCapValue(PELLET_TICKERS[p.name]),
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
      x: {
        metric: METRICS.plants,
        help: "X-axis shows the mill count; Y-axis shows pellet capacity.",
      },
      size: { label: "Pellet capacity", unit: "kt/yr", value: (p: Producer) => p.capacityKt },
    };
  }
  if (metricKey === "marketcap") {
    return {
      x: {
        metric: METRICS.capacity,
        help: "X-axis shows pellet capacity; Y-axis shows approximate market cap.",
      },
      size: { label: "Pellet capacity", unit: "kt/yr", value: (p: Producer) => p.capacityKt },
    };
  }
  return {
    x: {
      metric: METRICS.capacity,
      help: "X-axis shows pellet capacity; Y-axis shows the selected measure.",
    },
    size: { label: "Pellet plants", unit: "mills", value: (p: Producer) => p.plants },
  };
}

const TITLE = "Global wood pellet producers";
const NEWS_SUFFIX = "wood pellet biomass production";

export function WoodPelletProducersPanel() {
  const [metricKey, setMetricKey] = useState<Metric>("capacity");
  const [view, setView] = useState<PanelView>("heat");
  const detail = useEntityDetail();
  const { get } = useEntityQuotes();
  const metric = METRICS[metricKey];
  const valueOf = (p: Producer) =>
    metricKey === "price" ? (get(PELLET_TICKERS[p.name])?.price ?? 0) : metric.value(p);

  const f = useChartFilter(PRODUCERS, {
    text: (p) => `${p.name} ${p.country} ${p.feedstock} ${p.note}`,
    facetA: (p) => p.country,
    facetB: (p) => p.feedstock,
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
    sub: `${p.country} · ${p.feedstock}`,
    x: axes.x.metric.value(p),
    y: valueOf(p),
    size: axes.size.value(p),
    group: p.country,
    logo: entityLogoByName(p.name),
    meta: priceMeta(get(PELLET_TICKERS[p.name])),
    changePct: get(PELLET_TICKERS[p.name])?.changePct,
    newsTarget: { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` },
  }));

  const items = rows.map((p) => ({
    key: p.name,
    label: p.name,
    sub: `${p.feedstock} · ${p.note}`,
    value: valueOf(p),
    logo: entityLogoByName(p.name),
    meta: priceMeta(get(PELLET_TICKERS[p.name])),
    tone: priceTone(get(PELLET_TICKERS[p.name])),
    changePct: get(PELLET_TICKERS[p.name])?.changePct,
  }));
  const newsMap = Object.fromEntries(
    rows.map((p) => [p.name, { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` }]),
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
        { label: "Ticker", value: PELLET_TICKERS[p.name] ?? "Not listed" },
        {
          label: "Share price",
          value: get(PELLET_TICKERS[p.name]) ? fmt(get(PELLET_TICKERS[p.name])!.price, 2) : "—",
        },
        {
          label: "1-day change",
          value: get(PELLET_TICKERS[p.name])
            ? `${get(PELLET_TICKERS[p.name])!.changePct >= 0 ? "+" : ""}${get(PELLET_TICKERS[p.name])!.changePct.toFixed(2)}%`
            : "—",
          tone: detailTone(get(PELLET_TICKERS[p.name])?.changePct),
        },
        { label: "Pellet capacity", value: `${fmt(p.capacityKt, 0)} kt/yr` },
        { label: "Pellet plants", value: `${fmt(p.plants, 0)} mills` },
        { label: "Feedstock", value: p.feedstock },
        {
          label: "Market cap (approx.)",
          value: marketCapLabel(PELLET_TICKERS[p.name]) ?? "Private / state-owned",
        },
      ],
      news: { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` },
    };
  }, graph);

  return (
    <>
      {detail.sheet}
      <ChartPanel
        icon={Trees}
        title={TITLE}
        blurb="Industrial and heating pellet mills supplying converted power stations, district heating networks and residential stoves."
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
          <PanelActions
            summaryBuild={() =>
              summaryOf({
                panel: TITLE,
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
                title: TITLE,
                filename: "global-wood-pellet-producers",
                note: `Measure shown: ${metric.label}`,
                header: [
                  "Ticker",
                  "Share price",
                  "1-day change %",
                  "Producer",
                  "Country",
                  "Feedstock",
                  "Pellet capacity (kt/yr)",
                  "Pellet plants",
                  "Market cap (approx., USD bn)",
                  "Note",
                ],
                rows: ranked.map((p) => [
                  PELLET_TICKERS[p.name] ?? "Not listed",
                  get(PELLET_TICKERS[p.name])?.price ?? "",
                  get(PELLET_TICKERS[p.name])?.changePct?.toFixed(2) ?? "",
                  p.name,
                  p.country,
                  p.feedstock,
                  p.capacityKt,
                  p.plants,
                  marketCapValue(PELLET_TICKERS[p.name]),
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
            placeholder="Search pellet producers…"
            selects={[
              {
                label: "Country",
                value: f.a,
                options: countryFilterOptions(PRODUCERS.map((p) => p.country)),
                onChange: f.setA,
                allLabel: "All countries",
              },
              {
                label: "Feedstock",
                value: f.b,
                options: countryFilterOptions(PRODUCERS.map((p) => p.feedstock)),
                onChange: f.setB,
                allLabel: "All feedstocks",
              },
            ]}
            shown={rows.length}
            total={PRODUCERS.length}
            matched={ranked.length}
          />
        }
        footnote={`Indicative capacities from producer disclosures, FAOSTAT forest-products data, Bioenergy Europe and the Canadian and US pellet associations. Click any tile for the latest news. ${MARKET_CAP_NOTE}`}
      >
        {ghgEmpty ? (
          <GhgEmptyNotice />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pellet producers listed for this filter — open that country's profile page for its
            policy and market updates.
          </p>
        ) : view === "line" ? (
          <ChartTrend panel="pellets" />
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
            indexLabel="Global wood pellet production index"
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
            yLabel="Pellet producer"
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
            indexLabel="Global wood pellet production index"
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
