import { useQuery } from "@tanstack/react-query";
import {
  getCountryProfileFn,
  getCountryMandatesFn,
  getGovernmentSitesFn,
} from "@/features/policy/country-server-functions";

export function useCountryProfile(slug: string) {
  return useQuery({
    queryKey: ["country-profile", slug],
    queryFn: () => getCountryProfileFn({ data: slug }),
    staleTime: 5 * 60_000,
  });
}

export function useCountryMandates(slug: string) {
  return useQuery({
    queryKey: ["country-mandates", slug],
    queryFn: () => getCountryMandatesFn({ data: slug }),
    staleTime: 5 * 60_000,
  });
}

export function useGovernmentSites(slug: string) {
  return useQuery({
    queryKey: ["country-gov-sites", slug],
    queryFn: () => getGovernmentSitesFn({ data: slug }),
    staleTime: 5 * 60_000,
  });
}
