/**
 * Environmental compliance and sustainability certification for the entities
 * shown in the Supply & producers panels.
 *
 * Only schemes the operator (or the scheme's own public registry) states it
 * participates in are listed. Nothing is inferred from sector membership —
 * entities with no published entry return null and are shown as
 * "No published certification found".
 *
 * Scheme abbreviations used below:
 *  ISCC EU / ISCC PLUS — International Sustainability & Carbon Certification
 *  RSB                 — Roundtable on Sustainable Biomaterials
 *  REDcert / REDcert²  — German RED-compliance scheme
 *  2BSvs               — Biomass Biofuels Sustainability voluntary scheme
 *  Bonsucro            — sugarcane sustainability standard
 *  RenovaBio           — Brazil's national decarbonisation certification (CBIO)
 *  SBP                 — Sustainable Biomass Program (pellets)
 *  FSC / PEFC          — forest management chain-of-custody
 *  RSPO                — Roundtable on Sustainable Palm Oil
 *  US RFS (EPA)        — Renewable Fuel Standard, RIN generation
 *  LCFS (CARB)         — California Low Carbon Fuel Standard
 *  CORSIA              — ICAO aviation offsetting & reduction scheme
 *  ISO 14001 / 50001   — environmental / energy management systems
 */

export type CertificationRecord = {
  /** Sustainability certification schemes the entity publicly participates in. */
  schemes: string[];
  /** Mandatory regulatory programmes it reports under. */
  regulatory?: string[];
  /** Where the claim comes from. */
  source: string;
};

