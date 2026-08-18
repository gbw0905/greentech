export type Region =
  | "North America"
  | "Latin America"
  | "Europe"
  | "Asia-Pacific"
  | "Africa"
  | "Middle East"
  | "Global";

export const REGIONS: Region[] = [
  "North America",
  "Latin America",
  "Europe",
  "Asia-Pacific",
  "Africa",
  "Middle East",
  "Global",
];

export type FuelType =
  | "Ethanol"
  | "Biodiesel"
  | "Renewable Diesel"
  | "SAF"
  | "Biogas"
  | "Feedstock";

export const FUEL_TYPES: FuelType[] = [
  "Ethanol",
  "Biodiesel",
  "Renewable Diesel",
  "SAF",
  "Biogas",
  "Feedstock",
];

export const FUEL_KEYWORDS: Record<FuelType, string[]> = {
  Ethanol: ["ethanol", "e10", "e15", "e20", "e25", "e85", "bioethanol", "gasohol"],
  Biodiesel: ["biodiesel", "fame", "b10", "b20", "b30", "b35", "b40", "b100"],
  "Renewable Diesel": ["renewable diesel", "hvo", "green diesel", "hefa diesel"],
  SAF: ["sustainable aviation fuel", "saf", "jet fuel", "refueleu", "aviation"],
  Biogas: ["biogas", "biomethane", "rng", "renewable natural gas", "cbg"],
  Feedstock: [
    "used cooking oil",
    "uco",
    "tallow",
    "soybean oil",
    "palm oil",
    "canola",
    "corn",
    "sugarcane",
    "feedstock",
  ],
};

export interface CountryProfile {
  slug: string;
  /** Name as used in the world-atlas topojson */
  mapName: string;
  name: string;
  region: Region;
  aliases: string[];
  /** Extra terms that pull matching headlines into this country's live feed. */
  updateKeywords?: string[];
  blurb: string;
  mandates: { label: string; value: string }[];
  frameworks: string[];
}

