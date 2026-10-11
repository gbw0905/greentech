import { PDFParse } from "pdf-parse";
import type {
  ParsedSupplyDataset,
  ParsedSupplyEntity,
  ParsedSupplyObservation,
  SupplyJson,
  SupplySourceRegistryEntry,
} from "../../contracts";
import type { SupplyParser } from "./types";

const DATASET_ID = "bio-methanol";
const PARSER_ID = "bio-methanol-mi-irena-outlook";
const FETCH_TIMEOUT_MS = 45_000;
const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MIN_FACILITY_MATCH_RATIO = 0.8;
const REPORT_YEAR = 2021;
const FALLBACK_PDF_URL =
  "https://methanol.org/uploads/publications/irena-innovation-outlook-renewable-methanol-2021.pdf";
const ALLOWED_RESOURCE_HOSTS = new Set(["methanol.org", "www.methanol.org", "irena.org", "www.irena.org"]);

type FacilitySpec = {
  key: string;
  name: string;
  country: string | null;
  route: string;
  note: string;
  status: string | null;
  startYear: number | null;
  tableRef: string;
  /** Tried in order; first match wins. Must capture the capacity figure. */
  patterns: RegExp[];
  /** Convert the captured figure to thousand tonnes per year. */
  toKtY: (captured: number) => number | null;
  estimated: boolean;
  confidence: ParsedSupplyObservation["confidence"];
  basisExtra: string;
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

function approvedResourceUrl(rawUrl: string, baseUrl?: string): string {
  const url = new URL(decodeHtml(rawUrl), baseUrl);
  if (url.protocol !== "https:") {
    throw new Error(`Rejected non-HTTPS bio-methanol source URL: ${url.toString()}`);
  }
  if (!ALLOWED_RESOURCE_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error(`Rejected unapproved bio-methanol source host: ${url.hostname}`);
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
  return res.text();
}

/**
 * The MI publications page embeds its catalogue as JSON-LD (ItemList of
 * Reports). Follow that to the mirrored IRENA Innovation Outlook Renewable
 * Methanol PDF instead of hard-coding the file path.
 */
function outlookPdfUrl(landingUrl: string, html: string): string {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gis)];
  for (const block of blocks) {
    try {
      const data = JSON.parse(block[1] ?? "") as unknown;
      const graphs = Array.isArray(data) ? data : [data];
      for (const node of graphs) {
        if (typeof node !== "object" || node === null) continue;
        const lists = Array.isArray((node as { "@graph"?: unknown })["@graph"])
          ? ((node as { "@graph": unknown[] })["@graph"] as Array<Record<string, unknown>>)
          : [node as Record<string, unknown>];
        for (const entry of lists) {
          if (entry["@type"] !== "ItemList") continue;
          const elements = entry["itemListElement"];
          if (!Array.isArray(elements)) continue;
          for (const element of elements) {
            const item = (element as { item?: { name?: unknown; url?: unknown } }).item;
            const name = typeof item?.name === "string" ? item.name : "";
            const url = typeof item?.url === "string" ? item.url : "";
            if (/innovation outlook/i.test(name) && /renewable methanol/i.test(name) && url) {
              return approvedResourceUrl(url, landingUrl);
            }
          }
        }
      }
    } catch {
      // Ignore malformed JSON-LD blocks and fall through to the mirror URL.
    }
  }
  return approvedResourceUrl(FALLBACK_PDF_URL);
}

async function responseBytes(res: Response, maxBytes: number): Promise<Uint8Array> {
  if (!res.body) {
    const buffer = new Uint8Array(await res.arrayBuffer());
    if (buffer.byteLength > maxBytes) {
      throw new Error(`Bio-methanol PDF exceeds ${Math.round(maxBytes / 1024 / 1024)} MB.`);
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
      throw new Error(`Bio-methanol PDF exceeds ${Math.round(maxBytes / 1024 / 1024)} MB.`);
    }
    chunks.push(chunk);
  }

  const buffer = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return buffer;
}

