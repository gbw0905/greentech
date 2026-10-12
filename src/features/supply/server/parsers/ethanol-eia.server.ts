import ExcelJS from "exceljs";
import type {
  ParsedSupplyDataset,
  ParsedSupplyEntity,
  SupplyJson,
  SupplySourceRegistryEntry,
} from "../../contracts";
import type { SupplyParser } from "./types";

const GALLON_TO_LITRE = 3.785411784;
const DATASET_ID = "ethanol";
const PARSER_ID = "ethanol-eia-capacity";
const FETCH_TIMEOUT_MS = 30_000;

type PlantRow = {
  state: string;
  respondent: string;
  city: string;
  capacityMmGalY: number;
  capacityMlY: number;
};

type ProducerAggregate = {
  name: string;
  respondents: Set<string>;
  states: Set<string>;
  cities: Set<string>;
  capacityMlY: number;
  plants: number;
  plantRows: PlantRow[];
};

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "text" in value) {
    return String((value as { text?: unknown }).text ?? "").trim();
  }
  return String(value).trim();
}

function numeric(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const n = Number(text(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function producerName(respondent: string): string {
  const s = respondent.replace(/\s+/g, " ").trim();
  const lower = s.toLowerCase();
  if (lower.includes("poet")) return "POET";
  if (lower.includes("valero renewable fuels")) return "Valero Renewable Fuels";
  if (/^adm\b/.test(lower) || lower.includes("archer daniels midland")) {
    return "Archer Daniels Midland";
  }
  if (lower.includes("green plains")) return "Green Plains";
  if (lower.includes("flint hills")) return "Flint Hills Resources";
  if (lower.includes("marquis")) return "Marquis Energy";
  if (lower.includes("alto")) return "Pacific Ethanol / Alto";
  if (lower.includes("big river resources")) return "Big River Resources";
  if (lower.includes("white energy")) return "White Energy";
  if (lower.includes("red trail")) return "Red Trail Energy";
  if (lower.includes("absolute energy")) return "Absolute Energy";
  return s
    .replace(/\b(LLC|Inc\.?|Corporation|Corp\.?|Ltd\.?|Co\.?)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "GlobalBioenergyWatch/1.0 (+supply ingestion)" },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Timed out fetching ${url} after ${FETCH_TIMEOUT_MS / 1000}s`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchText(url: string): Promise<string> {
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

async function fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.arrayBuffer();
}

function findWorkbookUrl(sourceUrl: string, html: string): string {
  const match = html.match(/href=["']([^"']+\.xlsx(?:\?[^"']*)?)["']/i);
  if (!match?.[1]) {
    throw new Error("No XLSX workbook link found on the EIA ethanol capacity page.");
  }
  return new URL(match[1], sourceUrl).toString();
}

function getCellValues(row: ExcelJS.Row): unknown[] {
  const values = row.values;
  return Array.isArray(values) ? values.slice(1) : [];
}

function parseWorkbook(workbook: ExcelJS.Workbook): PlantRow[] {
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("EIA ethanol workbook contains no worksheets.");

  let state = "";
  const rows: PlantRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 3) return;
    const values = getCellValues(row);
    const first = text(values[0]);
    const respondent = text(values[1]);
    const city = text(values[2]);
    const capacity = numeric(values[3]);

    if (first.startsWith("PADD") || first === "U.S. Total") return;
    if (first) state = first;
    if (!respondent || !city || capacity === null || capacity <= 0 || !state) return;

    rows.push({
      state,
      respondent,
      city,
      capacityMmGalY: capacity,
      capacityMlY: capacity * GALLON_TO_LITRE,
    });
  });

  return rows;
}

function aggregate(rows: PlantRow[], sourceUrl: string, reportingYear: number): ParsedSupplyEntity[] {
  const producers = new Map<string, ProducerAggregate>();

  for (const row of rows) {
    const name = producerName(row.respondent);
    const current =
      producers.get(name) ??
      ({
        name,
        respondents: new Set<string>(),
        states: new Set<string>(),
        cities: new Set<string>(),
        capacityMlY: 0,
        plants: 0,
        plantRows: [],
      } satisfies ProducerAggregate);

    current.respondents.add(row.respondent);
    current.states.add(row.state);
    current.cities.add(row.city);
    current.capacityMlY += row.capacityMlY;
    current.plants += 1;
    current.plantRows.push(row);
    producers.set(name, current);
  }

  return [...producers.values()]
    .sort((a, b) => b.capacityMlY - a.capacityMlY)
    .map((producer) => {
      const metadata: Record<string, SupplyJson> = {
        feedstock: "Corn",
        country: "United States",
        states: [...producer.states].sort(),
        cities: [...producer.cities].sort(),
        respondents: [...producer.respondents].sort(),
      };
      return {
        name: producer.name,
        country: "United States",
        entityType: "producer",
        sourceEntityKey: producer.name,
        metadata,
        observations: [
          {
            metricKey: "capacityMl",
            metricLabel: "Nameplate capacity",
            value: Number(producer.capacityMlY.toFixed(3)),
            unit: "million litres per year",
            reportingYear,
            basis:
              "Aggregated from EIA plant-level annual fuel ethanol capacity in million gallons per year and converted to million litres.",
            estimated: false,
            confidence: "reported",
            sourceUrl,
            raw: {
              capacityMmGalY: Number((producer.capacityMlY / GALLON_TO_LITRE).toFixed(3)),
              plantCount: producer.plants,
            },
          },
          {
            metricKey: "plants",
            metricLabel: "Plants",
            value: producer.plants,
            unit: "operating production facilities",
            reportingYear,
            basis: "Count of EIA-listed operating U.S. fuel ethanol production plants.",
            estimated: false,
            confidence: "reported",
            sourceUrl,
            raw: {
              plantRows: producer.plantRows.map((plant) => ({
                state: plant.state,
                city: plant.city,
                respondent: plant.respondent,
                capacityMmGalY: plant.capacityMmGalY,
              })),
            },
          },
        ],
      };
    });
}

async function parse(source: SupplySourceRegistryEntry): Promise<ParsedSupplyDataset> {
  const html = await fetchText(source.url);
  const workbookUrl = findWorkbookUrl(source.url, html);
  const buffer = await fetchArrayBuffer(workbookUrl);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const plantRows = parseWorkbook(workbook);
  const reportingYear = source.year;

  return {
    datasetId: DATASET_ID,
    sourceUrl: workbookUrl,
    reportingYear,
    rowsSeen: plantRows.length,
    entities: aggregate(plantRows, workbookUrl, reportingYear),
    metadata: {
      sourcePage: source.url,
      workbookUrl,
      parserId: PARSER_ID,
    },
  };
}

export const ethanolEiaCapacityParser: SupplyParser = {
  id: PARSER_ID,
  datasetId: DATASET_ID,
  parse,
};
