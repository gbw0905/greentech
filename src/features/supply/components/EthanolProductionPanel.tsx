import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChartMap } from "@/components/ChartMap";
import { Wheat } from "lucide-react";
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
import { ChartFilterBar, countryFilterOptions, useChartFilter } from "@/components/chart-filters";
import { entityLogoByName } from "@/features/markets/entity-logos";
import { ETHANOL_TICKERS } from "@/features/markets/entity-tickers";
import { priceMeta, priceTone, useEntityQuotes } from "@/features/markets/hooks/useEntityQuotes";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { marketCapValue, marketCapLabel, MARKET_CAP_NOTE } from "@/features/markets/market-caps";
import { COUNTRY_NAME_FLAG } from "@/features/policy/taxonomy";
import { getSupplyDatasetFn } from "@/features/supply/server-functions";
import type { SupplyDatasetPayload, SupplyEntityRow } from "@/features/supply/contracts";
import { SupplySourceFacts } from "./SupplySourceFacts";

type Producer = {
  name: string;
  country: string;
  flag: string;
  /** Annual fuel ethanol production capacity, million litres per year */
  capacityMl: number;
  /** Number of ethanol plants / mills operated */
  plants: number;
  feedstock: string;
  note: string;
};

/**
 * Global fuel ethanol producers — corn, sugarcane, wheat, cassava and
 * cellulosic plants supplying blended gasoline, ETBE and ethanol-to-jet.
 * Capacities are indicative annual output in million litres per year.
 */
