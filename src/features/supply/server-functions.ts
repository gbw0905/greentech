import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SUPPLY_DATASET_REGISTRY, SUPPLY_SOURCE_REGISTRY } from "./source-registry";

const datasetSchema = z.object({ datasetId: z.string().min(1) });

export const getSupplyRegistryFn = createServerFn({ method: "GET" }).handler(async () => ({
  datasets: SUPPLY_DATASET_REGISTRY,
  sources: SUPPLY_SOURCE_REGISTRY,
}));

export const getSupplyDatasetFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => datasetSchema.parse(data))
  .handler(async ({ data }) => {
    const { loadSupplyDataset } = await import("./server/supply-data.server");
    return loadSupplyDataset(data.datasetId);
  });

export const refreshSupplyDatasetFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => datasetSchema.parse(data))
  .handler(async ({ data }) => {
    const { ingestSupplyDataset } = await import("./server/supply-ingest.server");
    return ingestSupplyDataset(data.datasetId);
  });

export const refreshStaleSupplyDatasetFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => datasetSchema.partial().parse(data))
  .handler(async ({ data }) => {
    const { refreshStaleSupplyDatasets } = await import("./server/supply-ingest.server");
    return refreshStaleSupplyDatasets(data.datasetId);
  });
