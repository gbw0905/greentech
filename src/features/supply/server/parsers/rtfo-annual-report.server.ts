import type {
  ParsedSupplyDataset,
  ParsedSupplyEntity,
  ParsedSupplyObservation,
  SupplyJson,
  SupplySourceRegistryEntry,
} from "../../contracts";
import type { SupplyParser } from "./types";

const PARSER_ID = "rtfo-annual-report";
const FETCH_TIMEOUT_MS = 30_000;

type ReportMetric = {
  reportingYear: number;
  totalRenewableFuelMl: number | null;
  ucoOrigin: string | null;
  ucoVolumeMl: number | null;
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

function parseNumber(value: string): number {
  return Number(value.replace(/,/g, ""));
}

function toMillionLitres(amount: number, unit: string): number {
  return /billion/i.test(unit) ? amount * 1000 : amount;
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

function latestReportUrl(collectionUrl: string, html: string): string {
  const candidates = [...html.matchAll(/href=["']([^"']*rtfo-statistics-(20\d{2})-final-report[^"']*)["']/gi)]
    .map((match) => ({
      url: new URL(decodeHtml(match[1]), collectionUrl).toString(),
      year: Number(match[2]),
    }))
    .filter((match) => Number.isFinite(match.year))
    .sort((a, b) => b.year - a.year);

  const report = candidates.find((candidate) => /\/statistics\//i.test(candidate.url)) ?? candidates[0];
  if (!report) throw new Error("Could not find a GOV.UK RTFO final report link.");
  return report.url;
}

function parseReportMetrics(reportText: string, fallbackYear: number): ReportMetric {
  const totalMatch =
    reportText.match(
      /([\d,.]+)\s*(billion|million)\s+litres(?:\s+\(equivalent\))?\s+of\s+verified\s+renewable\s+fuel\s+supplied\s+in\s+(20\d{2})/i,
    ) ??
    reportText.match(
      /in\s+(20\d{2})[^.]{0,120}?([\d,.]+)\s*(billion|million)\s+litres(?:\s+\(equivalent\))?\s+of\s+verified\s+renewable\s+fuel/i,
    );

  const reportingYear = totalMatch
    ? Number(totalMatch[3] ?? totalMatch[1])
    : fallbackYear;
  const totalAmount = totalMatch ? parseNumber(totalMatch[1].startsWith("20") ? totalMatch[2] : totalMatch[1]) : null;
  const totalUnit = totalMatch ? (totalMatch[1].startsWith("20") ? totalMatch[3] : totalMatch[2]) : "";

  const ucoMatch = reportText.match(
    /UCO\s*\(Used cooking oil\)\s+from\s+([^()]+?)\s+\(([\d,.]+)\s*million\s+litres/i,
  );

  return {
    reportingYear,
    totalRenewableFuelMl:
      totalAmount === null || !Number.isFinite(totalAmount)
        ? null
        : Number(toMillionLitres(totalAmount, totalUnit).toFixed(3)),
    ucoOrigin: ucoMatch?.[1]?.trim() ?? null,
    ucoVolumeMl: ucoMatch?.[2] ? Number(parseNumber(ucoMatch[2]).toFixed(3)) : null,
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
    estimated: false,
    confidence: "reported",
    sourceUrl,
    raw,
  };
}

function entityFor(source: SupplySourceRegistryEntry, reportUrl: string, metrics: ReportMetric): ParsedSupplyEntity | null {
  if (source.datasetId === "fuel-stations" && metrics.totalRenewableFuelMl !== null) {
    return {
      name: "UK RTFO renewable transport fuel market",
      country: "United Kingdom",
      entityType: "market",
      sourceEntityKey: "uk-rtfo-renewable-transport-fuel-market",
      metadata: {
        sourceKind: "GOV.UK RTFO annual report",
        note: "Market aggregate; the report does not publish retailer-level station-network splits.",
      },
      observations: [
        observation(
          "renewableFuelVolumeMl",
          "Verified renewable transport fuel supplied",
          metrics.totalRenewableFuelMl,
          "million litres equivalent per year",
          metrics.reportingYear,
          "Published GOV.UK RTFO final-report total for verified renewable fuel supplied in the obligation year.",
          reportUrl,
          metrics,
        ),
      ],
    };
  }

  if (source.datasetId === "uco-suppliers" && metrics.ucoVolumeMl !== null) {
    return {
      name: `UK RTFO UCO feedstock from ${metrics.ucoOrigin ?? "reported origin"}`,
      country: "United Kingdom",
      entityType: "market",
      sourceEntityKey: `uk-rtfo-uco-${metrics.ucoOrigin ?? "reported-origin"}`,
      metadata: {
        origin: metrics.ucoOrigin,
        sourceKind: "GOV.UK RTFO annual report",
        note: "Feedstock-country aggregate; the report does not identify the collecting company.",
      },
      observations: [
        observation(
          "ucoFeedstockVolumeMl",
          "UCO feedstock volume",
          metrics.ucoVolumeMl,
          "million litres equivalent per year",
          metrics.reportingYear,
          "Published GOV.UK RTFO final-report UCO feedstock volume by origin country.",
          reportUrl,
          metrics,
        ),
      ],
    };
  }

  return null;
}

async function parse(source: SupplySourceRegistryEntry): Promise<ParsedSupplyDataset> {
  const collectionHtml = await fetchText(source.url);
  const reportUrl = /\/statistics\/.*rtfo-statistics-\d{4}-final-report/i.test(source.url)
    ? source.url
    : latestReportUrl(source.url, collectionHtml);
  const reportHtml = reportUrl === source.url ? collectionHtml : await fetchText(reportUrl);
  const metrics = parseReportMetrics(text(reportHtml), source.year);
  const entity = entityFor(source, reportUrl, metrics);

  return {
    datasetId: source.datasetId,
    sourceUrl: reportUrl,
    reportingYear: metrics.reportingYear,
    rowsSeen: entity ? 1 : 0,
    entities: entity ? [entity] : [],
    metadata: {
      parserId: PARSER_ID,
      sourceLandingPage: source.url,
      reportUrl,
      metrics,
    },
  };
}

export const rtfoAnnualReportParser: SupplyParser = {
  id: PARSER_ID,
  datasetId: "*",
  parse,
};