export const COUNTRIES: CountryProfile[] = [
  {
    slug: "united-states",
    mapName: "United States of America",
    name: "United States",
    region: "North America",
    aliases: ["united states", "u.s.", "us epa", "usa", "america", "washington"],
    updateKeywords: [
      "45z",
      "45v",
      "epa",
      "irs",
      "treasury",
      "renewable fuel standard",
      "rfs",
      "rvo",
      "rin",
      "small refinery exemption",
      "e15",
      "clean fuel production credit",
      "clean hydrogen production credit",
      "lcfs",
    ],
    blurb:
      "The Renewable Fuel Standard sets annual volume obligations, while 45Z clean fuel production credits and state low-carbon fuel programs drive renewable diesel and SAF economics.",
    mandates: [
      { label: "Program", value: "Renewable Fuel Standard (RFS2)" },
      { label: "Ethanol blend", value: "E10 baseline, E15 seasonal expansion" },
      { label: "Tax credit", value: "45Z Clean Fuel Production Credit" },
      { label: "Hydrogen credit", value: "45V Clean Hydrogen Production Credit" },
      { label: "EPA rulemaking", value: "Annual RVOs, RIN market, small refinery exemptions" },
      { label: "IRS / Treasury", value: "45Z & 45V guidance, registration and GREET emissions rates" },
      { label: "State layer", value: "CA LCFS, OR CFP, WA CFS" },
    ],
    frameworks: ["RFS2", "45Z", "45V", "EPA", "IRS", "LCFS", "SAF Grand Challenge"],
  },
  {
    slug: "canada",
    mapName: "Canada",
    name: "Canada",
    region: "North America",
    aliases: ["canada", "ottawa", "british columbia", "ontario"],
    blurb:
      "The federal Clean Fuel Regulations impose declining carbon-intensity limits on liquid fuels, complemented by provincial renewable content requirements.",
    mandates: [
      { label: "Program", value: "Clean Fuel Regulations (CFR)" },
      { label: "Ethanol blend", value: "5% federal minimum (higher provincially)" },
      { label: "Biodiesel blend", value: "2% federal minimum" },
      { label: "Provincial layer", value: "BC-LCFS carbon intensity credits" },
    ],
    frameworks: ["CFR", "BC-LCFS"],
  },
  {
    slug: "brazil",
    mapName: "Brazil",
    name: "Brazil",
    region: "Latin America",
    aliases: ["brazil", "brasil", "anp", "cnpe", "brasilia"],
    blurb:
      "RenovaBio's decarbonisation credits plus the Fuel of the Future law push some of the world's highest mandated blend rates for both ethanol and biodiesel.",
    mandates: [
      { label: "Program", value: "RenovaBio (CBIO credits)" },
      { label: "Ethanol blend", value: "E27–E30 anhydrous mandate" },
      { label: "Biodiesel blend", value: "B15 stepping toward B20" },
      { label: "Aviation", value: "Fuel of the Future SAF targets from 2027" },
    ],
    frameworks: ["RenovaBio", "Fuel of the Future Law"],
  },
  {
    slug: "argentina",
    mapName: "Argentina",
    name: "Argentina",
    region: "Latin America",
    aliases: ["argentina", "buenos aires"],
    blurb:
      "A regulated domestic biofuels law sets blend floors and price formulas while the country remains a major biodiesel exporter.",
    mandates: [
      { label: "Program", value: "Biofuels Law 27.640" },
      { label: "Ethanol blend", value: "E12" },
      { label: "Biodiesel blend", value: "B7.5 (adjustable)" },
    ],
    frameworks: ["Law 27.640"],
  },
  {
    slug: "colombia",
    mapName: "Colombia",
    name: "Colombia",
    region: "Latin America",
    aliases: ["colombia", "bogota"],
    blurb: "Palm-based biodiesel and sugarcane ethanol blends are set by ministerial resolution.",
    mandates: [
      { label: "Ethanol blend", value: "E10" },
      { label: "Biodiesel blend", value: "B10" },
    ],
    frameworks: ["Ministry of Mines resolutions"],
  },
  {
    slug: "european-union",
    mapName: "",
    name: "European Union",
    region: "Europe",
    // EU institutions and instruments — used to attribute Brussels-level news.
    aliases: [
      "european union",
      "eu ",
      " eu's",
      "brussels",
      "european commission",
      "european parliament",
      "council of the eu",
      "official journal of the european union",
      "red ii",
      "red iii",
      "renewable energy directive",
      "refueleu",
      "refuel eu",
      "fueleu",
      "fuel eu maritime",
      "fit for 55",
      "eu ets",
      "delegated act",
      "eu biofuel",
      "eu blending",
      "eu mandate",
    ],
    blurb:
      "RED III sets a 29% renewable transport target or 14.5% GHG intensity reduction by 2030, with ReFuelEU Aviation imposing binding SAF blending quotas on fuel suppliers.",
    mandates: [
      { label: "Program", value: "Renewable Energy Directive III" },
      { label: "Transport target", value: "29% RES-T or 14.5% GHG reduction by 2030" },
      { label: "Advanced fuels", value: "5.5% advanced biofuels + RFNBO sub-target" },
      { label: "Aviation", value: "ReFuelEU: 6% SAF by 2030, 70% by 2050" },
    ],
    frameworks: ["RED III", "ReFuelEU Aviation", "FuelEU Maritime"],
  },
  {
    slug: "germany",
    mapName: "Germany",
    name: "Germany",
    region: "Europe",
    aliases: ["germany", "berlin", "bundestag", "german"],
    blurb:
      "Germany implements RED III through a GHG quota on fuel suppliers, with tight caps on crop-based fuels and scrutiny of imported UCO-based volumes.",
    mandates: [
      { label: "Program", value: "GHG quota (THG-Quote)" },
      { label: "2030 target", value: "25.1% GHG reduction" },
      { label: "Crop cap", value: "Limited crop-based share" },
    ],
    frameworks: ["THG-Quote", "BImSchG 37a"],
  },
  {
    slug: "france",
    mapName: "France",
    name: "France",
    region: "Europe",
    aliases: ["france", "paris", "french"],
    blurb:
      "The TIRUERT incentive tax pushes suppliers toward renewable energy shares in road and aviation fuel.",
    mandates: [
      { label: "Program", value: "TIRUERT incentive tax" },
      { label: "Aviation", value: "National SAF mandate aligned with ReFuelEU" },
    ],
    frameworks: ["TIRUERT"],
  },
  {
    slug: "netherlands",
    mapName: "Netherlands",
    name: "Netherlands",
    region: "Europe",
    aliases: ["netherlands", "dutch", "the hague", "rotterdam"],
    blurb:
      "A HBE ticket system governs annual renewable energy obligations and is the reference market for European biofuel compliance pricing.",
    mandates: [
      { label: "Program", value: "Energy for Transport (HBE tickets)" },
      { label: "Focus", value: "Advanced biofuels, biomethane, maritime" },
    ],
    frameworks: ["HBE", "FuelEU Maritime"],
  },
  {
    slug: "united-kingdom",
    mapName: "United Kingdom",
    name: "United Kingdom",
    region: "Europe",
    aliases: ["united kingdom", "uk ", "britain", "london", "westminster"],
    blurb:
      "The RTFO drives road fuel obligations while a separate SAF Mandate plus revenue certainty mechanism underpins aviation fuel investment.",
    mandates: [
      { label: "Program", value: "Renewable Transport Fuel Obligation" },
      { label: "Aviation", value: "SAF Mandate: 10% by 2030" },
      { label: "Support", value: "SAF revenue certainty mechanism" },
    ],
    frameworks: ["RTFO", "UK SAF Mandate"],
  },
  {
    slug: "sweden",
    mapName: "Sweden",
    name: "Sweden",
    region: "Europe",
    aliases: ["sweden", "stockholm", "swedish"],
    blurb: "The reduction obligation sets GHG-intensity cuts for petrol and diesel suppliers.",
    mandates: [
      { label: "Program", value: "Reduktionsplikt (reduction obligation)" },
      { label: "Aviation", value: "National SAF blending obligation" },
    ],
    frameworks: ["Reduktionsplikt"],
  },
  {
    slug: "india",
    mapName: "India",
    name: "India",
    region: "Asia-Pacific",
    aliases: ["india", "new delhi", "niti aayog", "indian"],
    blurb:
      "After hitting E20 ahead of schedule, policy attention shifts to higher ethanol blends, compressed biogas obligations and a nascent SAF roadmap.",
    mandates: [
      { label: "Program", value: "Ethanol Blended Petrol Programme" },
      { label: "Ethanol blend", value: "E20 achieved; E27 under study" },
      { label: "Biogas", value: "CBG blending obligation in CNG/PNG" },
      { label: "Aviation", value: "1% SAF indicative target for 2027" },
    ],
    frameworks: ["EBP", "SATAT", "National Biofuel Policy"],
  },
  {
    slug: "indonesia",
    mapName: "Indonesia",
    name: "Indonesia",
    region: "Asia-Pacific",
    aliases: ["indonesia", "jakarta", "pertamina", "indonesian"],
    blurb:
      "The world's most aggressive palm-based biodiesel mandate, funded by a CPO export levy, with stepwise moves toward B50.",
    mandates: [
      { label: "Program", value: "Mandatory Biodiesel Programme" },
      { label: "Biodiesel blend", value: "B40 nationwide, B50 targeted" },
      { label: "Funding", value: "BPDPKS palm export levy" },
    ],
    frameworks: ["B40/B50", "BPDPKS levy"],
  },
  {
    slug: "china",
    mapName: "China",
    name: "China",
    region: "Asia-Pacific",
    aliases: ["china", "beijing", "chinese", "sinopec"],
    blurb:
      "Provincial E10 pilots continue while SAF trials, UCO export dynamics and a national carbon framework shape the biofuel outlook.",
    mandates: [
      { label: "Ethanol blend", value: "E10 in selected provinces" },
      { label: "Aviation", value: "National SAF pilot programme" },
      { label: "Exports", value: "UCO and HVO export policy shifts" },
    ],
    frameworks: ["Five-Year Plan energy targets", "SAF pilots"],
  },
  {
    slug: "japan",
    mapName: "Japan",
    name: "Japan",
    region: "Asia-Pacific",
    aliases: ["japan", "tokyo", "meti", "japanese"],
    blurb:
      "METI requires SAF to make up 10% of jet fuel uplifted by domestic airlines by 2030, backed by GX transition funding.",
    mandates: [
      { label: "Aviation", value: "10% SAF by 2030 obligation" },
      { label: "Support", value: "GX transition subsidies" },
    ],
    frameworks: ["METI SAF obligation", "GX Policy"],
  },
  {
    slug: "south-korea",
    mapName: "South Korea",
    name: "South Korea",
    region: "Asia-Pacific",
    aliases: ["south korea", "korea", "seoul", "korean"],
    blurb: "The RFS raises biodiesel blend obligations on a fixed schedule, with SAF pilots underway.",
    mandates: [
      { label: "Program", value: "Renewable Fuel Standard" },
      { label: "Biodiesel blend", value: "B5 rising toward B8" },
      { label: "Aviation", value: "1% SAF from 2027 (planned)" },
    ],
    frameworks: ["Korea RFS"],
  },
  {
    slug: "australia",
    mapName: "Australia",
    name: "Australia",
    region: "Asia-Pacific",
    aliases: ["australia", "canberra", "australian"],
    blurb:
      "State ethanol mandates coexist with a federal push for a low carbon liquid fuels standard and domestic SAF production.",
    mandates: [
      { label: "State mandates", value: "NSW E6 / B2, Queensland E4" },
      { label: "Federal", value: "Low Carbon Liquid Fuel Standard consultation" },
    ],
    frameworks: ["LCLFS (proposed)", "State mandates"],
  },
  {
    slug: "thailand",
    mapName: "Thailand",
    name: "Thailand",
    region: "Asia-Pacific",
    aliases: ["thailand", "bangkok", "thai"],
    blurb: "Gasohol and palm biodiesel blends are managed alongside a legislated SAF ramp.",
    mandates: [
      { label: "Ethanol blend", value: "E20 as reference grade" },
      { label: "Biodiesel blend", value: "B7–B10" },
      { label: "Aviation", value: "1% SAF from 2026 (planned)" },
    ],
    frameworks: ["AEDP"],
  },
  {
    slug: "malaysia",
    mapName: "Malaysia",
    name: "Malaysia",
    region: "Asia-Pacific",
    aliases: ["malaysia", "kuala lumpur", "malaysian"],
    blurb: "Palm biodiesel blending expands sector by sector, with SAF ambitions in the national energy roadmap.",
    mandates: [
      { label: "Biodiesel blend", value: "B10 transport, B20 industrial rollout" },
      { label: "Aviation", value: "47% SAF blend ambition by 2050" },
    ],
    frameworks: ["National Energy Transition Roadmap"],
  },
  {
    slug: "philippines",
    mapName: "Philippines",
    name: "Philippines",
    region: "Asia-Pacific",
    aliases: ["philippines", "manila", "filipino"],
    blurb: "The Biofuels Act blend levels are stepped up by Department of Energy circulars.",
    mandates: [
      { label: "Ethanol blend", value: "E10 moving to E20 by 2030" },
      { label: "Biodiesel blend", value: "B4 rising to B5" },
    ],
    frameworks: ["Biofuels Act 9367"],
  },
  {
    slug: "south-africa",
    mapName: "South Africa",
    name: "South Africa",
    region: "Africa",
    aliases: ["south africa", "pretoria", "johannesburg"],
    blurb: "A long-delayed biofuels regulatory framework and pricing mechanism remain the key policy variable.",
    mandates: [
      { label: "Framework", value: "Biofuels Regulatory Framework" },
      { label: "Status", value: "Mandatory blending pending implementation" },
    ],
    frameworks: ["Biofuels Regulatory Framework"],
  },
  {
    slug: "nigeria",
    mapName: "Nigeria",
    name: "Nigeria",
    region: "Africa",
    aliases: ["nigeria", "abuja", "lagos"],
    blurb: "The national biofuel policy targets domestic ethanol production to offset gasoline imports.",
    mandates: [
      { label: "Ethanol blend", value: "E10 policy target" },
      { label: "Biodiesel blend", value: "B20 aspiration" },
    ],
    frameworks: ["Nigerian Biofuel Policy"],
  },
  {
    slug: "kenya",
    mapName: "Kenya",
    name: "Kenya",
    region: "Africa",
    aliases: ["kenya", "nairobi"],
    blurb: "Ethanol blending pilots and bioenergy strategy work anchor East African biofuel policy.",
    mandates: [
      { label: "Ethanol blend", value: "E10 pilot regions" },
      { label: "Strategy", value: "Bioenergy Strategy implementation" },
    ],
    frameworks: ["Bioenergy Strategy"],
  },
  {
    slug: "united-arab-emirates",
    mapName: "United Arab Emirates",
    name: "United Arab Emirates",
    region: "Middle East",
    aliases: ["united arab emirates", "uae", "abu dhabi", "dubai"],
    blurb: "A national SAF policy sets blending requirements for departing flights alongside domestic production plans.",
    mandates: [
      { label: "Aviation", value: "1% SAF for departing flights from 2031" },
      { label: "Production", value: "Domestic HEFA and e-fuel projects" },
    ],
    frameworks: ["National SAF Policy"],
  },
  {
    slug: "saudi-arabia",
    mapName: "Saudi Arabia",
    name: "Saudi Arabia",
    region: "Middle East",
    aliases: ["saudi arabia", "riyadh", "aramco"],
    blurb: "Circular carbon economy policy frames early SAF and waste-to-fuel investment.",
    mandates: [
      { label: "Framework", value: "Circular Carbon Economy" },
      { label: "Aviation", value: "SAF production ventures under review" },
    ],
    frameworks: ["Vision 2030", "CCE"],
  },
];

