import type {
  SupplyDatasetFreshness,
  SupplyRefreshCadence,
  SupplySourceRegistryEntry,
} from "../contracts";

const CADENCE_MS: Record<SupplyRefreshCadence, number | null> = {
  daily: 6 * 60 * 60 * 1000,
  weekly: 24 * 60 * 60 * 1000,
  monthly: 7 * 24 * 60 * 60 * 1000,
  quarterly: 14 * 24 * 60 * 60 * 1000,
  annual: 30 * 24 * 60 * 60 * 1000,
  manual: null,
};

const CADENCE_PRIORITY: SupplyRefreshCadence[] = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "annual",
  "manual",
];

export function datasetRefreshCadence(
  sources: SupplySourceRegistryEntry[],
): SupplyRefreshCadence | null {
  const parserSources = sources.filter((source) => source.active && source.parserId);
  if (parserSources.length === 0) return null;
  const [cadence] = parserSources
    .map((source) => source.refreshCadence)
    .sort((a, b) => CADENCE_PRIORITY.indexOf(a) - CADENCE_PRIORITY.indexOf(b));
  return cadence ?? null;
}

export function supplyFreshness(
  cadence: SupplyRefreshCadence | null,
  latestFinishedAt: string | null,
  checkedAt = new Date().toISOString(),
): SupplyDatasetFreshness | null {
  if (!cadence) return null;
  const ttl = CADENCE_MS[cadence];
  if (ttl === null) {
    return {
      cadence,
      stale: false,
      staleAfter: null,
      nextRefreshAfter: null,
      checkedAt,
    };
  }

  const latest = latestFinishedAt ? new Date(latestFinishedAt).getTime() : NaN;
  const checked = new Date(checkedAt).getTime();
  const staleAfter = Number.isFinite(latest) ? new Date(latest + ttl).toISOString() : null;

  return {
    cadence,
    stale: !Number.isFinite(latest) || checked >= latest + ttl,
    staleAfter,
    nextRefreshAfter: staleAfter,
    checkedAt,
  };
}
