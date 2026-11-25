/**
 * California Air Resources Board — Monthly LCFS Credit Transfer Activity Report.
 *
 * CARB posts one PDF per month (second Tuesday of the following month) with the
 * volume-weighted average credit price, transfer count and volume for the
 * latest month, the three months before it, the last three quarters and recent
 * calendar years. Public government record.
 */
import { PDFParse } from "pdf-parse";
import type { LcfsReport } from "./types";

export const CARB_LCFS_PAGE =
  "https://ww2.arb.ca.gov/resources/documents/monthly-lcfs-credit-transfer-activity-reports";

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];
const SHORT: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};
const UA = { "User-Agent": "GlobalBioenergyWatch/1.0 (+official price data)" };

const num = (value: string) => Number(value.replace(/[$,\s]/g, ""));

/** Pick the newest monthly report link from the CARB listing page. */
export function latestCarbReportUrl(html: string): string | null {
  let best: { key: number; url: string } | null = null;
  for (const match of html.matchAll(/href="([^"]*Credit%20Transfer%20Activity[^"]*\.pdf)"/gi)) {
    const href = match[1]!;
    const name = /\/([A-Za-z]+)%20(\d{4})%20-%20Monthly/i.exec(href);
    if (!name) continue;
    const month = MONTHS.indexOf(name[1]!.toLowerCase());
    if (month < 0) continue;
    const key = Number(name[2]) * 12 + month;
    const url = href.startsWith("//") ? `https:${href}` : new URL(href, CARB_LCFS_PAGE).toString();
    if (!best || key > best.key) best = { key, url };
  }
  return best?.url ?? null;
}

/** Parse the text layer of a monthly report PDF. */
export function parseCarbLcfsText(text: string, sourceUrl: string): LcfsReport {
  const reportMonth = /Report for ([A-Za-z]+ \d{4})/.exec(text)?.[1] ?? "";
  const posted = /Posted on (\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(text);
  const months: LcfsReport["months"] = [];
  for (const m of text.matchAll(/^([A-Z][a-z]{2})-(\d{2})\s+([\d,]+)\s+([\d,]+)\s+\$([\d,.]+)/gm)) {
    const month = SHORT[m[1]!.toLowerCase()];
    if (month === undefined) continue;
    months.push({
      period: `${m[1]}-${m[2]}`,
      t: Date.UTC(2000 + Number(m[2]), month, 1),
      transfers: num(m[3]!),
      volumeMt: num(m[4]!),
      avgPrice: num(m[5]!),
    });
  }
  months.sort((a, b) => a.t - b.t);
  const quarters = [...text.matchAll(/^(Q[1-4] \d{4})\s+[\d,]+\s+([\d,]+)\s+\$([\d,.]+)/gm)].map(
    (m) => ({ period: m[1]!, volumeMt: num(m[2]!), avgPrice: num(m[3]!) }),
  );
  const years = [...text.matchAll(/^(CY \d{4})\s+[\d,]+\s+([\d,]+)\s+\$([\d,.]+)/gm)].map((m) => ({
    period: m[1]!,
    volumeMt: num(m[2]!),
    avgPrice: num(m[3]!),
  }));
  const range = /Price Range in [^=]*=\s*\$([\d,.]+)\s+to\s+\$([\d,.]+)/.exec(text);
  return {
    reportMonth,
    postedAt: posted ? Date.UTC(Number(posted[3]), Number(posted[1]) - 1, Number(posted[2])) : null,
    months,
    quarters,
    years,
    priceRange: range ? { low: num(range[1]!), high: num(range[2]!) } : null,
    sourceUrl,
    sourcePage: CARB_LCFS_PAGE,
  };
}

export async function fetchCarbLcfsReport(): Promise<LcfsReport> {
  const page = await fetch(CARB_LCFS_PAGE, { headers: UA, signal: AbortSignal.timeout(20_000) });
  if (!page.ok) throw new Error(`CARB listing returned ${page.status}`);
  const url = latestCarbReportUrl(await page.text());
  if (!url) throw new Error("CARB listing: no monthly report link found");
  const pdf = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30_000) });
  if (!pdf.ok) throw new Error(`CARB report returned ${pdf.status}`);
  const parser = new PDFParse({ data: new Uint8Array(await pdf.arrayBuffer()) });
  try {
    const { text } = await parser.getText();
    const report = parseCarbLcfsText(text, url);
    if (!report.months.length) throw new Error("CARB report: no monthly rows parsed");
    return report;
  } finally {
    await parser.destroy();
  }
}
