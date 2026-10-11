export const SUPPLY_SOURCE_TYPES = ["api", "rss", "csv", "xlsx", "pdf", "html", "manual"] as const;
export type SupplySourceType = (typeof SUPPLY_SOURCE_TYPES)[number];

export const SUPPLY_REFRESH_CADENCES = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "annual",
  "manual",
] as const;
export type SupplyRefreshCadence = (typeof SUPPLY_REFRESH_CADENCES)[number];

export type SupplyMetricReference = {
  label: string;
  unit: string;
  basis: string;
  estimated?: boolean;
};

export type SupplyJson =
  | string
  | number
  | boolean
  | null
  | { [key: string]: SupplyJson }
  | SupplyJson[];

export type SupplyDatasetRegistryEntry = {
  id: string;
  panel: string;
  description: string;
  reportingYear: number;
  lastReviewed: string;
  metrics: SupplyMetricReference[];
  coverage: string;
  limitations: string[];
};

export type SupplySourceRegistryEntry = {
  id: string;
  datasetId: string;
  org: string;
  title: string;
  url: string;
  year: number;
  sourceType: SupplySourceType;
  parserId: string | null;
  refreshCadence: SupplyRefreshCadence;
  priority: number;
  active: boolean;
  notes?: string;
};

export type SupplyObservationValue = {
  metricKey: string;
  metricLabel: string;
  value: number | null;
  unit: string;
  reportingYear: number | null;
  basis: string;
  estimated: boolean;
  confidence: "reported" | "derived" | "estimated" | "unknown";
  sourceId: string | null;
  sourceUrl: string | null;
  observedAt: string;
};

export type SupplyEntityRow = {
  id: string;
  name: string;
  country: string | null;
  entityType: string;
  metadata: Record<string, SupplyJson>;
  observations: SupplyObservationValue[];
};

export type SupplyDatasetPayload = {
  datasetId: string;
  fetchedAt: string;
  dynamic: boolean;
  registry: SupplyDatasetRegistryEntry | null;
  sources: SupplySourceRegistryEntry[];
  latestIngest: SupplyIngestRunSummary | null;
  freshness: SupplyDatasetFreshness | null;
  rows: SupplyEntityRow[];
  error: string | null;
};

export type SupplyIngestRunSummary = {
  status: "pending" | "running" | "success" | "failed" | "skipped";
  parserId: string | null;
  rowsSeen: number;
  rowsUpserted: number;
  startedAt: string;
  finishedAt: string | null;
  sourceUrl: string | null;
  reportingYear: number | null;
};

export type SupplyDatasetFreshness = {
  cadence: SupplyRefreshCadence | null;
  stale: boolean;
  staleAfter: string | null;
  nextRefreshAfter: string | null;
  checkedAt: string;
};

export type ParsedSupplyObservation = {
  metricKey: string;
  metricLabel: string;
  value: number | null;
  unit: string;
  reportingYear: number | null;
  basis: string;
  estimated: boolean;
  confidence: SupplyObservationValue["confidence"];
  sourceUrl: string | null;
  raw?: SupplyJson;
};

export type ParsedSupplyEntity = {
  name: string;
  country: string | null;
  entityType: string;
  sourceEntityKey: string | null;
  metadata?: Record<string, SupplyJson>;
  observations: ParsedSupplyObservation[];
};

export type ParsedSupplyDataset = {
  datasetId: string;
  sourceUrl: string;
  reportingYear: number | null;
  entities: ParsedSupplyEntity[];
  rowsSeen: number;
  metadata?: Record<string, SupplyJson>;
};

export type SupplyIngestResult = {
  datasetId: string;
  parserId: string;
  ok: boolean;
  sourceId: string | null;
  rowsSeen: number;
  entitiesUpserted: number;
  observationsUpserted: number;
  error: string | null;
};

export type SupplyStaleRefreshResult = {
  datasetId: string;
  ok: boolean;
  skipped: boolean;
  reason: string | null;
  freshness: SupplyDatasetFreshness | null;
  results: SupplyIngestResult[];
};
