import type { FuelType } from "@/features/policy/taxonomy";

export type JobCategory =
  | "Engineering"
  | "Operations & Plant"
  | "Policy & Regulatory"
  | "R&D / Science"
  | "Commercial & Trading"
  | "Sustainability & ESG";

export type Seniority = "Internship" | "Entry level" | "Mid level" | "Senior" | "Director / Head";

export interface Employer {
  name: string;
  hq: string;
  focus: FuelType[];
  careers: string;
}

export interface JobRegion {
  name: string;
  location: string;
}

export interface JobQuery {
  keywords: string;
  location: string;
}

export interface JobBoard {
  name: string;
  note: string;
  domain: string;
  url: (query: JobQuery) => string;
}
