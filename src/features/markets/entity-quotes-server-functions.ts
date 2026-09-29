import { createServerFn } from "@tanstack/react-start";

export type { EntityQuote } from "./server/entity-quotes.server";

export const getEntityQuotesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadEntityQuotes } = await import("./server/entity-quotes.server");
  return loadEntityQuotes();
});
