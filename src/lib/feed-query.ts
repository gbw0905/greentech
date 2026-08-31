import { queryOptions } from "@tanstack/react-query";
import { getPolicyFeed } from "@/lib/policy.functions";
import type { PolicyFeed } from "@/lib/policy-types";

export const feedQuery = queryOptions({
  queryKey: ["policy-feed"],
  queryFn: () => getPolicyFeed(),
  staleTime: 5 * 60 * 1000,
  refetchInterval: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
  retry: 3,
});

/**
 * Loads the feed on the server so updates ship inside the HTML for every
 * visitor, even if their browser's follow-up request fails. Never throws:
 * on failure the client query simply fetches and retries.
 */
export async function loadFeed(): Promise<{ feed: PolicyFeed | null }> {
  try {
    return { feed: (await getPolicyFeed()) as PolicyFeed };
  } catch {
    return { feed: null };
  }
}

/** Query options seeded with server-rendered data when it is available. */
export function feedQueryWithInitial(initial: PolicyFeed | null) {
  return initial ? { ...feedQuery, initialData: initial } : feedQuery;
}
