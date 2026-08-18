import type { FuelType } from "./policy-taxonomy";

export type JobCategory =
  | "Engineering"
  | "Operations & Plant"
  | "Policy & Regulatory"
  | "R&D / Science"
  | "Commercial & Trading"
  | "Sustainability & ESG";

export const JOB_CATEGORIES: JobCategory[] = [
  "Engineering",
  "Operations & Plant",
  "Policy & Regulatory",
  "R&D / Science",
  "Commercial & Trading",
  "Sustainability & ESG",
];

export const CATEGORY_QUERY: Record<JobCategory, string> = {
  Engineering: "process engineer biofuel",
  "Operations & Plant": "biorefinery plant operations",
  "Policy & Regulatory": "biofuel policy regulatory affairs",
  "R&D / Science": "bioenergy research scientist",
  "Commercial & Trading": "biofuel trading origination",
  "Sustainability & ESG": "sustainability carbon lifecycle biofuel",
};

export const FUEL_JOB_QUERY: Record<FuelType, string> = {
  Ethanol: "ethanol plant",
  Biodiesel: "biodiesel",
  "Renewable Diesel": "renewable diesel HVO",
  SAF: "sustainable aviation fuel",
  Biogas: "biogas RNG biomethane",
  Feedstock: "feedstock agronomy biomass supply",
};

export interface Employer {
  name: string;
  hq: string;
  focus: FuelType[];
  careers: string;
}

export const EMPLOYERS: Employer[] = [
  { name: "Neste", hq: "Finland", focus: ["Renewable Diesel", "SAF"], careers: "https://www.neste.com/careers" },
  { name: "LanzaJet", hq: "United States", focus: ["SAF", "Ethanol"], careers: "https://www.lanzajet.com/careers" },
  { name: "LanzaTech", hq: "United States", focus: ["SAF", "Feedstock"], careers: "https://lanzatech.com/careers/" },
  { name: "POET", hq: "United States", focus: ["Ethanol"], careers: "https://poet.com/careers" },
  { name: "Green Plains", hq: "United States", focus: ["Ethanol"], careers: "https://gpreinc.com/careers/" },
  { name: "Valero (Diamond Green Diesel)", hq: "United States", focus: ["Renewable Diesel"], careers: "https://www.valero.com/careers" },
  { name: "Darling Ingredients", hq: "United States", focus: ["Renewable Diesel", "Feedstock"], careers: "https://www.darlingii.com/careers" },
  { name: "Bunge", hq: "United States", focus: ["Feedstock", "Biodiesel"], careers: "https://www.bunge.com/careers" },
  { name: "ADM", hq: "United States", focus: ["Ethanol", "Feedstock"], careers: "https://www.adm.com/careers/" },
  { name: "Chevron Renewable Energy Group", hq: "United States", focus: ["Biodiesel", "Renewable Diesel"], careers: "https://careers.chevron.com/" },
  { name: "Gevo", hq: "United States", focus: ["SAF", "Ethanol"], careers: "https://gevo.com/careers/" },
  { name: "Aemetis", hq: "United States", focus: ["Ethanol", "Biogas"], careers: "https://www.aemetis.com/careers/" },
  { name: "Montauk Renewables", hq: "United States", focus: ["Biogas"], careers: "https://montaukrenewables.com/careers/" },
  { name: "Clean Energy Fuels", hq: "United States", focus: ["Biogas"], careers: "https://www.cleanenergyfuels.com/careers" },
  { name: "Shell", hq: "United Kingdom", focus: ["SAF", "Biogas"], careers: "https://www.shell.com/careers" },
  { name: "BP / Archaea Energy", hq: "United Kingdom", focus: ["Biogas", "SAF"], careers: "https://www.bp.com/en/global/corporate/careers.html" },
  { name: "TotalEnergies", hq: "France", focus: ["SAF", "Renewable Diesel"], careers: "https://totalenergies.com/careers" },
  { name: "Eni Sustainable Mobility", hq: "Italy", focus: ["Renewable Diesel", "SAF"], careers: "https://www.eni.com/en-IT/careers.html" },
  { name: "VERBIO", hq: "Germany", focus: ["Biogas", "Biodiesel"], careers: "https://www.verbio.de/en/career/" },
  { name: "Novonesis (Novozymes)", hq: "Denmark", focus: ["Feedstock", "Ethanol"], careers: "https://www.novonesis.com/en/careers" },
  { name: "Raízen", hq: "Brazil", focus: ["Ethanol", "Biogas"], careers: "https://www.raizen.com.br/en/careers" },
  { name: "Praj Industries", hq: "India", focus: ["Ethanol", "SAF"], careers: "https://www.praj.net/careers/" },
];

export interface JobBoard {
  name: string;
  note: string;
  url: (q: string) => string;
}

export const JOB_BOARDS: JobBoard[] = [
  {
    name: "LinkedIn Jobs",
    note: "Largest pool of bioenergy roles worldwide",
    url: (q) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}`,
  },
  {
    name: "Indeed",
    note: "Plant, operations and technician openings",
    url: (q) => `https://www.indeed.com/jobs?q=${encodeURIComponent(q)}`,
  },
  {
    name: "Google Jobs",
    note: "Aggregated listings across employer sites",
    url: (q) => `https://www.google.com/search?q=${encodeURIComponent(`${q} jobs`)}&ibp=htl;jobs`,
  },
  {
    name: "Climatebase",
    note: "Climate and clean-energy focused board",
    url: (q) => `https://climatebase.org/jobs?query=${encodeURIComponent(q)}`,
  },
  {
    name: "EURES (EU)",
    note: "European public employment network",
    url: (q) => `https://europa.eu/eures/portal/jv-se/search?keywords=${encodeURIComponent(q)}&lang=en`,
  },
  {
    name: "UN / IRENA careers",
    note: "Policy and multilateral bioenergy roles",
    url: (q) => `https://www.google.com/search?q=${encodeURIComponent(`${q} site:irena.org OR site:careers.un.org`)}`,
  },
];
