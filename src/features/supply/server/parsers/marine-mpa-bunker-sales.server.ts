import type {
  ParsedSupplyDataset,
  ParsedSupplyEntity,
  SupplyJson,
  SupplySourceRegistryEntry,
} from "../../contracts";
import type { SupplyParser } from "./types";

const DATASET_ID = "marine-biofuel";
const PARSER_ID = "marine-mpa-bunker-sales";
const FETCH_TIMEOUT_MS = 30_000;

type DataGovRecord = {
  month?: string;
  bunker_type?: string;
  bunker_sales?: string;
};

type BunkerRow = {
  month: string;
  year: number;
  bunkerType: string;
  salesKt: number;
};

function datasetIdFromUrl(url: string): string {
  const match = url.match(/datasets\/(d_[a-z0-9]+)\/view/i) ?? url.match(/resource_id=(d_[a-z0-9]+)/i);
  if (!match?.[1]) throw new Error(`Could not find data.gov.sg dataset id in ${url}`);
  return match[1];
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "GlobalBioenergyWatch/1.0 (+supply ingestion)" },
    });
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Timed out fetching ${url} after ${FETCH_TIMEOUT_MS / 1000}s`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseNumber(value: string | undefined): number {
  const n = Number((value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function parseRows(records: DataGovRecord[]): BunkerRow[] {
  return records
    .map((record) => {
      const month = record.month ?? "";
      const year = Number(month.slice(0, 4));
      return {
        month,
        year,
        bunkerType: record.bunker_type ?? "",
        salesKt: parseNumber(record.bunker_sales),
      };
    })
    .filter((row) => /^\d{4}-\d{2}$/.test(row.month) && row.year > 0);
}

function isMarineBiofuel(row: BunkerRow): boolean {
  return /bio-blended|^b100$/i.test(row.bunkerType);
}

function sum(rows: BunkerRow[]): number {
  return rows.reduce((total, row) => total + row.salesKt, 0);
}

function latestMonth(rows: BunkerRow[]): string | null {
  return rows.map((row) => row.month).sort().at(-1) ?? null;
}

function latestCompleteYear(rows: BunkerRow[]): number | null {
  const years = [...new Set(rows.map((row) => row.year))].sort((a, b) => b - a);
  return years.find((year) => rows.some((row) => row.month === `${year}-12`)) ?? null;
}

function rowsForYear(rows: BunkerRow[], year: number): BunkerRow[] {
  return rows.filter((row) => row.year === year);
}

function toRaw(rows: BunkerRow[]): SupplyJson {
  return {
    rows: rows.map((row) => ({
      month: row.month,
      bunkerType: row.bunkerType,
      salesKt: row.salesKt,
    })),
  };
}

async function fetchRows(sourceUrl: string): Promise<{ apiUrl: string; rows: BunkerRow[] }> {
  const resourceId = datasetIdFromUrl(sourceUrl);
  const apiUrl = `https://data.gov.sg/api/action/datastore_search?resource_id=${resourceId}&limit=10000`;
  const payload = await fetchJson<{
    success?: boolean;
    result?: { records?: DataGovRecord[]; total?: number };
  }>(apiUrl);
  if (!payload.success) throw new Error("data.gov.sg API returned success=false.");
  return { apiUrl, rows: parseRows(payload.result?.records ?? []) };
}

function toEntity(rows: BunkerRow[], apiUrl: string): ParsedSupplyEntity {
  const bioRows = rows.filter(isMarineBiofuel);
  const completeYear = latestCompleteYear(rows) ?? Math.max(...bioRows.map((row) => row.year));
  const latest = latestMonth(rows);
  const latestYear = latest ? Number(latest.slice(0, 4)) : completeYear;
  const completeYearRows = rowsForYear(bioRows, completeYear);
  const latestYearRows = rowsForYear(bioRows, latestYear);

  return {
    name: "Singapore marine biofuel bunker market",
    country: "Singapore",
    entityType: "port-market",
    sourceEntityKey: "singapore-mpa-marine-biofuel-bunkers",
    metadata: {
      role: "Port market",
      latestMonth: latest,
      feedstock: "Bio-blended marine bunker fuels",
      sourceKind: "MPA monthly bunker sales aggregate",
      supplierSplit: "not reported by dataset",
      blendLevel: "not reported by dataset",
    },
    observations: [
      {
        metricKey: "volumeKt",
        metricLabel: "Bio-blended bunker sales",
        value: sum(completeYearRows),
        unit: "thousand tonnes per year",
        reportingYear: completeYear,
        basis:
          "Sum of MPA monthly bunker sales rows for bio-blended marine fuels and B100 in the latest complete calendar year.",
        estimated: false,
        confidence: "reported",
        sourceUrl: apiUrl,
        raw: toRaw(completeYearRows),
      },
      {
        metricKey: "latestYtdVolumeKt",
        metricLabel: "Bio-blended bunker sales YTD",
        value: sum(latestYearRows),
        unit: "thousand tonnes year-to-date",
        reportingYear: latestYear,
        basis:
          "Sum of available MPA monthly bunker sales rows for bio-blended marine fuels and B100 in the latest data year.",
        estimated: false,
        confidence: "reported",
        sourceUrl: apiUrl,
        raw: toRaw(latestYearRows),
      },
      {
        metricKey: "reach",
        metricLabel: "Bunkering hubs covered",
        value: 1,
        unit: "port market",
        reportingYear: completeYear,
        basis: "The dataset covers bunker sales in the Port of Singapore.",
        estimated: false,
        confidence: "reported",
        sourceUrl: apiUrl,
        raw: { port: "Singapore" },
      },
    ],
  };
}

async function parse(source: SupplySourceRegistryEntry): Promise<ParsedSupplyDataset> {
  const { apiUrl, rows } = await fetchRows(source.url);
  const bioRows = rows.filter(isMarineBiofuel);
  const completeYear = latestCompleteYear(rows);

  return {
    datasetId: DATASET_ID,
    sourceUrl: apiUrl,
    reportingYear: completeYear,
    rowsSeen: bioRows.length,
    entities: bioRows.length ? [toEntity(rows, apiUrl)] : [],
    metadata: {
      parserId: PARSER_ID,
      sourceLandingPage: source.url,
      apiUrl,
      latestMonth: latestMonth(rows),
      matchedBiofuelRows: bioRows.length,
    },
  };
}

export const marineMpaBunkerSalesParser: SupplyParser = {
  id: PARSER_ID,
  datasetId: DATASET_ID,
  parse,
};