async function extractPdfText(pdfUrl: string): Promise<string> {
  const safePdfUrl = approvedResourceUrl(pdfUrl);
  const res = await fetchWithTimeout(safePdfUrl);
  if (!res.ok) throw new Error(`Failed to fetch ${pdfUrl}: ${res.status}`);
  const contentLength = Number(res.headers.get("content-length") ?? "");
  if (Number.isFinite(contentLength) && contentLength > MAX_PDF_BYTES) {
    throw new Error(`Bio-methanol PDF exceeds ${Math.round(MAX_PDF_BYTES / 1024 / 1024)} MB.`);
  }
  const contentType = res.headers.get("content-type")?.toLowerCase() ?? "";
  const looksLikePdf = new URL(safePdfUrl).pathname.toLowerCase().endsWith(".pdf");
  if (
    contentType &&
    !contentType.includes("application/pdf") &&
    !contentType.includes("application/octet-stream") &&
    !looksLikePdf
  ) {
    throw new Error(`Unexpected bio-methanol PDF content type: ${contentType}`);
  }
  const data = await responseBytes(res, MAX_PDF_BYTES);
  if (data.byteLength === 0) throw new Error(`Bio-methanol PDF was empty: ${safePdfUrl}`);
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

function toNumber(raw: string): number | null {
  const parsed = Number(raw.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

const T_PER_Y_TO_KT = (captured: number) => Number((captured / 1000).toFixed(3));
const KT_PER_Y = (captured: number) => Number(captured.toFixed(3));

const FACILITIES: FacilitySpec[] = [
  {
    key: "biomcn-groningen",
    name: "BioMCN (OCI Global)",
    country: "Netherlands",
    route: "Biogas-to-methanol",
    note: "Groningen plant co-fed with biomethane; IRENA reports the 60 kt/y figure as the bio-methanol part.",
    status: "Operational",
    startYear: null,
    tableRef: "IRENA Table 5 — methanol plants co-fed with natural gas and biomethane",
    patterns: [/OCI\/BioMCN[\s\S]{0,400}?Groningen[\s\S]{0,200}?(60)\s*kt\/y/i],
    toKtY: KT_PER_Y,
    estimated: false,
    confidence: "reported",
    basisExtra: "60 kt/y is labelled as the bio-methanol part (Compagne, 2017).",
  },
  {
    key: "basf-ludwigshafen",
    name: "BASF Ludwigshafen",
    country: "Germany",
    route: "Biogas-to-methanol",
    note: "Ludwigshafen plant co-fed with biomethane since 2018; renewable share derived from the reported ~15% bio-methanol share of 480 kt/y plant capacity.",
    status: "Operational",
    startYear: 2018,
    tableRef: "IRENA Table 5 — methanol plants co-fed with natural gas and biomethane",
    patterns: [/BASF,?\s+Ludwigshafen[\s\S]{0,200}?(480)\s*kt\/y/i],
    toKtY: (captured) => Number(((captured * 0.15) / 1).toFixed(3)),
    estimated: true,
    confidence: "derived",
    basisExtra:
      "480 kt/y plant capacity with a bio-methanol share of around 15% gives ~72 kt/y renewable capacity.",
  },
  {
    key: "sodra-monsteras",
    name: "Södra Cell Mönsterås",
    country: "Sweden",
    route: "Black liquor / pulp mill",
    note: "By-product bio-methanol from wood pulping; first unit producing grade AA methanol from this source.",
    status: "Operational",
    startYear: null,
    tableRef: "IRENA Table 6 — by-product bio-methanol from wood pulping",
    patterns: [
      /S.dra Mill,?[\s\S]{0,200}?M.nster.s[\s\S]{0,200}?Bio-?\s*methanol\s*(5[.,]25)\s*kt\/y/i,
      /production capacity is\s*(5\s*250)\s*t\/y[\s\S]{0,200}?S.dra/i,
    ],
    toKtY: (captured) => (captured > 100 ? T_PER_Y_TO_KT(captured) : KT_PER_Y(captured)),
    estimated: false,
    confidence: "reported",
    basisExtra: "Reported as 5,250 t/y (5.25 kt/y).",
  },
  {
    key: "alberta-pacific",
    name: "Alberta Pacific",
    country: "Canada",
    route: "Pulp mill by-product",
    note: "Purified methanol at the Boyle Mill, Alberta, for internal bleaching use since 2012.",
    status: "Operational",
    startYear: 2012,
    tableRef: "IRENA Table 6 — by-product bio-methanol from wood pulping",
    patterns: [/Alberta Pacific[\s\S]{0,200}?Bio-?\s*methanol\s*(3)\s*kt\/y/i],
    toKtY: KT_PER_Y,
    estimated: false,
    confidence: "reported",
    basisExtra: "Reported as 3 kt/y bio-methanol.",
  },
  {
    key: "cri-iceland",
    name: "Carbon Recycling International",
    country: "Iceland",
    route: "CO₂-to-methanol",
    note: "George Olah plant converting geothermal CO2 with renewable hydrogen since 2011.",
    status: "Operational",
    startYear: 2011,
    tableRef: "IRENA Table 7 — existing or planned e-methanol facilities",
    patterns: [/Iceland\s+CRI\s+2011\s*(4\s*000)/i, /annual capacity\s+of\s*(4\s*000)\s*t of methanol/i],
    toKtY: (captured) => T_PER_Y_TO_KT(Number(String(captured).replace(/\s+/g, ""))),
    estimated: false,
    confidence: "reported",
    basisExtra: "Reported as 4,000 t/y (4 kt/y) e-methanol.",
  },
  {
    key: "dalian-demo",
    name: "Dalian Institute of Chemical Physics",
    country: "China",
    route: "E-methanol",
    note: "Solar-powered CO2-to-methanol demonstration using alkaline electrolysers.",
    status: "Demonstration",
    startYear: 2020,
    tableRef: "IRENA Table 7 — existing or planned e-methanol facilities",
    patterns: [/Dalian Institute[\s\S]{0,300}?2020\s*(1\s*000)\s*e-methanol/i],
    toKtY: (captured) => T_PER_Y_TO_KT(Number(String(captured).replace(/\s+/g, ""))),
    estimated: false,
    confidence: "reported",
    basisExtra: "Reported as 1,000 t/y (1 kt/y) e-methanol demonstration.",
  },
  {
    key: "liquid-wind",
    name: "Liquid Wind",
    country: "Sweden",
    route: "E-methanol",
    note: "Upcycled industrial CO2 with water-electrolysis hydrogen; plan for six facilities by 2030.",
    status: "Planned",
    startYear: 2023,
    tableRef: "IRENA Table 7 — existing or planned e-methanol facilities",
    patterns: [/Liquid Wind[\s\S]{0,300}?2023[\s\S]{0,300}?(45\s*000)\s*e-methanol/i],
    toKtY: (captured) => T_PER_Y_TO_KT(Number(String(captured).replace(/\s+/g, ""))),
    estimated: false,
    confidence: "reported",
    basisExtra: "Reported as 45,000 t/y (45 kt/y) e-methanol.",
  },
  {
    key: "abel-tasmania",
    name: "ABEL Energy Bell Bay",
    country: "Australia",
    route: "E-methanol",
    note: "Tasmanian plant using biogenic CO2 and water-electrolysis hydrogen.",
    status: "Planned",
    startYear: 2023,
    tableRef: "IRENA Table 7 — existing or planned e-methanol facilities",
    patterns: [/ABEL\s+2023\s*(60\s*000)\s*e-methanol/i],
    toKtY: (captured) => T_PER_Y_TO_KT(Number(String(captured).replace(/\s+/g, ""))),
    estimated: false,
    confidence: "reported",
    basisExtra: "Reported as 60,000 t/y (60 kt/y) e-methanol.",
  },
  {
    key: "henan-shuncheng",
    name: "Geely / Henan Shuncheng",
    country: "China",
    route: "Coke-oven gas & CO₂",
    note: "CRI Emissions-to-Liquids technology using lime-kiln CO2 and coke-oven-gas hydrogen.",
    status: "Planned",
    startYear: 2022,
    tableRef: "IRENA Table 7 — existing or planned e-methanol facilities",
    patterns: [/Henan[\s\S]{0,200}?Shuncheng[\s\S]{0,200}?2022\s*(110\s*000)/i],
    toKtY: (captured) => T_PER_Y_TO_KT(Number(String(captured).replace(/\s+/g, ""))),
    estimated: false,
    confidence: "reported",
    basisExtra: "Reported as 110,000 t/y (110 kt/y) methanol.",
  },
  {
    key: "swiss-liquid-future",
    name: "Swiss Liquid Future / Thyssenkrupp",
    country: "Norway",
    route: "E-methanol",
    note: "Ferrosilicon-plant CO2 with hydropower electrolysis hydrogen.",
    status: "Planned",
    startYear: null,
    tableRef: "IRENA Table 7 — existing or planned e-methanol facilities",
    patterns: [/Swiss Liquid[\s\S]{0,300}?(80\s*000)\s*e-methanol/i],
    toKtY: (captured) => T_PER_Y_TO_KT(Number(String(captured).replace(/\s+/g, ""))),
    estimated: false,
    confidence: "reported",
    basisExtra: "Reported as 80,000 t/y (80 kt/y) e-methanol.",
  },
  {
    key: "norway-cri-consortium",
    name: "Consortium of companies / CRI",
    country: "Norway",
    route: "E-methanol",
    note: "Norwegian consortium project using CRI technology with water-electrolysis hydrogen.",
    status: "Planned",
    startYear: 2024,
    tableRef: "IRENA Table 7 — existing or planned e-methanol facilities",
    patterns: [/Consortium of\s+companies\/\s*CRI[\s\S]{0,200}?2024\s*(100\s*000)/i],
    toKtY: (captured) => T_PER_Y_TO_KT(Number(String(captured).replace(/\s+/g, ""))),
    estimated: false,
    confidence: "reported",
    basisExtra: "Reported as 100,000 t/y (100 kt/y) e-methanol.",
  },
  {
    key: "rh2c-canada",
    name: "Renewable Hydrogen Canada (RH2C)",
    country: "Canada",
    route: "E-methanol",
    note: "Hydropower electrolysis hydrogen with captured CO2.",
    status: "Planned",
    startYear: null,
    tableRef: "IRENA Table 7 — existing or planned e-methanol facilities",
    patterns: [/Renewable\s+Hydrogen\s+Canada[\s\S]{0,200}?(120\s*000)\s*e-methanol/i],
    toKtY: (captured) => T_PER_Y_TO_KT(Number(String(captured).replace(/\s+/g, ""))),
    estimated: false,
    confidence: "reported",
    basisExtra: "Reported as 120,000 t/y (120 kt/y) e-methanol.",
  },
  {
    key: "antwerp-consortium",
    name: "Port of Antwerp consortium",
    country: "Belgium",
    route: "E-methanol",
    note: "Consortium project at the port of Antwerp using water-electrolysis hydrogen.",
    status: "Planned",
    startYear: null,
    tableRef: "IRENA Table 7 — existing or planned e-methanol facilities",
    patterns: [/port of\s+Antwerp[\s\S]{0,200}?(8\s*000)\s*e-methanol/i],
    toKtY: (captured) => T_PER_Y_TO_KT(Number(String(captured).replace(/\s+/g, ""))),
    estimated: false,
    confidence: "reported",
    basisExtra: "Reported as 8,000 t/y (8 kt/y) e-methanol.",
  },
  {
    key: "ghent-consortium",
    name: "Port of Ghent consortium",
    country: "Belgium",
    route: "E-methanol",
    note: "Consortium project at the port of Ghent using industrial CO2; the source states a 46,000–180,000 t/y range and the lower bound is used here.",
    status: "Planned",
    startYear: null,
    tableRef: "IRENA Table 7 — existing or planned e-methanol facilities",
    patterns: [/port of\s+Ghent[\s\S]{0,200}?(46\s*000)-?\s*180\s*000/i],
    toKtY: (captured) => T_PER_Y_TO_KT(Number(String(captured).replace(/\s+/g, ""))),
    estimated: true,
    confidence: "estimated",
    basisExtra: "Source range 46,000–180,000 t/y; lower bound 46,000 t/y (46 kt/y) used without further assumption.",
  },
  {
    key: "nouryon-biomcn",
    name: "Nouryon / Gasunie / BioMCN consortium",
    country: "Netherlands",
    route: "E-methanol",
    note: "Dutch consortium (Nouryon, Gasunie, BioMCN and three others) using water-electrolysis hydrogen.",
    status: "Planned",
    startYear: null,
    tableRef: "IRENA Table 7 — existing or planned e-methanol facilities",
    patterns: [/Nouryon\/[\s\S]{0,300}?BioMCN[\s\S]{0,200}?(15\s*000)\s*e-methanol/i],
    toKtY: (captured) => T_PER_Y_TO_KT(Number(String(captured).replace(/\s+/g, ""))),
    estimated: false,
    confidence: "reported",
    basisExtra: "Reported as 15,000 t/y (15 kt/y) e-methanol.",
  },
  {
    key: "dow-germany",
    name: "Dow Germany",
    country: "Germany",
    route: "E-methanol",
    note: "Planned CO2-to-methanol plant using water-electrolysis hydrogen; source figure is approximate.",
    status: "Planned",
    startYear: null,
    tableRef: "IRENA Table 7 — existing or planned e-methanol facilities",
    patterns: [/Germany\s+Dow[\s\S]{0,200}?~\s*(200\s*000)\s*e-methanol/i],
    toKtY: (captured) => T_PER_Y_TO_KT(Number(String(captured).replace(/\s+/g, ""))),
    estimated: true,
    confidence: "estimated",
    basisExtra: "Source states approximately 200,000 t/y (~200 kt/y) e-methanol.",
  },
  {
    key: "eni-livorno",
    name: "ENI Livorno",
    country: "Italy",
    route: "Waste gasification",
    note: "Livorno refinery project converting MSW and waste wood to methanol; basic engineering ready Q3 2020.",
    status: "Basic engineering",
    startYear: null,
    tableRef: "IRENA Table 4 — gasification-based renewable methanol projects",
    patterns: [/Livorno[\s\S]{0,300}?Methanol\s*(115)\s*kt\/y/i],
    toKtY: KT_PER_Y,
    estimated: false,
    confidence: "reported",
    basisExtra: "Reported as 115 kt/y methanol from MSW/waste wood.",
  },
  {
    key: "lowland-methanol",
    name: "LowLand Methanol",
    country: "Netherlands",
    route: "Bio & e-methanol",
    note: "Dutch project combining biomass gasification with external green hydrogen; start-up early 2023.",
    status: "Planned",
    startYear: 2023,
    tableRef: "IRENA Table 4 — gasification-based renewable methanol projects",
    patterns: [/LowLand[\s\S]{0,300}?Methanol\s*(120)\s*kt\/y/i],
    toKtY: KT_PER_Y,
    estimated: false,
    confidence: "reported",
    basisExtra: "Reported as 120 kt/y methanol.",
  },
  {
    key: "varmlandsmetanol",
    name: "VärmlandsMetanol",
    country: "Sweden",
    route: "Biomass gasification",
    note: "Hagfors forest-residue gasification project in planning.",
    status: "Planning",
    startYear: null,
    tableRef: "IRENA Table 4 — gasification-based renewable methanol projects",
    patterns: [/V.rmlands-?\s*metanol[\s\S]{0,200}?Planning\s+Methanol\s*(100)\s*kt\/y/i],
    toKtY: KT_PER_Y,
    estimated: false,
    confidence: "reported",
    basisExtra: "Reported as 100 kt/y methanol from torrefied biomass.",
  },
  {
    key: "enerkem-rotterdam",
    name: "Enerkem Rotterdam",
    country: "Netherlands",
    route: "Waste gasification",
    note: "Port of Rotterdam municipal-waste-to-methanol project in engineering; uses external hydrogen instead of a water-gas-shift unit.",
    status: "Engineering",
    startYear: null,
    tableRef: "IRENA Table 4 — gasification-based renewable methanol projects",
    patterns: [/Rotterdam\s+\(NL\)\s+Engineering\s+Methanol\s*(215)\s*kt\/y/i],
    toKtY: KT_PER_Y,
    estimated: false,
    confidence: "reported",
    basisExtra: "Reported as 215 kt/y methanol from MSW.",
  },
  {
    key: "enerkem-tarragona",
    name: "Enerkem Tarragona",
    country: "Spain",
    route: "Waste gasification",
    note: "Spanish MSW-to-methanol project in engineering (Saragossa in the facilities table, Tarragona in the cost table).",
    status: "Engineering",
    startYear: null,
    tableRef: "IRENA Table 4 — gasification-based renewable methanol projects",
    patterns: [
      /Saragossa[\s\S]{0,100}?Engineering\s+Methanol\s*(215)\s*kt\/y/i,
      /Tarragona[\s\S]{0,200}?Engineering\s*(215\s*000)/i,
    ],
    toKtY: (captured) => (captured > 1000 ? T_PER_Y_TO_KT(captured) : KT_PER_Y(captured)),
    estimated: false,
    confidence: "reported",
    basisExtra: "Reported as 215 kt/y methanol from MSW.",
  },
];

function extractCapacity(fullText: string, spec: FacilitySpec): number | null {
  for (const pattern of spec.patterns) {
    const match = fullText.match(pattern);
    if (!match?.[1]) continue;
    const cleaned = match[1].replace(/\s+/g, "");
    // "5,250" style thousands vs "5.25" decimals: commas always group thousands.
    const normalized = cleaned.includes(",") ? cleaned.replace(/,/g, "") : cleaned;
    const captured = toNumber(normalized);
    if (captured === null) continue;
    // Guard against matching a bare small number where tonnes were meant and
    // vice versa: t/y figures in this report are >= 1,000, kt/y figures < 2,000.
    const kt = spec.toKtY(captured);
    if (kt !== null && Number.isFinite(kt) && kt > 0) return kt;
  }
  return null;
}

function toEntity(
  name: string,
  country: string | null,
  route: string,
  note: string,
  status: string | null,
  startYear: number | null,
  tableRef: string,
  capacityKtY: number,
  estimated: boolean,
  confidence: ParsedSupplyObservation["confidence"],
  basisExtra: string,
  sourceUrl: string,
  key: string,
): ParsedSupplyEntity {
  const reportingYear = startYear ?? REPORT_YEAR;
  return {
    name,
    country,
    entityType: "producer",
    sourceEntityKey: `mi-irena-renewable-methanol:${key}`,
    metadata: {
      route,
      note,
      status,
      startYear,
      sourceKind: "Methanol Institute publications listing → IRENA Innovation Outlook: Renewable Methanol (2021)",
      tableRef,
      sourceUrl,
    },
    observations: [
      {
        metricKey: "capacityKtY",
        metricLabel: "Methanol capacity",
        value: capacityKtY,
        unit: "thousand tonnes per year",
        reportingYear,
        basis: `${tableRef}: ${basisExtra}`,
        estimated,
        confidence,
        sourceUrl,
        raw: { capacityKtY, status, startYear, tableRef },
      },
    ],
  };
}

async function parse(source: SupplySourceRegistryEntry): Promise<ParsedSupplyDataset> {
  const landingHtml = await fetchText(source.url);
  const pdfUrl = outlookPdfUrl(source.url, landingHtml);
  const fullText = await extractPdfText(pdfUrl);

  const entities: ParsedSupplyEntity[] = [];
  const missing: string[] = [];
  for (const spec of FACILITIES) {
    const capacityKtY = extractCapacity(fullText, spec);
    if (capacityKtY === null) {
      missing.push(spec.key);
      continue;
    }
    entities.push(
      toEntity(
        spec.name,
        spec.country,
        spec.route,
        spec.note,
        spec.status,
        spec.startYear,
        spec.tableRef,
        capacityKtY,
        spec.estimated,
        spec.confidence,
        spec.basisExtra,
        pdfUrl,
        spec.key,
      ),
    );
  }

  if (entities.length === 0) {
    throw new Error(
      `No renewable-methanol plant capacities matched in the IRENA outlook PDF at ${pdfUrl}. The source layout may have changed.`,
    );
  }
  const minimumExpected = Math.ceil(FACILITIES.length * MIN_FACILITY_MATCH_RATIO);
  if (entities.length < minimumExpected) {
    throw new Error(
      `Only ${entities.length}/${FACILITIES.length} renewable-methanol plant capacities matched in the IRENA outlook PDF at ${pdfUrl}; expected at least ${minimumExpected}. Missing: ${missing.join(", ")}.`,
    );
  }

  return {
    datasetId: DATASET_ID,
    sourceUrl: pdfUrl,
    reportingYear: REPORT_YEAR,
    rowsSeen: entities.length,
    entities,
    metadata: {
      parserId: PARSER_ID,
      sourceLandingPage: source.url,
      resourceUrl: pdfUrl,
      reportTitle: "IRENA Innovation Outlook: Renewable Methanol (2021), via Methanol Institute publications",
      facilitiesParsed: entities.length,
      facilitiesMissing: missing,
    },
  };
}

export const bioMethanolMiIrenaOutlookParser: SupplyParser = {
  id: PARSER_ID,
  datasetId: DATASET_ID,
  parse,
};
