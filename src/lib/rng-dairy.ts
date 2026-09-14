// Farm-level dairy manure renewable natural gas (RNG) carbon intensity model.
//
// Ported from the "GREET 2024_RNG" workbook (Dairy_RNG_Electricity_Trinity.xlsx),
// which itself sources every factor from Argonne GREET 2024 ("Waste", "RNG",
// "Electric", "EF" and "Fuel_Specs" tabs). The model starts from herd counts and
// manure production, derives total solids and volatile solids, computes the
// avoided baseline manure emissions of the reference management system, then adds
// digester and upgrading energy, feed loss, pipeline transmission and end use.
//
// One deliberate deviation from the source workbook: theoretical methane is
// computed on each animal group's own volatile solids rather than on the whole
// herd's volatile solids for both groups, which double counted in the original.

import type { DetailRow, ModuleResult } from "./ci-model";

export type DigesterType = "Covered Lagoon" | "Complete Mix" | "Mixed Plug Flow" | "Horizontal Plug Flow";
export type UpgradingTech =
  | "Membrane Separation"
  | "Pressure Swing Absorption"
  | "Water Scrubbing"
  | "Chemical Absorption";

export interface DairyRngInputs {
  enabled: boolean;
  /** Herd counts. */
  dairyCows: number;
  dryCows: number;
  heifers: number;
  /** Wet manure production, tonnes per head per year. */
  manureDairyCowTpy: number;
  manureDryCowTpy: number;
  manureHeiferTpy: number;
  /** Moisture content of wet manure, fraction. */
  moisture: number;
  digesterType: DigesterType;
  /** Baseline management system CH4 conversion factors (CH4 / theoretical max). */
  mcfCow: number;
  mcfHeifer: number;
  upgradingTech: UpgradingTech;
  /** Biogas flared before upgrading, Btu per lb of total solids (0 under GREET, 604 under LCFS). */
  flaringBtuPerLbTs: number;
  /** Feed loss in anaerobic digestion and in RNG production/upgrading, fractions. */
  feedLossAd: number;
  feedLossUpgrading: number;
  /** Process energy intensities per mmBtu of RNG. */
  ngBtuPerMmbtu: number;
  elecAdBtuPerMmbtu: number;
  elecRngBtuPerMmbtu: number;
  /** RNG yield from dry manure, Btu per lb of total solids. */
  rngBtuPerLbTs: number;
  /** Heavy duty truck round trip on the farm, miles per year. */
  truckMiles: number;
  /** Pipeline transmission distance, miles. */
  pipelineMiles: number;
  /** Global warming potentials, 100-year. */
  gwpCh4: number;
  gwpN2o: number;
}

export const DEFAULT_DAIRY_RNG: DairyRngInputs = {
  enabled: false,
  dairyCows: 5000,
  dryCows: 1000,
  heifers: 1000,
  manureDairyCowTpy: 13.14, // 1.5 kg/hr
  manureDryCowTpy: 18.396, // 2.1 kg/hr
  manureHeiferTpy: 9.9864, // 1.14 kg/hr
  moisture: 0.88,
  digesterType: "Covered Lagoon",
  mcfCow: 0.02,
  mcfHeifer: 0.67,
  upgradingTech: "Membrane Separation",
  flaringBtuPerLbTs: 0,
  feedLossAd: 0.035,
  feedLossUpgrading: 0.145,
  ngBtuPerMmbtu: 221863.7060685992,
  elecAdBtuPerMmbtu: 62650.79091613629,
  elecRngBtuPerMmbtu: 76340.71648890727,
  rngBtuPerLbTs: 2288.099766053133,
  truckMiles: 50,
  pipelineMiles: 500,
  gwpCh4: 28,
  gwpN2o: 265,
};

