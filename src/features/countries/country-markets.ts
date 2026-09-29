/** Country benchmark equity index and headline market parameters. */
export interface CountryMarket {
  /** Yahoo Finance symbol for the benchmark index */
  symbol: string;
  /** Index short name */
  index: string;
  currency: string;
  /** Rough share of national primary energy from bioenergy / other context */
  note?: string;
}

export const COUNTRY_MARKETS: Record<string, CountryMarket> = {
  "united-states": { symbol: "^GSPC", index: "S&P 500", currency: "USD" },
  canada: { symbol: "^GSPTSE", index: "S&P/TSX", currency: "CAD" },
  brazil: { symbol: "^BVSP", index: "Bovespa", currency: "BRL" },
  argentina: { symbol: "^MERV", index: "Merval", currency: "ARS" },
  colombia: { symbol: "^GSPC", index: "S&P 500 (proxy)", currency: "USD" },
  "european-union": { symbol: "^STOXX50E", index: "Euro Stoxx 50", currency: "EUR" },
  germany: { symbol: "^GDAXI", index: "DAX", currency: "EUR" },
  france: { symbol: "^FCHI", index: "CAC 40", currency: "EUR" },
  netherlands: { symbol: "^AEX", index: "AEX", currency: "EUR" },
  "united-kingdom": { symbol: "^FTSE", index: "FTSE 100", currency: "GBP" },
  sweden: { symbol: "^OMX", index: "OMX Stockholm 30", currency: "SEK" },
  india: { symbol: "^NSEI", index: "Nifty 50", currency: "INR" },
  indonesia: { symbol: "^JKSE", index: "IDX Composite", currency: "IDR" },
  china: { symbol: "000001.SS", index: "SSE Composite", currency: "CNY" },
  japan: { symbol: "^N225", index: "Nikkei 225", currency: "JPY" },
  "south-korea": { symbol: "^KS11", index: "KOSPI", currency: "KRW" },
  australia: { symbol: "^AXJO", index: "ASX 200", currency: "AUD" },
  thailand: { symbol: "^SET.BK", index: "SET Index", currency: "THB" },
  malaysia: { symbol: "^KLSE", index: "FTSE Bursa KLCI", currency: "MYR" },
  philippines: { symbol: "PSEI.PS", index: "PSEi", currency: "PHP" },
  "south-africa": { symbol: "^J203.JO", index: "JSE All Share", currency: "ZAR" },
  nigeria: { symbol: "^GSPC", index: "S&P 500 (proxy)", currency: "USD" },
  kenya: { symbol: "^GSPC", index: "S&P 500 (proxy)", currency: "USD" },
  "united-arab-emirates": { symbol: "^TASI.SR", index: "Gulf benchmark (TASI)", currency: "SAR" },
  "saudi-arabia": { symbol: "^TASI.SR", index: "Tadawul TASI", currency: "SAR" },
};
