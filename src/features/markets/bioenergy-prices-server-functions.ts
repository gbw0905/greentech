import { createServerFn } from "@tanstack/react-start";
import type { LcfsReport, UsdaEthanolReport } from "./official/types";

export interface BioenergyPrices {
  lcfs: (LcfsReport & { fetchedAt: number; stale: boolean }) | null;
  ethanol: (UsdaEthanolReport & { fetchedAt: number; stale: boolean }) | null;
}

/**
 * California LCFS credit prices (CARB, monthly) and U.S. plant-gate ethanol,
 * distillers grains and corn oil prices (USDA AMS, weekly).
 */
export const getBioenergyPricesFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<BioenergyPrices> => {
    const { getLcfsReport, getUsdaEthanolReport } = await import("./official/store.server");
    const [lcfs, ethanol] = await Promise.allSettled([getLcfsReport(), getUsdaEthanolReport()]);
    return {
      lcfs:
        lcfs.status === "fulfilled"
          ? { ...lcfs.value.value, fetchedAt: lcfs.value.fetchedAt, stale: lcfs.value.stale }
          : null,
      ethanol:
        ethanol.status === "fulfilled"
          ? {
              ...ethanol.value.value,
              fetchedAt: ethanol.value.fetchedAt,
              stale: ethanol.value.stale,
            }
          : null,
    };
  },
);
