import type { FuelType, Region } from "./policy-taxonomy";

export interface PolicyUpdate {
  id: string;
  title: string;
  category: "policy" | "market";
  summary: string;
  url: string;
  source: string;
  publishedAt: string | null;
  createdAt: string;
  region: Region;
  countrySlug: string | null;
  countryName: string | null;
  fuels: FuelType[];
}

export interface PolicyFeed {
  updates: PolicyUpdate[];
  fetchedAt: string;
  error: string | null;
}
