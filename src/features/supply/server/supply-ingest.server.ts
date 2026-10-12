import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";
import type {
  ParsedSupplyDataset,
  ParsedSupplyEntity,
  ParsedSupplyObservation,
  SupplyDatasetRegistryEntry,
  SupplyIngestResult,
  SupplySourceRegistryEntry,
  SupplyStaleRefreshResult,
} from "../contracts";
import {
  SUPPLY_DATASET_REGISTRY,
  SUPPLY_SOURCE_REGISTRY,
  supplyDatasetById,
  supplySourcesForDataset,
} from "../source-registry";
import { parserFor } from "./parsers";
import { datasetRefreshCadence, supplyFreshness } from "./freshness.server";

type DbResult<T> = Promise<{ data: T | null; error: { message: string } | null }>;

type Query = {
  select: (columns?: string) => Query;
  eq: (column: string, value: string) => Query;
  single: () => DbResult<Record<string, unknown>>;
  maybeSingle: () => DbResult<Record<string, unknown>>;
  upsert: (
    values: Record<string, unknown> | Record<string, unknown>[],
    options?: Record<string, unknown>,
  ) => Query;
  insert: (values: Record<string, unknown>) => Query;
};

type LooseSupabase = {
  from: (table: string) => Query;
};

const db = () => supabaseAdmin as unknown as LooseSupabase;
const DB_TIMEOUT_MS = 30_000;

function json(value: unknown): Json {
  return value === undefined ? null : (value as Json);
}

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error(`${label} timed out after ${DB_TIMEOUT_MS / 1000}s`)),
      DB_TIMEOUT_MS,
    );
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function datasetRow(dataset: SupplyDatasetRegistryEntry) {
  return {
    id: dataset.id,
    panel_title: dataset.panel,
    description: dataset.description,
    reporting_year: dataset.reportingYear,
    last_reviewed: dataset.lastReviewed,
    metrics: dataset.metrics,
    coverage: dataset.coverage,
    limitations: dataset.limitations,
  };
}

function sourceRow(source: SupplySourceRegistryEntry) {
  return {
    dataset_id: source.datasetId,
    org: source.org,
    title: source.title,
    url: source.url,
    source_year: source.year,
    source_type: source.sourceType,
    parser_id: source.parserId,
    refresh_cadence: source.refreshCadence,
    priority: source.priority,
    active: source.active,
    notes: source.notes ?? null,
  };
}

async function upsertSingle(
  table: string,
  values: Record<string, unknown>,
  onConflict: string,
): Promise<Record<string, unknown>> {
  const { data, error } = await withTimeout(
    db().from(table).upsert(values, { onConflict, ignoreDuplicates: false }).select("*").single(),
    `Upserting ${table}`,
  );
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`No row returned while upserting ${table}.`);
  return data;
}

export async function syncSupplyRegistry(datasetId?: string) {
  const datasets = datasetId
    ? SUPPLY_DATASET_REGISTRY.filter((dataset) => dataset.id === datasetId)
    : SUPPLY_DATASET_REGISTRY;

  for (const dataset of datasets) {
    await upsertSingle("supply_datasets", datasetRow(dataset), "id");
    for (const source of supplySourcesForDataset(dataset.id)) {
      await upsertSingle("supply_sources", sourceRow(source), "dataset_id,url,title");
    }
  }
}

async function sourceIdFor(source: SupplySourceRegistryEntry): Promise<string> {
  const row = await upsertSingle("supply_sources", sourceRow(source), "dataset_id,url,title");
  const id = row["id"];
  if (typeof id !== "string") throw new Error(`Source ${source.title} did not return an id.`);
  return id;
}

async function createRun(datasetId: string, sourceId: string, parserId: string): Promise<string> {
  const { data, error } = await withTimeout(
    db()
      .from("supply_ingest_runs")
      .insert({ dataset_id: datasetId, source_id: sourceId, parser_id: parserId, status: "running" })
      .select("id")
      .single(),
    "Creating supply_ingest_runs",
  );
  if (error) throw new Error(error.message);
  const id = data?.["id"];
  if (typeof id !== "string") throw new Error("Ingest run did not return an id.");
  return id;
}

async function finishRun(
  id: string,
  status: "success" | "failed",
  rowsSeen: number,
  rowsUpserted: number,
  error: string | null,
  metadata: Json = {},
) {
  await upsertSingle(
    "supply_ingest_runs",
    {
      id,
      status,
      rows_seen: rowsSeen,
      rows_upserted: rowsUpserted,
      error,
      metadata,
      finished_at: new Date().toISOString(),
    },
    "id",
  );
}

async function upsertEntity(datasetId: string, entity: ParsedSupplyEntity): Promise<string> {
  const row = await upsertSingle(
    "supply_entities",
    {
      dataset_id: datasetId,
      canonical_name: entity.name,
      country: entity.country,
      entity_type: entity.entityType,
      source_entity_key: entity.sourceEntityKey,
      metadata: entity.metadata ?? {},
    },
    "dataset_id,canonical_name",
  );
  const id = row["id"];
  if (typeof id !== "string") throw new Error(`Entity ${entity.name} did not return an id.`);
  return id;
}

