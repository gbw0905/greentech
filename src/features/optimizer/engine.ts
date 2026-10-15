import pathwayData from "./pathways.json" with { type: "json" };
import programData from "./programs.json" with { type: "json" };

// GBW-owned reference: /civanta/optimizer, imported 2026-10-15.
// Screening factors and scenario economics preserve the reference model.
export const MEASURES = [
  { id: "ppa", name: "100% renewable power", detail: "Replace grid power with a renewable PPA." },
  {
    id: "rail",
    name: "Feedstock haul by rail",
    detail: "Switch the modeled feedstock haul from truck to rail.",
  },
  { id: "heat", name: "Boiler heat recovery", detail: "Reduce process gas through heat recovery." },
  { id: "tuning", name: "Process tuning", detail: "Improve process-gas efficiency." },
] as const;
export type MeasureId = (typeof MEASURES)[number]["id"];
export type Inputs = {
  pathwayId: string;
  target: number;
  benchmark: number;
  ng: number;
  kwh: number;
  gridCi: number;
  km: number;
  feedstockAdj: number;
  volumeMj: number;
  creditPrice: number;
  ngPrice: number;
  ppaPremium: number;
  discountRate: number;
  lifeYears: number;
  heatPct: number;
  tuningPct: number;
  costs: Record<MeasureId, { capex: number; opex: number }>;
};
export const PATHWAYS = pathwayData.map((pathway) => {
  const kgPerMj = pathway.transport > 0 ? pathway.transport / 50 : 0.027;
  return {
    ...pathway,
    fuel: pathway.group === "Sustainable aviation fuel" ? "jet" : pathway.benchmarkFuel,
    kgPerMj,
    fixed: pathway.ci - pathway.ng * 63 - pathway.kwh * 400 - kgPerMj * 50,
  };
});
export function pathwayFor(id: string) {
  const pathway = PATHWAYS.find((item) => item.id === id);
  if (!pathway) throw new Error("Unknown fuel pathway.");
  return pathway;
}
export function defaultInputs(id = "rd-uco"): Inputs {
  const pathway = pathwayFor(id);
  return {
    pathwayId: id,
    target: Math.round(pathway.ci * 0.85 * 10) / 10,
    benchmark: pathway.fuel === "gasoline" ? 75.16 : 80.17,
    ng: pathway.ng,
    kwh: pathway.kwh,
    gridCi: 400,
    km: 500,
    feedstockAdj: 1,
    volumeMj: 500_000_000,
    creditPrice: 75,
    ngPrice: 0.004,
    ppaPremium: 0.015,
    discountRate: 8,
    lifeYears: 15,
    heatPct: 15,
    tuningPct: 10,
    costs: {
      ppa: { capex: 0, opex: 0 },
      rail: { capex: 400_000, opex: 20_000 },
      heat: { capex: 600_000, opex: 10_000 },
      tuning: { capex: 150_000, opex: 5_000 },
    },
  };
}
export function validateInputs(input: Inputs): string[] {
  const errors: string[] = [];
  if (!PATHWAYS.some((p) => p.id === input.pathwayId)) errors.push("Choose a valid pathway.");
  for (const [key, value] of Object.entries(input)) {
    if (key === "costs" || key === "pathwayId") continue;
    if (typeof value !== "number" || !Number.isFinite(value))
      errors.push(`${key}: enter a finite number.`);
    else if (key !== "target" && key !== "benchmark" && value < 0)
      errors.push(`${key}: use zero or a positive number.`);
  }
  if (input.volumeMj <= 0) errors.push("Annual energy must be greater than zero.");
  if (input.lifeYears <= 0) errors.push("Project life must be greater than zero.");
  if (input.heatPct > 100 || input.tuningPct > 100)
    errors.push("Process-gas cuts cannot exceed 100%.");
  for (const measure of MEASURES) {
    for (const key of ["capex", "opex"] as const) {
      const value = input.costs[measure.id]?.[key];
      if (!Number.isFinite(value) || value < 0)
        errors.push(`${measure.name}: ${key} must be finite and non-negative.`);
    }
  }
  if (!errors.length && !Number.isFinite(capitalRecovery(input.discountRate, input.lifeYears)))
    errors.push("Discount rate and project life exceed the model's numeric range.");
  return errors;
}
export function capitalRecovery(rate: number, years: number) {
  const r = rate / 100;
  // Stable at zero and for long project lives; avoids Infinity / Infinity.
  return r === 0 ? 1 / years : r / -Math.expm1(-years * Math.log1p(r));
}
export function gasFraction(input: Inputs, measures: readonly MeasureId[]) {
  return (
    (measures.includes("heat") ? 1 - input.heatPct / 100 : 1) *
    (measures.includes("tuning") ? 1 - input.tuningPct / 100 : 1)
  );
}
export function contributions(input: Inputs, measures: readonly MeasureId[]) {
  const pathway = pathwayFor(input.pathwayId);
  const fixed = pathway.fixed * input.feedstockAdj;
  const ng = input.ng * gasFraction(input, measures) * 63;
  const elec = measures.includes("ppa") ? 0 : input.kwh * input.gridCi;
  const transport = (pathway.kgPerMj / 1000) * input.km * (measures.includes("rail") ? 22 : 100);
  return { fixed, ng, elec, transport, total: fixed + ng + elec + transport };
}
export function creditValue(input: Inputs, ci: number) {
  return ((Math.max(0, input.benchmark - ci) * input.volumeMj) / 1e6) * input.creditPrice;
}
export function scenario(input: Inputs, measures: readonly MeasureId[]) {
  const parts = contributions(input, measures);
  const capex = measures.reduce((total, id) => total + input.costs[id].capex, 0);
  const opex =
    measures.reduce((total, id) => total + input.costs[id].opex, 0) +
    (measures.includes("ppa") ? input.kwh * input.volumeMj * input.ppaPremium : 0) -
    input.ng * (1 - gasFraction(input, measures)) * input.volumeMj * input.ngPrice;
  const annualized = capex * capitalRecovery(input.discountRate, input.lifeYears) + opex;
  const value = creditValue(input, parts.total);
  return {
    key: [...measures].sort().join("+") || "baseline",
    measures: [...measures],
    name: measures.length
      ? measures.map((id) => MEASURES.find((m) => m.id === id)!.name).join(" + ")
      : "Baseline",
    ci: parts.total,
    parts,
    capex,
    opex,
    annualized,
    creditValue: value,
    netBenefit: value - creditValue(input, contributions(input, []).total) - annualized,
    feasible: parts.total <= input.target + 1e-10,
    pareto: false,
  };
}
export type Scenario = ReturnType<typeof scenario>;
export function enumerateScenarios(input: Inputs) {
  const all = Array.from({ length: 16 }, (_, mask) =>
    scenario(
      input,
      MEASURES.filter((_, i) => mask & (1 << i)).map((m) => m.id),
    ),
  );
  for (const point of all)
    point.pareto = !all.some(
      (other) =>
        other !== point &&
        other.ci <= point.ci + 1e-12 &&
        other.annualized <= point.annualized + 1e-9 &&
        (other.ci < point.ci - 1e-12 || other.annualized < point.annualized - 1e-9),
    );
  return all;
}
export function analyze(input: Inputs, selected: readonly MeasureId[] = ["ppa", "rail"]) {
  const errors = validateInputs(input);
  if (errors.length) throw new Error(errors.join(" "));
  const all = enumerateScenarios(input);
  if (all.some((s) => ![s.ci, s.annualized, s.creditValue, s.netBenefit].every(Number.isFinite)))
    throw new Error("These values exceed the model's numeric range. Use smaller inputs.");
  const byCost = [...all].sort((a, b) => a.annualized - b.annualized);
  const recommended = byCost.find((s) => s.feasible) ?? null;
  const lowestCi = [...all].sort((a, b) => a.ci - b.ci)[0]!;
  const baseline = all[0]!;
  const focus = recommended ?? lowestCi;
  const mac = MEASURES.map((measure) => {
    const result = scenario(input, [measure.id]);
    const dCi = baseline.ci - result.ci;
    const avoidedT = (dCi * input.volumeMj) / 1e6;
    return {
      ...measure,
      dCi,
      avoidedT,
      annualized: result.annualized,
      mac: avoidedT > 0 ? result.annualized / avoidedT : null,
    };
  }).sort((a, b) => (a.mac ?? Infinity) - (b.mac ?? Infinity));
  let previous = baseline.ci;
  const applied: MeasureId[] = [];
  const waterfall = mac
    .filter((m) => focus.measures.includes(m.id))
    .map((measure) => {
      applied.push(measure.id);
      const next = scenario(input, applied).ci;
      const step = { name: measure.name, from: previous, to: next, delta: next - previous };
      previous = next;
      return step;
    });
  return {
    all,
    baseline,
    recommended,
    focus,
    lowestCi,
    lowestCost: byCost[0]!,
    maxBenefit: [...all].sort((a, b) => b.netBenefit - a.netBenefit)[0]!,
    user: scenario(input, selected),
    mac,
    waterfall,
  };
}
export type Analysis = ReturnType<typeof analyze>;
export const SENSITIVITY = [
  ["gridCi", "Electricity CI"],
  ["ppaPremium", "PPA premium"],
  ["feedstockAdj", "Feedstock & conversion CI"],
  ["ngPrice", "Natural gas price"],
  ["km", "Transport distance"],
  ["creditPrice", "Credit price"],
  ["volumeMj", "Annual fuel production"],
  ["discountRate", "Discount rate"],
] as const;
export function sensitivity(input: Inputs, measures: readonly MeasureId[], percent: number) {
  const base = scenario(input, measures);
  return SENSITIVITY.map(([key, label]) => {
    const low = scenario({ ...input, [key]: input[key] * (1 - percent / 100) }, measures);
    const high = scenario({ ...input, [key]: input[key] * (1 + percent / 100) }, measures);
    return {
      key,
      label,
      ciLo: low.ci - base.ci,
      ciHi: high.ci - base.ci,
      nbLo: low.netBenefit - base.netBenefit,
      nbHi: high.netBenefit - base.netBenefit,
    };
  }).sort(
    (a, b) =>
      Math.max(Math.abs(b.nbLo), Math.abs(b.nbHi)) - Math.max(Math.abs(a.nbLo), Math.abs(a.nbHi)),
  );
}
export type SolveFor = "ng" | "kwh" | "km" | "renewable";
export function solveTarget(input: Inputs, variable: SolveFor, renewable = 0, railShare = 0) {
  const p = pathwayFor(input.pathwayId);
  const fixed = p.fixed * input.feedstockAdj;
  const gas = input.ng * 63;
  const powerFactor = input.gridCi * (1 - renewable / 100);
  const transportFactor =
    (p.kgPerMj / 1000) * (100 * (1 - railShare / 100) + (22 * railShare) / 100);
  const electricity = input.kwh * powerFactor,
    transport = input.km * transportFactor;
  let coefficient: number, remaining: number;
  if (variable === "ng") {
    coefficient = 63;
    remaining = input.target - fixed - electricity - transport;
  } else if (variable === "kwh") {
    coefficient = powerFactor;
    remaining = input.target - fixed - gas - transport;
  } else if (variable === "km") {
    coefficient = transportFactor;
    remaining = input.target - fixed - gas - electricity;
  } else {
    const allowance = input.target - fixed - gas - transport;
    const fullPower = input.kwh * input.gridCi;
    if (allowance < -1e-10)
      return {
        value: null,
        feasible: false,
        message:
          "Even 100% renewable power cannot meet this target with the other inputs unchanged.",
      };
    const value = fullPower > 0 ? Math.max(0, 100 * (1 - allowance / fullPower)) : 0;
    return {
      value: Math.min(100, value),
      feasible: true,
      message: "Minimum renewable electricity share.",
    };
  }
  if (remaining < -1e-10)
    return {
      value: null,
      feasible: false,
      message: "The other contributions already exceed the target. Change more than one input.",
    };
  if (coefficient === 0)
    return {
      value: null,
      feasible: true,
      message:
        "This input has no CI effect under the selected assumptions; no finite CI limit applies.",
    };
  return {
    value: Math.max(0, remaining / coefficient),
    feasible: true,
    message: "Maximum setpoint with all other operating inputs unchanged.",
  };
}
export function regulatoryRows(input: Inputs, ci: number) {
  const pathway = pathwayFor(input.pathwayId);
  return programData
    .filter((p) =>
      p.id === "corsia"
        ? pathway.fuel === "jet"
        : p.id === "fueleu"
          ? pathway.id.startsWith("marine-")
          : pathway.fuel !== "jet" || ["ca", "red"].includes(p.id),
    )
    .map((program) => {
      const benchmarks = program.bench["2026"];
      const benchmark = pathway.fuel === "gasoline" ? benchmarks.gasoline : benchmarks.diesel;
      const gap = benchmark - ci;
      return { ...program, benchmark, gap, saving: (gap / benchmark) * 100 };
    });
}
