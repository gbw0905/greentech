import type {
  ParsedSupplyDataset,
  ParsedSupplyEntity,
  ParsedSupplyObservation,
  SupplyJson,
  SupplySourceRegistryEntry,
} from "../../contracts";
import type { SupplyParser } from "./types";

const DATASET_ID = "bio-power";
const PARSER_ID = "biopower-ember-yearly";
const CSV_URL = "https://files.ember-energy.org/public-downloads/yearly_full_release_long_format.csv";
const FETCH_TIMEOUT_MS = 45_000;

type EmberRow = {
  area: string;
  iso3: string;
  year: number;
  areaType: string;
  category: string;
  subcategory: string;
  variable: string;
  unit: string;
  value: number | null;
};

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "GlobalBioenergyWatch/1.0 (+supply ingestion)" },
    });
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    return res.text();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Timed out fetching ${url} after ${FETCH_TIMEOUT_MS / 1000}s`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

function numberOrNull(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseRows(csv: string): EmberRow[] {
  const [headerLine, ...lines] = csv.split(/\r?\n/);
  const headers = splitCsvLine(headerLine ?? "");
  return lines
    .filter(Boolean)
    .map((line) => {
      const cells = splitCsvLine(line);
      const record = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
      return {
        area: record["Area"] ?? "",
        iso3: record["ISO 3 code"] ?? "",
        year: Number(record["Year"]),
        areaType: record["Area type"] ?? "",
        category: record["Category"] ?? "",
        subcategory: record["Subcategory"] ?? "",
        variable: record["Variable"] ?? "",
        unit: record["Unit"] ?? "",
        value: numberOrNull(record["Value"]),
      };
    })
    .filter((row) => row.area && Number.isFinite(row.year));
}

function rawFor(row: EmberRow): SupplyJson {
  return {
    area: row.area,
    iso3: row.iso3,
    year: row.year,
    category: row.category,
    subcategory: row.subcategory,
    variable: row.variable,
    unit: row.unit,
    value: row.value,
  };
}

function observationFor(row: EmberRow): ParsedSupplyObservation | null {
  if (row.value === null) return null;
  if (row.category === "Capacity" && row.variable === "Bioenergy" && row.unit === "GW") {
    return {
      metricKey: "capacityMw",
      metricLabel: "Bioenergy generating capacity",
      value: row.value * 1000,
      unit: "MW",
      reportingYear: row.year,
      basis: "Ember yearly electricity data, Capacity / Fuel / Bioenergy, converted from GW to MW.",
      estimated: false,
      confidence: "reported",
      sourceUrl: CSV_URL,
      raw: rawFor(row),
    };
  }
  if (row.category === "Electricity generation" && row.variable === "Bioenergy" && row.unit === "TWh") {
    return {
      metricKey: "generationGwh",
      metricLabel: "Bioenergy electricity generation",
      value: row.value * 1000,
      unit: "GWh per year",
      reportingYear: row.year,
      basis: "Ember yearly electricity data, Electricity generation / Fuel / Bioenergy, converted from TWh to GWh.",
      estimated: false,
      confidence: "reported",
      sourceUrl: CSV_URL,
      raw: rawFor(row),
    };
  }
  return null;
}

function toEntities(rows: EmberRow[]): ParsedSupplyEntity[] {
  const latestYear = rows.reduce((latest, row) => Math.max(latest, row.year), 0);
  const latestRows = rows.filter(
    (row) =>
      row.year === latestYear &&
      row.areaType === "Country or economy" &&
      row.subcategory === "Fuel" &&
      row.variable === "Bioenergy",
  );
  const byArea = new Map<string, ParsedSupplyEntity>();

  for (const row of latestRows) {
    const observation = observationFor(row);
    if (!observation) continue;
    const entity =
      byArea.get(row.area) ??
      ({
        name: `${row.area} bioenergy power market`,
        country: row.area,
        entityType: "country-market",
        sourceEntityKey: `ember:${row.iso3 || row.area}`,
        metadata: {
          iso3: row.iso3,
          feedstock: "Bioenergy",
          sourceKind: "Ember yearly electricity country aggregate",
        },
        observations: [],
      } satisfies ParsedSupplyEntity);
    entity.observations.push(observation);
    byArea.set(row.area, entity);
  }

  return [...byArea.values()].sort((a, b) => {
    const aGeneration = a.observations.find((o) => o.metricKey === "generationGwh")?.value ?? 0;
    const bGeneration = b.observations.find((o) => o.metricKey === "generationGwh")?.value ?? 0;
    return (bGeneration ?? 0) - (aGeneration ?? 0);
  });
}

async function parse(source: SupplySourceRegistryEntry): Promise<ParsedSupplyDataset> {
  const rows = parseRows(await fetchText(CSV_URL));
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
