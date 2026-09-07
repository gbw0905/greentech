/**
 * Curated register of active biofuel blending / renewable-fuel obligations.
 *
 * Every entry is compiled from the primary legal instrument or the administering
 * agency's published guidance. `sourceUrl` points at that primary document.
 * Percentages are the obligation as written in law; where a target is stated as
 * an energy share rather than a volume share this is noted in `requirements`.
 */

export type MandateFuel =
  | "Ethanol"
  | "Biodiesel"
  | "Renewable diesel"
  | "SAF"
  | "Biomethane"
  | "Multi-fuel";

export type MandateStatus =
  | "In force"
  | "Phasing in"
  | "Adopted — not yet applicable"
  | "Under revision";

export interface MandateMilestone {
  /** Year or period the step applies from. */
  period: string;
  /** What changes in that period. */
  target: string;
  /** True once the step is already applicable in 2026. */
  reached: boolean;
}

export interface Mandate {
  id: string;
  jurisdiction: string;
  /** Country slug used across the site for flags and profile links, when national. */
  countrySlug: string | null;
  instrument: string;
  fuels: MandateFuel[];
  status: MandateStatus;
  /** One-line statement of the current obligation. */
  currentObligation: string;
  requirements: string[];
  compliance: {
    administrator: string;
    /** How obligated parties demonstrate compliance. */
    mechanism: string;
    /** Consequence of a shortfall. */
    penalty: string;
    /** Tradable certificate / credit unit, if any. */
    unit: string | null;
  };
  timeline: MandateMilestone[];
  sourceName: string;
  sourceUrl: string;
  lastReviewed: string;
}

