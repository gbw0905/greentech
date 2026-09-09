// Carbon intensity (CI) model for forest-residue pyrolysis to renewable
// diesel / renewable gasoline, ported from the OSU + NREL CI calculator
// workbook (Oregon Clean Fuels Program draft 0.2, co-product allocation).
//
// All factors below come from that workbook's "Emission & Conversion Factors"
// and "NREL & OSU Energy Data" sheets. Results are reported as gCO2e/MJ of
// finished fuel after energy allocation between fuel and biochar.

export type TreePart = "<3cm" | "NREL Mix";
export type FeedstockSize = 0.5 | 2;
export type FuelType =
  | "Renewable Diesel"
  | "Renewable Gasoline"
  | "Renewable Diesel + Renewable Gasoline";
export type DryingEnergy = "Electricity" | "Natural Gas";
export type ElectricityMix =
  | "High CI-Oregon Statewide Electricity Mix"
  | "Low CI- Salem Electricity Mix";

export interface CiInputs {
  /** Annual forest residue supply, green US tons. */
  greenTons: number;
  /** Supply multiplier applied to the annual supply. */
  supplyMultiplier: number;
  /** Share of Douglas fir, 0-1 (Red alder is the remainder). */
  douglasFirShare: number;
  /** Moisture content of the residues, %. */
  moisturePct: number;
  treePart: TreePart;
  feedstockSizeMm: FeedstockSize;
  fuelType: FuelType;
  dryingEnergy: DryingEnergy;
  electricityMix: ElectricityMix;
  /** Round trip forest -> bio-refinery, miles. */
  forestToRefineryMiles: number;
  /** Round trip refinery -> wholesaler, miles. */
  refineryToWholesalerMiles: number;
}

export const DEFAULT_CI_INPUTS: CiInputs = {
  greenTons: 142069,
  supplyMultiplier: 1,
  douglasFirShare: 0.5,
  moisturePct: 33,
  treePart: "<3cm",
  feedstockSizeMm: 0.5,
  fuelType: "Renewable Diesel + Renewable Gasoline",
  dryingEnergy: "Electricity",
  electricityMix: "High CI-Oregon Statewide Electricity Mix",
  forestToRefineryMiles: 234,
  refineryToWholesalerMiles: 120,
};

// --- conversion constants -------------------------------------------------
const MJ_PER_MMBTU = 1055.05585;
const MMBTU_PER_MJ = 0.0009478171226670133;
const MJ_PER_KWH = 3.6;
const KG_PER_US_TON = 907.185;
const MJ_PER_GAL_DIESEL = 135.5219239325; // non-road / conventional diesel
const MJ_PER_GGE_RD = 123.50378274514999; // renewable diesel energy density

// --- global warming potentials -------------------------------------------
const GWP = { CO2: 1, CH4: 25, N2O: 298, VOC: 3.1166666666666667, CO: 1.5714285714285714 };

// --- emission factors, g per MJ: [VOC, CO, CH4, N2O, CO2] -----------------
type Ef = { voc: number; co: number; ch4: number; n2o: number; co2: number };

const EF_DIESEL_STATIONARY: Ef = {
  voc: 0.03933441059068105,
  co: 0.18966768441689605,
  ch4: 0.0005971247827606742,
  n2o: 0.000871991768672057,
  co2: 73.69611767097679,
};

const EF_DIESEL_TRUCK: Ef = {
  voc: 0.021826431577766592,
  co: 0.08918564354222147,
  ch4: 0.024972195655114986,
  n2o: 0.00010773164648453401,
  co2: 73.84155311061399,
};

const EF_NATURAL_GAS: Ef = {
  voc: 0.0010009478672985783,
  co: 0.03913364928909953,
  ch4: 0.0010009478672985783,
  n2o: 0.0000966824644549763,
  co2: 56.247970677890656,
};

const EF_ELECTRICITY_BASE = {
  voc: 0.0023647822935234705,
  co: 0.025768610219845507,
  ch4: 0.0018716996434937608,
  n2o: 0.0016790236482471775,
};

