import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { getPolicyFeed } from "@/lib/policy.functions";

export const feedQuery = queryOptions({
  queryKey: ["policy-feed"],
  queryFn: () => getPolicyFeed(),
  staleTime: 5 * 60 * 1000,
  refetchInterval: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
  retry: 3,
});

/**
 * Warms the feed on the server so updates are in the HTML for every visitor,
 * even when their browser's follow-up request to the server function fails.
 * Never throws: a failed prefetch just falls back to client fetching.
 */
export async function prefetchFeed(queryClient: QueryClient) {
  try {
    await queryClient.ensureQueryData(feedQuery);
  } catch {
    /* client will retry */
  }
}
