// Generic lifecycle carbon-intensity (CI) engine for liquid, gaseous and solid
// biofuels, expressed in gCO2e per MJ of finished fuel (LHV), with comparison
// against the major regulatory programs.
//
// Default line items are indicative pathway averages compiled from public
// GREET / CA-GREET, CARB LCFS certified-pathway summaries, EU RED II/III Annex V
// typical values and equivalent program documentation. They are starting points
// for scenario work, not certified pathway scores.

// ---------------------------------------------------------------------------
// Energy / emission sources
// ---------------------------------------------------------------------------

export type SourceId =
  | "electricity"
  | "renewableElectricity"
  | "naturalGas"
  | "propane"
  | "diesel"
  | "gasoline"
  | "fuelOil"
  | "coal"
  | "biomassResidue"
  | "steamNg"
  | "hydrogenSmr"
  | "hydrogenGreen";

export interface SourceDef {
  id: SourceId;
  label: string;
  /** Unit the user enters, per MJ of finished fuel. */
  unit: "kWh" | "MJ";
  /** gCO2e per unit (well-to-use, includes upstream supply chain). */
  factor: number;
  note: string;
}

export type ElectricityRegionId =
  | "usAverage"
  | "california"
  | "oregon"
  | "pacificNorthwestLow"
  | "midwestMiso"
  | "canada"
  | "euAverage"
  | "unitedKingdom"
  | "brazil"
  | "india"
  | "china"
  | "singapore"
  | "onsiteRenewable";

