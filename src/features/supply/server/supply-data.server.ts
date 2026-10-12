import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";
import type {
  SupplyDatasetPayload,
  SupplyEntityRow,
  SupplyIngestRunSummary,
  SupplyJson,
  SupplyObservationValue,
} from "../contracts";
import { supplyDatasetById, supplySourcesForDataset } from "../source-registry";
import { datasetRefreshCadence, supplyFreshness } from "./freshness.server";

type LooseSupabase = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (
          column: string,
          options?: { ascending?: boolean; nullsFirst?: boolean },
        ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
      };
    };
  };
};

type ObservationRecord = {
  id: string;
  dataset_id: string;
  entity_id: string;
  source_id: string | null;
  metric_key: string;
  metric_label: string;
  value: number | string | null;
  unit: string;
  reporting_year: number | null;
  basis: string;
  estimated: boolean;
  confidence: SupplyObservationValue["confidence"];
  observed_at: string;
  source_url: string | null;
  raw: Json;
  supply_entities?: {
    id: string;
    canonical_name: string;
    country: string | null;
    entity_type: string;
    metadata: Json;
  } | null;
};

type IngestRunRecord = {
  status: SupplyIngestRunSummary["status"];
  parser_id: string | null;
  rows_seen: number;
  rows_upserted: number;
  started_at: string;
  finished_at: string | null;
  metadata: Json;
};

const toNumber = (value: number | string | null): number | null => {
  if (value === null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

const metadataObject = (value: Json): Record<string, SupplyJson> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, SupplyJson>)
    : {};

function groupRows(records: ObservationRecord[]): SupplyEntityRow[] {
  const rows = new Map<string, SupplyEntityRow>();

  for (const record of records) {
    const entity = record.supply_entities;
    const entityId = entity?.id ?? record.entity_id;
    const row =
      rows.get(entityId) ??
      ({
        id: entityId,
        name: entity?.canonical_name ?? "Unknown entity",
        country: entity?.country ?? null,
        entityType: entity?.entity_type ?? "company",
        metadata: metadataObject(entity?.metadata ?? {}),
        observations: [],
      } satisfies SupplyEntityRow);

    row.observations.push({
      metricKey: record.metric_key,
      metricLabel: record.metric_label,
      value: toNumber(record.value),
      unit: record.unit,
      reportingYear: record.reporting_year,
      basis: record.basis,
      estimated: record.estimated,
      confidence: record.confidence,
      sourceId: record.source_id,
      sourceUrl: record.source_url,
      observedAt: record.observed_at,
    });

    rows.set(entityId, row);
  }

  return [...rows.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function runSummary(record: IngestRunRecord | null): SupplyIngestRunSummary | null {
  if (!record) return null;
  const metadata = metadataObject(record.metadata);
  return {
    status: record.status,
    parserId: record.parser_id,
    rowsSeen: record.rows_seen,
    rowsUpserted: record.rows_upserted,
    startedAt: record.started_at,
    finishedAt: record.finished_at,
    sourceUrl: typeof metadata["sourceUrl"] === "string" ? metadata["sourceUrl"] : null,
    reportingYear: typeof metadata["reportingYear"] === "number" ? metadata["reportingYear"] : null,
  };
}

async function latestSuccessfulRun(datasetId: string): Promise<SupplyIngestRunSummary | null> {
  const db = supabaseAdmin as any;
  const { data, error } = await db
    .from("supply_ingest_runs")
    .select("status,parser_id,rows_seen,rows_upserted,started_at,finished_at,metadata")
    .eq("dataset_id", datasetId)
    .eq("status", "success")
    .order("finished_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return runSummary((data ?? null) as IngestRunRecord | null);
}

export async function loadSupplyDataset(datasetId: string): Promise<SupplyDatasetPayload> {
  const registry = supplyDatasetById(datasetId);
  const sources = supplySourcesForDataset(datasetId);
  const fetchedAt = new Date().toISOString();

  if (!registry) {
    return {
      datasetId,
      fetchedAt,
      dynamic: false,
      registry: null,
      sources: [],
      latestIngest: null,
      freshness: null,
      rows: [],
      error: null,
    };
  }

  try {
    const db = supabaseAdmin as unknown as LooseSupabase;
    const latestIngest = await latestSuccessfulRun(datasetId);
    const cadence = datasetRefreshCadence(sources);
    const freshness = supplyFreshness(cadence, latestIngest?.finishedAt ?? null, fetchedAt);
    const { data, error } = await db
      .from("supply_observations")
      .select(
        "id,dataset_id,entity_id,source_id,metric_key,metric_label,value,unit,reporting_year,basis,estimated,confidence,observed_at,source_url,raw,supply_entities(id,canonical_name,country,entity_type,metadata)",
      )
      .eq("dataset_id", datasetId)
      .order("reporting_year", { ascending: false, nullsFirst: false });

    if (error) throw new Error(error.message);

    const records = (data ?? []) as ObservationRecord[];
    return {
      datasetId,
      fetchedAt,
      dynamic: records.length > 0,
      registry,
      sources,
      latestIngest,
      freshness,
      rows: groupRows(records),
      error: null,
    };
  } catch (error) {
    return {
      datasetId,
      fetchedAt,
      dynamic: false,
      registry,
      sources,
      latestIngest: null,
      freshness: null,
      rows: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
