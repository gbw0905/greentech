import { PDFParse } from "pdf-parse";
import type {
  ParsedSupplyDataset,
  ParsedSupplyEntity,
  ParsedSupplyObservation,
  SupplySourceRegistryEntry,
} from "../../contracts";
import type { SupplyParser } from "./types";

const DATASET_ID = "carriers";
const PARSER_ID = "carriers-imo-dcs";
const FETCH_TIMEOUT_MS = 45_000;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_PDF_BYTES = 20 * 1024 * 1024;

/**
 * Only IMO hosts are fetchable by this parser. The annual fuel-consumption
 * reports live on the wwwcdn.imo.org asset host linked from the approved
 * DCS landing page; nothing else is followed.
 */
const ALLOWED_HOSTS = new Set(["www.imo.org", "imo.org", "wwwcdn.imo.org"]);

type DcsReportLink = {
  year: number;
  url: string;
};

type FleetFigures = {
  reportYear: number;
  ships: number;
  grossTonnageMt: number;
  totalFuelMt: number;
  biofuelT: number;
  methanolT: number;
  ethanolT: number;
  lngT: number;
};

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function approvedUrl(rawUrl: string, baseUrl?: string): string {
  const url = new URL(decodeHtml(rawUrl), baseUrl);
  if (url.protocol !== "https:") {
    throw new Error(`Rejected non-HTTPS carriers source URL: ${url.toString()}`);
  }
  if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error(`Rejected unapproved carriers source host: ${url.hostname}`);
  }
  return url.toString();
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
  const contentType = res.headers.get("content-type")?.toLowerCase() ?? "";
  if (
    contentType &&
    !contentType.includes("text/html") &&
    !contentType.includes("text/plain") &&
    !contentType.includes("application/xhtml")
  ) {
    throw new Error(`Unexpected carriers DCS landing-page content type: ${contentType}`);
  }
  const bytes = await responseBytes(res, MAX_HTML_BYTES, "Carriers DCS landing page");
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

/**
 * Find fuel-oil-consumption annual report links on the DCS landing page.
 * Carbon-intensity reports and the truncated/broken hrefs SharePoint
 * sometimes emits (literal "..." in the URL) are excluded so a malformed
 * link can never be followed or parsed.
 */
