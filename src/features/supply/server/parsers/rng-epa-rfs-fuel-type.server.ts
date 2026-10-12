import type {
  ParsedSupplyDataset,
  ParsedSupplyEntity,
  SupplyJson,
  SupplySourceRegistryEntry,
} from "../../contracts";
import type { SupplyParser } from "./types";

const DATASET_ID = "rng";
const PARSER_ID = "rng-epa-rfs-fuel-type";
const FETCH_TIMEOUT_MS = 30_000;
const MMBTU_PER_RFS_BIOGAS_GALLON = 0.077;

type FuelRow = {
  rinYear: number;
  fuel: string;
  fuelCode: string;
  fuelCategory: string;
  fuelCategoryCode: string;
  rinQuantity: number;
  batchVolume: number;
};

function decodeHtml(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
}

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

function latestCsvUrl(sourceUrl: string, html: string): string {
  const matches = [...html.matchAll(/href=["']([^"']*fuelproduction_[^"']+\.csv)["']/gi)];
  const href = matches[0]?.[1];
  if (!href) throw new Error("Could not find an EPA fuel production CSV link.");
  return new URL(decodeHtml(href), sourceUrl).toString();
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

function parseNumber(value: string | undefined): number {
  const n = Number((value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function parseRows(csv: string): FuelRow[] {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  if (!headerLine) return [];
  const headers = splitCsvLine(headerLine);

  return lines
    .map((line) => {
      const values = splitCsvLine(line);
      const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
      return {
        rinYear: parseNumber(record["RIN Year"]),
        fuel: record["Fuel"] ?? "",
        fuelCode: record["Fuel Code"] ?? "",
        fuelCategory: record["Fuel Category"] ?? "",
        fuelCategoryCode: record["Fuel Category Code"] ?? "",
        rinQuantity: parseNumber(record["RIN Quantity"]),
        batchVolume: parseNumber(record["Batch Volume"]),
      };
    })
    .filter((row) => row.rinYear > 0);
}

function isRngRow(row: FuelRow): boolean {
  return /renewable (compressed natural gas|natural gas)|\brng\b|\bcng\b/i.test(row.fuelCategory);
}

function aggregateByYear(rows: FuelRow[]): ParsedSupplyEntity["observations"] {
  const byYear = new Map<number, FuelRow[]>();
  for (const row of rows) byYear.set(row.rinYear, [...(byYear.get(row.rinYear) ?? []), row]);

  return [...byYear.entries()]
    .sort(([a], [b]) => b - a)
    .flatMap(([reportingYear, yearRows]) => {
      const rinQuantity = yearRows.reduce((sum, row) => sum + row.rinQuantity, 0);
      const batchVolume = yearRows.reduce((sum, row) => sum + row.batchVolume, 0);
      const outputMmbtu = (batchVolume * MMBTU_PER_RFS_BIOGAS_GALLON) / 1_000_000;
      const raw: SupplyJson = {
        rows: yearRows.map((row) => ({
          fuel: row.fuel,
          fuelCode: row.fuelCode,
          fuelCategory: row.fuelCategory,
          fuelCategoryCode: row.fuelCategoryCode,
          rinQuantity: row.rinQuantity,
          batchVolume: row.batchVolume,
        })),
      };

      return [
        {
          metricKey: "outputMmbtu",
          metricLabel: "RFS RNG production volume",
          value: outputMmbtu,
          unit: "million MMBtu per year",
          reportingYear,
          basis:
            "Derived from EPA RFS fuel-type batch volume rows for renewable natural gas and renewable compressed natural gas, using the RFS biogas energy basis of 77,000 Btu per gallon.",
          estimated: true,
          confidence: "derived" as const,
          sourceUrl: null,
          raw,
        },
        {
          metricKey: "rinQuantity",
          metricLabel: "RNG RIN quantity",
          value: rinQuantity,
          unit: "RINs",
          reportingYear,
          basis:
            "Sum of EPA RFS fuel-type RIN quantity rows for renewable natural gas and renewable compressed natural gas.",
          estimated: false,
          confidence: "reported" as const,
          sourceUrl: null,
          raw,
        },
        {
          metricKey: "rfsBatchVolumeGallons",
          metricLabel: "RFS RNG batch volume",
          value: batchVolume,
          unit: "RFS gallons",
          reportingYear,
          basis:
            "Sum of EPA RFS fuel-type batch volume rows for renewable natural gas and renewable compressed natural gas.",
          estimated: false,
          confidence: "reported" as const,
          sourceUrl: null,
          raw,
        },
      ];
    });
}

async function parse(source: SupplySourceRegistryEntry): Promise<ParsedSupplyDataset> {
  const html = await fetchText(source.url);
  const csvUrl = latestCsvUrl(source.url, html);
  const rows = parseRows(await fetchText(csvUrl));
  const rngRows = rows.filter(isRngRow);
  const reportingYear = Math.max(...rngRows.map((row) => row.rinYear));

  const entity: ParsedSupplyEntity = {
    name: "U.S. RFS renewable natural gas market",
    country: "United States",
    entityType: "market",
    sourceEntityKey: "us-rfs-rng-market",
    metadata: {
      feedstock: "RNG / renewable CNG",
      sourceKind: "EPA RFS fuel-type aggregate",
      latestCsvUrl: csvUrl,
      facilitiesSource: "not reported by EPA fuel-type CSV",
    },
    observations: aggregateByYear(rngRows).map((observation) => ({
      ...observation,
      sourceUrl: csvUrl,
    })),
  };

  return {
    datasetId: DATASET_ID,
    sourceUrl: csvUrl,
    reportingYear: Number.isFinite(reportingYear) ? reportingYear : source.year,
    rowsSeen: rngRows.length,
    entities: rngRows.length ? [entity] : [],
    metadata: {
      parserId: PARSER_ID,
      sourceLandingPage: source.url,
      latestCsvUrl: csvUrl,
      matchedFuelRows: rngRows.length,
    },
  };
}

export const rngEpaRfsFuelTypeParser: SupplyParser = {
  id: PARSER_ID,
  datasetId: DATASET_ID,
  parse,
};
