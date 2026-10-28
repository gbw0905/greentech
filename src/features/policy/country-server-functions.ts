import { createServerFn } from "@tanstack/react-start";

export const getCountryProfileFn = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const { getCountryProfile } = await import("./server/country-data.server");
    return getCountryProfile(slug);
  });

export const getCountryMandatesFn = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const { getCountryMandates } = await import("./server/country-data.server");
    return getCountryMandates(slug);
  });

export const getAllMandatesFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const { getAllMandates } = await import("./server/country-data.server");
    return getAllMandates();
  });

export const getGovernmentSitesFn = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const { getGovernmentSites } = await import("./server/country-data.server");
    return getGovernmentSites(slug);
  });
