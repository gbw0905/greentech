/**
 * Each country's main stock-market index, named for context on the map.
 * The site no longer shows index levels (they need an exchange data licence).
 * Countries without their own tracked index are left out rather than shown a
 * stand-in index from another market.
 */
export interface CountryMarket {
  /** Index short name */
  index: string;
  currency: string;
  /** Rough share of national primary energy from bioenergy / other context */
  note?: string;
}

export const COUNTRY_MARKETS: Record<string, CountryMarket> = {
  "united-states": { index: "S&P 500", currency: "USD" },
  canada: { index: "S&P/TSX", currency: "CAD" },
  brazil: { index: "Bovespa", currency: "BRL" },
  argentina: { index: "Merval", currency: "ARS" },
  "european-union": { index: "Euro Stoxx 50", currency: "EUR" },
  germany: { index: "DAX", currency: "EUR" },
  france: { index: "CAC 40", currency: "EUR" },
  netherlands: { index: "AEX", currency: "EUR" },
  "united-kingdom": { index: "FTSE 100", currency: "GBP" },
  sweden: { index: "OMX Stockholm 30", currency: "SEK" },
  india: { index: "Nifty 50", currency: "INR" },
  indonesia: { index: "IDX Composite", currency: "IDR" },
  china: { index: "SSE Composite", currency: "CNY" },
  japan: { index: "Nikkei 225", currency: "JPY" },
  "south-korea": { index: "KOSPI", currency: "KRW" },
  australia: { index: "ASX 200", currency: "AUD" },
  thailand: { index: "SET Index", currency: "THB" },
  malaysia: { index: "FTSE Bursa KLCI", currency: "MYR" },
  philippines: { index: "PSEi", currency: "PHP" },
  "south-africa": { index: "JSE All Share", currency: "ZAR" },
  "saudi-arabia": { index: "Tadawul TASI", currency: "SAR" },
};
