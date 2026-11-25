import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChartMap } from "@/components/ChartMap";
import { Ship } from "lucide-react";
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
import { MARINE_TICKERS } from "@/features/markets/entity-tickers";
import { listingMeta } from "@/features/markets/lib/listing";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { marketCapValue, marketCapLabel, MARKET_CAP_NOTE } from "@/features/markets/market-caps";
import { COUNTRY_NAME_FLAG } from "@/features/policy/taxonomy";
import { getSupplyDatasetFn } from "@/features/supply/server-functions";
import type { SupplyDatasetPayload, SupplyEntityRow } from "@/features/supply/contracts";
import { SupplySourceFacts } from "./SupplySourceFacts";

type MarineRole = "Supplier" | "User" | "Port market";

type MarineEntity = {
  name: string;
  country: string;
  flag: string;
  role: MarineRole;
  /** Approximate marine biofuel supplied or consumed, thousand tonnes per year */
  volumeKt: number;
  /** Bunkering ports supplied, or vessels running biofuel blends */
  reach: number;
  /** Typical blend level offered or bunkered, % FAME/HVO in VLSFO */
  blendPct: number;
  blendReported?: boolean;
  sourceBacked?: boolean;
  note: string;
};

/**
 * Global marine biofuel market: bunker suppliers blending FAME/HVO into VLSFO
 * and MGO, and the shipping operators bunkering those blends at scale.
 * Volumes are indicative annual estimates in kilotonnes of biofuel component.
 */
