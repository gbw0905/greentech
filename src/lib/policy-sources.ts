/** RSS/Atom feeds scanned on every ingest run. Free, unmetered, and always on. */
export interface FeedSource {
  name: string;
  url: string;
}

const news = (q: string): string =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;

export const FEED_SOURCES: FeedSource[] = [
  // Topic sweeps
  { name: "Google News", url: news("biofuel policy mandate when:14d") },
  { name: "Google News", url: news("ethanol blending mandate government when:14d") },
  { name: "Google News", url: news("biodiesel mandate policy when:14d") },
  { name: "Google News", url: news("renewable diesel policy regulation when:14d") },
  { name: "Google News", url: news("sustainable aviation fuel mandate policy when:14d") },
  { name: "Google News", url: news("biogas biomethane policy incentive when:14d") },
  { name: "Google News", url: news("renewable fuel standard RVO EPA when:14d") },
  // United States: 45Z / 45V / EPA / IRS
  { name: "Google News", url: news("\"45Z\" clean fuel production credit guidance when:21d") },
  { name: "Google News", url: news("\"45V\" clean hydrogen production credit rules when:21d") },
  { name: "Google News", url: news("IRS Treasury guidance clean fuel production credit biofuel when:21d") },
  { name: "Google News", url: news("EPA Renewable Fuel Standard rule RVO small refinery exemption when:21d") },
  { name: "Google News", url: news("EPA E15 ethanol waiver rule when:21d") },
  { name: "EPA Newsroom", url: "https://www.epa.gov/newsreleases/search/rss" },
  { name: "IRS Newsroom", url: "https://www.irs.gov/newsroom/feed" },
  { name: "Federal Register", url: "https://www.federalregister.gov/api/v1/documents.rss?conditions%5Bterm%5D=renewable%20fuel&conditions%5Bagencies%5D%5B%5D=environmental-protection-agency" },
  { name: "Federal Register", url: "https://www.federalregister.gov/api/v1/documents.rss?conditions%5Bterm%5D=clean%20fuel%20production%20credit" },
  { name: "Google News", url: news("\"Renewable Energy Directive\" biofuels when:14d") },
  { name: "Google News", url: news("low carbon fuel standard when:14d") },
  { name: "Google News", url: news("bioenergy policy legislation when:14d") },
  // Regional sweeps
  { name: "Google News", url: news("India ethanol blending programme policy when:14d") },
  { name: "Google News", url: news("Brazil RenovaBio biodiesel mandate when:14d") },
  { name: "Google News", url: news("Indonesia B40 biodiesel mandate when:14d") },
  { name: "Google News", url: news("European Union RefuelEU biofuels when:14d") },
  { name: "Google News", url: news("China biofuel policy when:14d") },
  { name: "Google News", url: news("Africa biofuel policy blending when:14d") },
  // Trade press
  { name: "Biofuels Digest", url: "https://www.biofuelsdigest.com/bdigest/feed/" },
  { name: "Biodiesel Magazine", url: "https://biodieselmagazine.com/rss/articles" },
  { name: "Ethanol Producer Magazine", url: "https://ethanolproducer.com/rss/articles" },
  { name: "Biomass Magazine", url: "https://biomassmagazine.com/rss/articles" },
  // Market sweeps (prices, supply, demand, investment)
  { name: "Google News", url: news("biofuel market prices demand supply when:7d") },
  { name: "Google News", url: news("ethanol prices market outlook when:7d") },
  { name: "Google News", url: news("biodiesel HVO feedstock prices market when:7d") },
  { name: "Google News", url: news("sustainable aviation fuel offtake supply deal when:14d") },
  { name: "Google News", url: news("renewable diesel capacity refinery investment when:14d") },
  { name: "Google News", url: news("biogas biomethane investment plant capacity when:14d") },
  { name: "Google News", url: news("biofuel exports imports trade when:7d") },
];