export const ELECTRICITY_REGIONS: { id: ElectricityRegionId; label: string; gPerKwh: number }[] = [
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

export const SOURCES: SourceDef[] = [
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
  { id: "gasoline", label: "Gasoline", unit: "MJ", factor: 94.0, note: "Light equipment and fleet" },
  { id: "fuelOil", label: "Heavy fuel oil", unit: "MJ", factor: 100.5, note: "Boilers and marine haulage" },
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

export const SOURCE_BY_ID: Record<SourceId, SourceDef> = Object.fromEntries(
  SOURCES.map((s) => [s.id, s]),
) as Record<SourceId, SourceDef>;

// ---------------------------------------------------------------------------
// Regulatory programs
// ---------------------------------------------------------------------------

export type BenchmarkFuel = "gasoline" | "diesel" | "jet" | "marine" | "heat";

export type ProgramId =
  | "carbLcfs"
  | "oregonCfp"
  | "washingtonCfs"
  | "canadaCfr"
  | "euRed3"
  | "ukRtfo"
  | "usRfs"
  | "renovabio"
  | "corsia"
  | "fuelEuMaritime";

export interface ProgramDef {
  id: ProgramId;
  label: string;
  jurisdiction: string;
  /** Comparator / benchmark CI in gCO2e/MJ by displaced fuel. */
  benchmarks: Partial<Record<BenchmarkFuel, number>>;
  /** Minimum GHG saving to qualify, as a fraction, when the program uses a threshold. */
  threshold?: number;
  /** Credit-generating program (deficit and credit accounting in tCO2e). */
  creditMarket: boolean;
  note: string;
}

export const PROGRAMS: ProgramDef[] = [
  {
    id: "carbLcfs",
    label: "California LCFS",
    jurisdiction: "California, United States",
    benchmarks: { gasoline: 79.16, diesel: 79.51, jet: 89.37, marine: 91.0 },
    creditMarket: true,
    note: "Credits equal (benchmark × EER − CI) × fuel energy. Benchmarks tighten every year.",
  },
  {
    id: "oregonCfp",
    label: "Oregon Clean Fuels Program",
    jurisdiction: "Oregon, United States",
    benchmarks: { gasoline: 98.47, diesel: 100.45, jet: 89.37 },
    creditMarket: true,
    note: "2015 baseline carbon intensities; the annual compliance standard steps down from them.",
  },
  {
    id: "washingtonCfs",
    label: "Washington Clean Fuel Standard",
    jurisdiction: "Washington, United States",
    benchmarks: { gasoline: 98.03, diesel: 100.45, jet: 89.37 },
    creditMarket: true,
    note: "2017 baseline carbon intensities with an annual step-down schedule.",
  },
  {
    id: "canadaCfr",
    label: "Canada Clean Fuel Regulations",
    jurisdiction: "Canada",
    benchmarks: { gasoline: 95.0, diesel: 93.0 },
    creditMarket: true,
    note: "Compliance credits are created against the liquid-fossil baseline CI.",
  },
  {
    id: "euRed3",
    label: "EU RED III",
    jurisdiction: "European Union",
    benchmarks: { gasoline: 94.0, diesel: 94.0, jet: 94.0, marine: 94.0, heat: 80.0 },
    threshold: 0.65,
    creditMarket: false,
    note: "Fossil comparator 94 gCO2e/MJ; 65% saving for installations started after 2021.",
  },
  {
    id: "ukRtfo",
    label: "UK RTFO",
    jurisdiction: "United Kingdom",
    benchmarks: { gasoline: 94.1, diesel: 94.1, jet: 94.1 },
    threshold: 0.65,
    creditMarket: true,
    note: "Renewable transport fuel certificates; 65% saving required for new plants.",
  },
  {
    id: "usRfs",
    label: "US Renewable Fuel Standard",
    jurisdiction: "United States",
    benchmarks: { gasoline: 93.08, diesel: 91.87, jet: 91.87 },
    threshold: 0.5,
    creditMarket: false,
    note: "2005 petroleum baselines. 20% saving for renewable fuel, 50% advanced and biomass-based diesel, 60% cellulosic.",
  },
  {
    id: "renovabio",
    label: "Brazil RenovaBio",
    jurisdiction: "Brazil",
    benchmarks: { gasoline: 87.4, diesel: 86.6, jet: 87.5 },
    creditMarket: true,
    note: "CBIO decarbonisation credits are issued on the gap to the fossil reference.",
  },
  {
    id: "corsia",
    label: "ICAO CORSIA",
    jurisdiction: "International aviation",
    benchmarks: { jet: 89.0 },
    threshold: 0.1,
    creditMarket: false,
    note: "Baseline 89 gCO2e/MJ for jet fuel; eligible fuels must save at least 10%.",
  },
  {
    id: "fuelEuMaritime",
    label: "FuelEU Maritime",
    jurisdiction: "European Union shipping",
    benchmarks: { marine: 91.16, diesel: 91.16 },
    creditMarket: false,
    note: "2020 fleet reference intensity 91.16 gCO2e/MJ; a declining % reduction applies each period.",
  },
];

export const PROGRAM_BY_ID: Record<ProgramId, ProgramDef> = Object.fromEntries(
  PROGRAMS.map((p) => [p.id, p]),
) as Record<ProgramId, ProgramDef>;

// ---------------------------------------------------------------------------
// Pathways
// ---------------------------------------------------------------------------

export interface DirectTerms {
  /** Feedstock production: cultivation, fertiliser N2O, collection, rendering. */
  feedstock: number;
  /** Land use change, direct and indirect. */
  landUseChange: number;
  /** Feedstock transport to the plant. */
  feedstockTransport: number;
  /** Chemicals, catalysts, enzymes, methanol, process fugitives. */
  processNonEnergy: number;
  /** Co-product and avoided-emission credits, entered as a negative number. */
  coProductCredit: number;
  /** Finished fuel transport, storage, blending and dispensing. */
  distribution: number;
  /** Tailpipe / end-use CH4 and N2O plus any fossil carbon in the fuel. */
  endUse: number;
}

export interface PathwayDef {
  id: string;
  label: string;
  group: string;
  benchmarkFuel: BenchmarkFuel;
  /** Energy economy ratio versus the displaced fossil fuel (LCFS-style programs). */
  eer: number;
  /** MJ per unit of fuel, for volume conversion. */
  energyPerUnit: number;
  unitLabel: string;
  summary: string;
  direct: DirectTerms;
  /** Quantity of each energy source per MJ of finished fuel (kWh or MJ). */
  energy: Partial<Record<SourceId, number>>;
}

const d = (o: Partial<DirectTerms>): DirectTerms => ({
  feedstock: 0,
  landUseChange: 0,
  feedstockTransport: 0,
  processNonEnergy: 0,
  coProductCredit: 0,
  distribution: 0,
  endUse: 0,
  ...o,
});

export const PATHWAYS: PathwayDef[] = [
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
    summary: "Electricity is the dominant term; switch the source below to compare grid and PPA power.",
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
    direct: d({ feedstock: 3, feedstockTransport: 4, processNonEnergy: 1, distribution: 6, endUse: 0.8 }),
    energy: { biomassResidue: 0.35, electricity: 0.02, naturalGas: 0.02 },
  },
];

export const PATHWAY_BY_ID: Record<string, PathwayDef> = Object.fromEntries(
  PATHWAYS.map((p) => [p.id, p]),
);

const FALLBACK_PATHWAY = PATHWAY_BY_ID["ethanol-corn"] as PathwayDef;

// ---------------------------------------------------------------------------
// Scenario and results
// ---------------------------------------------------------------------------

export interface ScenarioInputs {
  pathwayId: string;
  region: ElectricityRegionId;
  /** Selected feedstock source, drives the feedstock, land use and transport terms. */
  feedstockId: string;
  /** Selected supply variant for each process energy source. */
  sourceVariants: Partial<Record<SourceId, string>>;
  direct: DirectTerms;
  energy: Partial<Record<SourceId, number>>;
  /** Annual production in the pathway's own unit (gallons, MJ, kg, tonnes). */
  annualVolume: number;
}

export interface LineItem {
  key: string;
  label: string;
  category: "Feedstock and land" | "Process energy" | "Process other" | "Distribution and use" | "Credits";
  gPerMj: number;
  detail?: string;
}

export interface ProgramResult {
  program: ProgramDef;
  benchmark: number | null;
  eer: number;
  savingPct: number | null;
  meetsThreshold: boolean | null;
  /** gCO2e/MJ of credit (positive) or deficit (negative). */
  gapPerMj: number | null;
  annualCreditsTonnes: number | null;
}

export interface ScenarioResult {
  pathway: PathwayDef;
  lineItems: LineItem[];
  ciTotal: number;
  grossCi: number;
  creditsCi: number;
  annualEnergyMj: number;
  annualTonnesCo2e: number;
  programs: ProgramResult[];
}

export function scenarioFromPathway(pathwayId: string, region: ElectricityRegionId): ScenarioInputs {
  const p = PATHWAY_BY_ID[pathwayId] ?? FALLBACK_PATHWAY;
  const variants: Partial<Record<SourceId, string>> = {};
  for (const s of SOURCES) {
    const first = SOURCE_VARIANTS[s.id]?.[0];
    if (first) variants[s.id] = first.id;
  }
  return {
    pathwayId: p.id,
    region,
    feedstockId: PATHWAY_FEEDSTOCK[p.id] ?? "custom",
    sourceVariants: variants,
    direct: { ...p.direct },
    energy: { ...p.energy },
    annualVolume:
      p.unitLabel === "MJ" ? 2_000_000_000 : p.unitLabel === "tonne" ? 500_000 : p.unitLabel === "kg" ? 10_000_000 : 50_000_000,
  };
}

/** Apply a feedstock choice to the feedstock, land use change and transport terms. */
export function applyFeedstock(inputs: ScenarioInputs, feedstockId: string): ScenarioInputs {
  const f = FEEDSTOCK_BY_ID[feedstockId];
  if (!f || f.id === "custom") return { ...inputs, feedstockId };
  return {
    ...inputs,
    feedstockId,
    direct: {
      ...inputs.direct,
      feedstock: f.feedstock,
      landUseChange: f.landUseChange,
      feedstockTransport: f.feedstockTransport,
    },
  };
}

export const DIRECT_FIELDS: { key: keyof DirectTerms; label: string; category: LineItem["category"]; hint: string }[] = [
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

export function calculateScenario(input: ScenarioInputs): ScenarioResult {
  const pathway = PATHWAY_BY_ID[input.pathwayId] ?? FALLBACK_PATHWAY;
  const regionFactor =
    ELECTRICITY_REGIONS.find((r) => r.id === input.region)?.gPerKwh ?? 386;

  const lineItems: LineItem[] = [];

  for (const f of DIRECT_FIELDS) {
    const v = Number(input.direct[f.key]) || 0;
    if (v === 0) continue;
    lineItems.push({ key: f.key, label: f.label, category: f.category, gPerMj: v, detail: f.hint });
  }

  for (const s of SOURCES) {
    const qty = Number(input.energy[s.id]) || 0;
    if (qty === 0) continue;
    const variant = (SOURCE_VARIANTS[s.id] ?? []).find(
      (v) => v.id === input.sourceVariants?.[s.id],
    );
    const factor =
      s.id === "electricity" ? regionFactor : (variant?.factor ?? s.factor);
    lineItems.push({
      key: s.id,
      label: variant && s.id !== "electricity" ? `${s.label} — ${variant.label}` : s.label,
      category: "Process energy",
      gPerMj: qty * factor,
      detail: `${qty} ${s.unit}/MJ × ${factor.toFixed(1)} gCO2e/${s.unit}`,
    });
  }

  const ciTotal = lineItems.reduce((a, l) => a + l.gPerMj, 0);
  const grossCi = lineItems.filter((l) => l.gPerMj > 0).reduce((a, l) => a + l.gPerMj, 0);
  const creditsCi = lineItems.filter((l) => l.gPerMj < 0).reduce((a, l) => a + l.gPerMj, 0);

  const annualEnergyMj = Math.max(0, input.annualVolume) * pathway.energyPerUnit;

  const programs: ProgramResult[] = PROGRAMS.map((program) => {
    const benchmark = program.benchmarks[pathway.benchmarkFuel] ?? null;
    if (benchmark == null) {
      return {
        program,
        benchmark: null,
        eer: pathway.eer,
        savingPct: null,
        meetsThreshold: null,
        gapPerMj: null,
        annualCreditsTonnes: null,
      };
    }
    const eer = program.creditMarket ? pathway.eer : 1;
    const adjusted = benchmark * eer;
    const gapPerMj = adjusted - ciTotal;
    const savingPct = ((benchmark - ciTotal / eer) / benchmark) * 100;
    return {
      program,
      benchmark,
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
    annualEnergyMj,
    annualTonnesCo2e: (ciTotal * annualEnergyMj) / 1_000_000,
    programs,
  };
}

// ---------------------------------------------------------------------------
// Feedstock sources
// ---------------------------------------------------------------------------

export interface FeedstockDef {
  id: string;
  label: string;
  group: string;
  /** gCO2e/MJ contributions applied when the feedstock is selected. */
  feedstock: number;
  landUseChange: number;
  feedstockTransport: number;
  note: string;
}

export const FEEDSTOCKS: FeedstockDef[] = [
  { id: "corn", label: "Corn grain", group: "Starch and sugar crops", feedstock: 26, landUseChange: 7.6, feedstockTransport: 2.2, note: "Cultivation, fertiliser N2O and grain haulage" },
  { id: "sugarcane", label: "Sugarcane", group: "Starch and sugar crops", feedstock: 16, landUseChange: 8, feedstockTransport: 2, note: "Cane growing, burning-free harvest and short haul" },
  { id: "sugarbeet", label: "Sugar beet", group: "Starch and sugar crops", feedstock: 18, landUseChange: 5, feedstockTransport: 2, note: "European beet cultivation" },
  { id: "wheat", label: "Wheat and other grains", group: "Starch and sugar crops", feedstock: 25, landUseChange: 8, feedstockTransport: 2.5, note: "Grain cultivation with fertiliser N2O" },
  { id: "cassava", label: "Cassava", group: "Starch and sugar crops", feedstock: 20, landUseChange: 10, feedstockTransport: 3, note: "Tropical root crop" },
  { id: "soy", label: "Soybean oil", group: "Vegetable oils", feedstock: 20, landUseChange: 8, feedstockTransport: 2, note: "Farming plus crush, meal credit taken separately" },
  { id: "canola", label: "Canola / rapeseed oil", group: "Vegetable oils", feedstock: 25, landUseChange: 10, feedstockTransport: 2, note: "Higher fertiliser demand than soy" },
  { id: "palm", label: "Palm oil", group: "Vegetable oils", feedstock: 18, landUseChange: 25, feedstockTransport: 4, note: "Land use change dominates unless deforestation-free" },
  { id: "corn-oil", label: "Distillers corn oil", group: "Wastes and residues", feedstock: 2, landUseChange: 0, feedstockTransport: 2, note: "Ethanol plant co-product, low burden" },
  { id: "uco", label: "Used cooking oil", group: "Wastes and residues", feedstock: 0, landUseChange: 0, feedstockTransport: 3, note: "Zero burden at the collection point" },
  { id: "tallow", label: "Tallow and animal fats", group: "Wastes and residues", feedstock: 6, landUseChange: 0, feedstockTransport: 3, note: "Rendering energy allocated to the fat" },
  { id: "stover", label: "Corn stover", group: "Agricultural residues", feedstock: 8, landUseChange: 0, feedstockTransport: 3, note: "Collection, nutrient replacement and baling" },
  { id: "straw", label: "Wheat straw", group: "Agricultural residues", feedstock: 7, landUseChange: 0, feedstockTransport: 3, note: "Baling and field collection" },
  { id: "bagasse", label: "Sugarcane bagasse", group: "Agricultural residues", feedstock: 2, landUseChange: 0, feedstockTransport: 1, note: "Available at the mill gate" },
  { id: "miscanthus", label: "Energy grasses (miscanthus, switchgrass)", group: "Energy crops", feedstock: 10, landUseChange: -2, feedstockTransport: 3, note: "Soil carbon gain can offset land use change" },
  { id: "forest-residue", label: "Forest residue and slash", group: "Woody biomass", feedstock: 3, landUseChange: 0, feedstockTransport: 4, note: "Harvest residue collection and chipping" },
  { id: "mill-residue", label: "Sawmill and wood processing residue", group: "Woody biomass", feedstock: 2, landUseChange: 0, feedstockTransport: 3, note: "Sawdust, shavings and bark" },
  { id: "urban-wood", label: "Urban and construction wood waste", group: "Woody biomass", feedstock: 2, landUseChange: 0, feedstockTransport: 3, note: "Diverted from landfill" },
  { id: "msw", label: "Municipal solid waste (biogenic fraction)", group: "Wastes and residues", feedstock: 1, landUseChange: 0, feedstockTransport: 2, note: "Sorting and preparation" },
  { id: "landfill-gas", label: "Landfill gas", group: "Gaseous feedstocks", feedstock: 0, landUseChange: 0, feedstockTransport: 0, note: "Captured at the site of generation" },
  { id: "manure", label: "Dairy and swine manure", group: "Gaseous feedstocks", feedstock: 0, landUseChange: 0, feedstockTransport: 1, note: "Avoided lagoon methane handled as a credit" },
  { id: "sludge", label: "Wastewater sludge", group: "Gaseous feedstocks", feedstock: 0, landUseChange: 0, feedstockTransport: 0.5, note: "Municipal digester gas" },
  { id: "water-power", label: "Water and renewable power (electrolysis)", group: "Gaseous feedstocks", feedstock: 0, landUseChange: 0, feedstockTransport: 0, note: "Electricity is the dominant input" },
  { id: "custom", label: "Custom / site-specific", group: "Other", feedstock: 0, landUseChange: 0, feedstockTransport: 0, note: "Keeps whatever values you typed in" },
];

export const FEEDSTOCK_BY_ID: Record<string, FeedstockDef> = Object.fromEntries(
  FEEDSTOCKS.map((f) => [f.id, f]),
);

export const PATHWAY_FEEDSTOCK: Record<string, string> = {
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
};

// ---------------------------------------------------------------------------
// Supply variants for each process energy source
// ---------------------------------------------------------------------------

export interface SourceVariant {
  id: string;
  label: string;
  /** gCO2e per unit of the parent source (kWh or MJ). */
  factor: number;
}

export const SOURCE_VARIANTS: Record<SourceId, SourceVariant[]> = {
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

export interface UnitOption {
  id: string;
  label: string;
  /** Multiply an entered quantity by this to get the source base unit. */
  toBase: number;
}

export const UNIT_OPTIONS: Record<"kWh" | "MJ", UnitOption[]> = {
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

export interface CiUnit {
  id: string;
  label: string;
  /** Multiply a gCO2e/MJ value by this to display it in the chosen unit. */
  factor: number;
  decimals: number;
}

export const CI_UNITS: CiUnit[] = [
  { id: "g-mj", label: "gCO2e / MJ", factor: 1, decimals: 2 },
  { id: "kg-gj", label: "kgCO2e / GJ", factor: 1, decimals: 2 },
  { id: "g-mmbtu", label: "gCO2e / MMBtu", factor: 1055.06, decimals: 0 },
  { id: "kg-mmbtu", label: "kgCO2e / MMBtu", factor: 1.05506, decimals: 2 },
  { id: "g-kwh", label: "gCO2e / kWh", factor: 3.6, decimals: 2 },
];

export const CI_UNIT_BY_ID: Record<string, CiUnit> = Object.fromEntries(
  CI_UNITS.map((u) => [u.id, u]),
);

export interface MassUnit {
  id: string;
  label: string;
  /** Multiply a tonne value by this. */
  factor: number;
}

export const MASS_UNITS: MassUnit[] = [
  { id: "t", label: "tonnes CO2e", factor: 1 },
  { id: "kt", label: "kilotonnes CO2e", factor: 0.001 },
  { id: "mt", label: "million tonnes CO2e", factor: 0.000001 },
  { id: "shortton", label: "short tons CO2e", factor: 1.10231 },
];
