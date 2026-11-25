import { DATASETS } from "@/shared/data/provenance";
import type {
  SupplyDatasetRegistryEntry,
  SupplyRefreshCadence,
  SupplySourceRegistryEntry,
  SupplySourceType,
} from "./contracts";

const SOURCE_TYPE_BY_URL: Array<[RegExp, SupplySourceType]> = [
  [/\.csv($|\?)/i, "csv"],
  [/\.xlsx?($|\?)/i, "xlsx"],
  [/\.pdf($|\?)/i, "pdf"],
  [/rss|\.xml($|\?)/i, "rss"],
  [/api|data\.gov|query|datasets/i, "api"],
];

const SOURCE_OVERRIDES: Record<
  string,
  Partial<Pick<SupplySourceRegistryEntry, "sourceType" | "parserId" | "refreshCadence" | "notes">>
> = {
  "ethanol|U.S. Energy Information Administration|https://www.eia.gov/petroleum/ethanolcapacity/": {
    sourceType: "html",
    parserId: "ethanol-eia-capacity",
    refreshCadence: "annual",
    notes: "Parser follows the approved EIA landing page to its plant-level XLSX workbook.",
  },
  "biochar|Biochar Europe|https://www.biochareurope.eu/members": {
    sourceType: "html",
    parserId: "biochar-biochar-europe-members",
    refreshCadence: "monthly",
    notes:
      "Parser reads the public member directory and only treats explicitly stated capacity values as capacity observations.",
  },
  "rng|US EPA|https://www.epa.gov/fuels-registration-reporting-and-compliance-help/spreadsheet-rin-generation-and-renewable-fuel-0":
    {
      sourceType: "html",
      parserId: "rng-epa-rfs-fuel-type",
      refreshCadence: "monthly",
      notes:
        "Parser follows the approved EPA landing page to the latest fuel-type CSV and ingests aggregate RNG/CNG RFS rows.",
    },
  "marine-biofuel|Maritime and Port Authority of Singapore|https://data.gov.sg/datasets/d_4f5abbf4486bf8e52bbed3be56dde562/view":
    {
      sourceType: "api",
      parserId: "marine-mpa-bunker-sales",
      refreshCadence: "monthly",
      notes:
        "Parser reads the public data.gov.sg datastore API and ingests aggregate Singapore bio-blended bunker sales rows.",
    },
  "wood-pellets|Wood Pellet Association of Canada / US Industrial Pellet Association|https://www.pellet.org/":
    {
      sourceType: "html",
      parserId: "wood-pellet-wpac-members",
      refreshCadence: "monthly",
      notes:
        "Parser follows the association site to the WPAC members page and ingests Category A producing-member listings.",
    },
  "bio-power|Ember|https://ember-energy.org/data/": {
    sourceType: "api",
    parserId: "biopower-ember-yearly",
    refreshCadence: "monthly",
    notes:
      "Parser reads Ember's public yearly electricity CSV and ingests country-level bioenergy capacity and generation aggregates.",
  },
  "fuel-stations|UK Department for Transport|https://www.gov.uk/government/collections/renewable-transport-fuels-obligation-rtfo-statistics":
    {
      sourceType: "html",
      parserId: "rtfo-annual-report",
      refreshCadence: "annual",
      notes:
        "Parser follows the GOV.UK RTFO collection to the latest final report and ingests published UK renewable-fuel supply aggregates.",
    },
  "uco-suppliers|UK Department for Transport|https://www.gov.uk/government/collections/renewable-transport-fuels-obligation-rtfo-statistics":
    {
      sourceType: "html",
      parserId: "rtfo-annual-report",
      refreshCadence: "annual",
      notes:
        "Parser follows the GOV.UK RTFO collection to the latest final report and ingests reported UCO feedstock-origin aggregates where published.",
    },
  "saf-airlines|IATA|https://www.iata.org/en/programs/sustainability/sustainable-aviation-fuels/": {
    sourceType: "html",
    parserId: "saf-iata-production",
    refreshCadence: "quarterly",
    notes:
      "Parser extracts IATA global SAF production and fuel-share facts; airline-level uplift remains dependent on carrier disclosures.",
  },
  "renewable-hydrogen|International Energy Agency|https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database":
    {
      sourceType: "html",
      parserId: "hydrogen-iea-projects",
      refreshCadence: "annual",
      notes:
        "Parser follows the IEA data-product page to the public hydrogen projects workbook and ingests project output and electrolyser capacity rows where exposed.",
    },
  "renewable-lpg|Liquid Gas Europe|https://www.liquidgaseurope.eu/renewables/": {
    sourceType: "html",
    parserId: "renewable-lpg-lge-outlook",
    refreshCadence: "annual",
    notes:
      "Parser follows Liquid Gas Europe's renewable liquid gas outlook and ingests published market-potential scenario facts.",
  },
  "bio-methanol|Methanol Institute|https://methanol.org/knowledge-publications": {
    sourceType: "html",
    parserId: "bio-methanol-mi-irena-outlook",
    refreshCadence: "annual",
    notes:
      "Parser follows the MI publications listing to the mirrored IRENA Innovation Outlook Renewable Methanol PDF and ingests explicitly stated renewable-methanol plant capacities.",
  },
  "blending-terminals|U.S. Energy Information Administration|https://www.eia.gov/petroleum/": {
    sourceType: "html",
    parserId: "blending-terminals-eia-storage",
    refreshCadence: "annual",
    notes:
      "Parser navigates the approved EIA petroleum pages to the Working and Net Available Shell Storage Capacity workbook and ingests Table 1 bulk-terminal working storage capacity (final March 2024 vintage; report discontinued).",
  },
  "carriers|International Maritime Organization|https://www.imo.org/en/OurWork/Environment/Pages/Data-Collection-System.aspx":
    {
      sourceType: "html",
      parserId: "carriers-imo-dcs",
      refreshCadence: "annual",
      notes:
        "Parser follows the approved IMO DCS page to the latest well-formed annual fuel-oil-consumption PDF and ingests the anonymised fleet biofuel/methanol/ethanol/LNG totals; per-carrier rows stay fallback because DCS data cannot identify ships or companies.",
    },
};

