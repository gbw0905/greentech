import type { FuelType, Region } from "@/features/policy/taxonomy";

export type VideoPlatform = "YouTube" | "Web";

export interface VideoEntry {
  title: string;
  source: string;
  platform: VideoPlatform;
  blurb: string;
  url: string;
  regions: Region[];
  countries: string[];
  fuels: FuelType[];
  policies: string[];
}

export interface LiveVideo {
  id: string;
  title: string;
  channel: string;
  published: string;
  duration: string;
  thumbnail: string;
  url: string;
  keyword: string;
  kind: "youtube";
}

export interface LiveArticle {
  title: string;
  source: string;
  published: string;
  url: string;
  keyword: string;
  kind: "web";
}
