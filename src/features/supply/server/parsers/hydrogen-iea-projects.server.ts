import ExcelJS from "exceljs";
import type {
  ParsedSupplyDataset,
  ParsedSupplyEntity,
  ParsedSupplyObservation,
  SupplyJson,
  SupplySourceRegistryEntry,
} from "../../contracts";
import type { SupplyParser } from "./types";

const DATASET_ID = "renewable-hydrogen";
const PARSER_ID = "hydrogen-iea-projects";
const FETCH_TIMEOUT_MS = 45_000;

type ProjectRow = {
  name: string;
  company: string | null;
  country: string | null;
  status: string | null;
  technology: string | null;
  product: string | null;
  startYear: number | null;
  capacityKtY: number | null;
  electrolyserMw: number | null;
  raw: Record<string, string>;
};

type HeaderMap = Map<number, string>;

function decodeHtml(value: string): string {
  return value
    .replace(/\\u002F/g, "/")
    .replace(/\\u0026/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&#038;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return String(value.getFullYear());
  if (typeof value === "object") {
    if ("text" in value) return String((value as { text?: unknown }).text ?? "").trim();
    if ("richText" in value && Array.isArray((value as { richText?: unknown }).richText)) {
      return (value as { richText: Array<{ text?: unknown }> }).richText
        .map((part) => String(part.text ?? ""))
        .join("")
        .trim();
    }
    if ("result" in value) return text((value as { result?: unknown }).result);
  }
  return String(value).replace(/\s+/g, " ").trim();
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/co2/g, "co two")
    .replace(/h2/g, "h two")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function numeric(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = text(value).replace(/,/g, "");
  const match = raw.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
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
  const decoded = decodeHtml(html);
  const candidates = [
    ...decoded.matchAll(/(?:href|src|data-url)=["']([^"']+\.(?:xlsx|xls)(?:\?[^"']*)?)["']/gi),
    ...decoded.matchAll(/["'](https?:\/\/[^"']+\.(?:xlsx|xls)(?:\?[^"']*)?)["']/gi),
  ]
    .map((match) => match[1])
    .filter((url): url is string => Boolean(url))
    .map((url) => new URL(url, sourceUrl).toString());

  const hydrogenWorkbook = candidates.find((url) => /hydrogen|h2|project/i.test(url));
  const workbookUrl = hydrogenWorkbook ?? candidates[0];
  if (!workbookUrl) {
    throw new Error(
      "No XLS/XLSX workbook link found on the IEA hydrogen projects page. The IEA data-product download may require a gated browser flow.",
    );
  }
  return workbookUrl;
}

function headerText(row: ExcelJS.Row, column: number): string {
  return normalize(text(row.getCell(column).value));
}

function findHeaderRow(worksheet: ExcelJS.Worksheet): number | null {
  const maxRow = Math.min(worksheet.rowCount, 60);
  for (let rowNumber = 1; rowNumber <= maxRow; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const headers = Array.from({ length: worksheet.columnCount }, (_, index) =>
      headerText(row, index + 1),
    ).filter(Boolean);
    const joined = headers.join(" ");
    const hasProject = /\bproject\b/.test(joined) || /\bname\b/.test(joined);
    const hasCountry = /\bcountry\b/.test(joined);
    const hasStatusOrCapacity =
      /\bstatus\b/.test(joined) || /\bcapacity\b|\bannounced size\b/.test(joined);
    if (hasProject && hasCountry && hasStatusOrCapacity) return rowNumber;
  }
  return null;
}

function headersFor(row: ExcelJS.Row, columnCount: number): HeaderMap {
  const headers: HeaderMap = new Map();
  for (let column = 1; column <= columnCount; column += 1) {
    const header = headerText(row, column);
    if (header) headers.set(column, header);
  }
  return headers;
}

function rawRecord(row: ExcelJS.Row, headers: HeaderMap): Record<string, string> {
  const record: Record<string, string> = {};
  for (const [column, header] of headers.entries()) {
    const value = text(row.getCell(column).value);
    if (value) record[header] = value;
  }
  return record;
}

function valueFor(record: Record<string, string>, patterns: RegExp[]): string | null {
  for (const [key, value] of Object.entries(record)) {
    if (patterns.some((pattern) => pattern.test(key)) && value) return value;
  }
  return null;
}

function numberFor(record: Record<string, string>, patterns: RegExp[]): number | null {
  const value = valueFor(record, patterns);
  return value ? numeric(value) : null;
}

function capacityKtY(record: Record<string, string>): number | null {
  const annualKt = numberFor(record, [
    /\bkt\b.*\bh two\b.*\b(?:y|year|annum)\b/,
    /\bthousand\b.*\btonnes\b.*\bh two\b/,
    /\bcapacity\b.*\bkt\b/,
  ]);
  if (annualKt !== null) return annualKt;

  const tonnesPerYear = numberFor(record, [
    /\btonnes?\b.*\bh two\b.*\b(?:y|year|annum)\b/,
    /\bt\s*h two\b.*\b(?:y|year|annum)\b/,
  ]);
  if (tonnesPerYear !== null) return tonnesPerYear / 1000;

  const kgPerHour = numberFor(record, [
    /\bkg\b.*\bh two\b.*\b(?:h|hour)\b/,
    /\bnormal(?:i|)s?ed\b.*\bcapacity\b/,
  ]);
  if (kgPerHour !== null) return (kgPerHour * 8760) / 1_000_000;

  const announced = valueFor(record, [/\bannounced\b.*\bsize\b/, /\bproduction\b.*\bcapacity\b/]);
  if (!announced) return null;
  const amount = numeric(announced);
  if (amount === null) return null;
  if (/\bkt\b|\bkta\b|\bthousand tonnes\b/i.test(announced)) return amount;
  if (/\btonnes?\b|\btpa\b/i.test(announced)) return amount / 1000;
  if (/\bkg\b.*\/?\s*h/i.test(announced)) return (amount * 8760) / 1_000_000;
  return null;
}

function electrolyserMw(record: Record<string, string>): number | null {
  const explicit = numberFor(record, [
    /\belectrolys(?:er|is|zer)\b.*\bmw\b/,
    /\bmw\b.*\belectrolys(?:er|is|zer)\b/,
    /\bpower\b.*\bmw\b/,
  ]);
  if (explicit !== null) return explicit;

  const announced = valueFor(record, [/\bannounced\b.*\bsize\b/, /\bcapacity\b/]);
  if (!announced || !/\bmw\b/i.test(announced)) return null;
  return numeric(announced);
}

function yearFrom(record: Record<string, string>): number | null {
  const raw = valueFor(record, [
    /\bdate\b.*\bcommission/i,
    /\bstart\b.*\byear\b/i,
    /\bcommission/i,
    /\boperation/i,
  ]);
  const year = raw?.match(/\b(19|20)\d{2}\b/)?.[0];
  return year ? Number(year) : null;
}

function projectFromRecord(record: Record<string, string>): ProjectRow | null {
  const name = valueFor(record, [/\bproject\b.*\bname\b/, /^project$/, /^name$/]);
  if (!name) return null;

  const capacity = capacityKtY(record);
  const electrolyser = electrolyserMw(record);
  if (capacity === null && electrolyser === null) return null;

  return {
    name,
    company:
      valueFor(record, [
        /\bcompany\b/,
        /\boperator\b/,
        /\bowner\b/,
        /\bsponsor\b/,
        /\bdeveloper\b/,
      ]) ?? null,
    country: valueFor(record, [/\bcountry\b/]),
    status: valueFor(record, [/\bstatus\b/]),
    technology: valueFor(record, [/\btechnology\b/, /\bprocess\b/]),
    product: valueFor(record, [/\bproduct\b/, /\bend use\b/]),
    startYear: yearFrom(record),
    capacityKtY: capacity === null ? null : Number(capacity.toFixed(3)),
    electrolyserMw: electrolyser === null ? null : Number(electrolyser.toFixed(3)),
    raw: record,
  };
}

function parseWorksheet(worksheet: ExcelJS.Worksheet): ProjectRow[] {
  const headerRowNumber = findHeaderRow(worksheet);
  if (!headerRowNumber) return [];

  const headers = headersFor(worksheet.getRow(headerRowNumber), worksheet.columnCount);
  const rows: ProjectRow[] = [];

  for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const record = rawRecord(row, headers);
    const project = projectFromRecord(record);
    if (project) rows.push(project);
  }

  return rows;
}

