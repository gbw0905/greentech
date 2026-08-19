import { createServerFn } from "@tanstack/react-start";

export type { EntityQuote } from "./entity-quotes.server";

export const getEntityQuotesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadEntityQuotes } = await import("./entity-quotes.server");
  return loadEntityQuotes();
});