/** Manure and digester factors, GREET 2024 "Waste" tab. */
export const DAIRY_FACTORS = {
  vsPerTsCow: 0.8513157894736842,
  vsPerTsHeifer: 0.8501094091903719,
  ch4YieldCow: 0.24, // m3 CH4 per kg VS
  ch4YieldHeifer: 0.17,
  mcfCow: 0.02, // baseline management system CH4 conversion factor
  mcfHeifer: 0.67,
  ch4DensityGPerM3: 714.11,
  n2oDirectLbPerLbTs: 0.00033067302631578947,
  n2oVolatilisationLbPerLbTs: 0.00022715810526315793,
  n2oLeachingLbPerLbTs: 0.0000019238565789473684,
  flaringGco2ePerLbTs: 371.8983179606183, // per Btu/lb TS flared basis of 604
  /** Utility natural gas, combustion plus upstream, gCO2e per mmBtu. */
  ngCombustionCh4: 1.06,
  ngCombustionN2o: 0.75,
  ngCombustionCo2: 59366.94950326987,
  ngUpstream: 13382,
  /** Heavy duty diesel truck, grams per mile. */
  hdtCh4: 0.0142799638985863,
  hdtN2o: 0.0019166453667045131,
  hdtCo2: 1428.9572004944296,
  /** Pipeline transmission. */
  pipelineGco2ePerMmbtuMile: 4.08248327946316,
  tdLeakCh4GPerMmbtu: 3.92,
  /** CNG end use combustion, grams per mmBtu. */
  cngCh4: 43.673995277270826,
  cngN2o: 0.02307725924573382,
  cngCo2: 57782.95321608815,
  /** Feed loss profiles, grams per mmBtu of lost feed. */
  lossAd: { ch4: 287.04651583260295, n2o: 47.66569642561588, co2: -43355.05428307236, ch4Leak: 215.89526053137095 },
  lossUpgrading: { ch4: 289.1406733772626, n2o: 0.18281867006590766, co2: 8365.036304644906, ch4Leak: 272.513792605723 },
} as const;

const LB_PER_TONNE = 2204.62;
const MJ_PER_MMBTU = 1055.056;
const MMBTU_PER_KWH = 0.003412;

export interface DairyRngResult extends ModuleResult {
  /** Annual RNG output. */
  rngMmbtu: number;
  annualMj: number;
  /** Dry manure (total solids) processed, tonnes per year. */
  totalSolidsTonnes: number;
  volatileSolidsTonnes: number;
  wetManureTonnes: number;
  avoidedTonnesCo2e: number;
  annualTonnesCo2e: number;
}