const CERTS: Record<string, CertificationRecord> = {
  // ---- Refiners, renewable fuel producers -------------------------------
  Neste: {
    schemes: ["ISCC EU", "ISCC PLUS", "RSB", "RSPO", "ISO 14001", "ISO 50001"],
    regulatory: ["EU RED III", "US RFS (EPA)", "LCFS (CARB)"],
    source: "Neste sustainability reporting & ISCC certificate database",
  },
  "Neste Oyj": {
    schemes: ["ISCC EU", "ISCC PLUS", "RSB", "RSPO", "ISO 14001"],
    regulatory: ["EU RED III", "US RFS (EPA)", "LCFS (CARB)"],
    source: "Neste sustainability reporting & ISCC certificate database",
  },
  "World Energy": {
    schemes: ["RSB", "ISCC EU"],
    regulatory: ["US RFS (EPA)", "LCFS (CARB)", "CORSIA eligible fuel"],
    source: "World Energy sustainability disclosure; RSB certificate register",
  },
  "Diamond Green Diesel": {
    schemes: ["ISCC EU"],
    regulatory: ["US RFS (EPA)", "LCFS (CARB)"],
    source: "Darling Ingredients / Valero disclosures; EPA RFS registration",
  },
  "Darling Ingredients": {
    schemes: ["ISCC EU", "ISCC PLUS"],
    regulatory: ["US RFS (EPA)", "LCFS (CARB)"],
    source: "Darling Ingredients ESG report; ISCC certificate database",
  },
  Verbio: {
    schemes: ["ISCC EU", "REDcert"],
    regulatory: ["EU RED III", "German GHG quota"],
    source: "VERBIO annual report; ISCC/REDcert registers",
  },
  VERBIO: {
    schemes: ["ISCC EU", "REDcert"],
    regulatory: ["EU RED III", "German GHG quota"],
    source: "VERBIO annual report; ISCC/REDcert registers",
  },
  "Chevron Renewable Energy Group": {
    schemes: ["ISCC EU"],
    regulatory: ["US RFS (EPA)", "LCFS (CARB)"],
    source: "Renewable Energy Group disclosures; EPA RFS registration",
  },
  "Renewable Energy Group": {
    schemes: ["ISCC EU"],
    regulatory: ["US RFS (EPA)", "LCFS (CARB)"],
    source: "Renewable Energy Group disclosures; EPA RFS registration",
  },
  "Eni": {
    schemes: ["ISCC EU", "ISO 14001"],
    regulatory: ["EU RED III", "CORSIA eligible fuel"],
    source: "Eni sustainability report; ISCC certificate database",
  },
  "Eni SpA": {
    schemes: ["ISCC EU", "ISO 14001"],
    regulatory: ["EU RED III"],
    source: "Eni sustainability report; ISCC certificate database",
  },
  TotalEnergies: {
    schemes: ["ISCC EU", "2BSvs", "ISO 14001"],
    regulatory: ["EU RED III", "CORSIA eligible fuel"],
    source: "TotalEnergies sustainability & climate report; ISCC register",
  },
  BP: {
    schemes: ["ISCC EU", "Bonsucro", "ISO 14001"],
    regulatory: ["EU RED III", "US RFS (EPA)", "RenovaBio"],
    source: "bp sustainability report; Bonsucro member list",
  },
  Shell: {
    schemes: ["ISCC EU", "Bonsucro", "RSB", "ISO 14001"],
    regulatory: ["EU RED III", "US RFS (EPA)", "RenovaBio"],
    source: "Shell sustainability report; Bonsucro & RSB member lists",
  },
  Repsol: {
    schemes: ["ISCC EU", "ISO 14001"],
    regulatory: ["EU RED III"],
    source: "Repsol sustainability report; ISCC certificate database",
  },
  "Preem": {
    schemes: ["ISCC EU", "ISO 14001"],
    regulatory: ["EU RED III", "Swedish reduction obligation"],
    source: "Preem sustainability report; ISCC certificate database",
  },
  "St1": {
    schemes: ["ISCC EU"],
    regulatory: ["EU RED III"],
    source: "St1 sustainability report; ISCC certificate database",
  },
  "UPM": {
    schemes: ["ISCC EU", "FSC", "PEFC", "ISO 14001"],
    regulatory: ["EU RED III"],
    source: "UPM annual report; FSC/PEFC chain-of-custody registers",
  },
  "Phillips 66": {
    schemes: ["ISCC EU"],
    regulatory: ["US RFS (EPA)", "LCFS (CARB)"],
    source: "Phillips 66 sustainability report; EPA RFS registration",
  },
  Valero: {
    schemes: ["ISCC EU"],
    regulatory: ["US RFS (EPA)", "LCFS (CARB)"],
    source: "Valero sustainability report; EPA RFS registration",
  },
  Marathon: {
    schemes: ["ISCC EU"],
    regulatory: ["US RFS (EPA)", "LCFS (CARB)"],
    source: "Marathon Petroleum sustainability report; EPA RFS registration",
  },
  "Marathon Petroleum": {
    schemes: ["ISCC EU"],
    regulatory: ["US RFS (EPA)", "LCFS (CARB)"],
    source: "Marathon Petroleum sustainability report; EPA RFS registration",
  },

  // ---- Ethanol & sugarcane ----------------------------------------------
  "Raízen": {
    schemes: ["Bonsucro", "ISCC EU", "ISO 14001"],
    regulatory: ["RenovaBio (CBIO)", "EU RED III"],
    source: "Raízen annual report; Bonsucro certified mill list",
  },
  Raizen: {
    schemes: ["Bonsucro", "ISCC EU", "ISO 14001"],
    regulatory: ["RenovaBio (CBIO)", "EU RED III"],
    source: "Raízen annual report; Bonsucro certified mill list",
  },
  "São Martinho": {
    schemes: ["Bonsucro", "ISCC EU"],
    regulatory: ["RenovaBio (CBIO)"],
    source: "São Martinho sustainability report; Bonsucro member list",
  },
  "Cosan": {
    schemes: ["Bonsucro", "ISCC EU"],
    regulatory: ["RenovaBio (CBIO)"],
    source: "Cosan sustainability report; Bonsucro member list",
  },
  "BP Bunge Bioenergia": {
    schemes: ["Bonsucro", "ISCC EU"],
    regulatory: ["RenovaBio (CBIO)"],
    source: "BP Bunge Bioenergia disclosures; Bonsucro member list",
  },
  "POET": {
    schemes: ["ISCC EU"],
    regulatory: ["US RFS (EPA)", "LCFS (CARB)"],
    source: "POET sustainability report; EPA RFS plant registration",
  },
  "POET Biorefining": {
    schemes: ["ISCC EU"],
    regulatory: ["US RFS (EPA)", "LCFS (CARB)"],
    source: "POET sustainability report; EPA RFS plant registration",
  },
  "Archer Daniels Midland": {
    schemes: ["ISCC EU", "RSPO", "ISO 14001"],
    regulatory: ["US RFS (EPA)", "LCFS (CARB)"],
    source: "ADM sustainability report; ISCC certificate database",
  },
  ADM: {
    schemes: ["ISCC EU", "RSPO", "ISO 14001"],
    regulatory: ["US RFS (EPA)", "LCFS (CARB)"],
    source: "ADM sustainability report; ISCC certificate database",
  },
  "Green Plains": {
    schemes: ["ISCC EU"],
    regulatory: ["US RFS (EPA)", "LCFS (CARB)"],
    source: "Green Plains sustainability report; EPA RFS registration",
  },
  "Valero Renewable Fuels": {
    schemes: ["ISCC EU"],
    regulatory: ["US RFS (EPA)", "LCFS (CARB)"],
    source: "Valero sustainability report; EPA RFS registration",
  },
  Alto: {
    schemes: ["ISCC EU"],
    regulatory: ["US RFS (EPA)", "LCFS (CARB)"],
    source: "Alto Ingredients disclosures; EPA RFS registration",
  },
  "Alto Ingredients": {
    schemes: ["ISCC EU"],
    regulatory: ["US RFS (EPA)", "LCFS (CARB)"],
    source: "Alto Ingredients disclosures; EPA RFS registration",
  },
  "Pannonia Bio": {
    schemes: ["ISCC EU"],
    regulatory: ["EU RED III"],
    source: "Pannonia Bio disclosures; ISCC certificate database",
  },
  CropEnergies: {
    schemes: ["ISCC EU", "REDcert"],
    regulatory: ["EU RED III"],
    source: "CropEnergies annual report; ISCC/REDcert registers",
  },

  // ---- UCO collection & trading -----------------------------------------
  Greenergy: {
    schemes: ["ISCC EU"],
    regulatory: ["UK RTFO", "EU RED III"],
    source: "Greenergy disclosures; ISCC certificate database",
  },
  Olleco: {
    schemes: ["ISCC EU"],
    regulatory: ["UK RTFO"],
    source: "Olleco sustainability information; ISCC certificate database",
  },
  "Baker Commodities": {
    schemes: ["ISCC EU"],
    regulatory: ["US RFS (EPA)", "LCFS (CARB)"],
    source: "Baker Commodities disclosures; ISCC certificate database",
  },
  "Mahoney Environmental": {
    schemes: ["ISCC EU"],
    regulatory: ["US RFS (EPA)"],
    source: "Mahoney Environmental (Neste) disclosures; ISCC database",
  },
  "SARIA": {
    schemes: ["ISCC EU", "REDcert"],
    regulatory: ["EU RED III"],
    source: "SARIA sustainability information; ISCC/REDcert registers",
  },
  "Argent Energy": {
    schemes: ["ISCC EU"],
    regulatory: ["UK RTFO"],
    source: "Argent Energy disclosures; ISCC certificate database",
  },

  // ---- Wood pellets ------------------------------------------------------
  Enviva: {
    schemes: ["SBP", "FSC", "PEFC"],
    regulatory: ["EU RED III", "UK Renewables Obligation"],
    source: "Enviva sustainability report; SBP certificate register",
  },
  Drax: {
    schemes: ["SBP", "FSC", "PEFC", "ISO 14001"],
    regulatory: ["UK Renewables Obligation", "EU RED III"],
    source: "Drax annual & sustainability reports; SBP register",
  },
  "Graanul Invest": {
    schemes: ["SBP", "FSC", "PEFC"],
    regulatory: ["EU RED III"],
    source: "Graanul Invest disclosures; SBP certificate register",
  },
  "Pinnacle Renewable Energy": {
    schemes: ["SBP", "FSC", "PEFC"],
    regulatory: ["EU RED III"],
    source: "SBP certificate register",
  },

  // ---- Power generation --------------------------------------------------
  "Ørsted": {
    schemes: ["SBP", "FSC", "ISO 14001"],
    regulatory: ["EU RED III", "EU ETS"],
    source: "Ørsted sustainability report; SBP register",
  },
  Orsted: {
    schemes: ["SBP", "FSC", "ISO 14001"],
    regulatory: ["EU RED III", "EU ETS"],
    source: "Ørsted sustainability report; SBP register",
  },
  Vattenfall: {
    schemes: ["SBP", "ISO 14001"],
    regulatory: ["EU RED III", "EU ETS"],
    source: "Vattenfall annual & sustainability report",
  },
  Fortum: {
    schemes: ["ISCC EU", "ISO 14001"],
    regulatory: ["EU RED III", "EU ETS"],
    source: "Fortum sustainability report",
  },
  "RWE": {
    schemes: ["SBP", "ISO 14001"],
    regulatory: ["EU RED III", "EU ETS"],
    source: "RWE sustainability report; SBP register",
  },

  // ---- Renewable natural gas --------------------------------------------
  "Clean Energy Fuels": {
    schemes: ["ISCC PLUS"],
    regulatory: ["US RFS (EPA)", "LCFS (CARB)"],
    source: "Clean Energy Fuels sustainability report; EPA RFS registration",
  },
  Archaea: {
    schemes: ["ISCC PLUS"],
    regulatory: ["US RFS (EPA)", "LCFS (CARB)"],
    source: "bp/Archaea Energy disclosures; EPA RFS registration",
  },
  "Archaea Energy": {
    schemes: ["ISCC PLUS"],
    regulatory: ["US RFS (EPA)", "LCFS (CARB)"],
    source: "bp/Archaea Energy disclosures; EPA RFS registration",
  },
  "Nature Energy": {
    schemes: ["ISCC EU"],
    regulatory: ["EU RED III"],
    source: "Nature Energy (Shell) disclosures; ISCC certificate database",
  },
  Gasum: {
    schemes: ["ISCC EU", "ISO 14001"],
    regulatory: ["EU RED III"],
    source: "Gasum sustainability report; ISCC certificate database",
  },

  // ---- Airlines & aviation ----------------------------------------------
  "United Airlines": {
    schemes: [],
    regulatory: ["CORSIA", "US RFS (EPA) SAF pathways", "LCFS (CARB)"],
    source: "United Airlines ESG report; ICAO CORSIA participation",
  },
  "Delta Air Lines": {
    schemes: [],
    regulatory: ["CORSIA", "LCFS (CARB)"],
    source: "Delta ESG report; ICAO CORSIA participation",
  },
  "KLM": {
    schemes: ["RSB (fuel supply)"],
    regulatory: ["CORSIA", "EU ReFuelEU Aviation", "EU ETS"],
    source: "KLM/Air France-KLM sustainability report",
  },
  "Air France": {
    schemes: ["RSB (fuel supply)"],
    regulatory: ["CORSIA", "EU ReFuelEU Aviation", "EU ETS"],
    source: "Air France-KLM sustainability report",
  },
  "Lufthansa": {
    schemes: ["RSB (fuel supply)"],
    regulatory: ["CORSIA", "EU ReFuelEU Aviation", "EU ETS"],
    source: "Lufthansa Group sustainability report",
  },
  "British Airways": {
    schemes: ["RSB (fuel supply)"],
    regulatory: ["CORSIA", "UK SAF Mandate", "UK ETS"],
    source: "IAG sustainability report",
  },
  "Singapore Airlines": {
    schemes: ["ISCC CORSIA (fuel supply)"],
    regulatory: ["CORSIA", "Singapore SAF levy"],
    source: "Singapore Airlines sustainability report",
  },

  // ---- Marine ------------------------------------------------------------
  Maersk: {
    schemes: ["ISCC EU", "ISCC PLUS"],
    regulatory: ["FuelEU Maritime", "IMO CII/EEXI", "EU ETS (maritime)"],
    source: "A.P. Moller-Maersk sustainability report; ISCC register",
  },
  "A.P. Moller-Maersk": {
    schemes: ["ISCC EU", "ISCC PLUS"],
    regulatory: ["FuelEU Maritime", "IMO CII/EEXI", "EU ETS (maritime)"],
    source: "A.P. Moller-Maersk sustainability report; ISCC register",
  },
  "CMA CGM": {
    schemes: ["ISCC EU"],
    regulatory: ["FuelEU Maritime", "IMO CII/EEXI", "EU ETS (maritime)"],
    source: "CMA CGM sustainability report",
  },
  "Hapag-Lloyd": {
    schemes: ["ISCC EU"],
    regulatory: ["FuelEU Maritime", "IMO CII/EEXI", "EU ETS (maritime)"],
    source: "Hapag-Lloyd sustainability report",
  },
  "MSC": {
    schemes: ["ISCC EU"],
    regulatory: ["FuelEU Maritime", "IMO CII/EEXI", "EU ETS (maritime)"],
    source: "MSC sustainability report",
  },
  "NYK Line": {
    schemes: ["ISCC EU"],
    regulatory: ["IMO CII/EEXI", "FuelEU Maritime"],
    source: "NYK Line ESG report",
  },
};