export const MANDATES: Mandate[] = [
  {
    id: "eu-red-iii",
    jurisdiction: "European Union",
    countrySlug: null,
    instrument: "Renewable Energy Directive III (EU) 2023/2413",
    fuels: ["Multi-fuel"],
    status: "Phasing in",
    currentObligation:
      "Member states must reach a 29% renewable share in transport energy by 2030, or a 14.5% greenhouse-gas intensity reduction.",
    requirements: [
      "Choose either a 29% renewable energy share in transport or a 14.5% GHG-intensity reduction by 2030.",
      "Combined sub-target of 5.5% for advanced biofuels and renewable fuels of non-biological origin by 2030, of which at least 1% RFNBO.",
      "Crop-based biofuels capped at the 2020 national share plus one percentage point, and no more than 7% of road and rail transport energy.",
      "All fuel must meet RED III sustainability and GHG-saving criteria, verified through a recognised voluntary scheme.",
      "Member states had to transpose the transport provisions into national law by 21 May 2025.",
    ],
    compliance: {
      administrator: "European Commission plus each member state's national fuel authority",
      mechanism:
        "Fuel suppliers surrender proof of sustainability issued under a Commission-recognised certification scheme (ISCC EU, REDcert EU, 2BSvs, RSB EU RED) and report through the Union Database for Biofuels.",
      penalty:
        "Set nationally: buy-out charges, fines or licence conditions imposed by each member state's implementing law.",
      unit: "Proof of Sustainability (PoS) certificates; national tickets or quota units",
    },
    timeline: [
      { period: "2023", target: "RED III enters into force (November 2023).", reached: true },
      { period: "2025", target: "Transposition deadline for transport targets (21 May 2025).", reached: true },
      { period: "2026", target: "Union Database reporting operational for all liquid and gaseous fuels.", reached: true },
      { period: "2030", target: "29% renewable transport share or 14.5% GHG-intensity cut; 5.5% advanced/RFNBO sub-target.", reached: false },
    ],
    sourceName: "EUR-Lex — Directive (EU) 2023/2413",
    sourceUrl: "https://eur-lex.europa.eu/eli/dir/2023/2413/oj",
    lastReviewed: "2026-09",
  },
  {
    id: "eu-refuel-aviation",
    jurisdiction: "European Union",
    countrySlug: null,
    instrument: "ReFuelEU Aviation Regulation (EU) 2023/2405",
    fuels: ["SAF"],
    status: "Phasing in",
    currentObligation: "Union airports must supply aviation fuel containing at least 2% SAF, rising to 70% by 2050.",
    requirements: [
      "Fuel suppliers must ensure the minimum SAF share in aviation fuel supplied at each Union airport.",
      "A synthetic-fuel (e-SAF) sub-quota applies from 2030 alongside the headline SAF share.",
      "Aircraft operators must uplift at least 90% of their annual fuel requirement at each Union airport (anti-tankering rule).",
      "Annual reporting of fuel uplifted and SAF supplied to the EU Aviation Safety Agency.",
    ],
    compliance: {
      administrator: "European Union Aviation Safety Agency and national competent authorities",
      mechanism:
        "Annual reports from suppliers and operators, verified against sustainability certification; a Union SAF flexibility mechanism allows pooled supply across airports until 2034.",
      penalty:
        "Administrative fines set by member states, calculated to exceed at least twice the price differential between conventional jet fuel and SAF for the shortfall.",
      unit: null,
    },
    timeline: [
      { period: "2025", target: "2% SAF minimum share at Union airports.", reached: true },
      { period: "2030", target: "6% SAF, including a 1.2% synthetic-fuel sub-quota.", reached: false },
      { period: "2035", target: "20% SAF, including 5% synthetic fuel.", reached: false },
      { period: "2050", target: "70% SAF, including 35% synthetic fuel.", reached: false },
    ],
    sourceName: "EUR-Lex — Regulation (EU) 2023/2405",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/2405/oj",
    lastReviewed: "2026-09",
  },
  {
    id: "eu-fueleu-maritime",
    jurisdiction: "European Union",
    countrySlug: null,
    instrument: "FuelEU Maritime Regulation (EU) 2023/1805",
    fuels: ["Multi-fuel"],
    status: "Phasing in",
    currentObligation:
      "Ships above 5,000 GT calling at EU ports must cut the GHG intensity of their energy use by 2% against a 2020 baseline.",
    requirements: [
      "GHG-intensity limit applies well-to-wake to 100% of energy used on intra-EU voyages and 50% on extra-EU voyages.",
      "Containerships and passenger ships must use on-shore power at core TEN-T ports from 2030.",
      "Compliance may be pooled between ships and banked or borrowed between years within limits.",
      "Verified FuelEU report and compliance balance per ship, per year.",
    ],
    compliance: {
      administrator: "European Commission, flag/port state authorities and accredited verifiers",
      mechanism:
        "Accredited verifier checks the ship's monitoring plan and annual energy report; the compliance balance is recorded in the FuelEU database and a FuelEU document of compliance is issued.",
      penalty:
        "Remedial penalty proportional to the deficit (EUR 2,400 per tonne of VLSFO-equivalent energy), increased by 10% for repeat non-compliance; ships may be denied entry after two years of non-compliance.",
      unit: "FuelEU compliance surplus / deficit balance",
    },
    timeline: [
      { period: "2025", target: "-2% GHG intensity versus the 91.16 gCO2e/MJ baseline.", reached: true },
      { period: "2030", target: "-6% GHG intensity; on-shore power obligation at core ports.", reached: false },
      { period: "2035", target: "-14.5% GHG intensity.", reached: false },
      { period: "2050", target: "-80% GHG intensity.", reached: false },
    ],
    sourceName: "EUR-Lex — Regulation (EU) 2023/1805",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/1805/oj",
    lastReviewed: "2026-09",
  },
  {
    id: "us-rfs",
    jurisdiction: "United States",
    countrySlug: "united-states",
    instrument: "Renewable Fuel Standard (RFS2), Clean Air Act §211(o)",
    fuels: ["Multi-fuel"],
    status: "In force",
    currentObligation:
      "EPA sets annual volume obligations for total renewable fuel, advanced biofuel, cellulosic biofuel and biomass-based diesel.",
    requirements: [
      "Obligated parties are refiners and importers of gasoline and diesel; each receives a percentage renewable volume obligation applied to its production.",
      "Four nested categories: total renewable fuel, advanced biofuel, cellulosic biofuel and biomass-based diesel, each with its own D-code.",
      "Fuel must meet lifecycle GHG-reduction thresholds for its category (20% conventional, 50% advanced/biomass-based diesel, 60% cellulosic).",
      "Up to 20% of an annual obligation may be met with RINs carried over from the prior year.",
    ],
    compliance: {
      administrator: "US Environmental Protection Agency",
      mechanism:
        "Renewable Identification Numbers (RINs) are generated at production, tracked in the EPA Moderated Transaction System (EMTS) and retired against the annual obligation each March.",
      penalty:
        "Civil penalties per day of violation under the Clean Air Act, plus mandatory retirement of replacement RINs; cellulosic waiver credits may substitute for cellulosic RINs.",
      unit: "Renewable Identification Number (RIN)",
    },
    timeline: [
      { period: "2005 / 2007", target: "Programme created by the Energy Policy Act and expanded by the Energy Independence and Security Act.", reached: true },
      { period: "2023–2025", target: "First multi-year 'set' rule establishing volumes beyond the statutory table.", reached: true },
      { period: "2026–2027", target: "Second set rulemaking establishing annual volumes, including the eRIN question.", reached: true },
      { period: "Annual", target: "Compliance demonstration each 31 March for the preceding calendar year.", reached: true },
    ],
    sourceName: "US EPA — Renewable Fuel Standard Program",
    sourceUrl: "https://www.epa.gov/renewable-fuel-standard-program",
    lastReviewed: "2026-09",
  },
  {
    id: "us-ca-lcfs",
    jurisdiction: "California, United States",
    countrySlug: "united-states",
    instrument: "Low Carbon Fuel Standard, Cal. Code Regs. tit. 17",
    fuels: ["Multi-fuel"],
    status: "Phasing in",
    currentObligation:
      "Transport fuels sold in California must meet a declining annual carbon-intensity benchmark against a 2010 baseline.",
    requirements: [
      "Carbon intensity of each fuel is certified through a CARB-approved lifecycle pathway application.",
      "Deficits are generated by fuels above the annual benchmark; credits by fuels below it.",
      "Quarterly and annual reporting through the LCFS Reporting Tool and Credit Bank & Transfer System.",
      "Third-party verification required for most pathway holders and reporting entities.",
    ],
    compliance: {
      administrator: "California Air Resources Board",
      mechanism:
        "Credits and deficits are reconciled annually; credits are bankable indefinitely and freely tradable, with a cost-containment credit price ceiling.",
      penalty:
        "Enforcement action and penalties under the Health and Safety Code; persistent deficit balances trigger a compliance curve adjustment.",
      unit: "LCFS credit (one metric tonne CO2e)",
    },
    timeline: [
      { period: "2011", target: "Programme starts under AB 32 authority.", reached: true },
      { period: "2018", target: "Amendments extend the target to a 20% CI reduction by 2030.", reached: true },
      { period: "2025", target: "Amended regulation takes effect with a steeper trajectory and auto-acceleration mechanism.", reached: true },
      { period: "2030", target: "30% carbon-intensity reduction versus 2010.", reached: false },
      { period: "2045", target: "90% carbon-intensity reduction versus 2010.", reached: false },
    ],
    sourceName: "CARB — Low Carbon Fuel Standard",
    sourceUrl: "https://ww2.arb.ca.gov/our-work/programs/low-carbon-fuel-standard",
    lastReviewed: "2026-09",
  },
  {
    id: "us-or-cfp",
    jurisdiction: "Oregon, United States",
    countrySlug: "united-states",
    instrument: "Oregon Clean Fuels Program, OAR Chapter 340 Division 253",
    fuels: ["Multi-fuel"],
    status: "Phasing in",
    currentObligation: "Fuel importers must reduce the average carbon intensity of Oregon transport fuels against a 2015 baseline.",
    requirements: [
      "Registered importers report volumes and carbon intensities quarterly.",
      "Carbon-intensity values come from OR-GREET certified pathways.",
      "Annual compliance report and third-party verification for larger reporters.",
    ],
    compliance: {
      administrator: "Oregon Department of Environmental Quality",
      mechanism: "Credit and deficit accounting in the Oregon Fuels Reporting System, with tradable credits and unlimited banking.",
      penalty: "Civil penalties under Oregon DEQ enforcement rules for unresolved deficits.",
      unit: "Clean Fuels Program credit",
    },
    timeline: [
      { period: "2016", target: "Programme begins with a 0.25% reduction.", reached: true },
      { period: "2022", target: "Rulemaking extends targets to 2035.", reached: true },
      { period: "2030", target: "20% carbon-intensity reduction.", reached: false },
      { period: "2035", target: "37% carbon-intensity reduction.", reached: false },
    ],
    sourceName: "Oregon DEQ — Clean Fuels Program",
    sourceUrl: "https://www.oregon.gov/deq/ghgp/cfp/Pages/default.aspx",
    lastReviewed: "2026-09",
  },
  {
    id: "ca-cfr",
    jurisdiction: "Canada",
    countrySlug: "canada",
    instrument: "Clean Fuel Regulations, SOR/2022-140",
    fuels: ["Multi-fuel"],
    status: "Phasing in",
    currentObligation:
      "Producers and importers of gasoline and diesel must reduce the carbon intensity of those fuels against a 2016 baseline.",
    requirements: [
      "Reduction requirement rises each year to 14 gCO2e/MJ by 2030.",
      "Legacy volumetric requirements remain: 5% renewable content in gasoline and 2% in diesel.",
      "Credits are created by low-carbon-intensity fuel supply, CI-reducing projects at facilities, and end-use fuel switching.",
      "Registration, quarterly reporting and annual verification by an accredited third party.",
    ],
    compliance: {
      administrator: "Environment and Climate Change Canada",
      mechanism:
        "Credit creation and retirement tracked in the CFR Credit and Tracking System; a compliance-credit market plus a compliance fund mechanism capped at a set price.",
      penalty: "Offences and penalties under CEPA 1999, including monetary penalties and prosecution.",
      unit: "CFR compliance credit (one tonne CO2e)",
    },
    timeline: [
      { period: "2022", target: "Regulations registered; registration and reporting begin.", reached: true },
      { period: "2023", target: "First reduction requirement of 3.5 gCO2e/MJ takes effect (1 July).", reached: true },
      { period: "2026", target: "Requirement steps up on the annual schedule toward 2030.", reached: true },
      { period: "2030", target: "14 gCO2e/MJ carbon-intensity reduction.", reached: false },
    ],
    sourceName: "Justice Laws Canada — SOR/2022-140",
    sourceUrl: "https://laws-lois.justice.gc.ca/eng/regulations/SOR-2022-140/",
    lastReviewed: "2026-09",
  },
  {
    id: "br-renovabio",
    jurisdiction: "Brazil",
    countrySlug: "brazil",
    instrument: "RenovaBio — Law 13.576/2017",
    fuels: ["Multi-fuel"],
    status: "In force",
    currentObligation:
      "Fuel distributors must retire decarbonisation credits (CBIOs) in proportion to the fossil fuel they sell.",
    requirements: [
      "Annual national decarbonisation target set by the National Energy Policy Council and split among distributors by CNPE/ANP resolution.",
      "Biofuel producers must hold a certification issued by an accredited inspection firm to issue CBIOs.",
      "CBIOs are issued per unit of avoided emissions and traded on B3.",
    ],
    compliance: {
      administrator: "Agência Nacional do Petróleo, Gás Natural e Biocombustíveis (ANP)",
      mechanism: "Distributors buy and retire CBIOs on the B3 exchange; retirement is verified against each firm's individual target.",
      penalty: "Fines from R$100,000 up to R$50 million depending on the size of the shortfall, under Law 13.576/2017.",
      unit: "CBIO (one tonne CO2e avoided)",
    },
    timeline: [
      { period: "2017", target: "Law 13.576 creates the programme.", reached: true },
      { period: "2020", target: "First compliance year with individual distributor targets.", reached: true },
      { period: "2026", target: "Annual targets continue to rise under the CNPE decarbonisation curve.", reached: true },
      { period: "2030", target: "Cumulative decarbonisation target for the transport fuel matrix.", reached: false },
    ],
    sourceName: "ANP — RenovaBio",
    sourceUrl: "https://www.gov.br/anp/pt-br/assuntos/renovabio",
    lastReviewed: "2026-09",
  },
  {
    id: "br-blends",
    jurisdiction: "Brazil",
    countrySlug: "brazil",
    instrument: "Fuel of the Future Law 14.993/2024 and CNPE blend resolutions",
    fuels: ["Ethanol", "Biodiesel", "SAF"],
    status: "Phasing in",
    currentObligation:
      "Gasoline must contain a mandated anhydrous ethanol blend and diesel a mandated biodiesel blend, both set by CNPE within statutory ranges.",
    requirements: [
      "Anhydrous ethanol blend in gasoline set within a 22–35% band by CNPE resolution.",
      "Biodiesel blend in diesel rising on the CNPE schedule within a range up to B25.",
      "National SAF programme (ProBioQAV) sets an emissions-reduction obligation for domestic flights from 2027.",
      "Biomethane obligation introduced for the natural gas grid under the same law.",
    ],
    compliance: {
      administrator: "CNPE (target setting) and ANP (enforcement)",
      mechanism: "ANP inspects distributors and refiners; blend levels are verified through fuel-quality monitoring and volume reporting.",
      penalty: "ANP administrative fines and product seizure for off-specification fuel.",
      unit: null,
    },
    timeline: [
      { period: "2024", target: "Law 14.993 (Combustível do Futuro) enacted.", reached: true },
      { period: "2025", target: "E30 gasoline blend and B15 diesel blend take effect (1 August 2025).", reached: true },
      { period: "2027", target: "ProBioQAV SAF obligation begins at a 1% emissions reduction for domestic aviation.", reached: false },
      { period: "2037", target: "SAF emissions-reduction obligation reaches 10%.", reached: false },
    ],
    sourceName: "Planalto — Lei 14.993/2024",
    sourceUrl: "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14993.htm",
    lastReviewed: "2026-09",
  },
  {
    id: "in-ebp",
    jurisdiction: "India",
    countrySlug: "india",
    instrument: "Ethanol Blended Petrol Programme (National Policy on Biofuels, 2018 as amended)",
    fuels: ["Ethanol"],
    status: "In force",
    currentObligation: "Public-sector oil marketing companies supply petrol blended with 20% ethanol nationwide.",
    requirements: [
      "Oil marketing companies procure ethanol through periodic tenders at administered prices by feedstock category.",
      "Blend targets are tracked per ethanol supply year (November–October).",
      "E100 and flex-fuel vehicle rollout supported alongside the blending obligation.",
    ],
    compliance: {
      administrator: "Ministry of Petroleum & Natural Gas",
      mechanism: "Monthly blending statistics reported by OMCs against the ethanol supply year target.",
      penalty: "Administrative — the obligation sits on state oil marketing companies rather than private obligated parties.",
      unit: null,
    },
    timeline: [
      { period: "2018", target: "National Policy on Biofuels sets a 20% target for 2030.", reached: true },
      { period: "2022", target: "Target advanced to ethanol supply year 2025–26; E10 achieved nationally.", reached: true },
      { period: "2025", target: "E20 blending achieved across the national petrol pool.", reached: true },
      { period: "2026 onward", target: "Consolidation of E20 and expansion of flex-fuel and E100 retail.", reached: true },
    ],
    sourceName: "Ministry of Petroleum & Natural Gas — Biofuels",
    sourceUrl: "https://mopng.gov.in/en/marketing/ethanol-blending",
    lastReviewed: "2026-09",
  },
  {
    id: "in-cbg",
    jurisdiction: "India",
    countrySlug: "india",
    instrument: "Compressed Biogas Blending Obligation (CBG Blending Obligation)",
    fuels: ["Biomethane"],
    status: "Phasing in",
    currentObligation: "City gas distribution entities must blend a rising share of compressed biogas into CNG and piped natural gas.",
    requirements: [
      "Obligation applies to CNG (transport) and domestic PNG segments.",
      "Blend share rises on a published annual schedule to 2028–29.",
      "CBG procured from plants under the SATAT initiative and other registered producers.",
    ],
    compliance: {
      administrator: "Ministry of Petroleum & Natural Gas and PNGRB",
      mechanism: "National CBG Coordination Committee monitors blending volumes reported by city gas distribution entities.",
      penalty: "Regulatory action by PNGRB against licensed CGD entities that miss the obligation.",
      unit: null,
    },
    timeline: [
      { period: "2023", target: "Obligation announced; voluntary phase begins.", reached: true },
      { period: "2025-26", target: "Mandatory blending phase starts at 1%.", reached: true },
      { period: "2026-27", target: "Blending share steps up under the notified schedule.", reached: true },
      { period: "2028-29", target: "Obligation reaches 5% CBG in CNG and PNG.", reached: false },
    ],
    sourceName: "Ministry of Petroleum & Natural Gas",
    sourceUrl: "https://mopng.gov.in/en",
    lastReviewed: "2026-09",
  },
  {
    id: "id-biodiesel",
    jurisdiction: "Indonesia",
    countrySlug: "indonesia",
    instrument: "Mandatory biodiesel programme (MEMR regulations under Law 30/2007)",
    fuels: ["Biodiesel"],
    status: "Phasing in",
    currentObligation: "Diesel sold in the domestic market must contain a mandated share of palm-based FAME.",
    requirements: [
      "Allocation quotas issued to registered FAME producers and fuel distributors each year.",
      "Programme part-funded by the palm oil export levy administered by BPDPKS.",
      "Blend level applies to both subsidised (PSO) and non-subsidised diesel, with staged coverage.",
    ],
    compliance: {
      administrator: "Ministry of Energy and Mineral Resources (MEMR) with BPDPKS",
      mechanism: "Quarterly allocation and realisation reporting by producers and distributors; levy-funded incentive payments settled against delivered volumes.",
      penalty: "Reduction or withdrawal of allocation quota and administrative sanctions under MEMR regulation.",
      unit: null,
    },
    timeline: [
      { period: "2020", target: "B30 mandate implemented nationally.", reached: true },
      { period: "2023", target: "B35 mandate implemented.", reached: true },
      { period: "2025", target: "B40 mandate takes effect from 1 January 2025.", reached: true },
      { period: "2026 onward", target: "Government roadmap targets a step to B50 subject to feedstock and capacity readiness.", reached: false },
    ],
    sourceName: "Ministry of Energy and Mineral Resources (ESDM)",
    sourceUrl: "https://www.esdm.go.id/",
    lastReviewed: "2026-09",
  },
  {
    id: "uk-rtfo",
    jurisdiction: "United Kingdom",
    countrySlug: "united-kingdom",
    instrument: "Renewable Transport Fuel Obligation Order 2007 (as amended)",
    fuels: ["Multi-fuel"],
    status: "In force",
    currentObligation: "Suppliers of 450,000 litres or more of fuel a year must show that a set share is renewable.",
    requirements: [
      "Main obligation set as a percentage of relevant fuel supplied, with a separate development-fuel sub-target.",
      "Crop-derived biofuel capped and stepping down over the obligation period.",
      "Fuels must meet RTFO sustainability criteria, verified and reported quarterly.",
    ],
    compliance: {
      administrator: "Department for Transport, administered by the Low Carbon Fuels Unit",
      mechanism: "Renewable Transport Fuel Certificates (RTFCs) are issued per litre or kilogram supplied and redeemed against the annual obligation.",
      penalty: "Fixed buy-out price per RTFC not redeemed, payable to the administrator.",
      unit: "Renewable Transport Fuel Certificate (RTFC)",
    },
    timeline: [
      { period: "2008", target: "Obligation begins.", reached: true },
      { period: "2018", target: "Development-fuel sub-target and crop cap introduced.", reached: true },
      { period: "2026", target: "Annual obligation share continues on the published trajectory.", reached: true },
      { period: "2032", target: "Crop cap steps down to its lowest level under the current order.", reached: false },
    ],
    sourceName: "GOV.UK — Renewable Transport Fuel Obligation",
    sourceUrl: "https://www.gov.uk/government/collections/renewable-transport-fuels-obligation-rtfo-guidance",
    lastReviewed: "2026-09",
  },
  {
    id: "uk-saf-mandate",
    jurisdiction: "United Kingdom",
    countrySlug: "united-kingdom",
    instrument: "Renewable Transport Fuel Obligations (Sustainable Aviation Fuel) Order 2024",
    fuels: ["SAF"],
    status: "Phasing in",
    currentObligation: "Aviation fuel suppliers must supply a rising share of sustainable aviation fuel, starting at 2% in 2025.",
    requirements: [
      "Obligation applies to suppliers of jet fuel above the annual threshold.",
      "Separate power-to-liquid sub-obligation begins in 2028.",
      "HEFA-derived SAF is capped as a share of the obligation and the cap declines over time.",
      "A revenue-certainty mechanism supports UK SAF plants alongside the mandate.",
    ],
    compliance: {
      administrator: "Department for Transport — Low Carbon Fuels Unit",
      mechanism: "SAF certificates issued for eligible supply and redeemed against the annual obligation, mirroring the RTFC system.",
      penalty: "Buy-out price per certificate not redeemed, set separately for the main and PtL obligations.",
      unit: "SAF certificate",
    },
    timeline: [
      { period: "2025", target: "Mandate starts at 2% of jet fuel supplied.", reached: true },
      { period: "2028", target: "Power-to-liquid sub-obligation begins at 0.2%.", reached: false },
      { period: "2030", target: "10% SAF share.", reached: false },
      { period: "2040", target: "22% SAF share, held flat thereafter pending review.", reached: false },
    ],
    sourceName: "GOV.UK — SAF mandate",
    sourceUrl: "https://www.gov.uk/government/collections/sustainable-aviation-fuel-mandate",
    lastReviewed: "2026-09",
  },
  {
    id: "de-thg",
    jurisdiction: "Germany",
    countrySlug: "germany",
    instrument: "Greenhouse gas quota (THG-Quote), Bundes-Immissionsschutzgesetz §37a",
    fuels: ["Multi-fuel"],
    status: "In force",
    currentObligation: "Fuel suppliers must reduce the greenhouse gas emissions of the fuel they place on the market by a set percentage.",
    requirements: [
      "Quota obligation expressed as a GHG reduction, not a volume share.",
      "Sub-quota for advanced biofuels from Annex IX Part A feedstocks.",
      "Caps on crop-based biofuels and on the use of biofuels from used cooking oil and animal fats.",
      "Electricity supplied to road vehicles can generate quota credits.",
    ],
    compliance: {
      administrator: "Hauptzollamt Frankfurt (Oder) — Biokraftstoffquotenstelle",
      mechanism: "Annual quota declaration with Nabisy sustainability certificates; obligations can be transferred between parties by contract.",
      penalty: "Penalty payment per tonne of CO2-equivalent shortfall under §37c BImSchG.",
      unit: "THG quota (tonnes CO2e), tradable by contract",
    },
    timeline: [
      { period: "2015", target: "Volume quota replaced by a greenhouse-gas quota.", reached: true },
      { period: "2022", target: "RED II implementation raises the trajectory and adds advanced sub-quotas.", reached: true },
      { period: "2026", target: "Quota level continues on the statutory schedule.", reached: true },
      { period: "2030", target: "25% GHG reduction obligation under current law.", reached: false },
    ],
    sourceName: "Gesetze im Internet — BImSchG §37a",
    sourceUrl: "https://www.gesetze-im-internet.de/bimschg/__37a.html",
    lastReviewed: "2026-09",
  },
  {
    id: "fr-tiruert",
    jurisdiction: "France",
    countrySlug: "france",
    instrument: "TIRUERT — incentive tax for the use of renewable energy in transport",
    fuels: ["Multi-fuel"],
    status: "In force",
    currentObligation: "Fuel suppliers pay a tax unless they meet renewable-energy incorporation rates for petrol, diesel and aviation fuel.",
    requirements: [
      "Separate incorporation rates for the petrol pool, the diesel pool and, since 2022, aviation fuel.",
      "Sub-targets for advanced feedstocks and caps on crop-based and high-ILUC-risk feedstocks.",
      "Sustainability proof required through a recognised voluntary scheme and the national CarbuRe registry.",
    ],
    compliance: {
      administrator: "Direction générale des douanes et droits indirects",
      mechanism: "Annual declaration of energy incorporated; shortfalls are taxed at a rate applied to the missing percentage points.",
      penalty: "TIRUERT tax liability proportional to the shortfall, plus customs penalties for false declaration.",
      unit: null,
    },
    timeline: [
      { period: "2019", target: "TIRIB replaces the previous TGAP mechanism.", reached: true },
      { period: "2022", target: "Renamed TIRUERT and extended to aviation fuel.", reached: true },
      { period: "2026", target: "Incorporation rates set annually in the finance law.", reached: true },
      { period: "2030", target: "Rates aligned with the RED III transport target.", reached: false },
    ],
    sourceName: "Légifrance — Code des impositions sur les biens et services",
    sourceUrl: "https://www.legifrance.gouv.fr/codes/id/LEGISCTA000044599724/",
    lastReviewed: "2026-09",
  },
  {
    id: "nl-energy-transport",
    jurisdiction: "Netherlands",
    countrySlug: "netherlands",
    instrument: "Energie voor Vervoer — Besluit energie vervoer",
    fuels: ["Multi-fuel"],
    status: "In force",
    currentObligation: "Fuel suppliers must meet an annual renewable-energy obligation for road and rail transport.",
    requirements: [
      "Annual obligation expressed as a share of energy supplied, with sub-obligations for advanced biofuels.",
      "Separate reduction obligation for the aviation and maritime pools introduced alongside EU rules.",
      "Double counting applies to Annex IX Part A and B feedstocks within caps.",
    ],
    compliance: {
      administrator: "Nederlandse Emissieautoriteit (NEa)",
      mechanism: "Hernieuwbare Brandstofeenheden (HBEs) are registered and traded in the NEa register and redeemed annually.",
      penalty: "Administrative fine per unredeemed HBE plus an order to make up the shortfall.",
      unit: "Hernieuwbare Brandstofeenheid (HBE)",
    },
    timeline: [
      { period: "2018", target: "Current HBE framework begins.", reached: true },
      { period: "2022", target: "RED II implementation; advanced sub-obligation strengthened.", reached: true },
      { period: "2026", target: "Obligation rises on the trajectory set for RED III alignment.", reached: true },
      { period: "2030", target: "Alignment with the RED III 29% transport target.", reached: false },
    ],
    sourceName: "Nederlandse Emissieautoriteit — Energie voor Vervoer",
    sourceUrl: "https://www.emissieautoriteit.nl/onderwerpen/energie-voor-vervoer",
    lastReviewed: "2026-09",
  },
  {
    id: "se-reduction",
    jurisdiction: "Sweden",
    countrySlug: "sweden",
    instrument: "Reduktionsplikt (Reduction Obligation Act 2017:1201)",
    fuels: ["Multi-fuel"],
    status: "Under revision",
    currentObligation: "Suppliers must reduce the lifecycle greenhouse-gas intensity of petrol and diesel by a legally set percentage.",
    requirements: [
      "Separate reduction levels for petrol and for diesel.",
      "Reduction achieved by blending biofuels certified under the Swedish sustainability act.",
      "Aviation fuel covered by a separate reduction obligation.",
    ],
    compliance: {
      administrator: "Swedish Energy Agency (Energimyndigheten)",
      mechanism: "Annual reduction declaration with sustainability certification; limited over-compliance can be carried forward.",
      penalty: "Reduction-obligation charge per kilogram of CO2e shortfall.",
      unit: null,
    },
    timeline: [
      { period: "2018", target: "Obligation introduced for petrol and diesel.", reached: true },
      { period: "2024", target: "Levels cut sharply to 6% for both petrol and diesel.", reached: true },
      { period: "2026", target: "Levels raised again following the 2025 legislative revision.", reached: true },
      { period: "2030", target: "Trajectory to be confirmed by the ongoing review.", reached: false },
    ],
    sourceName: "Energimyndigheten — Reduktionsplikt",
    sourceUrl: "https://www.energimyndigheten.se/fornybart/hallbarhetskriterier/reduktionsplikt/",
    lastReviewed: "2026-09",
  },
  {
    id: "no-omsetningskrav",
    jurisdiction: "Norway",
    countrySlug: "norway",
    instrument: "Omsetningskrav — Product Regulations Chapter 3",
    fuels: ["Multi-fuel", "SAF"],
    status: "In force",
    currentObligation: "Fuel suppliers must sell a minimum share of biofuel in road transport, with a separate aviation requirement.",
    requirements: [
      "Road transport turnover requirement with an advanced-biofuel sub-requirement.",
      "Aviation fuel suppliers must supply a minimum share of advanced sustainable aviation fuel.",
      "Non-road machinery and shipping covered by separate requirements.",
    ],
    compliance: {
      administrator: "Miljødirektoratet (Norwegian Environment Agency)",
      mechanism: "Annual reporting of volumes and sustainability documentation to the Environment Agency.",
      penalty: "Coercive fines and enforcement under the Pollution Control Act.",
      unit: null,
    },
    timeline: [
      { period: "2009", target: "Turnover requirement introduced.", reached: true },
      { period: "2020", target: "Aviation biofuel requirement of 0.5% begins.", reached: true },
      { period: "2026", target: "Road and aviation shares continue on the regulated schedule.", reached: true },
      { period: "2030", target: "Requirements aligned with the national climate plan.", reached: false },
    ],
    sourceName: "Miljødirektoratet — Omsetningskrav",
    sourceUrl: "https://www.miljodirektoratet.no/ansvarsomrader/klima/omsetningskrav-biodrivstoff/",
    lastReviewed: "2026-09",
  },
  {
    id: "jp-saf",
    jurisdiction: "Japan",
    countrySlug: "japan",
    instrument: "SAF supply obligation under the Sophisticated Methods of Energy Supply Structures Act",
    fuels: ["SAF"],
    status: "Adopted — not yet applicable",
    currentObligation: "Oil refiners and importers must supply SAF equal to 10% of jet fuel for international flights departing Japan by 2030.",
    requirements: [
      "Obligation placed on fuel suppliers rather than airlines.",
      "Applies to jet fuel uplifted for international departures from Japanese airports.",
      "Supported by domestic SAF production investment under the GX programme.",
    ],
    compliance: {
      administrator: "Ministry of Economy, Trade and Industry (METI) — Agency for Natural Resources and Energy",
      mechanism: "Annual plans and reporting by designated energy suppliers under the Energy Supply Structure Sophistication Act.",
      penalty: "Recommendations, publication of non-compliance and orders under the Act.",
      unit: null,
    },
    timeline: [
      { period: "2022", target: "10% by 2030 target announced in the SAF public-private council.", reached: true },
      { period: "2024", target: "Judgement criteria for suppliers formalised under the Act.", reached: true },
      { period: "2030", target: "10% SAF share of international jet fuel supplied in Japan.", reached: false },
    ],
    sourceName: "METI — Agency for Natural Resources and Energy",
    sourceUrl: "https://www.enecho.meti.go.jp/en/",
    lastReviewed: "2026-09",
  },
  {
    id: "cn-e10",
    jurisdiction: "China",
    countrySlug: "china",
    instrument: "Provincial E10 ethanol gasoline programmes",
    fuels: ["Ethanol"],
    status: "In force",
    currentObligation: "E10 ethanol gasoline is mandatory in a group of provinces rather than across the whole country.",
    requirements: [
      "Provincial implementation plans designate which regions sell only ethanol gasoline.",
      "Ethanol supplied by licensed fuel-ethanol producers under state allocation.",
      "The originally announced nationwide E10 rollout was not implemented on the 2020 timetable.",
    ],
    compliance: {
      administrator: "National Development and Reform Commission with provincial energy bureaus",
      mechanism: "Provincial monitoring of retail fuel supply and refinery output allocations.",
      penalty: "Provincial administrative enforcement against non-conforming retailers.",
      unit: null,
    },
    timeline: [
      { period: "2001", target: "Fuel-ethanol pilot programme begins in selected provinces.", reached: true },
      { period: "2017", target: "Nationwide E10 by 2020 announced by NDRC and partner agencies.", reached: true },
      { period: "2020", target: "Nationwide rollout deferred; coverage stays provincial.", reached: true },
      { period: "2026", target: "Programme remains province-by-province with SAF pilots added.", reached: true },
    ],
    sourceName: "National Development and Reform Commission",
    sourceUrl: "https://www.ndrc.gov.cn/",
    lastReviewed: "2026-09",
  },
  {
    id: "th-blends",
    jurisdiction: "Thailand",
    countrySlug: "thailand",
    instrument: "Alternative Energy Development Plan blending requirements",
    fuels: ["Ethanol", "Biodiesel"],
    status: "In force",
    currentObligation: "Diesel is sold as a mandated B-grade blend and gasohol grades carry mandated ethanol content.",
    requirements: [
      "Base diesel grade blend level set by the Department of Energy Business and adjusted with palm-oil supply.",
      "Gasohol E10, E20 and E85 grades sold with E20 promoted as the base grade.",
      "Oil Fuel Fund used to manage retail price differentials between grades.",
    ],
    compliance: {
      administrator: "Ministry of Energy — Department of Energy Business",
      mechanism: "Fuel-quality notifications and inspection of refiners, blenders and retail stations.",
      penalty: "Penalties under the Fuel Trade Act for off-specification fuel.",
      unit: null,
    },
    timeline: [
      { period: "2008", target: "B2 mandatory biodiesel blend introduced.", reached: true },
      { period: "2019", target: "B10 designated the base diesel grade.", reached: true },
      { period: "2024", target: "E20 promoted as the base gasohol grade.", reached: true },
      { period: "2026", target: "Blend levels adjusted periodically with feedstock availability.", reached: true },
    ],
    sourceName: "Department of Energy Business, Ministry of Energy",
    sourceUrl: "https://www.doeb.go.th/",
    lastReviewed: "2026-09",
  },
  {
    id: "ar-blends",
    jurisdiction: "Argentina",
    countrySlug: "argentina",
    instrument: "Biofuels Framework Law 27.640 (2021)",
    fuels: ["Ethanol", "Biodiesel"],
    status: "In force",
    currentObligation: "Gasoline must contain 12% bioethanol and diesel a minimum 7.5% biodiesel blend.",
    requirements: [
      "Bioethanol split between sugarcane and maize-based supply under quota.",
      "Biodiesel minimum may be raised by the enforcement authority within statutory limits.",
      "Volumes and prices allocated administratively to registered plants.",
    ],
    compliance: {
      administrator: "Secretaría de Energía",
      mechanism: "Monthly allocation resolutions and delivery reporting by registered producers and blenders.",
      penalty: "Fines, suspension or removal from the biofuels registry under Law 27.640.",
      unit: null,
    },
    timeline: [
      { period: "2021", target: "Law 27.640 replaces the earlier 26.093 regime.", reached: true },
      { period: "2022", target: "Biodiesel minimum set at 7.5%; ethanol held at 12%.", reached: true },
      { period: "2026", target: "Framework remains in force with periodic price resolutions.", reached: true },
      { period: "2030", target: "Law scheduled for review and possible extension.", reached: false },
    ],
    sourceName: "InfoLEG — Ley 27.640",
    sourceUrl: "https://servicios.infoleg.gob.ar/infolegInternet/anexos/350000-354999/352176/norma.htm",
    lastReviewed: "2026-09",
  },
  {
    id: "co-blends",
    jurisdiction: "Colombia",
    countrySlug: "colombia",
    instrument: "Biofuel blending resolutions, Ministry of Mines and Energy",
    fuels: ["Ethanol", "Biodiesel"],
    status: "In force",
    currentObligation: "Gasoline carries a mandated ethanol blend and diesel a mandated biodiesel blend set by ministerial resolution.",
    requirements: [
      "Blend percentages set and adjusted by resolution, with regional variation where supply is constrained.",
      "Producers must be registered and meet national fuel-quality specifications.",
      "Blend levels have been temporarily reduced during feedstock or price shocks.",
    ],
    compliance: {
      administrator: "Ministerio de Minas y Energía",
      mechanism: "Blending reported by wholesalers; verification through the fuel information system SICOM.",
      penalty: "Sanctions under the fuel-quality regime, including fines and suspension of registration.",
      unit: null,
    },
    timeline: [
      { period: "2005", target: "Ethanol blending begins in major cities.", reached: true },
      { period: "2008", target: "Biodiesel blending introduced nationally.", reached: true },
      { period: "2026", target: "Blend levels set by resolution and adjusted with supply conditions.", reached: true },
    ],
    sourceName: "Ministerio de Minas y Energía",
    sourceUrl: "https://www.minenergia.gov.co/",
    lastReviewed: "2026-09",
  },
  {
    id: "au-nsw-qld",
    jurisdiction: "Australia (New South Wales & Queensland)",
    countrySlug: "australia",
    instrument: "NSW Biofuels Act 2007; Queensland Liquid Fuel Supply (Minimum Biobased Petrol Content) Act",
    fuels: ["Ethanol", "Biodiesel"],
    status: "In force",
    currentObligation: "State-level minimum biofuel content applies to volume fuel sellers; there is no federal mandate.",
    requirements: [
      "New South Wales: ethanol content requirement for primary wholesalers and large retailers, plus a biodiesel requirement.",
      "Queensland: minimum bio-based petrol and biodiesel content for liable fuel sellers.",
      "Exemptions available where supply or infrastructure is unavailable.",
    ],
    compliance: {
      administrator: "NSW Fair Trading / NSW Department of Primary Industries and the Queensland Department of Energy",
      mechanism: "Quarterly volume reporting by liable parties against the statutory percentage.",
      penalty: "Penalty units under each state Act for failure to meet or report the minimum content.",
      unit: null,
    },
    timeline: [
      { period: "2007", target: "NSW Biofuels Act commences.", reached: true },
      { period: "2017", target: "Queensland biobased petrol mandate begins.", reached: true },
      { period: "2026", target: "State mandates continue; a national SAF framework remains under consultation.", reached: true },
    ],
    sourceName: "NSW legislation — Biofuels Act 2007",
    sourceUrl: "https://legislation.nsw.gov.au/view/html/inforce/current/act-2007-023",
    lastReviewed: "2026-09",
  },
  {
    id: "icao-corsia",
    jurisdiction: "International (ICAO member states)",
    countrySlug: null,
    instrument: "CORSIA — Carbon Offsetting and Reduction Scheme for International Aviation",
    fuels: ["SAF"],
    status: "Phasing in",
    currentObligation:
      "Operators on covered international routes must offset emissions growth; CORSIA-eligible fuels reduce that obligation.",
    requirements: [
      "Annual emissions monitoring, reporting and verification for all operators above the threshold.",
      "CORSIA eligible fuels must be certified by an ICAO-approved sustainability certification scheme.",
      "Offsetting requirements calculated from the sector growth factor against the 85% of 2019 baseline.",
    ],
    compliance: {
      administrator: "ICAO with national civil aviation authorities",
      mechanism: "Verified emissions reports submitted to the state of the operator; eligible emissions units cancelled at the end of each compliance period.",
      penalty: "Enforcement is national — states apply their own penalties for failure to cancel units or report.",
      unit: "CORSIA eligible emissions unit",
    },
    timeline: [
      { period: "2021–2023", target: "Pilot phase with voluntary state participation.", reached: true },
      { period: "2024–2026", target: "First phase, still voluntary for states.", reached: true },
      { period: "2027–2035", target: "Mandatory phase for most ICAO member states.", reached: false },
    ],
    sourceName: "ICAO — CORSIA",
    sourceUrl: "https://www.icao.int/environmental-protection/CORSIA/Pages/default.aspx",
    lastReviewed: "2026-09",
  },
  {
    id: "imo-net-zero",
    jurisdiction: "International (IMO member states)",
    countrySlug: null,
    instrument: "IMO net-zero framework, MARPOL Annex VI amendments",
    fuels: ["Multi-fuel"],
    status: "Adopted — not yet applicable",
    currentObligation:
      "A global fuel-intensity standard and greenhouse-gas pricing mechanism for ships above 5,000 GT, adopted ahead of entry into force.",
    requirements: [
      "Annual well-to-wake GHG fuel-intensity limits with a base and a stricter direct-compliance target.",
      "Remedial units purchased for shortfalls; surplus units tradable and bankable.",
      "Revenues directed to an IMO net-zero fund supporting the transition.",
    ],
    compliance: {
      administrator: "International Maritime Organization, enforced by flag and port states",
      mechanism: "Fuel-intensity reporting through the IMO Data Collection System with verification by recognised organisations.",
      penalty: "Purchase of remedial units for the deficit; flag- and port-state enforcement under MARPOL.",
      unit: "Remedial / surplus unit (tonnes CO2e)",
    },
    timeline: [
      { period: "2023", target: "Revised IMO GHG strategy sets net-zero around 2050.", reached: true },
      { period: "2025", target: "Net-zero framework text approved by MEPC.", reached: true },
      { period: "2027–2028", target: "Framework expected to apply following formal adoption and entry into force.", reached: false },
      { period: "2050", target: "Net-zero GHG emissions from international shipping.", reached: false },
    ],
    sourceName: "IMO — cutting GHG emissions from shipping",
    sourceUrl: "https://www.imo.org/en/OurWork/Environment/Pages/Cutting-GHG-emissions.aspx",
    lastReviewed: "2026-09",
  },
];

export const MANDATE_FUELS: MandateFuel[] = [
  "Ethanol",
  "Biodiesel",
  "Renewable diesel",
  "SAF",
  "Biomethane",
  "Multi-fuel",
];

export const MANDATE_STATUSES: MandateStatus[] = [
  "In force",
  "Phasing in",
  "Adopted — not yet applicable",
  "Under revision",
];

export function mandateStatusTone(status: MandateStatus): string {
  switch (status) {
    case "In force":
      return "border-emerald-300 bg-emerald-50 text-emerald-900";
    case "Phasing in":
      return "border-sky-300 bg-sky-50 text-sky-900";
    case "Adopted — not yet applicable":
      return "border-amber-300 bg-amber-50 text-amber-900";
    case "Under revision":
      return "border-orange-300 bg-orange-50 text-orange-900";
  }
}