export function computeDairyRng(i: DairyRngInputs, gridGPerKwh: number): DairyRngResult {
  const f = DAIRY_FACTORS;
  const moisture = Math.min(0.98, Math.max(0, i.moisture));

  // --- manure, total solids and volatile solids -----------------------------
  const wetCow = Math.max(0, i.dairyCows) * i.manureDairyCowTpy + Math.max(0, i.dryCows) * i.manureDryCowTpy;
  const wetHeifer = Math.max(0, i.heifers) * i.manureHeiferTpy;
  const tsCow = wetCow * (1 - moisture);
  const tsHeifer = wetHeifer * (1 - moisture);
  const totalTs = tsCow + tsHeifer;
  const vsCow = tsCow * f.vsPerTsCow;
  const vsHeifer = tsHeifer * f.vsPerTsHeifer;
  const totalVs = vsCow + vsHeifer;
  const tsLb = totalTs * LB_PER_TONNE;

  // --- avoided baseline emissions of the reference management system --------
  const ch4M3 = vsCow * 1000 * f.ch4YieldCow * Math.max(0, i.mcfCow) + vsHeifer * 1000 * f.ch4YieldHeifer * Math.max(0, i.mcfHeifer);
  const ch4Tonnes = (ch4M3 * f.ch4DensityGPerM3) / 1_000_000;
  const n2oLb = tsLb * (f.n2oDirectLbPerLbTs + f.n2oVolatilisationLbPerLbTs + f.n2oLeachingLbPerLbTs);
  const n2oTonnes = n2oLb * 0.0005;
  const avoidedTonnes = ch4Tonnes * i.gwpCh4 + n2oTonnes * i.gwpN2o;
  const avoidedG = -avoidedTonnes * 1_000_000;

  // --- RNG output -----------------------------------------------------------
  const rngMmbtu = (i.rngBtuPerLbTs * tsLb) / 1_000_000;
  const annualMj = rngMmbtu * MJ_PER_MMBTU;

  // --- process energy -------------------------------------------------------
  const ngMmbtu = (rngMmbtu * i.ngBtuPerMmbtu) / 1_000_000;
  const elecAdMmbtu = (rngMmbtu * i.elecAdBtuPerMmbtu) / 1_000_000;
  const elecRngMmbtu = (rngMmbtu * i.elecRngBtuPerMmbtu) / 1_000_000;
  const ngFactor =
    f.ngUpstream + f.ngCombustionCh4 * i.gwpCh4 + f.ngCombustionN2o * i.gwpN2o + f.ngCombustionCo2;
  const elecFactorPerMmbtu = gridGPerKwh / MMBTU_PER_KWH;

  const flaringG = i.flaringBtuPerLbTs > 0 ? f.flaringGco2ePerLbTs * tsLb : 0;
  const ngG = ngMmbtu * ngFactor;
  const elecG = (elecAdMmbtu + elecRngMmbtu) * elecFactorPerMmbtu;

  // --- feed loss ------------------------------------------------------------
  const lossOf = (
    p: { ch4: number; n2o: number; co2: number; ch4Leak: number },
    mmbtu: number,
    share: number,
  ) =>
    (p.ch4 * i.gwpCh4 + p.n2o * i.gwpN2o + p.co2 + p.ch4Leak * i.gwpCh4) * mmbtu * share;
  const feedLossG =
    lossOf(f.lossAd, ngMmbtu, i.feedLossAd) +
    lossOf(f.lossUpgrading, ngMmbtu, i.feedLossUpgrading) +
    lossOf(f.lossAd, elecAdMmbtu, i.feedLossAd) +
    lossOf(f.lossUpgrading, elecRngMmbtu, i.feedLossUpgrading);

  // --- on-farm trucking, transmission and end use ---------------------------
  const truckG = (f.hdtCh4 * i.gwpCh4 + f.hdtN2o * i.gwpN2o + f.hdtCo2) * Math.max(0, i.truckMiles);
  const pipelineG = f.pipelineGco2ePerMmbtuMile * rngMmbtu * Math.max(0, i.pipelineMiles);
  const tdLeakG = f.tdLeakCh4GPerMmbtu * rngMmbtu * i.gwpCh4;
  const tailpipeG = (f.cngCh4 * i.gwpCh4 + f.cngN2o * i.gwpN2o + f.cngCo2) * rngMmbtu;

  const per = (g: number) => (annualMj > 0 ? g / annualMj : 0);

  const rows: DetailRow[] = [
    {
      key: "dairy-avoided",
      label: "Avoided baseline manure emissions",
      gPerMj: per(avoidedG),
      detail: `${ch4Tonnes.toFixed(0)} t CH4 and ${n2oTonnes.toFixed(2)} t N2O avoided in the reference management system`,
      activity: avoidedTonnes,
      activityUnit: "tonnes CO2e/yr avoided",
      factor: 1_000_000,
      factorUnit: "g/tonne",
      divisor: annualMj,
      divisorUnit: "MJ RNG/yr",
      sign: -1,
    },
    {
      key: "dairy-flaring",
      label: "Biogas flaring",
      gPerMj: per(flaringG),
      detail: `${i.flaringBtuPerLbTs} Btu/lb TS flared`,
      activity: tsLb,
      activityUnit: "lb TS/yr",
      factor: i.flaringBtuPerLbTs > 0 ? f.flaringGco2ePerLbTs : 0,
      factorUnit: "gCO2e/lb TS",
      divisor: annualMj,
      divisorUnit: "MJ RNG/yr",
    },
    {
      key: "dairy-ng",
      label: "Digester and upgrading natural gas",
      gPerMj: per(ngG),
      detail: `${ngMmbtu.toFixed(0)} mmBtu/yr at ${ngFactor.toFixed(0)} gCO2e/mmBtu`,
      activity: ngMmbtu,
      activityUnit: "mmBtu/yr",
      factor: ngFactor,
      factorUnit: "gCO2e/mmBtu",
      divisor: annualMj,
      divisorUnit: "MJ RNG/yr",
    },
    {
      key: "dairy-electricity",
      label: "Digester and upgrading electricity",
      gPerMj: per(elecG),
      detail: `${((elecAdMmbtu + elecRngMmbtu) / MMBTU_PER_KWH).toFixed(0)} kWh/yr at ${gridGPerKwh.toFixed(0)} gCO2e/kWh`,
      activity: (elecAdMmbtu + elecRngMmbtu) / MMBTU_PER_KWH,
      activityUnit: "kWh/yr",
      factor: gridGPerKwh,
      factorUnit: "gCO2e/kWh",
      divisor: annualMj,
      divisorUnit: "MJ RNG/yr",
    },
    {
      key: "dairy-feedloss",
      label: "Feed loss in digestion and upgrading",
      gPerMj: per(feedLossG),
      detail: `${(i.feedLossAd * 100).toFixed(1)}% loss in digestion, ${(i.feedLossUpgrading * 100).toFixed(1)}% in upgrading`,
      activity: ngMmbtu + elecAdMmbtu + elecRngMmbtu,
      activityUnit: "mmBtu process energy/yr",
      factor: feedLossG / Math.max(1e-9, ngMmbtu + elecAdMmbtu + elecRngMmbtu),
      factorUnit: "gCO2e/mmBtu",
      divisor: annualMj,
      divisorUnit: "MJ RNG/yr",
    },
    {
      key: "dairy-truck",
      label: "On-farm heavy duty truck",
      gPerMj: per(truckG),
      detail: `${i.truckMiles} miles per year`,
      activity: i.truckMiles,
      activityUnit: "miles/yr",
      factor: f.hdtCh4 * i.gwpCh4 + f.hdtN2o * i.gwpN2o + f.hdtCo2,
      factorUnit: "gCO2e/mile",
      divisor: annualMj,
      divisorUnit: "MJ RNG/yr",
    },
    {
      key: "dairy-pipeline",
      label: "Pipeline transmission and distribution",
      gPerMj: per(pipelineG + tdLeakG),
      detail: `${i.pipelineMiles} miles of transmission plus ${f.tdLeakCh4GPerMmbtu} g CH4/mmBtu of T&D leakage`,
      activity: rngMmbtu,
      activityUnit: "mmBtu/yr",
      factor: f.pipelineGco2ePerMmbtuMile * i.pipelineMiles + f.tdLeakCh4GPerMmbtu * i.gwpCh4,
      factorUnit: "gCO2e/mmBtu",
      divisor: annualMj,
      divisorUnit: "MJ RNG/yr",
    },
    {
      key: "dairy-tailpipe",
      label: "End use combustion (CNG vehicle)",
      gPerMj: per(tailpipeG),
      detail: "Biogenic CO2 plus CH4 and N2O from compressed natural gas combustion",
      activity: rngMmbtu,
      activityUnit: "mmBtu/yr",
      factor: f.cngCh4 * i.gwpCh4 + f.cngN2o * i.gwpN2o + f.cngCo2,
      factorUnit: "gCO2e/mmBtu",
      divisor: annualMj,
      divisorUnit: "MJ RNG/yr",
    },
  ];

  const gPerMj = rows.reduce((a, r) => a + r.gPerMj, 0);
  return {
    gPerMj,
    rows,
    rngMmbtu,
    annualMj,
    totalSolidsTonnes: totalTs,
    volatileSolidsTonnes: totalVs,
    wetManureTonnes: wetCow + wetHeifer,
    avoidedTonnesCo2e: avoidedTonnes,
    annualTonnesCo2e: (gPerMj * annualMj) / 1_000_000,
  };
}

/** Category each farm model row belongs to in the results table. */
export const DAIRY_ROW_CATEGORY: Record<string, string> = {
  "dairy-avoided": "Credits",
  "dairy-flaring": "Process other",
  "dairy-ng": "Process energy",
  "dairy-electricity": "Process energy",
  "dairy-feedloss": "Process other",
  "dairy-truck": "Feedstock and land",
  "dairy-pipeline": "Distribution and use",
  "dairy-tailpipe": "Distribution and use",
};
