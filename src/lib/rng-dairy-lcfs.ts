// CARB Low Carbon Fuel Standard Tier 1 carbon intensity model for biomethane
// from anaerobic digestion of dairy and swine manure.
//
// Ported from the official CARB workbook "Tier 1 CI Calculator for Dairy and
// Swine Manure Biomethane" (release 07/01/2025). Baseline methane follows the
// Compliance Offset Protocol Livestock Projects (LOP) equations; emission
// factors come from the workbook's CA-GREET 4.0 "EF Table" and "Reference"
// tabs. Every constant below is taken verbatim from that workbook.

import type { DetailRow, ModuleResult } from "./ci-model";

/* -------------------------------------------------------------------------- */
/* Constants from the workbook "Reference" tab                                 */
/* -------------------------------------------------------------------------- */

/** Pure methane, at 60 °F and 1 atm. */
export const CH4_LHV_BTU_PER_SCF = 910;
export const CH4_HHV_BTU_PER_SCF = 1010;
export const CH4_G_PER_SCF = 19.2;
/** Natural gas LHV / HHV ratio. */
export const NG_LHV_OVER_HHV = 930 / 1030;
export const MJ_PER_MMBTU = 1055.05585;
/** CARB uses AR4 100-year global warming potentials. */
export const GWP_CH4 = 25;

/** CA-GREET 4.0 emission factors, workbook "EF Table". */
export const LCFS_EF = {
  /** Grid electricity, gCO2e/kWh, 2021 eGRID regions. */
  grid: {
    "U.S. Average": 474.148181146963,
    AKGD: 739.37369659441,
    AKMS: 305.059545323673,
    AZNM: 452.59799644549,
    CAMX: 329.315508965429,
    ERCT: 470.460374722124,
    FRCC: 500.089781318143,
    HIMS: 729.76964401039,
    HIOA: 993.040907533294,
    MROE: 835.172964608188,
    MROW: 522.27552659354,
    NEWE: 343.933375462127,
    NWPP: 341.732086206407,
    NYCW: 522.591004111294,
    NYLI: 603.060564595696,
    NYUP: 153.920304055846,
    PRMS: 864.848036472998,
    RFCE: 403.023279914903,
    RFCM: 647.656014165596,
    RFCW: 571.738488305412,
    RMPA: 581.244711438488,
    SPNO: 518.57796111835,
    SPSO: 538.184671025753,
    SRMV: 480.147590462689,
    SRMW: 820.129694193688,
    SRSO: 508.715830316534,
    SRTV: 503.56199416647,
    SRVC: 370.789402022482,
    Brazil: 110.572733592188,
    Canada: 142.587334547763,
  } as Record<string, number>,
  /** Utility natural gas burned in a small industrial boiler, gCO2e/MMBtu LHV. */
  naturalGasPerMmbtu: 75495.7512502708,
  /** Raw biogas used as process fuel, gCO2e/MMBtu LHV. */
  rawBiogasPerMmbtu: 60403.8007141577,
  /** Biomethane used as process fuel, gCO2e/MMBtu LHV. */
  biomethanePerMmbtu: 59501.074964157706,
  dieselPerGallon: 12308.3541997418,
  propanePerGallon: 7345.27740286076,
  /** On-site electricity generated from biogas, gCO2e/kWh (37% efficiency). */
  onsiteBiogasElecPerKwh: 641.4284167374154,
  /** RNG flaring, gCO2e/MJ LHV. */
  flaringPerMj: 57.25175659104464,
  /** Pipeline transmission energy, gCO2e/MJ-mile LHV. */
  pipelinePerMjMile: 0.00388751077308224,
  /** Pipeline evaporative losses, fraction of throughput per mile. */
  pipelineLossPerMile: 3.24778994302528e-6,
  /** Compression at the CNG fuelling station, gCO2e/MJ LHV. */
  cngCompressionPerMj: 2.96363943991798,
  /** Reciprocating engine tailpipe emissions, gCO2e/MMBtu LHV. */
  tailpipePerMmbtu: 64948.8527602583,
} as const;