const PRODUCERS: Producer[] = [
  // ---------- United States (corn belt) ----------
  {
    name: "POET",
    country: "United States",
    flag: "🇺🇸",
    capacityMl: 11350,
    plants: 34,
    feedstock: "Corn",
    note: "World's largest corn ethanol producer, biorefineries across the Midwest",
  },
  {
    name: "Valero Renewable Fuels",
    country: "United States",
    flag: "🇺🇸",
    capacityMl: 6050,
    plants: 12,
    feedstock: "Corn",
    note: "Refiner-owned ethanol fleet with carbon-capture pipeline plans",
  },
  {
    name: "Archer Daniels Midland",
    country: "United States",
    flag: "🇺🇸",
    capacityMl: 6050,
    plants: 8,
    feedstock: "Corn",
    note: "Dry and wet mill ethanol with Decatur CCS integration",
  },
  {
    name: "Green Plains",
    country: "United States",
    flag: "🇺🇸",
    capacityMl: 3785,
    plants: 10,
    feedstock: "Corn",
    note: "Low-carbon ethanol and high-protein co-products",
  },
  {
    name: "Flint Hills Resources",
    country: "United States",
    flag: "🇺🇸",
    capacityMl: 3400,
    plants: 7,
    feedstock: "Corn",
    note: "Koch-owned ethanol platform in Iowa and Nebraska",
  },
  {
    name: "Marquis Energy",
    country: "United States",
    flag: "🇺🇸",
    capacityMl: 1900,
    plants: 2,
    feedstock: "Corn",
    note: "Illinois mega-plant with carbon sequestration project",
  },
  {
    name: "Southwest Iowa Renewable Energy",
    country: "United States",
    flag: "🇺🇸",
    capacityMl: 550,
    plants: 1,
    feedstock: "Corn",
    note: "Council Bluffs plant serving western corn belt",
  },
  {
    name: "Pacific Ethanol / Alto",
    country: "United States",
    flag: "🇺🇸",
    capacityMl: 1325,
    plants: 5,
    feedstock: "Corn",
    note: "West-coast specialty alcohol and fuel ethanol",
  },
  {
    name: "LanzaJet / LanzaTech",
    country: "United States",
    flag: "🇺🇸",
    capacityMl: 400,
    plants: 3,
    feedstock: "Waste gas",
    note: "Gas-fermentation ethanol and alcohol-to-jet SAF",
  },

  // ---------- Brazil (sugarcane) ----------
  {
    name: "Raízen",
    country: "Brazil",
    flag: "🇧🇷",
    capacityMl: 3300,
    plants: 35,
    feedstock: "Sugarcane",
    note: "World's biggest sugarcane ethanol group; cellulosic E2G plants",
  },
  {
    name: "Copersucar",
    country: "Brazil",
    flag: "🇧🇷",
    capacityMl: 2600,
    plants: 30,
    feedstock: "Sugarcane",
    note: "Mill cooperative and largest ethanol trader in Brazil",
  },
  {
    name: "São Martinho",
    country: "Brazil",
    flag: "🇧🇷",
    capacityMl: 1200,
    plants: 4,
    feedstock: "Sugarcane",
    note: "High-efficiency mills with corn ethanol expansion",
  },
  {
    name: "Tereos Brazil",
    country: "Brazil",
    flag: "🇧🇷",
    capacityMl: 1100,
    plants: 7,
    feedstock: "Sugarcane",
    note: "Guarani mills producing anhydrous and hydrous ethanol",
  },
  {
    name: "BP Bunge Bioenergia",
    country: "Brazil",
    flag: "🇧🇷",
    capacityMl: 1000,
    plants: 11,
    feedstock: "Sugarcane",
    note: "Joint-venture mills supplying RenovaBio CBIO credits",
  },
  {
    name: "FS Bioenergia",
    country: "Brazil",
    flag: "🇧🇷",
    capacityMl: 1800,
    plants: 3,
    feedstock: "Corn",
    note: "Mato Grosso corn ethanol pioneer with biomass power",
  },
  {
    name: "Inpasa",
    country: "Brazil",
    flag: "🇧🇷",
    capacityMl: 2400,
    plants: 6,
    feedstock: "Corn",
    note: "Fastest-growing corn ethanol producer in the centre-west",
  },
  {
    name: "Jalles Machado",
    country: "Brazil",
    flag: "🇧🇷",
    capacityMl: 450,
    plants: 2,
    feedstock: "Sugarcane",
    note: "Organic sugar and ethanol producer in Goiás",
  },

  // ---------- Asia ----------
  {
    name: "COFCO Biochemical",
    country: "China",
    flag: "🇨🇳",
    capacityMl: 2000,
    plants: 6,
    feedstock: "Corn",
    note: "China's largest fuel ethanol producer for E10 provinces",
  },
  {
    name: "Anhui BBCA",
    country: "China",
    flag: "🇨🇳",
    capacityMl: 900,
    plants: 4,
    feedstock: "Corn",
    note: "Corn processing group with fuel ethanol and bioplastics",
  },
  {
    name: "Henan Tianguan",
    country: "China",
    flag: "🇨🇳",
    capacityMl: 600,
    plants: 3,
    feedstock: "Wheat / cassava",
    note: "Cellulosic ethanol pilot alongside grain-based output",
  },
  {
    name: "Praj-supplied Indian distilleries",
    country: "India",
    flag: "🇮🇳",
    capacityMl: 3200,
    plants: 120,
    feedstock: "Sugarcane / grain",
    note: "Distillery fleet built out for the Indian E20 mandate",
  },
  {
    name: "Balrampur Chini Mills",
    country: "India",
    flag: "🇮🇳",
    capacityMl: 1050,
    plants: 10,
    feedstock: "Sugarcane",
    note: "Major Indian sugar-ethanol producer under OMC tenders",
  },
  {
    name: "Shree Renuka Sugars",
    country: "India",
    flag: "🇮🇳",
    capacityMl: 900,
    plants: 7,
    feedstock: "Sugarcane",
    note: "Wilmar-owned mills supplying ethanol blending programme",
  },
  {
    name: "Triveni Engineering",
    country: "India",
    flag: "🇮🇳",
    capacityMl: 660,
    plants: 4,
    feedstock: "Sugarcane",
    note: "Dual-feed distilleries for grain and cane juice ethanol",
  },
  {
    name: "Bajaj Hindusthan Sugar",
    country: "India",
    flag: "🇮🇳",
    capacityMl: 800,
    plants: 6,
    feedstock: "Sugarcane",
    note: "Uttar Pradesh mills feeding E20 supply",
  },
  {
    name: "Ubon Bio Ethanol",
    country: "Thailand",
    flag: "🇹🇭",
    capacityMl: 450,
    plants: 3,
    feedstock: "Cassava",
    note: "Cassava ethanol for Thai gasohol E20/E85",
  },
  {
    name: "Mitr Phol Bio Fuel",
    country: "Thailand",
    flag: "🇹🇭",
    capacityMl: 520,
    plants: 5,
    feedstock: "Sugarcane / cassava",
    note: "Integrated sugar group supplying gasohol blends",
  },
  {
    name: "Molindo Raya",
    country: "Indonesia",
    flag: "🇮🇩",
    capacityMl: 130,
    plants: 2,
    feedstock: "Molasses",
    note: "Indonesian molasses ethanol ahead of the E5 roadmap",
  },

  // ---------- Europe ----------
  {
    name: "CropEnergies",
    country: "Germany",
    flag: "🇩🇪",
    capacityMl: 1300,
    plants: 5,
    feedstock: "Wheat / sugar beet",
    note: "Europe's largest ethanol producer, part of Südzucker",
  },
  {
    name: "Verbio",
    country: "Germany",
    flag: "🇩🇪",
    capacityMl: 700,
    plants: 4,
    feedstock: "Grain / straw",
    note: "Grain ethanol plus cellulosic straw biomethane and ethanol",
  },
  {
    name: "Tereos Europe",
    country: "France",
    flag: "🇫🇷",
    capacityMl: 1100,
    plants: 6,
    feedstock: "Sugar beet / wheat",
    note: "French beet and wheat ethanol for E10 and ETBE",
  },
  {
    name: "Cristal Union / Cristanol",
    country: "France",
    flag: "🇫🇷",
    capacityMl: 700,
    plants: 3,
    feedstock: "Sugar beet",
    note: "Beet ethanol cooperative supplying E85 and ETBE",
  },
  {
    name: "Vivergo Fuels",
    country: "United Kingdom",
    flag: "🇬🇧",
    capacityMl: 550,
    plants: 1,
    feedstock: "Wheat",
    note: "Hull plant supplying UK E10 gasoline",
  },
  {
    name: "Ensus (CropEnergies UK)",
    country: "United Kingdom",
    flag: "🇬🇧",
    capacityMl: 400,
    plants: 1,
    feedstock: "Wheat",
    note: "Teesside wheat ethanol with CO2 capture",
  },
  {
    name: "Alcogroup",
    country: "Belgium",
    flag: "🇧🇪",
    capacityMl: 600,
    plants: 4,
    feedstock: "Grain",
    note: "Ethanol producer and trader across the ARA hub",
  },
  {
    name: "Pannonia Bio",
    country: "Hungary",
    flag: "🇭🇺",
    capacityMl: 700,
    plants: 1,
    feedstock: "Corn",
    note: "Europe's largest single-site corn ethanol biorefinery",
  },
  {
    name: "Lantmännen Agroetanol",
    country: "Sweden",
    flag: "🇸🇪",
    capacityMl: 250,
    plants: 1,
    feedstock: "Grain / residues",
    note: "Norrköping plant producing low-carbon ethanol for ED95",
  },
  {
    name: "Orlen Południe",
    country: "Poland",
    flag: "🇵🇱",
    capacityMl: 320,
    plants: 3,
    feedstock: "Grain",
    note: "Polish ethanol and cellulosic UCO-adjacent biorefining",
  },

  // ---------- Other regions ----------
  {
    name: "Manildra Group",
    country: "Australia",
    flag: "🇦🇺",
    capacityMl: 300,
    plants: 2,
    feedstock: "Wheat starch",
    note: "Shoalhaven plant supplying Australian E10",
  },
  {
    name: "Wilmar Sarina",
    country: "Australia",
    flag: "🇦🇺",
    capacityMl: 60,
    plants: 1,
    feedstock: "Molasses",
    note: "Queensland molasses ethanol distillery",
  },
  {
    name: "Suncor Ethanol",
    country: "Canada",
    flag: "🇨🇦",
    capacityMl: 400,
    plants: 1,
    feedstock: "Corn",
    note: "Sarnia plant supplying Canadian Clean Fuel Regulations blending",
  },
  {
    name: "GreenField Global",
    country: "Canada",
    flag: "🇨🇦",
    capacityMl: 700,
    plants: 5,
    feedstock: "Corn",
    note: "Canada's largest ethanol producer across Ontario and Quebec",
  },
  {
    name: "Ethanol Argentina (ACABIO/Bio4)",
    country: "Argentina",
    flag: "🇦🇷",
    capacityMl: 600,
    plants: 5,
    feedstock: "Corn",
    note: "Córdoba corn ethanol cooperatives supplying E12",
  },
  {
    name: "Ledesma",
    country: "Argentina",
    flag: "🇦🇷",
    capacityMl: 180,
    plants: 1,
    feedstock: "Sugarcane",
    note: "Northern Argentine cane ethanol producer",
  },
  {
    name: "Kenya / Agro-Chemical & Food Co.",
    country: "Kenya",
    flag: "🇰🇪",
    capacityMl: 60,
    plants: 1,
    feedstock: "Molasses",
    note: "East African molasses ethanol for blended gasoline",
  },
  // ---------- Added global coverage ----------
  {
    name: "Jilin Fuel Ethanol",
    country: "China",
    flag: "🇨🇳",
    capacityMl: 1300,
    plants: 2,
    feedstock: "Corn",
    note: "One of China's original designated fuel-ethanol plants",
  },
  {
    name: "Anhui BBCA Group",
    country: "China",
    flag: "🇨🇳",
    capacityMl: 900,
    plants: 4,
    feedstock: "Corn",
    note: "Biochemical group with fuel-ethanol and bio-based chemicals",
  },
  {
    name: "Thai Roong Ruang Energy",
    country: "Thailand",
    flag: "🇹🇭",
    capacityMl: 520,
    plants: 4,
    feedstock: "Molasses / cassava",
    note: "Gasohol supply for Thailand's E20 programme",
  },
  {
    name: "Mitr Phol Bio-Fuel",
    country: "Thailand",
    flag: "🇹🇭",
    capacityMl: 480,
    plants: 5,
    feedstock: "Sugarcane / cassava",
    note: "Asia's largest sugar group with integrated ethanol mills",
  },
  {
    name: "Roquette / Tereos Asia",
    country: "Vietnam",
    flag: "🇻🇳",
    capacityMl: 210,
    plants: 3,
    feedstock: "Cassava",
    note: "Cassava ethanol supplying Vietnam's E5 RON92 mandate",
  },
  {
    name: "Wilmar BioEthanol",
    country: "Australia",
    flag: "🇦🇺",
    capacityMl: 60,
    plants: 1,
    feedstock: "Molasses",
    note: "Sarina distillery in Queensland",
  },
  {
    name: "Cristalco / Tereos",
    country: "France",
    flag: "🇫🇷",
    capacityMl: 1100,
    plants: 5,
    feedstock: "Sugar beet / wheat",
    note: "Leading EU beet-and-grain ethanol producer",
  },
  {
    name: "Ensus / CropEnergies UK",
    country: "United Kingdom",
    flag: "🇬🇧",
    capacityMl: 400,
    plants: 1,
    feedstock: "Wheat",
    note: "Teesside plant supplying the UK E10 mandate",
  },
  {
    name: "Orlen Poludnie",
    country: "Poland",
    flag: "🇵🇱",
    capacityMl: 280,
    plants: 2,
    feedstock: "Grain",
    note: "Polish bioethanol supplying national blending obligation",
  },
  {
    name: "Clariant / Enviral",
    country: "Slovakia",
    flag: "🇸🇰",
    capacityMl: 250,
    plants: 2,
    feedstock: "Corn / straw",
    note: "Conventional and cellulosic ethanol at Leopoldov",
  },
  {
    name: "Alco Bio Fuel",
    country: "Belgium",
    flag: "🇧🇪",
    capacityMl: 200,
    plants: 1,
    feedstock: "Grain",
    note: "Ghent port ethanol with CO2 capture for industrial use",
  },
  {
    name: "Sekab",
    country: "Sweden",
    flag: "🇸🇪",
    capacityMl: 120,
    plants: 1,
    feedstock: "Wood / cellulosic",
    note: "Cellulosic ethanol demonstration and E85 supply",
  },
  {
    name: "Grupo Petropar / Alcoholes del Sur",
    country: "Paraguay",
    flag: "🇵🇾",
    capacityMl: 260,
    plants: 3,
    feedstock: "Sugarcane",
    note: "Paraguayan cane ethanol for a 25% blending mandate",
  },
  {
    name: "ACA Bio",
    country: "Argentina",
    flag: "🇦🇷",
    capacityMl: 250,
    plants: 1,
    feedstock: "Corn",
    note: "Cooperative corn ethanol plant in Villa María",
  },
  {
    name: "Bioceres / Promaiz",
    country: "Argentina",
    flag: "🇦🇷",
    capacityMl: 160,
    plants: 1,
    feedstock: "Corn",
    note: "Alejandro Roca corn ethanol and DDGS",
  },
  {
    name: "Ingenio Providencia",
    country: "Colombia",
    flag: "🇨🇴",
    capacityMl: 150,
    plants: 1,
    feedstock: "Sugarcane",
    note: "Cauca Valley cane ethanol for Colombia's E10 blend",
  },
  {
    name: "Sucroal / Manuelita",
    country: "Colombia",
    flag: "🇨🇴",
    capacityMl: 140,
    plants: 2,
    feedstock: "Sugarcane",
    note: "Integrated sugar-ethanol mills supplying domestic blending",
  },
  {
    name: "Alcoholera del Peru",
    country: "Peru",
    flag: "🇵🇪",
    capacityMl: 130,
    plants: 1,
    feedstock: "Sugarcane",
    note: "Coastal cane ethanol for domestic gasohol and export",
  },
  {
    name: "Illovo Sugar Africa",
    country: "Malawi",
    flag: "🇲🇼",
    capacityMl: 90,
    plants: 3,
    feedstock: "Molasses",
    note: "Southern African molasses ethanol across four countries",
  },
  {
    name: "Ethco / Ethanol Company",
    country: "Zimbabwe",
    flag: "🇿🇼",
    capacityMl: 120,
    plants: 1,
    feedstock: "Sugarcane",
    note: "Chisumbanje plant supplying the E20 blending mandate",
  },
  {
    name: "Sunbird Bioenergy",
    country: "Sierra Leone",
    flag: "🇸🇱",
    capacityMl: 70,
    plants: 1,
    feedstock: "Cassava / cane",
    note: "Addax-successor project producing ethanol and power",
  },
  {
    name: "Kenana Sugar Company",
    country: "Sudan",
    flag: "🇸🇩",
    capacityMl: 200,
    plants: 1,
    feedstock: "Molasses",
    note: "One of Africa's largest integrated sugar-ethanol complexes",
  },
  {
    name: "NBL / Nigeria ethanol projects",
    country: "Nigeria",
    flag: "🇳🇬",
    capacityMl: 80,
    plants: 2,
    feedstock: "Cassava / cane",
    note: "NNPC-backed ethanol projects supporting an E10 target",
  },
  {
    name: "Croda / Egypt distilleries",
    country: "Egypt",
    flag: "🇪🇬",
    capacityMl: 110,
    plants: 2,
    feedstock: "Molasses",
    note: "Molasses ethanol largely exported to the EU",
  },
];

