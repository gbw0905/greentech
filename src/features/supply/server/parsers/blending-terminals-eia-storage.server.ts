import ExcelJS from "exceljs";
import type {
  ParsedSupplyDataset,
  ParsedSupplyEntity,
  ParsedSupplyObservation,
  SupplyJson,
  SupplySourceRegistryEntry,
} from "../../contracts";
import type { SupplyParser } from "./types";

const DATASET_ID = "blending-terminals";
const PARSER_ID = "blending-terminals-eia-storage";
const FETCH_TIMEOUT_MS = 45_000;
const MAX_XLSX_BYTES = 25_000_000;
/** Exact volumetric definition: 1 barrel = 42 US gallons = 158.987294928 litres. */
const KBBL_TO_KM3 = 0.158987294928;
/** Final published vintage: EIA discontinued this report after March 2024 data. */
const REPORTING_YEAR = 2024;
const DATA_VINTAGE = "2024-03-31";

const APPROVED_HOSTS = new Set(["www.eia.gov", "eia.gov", "api.eia.gov"]);
/** Canonical same-host path of the report named by the provenance entry. */
const REPORT_PATH = "/petroleum/storagecapacity/";

type CommoditySpec = {
  key: string;
  label: string;
  pattern: RegExp;
  note: string;
};

const COMMODITIES: CommoditySpec[] = [
  {
    key: "fuel-ethanol",
    label: "fuel ethanol",
    pattern: /fuel ethanol/i,
    note: "Ethanol tankage held at bulk terminals (excludes fuel-ethanol plant storage).",
  },
  {
    key: "motor-gasoline",
    label: "motor gasoline",
    pattern: /motor gasoline/i,
    note: "Finished gasoline including blending components held at bulk terminals.",
  },
  {
    key: "distillate",
    label: "distillate",
    pattern: /^distillate/i,
    note: "Distillate fuel oil tankage held at bulk terminals.",
  },
  {
    key: "jet-fuel",
    label: "jet fuel",
    pattern: /kerosene.*jet/i,
    note: "Kerosene and kerosene-type jet fuel tankage held at bulk terminals.",
  },
  {
    key: "total",
    label: "total",
    pattern: /^total$/i,
    note: "All-product working storage capacity at bulk terminals, U.S. total.",
  },
];

/**
 * Resolve a followed link against its page URL. Only HTTPS URLs on the
 * approved EIA hosts are allowed; anything else throws instead of fetching.
 */
function approvedUrl(base: string, href: string): string {
  const resolved = new URL(href, base);
  if (resolved.protocol !== "https:") {
    throw new Error(`Refusing to follow non-HTTPS link: ${href}`);
  }
  if (!APPROVED_HOSTS.has(resolved.hostname.toLowerCase())) {
    throw new Error(`Refusing to follow off-allowlist host: ${resolved.hostname}`);
  }
  return resolved.toString();
}

function approvedSameHostUrl(base: string, path: string): string {
  const baseUrl = new URL(base);
  if (!APPROVED_HOSTS.has(baseUrl.hostname.toLowerCase())) {
    throw new Error(`Approved source host is not on the allowlist: ${baseUrl.hostname}`);
  }
  return approvedUrl(`${baseUrl.protocol}//${baseUrl.host}/`, path);
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

async function responseBytes(res: Response, maxBytes: number, label: string): Promise<ArrayBuffer> {
  if (!res.body) {
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength === 0 || buffer.byteLength > maxBytes) {
      throw new Error(
        `${label} is ${buffer.byteLength} bytes; expected a non-empty file under ${maxBytes} bytes.`,
      );
    }
    return buffer;
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    const chunk = value instanceof Uint8Array ? value : new Uint8Array(value);
    total += chunk.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error(`${label} exceeded the ${maxBytes} byte guard while downloading.`);
    }
    chunks.push(chunk);
  }

  if (total === 0) {
    throw new Error(`${label} was empty.`);
  }

  const buffer = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return buffer.buffer;
}

async function fetchWorkbookBytes(url: string): Promise<ArrayBuffer> {
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const contentType = res.headers.get("content-type") ?? "";
  if (
    contentType &&
    !/spreadsheet|excel|officedocument|octet-stream/i.test(contentType)
  ) {
    throw new Error(`Unexpected content type for workbook at ${url}: ${contentType}`);
  }
  const declared = res.headers.get("content-length");
  if (declared !== null && Number(declared) > MAX_XLSX_BYTES) {
    throw new Error(
      `Workbook at ${url} declares ${declared} bytes, above the ${MAX_XLSX_BYTES} byte guard.`,
    );
  }
  return responseBytes(res, MAX_XLSX_BYTES, `Workbook at ${url}`);
}