export function countryBySlug(slug: string) {
  return COUNTRIES.find((c) => c.slug === slug);
}

/** Emoji flag per tracked jurisdiction. */
export const COUNTRY_FLAG: Record<string, string> = {
  "united-states": "🇺🇸",
  canada: "🇨🇦",
  brazil: "🇧🇷",
  argentina: "🇦🇷",
  colombia: "🇨🇴",
  "european-union": "🇪🇺",
  germany: "🇩🇪",
  france: "🇫🇷",
  netherlands: "🇳🇱",
  "united-kingdom": "🇬🇧",
  sweden: "🇸🇪",
  india: "🇮🇳",
  indonesia: "🇮🇩",
  china: "🇨🇳",
  japan: "🇯🇵",
  "south-korea": "🇰🇷",
  australia: "🇦🇺",
  thailand: "🇹🇭",
  malaysia: "🇲🇾",
  philippines: "🇵🇭",
  "south-africa": "🇿🇦",
  nigeria: "🇳🇬",
  kenya: "🇰🇪",
  "united-arab-emirates": "🇦🇪",
  "saudi-arabia": "🇸🇦",
};

/** Flag emoji for a country slug, falling back to a globe for unmapped jurisdictions. */
export function flagFor(slug: string | null | undefined) {
  if (!slug) return "🌐";
  return COUNTRY_FLAG[slug] ?? "🌐";
}