type Metric = "capacity" | "plants" | "price" | "marketcap" | "ghg";

const METRICS: Record<
  Metric,
  { label: string; unit: string; help: string; decimals: number; value: (p: Producer) => number }
> = {
  capacity: {
    label: "Ethanol output (Ml/yr)",
    unit: "million litres of fuel ethanol / year",
    help: "Indicative annual fuel ethanol production capacity in million litres. Bigger tiles mean more ethanol reaching blended gasoline, ETBE and alcohol-to-jet routes.",
    decimals: 0,
    value: (p) => p.capacityMl,
  },
  plants: {
    label: "Plants / distilleries",
    unit: "ethanol plants or distilleries operated",
    help: "Number of ethanol plants, mills or distilleries the producer operates. A single mega-plant can outrank a wide fleet on volume but not here.",
    decimals: 0,
    value: (p) => p.plants,
  },
  price: {
    label: "Share price (listing currency)",
    unit: "share price, primary listing currency",
    help: "Latest traded share price on the producer's primary listing, in that exchange's currency. Cooperatives and private producers have no listing and sit at the end.",
    decimals: 2,
    value: () => 0,
  },
  marketcap: {
    label: "Market cap (approx.)",
    unit: "approximate market capitalisation, USD billions",
    help: "Approximate latest market capitalisation in USD billions, converted at recent exchange rates. Private, state-owned or unlisted entities rank last.",
    decimals: 1,
    value: (p) => marketCapValue(ETHANOL_TICKERS[p.name]),
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
        help: "X-axis shows plant count; Y-axis shows annual ethanol output.",
      },
      size: { label: "Ethanol output", unit: "Ml/yr", value: (p: Producer) => p.capacityMl },
    };
  }
  if (metricKey === "marketcap") {
    return {
      x: {
        metric: METRICS.capacity,
        help: "X-axis shows annual ethanol output; Y-axis shows approximate market cap.",
      },
      size: { label: "Ethanol output", unit: "Ml/yr", value: (p: Producer) => p.capacityMl },
    };
  }
  return {
    x: {
      metric: METRICS.capacity,
      help: "X-axis shows annual ethanol output; Y-axis shows the selected measure.",
    },
    size: { label: "Plants", unit: "plants", value: (p: Producer) => p.plants },
  };
}

