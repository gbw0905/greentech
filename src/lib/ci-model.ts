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
    direct: d({ feedstock: 3, feedstockTransport: 4, processNonEnergy: 2, distribution: 5, endUse: 0.8 }),
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
    direct: d({ feedstock: 6, feedstockTransport: 3, processNonEnergy: 1, distribution: 3, endUse: 0.8 }),
    energy: { biomassResidue: 0.3, electricity: 0.03 },
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
  /** Optional detailed activity-data modules; enabled ones replace the aggregate terms. */
  detail?: DetailModules;
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
  /** Benchmark after the energy economy ratio is applied (credit programs only). */
  adjustedBenchmark: number | null;
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
  /** Totals of each detailed module, whether or not it is enabled. */
  moduleTotals: Partial<Record<DetailModuleKey, number>>;
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
    detail: defaultDetailModules(),
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
  const detail = input.detail;
  const moduleTotals: Partial<Record<DetailModuleKey, number>> = {};

  const moduleRows: Partial<Record<DetailModuleKey, DetailRow[]>> = {};
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

  const categoryOf = (key: keyof DirectTerms) =>
    DIRECT_FIELDS.find((f) => f.key === key)!.category;

  for (const f of DIRECT_FIELDS) {
    const moduleKey = (Object.keys(MODULE_TO_DIRECT) as DetailModuleKey[]).find(
      (k) => MODULE_TO_DIRECT[k] === f.key,
    );
    const mod = moduleKey && detail ? detail[moduleKey] : undefined;
    if (mod?.enabled && moduleKey && moduleKey !== "distribution") {
      for (const r of moduleRows[moduleKey] ?? []) {
        if (r.gPerMj === 0) continue;
        lineItems.push({ key: r.key, label: r.label, category: f.category, gPerMj: r.gPerMj, detail: r.detail });
      }
      continue;
    }
    if (moduleKey === "distribution" && detail?.distribution.enabled) continue;
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

  // Distribution runs last so loss terms can carry the upstream carbon intensity.
  if (detail) {
    const upstream = lineItems.reduce((a, l) => a + l.gPerMj, 0);
    const ds = computeDistribution(detail.distribution, upstream);
    moduleTotals.distribution = ds.gPerMj;
    if (detail.distribution.enabled) {
      for (const r of ds.rows) {
        if (r.gPerMj === 0) continue;
        lineItems.push({
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
    detail?.coProducts.enabled && detail.coProducts.allocationPct < 100
      ? Math.max(0, Math.min(100, detail.coProducts.allocationPct)) / 100
      : 1;
  if (allocation < 1) {
    for (const l of lineItems) {
      if (l.gPerMj > 0) l.gPerMj *= allocation;
    }
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
    moduleTotals,
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

// ---------------------------------------------------------------------------
// Detailed lifecycle modules
// ---------------------------------------------------------------------------
// Each module lets the user build one of the aggregate DirectTerms values from
// physical activity data. When a module is enabled its computed total replaces
// the corresponding aggregate term and every sub-item appears as its own line.

export interface DetailRow {
  key: string;
  label: string;
  gPerMj: number;
  detail: string;
}

export interface ModuleResult {
  gPerMj: number;
  rows: DetailRow[];
}

/** Emission factors used by the detailed modules. */
export const DETAIL_FACTORS = {
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
} as const;

// --- Feedstock production ---------------------------------------------------

export interface FeedstockProductionInputs {
  enabled: boolean;
  /** MJ of finished fuel produced per tonne of feedstock delivered. */
  yieldMjPerTonne: number;
  cultivationDieselL: number;
  cultivationElectricityKwh: number;
  nitrogenKg: number;
  n2oEmissionFactor: number; // fraction of applied N lost as N2O-N
  phosphateKg: number;
  potashKg: number;
  limeKg: number;
  pesticideKg: number;
  seedKg: number;
  irrigationElectricityKwh: number;
  collectionDieselL: number;
  renderingGasMj: number;
  renderingElectricityKwh: number;
  dryingGasMj: number;
  soilCarbonKgPerTonne: number; // negative = sequestration
}

export const DEFAULT_FEEDSTOCK_PRODUCTION: FeedstockProductionInputs = {
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

export function computeFeedstockProduction(
  f: FeedstockProductionInputs,
  gridFactor: number,
): ModuleResult {
  const yieldMj = Math.max(1e-6, f.yieldMjPerTonne);
  const per = (gPerTonne: number) => gPerTonne / yieldMj;
  const fieldN2o =
    f.nitrogenKg * f.n2oEmissionFactor * (44 / 28) * DETAIL_FACTORS.n2oGwp * 1000;
  const items: [string, string, number, string][] = [
    ["cultivationDiesel", "Cultivation and harvest diesel", f.cultivationDieselL * DETAIL_FACTORS.dieselPerLitre, `${f.cultivationDieselL} L/t × 3.72 kg/L`],
    ["cultivationElectricity", "Cultivation electricity", f.cultivationElectricityKwh * gridFactor, `${f.cultivationElectricityKwh} kWh/t × ${gridFactor} g/kWh`],
    ["nitrogen", "Nitrogen fertiliser manufacture", f.nitrogenKg * DETAIL_FACTORS.nitrogenPerKg, `${f.nitrogenKg} kg N/t × 4.0 kg/kg`],
    ["fieldN2o", "Field N2O from applied nitrogen", fieldN2o, `${(f.n2oEmissionFactor * 100).toFixed(2)}% of N as N2O-N, GWP 273`],
    ["phosphate", "Phosphate fertiliser", f.phosphateKg * DETAIL_FACTORS.phosphatePerKg, `${f.phosphateKg} kg P2O5/t`],
    ["potash", "Potash fertiliser", f.potashKg * DETAIL_FACTORS.potashPerKg, `${f.potashKg} kg K2O/t`],
    ["lime", "Lime application", f.limeKg * DETAIL_FACTORS.limePerKg, `${f.limeKg} kg/t × 0.44 kg/kg`],
    ["pesticide", "Pesticide and herbicide", f.pesticideKg * DETAIL_FACTORS.pesticidePerKg, `${f.pesticideKg} kg/t × 20 kg/kg`],
    ["seed", "Seed and planting material", f.seedKg * DETAIL_FACTORS.seedPerKg, `${f.seedKg} kg/t`],
    ["irrigation", "Irrigation pumping", f.irrigationElectricityKwh * gridFactor, `${f.irrigationElectricityKwh} kWh/t`],
    ["collection", "Collection, baling and handling", f.collectionDieselL * DETAIL_FACTORS.dieselPerLitre, `${f.collectionDieselL} L diesel/t`],
    ["renderingGas", "Rendering heat (natural gas)", f.renderingGasMj * DETAIL_FACTORS.naturalGasPerMj, `${f.renderingGasMj} MJ/t`],
    ["renderingElectricity", "Rendering electricity", f.renderingElectricityKwh * gridFactor, `${f.renderingElectricityKwh} kWh/t`],
    ["dryingGas", "Feedstock drying", f.dryingGasMj * DETAIL_FACTORS.naturalGasPerMj, `${f.dryingGasMj} MJ/t`],
    ["soilCarbon", "Soil carbon change", f.soilCarbonKgPerTonne * 1000, `${f.soilCarbonKgPerTonne} kgCO2e/t`],
  ];
  const rows = items
    .filter(([, , g]) => g !== 0)
    .map(([key, label, g, detail]) => ({ key: `fp-${key}`, label, gPerMj: per(g), detail }));
  return { gPerMj: rows.reduce((a, r) => a + r.gPerMj, 0), rows };
}

// --- Transport --------------------------------------------------------------

export type TransportModeId =
  | "truckHeavy"
  | "truckSmall"
  | "truckRefrigerated"
  | "rail"
  | "barge"
  | "oceanTanker"
  | "oceanBulk"
  | "pipelineLiquid"
  | "pipelineGas";

export const TRANSPORT_MODES: { id: TransportModeId; label: string; gPerTonneKm: number }[] = [
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

export const TRANSPORT_MODE_BY_ID: Record<TransportModeId, { id: TransportModeId; label: string; gPerTonneKm: number }> =
  Object.fromEntries(TRANSPORT_MODES.map((m) => [m.id, m])) as Record<
    TransportModeId,
    { id: TransportModeId; label: string; gPerTonneKm: number }
  >;

export interface TransportLeg {
  id: string;
  label: string;
  mode: TransportModeId;
  distanceKm: number;
  /** Share of the mass that travels this leg, 0-100. */
  sharePct: number;
  /** Multiplier for empty return running, 1 = none. */
  emptyReturn: number;
}

export interface TransportInputs {
  enabled: boolean;
  /** Tonnes of feedstock moved per GJ of finished fuel. */
  tonnesPerGj: number;
  legs: TransportLeg[];
}

export const DEFAULT_TRANSPORT: TransportInputs = {
  enabled: false,
  tonnesPerGj: 0.1,
  legs: [
    { id: "leg1", label: "Field or collection to depot", mode: "truckSmall", distanceKm: 50, sharePct: 100, emptyReturn: 1.2 },
    { id: "leg2", label: "Depot to plant", mode: "truckHeavy", distanceKm: 150, sharePct: 100, emptyReturn: 1.15 },
  ],
};

function legRows(legs: TransportLeg[], tonnesPerGj: number, prefix: string): DetailRow[] {
  return legs
    .map((leg) => {
      const mode = TRANSPORT_MODE_BY_ID[leg.mode] ?? TRANSPORT_MODES[0]!;
      const tkmPerGj = tonnesPerGj * leg.distanceKm * (leg.sharePct / 100) * (leg.emptyReturn || 1);
      return {
        key: `${prefix}-${leg.id}`,
        label: leg.label || mode.label,
        gPerMj: (tkmPerGj * mode.gPerTonneKm) / 1000,
        detail: `${mode.label} · ${leg.distanceKm} km · ${leg.sharePct}% of mass · ${mode.gPerTonneKm} g/t-km`,
      };
    })
    .filter((r) => r.gPerMj !== 0);
}

export function computeTransport(t: TransportInputs): ModuleResult {
  const rows = legRows(t.legs, t.tonnesPerGj, "tr");
  return { gPerMj: rows.reduce((a, r) => a + r.gPerMj, 0), rows };
}

// --- Chemicals and fugitives -------------------------------------------------

export interface ChemicalItem {
  id: string;
  label: string;
  /** kg of chemical per tonne of finished fuel. */
  kgPerTonneFuel: number;
  /** gCO2e per kg of the chemical. */
  gPerKg: number;
}

export interface ChemicalsInputs {
  enabled: boolean;
  /** Tonnes of finished fuel per GJ, used to convert chemical doses. */
  fuelTonnesPerGj: number;
  items: ChemicalItem[];
  /** Fugitive methane released per tonne of finished fuel. */
  fugitiveCh4KgPerTonne: number;
  /** Fugitive nitrous oxide released per tonne of finished fuel. */
  fugitiveN2oKgPerTonne: number;
  /** Vented or flared process CO2 per tonne of finished fuel. */
  ventedCo2KgPerTonne: number;
  /** Captured and stored CO2 per tonne of finished fuel, entered positive. */
  capturedCo2KgPerTonne: number;
}

export const CHEMICAL_PRESETS: { id: string; label: string; gPerKg: number }[] = [
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

export const DEFAULT_CHEMICALS: ChemicalsInputs = {
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

export function computeChemicals(c: ChemicalsInputs): ModuleResult {
  // 1 tonne of fuel carries 1 / fuelTonnesPerGj GJ, so MJ per tonne of fuel:
  const mjPerTonneFuel = 1000 / Math.max(1e-9, c.fuelTonnesPerGj);
  const per = (gPerTonneFuel: number) => gPerTonneFuel / mjPerTonneFuel;
  const rows: DetailRow[] = [];
  for (const item of c.items) {
    const g = item.kgPerTonneFuel * item.gPerKg;
    if (g === 0) continue;
    rows.push({
      key: `chem-${item.id}`,
      label: item.label || "Chemical input",
      gPerMj: per(g),
      detail: `${item.kgPerTonneFuel} kg/t fuel × ${item.gPerKg} gCO2e/kg`,
    });
  }
  const extras: [string, string, number, string][] = [
    ["ch4", "Fugitive methane", c.fugitiveCh4KgPerTonne * DETAIL_FACTORS.ch4Gwp * 1000, `${c.fugitiveCh4KgPerTonne} kg CH4/t fuel × GWP 29.8`],
    ["n2o", "Fugitive nitrous oxide", c.fugitiveN2oKgPerTonne * DETAIL_FACTORS.n2oGwp * 1000, `${c.fugitiveN2oKgPerTonne} kg N2O/t fuel × GWP 273`],
    ["vent", "Vented or flared process CO2", c.ventedCo2KgPerTonne * 1000, `${c.ventedCo2KgPerTonne} kg CO2/t fuel`],
    ["ccs", "Carbon captured and stored", -c.capturedCo2KgPerTonne * 1000, `${c.capturedCo2KgPerTonne} kg CO2/t fuel stored`],
  ];
  for (const [key, label, g, detail] of extras) {
    if (g === 0) continue;
    rows.push({ key: `chem-${key}`, label, gPerMj: per(g), detail });
  }
  return { gPerMj: rows.reduce((a, r) => a + r.gPerMj, 0), rows };
}

// --- Co-products and avoided emissions ---------------------------------------

export interface CoProductItem {
  id: string;
  label: string;
  /** kg of co-product per tonne of finished fuel. */
  kgPerTonneFuel: number;
  /** gCO2e avoided per kg of co-product (displacement credit). */
  gPerKg: number;
}

export interface CoProductInputs {
  enabled: boolean;
  fuelTonnesPerGj: number;
  items: CoProductItem[];
  /** Surplus electricity exported, kWh per MJ of fuel. */
  exportedElectricityKwhPerMj: number;
  /** Credit applied to exported power, gCO2e per kWh displaced. */
  exportedElectricityCreditPerKwh: number;
  /** Avoided methane from manure or landfill, gCO2e/MJ, entered positive. */
  avoidedMethaneGPerMj: number;
  /** Energy allocation to the fuel, 0-100. 100 keeps the full burden on the fuel. */
  allocationPct: number;
}

export const COPRODUCT_PRESETS: { id: string; label: string; gPerKg: number }[] = [
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

export const DEFAULT_COPRODUCTS: CoProductInputs = {
  enabled: false,
  fuelTonnesPerGj: 0.0234,
  items: [{ id: "cp1", label: "DDGS animal feed", kgPerTonneFuel: 900, gPerKg: 500 }],
  exportedElectricityKwhPerMj: 0,
  exportedElectricityCreditPerKwh: 386,
  avoidedMethaneGPerMj: 0,
  allocationPct: 100,
};

export function computeCoProducts(c: CoProductInputs): ModuleResult {
  const mjPerTonneFuel = 1000 / Math.max(1e-9, c.fuelTonnesPerGj);
  const rows: DetailRow[] = [];
  for (const item of c.items) {
    const g = item.kgPerTonneFuel * item.gPerKg;
    if (g === 0) continue;
    rows.push({
      key: `cp-${item.id}`,
      label: `${item.label || "Co-product"} credit`,
      gPerMj: -g / mjPerTonneFuel,
      detail: `${item.kgPerTonneFuel} kg/t fuel × ${item.gPerKg} gCO2e/kg displaced`,
    });
  }
  if (c.exportedElectricityKwhPerMj !== 0) {
    rows.push({
      key: "cp-power",
      label: "Exported electricity credit",
      gPerMj: -c.exportedElectricityKwhPerMj * c.exportedElectricityCreditPerKwh,
      detail: `${c.exportedElectricityKwhPerMj} kWh/MJ × ${c.exportedElectricityCreditPerKwh} g/kWh displaced`,
    });
  }
  if (c.avoidedMethaneGPerMj !== 0) {
    rows.push({
      key: "cp-methane",
      label: "Avoided methane credit",
      gPerMj: -Math.abs(c.avoidedMethaneGPerMj),
      detail: "Manure, landfill or wastewater methane that would have been released",
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

export interface DistributionInputs {
  enabled: boolean;
  /** Tonnes of finished fuel per GJ. */
  fuelTonnesPerGj: number;
  legs: TransportLeg[];
  /** Terminal storage and tank heating, gCO2e/MJ. */
  storageGPerMj: number;
  /** Blending and additives, gCO2e/MJ. */
  blendingGPerMj: number;
  /** Retail dispensing and station electricity, gCO2e/MJ. */
  dispensingGPerMj: number;
  /** Compression or liquefaction for gaseous fuels, gCO2e/MJ. */
  compressionGPerMj: number;
  /** Evaporative and boil-off losses, % of fuel. */
  lossPct: number;
}

export const DEFAULT_DISTRIBUTION: DistributionInputs = {
  enabled: false,
  fuelTonnesPerGj: 0.0234,
  legs: [
    { id: "dleg1", label: "Plant to terminal", mode: "rail", distanceKm: 800, sharePct: 100, emptyReturn: 1.1 },
    { id: "dleg2", label: "Terminal to station", mode: "truckHeavy", distanceKm: 120, sharePct: 100, emptyReturn: 1.2 },
  ],
  storageGPerMj: 0.3,
  blendingGPerMj: 0.2,
  dispensingGPerMj: 0.2,
  compressionGPerMj: 0,
  lossPct: 0.2,
};

export function computeDistribution(dst: DistributionInputs, upstreamCi: number): ModuleResult {
  const rows = legRows(dst.legs, dst.fuelTonnesPerGj, "dist");
  const extras: [string, string, number, string][] = [
    ["storage", "Terminal storage", dst.storageGPerMj, "Tank heating, pumping and vapour control"],
    ["blending", "Blending and additives", dst.blendingGPerMj, "Splash or in-line blending"],
    ["dispensing", "Retail dispensing", dst.dispensingGPerMj, "Station electricity and pumping"],
    ["compression", "Compression or liquefaction", dst.compressionGPerMj, "CNG compression, LNG or hydrogen handling"],
  ];
  for (const [key, label, g, detail] of extras) {
    if (g === 0) continue;
    rows.push({ key: `dist-${key}`, label, gPerMj: g, detail });
  }
  if (dst.lossPct !== 0) {
    rows.push({
      key: "dist-loss",
      label: "Distribution losses",
      gPerMj: (dst.lossPct / 100) * upstreamCi,
      detail: `${dst.lossPct}% of the fuel lost, carrying its upstream carbon`,
    });
  }
  return { gPerMj: rows.reduce((a, r) => a + r.gPerMj, 0), rows };
}

// --- Tailpipe / end use --------------------------------------------------------

export type EndUseModeId =
  | "lightDutyRoad"
  | "heavyDutyRoad"
  | "cngVehicle"
  | "fuelCell"
  | "aviationTurbine"
  | "marineEngine"
  | "railLocomotive"
  | "offRoad"
  | "stationaryBoiler"
  | "powerGeneration";

export interface EndUseMode {
  id: EndUseModeId;
  label: string;
  /** gCO2e/MJ from CH4 slip at the point of use. */
  ch4GPerMj: number;
  /** gCO2e/MJ from N2O at the point of use. */
  n2oGPerMj: number;
  note: string;
}

export const END_USE_MODES: EndUseMode[] = [
  { id: "lightDutyRoad", label: "Light duty road vehicle", ch4GPerMj: 0.15, n2oGPerMj: 0.65, note: "Spark ignition cars and light trucks" },
  { id: "heavyDutyRoad", label: "Heavy duty road vehicle", ch4GPerMj: 0.1, n2oGPerMj: 0.9, note: "Compression ignition trucks and buses" },
  { id: "cngVehicle", label: "Natural gas vehicle", ch4GPerMj: 1.8, n2oGPerMj: 0.3, note: "Methane slip dominates spark-ignited gas engines" },
  { id: "fuelCell", label: "Hydrogen fuel cell", ch4GPerMj: 0, n2oGPerMj: 0, note: "No combustion emissions at the point of use" },
  { id: "aviationTurbine", label: "Aviation turbine", ch4GPerMj: 0.02, n2oGPerMj: 0.55, note: "Excludes non-CO2 contrail effects" },
  { id: "marineEngine", label: "Marine engine", ch4GPerMj: 0.3, n2oGPerMj: 0.55, note: "Slow speed diesel; higher slip for LNG dual fuel" },
  { id: "railLocomotive", label: "Rail locomotive", ch4GPerMj: 0.08, n2oGPerMj: 0.8, note: "Line haul diesel electric" },
  { id: "offRoad", label: "Off-road and agricultural machinery", ch4GPerMj: 0.2, n2oGPerMj: 1.0, note: "Tractors, loaders and construction plant" },
  { id: "stationaryBoiler", label: "Stationary boiler or furnace", ch4GPerMj: 0.05, n2oGPerMj: 0.3, note: "Industrial heat and district energy" },
  { id: "powerGeneration", label: "Power generation", ch4GPerMj: 0.04, n2oGPerMj: 0.35, note: "Biomass or biogas fired generation" },
];

export const END_USE_MODE_BY_ID: Record<EndUseModeId, EndUseMode> = Object.fromEntries(
  END_USE_MODES.map((m) => [m.id, m]),
) as Record<EndUseModeId, EndUseMode>;

export interface TailpipeInputs {
  enabled: boolean;
  modeId: EndUseModeId;
  /** Share of the carbon in the fuel that is fossil, 0-100. */
  fossilCarbonPct: number;
  /** Combustion CO2 of the fuel, gCO2e/MJ, before the biogenic deduction. */
  combustionCo2GPerMj: number;
  /** Optional user override of the CH4 factor, gCO2e/MJ. Negative = use the mode default. */
  ch4Override: number;
  n2oOverride: number;
  /** Urea or SCR consumption credited as an emission, gCO2e/MJ. */
  aftertreatmentGPerMj: number;
}

export const DEFAULT_TAILPIPE: TailpipeInputs = {
  enabled: false,
  modeId: "heavyDutyRoad",
  fossilCarbonPct: 0,
  combustionCo2GPerMj: DETAIL_FACTORS.combustionCo2PerMj,
  ch4Override: -1,
  n2oOverride: -1,
  aftertreatmentGPerMj: 0,
};

export function computeTailpipe(t: TailpipeInputs): ModuleResult {
  const mode = END_USE_MODE_BY_ID[t.modeId] ?? END_USE_MODES[0]!;
  const ch4 = t.ch4Override >= 0 ? t.ch4Override : mode.ch4GPerMj;
  const n2o = t.n2oOverride >= 0 ? t.n2oOverride : mode.n2oGPerMj;
  const fossil = (Math.min(100, Math.max(0, t.fossilCarbonPct)) / 100) * t.combustionCo2GPerMj;
  const rows: DetailRow[] = [];
  if (ch4) rows.push({ key: "tp-ch4", label: `${mode.label} — methane slip`, gPerMj: ch4, detail: mode.note });
  if (n2o) rows.push({ key: "tp-n2o", label: `${mode.label} — nitrous oxide`, gPerMj: n2o, detail: "Combustion N2O, GWP 273" });
  if (fossil)
    rows.push({
      key: "tp-fossil",
      label: "Fossil carbon in the fuel",
      gPerMj: fossil,
      detail: `${t.fossilCarbonPct}% of ${t.combustionCo2GPerMj} gCO2/MJ combustion CO2`,
    });
  if (t.aftertreatmentGPerMj)
    rows.push({ key: "tp-scr", label: "Aftertreatment reagent", gPerMj: t.aftertreatmentGPerMj, detail: "Urea / DEF consumption" });
  rows.push({
    key: "tp-biogenic",
    label: "Biogenic combustion CO2",
    gPerMj: 0,
    detail: `${(t.combustionCo2GPerMj * (1 - t.fossilCarbonPct / 100)).toFixed(1)} gCO2/MJ counted as zero under every program`,
  });
  return { gPerMj: rows.reduce((a, r) => a + r.gPerMj, 0), rows };
}

// --- Module wiring -------------------------------------------------------------

export interface DetailModules {
  feedstockProduction: FeedstockProductionInputs;
  transport: TransportInputs;
  chemicals: ChemicalsInputs;
  coProducts: CoProductInputs;
  distribution: DistributionInputs;
  tailpipe: TailpipeInputs;
}

export type DetailModuleKey = keyof DetailModules;

/** Which aggregate DirectTerms value each detailed module replaces. */
export const MODULE_TO_DIRECT: Record<DetailModuleKey, keyof DirectTerms> = {
  feedstockProduction: "feedstock",
  transport: "feedstockTransport",
  chemicals: "processNonEnergy",
  coProducts: "coProductCredit",
  distribution: "distribution",
  tailpipe: "endUse",
};

export function defaultDetailModules(): DetailModules {
  return {
    feedstockProduction: { ...DEFAULT_FEEDSTOCK_PRODUCTION },
    transport: { ...DEFAULT_TRANSPORT, legs: DEFAULT_TRANSPORT.legs.map((l) => ({ ...l })) },
    chemicals: { ...DEFAULT_CHEMICALS, items: DEFAULT_CHEMICALS.items.map((i) => ({ ...i })) },
    coProducts: { ...DEFAULT_COPRODUCTS, items: DEFAULT_COPRODUCTS.items.map((i) => ({ ...i })) },
    distribution: { ...DEFAULT_DISTRIBUTION, legs: DEFAULT_DISTRIBUTION.legs.map((l) => ({ ...l })) },
    tailpipe: { ...DEFAULT_TAILPIPE },
  };
}

// --- Background emission factor library -------------------------------------
// Every background factor the calculator can apply, with the reference it is
// taken from. Exported so the CSV download documents the full basis of a run.

export interface FactorRow {
  group: string;
  item: string;
  detail: string;
  value: number;
  unit: string;
  source: string;
}

const SRC = {
  greet: "Argonne National Laboratory, GREET model (fuel-cycle and material databases)",
  caGreet: "CARB CA-GREET 3.0 / LCFS certified pathway documentation",
  red: "EU RED II / RED III Annex V and Annex VI typical and default values",
  ipcc: "IPCC AR5/AR6 global warming potentials and 2019 Refinement inventory guidance",
  grid: "IEA Emission Factors, US EPA eGRID and national grid inventories",
  ecoinvent: "ecoinvent v3 background datasets for chemicals and materials",
  transport: "GLEC Framework and IMO/EEA transport emission intensity data",
} as const;

export function backgroundFactors(): FactorRow[] {
  const rows: FactorRow[] = [];

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

  const detailRows: [string, string, number, string, string][] = [
    ["Diesel fuel", "Combustion plus upstream", DETAIL_FACTORS.dieselPerLitre, "gCO2e/litre", SRC.greet],
    ["Gasoline fuel", "Combustion plus upstream", DETAIL_FACTORS.gasolinePerLitre, "gCO2e/litre", SRC.greet],
    ["Natural gas", "Combustion plus upstream", DETAIL_FACTORS.naturalGasPerMj, "gCO2e/MJ", SRC.greet],
    ["Nitrogen fertiliser", "Manufacture of applied N", DETAIL_FACTORS.nitrogenPerKg, "gCO2e/kg N", SRC.ecoinvent],
    ["Phosphate fertiliser", "Manufacture, as P2O5", DETAIL_FACTORS.phosphatePerKg, "gCO2e/kg", SRC.ecoinvent],
    ["Potash fertiliser", "Manufacture, as K2O", DETAIL_FACTORS.potashPerKg, "gCO2e/kg", SRC.ecoinvent],
    ["Agricultural lime", "Manufacture and field CO2", DETAIL_FACTORS.limePerKg, "gCO2e/kg", SRC.ipcc],
    ["Pesticides", "Cradle-to-gate manufacture", DETAIL_FACTORS.pesticidePerKg, "gCO2e/kg", SRC.ecoinvent],
    ["Seed", "Seed production and treatment", DETAIL_FACTORS.seedPerKg, "gCO2e/kg", SRC.greet],
    ["Methane GWP", "100-year global warming potential", DETAIL_FACTORS.ch4Gwp, "gCO2e/g CH4", SRC.ipcc],
    ["Nitrous oxide GWP", "100-year global warming potential", DETAIL_FACTORS.n2oGwp, "gCO2e/g N2O", SRC.ipcc],
    ["Fuel combustion CO2", "Default liquid fuel carbon content", DETAIL_FACTORS.combustionCo2PerMj, "gCO2e/MJ", SRC.caGreet],
  ];
  for (const [item, detail, value, unit, source] of detailRows) {
    rows.push({ group: "Background material and GWP factors", item, detail, value, unit, source });
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
        value: benchmark as number,
        unit: "gCO2e/MJ benchmark",
        source: `${p.jurisdiction} program documentation`,
      });
    }
  }

  return rows;
}
