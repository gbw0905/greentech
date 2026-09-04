/**
 * Published yearly history, 2000-2026, for the datasets where official
 * agencies actually publish a consistent annual series (EIA, RFA, IEA, IRENA,
 * FAO / Bioenergy Europe). Values are anchored on published years and linearly
 * interpolated between anchors; the most recent years are the agencies' own
 * latest estimates. Panels with no published annual series return null and the
 * trend view explains that instead of inventing numbers.
 */

export type TrendPoint = { year: number; value: number };
export type TrendSeries = { key: string; label: string; points: TrendPoint[] };
export type PanelTrend = {
  measure: string;
  unit: string;
  source: string;
  note: string;
  series: TrendSeries[];
};

type Anchors = Record<number, number>;

const YEARS = Array.from({ length: 27 }, (_, i) => 2000 + i);

function expand(anchors: Anchors): TrendPoint[] {
  const keys = Object.keys(anchors)
    .map(Number)
    .sort((a, b) => a - b);
  if (keys.length === 0) return [];
  const first = keys[0]!;
  const last = keys[keys.length - 1]!;
  const out: TrendPoint[] = [];
  for (const year of YEARS) {
    if (year < first || year > last) continue;
    const exact = anchors[year];
    if (exact !== undefined) {
      out.push({ year, value: exact });
      continue;
    }
    let lo = first;
    let hi = last;
    for (const k of keys) {
      if (k < year) lo = k;
      if (k > year) {
        hi = k;
        break;
      }
    }
    const a = anchors[lo]!;
    const b = anchors[hi]!;
    const t = (year - lo) / (hi - lo);
    out.push({ year, value: Number((a + (b - a) * t).toFixed(2)) });
  }
  return out;
}

const s = (key: string, label: string, anchors: Anchors): TrendSeries => ({
  key,
  label,
  points: expand(anchors),
});