const ENTITIES: MarineEntity[] = [
  // ---------- Suppliers ----------
  {
    name: "GoodFuels",
    country: "Netherlands",
    flag: "🇳🇱",
    role: "Supplier",
    volumeKt: 190,
    reach: 22,
    blendPct: 30,
    note: "Pioneer marine biofuel supplier (FincoEnergies), ISCC-certified waste-based blends",
  },
  {
    name: "TotalEnergies Marine Fuels",
    country: "France",
    flag: "🇫🇷",
    role: "Supplier",
    volumeKt: 175,
    reach: 18,
    blendPct: 30,
    note: "B24/B30 blends in Singapore, Rotterdam and Gibraltar",
  },
  {
    name: "Shell Marine",
    country: "United Kingdom",
    flag: "🇬🇧",
    role: "Supplier",
    volumeKt: 215,
    reach: 25,
    blendPct: 30,
    note: "Global bio-VLSFO supply across Rotterdam, Singapore and US Gulf",
  },
  {
    name: "BP Marine",
    country: "United Kingdom",
    flag: "🇬🇧",
    role: "Supplier",
    volumeKt: 135,
    reach: 16,
    blendPct: 24,
    note: "Bio-bunker blends at ARA and Asian hubs",
  },
  {
    name: "Chevron Marine Products",
    country: "United States",
    flag: "🇺🇸",
    role: "Supplier",
    volumeKt: 85,
    reach: 11,
    blendPct: 25,
    note: "B24 and B30 bunker deliveries in Europe and Singapore",
  },
  {
    name: "Exxon Mobil Marine",
    country: "United States",
    flag: "🇺🇸",
    role: "Supplier",
    volumeKt: 95,
    reach: 12,
    blendPct: 25,
    note: "Bio-blended residual and distillate bunkers",
  },
  {
    name: "Vitol Bunkers",
    country: "Switzerland",
    flag: "🇨🇭",
    role: "Supplier",
    volumeKt: 160,
    reach: 20,
    blendPct: 30,
    note: "Physical bio-bunker supply across ARA, Med and Asia",
  },
  {
    name: "Trafigura / TFG Marine",
    country: "Singapore",
    flag: "🇸🇬",
    role: "Supplier",
    volumeKt: 185,
    reach: 24,
    blendPct: 30,
    note: "Fast-growing physical supplier of B24/B30 blends",
  },
  {
    name: "Bunker One",
    country: "Denmark",
    flag: "🇩🇰",
    role: "Supplier",
    volumeKt: 105,
    reach: 15,
    blendPct: 30,
    note: "Bio-bunkering in Northern Europe and the Americas",
  },
  {
    name: "Peninsula Petroleum",
    country: "Gibraltar",
    flag: "🇬🇮",
    role: "Supplier",
    volumeKt: 80,
    reach: 10,
    blendPct: 24,
    note: "Med and Iberia bio-blend bunker deliveries",
  },
  {
    name: "Minerva Bunkering",
    country: "Switzerland",
    flag: "🇨🇭",
    role: "Supplier",
    volumeKt: 70,
    reach: 12,
    blendPct: 24,
    note: "Physical supplier of biofuel bunkers in Europe and West Africa",
  },
  {
    name: "Monjasa",
    country: "Denmark",
    flag: "🇩🇰",
    role: "Supplier",
    volumeKt: 55,
    reach: 9,
    blendPct: 24,
    note: "Bio-blends across Northwest Europe, Panama and UAE",
  },
  {
    name: "Sinopec Fuel Oil",
    country: "China",
    flag: "🇨🇳",
    role: "Supplier",
    volumeKt: 155,
    reach: 8,
    blendPct: 24,
    note: "B24 supply at Zhoushan and Shanghai bonded bunkering",
  },
  {
    name: "Global Energy Trading (SG)",
    country: "Singapore",
    flag: "🇸🇬",
    role: "Supplier",
    volumeKt: 115,
    reach: 6,
    blendPct: 24,
    note: "Singapore MPA-licensed B24 bio-bunker supplier",
  },
  {
    name: "Hong Lam Marine",
    country: "Singapore",
    flag: "🇸🇬",
    role: "Supplier",
    volumeKt: 45,
    reach: 4,
    blendPct: 24,
    note: "Bunker tanker operator delivering biofuel blends",
  },
  {
    name: "Neste Marine",
    country: "Finland",
    flag: "🇫🇮",
    role: "Supplier",
    volumeKt: 125,
    reach: 14,
    blendPct: 100,
    note: "Neste Marine 0.1 Co-processed and 100% renewable marine fuels",
  },
  {
    name: "Preem Marine",
    country: "Sweden",
    flag: "🇸🇪",
    role: "Supplier",
    volumeKt: 40,
    reach: 5,
    blendPct: 30,
    note: "Nordic bio-marine gasoil for coastal and ferry fleets",
  },
  {
    name: "Eni Sustainable Mobility (marine)",
    country: "Italy",
    flag: "🇮🇹",
    role: "Supplier",
    volumeKt: 65,
    reach: 7,
    blendPct: 30,
    note: "HVO-based marine diesel for Med shipping",
  },
  {
    name: "Repsol Marine",
    country: "Spain",
    flag: "🇪🇸",
    role: "Supplier",
    volumeKt: 50,
    reach: 8,
    blendPct: 25,
    note: "Advanced-biofuel bunkers at Spanish ports",
  },
  {
    name: "Cepsa / Moeve Marine",
    country: "Spain",
    flag: "🇪🇸",
    role: "Supplier",
    volumeKt: 45,
    reach: 7,
    blendPct: 25,
    note: "Second-generation biofuel bunkering in Algeciras",
  },
  {
    name: "Itochu Enex Marine",
    country: "Japan",
    flag: "🇯🇵",
    role: "Supplier",
    volumeKt: 40,
    reach: 5,
    blendPct: 24,
    note: "Japanese biofuel bunker trials and commercial supply",
  },
  {
    name: "GS Caltex Marine",
    country: "South Korea",
    flag: "🇰🇷",
    role: "Supplier",
    volumeKt: 35,
    reach: 4,
    blendPct: 24,
    note: "Korean B24 bunkering at Busan and Ulsan",
  },
  {
    name: "Viva Energy Marine",
    country: "Australia",
    flag: "🇦🇺",
    role: "Supplier",
    volumeKt: 25,
    reach: 4,
    blendPct: 20,
    note: "Australian coastal biofuel bunker supply",
  },
  {
    name: "Vibra Energia Marine",
    country: "Brazil",
    flag: "🇧🇷",
    role: "Supplier",
    volumeKt: 30,
    reach: 5,
    blendPct: 24,
    note: "Brazilian B24 marine blends at Santos and Rio",
  },
  {
    name: "ADNOC Marine Fuels",
    country: "United Arab Emirates",
    flag: "🇦🇪",
    role: "Supplier",
    volumeKt: 40,
    reach: 4,
    blendPct: 24,
    note: "Bio-bunker deliveries at Fujairah",
  },

  // ---------- Users ----------
  {
    name: "Maersk",
    country: "Denmark",
    flag: "🇩🇰",
    role: "User",
    volumeKt: 280,
    reach: 130,
    blendPct: 30,
    note: "ECO Delivery green fuel programme across container fleet",
  },
  {
    name: "CMA CGM",
    country: "France",
    flag: "🇫🇷",
    role: "User",
    volumeKt: 215,
    reach: 95,
    blendPct: 30,
    note: "ACT+ biofuel offering and large B30 bunkerings",
  },
  {
    name: "MSC",
    country: "Switzerland",
    flag: "🇨🇭",
    role: "User",
    volumeKt: 235,
    reach: 110,
    blendPct: 30,
    note: "World's largest container fleet running routine bio-blend bunkers",
  },
  {
    name: "Hapag-Lloyd",
    country: "Germany",
    flag: "🇩🇪",
    role: "User",
    volumeKt: 135,
    reach: 70,
    blendPct: 30,
    note: "Ship Green product with waste-based biofuel",
  },
  {
    name: "ONE (Ocean Network Express)",
    country: "Singapore",
    flag: "🇸🇬",
    role: "User",
    volumeKt: 95,
    reach: 55,
    blendPct: 24,
    note: "B24 bunkerings in Singapore and Rotterdam",
  },
  {
    name: "Evergreen",
    country: "Taiwan",
    flag: "🇹🇼",
    role: "User",
    volumeKt: 70,
    reach: 40,
    blendPct: 24,
    note: "Biofuel trials scaled into regular Asia-Europe services",
  },
  {
    name: "HMM",
    country: "South Korea",
    flag: "🇰🇷",
    role: "User",
    volumeKt: 55,
    reach: 32,
    blendPct: 24,
    note: "Korean carrier bunkering B24 on long-haul loops",
  },
  {
    name: "Cosco Shipping",
    country: "China",
    flag: "🇨🇳",
    role: "User",
    volumeKt: 110,
    reach: 60,
    blendPct: 24,
    note: "Zhoushan B24 bunkerings across container and bulk fleets",
  },
  {
    name: "Wallenius Wilhelmsen",
    country: "Norway",
    flag: "🇳🇴",
    role: "User",
    volumeKt: 80,
    reach: 45,
    blendPct: 30,
    note: "Car-carrier fleet with biofuel-powered customer programme",
  },
  {
    name: "NYK Line",
    country: "Japan",
    flag: "🇯🇵",
    role: "User",
    volumeKt: 60,
    reach: 38,
    blendPct: 24,
    note: "Japanese operator using biofuel on bulk and car carriers",
  },
  {
    name: "Mitsui O.S.K. Lines",
    country: "Japan",
    flag: "🇯🇵",
    role: "User",
    volumeKt: 55,
    reach: 36,
    blendPct: 24,
    note: "Biofuel bunkering across LNG, bulk and car carriers",
  },
  {
    name: "ZIM",
    country: "Israel",
    flag: "🇮🇱",
    role: "User",
    volumeKt: 30,
    reach: 20,
    blendPct: 24,
    note: "Bio-blend bunkers on selected transatlantic services",
  },
  {
    name: "Stena Line",
    country: "Sweden",
    flag: "🇸🇪",
    role: "User",
    volumeKt: 45,
    reach: 25,
    blendPct: 30,
    note: "Ferry operator running biofuel blends on Nordic routes",
  },
  {
    name: "DFDS",
    country: "Denmark",
    flag: "🇩🇰",
    role: "User",
    volumeKt: 40,
    reach: 22,
    blendPct: 30,
    note: "Ro-ro and ferry fleet with green-fuel customer product",
  },
  {
    name: "Grimaldi Group",
    country: "Italy",
    flag: "🇮🇹",
    role: "User",
    volumeKt: 35,
    reach: 24,
    blendPct: 24,
    note: "Med ro-ro operator bunkering advanced marine biofuels",
  },
  {
    name: "Norwegian Cruise Line",
    country: "United States",
    flag: "🇺🇸",
    role: "User",
    volumeKt: 20,
    reach: 12,
    blendPct: 24,
    note: "Cruise biofuel trials in Northern Europe",
  },
  {
    name: "Carnival Corporation",
    country: "United States",
    flag: "🇺🇸",
    role: "User",
    volumeKt: 25,
    reach: 15,
    blendPct: 24,
    note: "Bio-blend bunkering across AIDA and Holland America brands",
  },
  {
    name: "Royal Caribbean",
    country: "United States",
    flag: "🇺🇸",
    role: "User",
    volumeKt: 25,
    reach: 14,
    blendPct: 24,
    note: "Biofuel bunkering at Rotterdam and Barcelona",
  },
  {
    name: "Bahri",
    country: "Saudi Arabia",
    flag: "🇸🇦",
    role: "User",
    volumeKt: 20,
    reach: 10,
    blendPct: 20,
    note: "Tanker operator trialling bio-blends on Europe voyages",
  },
  {
    name: "Fortescue Shipping",
    country: "Australia",
    flag: "🇦🇺",
    role: "User",
    volumeKt: 15,
    reach: 8,
    blendPct: 30,
    note: "Ore carriers on biofuel and green-fuel pilots",
  },
  {
    name: "BHP Chartered Fleet",
    country: "Australia",
    flag: "🇦🇺",
    role: "User",
    volumeKt: 30,
    reach: 18,
    blendPct: 24,
    note: "Bulk charterer procuring biofuel-powered voyages",
  },
  {
    name: "Rio Tinto Marine",
    country: "Australia",
    flag: "🇦🇺",
    role: "User",
    volumeKt: 25,
    reach: 16,
    blendPct: 24,
    note: "Iron-ore shipping with biofuel bunkering programme",
  },
  {
    name: "Cargill Ocean Transportation",
    country: "United States",
    flag: "🇺🇸",
    role: "User",
    volumeKt: 50,
    reach: 30,
    blendPct: 30,
    note: "Dry-bulk charterer with large biofuel voyage programme",
  },
  {
    name: "Louis Dreyfus Company",
    country: "Netherlands",
    flag: "🇳🇱",
    role: "User",
    volumeKt: 20,
    reach: 14,
    blendPct: 24,
    note: "Agri-commodity shipper using bio-bunkers on export routes",
  },
  {
    name: "Amazon (ocean freight)",
    country: "United States",
    flag: "🇺🇸",
    role: "User",
    volumeKt: 35,
    reach: 20,
    blendPct: 30,
    note: "Shipper buying biofuel-powered container slots",
  },
  {
    name: "IKEA / Inter IKEA",
    country: "Sweden",
    flag: "🇸🇪",
    role: "User",
    volumeKt: 30,
    reach: 18,
    blendPct: 30,
    note: "Cargo owner committed to biofuel or zero-emission ocean freight",
  },
  // ---------- Added global coverage ----------
  {
    name: "Sinopec Zhoushan Bunker",
    country: "China",
    flag: "🇨🇳",
    role: "Supplier",
    volumeKt: 200,
    reach: 8,
    blendPct: 24,
    note: "China's largest B24 bio-bunker hub using domestic UCO",
  },
  {
    name: "PetroChina Fuel Marine",
    country: "China",
    flag: "🇨🇳",
    role: "Supplier",
    volumeKt: 110,
    reach: 7,
    blendPct: 24,
    note: "Bonded biofuel bunkering at Chinese coastal ports",
  },
  {
    name: "Global Energy Trading (GET)",
    country: "Singapore",
    flag: "🇸🇬",
    role: "Supplier",
    volumeKt: 85,
    reach: 6,
    blendPct: 24,
    note: "Singapore-licensed supplier of B24 and B30 blends",
  },
  {
    name: "Equatorial Marine Fuel",
    country: "Singapore",
    flag: "🇸🇬",
    role: "Supplier",
    volumeKt: 75,
    reach: 5,
    blendPct: 24,
    note: "Singapore bunker tanker operator delivering bio-blends",
  },
  {
    name: "ENEOS marine biofuel",
    country: "Japan",
    flag: "🇯🇵",
    role: "Supplier",
    volumeKt: 60,
    reach: 8,
    blendPct: 24,
    note: "B24 supply at Tokyo Bay and Kansai ports",
  },
  {
    name: "GS Caltex marine",
    country: "South Korea",
    flag: "🇰🇷",
    role: "Supplier",
    volumeKt: 45,
    reach: 5,
    blendPct: 24,
    note: "Korean bio-bunkering pilots at Busan and Ulsan",
  },
  {
    name: "Vivo Energy Marine",
    country: "South Africa",
    flag: "🇿🇦",
    role: "Supplier",
    volumeKt: 25,
    reach: 4,
    blendPct: 20,
    note: "Bio-blend bunkering trials at Durban and Cape Town",
  },
  {
    name: "Vitol Bahri / Gulf suppliers",
    country: "United Arab Emirates",
    flag: "🇦🇪",
    role: "Supplier",
    volumeKt: 55,
    reach: 6,
    blendPct: 20,
    note: "Fujairah biofuel bunkering for Indian Ocean routes",
  },
  {
    name: "Raízen marine fuels",
    country: "Brazil",
    flag: "🇧🇷",
    role: "Supplier",
    volumeKt: 40,
    reach: 5,
    blendPct: 24,
    note: "Santos-area bio-bunker supply from sugarcane-based streams",
  },
  {
    name: "Wilhelmsen / Topaz bunkering",
    country: "Norway",
    flag: "🇳🇴",
    role: "Supplier",
    volumeKt: 35,
    reach: 7,
    blendPct: 100,
    note: "HVO100 supply to Norwegian coastal and offshore vessels",
  },
  {
    name: "Hapag-Lloyd Ship Green",
    country: "Germany",
    flag: "🇩🇪",
    role: "User",
    volumeKt: 180,
    reach: 260,
    blendPct: 100,
    note: "Customer-funded waste-based biofuel product on container services",
  },
  {
    name: "Ocean Network Express",
    country: "Japan",
    flag: "🇯🇵",
    role: "User",
    volumeKt: 140,
    reach: 210,
    blendPct: 24,
    note: "B24 uplift at Singapore for Asia-Europe loops",
  },
  {
    name: "Evergreen Marine",
    country: "Taiwan",
    flag: "🇹🇼",
    role: "User",
    volumeKt: 110,
    reach: 200,
    blendPct: 24,
    note: "Bio-bunkering to meet FuelEU Maritime intensity limits",
  },
  {
    name: "Cosco Shipping Lines",
    country: "China",
    flag: "🇨🇳",
    role: "User",
    volumeKt: 70,
    reach: 190,
    blendPct: 24,
    note: "B24 uplift from Chinese UCO-based supply",
  },
  {
    name: "Fortescue shipping",
    country: "Australia",
    flag: "🇦🇺",
    role: "User",
    volumeKt: 40,
    reach: 12,
    blendPct: 100,
    note: "Iron-ore carriers trialling 100% biofuel voyages",
  },
  {
    name: "Unilever ocean freight",
    country: "United Kingdom",
    flag: "🇬🇧",
    role: "User",
    volumeKt: 25,
    reach: 20,
    blendPct: 100,
    note: "Book-and-claim biofuel for consumer-goods shipping",
  },
  {
    name: "Bureau Veritas-verified charterers (ZEMBA)",
    country: "Belgium",
    flag: "🇧🇪",
    role: "User",
    volumeKt: 30,
    reach: 30,
    blendPct: 100,
    note: "Buyers' alliance tendering for e-fuel and biofuel voyages",
  },
];

