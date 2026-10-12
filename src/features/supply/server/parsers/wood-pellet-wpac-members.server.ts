import type { ParsedSupplyDataset, ParsedSupplyEntity, SupplySourceRegistryEntry } from "../../contracts";
import type { SupplyParser } from "./types";

const DATASET_ID = "wood-pellets";
const PARSER_ID = "wood-pellet-wpac-members";
const FETCH_TIMEOUT_MS = 30_000;
const MEMBERS_URL = "https://pellet.org/members/";

type MemberRow = {
  name: string;
  contact: string | null;
  phone: string | null;
  website: string | null;
};

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#038;/g, "&")
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

function firstMatch(value: string, pattern: RegExp): string | null {
  const match = value.match(pattern);
  return match?.[1] ? text(match[1]) : null;
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

function parseMembers(html: string): MemberRow[] {
  const producingSection =
    html.match(/CATEGORY A:\s*PRODUCING MEMBERS([\s\S]*?)(?:become a member|<\/section>)/i)?.[1] ??
    html;
  const chunks = producingSection.split(/<div class=["']member["']>/i).slice(1);
  const rows = new Map<string, MemberRow>();

  for (const chunk of chunks) {
    const name = firstMatch(chunk, /<p[^>]*class=["']company["'][^>]*>([\s\S]*?)<\/p>/i);
    if (!name) continue;
    const website = chunk.match(/<a[^>]+href=["'](https?:\/\/[^"']+)["']/i)?.[1] ?? null;
    const contact = firstMatch(chunk, /<p[^>]*class=["']name["'][^>]*>([\s\S]*?)<\/p>/i);
    const phone = firstMatch(chunk, /<p[^>]*class=["']phone["'][^>]*>([\s\S]*?)<\/p>/i);

    rows.set(name, { name, contact, phone, website });
  }

  return [...rows.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function toEntity(row: MemberRow, reportingYear: number): ParsedSupplyEntity {
  return {
    name: row.name,
    country: "Canada",
    entityType: "producer",
    sourceEntityKey: `wpac:${row.name}`,
    metadata: {
      contact: row.contact,
      phone: row.phone,
      website: row.website,
      feedstock: "Wood pellets",
      sourceKind: "WPAC producing member directory",
    },
    observations: [
      {
        metricKey: "producerListed",
        metricLabel: "Listed producing member",
        value: 1,
        unit: "listed producer",
        reportingYear,
        basis:
          "Entity appears in the Wood Pellet Association of Canada Category A producing members directory.",
        estimated: false,
        confidence: "reported",
        sourceUrl: MEMBERS_URL,
        raw: { contact: row.contact, phone: row.phone, website: row.website },
      },
    ],
  };
}

async function parse(source: SupplySourceRegistryEntry): Promise<ParsedSupplyDataset> {
  const html = await fetchText(MEMBERS_URL);
  const rows = parseMembers(html);
  const reportingYear = source.year;

  return {
    datasetId: DATASET_ID,
    sourceUrl: MEMBERS_URL,
    reportingYear,
    rowsSeen: rows.length,
    entities: rows.map((row) => toEntity(row, reportingYear)),
    metadata: {
      parserId: PARSER_ID,
      sourceLandingPage: source.url,
      memberDirectoryUrl: MEMBERS_URL,
      listedProducingMembers: rows.length,
    },
  };
}

export const woodPelletWpacMembersParser: SupplyParser = {
  id: PARSER_ID,
  datasetId: DATASET_ID,
  parse,
};
