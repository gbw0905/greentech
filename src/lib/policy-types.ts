import type { FuelType, Region } from "./policy-taxonomy";

export interface PolicyUpdate {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string | null;
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
