import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchUpdates from "./tools/search-updates";
import listJurisdictions from "./tools/list-jurisdictions";
import getCountryProfile from "./tools/get-country-profile";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "global-bioenergy-watch",
  title: "Global Bioenergy Watch",
  version: "0.1.0",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  instructions:
    "Tools for Global Bioenergy Watch, a tracker of global bioenergy policy and market updates. Use `list_jurisdictions` to discover country slugs and policy status, `get_country_profile` for a jurisdiction's mandates plus its latest updates, and `search_policy_updates` to search the live feed by keyword, country, region, fuel or category. All data is public and read-only.",
  tools: [searchUpdates, listJurisdictions, getCountryProfile].map(
    (t) => t as unknown as Parameters<typeof defineMcp>[0]["tools"][number],
  ),
});
