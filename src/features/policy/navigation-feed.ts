import type { QueryClient } from "@tanstack/react-query";
import { feedQuery } from "./feed-query";
import type { PolicyFeed } from "./contracts";

/** Reuse the live client query during navigation; initial SSR still reads the same endpoint. */
export async function loadNavigationFeed(
  queryClient: QueryClient,
): Promise<{ feed: PolicyFeed | null }> {
  try {
    // ensureQueryData also joins an in-flight request and returns cached data immediately.
    // Mounted useQuery observers retain their existing background refresh intervals.
    const feed = await queryClient.ensureQueryData({ ...feedQuery, retry: false });
    return { feed };
  } catch {
    return { feed: null };
  }
}
