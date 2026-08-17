import { defineMcp, type AnyToolDefinition } from "@lovable.dev/mcp-js";
import searchUpdates from "./tools/search-updates";
import listJurisdictions from "./tools/list-jurisdictions";
import getCountryProfile from "./tools/get-country-profile";

export default defineMcp({
  name: "global-bioenergy-watch",
  title: "Global Bioenergy Watch",
  version: "0.1.0",
  instructions:
    "Tools for Global Bioenergy Watch, a tracker of global bioenergy policy and market updates. Use `list_jurisdictions` to discover country slugs and policy status, `get_country_profile` for a jurisdiction's mandates plus its latest updates, and `search_policy_updates` to search the live feed by keyword, country, region, fuel or category. All data is public and read-only.",
  tools: [searchUpdates, listJurisdictions, getCountryProfile] as AnyToolDefinition[],
});
