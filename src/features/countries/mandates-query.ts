import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { getAllMandatesFn } from "@/features/policy/country-server-functions";
import type { Mandate } from "./mandates";

export const mandatesQuery = queryOptions({
  queryKey: ["all-mandates"],
  queryFn: () => getAllMandatesFn(),
  staleTime: 5 * 60 * 1000,
  refetchInterval: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
  retry: 3,
});

export async function loadMandates(
  queryClient: QueryClient,
): Promise<{ mandates: Mandate[] | null }> {
  try {
    return { mandates: await queryClient.ensureQueryData(mandatesQuery) };
  } catch {
    return { mandates: null };
  }
}

export function mandatesQueryWithInitial(initial: Mandate[] | null) {
  return initial ? { ...mandatesQuery, initialData: initial } : mandatesQuery;
}
