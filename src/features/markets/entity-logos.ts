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

// Sector names frequently include a facility or activity after the parent brand.
const SUPPLY_DOMAINS: Record<string, string> = {
  "Indian Oil Corporation": "iocl.com",
  Eneos: "eneos.co.jp",
  Idemitsu: "idemitsu.com",
  "Pertamina Retail": "pertaminaretail.com",
  Eni: "eni.com",
  EniLive: "enilive.com",
  "Vibra Energia": "vibraenergia.com.br",
  Raízen: "raizen.com.br",
  "ALE Combustíveis": "ale.com.br",
  "Axion Energy": "axionenergy.com",
  Terpel: "terpel.com",
  Primax: "primax.com.pe",
  Copec: "copec.cl",
  ANCAP: "ancap.com.uy",
  Petropar: "petropar.gov.py",
  Petroecuador: "eppetroecuador.ec",
  "Pilot Flying J": "pilotflyingj.com",
  "Love's Travel Stops": "loves.com",
  "Propel Fuels": "propelfuels.com",
  Parkland: "parkland.ca",
  "Petro-Canada": "petro-canada.ca",
  "Federated Co-op": "fcl.crs",
  Pemex: "pemex.com",
  "Hindustan Petroleum": "hindustanpetroleum.com",
  Reliance: "ril.com",
  PetroChina: "petrochina.com.cn",
  PTT: "pttplc.com",
  Petronas: "petronas.com",
  Caltex: "caltex.com",
  Ampol: "ampol.com.au",
  "Viva Energy": "vivaenergy.com.au",
  "Z Energy": "z.co.nz",
  Orlen: "orlen.pl",
  "PKN Orlen": "orlen.pl",
  MOL: "molgroup.info",
  Galp: "galp.com",
  Cepsa: "moeveglobal.com",
  Moeve: "moeveglobal.com",
  Esso: "esso.com",
  BP: "bp.com",
  Shell: "shell.com",
  Petrobras: "petrobras.com.br",
  Neste: "neste.com",
  "Circle K": "circlek.com",
  POET: "poet.com",
  Valero: "valero.com",
  "Archer Daniels Midland": "adm.com",
  ADM: "adm.com",
  "Green Plains": "gpreinc.com",
  "Flint Hills Resources": "fhr.com",
  "Marquis Energy": "marquisenergy.com",
  "Southwest Iowa Renewable Energy": "sireethanol.com",
  LanzaJet: "lanzajet.com",
  LanzaTech: "lanzatech.com",
  Copersucar: "copersucar.com.br",
  "São Martinho": "saomartinho.com.br",
  Tereos: "tereos.com",
  "FS Bioenergia": "fs.agr.br",
  Inpasa: "inpasa.com.br",
  "Jalles Machado": "jalles.com",
  COFCO: "cofco.com",
  "Balrampur Chini Mills": "chini.com",
  "Shree Renuka Sugars": "renukasugars.com",
  "Triveni Engineering": "trivenigroup.com",
  "Bajaj Hindusthan Sugar": "bajajhindusthan.com",
  "Darling Ingredients": "darlingii.com",
  "Baker Commodities": "bakercommodities.com",
  "Mahoney Environmental": "mahoneyes.com",
  "Restaurant Technologies": "rti-inc.com",
  Sanimax: "sanimax.com",
  Olleco: "olleco.co.uk",
  "Argent Energy": "argentenergy.com",
  Greenergy: "greenergy.com",
  SARIA: "saria.com",
  Quatra: "quatra.com",
  "MBP Solutions": "mbpsolutions.com",
  Bunge: "bunge.com",
  Saipol: "saipol.com",
  "Archaea Energy": "archaeaenergy.com",
  "Montauk Renewables": "montaukrenewables.com",
  Enbridge: "enbridge.com",
  Brightmark: "brightmark.com",
  Chevron: "chevron.com",
  Ameresco: "ameresco.com",
  "OPAL Fuels": "opalfuels.com",
  Aemetis: "aemetis.com",
  DTE: "dteenergy.com",
  "Kinder Morgan": "kindermorgan.com",
  Fortistar: "fortistar.com",
  Anaergia: "anaergia.com",
  "Waga Energy": "waga-energy.com",
  GreenGasUSA: "greengasusa.com",
  Gasum: "gasum.com",
  Verbio: "verbio.de",
  "EnviTec Biogas": "envitec-biogas.com",
  Engie: "engie.com",
  "Air Liquide": "airliquide.com",
  "European Energy": "europeanenergy.com",
  "Liquid Wind": "liquidwind.com",
  Södra: "sodra.com",
  "Meva Energy": "mevaenergy.com",
  St1: "st1.com",
  Statkraft: "statkraft.com",
  BioMCN: "oci-global.com",
  OCI: "oci-global.com",
  Enerkem: "enerkem.com",
  Iberdrola: "iberdrola.com",
  Ørsted: "orsted.com",
  Lhyfe: "lhyfe.com",
  Linde: "linde.com",
  RWE: "rwe.com",
  Uniper: "uniper.energy",
  "Thyssenkrupp Nucera": "thyssenkrupp-nucera.com",
  Everfuel: "everfuel.com",
  Nel: "nelhydrogen.com",
  Yara: "yara.com",
  Fortescue: "fortescue.com",
  "ITM Power": "itm-power.com",
  EDP: "edp.com",
  Drax: "drax.com",
  Enviva: "envivabiomass.com",
  Lignetics: "lignetics.com",
  "Graanul Invest": "graanulinvest.com",
  "Stora Enso": "storaenso.com",
  UPM: "upm.com",
  SCA: "sca.com",
  Lantmännen: "lantmannen.com",
  Veolia: "veolia.com",
  Fortum: "fortum.com",
  Vattenfall: "vattenfall.com",
  "Georgia-Pacific": "gp.com",
  "Duke Energy": "duke-energy.com",
  "Southern Company": "southerncompany.com",
  Dominion: "dominionenergy.com",
  Boralex: "boralex.com",
  "BC Hydro": "bchydro.com",
  "Exomad Green": "exomadgreen.com",
  "Airex Energy": "airex-energy.com",
  Bioforcetech: "bioforcetech.com",
  "Pacific Biochar": "pacificbiochar.com",
  "Charm Industrial": "charmindustrial.com",
  Suzano: "suzano.com.br",
  "Carbo Culture": "carboculture.com",
  Novocarbo: "novocarbo.com",
  PYREG: "pyreg.com",
  Carbonfuture: "carbonfuture.earth",
  "Buckeye Partners": "buckeye.com",
  "NuStar Energy": "nustarenergy.com",
  Vopak: "vopak.com",
  Evos: "evos.eu",
  Oiltanking: "oiltanking.com",
  "HES International": "hesinternational.eu",
  Exolum: "exolum.com",
  GoodFuels: "goodfuels.com",
  "Exxon Mobil": "exxonmobil.com",
  Vitol: "vitol.com",
  Trafigura: "trafigura.com",
  "Bunker One": "bunkerone.com",
  Monjasa: "monjasa.com",
  ADNOC: "adnoc.ae",
  "Turkish Airlines": "turkishairlines.com",
  "Qatar Airways": "qatarairways.com",
  "Etihad Airways": "etihad.com",
  Saudia: "saudia.com",
  "Air India": "airindia.com",
  Cargill: "cargill.com",
  DFDS: "dfds.com",
  "Grimaldi Group": "grimaldi.napoli.it",
  "Yang Ming": "yangming.com",
};
Object.assign(NAME_DOMAINS, SUPPLY_DOMAINS, {
  "Air Products": "airproducts.com",
  "Adani New Industries": "adani.com",
  "Adani Total Gas": "adanitotalgas.com",
  "NEOM Green Hydrogen": "nghc.com",
  "Oman Hydrom": "hydrom.om",
  "Envision Energy": "envisioncn.com",
  "Envision Chifeng": "envisioncn.com",
});

