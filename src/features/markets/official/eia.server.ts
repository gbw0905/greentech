/**
 * U.S. Energy Information Administration daily spot prices.
 *
 * EIA data is public domain (https://www.eia.gov/about/copyrights_reuse.php);
 * attribution to EIA is requested. We read the public "dnav" history tables
 * (no API key needed). Each row is one week, Monday to Friday, five values.
 */
import type { OfficialSeries, PricePoint } from "./types";

export interface EiaSeriesDef {
  id: string;
  /** Path under https://www.eia.gov/dnav/ */
  path: string;
}

export const EIA_SERIES = {
  wti: { id: "eia:wti", path: "pet/hist/RWTCD.htm" },
  brent: { id: "eia:brent", path: "pet/hist/RBRTED.htm" },
  henryHub: { id: "eia:henry-hub", path: "ng/hist/rngwhhdD.htm" },
  ulsd: { id: "eia:nyh-ulsd", path: "pet/hist/EER_EPD2DXL0_PF4_Y35NY_DPGD.htm" },
  jet: { id: "eia:usgc-jet", path: "pet/hist/EER_EPJK_PF4_RGC_DPGD.htm" },
} as const satisfies Record<string, EiaSeriesDef>;

export const eiaUrl = (def: EiaSeriesDef) => `https://www.eia.gov/dnav/${def.path}`;

const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};
const DAY = 86_400_000;

/** Parse an EIA daily history table into points (oldest first). */
export function parseEiaDailyHtml(html: string): {
  points: PricePoint[];
  releasedAt: number | null;
} {
  const points: PricePoint[] = [];
  const rows = html.match(/<tr>\s*<td class='B6'>[\s\S]*?<\/tr>/g) ?? [];
  for (const row of rows) {
    const label = /<td class='B6'>(?:&nbsp;)*\s*(\d{4})\s+([A-Z][a-z]{2})-\s*(\d{1,2})\s+to/.exec(
      row,
    );
    if (!label) continue;
    const month = MONTHS[label[2]!];
    if (month === undefined) continue;
    const start = Date.UTC(Number(label[1]), month, Number(label[3]));
    const cells = [...row.matchAll(/<td class='B3'>([^<]*)<\/td>/g)].map((m) => m[1]!.trim());
    cells.slice(0, 5).forEach((cell, index) => {
      const value = Number(cell.replace(/,/g, ""));
      if (cell !== "" && Number.isFinite(value)) points.push({ t: start + index * DAY, c: value });
    });
  }
  points.sort((a, b) => a.t - b.t);
  const release = /Release Date:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(html);
  const releasedAt = release
    ? Date.UTC(Number(release[3]), Number(release[1]) - 1, Number(release[2]))
    : null;
  return { points, releasedAt };
}

export async function fetchEiaSeries(def: EiaSeriesDef): Promise<OfficialSeries> {
  const url = eiaUrl(def);
  const res = await fetch(url, {
    headers: { "User-Agent": "GlobalBioenergyWatch/1.0 (+official price data)" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`EIA ${def.id} returned ${res.status}`);
  const { points, releasedAt } = parseEiaDailyHtml(await res.text());
  if (points.length < 10) throw new Error(`EIA ${def.id}: no rows parsed`);
  return { id: def.id, points, releasedAt, sourceUrl: url };
}
