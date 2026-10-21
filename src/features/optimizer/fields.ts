import type { Inputs } from "./engine";
export type NumericKey = Exclude<keyof Inputs, "pathwayId" | "costs">;
export const FIELD_LABELS: Record<NumericKey, [string, string, number]> = {
  target: ["Target CI", "gCO₂e/MJ", 0.1],
  benchmark: ["Credit benchmark", "gCO₂e/MJ", 0.01],
  ng: ["Process gas", "MJ/MJ", 0.001],
  kwh: ["Grid power", "kWh/MJ", 0.001],
  gridCi: ["Electricity CI", "gCO₂e/kWh", 1],
  km: ["Haul distance", "km", 10],
  feedstockAdj: ["Feedstock CI factor", "×", 0.05],
  volumeMj: ["Annual fuel energy", "MJ/year", 1e6],
  creditPrice: ["Credit price", "USD/tonne", 1],
  ngPrice: ["Gas price", "USD/MJ", 0.001],
  ppaPremium: ["PPA premium", "USD/kWh", 0.001],
  discountRate: ["Discount rate", "%", 0.1],
  lifeYears: ["Project life", "years", 1],
  heatPct: ["Heat recovery gas cut", "%", 1],
  tuningPct: ["Process tuning gas cut", "%", 1],
};
