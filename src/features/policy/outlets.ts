/**
 * Policy allow-list of authentic global media outlets, wire services, trade journals
 * and official government publishers. Anything outside this list is dropped by
 * the ingest pipeline so the tracker never publishes content-farm articles.
 */
export const TRUSTED_OUTLETS: string[] = [
  // Wire services & global newspapers of record
  "reuters.com",
  "apnews.com",
  "bloomberg.com",
  "ft.com",
  "wsj.com",
  "nytimes.com",
  "washingtonpost.com",
  "theguardian.com",
  "bbc.com",
  "bbc.co.uk",
  "cnbc.com",
  "economist.com",
  "aljazeera.com",
  "afp.com",
  "dw.com",
  "france24.com",
  "politico.com",
  "politico.eu",
  "euractiv.com",
  "euronews.com",
  "nikkei.com",
  "japantimes.co.jp",
  "scmp.com",
  "straitstimes.com",
  "channelnewsasia.com",
  "thehindu.com",
  "hindustantimes.com",
  "indianexpress.com",
  "livemint.com",
  "business-standard.com",
  "economictimes.indiatimes.com",
  "timesofindia.indiatimes.com",
  "moneycontrol.com",
  "thejakartapost.com",
  "jakartaglobe.id",
  "bangkokpost.com",
  "koreaherald.com",
  "abc.net.au",
  "smh.com.au",
  "afr.com",
  "theglobeandmail.com",
  "cbc.ca",
  "folha.uol.com.br",
  "globo.com",
  "valor.globo.com",
  "elpais.com",
  "lemonde.fr",
  "spiegel.de",
  "handelsblatt.com",
  "faz.net",
  "corriere.it",
  "reuters.co.uk",
  "thetimes.co.uk",
  "telegraph.co.uk",
  "independent.co.uk",
  "forbes.com",
  "fortune.com",
  "axios.com",
  "thehill.com",
  "npr.org",
  "pbs.org",
  "usatoday.com",
  "latimes.com",
  "businesstimes.com.sg",
  "arabnews.com",
  "thenationalnews.com",
  "zawya.com",
  "aninews.in",
  "thestatesman.com",
  "engineeringnews.co.za",
  "bwbusinessworld.com",
  "antaranews.com",
  "quantumcommodityintelligence.com",
  "biofuels-news.com",
  "chinimandi.com",
  "thewire.in",
  "thenewsminute.com",
  "etgovernment.com",
  "outlookbusiness.com",
  "dailypioneer.com",
  "financialexpress.com",
  "deccanherald.com",
  "africanews.com",
  "businessday.ng",
  "nation.africa",
  "mg.co.za",
  "news24.com",
  // Energy & commodity specialist press
  "spglobal.com",
  "argusmedia.com",
  "opisnet.com",
  "rigzone.com",
  "oilprice.com",
  "energyintel.com",
  "hartenergy.com",
  "worldoil.com",
  "upstreamonline.com",
  "rechargenews.com",
  "montelnews.com",
  "icis.com",
  "fastmarkets.com",
  "biofuelsdigest.com",
  "biodieselmagazine.com",
  "ethanolproducer.com",
  "biomassmagazine.com",
  "agriculture.com",
  "agweb.com",
  "dtnpf.com",
  "successfulfarming.com",
  "greenairnews.com",
  "simpleflying.com",
  "flightglobal.com",
  "aviationweek.com",
  "carboncredits.com",
  "carbonbrief.org",
  "climatechangenews.com",
  "greentechmedia.com",
  "canarymedia.com",
  "utilitydive.com",
  "energylivenews.com",
  "renewablesnow.com",
  "pv-magazine.com",
  "hydrogeninsight.com",
  // Official / institutional publishers
  "epa.gov",
  "irs.gov",
  "energy.gov",
  "usda.gov",
  "federalregister.gov",
  "whitehouse.gov",
  "congress.gov",
  "treasury.gov",
  "ca.gov",
  "arb.ca.gov",
  "europa.eu",
  "ec.europa.eu",
  "consilium.europa.eu",
  "europarl.europa.eu",
  "gov.uk",
  "canada.ca",
  "gov.br",
  "pib.gov.in",
  "gov.in",
  "iea.org",
  "irena.org",
  "unfccc.int",
  "icao.int",
  "fao.org",
  "worldbank.org",
  "oecd.org",
];