export const REGION_ACCENT: Record<Region, string> = {
  "North America": "var(--region-na)",
  "Latin America": "var(--region-latam)",
  Europe: "var(--region-eu)",
  "Asia-Pacific": "var(--region-apac)",
  Africa: "var(--region-africa)",
  "Middle East": "var(--region-me)",
  Global: "var(--region-global)",
};

export const FUEL_ACCENT: Record<FuelType, string> = {
  Ethanol: "var(--fuel-ethanol)",
  Biodiesel: "var(--fuel-biodiesel)",
  "Renewable Diesel": "var(--fuel-renewable-diesel)",
  SAF: "var(--fuel-saf)",
  Biogas: "var(--fuel-biogas)",
  Feedstock: "var(--fuel-feedstock)",
};

/** How far a jurisdiction has taken its biofuel policy. */
export type PolicyStatus = "Mandated" | "Policy framework" | "In development" | "No framework";

const PLANNED = /(planned|proposed|consultation|draft|target|from 20\d\d|pilot|under review)/i;
const BLEND = /\b([EB]\d{1,2}|\d{1,2}(\.\d)?\s?%|obligation|mandate|blend)/i;

export function policyStatusFor(country: CountryProfile | undefined | null): PolicyStatus {
  if (!country) return "No framework";
  const values = country.mandates.map((m) => `${m.label} ${m.value}`);
  const binding = values.some((v) => BLEND.test(v) && !PLANNED.test(v));
  if (binding) return "Mandated";
  if (values.length > 0 && values.some((v) => !PLANNED.test(v))) return "Policy framework";
  if (values.length > 0) return "In development";
  return "No framework";
}

export const POLICY_STATUS_COLOR: Record<PolicyStatus, string> = {
  Mandated: "oklch(0.62 0.19 152)",
  "Policy framework": "oklch(0.76 0.17 78)",
  "In development": "oklch(0.66 0.2 292)",
  "No framework": "oklch(0.88 0.015 250)",
};