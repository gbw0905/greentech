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

  // ---- Additional jurisdictions with active bioenergy policy progress ----
  { slug: "mexico", mapName: "Mexico", name: "Mexico", region: "Latin America", aliases: ["mexico", "mexican", "cdmx", "pemex", "sener"], blurb: "Fuel quality rules (NOM-016) allow limited ethanol blending while a national bioenergy and SAF agenda develops.", mandates: [{ label: "Ethanol blend", value: "Up to E5.8 outside main metro areas" }, { label: "Aviation", value: "SAF roadmap under development" }], frameworks: ["NOM-016-CRE", "SENER bioenergy programme"] },
  { slug: "chile", mapName: "Chile", name: "Chile", region: "Latin America", aliases: ["chile", "santiago"], blurb: "Green hydrogen and e-fuels strategy anchors bioenergy policy, with biomass heat regulation in the south.", mandates: [{ label: "Strategy", value: "National Green Hydrogen & e-fuels strategy" }, { label: "Blending", value: "Voluntary biofuel blending" }], frameworks: ["Energía 2050", "H2 Strategy"] },
  { slug: "peru", mapName: "Peru", name: "Peru", region: "Latin America", aliases: ["peru", "lima", "osinergmin"], blurb: "Legislated blending obligations for diesel and gasohol are administered by the energy ministry.", mandates: [{ label: "Ethanol blend", value: "E7.8 gasohol" }, { label: "Biodiesel blend", value: "B5" }], frameworks: ["Ley de Promoción del Mercado de Biocombustibles"] },
  { slug: "paraguay", mapName: "Paraguay", name: "Paraguay", region: "Latin America", aliases: ["paraguay", "asuncion"], blurb: "Decree-set blends use domestic sugarcane ethanol and soy biodiesel.", mandates: [{ label: "Ethanol blend", value: "E25 (adjusted by decree)" }, { label: "Biodiesel blend", value: "B5" }], frameworks: ["MIC/ MOPC decrees"] },
  { slug: "uruguay", mapName: "Uruguay", name: "Uruguay", region: "Latin America", aliases: ["uruguay", "montevideo", "ancap"], blurb: "State fuel company ANCAP blends legislated ethanol and biodiesel volumes; e-fuel projects are advancing.", mandates: [{ label: "Ethanol blend", value: "E5 minimum" }, { label: "Biodiesel blend", value: "B5 maximum" }], frameworks: ["Ley 18.195"] },
  { slug: "ecuador", mapName: "Ecuador", name: "Ecuador", region: "Latin America", aliases: ["ecuador", "quito"], blurb: "The Ecopaís programme blends sugarcane ethanol into gasoline in selected regions.", mandates: [{ label: "Ethanol blend", value: "E5 Ecopaís" }], frameworks: ["Ecopaís programme"] },
  { slug: "bolivia", mapName: "Bolivia", name: "Bolivia", region: "Latin America", aliases: ["bolivia", "la paz", "ypfb"], blurb: "Additive-grade ethanol and new renewable diesel plants are driven by import-substitution laws.", mandates: [{ label: "Ethanol blend", value: "E12 target" }, { label: "Renewable diesel", value: "State HVO plants under Law 1098" }], frameworks: ["Law 1098"] },
  { slug: "guatemala", mapName: "Guatemala", name: "Guatemala", region: "Latin America", aliases: ["guatemala"], blurb: "Ethanol blending legislation has been repeatedly debated alongside a large sugarcane export sector.", mandates: [{ label: "Ethanol blend", value: "E5 proposed" }], frameworks: ["MEM biofuel regulation (draft)"] },
  { slug: "costa-rica", mapName: "Costa Rica", name: "Costa Rica", region: "Latin America", aliases: ["costa rica", "san jose", "recope"], blurb: "Decarbonisation plan commitments include biofuel and biogas deployment through RECOPE.", mandates: [{ label: "Plan", value: "National Decarbonisation Plan" }, { label: "Blending", value: "E8 / B20 pilot decrees" }], frameworks: ["Decarbonisation Plan"] },
  { slug: "dominican-republic", mapName: "Dominican Rep.", name: "Dominican Republic", region: "Latin America", aliases: ["dominican republic", "santo domingo"], blurb: "Renewable incentives law supports biomass power and early biofuel blending studies.", mandates: [{ label: "Framework", value: "Law 57-07 renewable incentives" }], frameworks: ["Law 57-07"] },

  { slug: "spain", mapName: "Spain", name: "Spain", region: "Europe", aliases: ["spain", "madrid", "spanish", "idae"], blurb: "RED III is transposed through annual PBE renewable fuel obligations with SAF sub-targets.", mandates: [{ label: "Obligation", value: "PBE renewable energy in transport target" }, { label: "Aviation", value: "ReFuelEU SAF blending" }], frameworks: ["RED III", "PBE", "PNIEC"] },
  { slug: "italy", mapName: "Italy", name: "Italy", region: "Europe", aliases: ["italy", "rome", "italian", "gse", "eni"], blurb: "Biomethane and HVO policy is among Europe's most developed, backed by the PNRR biomethane decree.", mandates: [{ label: "Obligation", value: "Transport renewable quota with biomethane certificates" }, { label: "Biomethane", value: "PNRR biomethane support decree" }], frameworks: ["RED III", "PNRR biomethane"] },
  { slug: "poland", mapName: "Poland", name: "Poland", region: "Europe", aliases: ["poland", "warsaw", "polish"], blurb: "The National Indicative Target sets annual renewable fuel shares for fuel suppliers.", mandates: [{ label: "Obligation", value: "National Indicative Target (NCW)" }], frameworks: ["RED III", "NCW"] },
  { slug: "austria", mapName: "Austria", name: "Austria", region: "Europe", aliases: ["austria", "vienna"], blurb: "Fuel ordinance blending obligations run alongside a renewable gas quota for grid biomethane.", mandates: [{ label: "Obligation", value: "Kraftstoffverordnung substitution target" }, { label: "Gas", value: "Renewable Gas Act green gas quota" }], frameworks: ["RED III", "EAG"] },
  { slug: "belgium", mapName: "Belgium", name: "Belgium", region: "Europe", aliases: ["belgium", "brussels region", "flanders", "wallonia"], blurb: "Federal blending obligation covers gasoline and diesel with rising advanced-fuel sub-quotas.", mandates: [{ label: "Obligation", value: "Federal biofuel blending law" }], frameworks: ["RED III"] },
  { slug: "denmark", mapName: "Denmark", name: "Denmark", region: "Europe", aliases: ["denmark", "copenhagen", "danish"], blurb: "A national SAF blending requirement and large biogas grid share lead European bioenergy policy.", mandates: [{ label: "Aviation", value: "National SAF blending requirement" }, { label: "Biogas", value: "Majority-biomethane gas grid" }], frameworks: ["RED III", "Green Fuels agreement"] },
  { slug: "finland", mapName: "Finland", name: "Finland", region: "Europe", aliases: ["finland", "helsinki", "neste"], blurb: "The distribution obligation act sets one of the EU's highest renewable transport fuel shares.", mandates: [{ label: "Obligation", value: "Distribution obligation for renewable fuels" }, { label: "Aviation", value: "SAF distribution obligation" }], frameworks: ["RED III", "Distribution Obligation Act"] },
  { slug: "norway", mapName: "Norway", name: "Norway", region: "Europe", aliases: ["norway", "oslo", "norwegian"], blurb: "Turnover requirements cover road transport and aviation, with advanced biofuel sub-quotas.", mandates: [{ label: "Road", value: "Biofuel turnover requirement" }, { label: "Aviation", value: "SAF turnover requirement" }], frameworks: ["Product Regulations"] },
  { slug: "ireland", mapName: "Ireland", name: "Ireland", region: "Europe", aliases: ["ireland", "dublin", "nora"], blurb: "The Renewable Transport Fuel Obligation rises annually under NORA administration.", mandates: [{ label: "Obligation", value: "Renewable Transport Fuel Obligation (RTFO)" }], frameworks: ["RED III", "RTFO"] },
  { slug: "portugal", mapName: "Portugal", name: "Portugal", region: "Europe", aliases: ["portugal", "lisbon", "galp"], blurb: "Incorporation targets for renewable fuels are set by decree, with HVO and biomethane projects scaling.", mandates: [{ label: "Obligation", value: "Renewable fuel incorporation target" }], frameworks: ["RED III", "RNC2050"] },
  { slug: "czechia", mapName: "Czechia", name: "Czechia", region: "Europe", aliases: ["czechia", "czech republic", "prague"], blurb: "Air Protection Act blending duties are being lifted to meet RED III transport targets.", mandates: [{ label: "Obligation", value: "Blending duty under Air Protection Act" }], frameworks: ["RED III"] },
  { slug: "hungary", mapName: "Hungary", name: "Hungary", region: "Europe", aliases: ["hungary", "budapest", "mol"], blurb: "Statutory blending shares support domestic ethanol production and new HVO capacity.", mandates: [{ label: "Obligation", value: "Mandatory renewable fuel share" }], frameworks: ["RED III"] },
  { slug: "romania", mapName: "Romania", name: "Romania", region: "Europe", aliases: ["romania", "bucharest"], blurb: "Government decisions set minimum bioethanol and biodiesel content in road fuels.", mandates: [{ label: "Ethanol blend", value: "Minimum bioethanol content" }, { label: "Biodiesel blend", value: "Minimum FAME content" }], frameworks: ["RED III"] },
  { slug: "bulgaria", mapName: "Bulgaria", name: "Bulgaria", region: "Europe", aliases: ["bulgaria", "sofia"], blurb: "Fuel quality law sets blending shares; advanced fuel sub-targets follow RED III.", mandates: [{ label: "Obligation", value: "Statutory blending share" }], frameworks: ["RED III"] },
  { slug: "croatia", mapName: "Croatia", name: "Croatia", region: "Europe", aliases: ["croatia", "zagreb"], blurb: "Biofuel placement obligations apply to fuel suppliers under the alternative fuels law.", mandates: [{ label: "Obligation", value: "Biofuel placement obligation" }], frameworks: ["RED III"] },
  { slug: "slovakia", mapName: "Slovakia", name: "Slovakia", region: "Europe", aliases: ["slovakia", "bratislava"], blurb: "Reference blending values rise on a legislated schedule toward 2030.", mandates: [{ label: "Obligation", value: "Reference blending values" }], frameworks: ["RED III"] },
  { slug: "slovenia", mapName: "Slovenia", name: "Slovenia", region: "Europe", aliases: ["slovenia", "ljubljana"], blurb: "Decree on renewable energy in transport sets supplier obligations.", mandates: [{ label: "Obligation", value: "Renewable energy in transport decree" }], frameworks: ["RED III"] },
  { slug: "greece", mapName: "Greece", name: "Greece", region: "Europe", aliases: ["greece", "athens", "hellenic"], blurb: "Allocated biodiesel volumes and a growing biomethane framework implement EU targets.", mandates: [{ label: "Biodiesel blend", value: "Allocated FAME volumes" }, { label: "Biomethane", value: "Grid injection framework" }], frameworks: ["RED III"] },
  { slug: "lithuania", mapName: "Lithuania", name: "Lithuania", region: "Europe", aliases: ["lithuania", "vilnius"], blurb: "Supplier obligation with advanced biofuel sub-target; large biomass district heating share.", mandates: [{ label: "Obligation", value: "Renewable transport supplier obligation" }], frameworks: ["RED III"] },
  { slug: "latvia", mapName: "Latvia", name: "Latvia", region: "Europe", aliases: ["latvia", "riga"], blurb: "Blending requirements resumed alongside biomethane and wood-fuel policy.", mandates: [{ label: "Obligation", value: "Mandatory blending requirement" }], frameworks: ["RED III"] },
  { slug: "estonia", mapName: "Estonia", name: "Estonia", region: "Europe", aliases: ["estonia", "tallinn"], blurb: "Renewable energy share obligation in transport with biomethane support schemes.", mandates: [{ label: "Obligation", value: "Transport renewable share obligation" }, { label: "Biomethane", value: "Support scheme auctions" }], frameworks: ["RED III"] },
  { slug: "switzerland", mapName: "Switzerland", name: "Switzerland", region: "Europe", aliases: ["switzerland", "bern", "swiss"], blurb: "CO2 Act compensation obligations and a planned SAF blending quota aligned with the EU.", mandates: [{ label: "Aviation", value: "SAF blending quota (CO2 Act)" }, { label: "Road", value: "Compensation obligation for importers" }], frameworks: ["CO2 Act"] },
  { slug: "ukraine", mapName: "Ukraine", name: "Ukraine", region: "Europe", aliases: ["ukraine", "kyiv"], blurb: "Law 3769 introduced mandatory bioethanol blending; biomethane exports to the EU are scaling.", mandates: [{ label: "Ethanol blend", value: "Mandatory 5–10% bioethanol" }, { label: "Biomethane", value: "Registry and EU export framework" }], frameworks: ["Law 3769-IX"] },
  { slug: "serbia", mapName: "Serbia", name: "Serbia", region: "Europe", aliases: ["serbia", "belgrade"], blurb: "Energy Community alignment drives new biofuel and biogas rules.", mandates: [{ label: "Framework", value: "Energy Community renewable transport target" }], frameworks: ["Energy Community"] },
  { slug: "turkey", mapName: "Turkey", name: "Türkiye", region: "Europe", aliases: ["turkey", "türkiye", "turkiye", "ankara", "epdk"], blurb: "EPDK sets mandatory ethanol and biodiesel blending shares, with a SAF mandate from 2025.", mandates: [{ label: "Ethanol blend", value: "3% mandatory" }, { label: "Biodiesel blend", value: "0.5–1% mandatory" }, { label: "Aviation", value: "SAF blending obligation" }], frameworks: ["EPDK regulations"] },
  { slug: "russia", mapName: "Russia", name: "Russia", region: "Europe", aliases: ["russia", "moscow"], blurb: "Pellet and biomass policy dominates; transport biofuel rules remain limited.", mandates: [{ label: "Framework", value: "Bioenergy development programme" }], frameworks: ["Energy Strategy 2035"] },

  { slug: "vietnam", mapName: "Vietnam", name: "Vietnam", region: "Asia-Pacific", aliases: ["vietnam", "hanoi", "ho chi minh"], blurb: "E5 RON92 is nationally mandated with an E10 roadmap and new SAF commitments.", mandates: [{ label: "Ethanol blend", value: "E5 nationwide, E10 roadmap" }, { label: "Aviation", value: "SAF adoption roadmap" }], frameworks: ["Decision 53/QD-TTg"] },
  { slug: "singapore", mapName: "Singapore", name: "Singapore", region: "Asia-Pacific", aliases: ["singapore", "caas", "changi"], blurb: "A levy-funded SAF target applies to departing flights from 2026.", mandates: [{ label: "Aviation", value: "1% SAF from 2026, 3–5% by 2030" }, { label: "Marine", value: "Green bunkering framework" }], frameworks: ["Singapore Sustainable Air Hub Blueprint"] },
  { slug: "taiwan", mapName: "Taiwan", name: "Taiwan", region: "Asia-Pacific", aliases: ["taiwan", "taipei"], blurb: "SAF blending guidance for international departures begins this decade alongside biogas policy.", mandates: [{ label: "Aviation", value: "5% SAF target by 2030" }], frameworks: ["Net-Zero Pathway 2050"] },
  { slug: "new-zealand", mapName: "New Zealand", name: "New Zealand", region: "Asia-Pacific", aliases: ["new zealand", "wellington", "auckland"], blurb: "After repealing the biofuels obligation, policy focuses on SAF projects and biogas.", mandates: [{ label: "Status", value: "Sustainable Biofuels Obligation repealed" }, { label: "Aviation", value: "SAF consortium and feasibility work" }], frameworks: ["Emissions Reduction Plan"] },
  { slug: "pakistan", mapName: "Pakistan", name: "Pakistan", region: "Asia-Pacific", aliases: ["pakistan", "islamabad", "ogra"], blurb: "Ethanol blending policy is under approval as sugar-sector ethanol capacity grows.", mandates: [{ label: "Ethanol blend", value: "E10 policy under approval" }], frameworks: ["Petroleum Division biofuel policy (draft)"] },
  { slug: "bangladesh", mapName: "Bangladesh", name: "Bangladesh", region: "Asia-Pacific", aliases: ["bangladesh", "dhaka"], blurb: "Waste-to-energy and biogas programmes lead, with early biofuel blending studies.", mandates: [{ label: "Framework", value: "Renewable Energy Policy / biogas programme" }], frameworks: ["SREDA"] },
  { slug: "sri-lanka", mapName: "Sri Lanka", name: "Sri Lanka", region: "Asia-Pacific", aliases: ["sri lanka", "colombo"], blurb: "Biomass energy and pilot ethanol blending sit within the national energy policy.", mandates: [{ label: "Framework", value: "National Energy Policy bioenergy targets" }], frameworks: ["SLSEA"] },
  { slug: "nepal", mapName: "Nepal", name: "Nepal", region: "Asia-Pacific", aliases: ["nepal", "kathmandu"], blurb: "Large-scale domestic biogas programme plus early ethanol blending trials.", mandates: [{ label: "Programme", value: "National Biogas Programme" }], frameworks: ["AEPC"] },
  { slug: "kazakhstan", mapName: "Kazakhstan", name: "Kazakhstan", region: "Asia-Pacific", aliases: ["kazakhstan", "astana"], blurb: "Biofuel production law and new biogas rules support agricultural residue use.", mandates: [{ label: "Framework", value: "Law on biofuel production and turnover" }], frameworks: ["Law on Biofuels"] },
  { slug: "mongolia", mapName: "Mongolia", name: "Mongolia", region: "Asia-Pacific", aliases: ["mongolia", "ulaanbaatar"], blurb: "Clean heating policy promotes biomass briquettes and biogas in ger districts.", mandates: [{ label: "Framework", value: "Clean air / clean heating programme" }], frameworks: ["Green Development Policy"] },
  { slug: "cambodia", mapName: "Cambodia", name: "Cambodia", region: "Asia-Pacific", aliases: ["cambodia", "phnom penh"], blurb: "Cassava ethanol and agro-biogas feature in the national energy efficiency and renewables plan.", mandates: [{ label: "Framework", value: "Bioenergy component of national energy plan" }], frameworks: ["NEEP"] },
  { slug: "laos", mapName: "Laos", name: "Laos", region: "Asia-Pacific", aliases: ["laos", "vientiane"], blurb: "Biofuel development strategy targets domestic ethanol and biodiesel substitution.", mandates: [{ label: "Target", value: "Biofuel share of transport fuel demand" }], frameworks: ["Renewable Energy Development Strategy"] },
  { slug: "myanmar", mapName: "Myanmar", name: "Myanmar", region: "Asia-Pacific", aliases: ["myanmar", "yangon"], blurb: "Rural biogas and biomass gasification programmes continue under the energy master plan.", mandates: [{ label: "Framework", value: "Energy Master Plan bioenergy component" }], frameworks: ["Energy Master Plan"] },
  { slug: "papua-new-guinea", mapName: "Papua New Guinea", name: "Papua New Guinea", region: "Asia-Pacific", aliases: ["papua new guinea", "port moresby"], blurb: "Coconut and palm-based biofuel projects sit within the national energy policy.", mandates: [{ label: "Framework", value: "National Energy Policy biofuel provisions" }], frameworks: ["National Energy Policy"] },
  { slug: "fiji", mapName: "Fiji", name: "Fiji", region: "Asia-Pacific", aliases: ["fiji", "suva"], blurb: "Coconut biodiesel and ethanol blending schemes support island fuel security.", mandates: [{ label: "Blending", value: "E10 / B5 programme" }], frameworks: ["National Energy Policy"] },

  { slug: "ghana", mapName: "Ghana", name: "Ghana", region: "Africa", aliases: ["ghana", "accra"], blurb: "The renewable energy master plan sets biofuel blending and clean-cooking bioenergy targets.", mandates: [{ label: "Blending", value: "E10 / B5 targets" }], frameworks: ["Renewable Energy Master Plan"] },
  { slug: "ethiopia", mapName: "Ethiopia", name: "Ethiopia", region: "Africa", aliases: ["ethiopia", "addis ababa"], blurb: "Sugar-estate ethanol supports a long-running blending programme in Addis Ababa and beyond.", mandates: [{ label: "Ethanol blend", value: "E10 blending programme" }], frameworks: ["Biofuel Development Strategy"] },
  { slug: "tanzania", mapName: "Tanzania", name: "Tanzania", region: "Africa", aliases: ["tanzania", "dodoma", "dar es salaam"], blurb: "Biofuel guidelines and a clean cooking strategy drive bioenergy deployment.", mandates: [{ label: "Framework", value: "National Biofuel Guidelines" }, { label: "Cooking", value: "National Clean Cooking Strategy" }], frameworks: ["EWURA", "Clean Cooking Strategy"] },
  { slug: "uganda", mapName: "Uganda", name: "Uganda", region: "Africa", aliases: ["uganda", "kampala"], blurb: "The Biofuels Act mandates blending once local supply thresholds are met.", mandates: [{ label: "Ethanol blend", value: "Blending under the Biofuels Act 2020" }], frameworks: ["Biofuels Act 2020"] },
  { slug: "zambia", mapName: "Zambia", name: "Zambia", region: "Africa", aliases: ["zambia", "lusaka"], blurb: "Statutory instruments set ethanol and biodiesel blend ratios for licensed marketers.", mandates: [{ label: "Ethanol blend", value: "E10 statutory ratio" }, { label: "Biodiesel blend", value: "B5 statutory ratio" }], frameworks: ["Energy Regulation Board SIs"] },
  { slug: "zimbabwe", mapName: "Zimbabwe", name: "Zimbabwe", region: "Africa", aliases: ["zimbabwe", "harare"], blurb: "Mandatory blending is set by statutory instrument and adjusted with ethanol supply.", mandates: [{ label: "Ethanol blend", value: "E10–E20 mandatory (supply-linked)" }], frameworks: ["SI 17 of 2013", "ZERA"] },
  { slug: "mozambique", mapName: "Mozambique", name: "Mozambique", region: "Africa", aliases: ["mozambique", "maputo"], blurb: "A biofuels policy and strategy sets phased blending targets for ethanol and biodiesel.", mandates: [{ label: "Blending", value: "Phased E10 / B5 targets" }], frameworks: ["Biofuels Policy and Strategy"] },
  { slug: "malawi", mapName: "Malawi", name: "Malawi", region: "Africa", aliases: ["malawi", "lilongwe"], blurb: "One of Africa's longest-running ethanol blending programmes, backed by the biofuels strategy.", mandates: [{ label: "Ethanol blend", value: "E10–E20 blending programme" }], frameworks: ["MERA", "Biofuels Strategy"] },
  { slug: "egypt", mapName: "Egypt", name: "Egypt", region: "Africa", aliases: ["egypt", "cairo"], blurb: "SAF and waste-to-fuel projects advance under the integrated sustainable energy strategy.", mandates: [{ label: "Aviation", value: "SAF production initiatives" }, { label: "Biogas", value: "Agricultural waste-to-energy programme" }], frameworks: ["ISES 2035"] },
  { slug: "morocco", mapName: "Morocco", name: "Morocco", region: "Africa", aliases: ["morocco", "rabat", "casablanca"], blurb: "Green hydrogen and e-fuel policy leads, with biomass and SAF projects emerging.", mandates: [{ label: "Framework", value: "Offre Maroc green molecules" }, { label: "Aviation", value: "SAF project development" }], frameworks: ["Offre Maroc"] },
  { slug: "tunisia", mapName: "Tunisia", name: "Tunisia", region: "Africa", aliases: ["tunisia", "tunis"], blurb: "Biogas and olive-residue biomass valorisation feature in the renewable energy plan.", mandates: [{ label: "Framework", value: "Plan Solaire Tunisien bioenergy component" }], frameworks: ["ANME"] },
  { slug: "algeria", mapName: "Algeria", name: "Algeria", region: "Africa", aliases: ["algeria", "algiers"], blurb: "Waste-to-energy and biomass programmes sit within the national renewable programme.", mandates: [{ label: "Framework", value: "National Renewable Energy Programme" }], frameworks: ["CREG"] },
  { slug: "senegal", mapName: "Senegal", name: "Senegal", region: "Africa", aliases: ["senegal", "dakar"], blurb: "Biofuel and clean-cooking policy targets domestic jatropha and biogas capacity.", mandates: [{ label: "Framework", value: "Biofuel and clean cooking programmes" }], frameworks: ["Ministry of Energy programmes"] },
  { slug: "cote-divoire", mapName: "Côte d'Ivoire", name: "Côte d'Ivoire", region: "Africa", aliases: ["cote d'ivoire", "côte d'ivoire", "ivory coast", "abidjan"], blurb: "Biomass power from cocoa and palm residues anchors the renewable energy strategy.", mandates: [{ label: "Framework", value: "Biomass electricity development plan" }], frameworks: ["PND energy strategy"] },
  { slug: "rwanda", mapName: "Rwanda", name: "Rwanda", region: "Africa", aliases: ["rwanda", "kigali"], blurb: "Domestic biogas and clean cooking targets are set in the energy sector strategic plan.", mandates: [{ label: "Cooking", value: "Biomass and biogas transition targets" }], frameworks: ["ESSP"] },
  { slug: "angola", mapName: "Angola", name: "Angola", region: "Africa", aliases: ["angola", "luanda"], blurb: "Sugarcane ethanol production supports early blending discussions.", mandates: [{ label: "Framework", value: "Biofuel blending under review" }], frameworks: ["Angola Energia 2025"] },
  { slug: "namibia", mapName: "Namibia", name: "Namibia", region: "Africa", aliases: ["namibia", "windhoek"], blurb: "Bush-biomass and green-fuel projects are formalised in national strategies.", mandates: [{ label: "Framework", value: "Biomass and synthetic fuel strategy" }], frameworks: ["National Energy Policy"] },
  { slug: "botswana", mapName: "Botswana", name: "Botswana", region: "Africa", aliases: ["botswana", "gaborone"], blurb: "Draft biofuel blending regulation accompanies biogas pilot projects.", mandates: [{ label: "Framework", value: "Draft biofuel blending regulation" }], frameworks: ["Ministry of Minerals and Energy"] },
  { slug: "cameroon", mapName: "Cameroon", name: "Cameroon", region: "Africa", aliases: ["cameroon", "yaounde"], blurb: "Palm and cocoa residue bioenergy projects are developed under the rural electrification plan.", mandates: [{ label: "Framework", value: "Rural bioenergy electrification plan" }], frameworks: ["MINEE"] },
  { slug: "sudan", mapName: "Sudan", name: "Sudan", region: "Africa", aliases: ["sudan", "khartoum"], blurb: "Sugar-sector ethanol output supports export and limited domestic blending policy.", mandates: [{ label: "Framework", value: "Ethanol production and export policy" }], frameworks: ["Ministry of Energy"] },

  { slug: "israel", mapName: "Israel", name: "Israel", region: "Middle East", aliases: ["israel", "jerusalem", "tel aviv"], blurb: "Alternative fuels administration programmes back waste-to-fuel and SAF research.", mandates: [{ label: "Framework", value: "Alternative fuels programme" }], frameworks: ["Ministry of Energy"] },
  { slug: "qatar", mapName: "Qatar", name: "Qatar", region: "Middle East", aliases: ["qatar", "doha"], blurb: "A national SAF plant and airline offtake anchor Gulf aviation fuel policy.", mandates: [{ label: "Aviation", value: "Domestic SAF production programme" }], frameworks: ["Qatar National Environment Strategy"] },
  { slug: "oman", mapName: "Oman", name: "Oman", region: "Middle East", aliases: ["oman", "muscat"], blurb: "Green hydrogen and waste-to-SAF projects are licensed under the national hydrogen strategy.", mandates: [{ label: "Aviation", value: "Waste-to-SAF projects under development" }], frameworks: ["Hydrom", "Oman Vision 2040"] },
  { slug: "kuwait", mapName: "Kuwait", name: "Kuwait", region: "Middle East", aliases: ["kuwait"], blurb: "Waste-to-energy and early SAF studies sit within the national renewable target.", mandates: [{ label: "Framework", value: "Renewable energy and waste-to-energy targets" }], frameworks: ["Kuwait Vision 2035"] },
  { slug: "jordan", mapName: "Jordan", name: "Jordan", region: "Middle East", aliases: ["jordan", "amman"], blurb: "Biogas and waste-to-energy projects feature in the renewable energy law framework.", mandates: [{ label: "Framework", value: "Renewable Energy and Energy Efficiency Law" }], frameworks: ["MEMR"] },
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


