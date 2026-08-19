import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getEntityQuotesFn, type EntityQuote } from "./entity-quotes.functions";

/** Live share prices for every entity charted on the site (5-minute refresh). */
export function useEntityQuotes() {
  const { data } = useQuery({
    queryKey: ["entity-quotes"],
    queryFn: () => getEntityQuotesFn(),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
    gcTime: Infinity,
  });
  const quotes: Record<string, EntityQuote> = data?.quotes ?? {};
  return {
    quotes,
    /** Price for a ticker, or null when unlisted / not yet loaded. */
    get: (ticker: string | null | undefined) => (ticker ? (quotes[ticker] ?? null) : null),
  };
}

export const priceMeta = (q: { price: number; changePct: number } | null) =>
  q
    ? `${q.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%`
    : "Private / state-owned";

export const priceTone = (q: { changePct: number } | null) =>
  q ? (q.changePct >= 0 ? ("up" as const) : ("down" as const)) : ("default" as const);
