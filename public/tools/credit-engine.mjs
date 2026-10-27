// CIVanta planning engine v1.0.1; reference review 2026-10-01; software review 2026-10-15. No credit issuance.
const VERSION = "1.0.1";
const BTU_TO_MJ = 0.00105505585262;
const LITRES_PER_US_GALLON = 3.785411784;
const FUELS = {
  rd: { name: "Renewable diesel", unit: "US gal", energy: 131, exampleCI: 30 },
  bd: { name: "Biodiesel", unit: "US gal", energy: 126.13, exampleCI: 35 },
  ethanol: { name: "Denatured ethanol", unit: "US gal", energy: 80.53, exampleCI: 55 },
  rng: { name: "RNG for road transport", unit: "MMBtu", energy: 1055.05585262, exampleCI: -100 },
};
const SOURCES = [
  {
    title: "2026 RIN equivalence values — 40 CFR 80.1415",
    url: "https://www.ecfr.gov/current/title-40/chapter-I/subchapter-C/part-80/subpart-M/section-80.1415",
  },
  {
    title: "2027 equivalence values — 91 FR 16388, amendment 17",
    url: "https://www.federalregister.gov/documents/2026/04/01/2026-06275/renewable-fuel-standard-rfs-program-standards-for-2026-and-2027-partial-waiver-of-2025-cellulosic",
  },
  {
    title: "CARB 2026 benchmark table — annual reporting webinar",
    url: "https://ww2.arb.ca.gov/sites/default/files/classic/fuels/lcfs/workshops/lcfswebinar_2025_annual_report.pdf",
  },
  {
    title: "LCFS regulation — 17 CCR 95486.1",
    url: "https://ww2.arb.ca.gov/our-work/programs/low-carbon-fuel-standard/lcfs-regulation",
  },
];
function defaults() {
  return {
    fuel: "rd",
    year: 2026,
    mode: "both",
    quantity: 1000000,
    unit: "gal",
    basis: "LHV",
    hhvToLhv: 0.9,
    lcfsBasisFactor: 1,
    energy: 131,
    ci: 30,
    benchmark: 80.17,
    reference: "diesel",
    benchmarkMode: "preset",
    eer: 1,
    lcfsShare: 100,
    rfsShare: 100,
    lcfsPrice: 75,
    rinPrice: 1,
    dcode: "",
    evMode: "standard",
    customEV: 1.7,
    lcfsConfirmed: false,
    rfsConfirmed: false,
  };
}
function standardEV(fuel, year) {
  if (![2026, 2027].includes(year)) throw new Error("Supported RIN years are 2026 and 2027.");
  return fuel === "rd"
    ? year === 2026
      ? 1.7
      : 1.5
    : fuel === "bd"
      ? 1.5
      : fuel === "ethanol"
        ? 1
        : 1;
}
function calculate(s) {
  if (!s || typeof s !== "object" || Array.isArray(s))
    return { errors: ["Enter a valid scenario."], warnings: [] };
  const errors = [];
  const warnings = [];
  if (!Object.hasOwn(FUELS, s.fuel)) errors.push("Choose a supported fuel.");
  if (![2026, 2027].includes(s.year)) errors.push("Choose 2026 or 2027.");
  if (!["both", "lcfs", "rfs"].includes(s.mode))
    errors.push("Choose a supported calculation mode.");
  const lcfs = s.mode !== "rfs",
    rfs = s.mode !== "lcfs";
  const required = ["quantity"];
  if (s.fuel === "rng" && s.basis === "HHV") required.push("hhvToLhv");
  if (s.fuel === "rng" && lcfs) required.push("lcfsBasisFactor");
  if (s.fuel !== "rng") required.push("energy");
  if (s.fuel === "rd" && rfs && s.evMode === "standard" && s.year === 2026) required.push("energy");
  if (lcfs) required.push("ci", "benchmark", "eer", "lcfsShare", "lcfsPrice");
  if (rfs) required.push("rfsShare", "rinPrice");
  if (rfs && s.evMode === "custom" && s.fuel !== "rng") required.push("customEV");
  for (const k of required)
    if (typeof s[k] !== "number" || !Number.isFinite(s[k]))
      errors.push(
        k === "benchmark" && s.year === 2027 && s.benchmarkMode === "custom"
          ? "Enter a verified 2027 LCFS benchmark in gCO₂e/MJ."
          : k + " must be a finite number.",
      );
  if (s.quantity < 0) errors.push("Quantity cannot be negative.");
  if (s.fuel !== "rng" && s.energy <= 0) errors.push("Energy content must be positive.");
  if (lcfs && s.fuel === "rng" && s.lcfsBasisFactor <= 0)
    errors.push("LCFS energy basis multiplier must be positive.");
  if (lcfs && s.benchmark < 0) errors.push("Benchmark cannot be negative.");
  if (lcfs && !["gasoline", "diesel"].includes(s.reference))
    errors.push("Select a displaced fuel.");
  if (rfs && !["standard", "custom"].includes(s.evMode))
    errors.push("Select an equivalence value source.");
  if (lcfs && !["preset", "custom"].includes(s.benchmarkMode))
    errors.push("Select a benchmark source.");
  if (lcfs && s.eer <= 0) errors.push("EER must be positive.");
  for (const k of [lcfs ? "lcfsShare" : null, rfs ? "rfsShare" : null].filter(Boolean))
    if (s[k] < 0 || s[k] > 100) errors.push(k + " must be between 0 and 100%.");
  if ((lcfs && s.lcfsPrice < 0) || (rfs && s.rinPrice < 0))
    errors.push("Prices cannot be negative.");
  if (s.fuel === "rng" && !["LHV", "HHV"].includes(s.basis)) errors.push("Choose an energy basis.");
  if (s.fuel === "rng" && !["MMBtu", "MJ"].includes(s.unit))
    errors.push("Use MJ or MMBtu for RNG.");
  if (s.fuel !== "rng" && !["gal", "litre"].includes(s.unit))
    errors.push("Use gallons or litres for liquid fuel.");
  if (s.fuel === "rng" && s.basis === "HHV" && (s.hhvToLhv <= 0 || s.hhvToLhv > 1))
    errors.push("HHV-to-LHV ratio must be greater than 0 and at most 1.");
  if (rfs && s.evMode === "custom" && (s.customEV <= 0 || s.customEV > 5))
    errors.push("Approved equivalence value must be greater than 0 and at most 5.");
  if (rfs && s.dcode && !["D3", "D4", "D5", "D6", "D7"].includes(s.dcode))
    errors.push("Choose a supported D-code.");
  if (lcfs && s.benchmarkMode === "preset" && s.year !== 2026)
    errors.push("Enter the verified LCFS benchmark for 2027; no 2027 benchmark is preset.");
  if (
    lcfs &&
    s.benchmarkMode === "preset" &&
    s.benchmark !== (s.reference === "gasoline" ? 75.16 : 80.17)
  )
    errors.push("Preset benchmark does not match the selected reference.");
  if (
    (lcfs && typeof s.lcfsConfirmed !== "boolean") ||
    (rfs && typeof s.rfsConfirmed !== "boolean")
  )
    errors.push("Eligibility confirmation must be true or false.");
  if (errors.length) return { errors, warnings };
  const gallons =
    s.fuel === "rng" ? null : s.quantity / (s.unit === "litre" ? LITRES_PER_US_GALLON : 1);
  const energyMj =
    s.fuel === "rng"
      ? s.quantity *
        (s.unit === "MMBtu" ? 1e6 * BTU_TO_MJ : 1) *
        (s.basis === "HHV" ? s.hhvToLhv : 1)
      : gallons * s.energy;
  const ev = !rfs
    ? null
    : s.fuel === "rng"
      ? 1
      : s.evMode === "custom"
        ? s.customEV
        : standardEV(s.fuel, s.year);
  const lcfsBasisEnergy =
    s.fuel === "rng"
      ? s.quantity * (s.unit === "MMBtu" ? 1e6 * BTU_TO_MJ : 1) * s.lcfsBasisFactor
      : energyMj;
  const lcfsEnergy = lcfs ? (lcfsBasisEnergy * s.lcfsShare) / 100 : null;
  const delta = lcfs ? s.benchmark * s.eer - s.ci : null;
  const lcfsTonnes = lcfs ? (delta * lcfsEnergy) / 1e6 : null;
  let rinError = null;
  if (rfs && !s.dcode)
    rinError = "Select the D-code from the registered/approved pathway to calculate RINs.";
  if (
    rfs &&
    s.fuel === "rd" &&
    s.year === 2026 &&
    s.evMode === "standard" &&
    s.energy / BTU_TO_MJ < 123500
  )
    rinError =
      "The 2026 1.7 factor requires LHV ≥ 123,500 Btu/gal. Enter an EPA-approved alternative equivalence value.";
  const eligibleRfs =
    s.fuel === "rng" ? (energyMj * s.rfsShare) / 100 : (gallons * s.rfsShare) / 100;
  const rins =
    rfs && !rinError
      ? s.fuel === "rng"
        ? eligibleRfs / (77000 * BTU_TO_MJ)
        : eligibleRfs * ev
      : null;
  if (lcfs && !s.lcfsConfirmed)
    warnings.push(
      "LCFS result is conditional: pathway, California delivery/end use and entitlement have not been confirmed.",
    );
  if (rfs && !s.rfsConfirmed)
    warnings.push(
      "RIN result is conditional: approved pathway, registration, eligible use and entitlement have not been confirmed.",
    );
  if (s.fuel === "rng")
    warnings.push(
      "Use eligible biomethane energy only. HHV conversion is user supplied; confirm road-transport use and the applicable vehicle EER.",
    );
  if (rfs && s.evMode === "custom")
    warnings.push(
      "Custom equivalence value must match EPA approval; entering it does not establish approval.",
    );
  if (lcfs && s.benchmarkMode === "custom")
    warnings.push("Custom benchmark is user supplied and has not been independently verified.");
  const lcfsValue = lcfsTonnes === null ? null : lcfsTonnes * s.lcfsPrice;
  const rinValue = rins === null ? null : rins * s.rinPrice;
  const combined =
    lcfs && rfs && s.lcfsConfirmed && s.rfsConfirmed && rins !== null ? lcfsValue + rinValue : null;
  const output = {
    energyMj,
    gallons,
    ev,
    lcfsEnergy,
    delta,
    lcfsTonnes,
    rins,
    rinError,
    lcfsValue,
    rinValue,
    combined,
  };
  if (Object.values(output).some((v) => typeof v === "number" && !Number.isFinite(v)))
    return { errors: ["Calculation exceeds the supported numeric range."], warnings };
  return { errors, warnings, ...output };
}
function exportRows(s, r) {
  return [
    ["CIVanta credit and RIN estimate", ""],
    ["Engine version", VERSION],
    ["Reviewed", "2026-10-01"],
    ...Object.entries(s),
    ...Object.entries(r).filter(([k]) => !["errors", "warnings"].includes(k)),
    ["Warnings", r.warnings.join(" | ")],
    ...SOURCES.map((x) => [x.title, x.url]),
  ];
}

export {
  VERSION,
  BTU_TO_MJ,
  LITRES_PER_US_GALLON,
  FUELS,
  SOURCES,
  defaults,
  standardEV,
  calculate,
  exportRows,
};
