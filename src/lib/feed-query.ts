import { queryOptions } from "@tanstack/react-query";
import { getPolicyFeed } from "@/lib/policy.functions";

export const feedQuery = queryOptions({
  queryKey: ["policy-feed"],
  queryFn: () => getPolicyFeed(),
  staleTime: 5 * 60 * 1000,
  refetchInterval: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
});
