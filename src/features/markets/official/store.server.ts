/**
 * Read-through cache for official price data.
 *
 * Order: server memory → Supabase `official_price_cache` → the government
 * source. A fresh fetch only happens when the stored copy is older than its
 * TTL, so visitors never hammer EIA/CARB/USDA. If the source is down, the last
 * good copy is served and flagged `stale`. If the table has not been migrated
 * yet, the memory copy still works.
 */
import type { Json } from "@/integrations/supabase/types";
import { CARB_LCFS_PAGE, fetchCarbLcfsReport } from "./carb-lcfs.server";
import { EIA_SERIES, eiaUrl, fetchEiaSeries, type EiaSeriesDef } from "./eia.server";
import type { LcfsReport, OfficialSeries, UsdaEthanolReport } from "./types";
import { USDA_ETHANOL_PDF, fetchUsdaEthanolReport } from "./usda-ethanol.server";

export interface Cached<T> {
  value: T;
  fetchedAt: number;
  stale: boolean;
}

const HOUR = 3_600_000;
const memory = new Map<string, { value: unknown; fetchedAt: number }>();
const inFlight = new Map<string, Promise<unknown>>();

async function readDb<T>(key: string): Promise<{ value: T; fetchedAt: number } | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("official_price_cache")
      .select("payload, fetched_at")
      .eq("cache_key", key)
      .maybeSingle();
    if (error || !data) return null;
    return { value: data.payload as T, fetchedAt: new Date(data.fetched_at).getTime() };
  } catch {
    return null;
  }
}

async function writeDb(key: string, value: unknown, sourceUrl: string, fetchedAt: number) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("official_price_cache").upsert(
      {
        cache_key: key,
        payload: value as Json,
        source_url: sourceUrl,
        fetched_at: new Date(fetchedAt).toISOString(),
      },
      { onConflict: "cache_key" },
    );
  } catch {
    // Table not migrated yet or DB unavailable: memory copy still serves.
  }
}

async function cached<T>(
  key: string,
  ttlMs: number,
  sourceUrl: string,
  fetcher: () => Promise<T>,
): Promise<Cached<T>> {
  const now = Date.now();
  let best = memory.get(key) as { value: T; fetchedAt: number } | undefined;
  if (best && now - best.fetchedAt < ttlMs) return { ...best, stale: false };

  const stored = await readDb<T>(key);
  if (stored && (!best || stored.fetchedAt > best.fetchedAt)) {
    best = stored;
    memory.set(key, stored);
  }
  if (best && now - best.fetchedAt < ttlMs) return { ...best, stale: false };

  let pending = inFlight.get(key) as Promise<T> | undefined;
  if (!pending) {
    pending = fetcher();
    inFlight.set(key, pending);
  }
  try {
    const value = await pending;
    const fetchedAt = Date.now();
    memory.set(key, { value, fetchedAt });
    if (inFlight.get(key) === pending) void writeDb(key, value, sourceUrl, fetchedAt);
    return { value, fetchedAt, stale: false };
  } catch (error) {
    console.error(`official-prices: ${key} refresh failed`, error);
    if (best) return { ...best, stale: true };
    throw error;
  } finally {
    inFlight.delete(key);
  }
}

export function getEiaSeries(def: EiaSeriesDef): Promise<Cached<OfficialSeries>> {
  return cached(def.id, 6 * HOUR, eiaUrl(def), () => fetchEiaSeries(def));
}

export function getAllEiaSeries() {
  return Promise.allSettled(Object.values(EIA_SERIES).map((def) => getEiaSeries(def)));
}

export function getLcfsReport(): Promise<Cached<LcfsReport>> {
  return cached("carb:lcfs-monthly", 24 * HOUR, CARB_LCFS_PAGE, fetchCarbLcfsReport);
}

export function getUsdaEthanolReport(): Promise<Cached<UsdaEthanolReport>> {
  return cached("usda:ams-3616", 12 * HOUR, USDA_ETHANOL_PDF, fetchUsdaEthanolReport);
}