function shouldSnapshotSource(source: { org: string; url: string }): boolean {
  if (source.url.includes("globalbioenergywatch.org")) return false;
  return true;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function inferSourceType(url: string): SupplySourceType {
  return SOURCE_TYPE_BY_URL.find(([pattern]) => pattern.test(url))?.[1] ?? "html";
}

function inferCadence(sourceType: SupplySourceType): SupplyRefreshCadence {
  if (sourceType === "rss" || sourceType === "api") return "weekly";
  if (sourceType === "csv" || sourceType === "xlsx") return "monthly";
  if (sourceType === "pdf") return "quarterly";
  return "manual";
}

export const SUPPLY_DATASET_REGISTRY: SupplyDatasetRegistryEntry[] = DATASETS.map((dataset) => ({
  id: dataset.id,
  panel: dataset.panel,
  description: dataset.description,
  reportingYear: dataset.reportingYear,
  lastReviewed: dataset.lastReviewed,
  metrics: dataset.metrics,
  coverage: dataset.coverage,
  limitations: dataset.limitations,
}));

export const SUPPLY_SOURCE_REGISTRY: SupplySourceRegistryEntry[] = DATASETS.flatMap((dataset) =>
  dataset.sources.map((source, index) => {
    const override = SOURCE_OVERRIDES[`${dataset.id}|${source.org}|${source.url}`];
    const sourceType = override?.sourceType ?? inferSourceType(source.url);
    const parserId =
      override?.parserId ?? (shouldSnapshotSource(source) ? "supply-source-page-snapshot" : null);
    const entry: SupplySourceRegistryEntry = {
      id: `${dataset.id}:${slugify(source.org)}:${slugify(source.title || source.url)}`,
      datasetId: dataset.id,
      org: source.org,
      title: source.title,
      url: source.url,
      year: source.year,
      sourceType,
      parserId,
      refreshCadence: override?.refreshCadence ?? inferCadence(sourceType),
      priority: index + 1,
      active: true,
    };
    if (override?.notes) {
      entry.notes = override.notes;
    } else if (parserId === "supply-source-page-snapshot") {
      entry.notes =
        "Approved source crawled by the generic source snapshot parser; dedicated metric extraction can be added where the source exposes structured data.";
    } else if (sourceType === "html") {
      entry.notes =
        "Approved source, but still needs a dedicated parser before automated ingestion.";
    }
    return entry;
  }),
);

export function supplyDatasetById(id: string): SupplyDatasetRegistryEntry | null {
  return SUPPLY_DATASET_REGISTRY.find((dataset) => dataset.id === id) ?? null;
}

export function supplySourcesForDataset(id: string): SupplySourceRegistryEntry[] {
  return SUPPLY_SOURCE_REGISTRY.filter((source) => source.datasetId === id);
}
