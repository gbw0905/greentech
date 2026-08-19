/**
 * Brand domains used to fetch company logos from Logo.dev.
 * Keyed by the market ticker used in the charts.
 */
export const ENTITY_DOMAINS: Record<string, string> = {
  "2222.SR": "aramco.com",
  XOM: "exxonmobil.com",
  CVX: "chevron.com",
  SHEL: "shell.com",
  TTE: "totalenergies.com",
  BP: "bp.com",
  "0857.HK": "petrochina.com.cn",
  "0386.HK": "sinopec.com",
  "0883.HK": "cnoocltd.com",
  COP: "conocophillips.com",
  PSX: "phillips66.com",
  MPC: "marathonpetroleum.com",
  OXY: "oxy.com",
  PBR: "petrobras.com.br",
  E: "eni.com",
  EQNR: "equinor.com",
  "RELIANCE.NS": "ril.com",
  "ONGC.NS": "ongcindia.com",
  SU: "suncor.com",
  CNQ: "cnrl.com",
};

const TOKEN = import.meta.env['VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY'] as string | undefined;

/** Logo.dev image URL for a ticker, or undefined when unavailable. */
export function entityLogo(ticker: string, size = 96): string | undefined {
  const domain = ENTITY_DOMAINS[ticker];
  if (!domain || !TOKEN) return undefined;
  return `https://img.logo.dev/${domain}?token=${TOKEN}&size=${size}&format=png&retina=true`;
}