/** Emoji flag by plain country name — covers every country used in the supply datasets. */
export const COUNTRY_NAME_FLAG: Record<string, string> = {
  "United States": "\u{1F1FA}\u{1F1F8}", Canada: "\u{1F1E8}\u{1F1E6}", Mexico: "\u{1F1F2}\u{1F1FD}",
  Brazil: "\u{1F1E7}\u{1F1F7}", Argentina: "\u{1F1E6}\u{1F1F7}", Chile: "\u{1F1E8}\u{1F1F1}",
  Colombia: "\u{1F1E8}\u{1F1F4}", Peru: "\u{1F1F5}\u{1F1EA}", Paraguay: "\u{1F1F5}\u{1F1FE}", Bolivia: "\u{1F1E7}\u{1F1F4}",
  "United Kingdom": "\u{1F1EC}\u{1F1E7}", Ireland: "\u{1F1EE}\u{1F1EA}", France: "\u{1F1EB}\u{1F1F7}",
  Germany: "\u{1F1E9}\u{1F1EA}", Netherlands: "\u{1F1F3}\u{1F1F1}", Belgium: "\u{1F1E7}\u{1F1EA}",
  Luxembourg: "\u{1F1F1}\u{1F1FA}", Switzerland: "\u{1F1E8}\u{1F1ED}", Austria: "\u{1F1E6}\u{1F1F9}",
  Italy: "\u{1F1EE}\u{1F1F9}", Spain: "\u{1F1EA}\u{1F1F8}", Portugal: "\u{1F1F5}\u{1F1F9}", Greece: "\u{1F1EC}\u{1F1F7}",
  Poland: "\u{1F1F5}\u{1F1F1}", Czechia: "\u{1F1E8}\u{1F1FF}", Slovakia: "\u{1F1F8}\u{1F1F0}", Hungary: "\u{1F1ED}\u{1F1FA}",
  Romania: "\u{1F1F7}\u{1F1F4}", Bulgaria: "\u{1F1E7}\u{1F1EC}", Croatia: "\u{1F1ED}\u{1F1F7}",
  Sweden: "\u{1F1F8}\u{1F1EA}", Norway: "\u{1F1F3}\u{1F1F4}", Denmark: "\u{1F1E9}\u{1F1F0}", Finland: "\u{1F1EB}\u{1F1EE}",
  Estonia: "\u{1F1EA}\u{1F1EA}", Latvia: "\u{1F1F1}\u{1F1FB}", Lithuania: "\u{1F1F1}\u{1F1F9}",
  "T\u00fcrkiye": "\u{1F1F9}\u{1F1F7}", Israel: "\u{1F1EE}\u{1F1F1}", Gibraltar: "\u{1F1EC}\u{1F1EE}",
  "Saudi Arabia": "\u{1F1F8}\u{1F1E6}", "United Arab Emirates": "\u{1F1E6}\u{1F1EA}", Qatar: "\u{1F1F6}\u{1F1E6}",
  Egypt: "\u{1F1EA}\u{1F1EC}", Morocco: "\u{1F1F2}\u{1F1E6}", Sudan: "\u{1F1F8}\u{1F1E9}",
  Nigeria: "\u{1F1F3}\u{1F1EC}", Ghana: "\u{1F1EC}\u{1F1ED}", Kenya: "\u{1F1F0}\u{1F1EA}", Uganda: "\u{1F1FA}\u{1F1EC}",
  Tanzania: "\u{1F1F9}\u{1F1FF}", Ethiopia: "\u{1F1EA}\u{1F1F9}", Cameroon: "\u{1F1E8}\u{1F1F2}",
  "Sierra Leone": "\u{1F1F8}\u{1F1F1}", Zambia: "\u{1F1FF}\u{1F1F2}", Zimbabwe: "\u{1F1FF}\u{1F1FC}",
  Malawi: "\u{1F1F2}\u{1F1FC}", "South Africa": "\u{1F1FF}\u{1F1E6}",
  India: "\u{1F1EE}\u{1F1F3}", China: "\u{1F1E8}\u{1F1F3}", Japan: "\u{1F1EF}\u{1F1F5}",
  "South Korea": "\u{1F1F0}\u{1F1F7}", Taiwan: "\u{1F1F9}\u{1F1FC}", "Hong Kong": "\u{1F1ED}\u{1F1F0}",
  Singapore: "\u{1F1F8}\u{1F1EC}", Malaysia: "\u{1F1F2}\u{1F1FE}", Indonesia: "\u{1F1EE}\u{1F1E9}",
  Thailand: "\u{1F1F9}\u{1F1ED}", Vietnam: "\u{1F1FB}\u{1F1F3}", Philippines: "\u{1F1F5}\u{1F1ED}",
  Cambodia: "\u{1F1F0}\u{1F1ED}", Kazakhstan: "\u{1F1F0}\u{1F1FF}",
  Australia: "\u{1F1E6}\u{1F1FA}", "New Zealand": "\u{1F1F3}\u{1F1FF}", "European Union": "\u{1F1EA}\u{1F1FA}",
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