const TITLE = "Global ethanol production";
const NEWS_SUFFIX = "ethanol production biofuel";
const DYNAMIC_DATASET_ID = "ethanol";

function observationValue(row: SupplyEntityRow, metricKey: string): number | null {
  const value = row.observations.find((o) => o.metricKey === metricKey)?.value;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function dynamicProducer(row: SupplyEntityRow): Producer | null {
  const capacityMl = observationValue(row, "capacityMl");
  const plants = observationValue(row, "plants");
  if (capacityMl === null || plants === null) return null;

  const country = row.country ?? String(row.metadata["country"] ?? "Unknown");
  const states = Array.isArray(row.metadata["states"])
    ? row.metadata["states"].map(String).filter(Boolean)
    : [];
  const feedstock =
    typeof row.metadata["feedstock"] === "string" ? row.metadata["feedstock"] : "Unknown";
  const stateLabel =
    states.length > 1 ? `${states.length} states` : states.length === 1 ? states[0] : country;

  return {
    name: row.name,
    country,
    flag: COUNTRY_NAME_FLAG[country] ?? "🌐",
    capacityMl,
    plants,
    feedstock,
    note: `Source-backed EIA capacity across ${stateLabel}`,
  };
}

function mergeDynamicProducers(payload: SupplyDatasetPayload | undefined): {
  producers: Producer[];
  dynamicCount: number;
  sourceBacked: boolean;
  reportingYears: number[];
  latestObservedAt: string | null;
  latestIngestFinishedAt: string | null;
  stale: boolean | null;
  sourceLabel: string | null;
} {
  const dynamic = (payload?.rows ?? []).map(dynamicProducer).filter((p): p is Producer => Boolean(p));
  if (dynamic.length === 0) {
    return {
      producers: PRODUCERS,
      dynamicCount: 0,
      sourceBacked: false,
      reportingYears: [],
      latestObservedAt: null,
      latestIngestFinishedAt: null,
      stale: null,
      sourceLabel: null,
    };
  }

  const byName = new Map(PRODUCERS.map((producer) => [producer.name, producer]));
  for (const producer of dynamic) byName.set(producer.name, producer);
  const observations = (payload?.rows ?? []).flatMap((row) => row.observations);
  const reportingYears = [
    ...new Set(
      observations
        .map((observation) => observation.reportingYear)
        .filter((year): year is number => typeof year === "number"),
    ),
  ].sort((a, b) => b - a);
  const latestObservedAt =
    observations
      .map((observation) => observation.observedAt)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;
  const parsedSource = payload?.sources.find((source) => source.parserId === "ethanol-eia-capacity");

  return {
    producers: [...byName.values()],
    dynamicCount: dynamic.length,
    sourceBacked: true,
    reportingYears,
    latestObservedAt,
    latestIngestFinishedAt: payload?.latestIngest?.finishedAt ?? latestObservedAt,
    stale: payload?.freshness?.stale ?? null,
    sourceLabel: parsedSource ? parsedSource.org : "source-backed",
  };
}

function formatFreshnessDate(value: string | null): string {
  if (!value) return "not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function reportingYearLabel(years: number[]): string {
  if (years.length === 0) return "reporting year not recorded";
  return years.length === 1 ? `reporting year ${years[0]}` : `reporting years ${years.join(", ")}`;
}

function freshnessLabel(stale: boolean | null): string {
  if (stale === null) return "freshness pending";
  return stale ? "refresh due" : "fresh";
}

export function EthanolProductionPanel() {
  const [metricKey, setMetricKey] = useState<Metric>("capacity");
  const [view, setView] = useState<PanelView>("heat");
  const detail = useEntityDetail();
  const { get } = useEntityQuotes();
  const { data: dynamicPayload } = useQuery({
    queryKey: ["supply-dataset", DYNAMIC_DATASET_ID],
    queryFn: () => getSupplyDatasetFn({ data: { datasetId: DYNAMIC_DATASET_ID } }),
    staleTime: 15 * 60 * 1000,
  });
  const dynamic = useMemo(() => mergeDynamicProducers(dynamicPayload), [dynamicPayload]);
  const producers = dynamic.producers;
  const metric = METRICS[metricKey];
  const valueOf = (p: Producer) =>
    metricKey === "price" ? (get(ETHANOL_TICKERS[p.name])?.price ?? 0) : metric.value(p);

  const f = useChartFilter(producers, {
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
    meta: priceMeta(get(ETHANOL_TICKERS[p.name])),
    changePct: get(ETHANOL_TICKERS[p.name])?.changePct,
    newsTarget: { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` },
  }));

  const items = rows.map((p) => ({
    key: p.name,
    label: p.name,
    sub: `${p.feedstock} · ${p.note}`,
    value: valueOf(p),
    logo: entityLogoByName(p.name),
    meta: priceMeta(get(ETHANOL_TICKERS[p.name])),
    tone: priceTone(get(ETHANOL_TICKERS[p.name])),
    changePct: get(ETHANOL_TICKERS[p.name])?.changePct,
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
    const q = get(ETHANOL_TICKERS[p.name]);
    return {
      name: p.name,
      sub: `${p.flag} ${p.country}`,
      logo: entityLogoByName(p.name),
      note: p.note,
      stats: [
        { label: "Ethanol output", value: `${fmt(p.capacityMl, 0)} Ml/yr` },
        { label: "Plants", value: fmt(p.plants, 0) },
        { label: "Feedstock", value: p.feedstock },
        { label: "Ticker", value: ETHANOL_TICKERS[p.name] ?? "Not listed" },
        { label: "Share price", value: q ? fmt(q.price, 2) : "—" },
        {
          label: "1-day change",
          value: q ? `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%` : "—",
          tone: detailTone(q?.changePct),
        },
        {
          label: "Market cap (approx.)",
          value: marketCapLabel(ETHANOL_TICKERS[p.name]) ?? "Private / state-owned",
        },
      ],
      news: { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` },
    };
  }, graph);

  return (
    <>
      {detail.sheet}
      <ChartPanel
        icon={Wheat}
        title={TITLE}
        blurb="Corn, sugarcane, wheat, cassava and cellulosic ethanol producers supplying blended gasoline, ETBE and alcohol-to-jet SAF."
        status={
          dynamic.sourceBacked
            ? `${dynamic.dynamicCount} source-backed entities`
            : "Curated fallback data"
        }
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
                filename: "global-ethanol-production",
                note: `Measure shown: ${metric.label}`,
                header: [
                  "Producer",
                  "Country",
                  "Feedstock",
                  "Ethanol output (Ml/yr)",
                  "Plants",
                  "Ticker",
                  "Share price",
                  "1-day change %",
                  "Market cap (approx., USD bn)",
                  "Note",
                ],
                rows: ranked.map((p) => {
                  const q = get(ETHANOL_TICKERS[p.name]);
                  return [
                    p.name,
                    p.country,
                    p.feedstock,
                    p.capacityMl,
                    p.plants,
                    ETHANOL_TICKERS[p.name] ?? "",
                    q ? q.price.toFixed(2) : "",
                    q ? q.changePct.toFixed(2) : "",
                    marketCapLabel(ETHANOL_TICKERS[p.name]) ?? "",
                    p.note,
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
            placeholder="Search ethanol producers…"
            selects={[
              {
                label: "Country",
                value: f.a,
                options: countryFilterOptions(producers.map((p) => p.country)),
                onChange: f.setA,
                allLabel: "All countries",
              },
              {
                label: "Feedstock",
                value: f.b,
                options: countryFilterOptions(producers.map((p) => p.feedstock)),
                onChange: f.setB,
                allLabel: "All feedstocks",
              },
            ]}
            shown={rows.length}
            total={producers.length}
            matched={ranked.length}
          />
        }
        footnote={`${dynamic.sourceBacked ? "U.S. producer rows use parsed EIA plant-capacity observations where available; remaining global rows stay on curated fallback data until their approved-source parsers are added." : "Indicative ethanol capacities from producer reports, RFA/ePURE/UNICA statistics and national blending-programme filings."} Click any tile for the latest news. ${MARKET_CAP_NOTE}`}
        sourceMeta={
          dynamic.sourceBacked ? (
            <p className="label-mono mt-2 text-xs text-muted-foreground">
              {dynamic.sourceLabel} rows: {reportingYearLabel(dynamic.reportingYears)} · ingested{" "}
              {formatFreshnessDate(dynamic.latestIngestFinishedAt)} · {freshnessLabel(dynamic.stale)} ·
              fallback rows reviewed {dynamicPayload?.registry?.lastReviewed ?? "not recorded"} ·{" "}
              <Link
                to="/data-sources"
                hash={DYNAMIC_DATASET_ID}
                className="text-primary underline underline-offset-4"
              >
                Sources &amp; method
              </Link>
            </p>
          ) : undefined
        }
      >
        {ghgEmpty ? (
          <GhgEmptyNotice />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No ethanol producers listed for this filter — open that country's profile page for its
            policy and market updates.
          </p>
        ) : view === "line" ? (
          <ChartTrend panel="ethanol" />
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
            indexLabel="Global ethanol production index"
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
            yLabel="Ethanol producer"
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
            indexLabel="Global ethanol production index"
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