export const EGRID_REGIONS = Object.keys(LCFS_EF.grid);

/** Digester type → methane leakage, workbook Reference Table A.3. */
export const DIGESTER_LEAKAGE: Record<string, number> = {
  "Covered Lagoon": 0.05,
  "Enclosed Vessel": 0.02,
  "Complete Mix": 0.02,
  "Plug Flow": 0.02,
  "Fixed Film": 0.02,
};
export const LCFS_DIGESTER_TYPES = Object.keys(DIGESTER_LEAKAGE);

/**
 * IPCC 2006 methane conversion factors by average annual temperature (°C),
 * workbook Reference Table A.5. Index 0 is "≤10 °C", index 18 is "≥28 °C".
 */
export const MCF_BY_TEMPERATURE: Record<string, number[]> = {
  "Pasture/Range/Paddock": [0.01,0.01,0.01,0.01,0.01,0.015,0.015,0.015,0.015,0.015,0.015,0.015,0.015,0.015,0.015,0.015,0.02,0.02,0.02],
  "Daily spread": [0.001,0.001,0.001,0.001,0.001,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.01,0.01,0.01],
  "Solid storage": [0.02,0.02,0.02,0.02,0.02,0.04,0.04,0.04,0.04,0.04,0.04,0.04,0.04,0.04,0.04,0.04,0.05,0.05,0.05],
  "Dry lot": [0.01,0.01,0.01,0.01,0.01,0.015,0.015,0.015,0.015,0.015,0.015,0.015,0.015,0.015,0.015,0.015,0.02,0.02,0.02],
  "Liquid/slurry with natural crust": [0.1,0.11,0.13,0.14,0.15,0.17,0.18,0.2,0.22,0.24,0.26,0.29,0.31,0.34,0.37,0.41,0.44,0.48,0.5],
  "Liquid/slurry uncovered": [0.17,0.19,0.2,0.22,0.25,0.27,0.29,0.32,0.35,0.39,0.42,0.46,0.5,0.55,0.6,0.65,0.71,0.78,0.8],
  "Uncovered anaerobic lagoon": [0.66,0.68,0.7,0.71,0.73,0.74,0.75,0.76,0.77,0.77,0.78,0.78,0.78,0.79,0.79,0.79,0.79,0.8,0.8],
  "Pit storage below animals (<1 month)": [0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.03],
  "Pit storage below animals (>1 month)": [0.17,0.19,0.2,0.22,0.25,0.27,0.29,0.32,0.35,0.39,0.42,0.46,0.5,0.55,0.6,0.65,0.71,0.78,0.8],
  "Burned for fuel": [0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1],
  "Cattle and swine deep bedding (<1 month)": [0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.03,0.3,0.3,0.3],
  "Cattle and swine deep bedding (>1 month)": [0.17,0.19,0.2,0.22,0.25,0.27,0.29,0.32,0.35,0.39,0.42,0.46,0.5,0.55,0.6,0.65,0.71,0.78,0.9],
  "Composting - in-vessel": [0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005],
  "Composting - passive or intensive windrow": [0.005,0.005,0.005,0.005,0.005,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.015,0.015,0.015],
  "Aerobic treatment": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
};
export const STORAGE_SYSTEMS = Object.keys(MCF_BY_TEMPERATURE);

