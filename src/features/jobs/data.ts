import type { FuelType } from "@/features/policy/taxonomy";
import type {
  Employer,
  JobBoard,
  JobCategory,
  JobRegion,
  Seniority,
} from "@/features/jobs/contracts";

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

export const EMPLOYERS: Employer[] = [
  {
    name: "Neste",
    hq: "Finland",
    focus: ["Renewable Diesel", "SAF"],
    careers: "https://www.neste.com/careers",
  },
  {
    name: "LanzaJet",
    hq: "United States",
    focus: ["SAF", "Ethanol"],
    careers: "https://www.lanzajet.com/careers",
  },
  {
    name: "LanzaTech",
    hq: "United States",
    focus: ["SAF", "Feedstock"],
    careers: "https://lanzatech.com/careers/",
  },
  { name: "POET", hq: "United States", focus: ["Ethanol"], careers: "https://poet.com/careers" },
  {
    name: "Green Plains",
    hq: "United States",
    focus: ["Ethanol"],
    careers: "https://gpreinc.com/careers/",
  },
  {
    name: "Valero (Diamond Green Diesel)",
    hq: "United States",
    focus: ["Renewable Diesel"],
    careers: "https://www.valero.com/careers",
  },
  {
    name: "Darling Ingredients",
    hq: "United States",
    focus: ["Renewable Diesel", "Feedstock"],
    careers: "https://www.darlingii.com/careers",
  },
  {
    name: "Bunge",
    hq: "United States",
    focus: ["Feedstock", "Biodiesel"],
    careers: "https://www.bunge.com/careers",
  },
  {
    name: "ADM",
    hq: "United States",
    focus: ["Ethanol", "Feedstock"],
    careers: "https://www.adm.com/careers/",
  },
  {
    name: "Chevron Renewable Energy Group",
    hq: "United States",
    focus: ["Biodiesel", "Renewable Diesel"],
    careers: "https://careers.chevron.com/",
  },
  {
    name: "Gevo",
    hq: "United States",
    focus: ["SAF", "Ethanol"],
    careers: "https://gevo.com/careers/",
  },
  {
    name: "Aemetis",
    hq: "United States",
    focus: ["Ethanol", "Biogas"],
    careers: "https://www.aemetis.com/careers/",
  },
  {
    name: "Montauk Renewables",
    hq: "United States",
    focus: ["Biogas"],
    careers: "https://montaukrenewables.com/careers/",
  },
  {
    name: "Clean Energy Fuels",
    hq: "United States",
    focus: ["Biogas"],
    careers: "https://www.cleanenergyfuels.com/careers",
  },
  {
    name: "Shell",
    hq: "United Kingdom",
    focus: ["SAF", "Biogas"],
    careers: "https://www.shell.com/careers",
  },
  {
    name: "BP / Archaea Energy",
    hq: "United Kingdom",
    focus: ["Biogas", "SAF"],
    careers: "https://www.bp.com/en/global/corporate/careers.html",
  },
  {
    name: "TotalEnergies",
    hq: "France",
    focus: ["SAF", "Renewable Diesel"],
    careers: "https://totalenergies.com/careers",
  },
  {
    name: "Eni Sustainable Mobility",
    hq: "Italy",
    focus: ["Renewable Diesel", "SAF"],
    careers: "https://www.eni.com/en-IT/careers.html",
  },
  {
    name: "VERBIO",
    hq: "Germany",
    focus: ["Biogas", "Biodiesel"],
    careers: "https://www.verbio.de/en/career/",
  },
  {
    name: "Novonesis (Novozymes)",
    hq: "Denmark",
    focus: ["Feedstock", "Ethanol"],
    careers: "https://www.novonesis.com/en/careers",
  },
  {
    name: "Raízen",
    hq: "Brazil",
    focus: ["Ethanol", "Biogas"],
    careers: "https://www.raizen.com.br/en/careers",
  },
  {
    name: "Praj Industries",
    hq: "India",
    focus: ["Ethanol", "SAF"],
    careers: "https://www.praj.net/careers/",
  },
];

export const SENIORITY_LEVELS: Seniority[] = [
  "Internship",
  "Entry level",
  "Mid level",
  "Senior",
  "Director / Head",
];

export const SENIORITY_QUERY: Record<Seniority, string> = {
  Internship: "intern OR internship OR graduate",
  "Entry level": 'junior OR "entry level" OR associate',
  "Mid level": "engineer OR specialist OR manager",
  Senior: "senior OR lead OR principal",
  "Director / Head": "director OR head OR vice president",
};

export const JOB_REGIONS: JobRegion[] = [
  { name: "Worldwide", location: "" },
  { name: "North America", location: "United States" },
  { name: "Latin America", location: "Brazil" },
  { name: "Europe", location: "European Union" },
  { name: "United Kingdom", location: "United Kingdom" },
  { name: "Middle East & Africa", location: "United Arab Emirates" },
  { name: "Asia", location: "India" },
  { name: "Oceania", location: "Australia" },
];

const enc = encodeURIComponent;

export const JOB_BOARDS: JobBoard[] = [
  {
    name: "LinkedIn Jobs",
    note: "Largest pool of bioenergy roles worldwide",
    domain: "linkedin.com",
    url: ({ keywords, location }) =>
      `https://www.linkedin.com/jobs/search/?keywords=${enc(keywords)}${location ? `&location=${enc(location)}` : ""}`,
  },
  {
    name: "Indeed",
    note: "Plant, operations and technician openings",
    domain: "indeed.com",
    url: ({ keywords, location }) =>
      `https://www.indeed.com/jobs?q=${enc(keywords)}${location ? `&l=${enc(location)}` : ""}`,
  },
  {
    name: "Google Jobs",
    note: "Aggregated listings across employer sites",
    domain: "google.com",
    url: ({ keywords, location }) =>
      `https://www.google.com/search?q=${enc(`${keywords} ${location} jobs`)}&ibp=htl;jobs`,
  },
  {
    name: "Climatebase",
    note: "Climate and clean-energy focused board",
    domain: "climatebase.org",
    url: ({ keywords }) => `https://climatebase.org/jobs?query=${enc(keywords)}`,
  },
  {
    name: "EURES (EU)",
    note: "European public employment network",
    domain: "europa.eu",
    url: ({ keywords }) =>
      `https://europa.eu/eures/portal/jv-se/search?keywords=${enc(keywords)}&lang=en`,
  },
  {
    name: "UN / IRENA careers",
    note: "Policy and multilateral bioenergy roles",
    domain: "irena.org",
    url: ({ keywords }) =>
      `https://www.google.com/search?q=${enc(`${keywords} site:irena.org OR site:careers.un.org`)}`,
  },
  {
    name: "Glassdoor",
    note: "Roles with pay ranges and employer reviews",
    domain: "glassdoor.com",
    url: ({ keywords }) => `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${enc(keywords)}`,
  },
  {
    name: "Idealist / NGO",
    note: "Non-profit and development bioenergy roles",
    domain: "idealist.org",
    url: ({ keywords }) => `https://www.idealist.org/en/jobs?q=${enc(keywords)}`,
  },
];
