import type { ParsedSupplyDataset, ParsedSupplyEntity, SupplySourceRegistryEntry } from "../../contracts";
import type { SupplyParser } from "./types";

const PARSER_ID = "supply-source-page-snapshot";
const FETCH_TIMEOUT_MS = 20_000;
const MAX_SNIPPET_CHARS = 1400;

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

function pageTitle(body: string): string | null {
  const match = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1] ? text(match[1]) : null;
}

async function fetchSnapshot(url: string): Promise<{
  ok: boolean;
  status: number | null;
  contentType: string | null;
  contentLength: number | null;
  title: string | null;
  snippet: string | null;
  error: string | null;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "GlobalBioenergyWatch/1.0 (+supply ingestion)",
        range: "bytes=0-65535",
      },
    });
    const contentType = res.headers.get("content-type");
    const lengthHeader = res.headers.get("content-length");
    const contentLength = lengthHeader ? Number(lengthHeader) : null;
    const body = contentType?.includes("text/html") ? await res.text() : "";

    return {
      ok: res.ok,
      status: res.status,
      contentType,
      contentLength: Number.isFinite(contentLength) ? contentLength : null,
      title: body ? pageTitle(body) : null,
      snippet: body ? text(body).slice(0, MAX_SNIPPET_CHARS) : null,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      contentType: null,
      contentLength: null,
      title: null,
      snippet: null,
      error:
        error instanceof Error && error.name === "AbortError"
          ? `Timed out after ${FETCH_TIMEOUT_MS / 1000}s`
          : error instanceof Error
            ? error.message
            : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function parse(source: SupplySourceRegistryEntry): Promise<ParsedSupplyDataset> {
  const snapshot = await fetchSnapshot(source.url);
  const entity: ParsedSupplyEntity = {
    name: `${source.org} source snapshot`,
    country: null,
    entityType: "source",
    sourceEntityKey: `${source.datasetId}:${source.org}:${source.url}`,
    metadata: {
      org: source.org,
      title: source.title,
      url: source.url,
      pageTitle: snapshot.title,
      contentType: snapshot.contentType,
      contentLength: snapshot.contentLength,
      snippet: snapshot.snippet,
      error: snapshot.error,
    },
    observations: [
      {
        metricKey: "sourceReachable",
        metricLabel: "Approved source reachable",
        value: snapshot.ok ? 1 : 0,
        unit: "boolean",
        reportingYear: source.year,
        basis:
          "The approved source URL was crawled by the supply ingestion system. Specialized metric extraction is handled by dedicated parsers where the source exposes structured data.",
        estimated: false,
        confidence: snapshot.ok ? "reported" : "unknown",
        sourceUrl: source.url,
        raw: snapshot,
      },
      {
        metricKey: "sourceHttpStatus",
        metricLabel: "Source HTTP status",
        value: snapshot.status,
        unit: "HTTP status",
        reportingYear: source.year,
        basis: "HTTP response status captured while crawling the approved source URL.",
        estimated: false,
        confidence: "reported",
        sourceUrl: source.url,
        raw: snapshot,
      },
    ],
  };

  return {
    datasetId: source.datasetId,
    sourceUrl: source.url,
    reportingYear: source.year,
    rowsSeen: 1,
    entities: [entity],
    metadata: {
      parserId: PARSER_ID,
      status: snapshot.status,
      contentType: snapshot.contentType,
      error: snapshot.error,
    },
  };
}

export const sourcePageSnapshotParser: SupplyParser = {
  id: PARSER_ID,
  datasetId: "*",
  parse,
};
