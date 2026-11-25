import { marketCapLabel } from "../market-caps";

/**
 * Short line shown under a company name in supply charts: its stock ticker and
 * approximate market cap, or that it is not listed. Live share prices were
 * removed (they came from an unlicensed Yahoo Finance feed).
 */
export function listingMeta(ticker: string | null | undefined): string {
  if (!ticker) return "Private / state-owned";
  const cap = marketCapLabel(ticker);
  return cap ? `${ticker} · ${cap}` : ticker;
}