function normalize(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
const normalizedDomains = Object.entries(NAME_DOMAINS)
  .map(([name, domain]) => [normalize(name), domain] as const)
  .sort((a, b) => b[0].length - a[0].length);
export function domainForName(name: string): string | undefined {
  const normalized = normalize(name);
  return normalizedDomains.find(
    ([brand]) => normalized === brand || normalized.startsWith(`${brand} `),
  )?.[1];
}

/** Honest final fallback: a company symbol, never fabricated logo initials. */
export const COMPANY_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#eef5f3"/><g fill="none" stroke="#176b58" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M16 50V19l21-6v37M37 27h11v23M12 50h40M24 24h5M24 32h5M24 40h5M43 34h1M43 42h1"/></g></svg>')}`;

/** Name lookup handles newly added companies without manually guessing a domain. */
export function companyNameLogo(name: string, size = 96): string | undefined {
  if (!TOKEN) return undefined;
  const brand = name.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  return `https://img.logo.dev/name/${encodeURIComponent(brand)}?token=${TOKEN}&size=${size}&format=png&retina=true&fallback=404`;
}
export function domainIcon(domain: string, size = 96) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size > 64 ? 128 : 64}`;
}
function build(domain: string | undefined, name: string, size: number): string {
  if (!domain) return companyNameLogo(name, size) ?? COMPANY_PLACEHOLDER;
  return TOKEN
    ? `https://img.logo.dev/${domain}?token=${TOKEN}&size=${size}&format=png&retina=true&fallback=404`
    : domainIcon(domain, size);
}
export function entityLogoByName(name: string, size = 96): string {
  return build(domainForName(name), name, size);
}
export function entityLogo(ticker: string, size = 96): string {
  return build(ENTITY_DOMAINS[ticker], ticker, size);
}
export function logoForDomain(domain: string, size = 64): string {
  return build(domain || undefined, domain || "Company", size);
}