/** Oregon CFP 2024 electricity carbon intensities, gCO2/MJ. */
export const ELECTRICITY_CI: Record<ElectricityMix, number> = {
  "High CI-Oregon Statewide Electricity Mix": 96.23,
  "Low CI- Salem Electricity Mix": 6.19,
};

// --- equipment intensities (NREL & OSU Energy Data) -----------------------
const EQUIP = {
  dumpTruckGreenTonsPerGal: 10,
  excavatorGalPerHour: 8,
  excavatorTonsPerHour: 37.538,
  grinderGalPerHour: 40,
  grinderTonsPerHour: 80,
  loaderGalPerHour: 8,
  loaderTonsPerHour: 48.34,
  truckMpg: 6.9,
  possumBellyVolumeFt3: 4000,
  dryBulkDensityLbPerFt3: 13,
  reclaimerKwhPerGreenTon: 0.0221,
  conveyorKwhPerGreenTon: 0.0373,
  dryerKwhPerGreenTon: 415,
  dryerMmbtuPerGreenTon: 2.56,
  rotaryShearKwhPerDryTon: 120,
  pyrolyzerDieselBtuPerMmbtu: 1990,
  pyrolyzerNgBtuPerMmbtu: 3196,
  pyrolyzerMjPerKgFeedstock: 1.76,
  postNgBtuPerMmbtu: 399546,
  postElectricityBtuPerMmbtu: 15547,
  tankerGallons: 6000,
  biocharBtuPerTon: 18916910.5715716,
};

// --- species yields -------------------------------------------------------
function fuelYield(fuelType: FuelType) {
  if (fuelType === "Renewable Diesel") return { df: 0.044, ra: 0.05 };
  if (fuelType === "Renewable Gasoline") return { df: 0.04, ra: 0.033 };
  return { df: 0.042, ra: 0.0415 };
}

function fuelDensityGramsPerGal(fuelType: FuelType) {
  if (fuelType === "Renewable Diesel") return 2835;
  if (fuelType === "Renewable Gasoline") return 2830;
  return (2835 + 2830) / 2;
}

function biocharYield(treePart: TreePart, size: FeedstockSize) {
  if (treePart === "NREL Mix") return size === 0.5 ? { df: 0.19, ra: 0.17 } : { df: 0.2, ra: 0.19 };
  return size === 0.5 ? { df: 0.18, ra: 0.16 } : { df: 0.22, ra: 0.2 };
}

// --- results --------------------------------------------------------------
export interface StageResult {
  stage: string;
  energyMj: number;
  gCo2e: number;
  gCo2ePerMj: number;
  sharePct: number;
}

export interface CiResult {
  stages: StageResult[];
  ciTotal: number;
  fuelGallons: number;
  fuelGge: number;
  fuelEnergyMj: number;
  biocharTons: number;
  biocharEnergyMj: number;
  allocationFuel: number;
  allocationBiochar: number;
  dryTons: number;
  greenTons: number;
  fuelYieldGgePerDryTon: number;
  totalEnergyMj: number;
  reductionVsDiesel: number;
  scenarioLabel: string;
}

/** Diesel comparison baseline used by the Oregon Clean Fuels Program (gCO2e/MJ). */
export const CFP_DIESEL_BASELINE = 100.45;

interface Burn {
  stage: string;
  mj: number;
  ef: Ef;
}

