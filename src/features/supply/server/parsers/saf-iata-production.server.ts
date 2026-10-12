import type {
  ParsedSupplyDataset,
  ParsedSupplyEntity,
  ParsedSupplyObservation,
  SupplyJson,
  SupplySourceRegistryEntry,
} from "../../contracts";
import type { SupplyParser } from "./types";

const DATASET_ID = "saf-airlines";
const PARSER_ID = "saf-iata-production";
const FETCH_TIMEOUT_MS = 30_000;
const SAF_DENSITY_KG_PER_LITRE = 0.789;

type SafFacts = {
  reportingYear: number;
  productionMt: number | null;
  productionMl: number | null;
  aviationFuelSharePct: number | null;
  litresEstimated: boolean;
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

function number(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSafFacts(pageText: string, fallbackYear: number): SafFacts {
  const productionMatch =
    pageText.match(
      /in\s+(20\d{2})[^.]{0,160}?SAF\s+production\s+is\s+expected\s+to\s+reach\s+(?:approximately|around)?\s*([\d.]+)\s+million\s+tonnes/i,
    ) ??
    pageText.match(
      /SAF\s+production\s+is\s+expected\s+to\s+reach\s+(?:approximately|around)?\s*([\d.]+)\s+million\s+tonnes\s+in\s+(20\d{2})/i,
    );
  const litresMatch = pageText.match(/([\d.]+)\s+billion\s+lit(?:re|er)s/i);
  const shareMatch = pageText.match(/accounting\s+for\s+([\d.]+)%\s+of\s+(?:total\s+)?(?:annual\s+)?(?:aviation|jet)\s+fuel/i);

  const firstLooksYear = productionMatch?.[1]?.startsWith("20") ?? false;
  const reportingYear = productionMatch
    ? Number(firstLooksYear ? productionMatch[1] : productionMatch[2])
    : fallbackYear;
  const productionMt = productionMatch
    ? number(firstLooksYear ? productionMatch[2] : productionMatch[1])
    : null;
  const explicitLitresMl = litresMatch?.[1] ? number(litresMatch[1]) : null;
  const derivedMl =
    productionMt === null ? null : (productionMt * 1_000_000_000) / SAF_DENSITY_KG_PER_LITRE / 1_000_000;

  return {
    reportingYear,
    productionMt,
    productionMl:
      explicitLitresMl !== null
        ? Number((explicitLitresMl * 1000).toFixed(3))
        : derivedMl === null
          ? null
          : Number(derivedMl.toFixed(3)),
    aviationFuelSharePct: shareMatch?.[1] ? number(shareMatch[1]) : null,
    litresEstimated: explicitLitresMl === null && derivedMl !== null,
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
  raw: SupplyJson,
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
    raw,
  };
}

function toEntity(facts: SafFacts, sourceUrl: string): ParsedSupplyEntity | null {
  const observations: ParsedSupplyObservation[] = [];
  if (facts.productionMl !== null) {
    observations.push(
      observation(
        "globalSafProductionMl",
        "Global SAF production",
        facts.productionMl,
        "million litres per year",
        facts.reportingYear,
        facts.litresEstimated
          ? "IATA-reported SAF production in million tonnes converted to litres using a 0.789 kg/L SAF density assumption."
          : "IATA-reported global SAF production volume in litres.",
        facts.litresEstimated,
        facts.litresEstimated ? "derived" : "reported",
        sourceUrl,
        facts,
      ),
    );
  }
  if (facts.aviationFuelSharePct !== null) {
    observations.push(
      observation(
        "globalSafSharePct",
        "SAF share of aviation fuel use",
        facts.aviationFuelSharePct,
        "% of aviation fuel use",
        facts.reportingYear,
        "IATA-reported SAF production share of total annual aviation or jet fuel consumption.",
        false,
        "reported",
        sourceUrl,
        facts,
      ),
    );
  }
  if (observations.length === 0) return null;

  return {
    name: "Global SAF production market",
    country: null,
    entityType: "market",
    sourceEntityKey: "iata-global-saf-production-market",
    metadata: {
      sourceKind: "IATA SAF production estimate",
      note: "Market aggregate; IATA does not publish airline-level uplift in this source.",
    },
    observations,
  };
}

async function parse(source: SupplySourceRegistryEntry): Promise<ParsedSupplyDataset> {
  const html = await fetchText(source.url);
  const facts = parseSafFacts(text(html), source.year);
  const entity = toEntity(facts, source.url);

  return {
    datasetId: DATASET_ID,
    sourceUrl: source.url,
    reportingYear: facts.reportingYear,
    rowsSeen: entity ? 1 : 0,
    entities: entity ? [entity] : [],
    metadata: {
      parserId: PARSER_ID,
      facts,
    },
  };
}

export const safIataProductionParser: SupplyParser = {
  id: PARSER_ID,
  datasetId: DATASET_ID,
  parse,
};
