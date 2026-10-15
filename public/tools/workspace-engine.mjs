import * as CreditEngine from "./credit-engine.mjs";
/* GBW-owned CI Workspace source, imported from the reference on 2026-10-14. */

const __modules = {};
__modules["gbw-workspace/engine/source/rng-dairy-lcfs.mjs"] = (() => {
  // CARB Low Carbon Fuel Standard Tier 1 carbon intensity model for biomethane
  // from anaerobic digestion of dairy and swine manure.
  //
  // Ported from the official CARB workbook "Tier 1 CI Calculator for Dairy and
  // Swine Manure Biomethane" (release 07/01/2025). Baseline methane follows the
  // Compliance Offset Protocol Livestock Projects (LOP) equations; emission
  // factors come from the workbook's CA-GREET 4.0 "EF Table" and "Reference"
  // tabs. Every constant below is taken verbatim from that workbook.

  /* -------------------------------------------------------------------------- */
  /* Constants from the workbook "Reference" tab                                 */
  /* -------------------------------------------------------------------------- */

  /** Pure methane, at 60 °F and 1 atm. */
  const CH4_LHV_BTU_PER_SCF = 910;
  const CH4_HHV_BTU_PER_SCF = 1010;
  const CH4_G_PER_SCF = 19.2;
  /** Natural gas LHV / HHV ratio. */
  const NG_LHV_OVER_HHV = 930 / 1030;
  const MJ_PER_MMBTU = 1055.05585;
  /** CARB uses AR4 100-year global warming potentials. */
  const GWP_CH4 = 25;

  /** CA-GREET 4.0 emission factors, workbook "EF Table". */
  const LCFS_EF = {
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
    },
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
  };

  const EGRID_REGIONS = Object.keys(LCFS_EF.grid);

  /** Digester type → methane leakage, workbook Reference Table A.3. */
  const DIGESTER_LEAKAGE = {
    "Covered Lagoon": 0.05,
    "Enclosed Vessel": 0.02,
    "Complete Mix": 0.02,
    "Plug Flow": 0.02,
    "Fixed Film": 0.02,
  };
  const LCFS_DIGESTER_TYPES = Object.keys(DIGESTER_LEAKAGE);

  /**
   * IPCC 2006 methane conversion factors by average annual temperature (°C),
   * workbook Reference Table A.5. Index 0 is "≤10 °C", index 18 is "≥28 °C".
   */
  const MCF_BY_TEMPERATURE = {
    "Pasture/Range/Paddock": [
      0.01, 0.01, 0.01, 0.01, 0.01, 0.015, 0.015, 0.015, 0.015, 0.015, 0.015, 0.015, 0.015, 0.015,
      0.015, 0.015, 0.02, 0.02, 0.02,
    ],
    "Daily spread": [
      0.001, 0.001, 0.001, 0.001, 0.001, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005,
      0.005, 0.005, 0.005, 0.01, 0.01, 0.01,
    ],
    "Solid storage": [
      0.02, 0.02, 0.02, 0.02, 0.02, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04,
      0.04, 0.05, 0.05, 0.05,
    ],
    "Dry lot": [
      0.01, 0.01, 0.01, 0.01, 0.01, 0.015, 0.015, 0.015, 0.015, 0.015, 0.015, 0.015, 0.015, 0.015,
      0.015, 0.015, 0.02, 0.02, 0.02,
    ],
    "Liquid/slurry with natural crust": [
      0.1, 0.11, 0.13, 0.14, 0.15, 0.17, 0.18, 0.2, 0.22, 0.24, 0.26, 0.29, 0.31, 0.34, 0.37, 0.41,
      0.44, 0.48, 0.5,
    ],
    "Liquid/slurry uncovered": [
      0.17, 0.19, 0.2, 0.22, 0.25, 0.27, 0.29, 0.32, 0.35, 0.39, 0.42, 0.46, 0.5, 0.55, 0.6, 0.65,
      0.71, 0.78, 0.8,
    ],
    "Uncovered anaerobic lagoon": [
      0.66, 0.68, 0.7, 0.71, 0.73, 0.74, 0.75, 0.76, 0.77, 0.77, 0.78, 0.78, 0.78, 0.79, 0.79, 0.79,
      0.79, 0.8, 0.8,
    ],
    "Pit storage below animals (<1 month)": [
      0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03,
      0.03, 0.03, 0.03, 0.03,
    ],
    "Pit storage below animals (>1 month)": [
      0.17, 0.19, 0.2, 0.22, 0.25, 0.27, 0.29, 0.32, 0.35, 0.39, 0.42, 0.46, 0.5, 0.55, 0.6, 0.65,
      0.71, 0.78, 0.8,
    ],
    "Burned for fuel": [
      0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
    ],
    "Cattle and swine deep bedding (<1 month)": [
      0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03,
      0.03, 0.3, 0.3, 0.3,
    ],
    "Cattle and swine deep bedding (>1 month)": [
      0.17, 0.19, 0.2, 0.22, 0.25, 0.27, 0.29, 0.32, 0.35, 0.39, 0.42, 0.46, 0.5, 0.55, 0.6, 0.65,
      0.71, 0.78, 0.9,
    ],
    "Composting - in-vessel": [
      0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005,
      0.005, 0.005, 0.005, 0.005, 0.005, 0.005,
    ],
    "Composting - passive or intensive windrow": [
      0.005, 0.005, 0.005, 0.005, 0.005, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01,
      0.01, 0.015, 0.015, 0.015,
    ],
    "Aerobic treatment": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  };
  const STORAGE_SYSTEMS = Object.keys(MCF_BY_TEMPERATURE);

  function mcfFor(system, temperatureC) {
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
  function vanTHoffFactor(temperatureC) {
    const t = temperatureC + 273;
    const f = Math.exp((15175 * (t - 303.16)) / (1.987 * t * 303.17));
    return Math.min(0.95, Math.max(0.104, f));
  }

  /* -------------------------------------------------------------------------- */
  /* Inputs                                                                      */
  /* -------------------------------------------------------------------------- */

  /**
   * One storage/treatment system and the fraction of each livestock category's
   * manure it handles. Fractions are indexed to the livestock array.
   */

  /** Defaults reproduce the example pathway shipped in the CARB workbook. */
  const DEFAULT_DAIRY_RNG_LCFS = {
    digesterType: "Enclosed Vessel",
    electricityRegion: "FRCC",
    annualTemperatureC: 19,
    monthlyTemperatureC: [
      8.16, 15.12, 9.37, 21.81, 24.61, 26.62, 27.74, 26.53, 19.09, 20.35, 15.39, 13.04,
    ],
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
      {
        label: "Dairy cows (on feed)",
        population: 3351,
        vsRate: 7.0448,
        bo: 0.24,
        msAnaerobic: 0.8217,
      },
      {
        label: "Non-milking dairy cows (on feed)",
        population: 449,
        vsRate: 3.80304,
        bo: 0.24,
        msAnaerobic: 0.8217,
      },
      {
        label: "Heifers (on feed)",
        population: 142,
        vsRate: 3.43508,
        bo: 0.17,
        msAnaerobic: 0.8217,
      },
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

  const clamp01 = (n) => Math.min(1, Math.max(0, n || 0));
  const pos = (n) => Math.max(0, n || 0);

  /** MT CH4 contained in a volume of gas. */
  const ch4Mt = (scf, ch4Fraction) => (pos(scf) * clamp01(ch4Fraction) * CH4_G_PER_SCF) / 1e6;
  /** MT CH4 contained in an HHV energy quantity of biomethane. */
  const ch4MtFromMmbtuHhv = (mmbtu) => (pos(mmbtu) / CH4_HHV_BTU_PER_SCF) * CH4_G_PER_SCF;

  function computeDairyRngLcfs(i) {
    const months = Math.max(1, Math.round(i.reportingMonths || 1));
    const temps =
      i.monthlyTemperatureC?.length === 12
        ? i.monthlyTemperatureC
        : Array(12).fill(i.annualTemperatureC);

    /* ---- Section L1: baseline methane from anaerobic storage ---------------- */
    // LOP Equation 5.1-5.3: monthly volatile solids balance with carryover and
    // an optional full cleanout in September.
    let baselineAnaerobicYear = 0;
    for (const cat of i.livestock) {
      let carryover = 0;
      // Two passes: the first warms the volatile-solids carryover up to steady
      // state, the second is the reported year.
      for (let pass = 0; pass < 2; pass++) {
        for (let m = 0; m < 12; m++) {
          const days = DAYS_IN_MONTH[m] ?? 30;
          const available =
            pos(cat.vsRate) * pos(cat.population) * clamp01(cat.msAnaerobic) * days * 0.8 +
            carryover;
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
    const storageYear = (allocations) => {
      let total = 0;
      i.livestock.forEach((cat, idx) => {
        const weighted = (allocations ?? []).reduce(
          (a, s2) =>
            a + mcfFor(s2.system, i.annualTemperatureC) * clamp01(s2.fractions?.[idx] ?? 0),
          0,
        );
        total +=
          pos(cat.vsRate) * pos(cat.bo) * 365 * 0.68 * weighted * pos(cat.population) * 0.001;
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
        pos(cat.population) *
        pos(cat.vsRate) *
        pos(cat.bo) *
        0.99 *
        (1 - clamp01(i.vsRemovedBeforePond)) *
        0.3;
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
      inletCh4Mt > 0
        ? Math.max(0.02, (inletCh4Mt - salesCh4Mt - flaredCh4Mt - onsiteCh4Mt) / inletCh4Mt)
        : 0.02;
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
      rawCh4Mt > 0
        ? (inletCh4Mt - onsiteCh4Mt * clamp01(i.exportedElectricityShare)) / rawCh4Mt
        : 0;
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
    const injectedMmbtuLhv =
      (pos(i.biomethaneInjectedMmbtuHhv) * CH4_LHV_BTU_PER_SCF) / CH4_HHV_BTU_PER_SCF;
    const pipelineLoss = clamp01(LCFS_EF.pipelineLossPerMile * pos(i.pipelineMiles));
    const dispensableMmbtu = injectedMmbtuLhv * (1 - pipelineLoss);
    const periodMj = dispensableMmbtu * MJ_PER_MMBTU;
    const per = (g) => (periodMj > 0 ? g / periodMj : 0);

    /* ---- Process energy ------------------------------------------------------ */
    const gridEf =
      LCFS_EF.grid[i.electricityRegion] ?? LCFS_EF.grid["U.S. Average"] ?? 474.148181146963;
    const ngLhv = (mmbtuHhv) => pos(mmbtuHhv) * NG_LHV_OVER_HHV;
    const bmLhv = (mmbtuHhv) => (pos(mmbtuHhv) * CH4_LHV_BTU_PER_SCF) / CH4_HHV_BTU_PER_SCF;

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

    const flaredMmbtuLhv = ((flaredCh4Mt * 1e6) / CH4_G_PER_SCF) * (CH4_LHV_BTU_PER_SCF / 1e6);
    const flaringG = flaredMmbtuLhv * MJ_PER_MMBTU * LCFS_EF.flaringPerMj;
    const fugitiveG = inletCh4Mt * upgradingFugitiveFraction * 1e6 * GWP_CH4;

    const pipelineEnergyG =
      LCFS_EF.pipelinePerMjMile * pos(i.pipelineMiles) * injectedMmbtuLhv * MJ_PER_MMBTU;
    const pipelineLossG = pipelineLoss * salesCh4Mt * 1e6 * GWP_CH4;
    const compressionG = LCFS_EF.cngCompressionPerMj * periodMj;
    const tailpipeG = LCFS_EF.tailpipePerMmbtu * dispensableMmbtu;

    const mj = "MJ RNG dispensed";
    const rows = [
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
        factor:
          periodMj > 0 ? (pipelineEnergyG + pipelineLossG) / Math.max(1, pos(i.pipelineMiles)) : 0,
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
        divisor: injectedMmbtuLhv * MJ_PER_MMBTU,
        divisorUnit: "MJ RNG injected (LHV)",
        sign: allocatedCh4 < 0 ? -1 : 1,
      },
      {
        key: "lcfs-diverted-co2",
        label: "Diverted CO2 credit",
        gPerMj: divertedCo2GPerMj,
        detail:
          "Carbon that would have been released as CO2 in the baseline and leaves as methane in the project",
        activity: Math.abs(divertedAllocated),
        activityUnit: "MT CO2",
        factor: 1e6,
        factorUnit: "g/tonne",
        divisor: injectedMmbtuLhv * MJ_PER_MMBTU,
        divisorUnit: "MJ RNG injected (LHV)",
        sign: divertedAllocated < 0 ? -1 : 1,
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
  const DAIRY_LCFS_ROW_CATEGORY = {
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

  return {
    CH4_LHV_BTU_PER_SCF,
    CH4_HHV_BTU_PER_SCF,
    CH4_G_PER_SCF,
    NG_LHV_OVER_HHV,
    MJ_PER_MMBTU,
    GWP_CH4,
    LCFS_EF,
    EGRID_REGIONS,
    DIGESTER_LEAKAGE,
    LCFS_DIGESTER_TYPES,
    MCF_BY_TEMPERATURE,
    STORAGE_SYSTEMS,
    mcfFor,
    vanTHoffFactor,
    DEFAULT_DAIRY_RNG_LCFS,
    computeDairyRngLcfs,
    DAIRY_LCFS_ROW_CATEGORY,
  };
})();
__modules["gbw-workspace/engine/dairy-adapter.mjs"] = (() => {
  const {
    DEFAULT_DAIRY_RNG_LCFS,
    computeDairyRngLcfs,
    LCFS_EF,
    LCFS_DIGESTER_TYPES,
    EGRID_REGIONS,
    STORAGE_SYSTEMS,
    DIGESTER_LEAKAGE,
  } = __modules["gbw-workspace/engine/source/rng-dairy-lcfs.mjs"];

  function dairyDefaults() {
    const inventory = structuredClone(DEFAULT_DAIRY_RNG_LCFS);
    // Correct the example's overlapping storage allocation. Never normalize user inputs.
    inventory.livestock.forEach((cat, index) => {
      cat.msAnaerobic =
        1 - inventory.otherStorage.reduce((total, row) => total + row.fractions[index], 0);
    });
    return {
      inventory,
      useMonthlyTemperature: true,
      gridFactor: LCFS_EF.grid[DEFAULT_DAIRY_RNG_LCFS.electricityRegion],
    };
  }
  function assessDairy(s, pathway) {
    const errors = [],
      warnings = [],
      d = s.dairy,
      i = d?.inventory;
    if (!i) return { errors: ["Restore the dairy farm inputs."] };
    for (const [key, example] of Object.entries(DEFAULT_DAIRY_RNG_LCFS))
      if (typeof example === "number" && (typeof i[key] !== "number" || !Number.isFinite(i[key])))
        errors.push(key + " must be a finite number.");
    const fractional = new Set([
      "rawBiogasCh4",
      "biogasToUpgradingCh4",
      "flaredBiomethaneCh4",
      "ventedBiogasCh4",
      "exportedElectricityShare",
      "vsRemovedBeforePond",
      "msAnaerobic",
    ]);
    for (const [k, v] of Object.entries(i)) {
      if (typeof v === "number") {
        if (!Number.isFinite(v)) errors.push(k + " must be finite.");
        else if (k !== "annualTemperatureC" && v < 0) errors.push(k + " cannot be negative.");
        if (fractional.has(k) && v > 1) errors.push(k + " must be between 0 and 1.");
      }
    }
    if (!Number.isInteger(i.reportingMonths) || i.reportingMonths < 1 || i.reportingMonths > 12)
      errors.push("Reporting months must be an integer from 1 to 12.");
    if (i.biomethaneInjectedMmbtuHhv <= 0)
      errors.push("Injected biomethane energy must be greater than zero.");
    if (!Number.isFinite(s.comparator) || s.comparator <= 0)
      errors.push("Comparison CI must be positive.");
    if (
      !LCFS_DIGESTER_TYPES.includes(i.digesterType) ||
      !EGRID_REGIONS.includes(i.electricityRegion)
    )
      errors.push("Select a supported digester and electricity region.");
    if (!Number.isFinite(d.gridFactor) || d.gridFactor < 0)
      errors.push("Grid factor must be finite and nonnegative.");
    if (!Array.isArray(i.livestock) || !i.livestock.length)
      errors.push("Enter livestock categories.");
    else
      for (const cat of i.livestock) {
        for (const k of ["population", "vsRate", "bo", "msAnaerobic"])
          if (!Number.isFinite(cat[k]) || cat[k] < 0 || (k === "msAnaerobic" && cat[k] > 1))
            errors.push(cat.label + ": check " + k);
      }
    if (
      !Array.isArray(i.monthlyTemperatureC) ||
      i.monthlyTemperatureC.length !== 12 ||
      i.monthlyTemperatureC.some((v) => !Number.isFinite(v))
    )
      errors.push("Enter all 12 monthly temperatures.");
    for (const k of ["otherStorage", "nonBcsStorage"]) {
      if (!Array.isArray(i[k])) {
        errors.push("Restore " + k);
        continue;
      }
      for (const a of i[k])
        if (
          !STORAGE_SYSTEMS.includes(a.system) ||
          !Array.isArray(a.fractions) ||
          a.fractions.length !== i.livestock?.length ||
          a.fractions.some((v) => !Number.isFinite(v) || v < 0 || v > 1)
        )
          errors.push("Check " + k + " systems and livestock fractions (0–1).");
    }
    if (errors.length) return { errors };
    i.livestock.forEach((cat, n) => {
      const total = cat.msAnaerobic + i.otherStorage.reduce((sum, a) => sum + a.fractions[n], 0);
      if (total > 1 + 1e-6)
        errors.push(cat.label + ": baseline manure allocation cannot exceed 100%.");
      else if (Math.abs(total - 1) > 1e-6)
        warnings.push(
          cat.label +
            ": baseline manure allocation totals " +
            (100 * total).toFixed(2) +
            "%; review it against 100%.",
        );
    });
    if (
      i.biogasToUpgradingScf * i.biogasToUpgradingCh4 >
      i.rawBiogasScf * i.rawBiogasCh4 * (1 + 1e-6)
    )
      errors.push(
        "Methane entering upgrading exceeds raw methane production; review gas meters and period boundaries.",
      );
    if (errors.length) return { errors };
    const core = computeDairyRngLcfs({
      ...i,
      monthlyTemperatureC: d.useMonthlyTemperature ? i.monthlyTemperatureC : undefined,
    });
    if (!Number.isFinite(core.annualMj) || core.annualMj <= 0)
      return {
        errors: [
          "The farm has no positive dispensable RNG energy. Check pipeline distance and gas output.",
        ],
      };
    const diff = d.gridFactor - LCFS_EF.grid[i.electricityRegion];
    const lineItems = core.rows.map((a) => {
      const shift =
        a.key === "lcfs-digester-energy"
          ? (i.digesterGridKwh * diff) / core.periodMj
          : a.key === "lcfs-upgrading-energy"
            ? (i.upgradingGridKwh * diff) / core.periodMj
            : 0;
      return {
        ...a,
        activity: a.activity + (shift ? (shift * core.periodMj) / 1e6 : 0),
        gPerMj: a.gPerMj + shift,
        detail: a.detail + (shift ? " · editable grid factor applied" : ""),
        category: "Dairy farm",
        scopeParts: ["lcfs-digester-energy", "lcfs-upgrading-energy"].includes(a.key)
          ? {
              1:
                a.gPerMj +
                shift -
                ((a.key === "lcfs-digester-energy" ? i.digesterGridKwh : i.upgradingGridKwh) *
                  d.gridFactor) /
                  core.periodMj,
              2:
                ((a.key === "lcfs-digester-energy" ? i.digesterGridKwh : i.upgradingGridKwh) *
                  d.gridFactor) /
                core.periodMj,
            }
          : undefined,
        activityUnit: a.activityUnit ?? "see farm inventory",
        factorUnit: a.factorUnit ?? "see farm inventory",
      };
    });
    const ciTotal = lineItems.reduce((sum, a) => sum + a.gPerMj, 0),
      grossCi = lineItems.filter((a) => a.gPerMj > 0).reduce((sum, a) => sum + a.gPerMj, 0),
      creditsCi = lineItems.filter((a) => a.gPerMj < 0).reduce((sum, a) => sum + a.gPerMj, 0),
      stages = lineItems.map((a) => ({ label: a.label, value: a.gPerMj }));
    if (
      lineItems.some((a) => !Number.isFinite(a.gPerMj)) ||
      !Number.isFinite(ciTotal * core.annualMj)
    )
      return { errors: ["Farm inputs exceed the supported numeric range."] };
    return {
      errors: [],
      warnings,
      pathway,
      lineItems,
      stages,
      ciTotal,
      grossCi,
      creditsCi,
      annualEnergyMj: core.annualMj,
      annualTonnesCo2e: (ciTotal * core.annualMj) / 1e6,
      savingPct: ((s.comparator - ciTotal) / s.comparator) * 100,
      reconciliation: ciTotal - stages.reduce((sum, a) => sum + a.value, 0),
      dairyResult: core,
    };
  }

  return {
    LCFS_DIGESTER_TYPES,
    EGRID_REGIONS,
    STORAGE_SYSTEMS,
    DIGESTER_LEAKAGE,
    LCFS_EF,
    dairyDefaults,
    assessDairy,
  };
})();
__modules["gbw-workspace/engine/source/rng-dairy.mjs"] = (() => {
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

  const DEFAULT_DAIRY_RNG = {
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
  const DAIRY_FACTORS = {
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
    lossAd: {
      ch4: 287.04651583260295,
      n2o: 47.66569642561588,
      co2: -43355.05428307236,
      ch4Leak: 215.89526053137095,
    },
    lossUpgrading: {
      ch4: 289.1406733772626,
      n2o: 0.18281867006590766,
      co2: 8365.036304644906,
      ch4Leak: 272.513792605723,
    },
  };

  const LB_PER_TONNE = 2204.62;
  const MJ_PER_MMBTU = 1055.056;
  const MMBTU_PER_KWH = 0.003412;

  function computeDairyRng(i, gridGPerKwh) {
    const f = DAIRY_FACTORS;
    const moisture = Math.min(0.98, Math.max(0, i.moisture));

    // --- manure, total solids and volatile solids -----------------------------
    const wetCow =
      Math.max(0, i.dairyCows) * i.manureDairyCowTpy + Math.max(0, i.dryCows) * i.manureDryCowTpy;
    const wetHeifer = Math.max(0, i.heifers) * i.manureHeiferTpy;
    const tsCow = wetCow * (1 - moisture);
    const tsHeifer = wetHeifer * (1 - moisture);
    const totalTs = tsCow + tsHeifer;
    const vsCow = tsCow * f.vsPerTsCow;
    const vsHeifer = tsHeifer * f.vsPerTsHeifer;
    const totalVs = vsCow + vsHeifer;
    const tsLb = totalTs * LB_PER_TONNE;

    // --- avoided baseline emissions of the reference management system --------
    const ch4M3 =
      vsCow * 1000 * f.ch4YieldCow * Math.max(0, i.mcfCow) +
      vsHeifer * 1000 * f.ch4YieldHeifer * Math.max(0, i.mcfHeifer);
    const ch4Tonnes = (ch4M3 * f.ch4DensityGPerM3) / 1_000_000;
    const n2oLb =
      tsLb * (f.n2oDirectLbPerLbTs + f.n2oVolatilisationLbPerLbTs + f.n2oLeachingLbPerLbTs);
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
      f.ngUpstream +
      f.ngCombustionCh4 * i.gwpCh4 +
      f.ngCombustionN2o * i.gwpN2o +
      f.ngCombustionCo2;
    const elecFactorPerMmbtu = gridGPerKwh / MMBTU_PER_KWH;

    const flaringG = i.flaringBtuPerLbTs > 0 ? f.flaringGco2ePerLbTs * tsLb : 0;
    const ngG = ngMmbtu * ngFactor;
    const elecG = (elecAdMmbtu + elecRngMmbtu) * elecFactorPerMmbtu;

    // --- feed loss ------------------------------------------------------------
    const lossOf = (p, mmbtu, share) =>
      (p.ch4 * i.gwpCh4 + p.n2o * i.gwpN2o + p.co2 + p.ch4Leak * i.gwpCh4) * mmbtu * share;
    const feedLossG =
      lossOf(f.lossAd, ngMmbtu, i.feedLossAd) +
      lossOf(f.lossUpgrading, ngMmbtu, i.feedLossUpgrading) +
      lossOf(f.lossAd, elecAdMmbtu, i.feedLossAd) +
      lossOf(f.lossUpgrading, elecRngMmbtu, i.feedLossUpgrading);

    // --- on-farm trucking, transmission and end use ---------------------------
    const truckG =
      (f.hdtCh4 * i.gwpCh4 + f.hdtN2o * i.gwpN2o + f.hdtCo2) * Math.max(0, i.truckMiles);
    const pipelineG = f.pipelineGco2ePerMmbtuMile * rngMmbtu * Math.max(0, i.pipelineMiles);
    const tdLeakG = f.tdLeakCh4GPerMmbtu * rngMmbtu * i.gwpCh4;
    const tailpipeG = (f.cngCh4 * i.gwpCh4 + f.cngN2o * i.gwpN2o + f.cngCo2) * rngMmbtu;

    const per = (g) => (annualMj > 0 ? g / annualMj : 0);

    const rows = [
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
  const DAIRY_ROW_CATEGORY = {
    "dairy-avoided": "Credits",
    "dairy-flaring": "Process other",
    "dairy-ng": "Process energy",
    "dairy-electricity": "Process energy",
    "dairy-feedloss": "Process other",
    "dairy-truck": "Feedstock and land",
    "dairy-pipeline": "Distribution and use",
    "dairy-tailpipe": "Distribution and use",
  };

  return { DEFAULT_DAIRY_RNG, DAIRY_FACTORS, computeDairyRng, DAIRY_ROW_CATEGORY };
})();
__modules["gbw-workspace/engine/source/cfr-workbook.mjs"] = (() => {
  const DEFAULT_CFR_ESTIMATE_FACTORS = {
    electricityGPerKwh: 120,
    naturalGasGPerMj: 68.5,
    truckGPerTonneKm: 62,
    methaneGwp: 28,
    avoidedMethod: "standard",
  };

  function scalar(value) {
    if (value && typeof value === "object") {
      const formulaValue = value;

      if (formulaValue.result !== undefined) return scalar(formulaValue.result);
      if (formulaValue.text !== undefined) return formulaValue.text;
    }
    return value;
  }

  function numberAt(sheet, address) {
    const value = scalar(sheet.getCell(address).value);
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) {
      throw new Error(
        `Expected a numeric cached value at ${address}. Open and save the workbook in Excel, then upload it again.`,
      );
    }
    return parsed;
  }

  function textAt(sheet, address) {
    const value = scalar(sheet.getCell(address).value);
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return value == null ? "" : String(value).trim();
  }

  function requireSheet(workbook, name) {
    const sheet = workbook.getWorksheet(name);
    if (!sheet)
      throw new Error(`This is not the expected ECCC CFR workbook: missing worksheet “${name}”.`);
    return sheet;
  }

  function extractCfrWorkbook(workbook) {
    const general = requireSheet(workbook, "General - LCIF Producer");
    const biogas = requireSheet(workbook, "Biogas");
    const rng = requireSheet(workbook, "Renewable natural gas, gaseous");
    const maple = requireSheet(workbook, "Livestock Manure (Mapleview)");
    const river = requireSheet(workbook, "Livestock Manure (Riverbreeze)");
    const mapleAvoided = requireSheet(workbook, "Avoided Emissions - (Mapleview)");
    const mapleCarryover = requireSheet(workbook, "Avoided Emissions(MV_Carryover)");
    const riverAvoided = requireSheet(workbook, "Avoided Emissions - Riverbreeze");
    const riverCarryover = requireSheet(workbook, "Avoided Emissions(RB Carryover)");
    const electricity = requireSheet(workbook, "Purchased electricity from grid");
    const naturalGas = requireSheet(workbook, "Natural gas, gaseous");
    const digesterLeakage = requireSheet(workbook, "Digester Leakage");
    const digestate = requireSheet(workbook, "Digestate Storage");
    const fugitives = requireSheet(workbook, "Leakage Emissions");
    const allocation = requireSheet(workbook, "Allocation");

    const fuelEnergyMjHhv = numberAt(rng, "C64");
    if (fuelEnergyMjHhv <= 0)
      throw new Error(
        "The workbook reports no RNG production in Renewable natural gas, gaseous!C64.",
      );

    const warnings = [];
    const location = textAt(general, "C7");
    if (
      location &&
      !/canada|canadian|alberta|british columbia|manitoba|new brunswick|newfoundland|nova scotia|ontario|prince edward|quebec|saskatchewan|yukon|nunavut|northwest/i.test(
        location,
      )
    ) {
      warnings.push(
        `The facility location is “${location}”; select background factors that match that geography.`,
      );
    }

    return {
      template: "ECCC CFR Data Workbook",
      facilityName: textAt(general, "C6"),
      facilityLocation: location,
      reportingStart: `${textAt(general, "D48")}-${textAt(general, "C48").padStart(2, "0")}`,
      reportingEnd: `${textAt(general, "D49")}-${textAt(general, "C49").padStart(2, "0")}`,
      fuelName: textAt(rng, "C63"),
      fuelEnergyMjHhv,
      rngMmbtu: numberAt(rng, "G53"),
      rawBiogasFt3: numberAt(biogas, "G52"),
      electricityKwh: numberAt(electricity, "C69"),
      naturalGasMj: numberAt(naturalGas, "C64"),
      digesterLeakageGCh4PerMj: numberAt(digesterLeakage, "C42"),
      digestateStorageGCh4PerMj: numberAt(digestate, "C97"),
      fugitiveLeakageGCh4PerMj: numberAt(fugitives, "C17"),
      digestateTruckTonneKm: numberAt(allocation, "D22"),
      farms: [
        {
          name: "Mapleview",
          dryFeedstockKg: numberAt(maple, "C104"),
          avoidedStandardGPerKg: numberAt(mapleAvoided, "C137"),
          avoidedCarryoverGPerKg: numberAt(mapleCarryover, "C137"),
        },
        {
          name: "Riverbreeze",
          dryFeedstockKg: numberAt(river, "C104"),
          avoidedStandardGPerKg: numberAt(riverAvoided, "C137"),
          avoidedCarryoverGPerKg: numberAt(riverCarryover, "C137"),
        },
      ],
      warnings,
    };
  }

  function calculateCfrWorkbookEstimate(inventory, factors) {
    const fuel = Math.max(inventory.fuelEnergyMjHhv, 1e-9);
    const avoided =
      inventory.farms.reduce((sum, farm) => {
        const factor =
          factors.avoidedMethod === "carryover"
            ? farm.avoidedCarryoverGPerKg
            : farm.avoidedStandardGPerKg;
        return sum + farm.dryFeedstockKg * factor;
      }, 0) / fuel;
    const directMethane =
      (inventory.digesterLeakageGCh4PerMj +
        inventory.digestateStorageGCh4PerMj +
        inventory.fugitiveLeakageGCh4PerMj) *
      factors.methaneGwp;

    const rows = [
      {
        key: "electricity",
        label: "Purchased electricity",
        gPerMjHhv: (inventory.electricityKwh * factors.electricityGPerKwh) / fuel,
        basis: `${inventory.electricityKwh.toLocaleString()} kWh × ${factors.electricityGPerKwh} gCO₂e/kWh`,
      },
      {
        key: "natural-gas",
        label: "Natural gas",
        gPerMjHhv: (inventory.naturalGasMj * factors.naturalGasGPerMj) / fuel,
        basis: `${inventory.naturalGasMj.toLocaleString()} MJ × ${factors.naturalGasGPerMj} gCO₂e/MJ`,
      },
      {
        key: "direct-methane",
        label: "Digester, digestate and fugitive methane",
        gPerMjHhv: directMethane,
        basis: `${(inventory.digesterLeakageGCh4PerMj + inventory.digestateStorageGCh4PerMj + inventory.fugitiveLeakageGCh4PerMj).toFixed(4)} g CH₄/MJ × GWP ${factors.methaneGwp}`,
      },
      {
        key: "avoided-manure",
        label: `Avoided manure methane (${factors.avoidedMethod})`,
        gPerMjHhv: avoided,
        basis: "Workbook avoided-emission factors × dry feedstock, divided by RNG HHV energy",
      },
      {
        key: "digestate-transport",
        label: "Digestate truck transport",
        gPerMjHhv: (inventory.digestateTruckTonneKm * factors.truckGPerTonneKm) / fuel,
        basis: `${inventory.digestateTruckTonneKm.toLocaleString()} tonne-km × ${factors.truckGPerTonneKm} gCO₂e/tonne-km`,
      },
    ];

    return {
      rows,
      totalGPerMjHhv: rows.reduce((sum, row) => sum + row.gPerMjHhv, 0),
    };
  }

  return { DEFAULT_CFR_ESTIMATE_FACTORS, extractCfrWorkbook, calculateCfrWorkbookEstimate };
})();
__modules["gbw-workspace/engine/source/rng-dairy-cfr.mjs"] = (() => {
  // Canada Clean Fuel Regulations (CFR) screening method for livestock-manure
  // renewable natural gas, following the structure of the ECCC CFR Data Workbook
  // for low-carbon-intensity fuel producers.
  //
  // The ECCC workbook prepares an inventory for the Government of Canada Fuel LCA
  // Model; it does not itself contain a certified CI. This module reproduces the
  // workbook's inventory arithmetic and applies transparent background factors,
  // producing a screening CI in gCO2e/MJ (HHV basis, as the CFR uses HHV).

  const { calculateCfrWorkbookEstimate, DEFAULT_CFR_ESTIMATE_FACTORS } =
    __modules["gbw-workspace/engine/source/cfr-workbook.mjs"];

  /** Defaults mirror a two-farm Canadian dairy digester inventory. */
  const DEFAULT_DAIRY_RNG_CFR = {
    ...DEFAULT_CFR_ESTIMATE_FACTORS,
    facilityName: "Dairy manure RNG facility",
    facilityLocation: "Ontario, Canada",
    reportingMonths: 12,
    fuelEnergyMjHhv: 120_000_000,
    rngMmbtu: 113_740,
    rawBiogasFt3: 210_000_000,
    electricityKwh: 1_450_000,
    naturalGasMj: 3_600_000,
    digesterLeakageGCh4PerMj: 0.02,
    digestateStorageGCh4PerMj: 0.05,
    fugitiveLeakageGCh4PerMj: 0.01,
    digestateTruckTonneKm: 480_000,
    farms: [
      {
        name: "Farm 1",
        dryFeedstockKg: 9_800_000,
        avoidedStandardGPerKg: -2.4,
        avoidedCarryoverGPerKg: -2.9,
      },
      {
        name: "Farm 2",
        dryFeedstockKg: 4_200_000,
        avoidedStandardGPerKg: -2.2,
        avoidedCarryoverGPerKg: -2.7,
      },
    ],
  };

  /** Which lifecycle bucket each CFR row belongs to. */
  const DAIRY_CFR_ROW_CATEGORY = {
    "cfr-electricity": "Process energy",
    "cfr-natural-gas": "Process energy",
    "cfr-direct-methane": "Process other",
    "cfr-avoided-manure": "Credits",
    "cfr-digestate-transport": "Distribution and use",
  };

  function computeDairyRngCfr(input) {
    const estimate = calculateCfrWorkbookEstimate(
      {
        template: "ECCC CFR Data Workbook",
        facilityName: input.facilityName,
        facilityLocation: input.facilityLocation,
        reportingStart: "",
        reportingEnd: "",
        fuelName: "Renewable natural gas",
        fuelEnergyMjHhv: input.fuelEnergyMjHhv,
        rngMmbtu: input.rngMmbtu,
        rawBiogasFt3: input.rawBiogasFt3,
        electricityKwh: input.electricityKwh,
        naturalGasMj: input.naturalGasMj,
        digesterLeakageGCh4PerMj: input.digesterLeakageGCh4PerMj,
        digestateStorageGCh4PerMj: input.digestateStorageGCh4PerMj,
        fugitiveLeakageGCh4PerMj: input.fugitiveLeakageGCh4PerMj,
        digestateTruckTonneKm: input.digestateTruckTonneKm,
        farms: input.farms,
        warnings: [],
      },
      {
        electricityGPerKwh: input.electricityGPerKwh,
        naturalGasGPerMj: input.naturalGasGPerMj,
        truckGPerTonneKm: input.truckGPerTonneKm,
        methaneGwp: input.methaneGwp,
        avoidedMethod: input.avoidedMethod,
      },
    );

    const periodMj = Math.max(input.fuelEnergyMjHhv, 0);
    const months = Math.max(input.reportingMonths, 1);
    const annualMj = (periodMj / months) * 12;

    const rows = estimate.rows.map((row) => ({
      key: `cfr-${row.key}`,
      label: row.label,
      gPerMj: row.gPerMjHhv,
      detail: row.basis,
    }));

    return {
      gPerMj: estimate.totalGPerMjHhv,
      rows,
      periodMj,
      annualMj,
      annualTonnesCo2e: (estimate.totalGPerMjHhv * annualMj) / 1_000_000,
      dryFeedstockKg: input.farms.reduce((sum, f) => sum + f.dryFeedstockKg, 0),
    };
  }

  return { DEFAULT_DAIRY_RNG_CFR, DAIRY_CFR_ROW_CATEGORY, computeDairyRngCfr };
})();
__modules["gbw-workspace/engine/source/ci-model.mjs"] = (() => {
  // Generic lifecycle carbon-intensity (CI) engine for liquid, gaseous and solid
  // biofuels, expressed in gCO2e per MJ of finished fuel (LHV), with comparison
  // against the major regulatory programs.
  //
  // Default line items are indicative pathway averages compiled from public
  // GREET / CA-GREET, CARB LCFS certified-pathway summaries, EU RED II/III Annex V
  // typical values and equivalent program documentation. They are starting points
  // for scenario work, not certified pathway scores.

  const { computeDairyRng, DAIRY_ROW_CATEGORY, DEFAULT_DAIRY_RNG } =
    __modules["gbw-workspace/engine/source/rng-dairy.mjs"];
  const { computeDairyRngLcfs, DAIRY_LCFS_ROW_CATEGORY, DEFAULT_DAIRY_RNG_LCFS } =
    __modules["gbw-workspace/engine/source/rng-dairy-lcfs.mjs"];
  const { computeDairyRngCfr, DAIRY_CFR_ROW_CATEGORY, DEFAULT_DAIRY_RNG_CFR } =
    __modules["gbw-workspace/engine/source/rng-dairy-cfr.mjs"];

  // ---------------------------------------------------------------------------
  // Energy / emission sources
  // ---------------------------------------------------------------------------

  const ELECTRICITY_REGIONS = [
    { id: "usAverage", label: "United States average", gPerKwh: 386 },
    { id: "california", label: "California grid", gPerKwh: 208 },
    { id: "oregon", label: "Oregon statewide", gPerKwh: 346 },
    { id: "pacificNorthwestLow", label: "Pacific NW hydro (low CI)", gPerKwh: 22 },
    { id: "midwestMiso", label: "US Midwest (MISO)", gPerKwh: 470 },
    { id: "canada", label: "Canada average", gPerKwh: 120 },
    { id: "euAverage", label: "European Union average", gPerKwh: 251 },
    { id: "unitedKingdom", label: "United Kingdom", gPerKwh: 207 },
    { id: "brazil", label: "Brazil", gPerKwh: 98 },
    { id: "india", label: "India", gPerKwh: 713 },
    { id: "china", label: "China", gPerKwh: 581 },
    { id: "singapore", label: "Singapore", gPerKwh: 408 },
    { id: "onsiteRenewable", label: "On-site renewable / PPA", gPerKwh: 12 },
  ];

  const SOURCES = [
    {
      id: "electricity",
      label: "Grid electricity",
      unit: "kWh",
      factor: 386,
      note: "Regional grid factor, selectable below",
    },
    {
      id: "renewableElectricity",
      label: "Renewable / PPA electricity",
      unit: "kWh",
      factor: 12,
      note: "Embodied emissions of wind, solar and hydro generation",
    },
    {
      id: "naturalGas",
      label: "Natural gas",
      unit: "MJ",
      factor: 68.5,
      note: "Combustion plus upstream production and pipeline methane",
    },
    {
      id: "propane",
      label: "Propane / LPG",
      unit: "MJ",
      factor: 76.2,
      note: "Combustion plus upstream, common for dryers and rural sites",
    },
    {
      id: "diesel",
      label: "Diesel (equipment and on-site)",
      unit: "MJ",
      factor: 95.1,
      note: "Harvesters, loaders, generators, yard trucks",
    },
    {
      id: "gasoline",
      label: "Gasoline",
      unit: "MJ",
      factor: 94.0,
      note: "Light equipment and fleet",
    },
    {
      id: "fuelOil",
      label: "Heavy fuel oil",
      unit: "MJ",
      factor: 100.5,
      note: "Boilers and marine haulage",
    },
    { id: "coal", label: "Coal", unit: "MJ", factor: 112.0, note: "Process heat or captive power" },
    {
      id: "biomassResidue",
      label: "Biomass residue (on-site)",
      unit: "MJ",
      factor: 3.2,
      note: "Biogenic CO2 excluded; handling, CH4 and N2O only",
    },
    {
      id: "steamNg",
      label: "Purchased steam (gas boiler)",
      unit: "MJ",
      factor: 81.0,
      note: "Steam bought over the fence",
    },
    {
      id: "hydrogenSmr",
      label: "Hydrogen (fossil SMR)",
      unit: "MJ",
      factor: 84.0,
      note: "Hydroprocessing hydrogen from steam methane reforming",
    },
    {
      id: "hydrogenGreen",
      label: "Hydrogen (renewable)",
      unit: "MJ",
      factor: 12.0,
      note: "Electrolytic hydrogen on renewable power",
    },
  ];

  const SOURCE_BY_ID = Object.fromEntries(SOURCES.map((s) => [s.id, s]));

  // ---------------------------------------------------------------------------
  // Regulatory programs
  // ---------------------------------------------------------------------------

  const PROGRAMS = [
    {
      id: "carbLcfs",
      label: "California LCFS",
      jurisdiction: "California, United States",
      benchmarks: { gasoline: 75.16, diesel: 80.17, jet: 80.17, marine: 80.17 },
      benchmarkBasis: "2026 annual CI benchmark (CARB 2025 amendments), not a fossil baseline",
      creditMarket: true,
      note: "2026 benchmarks after the July 2025 amendments. Credits equal (benchmark × EER − CI) × fuel energy; benchmarks tighten every year toward a 90% reduction by 2045. Opt-in jet and marine fuels are benchmarked against the diesel standard.",
    },
    {
      id: "oregonCfp",
      label: "Oregon Clean Fuels Program",
      jurisdiction: "Oregon, United States",
      benchmarks: { gasoline: 80.36, diesel: 78.38 },
      benchmarkBasis: "2025-and-beyond clean fuel standard (10% below the 2015 baseline)",
      creditMarket: true,
      note: "Codified 2025-and-beyond standards; 2015 baselines are 89.31 (gasoline) and 87.09 (diesel). A 2026 DEQ rulemaking may extend the schedule.",
    },
    {
      id: "washingtonCfs",
      label: "Washington Clean Fuel Standard",
      jurisdiction: "Washington, United States",
      benchmarks: { gasoline: 92.0, diesel: 93.1 },
      benchmarkBasis: "2026 annual clean fuel standard (7% below the 2017 baseline)",
      creditMarket: true,
      note: "2026 standards after SSHB 1409 (2025); 2017 baselines are 98.93 (gasoline) and 100.11 (diesel).",
    },
    {
      id: "canadaCfr",
      label: "Canada Clean Fuel Regulations",
      jurisdiction: "Canada",
      benchmarks: { gasoline: 87.0, diesel: 85.0 },
      benchmarkBasis: "2026 CI limit; baselines are 95 (gasoline) and 93 (diesel)",
      creditMarket: true,
      note: "Credits are created against the 2026 CI limit set out in SOR/2022-140; the liquid fossil baselines remain 95 and 93 gCO2e/MJ.",
    },
    {
      id: "euRed3",
      label: "EU RED III",
      jurisdiction: "European Union",
      benchmarks: { gasoline: 94.0, diesel: 94.0, jet: 94.0, marine: 94.0, heat: 80.0 },
      benchmarkBasis: "Fossil fuel comparator for transport (94) and heat (80)",
      threshold: 0.65,
      creditMarket: false,
      note: "Fossil comparator 94 gCO2e/MJ; 65% saving for installations started after 2021.",
    },
    {
      id: "ukRtfo",
      label: "UK RTFO",
      jurisdiction: "United Kingdom",
      benchmarks: { gasoline: 94.1, diesel: 94.1, jet: 94.1 },
      benchmarkBasis: "Fossil fuel comparator used for RTFO GHG saving",
      threshold: 0.65,
      creditMarket: true,
      note: "Renewable transport fuel certificates; 65% saving required for new plants.",
    },
    {
      id: "usRfs",
      label: "US Renewable Fuel Standard",
      jurisdiction: "United States",
      benchmarks: { gasoline: 93.08, diesel: 91.87, jet: 91.87 },
      benchmarkBasis: "2005 petroleum baseline (lifecycle, EPA)",
      threshold: 0.5,
      creditMarket: false,
      note: "2005 petroleum baselines. 20% saving for renewable fuel, 50% advanced and biomass-based diesel, 60% cellulosic.",
    },
    {
      id: "renovabio",
      label: "Brazil RenovaBio",
      jurisdiction: "Brazil",
      benchmarks: { gasoline: 87.4, diesel: 86.5, jet: 89.0 },
      benchmarkBasis: "Fossil reference CI used to issue CBIOs",
      creditMarket: true,
      note: "CBIO decarbonisation credits are issued on the gap to the fossil reference.",
    },
    {
      id: "corsia",
      label: "ICAO CORSIA",
      jurisdiction: "International aviation",
      benchmarks: { jet: 89.0 },
      benchmarkBasis: "Jet fuel baseline life cycle emissions value",
      threshold: 0.1,
      creditMarket: false,
      note: "Baseline 89 gCO2e/MJ for jet fuel; eligible fuels must save at least 10%.",
    },
    {
      id: "fuelEuMaritime",
      label: "FuelEU Maritime",
      jurisdiction: "European Union shipping",
      benchmarks: { marine: 91.16, diesel: 91.16 },
      benchmarkBasis: "2020 fleet reference intensity, before the period reduction",
      creditMarket: false,
      note: "2020 fleet reference intensity 91.16 gCO2e/MJ; a declining % reduction applies each period.",
    },
  ];

  const PROGRAM_BY_ID = Object.fromEntries(PROGRAMS.map((p) => [p.id, p]));

  // ---------------------------------------------------------------------------
  // Pathways
  // ---------------------------------------------------------------------------

  const d = (o) => ({
    feedstock: 0,
    landUseChange: 0,
    feedstockTransport: 0,
    processNonEnergy: 0,
    coProductCredit: 0,
    distribution: 0,
    endUse: 0,
    ...o,
  });

  const PATHWAYS = [
    {
      id: "ethanol-corn",
      label: "Ethanol — corn dry mill (natural gas)",
      group: "Ethanol",
      benchmarkFuel: "gasoline",
      eer: 1,
      energyPerUnit: 80.53,
      unitLabel: "gallon",
      summary: "US Midwest dry mill with DDGS co-product credit.",
      direct: d({
        feedstock: 26,
        landUseChange: 7.6,
        feedstockTransport: 2.2,
        processNonEnergy: 1.5,
        coProductCredit: -11,
        distribution: 2.5,
        endUse: 0.9,
      }),
      energy: { naturalGas: 0.34, electricity: 0.021 },
    },
    {
      id: "ethanol-corn-ccs",
      label: "Ethanol — corn dry mill with CCS",
      group: "Ethanol",
      benchmarkFuel: "gasoline",
      eer: 1,
      energyPerUnit: 80.53,
      unitLabel: "gallon",
      summary: "Fermentation CO2 captured and geologically stored.",
      direct: d({
        feedstock: 26,
        landUseChange: 7.6,
        feedstockTransport: 2.2,
        processNonEnergy: -26,
        coProductCredit: -11,
        distribution: 2.5,
        endUse: 0.9,
      }),
      energy: { naturalGas: 0.34, electricity: 0.03 },
    },
    {
      id: "ethanol-sugarcane",
      label: "Ethanol — Brazilian sugarcane",
      group: "Ethanol",
      benchmarkFuel: "gasoline",
      eer: 1,
      energyPerUnit: 80.53,
      unitLabel: "gallon",
      summary: "Bagasse-fired mill exporting surplus power.",
      direct: d({
        feedstock: 16,
        landUseChange: 8,
        feedstockTransport: 2,
        processNonEnergy: 1,
        coProductCredit: -4,
        distribution: 5,
        endUse: 0.9,
      }),
      energy: { biomassResidue: 0.9, electricity: 0.002 },
    },
    {
      id: "ethanol-cellulosic",
      label: "Ethanol — cellulosic (corn stover)",
      group: "Ethanol",
      benchmarkFuel: "gasoline",
      eer: 1,
      energyPerUnit: 80.53,
      unitLabel: "gallon",
      summary: "Agricultural residue with on-site lignin combustion.",
      direct: d({
        feedstock: 8,
        feedstockTransport: 3,
        processNonEnergy: 2,
        coProductCredit: -2,
        distribution: 2.5,
        endUse: 0.9,
      }),
      energy: { biomassResidue: 0.6, electricity: 0.01 },
    },
    {
      id: "biodiesel-soy",
      label: "Biodiesel (FAME) — soybean oil",
      group: "Biodiesel",
      benchmarkFuel: "diesel",
      eer: 1,
      energyPerUnit: 126.13,
      unitLabel: "gallon",
      summary: "Crush and transesterification with meal and glycerine credits.",
      direct: d({
        feedstock: 20,
        landUseChange: 8,
        feedstockTransport: 2,
        processNonEnergy: 8,
        coProductCredit: -6,
        distribution: 2,
        endUse: 1,
      }),
      energy: { naturalGas: 0.09, electricity: 0.006, propane: 0.005 },
    },
    {
      id: "biodiesel-uco",
      label: "Biodiesel (FAME) — used cooking oil",
      group: "Biodiesel",
      benchmarkFuel: "diesel",
      eer: 1,
      energyPerUnit: 126.13,
      unitLabel: "gallon",
      summary: "Waste feedstock, zero burden at collection point.",
      direct: d({
        feedstockTransport: 3,
        processNonEnergy: 7,
        coProductCredit: -3,
        distribution: 2,
        endUse: 1,
      }),
      energy: { naturalGas: 0.08, electricity: 0.005 },
    },
    {
      id: "biodiesel-tallow",
      label: "Biodiesel (FAME) — tallow",
      group: "Biodiesel",
      benchmarkFuel: "diesel",
      eer: 1,
      energyPerUnit: 126.13,
      unitLabel: "gallon",
      summary: "Rendered animal fat with rendering energy allocated in.",
      direct: d({
        feedstock: 6,
        feedstockTransport: 3,
        processNonEnergy: 7,
        coProductCredit: -3,
        distribution: 2,
        endUse: 1,
      }),
      energy: { naturalGas: 0.09, electricity: 0.006 },
    },
    {
      id: "rd-uco",
      label: "Renewable diesel (HEFA) — used cooking oil",
      group: "Renewable diesel",
      benchmarkFuel: "diesel",
      eer: 1,
      energyPerUnit: 129.65,
      unitLabel: "gallon",
      summary: "Hydrotreating with SMR hydrogen and naphtha co-products.",
      direct: d({
        feedstockTransport: 3.5,
        processNonEnergy: 1,
        coProductCredit: -2,
        distribution: 2,
        endUse: 1.2,
      }),
      energy: { naturalGas: 0.06, hydrogenSmr: 0.05, electricity: 0.006 },
    },
    {
      id: "rd-soy",
      label: "Renewable diesel (HEFA) — soybean oil",
      group: "Renewable diesel",
      benchmarkFuel: "diesel",
      eer: 1,
      energyPerUnit: 129.65,
      unitLabel: "gallon",
      summary: "Virgin vegetable oil including land use change.",
      direct: d({
        feedstock: 22,
        landUseChange: 9,
        feedstockTransport: 2.5,
        processNonEnergy: 1,
        coProductCredit: -4,
        distribution: 2,
        endUse: 1.2,
      }),
      energy: { naturalGas: 0.06, hydrogenSmr: 0.05, electricity: 0.006 },
    },
    {
      id: "rd-tallow",
      label: "Renewable diesel (HEFA) — tallow",
      group: "Renewable diesel",
      benchmarkFuel: "diesel",
      eer: 1,
      energyPerUnit: 129.65,
      unitLabel: "gallon",
      summary: "Animal fat feedstock with rendering burden.",
      direct: d({
        feedstock: 6,
        feedstockTransport: 3,
        processNonEnergy: 1,
        coProductCredit: -2,
        distribution: 2,
        endUse: 1.2,
      }),
      energy: { naturalGas: 0.06, hydrogenSmr: 0.05, electricity: 0.006 },
    },
    {
      id: "saf-hefa-uco",
      label: "SAF — HEFA from used cooking oil",
      group: "Sustainable aviation fuel",
      benchmarkFuel: "jet",
      eer: 1,
      energyPerUnit: 124.21,
      unitLabel: "gallon",
      summary: "Hydroprocessed esters and fatty acids, jet cut.",
      direct: d({
        feedstockTransport: 3.5,
        processNonEnergy: 1.5,
        coProductCredit: -2,
        distribution: 2,
        endUse: 0.6,
      }),
      energy: { naturalGas: 0.07, hydrogenSmr: 0.06, electricity: 0.007 },
    },
    {
      id: "saf-atj",
      label: "SAF — alcohol to jet from ethanol",
      group: "Sustainable aviation fuel",
      benchmarkFuel: "jet",
      eer: 1,
      energyPerUnit: 124.21,
      unitLabel: "gallon",
      summary: "Dehydration, oligomerisation and hydrogenation of bioethanol.",
      direct: d({
        feedstock: 20,
        landUseChange: 5,
        feedstockTransport: 3,
        processNonEnergy: 2,
        coProductCredit: -5,
        distribution: 2,
        endUse: 0.6,
      }),
      energy: { naturalGas: 0.12, hydrogenSmr: 0.04, electricity: 0.02 },
    },
    {
      id: "saf-ft",
      label: "SAF — Fischer-Tropsch from forest residue",
      group: "Sustainable aviation fuel",
      benchmarkFuel: "jet",
      eer: 1,
      energyPerUnit: 124.21,
      unitLabel: "gallon",
      summary: "Gasification and FT synthesis on waste woody biomass.",
      direct: d({
        feedstock: 2,
        feedstockTransport: 4,
        processNonEnergy: 2,
        coProductCredit: -3,
        distribution: 2,
        endUse: 0.6,
      }),
      energy: { biomassResidue: 0.8, electricity: 0.03 },
    },
    {
      id: "rng-landfill",
      label: "Renewable natural gas — landfill gas",
      group: "Renewable gas",
      benchmarkFuel: "diesel",
      eer: 1,
      energyPerUnit: 1.0,
      unitLabel: "MJ",
      summary: "Gas capture, upgrading, compression and pipeline injection.",
      direct: d({
        processNonEnergy: 12,
        distribution: 8,
        endUse: 1,
      }),
      energy: { electricity: 0.02, naturalGas: 0.02 },
    },
    {
      id: "rng-dairy",
      label: "Renewable natural gas — dairy manure digester",
      group: "Renewable gas",
      benchmarkFuel: "diesel",
      eer: 1,
      energyPerUnit: 1.0,
      unitLabel: "MJ",
      summary: "Avoided lagoon methane produces a deeply negative CI under LCFS-style accounting.",
      direct: d({
        processNonEnergy: 14,
        coProductCredit: -300,
        distribution: 10,
        endUse: 1,
      }),
      energy: { electricity: 0.03, naturalGas: 0.02 },
    },
    {
      id: "rng-wastewater",
      label: "Renewable natural gas — wastewater sludge",
      group: "Renewable gas",
      benchmarkFuel: "diesel",
      eer: 1,
      energyPerUnit: 1.0,
      unitLabel: "MJ",
      summary: "Municipal digester gas upgraded to pipeline quality.",
      direct: d({ processNonEnergy: 9, distribution: 7, endUse: 1 }),
      energy: { electricity: 0.025, naturalGas: 0.01 },
    },
    {
      id: "h2-electrolysis",
      label: "Renewable hydrogen — electrolysis",
      group: "Hydrogen",
      benchmarkFuel: "diesel",
      eer: 1.9,
      energyPerUnit: 120,
      unitLabel: "kg",
      summary:
        "Electricity is the dominant term; switch the source below to compare grid and PPA power.",
      direct: d({ processNonEnergy: 3, distribution: 8 }),
      energy: { renewableElectricity: 0.46 },
    },
    {
      id: "h2-biomass",
      label: "Renewable hydrogen — biomass gasification",
      group: "Hydrogen",
      benchmarkFuel: "diesel",
      eer: 1.9,
      energyPerUnit: 120,
      unitLabel: "kg",
      summary: "Woody biomass gasification with shift and PSA purification.",
      direct: d({ feedstock: 3, feedstockTransport: 4, processNonEnergy: 4, distribution: 8 }),
      energy: { biomassResidue: 0.7, electricity: 0.04 },
    },
    {
      id: "biomethanol",
      label: "Bio-methanol — biomass gasification",
      group: "Other liquids",
      benchmarkFuel: "marine",
      eer: 1,
      energyPerUnit: 15.9,
      unitLabel: "litre",
      summary: "Syngas to methanol, widely used as a marine fuel.",
      direct: d({
        feedstock: 3,
        feedstockTransport: 4,
        processNonEnergy: 4,
        coProductCredit: -2,
        distribution: 3,
        endUse: 1,
      }),
      energy: { biomassResidue: 0.75, electricity: 0.04 },
    },
    {
      id: "rlpg",
      label: "Renewable LPG — HEFA co-product",
      group: "Other liquids",
      benchmarkFuel: "diesel",
      eer: 1,
      energyPerUnit: 24.8,
      unitLabel: "litre",
      summary: "Propane fraction from renewable diesel and SAF plants.",
      direct: d({
        feedstock: 2,
        feedstockTransport: 3,
        processNonEnergy: 1,
        coProductCredit: -1,
        distribution: 3,
        endUse: 1,
      }),
      energy: { naturalGas: 0.06, hydrogenSmr: 0.04, electricity: 0.006 },
    },
    {
      id: "marine-b100",
      label: "Marine biofuel — B100 from waste oils",
      group: "Other liquids",
      benchmarkFuel: "marine",
      eer: 1,
      energyPerUnit: 126.13,
      unitLabel: "gallon",
      summary: "Waste-based FAME bunkered as a drop-in marine fuel.",
      direct: d({
        feedstockTransport: 4,
        processNonEnergy: 7,
        coProductCredit: -3,
        distribution: 3,
        endUse: 1,
      }),
      energy: { naturalGas: 0.08, electricity: 0.005 },
    },
    {
      id: "wood-pellets",
      label: "Wood pellets — industrial heat and power",
      group: "Solid biomass",
      benchmarkFuel: "heat",
      eer: 1,
      energyPerUnit: 17600,
      unitLabel: "tonne",
      summary: "Drying, pelletising and ocean freight to the end market.",
      direct: d({
        feedstock: 3,
        feedstockTransport: 4,
        processNonEnergy: 1,
        distribution: 6,
        endUse: 0.8,
      }),
      energy: { biomassResidue: 0.35, electricity: 0.02, naturalGas: 0.02 },
    },
    {
      id: "ethanol-wheat",
      label: "Ethanol — wheat grain (EU)",
      group: "Ethanol",
      benchmarkFuel: "gasoline",
      eer: 1,
      energyPerUnit: 80.53,
      unitLabel: "gallon",
      summary: "European wheat starch fermentation with DDGS credit.",
      direct: d({
        feedstock: 25,
        landUseChange: 8,
        feedstockTransport: 2.5,
        processNonEnergy: 1.5,
        coProductCredit: -10,
        distribution: 2.5,
        endUse: 0.9,
      }),
      energy: { naturalGas: 0.38, electricity: 0.025 },
    },
    {
      id: "ethanol-sorghum",
      label: "Ethanol — grain sorghum",
      group: "Ethanol",
      benchmarkFuel: "gasoline",
      eer: 1,
      energyPerUnit: 80.53,
      unitLabel: "gallon",
      summary: "Dry mill on sorghum, lower irrigation and fertiliser than corn in dryland systems.",
      direct: d({
        feedstock: 22,
        landUseChange: 6,
        feedstockTransport: 2.2,
        processNonEnergy: 1.5,
        coProductCredit: -10,
        distribution: 2.5,
        endUse: 0.9,
      }),
      energy: { naturalGas: 0.34, electricity: 0.021 },
    },
    {
      id: "ethanol-msw",
      label: "Ethanol — municipal solid waste (biogenic fraction)",
      group: "Ethanol",
      benchmarkFuel: "gasoline",
      eer: 1,
      energyPerUnit: 80.53,
      unitLabel: "gallon",
      summary: "Sorted waste fibre converted by hydrolysis and fermentation.",
      direct: d({
        feedstock: 1,
        feedstockTransport: 2,
        processNonEnergy: 3,
        coProductCredit: -2,
        distribution: 2.5,
        endUse: 0.9,
      }),
      energy: { biomassResidue: 0.55, electricity: 0.03 },
    },
    {
      id: "biodiesel-canola",
      label: "Biodiesel (FAME) — canola / rapeseed oil",
      group: "Biodiesel",
      benchmarkFuel: "diesel",
      eer: 1,
      energyPerUnit: 126.13,
      unitLabel: "gallon",
      summary: "Crush and transesterification of rapeseed oil with meal credit.",
      direct: d({
        feedstock: 25,
        landUseChange: 10,
        feedstockTransport: 2,
        processNonEnergy: 8,
        coProductCredit: -7,
        distribution: 2,
        endUse: 1,
      }),
      energy: { naturalGas: 0.09, electricity: 0.006 },
    },
    {
      id: "biodiesel-palm",
      label: "Biodiesel (FAME) — palm oil",
      group: "Biodiesel",
      benchmarkFuel: "diesel",
      eer: 1,
      energyPerUnit: 126.13,
      unitLabel: "gallon",
      summary: "Mill and refinery route; land use change dominates unless deforestation-free.",
      direct: d({
        feedstock: 18,
        landUseChange: 25,
        feedstockTransport: 4,
        processNonEnergy: 8,
        coProductCredit: -5,
        distribution: 3,
        endUse: 1,
      }),
      energy: { naturalGas: 0.08, electricity: 0.006 },
    },
    {
      id: "biodiesel-corn-oil",
      label: "Biodiesel (FAME) — distillers corn oil",
      group: "Biodiesel",
      benchmarkFuel: "diesel",
      eer: 1,
      energyPerUnit: 126.13,
      unitLabel: "gallon",
      summary: "Ethanol plant co-product oil with a low upstream burden.",
      direct: d({
        feedstock: 2,
        feedstockTransport: 2,
        processNonEnergy: 7,
        coProductCredit: -3,
        distribution: 2,
        endUse: 1,
      }),
      energy: { naturalGas: 0.08, electricity: 0.005 },
    },
    {
      id: "rd-canola",
      label: "Renewable diesel (HEFA) — canola oil",
      group: "Renewable diesel",
      benchmarkFuel: "diesel",
      eer: 1,
      energyPerUnit: 129.65,
      unitLabel: "gallon",
      summary: "Hydrotreated rapeseed oil, common in Canadian and European plants.",
      direct: d({
        feedstock: 25,
        landUseChange: 10,
        feedstockTransport: 2.5,
        processNonEnergy: 1,
        coProductCredit: -4,
        distribution: 2,
        endUse: 1.2,
      }),
      energy: { naturalGas: 0.06, hydrogenSmr: 0.05, electricity: 0.006 },
    },
    {
      id: "rd-corn-oil",
      label: "Renewable diesel (HEFA) — distillers corn oil",
      group: "Renewable diesel",
      benchmarkFuel: "diesel",
      eer: 1,
      energyPerUnit: 129.65,
      unitLabel: "gallon",
      summary: "Low-CI co-product oil hydrotreated to drop-in diesel.",
      direct: d({
        feedstock: 2,
        feedstockTransport: 2,
        processNonEnergy: 1,
        coProductCredit: -2,
        distribution: 2,
        endUse: 1.2,
      }),
      energy: { naturalGas: 0.06, hydrogenSmr: 0.05, electricity: 0.006 },
    },
    {
      id: "rd-palm",
      label: "Renewable diesel (HEFA) — palm and PFAD",
      group: "Renewable diesel",
      benchmarkFuel: "diesel",
      eer: 1,
      energyPerUnit: 129.65,
      unitLabel: "gallon",
      summary: "Asian HEFA capacity on palm oil and palm fatty acid distillate.",
      direct: d({
        feedstock: 16,
        landUseChange: 22,
        feedstockTransport: 5,
        processNonEnergy: 1,
        coProductCredit: -3,
        distribution: 3,
        endUse: 1.2,
      }),
      energy: { naturalGas: 0.06, hydrogenSmr: 0.05, electricity: 0.006 },
    },
    {
      id: "saf-hefa-tallow",
      label: "SAF — HEFA from tallow and animal fats",
      group: "Sustainable aviation fuel",
      benchmarkFuel: "jet",
      eer: 1,
      energyPerUnit: 124.21,
      unitLabel: "gallon",
      summary: "Rendered fat hydroprocessed to the jet cut.",
      direct: d({
        feedstock: 6,
        feedstockTransport: 3,
        processNonEnergy: 1.5,
        coProductCredit: -2,
        distribution: 2,
        endUse: 0.6,
      }),
      energy: { naturalGas: 0.07, hydrogenSmr: 0.06, electricity: 0.007 },
    },
    {
      id: "saf-ft-msw",
      label: "SAF — Fischer-Tropsch from municipal solid waste",
      group: "Sustainable aviation fuel",
      benchmarkFuel: "jet",
      eer: 1,
      energyPerUnit: 124.21,
      unitLabel: "gallon",
      summary: "Gasification of the biogenic waste fraction with FT synthesis.",
      direct: d({
        feedstock: 1,
        feedstockTransport: 2,
        processNonEnergy: 3,
        coProductCredit: -3,
        distribution: 2,
        endUse: 0.6,
      }),
      energy: { biomassResidue: 0.75, electricity: 0.035 },
    },
    {
      id: "saf-ptl",
      label: "SAF — power to liquid (e-kerosene)",
      group: "Sustainable aviation fuel",
      benchmarkFuel: "jet",
      eer: 1,
      energyPerUnit: 124.21,
      unitLabel: "gallon",
      summary: "Direct air or point-source CO2 with renewable hydrogen and FT synthesis.",
      direct: d({
        processNonEnergy: 6,
        distribution: 2,
        endUse: 0.6,
      }),
      energy: { renewableElectricity: 0.12, hydrogenGreen: 0.55 },
    },
    {
      id: "saf-corn-atj",
      label: "SAF — alcohol to jet from sugarcane ethanol",
      group: "Sustainable aviation fuel",
      benchmarkFuel: "jet",
      eer: 1,
      energyPerUnit: 124.21,
      unitLabel: "gallon",
      summary: "Brazilian cane ethanol upgraded to jet via dehydration and oligomerisation.",
      direct: d({
        feedstock: 16,
        landUseChange: 8,
        feedstockTransport: 2,
        processNonEnergy: 2,
        coProductCredit: -4,
        distribution: 3,
        endUse: 0.6,
      }),
      energy: { biomassResidue: 0.7, hydrogenSmr: 0.04, electricity: 0.02 },
    },
    {
      id: "rng-foodwaste",
      label: "Renewable natural gas — food waste digester",
      group: "Renewable gas",
      benchmarkFuel: "diesel",
      eer: 1,
      energyPerUnit: 1.0,
      unitLabel: "MJ",
      summary: "Source-separated organics diverted from landfill and digested.",
      direct: d({ processNonEnergy: 11, coProductCredit: -60, distribution: 8, endUse: 1 }),
      energy: { electricity: 0.03, naturalGas: 0.015 },
    },
    {
      id: "rng-agresidue",
      label: "Renewable natural gas — agricultural residue digestion",
      group: "Renewable gas",
      benchmarkFuel: "diesel",
      eer: 1,
      energyPerUnit: 1.0,
      unitLabel: "MJ",
      summary: "Straw and crop residue co-digestion with digestate returned to land.",
      direct: d({
        feedstock: 6,
        feedstockTransport: 3,
        processNonEnergy: 10,
        coProductCredit: -4,
        distribution: 8,
        endUse: 1,
      }),
      energy: { electricity: 0.03, naturalGas: 0.02 },
    },
    {
      id: "h2-rng-smr",
      label: "Renewable hydrogen — reforming of renewable natural gas",
      group: "Hydrogen",
      benchmarkFuel: "diesel",
      eer: 1.9,
      energyPerUnit: 120,
      unitLabel: "kg",
      summary: "Biomethane reformed to hydrogen, optionally with carbon capture.",
      direct: d({ feedstock: 8, processNonEnergy: 6, distribution: 8 }),
      energy: { naturalGas: 0.15, electricity: 0.03 },
    },
    {
      id: "e-methanol",
      label: "E-methanol — renewable hydrogen and captured CO2",
      group: "Other liquids",
      benchmarkFuel: "marine",
      eer: 1,
      energyPerUnit: 15.9,
      unitLabel: "litre",
      summary: "Synthesis from green hydrogen and biogenic or captured CO2 for shipping.",
      direct: d({ processNonEnergy: 5, distribution: 3, endUse: 1 }),
      energy: { renewableElectricity: 0.1, hydrogenGreen: 0.5 },
    },
    {
      id: "biobutanol",
      label: "Bio-butanol — fermentation from starch and sugar",
      group: "Other liquids",
      benchmarkFuel: "gasoline",
      eer: 1,
      energyPerUnit: 111.0,
      unitLabel: "gallon",
      summary: "ABE fermentation blended into gasoline pools.",
      direct: d({
        feedstock: 26,
        landUseChange: 7,
        feedstockTransport: 2.2,
        processNonEnergy: 3,
        coProductCredit: -9,
        distribution: 2.5,
        endUse: 0.9,
      }),
      energy: { naturalGas: 0.42, electricity: 0.03 },
    },
    {
      id: "pyrolysis-oil",
      label: "Pyrolysis bio-oil — industrial heat",
      group: "Other liquids",
      benchmarkFuel: "heat",
      eer: 1,
      energyPerUnit: 17.5,
      unitLabel: "litre",
      summary: "Fast pyrolysis of woody residue, burned in boilers and kilns.",
      direct: d({
        feedstock: 3,
        feedstockTransport: 4,
        processNonEnergy: 2,
        coProductCredit: -4,
        distribution: 3,
        endUse: 1,
      }),
      energy: { biomassResidue: 0.6, electricity: 0.03 },
    },
    {
      id: "torrefied-pellets",
      label: "Torrefied pellets — coal replacement",
      group: "Solid biomass",
      benchmarkFuel: "heat",
      eer: 1,
      energyPerUnit: 21000,
      unitLabel: "tonne",
      summary: "Torrefaction raises energy density and cuts shipping emissions per MJ.",
      direct: d({
        feedstock: 3,
        feedstockTransport: 4,
        processNonEnergy: 2,
        distribution: 5,
        endUse: 0.8,
      }),
      energy: { biomassResidue: 0.42, electricity: 0.025 },
    },
    {
      id: "ag-briquettes",
      label: "Agricultural residue briquettes — process heat",
      group: "Solid biomass",
      benchmarkFuel: "heat",
      eer: 1,
      energyPerUnit: 15500,
      unitLabel: "tonne",
      summary: "Straw and husk densified for industrial boilers in Asia and Africa.",
      direct: d({
        feedstock: 6,
        feedstockTransport: 3,
        processNonEnergy: 1,
        distribution: 3,
        endUse: 0.8,
      }),
      energy: { biomassResidue: 0.3, electricity: 0.03 },
    },
  ];

  const PATHWAY_BY_ID = Object.fromEntries(PATHWAYS.map((p) => [p.id, p]));

  const FALLBACK_PATHWAY = PATHWAY_BY_ID["ethanol-corn"];

  // ---------------------------------------------------------------------------
  // Scenario and results
  // ---------------------------------------------------------------------------

  /**
   * GHG Protocol scope for a line item. Scope 1 covers direct on-site
   * combustion, flaring and fugitive releases; Scope 2 purchased electricity
   * and steam; Scope 3 the rest of the value chain — feedstock, transport,
   * purchased chemicals and hydrogen, distribution, tailpipe (use of sold
   * products) and credits.
   */
  const SCOPE_OVERRIDES = {
    // Scope 1 — direct on-site combustion and fugitive releases
    naturalGas: 1,
    propane: 1,
    diesel: 1,
    gasoline: 1,
    fuelOil: 1,
    coal: 1,
    biomassResidue: 1,
    "lcfs-flaring": 1,
    "cfr-direct-methane": 1,
    "cfr-natural-gas": 1,
    "lcfs-fugitives": 1,
    "dairy-flaring": 1,
    "dairy-ng": 1,
    // Scope 2 — purchased electricity and steam
    electricity: 2,
    renewableElectricity: 2,
    steamNg: 2,
    "lcfs-digester-energy": 2,
    "lcfs-upgrading-energy": 2,
    "dairy-electricity": 2,
    "cfr-electricity": 2,
    // Scope 3 — purchased hydrogen and other value-chain terms
    hydrogenSmr: 3,
    hydrogenGreen: 3,
  };

  function scopeOf(item) {
    const override = SCOPE_OVERRIDES[item.key];
    if (override) return override;
    if (item.category === "Process energy") return 1;
    return 3;
  }

  function scenarioFromPathway(pathwayId, region) {
    const p = PATHWAY_BY_ID[pathwayId] ?? FALLBACK_PATHWAY;
    const variants = {};
    for (const s of SOURCES) {
      const first = SOURCE_VARIANTS[s.id]?.[0];
      if (first) variants[s.id] = first.id;
    }
    const feedstockId = PATHWAY_FEEDSTOCK[p.id] ?? "custom";
    return {
      pathwayId: p.id,
      region,
      feedstockId,
      sourceVariants: variants,
      direct: { ...p.direct },
      energy: { ...p.energy },
      detail: defaultDetailModules(feedstockId),
      annualVolume:
        p.unitLabel === "MJ"
          ? 2_000_000_000
          : p.unitLabel === "tonne"
            ? 500_000
            : p.unitLabel === "kg"
              ? 10_000_000
              : 50_000_000,
    };
  }

  /** Apply a feedstock choice to the feedstock, land use change and transport terms. */
  function applyFeedstock(inputs, feedstockId) {
    const f = FEEDSTOCK_BY_ID[feedstockId];
    if (!f || f.id === "custom") return { ...inputs, feedstockId };
    const base = inputs.detail ?? defaultDetailModules(feedstockId);
    return {
      ...inputs,
      feedstockId,
      direct: {
        ...inputs.direct,
        feedstock: f.feedstock,
        landUseChange: f.landUseChange,
        feedstockTransport: f.feedstockTransport,
      },
      detail: {
        ...base,
        feedstockProduction: {
          ...feedstockProductionFor(feedstockId),
          enabled: base.feedstockProduction.enabled,
        },
      },
    };
  }

  const DIRECT_FIELDS = [
    {
      key: "feedstock",
      label: "Feedstock production",
      category: "Feedstock and land",
      hint: "Cultivation, fertiliser N2O, collection, rendering",
    },
    {
      key: "landUseChange",
      label: "Land use change",
      category: "Feedstock and land",
      hint: "Direct and indirect land use change",
    },
    {
      key: "feedstockTransport",
      label: "Feedstock transport",
      category: "Feedstock and land",
      hint: "Truck, rail, barge and ocean legs to the plant",
    },
    {
      key: "processNonEnergy",
      label: "Chemicals and fugitives",
      category: "Process other",
      hint: "Methanol, catalysts, enzymes, process CH4 and N2O",
    },
    {
      key: "distribution",
      label: "Fuel distribution",
      category: "Distribution and use",
      hint: "Storage, blending, pipeline or truck delivery, dispensing",
    },
    {
      key: "endUse",
      label: "End use emissions",
      category: "Distribution and use",
      hint: "Tailpipe CH4 and N2O plus any fossil carbon in the fuel",
    },
    {
      key: "coProductCredit",
      label: "Co-product and avoided emissions",
      category: "Credits",
      hint: "Enter as a negative number",
    },
  ];

  function calculateScenario(input) {
    const pathway = PATHWAY_BY_ID[input.pathwayId] ?? FALLBACK_PATHWAY;
    const regionFactor = ELECTRICITY_REGIONS.find((r) => r.id === input.region)?.gPerKwh ?? 386;

    const lineItems = [];
    const detail = input.detail;
    const moduleTotals = {};

    const moduleRows = {};
    if (detail) {
      const fp = computeFeedstockProduction(detail.feedstockProduction, regionFactor);
      const tr = computeTransport(detail.transport);
      const ch = computeChemicals(detail.chemicals);
      const cp = computeCoProducts(detail.coProducts);
      const tp = computeTailpipe(detail.tailpipe);
      moduleTotals.feedstockProduction = fp.gPerMj;
      moduleTotals.transport = tr.gPerMj;
      moduleTotals.chemicals = ch.gPerMj;
      moduleTotals.coProducts = cp.gPerMj;
      moduleTotals.tailpipe = tp.gPerMj;
      moduleRows.feedstockProduction = fp.rows;
      moduleRows.transport = tr.rows;
      moduleRows.chemicals = ch.rows;
      moduleRows.coProducts = cp.rows;
      moduleRows.tailpipe = tp.rows;
    }

    const categoryOf = (key) => DIRECT_FIELDS.find((f) => f.key === key).category;

    // The dairy manure farm model is a complete well-to-wheel pathway of its own,
    // so when it is on it replaces every other term in the scenario.
    const dairyOn = !!detail?.dairyRng?.enabled;
    const useLcfs = dairyOn && detail?.dairyMethod === "lcfs";
    const useCfr = dairyOn && detail?.dairyMethod === "cfr";
    const dairy =
      dairyOn && !useLcfs && !useCfr ? computeDairyRng(detail.dairyRng, regionFactor) : null;
    const dairyLcfs = useLcfs ? computeDairyRngLcfs(detail.dairyLcfs) : null;
    const dairyCfr = useCfr ? computeDairyRngCfr(detail.dairyCfr ?? DEFAULT_DAIRY_RNG_CFR) : null;
    const dairyActive = dairy ?? dairyLcfs ?? dairyCfr;
    if (dairyActive) {
      const categories = dairyLcfs
        ? DAIRY_LCFS_ROW_CATEGORY
        : dairyCfr
          ? DAIRY_CFR_ROW_CATEGORY
          : DAIRY_ROW_CATEGORY;
      moduleTotals.dairyRng = dairyActive.gPerMj;
      for (const r of dairyActive.rows) {
        if (r.gPerMj === 0) continue;
        lineItems.push({
          ...r,
          category: categories[r.key] ?? "Process other",
        });
      }
    }

    for (const f of dairyActive ? [] : DIRECT_FIELDS) {
      const moduleKey = Object.keys(MODULE_TO_DIRECT).find((k) => MODULE_TO_DIRECT[k] === f.key);
      const mod = moduleKey && detail ? detail[moduleKey] : undefined;
      if (mod?.enabled && moduleKey && moduleKey !== "distribution") {
        for (const r of moduleRows[moduleKey] ?? []) {
          if (r.gPerMj === 0) continue;
          lineItems.push({
            ...r,
            key: r.key,
            label: r.label,
            category: f.category,
            gPerMj: r.gPerMj,
            detail: r.detail,
          });
        }
        continue;
      }
      if (moduleKey === "distribution" && detail?.distribution.enabled) continue;
      const v = Number(input.direct[f.key]) || 0;
      if (v === 0) continue;
      lineItems.push({
        key: f.key,
        label: f.label,
        category: f.category,
        gPerMj: v,
        detail: f.hint,
        activity: v,
        activityUnit: "gCO2e/MJ",
        factor: 1,
        factorUnit: "—",
      });
    }

    for (const s of dairyActive ? [] : SOURCES) {
      const qty = Number(input.energy[s.id]) || 0;
      if (qty === 0) continue;
      const variant = (SOURCE_VARIANTS[s.id] ?? []).find(
        (v) => v.id === input.sourceVariants?.[s.id],
      );
      const factor = s.id === "electricity" ? regionFactor : (variant?.factor ?? s.factor);
      lineItems.push({
        key: s.id,
        label: variant && s.id !== "electricity" ? `${s.label} — ${variant.label}` : s.label,
        category: "Process energy",
        gPerMj: qty * factor,
        detail: `${qty} ${s.unit}/MJ × ${factor.toFixed(1)} gCO2e/${s.unit}`,
        activity: qty,
        activityUnit: `${s.unit}/MJ fuel`,
        factor,
        factorUnit: `gCO2e/${s.unit}`,
      });
    }

    // Distribution runs last so loss terms can carry the upstream carbon intensity.
    if (detail && !dairyActive) {
      const upstream = lineItems.reduce((a, l) => a + l.gPerMj, 0);
      const ds = computeDistribution(detail.distribution, upstream);
      moduleTotals.distribution = ds.gPerMj;
      if (detail.distribution.enabled) {
        for (const r of ds.rows) {
          if (r.gPerMj === 0) continue;
          lineItems.push({
            ...r,
            key: r.key,
            label: r.label,
            category: categoryOf("distribution"),
            gPerMj: r.gPerMj,
            detail: r.detail,
          });
        }
      }
    }

    const allocation =
      !dairyActive && detail?.coProducts.enabled && detail.coProducts.allocationPct < 100
        ? Math.max(0, Math.min(100, detail.coProducts.allocationPct)) / 100
        : 1;
    if (allocation < 1) {
      for (const l of lineItems) {
        if (l.gPerMj > 0) {
          l.gPerMj *= allocation;
          l.allocation = allocation;
        }
      }
    }

    const ciTotal = lineItems.reduce((a, l) => a + l.gPerMj, 0);
    const grossCi = lineItems.filter((l) => l.gPerMj > 0).reduce((a, l) => a + l.gPerMj, 0);
    const creditsCi = lineItems.filter((l) => l.gPerMj < 0).reduce((a, l) => a + l.gPerMj, 0);
    const scopes = { scope1: 0, scope2: 0, scope3: 0 };
    for (const l of lineItems) {
      scopes[`scope${scopeOf(l)}`] += l.gPerMj;
    }

    // The farm model derives its own annual output from the herd size.
    const annualEnergyMj = dairyActive
      ? dairyActive.annualMj
      : Math.max(0, input.annualVolume) * pathway.energyPerUnit;

    const programs = PROGRAMS.map((program) => {
      const benchmark = program.benchmarks[pathway.benchmarkFuel] ?? null;
      if (benchmark == null) {
        return {
          program,
          benchmark: null,
          adjustedBenchmark: null,
          eer: pathway.eer,
          savingPct: null,
          meetsThreshold: null,
          gapPerMj: null,
          annualCreditsTonnes: null,
        };
      }
      // Credit programs award credits on the EER-adjusted benchmark; the reported
      // GHG saving is always measured against the unadjusted fossil comparator.
      const eer = program.creditMarket ? pathway.eer : 1;
      const adjusted = benchmark * eer;
      const gapPerMj = adjusted - ciTotal;
      const savingPct = ((benchmark - ciTotal) / benchmark) * 100;
      return {
        program,
        benchmark,
        adjustedBenchmark: adjusted,
        eer,
        savingPct,
        meetsThreshold: program.threshold == null ? null : savingPct / 100 >= program.threshold,
        gapPerMj,
        annualCreditsTonnes: (gapPerMj * annualEnergyMj) / 1_000_000,
      };
    });

    return {
      pathway,
      lineItems,
      ciTotal,
      grossCi,
      creditsCi,
      scopes,
      annualEnergyMj,
      annualTonnesCo2e: (ciTotal * annualEnergyMj) / 1_000_000,
      programs,
      moduleTotals,
      dairy,
      dairyLcfs,
      dairyCfr,
    };
  }

  // ---------------------------------------------------------------------------
  // Feedstock sources
  // ---------------------------------------------------------------------------

  const FEEDSTOCKS = [
    {
      id: "corn",
      label: "Corn grain",
      group: "Starch and sugar crops",
      feedstock: 26,
      landUseChange: 7.6,
      feedstockTransport: 2.2,
      note: "Cultivation, fertiliser N2O and grain haulage",
    },
    {
      id: "sugarcane",
      label: "Sugarcane",
      group: "Starch and sugar crops",
      feedstock: 16,
      landUseChange: 8,
      feedstockTransport: 2,
      note: "Cane growing, burning-free harvest and short haul",
    },
    {
      id: "sugarbeet",
      label: "Sugar beet",
      group: "Starch and sugar crops",
      feedstock: 18,
      landUseChange: 5,
      feedstockTransport: 2,
      note: "European beet cultivation",
    },
    {
      id: "wheat",
      label: "Wheat and other grains",
      group: "Starch and sugar crops",
      feedstock: 25,
      landUseChange: 8,
      feedstockTransport: 2.5,
      note: "Grain cultivation with fertiliser N2O",
    },
    {
      id: "cassava",
      label: "Cassava",
      group: "Starch and sugar crops",
      feedstock: 20,
      landUseChange: 10,
      feedstockTransport: 3,
      note: "Tropical root crop",
    },
    {
      id: "soy",
      label: "Soybean oil",
      group: "Vegetable oils",
      feedstock: 20,
      landUseChange: 8,
      feedstockTransport: 2,
      note: "Farming plus crush, meal credit taken separately",
    },
    {
      id: "canola",
      label: "Canola / rapeseed oil",
      group: "Vegetable oils",
      feedstock: 25,
      landUseChange: 10,
      feedstockTransport: 2,
      note: "Higher fertiliser demand than soy",
    },
    {
      id: "palm",
      label: "Palm oil",
      group: "Vegetable oils",
      feedstock: 18,
      landUseChange: 25,
      feedstockTransport: 4,
      note: "Land use change dominates unless deforestation-free",
    },
    {
      id: "corn-oil",
      label: "Distillers corn oil",
      group: "Wastes and residues",
      feedstock: 2,
      landUseChange: 0,
      feedstockTransport: 2,
      note: "Ethanol plant co-product, low burden",
    },
    {
      id: "uco",
      label: "Used cooking oil",
      group: "Wastes and residues",
      feedstock: 0,
      landUseChange: 0,
      feedstockTransport: 3,
      note: "Zero burden at the collection point",
    },
    {
      id: "tallow",
      label: "Tallow and animal fats",
      group: "Wastes and residues",
      feedstock: 6,
      landUseChange: 0,
      feedstockTransport: 3,
      note: "Rendering energy allocated to the fat",
    },
    {
      id: "stover",
      label: "Corn stover",
      group: "Agricultural residues",
      feedstock: 8,
      landUseChange: 0,
      feedstockTransport: 3,
      note: "Collection, nutrient replacement and baling",
    },
    {
      id: "straw",
      label: "Wheat straw",
      group: "Agricultural residues",
      feedstock: 7,
      landUseChange: 0,
      feedstockTransport: 3,
      note: "Baling and field collection",
    },
    {
      id: "bagasse",
      label: "Sugarcane bagasse",
      group: "Agricultural residues",
      feedstock: 2,
      landUseChange: 0,
      feedstockTransport: 1,
      note: "Available at the mill gate",
    },
    {
      id: "miscanthus",
      label: "Energy grasses (miscanthus, switchgrass)",
      group: "Energy crops",
      feedstock: 10,
      landUseChange: -2,
      feedstockTransport: 3,
      note: "Soil carbon gain can offset land use change",
    },
    {
      id: "forest-residue",
      label: "Forest residue and slash",
      group: "Woody biomass",
      feedstock: 3,
      landUseChange: 0,
      feedstockTransport: 4,
      note: "Harvest residue collection and chipping",
    },
    {
      id: "mill-residue",
      label: "Sawmill and wood processing residue",
      group: "Woody biomass",
      feedstock: 2,
      landUseChange: 0,
      feedstockTransport: 3,
      note: "Sawdust, shavings and bark",
    },
    {
      id: "urban-wood",
      label: "Urban and construction wood waste",
      group: "Woody biomass",
      feedstock: 2,
      landUseChange: 0,
      feedstockTransport: 3,
      note: "Diverted from landfill",
    },
    {
      id: "msw",
      label: "Municipal solid waste (biogenic fraction)",
      group: "Wastes and residues",
      feedstock: 1,
      landUseChange: 0,
      feedstockTransport: 2,
      note: "Sorting and preparation",
    },
    {
      id: "landfill-gas",
      label: "Landfill gas",
      group: "Gaseous feedstocks",
      feedstock: 0,
      landUseChange: 0,
      feedstockTransport: 0,
      note: "Captured at the site of generation",
    },
    {
      id: "manure",
      label: "Dairy and swine manure",
      group: "Gaseous feedstocks",
      feedstock: 0,
      landUseChange: 0,
      feedstockTransport: 1,
      note: "Avoided lagoon methane handled as a credit",
    },
    {
      id: "sludge",
      label: "Wastewater sludge",
      group: "Gaseous feedstocks",
      feedstock: 0,
      landUseChange: 0,
      feedstockTransport: 0.5,
      note: "Municipal digester gas",
    },
    {
      id: "water-power",
      label: "Water and renewable power (electrolysis)",
      group: "Gaseous feedstocks",
      feedstock: 0,
      landUseChange: 0,
      feedstockTransport: 0,
      note: "Electricity is the dominant input",
    },
    {
      id: "custom",
      label: "Custom / site-specific",
      group: "Other",
      feedstock: 0,
      landUseChange: 0,
      feedstockTransport: 0,
      note: "Keeps whatever values you typed in",
    },
  ];

  const FEEDSTOCK_BY_ID = Object.fromEntries(FEEDSTOCKS.map((f) => [f.id, f]));

  const PATHWAY_FEEDSTOCK = {
    "ethanol-corn": "corn",
    "ethanol-corn-ccs": "corn",
    "ethanol-sugarcane": "sugarcane",
    "ethanol-cellulosic": "stover",
    "biodiesel-soy": "soy",
    "biodiesel-uco": "uco",
    "biodiesel-tallow": "tallow",
    "rd-uco": "uco",
    "rd-soy": "soy",
    "rd-tallow": "tallow",
    "saf-hefa-uco": "uco",
    "saf-atj": "corn",
    "saf-ft": "forest-residue",
    "rng-landfill": "landfill-gas",
    "rng-dairy": "manure",
    "rng-wastewater": "sludge",
    "h2-electrolysis": "water-power",
    "h2-biomass": "forest-residue",
    biomethanol: "forest-residue",
    rlpg: "uco",
    "marine-b100": "uco",
    "wood-pellets": "mill-residue",
    "ethanol-wheat": "wheat",
    "ethanol-sorghum": "wheat",
    "ethanol-msw": "msw",
    "biodiesel-canola": "canola",
    "biodiesel-palm": "palm",
    "biodiesel-corn-oil": "corn-oil",
    "rd-canola": "canola",
    "rd-corn-oil": "corn-oil",
    "rd-palm": "palm",
    "saf-hefa-tallow": "tallow",
    "saf-ft-msw": "msw",
    "saf-ptl": "water-power",
    "saf-corn-atj": "sugarcane",
    "rng-foodwaste": "msw",
    "rng-agresidue": "straw",
    "h2-rng-smr": "landfill-gas",
    "e-methanol": "water-power",
    biobutanol: "corn",
    "pyrolysis-oil": "forest-residue",
    "torrefied-pellets": "mill-residue",
    "ag-briquettes": "straw",
  };

  // ---------------------------------------------------------------------------
  // Supply variants for each process energy source
  // ---------------------------------------------------------------------------

  const SOURCE_VARIANTS = {
    electricity: [{ id: "grid", label: "Regional grid (selected below)", factor: 386 }],
    renewableElectricity: [
      { id: "ppa-wind", label: "Wind PPA", factor: 11 },
      { id: "ppa-solar", label: "Solar PPA", factor: 40 },
      { id: "hydro", label: "Hydro", factor: 24 },
      { id: "onsite", label: "On-site behind the meter", factor: 12 },
    ],
    naturalGas: [
      { id: "pipeline", label: "Pipeline natural gas", factor: 68.5 },
      { id: "lng", label: "Imported LNG", factor: 82.0 },
      { id: "shale", label: "Shale gas (high methane loss)", factor: 76.0 },
      { id: "rng", label: "Renewable natural gas", factor: 20.0 },
      { id: "biogas-onsite", label: "On-site biogas", factor: 8.0 },
    ],
    propane: [
      { id: "fossil", label: "Fossil propane / LPG", factor: 76.2 },
      { id: "renewable", label: "Renewable propane", factor: 22.0 },
    ],
    diesel: [
      { id: "fossil", label: "Fossil diesel", factor: 95.1 },
      { id: "b20", label: "B20 blend", factor: 82.0 },
      { id: "renewable", label: "Renewable diesel", factor: 30.0 },
    ],
    gasoline: [
      { id: "fossil", label: "Fossil gasoline", factor: 94.0 },
      { id: "e10", label: "E10 blend", factor: 90.0 },
      { id: "e85", label: "E85 blend", factor: 64.0 },
    ],
    fuelOil: [
      { id: "hfo", label: "Heavy fuel oil", factor: 100.5 },
      { id: "mgo", label: "Marine gas oil", factor: 94.5 },
    ],
    coal: [
      { id: "bituminous", label: "Bituminous coal", factor: 112.0 },
      { id: "lignite", label: "Lignite", factor: 122.0 },
      { id: "petcoke", label: "Petroleum coke", factor: 118.0 },
    ],
    biomassResidue: [
      { id: "onsite", label: "On-site residue combustion", factor: 3.2 },
      { id: "purchased-chips", label: "Purchased wood chips", factor: 8.0 },
      { id: "pellets", label: "Purchased pellets", factor: 14.0 },
    ],
    steamNg: [
      { id: "gas-boiler", label: "Gas boiler steam", factor: 81.0 },
      { id: "chp", label: "Cogeneration steam", factor: 62.0 },
      { id: "biomass-boiler", label: "Biomass boiler steam", factor: 9.0 },
    ],
    hydrogenSmr: [
      { id: "smr", label: "Steam methane reforming", factor: 84.0 },
      { id: "smr-ccs", label: "SMR with carbon capture", factor: 36.0 },
      { id: "byproduct", label: "By-product refinery hydrogen", factor: 70.0 },
    ],
    hydrogenGreen: [
      { id: "electrolysis-ppa", label: "Electrolysis on renewable power", factor: 12.0 },
      { id: "electrolysis-grid", label: "Electrolysis on grid power", factor: 130.0 },
      { id: "biomass", label: "Biomass gasification hydrogen", factor: 22.0 },
    ],
  };

  // ---------------------------------------------------------------------------
  // Unit handling
  // ---------------------------------------------------------------------------

  const UNIT_OPTIONS = {
    kWh: [
      { id: "kwh", label: "kWh per MJ", toBase: 1 },
      { id: "wh", label: "Wh per MJ", toBase: 0.001 },
      { id: "mj", label: "MJ per MJ", toBase: 1 / 3.6 },
      { id: "kwh-gj", label: "kWh per GJ", toBase: 0.001 },
      { id: "kwh-mmbtu", label: "kWh per MMBtu", toBase: 1 / 1055.06 },
    ],
    MJ: [
      { id: "mj", label: "MJ per MJ", toBase: 1 },
      { id: "kwh", label: "kWh per MJ", toBase: 3.6 },
      { id: "mmbtu", label: "MMBtu per MMBtu", toBase: 1 },
      { id: "btu", label: "Btu per MJ", toBase: 0.00105506 },
      { id: "therm", label: "therm per MMBtu", toBase: 0.1 },
      { id: "scf", label: "scf gas per MJ", toBase: 1.055 },
    ],
  };

  const CI_UNITS = [
    { id: "g-mj", label: "gCO2e / MJ", factor: 1, decimals: 2 },
    { id: "kg-gj", label: "kgCO2e / GJ", factor: 1, decimals: 2 },
    { id: "g-mmbtu", label: "gCO2e / MMBtu", factor: 1055.06, decimals: 0 },
    { id: "kg-mmbtu", label: "kgCO2e / MMBtu", factor: 1.05506, decimals: 2 },
    { id: "g-kwh", label: "gCO2e / kWh", factor: 3.6, decimals: 2 },
  ];

  const CI_UNIT_BY_ID = Object.fromEntries(CI_UNITS.map((u) => [u.id, u]));

  const MASS_UNITS = [
    { id: "t", label: "tonnes CO2e", factor: 1 },
    { id: "kt", label: "kilotonnes CO2e", factor: 0.001 },
    { id: "mt", label: "million tonnes CO2e", factor: 0.000001 },
    { id: "shortton", label: "short tons CO2e", factor: 1.10231 },
  ];

  // ---------------------------------------------------------------------------
  // Detailed lifecycle modules
  // ---------------------------------------------------------------------------
  // Each module lets the user build one of the aggregate DirectTerms values from
  // physical activity data. When a module is enabled its computed total replaces
  // the corresponding aggregate term and every sub-item appears as its own line.

  /**
   * Operands behind a line item, so an export can write
   * `= activity x factor / divisor` as a live spreadsheet formula instead of a
   * hard coded result.
   */

  /** Emission factors used by the detailed modules. */
  const DETAIL_FACTORS = {
    dieselPerLitre: 3720, // gCO2e per litre, combustion plus upstream
    gasolinePerLitre: 3300,
    nitrogenPerKg: 4000, // gCO2e per kg N, manufacture
    n2oGwp: 273,
    ch4Gwp: 29.8,
    phosphatePerKg: 1010, // per kg P2O5
    potashPerKg: 690, // per kg K2O
    limePerKg: 440,
    pesticidePerKg: 20000,
    seedPerKg: 600,
    naturalGasPerMj: 68.5,
    combustionCo2PerMj: 73.0, // fossil-equivalent combustion CO2 of a liquid fuel
  };

  // --- Feedstock production ---------------------------------------------------

  const DEFAULT_FEEDSTOCK_PRODUCTION = {
    enabled: false,
    yieldMjPerTonne: 10000,
    cultivationDieselL: 18,
    cultivationElectricityKwh: 4,
    nitrogenKg: 14,
    n2oEmissionFactor: 0.01,
    phosphateKg: 5,
    potashKg: 5,
    limeKg: 10,
    pesticideKg: 0.3,
    seedKg: 2,
    irrigationElectricityKwh: 0,
    collectionDieselL: 0,
    renderingGasMj: 0,
    renderingElectricityKwh: 0,
    dryingGasMj: 0,
    soilCarbonKgPerTonne: 0,
  };

  /**
   * Feedstock-specific cultivation / collection defaults. Keyed by feedstock id
   * so that picking a pathway loads the agronomy or collection profile that
   * actually belongs to that feedstock instead of a generic row crop.
   */
  const FEEDSTOCK_PRODUCTION_PRESETS = {
    corn: {
      yieldMjPerTonne: 8500,
      cultivationDieselL: 18,
      cultivationElectricityKwh: 4,
      nitrogenKg: 14,
      phosphateKg: 5,
      potashKg: 5,
      limeKg: 10,
      pesticideKg: 0.3,
      seedKg: 2,
      irrigationElectricityKwh: 6,
      dryingGasMj: 300,
    },
    sugarcane: {
      yieldMjPerTonne: 1900,
      cultivationDieselL: 4,
      cultivationElectricityKwh: 1,
      nitrogenKg: 1.2,
      phosphateKg: 0.6,
      potashKg: 1.5,
      limeKg: 2,
      pesticideKg: 0.05,
      seedKg: 0,
      irrigationElectricityKwh: 2,
      dryingGasMj: 0,
    },
    sugarbeet: {
      yieldMjPerTonne: 1900,
      cultivationDieselL: 5,
      cultivationElectricityKwh: 1,
      nitrogenKg: 1.5,
      phosphateKg: 0.6,
      potashKg: 1.5,
      limeKg: 3,
      pesticideKg: 0.06,
      seedKg: 0.1,
      irrigationElectricityKwh: 1,
      dryingGasMj: 0,
    },
    wheat: {
      yieldMjPerTonne: 8000,
      cultivationDieselL: 16,
      cultivationElectricityKwh: 3,
      nitrogenKg: 18,
      phosphateKg: 6,
      potashKg: 5,
      limeKg: 8,
      pesticideKg: 0.4,
      seedKg: 3,
      irrigationElectricityKwh: 2,
      dryingGasMj: 250,
    },
    cassava: {
      yieldMjPerTonne: 3500,
      cultivationDieselL: 6,
      cultivationElectricityKwh: 1,
      nitrogenKg: 4,
      phosphateKg: 2,
      potashKg: 4,
      limeKg: 2,
      pesticideKg: 0.1,
      seedKg: 0,
      irrigationElectricityKwh: 0,
      dryingGasMj: 150,
    },
    soy: {
      yieldMjPerTonne: 7000,
      cultivationDieselL: 12,
      cultivationElectricityKwh: 3,
      nitrogenKg: 2,
      phosphateKg: 6,
      potashKg: 12,
      limeKg: 12,
      pesticideKg: 0.6,
      seedKg: 3,
      irrigationElectricityKwh: 2,
      dryingGasMj: 100,
    },
    canola: {
      yieldMjPerTonne: 15000,
      cultivationDieselL: 14,
      cultivationElectricityKwh: 3,
      nitrogenKg: 40,
      phosphateKg: 12,
      potashKg: 8,
      limeKg: 6,
      pesticideKg: 0.5,
      seedKg: 2,
      irrigationElectricityKwh: 1,
      dryingGasMj: 120,
    },
    palm: {
      yieldMjPerTonne: 7400,
      cultivationDieselL: 5,
      cultivationElectricityKwh: 2,
      nitrogenKg: 8,
      phosphateKg: 3,
      potashKg: 15,
      limeKg: 2,
      pesticideKg: 0.3,
      seedKg: 0,
      irrigationElectricityKwh: 0,
      dryingGasMj: 0,
    },
    "corn-oil": {
      yieldMjPerTonne: 37000,
      cultivationDieselL: 0,
      cultivationElectricityKwh: 0,
      nitrogenKg: 0,
      phosphateKg: 0,
      potashKg: 0,
      limeKg: 0,
      pesticideKg: 0,
      seedKg: 0,
      irrigationElectricityKwh: 0,
      collectionDieselL: 1,
      dryingGasMj: 0,
    },
    uco: {
      yieldMjPerTonne: 37000,
      cultivationDieselL: 0,
      cultivationElectricityKwh: 0,
      nitrogenKg: 0,
      phosphateKg: 0,
      potashKg: 0,
      limeKg: 0,
      pesticideKg: 0,
      seedKg: 0,
      irrigationElectricityKwh: 0,
      collectionDieselL: 3,
      dryingGasMj: 0,
    },
    tallow: {
      yieldMjPerTonne: 37000,
      cultivationDieselL: 0,
      cultivationElectricityKwh: 0,
      nitrogenKg: 0,
      phosphateKg: 0,
      potashKg: 0,
      limeKg: 0,
      pesticideKg: 0,
      seedKg: 0,
      irrigationElectricityKwh: 0,
      collectionDieselL: 2,
      renderingGasMj: 900,
      renderingElectricityKwh: 40,
    },
    stover: {
      yieldMjPerTonne: 6400,
      cultivationDieselL: 0,
      cultivationElectricityKwh: 0,
      nitrogenKg: 8,
      phosphateKg: 2,
      potashKg: 12,
      limeKg: 0,
      pesticideKg: 0,
      seedKg: 0,
      irrigationElectricityKwh: 0,
      collectionDieselL: 8,
      dryingGasMj: 0,
    },
    straw: {
      yieldMjPerTonne: 6200,
      cultivationDieselL: 0,
      cultivationElectricityKwh: 0,
      nitrogenKg: 6,
      phosphateKg: 1.5,
      potashKg: 10,
      limeKg: 0,
      pesticideKg: 0,
      seedKg: 0,
      irrigationElectricityKwh: 0,
      collectionDieselL: 7,
      dryingGasMj: 0,
    },
    bagasse: {
      yieldMjPerTonne: 6000,
      cultivationDieselL: 0,
      cultivationElectricityKwh: 0,
      nitrogenKg: 0,
      phosphateKg: 0,
      potashKg: 0,
      limeKg: 0,
      pesticideKg: 0,
      seedKg: 0,
      irrigationElectricityKwh: 0,
      collectionDieselL: 1,
      dryingGasMj: 0,
    },
    miscanthus: {
      yieldMjPerTonne: 6500,
      cultivationDieselL: 5,
      cultivationElectricityKwh: 1,
      nitrogenKg: 6,
      phosphateKg: 2,
      potashKg: 4,
      limeKg: 0,
      pesticideKg: 0.05,
      seedKg: 0.5,
      irrigationElectricityKwh: 0,
      collectionDieselL: 4,
      soilCarbonKgPerTonne: -60,
    },
    "forest-residue": {
      yieldMjPerTonne: 6500,
      cultivationDieselL: 0,
      cultivationElectricityKwh: 0,
      nitrogenKg: 0,
      phosphateKg: 0,
      potashKg: 0,
      limeKg: 0,
      pesticideKg: 0,
      seedKg: 0,
      irrigationElectricityKwh: 0,
      collectionDieselL: 12,
      dryingGasMj: 200,
    },
    "mill-residue": {
      yieldMjPerTonne: 7000,
      cultivationDieselL: 0,
      cultivationElectricityKwh: 0,
      nitrogenKg: 0,
      phosphateKg: 0,
      potashKg: 0,
      limeKg: 0,
      pesticideKg: 0,
      seedKg: 0,
      irrigationElectricityKwh: 0,
      collectionDieselL: 2,
      dryingGasMj: 150,
    },
    "urban-wood": {
      yieldMjPerTonne: 6500,
      cultivationDieselL: 0,
      cultivationElectricityKwh: 0,
      nitrogenKg: 0,
      phosphateKg: 0,
      potashKg: 0,
      limeKg: 0,
      pesticideKg: 0,
      seedKg: 0,
      irrigationElectricityKwh: 0,
      collectionDieselL: 3,
      dryingGasMj: 100,
    },
    msw: {
      yieldMjPerTonne: 4000,
      cultivationDieselL: 0,
      cultivationElectricityKwh: 0,
      nitrogenKg: 0,
      phosphateKg: 0,
      potashKg: 0,
      limeKg: 0,
      pesticideKg: 0,
      seedKg: 0,
      irrigationElectricityKwh: 0,
      collectionDieselL: 4,
      dryingGasMj: 0,
    },
    "landfill-gas": {
      yieldMjPerTonne: 18000,
      cultivationDieselL: 0,
      cultivationElectricityKwh: 0,
      nitrogenKg: 0,
      phosphateKg: 0,
      potashKg: 0,
      limeKg: 0,
      pesticideKg: 0,
      seedKg: 0,
      irrigationElectricityKwh: 0,
      collectionDieselL: 0,
      dryingGasMj: 0,
    },
    manure: {
      yieldMjPerTonne: 12000,
      cultivationDieselL: 0,
      cultivationElectricityKwh: 0,
      nitrogenKg: 0,
      phosphateKg: 0,
      potashKg: 0,
      limeKg: 0,
      pesticideKg: 0,
      seedKg: 0,
      irrigationElectricityKwh: 0,
      collectionDieselL: 1,
      dryingGasMj: 0,
    },
    sludge: {
      yieldMjPerTonne: 10000,
      cultivationDieselL: 0,
      cultivationElectricityKwh: 0,
      nitrogenKg: 0,
      phosphateKg: 0,
      potashKg: 0,
      limeKg: 0,
      pesticideKg: 0,
      seedKg: 0,
      irrigationElectricityKwh: 0,
      collectionDieselL: 0,
      dryingGasMj: 0,
    },
    "water-power": {
      yieldMjPerTonne: 120000,
      cultivationDieselL: 0,
      cultivationElectricityKwh: 0,
      nitrogenKg: 0,
      phosphateKg: 0,
      potashKg: 0,
      limeKg: 0,
      pesticideKg: 0,
      seedKg: 0,
      irrigationElectricityKwh: 0,
      collectionDieselL: 0,
      dryingGasMj: 0,
    },
  };

  /** Feedstock production defaults for a given feedstock id. */
  function feedstockProductionFor(feedstockId) {
    const preset = feedstockId ? FEEDSTOCK_PRODUCTION_PRESETS[feedstockId] : undefined;
    return { ...DEFAULT_FEEDSTOCK_PRODUCTION, ...(preset ?? {}) };
  }

  function computeFeedstockProduction(f, gridFactor) {
    const yieldMj = Math.max(1e-6, f.yieldMjPerTonne);
    const per = (gPerTonne) => gPerTonne / yieldMj;
    const fieldN2o = f.nitrogenKg * f.n2oEmissionFactor * (44 / 28) * DETAIL_FACTORS.n2oGwp * 1000;
    const n2oFactor = f.n2oEmissionFactor * (44 / 28) * DETAIL_FACTORS.n2oGwp * 1000;
    const items = [
      {
        key: "cultivationDiesel",
        label: "Cultivation and harvest diesel",
        detail: `${f.cultivationDieselL} L/t × 3.72 kg/L`,
        activity: f.cultivationDieselL,
        activityUnit: "L diesel/t",
        factor: DETAIL_FACTORS.dieselPerLitre,
        factorUnit: "gCO2e/L",
      },
      {
        key: "cultivationElectricity",
        label: "Cultivation electricity",
        detail: `${f.cultivationElectricityKwh} kWh/t × ${gridFactor} g/kWh`,
        activity: f.cultivationElectricityKwh,
        activityUnit: "kWh/t",
        factor: gridFactor,
        factorUnit: "gCO2e/kWh",
      },
      {
        key: "nitrogen",
        label: "Nitrogen fertiliser manufacture",
        detail: `${f.nitrogenKg} kg N/t × 4.0 kg/kg`,
        activity: f.nitrogenKg,
        activityUnit: "kg N/t",
        factor: DETAIL_FACTORS.nitrogenPerKg,
        factorUnit: "gCO2e/kg N",
      },
      {
        key: "fieldN2o",
        label: "Field N2O from applied nitrogen",
        detail: `${(f.n2oEmissionFactor * 100).toFixed(2)}% of N as N2O-N, GWP 273`,
        activity: f.nitrogenKg,
        activityUnit: "kg N/t",
        factor: n2oFactor,
        factorUnit: "gCO2e/kg N",
      },
      {
        key: "phosphate",
        label: "Phosphate fertiliser",
        detail: `${f.phosphateKg} kg P2O5/t`,
        activity: f.phosphateKg,
        activityUnit: "kg P2O5/t",
        factor: DETAIL_FACTORS.phosphatePerKg,
        factorUnit: "gCO2e/kg",
      },
      {
        key: "potash",
        label: "Potash fertiliser",
        detail: `${f.potashKg} kg K2O/t`,
        activity: f.potashKg,
        activityUnit: "kg K2O/t",
        factor: DETAIL_FACTORS.potashPerKg,
        factorUnit: "gCO2e/kg",
      },
      {
        key: "lime",
        label: "Lime application",
        detail: `${f.limeKg} kg/t × 0.44 kg/kg`,
        activity: f.limeKg,
        activityUnit: "kg/t",
        factor: DETAIL_FACTORS.limePerKg,
        factorUnit: "gCO2e/kg",
      },
      {
        key: "pesticide",
        label: "Pesticide and herbicide",
        detail: `${f.pesticideKg} kg/t × 20 kg/kg`,
        activity: f.pesticideKg,
        activityUnit: "kg/t",
        factor: DETAIL_FACTORS.pesticidePerKg,
        factorUnit: "gCO2e/kg",
      },
      {
        key: "seed",
        label: "Seed and planting material",
        detail: `${f.seedKg} kg/t`,
        activity: f.seedKg,
        activityUnit: "kg/t",
        factor: DETAIL_FACTORS.seedPerKg,
        factorUnit: "gCO2e/kg",
      },
      {
        key: "irrigation",
        label: "Irrigation pumping",
        detail: `${f.irrigationElectricityKwh} kWh/t`,
        activity: f.irrigationElectricityKwh,
        activityUnit: "kWh/t",
        factor: gridFactor,
        factorUnit: "gCO2e/kWh",
      },
      {
        key: "collection",
        label: "Collection, baling and handling",
        detail: `${f.collectionDieselL} L diesel/t`,
        activity: f.collectionDieselL,
        activityUnit: "L diesel/t",
        factor: DETAIL_FACTORS.dieselPerLitre,
        factorUnit: "gCO2e/L",
      },
      {
        key: "renderingGas",
        label: "Rendering heat (natural gas)",
        detail: `${f.renderingGasMj} MJ/t`,
        activity: f.renderingGasMj,
        activityUnit: "MJ/t",
        factor: DETAIL_FACTORS.naturalGasPerMj,
        factorUnit: "gCO2e/MJ",
      },
      {
        key: "renderingElectricity",
        label: "Rendering electricity",
        detail: `${f.renderingElectricityKwh} kWh/t`,
        activity: f.renderingElectricityKwh,
        activityUnit: "kWh/t",
        factor: gridFactor,
        factorUnit: "gCO2e/kWh",
      },
      {
        key: "dryingGas",
        label: "Feedstock drying",
        detail: `${f.dryingGasMj} MJ/t`,
        activity: f.dryingGasMj,
        activityUnit: "MJ/t",
        factor: DETAIL_FACTORS.naturalGasPerMj,
        factorUnit: "gCO2e/MJ",
      },
      {
        key: "soilCarbon",
        label: "Soil carbon change",
        detail: `${f.soilCarbonKgPerTonne} kgCO2e/t`,
        activity: f.soilCarbonKgPerTonne,
        activityUnit: "kgCO2e/t",
        factor: 1000,
        factorUnit: "g/kg",
      },
    ];
    const rows = items
      .filter((i) => i.activity * i.factor !== 0)
      .map((i) => ({
        key: `fp-${i.key}`,
        label: i.label,
        gPerMj: per(i.activity * i.factor),
        detail: i.detail,
        activity: i.activity,
        activityUnit: i.activityUnit,
        factor: i.factor,
        factorUnit: i.factorUnit,
        divisor: yieldMj,
        divisorUnit: "MJ/t feedstock",
      }));
    return { gPerMj: rows.reduce((a, r) => a + r.gPerMj, 0), rows };
  }

  // --- Transport --------------------------------------------------------------

  const TRANSPORT_MODES = [
    { id: "truckHeavy", label: "Heavy truck (40 t)", gPerTonneKm: 62 },
    { id: "truckSmall", label: "Light / collection truck", gPerTonneKm: 145 },
    { id: "truckRefrigerated", label: "Refrigerated truck", gPerTonneKm: 95 },
    { id: "rail", label: "Rail", gPerTonneKm: 22 },
    { id: "barge", label: "Inland barge", gPerTonneKm: 31 },
    { id: "oceanTanker", label: "Ocean tanker", gPerTonneKm: 8 },
    { id: "oceanBulk", label: "Ocean bulk carrier", gPerTonneKm: 6 },
    { id: "pipelineLiquid", label: "Liquid pipeline", gPerTonneKm: 5 },
    { id: "pipelineGas", label: "Gas pipeline", gPerTonneKm: 3 },
  ];

  const TRANSPORT_MODE_BY_ID = Object.fromEntries(TRANSPORT_MODES.map((m) => [m.id, m]));

  const DEFAULT_TRANSPORT = {
    enabled: false,
    tonnesPerGj: 0.1,
    legs: [
      {
        id: "leg1",
        label: "Field or collection to depot",
        mode: "truckSmall",
        distanceKm: 50,
        sharePct: 100,
        emptyReturn: 1.2,
      },
      {
        id: "leg2",
        label: "Depot to plant",
        mode: "truckHeavy",
        distanceKm: 150,
        sharePct: 100,
        emptyReturn: 1.15,
      },
    ],
  };

  function legRows(legs, tonnesPerGj, prefix) {
    return legs
      .map((leg) => {
        const mode = TRANSPORT_MODE_BY_ID[leg.mode] ?? TRANSPORT_MODES[0];
        const tkmPerGj =
          tonnesPerGj * leg.distanceKm * (leg.sharePct / 100) * (leg.emptyReturn || 1);
        return {
          key: `${prefix}-${leg.id}`,
          label: leg.label || mode.label,
          gPerMj: (tkmPerGj * mode.gPerTonneKm) / 1000,
          detail: `${mode.label} · ${leg.distanceKm} km · ${leg.sharePct}% of mass · ${mode.gPerTonneKm} g/t-km`,
          activity: tkmPerGj,
          activityUnit: "t-km/GJ fuel",
          factor: mode.gPerTonneKm,
          factorUnit: "gCO2e/t-km",
          divisor: 1000,
          divisorUnit: "MJ/GJ",
        };
      })
      .filter((r) => r.gPerMj !== 0);
  }

  function computeTransport(t) {
    const rows = legRows(t.legs, t.tonnesPerGj, "tr");
    return { gPerMj: rows.reduce((a, r) => a + r.gPerMj, 0), rows };
  }

  // --- Chemicals and fugitives -------------------------------------------------

  const CHEMICAL_PRESETS = [
    { id: "methanol", label: "Methanol", gPerKg: 1050 },
    { id: "sodiumMethylate", label: "Sodium methylate", gPerKg: 2200 },
    { id: "caustic", label: "Caustic soda", gPerKg: 1120 },
    { id: "sulphuricAcid", label: "Sulphuric acid", gPerKg: 200 },
    { id: "hydrochloricAcid", label: "Hydrochloric acid", gPerKg: 750 },
    { id: "hexane", label: "Hexane", gPerKg: 900 },
    { id: "enzymes", label: "Enzymes", gPerKg: 6000 },
    { id: "yeast", label: "Yeast and nutrients", gPerKg: 2500 },
    { id: "ammonia", label: "Ammonia", gPerKg: 2400 },
    { id: "urea", label: "Urea", gPerKg: 1600 },
    { id: "catalyst", label: "Hydrotreating catalyst", gPerKg: 12000 },
    { id: "phosphoricAcid", label: "Phosphoric acid", gPerKg: 1300 },
    { id: "activatedCarbon", label: "Activated carbon", gPerKg: 4500 },
    { id: "processWater", label: "Process water treatment", gPerKg: 30 },
    { id: "custom", label: "Custom chemical", gPerKg: 1000 },
  ];

  const DEFAULT_CHEMICALS = {
    enabled: false,
    fuelTonnesPerGj: 0.0234,
    items: [
      { id: "c1", label: "Methanol", kgPerTonneFuel: 100, gPerKg: 1050 },
      { id: "c2", label: "Caustic soda", kgPerTonneFuel: 8, gPerKg: 1120 },
    ],
    fugitiveCh4KgPerTonne: 0.2,
    fugitiveN2oKgPerTonne: 0.01,
    ventedCo2KgPerTonne: 0,
    capturedCo2KgPerTonne: 0,
  };

  function computeChemicals(c) {
    // 1 tonne of fuel carries 1 / fuelTonnesPerGj GJ, so MJ per tonne of fuel:
    const mjPerTonneFuel = 1000 / Math.max(1e-9, c.fuelTonnesPerGj);
    const per = (gPerTonneFuel) => gPerTonneFuel / mjPerTonneFuel;
    const rows = [];
    for (const item of c.items) {
      const g = item.kgPerTonneFuel * item.gPerKg;
      if (g === 0) continue;
      rows.push({
        key: `chem-${item.id}`,
        label: item.label || "Chemical input",
        gPerMj: per(g),
        detail: `${item.kgPerTonneFuel} kg/t fuel × ${item.gPerKg} gCO2e/kg`,
        activity: item.kgPerTonneFuel,
        activityUnit: "kg/t fuel",
        factor: item.gPerKg,
        factorUnit: "gCO2e/kg",
        divisor: mjPerTonneFuel,
        divisorUnit: "MJ/t fuel",
      });
    }
    const extras = [
      [
        "ch4",
        "Fugitive methane",
        c.fugitiveCh4KgPerTonne,
        DETAIL_FACTORS.ch4Gwp * 1000,
        "kg CH4/t fuel",
        "gCO2e/kg CH4",
        `${c.fugitiveCh4KgPerTonne} kg CH4/t fuel × GWP 29.8`,
      ],
      [
        "n2o",
        "Fugitive nitrous oxide",
        c.fugitiveN2oKgPerTonne,
        DETAIL_FACTORS.n2oGwp * 1000,
        "kg N2O/t fuel",
        "gCO2e/kg N2O",
        `${c.fugitiveN2oKgPerTonne} kg N2O/t fuel × GWP 273`,
      ],
      [
        "vent",
        "Vented or flared process CO2",
        c.ventedCo2KgPerTonne,
        1000,
        "kg CO2/t fuel",
        "g/kg",
        `${c.ventedCo2KgPerTonne} kg CO2/t fuel`,
      ],
      [
        "ccs",
        "Carbon captured and stored",
        -c.capturedCo2KgPerTonne,
        1000,
        "kg CO2/t fuel",
        "g/kg",
        `${c.capturedCo2KgPerTonne} kg CO2/t fuel stored`,
      ],
    ];
    for (const [key, label, activity, factor, activityUnit, factorUnit, detail] of extras) {
      if (activity * factor === 0) continue;
      rows.push({
        key: `chem-${key}`,
        label,
        gPerMj: per(activity * factor),
        detail,
        activity,
        activityUnit,
        factor,
        factorUnit,
        divisor: mjPerTonneFuel,
        divisorUnit: "MJ/t fuel",
      });
    }
    return { gPerMj: rows.reduce((a, r) => a + r.gPerMj, 0), rows };
  }

  // --- Co-products and avoided emissions ---------------------------------------

  const COPRODUCT_PRESETS = [
    { id: "ddgs", label: "DDGS animal feed", gPerKg: 500 },
    { id: "soyMeal", label: "Soybean meal", gPerKg: 400 },
    { id: "canolaMeal", label: "Canola meal", gPerKg: 420 },
    { id: "glycerine", label: "Crude glycerine", gPerKg: 900 },
    { id: "naphtha", label: "Renewable naphtha", gPerKg: 800 },
    { id: "lpg", label: "Co-produced LPG", gPerKg: 900 },
    { id: "cornOil", label: "Distillers corn oil", gPerKg: 1200 },
    { id: "biochar", label: "Biochar (stable carbon)", gPerKg: 2200 },
    { id: "digestate", label: "Digestate fertiliser", gPerKg: 120 },
    { id: "electricityExport", label: "Bagasse power export", gPerKg: 0 },
    { id: "custom", label: "Custom co-product", gPerKg: 500 },
  ];

  const DEFAULT_COPRODUCTS = {
    enabled: false,
    fuelTonnesPerGj: 0.0234,
    items: [{ id: "cp1", label: "DDGS animal feed", kgPerTonneFuel: 900, gPerKg: 500 }],
    exportedElectricityKwhPerMj: 0,
    exportedElectricityCreditPerKwh: 386,
    avoidedMethaneGPerMj: 0,
    allocationPct: 100,
  };

  function computeCoProducts(c) {
    const mjPerTonneFuel = 1000 / Math.max(1e-9, c.fuelTonnesPerGj);
    const rows = [];
    for (const item of c.items) {
      const g = item.kgPerTonneFuel * item.gPerKg;
      if (g === 0) continue;
      rows.push({
        key: `cp-${item.id}`,
        label: `${item.label || "Co-product"} credit`,
        gPerMj: -g / mjPerTonneFuel,
        detail: `${item.kgPerTonneFuel} kg/t fuel × ${item.gPerKg} gCO2e/kg displaced`,
        activity: item.kgPerTonneFuel,
        activityUnit: "kg/t fuel",
        factor: item.gPerKg,
        factorUnit: "gCO2e/kg displaced",
        divisor: mjPerTonneFuel,
        divisorUnit: "MJ/t fuel",
        sign: -1,
      });
    }
    if (c.exportedElectricityKwhPerMj !== 0) {
      rows.push({
        key: "cp-power",
        label: "Exported electricity credit",
        gPerMj: -c.exportedElectricityKwhPerMj * c.exportedElectricityCreditPerKwh,
        detail: `${c.exportedElectricityKwhPerMj} kWh/MJ × ${c.exportedElectricityCreditPerKwh} g/kWh displaced`,
        activity: c.exportedElectricityKwhPerMj,
        activityUnit: "kWh/MJ fuel",
        factor: c.exportedElectricityCreditPerKwh,
        factorUnit: "gCO2e/kWh displaced",
        sign: -1,
      });
    }
    if (c.avoidedMethaneGPerMj !== 0) {
      rows.push({
        key: "cp-methane",
        label: "Avoided methane credit",
        gPerMj: -Math.abs(c.avoidedMethaneGPerMj),
        detail: "Manure, landfill or wastewater methane that would have been released",
        activity: Math.abs(c.avoidedMethaneGPerMj),
        activityUnit: "gCO2e/MJ",
        factor: 1,
        factorUnit: "—",
        sign: -1,
      });
    }
    const alloc = Math.min(100, Math.max(0, c.allocationPct)) / 100;
    if (alloc < 1) {
      rows.push({
        key: "cp-alloc",
        label: "Energy allocation to co-products",
        gPerMj: 0,
        detail: `${(alloc * 100).toFixed(0)}% of the burden stays with the fuel`,
      });
    }
    return { gPerMj: rows.reduce((a, r) => a + r.gPerMj, 0), rows };
  }

  // --- Fuel distribution --------------------------------------------------------

  const DEFAULT_DISTRIBUTION = {
    enabled: false,
    fuelTonnesPerGj: 0.0234,
    legs: [
      {
        id: "dleg1",
        label: "Plant to terminal",
        mode: "rail",
        distanceKm: 800,
        sharePct: 100,
        emptyReturn: 1.1,
      },
      {
        id: "dleg2",
        label: "Terminal to station",
        mode: "truckHeavy",
        distanceKm: 120,
        sharePct: 100,
        emptyReturn: 1.2,
      },
    ],
    storageGPerMj: 0.3,
    blendingGPerMj: 0.2,
    dispensingGPerMj: 0.2,
    compressionGPerMj: 0,
    lossPct: 0.2,
  };

  function computeDistribution(dst, upstreamCi) {
    const rows = legRows(dst.legs, dst.fuelTonnesPerGj, "dist");
    const extras = [
      [
        "storage",
        "Terminal storage",
        dst.storageGPerMj,
        "Tank heating, pumping and vapour control",
      ],
      ["blending", "Blending and additives", dst.blendingGPerMj, "Splash or in-line blending"],
      ["dispensing", "Retail dispensing", dst.dispensingGPerMj, "Station electricity and pumping"],
      [
        "compression",
        "Compression or liquefaction",
        dst.compressionGPerMj,
        "CNG compression, LNG or hydrogen handling",
      ],
    ];
    for (const [key, label, g, detail] of extras) {
      if (g === 0) continue;
      rows.push({
        key: `dist-${key}`,
        label,
        gPerMj: g,
        detail,
        activity: g,
        activityUnit: "gCO2e/MJ",
        factor: 1,
        factorUnit: "—",
      });
    }
    if (dst.lossPct !== 0) {
      rows.push({
        key: "dist-loss",
        label: "Distribution losses",
        gPerMj: (dst.lossPct / 100) * upstreamCi,
        detail: `${dst.lossPct}% of the fuel lost, carrying its upstream carbon`,
        activity: dst.lossPct / 100,
        activityUnit: "share of fuel lost",
        factor: upstreamCi,
        factorUnit: "gCO2e/MJ upstream",
      });
    }
    return { gPerMj: rows.reduce((a, r) => a + r.gPerMj, 0), rows };
  }

  // --- Tailpipe / end use --------------------------------------------------------

  const END_USE_MODES = [
    {
      id: "lightDutyRoad",
      label: "Light duty road vehicle",
      ch4GPerMj: 0.15,
      n2oGPerMj: 0.65,
      note: "Spark ignition cars and light trucks",
    },
    {
      id: "heavyDutyRoad",
      label: "Heavy duty road vehicle",
      ch4GPerMj: 0.1,
      n2oGPerMj: 0.9,
      note: "Compression ignition trucks and buses",
    },
    {
      id: "cngVehicle",
      label: "Natural gas vehicle",
      ch4GPerMj: 1.8,
      n2oGPerMj: 0.3,
      note: "Methane slip dominates spark-ignited gas engines",
    },
    {
      id: "fuelCell",
      label: "Hydrogen fuel cell",
      ch4GPerMj: 0,
      n2oGPerMj: 0,
      note: "No combustion emissions at the point of use",
    },
    {
      id: "aviationTurbine",
      label: "Aviation turbine",
      ch4GPerMj: 0.02,
      n2oGPerMj: 0.55,
      note: "Excludes non-CO2 contrail effects",
    },
    {
      id: "marineEngine",
      label: "Marine engine",
      ch4GPerMj: 0.3,
      n2oGPerMj: 0.55,
      note: "Slow speed diesel; higher slip for LNG dual fuel",
    },
    {
      id: "railLocomotive",
      label: "Rail locomotive",
      ch4GPerMj: 0.08,
      n2oGPerMj: 0.8,
      note: "Line haul diesel electric",
    },
    {
      id: "offRoad",
      label: "Off-road and agricultural machinery",
      ch4GPerMj: 0.2,
      n2oGPerMj: 1.0,
      note: "Tractors, loaders and construction plant",
    },
    {
      id: "stationaryBoiler",
      label: "Stationary boiler or furnace",
      ch4GPerMj: 0.05,
      n2oGPerMj: 0.3,
      note: "Industrial heat and district energy",
    },
    {
      id: "powerGeneration",
      label: "Power generation",
      ch4GPerMj: 0.04,
      n2oGPerMj: 0.35,
      note: "Biomass or biogas fired generation",
    },
  ];

  const END_USE_MODE_BY_ID = Object.fromEntries(END_USE_MODES.map((m) => [m.id, m]));

  const DEFAULT_TAILPIPE = {
    enabled: false,
    modeId: "heavyDutyRoad",
    fossilCarbonPct: 0,
    combustionCo2GPerMj: DETAIL_FACTORS.combustionCo2PerMj,
    ch4Override: -1,
    n2oOverride: -1,
    aftertreatmentGPerMj: 0,
  };

  function computeTailpipe(t) {
    const mode = END_USE_MODE_BY_ID[t.modeId] ?? END_USE_MODES[0];
    const ch4 = t.ch4Override >= 0 ? t.ch4Override : mode.ch4GPerMj;
    const n2o = t.n2oOverride >= 0 ? t.n2oOverride : mode.n2oGPerMj;
    const fossil = (Math.min(100, Math.max(0, t.fossilCarbonPct)) / 100) * t.combustionCo2GPerMj;
    const rows = [];
    if (ch4)
      rows.push({
        key: "tp-ch4",
        label: `${mode.label} — methane slip`,
        gPerMj: ch4,
        detail: mode.note,
        activity: ch4,
        activityUnit: "gCO2e/MJ",
        factor: 1,
        factorUnit: "—",
      });
    if (n2o)
      rows.push({
        key: "tp-n2o",
        label: `${mode.label} — nitrous oxide`,
        gPerMj: n2o,
        detail: "Combustion N2O, GWP 273",
        activity: n2o,
        activityUnit: "gCO2e/MJ",
        factor: 1,
        factorUnit: "—",
      });
    if (fossil)
      rows.push({
        key: "tp-fossil",
        label: "Fossil carbon in the fuel",
        gPerMj: fossil,
        detail: `${t.fossilCarbonPct}% of ${t.combustionCo2GPerMj} gCO2/MJ combustion CO2`,
        activity: Math.min(100, Math.max(0, t.fossilCarbonPct)) / 100,
        activityUnit: "fossil carbon share",
        factor: t.combustionCo2GPerMj,
        factorUnit: "gCO2/MJ combustion",
      });
    if (t.aftertreatmentGPerMj)
      rows.push({
        key: "tp-scr",
        label: "Aftertreatment reagent",
        gPerMj: t.aftertreatmentGPerMj,
        detail: "Urea / DEF consumption",
        activity: t.aftertreatmentGPerMj,
        activityUnit: "gCO2e/MJ",
        factor: 1,
        factorUnit: "—",
      });
    rows.push({
      key: "tp-biogenic",
      label: "Biogenic combustion CO2",
      gPerMj: 0,
      detail: `${(t.combustionCo2GPerMj * (1 - t.fossilCarbonPct / 100)).toFixed(1)} gCO2/MJ counted as zero under every program`,
    });
    return { gPerMj: rows.reduce((a, r) => a + r.gPerMj, 0), rows };
  }

  // --- Module wiring -------------------------------------------------------------

  /** Module keys that map onto an aggregate DirectTerms value. */

  /** Which aggregate DirectTerms value each detailed module replaces. */
  const MODULE_TO_DIRECT = {
    feedstockProduction: "feedstock",
    transport: "feedstockTransport",
    chemicals: "processNonEnergy",
    coProducts: "coProductCredit",
    distribution: "distribution",
    tailpipe: "endUse",
  };

  function defaultDetailModules(feedstockId) {
    return {
      feedstockProduction: feedstockProductionFor(feedstockId),
      transport: { ...DEFAULT_TRANSPORT, legs: DEFAULT_TRANSPORT.legs.map((l) => ({ ...l })) },
      chemicals: { ...DEFAULT_CHEMICALS, items: DEFAULT_CHEMICALS.items.map((i) => ({ ...i })) },
      coProducts: { ...DEFAULT_COPRODUCTS, items: DEFAULT_COPRODUCTS.items.map((i) => ({ ...i })) },
      distribution: {
        ...DEFAULT_DISTRIBUTION,
        legs: DEFAULT_DISTRIBUTION.legs.map((l) => ({ ...l })),
      },
      tailpipe: { ...DEFAULT_TAILPIPE },
      dairyRng: { ...DEFAULT_DAIRY_RNG, enabled: feedstockId === "manure" },
      dairyMethod: "lcfs",
      dairyLcfs: {
        ...DEFAULT_DAIRY_RNG_LCFS,
        livestock: DEFAULT_DAIRY_RNG_LCFS.livestock.map((l) => ({ ...l })),
        monthlyTemperatureC: [...DEFAULT_DAIRY_RNG_LCFS.monthlyTemperatureC],
        otherStorage: DEFAULT_DAIRY_RNG_LCFS.otherStorage.map((o) => ({
          ...o,
          fractions: [...o.fractions],
        })),
        nonBcsStorage: DEFAULT_DAIRY_RNG_LCFS.nonBcsStorage.map((o) => ({
          ...o,
          fractions: [...o.fractions],
        })),
      },
      dairyCfr: {
        ...DEFAULT_DAIRY_RNG_CFR,
        farms: DEFAULT_DAIRY_RNG_CFR.farms.map((f) => ({ ...f })),
      },
    };
  }

  // --- Background emission factor library -------------------------------------
  // Every background factor the calculator can apply, with the reference it is
  // taken from. Exported so the CSV download documents the full basis of a run.

  const SRC = {
    greet: "Argonne National Laboratory, GREET model (fuel-cycle and material databases)",
    caGreet: "CARB CA-GREET 3.0 / LCFS certified pathway documentation",
    red: "EU RED II / RED III Annex V and Annex VI typical and default values",
    ipcc: "IPCC AR5/AR6 global warming potentials and 2019 Refinement inventory guidance",
    grid: "IEA Emission Factors, US EPA eGRID and national grid inventories",
    ecoinvent: "ecoinvent v3 background datasets for chemicals and materials",
    transport: "GLEC Framework and IMO/EEA transport emission intensity data",
  };

  function backgroundFactors() {
    const rows = [];

    for (const r of ELECTRICITY_REGIONS) {
      rows.push({
        group: "Electricity grid intensity",
        item: r.label,
        detail: "Consumption-basis grid factor",
        value: r.gPerKwh,
        unit: "gCO2e/kWh",
        source: SRC.grid,
      });
    }

    for (const s of SOURCES) {
      for (const v of SOURCE_VARIANTS[s.id] ?? []) {
        rows.push({
          group: "Process energy supply",
          item: `${s.label} — ${v.label}`,
          detail: s.note,
          value: v.factor,
          unit: `gCO2e/${s.unit}`,
          source: s.id === "electricity" ? SRC.grid : SRC.greet,
        });
      }
    }

    for (const m of TRANSPORT_MODES) {
      rows.push({
        group: "Transport modes",
        item: m.label,
        detail: "Freight intensity, loaded tonne-km",
        value: m.gPerTonneKm,
        unit: "gCO2e/tonne-km",
        source: SRC.transport,
      });
    }

    for (const c of CHEMICAL_PRESETS) {
      rows.push({
        group: "Process chemicals and catalysts",
        item: c.label,
        detail: "Cradle-to-gate manufacture",
        value: c.gPerKg,
        unit: "gCO2e/kg",
        source: SRC.ecoinvent,
      });
    }

    for (const c of COPRODUCT_PRESETS) {
      rows.push({
        group: "Co-product displacement credits",
        item: c.label,
        detail: "Displaced conventional product",
        value: c.gPerKg,
        unit: "gCO2e/kg displaced",
        source: SRC.greet,
      });
    }

    for (const m of END_USE_MODES) {
      rows.push({
        group: "Tailpipe and end use",
        item: `${m.label} — methane`,
        detail: m.note,
        value: m.ch4GPerMj,
        unit: "gCO2e/MJ",
        source: SRC.ipcc,
      });
      rows.push({
        group: "Tailpipe and end use",
        item: `${m.label} — nitrous oxide`,
        detail: m.note,
        value: m.n2oGPerMj,
        unit: "gCO2e/MJ",
        source: SRC.ipcc,
      });
    }

    const detailRows = [
      [
        "Diesel fuel",
        "Combustion plus upstream",
        DETAIL_FACTORS.dieselPerLitre,
        "gCO2e/litre",
        SRC.greet,
      ],
      [
        "Gasoline fuel",
        "Combustion plus upstream",
        DETAIL_FACTORS.gasolinePerLitre,
        "gCO2e/litre",
        SRC.greet,
      ],
      [
        "Natural gas",
        "Combustion plus upstream",
        DETAIL_FACTORS.naturalGasPerMj,
        "gCO2e/MJ",
        SRC.greet,
      ],
      [
        "Nitrogen fertiliser",
        "Manufacture of applied N",
        DETAIL_FACTORS.nitrogenPerKg,
        "gCO2e/kg N",
        SRC.ecoinvent,
      ],
      [
        "Phosphate fertiliser",
        "Manufacture, as P2O5",
        DETAIL_FACTORS.phosphatePerKg,
        "gCO2e/kg",
        SRC.ecoinvent,
      ],
      [
        "Potash fertiliser",
        "Manufacture, as K2O",
        DETAIL_FACTORS.potashPerKg,
        "gCO2e/kg",
        SRC.ecoinvent,
      ],
      [
        "Agricultural lime",
        "Manufacture and field CO2",
        DETAIL_FACTORS.limePerKg,
        "gCO2e/kg",
        SRC.ipcc,
      ],
      [
        "Pesticides",
        "Cradle-to-gate manufacture",
        DETAIL_FACTORS.pesticidePerKg,
        "gCO2e/kg",
        SRC.ecoinvent,
      ],
      ["Seed", "Seed production and treatment", DETAIL_FACTORS.seedPerKg, "gCO2e/kg", SRC.greet],
      [
        "Methane GWP",
        "100-year global warming potential",
        DETAIL_FACTORS.ch4Gwp,
        "gCO2e/g CH4",
        SRC.ipcc,
      ],
      [
        "Nitrous oxide GWP",
        "100-year global warming potential",
        DETAIL_FACTORS.n2oGwp,
        "gCO2e/g N2O",
        SRC.ipcc,
      ],
      [
        "Fuel combustion CO2",
        "Default liquid fuel carbon content",
        DETAIL_FACTORS.combustionCo2PerMj,
        "gCO2e/MJ",
        SRC.caGreet,
      ],
    ];
    for (const [item, detail, value, unit, source] of detailRows) {
      rows.push({
        group: "Background material and GWP factors",
        item,
        detail,
        value,
        unit,
        source,
      });
    }

    for (const f of FEEDSTOCKS) {
      if (f.id === "custom") continue;
      rows.push({
        group: "Feedstock default terms",
        item: f.label,
        detail: `${f.note} (land use change ${f.landUseChange}, transport ${f.feedstockTransport} gCO2e/MJ)`,
        value: f.feedstock,
        unit: "gCO2e/MJ feedstock supply",
        source: SRC.red,
      });
    }

    for (const p of PROGRAMS) {
      for (const [fuel, benchmark] of Object.entries(p.benchmarks)) {
        if (benchmark == null) continue;
        rows.push({
          group: "Regulatory benchmarks",
          item: `${p.label} — ${fuel}`,
          detail: p.note,
          value: benchmark,
          unit: "gCO2e/MJ benchmark",
          source: `${p.jurisdiction} program documentation`,
        });
      }
    }

    return rows;
  }

  return {
    DEFAULT_DAIRY_RNG,
    computeDairyRng,
    ELECTRICITY_REGIONS,
    SOURCES,
    SOURCE_BY_ID,
    PROGRAMS,
    PROGRAM_BY_ID,
    PATHWAYS,
    PATHWAY_BY_ID,
    scopeOf,
    scenarioFromPathway,
    applyFeedstock,
    DIRECT_FIELDS,
    calculateScenario,
    FEEDSTOCKS,
    FEEDSTOCK_BY_ID,
    PATHWAY_FEEDSTOCK,
    SOURCE_VARIANTS,
    UNIT_OPTIONS,
    CI_UNITS,
    CI_UNIT_BY_ID,
    MASS_UNITS,
    DETAIL_FACTORS,
    DEFAULT_FEEDSTOCK_PRODUCTION,
    FEEDSTOCK_PRODUCTION_PRESETS,
    feedstockProductionFor,
    computeFeedstockProduction,
    TRANSPORT_MODES,
    TRANSPORT_MODE_BY_ID,
    DEFAULT_TRANSPORT,
    computeTransport,
    CHEMICAL_PRESETS,
    DEFAULT_CHEMICALS,
    computeChemicals,
    COPRODUCT_PRESETS,
    DEFAULT_COPRODUCTS,
    computeCoProducts,
    DEFAULT_DISTRIBUTION,
    computeDistribution,
    END_USE_MODES,
    END_USE_MODE_BY_ID,
    DEFAULT_TAILPIPE,
    computeTailpipe,
    MODULE_TO_DIRECT,
    defaultDetailModules,
    backgroundFactors,
  };
})();
__modules["gbw-workspace/engine/ci-adapter.mjs"] = (() => {
  const { dairyDefaults, assessDairy } = __modules["gbw-workspace/engine/dairy-adapter.mjs"];
  const {
    backgroundFactors,
    PATHWAYS,
    PATHWAY_BY_ID,
    DIRECT_FIELDS,
    SOURCES,
    ELECTRICITY_REGIONS,
    scenarioFromPathway,
    calculateScenario,
    scopeOf,
  } = __modules["gbw-workspace/engine/source/ci-model.mjs"];

  const PRESETS = PATHWAYS.filter((p) => p.id !== "rng-dairy");
  const MODEL_VERSION =
    "CIvanta scenario module 3.1 / GBW engine snapshot 2026-09-29; corrections 2026-10-15";
  function newScenario(pathwayId = "rd-uco", region = "usAverage") {
    const x = scenarioFromPathway(pathwayId, region),
      p = PATHWAY_BY_ID[pathwayId];
    return {
      dairy: pathwayId === "rng-dairy" ? dairyDefaults() : undefined,
      pathwayId,
      region,
      name: pathwayId === "rng-dairy" ? "Dairy RNG farm scenario" : "My fuel scenario",
      annualVolume: x.annualVolume,
      energyDensity: p.energyPerUnit,
      inputBasis: "perMJ",
      direct: { ...x.direct },
      energy: { ...x.energy },
      factors: Object.fromEntries(
        SOURCES.map((v) => [
          v.id,
          v.id === "electricity"
            ? ELECTRICITY_REGIONS.find((r) => r.id === region).gPerKwh
            : v.factor,
        ]),
      ),
      comparator: 100,
    };
  }
  function assess(s) {
    if (s?.pathwayId === "rng-dairy") return assessDairy(s, PATHWAY_BY_ID["rng-dairy"]);
    const errors = [];
    if (!s || !PRESETS.some((p) => p.id === s.pathwayId))
      return { errors: ["Choose a supported pathway."] };
    for (const [key, value] of Object.entries({
      annualVolume: s.annualVolume,
      energyDensity: s.energyDensity,
      comparator: s.comparator,
    })) {
      if (typeof value !== "number" || !Number.isFinite(value))
        errors.push(key + " must be a finite number.");
    }
    if (s.annualVolume < 0) errors.push("Annual production cannot be negative.");
    if (s.energyDensity <= 0) errors.push("Fuel energy content must be greater than zero.");
    if (s.comparator <= 0) errors.push("Comparator must be greater than zero.");
    if (!["perMJ", "perUnit"].includes(s.inputBasis))
      errors.push("Choose a supported activity basis.");
    for (const f of DIRECT_FIELDS) {
      const n = s.direct?.[f.key];
      if (typeof n !== "number" || !Number.isFinite(n))
        errors.push(f.label + " must be a finite number.");
      else if (
        f.key === "coProductCredit"
          ? n > 0
          : !["landUseChange", "processNonEnergy"].includes(f.key) && n < 0
      )
        errors.push(
          f.key === "coProductCredit"
            ? "Enter co-product/avoided emissions as zero or a negative value."
            : f.label + " must be zero or positive in this scenario tool.",
        );
    }
    for (const f of SOURCES) {
      const n = s.energy?.[f.id] ?? 0,
        ef = s.factors?.[f.id];
      if (typeof n !== "number" || !Number.isFinite(n) || n < 0)
        errors.push(f.label + " activity must be zero or positive.");
      if (typeof ef !== "number" || !Number.isFinite(ef) || ef < 0)
        errors.push(f.label + " factor must be zero or positive.");
    }
    if (errors.length) return { errors };
    const energy = Object.fromEntries(
      SOURCES.map((x) => [
        x.id,
        (s.energy[x.id] ?? 0) / (s.inputBasis === "perUnit" ? s.energyDensity : 1),
      ]),
    );
    // No detailed modules: all user-visible aggregate terms are the active terms.
    const seed = scenarioFromPathway(s.pathwayId, s.region);
    const core = calculateScenario({
      ...seed,
      detail: undefined,
      direct: s.direct,
      energy,
      sourceVariants: {},
      annualVolume: s.annualVolume,
    });
    // Overrides are explicit products of the same activity inputs and custom factors.
    const lineItems = core.lineItems.map((row) =>
      SOURCES.some((x) => x.id === row.key)
        ? {
            ...row,
            factor: s.factors[row.key],
            gPerMj: energy[row.key] * s.factors[row.key],
            detail: "User-visible activity × emission factor",
          }
        : { ...row },
    );
    const ciTotal = lineItems.reduce((a, x) => a + x.gPerMj, 0),
      grossCi = lineItems.filter((x) => x.gPerMj > 0).reduce((a, x) => a + x.gPerMj, 0),
      creditsCi = lineItems.filter((x) => x.gPerMj < 0).reduce((a, x) => a + x.gPerMj, 0);
    const annualEnergyMj = s.annualVolume * s.energyDensity;
    const stages = DIRECT_FIELDS.filter((x) => x.key !== "coProductCredit").map((f) => ({
      label: f.label,
      value: s.direct[f.key],
    }));
    stages.splice(3, 0, {
      label: "Process energy",
      value: lineItems
        .filter((x) => x.category === "Process energy")
        .reduce((a, x) => a + x.gPerMj, 0),
    });
    stages.push({ label: "Co-products / avoided emissions", value: s.direct.coProductCredit });
    const output = {
      errors: [],
      pathway: core.pathway,
      lineItems,
      stages,
      ciTotal,
      grossCi,
      creditsCi,
      annualEnergyMj,
      annualTonnesCo2e: (ciTotal * annualEnergyMj) / 1e6,
      savingPct: ((s.comparator - ciTotal) / s.comparator) * 100,
      reconciliation: ciTotal - stages.reduce((a, x) => a + x.value, 0),
    };
    if (
      [ciTotal, grossCi, creditsCi, annualEnergyMj, output.annualTonnesCo2e, output.savingPct].some(
        (n) => !Number.isFinite(n),
      )
    )
      return { errors: ["Inputs exceed the supported numeric range."] };
    return output;
  }

  function changeBasis(s, basis) {
    if (s.inputBasis === basis) return s;
    const multiplier = basis === "perUnit" ? s.energyDensity : 1 / s.energyDensity;
    return {
      ...s,
      inputBasis: basis,
      energy: Object.fromEntries(Object.entries(s.energy).map(([k, v]) => [k, v * multiplier])),
    };
  }
  function exportRows(s, r) {
    return [
      ["CIvanta CI scenario", ""],
      ["Engine", MODEL_VERSION],
      ["Preset status", "Indicative, unverified starting assumptions"],
      ["Method", "Generic lifecycle screening; not a program-specific certified calculation"],
      ["Boundary", "Feedstock through distribution/end use; LHV basis"],
      ...Object.entries(s).filter(
        ([k]) => !["energy", "factors", "direct", "dairy", "programs"].includes(k),
      ),
      [""],
      ["Emission factors", ""],
      ["Key", "Value"],
      ...Object.entries(s.factors ?? {}),
      [""],
      ["Energy inputs", ""],
      ["Key", "Value"],
      ...Object.entries(s.energy ?? {}),
      [""],
      ["Direct inputs", ""],
      ["Key", "Value"],
      ...Object.entries(s.direct ?? {}),
      [""],
      ["Line items", ""],
      [
        "Key",
        "Item",
        "Activity",
        "Activity unit",
        "Factor",
        "Factor unit",
        ...(s.dairy ? ["Divisor MJ", "Sign"] : []),
        "gCO2e/MJ",
      ],
      ...r.lineItems.map((x) => [
        x.key ?? "",
        x.label,
        x.activity,
        x.activityUnit,
        x.factor,
        x.factorUnit,
        ...(s.dairy ? [x.divisor, x.sign ?? 1] : []),
        x.gPerMj,
      ]),
      ["Net CI", r.ciTotal],
      ["Gross CI", r.grossCi],
      ["Credits", r.creditsCi],
      ["Annual energy MJ", r.annualEnergyMj],
      ["Annual tonnes CO2e", r.annualTonnesCo2e],
      ["Stage reconciliation", r.reconciliation],
      [
        "Notes",
        "Aggregation inputs are already normalized and allocated by the user. Co-product and avoided-emission credits must be checked for the selected method.",
      ],
    ];
  }

  return {
    dairyDefaults,
    DIRECT_FIELDS,
    SOURCES,
    ELECTRICITY_REGIONS,
    PRESETS,
    MODEL_VERSION,
    newScenario,
    assess,
    changeBasis,
    exportRows,
    scopeOf,
  };
})();
__modules["gbw-workspace/engine/credit-engine.mjs"] = CreditEngine;
__modules["gbw-workspace/engine/programs.mjs"] = (() => {
  const { defaults, calculate } = __modules["gbw-workspace/engine/credit-engine.mjs"];
  const PROGRAMS = [
    {
      id: "ca",
      name: "California LCFS",
      kind: "Annual standard",
      bench: { 2026: { gasoline: 75.16, diesel: 80.17 }, 2027: { gasoline: 73.72, diesel: 78.63 } },
      url: "https://ww2.arb.ca.gov/sites/default/files/2025-08/2025_lcfs_fro_oal-approved_unofficial_08112025.pdf",
    },
    {
      id: "or",
      name: "Oregon CFP",
      kind: "Annual standard",
      bench: { 2026: { gasoline: 84.92, diesel: 90.4 }, 2027: { gasoline: 82.99, diesel: 88.34 } },
      url: "https://ormswd2.synergydcs.com/HPRMWebDrawer/Record/6864923/File/document",
    },
    {
      id: "wa",
      name: "Washington CFS",
      kind: "Annual standard",
      bench: { 2026: { gasoline: 92, diesel: 93.1 }, 2027: { gasoline: 88.04, diesel: 89.1 } },
      url: "https://apps.leg.wa.gov/wac/default.aspx?cite=173-424-900",
    },
    {
      id: "cfr",
      name: "Canada CFR · liquid class",
      kind: "Section 94 credit reference",
      bench: { 2026: { gasoline: 85.3, diesel: 85.3 }, 2027: { gasoline: 84, diesel: 84 } },
      url: "https://laws-lois.justice.gc.ca/eng/regulations/SOR-2022-140/page-18.html",
    },
    {
      id: "red",
      ref: 1,
      name: "EU RED III",
      kind: "Fossil comparator (65 percent saving for new plants gives 32.9)",
      bench: { 2026: { gasoline: 94, diesel: 94 }, 2027: { gasoline: 94, diesel: 94 } },
      url: "https://eur-lex.europa.eu/eli/dir/2023/2413/oj",
    },
    {
      id: "corsia",
      ref: 1,
      name: "ICAO CORSIA",
      kind: "Jet fuel baseline (10 percent saving required)",
      bench: { 2026: { gasoline: 89, diesel: 89 }, 2027: { gasoline: 89, diesel: 89 } },
      url: "https://www.icao.int/environmental-protection/CORSIA/Pages/CORSIA-Eligible-Fuels.aspx",
    },
    {
      id: "fueleu",
      ref: 1,
      name: "FuelEU Maritime",
      kind: "2020 fleet reference intensity",
      bench: { 2026: { gasoline: 91.16, diesel: 91.16 }, 2027: { gasoline: 91.16, diesel: 91.16 } },
      url: "https://eur-lex.europa.eu/eli/reg/2023/1805/oj",
    },
    {
      id: "reno",
      ref: 1,
      name: "Brazil RenovaBio",
      kind: "Fossil reference for CBIO issuance",
      bench: { 2026: { gasoline: 87.4, diesel: 86.5 }, 2027: { gasoline: 87.4, diesel: 86.5 } },
      url: "https://www.gov.br/anp/pt-br/assuntos/renovabio",
    },
  ];
  function settings() {
    return {
      year: 2026,
      reference: "diesel",
      rows: Object.fromEntries(
        PROGRAMS.map((p) => [p.id, { share: 0, ci: null, energyFactor: 1 }]),
      ),
      rfsShare: 0,
      dcode: "",
      evMode: "standard",
      customEV: 1.7,
    };
  }
  function fuelType(id) {
    return id.startsWith("rd-")
      ? "rd"
      : id.startsWith("biodiesel-")
        ? "bd"
        : id.startsWith("ethanol-")
          ? "ethanol"
          : id.startsWith("rng-")
            ? "rng"
            : null;
  }
  function comparePrograms(s, r, c) {
    const errors = [],
      fuel = fuelType(s.pathwayId),
      liquid = ["rd", "bd", "ethanol"].includes(fuel);
    if (![2026, 2027].includes(c.year) || !["gasoline", "diesel"].includes(c.reference))
      errors.push("Select a supported year and displaced road fuel.");
    const rows = PROGRAMS.map((p) => {
      const a = c.rows?.[p.id],
        benchmark = p.bench[c.year]?.[c.reference];
      if (
        !a ||
        !Number.isFinite(a.share) ||
        a.share < 0 ||
        a.share > 100 ||
        !Number.isFinite(a.energyFactor) ||
        a.energyFactor <= 0 ||
        (a.ci !== null && !Number.isFinite(a.ci))
      )
        errors.push(p.name + ": check CI, eligible share (0–100%) and energy multiplier.");
      const ci = a?.ci ?? r.ciTotal,
        energy = (r.annualEnergyMj * (a?.energyFactor ?? 1) * (a?.share ?? 0)) / 100,
        delta = benchmark - ci;
      return {
        ...p,
        benchmark,
        ci,
        delta,
        share: a?.share ?? 0,
        energy,
        credits: liquid && !p.ref ? (delta * energy) / 1e6 : null,
        supported: liquid && !p.ref,
      };
    });
    const ref = {
      ...defaults(),
      mode: "rfs",
      fuel: fuel ?? "rd",
      year: c.year,
      quantity: fuel === "rng" ? r.annualEnergyMj : s.annualVolume,
      unit: fuel === "rng" ? "MJ" : "gal",
      energy: s.energyDensity,
      dcode: c.dcode,
      rfsShare: c.rfsShare,
      evMode: c.evMode,
      customEV: c.customEV,
    };
    const rin = fuel ? calculate(ref) : null;
    if (rin?.errors.length) errors.push(...rin.errors);
    if (
      rows.some(
        (x) =>
          !Number.isFinite(x.delta) ||
          !Number.isFinite(x.energy) ||
          (x.credits !== null && !Number.isFinite(x.credits)),
      )
    )
      errors.push("Program calculation exceeds the supported numeric range.");
    return { errors, rows, rin, fuel, liquid };
  }

  return { PROGRAMS, settings, fuelType, comparePrograms };
})();
const CI = __modules["gbw-workspace/engine/ci-adapter.mjs"];
const PROGRAM = __modules["gbw-workspace/engine/programs.mjs"];
const DAIRY = __modules["gbw-workspace/engine/dairy-adapter.mjs"];
const {
  PRESETS,
  DIRECT_FIELDS,
  SOURCES,
  ELECTRICITY_REGIONS,
  newScenario,
  assess: assessBase,
  changeBasis,
  exportRows,
  MODEL_VERSION,
} = CI;

const G_PER = { g: 1, kg: 1e3, t: 1e6 };
function customRows(s) {
  return s.customEmissions || [];
}
function customG(x) {
  return (Number(x.activity) || 0) * (Number(x.factor) || 0) * G_PER[x.fMass || "g"];
}
function assess(s) {
  const r = applyOverrides(s, assessBase(s));
  const rows = customRows(s).filter((x) => x.include !== false);
  if (!r || r.errors?.length || !rows.length) return r;
  const errors = [];
  for (const x of rows) {
    if (!Number.isFinite(x.activity) || x.activity < 0)
      errors.push((x.label || "Custom emission") + ": activity must be zero or positive.");
    if (!Number.isFinite(x.factor))
      errors.push((x.label || "Custom emission") + ": enter an emission factor.");
    if (!Object.hasOwn(G_PER, x.fMass || "g"))
      errors.push("Select a supported emissions mass unit.");
    if (![1, 2, 3].includes(x.scope ?? 1)) errors.push("Select Scope 1, 2 or 3.");
  }
  if (errors.length) return { errors };
  if (!(r.annualEnergyMj > 0))
    return {
      errors: [
        "Custom emissions need a positive annual fuel energy to express them per MJ. Enter annual production.",
      ],
    };
  const items = rows.map((x) => {
    const key = "custom-" + x.id;
    const g = customG(x);
    return {
      key,
      scope: x.scope || 1,
      label: x.label || "Custom emission",
      category: "Custom emissions",
      detail: "User-defined annual activity × emission factor",
      activity: x.activity,
      activityUnit: x.aUnit + "/yr",
      factor: (Number(x.factor) || 0) * G_PER[x.fMass || "g"],
      factorUnit: "gCO2e/" + x.aUnit,
      divisor: r.annualEnergyMj,
      sign: g < 0 ? -1 : 1,
      gPerMj: g / r.annualEnergyMj,
    };
  });
  const lineItems = [...r.lineItems, ...items],
    add = items.reduce((a, x) => a + x.gPerMj, 0),
    ciTotal = r.ciTotal + add;
  const out = {
    ...r,
    lineItems,
    ciTotal,
    grossCi: lineItems.filter((x) => x.gPerMj > 0).reduce((a, x) => a + x.gPerMj, 0),
    creditsCi: lineItems.filter((x) => x.gPerMj < 0).reduce((a, x) => a + x.gPerMj, 0),
    annualTonnesCo2e: (ciTotal * r.annualEnergyMj) / 1e6,
  };
  if (Number.isFinite(s.comparator) && s.comparator > 0)
    out.savingPct = ((s.comparator - ciTotal) / s.comparator) * 100;
  if (r.stages) out.stages = [...r.stages, { label: "Custom emissions", value: add }];
  if (!Number.isFinite(ciTotal) || !Number.isFinite(out.annualTonnesCo2e))
    return { errors: ["Inputs exceed the supported numeric range."] };
  return out;
}
function applyOverrides(s, r) {
  const ov = s.overrides || {};
  if (!r || r.errors?.length || !Object.keys(ov).length) return r;
  const errors = [];
  for (const row of r.lineItems) {
    const override = ov[row.key];
    if (!override) continue;
    for (const field of ["activity", "factor"])
      if (override[field] !== undefined && !Number.isFinite(override[field]))
        errors.push(row.label + ": " + field + " must be finite.");
    if (override.factor < 0) errors.push(row.label + ": emission factor cannot be negative.");
    if (
      override.activity < 0 &&
      !["coProductCredit", "processNonEnergy", "landUseChange"].includes(row.key)
    )
      errors.push(row.label + ": activity cannot be negative.");
  }
  if (errors.length) return { errors };
  let delta = 0;
  const sd = {};
  const lineItems = r.lineItems.map((x) => {
    const o = ov[x.key];
    if (!o || String(x.key).startsWith("custom-")) return x;
    const a = Number.isFinite(o.activity) ? o.activity : x.activity,
      f = Number.isFinite(o.factor) ? o.factor : x.factor;
    const g = ((a * f) / (x.divisor ?? 1)) * (x.allocation ?? 1) * (x.sign ?? 1);
    if (!Number.isFinite(g)) {
      errors.push(x.label + ": override exceeds the supported numeric range.");
      return x;
    }
    const d = g - x.gPerMj;
    delta += d;
    const k = x.category || x.label;
    sd[k] = (sd[k] || 0) + d;
    return {
      ...x,
      scopeParts: x.scopeParts
        ? x.gPerMj
          ? Object.fromEntries(
              Object.entries(x.scopeParts).map(([scope, part]) => [scope, (part * g) / x.gPerMj]),
            )
          : { unallocated: g }
        : undefined,
      activity: a,
      factor: f,
      gPerMj: g,
      userData: true,
      detail: (x.detail || "") + " · user-entered data",
    };
  });
  if (errors.length) return { errors };
  if (!delta && !lineItems.some((x) => x.userData)) return r;
  let stages = r.stages ? r.stages.map((x) => ({ ...x })) : [];
  for (const [k, d] of Object.entries(sd)) {
    const st =
      stages.find((x) => x.label === k) ||
      stages.find((x) =>
        lineItems.some((l) => l.userData && l.label === x.label && (l.category || l.label) === k),
      );
    if (st) st.value += d;
    else stages.push({ label: "User data: " + k, value: d });
  }
  const ciTotal = r.ciTotal + delta;
  const out = {
    ...r,
    lineItems,
    stages,
    ciTotal,
    grossCi: lineItems.filter((x) => x.gPerMj > 0).reduce((a, x) => a + x.gPerMj, 0),
    creditsCi: lineItems.filter((x) => x.gPerMj < 0).reduce((a, x) => a + x.gPerMj, 0),
    annualTonnesCo2e: (ciTotal * r.annualEnergyMj) / 1e6,
  };
  if (Number.isFinite(s.comparator) && s.comparator > 0)
    out.savingPct = ((s.comparator - ciTotal) / s.comparator) * 100;
  if (!Number.isFinite(ciTotal) || !Number.isFinite(out.annualTonnesCo2e))
    return { errors: ["Overrides exceed the supported numeric range."] };
  if (Number.isFinite(r.reconciliation))
    out.reconciliation = ciTotal - stages.reduce((a, x) => a + x.value, 0);
  return out;
}

const scopeOf = (l) => (l.category === "Custom emissions" ? l.scope || 1 : CI.scopeOf(l));
// Lifecycle grouping is indicative; signed adjustments are never netted into gross scopes.
function scopeContributions(item) {
  const parts = { 1: 0, 2: 0, 3: 0, adjustments: 0, unallocated: 0 };
  if (item.gPerMj < 0) {
    parts.adjustments = item.gPerMj;
    return parts;
  }
  if (item.scopeParts) {
    for (const [scope, value] of Object.entries(item.scopeParts)) parts[scope] = value;
    return parts;
  }
  parts[scopeOf(item)] = item.gPerMj;
  return parts;
}
function scopeLabel(item) {
  if (item.gPerMj < 0) return "Lifecycle adjustment";
  if (item.scopeParts) {
    const active = Object.entries(item.scopeParts)
      .filter(([, v]) => Math.abs(v) > 1e-12)
      .map(([key]) => key);
    return active.includes("unallocated")
      ? "Unallocated"
      : active.length > 1
        ? "Mixed scopes 1 + 2"
        : "Scope " + (active[0] || 2);
  }
  return "Scope " + scopeOf(item);
}
export {
  __modules,
  CI,
  PROGRAM,
  DAIRY,
  PRESETS,
  DIRECT_FIELDS,
  SOURCES,
  ELECTRICITY_REGIONS,
  newScenario,
  assess,
  assessBase,
  applyOverrides,
  customRows,
  customG,
  G_PER,
  scopeOf,
  scopeLabel,
  scopeContributions,
  changeBasis,
  exportRows,
  MODEL_VERSION,
};
