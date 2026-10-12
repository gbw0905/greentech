import type { ParsedSupplyDataset, SupplySourceRegistryEntry } from "../../contracts";

export type SupplyParser = {
  id: string;
  datasetId: string;
  parse: (source: SupplySourceRegistryEntry) => Promise<ParsedSupplyDataset>;
};