export function mcfFor(system: string, temperatureC: number): number {
  const row = MCF_BY_TEMPERATURE[system];
  if (!row) return 0;
  const idx = Math.min(18, Math.max(0, Math.round(temperatureC) - 10));
  return row[idx] ?? 0;
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Van't Hoff-Arrhenius factor, LOP Equation 5.2, bounded to [0.104, 0.95] as
 * the CARB workbook does.
 */
export function vanTHoffFactor(temperatureC: number): number {
  const t = temperatureC + 273;
  const f = Math.exp((15175 * (t - 303.16)) / (1.987 * t * 303.17));
  return Math.min(0.95, Math.max(0.104, f));
}

/* -------------------------------------------------------------------------- */
/* Inputs                                                                      */
/* -------------------------------------------------------------------------- */

export interface LivestockCategory {
  label: string;
  /** Average head over the reporting period. */
  population: number;
  /** Volatile solids excretion rate, dry kg per animal per day. */
  vsRate: number;
  /** Maximum methane potential, m3 CH4 per kg VS. */
  bo: number;
  /** Fraction of volatile solids sent to the anaerobic storage/treatment system. */
  msAnaerobic: number;
}

/**
 * One storage/treatment system and the fraction of each livestock category's
 * manure it handles. Fractions are indexed to the livestock array.
 */
export interface StorageAllocation {
  system: string;
  fractions: number[];
}

export interface DairyRngLcfsInputs {
  /* Project background */
  digesterType: string;
  electricityRegion: string;
  /** Average annual ambient temperature, °C — drives every MCF lookup. */
  annualTemperatureC: number;
  /** Monthly average ambient temperatures, °C, January first. */
  monthlyTemperatureC: number[];
  /** Full lagoon cleanout each September in the baseline. */
  septemberCleanout: boolean;
  /** Baseline non-anaerobic storage/treatment systems. */
  otherStorage: StorageAllocation[];
  /** Project non-BCS storage/treatment systems. */
  nonBcsStorage: StorageAllocation[];
  /** Number of project reporting months. */
  reportingMonths: number;

  livestock: LivestockCategory[];

  /* Project gas, totals over the reporting period */
  /** Raw biogas produced, standard cubic feet at 60 °F. */
  rawBiogasScf: number;
  rawBiogasCh4: number;
  /** Raw biogas sent to cleanup/upgrading, scf. */
  biogasToUpgradingScf: number;
  biogasToUpgradingCh4: number;
  /** Biomethane injected into the pipeline, MMBtu HHV. */
  biomethaneInjectedMmbtuHhv: number;
  /** Flared biomethane including upgrading tail gas, scf. */
  flaredBiomethaneScf: number;
  flaredBiomethaneCh4: number;
  /** Biogas vented uncontrolled, scf. */
  ventedBiogasScf: number;
  ventedBiogasCh4: number;
  /** Biomethane sent to on-site electricity production, MMBtu HHV. */
  onsiteElectricityRngMmbtuHhv: number;
  /** Share of on-site generated electricity exported off site. */
  exportedElectricityShare: number;

  /* Effluent ponds */
  /** Fraction of volatile solids removed before effluent reaches the ponds. */
  vsRemovedBeforePond: number;

  /* Energy use, totals over the reporting period */
  digesterGridKwh: number;
  digesterNgMmbtuHhv: number;
  digesterDieselGal: number;
  digesterRawBiogasMmbtuLhv: number;
  digesterBiomethaneMmbtuHhv: number;
  upgradingGridKwh: number;
  upgradingNgMmbtuHhv: number;
  upgradingDieselGal: number;
  upgradingPropaneGal: number;
  upgradingOnsiteElecKwh: number;
  upgradingRawBiogasMmbtuLhv: number;
  upgradingBiomethaneMmbtuHhv: number;

  /* Delivery */
  pipelineMiles: number;
}

/** Defaults reproduce the example pathway shipped in the CARB workbook. */
export const DEFAULT_DAIRY_RNG_LCFS: DairyRngLcfsInputs = {
  digesterType: "Enclosed Vessel",
  electricityRegion: "FRCC",
  annualTemperatureC: 19,
  monthlyTemperatureC: [8.16, 15.12, 9.37, 21.81, 24.61, 26.62, 27.74, 26.53, 19.09, 20.35, 15.39, 13.04],
  septemberCleanout: true,
  otherStorage: [
    { system: "Daily spread", fractions: [0.01, 0.1, 0.1] },
    { system: "Cattle and swine deep bedding (>1 month)", fractions: [0.1683, 0.153, 0.153] },
  ],
  nonBcsStorage: [
    { system: "Daily spread", fractions: [0.01, 0.01, 0.01] },
    { system: "Cattle and swine deep bedding (<1 month)", fractions: [0.1121, 0.1121, 0.1121] },
  ],
  reportingMonths: 5,
  livestock: [
    { label: "Dairy cows (on feed)", population: 3351, vsRate: 7.0448, bo: 0.24, msAnaerobic: 0.8217 },
    { label: "Non-milking dairy cows (on feed)", population: 449, vsRate: 3.80304, bo: 0.24, msAnaerobic: 0.8217 },
    { label: "Heifers (on feed)", population: 142, vsRate: 3.43508, bo: 0.17, msAnaerobic: 0.8217 },
  ],
  rawBiogasScf: 53421950,
  rawBiogasCh4: 0.5853,
  biogasToUpgradingScf: 51171132,
  biogasToUpgradingCh4: 0.5853,
  biomethaneInjectedMmbtuHhv: 28774.45,
  flaredBiomethaneScf: 96167.25,
  flaredBiomethaneCh4: 0.985,
  ventedBiogasScf: 0,
  ventedBiogasCh4: 0.58,
  onsiteElectricityRngMmbtuHhv: 0,
  exportedElectricityShare: 0,
  vsRemovedBeforePond: 0.17 + 0.83 * 0.25,
  digesterGridKwh: 0,
  digesterNgMmbtuHhv: 14961.75,
  digesterDieselGal: 0,
  digesterRawBiogasMmbtuLhv: 0,
  digesterBiomethaneMmbtuHhv: 0,
  upgradingGridKwh: 1299297.89,
  upgradingNgMmbtuHhv: 0,
  upgradingDieselGal: 0,
  upgradingPropaneGal: 0,
  upgradingOnsiteElecKwh: 0,
  upgradingRawBiogasMmbtuLhv: 0,
  upgradingBiomethaneMmbtuHhv: 0,
  pipelineMiles: 2376,
};

/* -------------------------------------------------------------------------- */
/* Result                                                                      */
/* -------------------------------------------------------------------------- */

export interface DairyRngLcfsResult extends ModuleResult {
  /** Dispensable biomethane over the reporting period, MMBtu LHV. */
  dispensableMmbtu: number;
  /** Energy basis used for every gCO2e/MJ figure. */
  periodMj: number;
  /** Annualised energy, MJ per year. */
  annualMj: number;
  annualTonnesCo2e: number;
  /** Baseline methane, MT CH4 per month. */
  baselineCh4PerMonth: number;
  baselineAnaerobicPerMonth: number;
  baselineOtherPerMonth: number;
  /** Project methane, MT CH4 per month. */
  projectCh4PerMonth: number;
  effluentPondPerMonth: number;
  nonBcsPerMonth: number;
  digesterLeakagePerMonth: number;
  upgradingFugitivePerMonth: number;
  ventedPerMonth: number;
  flaredPerMonth: number;
  /** Fraction of inlet methane lost as upgrading fugitives. */
  upgradingFugitiveFraction: number;
  /** Share of avoided methane allocated to the RNG sold. */
  allocationFactor: number;
  netCh4AvoidedMt: number;
  avoidedCh4GPerMj: number;
  divertedCo2GPerMj: number;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n || 0));