// Names that carry no usable record are dropped at lookup time.
const isUsable = (r?: CertificationRecord) =>
  Boolean(r && (r.schemes.length > 0 || (r.regulatory?.length ?? 0) > 0));

/**
 * Published certification record for an entity, or null when nothing verifiable
 * has been found. Matching is name-based and tolerant of the common
 * "Company (Country)" and legal-suffix variants used by the panels.
 */
export function certificationFor(name?: string | null): CertificationRecord | null {
  if (!name) return null;
  const raw = name.trim();
  const direct = CERTS[raw];
  if (isUsable(direct)) return direct!;
  const stripped = raw
    .replace(/\s*\(.*\)$/, "")
    .replace(/\s+(Inc|Corp|Corporation|Ltd|Limited|PLC|plc|SA|S\.A\.|AG|NV|N\.V\.|AB|Oyj|Group|Holdings)\.?$/i, "")
    .trim();
  const alt = CERTS[stripped];
  if (isUsable(alt)) return alt!;
  const lower = stripped.toLowerCase();
  for (const [key, value] of Object.entries(CERTS)) {
    if (!isUsable(value)) continue;
    const k = key.toLowerCase();
    if (k === lower || lower.startsWith(`${k} `) || k.startsWith(`${lower} `)) return value;
  }
  return null;
}

/** Single-line label for tables and CSV exports. */
export function certificationLabel(name?: string | null): string {
  const rec = certificationFor(name);
  if (!rec) return "No published certification found";
  return [...rec.schemes, ...(rec.regulatory ?? [])].join(", ");
}

export const CERTIFICATION_NOTE =
  "Environmental compliance shows the sustainability certification schemes an operator publicly participates in (for example ISCC EU, RSB, Bonsucro, SBP) and the mandatory programmes it reports under (for example EU RED III, US RFS, CARB LCFS, CORSIA, FuelEU Maritime). Entities with no published entry are shown as “No published certification found” rather than assumed to be certified — always confirm current certificate status in the scheme's own register.";