type Metric = "volume" | "reach" | "blend" | "marketcap" | "ghg";

const METRICS: Record<
  Metric,
  {
    label: string;
    unit: string;
    help: string;
    decimals: number;
    value: (e: MarineEntity) => number;
  }
> = {
  volume: {
    label: "Marine biofuel (kt/yr)",
    unit: "thousand tonnes of biofuel component / year",
    help: "Estimated marine biofuel supplied or bunkered each year, in thousand tonnes of the bio component (not the whole blended bunker).",
    decimals: 0,
    value: (e) => e.volumeKt,
  },
  reach: {
    label: "Ports / vessels covered",
    unit: "bunkering ports supplied, or vessels bunkering blends",
    help: "For suppliers this is the number of bunkering ports offering bio-blends; for users it is the number of vessels regularly bunkering them.",
    decimals: 0,
    value: (e) => e.reach,
  },
  blend: {
    label: "Typical blend level (%)",
    unit: "% bio component in the delivered bunker",
    help: "Typical blend level offered or bunkered — B24 and B30 dominate today, with a few fully renewable marine fuels at 100%.",
    decimals: 0,
    value: (e) => e.blendPct,
  },
  marketcap: {
    label: "Market cap (approx.)",
    unit: "approximate market capitalisation, USD billions",
    help: "Approximate latest market capitalisation in USD billions, converted at recent exchange rates. Private, state-owned or unlisted entities rank last.",
    decimals: 1,
    value: (e) => marketCapValue(MARINE_TICKERS[e.name]),
  },

  ghg: {
    label: "GHG savings (reported)",
    unit: "million tonnes CO₂e avoided per year",
    help: GHG_NOTE,
    decimals: 1,
    value: (e) => ghgSavingsMt(e.name),
  },
};