function hrefs(html: string): string[] {
  return [...html.matchAll(/href=["']([^"']+)["']/gi)]
    .map((match) => match[1] ?? "")
    .filter(Boolean);
}

/**
 * The approved source URL is the EIA petroleum landing page, which does not
 * link the storage report directly. Prefer an explicit same-host report link
 * when present; otherwise navigate to the canonical same-host report path
 * named by the provenance entry ("bulk storage capacity reports").
 */
function findReportUrl(landingUrl: string, html: string): string {
  const direct = hrefs(html).find((href) => /storagecapacity\/?(?:["'#]|$)/i.test(href));
  if (direct) return approvedUrl(landingUrl, direct);
  return approvedSameHostUrl(landingUrl, REPORT_PATH);
}

function findWorkbookUrl(reportUrl: string, html: string): string {
  const candidates = hrefs(html).filter((href) => /\.xlsx(?:\?[^"']*)?$/i.test(href));
  const preferred =
    candidates.find((href) => /storagecapacity\.xlsx/i.test(href)) ?? candidates[0];
  if (!preferred) {
    throw new Error(
      `No XLSX workbook link found on the EIA storage capacity page at ${reportUrl}. The source layout may have changed.`,
    );
  }
  return approvedUrl(reportUrl, preferred);
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray((value as { richText?: unknown }).richText)) {
      return (value as { richText: Array<{ text?: unknown }> }).richText
        .map((part) => String(part.text ?? ""))
        .join("")
        .trim();
    }
    if ("text" in value) return String((value as { text?: unknown }).text ?? "").trim();
    if ("result" in value) return cellText((value as { result?: unknown }).result);
    return "";
  }
  return String(value).trim();
}

function numeric(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = cellText(value).replace(/,/g, "");
  if (!text || /^(not available|na|--|-|n\/a)$/i.test(text)) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

type BulkTerminalRow = {
  key: string;
  commodity: string;
  thousandBarrels: number;
  capacityKm3: number;
  note: string;
};

function parseBulkTerminalRows(workbook: ExcelJS.Workbook): BulkTerminalRow[] {
  const sheet = workbook.worksheets.find((worksheet) => /table\s*1/i.test(worksheet.name));
  if (!sheet) {
    throw new Error(
      `EIA storage workbook has no Table 1 sheet (found: ${workbook.worksheets.map((w) => w.name).join(", ") || "none"}). The source layout may have changed.`,
    );
  }
  const headText = [1, 2, 3]
    .map((row) => cellText(sheet.getRow(row).getCell(1).value))
    .join(" ");
  if (!/thousand barrels/i.test(headText)) {
    throw new Error(
      "EIA Table 1 unit marker 'Thousand Barrels' not found. The source layout may have changed.",
    );
  }

  let headerRowNumber: number | null = null;
  let usTotalCol = -1;
  for (let rowNumber = 1; rowNumber <= Math.min(sheet.rowCount, 12); rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    if (!/^commodity$/i.test(cellText(row.getCell(1).value))) continue;
    for (let col = 2; col <= sheet.columnCount; col += 1) {
      if (/^u\.s\. total$/i.test(cellText(row.getCell(col).value))) {
        headerRowNumber = rowNumber;
        usTotalCol = col;
        break;
      }
    }
    if (headerRowNumber !== null) break;
  }
  if (headerRowNumber === null || usTotalCol < 0) {
    throw new Error(
      "EIA Table 1 header with 'Commodity' and 'U.S. Total' columns not found. The source layout may have changed.",
    );
  }

  let inSection = false;
  const found = new Map<string, { commodity: string; value: number }>();
  for (let rowNumber = headerRowNumber + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const first = cellText(sheet.getRow(rowNumber).getCell(1).value);
    if (!inSection) {
      if (/^bulk terminals$/i.test(first)) inSection = true;
      continue;
    }
    if (
      !first ||
      /tank farms|strategic petroleum reserve|^source:|^eia\/|^\d+[\s.)]/i.test(first)
    ) {
      break;
    }
    const spec = COMMODITIES.find((candidate) => candidate.pattern.test(first));
    if (!spec || found.has(spec.key)) continue;
    const value = numeric(sheet.getRow(rowNumber).getCell(usTotalCol).value);
    if (value === null || value <= 0) {
      throw new Error(
        `EIA Table 1 bulk-terminal row '${first}' has no numeric U.S. Total (got '${cellText(sheet.getRow(rowNumber).getCell(usTotalCol).value)}'). The source layout may have changed.`,
      );
    }
    found.set(spec.key, { commodity: first.replace(/\s+/g, " ").trim(), value });
  }

  const missing = COMMODITIES.filter((spec) => !found.has(spec.key)).map((spec) => spec.key);
  if (missing.length > 0) {
    throw new Error(
      `EIA Table 1 bulk-terminal section is missing rows for: ${missing.join(", ")} (found: ${[...found.keys()].join(", ") || "none"}). The source layout may have changed.`,
    );
  }
  return COMMODITIES.map((spec) => {
    const row = found.get(spec.key);
    if (!row) throw new Error(`Internal error: missing parsed row for ${spec.key}.`);
    return {
      key: spec.key,
      commodity: row.commodity,
      thousandBarrels: row.value,
      capacityKm3: Number((row.value * KBBL_TO_KM3).toFixed(3)),
      note: spec.note,
    };
  });
}

const ENTITY_NAMES: Record<string, string> = {
  "fuel-ethanol": "U.S. bulk terminals — fuel ethanol storage",
  "motor-gasoline": "U.S. bulk terminals — motor gasoline storage",
  distillate: "U.S. bulk terminals — distillate storage",
  "jet-fuel": "U.S. bulk terminals — jet fuel storage",
  total: "U.S. bulk terminals — total storage",
};

function toEntity(row: BulkTerminalRow, sourceUrl: string): ParsedSupplyEntity {
  const observation: ParsedSupplyObservation = {
    metricKey: "capacityKm3",
    metricLabel: "Terminal storage capacity",
    value: row.capacityKm3,
    unit: "thousand cubic metres",
    reportingYear: REPORTING_YEAR,
    basis:
      `EIA Table 1 working storage capacity at bulk terminals (Form EIA-810) for ${row.commodity}, ` +
      `March 2024, converted from ${row.thousandBarrels.toLocaleString("en-US")} thousand barrels at the exact ` +
      `0.158987 m³ per barrel definition. This is tankage in place (a stock), not annual throughput, ` +
      `and the report was discontinued after this vintage.`,
    estimated: false,
    confidence: "reported",
    sourceUrl,
    raw: {
      commodity: row.commodity,
      facilityType: "Bulk Terminals",
      thousandBarrels: row.thousandBarrels,
      capacityKm3: row.capacityKm3,
      dataVintage: DATA_VINTAGE,
      reportStatus: "discontinued after March 2024",
    },
  };
  const metadata: Record<string, SupplyJson> = {
    country: "United States",
    note:
      `EIA working shell storage capacity at U.S. bulk terminals, March 2024 (final vintage). ` +
      `${row.note} Stock of tankage, not blended-product throughput; operator-level rows remain fallback data.`,
    facilityType: "Bulk Terminals",
    commodity: row.commodity,
    dataVintage: DATA_VINTAGE,
    sourceKind: "EIA Working and Net Available Shell Storage Capacity, Table 1",
  };
  return {
    name: ENTITY_NAMES[row.key] ?? `U.S. bulk terminals — ${row.key}`,
    country: "United States",
    entityType: "hub",
    sourceEntityKey: `eia-storage-capacity:bulk-terminals:${row.key}`,
    metadata,
    observations: [observation],
  };
}

async function parse(source: SupplySourceRegistryEntry): Promise<ParsedSupplyDataset> {
  const landingHtml = await fetchText(source.url);
  const reportUrl = findReportUrl(source.url, landingHtml);
  const reportHtml = await fetchText(reportUrl);
  // Note: EIA states this report is discontinued after the March 2024 vintage.
  // The final workbook remains published, so parsing continues; the vintage is
  // recorded in observation basis text and dataset metadata for transparency.
  const workbookUrl = findWorkbookUrl(reportUrl, reportHtml);
  const bytes = await fetchWorkbookBytes(workbookUrl);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  const rows = parseBulkTerminalRows(workbook);

  return {
    datasetId: DATASET_ID,
    sourceUrl: workbookUrl,
    reportingYear: REPORTING_YEAR,
    rowsSeen: rows.length,
    entities: rows.map((row) => toEntity(row, workbookUrl)),
    metadata: {
      parserId: PARSER_ID,
      sourceLandingPage: source.url,
      reportUrl,
      workbookUrl,
      dataVintage: DATA_VINTAGE,
      reportStatus: "discontinued after March 2024 vintage",
      commodities: rows.map((row) => row.key),
    },
  };
}

export const blendingTerminalsEiaStorageParser: SupplyParser = {
  id: PARSER_ID,
  datasetId: DATASET_ID,
  parse,
};
