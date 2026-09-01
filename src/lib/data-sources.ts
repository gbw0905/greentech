// Shared data-source citations shown in every CSV export and AI summary.

export const SITE_URL = "https://www.globalbioenergywatch.org";

const BASE: string[] = [
  "Global Bioenergy Watch analyst dataset — entity coverage, capacity and volume estimates compiled from company annual reports, investor presentations and regulatory filings.",
  "Live share prices and 1-day changes: Yahoo Finance delayed market data (primary listing of each entity).",
  "Company identifiers and logos: Logo.dev brand API.",
];

const BY_PANEL: Record<string, string[]> = {
  "Top global oil companies": [
    "Annual output capacity (MMboe/yr): company annual reports and 20-F/10-K filings; refinery throughput from company operational disclosures.",
    "Cross-checks: OPEC Annual Statistical Bulletin, IEA Oil Market Report.",
  ],
  "Top airlines using SAF globally": [
    "SAF uptake, offtake agreements and blend shares: airline sustainability reports and public offtake announcements.",
    "Cross-checks: IATA SAF tracker, ICAO CORSIA documentation.",
  ],
  "Top global fuel stations selling biofuels": [
    "Retail biofuel volumes and site counts: fuel retailer annual reports and national renewable-fuel obligation registers.",
    "Cross-checks: US EPA RFS/EMTS data, EU member-state RED III reporting.",
  ],
  "Global UCO (used cooking oil) suppliers": [
    "UCO collection volumes and footprints: collector and renderer annual reports, investor presentations and public feedstock disclosures.",
    "Certification and eligibility: ISCC EU/PLUS certificate database, EU RED III Annex IX Part B listings, UK RTFO feedstock reporting.",
    "Cross-checks: US EPA RFS/EMTS feedstock data, USDA/GAIN UCO trade reports, China customs UCO export statistics.",
  ],
  "Global blending terminals and capacity": [
    "Terminal counts and blended-product throughput: operator annual reports, terminal network disclosures and port authority storage registries.",
    "Cross-checks: EIA refined-product terminal data, national fuel-obligation registers (RFS, RTFO, RED III, RenovaBio, EBP).",
  ],
  "Global ethanol production": [
    "Ethanol capacities and plant counts: producer annual reports and plant listings.",
    "Cross-checks: Renewable Fuels Association plant registry, ePURE production statistics, UNICA/CONAB Brazil data, Indian OMC ethanol tender allocations.",
  ],
  "Global marine biofuel suppliers and users": [
    "Marine biofuel bunker volumes: MPA Singapore annual bunker sales statistics, Port of Rotterdam bunker throughput data and supplier press disclosures.",
    "Shipping-line biofuel uptake: carrier sustainability and ESG reports, green-fuel product disclosures (ECO Delivery, Ship Green, ACT+) and public bunkering announcements.",
    "Cross-checks: IMO DCS and EU MRV reporting, ISCC EU certification records for marine bio-blends.",
  ],

};


const CARRIER = [
  "Biofuel volumes and blend shares for carriers: operator sustainability reports, fleet decarbonisation disclosures and public bunker/fuel purchase announcements.",
  "Cross-checks: IMO DCS/EU MRV reporting, national freight fuel statistics.",
];

/** Reference list for a panel, always non-empty. */
export function sourcesFor(panel: string): string[] {
  const extra = BY_PANEL[panel] ?? (/carrier/i.test(panel) ? CARRIER : []);
  return [...extra, ...BASE];
}

/** One-line provenance note appended to summaries and exports. */
export const REFERENCE_NOTE =
  "Figures are estimates compiled by Global Bioenergy Watch and may lag official filings — always cross-verify against the primary sources listed.";
