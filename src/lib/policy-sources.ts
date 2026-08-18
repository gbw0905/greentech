/** RSS/Atom feeds scanned on every ingest run. Free, unmetered, and always on. */
export interface FeedSource {
  name: string;
  url: string;
}

const news = (q: string): string =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;

/**
 * Month-by-month backfill sweeps. Google News caps a single query's results, so
 * one query per month per theme is how the archive builds real history instead
 * of only the current fortnight.
 */
const MONTHLY_THEMES = [
  "biofuel policy mandate",
  "ethanol blending mandate government",
  "biodiesel mandate policy",
  "sustainable aviation fuel mandate policy",
  "renewable fuel standard EPA rule",
  "European Union RED III ReFuelEU biofuels",
  "biofuel market prices demand supply",
];

/** Rolling six-month window, matching the 180-day retention in the ingest job. */
export function backfillSources(months = 6): FeedSource[] {
  const out: FeedSource[] = [];
  const now = new Date();
  for (let i = 0; i < months; i += 1) {
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1));
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const range = `after:${start.toISOString().slice(0, 10)} before:${end.toISOString().slice(0, 10)}`;
    for (const theme of MONTHLY_THEMES) {
      out.push({ name: "Google News", url: news(`${theme} ${range}`) });
    }
  }
  return out;
}

export const FEED_SOURCES: FeedSource[] = [
  // Topic sweeps
  { name: "Google News", url: news("biofuel policy mandate when:180d") },
  { name: "Google News", url: news("ethanol blending mandate government when:180d") },
  { name: "Google News", url: news("biodiesel mandate policy when:180d") },
  { name: "Google News", url: news("renewable diesel policy regulation when:180d") },
  { name: "Google News", url: news("sustainable aviation fuel mandate policy when:180d") },
  { name: "Google News", url: news("biogas biomethane policy incentive when:180d") },
  { name: "Google News", url: news("renewable fuel standard RVO EPA when:180d") },
  // United States: 45Z / 45V / EPA / IRS
  { name: "Google News", url: news("\"45Z\" clean fuel production credit guidance when:180d") },
  { name: "Google News", url: news("\"45V\" clean hydrogen production credit rules when:180d") },
  { name: "Google News", url: news("IRS Treasury guidance clean fuel production credit biofuel when:180d") },
  { name: "Google News", url: news("EPA Renewable Fuel Standard rule RVO small refinery exemption when:180d") },
  { name: "Google News", url: news("EPA E15 ethanol waiver rule when:180d") },
  { name: "EPA Newsroom", url: "https://www.epa.gov/newsreleases/search/rss" },
  { name: "IRS Newsroom", url: "https://www.irs.gov/newsroom/feed" },
  { name: "Federal Register", url: "https://www.federalregister.gov/api/v1/documents.rss?conditions%5Bterm%5D=renewable%20fuel&conditions%5Bagencies%5D%5B%5D=environmental-protection-agency" },
  { name: "Federal Register", url: "https://www.federalregister.gov/api/v1/documents.rss?conditions%5Bterm%5D=clean%20fuel%20production%20credit" },
  { name: "Google News", url: news("\"Renewable Energy Directive\" biofuels when:180d") },
  { name: "Google News", url: news("low carbon fuel standard when:180d") },
  { name: "Google News", url: news("bioenergy policy legislation when:180d") },
  // Regional sweeps
  { name: "Google News", url: news("India ethanol blending programme policy when:180d") },
  { name: "Google News", url: news("Brazil RenovaBio biodiesel mandate when:180d") },
  { name: "Google News", url: news("Indonesia B40 biodiesel mandate when:180d") },
  { name: "Google News", url: news("European Union RefuelEU biofuels when:180d") },
  { name: "Google News", url: news("China biofuel policy when:180d") },
  { name: "Google News", url: news("Africa biofuel policy blending when:180d") },
  // European Union institutions and instruments
  { name: "Google News", url: news("\"RED III\" renewable energy directive transport target when:180d") },
  { name: "Google News", url: news("ReFuelEU Aviation SAF blending obligation when:180d") },
  { name: "Google News", url: news("FuelEU Maritime renewable fuel when:180d") },
  { name: "Google News", url: news("European Commission delegated act biofuels renewable fuels when:180d") },
  { name: "Google News", url: news("EU biofuel blending obligation member state when:180d") },
  { name: "Google News", url: news("\"Fit for 55\" biofuels aviation maritime when:180d") },
  { name: "European Commission", url: "https://ec.europa.eu/commission/presscorner/api/rss?language=en&pagesize=50" },
  { name: "European Commission Energy", url: "https://energy.ec.europa.eu/node/2/rss_en" },
  { name: "European Parliament", url: "https://www.europarl.europa.eu/rss/doc/top-stories/en.xml" },
  // Trade press
  { name: "Biofuels Digest", url: "https://www.biofuelsdigest.com/bdigest/feed/" },
  { name: "Biodiesel Magazine", url: "https://biodieselmagazine.com/rss/articles" },
  { name: "Ethanol Producer Magazine", url: "https://ethanolproducer.com/rss/articles" },
  { name: "Biomass Magazine", url: "https://biomassmagazine.com/rss/articles" },
  // Market sweeps (prices, supply, demand, investment)
  { name: "Google News", url: news("biofuel market prices demand supply when:90d") },
  { name: "Google News", url: news("ethanol prices market outlook when:90d") },
  { name: "Google News", url: news("biodiesel HVO feedstock prices market when:90d") },
  { name: "Google News", url: news("sustainable aviation fuel offtake supply deal when:180d") },
  { name: "Google News", url: news("renewable diesel capacity refinery investment when:180d") },
  { name: "Google News", url: news("biogas biomethane investment plant capacity when:180d") },
  { name: "Google News", url: news("biofuel exports imports trade when:90d") },
];