function observation(
  metricKey: string,
  metricLabel: string,
  value: number,
  unit: string,
  basis: string,
  sourceUrl: string,
  reportingYear: number | null,
  raw: SupplyJson,
): ParsedSupplyObservation {
  return {
    metricKey,
    metricLabel,
    value,
    unit,
    reportingYear,
    basis,
    estimated: false,
    confidence: "reported",
    sourceUrl,
    raw,
  };
}

function toEntity(
  row: ProjectRow,
  sourceUrl: string,
  fallbackYear: number | null,
): ParsedSupplyEntity {
  const entityName = row.company ?? row.name;
  const reportingYear = row.startYear ?? fallbackYear;
  const observations: ParsedSupplyObservation[] = [];

  if (row.capacityKtY !== null) {
    observations.push(
      observation(
        "capacityKtY",
        "Hydrogen production capacity",
        row.capacityKtY,
        "thousand tonnes per year",
        "Reported IEA project capacity normalized to annual hydrogen output where the workbook exposes an output capacity field.",
        sourceUrl,
        reportingYear,
        row.raw,
      ),
    );
  }

  if (row.electrolyserMw !== null) {
    observations.push(
      observation(
        "electrolyserMw",
        "Electrolyser capacity",
        row.electrolyserMw,
        "megawatts",
        "Reported IEA project electrolyser or announced power capacity.",
        sourceUrl,
        reportingYear,
        row.raw,
      ),
    );
  }

  return {
    name: entityName,
    country: row.country,
    entityType: "producer",
    sourceEntityKey: `iea-hydrogen:${entityName}:${row.name}`,
    metadata: {
      projectName: row.name,
      status: row.status,
      technology: row.technology,
      product: row.product,
      sourceKind: "IEA Hydrogen Production and Infrastructure Projects Database",
    },
    observations,
  };
}

