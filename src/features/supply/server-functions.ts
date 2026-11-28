import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const datasetSchema = z.object({ datasetId: z.string().min(1) });

export const getSupplyDatasetFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => datasetSchema.parse(data))
  .handler(async ({ data }) => {
    const { loadSupplyDataset } = await import("./server/supply-data.server");
    return loadSupplyDataset(data.datasetId);
  });
