import {
  __modules,
  CI,
  DAIRY,
  G_PER,
  PROGRAM,
  assess,
  scopeLabel,
  scopeContributions,
  MODEL_VERSION,
} from "./workspace-engine.mjs";

function factorTable(st) {
  const custom = (st.customEmissions || [])
    .filter((x) => x.include !== false)
    .map((x) => ({
      key: "custom-" + x.id,
      label: x.label || "Custom emission",
      value: (Number(x.factor) || 0) * G_PER[x.fMass || "g"],
      unit: "gCO2e/" + x.aUnit,
      source: "User-defined (CI Workspace emissions calculator)",
    }));
  return [...factorTableBase(st), ...custom];
}
function libraryTable() {
  const src = "CARB LCFS Tier 1 workbook (2025), EF Table / eGRID 2021",
    E = DAIRY.LCFS_EF,
    out = [];
  for (const r of PROGRAM_BG()) {
    if (Number.isFinite(r.value))
      out.push({
        group: String(r.group),
        item: String(r.item),
        detail: String(r.detail || ""),
        value: r.value,
        unit: String(r.unit),
        source: String(r.source || ""),
      });
  }
  for (const x of CI.SOURCES)
    out.push({
      group: "Process energy supply",
      item: x.label,
      detail: x.note || "",
      value: x.factor,
      unit: "gCO2e/" + x.unit,
      source: "GBW engine snapshot (2026-09-29)",
    });
  for (const [r, v] of Object.entries(E.grid))
    out.push({
      group: "US eGRID subregions (CARB LCFS)",
      item: "Grid electricity — " + r,
      detail: "eGRID subregion",
      value: v,
      unit: "gCO2e/kWh",
      source: src,
    });
  for (const [k, v] of Object.entries({
    naturalGasPerMmbtu: ["Utility natural gas, small industrial boiler", "gCO2e/MMBtu LHV"],
    rawBiogasPerMmbtu: ["Raw biogas as process fuel", "gCO2e/MMBtu LHV"],
    biomethanePerMmbtu: ["Biomethane as process fuel", "gCO2e/MMBtu LHV"],
    dieselPerGallon: ["Diesel combustion", "gCO2e/gal"],
    propanePerGallon: ["Propane combustion", "gCO2e/gal"],
    flaringPerMj: ["RNG flaring", "gCO2e/MJ LHV"],
    cngCompressionPerMj: ["CNG compression", "gCO2e/MJ LHV"],
    tailpipePerMmbtu: ["CNG vehicle tailpipe", "gCO2e/MMBtu LHV"],
  }))
    if (Number.isFinite(E[k]))
      out.push({
        group: "CARB LCFS Tier 1 dairy RNG factors",
        item: v[0],
        detail: "",
        value: E[k],
        unit: v[1],
        source: src,
      });
  return out;
}
const PROGRAM_BG = () => __modules["gbw-workspace/engine/source/ci-model.mjs"].backgroundFactors();
function factorTableBase(st) {
  if (st.dairy) {
    const E = DAIRY.LCFS_EF,
      i = st.dairy.inventory,
      src = "CARB LCFS Tier 1 workbook (2025), EF Table / CA-GREET 4.0";
    const rows = [
      {
        key: "gridFactor",
        label: "Grid electricity — " + i.electricityRegion + " (applied)",
        value: st.dairy.gridFactor,
        unit: "gCO2e/kWh",
        source: "Editable; default " + i.electricityRegion + " eGRID 2021 — " + src,
      },
      {
        key: "naturalGasPerMmbtu",
        label: "Utility natural gas, small industrial boiler",
        value: E.naturalGasPerMmbtu,
        unit: "gCO2e/MMBtu LHV",
        source: src,
      },
      {
        key: "rawBiogasPerMmbtu",
        label: "Raw biogas used as process fuel",
        value: E.rawBiogasPerMmbtu,
        unit: "gCO2e/MMBtu LHV",
        source: src,
      },
      {
        key: "biomethanePerMmbtu",
        label: "Biomethane used as process fuel",
        value: E.biomethanePerMmbtu,
        unit: "gCO2e/MMBtu LHV",
        source: src,
      },
      {
        key: "dieselPerGallon",
        label: "Diesel combustion",
        value: E.dieselPerGallon,
        unit: "gCO2e/gal",
        source: src,
      },
      {
        key: "propanePerGallon",
        label: "Propane combustion",
        value: E.propanePerGallon,
        unit: "gCO2e/gal",
        source: src,
      },
      {
        key: "onsiteBiogasElecPerKwh",
        label: "On-site electricity from biogas (37% efficiency)",
        value: E.onsiteBiogasElecPerKwh,
        unit: "gCO2e/kWh",
        source: src,
      },
      {
        key: "flaringPerMj",
        label: "RNG flaring",
        value: E.flaringPerMj,
        unit: "gCO2e/MJ LHV",
        source: src,
      },
      {
        key: "pipelinePerMjMile",
        label: "Pipeline transmission energy",
        value: E.pipelinePerMjMile,
        unit: "gCO2e/MJ-mile",
        source: src,
      },
      {
        key: "pipelineLossPerMile",
        label: "Pipeline evaporative losses",
        value: E.pipelineLossPerMile,
        unit: "fraction per mile",
        source: src,
      },
      {
        key: "cngCompressionPerMj",
        label: "CNG station compression",
        value: E.cngCompressionPerMj,
        unit: "gCO2e/MJ LHV",
        source: src,
      },
      {
        key: "tailpipePerMmbtu",
        label: "CNG vehicle tailpipe",
        value: E.tailpipePerMmbtu,
        unit: "gCO2e/MMBtu LHV",
        source: src,
      },
      {
        key: "gwpCh4",
        label: "Methane global warming potential",
        value: 25,
        unit: "gCO2e/g CH4 (GWP100)",
        source: "IPCC AR4, as used by CARB LCFS",
      },
    ];
    for (const [r, v] of Object.entries(E.grid))
      rows.push({
        key: "grid-" + r,
        label: "Grid electricity — " + r + " (reference)",
        value: v,
        unit: "gCO2e/kWh",
        source: "eGRID 2021 — " + src,
      });
    return rows;
  }
  return CI.SOURCES.map((x) => ({
    key: x.id,
    label: x.label,
    value: st.factors?.[x.id] ?? x.factor,
    unit: "gCO2e/" + x.unit,
    source:
      (x.id === "electricity" ? "Grid region " + st.region + "; " : "") +
      (x.note ? x.note + " — " : "") +
      "GBW engine snapshot (2026-09-29); user-editable",
  }));
}
export function buildWorkspacePayload(state, r = assess(state), baseline = null) {
  if (r.errors?.length) throw new Error(r.errors.join("; "));
  const comparison = PROGRAM.comparePrograms(state, r, state.programs ?? PROGRAM.settings());
  const b = baseline ? assess(baseline) : null;
  const payload = {
    name: state.name,
    pathwayId: state.pathwayId,
    pathwayLabel: r.pathway.label,
    region: state.region,
    inputBasis: state.inputBasis,
    annualVolume: state.annualVolume,
    energyDensity: state.energyDensity,
    comparator: state.comparator,
    annualEnergyMj: r.annualEnergyMj,
    annualTonnesCo2e: r.annualTonnesCo2e,
    ciTotal: r.ciTotal,
    grossCi: r.grossCi,
    creditsCi: r.creditsCi,
    factors: state.factors,
    energy: state.energy,
    direct: state.direct,
    dairy: state.dairy,
    warnings: r.warnings ?? [],
    scenarioSnapshot: structuredClone(state),
    modelVersion: MODEL_VERSION,
    rinEstimate: comparison.rin,
    baselineSnapshot: baseline ? structuredClone(baseline) : null,
    lines: r.lineItems.map((x) => ({
      key: x.key,
      label: x.label,
      scope: scopeLabel(x),
      scope1: scopeContributions(x)[1],
      scope2: scopeContributions(x)[2],
      scope3: scopeContributions(x)[3],
      adjustments: scopeContributions(x).adjustments,
      unallocated: scopeContributions(x).unallocated,
      category: x.category,
      detail: x.detail,
      activity: x.activity,
      activityUnit: x.activityUnit,
      factor: x.factor,
      factorUnit: x.factorUnit,
      divisor: x.divisor,
      sign: x.sign,
      allocation: x.allocation,
      gPerMj: x.gPerMj,
    })),
    programs: comparison.rows.map((a) => ({
      name: a.name,
      benchmark: a.benchmark,
      ci: a.ci,
      energy: a.energy,
      credits: a.credits,
      supported: a.supported,
      url: a.url,
    })),
    programErrors: comparison.errors,
    factorTable: factorTable(state),
    library: libraryTable(),
    baseline: b && !b.errors.length ? { name: baseline.name, ci: b.ciTotal } : undefined,
  };
  return payload;
}
