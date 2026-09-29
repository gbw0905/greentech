/**
 * Market entity domains used to fetch company logos from Logo.dev.
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

const TOKEN = import.meta.env["VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY"] as string | undefined;

/** Brand domains keyed by the display name used in the charts. */
export const NAME_DOMAINS: Record<string, string> = {
  // Airlines
  "United Airlines": "united.com",
  "Air France-KLM": "airfranceklm.com",
  "Lufthansa Group": "lufthansagroup.com",
  "IAG (British Airways)": "britishairways.com",
  "Delta Air Lines": "delta.com",
  "Singapore Airlines": "singaporeair.com",
  "American Airlines": "aa.com",
  Qantas: "qantas.com",
  "Japan Airlines": "jal.com",
  Emirates: "emirates.com",
  "Air Canada": "aircanada.com",
  "Cathay Pacific": "cathaypacific.com",
  "Korean Air": "koreanair.com",
  "ITA Airways": "ita-airways.com",
  Iberia: "iberia.com",
  SAS: "flysas.com",
  "Swiss International": "swiss.com",
  "Alaska Airlines": "alaskaair.com",
  "Southwest Airlines": "southwest.com",
  "Air New Zealand": "airnewzealand.com",
  // Shipping
  Maersk: "maersk.com",
  "CMA CGM": "cma-cgm.com",
  MSC: "msc.com",
  "Hapag-Lloyd": "hapag-lloyd.com",
  "ONE (Ocean Network Express)": "one-line.com",
  Evergreen: "evergreen-marine.com",
  HMM: "hmm21.com",
  "Wallenius Wilhelmsen": "walleniuswilhelmsen.com",
  "NYK Line": "nyk.com",
  "Cosco Shipping": "coscoshipping.com",
  ZIM: "zim.com",
  "Stena Line": "stenaline.com",
  // Trucking / logistics
  UPS: "ups.com",
  "FedEx Freight": "fedex.com",
  "DHL / Deutsche Post": "dhl.com",
  "Ryder System": "ryder.com",
  "Schneider National": "schneider.com",
  "J.B. Hunt": "jbhunt.com",
  DSV: "dsv.com",
  Girteka: "girteka.eu",
  XPO: "xpo.com",
  "Kuehne+Nagel": "kuehne-nagel.com",
  "Waste Management": "wm.com",
  "Republic Services": "republicservices.com",
  // Rail
  "Union Pacific": "up.com",
  "BNSF Railway": "bnsf.com",
  "Canadian National (CN)": "cn.ca",
  "Canadian Pacific Kansas City": "cpkcr.com",
  CSX: "csx.com",
  "Norfolk Southern": "norfolksouthern.com",
  "Deutsche Bahn Cargo": "deutschebahn.com",
  "SNCF Fret": "sncf.com",
  Aurizon: "aurizon.com.au",
  "Rio Tinto Rail": "riotinto.com",
  "Indian Railways (diesel fleet)": "indianrailways.gov.in",
  Amtrak: "amtrak.com",
  // Fuel retail networks
  "Petrobras BR": "vibraenergia.com.br",
  Ipiranga: "ipiranga.com.br",
  "Raízen / Shell Brazil": "raizen.com.br",
  "Indian Oil": "iocl.com",
  Sinopec: "sinopec.com",
  Pertamina: "pertamina.com",
  "Casey's": "caseys.com",
  Sheetz: "sheetz.com",
  "Kwik Trip": "kwiktrip.com",
  Preem: "preem.se",
  "Neste retail": "neste.com",
  TotalEnergies: "totalenergies.com",
  "Circle K Europe": "circlek.com",
  OMV: "omv.com",
  "Shell US": "shell.com",
  Repsol: "repsol.com",
  "Certas / Shell UK": "shell.co.uk",
  "Clean Energy Fuels": "cleanenergyfuels.com",
  "Bharat Petroleum": "bharatpetroleum.in",
  YPF: "ypf.com",
};

function build(domain: string | undefined, size: number) {
  if (!domain || !TOKEN) return undefined;
  return `https://img.logo.dev/${domain}?token=${TOKEN}&size=${size}&format=png&retina=true`;
}

/** Logo.dev image URL for a company display name, or undefined when unknown. */
export function entityLogoByName(name: string, size = 96): string | undefined {
  return build(NAME_DOMAINS[name], size);
}

/** Logo.dev image URL for a ticker, or undefined when unavailable. */
export function entityLogo(ticker: string, size = 96): string | undefined {
  return build(ENTITY_DOMAINS[ticker], size);
}

/** Logo.dev image URL for an explicit brand domain. */
export function logoForDomain(domain: string, size = 64): string | undefined {
  return build(domain, size);
}
