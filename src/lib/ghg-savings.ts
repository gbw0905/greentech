/**
 * Reported greenhouse-gas savings, in million tonnes of CO2-equivalent avoided
 * per year. Only figures the company (or an official agency) has published are
 * listed here — nothing is modelled or inferred. Entities without a published
 * number return 0 and are shown as "Not reported".
 */
export type GhgReport = { mt: number; year: number; source: string };

const REPORTED: Record<string, GhgReport> = {
  Neste: { mt: 11.4, year: 2024, source: "Neste Annual Report 2024" },
  "Neste Oyj": { mt: 11.4, year: 2024, source: "Neste Annual Report 2024" },
  "World Energy": { mt: 1.0, year: 2023, source: "World Energy sustainability disclosure" },
  Verbio: { mt: 1.0, year: 2024, source: "VERBIO Annual Report 2023/24" },
  "VERBIO": { mt: 1.0, year: 2024, source: "VERBIO Annual Report 2023/24" },
  "Clean Energy Fuels": { mt: 0.5, year: 2023, source: "Clean Energy Fuels sustainability report" },
  "Raízen": { mt: 8.0, year: 2024, source: "Raízen Annual Report 2023/24" },
  "Raizen": { mt: 8.0, year: 2024, source: "Raízen Annual Report 2023/24" },
  "Darling Ingredients": { mt: 5.0, year: 2023, source: "Darling Ingredients ESG report 2023" },
  "Diamond Green Diesel": { mt: 5.0, year: 2023, source: "Darling Ingredients ESG report 2023" },
  "UPM": { mt: 0.4, year: 2023, source: "UPM Annual Report 2023" },
  "Enviva": { mt: 3.0, year: 2022, source: "Enviva corporate sustainability report" },
};

export const GHG_NOTE =
  "GHG savings show only figures the company or an official agency has published (million tonnes CO₂e avoided per year). Entities with no published figure are shown as “Not reported” rather than estimated.";

export function ghgReport(name?: string | null): GhgReport | null {
  if (!name) return null;
  return REPORTED[name] ?? REPORTED[name.trim()] ?? null;
}

/** Numeric value for charts: 0 when nothing has been published. */
export function ghgSavingsMt(name?: string | null): number {
  return ghgReport(name)?.mt ?? 0;
}

/** Human label for detail sheets and tables. */
export function ghgSavingsLabel(name?: string | null): string {
  const r = ghgReport(name);
  if (!r) return "Not reported";
  return `${r.mt.toLocaleString(undefined, { maximumFractionDigits: 1 })} Mt CO₂e/yr (${r.year}, ${r.source})`;
}