function findReportLinks(landingUrl: string, html: string): DcsReportLink[] {
  const anchors = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const links: DcsReportLink[] = [];
  for (const anchor of anchors) {
    const href = decodeHtml(anchor[1] ?? "");
    const text = decodeHtml(anchor[2] ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const yearMatch = text.match(/reporting year:?\s*(20\d\d)/i);
    if (!yearMatch?.[1]) continue;
    if (!/\.pdf(\?|$)/i.test(href)) continue;
    // Carbon-intensity companion reports are a different dataset. The 2023
    // companion hides behind a SharePoint dedup suffix ("(1).pdf") with no
    // carbon-intensity marker in its name, so suffixed basenames are out.
    if (/carbon intensity/i.test(href) || /carbon intensity/i.test(text)) continue;
    if (/\(\d+\)\.pdf(\?|$)/i.test(href)) continue;
    // Fuel-consumption reports either name the dataset or use the exact
    // "Reporting year YYYY.pdf" basename convention.
    const basename = href.split(/[?#]/)[0]?.split("/").at(-1) ?? "";
    const namesDataset =
      /fuel/i.test(href) || /^reporting year 20\d\d\.pdf$/i.test(basename);
    if (!namesDataset) continue;
    // SharePoint-truncated hrefs are broken on the source page itself.
    if (href.includes("...") || href.includes("…")) continue;
    let url: string;
    try {
      url = approvedUrl(href, landingUrl);
    } catch {
      continue;
    }
    if (!url.toLowerCase().endsWith(".pdf")) continue;
    links.push({ year: Number(yearMatch[1]), url });
  }
  return links.sort((a, b) => a.year - b.year);
}

async function responseBytes(res: Response, maxBytes: number, label: string): Promise<Uint8Array> {
  const declared = res.headers.get("content-length");
  if (declared !== null && Number(declared) > maxBytes) {
    throw new Error(
      `${label} declares ${declared} bytes, above the ${Math.round(maxBytes / 1024 / 1024)} MB guard.`,
    );
  }
  if (!res.body) {
    const buffer = new Uint8Array(await res.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > maxBytes) {
      throw new Error(`${label} is empty or exceeds the size guard.`);
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
      throw new Error(
        `${label} exceeds ${Math.round(maxBytes / 1024 / 1024)} MB while downloading.`,
      );
    }
    chunks.push(chunk);
  }
  const buffer = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  if (buffer.byteLength === 0) throw new Error(`${label} was empty.`);
  return buffer;
}

async function extractPdfText(pdfUrl: string): Promise<string> {
  const safePdfUrl = approvedUrl(pdfUrl);
  const res = await fetchWithTimeout(safePdfUrl);
  if (!res.ok) throw new Error(`Failed to fetch ${pdfUrl}: ${res.status}`);
  const contentType = res.headers.get("content-type")?.toLowerCase() ?? "";
  const looksLikePdf = new URL(safePdfUrl).pathname.toLowerCase().endsWith(".pdf");
  if (
    contentType &&
    !contentType.includes("application/pdf") &&
    !contentType.includes("application/octet-stream") &&
    !looksLikePdf
  ) {
    throw new Error(`Unexpected carriers DCS PDF content type: ${contentType}`);
  }
  const data = await responseBytes(res, MAX_PDF_BYTES, "Carriers DCS PDF");
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return result.pages
      .map((page) => page.text)
      .join("\n")
      .replace(/ | | /g, " ");
  } finally {
    await parser.destroy();
  }
}

function toNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const parsed = Number(raw.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function requiredFigure(
  fullText: string,
  pattern: RegExp,
  label: string,
  min: number,
  max: number,
): number {
  const value = toNumber(fullText.match(pattern)?.[1]);
  if (value === null || value < min || value > max) {
    throw new Error(
      `IMO DCS report figure '${label}' missing or out of range ` +
        `(got '${fullText.match(pattern)?.[1] ?? "no match"}'). The source layout may have changed.`,
    );
  }
  return value;
}

/**
 * Every figure below is explicitly stated in the IMO Secretariat's annual
 * fuel-oil-consumption summary. Bounds are sanity guards so a misparsed
 * number fails loudly instead of entering the dataset.
 */
function parseFleetFigures(fullText: string, reportYear: number): FleetFigures {
  return {
    reportYear,
    ships: requiredFigure(fullText, /aforementioned\s+([\d,]+)\s+ships/i, "ships", 10_000, 60_000),
    grossTonnageMt: requiredFigure(
      fullText,
      /combined gross tonnage of\s+([\d,]+)\s+million/i,
      "gross tonnage",
      500,
      2_500,
    ),
    totalFuelMt: requiredFigure(
      fullText,
      /([\d,.]+)\s+million tonnes of fuel/i,
      "total fuel",
      100,
      400,
    ),
    biofuelT: requiredFigure(
      fullText,
      /([\d,]+)\s+tonnes of Biofuel, reported under Other/i,
      "biofuel",
      10_000,
      20_000_000,
    ),
    methanolT: requiredFigure(
      fullText,
      /([\d,]+)\s+tonnes of Methanol/i,
      "methanol",
      1_000,
      5_000_000,
    ),
    ethanolT: requiredFigure(
      fullText,
      /([\d,]+)\s+tonnes of Ethanol/i,
      "ethanol",
      100,
      1_000_000,
    ),
    lngT: requiredFigure(fullText, /([\d,]+)\s+tonnes of LNG/i, "LNG", 1_000_000, 50_000_000),
  };
}

function observation(
  metricKey: string,
  metricLabel: string,
  value: number,
  unit: string,
  reportingYear: number,
  basis: string,
  estimated: boolean,
  confidence: ParsedSupplyObservation["confidence"],
  sourceUrl: string,
  raw: FleetFigures,
): ParsedSupplyObservation {
  return {
    metricKey,
    metricLabel,
    value,
    unit,
    reportingYear,
    basis,
    estimated,
    confidence,
    sourceUrl,
    raw: raw as unknown as ParsedSupplyObservation["raw"],
  };
}

function toEntity(figures: FleetFigures, sourceUrl: string): ParsedSupplyEntity {
  const biofuelKtY = Number((figures.biofuelT / 1000).toFixed(3));
  const biofuelSharePct = Number(((figures.biofuelT / (figures.totalFuelMt * 1_000_000)) * 100).toFixed(3));
  const reportRef = `IMO DCS annual fuel-oil-consumption summary, reporting year ${figures.reportYear}`;
  return {
    name: "International shipping fleet — biofuel consumption (IMO DCS)",
    country: null,
    entityType: "market",
    sourceEntityKey: `imo-dcs-fleet-biofuel:${figures.reportYear}`,
    metadata: {
      role: "Global fleet market",
      ships: figures.ships,
      grossTonnageMt: figures.grossTonnageMt,
      feedstock: "Biofuel reported under the DCS Other fuel category, plus methanol/ethanol/LNG context",
      sourceKind: "IMO Ship Fuel Oil Consumption Database annual summary (anonymised fleet aggregate)",
      carrierSplit: "not reported by dataset; per-carrier rows remain fallback data",
    },
    observations: [
      observation(
        "biofuelVolumeKt",
        "Fleet biofuel consumption",
        biofuelKtY,
        "thousand tonnes per year",
        figures.reportYear,
        `${reportRef}: biofuel tonnes reported under the Other fuel category, converted to thousand tonnes. Fleet aggregate; no carrier split is published.`,
        false,
        "reported",
        sourceUrl,
        figures,
      ),
      observation(
        "biofuelSharePct",
        "Biofuel share of fleet fuel",
        biofuelSharePct,
        "% of fleet fuel use",
        figures.reportYear,
        `${reportRef}: reported biofuel tonnes divided by reported total fuel oil consumption, matching the dataset's share methodology. Estimated share of a reported pair, not a separately reported figure.`,
        true,
        "derived",
        sourceUrl,
        figures,
      ),
      observation(
        "methanolVolumeKt",
        "Fleet methanol consumption",
        Number((figures.methanolT / 1000).toFixed(3)),
        "thousand tonnes per year",
        figures.reportYear,
        `${reportRef}: explicitly reported methanol tonnes, converted to thousand tonnes. Includes all methanol routes, not only green methanol.`,
        false,
        "reported",
        sourceUrl,
        figures,
      ),
      observation(
        "ethanolVolumeKt",
        "Fleet ethanol consumption",
        Number((figures.ethanolT / 1000).toFixed(3)),
        "thousand tonnes per year",
        figures.reportYear,
        `${reportRef}: explicitly reported ethanol tonnes, converted to thousand tonnes.`,
        false,
        "reported",
        sourceUrl,
        figures,
      ),
      observation(
        "lngVolumeMt",
        "Fleet LNG consumption",
        Number((figures.lngT / 1_000_000).toFixed(3)),
        "million tonnes per year",
        figures.reportYear,
        `${reportRef}: explicitly reported LNG tonnes, converted to million tonnes, for fuel-mix context.`,
        false,
        "reported",
        sourceUrl,
        figures,
      ),
      observation(
        "totalFuelMt",
        "Fleet total fuel consumption",
        figures.totalFuelMt,
        "million tonnes per year",
        figures.reportYear,
        `${reportRef}: explicitly reported total fuel oil consumption, the denominator for the biofuel share.`,
        false,
        "reported",
        sourceUrl,
        figures,
      ),
    ],
  };
}

async function parse(source: SupplySourceRegistryEntry): Promise<ParsedSupplyDataset> {
  const landingHtml = await fetchText(approvedUrl(source.url));
  const links = findReportLinks(source.url, landingHtml);
  if (links.length === 0) {
    throw new Error(
      "No IMO DCS fuel-oil-consumption report links found on the DCS landing page. The source layout may have changed.",
    );
  }
  const selected = links[links.length - 1]!;
  const newestMentioned = selected.year;
  const fullText = await extractPdfText(selected.url);
  const figures = parseFleetFigures(fullText, selected.year);
  const entity = toEntity(figures, selected.url);

  return {
    datasetId: DATASET_ID,
    sourceUrl: selected.url,
    reportingYear: figures.reportYear,
    rowsSeen: entity.observations.length,
    entities: [entity],
    metadata: {
      parserId: PARSER_ID,
      sourceLandingPage: source.url,
      reportUrl: selected.url,
      reportYear: figures.reportYear,
      reportYearsFound: links.map((link) => link.year),
      newestYearMentioned: newestMentioned,
      note: "IMO DCS data is anonymised by design, so no per-carrier rows can be scraped; the fleet aggregate is ingested and carrier rows stay fallback.",
    },
  };
}

export const carriersImoDcsParser: SupplyParser = {
  id: PARSER_ID,
  datasetId: DATASET_ID,
  parse,
};