export function calculateCi(input: CiInputs): CiResult {
  const green = Math.max(0, input.greenTons * input.supplyMultiplier);
  const dfShare = Math.min(1, Math.max(0, input.douglasFirShare));
  const greenDf = green * dfShare;
  const greenRa = green * (1 - dfShare);
  const mc = Math.min(95, Math.max(0, input.moisturePct)) / 100;
  const dryDf = greenDf * (1 - mc);
  const dryRa = greenRa * (1 - mc);
  const dryTons = dryDf + dryRa;

  const elecCi = ELECTRICITY_CI[input.electricityMix];
  const efElectricity: Ef = { ...EF_ELECTRICITY_BASE, co2: elecCi };

  // Fuel and biochar output
  const fy = fuelYield(input.fuelType);
  const density = fuelDensityGramsPerGal(input.fuelType) / 1000; // kg/gal
  const gallonsDf = (dryDf * KG_PER_US_TON * fy.df) / density;
  const gallonsRa = (dryRa * KG_PER_US_TON * fy.ra) / density;
  const fuelGallons = gallonsDf + gallonsRa;
  const fuelGge = fuelGallons * 1.14;
  const fuelEnergyMj = fuelGge * MJ_PER_GGE_RD;
  const fuelMmbtu = fuelEnergyMj * MMBTU_PER_MJ;

  const by = biocharYield(input.treePart, input.feedstockSizeMm);
  const biocharTons = dryDf * by.df + dryRa * by.ra;
  const biocharEnergyMj =
    ((EQUIP.biocharBtuPerTon * biocharTons) / 1_000_000) * MJ_PER_MMBTU;

  const pyrolysisEnergyMj = fuelEnergyMj + biocharEnergyMj;
  const allocationFuel = pyrolysisEnergyMj > 0 ? fuelEnergyMj / pyrolysisEnergyMj : 0;

  // Truck payload
  const greenBulkDensity = EQUIP.dryBulkDensityLbPerFt3 / (1 - mc);
  const payloadGreenTons = (EQUIP.possumBellyVolumeFt3 * greenBulkDensity) / 2000;

  const gal = {
    dumpTruck: green / EQUIP.dumpTruckGreenTonsPerGal,
    excavator: green * (EQUIP.excavatorGalPerHour / EQUIP.excavatorTonsPerHour),
    grinder: green * (EQUIP.grinderGalPerHour / EQUIP.grinderTonsPerHour),
    loader: green * (EQUIP.loaderGalPerHour / EQUIP.loaderTonsPerHour),
    hauling:
      payloadGreenTons > 0
        ? (dryTons / payloadGreenTons) * (input.forestToRefineryMiles / EQUIP.truckMpg)
        : 0,
    tanker:
      (fuelGge / EQUIP.tankerGallons) * (input.refineryToWholesalerMiles / EQUIP.truckMpg),
  };

  const kwh = {
    reclaimer: green * EQUIP.reclaimerKwhPerGreenTon,
    conveyor: green * EQUIP.conveyorKwhPerGreenTon,
    dryer: input.dryingEnergy === "Electricity" ? green * EQUIP.dryerKwhPerGreenTon : 0,
    rotaryShear: dryTons * EQUIP.rotaryShearKwhPerDryTon,
  };
  const dryerNgMj =
    input.dryingEnergy === "Natural Gas" ? green * EQUIP.dryerMmbtuPerGreenTon * MJ_PER_MMBTU : 0;

  const stageBurns: { stage: string; burns: Burn[] }[] = [
    {
      stage: "Collection and field processing",
      burns: [
        { stage: "Small dump truck", mj: gal.dumpTruck * MJ_PER_GAL_DIESEL, ef: EF_DIESEL_TRUCK },
        { stage: "Excavator", mj: gal.excavator * MJ_PER_GAL_DIESEL, ef: EF_DIESEL_STATIONARY },
        { stage: "Grinder", mj: gal.grinder * MJ_PER_GAL_DIESEL, ef: EF_DIESEL_STATIONARY },
        { stage: "Loader", mj: gal.loader * MJ_PER_GAL_DIESEL, ef: EF_DIESEL_STATIONARY },
      ],
    },
    {
      stage: "Transport to bio-refinery",
      burns: [{ stage: "Heavy duty truck", mj: gal.hauling * MJ_PER_GAL_DIESEL, ef: EF_DIESEL_TRUCK }],
    },
    {
      stage: "Feedstock preprocessing",
      burns: [
        { stage: "Reclaimer", mj: kwh.reclaimer * MJ_PER_KWH, ef: efElectricity },
        { stage: "Conveyor", mj: kwh.conveyor * MJ_PER_KWH, ef: efElectricity },
        { stage: "Dryer (electricity)", mj: kwh.dryer * MJ_PER_KWH, ef: efElectricity },
        { stage: "Dryer (natural gas)", mj: dryerNgMj, ef: EF_NATURAL_GAS },
        { stage: "Rotary shear", mj: kwh.rotaryShear * MJ_PER_KWH, ef: efElectricity },
      ],
    },
    {
      stage: "Fuel conversion (pyrolyzer)",
      burns: [
        {
          stage: "Diesel",
          mj: (EQUIP.pyrolyzerDieselBtuPerMmbtu / 1e6) * fuelMmbtu * MJ_PER_MMBTU,
          ef: EF_DIESEL_STATIONARY,
        },
        {
          stage: "Natural gas (steam methane reforming)",
          mj: (EQUIP.pyrolyzerNgBtuPerMmbtu / 1e6) * fuelMmbtu * MJ_PER_MMBTU,
          ef: EF_NATURAL_GAS,
        },
        {
          stage: "Electricity",
          mj: EQUIP.pyrolyzerMjPerKgFeedstock * dryTons * KG_PER_US_TON,
          ef: efElectricity,
        },
      ],
    },
    {
      stage: "Fuel conversion (post-processing)",
      burns: [
        {
          stage: "Natural gas",
          mj: (EQUIP.postNgBtuPerMmbtu / 1e6) * fuelMmbtu * MJ_PER_MMBTU,
          ef: EF_NATURAL_GAS,
        },
        {
          stage: "Electricity",
          mj: (EQUIP.postElectricityBtuPerMmbtu / 1e6) * fuelMmbtu * MJ_PER_MMBTU,
          ef: efElectricity,
        },
      ],
    },
    {
      stage: "Transport to wholesaler",
      burns: [{ stage: "Oil tanker", mj: gal.tanker * MJ_PER_GAL_DIESEL, ef: EF_DIESEL_TRUCK }],
    },
  ];

  const rows = stageBurns.map(({ stage, burns }) => {
    // The source workbook omits the CO global warming potential in the
    // post-processing row; kept identical so results match the published model.
    const coGwp = stage === "Fuel conversion (post-processing)" ? 1 : GWP.CO;
    let energyMj = 0;
    let gCo2e = 0;
    for (const b of burns) {
      energyMj += b.mj;
      gCo2e +=
        b.mj *
        (b.ef.co2 * GWP.CO2 +
          b.ef.ch4 * GWP.CH4 +
          b.ef.n2o * GWP.N2O +
          b.ef.voc * GWP.VOC +
          b.ef.co * coGwp);
    }
    const gCo2ePerMj = fuelEnergyMj > 0 ? (gCo2e / fuelEnergyMj) * allocationFuel : 0;
    return { stage, energyMj, gCo2e, gCo2ePerMj, sharePct: 0 };
  });

  const ciTotal = rows.reduce((s, r) => s + r.gCo2ePerMj, 0);
  for (const r of rows) r.sharePct = ciTotal > 0 ? (r.gCo2ePerMj / ciTotal) * 100 : 0;

  const scenarioLabel = [
    `DF ${(dfShare * 100).toFixed(0)}%`,
    `RA ${((1 - dfShare) * 100).toFixed(0)}%`,
    `MC ${input.moisturePct}%`,
    input.treePart,
    `${input.feedstockSizeMm} mm`,
    input.dryingEnergy,
    input.electricityMix,
  ].join(" · ");

  return {
    stages: rows,
    ciTotal,
    fuelGallons,
    fuelGge,
    fuelEnergyMj,
    biocharTons,
    biocharEnergyMj,
    allocationFuel,
    allocationBiochar: 1 - allocationFuel,
    dryTons,
    greenTons: green,
    fuelYieldGgePerDryTon: dryTons > 0 ? fuelGge / dryTons : 0,
    totalEnergyMj: rows.reduce((s, r) => s + r.energyMj, 0),
    reductionVsDiesel: ((CFP_DIESEL_BASELINE - ciTotal) / CFP_DIESEL_BASELINE) * 100,
    scenarioLabel,
  };
}