const NAME_ALIASES: Record<string, string> = {
  reuters: "reuters.com",
  "the associated press": "apnews.com",
  ap: "apnews.com",
  bloomberg: "bloomberg.com",
  "financial times": "ft.com",
  "the wall street journal": "wsj.com",
  "the new york times": "nytimes.com",
  "the guardian": "theguardian.com",
  bbc: "bbc.com",
  "bbc news": "bbc.com",
  cnbc: "cnbc.com",
  politico: "politico.com",
  euractiv: "euractiv.com",
  "epa newsroom": "epa.gov",
  "irs newsroom": "irs.gov",
  "federal register": "federalregister.gov",
  "biofuels digest": "biofuelsdigest.com",
  "biodiesel magazine": "biodieselmagazine.com",
  "ethanol producer magazine": "ethanolproducer.com",
  "biomass magazine": "biomassmagazine.com",
  "european commission": "ec.europa.eu",
  "european commission energy": "ec.europa.eu",
  "european parliament": "europarl.europa.eu",
  "gov.uk": "gov.uk",
};

const normalise = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/^www\./, "");

/** True when the publisher (feed <source> name or article host) is an authentic outlet. */
const GOV_SUFFIXES = [
  ".gov",
  ".gov.uk",
  ".gov.in",
  ".gov.au",
  ".gov.br",
  ".gov.sg",
  ".gc.ca",
  ".go.id",
  ".go.jp",
  ".govt.nz",
  ".gob.es",
  ".gouv.fr",
  ".europa.eu",
  ".int",
];

export function isTrustedOutlet(source: string, link: string): boolean {
  const candidates: string[] = [];
  const s = normalise(source);
  if (s) {
    candidates.push(s);
    const alias = NAME_ALIASES[s];
    if (alias) candidates.push(alias);
  }
  try {
    candidates.push(normalise(new URL(link).hostname));
  } catch {
    /* ignore malformed links */
  }
  if (candidates.some((c) => GOV_SUFFIXES.some((g) => c.endsWith(g) || c.includes(g + ".")))) {
    return true;
  }
  if (
    candidates.some((c) =>
      TRUSTED_OUTLETS.some((t) => c === t || c.endsWith(`.${t}`) || c.includes(t)),
    )
  ) {
    return true;
  }
  // Google News reports the publisher by name, e.g. "The Hindu" -> thehindu.com
  const compact = s.replace(/[^a-z0-9]/g, "");
  if (compact.length < 4) return false;
  return TRUSTED_OUTLETS.some((t) => {
    const root = t.split(".")[0]!;
    return (
      root.length >= 4 && (root === compact || compact.includes(root) || root.includes(compact))
    );
  });
}

/** True when the publisher is a government, parliament or intergovernmental body. */
export function isOfficialSource(source: string, link: string): boolean {
  const candidates: string[] = [];
  const s = normalise(source);
  if (s) {
    candidates.push(s);
    const alias = NAME_ALIASES[s];
    if (alias) candidates.push(alias);
  }
  try {
    candidates.push(normalise(new URL(link).hostname));
  } catch {
    /* ignore malformed links */
  }
  const OFFICIAL_HOSTS = [
    "federalregister.gov",
    "epa.gov",
    "irs.gov",
    "energy.gov",
    "usda.gov",
    "treasury.gov",
    "whitehouse.gov",
    "congress.gov",
    "arb.ca.gov",
    "ca.gov",
    "gov.uk",
    "canada.ca",
    "europa.eu",
    "ec.europa.eu",
    "europarl.europa.eu",
    "consilium.europa.eu",
    "pib.gov.in",
    "gov.in",
    "gov.br",
    "iea.org",
    "irena.org",
    "icao.int",
    "unfccc.int",
  ];
  return candidates.some(
    (c) =>
      GOV_SUFFIXES.some((g) => c.endsWith(g) || c.includes(g + ".")) ||
      OFFICIAL_HOSTS.some((h) => c === h || c.endsWith(`.${h}`)),
  );
}
