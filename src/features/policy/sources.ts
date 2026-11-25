/** RSS/Atom feeds scanned by the policy ingestion pipeline. */
export interface FeedSource {
  name: string;
  url: string;
}

/**
 * Only feeds published by the original source: government bodies, regulators
 * and trade or news publishers' own RSS/Atom feeds. Every stored item links
 * straight to the publisher's page.
 *
 * Google News searches were removed (Google's terms limit its feeds to
 * personal, non-commercial use). Broad feeds such as EUR-Lex or the NZ
 * Beehive publish everything; the ingest's keyword rules (`categorise`) keep
 * only bioenergy items.
 *
 * Every URL here was checked to return a valid feed with recent items when it
 * was added (Nov 2026). Feeds that answered 403/404 were left out: Biofuels
 * Digest (403), Biodiesel / Ethanol Producer / Biomass Magazine (feeds 404 after
 * their site redesign), European Parliament (403), EPA, USDA, IEA, IRENA, ICAO,
 * IMO, Brazil ANP/MME and Indonesia ESDM (no working public feed found).
 */
export const FEED_SOURCES: FeedSource[] = [
  // United States: official documents and agencies
  {
    name: "Federal Register",
    url: "https://www.federalregister.gov/api/v1/documents.rss?conditions%5Bterm%5D=renewable%20fuel&conditions%5Bagencies%5D%5B%5D=environmental-protection-agency",
  },
  {
    name: "Federal Register",
    url: "https://www.federalregister.gov/api/v1/documents.rss?conditions%5Bterm%5D=clean%20fuel%20production%20credit",
  },
  {
    name: "Federal Register",
    url: "https://www.federalregister.gov/api/v1/documents.rss?conditions%5Bterm%5D=biofuel",
  },
  {
    name: "Federal Register",
    url: "https://www.federalregister.gov/api/v1/documents.rss?conditions%5Bterm%5D=ethanol",
  },
  {
    name: "Federal Register",
    url: "https://www.federalregister.gov/api/v1/documents.rss?conditions%5Bterm%5D=biodiesel",
  },
  {
    name: "Federal Register",
    url: "https://www.federalregister.gov/api/v1/documents.rss?conditions%5Bterm%5D=sustainable%20aviation%20fuel",
  },
  {
    name: "Federal Register",
    url: "https://www.federalregister.gov/api/v1/documents.rss?conditions%5Bterm%5D=renewable%20volume%20obligation",
  },
  { name: "US Department of Energy", url: "https://www.energy.gov/rss/news.xml" },
  { name: "US Energy Information Administration", url: "https://www.eia.gov/rss/press_rss.xml" },
  {
    name: "US Energy Information Administration",
    url: "https://www.eia.gov/rss/todayinenergy.xml",
  },
  { name: "California Air Resources Board", url: "https://ww2.arb.ca.gov/rss.xml" },
  // Canada
  {
    name: "Natural Resources Canada",
    url: "https://api.io.canada.ca/io-server/gc/news/en/v2?dept=naturalresourcescanada&type=newsreleases&sort=publishedDate&orderBy=desc&pick=50&format=atom",
  },
  // United Kingdom
  { name: "GOV.UK", url: "https://www.gov.uk/search/all.atom?keywords=biofuel" },
  { name: "GOV.UK", url: "https://www.gov.uk/search/all.atom?keywords=bioenergy" },
  {
    name: "GOV.UK",
    url: "https://www.gov.uk/search/all.atom?keywords=renewable+transport+fuel+obligation",
  },
  { name: "GOV.UK", url: "https://www.gov.uk/search/all.atom?keywords=sustainable+aviation+fuel" },
  {
    name: "GOV.UK",
    url: "https://www.gov.uk/government/organisations/department-for-transport.atom",
  },
  // European Union institutions and legislation
  {
    name: "European Commission",
    url: "https://ec.europa.eu/commission/presscorner/api/rss?language=en&pagesize=50",
  },
  { name: "European Commission Energy", url: "https://energy.ec.europa.eu/node/2/rss_en" },
  { name: "EUR-Lex", url: "https://eur-lex.europa.eu/EN/display-feed.rss?rssId=162" },
  // Asia-Pacific
  { name: "New Zealand Government", url: "https://www.beehive.govt.nz/rss.xml" },
  { name: "Antara News", url: "https://en.antaranews.com/rss/news.xml" },
  {
    name: "ET EnergyWorld",
    url: "https://energy.economictimes.indiatimes.com/rss/oil-and-gas",
  },
  { name: "ET EnergyWorld", url: "https://energy.economictimes.indiatimes.com/rss/renewable" },
  // Trade press and specialist publishers
  { name: "Bioenergy International", url: "https://bioenergyinternational.com/feed/" },
  { name: "Canary Media", url: "https://www.canarymedia.com/rss" },
  { name: "Energy Monitor", url: "https://www.energymonitor.ai/feed/" },
  { name: "ICCT", url: "https://theicct.org/feed/" },
  { name: "Mongabay", url: "https://news.mongabay.com/feed/" },
  // Industry associations (press releases, labelled with the association's name)
  { name: "Clean Fuels Alliance America", url: "https://cleanfuels.org/feed/" },
  { name: "Growth Energy", url: "https://growthenergy.org/feed/" },
];