const TRENDS: Record<string, PanelTrend> = {
  ethanol: {
    measure: "Fuel ethanol production",
    unit: "billion litres per year",
    source: "US EIA, Renewable Fuels Association, UNICA, F.O. Licht",
    note: "Anchored on published annual production; 2025-2026 are agency estimates.",
    series: [
      s("us", "United States", { 2000: 6.2, 2005: 14.8, 2010: 50.3, 2015: 56.1, 2019: 59.7, 2020: 52.6, 2021: 57.0, 2023: 58.4, 2024: 59.8, 2026: 60.5 }),
      s("br", "Brazil", { 2000: 10.6, 2005: 16.0, 2010: 27.4, 2015: 30.2, 2019: 32.5, 2020: 30.1, 2023: 33.8, 2024: 35.5, 2026: 37.0 }),
      s("eu", "European Union", { 2000: 0.3, 2005: 0.9, 2010: 4.6, 2015: 5.5, 2019: 6.2, 2020: 5.5, 2023: 6.4, 2024: 6.6, 2026: 6.8 }),
      s("cn", "China", { 2000: 0.3, 2005: 1.2, 2010: 2.1, 2015: 3.0, 2019: 3.4, 2020: 3.0, 2023: 3.6, 2024: 3.7, 2026: 3.9 }),
      s("in", "India", { 2000: 0.1, 2010: 0.4, 2015: 0.7, 2019: 2.0, 2021: 3.0, 2023: 5.5, 2024: 7.0, 2026: 9.0 }),
      s("row", "Rest of world", { 2000: 0.5, 2010: 2.5, 2015: 3.6, 2019: 4.4, 2020: 3.9, 2023: 4.6, 2024: 4.9, 2026: 5.2 }),
    ],
  },
  stations: {
    measure: "Biodiesel and renewable diesel production",
    unit: "billion litres per year",
    source: "US EIA, IEA Renewables, EU Fediol / EBB",
    note: "Global supply of the fuels sold through retail networks; 2025-2026 are IEA estimates.",
    series: [
      s("us", "United States", { 2000: 0.03, 2005: 0.4, 2010: 1.3, 2015: 6.5, 2019: 8.5, 2021: 9.8, 2023: 13.5, 2024: 15.0, 2026: 17.0 }),
      s("eu", "European Union", { 2000: 0.8, 2005: 3.2, 2010: 10.5, 2015: 12.6, 2019: 15.4, 2021: 16.0, 2023: 17.5, 2024: 18.0, 2026: 18.5 }),
      s("br", "Brazil", { 2005: 0.1, 2010: 2.4, 2015: 3.9, 2019: 5.9, 2021: 6.8, 2023: 7.5, 2024: 8.1, 2026: 8.8 }),
      s("id", "Indonesia", { 2005: 0.1, 2010: 0.7, 2015: 1.6, 2019: 6.7, 2021: 8.4, 2023: 10.6, 2024: 12.0, 2026: 13.5 }),
      s("row", "Rest of world", { 2000: 0.2, 2010: 3.5, 2015: 6.0, 2019: 8.0, 2023: 10.5, 2024: 11.5, 2026: 13.0 }),
    ],
  },
  saf: {
    measure: "Sustainable aviation fuel supply",
    unit: "million litres per year",
    source: "IEA Renewables, IATA SAF tracker",
    note: "Global SAF supply only exists as a published series from 2016; 2025-2026 are IEA/IATA projections.",
    series: [
      s("global", "Global SAF supply", { 2016: 10, 2018: 15, 2020: 60, 2021: 120, 2022: 300, 2023: 600, 2024: 1000, 2025: 2000, 2026: 2900 }),
    ],
  },
  biopower: {
    measure: "Bioenergy electricity generation",
    unit: "terawatt-hours per year",
    source: "IRENA Renewable Energy Statistics, IEA",
    note: "All solid, liquid and gaseous bioenergy generation; 2025-2026 are IEA estimates.",
    series: [
      s("global", "World", { 2000: 164, 2005: 216, 2010: 314, 2015: 466, 2019: 588, 2021: 645, 2023: 700, 2024: 725, 2026: 770 }),
      s("eu", "European Union", { 2000: 45, 2005: 78, 2010: 124, 2015: 178, 2019: 196, 2023: 200, 2026: 205 }),
      s("cn", "China", { 2000: 2, 2005: 8, 2010: 25, 2015: 53, 2019: 111, 2023: 175, 2026: 200 }),
      s("us", "United States", { 2000: 60, 2005: 62, 2010: 68, 2015: 72, 2019: 68, 2023: 62, 2026: 60 }),
    ],
  },
  pellets: {
    measure: "Wood pellet production",
    unit: "million tonnes per year",
    source: "FAO Forest Products, Bioenergy Europe pellet report",
    note: "Global industrial and heating pellet output; 2025-2026 are trade-body estimates.",
    series: [
      s("global", "World", { 2000: 2, 2005: 6, 2010: 14.3, 2015: 28, 2019: 39, 2021: 44, 2023: 46, 2024: 48, 2026: 51 }),
      s("eu", "European Union", { 2000: 1.2, 2010: 9.2, 2015: 14.1, 2019: 18.5, 2023: 20.5, 2026: 22 }),
      s("us", "United States", { 2005: 1.1, 2010: 2.5, 2015: 7.4, 2019: 8.6, 2023: 9.5, 2026: 10.2 }),
    ],
  },
  rng: {
    measure: "Renewable natural gas production",
    unit: "million MMBtu per year",
    source: "US EIA, RNG Coalition, European Biogas Association",
    note: "Biomethane injected to grid or used as vehicle fuel; the published series starts in 2010.",
    series: [
      s("us", "United States", { 2010: 8, 2015: 22, 2019: 60, 2021: 95, 2023: 135, 2024: 160, 2026: 200 }),
      s("eu", "European Union", { 2010: 12, 2015: 45, 2019: 85, 2021: 120, 2023: 155, 2024: 175, 2026: 215 }),
    ],
  },
  oil: {
    measure: "World crude oil and condensate production",
    unit: "million barrels per day",
    source: "US EIA International Energy Statistics",
    note: "Context for the listed majors; 2025-2026 are EIA short-term outlook figures.",
    series: [
      s("world", "World", { 2000: 68.3, 2005: 73.7, 2010: 74.1, 2015: 80.1, 2019: 83.2, 2020: 76.1, 2022: 80.2, 2023: 81.8, 2024: 82.3, 2026: 84.0 }),
      s("us", "United States", { 2000: 5.8, 2005: 5.2, 2010: 5.5, 2015: 9.4, 2019: 12.3, 2020: 11.3, 2023: 12.9, 2024: 13.2, 2026: 13.6 }),
      s("sa", "Saudi Arabia", { 2000: 9.0, 2005: 9.6, 2010: 8.9, 2015: 10.2, 2019: 9.8, 2020: 9.2, 2023: 9.0, 2024: 8.9, 2026: 9.3 }),
    ],
  },
  marine: {
    measure: "Marine biofuel bunker sales",
    unit: "thousand tonnes per year",
    source: "Maritime & Port Authority of Singapore, Port of Rotterdam bunker statistics",
    note: "Sum of the two ports publishing biofuel bunker volumes; the series starts in 2019.",
    series: [
      s("sg", "Singapore", { 2019: 20, 2021: 140, 2022: 140, 2023: 520, 2024: 880, 2026: 1200 }),
      s("rt", "Rotterdam", { 2019: 240, 2021: 480, 2022: 570, 2023: 760, 2024: 880, 2026: 1000 }),
    ],
  },
};

export function panelTrend(panel: string): PanelTrend | null {
  return TRENDS[panel] ?? null;
}

/** Sum of all component series, used by the "Sector total" toggle. */
export function totalSeries(trend: PanelTrend): TrendSeries {
  const byYear = new Map<number, number>();
  for (const series of trend.series) {
    for (const p of series.points) byYear.set(p.year, (byYear.get(p.year) ?? 0) + p.value);
  }
  return {
    key: "__total",
    label: "Sector total",
    points: [...byYear.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, value]) => ({ year, value: Number(value.toFixed(2)) })),
  };
}
