import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type { LiveCountryProfile } from "@/features/policy/server/country-data.server";

export type { LiveCountryProfile };

/** Map colours and pop-ups: database profiles kept current by the updater. */
export const getLiveCountryProfilesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getAllCountryProfiles } = await import("@/features/policy/server/country-data.server");
  return getAllCountryProfiles();
});

export const liveCountryProfilesQuery = queryOptions({
  queryKey: ["live-country-profiles"],
  queryFn: () => getLiveCountryProfilesFn(),
  staleTime: 10 * 60_000,
});