function scatterAxes(metricKey: Metric) {
  if (metricKey === "volume") {
    return {
      x: {
        metric: METRICS.reach,
        help: "X-axis shows port or vessel coverage; Y-axis shows annual marine biofuel volume.",
      },
      size: { label: "Marine biofuel", unit: "kt/yr", value: (e: MarineEntity) => e.volumeKt },
    };
  }
  if (metricKey === "marketcap") {
    return {
      x: {
        metric: METRICS.volume,
        help: "X-axis shows annual marine biofuel volume; Y-axis shows approximate market cap.",
      },
      size: { label: "Marine biofuel", unit: "kt/yr", value: (e: MarineEntity) => e.volumeKt },
    };
  }
  return {
    x: { metric: METRICS.volume, help: "X-axis shows annual marine biofuel volume." },
    size: { label: "Ports / vessels", unit: "count", value: (e: MarineEntity) => e.reach },
  };
}

const TITLE = "Global marine biofuel suppliers and users";
const NEWS_SUFFIX = "marine biofuel OR bio-bunker OR B30 bunkering";
const DYNAMIC_DATASET_ID = "marine-biofuel";

function observationValue(row: SupplyEntityRow, metricKey: string): number | null {
  const value = row.observations.find((o) => o.metricKey === metricKey)?.value;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function dynamicEntity(row: SupplyEntityRow): MarineEntity | null {
  const volumeKt = observationValue(row, "volumeKt");
  const reach = observationValue(row, "reach");
  if (volumeKt === null || reach === null) return null;

  const country = row.country ?? String(row.metadata["country"] ?? "Unknown");
  const role =
    row.metadata["role"] === "Port market" || row.entityType === "port-market"
      ? "Port market"
      : "Supplier";
  const latestMonth =
    typeof row.metadata["latestMonth"] === "string" ? row.metadata["latestMonth"] : "";

  return {
    name: row.name,
    country,
    flag: COUNTRY_NAME_FLAG[country] ?? "Global",
    role,
    volumeKt,
    reach,
    blendPct: 0,
    blendReported: false,
    sourceBacked: true,
    note: `Source-backed MPA bunker sales aggregate${latestMonth ? ` through ${latestMonth}` : ""}; supplier splits and blend percentages are not reported in this dataset`,
  };
}

function mergeDynamicEntities(payload: SupplyDatasetPayload | undefined): {
  entities: MarineEntity[];
  dynamicCount: number;
  sourceBacked: boolean;
  reportingYears: number[];
  latestIngestFinishedAt: string | null;
  stale: boolean | null;
} {
  const dynamic = (payload?.rows ?? [])
    .map(dynamicEntity)
    .filter((e): e is MarineEntity => Boolean(e));
  if (dynamic.length === 0) {
    return {
      entities: ENTITIES,
      dynamicCount: 0,
      sourceBacked: false,
      reportingYears: [],
      latestIngestFinishedAt: null,
      stale: payload?.freshness?.stale ?? null,
    };
  }

  const byName = new Map(ENTITIES.map((entity) => [entity.name, entity]));
  for (const entity of dynamic) byName.set(entity.name, entity);
  const reportingYears = [
    ...new Set(
      (payload?.rows ?? [])
        .flatMap((row) => row.observations)
        .map((observation) => observation.reportingYear)
        .filter((year): year is number => typeof year === "number"),
    ),
  ].sort((a, b) => b - a);

  return {
    entities: [...byName.values()],
    dynamicCount: dynamic.length,
    sourceBacked: true,
    reportingYears,
    latestIngestFinishedAt: payload?.latestIngest?.finishedAt ?? null,
    stale: payload?.freshness?.stale ?? null,
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

export function MarineBiofuelPanel() {
  const [metricKey, setMetricKey] = useState<Metric>("volume");
  const [view, setView] = useState<PanelView>("heat");
  const detail = useEntityDetail();
  const { data: dynamicPayload } = useQuery({
    queryKey: ["supply-dataset", DYNAMIC_DATASET_ID],
    queryFn: () => getSupplyDatasetFn({ data: { datasetId: DYNAMIC_DATASET_ID } }),
    staleTime: 15 * 60 * 1000,
  });
  const dynamic = useMemo(() => mergeDynamicEntities(dynamicPayload), [dynamicPayload]);
  const entities = dynamic.entities;
  const metric = METRICS[metricKey];
  const valueOf = (e: MarineEntity) => metric.value(e);

  const f = useChartFilter(entities, {
    text: (e) => `${e.name} ${e.country} ${e.role} ${e.note}`,
    facetA: (e) => e.country,
    facetB: (e) => e.role,
  });
  const ranked = f.filtered.slice().sort((a, b) => valueOf(b) - valueOf(a));
  const isFiltered = Boolean(f.a || f.b || f.query.trim());
  const rows = view === "table" || view === "map" ? ranked : ranked.slice(0, isFiltered ? 20 : 10);
  const ghgEmpty =
    metricKey === "ghg" && ranked.length > 0 && !ranked.some((x) => ghgSavingsMt(x.name) > 0);

  const axes = scatterAxes(metricKey);
  const scatterPoints: ScatterPoint[] = rows.map((e) => ({
    key: e.name,
    label: e.name,
    sub: `${e.role} · ${e.country}`,
    x: axes.x.metric.value(e),
    y: valueOf(e),
    size: axes.size.value(e),
    group: e.role,
    logo: entityLogoByName(e.name),
    meta: listingMeta(MARINE_TICKERS[e.name]),
    newsTarget: { name: e.name, query: `"${e.name}" ${NEWS_SUFFIX}` },
  }));

  const items = rows.map((e) => ({
    key: e.name,
    label: e.name,
    sub: `${e.role} · ${e.note}`,
    value: valueOf(e),
    logo: entityLogoByName(e.name),
    meta: listingMeta(MARINE_TICKERS[e.name]),
  }));
  const newsMap = Object.fromEntries(
    rows.map((e) => [e.name, { name: e.name, query: `"${e.name}" ${NEWS_SUFFIX}` }]),
  );
  const filters: [string, string][] = [
    ["Role", f.b || "Suppliers & users"],
    ["Country", f.a || "All countries"],
  ];
  if (f.query.trim()) filters.push(["Search", `"${f.query.trim()}"`]);
  const graph: GraphContext = {
    measure: metric.label,
    unit: metric.unit,
    view: PANEL_VIEWS.find((v) => v.value === view)?.label ?? view,
    filters,
    items: rows.map((e) => ({ name: e.name, value: valueOf(e) })),
    format: (n: number) => fmt(n, metric.decimals),
  };
  const onSelect = detail.onSelect((t) => {
    const e = rows.find((r) => r.name === t?.name);
    if (!e) return null;
    return {
      name: e.name,
      sub: `${e.flag} ${e.country} · ${e.role}`,
      logo: entityLogoByName(e.name),
      note: e.note,
      stats: [
        { label: "Marine biofuel", value: `${fmt(e.volumeKt, 0)} kt/yr` },
        { label: "Ports / vessels", value: fmt(e.reach, 0) },
        {
          label: "Typical blend",
          value:
            e.blendReported === false ? "Not reported by this source" : `${fmt(e.blendPct, 0)}%`,
        },
        { label: "Ticker", value: MARINE_TICKERS[e.name] ?? "Not listed" },
        {
          label: "Market cap (approx.)",
          value: marketCapLabel(MARINE_TICKERS[e.name]) ?? "Private / state-owned",
        },
      ],
      news: { name: e.name, query: `"${e.name}" ${NEWS_SUFFIX}` },
    };
  }, graph);

  return (
    <>
      {detail.sheet}
      <ChartPanel
        icon={Ship}
        title={TITLE}
        blurb="Bunker suppliers blending FAME and HVO into VLSFO and MGO, and the shipping lines, ferry operators and cargo owners bunkering those blends."
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
                filename: "global-marine-biofuel",
                note: `Measure shown: ${metric.label}`,
                header: [
                  "Entity",
                  "Role",
                  "Country",
                  "Marine biofuel (kt/yr)",
                  "Ports / vessels",
                  "Typical blend %",
                  "Ticker",
                  "Market cap (approx., USD bn)",
                  "Note",
                ],
                rows: ranked.map((e) => {
                  return [
                    e.name,
                    e.role,
                    e.country,
                    e.volumeKt,
                    e.reach,
                    e.blendReported === false ? "" : e.blendPct,
                    MARINE_TICKERS[e.name] ?? "",
                    marketCapLabel(MARINE_TICKERS[e.name]) ?? "",
                    e.note,
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
            placeholder="Search marine biofuel entities…"
            selects={[
              {
                label: "Role",
                value: f.b,
                options: [...new Set(entities.map((e) => e.role))],
                onChange: f.setB,
                allLabel: "Suppliers & users",
              },
              {
                label: "Country",
                value: f.a,
                options: countryFilterOptions(entities.map((e) => e.country)),
                onChange: f.setA,
                allLabel: "All countries",
              },
            ]}
            shown={rows.length}
            total={entities.length}
            matched={ranked.length}
          />
        }
        footnote={`${dynamic.sourceBacked ? "MPA Singapore bunker-sales rows are ingested as a source-backed port-market aggregate; supplier-level splits and blend percentages remain fallback data until a source reports them directly." : "Indicative annual marine biofuel volumes from bunker supplier disclosures, MPA Singapore and Port of Rotterdam bunker statistics, and shipping-line sustainability reports."} Click any tile for the latest news. ${MARKET_CAP_NOTE}`}
        sourceMeta={
          dynamic.sourceBacked ? (
            <p className="label-mono mt-2 text-xs text-muted-foreground">
              MPA Singapore rows: {dynamic.dynamicCount} port-market entity ·{" "}
              {reportingYearLabel(dynamic.reportingYears)} · ingested{" "}
              {formatFreshnessDate(dynamic.latestIngestFinishedAt)} ·{" "}
              {freshnessLabel(dynamic.stale)} · fallback entity rows reviewed{" "}
              {dynamicPayload?.registry?.lastReviewed ?? "not recorded"} ·{" "}
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
            No marine biofuel suppliers or users listed for this filter — open that country's
            profile page for its policy and market updates.
          </p>
        ) : view === "line" ? (
          <ChartTrend panel="marine" />
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
            indexLabel="Global marine biofuel index"
          />
        ) : view === "map" ? (
          <ChartMap
            points={rows.map((e) => ({
              key: e.name,
              label: e.name,
              country: e.country,
              value: valueOf(e),
              sub: e.note,
              newsTarget: { name: e.name, query: `"${e.name}" ${NEWS_SUFFIX}` },
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
            yLabel="Marine biofuel entity"
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
            indexLabel="Global marine biofuel index"
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