async function upsertObservation(
  datasetId: string,
  entityId: string,
  sourceId: string,
  observation: ParsedSupplyObservation,
) {
  await upsertSingle(
    "supply_observations",
    {
      dataset_id: datasetId,
      entity_id: entityId,
      source_id: sourceId,
      metric_key: observation.metricKey,
      metric_label: observation.metricLabel,
      value: observation.value,
      unit: observation.unit,
      reporting_year: observation.reportingYear,
      basis: observation.basis,
      estimated: observation.estimated,
      confidence: observation.confidence,
      source_url: observation.sourceUrl,
      raw: observation.raw ?? {},
      observed_at: new Date().toISOString(),
    },
    "dataset_id,entity_id,metric_key,reporting_year,source_id",
  );
}

async function persistParsed(
  sourceId: string,
  parsed: ParsedSupplyDataset,
): Promise<{ entities: number; observations: number }> {
  let observations = 0;

  for (const entity of parsed.entities) {
    const entityId = await upsertEntity(parsed.datasetId, entity);
    for (const observation of entity.observations) {
      await upsertObservation(parsed.datasetId, entityId, sourceId, observation);
      observations += 1;
    }
  }

  return { entities: parsed.entities.length, observations };
}

function parserDatasetIds(datasetId?: string): string[] {
  const ids = new Set(
    SUPPLY_SOURCE_REGISTRY.filter((source) => source.active && source.parserId).map(
      (source) => source.datasetId,
    ),
  );
  return datasetId ? [...ids].filter((id) => id === datasetId) : [...ids];
}

async function latestSuccessfulFinishedAt(datasetId: string): Promise<string | null> {
  const client = supabaseAdmin as any;
  const { data, error } = (await withTimeout(
    client
      .from("supply_ingest_runs")
      .select("finished_at")
      .eq("dataset_id", datasetId)
      .eq("status", "success")
      .order("finished_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    `Reading latest supply_ingest_runs for ${datasetId}`,
  )) as { data: { finished_at?: unknown } | null; error: { message: string } | null };
  if (error) throw new Error(error.message);
  return typeof data?.finished_at === "string" ? data.finished_at : null;
}

export async function refreshStaleSupplyDatasets(
  datasetId?: string,
): Promise<SupplyStaleRefreshResult[]> {
  const results: SupplyStaleRefreshResult[] = [];
  const datasetIds = parserDatasetIds(datasetId);

  if (datasetId && datasetIds.length === 0) {
    return [
      {
        datasetId,
        ok: true,
        skipped: true,
        reason: "No active parser-backed source is registered for this dataset.",
        freshness: null,
        results: [],
      },
    ];
  }

  for (const id of datasetIds) {
    await syncSupplyRegistry(id);
    const sources = supplySourcesForDataset(id);
    const cadence = datasetRefreshCadence(sources);
    const latestFinishedAt = await latestSuccessfulFinishedAt(id);
    const freshness = supplyFreshness(cadence, latestFinishedAt);

    if (freshness && !freshness.stale) {
      results.push({
        datasetId: id,
        ok: true,
        skipped: true,
        reason: `Fresh until ${freshness.nextRefreshAfter ?? "manual refresh"}.`,
        freshness,
        results: [],
      });
      continue;
    }

    const ingestResults = await ingestSupplyDataset(id);
    results.push({
      datasetId: id,
      ok: ingestResults.every((result) => result.ok),
      skipped: false,
      reason: null,
      freshness,
      results: ingestResults,
    });
  }

  return results;
}

export async function ingestSupplyDataset(datasetId: string): Promise<SupplyIngestResult[]> {
  const dataset = supplyDatasetById(datasetId);
  if (!dataset) throw new Error(`Unknown supply dataset: ${datasetId}`);

  await syncSupplyRegistry(datasetId);
  const sources = supplySourcesForDataset(datasetId).filter((source) => source.active && source.parserId);
  const results: SupplyIngestResult[] = [];

  for (const source of sources) {
    const parser = source.parserId ? parserFor(source.parserId) : null;
    if (!parser) continue;

    const sourceId = await sourceIdFor(source);
    const runId = await createRun(datasetId, sourceId, parser.id);
    try {
      const parsed = await parser.parse(source);
      const persisted = await persistParsed(sourceId, parsed);
      await finishRun(runId, "success", parsed.rowsSeen, persisted.observations, null, {
        sourceUrl: parsed.sourceUrl,
        reportingYear: parsed.reportingYear,
        ...(parsed.metadata ?? {}),
      });
      results.push({
        datasetId,
        parserId: parser.id,
        ok: true,
        sourceId,
        rowsSeen: parsed.rowsSeen,
        entitiesUpserted: persisted.entities,
        observationsUpserted: persisted.observations,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await finishRun(runId, "failed", 0, 0, message, json({ source: source.url }));
      results.push({
        datasetId,
        parserId: parser.id,
        ok: false,
        sourceId,
        rowsSeen: 0,
        entitiesUpserted: 0,
        observationsUpserted: 0,
        error: message,
      });
    }
  }

  return results;
}
