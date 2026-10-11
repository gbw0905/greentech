import type { SupplyDatasetPayload, SupplyEntityRow, SupplyJson } from "@/features/supply/contracts";

export function metricValue(row: SupplyEntityRow, keys: string[]): number | null {
  for (const key of keys) {
    const observation = row.observations.find((item) => item.metricKey === key);
    if (typeof observation?.value === "number" && Number.isFinite(observation.value)) {
      return observation.value;
    }
  }
  return null;
}

export function metaString(value: SupplyJson | undefined, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function metaStringList(value: SupplyJson | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function metricRows(payload: SupplyDatasetPayload | undefined, keys: string[]) {
  return (payload?.rows ?? []).filter((row) => metricValue(row, keys) !== null);
}

export function hasMetricRows(payload: SupplyDatasetPayload | undefined, keys: string[]) {
  return metricRows(payload, keys).length > 0;
}