function parseWorkbook(workbook: ExcelJS.Workbook): ProjectRow[] {
  const rows = workbook.worksheets.flatMap((worksheet) => parseWorksheet(worksheet));
  const unique = new Map<string, ProjectRow>();
  for (const row of rows) {
    const key = `${row.name}|${row.company ?? ""}|${row.country ?? ""}`;
    if (!unique.has(key)) unique.set(key, row);
  }
  return [...unique.values()];
}

async function parse(source: SupplySourceRegistryEntry): Promise<ParsedSupplyDataset> {
  const html = await fetchText(source.url);
  const workbookUrl = findWorkbookUrl(source.url, html);
  const buffer = await fetchArrayBuffer(workbookUrl);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const projectRows = parseWorkbook(workbook);
  const reportingYear = source.year;

  return {
    datasetId: DATASET_ID,
    sourceUrl: workbookUrl,
    reportingYear,
    rowsSeen: projectRows.length,
    entities: projectRows.map((row) => toEntity(row, workbookUrl, reportingYear)),
    metadata: {
      parserId: PARSER_ID,
      sourceLandingPage: source.url,
      workbookUrl,
      parsedWorksheets: workbook.worksheets.map((worksheet) => worksheet.name),
    },
  };
}

export const hydrogenIeaProjectsParser: SupplyParser = {
  id: PARSER_ID,
  datasetId: DATASET_ID,
  parse,
};