const pos = (n: number) => Math.max(0, n || 0);

/** MT CH4 contained in a volume of gas. */
const ch4Mt = (scf: number, ch4Fraction: number) => (pos(scf) * clamp01(ch4Fraction) * CH4_G_PER_SCF) / 1e6;
/** MT CH4 contained in an HHV energy quantity of biomethane. */
const ch4MtFromMmbtuHhv = (mmbtu: number) => (pos(mmbtu) / CH4_HHV_BTU_PER_SCF) * CH4_G_PER_SCF;

export function computeDairyRngLcfs(i: DairyRngLcfsInputs): DairyRngLcfsResult {
  const months = Math.max(1, Math.round(i.reportingMonths || 1));
  const temps = i.monthlyTemperatureC?.length === 12 ? i.monthlyTemperatureC : Array(12).fill(i.annualTemperatureC);

  /* ---- Section L1: baseline methane from anaerobic storage ---------------- */
  // LOP Equation 5.1-5.3: monthly volatile solids balance with carryover and
  // an optional full cleanout in September.
  let baselineAnaerobicYear = 0;
  for (const cat of i.livestock) {
    let carryover = 0;
    // Two passes: the first warms the volatile-solids carryover up to steady
    // state, the second is the reported year.
    for (let pass = 0; pass < 1; pass++) {
      for (let m = 0; m < 12; m++) {
        const days = DAYS_IN_MONTH[m] ?? 30;
        const available = pos(cat.vsRate) * pos(cat.population) * clamp01(cat.msAnaerobic) * days * 0.8 + carryover;
        const f = vanTHoffFactor(temps[m] ?? i.annualTemperatureC);
        const degraded = available * f;
        if (pass === 1) baselineAnaerobicYear += degraded * pos(cat.bo) * 0.68 * 0.001;
        const leftover = available - degraded;
        carryover = i.septemberCleanout && m === 8 ? 0 : leftover;
      }
    }
  }
  const baselineAnaerobicPerMonth = baselineAnaerobicYear / 12;

  /* ---- Section L2: baseline methane from other storage systems ------------ */
  // LOP Equation 5.4, on an annual (365 day) basis.
  const storageYear = (allocations: StorageAllocation[]) => {
    let total = 0;
    i.livestock.forEach((cat, idx) => {
      const weighted = (allocations ?? []).reduce(
        (a, s2) => a + mcfFor(s2.system, i.annualTemperatureC) * clamp01(s2.fractions?.[idx] ?? 0),
        0,
      );
      total += pos(cat.vsRate) * pos(cat.bo) * 365 * 0.68 * weighted * pos(cat.population) * 0.001;
    });
    return total;
  };
  const baselineOtherYear = storageYear(i.otherStorage);
  const baselineOtherPerMonth = baselineOtherYear / 12;
  const baselineCh4PerMonth = baselineAnaerobicPerMonth + baselineOtherPerMonth;

  /* ---- Section L3: project methane from venting events -------------------- */
  const ventedPerMonth = ch4Mt(i.ventedBiogasScf, i.ventedBiogasCh4) / months;

  /* ---- Section L4: project methane from effluent ponds -------------------- */
  // LOP Equation 5.8. MCF uses the uncovered liquid/slurry row.
  const mcfPond = mcfFor("Liquid/slurry uncovered", i.annualTemperatureC);
  let pondM3PerDay = 0;
  for (const cat of i.livestock) {
    pondM3PerDay +=
      pos(cat.population) * pos(cat.vsRate) * pos(cat.bo) * 0.99 * (1 - clamp01(i.vsRemovedBeforePond)) * 0.3;
  }
  const effluentPondPerMonth = (pondM3PerDay * 365 * 0.68 * mcfPond * 0.001) / 12;

  /* ---- Section L5: project methane from non-BCS sources ------------------- */
  const nonBcsYear = storageYear(i.nonBcsStorage);
  const nonBcsPerMonth = nonBcsYear / 12;

  /* ---- Digester leakage --------------------------------------------------- */
  const leakRate = DIGESTER_LEAKAGE[i.digesterType] ?? 0.02;
  const rawCh4Mt = ch4Mt(i.rawBiogasScf, i.rawBiogasCh4);
  const digesterLeakagePerMonth = (rawCh4Mt * (leakRate / (1 - leakRate))) / months;

  /* ---- Methane balance through upgrading ---------------------------------- */
  const inletCh4Mt = ch4Mt(i.biogasToUpgradingScf, i.biogasToUpgradingCh4);
  const salesCh4Mt = ch4MtFromMmbtuHhv(i.biomethaneInjectedMmbtuHhv);
  const flaredCh4Mt = ch4Mt(i.flaredBiomethaneScf, i.flaredBiomethaneCh4);
  const onsiteCh4Mt = ch4MtFromMmbtuHhv(i.onsiteElectricityRngMmbtuHhv);
  const upgradingFugitiveFraction =
    inletCh4Mt > 0 ? Math.max(0.02, (inletCh4Mt - salesCh4Mt - flaredCh4Mt - onsiteCh4Mt) / inletCh4Mt) : 0.02;
  const upgradingFugitivePerMonth = (inletCh4Mt * upgradingFugitiveFraction) / months;
  const flaredPerMonth = flaredCh4Mt / months;

  const projectCh4PerMonth =
    ventedPerMonth +
    effluentPondPerMonth +
    nonBcsPerMonth +
    digesterLeakagePerMonth +
    upgradingFugitivePerMonth +
    flaredPerMonth;

  /* ---- Avoided methane and diverted CO2 ----------------------------------- */
  // Workbook "Avoided Emissions" sections P2 and P3. The project subtotal
  // excludes flaring and upgrading fugitives, which are charged to the
  // pathway as direct emissions instead.
  const subtotalProject =
    (ventedPerMonth + effluentPondPerMonth + nonBcsPerMonth + digesterLeakagePerMonth) * months;
  const baselineTotal = baselineCh4PerMonth * months;
  const rawNet = subtotalProject - baselineTotal;
  const netCh4AvoidedMt = rawNet < -rawCh4Mt ? -rawCh4Mt : rawNet;

  const allocationFactor =
    rawCh4Mt > 0 ? (inletCh4Mt - onsiteCh4Mt * clamp01(i.exportedElectricityShare)) / rawCh4Mt : 0;
  const allocatedCh4 = netCh4AvoidedMt * allocationFactor;
  // MT avoided per MT of biomethane sold, converted to grams per MJ LHV.
  const mtToGPerMj = ((1e6 / CH4_LHV_BTU_PER_SCF) * CH4_G_PER_SCF) / MJ_PER_MMBTU;
  const perMtRng = salesCh4Mt > 0 ? allocatedCh4 / salesCh4Mt : 0;
  const avoidedCh4GPerMj = perMtRng * mtToGPerMj * GWP_CH4;

  // Carbon that would have been released as CO2 in the baseline but leaves as
  // methane in the project: (excess CH4) x 44/16.
  const divertedCo2Mt = -netCh4AvoidedMt === rawCh4Mt ? 0 : -(rawCh4Mt + rawNet) * (44 / 16);
  const divertedAllocated = divertedCo2Mt * allocationFactor;
  const divertedCo2GPerMj = salesCh4Mt > 0 ? (divertedAllocated / salesCh4Mt) * mtToGPerMj : 0;

  /* ---- Energy basis -------------------------------------------------------- */
  const injectedMmbtuLhv = (pos(i.biomethaneInjectedMmbtuHhv) * CH4_LHV_BTU_PER_SCF) / CH4_HHV_BTU_PER_SCF;
  const pipelineLoss = clamp01(LCFS_EF.pipelineLossPerMile * pos(i.pipelineMiles));
  const dispensableMmbtu = injectedMmbtuLhv * (1 - pipelineLoss);
  const periodMj = dispensableMmbtu * MJ_PER_MMBTU;
  const per = (g: number) => (periodMj > 0 ? g / periodMj : 0);

  /* ---- Process energy ------------------------------------------------------ */
  const gridEf = LCFS_EF.grid[i.electricityRegion] ?? LCFS_EF.grid["U.S. Average"] ?? 474.148181146963;
  const ngLhv = (mmbtuHhv: number) => pos(mmbtuHhv) * NG_LHV_OVER_HHV;
  const bmLhv = (mmbtuHhv: number) => (pos(mmbtuHhv) * CH4_LHV_BTU_PER_SCF) / CH4_HHV_BTU_PER_SCF;

  const digesterG =
    pos(i.digesterGridKwh) * gridEf +
    ngLhv(i.digesterNgMmbtuHhv) * LCFS_EF.naturalGasPerMmbtu +
    pos(i.digesterDieselGal) * LCFS_EF.dieselPerGallon +
    pos(i.digesterRawBiogasMmbtuLhv) * LCFS_EF.rawBiogasPerMmbtu +
    bmLhv(i.digesterBiomethaneMmbtuHhv) * LCFS_EF.biomethanePerMmbtu;

  const upgradingG =
    pos(i.upgradingGridKwh) * gridEf +
    ngLhv(i.upgradingNgMmbtuHhv) * LCFS_EF.naturalGasPerMmbtu +
    pos(i.upgradingDieselGal) * LCFS_EF.dieselPerGallon +
    pos(i.upgradingPropaneGal) * LCFS_EF.propanePerGallon +
    pos(i.upgradingOnsiteElecKwh) * LCFS_EF.onsiteBiogasElecPerKwh +
    pos(i.upgradingRawBiogasMmbtuLhv) * LCFS_EF.rawBiogasPerMmbtu +
    bmLhv(i.upgradingBiomethaneMmbtuHhv) * LCFS_EF.biomethanePerMmbtu;

  const flaredMmbtuLhv = (flaredCh4Mt * 1e6) / CH4_G_PER_SCF * (CH4_LHV_BTU_PER_SCF / 1e6);
  const flaringG = flaredMmbtuLhv * MJ_PER_MMBTU * LCFS_EF.flaringPerMj;
  const fugitiveG = inletCh4Mt * upgradingFugitiveFraction * 1e6 * GWP_CH4;

  const pipelineEnergyG = LCFS_EF.pipelinePerMjMile * pos(i.pipelineMiles) * injectedMmbtuLhv * MJ_PER_MMBTU;
  const pipelineLossG = pipelineLoss * salesCh4Mt * 1e6 * GWP_CH4;
  const compressionG = LCFS_EF.cngCompressionPerMj * periodMj;
  const tailpipeG = LCFS_EF.tailpipePerMmbtu * dispensableMmbtu;

  const mj = "MJ RNG dispensed";
  const rows: DetailRow[] = [
    {
      key: "lcfs-digester-energy",
      label: "Digester energy use",
      gPerMj: per(digesterG),
      detail: `Grid electricity, natural gas, diesel and biogas burned at the digester over ${months} reporting months`,
      activity: digesterG / 1e6,
      activityUnit: "tonnes CO2e",
      factor: 1e6,
      factorUnit: "g/tonne",
      divisor: periodMj,
      divisorUnit: mj,
    },
    {
      key: "lcfs-upgrading-energy",
      label: "Upgrading and compression energy use",
      gPerMj: per(upgradingG),
      detail: `${Math.round(pos(i.upgradingGridKwh)).toLocaleString()} kWh of grid electricity at ${gridEf.toFixed(0)} gCO2e/kWh plus other process fuels`,
      activity: upgradingG / 1e6,
      activityUnit: "tonnes CO2e",
      factor: 1e6,
      factorUnit: "g/tonne",
      divisor: periodMj,
      divisorUnit: mj,
    },
    {
      key: "lcfs-flaring",
      label: "Flared biomethane",
      gPerMj: per(flaringG),
      detail: `${flaredCh4Mt.toFixed(2)} MT CH4 flared, including upgrading tail gas`,
      activity: flaredMmbtuLhv,
      activityUnit: "MMBtu LHV flared",
      factor: MJ_PER_MMBTU * LCFS_EF.flaringPerMj,
      factorUnit: "gCO2e/MMBtu",
      divisor: periodMj,
      divisorUnit: mj,
    },
    {
      key: "lcfs-fugitives",
      label: "Post-digester fugitive methane",
      gPerMj: per(fugitiveG),
      detail: `${(upgradingFugitiveFraction * 100).toFixed(2)}% of inlet methane lost in upgrading (CARB floor is 2%)`,
      activity: inletCh4Mt * upgradingFugitiveFraction,
      activityUnit: "MT CH4",
      factor: 1e6 * GWP_CH4,
      factorUnit: "gCO2e/MT CH4",
      divisor: periodMj,
      divisorUnit: mj,
    },
    {
      key: "lcfs-pipeline",
      label: "Biomethane pipeline transmission",
      gPerMj: per(pipelineEnergyG + pipelineLossG),
      detail: `${pos(i.pipelineMiles).toLocaleString()} pipeline miles plus ${(pipelineLoss * 100).toFixed(2)}% evaporative loss`,
      activity: pos(i.pipelineMiles),
      activityUnit: "miles",
      factor: periodMj > 0 ? (pipelineEnergyG + pipelineLossG) / Math.max(1, pos(i.pipelineMiles)) : 0,
      factorUnit: "gCO2e/mile",
      divisor: periodMj,
      divisorUnit: mj,
    },
    {
      key: "lcfs-compression",
      label: "CNG production (station compression)",
      gPerMj: per(compressionG),
      detail: "CARB standard value for compression at the fuelling station",
      activity: periodMj,
      activityUnit: mj,
      factor: LCFS_EF.cngCompressionPerMj,
      factorUnit: "gCO2e/MJ",
      divisor: periodMj,
      divisorUnit: mj,
    },
    {
      key: "lcfs-tailpipe",
      label: "Tailpipe emissions (CNG vehicle)",
      gPerMj: per(tailpipeG),
      detail: "Reciprocating engine combustion of the dispensed fuel",
      activity: dispensableMmbtu,
      activityUnit: "MMBtu LHV",
      factor: LCFS_EF.tailpipePerMmbtu,
      factorUnit: "gCO2e/MMBtu",
      divisor: periodMj,
      divisorUnit: mj,
    },
    {
      key: "lcfs-avoided-ch4",
      label: "Avoided methane credit",
      gPerMj: avoidedCh4GPerMj,
      detail: `${baselineCh4PerMonth.toFixed(2)} MT CH4/month baseline against ${projectCh4PerMonth.toFixed(2)} MT CH4/month in the project`,
      activity: Math.abs(allocatedCh4),
      activityUnit: "MT CH4 avoided",
      factor: 1e6 * GWP_CH4,
      factorUnit: "gCO2e/MT CH4",
      divisor: periodMj,
      divisorUnit: mj,
      sign: -1,
    },
    {
      key: "lcfs-diverted-co2",
      label: "Diverted CO2 credit",
      gPerMj: divertedCo2GPerMj,
      detail: "Carbon that would have been released as CO2 in the baseline and leaves as methane in the project",
      activity: Math.abs(divertedAllocated),
      activityUnit: "MT CO2",
      factor: 1e6,
      factorUnit: "g/tonne",
      divisor: periodMj,
      divisorUnit: mj,
      sign: -1,
    },
  ];

  const gPerMj = rows.reduce((a, r) => a + r.gPerMj, 0);
  const annualMj = (periodMj / months) * 12;
  return {
    gPerMj,
    rows,
    dispensableMmbtu,
    periodMj,
    annualMj,
    annualTonnesCo2e: (gPerMj * annualMj) / 1e6,
    baselineCh4PerMonth,
    baselineAnaerobicPerMonth,
    baselineOtherPerMonth,
    projectCh4PerMonth,
    effluentPondPerMonth,
    nonBcsPerMonth,
    digesterLeakagePerMonth,
    upgradingFugitivePerMonth,
    ventedPerMonth,
    flaredPerMonth,
    upgradingFugitiveFraction,
    allocationFactor,
    netCh4AvoidedMt: netCh4AvoidedMt,
    avoidedCh4GPerMj,
    divertedCo2GPerMj,
  };
}

/** Category each CARB row belongs to in the results table. */
export const DAIRY_LCFS_ROW_CATEGORY: Record<string, string> = {
  "lcfs-digester-energy": "Process energy",
  "lcfs-upgrading-energy": "Process energy",
  "lcfs-flaring": "Process other",
  "lcfs-fugitives": "Process other",
  "lcfs-pipeline": "Distribution and use",
  "lcfs-compression": "Distribution and use",
  "lcfs-tailpipe": "Distribution and use",
  "lcfs-avoided-ch4": "Credits",
  "lcfs-diverted-co2": "Credits",
};
