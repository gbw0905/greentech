import type {
  ParsedSupplyDataset,
  ParsedSupplyEntity,
  ParsedSupplyObservation,
  SupplyJson,
  SupplySourceRegistryEntry,
} from "../../contracts";
import type { SupplyParser } from "./types";

const DATASET_ID = "renewable-lpg";
const PARSER_ID = "renewable-lpg-lge-outlook";
const FETCH_TIMEOUT_MS = 30_000;
const OUTLOOK_URL =
  "https://www.liquidgaseurope.eu/resource/outlook-for-the-production-of-renewable-liquid-gases-in-2040-and-2050/";

type OutlookFacts = {
  targetYear: number;
  potentialKtY: number | null;
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

function text(value: string): string {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function parseFacts(pageText: string): OutlookFacts {
  const match =
    pageText.match(
      /produce\s+up\s+to\s+([\d.]+)\s+million\s+tonnes\s+of\s+renewable\s+liquid\s+gas\s+annually\s+by\s+(20\d{2})/i,
    ) ??
    pageText.match(
      /([\d.]+)\s+million\s+tonnes\s+of\s+renewable\s+liquid\s+gas[^.]{0,120}?(20\d{2})/i,
    );
  const amount = match?.[1] ? Number(match[1]) : null;
  const targetYear = match?.[2] ? Number(match[2]) : 2050;

  return {
    targetYear,
    potentialKtY: amount === null || !Number.isFinite(amount) ? null : Number((amount * 1000).toFixed(3)),
  };
}

function observation(
  metricKey: string,
  metricLabel: string,
  value: number,
  unit: string,
  reportingYear: number,
  basis: string,
  sourceUrl: string,
  raw: SupplyJson,
): ParsedSupplyObservation {
  return {
    metricKey,
    metricLabel,
    value,
    unit,
    reportingYear,
    basis,
    estimated: true,
    confidence: "estimated",
    sourceUrl,
    raw,
  };
}

function toEntity(facts: OutlookFacts, sourceUrl: string): ParsedSupplyEntity | null {
  if (facts.potentialKtY === null) return null;
  return {
    name: "European renewable liquid gas outlook",
    country: "Europe",
    entityType: "market-outlook",
    sourceEntityKey: "liquid-gas-europe-renewable-liquid-gas-outlook",
    metadata: {
      sourceKind: "Liquid Gas Europe outlook",
      note: "Market potential scenario; not a supplier-level production row.",
    },
    observations: [
      observation(
        "renewableLiquidGasPotentialKtY",
        "Renewable liquid gas production potential",
        facts.potentialKtY,
        "thousand tonnes per year",
        facts.targetYear,
        "Liquid Gas Europe outlook scenario for annual European renewable liquid gas production potential.",
        sourceUrl,
        facts,
      ),
    ],
  };
}

async function parse(source: SupplySourceRegistryEntry): Promise<ParsedSupplyDataset> {
  const sourceHtml = await fetchText(source.url);
  const resourceUrl =
    [...sourceHtml.matchAll(/href=["']([^"']*renewable-liquid-gases-in-2040-and-2050[^"']*)["']/gi)]
      .map((match) => new URL(decodeHtml(match[1]), source.url).toString())
      .at(0) ?? OUTLOOK_URL;
  const html = resourceUrl === source.url ? sourceHtml : await fetchText(resourceUrl);
  const facts = parseFacts(text(html));
  const entity = toEntity(facts, resourceUrl);

  return {
    datasetId: DATASET_ID,
    sourceUrl: resourceUrl,
    reportingYear: facts.targetYear,
    rowsSeen: entity ? 1 : 0,
    entities: entity ? [entity] : [],
    metadata: {
      parserId: PARSER_ID,
      sourceLandingPage: source.url,
      resourceUrl,
      facts,
    },
  };
}

export const renewableLpgLgeOutlookParser: SupplyParser = {
  id: PARSER_ID,
  datasetId: DATASET_ID,
  parse,
};
