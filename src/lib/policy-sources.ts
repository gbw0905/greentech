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
];
