/**
 * USDA Agricultural Marketing Service — National Weekly Ethanol Report (AMS 3616).
 *
 * Plant-gate ethanol prices plus distillers grains and distillers corn oil,
 * reported by state. USDA Market News reports are public domain.
 */
import { PDFParse } from "pdf-parse";
import type { UsdaEthanolReport, UsdaPriceLine } from "./types";

export const USDA_ETHANOL_PDF = "https://www.ams.usda.gov/mnreports/ams_3616.pdf";
export const USDA_ETHANOL_PAGE = "https://mymarketnews.ams.usda.gov/viewReport/3616";

type Section = "ethanol" | "ddgs" | "cornOil" | "other" | null;

const HEADERS: Record<string, Section> = {
  ethanol: "ethanol",
  "distillers grain dried 10%": "ddgs",
  "distillers corn oil feed grade": "cornOil",
  "future settlements": null,
};

const CHANGE = String.raw`(?:UNCH|(?:UP|DN)\s+[\d.]+)`;
const ROW = new RegExp(
  String.raw`^(.+?)\s+(?:Trade|Bid|Ask|Offer)\s+([\d.]+)(?:-([\d.]+))?\s+${CHANGE}(?:-${CHANGE})?\s+([\d.]+)(?:\s+([\d.]+))?\s+(?:FOB|DLVD)\b`,
);

function summarise(
  rows: Array<{ low: number; high: number; avg: number; yearAgo: number | null }>,
  unit: string,
): UsdaPriceLine | null {
  if (!rows.length) return null;
  const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;
  const yearAgo = rows.flatMap((r) => (r.yearAgo === null ? [] : [r.yearAgo]));
  return {
    average: mean(rows.map((r) => r.avg)),
    yearAgo: yearAgo.length ? mean(yearAgo) : null,
    low: Math.min(...rows.map((r) => r.low)),
    high: Math.max(...rows.map((r) => r.high)),
    rows: rows.length,
    unit,
  };
}

const usDate = (m: RegExpExecArray | null, offset = 1) =>
  m ? Date.UTC(Number(m[offset + 2]), Number(m[offset]) - 1, Number(m[offset + 1])) : null;

export function parseUsdaEthanolText(
  text: string,
): Omit<UsdaEthanolReport, "sourceUrl" | "sourcePage"> {
  const buckets: Record<
    "ethanol" | "ddgs" | "cornOil",
    Array<{ low: number; high: number; avg: number; yearAgo: number | null }>
  > = {
    ethanol: [],
    ddgs: [],
    cornOil: [],
  };
  let section: Section = null;
  // Tables continue across PDF pages after the "Future Settlements" block; the
  // repeated column header (with its unit) tells us to resume the last table.
  let previous: Section = null;
  const UNIT_OF: Partial<Record<NonNullable<Section>, string>> = {
    ethanol: "($ per gallon)",
    ddgs: "($/ton)",
    cornOil: "(¢/lb)",
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const key = line.toLowerCase();
    if (key in HEADERS) {
      if (section) previous = section;
      section = HEADERS[key]!;
      continue;
    }
    if (!section && previous && key.startsWith("state/province/region")) {
      const unit = UNIT_OF[previous];
      if (unit && key.includes(unit)) section = previous;
      continue;
    }
    if (key.startsWith("distillers ")) {
      section = "other";
      continue;
    }
    if (!section || section === "other") continue;
    const m = ROW.exec(line);
    if (!m) continue;
    const low = Number(m[2]);
    const high = m[3] ? Number(m[3]) : low;
    buckets[section].push({
      low,
      high,
      avg: Number(m[4]),
      yearAgo: m[5] ? Number(m[5]) : null,
    });
  }
  const week = /Report for (\d{1,2})\/(\d{1,2})\/(\d{4})\s*-\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(
    text,
  );
  const published = /^([A-Z][a-z]+) (\d{1,2}), (\d{4})$/m.exec(text);
  return {
    weekStart: usDate(week, 1),
    weekEnd: usDate(week, 4),
    publishedAt: published ? Date.parse(`${published[0]} UTC`) || null : null,
    ethanol: summarise(buckets.ethanol, "$/gal"),
    ddgs: summarise(buckets.ddgs, "$/short ton"),
    cornOil: summarise(buckets.cornOil, "¢/lb"),
  };
}

export async function fetchUsdaEthanolReport(): Promise<UsdaEthanolReport> {
  const res = await fetch(USDA_ETHANOL_PDF, {
    headers: { "User-Agent": "GlobalBioenergyWatch/1.0 (+official price data)" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`USDA AMS 3616 returned ${res.status}`);
  const parser = new PDFParse({ data: new Uint8Array(await res.arrayBuffer()) });
  try {
    const { text } = await parser.getText();
    const report = parseUsdaEthanolText(text);
    if (!report.ethanol) throw new Error("USDA AMS 3616: no ethanol rows parsed");
    return { ...report, sourceUrl: USDA_ETHANOL_PDF, sourcePage: USDA_ETHANOL_PAGE };
  } finally {
    await parser.destroy();
  }
}
