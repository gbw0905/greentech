import type {
  ParsedSupplyDataset,
  ParsedSupplyEntity,
  ParsedSupplyObservation,
  SupplyJson,
  SupplySourceRegistryEntry,
} from "../../contracts";
import type { SupplyParser } from "./types";
import {
  EMBER_GLOBAL_CSV,
  fetchEmberBioenergyRows,
  type EmberBioenergyRow,
} from "@/features/markets/official/ember.server";

const DATASET_ID = "bio-power";
const PARSER_ID = "biopower-ember-yearly";
// Ember's old long-format file stopped updating; read the current global file.
const CSV_URL = EMBER_GLOBAL_CSV;

function rawFor(row: EmberBioenergyRow): SupplyJson {
  return {
    area: row.area,
    iso3: row.iso3,
    year: row.year,
    areaType: row.areaType,
    electricitySource: "Bioenergy",
    generationTwh: row.generationTwh,
    capacityGw: row.capacityGw,
  };
}

function observationsFor(row: EmberBioenergyRow): ParsedSupplyObservation[] {
  const out: ParsedSupplyObservation[] = [];
  if (row.capacityGw !== null) {
    out.push({
      metricKey: "capacityMw",
      metricLabel: "Bioenergy generating capacity",
      value: row.capacityGw * 1000,
      unit: "MW",
      reportingYear: row.year,
      basis:
        "Ember yearly electricity data (global file), Capacity (GW) for Bioenergy, converted to MW.",
      estimated: false,
      confidence: "reported",
      sourceUrl: CSV_URL,
      raw: rawFor(row),
    });
  }
  if (row.generationTwh !== null) {
    out.push({
      metricKey: "generationGwh",
      metricLabel: "Bioenergy electricity generation",
      value: row.generationTwh * 1000,
      unit: "GWh per year",
      reportingYear: row.year,
      basis:
        "Ember yearly electricity data (global file), Generation (TWh) for Bioenergy, converted to GWh.",
      estimated: false,
      confidence: "reported",
      sourceUrl: CSV_URL,
      raw: rawFor(row),
    });
  }
  return out;
}

function toEntities(rows: EmberBioenergyRow[]): ParsedSupplyEntity[] {
  // Each country's own latest year: newer years only list early reporters.
  const latestByArea = new Map<string, EmberBioenergyRow>();
  for (const row of rows) {
    if (row.areaType !== "Country or economy" || row.generationTwh === null) continue;
    const current = latestByArea.get(row.area);
    if (!current || row.year > current.year) latestByArea.set(row.area, row);
  }

  const entities: ParsedSupplyEntity[] = [];
  for (const row of latestByArea.values()) {
    const observations = observationsFor(row);
    if (!observations.length) continue;
    entities.push({
      name: `${row.area} bioenergy power market`,
      country: row.area,
      entityType: "country-market",
      sourceEntityKey: `ember:${row.iso3 || row.area}`,
      metadata: {
        iso3: row.iso3,
        feedstock: "Bioenergy",
        sourceKind: "Ember yearly electricity country aggregate",
      },
      observations,
    });
  }

  return entities.sort((a, b) => {
    const aGeneration = a.observations.find((o) => o.metricKey === "generationGwh")?.value ?? 0;
    const bGeneration = b.observations.find((o) => o.metricKey === "generationGwh")?.value ?? 0;
    return (bGeneration ?? 0) - (aGeneration ?? 0);
  });
}

async function parse(source: SupplySourceRegistryEntry): Promise<ParsedSupplyDataset> {
  const rows = await fetchEmberBioenergyRows(45_000);
  const entities = toEntities(rows);
  const reportingYear =
    entities.reduce((latest, entity) => {
      return entity.observations.reduce((innerLatest, observation) => {
        return typeof observation.reportingYear === "number"
          ? Math.max(innerLatest, observation.reportingYear)
          : innerLatest;
      }, latest);
    }, 0) || source.year;

  return {
    datasetId: DATASET_ID,
    sourceUrl: CSV_URL,
    reportingYear,
    rowsSeen: entities.reduce((count, entity) => count + entity.observations.length, 0),
    entities,
    metadata: {
      parserId: PARSER_ID,
      sourceLandingPage: source.url,
      csvUrl: CSV_URL,
      countryMarkets: entities.length,
    },
  };
}

export const biopowerEmberYearlyParser: SupplyParser = {
  id: PARSER_ID,
  datasetId: DATASET_ID,
  parse,
};
