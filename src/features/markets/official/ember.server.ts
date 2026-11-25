/**
 * Ember yearly electricity data — global file (CC BY 4.0, credit "Ember").
 * https://ember-energy.org/data/yearly-electricity-data/
 *
 * The old `yearly_full_release_long_format.csv` stopped updating; Ember now
 * publishes one wide row per area, year and electricity source.
 */
export const EMBER_GLOBAL_CSV =
  "https://files.ember-energy.org/public-downloads/generation/outputs/release_generation_yearly_global.csv";

export interface EmberBioenergyRow {
  area: string;
  iso3: string;
  year: number;
  areaType: string;
  generationTwh: number | null;
  capacityGw: number | null;
  generationYoyPct: number | null;
  shareOfGenerationPct: number | null;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

const num = (value: string | undefined) => {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Keep only the "Bioenergy" rows (every area and year) from the global file. */
export function parseEmberBioenergy(csv: string): EmberBioenergyRow[] {
  const lines = csv.split(/\r?\n/);
  const headers = splitCsvLine(lines[0] ?? "");
  const col = (name: string) => headers.indexOf(name);
  const idx = {
    area: col("Area"),
    iso3: col("ISO 3 code"),
    year: col("Year"),
    areaType: col("Area type"),
    source: col("Electricity source"),
    generation: col("Generation (TWh)"),
    yoy: col("Generation YoY change (%)"),
    share: col("Share of generation (%)"),
    capacity: col("Capacity (GW)"),
  };
  if (Object.values(idx).some((i) => i < 0)) {
    throw new Error("Ember CSV: unexpected columns — the file layout changed");
  }
  const rows: EmberBioenergyRow[] = [];
  for (const line of lines.slice(1)) {
    // Cheap pre-filter before full CSV parsing of a 100k-line file.
    if (!line.includes(",Bioenergy,")) continue;
    const cells = splitCsvLine(line);
    if (cells[idx.source] !== "Bioenergy") continue;
    const year = Number(cells[idx.year]);
    if (!cells[idx.area] || !Number.isFinite(year)) continue;
    rows.push({
      area: cells[idx.area]!,
      iso3: cells[idx.iso3] ?? "",
      year,
      areaType: cells[idx.areaType] ?? "",
      generationTwh: num(cells[idx.generation]),
      capacityGw: num(cells[idx.capacity]),
      generationYoyPct: num(cells[idx.yoy]),
      shareOfGenerationPct: num(cells[idx.share]),
    });
  }
  return rows;
}

export async function fetchEmberBioenergyRows(timeoutMs = 60_000): Promise<EmberBioenergyRow[]> {
  const res = await fetch(EMBER_GLOBAL_CSV, {
    headers: { "user-agent": "GlobalBioenergyWatch/1.0 (+open data)" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Ember global CSV returned ${res.status}`);
  const rows = parseEmberBioenergy(await res.text());
  if (!rows.length) throw new Error("Ember global CSV: no bioenergy rows parsed");
  return rows;
}
