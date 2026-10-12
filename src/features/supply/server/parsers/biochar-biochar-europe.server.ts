import type {
  ParsedSupplyDataset,
  ParsedSupplyEntity,
  SupplyJson,
  SupplySourceRegistryEntry,
} from "../../contracts";
import type { SupplyParser } from "./types";

const DATASET_ID = "biochar";
const PARSER_ID = "biochar-biochar-europe-members";
const FETCH_TIMEOUT_MS = 30_000;

type MemberRow = {
  name: string;
  country: string | null;
  city: string | null;
  businessTypes: string[];
  description: string;
  website: string | null;
  capacityT: number | null;
  feedstock: string;
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

function firstMatch(value: string, pattern: RegExp): string | null {
  const match = value.match(pattern);
  return match?.[1] ? text(match[1]) : null;
}

function numeric(value: string): number | null {
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function capacityFromText(value: string): number | null {
  const patterns = [
    /installed capacity of\s+([0-9][0-9.,]*)\s*(?:metric\s+)?(?:tonnes|tons|t)\s+per\s+year/i,
    /capacity of\s+([0-9][0-9.,]*)\s*(?:metric\s+)?(?:tonnes|tons|t)\s+per\s+year/i,
    /([0-9][0-9.,]*)\s*(?:metric\s+)?(?:tonnes|tons|t)\s+(?:of\s+)?(?:biochar\s+)?(?:per\s+year|annually|annual)/i,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return numeric(match[1]);
  }
  return null;
}

function feedstockFromText(value: string): string {
  const lower = value.toLowerCase();
  if (lower.includes("sewage") || lower.includes("sludge") || lower.includes("biosolid")) {
    return "Sewage sludge";
  }
  if (lower.includes("forest") || lower.includes("wood") || lower.includes("sawmill")) {
    return "Woody biomass";
  }
  if (lower.includes("straw") || lower.includes("crop") || lower.includes("agri")) {
    return "Agricultural residues";
  }
  if (lower.includes("green waste") || lower.includes("organic waste")) {
    return "Organic waste";
  }
  return "Biochar feedstock";
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
  const chunks = html.split(/collection-item w-dyn-item/);
  const rows = new Map<string, MemberRow>();

  for (const chunk of chunks) {
    const name = firstMatch(chunk, /<h3[^>]*class=["'][^"']*member-name[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i);
    if (!name) continue;

    const country = firstMatch(
      chunk,
      /fs-cmsfilter-field=["']country["'][^>]*>([\s\S]*?)<\/div>/i,
    );
    const city = firstMatch(chunk, /fs-cmsfilter-field=["']city["'][^>]*>([\s\S]*?)<\/div>/i);
    const websiteMatch = chunk.match(/href=["'](https?:\/\/[^"']+)["'][^>]*>\s*Website\s*</i);
    const wholeText = text(chunk);
    const businessTypes = [
      ...new Set(
        [...chunk.matchAll(/fs-cmsfilter-field=["']business["'][^>]*>([\s\S]*?)<\/div>/gi)]
          .map((match) => text(match[1] ?? ""))
          .filter(Boolean),
      ),
    ];
    const capacityT = capacityFromText(wholeText);

    const row: MemberRow = {
      name,
      country,
      city,
      businessTypes,
      description: wholeText.slice(0, 1200),
      website: websiteMatch?.[1] ?? null,
      capacityT,
      feedstock: feedstockFromText(wholeText),
    };
    rows.set(`${name}|${country ?? ""}|${city ?? ""}`, row);
  }

  return [...rows.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function toEntity(row: MemberRow, sourceUrl: string, reportingYear: number): ParsedSupplyEntity {
  const metadata: Record<string, SupplyJson> = {
    city: row.city,
    country: row.country,
    businessTypes: row.businessTypes,
    website: row.website,
    feedstock: row.feedstock,
    description: row.description,
    capacitySource: row.capacityT === null ? "not stated" : "stated in source text",
  };

  return {
    name: row.name,
    country: row.country,
    entityType: row.businessTypes.includes("Plant Operator") ? "producer" : "member",
    sourceEntityKey: `${row.name}|${row.country ?? ""}|${row.city ?? ""}`,
    metadata,
    observations: [
      {
        metricKey: "memberListed",
        metricLabel: "Listed in Biochar Europe member directory",
        value: 1,
        unit: "listed member",
        reportingYear,
        basis: "Entity listed in the public Biochar Europe member directory.",
        estimated: false,
        confidence: "reported",
        sourceUrl,
        raw: { businessTypes: row.businessTypes, city: row.city },
      },
      ...(row.capacityT
        ? [
            {
              metricKey: "capacityT",
              metricLabel: "Biochar capacity",
              value: row.capacityT,
              unit: "tonnes per year",
              reportingYear,
              basis: "Capacity value explicitly stated in the Biochar Europe member profile text.",
              estimated: false,
              confidence: "reported" as const,
              sourceUrl,
              raw: { description: row.description },
            },
            {
              metricKey: "co2RemovalT",
              metricLabel: "Durable CO2 removal",
              value: row.capacityT * 2,
              unit: "tonnes CO2e per year",
              reportingYear,
              basis:
                "Estimated at 2 tonnes CO2e per tonne of biochar because the member directory states capacity but not issued removals.",
              estimated: true,
              confidence: "estimated" as const,
              sourceUrl,
              raw: { capacityT: row.capacityT },
            },
          ]
        : []),
    ],
  };
}

async function parse(source: SupplySourceRegistryEntry): Promise<ParsedSupplyDataset> {
  const html = await fetchText(source.url);
  const rows = parseMembers(html);
  const reportingYear = source.year;

  return {
    datasetId: DATASET_ID,
    sourceUrl: source.url,
    reportingYear,
    rowsSeen: rows.length,
    entities: rows.map((row) => toEntity(row, source.url, reportingYear)),
    metadata: {
      parserId: PARSER_ID,
      capacityRows: rows.filter((row) => row.capacityT !== null).length,
    },
  };
}

export const biocharBiocharEuropeParser: SupplyParser = {
  id: PARSER_ID,
  datasetId: DATASET_ID,
  parse,
};
