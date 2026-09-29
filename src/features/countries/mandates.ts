/**
 * Country feature register of active biofuel blending / renewable-fuel obligations.
 *
 * Every entry is compiled from the primary legal instrument or the administering
 * agency's published guidance. `sourceUrl` points at that primary document.
 * Percentages are the obligation as written in law; where a target is stated as
 * an energy share rather than a volume share this is noted in `requirements`.
 */

export type MandateFuel =
  "Ethanol" | "Biodiesel" | "Renewable diesel" | "SAF" | "Biomethane" | "Multi-fuel";

export type MandateStatus =
  "In force" | "Phasing in" | "Adopted — not yet applicable" | "Under revision";

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
  /** Extra official government / administrator websites for this obligation. */
  officialSites?: { label: string; url: string }[];
  /** Terms used to attach live news items to this obligation. */
  keywords?: string[];
  lastReviewed: string;
}

export const MANDATES: Mandate[] = [
  {
    id: "eu-red-iii",
    jurisdiction: "European Union",
    countrySlug: "european-union",
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
      {
        period: "2025",
        target: "Transposition deadline for transport targets (21 May 2025).",
        reached: true,
      },
      {
        period: "2026",
        target: "Union Database reporting operational for all liquid and gaseous fuels.",
        reached: true,
      },
      {
        period: "2030",
        target:
          "29% renewable transport share or 14.5% GHG-intensity cut; 5.5% advanced/RFNBO sub-target.",
        reached: false,
      },
    ],
    sourceName: "EUR-Lex — Directive (EU) 2023/2413",
    sourceUrl: "https://eur-lex.europa.eu/eli/dir/2023/2413/oj",
    lastReviewed: "2026-09",
  },
  {
    id: "eu-refuel-aviation",
    jurisdiction: "European Union",
    countrySlug: "european-union",
    instrument: "ReFuelEU Aviation Regulation (EU) 2023/2405",
    fuels: ["SAF"],
    status: "Phasing in",
    currentObligation:
      "Union airports must supply aviation fuel containing at least 2% SAF, rising to 70% by 2050.",
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
      {
        period: "2030",
        target: "6% SAF, including a 1.2% synthetic-fuel sub-quota.",
        reached: false,
      },
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
    countrySlug: "european-union",
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
      {
        period: "2025",
        target: "-2% GHG intensity versus the 91.16 gCO2e/MJ baseline.",
        reached: true,
      },
      {
        period: "2030",
        target: "-6% GHG intensity; on-shore power obligation at core ports.",
        reached: false,
      },
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
      {
        period: "2005 / 2007",
        target:
          "Programme created by the Energy Policy Act and expanded by the Energy Independence and Security Act.",
        reached: true,
      },
      {
        period: "2023–2025",
        target: "First multi-year 'set' rule establishing volumes beyond the statutory table.",
        reached: true,
      },
      {
        period: "2026–2027",
        target: "Second set rulemaking establishing annual volumes, including the eRIN question.",
        reached: true,
      },
      {
        period: "Annual",
        target: "Compliance demonstration each 31 March for the preceding calendar year.",
        reached: true,
      },
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
      {
        period: "2018",
        target: "Amendments extend the target to a 20% CI reduction by 2030.",
        reached: true,
      },
      {
        period: "2025",
        target:
          "Amended regulation takes effect with a steeper trajectory and auto-acceleration mechanism.",
        reached: true,
      },
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
    currentObligation:
      "Fuel importers must reduce the average carbon intensity of Oregon transport fuels against a 2015 baseline.",
    requirements: [
      "Registered importers report volumes and carbon intensities quarterly.",
      "Carbon-intensity values come from OR-GREET certified pathways.",
      "Annual compliance report and third-party verification for larger reporters.",
    ],
    compliance: {
      administrator: "Oregon Department of Environmental Quality",
      mechanism:
        "Credit and deficit accounting in the Oregon Fuels Reporting System, with tradable credits and unlimited banking.",
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
    id: "us-wa-cfs",
    jurisdiction: "Washington, United States",
    countrySlug: "united-states",
    instrument: "Washington Clean Fuel Standard, Chapter 173-424 WAC (HB 1091)",
    fuels: ["Multi-fuel"],
    status: "Phasing in",
    currentObligation:
      "Transportation fuels supplied in Washington must meet a declining carbon-intensity standard measured against a 2017 baseline.",
    requirements: [
      "Fuel suppliers register in the Washington Fuels Reporting System and report volumes and carbon intensities quarterly.",
      "Carbon-intensity values are certified through WA-GREET fuel pathway applications approved by Ecology.",
      "Fuels above the annual benchmark generate deficits; fuels below it generate tradable credits.",
      "Annual compliance report with third-party verification for larger reporting entities.",
    ],
    compliance: {
      administrator: "Washington State Department of Ecology",
      mechanism:
        "Credits and deficits are reconciled annually in the Washington Fuels Reporting System; credits are bankable and tradable, with a credit clearance market when prices reach the ceiling.",
      penalty:
        "Civil penalties under the Clean Fuel Standard rule for unresolved deficits, plus mandatory retirement of replacement credits.",
      unit: "Clean Fuel Standard credit (one metric tonne CO2e)",
    },
    timeline: [
      {
        period: "2021",
        target: "HB 1091 signed, directing Ecology to adopt a clean fuel standard.",
        reached: true,
      },
      {
        period: "2023",
        target: "Programme begins with reporting and the first compliance obligation.",
        reached: true,
      },
      { period: "2034", target: "20% carbon-intensity reduction versus 2017.", reached: false },
      {
        period: "2038",
        target: "45% carbon-intensity reduction versus 2017 under the 2025 amendments.",
        reached: false,
      },
    ],
    sourceName: "Washington Department of Ecology — Clean Fuel Standard",
    sourceUrl:
      "https://ecology.wa.gov/air-climate/reducing-greenhouse-gas-emissions/clean-fuel-standard",
    officialSites: [
      {
        label: "Ecology — Clean Fuel Standard rule (Ch. 173-424 WAC)",
        url: "https://apps.leg.wa.gov/wac/default.aspx?cite=173-424",
      },
      {
        label: "Washington State Legislature — HB 1091",
        url: "https://app.leg.wa.gov/billsummary?BillNumber=1091&Year=2021",
      },
    ],
    keywords: ["washington", "clean fuel standard", "wa-greet", "department of ecology", "hb 1091"],
    lastReviewed: "2026-09",
  },
  {
    id: "us-nm-ctfs",
    jurisdiction: "New Mexico, United States",
    countrySlug: "united-states",
    instrument: "New Mexico Clean Transportation Fuel Standard (SB 84, 2024)",
    fuels: ["Multi-fuel"],
    status: "Phasing in",
    currentObligation:
      "Transportation fuels sold in New Mexico must reduce their carbon intensity against a 2018 baseline under rules adopted by the Environmental Improvement Board.",
    requirements: [
      "Regulated parties register and report fuel volumes and carbon intensities to the Environment Department.",
      "Carbon intensities are set through approved lifecycle pathway applications.",
      "Deficits from high-carbon fuels must be offset with credits generated by low-carbon fuels, including electricity and biomethane.",
      "Annual compliance demonstration with verification requirements phased in.",
    ],
    compliance: {
      administrator: "New Mexico Environment Department and the Environmental Improvement Board",
      mechanism:
        "A credit and deficit market administered by the Environment Department; credits are bankable and tradable between regulated parties.",
      penalty:
        "Civil penalties under the Air Quality Control Act plus retirement of replacement credits for outstanding deficits.",
      unit: "Clean transportation fuel credit",
    },
    timeline: [
      { period: "2024", target: "SB 84 signed into law, authorising the standard.", reached: true },
      {
        period: "2025–2026",
        target: "Environmental Improvement Board rulemaking and programme start-up.",
        reached: true,
      },
      { period: "2030", target: "20% carbon-intensity reduction versus 2018.", reached: false },
      { period: "2040", target: "30% carbon-intensity reduction versus 2018.", reached: false },
    ],
    sourceName: "New Mexico Environment Department — Clean Transportation Fuel Standard",
    sourceUrl: "https://www.env.nm.gov/air-quality/clean-transportation-fuel-standard/",
    officialSites: [
      {
        label: "New Mexico Legislature — SB 84 (2024)",
        url: "https://www.nmlegis.gov/Legislation/Legislation?chamber=S&legType=B&legNo=84&year=24",
      },
      { label: "NMED — Air Quality Bureau", url: "https://www.env.nm.gov/air-quality/" },
    ],
    keywords: [
      "new mexico",
      "clean transportation fuel standard",
      "sb 84",
      "environment department",
      "environmental improvement board",
    ],
    lastReviewed: "2026-09",
  },
  {
    id: "us-ny-bioheat",
    jurisdiction: "New York, United States",
    countrySlug: "united-states",
    instrument: "New York bioheating fuel requirement, Energy Law §§ 19-103 / 19-104 (S3321-B)",
    fuels: ["Biodiesel"],
    status: "Phasing in",
    currentObligation:
      "All heating oil sold statewide in New York must be bioheating fuel containing a minimum percentage of biodiesel, rising on a fixed schedule.",
    requirements: [
      "Every gallon of heating oil sold for use in New York must contain at least the statutory biodiesel percentage.",
      "Biodiesel must meet ASTM D6751 and the blended fuel ASTM D396.",
      "Distributors must document the biodiesel content of each delivery.",
      "New York City applies its own stricter Local Law 119 schedule for heating oil sold in the city.",
    ],
    compliance: {
      administrator:
        "New York State Energy Research and Development Authority with the Department of Environmental Conservation; NYC Department of Environmental Protection for the city schedule",
      mechanism:
        "Blend content is documented on delivery tickets and supplier records, which are subject to state inspection; NYC filings are made to DEP under Local Law 119.",
      penalty:
        "Penalties under state energy and environmental law, and civil penalties under the NYC Administrative Code for the city requirement.",
      unit: null,
    },
    timeline: [
      {
        period: "July 2022",
        target: "B5 minimum in all heating oil sold statewide.",
        reached: true,
      },
      { period: "July 2025", target: "B10 minimum statewide.", reached: true },
      { period: "July 2030", target: "B20 minimum statewide.", reached: false },
      {
        period: "NYC 2034",
        target: "New York City reaches B50 under Local Law 119.",
        reached: false,
      },
    ],
    sourceName: "New York State Senate — S3321-B bioheating fuel law",
    sourceUrl: "https://www.nysenate.gov/legislation/bills/2021/S3321",
    officialSites: [
      { label: "NYSERDA", url: "https://www.nyserda.ny.gov/" },
      { label: "NYS Department of Environmental Conservation", url: "https://dec.ny.gov/" },
      {
        label: "NYC DEP — heating oil rules",
        url: "https://www.nyc.gov/site/dep/environment/heating-oil.page",
      },
    ],
    keywords: [
      "new york",
      "bioheat",
      "bioheating fuel",
      "b5",
      "b10",
      "b20",
      "local law 119",
      "nyserda",
    ],
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
      penalty:
        "Offences and penalties under CEPA 1999, including monetary penalties and prosecution.",
      unit: "CFR compliance credit (one tonne CO2e)",
    },
    timeline: [
      {
        period: "2022",
        target: "Regulations registered; registration and reporting begin.",
        reached: true,
      },
      {
        period: "2023",
        target: "First reduction requirement of 3.5 gCO2e/MJ takes effect (1 July).",
        reached: true,
      },
      {
        period: "2026",
        target: "Requirement steps up on the annual schedule toward 2030.",
        reached: true,
      },
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
      mechanism:
        "Distributors buy and retire CBIOs on the B3 exchange; retirement is verified against each firm's individual target.",
      penalty:
        "Fines from R$100,000 up to R$50 million depending on the size of the shortfall, under Law 13.576/2017.",
      unit: "CBIO (one tonne CO2e avoided)",
    },
    timeline: [
      { period: "2017", target: "Law 13.576 creates the programme.", reached: true },
      {
        period: "2020",
        target: "First compliance year with individual distributor targets.",
        reached: true,
      },
      {
        period: "2026",
        target: "Annual targets continue to rise under the CNPE decarbonisation curve.",
        reached: true,
      },
      {
        period: "2030",
        target: "Cumulative decarbonisation target for the transport fuel matrix.",
        reached: false,
      },
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
      mechanism:
        "ANP inspects distributors and refiners; blend levels are verified through fuel-quality monitoring and volume reporting.",
      penalty: "ANP administrative fines and product seizure for off-specification fuel.",
      unit: null,
    },
    timeline: [
      { period: "2024", target: "Law 14.993 (Combustível do Futuro) enacted.", reached: true },
      {
        period: "2025",
        target: "E30 gasoline blend and B15 diesel blend take effect (1 August 2025).",
        reached: true,
      },
      {
        period: "2027",
        target:
          "ProBioQAV SAF obligation begins at a 1% emissions reduction for domestic aviation.",
        reached: false,
      },
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
    currentObligation:
      "Public-sector oil marketing companies supply petrol blended with 20% ethanol nationwide.",
    requirements: [
      "Oil marketing companies procure ethanol through periodic tenders at administered prices by feedstock category.",
      "Blend targets are tracked per ethanol supply year (November–October).",
      "E100 and flex-fuel vehicle rollout supported alongside the blending obligation.",
    ],
    compliance: {
      administrator: "Ministry of Petroleum & Natural Gas",
      mechanism:
        "Monthly blending statistics reported by OMCs against the ethanol supply year target.",
      penalty:
        "Administrative — the obligation sits on state oil marketing companies rather than private obligated parties.",
      unit: null,
    },
    timeline: [
      {
        period: "2018",
        target: "National Policy on Biofuels sets a 20% target for 2030.",
        reached: true,
      },
      {
        period: "2022",
        target: "Target advanced to ethanol supply year 2025–26; E10 achieved nationally.",
        reached: true,
      },
      {
        period: "2025",
        target: "E20 blending achieved across the national petrol pool.",
        reached: true,
      },
      {
        period: "2026 onward",
        target: "Consolidation of E20 and expansion of flex-fuel and E100 retail.",
        reached: true,
      },
    ],
    sourceName: "Ministry of Petroleum & Natural Gas — Ethanol Blending",
    sourceUrl: "https://mopng.gov.in/en/marketing/ethanol-blending",
    officialSites: [
      {
        label: "PIB factsheet: Ethanol Blending in India (5 July 2026)",
        url: "https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/jul/doc202675912001.pdf",
      },
      {
        label: "PIB: Ethanol Blended Petrol Programme Q&A (10 July 2026)",
        url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2283118",
      },
    ],
    keywords: ["ethanol blending", "e20", "ebp programme", "oil marketing companies", "mopng"],
    lastReviewed: "2026-09",
  },
  {
    id: "in-cbg",
    jurisdiction: "India",
    countrySlug: "india",
    instrument: "Compressed Biogas Blending Obligation (CBG Blending Obligation)",
    fuels: ["Biomethane"],
    status: "Phasing in",
    currentObligation:
      "City gas distribution entities must blend a rising share of compressed biogas into CNG and piped natural gas.",
    requirements: [
      "Obligation applies to CNG (transport) and domestic PNG segments.",
      "Blend share rises on a published annual schedule to 2028–29.",
      "CBG procured from plants under the SATAT initiative and other registered producers.",
    ],
    compliance: {
      administrator: "Ministry of Petroleum & Natural Gas and PNGRB",
      mechanism:
        "National CBG Coordination Committee monitors blending volumes reported by city gas distribution entities.",
      penalty: "Regulatory action by PNGRB against licensed CGD entities that miss the obligation.",
      unit: null,
    },
    timeline: [
      { period: "2023", target: "Obligation announced; voluntary phase begins.", reached: true },
      { period: "2025-26", target: "Mandatory blending phase starts at 1%.", reached: true },
      {
        period: "2026-27",
        target: "Blending share steps up under the notified schedule.",
        reached: true,
      },
      { period: "2028-29", target: "Obligation reaches 5% CBG in CNG and PNG.", reached: false },
    ],
    sourceName: "Ministry of Petroleum & Natural Gas — CBG Blending Obligation",
    sourceUrl: "https://mopng.gov.in/en",
    officialSites: [
      {
        label: "Petroleum and Natural Gas Regulatory Board (PNGRB)",
        url: "https://www.pngrb.gov.in/",
      },
      { label: "SATAT — compressed biogas initiative", url: "https://satat.co.in/satat/" },
    ],
    keywords: ["compressed biogas", "cbg blending obligation", "cbo", "pngrb", "satat"],
    lastReviewed: "2026-09",
  },
  {
    id: "id-biodiesel",
    jurisdiction: "Indonesia",
    countrySlug: "indonesia",
    instrument: "Mandatory biodiesel programme (MEMR regulations under Law 30/2007)",
    fuels: ["Biodiesel"],
    status: "Phasing in",
    currentObligation:
      "Diesel sold in the domestic market must contain a mandated share of palm-based FAME.",
    requirements: [
      "Allocation quotas issued to registered FAME producers and fuel distributors each year.",
      "Programme part-funded by the palm oil export levy administered by BPDPKS.",
      "Blend level applies to both subsidised (PSO) and non-subsidised diesel, with staged coverage.",
    ],
    compliance: {
      administrator: "Ministry of Energy and Mineral Resources (MEMR) with BPDPKS",
      mechanism:
        "Quarterly allocation and realisation reporting by producers and distributors; levy-funded incentive payments settled against delivered volumes.",
      penalty:
        "Reduction or withdrawal of allocation quota and administrative sanctions under MEMR regulation.",
      unit: null,
    },
    timeline: [
      { period: "2020", target: "B30 mandate implemented nationally.", reached: true },
      { period: "2023", target: "B35 mandate implemented.", reached: true },
      { period: "2025", target: "B40 mandate takes effect from 1 January 2025.", reached: true },
      {
        period: "2026 onward",
        target:
          "Government roadmap targets a step to B50 subject to feedstock and capacity readiness.",
        reached: false,
      },
    ],
    sourceName: "MEMR Regulation No. 4 of 2025 on the management and use of biofuels (JDIH ESDM)",
    sourceUrl: "https://jdih.esdm.go.id/dokumen/download?id=2025pmesdm4.pdf",
    officialSites: [
      {
        label: "ESDM press release 001.Pers/04/SJI/2025 — B40 mandatory from 1 January 2025",
        url: "https://www.esdm.go.id/en/media-center/news-archives/wujudkan-ketahanan-energi-dan-kurangi-impor-menteri-esdm-mandatori-b40-berlaku-1-januari-2025",
      },
      {
        label: "Directorate General of New, Renewable Energy and Energy Conservation (EBTKE)",
        url: "https://ebtke.esdm.go.id/",
      },
    ],
    keywords: ["b40", "b50", "fame", "biodiesel mandate", "esdm", "bpdpks"],
    lastReviewed: "2026-09",
  },
  {
    id: "uk-rtfo",
    jurisdiction: "United Kingdom",
    countrySlug: "united-kingdom",
    instrument: "Renewable Transport Fuel Obligation Order 2007 (as amended)",
    fuels: ["Multi-fuel"],
    status: "In force",
    currentObligation:
      "Suppliers of 450,000 litres or more of fuel a year must show that a set share is renewable.",
    requirements: [
      "Main obligation set as a percentage of relevant fuel supplied, with a separate development-fuel sub-target.",
      "Crop-derived biofuel capped and stepping down over the obligation period.",
      "Fuels must meet RTFO sustainability criteria, verified and reported quarterly.",
    ],
    compliance: {
      administrator: "Department for Transport, administered by the Low Carbon Fuels Unit",
      mechanism:
        "Renewable Transport Fuel Certificates (RTFCs) are issued per litre or kilogram supplied and redeemed against the annual obligation.",
      penalty: "Fixed buy-out price per RTFC not redeemed, payable to the administrator.",
      unit: "Renewable Transport Fuel Certificate (RTFC)",
    },
    timeline: [
      { period: "2008", target: "Obligation begins.", reached: true },
      {
        period: "2018",
        target: "Development-fuel sub-target and crop cap introduced.",
        reached: true,
      },
      {
        period: "2026",
        target: "Annual obligation share continues on the published trajectory.",
        reached: true,
      },
      {
        period: "2032",
        target: "Crop cap steps down to its lowest level under the current order.",
        reached: false,
      },
    ],
    sourceName: "GOV.UK — Renewable Transport Fuel Obligation",
    sourceUrl:
      "https://www.gov.uk/government/collections/renewable-transport-fuels-obligation-rtfo-guidance",
    lastReviewed: "2026-09",
  },
  {
    id: "uk-saf-mandate",
    jurisdiction: "United Kingdom",
    countrySlug: "united-kingdom",
    instrument: "Renewable Transport Fuel Obligations (Sustainable Aviation Fuel) Order 2024",
    fuels: ["SAF"],
    status: "Phasing in",
    currentObligation:
      "Aviation fuel suppliers must supply a rising share of sustainable aviation fuel, starting at 2% in 2025.",
    requirements: [
      "Obligation applies to suppliers of jet fuel above the annual threshold.",
      "Separate power-to-liquid sub-obligation begins in 2028.",
      "HEFA-derived SAF is capped as a share of the obligation and the cap declines over time.",
      "A revenue-certainty mechanism supports UK SAF plants alongside the mandate.",
    ],
    compliance: {
      administrator: "Department for Transport — Low Carbon Fuels Unit",
      mechanism:
        "SAF certificates issued for eligible supply and redeemed against the annual obligation, mirroring the RTFC system.",
      penalty:
        "Buy-out price per certificate not redeemed, set separately for the main and PtL obligations.",
      unit: "SAF certificate",
    },
    timeline: [
      { period: "2025", target: "Mandate starts at 2% of jet fuel supplied.", reached: true },
      { period: "2028", target: "Power-to-liquid sub-obligation begins at 0.2%.", reached: false },
      { period: "2030", target: "10% SAF share.", reached: false },
      {
        period: "2040",
        target: "22% SAF share, held flat thereafter pending review.",
        reached: false,
      },
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
    currentObligation:
      "Fuel suppliers must reduce the greenhouse gas emissions of the fuel they place on the market by a set percentage.",
    requirements: [
      "Quota obligation expressed as a GHG reduction, not a volume share.",
      "Sub-quota for advanced biofuels from Annex IX Part A feedstocks.",
      "Caps on crop-based biofuels and on the use of biofuels from used cooking oil and animal fats.",
      "Electricity supplied to road vehicles can generate quota credits.",
    ],
    compliance: {
      administrator: "Hauptzollamt Frankfurt (Oder) — Biokraftstoffquotenstelle",
      mechanism:
        "Annual quota declaration with Nabisy sustainability certificates; obligations can be transferred between parties by contract.",
      penalty: "Penalty payment per tonne of CO2-equivalent shortfall under §37c BImSchG.",
      unit: "THG quota (tonnes CO2e), tradable by contract",
    },
    timeline: [
      { period: "2015", target: "Volume quota replaced by a greenhouse-gas quota.", reached: true },
      {
        period: "2022",
        target: "RED II implementation raises the trajectory and adds advanced sub-quotas.",
        reached: true,
      },
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
    currentObligation:
      "Fuel suppliers pay a tax unless they meet renewable-energy incorporation rates for petrol, diesel and aviation fuel.",
    requirements: [
      "Separate incorporation rates for the petrol pool, the diesel pool and, since 2022, aviation fuel.",
      "Sub-targets for advanced feedstocks and caps on crop-based and high-ILUC-risk feedstocks.",
      "Sustainability proof required through a recognised voluntary scheme and the national CarbuRe registry.",
    ],
    compliance: {
      administrator: "Direction générale des douanes et droits indirects",
      mechanism:
        "Annual declaration of energy incorporated; shortfalls are taxed at a rate applied to the missing percentage points.",
      penalty:
        "TIRUERT tax liability proportional to the shortfall, plus customs penalties for false declaration.",
      unit: null,
    },
    timeline: [
      { period: "2019", target: "TIRIB replaces the previous TGAP mechanism.", reached: true },
      { period: "2022", target: "Renamed TIRUERT and extended to aviation fuel.", reached: true },
      {
        period: "2026",
        target: "Incorporation rates set annually in the finance law.",
        reached: true,
      },
      {
        period: "2030",
        target: "Rates aligned with the RED III transport target.",
        reached: false,
      },
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
    currentObligation:
      "Fuel suppliers must meet an annual renewable-energy obligation for road and rail transport.",
    requirements: [
      "Annual obligation expressed as a share of energy supplied, with sub-obligations for advanced biofuels.",
      "Separate reduction obligation for the aviation and maritime pools introduced alongside EU rules.",
      "Double counting applies to Annex IX Part A and B feedstocks within caps.",
    ],
    compliance: {
      administrator: "Nederlandse Emissieautoriteit (NEa)",
      mechanism:
        "Hernieuwbare Brandstofeenheden (HBEs) are registered and traded in the NEa register and redeemed annually.",
      penalty: "Administrative fine per unredeemed HBE plus an order to make up the shortfall.",
      unit: "Hernieuwbare Brandstofeenheid (HBE)",
    },
    timeline: [
      { period: "2018", target: "Current HBE framework begins.", reached: true },
      {
        period: "2022",
        target: "RED II implementation; advanced sub-obligation strengthened.",
        reached: true,
      },
      {
        period: "2026",
        target: "Obligation rises on the trajectory set for RED III alignment.",
        reached: true,
      },
      {
        period: "2030",
        target: "Alignment with the RED III 29% transport target.",
        reached: false,
      },
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
    currentObligation:
      "Suppliers must reduce the lifecycle greenhouse-gas intensity of petrol and diesel by a legally set percentage.",
    requirements: [
      "Separate reduction levels for petrol and for diesel.",
      "Reduction achieved by blending biofuels certified under the Swedish sustainability act.",
      "Aviation fuel covered by a separate reduction obligation.",
    ],
    compliance: {
      administrator: "Swedish Energy Agency (Energimyndigheten)",
      mechanism:
        "Annual reduction declaration with sustainability certification; limited over-compliance can be carried forward.",
      penalty: "Reduction-obligation charge per kilogram of CO2e shortfall.",
      unit: null,
    },
    timeline: [
      { period: "2018", target: "Obligation introduced for petrol and diesel.", reached: true },
      {
        period: "2024",
        target: "Levels cut sharply to 6% for both petrol and diesel.",
        reached: true,
      },
      {
        period: "2026",
        target: "Levels raised again following the 2025 legislative revision.",
        reached: true,
      },
      {
        period: "2030",
        target: "Trajectory to be confirmed by the ongoing review.",
        reached: false,
      },
    ],
    sourceName: "Energimyndigheten — Reduktionsplikt",
    sourceUrl: "https://www.energimyndigheten.se/fornybart/hallbarhetskriterier/reduktionsplikt/",
    lastReviewed: "2026-09",
  },
  {
    id: "no-omsetningskrav",
    jurisdiction: "Norway",
    countrySlug: null,
    instrument: "Omsetningskrav — Product Regulations Chapter 3",
    fuels: ["Multi-fuel", "SAF"],
    status: "In force",
    currentObligation:
      "Fuel suppliers must sell a minimum share of biofuel in road transport, with a separate aviation requirement.",
    requirements: [
      "Road transport turnover requirement with an advanced-biofuel sub-requirement.",
      "Aviation fuel suppliers must supply a minimum share of advanced sustainable aviation fuel.",
      "Non-road machinery and shipping covered by separate requirements.",
    ],
    compliance: {
      administrator: "Miljødirektoratet (Norwegian Environment Agency)",
      mechanism:
        "Annual reporting of volumes and sustainability documentation to the Environment Agency.",
      penalty: "Coercive fines and enforcement under the Pollution Control Act.",
      unit: null,
    },
    timeline: [
      { period: "2009", target: "Turnover requirement introduced.", reached: true },
      { period: "2020", target: "Aviation biofuel requirement of 0.5% begins.", reached: true },
      {
        period: "2026",
        target: "Road and aviation shares continue on the regulated schedule.",
        reached: true,
      },
      {
        period: "2030",
        target: "Requirements aligned with the national climate plan.",
        reached: false,
      },
    ],
    sourceName: "Miljødirektoratet — Omsetningskrav",
    sourceUrl: "https://www.miljodirektoratet.no/ansvarsomrader/klima/omsetningskrav-biodrivstoff/",
    lastReviewed: "2026-09",
  },
  {
    id: "jp-saf",
    jurisdiction: "Japan",
    countrySlug: "japan",
    instrument:
      "SAF supply obligation under the Sophisticated Methods of Energy Supply Structures Act",
    fuels: ["SAF"],
    status: "Adopted — not yet applicable",
    currentObligation:
      "Oil refiners and importers must supply SAF equal to 10% of jet fuel for international flights departing Japan by 2030.",
    requirements: [
      "Obligation placed on fuel suppliers rather than airlines.",
      "Applies to jet fuel uplifted for international departures from Japanese airports.",
      "Supported by domestic SAF production investment under the GX programme.",
    ],
    compliance: {
      administrator:
        "Ministry of Economy, Trade and Industry (METI) — Agency for Natural Resources and Energy",
      mechanism:
        "Annual plans and reporting by designated energy suppliers under the Energy Supply Structure Sophistication Act.",
      penalty: "Recommendations, publication of non-compliance and orders under the Act.",
      unit: null,
    },
    timeline: [
      {
        period: "2022",
        target: "10% by 2030 target announced in the SAF public-private council.",
        reached: true,
      },
      {
        period: "2024",
        target: "Judgement criteria for suppliers formalised under the Act.",
        reached: true,
      },
      {
        period: "2030",
        target: "10% SAF share of international jet fuel supplied in Japan.",
        reached: false,
      },
    ],
    sourceName: "METI Agency for Natural Resources and Energy — SAF policy and rulemaking",
    sourceUrl: "https://www.enecho.meti.go.jp/about/special/johoteikyo/saf_torikumi.html",
    officialSites: [
      {
        label: "Energy Efficiency and Non-fossil Energy Transition Act — statutes and orders",
        url: "https://www.enecho.meti.go.jp/category/saving_and_new/saving/enterprise/overview/laws/",
      },
    ],
    keywords: [
      "saf",
      "sustainable aviation fuel",
      "meti",
      "enecho",
      "non-fossil energy transition",
    ],
    lastReviewed: "2026-09",
  },
  {
    id: "cn-e10",
    jurisdiction: "China",
    countrySlug: "china",
    instrument: "Provincial E10 ethanol gasoline programmes",
    fuels: ["Ethanol"],
    status: "In force",
    currentObligation:
      "E10 ethanol gasoline is mandatory in a group of provinces rather than across the whole country.",
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
      {
        period: "2001",
        target: "Fuel-ethanol pilot programme begins in selected provinces.",
        reached: true,
      },
      {
        period: "2017",
        target: "Nationwide E10 by 2020 announced by NDRC and partner agencies.",
        reached: true,
      },
      {
        period: "2020",
        target: "Nationwide rollout deferred; coverage stays provincial.",
        reached: true,
      },
      {
        period: "2026",
        target: "Programme remains province-by-province with SAF pilots added.",
        reached: true,
      },
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
    currentObligation:
      "Diesel is sold as a mandated B-grade blend and gasohol grades carry mandated ethanol content.",
    requirements: [
      "Base diesel grade blend level set by the Department of Energy Business and adjusted with palm-oil supply.",
      "Gasohol E10, E20 and E85 grades sold with E20 promoted as the base grade.",
      "Oil Fuel Fund used to manage retail price differentials between grades.",
    ],
    compliance: {
      administrator: "Ministry of Energy — Department of Energy Business",
      mechanism:
        "Fuel-quality notifications and inspection of refiners, blenders and retail stations.",
      penalty: "Penalties under the Fuel Trade Act for off-specification fuel.",
      unit: null,
    },
    timeline: [
      { period: "2008", target: "B2 mandatory biodiesel blend introduced.", reached: true },
      { period: "2019", target: "B10 designated the base diesel grade.", reached: true },
      { period: "2024", target: "E20 promoted as the base gasohol grade.", reached: true },
      {
        period: "2026",
        target: "Blend levels adjusted periodically with feedstock availability.",
        reached: true,
      },
    ],
    sourceName: "Department of Energy Business — fuel-quality notifications register",
    sourceUrl: "http://elaw.doeb.go.th/home_en.php",
    officialSites: [
      {
        label: "DOEB notification on diesel characteristics and quality",
        url: "http://elaw.doeb.go.th/document_doeb/TH/699TH_0001.pdf",
      },
      {
        label: "DOEB notification on gasohol characteristics and quality",
        url: "http://elaw.doeb.go.th/document_doeb/424_0001.pdf",
      },
    ],
    keywords: ["gasohol", "b7", "b10", "e20", "department of energy business", "oil fuel fund"],
    lastReviewed: "2026-09",
  },
  {
    id: "ar-blends",
    jurisdiction: "Argentina",
    countrySlug: "argentina",
    instrument: "Biofuels Framework Law 27.640 (2021)",
    fuels: ["Ethanol", "Biodiesel"],
    status: "In force",
    currentObligation:
      "Gasoline must contain 12% bioethanol and diesel a minimum 7.5% biodiesel blend.",
    requirements: [
      "Bioethanol split between sugarcane and maize-based supply under quota.",
      "Biodiesel minimum may be raised by the enforcement authority within statutory limits.",
      "Volumes and prices allocated administratively to registered plants.",
    ],
    compliance: {
      administrator: "Secretaría de Energía",
      mechanism:
        "Monthly allocation resolutions and delivery reporting by registered producers and blenders.",
      penalty: "Fines, suspension or removal from the biofuels registry under Law 27.640.",
      unit: null,
    },
    timeline: [
      { period: "2021", target: "Law 27.640 replaces the earlier 26.093 regime.", reached: true },
      {
        period: "2022",
        target: "Biodiesel minimum set at 7.5%; ethanol held at 12%.",
        reached: true,
      },
      {
        period: "2026",
        target: "Framework remains in force with periodic price resolutions.",
        reached: true,
      },
      {
        period: "2030",
        target: "Law scheduled for review and possible extension.",
        reached: false,
      },
    ],
    sourceName: "InfoLEG — Ley 27.640",
    sourceUrl:
      "https://servicios.infoleg.gob.ar/infolegInternet/anexos/350000-354999/352176/norma.htm",
    lastReviewed: "2026-09",
  },
  {
    id: "co-blends",
    jurisdiction: "Colombia",
    countrySlug: "colombia",
    instrument: "Biofuel blending resolutions, Ministry of Mines and Energy",
    fuels: ["Ethanol", "Biodiesel"],
    status: "In force",
    currentObligation:
      "Gasoline carries a mandated ethanol blend and diesel a mandated biodiesel blend set by ministerial resolution.",
    requirements: [
      "Blend percentages set and adjusted by resolution, with regional variation where supply is constrained.",
      "Producers must be registered and meet national fuel-quality specifications.",
      "Blend levels have been temporarily reduced during feedstock or price shocks.",
    ],
    compliance: {
      administrator: "Ministerio de Minas y Energía",
      mechanism:
        "Blending reported by wholesalers; verification through the fuel information system SICOM.",
      penalty:
        "Sanctions under the fuel-quality regime, including fines and suspension of registration.",
      unit: null,
    },
    timeline: [
      { period: "2005", target: "Ethanol blending begins in major cities.", reached: true },
      { period: "2008", target: "Biodiesel blending introduced nationally.", reached: true },
      {
        period: "2026",
        target: "Blend levels set by resolution and adjusted with supply conditions.",
        reached: true,
      },
    ],
    sourceName: "Resolución 40103 de 2021 — fuel and biofuel blend quality parameters",
    sourceUrl:
      "https://gestornormativo.creg.gov.co/gestor/entorno/docs/resolucion_minminas_40103_2021.htm",
    officialSites: [
      { label: "Ministerio de Minas y Energía", url: "https://www.minenergia.gov.co/" },
      {
        label: "Resolución 40103 de 2021 (Ministerio de Ambiente record)",
        url: "https://www.minambiente.gov.co/documento-entidad/resolucion-40103-de-2021/",
      },
    ],
    keywords: ["mezcla", "alcohol carburante", "biodiesel", "resolución", "minminas", "sicom"],
    lastReviewed: "2026-09",
  },
  {
    id: "au-nsw-qld",
    jurisdiction: "Australia (New South Wales & Queensland)",
    countrySlug: "australia",
    instrument:
      "NSW Biofuels Act 2007; Queensland Liquid Fuel Supply (Minimum Biobased Petrol Content) Act",
    fuels: ["Ethanol", "Biodiesel"],
    status: "In force",
    currentObligation:
      "State-level minimum biofuel content applies to volume fuel sellers; there is no federal mandate.",
    requirements: [
      "New South Wales: ethanol content requirement for primary wholesalers and large retailers, plus a biodiesel requirement.",
      "Queensland: minimum bio-based petrol and biodiesel content for liable fuel sellers.",
      "Exemptions available where supply or infrastructure is unavailable.",
    ],
    compliance: {
      administrator:
        "NSW Fair Trading / NSW Department of Primary Industries and the Queensland Department of Energy",
      mechanism: "Quarterly volume reporting by liable parties against the statutory percentage.",
      penalty:
        "Penalty units under each state Act for failure to meet or report the minimum content.",
      unit: null,
    },
    timeline: [
      { period: "2007", target: "NSW Biofuels Act commences.", reached: true },
      { period: "2017", target: "Queensland biobased petrol mandate begins.", reached: true },
      {
        period: "2026",
        target: "State mandates continue; a national SAF framework remains under consultation.",
        reached: true,
      },
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
      mechanism:
        "Verified emissions reports submitted to the state of the operator; eligible emissions units cancelled at the end of each compliance period.",
      penalty:
        "Enforcement is national — states apply their own penalties for failure to cancel units or report.",
      unit: "CORSIA eligible emissions unit",
    },
    timeline: [
      {
        period: "2021–2023",
        target: "Pilot phase with voluntary state participation.",
        reached: true,
      },
      { period: "2024–2026", target: "First phase, still voluntary for states.", reached: true },
      {
        period: "2027–2035",
        target: "Mandatory phase for most ICAO member states.",
        reached: false,
      },
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
      mechanism:
        "Fuel-intensity reporting through the IMO Data Collection System with verification by recognised organisations.",
      penalty:
        "Purchase of remedial units for the deficit; flag- and port-state enforcement under MARPOL.",
      unit: "Remedial / surplus unit (tonnes CO2e)",
    },
    timeline: [
      {
        period: "2023",
        target: "Revised IMO GHG strategy sets net-zero around 2050.",
        reached: true,
      },
      { period: "2025", target: "Net-zero framework text approved by MEPC.", reached: true },
      {
        period: "2027–2028",
        target: "Framework expected to apply following formal adoption and entry into force.",
        reached: false,
      },
      {
        period: "2050",
        target: "Net-zero GHG emissions from international shipping.",
        reached: false,
      },
    ],
    sourceName: "IMO — cutting GHG emissions from shipping",
    sourceUrl: "https://www.imo.org/en/OurWork/Environment/Pages/Cutting-GHG-emissions.aspx",
    lastReviewed: "2026-09",
  },
  {
    id: "kr-rfs",
    jurisdiction: "South Korea",
    countrySlug: "south-korea",
    instrument: "Renewable Fuel Standard under the Petroleum and Alternative Fuel Business Act",
    fuels: ["Biodiesel"],
    status: "Phasing in",
    currentObligation:
      "Refiners and importers must blend biodiesel into automotive diesel under a stepped national Renewable Fuel Standard, rising toward 5%.",
    requirements: [
      "Obligation falls on refiners and importers placing automotive diesel on the domestic market.",
      "Blending share is set by presidential decree and steps up every two to three years.",
      "Feedstock and GHG criteria applied through the administering agency's verification rules.",
    ],
    compliance: {
      administrator: "Ministry of Trade, Industry and Energy with the Korea Energy Agency",
      mechanism:
        "Annual reporting of diesel volumes and blended biodiesel to the Korea Energy Agency.",
      penalty:
        "Corrective orders and administrative fines under the Petroleum and Alternative Fuel Business Act.",
      unit: null,
    },
    timeline: [
      {
        period: "2015",
        target: "RFS starts at a 2.5% biodiesel blending obligation.",
        reached: true,
      },
      { period: "2021", target: "Obligation raised to 3.5%.", reached: true },
      { period: "2024", target: "Obligation raised to 4.0%.", reached: true },
      {
        period: "2030",
        target: "Step-up path toward 5% under the announced schedule.",
        reached: false,
      },
    ],
    sourceName: "Ministry of Trade, Industry and Energy (MOTIE)",
    sourceUrl: "https://english.motie.go.kr/",
    officialSites: [
      { label: "Korea Energy Agency", url: "https://www.energy.or.kr/eng/" },
      { label: "Korea Law Information Center", url: "https://www.law.go.kr/LSW/eng/engMain.do" },
    ],
    keywords: [
      "renewable fuel standard",
      "rfs",
      "biodiesel blending",
      "motie",
      "korea energy agency",
    ],
    lastReviewed: "2026-09",
  },
  {
    id: "kr-saf",
    jurisdiction: "South Korea",
    countrySlug: "south-korea",
    instrument: "SAF blending programme for international departures",
    fuels: ["SAF"],
    status: "Adopted — not yet applicable",
    currentObligation:
      "Korea plans a 1% sustainable aviation fuel blend for international flights departing Korean airports from 2027.",
    requirements: [
      "Applies to jet fuel uplifted for international departures.",
      "Domestic co-processed SAF approved for commercial supply ahead of the mandate.",
      "Implementation detail set jointly by the transport and energy ministries.",
    ],
    compliance: {
      administrator: "Ministry of Land, Infrastructure and Transport with MOTIE",
      mechanism: "Supplier and airline reporting of SAF uplift at Korean international airports.",
      penalty: "To be defined in the implementing rules.",
      unit: null,
    },
    timeline: [
      {
        period: "2024",
        target: "SAF expansion strategy announced with a 1% 2027 target.",
        reached: true,
      },
      {
        period: "2026",
        target: "Implementing rules and supply arrangements being prepared.",
        reached: true,
      },
      { period: "2027", target: "1% SAF blend for international departures.", reached: false },
    ],
    sourceName: "Ministry of Land, Infrastructure and Transport",
    sourceUrl: "https://www.molit.go.kr/english/intro.do",
    officialSites: [{ label: "MOTIE", url: "https://english.motie.go.kr/" }],
    keywords: ["saf", "sustainable aviation fuel", "molit", "korean air"],
    lastReviewed: "2026-09",
  },
  {
    id: "my-biodiesel",
    jurisdiction: "Malaysia",
    countrySlug: "malaysia",
    instrument: "National biodiesel blending programme (B10 / B20)",
    fuels: ["Biodiesel"],
    status: "Phasing in",
    currentObligation:
      "B10 palm biodiesel is required for the transport sector and B20 applies in designated states, with a B30 programme under preparation.",
    requirements: [
      "Petroleum companies must blend palm methyl ester into diesel sold for road transport.",
      "B20 rollout applied state by state as storage and blending facilities are upgraded.",
      "B7 applies to the industrial sector.",
    ],
    compliance: {
      administrator: "Ministry of Plantation and Commodities with the Malaysian Palm Oil Board",
      mechanism:
        "Licensed blending facilities report volumes; enforcement through petroleum licensing.",
      penalty:
        "Licence conditions and administrative action under commodity and petroleum regulations.",
      unit: null,
    },
    timeline: [
      { period: "2019", target: "B10 mandate for transport in force nationwide.", reached: true },
      {
        period: "2020–2022",
        target: "B20 rollout completed across the designated states.",
        reached: true,
      },
      {
        period: "2026",
        target: "B30 feasibility and phased implementation under government review.",
        reached: false,
      },
    ],
    sourceName: "Ministry of Plantation and Commodities",
    sourceUrl: "https://www.kpk.gov.my/kpk/en/biofuel-industry",
    officialSites: [
      { label: "Malaysian Palm Oil Board", url: "https://mpob.gov.my/" },
      {
        label: "KPK biofuel one-stop centre",
        url: "https://www.kpk.gov.my/kpk/en/agricommodity/osc-biofuel",
      },
    ],
    keywords: ["b10", "b20", "b30", "palm biodiesel", "mpob", "plantation and commodities"],
    lastReviewed: "2026-09",
  },
  {
    id: "ph-biofuels",
    jurisdiction: "Philippines",
    countrySlug: "philippines",
    instrument: "Biofuels Act of 2006 (Republic Act 9367) blending mandates",
    fuels: ["Multi-fuel"],
    status: "Phasing in",
    currentObligation:
      "All gasoline sold must contain 10% bioethanol and all diesel a coconut methyl ester blend that is stepping up from B3 toward B5.",
    requirements: [
      "Oil companies must blend bioethanol into every litre of gasoline placed on the market.",
      "Diesel must carry the prescribed coconut methyl ester share set by the National Biofuels Board.",
      "Locally produced bioethanol has first call on the mandated volume.",
    ],
    compliance: {
      administrator: "Department of Energy with the National Biofuels Board",
      mechanism:
        "Monthly reporting of blended volumes by oil industry participants to the Department of Energy.",
      penalty: "Fines and suspension of business permits under RA 9367.",
      unit: null,
    },
    timeline: [
      {
        period: "2007",
        target: "B1 biodiesel blend takes effect under the Biofuels Act.",
        reached: true,
      },
      { period: "2009", target: "E10 gasoline and B2 diesel blends take effect.", reached: true },
      { period: "2024", target: "Biodiesel blend raised to B3.", reached: true },
      {
        period: "2026",
        target: "Step-up toward B5 subject to Department of Energy circulars.",
        reached: false,
      },
    ],
    sourceName: "DOE Circular DC2007-05-0006 — rules implementing RA 9367 (Biofuels Act of 2006)",
    sourceUrl: "https://doe.gov.ph/rra-ra-9367-biofuels-act-of-2006",
    officialSites: [
      {
        label: "Republic Act No. 9367 (Department of Energy)",
        url: "https://legacy.doe.gov.ph/laws-and-issuances/republic-act-no-9367",
      },
      {
        label: "DOE Circular DC2011-02-0001 — mandatory use of biofuel blend",
        url: "https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/11/48608",
      },
    ],
    keywords: [
      "biofuels act",
      "coconut methyl ester",
      "cme",
      "e10",
      "b3",
      "b5",
      "department of energy",
    ],
    lastReviewed: "2026-09",
  },
  {
    id: "za-blending",
    jurisdiction: "South Africa",
    countrySlug: "south-africa",
    instrument: "Biofuels regulatory framework under the Petroleum Products Act",
    fuels: ["Multi-fuel"],
    status: "Adopted — not yet applicable",
    currentObligation:
      "Mandatory blending of 5% biodiesel and 2–10% bioethanol is provided for in regulation but has not been switched on pending a pricing and support framework.",
    requirements: [
      "Licensed manufacturers would have to blend at the prescribed rates once implementation is triggered.",
      "A biofuels pricing framework and support mechanism must be published first.",
      "Biofuels Regulatory Framework sets out feedstock and licensing conditions.",
    ],
    compliance: {
      administrator: "Department of Mineral Resources and Energy",
      mechanism: "Petroleum manufacturing and wholesale licences with volume reporting.",
      penalty: "Licence enforcement under the Petroleum Products Act.",
      unit: null,
    },
    timeline: [
      { period: "2012", target: "Mandatory blending regulations gazetted.", reached: true },
      { period: "2020", target: "Biofuels Regulatory Framework published.", reached: true },
      {
        period: "2026",
        target: "Commencement still awaiting the pricing and support framework.",
        reached: false,
      },
    ],
    sourceName:
      "Regulations regarding the mandatory blending of biofuels with petrol and diesel (GN R.671, 23 August 2012)",
    sourceUrl: "https://www.gov.za/sites/default/files/gcis_document/201409/35623rg9808gon671.pdf",
    officialSites: [
      {
        label:
          "South African Biofuels Regulatory Framework and Feedstock Protocol (GN 116 of 2020)",
        url: "https://www.gov.za/documents/notices/south-african-biofuels-regulatory-framework-and-national-biofuels-feedstock",
      },
      { label: "Department of Mineral and Petroleum Resources", url: "https://www.dmre.gov.za/" },
    ],
    keywords: [
      "blending regulations",
      "biofuels regulatory framework",
      "dmre",
      "petroleum products act",
    ],
    lastReviewed: "2026-09",
  },
  {
    id: "ng-e10",
    jurisdiction: "Nigeria",
    countrySlug: "nigeria",
    instrument: "Nigerian Bio-Fuel Policy and Incentives (E10 / B20 targets)",
    fuels: ["Multi-fuel"],
    status: "Adopted — not yet applicable",
    currentObligation:
      "National policy sets an E10 gasoline and B20 diesel blending ambition, delivered so far through project development rather than an enforced blending obligation.",
    requirements: [
      "Domestic feedstock and ethanol plants developed under the NNPC-led programme.",
      "Blending to be introduced as domestic production capacity comes online.",
      "Fiscal incentives available to approved biofuel projects.",
    ],
    compliance: {
      administrator: "Federal Ministry of Petroleum Resources with NNPC Limited",
      mechanism:
        "Project approvals and off-take arrangements; no enforced supplier obligation yet.",
      penalty: "Not applicable until a blending obligation is gazetted.",
      unit: null,
    },
    timeline: [
      {
        period: "2007",
        target: "Nigerian Bio-Fuel Policy and Incentives published in the Official Gazette.",
        reached: true,
      },
      {
        period: "2021–2024",
        target: "Ethanol and biodiesel project development advanced with partners.",
        reached: true,
      },
      {
        period: "2026",
        target: "E10 blending still awaiting domestic supply and an enforcement instrument.",
        reached: false,
      },
    ],
    sourceName: "Federal Ministry of Petroleum Resources",
    sourceUrl: "https://petroleumresources.gov.ng/",
    officialSites: [
      {
        label: "Official Gazette — Nigerian Bio-Fuel Policy and Incentives (2007, PDF)",
        url: "https://moman.org/wp-content/uploads/2024/07/Biofuels-Policy-2007.pdf",
      },
      { label: "NNPC Limited", url: "https://nnpcgroup.com/" },
    ],
    keywords: ["bio-fuel policy", "e10", "b20", "nnpc", "petroleum resources"],
    lastReviewed: "2026-09",
  },
  {
    id: "ke-biofuels",
    jurisdiction: "Kenya",
    countrySlug: "kenya",
    instrument:
      "Energy (Biofuels) Regulations, 2025 (Legal Notice 199 of 2025) under the Energy Act, Cap. 314",
    fuels: ["Multi-fuel"],
    status: "Phasing in",
    currentObligation:
      "Biofuel production, blending and distribution are licensed under the 2025 Biofuels Regulations, which frame a phased rollout of blended fuels nationally.",
    requirements: [
      "Construction permits and licences required for biofuel production facilities under Parts II and III of the Regulations.",
      "Blending, storage and distribution of biofuels carried out only by licensed parties.",
      "Ethanol and biodiesel must meet national fuel-quality standards before release to the market.",
      "Phased rollout sequenced by depot as blending infrastructure is installed.",
    ],
    compliance: {
      administrator:
        "Energy and Petroleum Regulatory Authority (EPRA), Ministry of Energy and Petroleum",
      mechanism: "Licensing, depot-level blending records and EPRA fuel-quality inspections.",
      penalty: "Licence suspension or revocation and penalties under the Energy Act, Cap. 314.",
      unit: null,
    },
    timeline: [
      { period: "2010s", target: "E10 applied in the Kisumu supply region.", reached: true },
      {
        period: "2019",
        target: "Energy Act (No. 1 of 2019) provides the enabling powers for biofuels regulation.",
        reached: true,
      },
      {
        period: "Jun 2025",
        target: "Draft Energy (Biofuels) Regulations published by EPRA for public consultation.",
        reached: true,
      },
      {
        period: "16 Dec 2025",
        target: "Energy (Biofuels) Regulations, 2025 gazetted as Legal Notice 199 of 2025.",
        reached: true,
      },
      {
        period: "2026",
        target: "Phased implementation of licensed blending across the fuel supply chain.",
        reached: false,
      },
    ],
    sourceName: "Energy (Biofuels) Regulations, 2025 — Legal Notice 199 of 2025 (Kenya Law)",
    sourceUrl: "https://new.kenyalaw.org/akn/ke/act/ln/2025/199/eng@2025-12-16",
    officialSites: [
      { label: "Energy and Petroleum Regulatory Authority (EPRA)", url: "https://www.epra.go.ke/" },
      { label: "Ministry of Energy and Petroleum", url: "https://energy.go.ke/" },
    ],
    keywords: [
      "biofuels regulations",
      "legal notice 199",
      "e10",
      "ethanol blending",
      "epra",
      "energy act",
    ],
    lastReviewed: "2026-09",
  },
  {
    id: "ae-saf",
    jurisdiction: "United Arab Emirates",
    countrySlug: "united-arab-emirates",
    instrument: "National Sustainable Aviation Fuel Policy",
    fuels: ["SAF"],
    status: "Phasing in",
    currentObligation:
      "A 1% SAF share of jet fuel uplifted by national carriers applies from 2031 under the national SAF policy, starting with locally produced fuel.",
    requirements: [
      "Applies to fuel uplifted by UAE national carriers at UAE airports.",
      "Emphasis on domestically produced SAF from waste and residue feedstock.",
      "Supported by a national SAF roadmap and certification arrangements.",
    ],
    compliance: {
      administrator:
        "Ministry of Energy and Infrastructure with the General Civil Aviation Authority",
      mechanism: "Reporting of SAF uplift volumes by carriers and fuel suppliers.",
      penalty: "To be set out in implementing regulations.",
      unit: null,
    },
    timeline: [
      {
        period: "Oct 2023",
        target: "Ministry of Energy and Infrastructure publishes the SAF General Policy.",
        reached: true,
      },
      {
        period: "7 Dec 2023",
        target: "General Policy for Sustainable Aviation Fuel formally issued by the Cabinet.",
        reached: true,
      },
      {
        period: "2026",
        target: "Domestic SAF production and supply arrangements being built out.",
        reached: true,
      },
      { period: "2031", target: "1% SAF share for national carriers.", reached: false },
    ],
    sourceName:
      "UAE Sustainable Aviation Fuel General Policy (Ministry of Energy and Infrastructure, October 2023)",
    sourceUrl:
      "https://www.moei.gov.ae/assets/2697351f/UAE's%20Sustainable%20Aviation%20Fuel%20General%20Policy.pdf.aspx",
    officialSites: [
      {
        label: "UAE Legislation — General Policy for Sustainable Aviation Fuel (issued 7 Dec 2023)",
        url: "https://uaelegislation.gov.ae/en/policy/details/lsy-s-laa-m-lokod-ltyr-n-lmstd-m-fy-ldol",
      },
      {
        label: "u.ae — General Policy for Sustainable Aviation Fuel",
        url: "https://u.ae/en/about-the-uae/strategies-initiatives-and-awards/policies/transport-and-infrastructure/general-policy-for-sustainable-aviation-fuel",
      },
      { label: "General Civil Aviation Authority", url: "https://www.gcaa.gov.ae/" },
    ],
    keywords: ["saf", "sustainable aviation fuel", "gcaa", "etihad", "emirates"],
    lastReviewed: "2026-09",
  },
];

/** Official government / administrator websites per tracked jurisdiction. */
export const GOVERNMENT_SITES: Record<string, { label: string; url: string }[]> = {
  "european-union": [
    { label: "European Commission — Energy", url: "https://energy.ec.europa.eu/" },
    { label: "EUR-Lex (Official Journal)", url: "https://eur-lex.europa.eu/" },
  ],
  "united-states": [
    {
      label: "US EPA — Renewable Fuel Standard",
      url: "https://www.epa.gov/renewable-fuel-standard-program",
    },
    { label: "Federal Register", url: "https://www.federalregister.gov/" },
    {
      label: "California Air Resources Board",
      url: "https://ww2.arb.ca.gov/our-work/programs/low-carbon-fuel-standard",
    },
    {
      label: "Oregon DEQ — Clean Fuels Program",
      url: "https://www.oregon.gov/deq/ghgp/cfp/Pages/default.aspx",
    },
    {
      label: "Washington Ecology — Clean Fuel Standard",
      url: "https://ecology.wa.gov/air-climate/reducing-greenhouse-gas-emissions/clean-fuel-standard",
    },
    {
      label: "New Mexico Environment Department",
      url: "https://www.env.nm.gov/air-quality/clean-transportation-fuel-standard/",
    },
    { label: "NYSERDA — New York", url: "https://www.nyserda.ny.gov/" },
  ],
  canada: [
    {
      label: "Environment and Climate Change Canada",
      url: "https://www.canada.ca/en/environment-climate-change.html",
    },
    { label: "Canada Gazette", url: "https://gazette.gc.ca/" },
  ],
  brazil: [
    { label: "ANP — National Petroleum Agency", url: "https://www.gov.br/anp/" },
    { label: "Ministry of Mines and Energy", url: "https://www.gov.br/mme/" },
  ],
  argentina: [
    { label: "Secretaría de Energía", url: "https://www.argentina.gob.ar/economia/energia" },
  ],
  colombia: [{ label: "Ministerio de Minas y Energía", url: "https://www.minenergia.gov.co/" }],
  "united-kingdom": [
    {
      label: "Department for Transport",
      url: "https://www.gov.uk/government/organisations/department-for-transport",
    },
    {
      label: "GOV.UK — RTFO guidance",
      url: "https://www.gov.uk/guidance/renewable-transport-fuels-obligation",
    },
  ],
  germany: [
    { label: "Federal Ministry for the Environment", url: "https://www.bmuv.de/en/" },
    { label: "Hauptzollamt — GHG quota", url: "https://www.zoll.de/" },
  ],
  france: [
    { label: "Ministère de la Transition écologique", url: "https://www.ecologie.gouv.fr/" },
  ],
  netherlands: [
    { label: "Nederlandse Emissieautoriteit (NEa)", url: "https://www.emissionsauthority.nl/" },
  ],
  sweden: [{ label: "Swedish Energy Agency", url: "https://www.energimyndigheten.se/en/" }],
  india: [
    { label: "Ministry of Petroleum and Natural Gas", url: "https://mopng.gov.in/" },
    { label: "NITI Aayog — Ethanol Blending", url: "https://www.niti.gov.in/" },
  ],
  indonesia: [
    { label: "Ministry of Energy and Mineral Resources", url: "https://www.esdm.go.id/" },
  ],
  china: [{ label: "National Development and Reform Commission", url: "https://www.ndrc.gov.cn/" }],
  japan: [
    {
      label: "METI — Agency for Natural Resources and Energy",
      url: "https://www.enecho.meti.go.jp/en/",
    },
  ],
  "south-korea": [
    { label: "MOTIE", url: "https://english.motie.go.kr/" },
    { label: "Korea Energy Agency", url: "https://www.energy.or.kr/eng/" },
  ],
  australia: [
    { label: "Department of Climate Change and Energy", url: "https://www.dcceew.gov.au/" },
  ],
  thailand: [
    { label: "Department of Alternative Energy Development", url: "https://www.dede.go.th/" },
  ],
  malaysia: [
    {
      label: "Ministry of Plantation and Commodities",
      url: "https://www.kpk.gov.my/kpk/index.php/en/",
    },
    { label: "Malaysian Palm Oil Board", url: "https://mpob.gov.my/" },
  ],
  philippines: [{ label: "Department of Energy", url: "https://doe.gov.ph/" }],
  "south-africa": [
    { label: "Department of Mineral and Petroleum Resources", url: "https://www.dmre.gov.za/" },
  ],
  nigeria: [
    { label: "Federal Ministry of Petroleum Resources", url: "https://petroleumresources.gov.ng/" },
  ],
  kenya: [
    { label: "EPRA", url: "https://www.epra.go.ke/" },
    { label: "Ministry of Energy and Petroleum", url: "https://energy.go.ke/" },
  ],
  "united-arab-emirates": [
    { label: "Ministry of Energy and Infrastructure", url: "https://www.moei.gov.ae/en/" },
  ],
  "saudi-arabia": [{ label: "Ministry of Energy", url: "https://www.moenergy.gov.sa/en/" }],
};

/** Every official site linked from a country's tracked obligations, de-duplicated. */
export function governmentSitesForCountry(slug: string): { label: string; url: string }[] {
  const out = new Map<string, string>();
  for (const s of GOVERNMENT_SITES[slug] ?? []) out.set(s.url, s.label);
  for (const m of mandatesForCountry(slug)) {
    out.set(m.sourceUrl, m.sourceName);
    for (const s of m.officialSites ?? []) out.set(s.url, s.label);
  }
  return [...out].map(([url, label]) => ({ url, label }));
}

/** Terms used to attach a live news item to an obligation. */
export function mandateKeywords(m: Mandate): string[] {
  const derived = [m.instrument, ...m.fuels]
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 4);
  return [...new Set([...(m.keywords ?? []), ...derived])];
}

/** True when a headline/summary mentions this obligation. */
export function updateMatchesMandate(m: Mandate, text: string): boolean {
  const t = ` ${text.toLowerCase()} `;
  return mandateKeywords(m).some((k) =>
    k.length <= 4
      ? new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(t)
      : t.includes(k),
  );
}

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

/** Mandates whose jurisdiction is this country slug. */
export function mandatesForCountry(slug: string): Mandate[] {
  return MANDATES.filter((m) => m.countrySlug === slug);
}
