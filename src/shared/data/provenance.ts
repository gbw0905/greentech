/**
 * Shared per-dataset provenance registry.
 *
 * Every entity panel on the site is backed by one entry here. The entry states
 * what the dataset measures, which metrics it exposes, the primary public
 * sources the figures are taken from (with links and reporting years), the
 * coverage rules, and the known limitations.
 *
 * This registry is the single source of truth for citations: chart panels, CSV
 * exports, AI summaries and the /data-sources page all read from it, so a
 * citation never has to be written twice.
 */

export type SourceRef = {
  /** Publishing organisation, e.g. "U.S. Energy Information Administration". */
  org: string;
  /** Document or dataset title. */
  title: string;
  /** Direct link to the source document. */
  url: string;
  /** Publication or reporting year of that document. */
  year: number;
};

export type MetricRef = {
  label: string;
  unit: string;
  /** How the figure is derived, and whether it is reported or estimated. */
  basis: string;
  /** True when the value is a Global Bioenergy Watch estimate rather than a directly reported figure. */
  estimated?: boolean;
};

export type DatasetMeta = {
  /** Stable slug used for anchors on the Data Sources page. */
  id: string;
  /** Must match the ChartPanel title exactly so citations resolve. */
  panel: string;
  /** One line on what the dataset measures. */
  description: string;
  /** Latest financial/calendar year the entity figures refer to. */
  reportingYear: number;
  /** ISO date the dataset was last reviewed against its sources. */
  lastReviewed: string;
  metrics: MetricRef[];
  sources: SourceRef[];
  /** Which entities are in scope and how they are selected. */
  coverage: string;
  /** What the dataset deliberately excludes or cannot capture. */
  limitations: string[];
};

const MARKET_SOURCES: SourceRef[] = [
  {
    org: "Yahoo Finance",
    title: "Delayed market quotes — primary listing of each covered entity",
    url: "https://finance.yahoo.com/",
    year: 2026,
  },
];

export const DATASETS: DatasetMeta[] = [
  {
    id: "fuel-stations",
    panel: "Top global fuel stations selling biofuels",
    description:
      "Retail fuel-station networks that dispense biofuel blends at the forecourt, with site counts and annual biofuel volume sold.",
    reportingYear: 2024,
    lastReviewed: "2026-09-01",
    metrics: [
      {
        label: "Biofuel volume sold",
        unit: "million litres per year",
        basis:
          "Retailer-reported renewable fuel sales where disclosed; otherwise derived from national renewable-fuel obligation registers apportioned by the network's site count and blend level.",
        estimated: true,
      },
      {
        label: "Biofuel-dispensing sites",
        unit: "retail sites",
        basis:
          "Network size published by the retailer, restricted to sites offering at least one biofuel product.",
      },
    ],
    sources: [
      {
        org: "U.S. Environmental Protection Agency",
        title: "Renewable Fuel Standard — RIN generation and renewable fuel volume data (EMTS)",
        url: "https://www.epa.gov/fuels-registration-reporting-and-compliance-help/rin-generation-and-renewable-fuel-volume",
        year: 2025,
      },
      {
        org: "UK Department for Transport",
        title: "Renewable Transport Fuel Obligation (RTFO) statistics",
        url: "https://www.gov.uk/government/collections/renewable-transport-fuels-obligation-rtfo-statistics",
        year: 2025,
      },
      {
        org: "Brazil ANP",
        title: "Sales of fuels by distributor and state (Painel Dinâmico de Vendas)",
        url: "https://www.gov.br/anp/en/access-information/what-is-anp/what-is-anp",
        year: 2025,
      },
      {
        org: "European Commission",
        title: "RED III renewable transport reporting by member state (SHARES)",
        url: "https://energy.ec.europa.eu/topics/renewable-energy/renewable-energy-directive-targets-and-rules_en",
        year: 2025,
      },
    ],
    coverage:
      "Retail networks in every jurisdiction the tracker follows that operate at least one biofuel-dispensing forecourt. Unbranded single-site operators are out of scope.",
    limitations: [
      "Very few retailers publish biofuel litres separately from total fuel sales, so most volumes are apportioned estimates rather than reported figures.",
      "Site counts move continuously as HVO100 and E85 pumps are added; counts reflect the retailer's most recent published network disclosure.",
    ],
  },
  {
    id: "uco-suppliers",
    panel: "Global UCO (used cooking oil) suppliers",
    description:
      "Collectors, renderers and traders that aggregate used cooking oil as feedstock for biodiesel, renewable diesel and SAF.",
    reportingYear: 2024,
    lastReviewed: "2026-09-01",
    metrics: [
      {
        label: "UCO collected",
        unit: "thousand tonnes per year",
        basis:
          "Collection or processing throughput disclosed in the company's annual report, investor presentation or ESG report.",
      },
      {
        label: "Collection footprint",
        unit: "countries served",
        basis: "Operating countries listed by the company on its own site network disclosure.",
      },
    ],
    sources: [
      {
        org: "Darling Ingredients Inc.",
        title: "Form 10-K, fiscal year ended 28 December 2024 (feed and fuel segment volumes)",
        url: "https://ir.darlingii.com/financials/sec-filings/default.aspx",
        year: 2025,
      },
      {
        org: "Greenergy Group Limited",
        title: "Annual Report 2024 — waste-oil feedstock and biodiesel operations",
        url: "https://www.greenergy.com/userfiles/media/greenergy/pdf/2024-greenergy-annual-report.pdf",
        year: 2025,
      },
      {
        org: "ISCC System GmbH",
        title: "ISCC EU / ISCC PLUS certificate database (waste and residue collecting points)",
        url: "https://www.iscc-system.org/certificates/all-certificates/",
        year: 2026,
      },
      {
        org: "USDA Foreign Agricultural Service",
        title: "GAIN reports on used cooking oil supply and trade",
        url: "https://gain.fas.usda.gov/",
        year: 2025,
      },
      {
        org: "UK Department for Transport",
        title: "RTFO feedstock reporting — UCO volumes and countries of origin",
        url: "https://www.gov.uk/government/collections/renewable-transport-fuels-obligation-rtfo-statistics",
        year: 2025,
      },
    ],
    coverage:
      "Collectors and traders handling roughly 20,000 tonnes a year or more, plus national champions in jurisdictions with an Annex IX Part B obligation.",
    limitations: [
      "UCO is traded repeatedly before it reaches a refinery, so collected volumes and exported volumes are not additive across companies.",
      "Chinese and South-East Asian export volumes are visible in customs data but rarely attributable to a named collector.",
    ],
  },
  {
    id: "oil-companies",
    panel: "Top global oil companies",
    description:
      "Integrated oil and refining groups ranked by annual output capacity alongside their live share price and renewable-fuel positions.",
    reportingYear: 2024,
    lastReviewed: "2026-09-01",
    metrics: [
      {
        label: "Annual output capacity",
        unit: "million barrels of oil equivalent per year",
        basis:
          "Upstream production plus refinery throughput as reported in the group's annual report or 20-F / 10-K filing, annualised.",
      },
      {
        label: "Share price and 1-day change",
        unit: "primary listing currency",
        basis: "Delayed exchange quote for the group's primary listing, refreshed live.",
      },
    ],
    sources: [
      {
        org: "U.S. Securities and Exchange Commission",
        title: "EDGAR — 10-K and 20-F annual filings of the covered issuers",
        url: "https://www.sec.gov/edgar/search/",
        year: 2025,
      },
      {
        org: "OPEC",
        title: "Annual Statistical Bulletin",
        url: "https://www.opec.org/publications/annual-statistical-bulletin.html",
        year: 2025,
      },
      {
        org: "International Energy Agency",
        title: "Oil Market Report",
        url: "https://www.iea.org/topics/oil-market-report",
        year: 2026,
      },
      ...MARKET_SOURCES,
    ],
    coverage:
      "The largest listed and state-owned oil and refining groups by output, restricted to those with a disclosed refining or renewable-fuel position.",
    limitations: [
      "National oil companies report on different boundaries (equity vs operated volumes); figures are normalised to operated capacity where disclosed.",
      "Share prices are delayed exchange quotes, not real-time trades, and unlisted state companies have no price.",
    ],
  },
  {
    id: "saf-airlines",
    panel: "Top airlines using SAF globally",
    description:
      "Carriers ranked by annual sustainable aviation fuel uplift and by SAF as a share of their total jet fuel burn.",
    reportingYear: 2024,
    lastReviewed: "2026-09-01",
    metrics: [
      {
        label: "SAF uplift",
        unit: "million litres per year",
        basis:
          "SAF actually uplifted into aircraft as reported in the carrier's sustainability or annual report; offtake agreements that have not yet delivered are excluded.",
      },
      {
        label: "SAF share of fuel burn",
        unit: "% of total jet fuel",
        basis:
          "Reported SAF share where the carrier discloses one; otherwise SAF uplift divided by reported total fuel burn for the same year.",
        estimated: true,
      },
    ],
    sources: [
      {
        org: "United Airlines",
        title: "Corporate Impact Report — Sustainable Aviation Fuel",
        url: "https://corporateimpact.united.com/environmental-sustainability/sustainable-aviation-fuel/",
        year: 2025,
      },
      {
        org: "Lufthansa Group",
        title: "Sustainability Fact Sheet 2024",
        url: "https://investor-relations.lufthansagroup.com/fileadmin/downloads/en/more/LH-Factsheet-Sustainability-2024.pdf",
        year: 2025,
      },
      {
        org: "Air France-KLM",
        title: "Full Year 2024 results and sustainability disclosures",
        url: "https://www.airfranceklm.com/sites/default/files/2025-03/fy-2024-afklm-press-release.pdf",
        year: 2025,
      },
      {
        org: "IATA",
        title: "SAF production and uptake tracker",
        url: "https://www.iata.org/en/programs/sustainability/sustainable-aviation-fuels/",
        year: 2026,
      },
      {
        org: "ICAO",
        title: "CORSIA eligible fuels and SAF reporting framework",
        url: "https://www.icao.int/environmental-protection/CORSIA/Pages/default.aspx",
        year: 2025,
      },
      ...MARKET_SOURCES,
    ],
    coverage:
      "Carriers with a publicly documented SAF uplift, whether driven by a blending mandate, a corporate programme or an offtake agreement.",
    limitations: [
      "Reporting boundaries differ: some groups report SAF for the whole group, others for a single airline within it.",
      "Book-and-claim SAF purchased in one region but burned in another is counted where the carrier books it.",
    ],
  },
  {
    id: "carriers",
    panel: "Carriers using biofuel (shipping, trucking, rail)",
    description:
      "Freight operators across shipping, road and rail ranked by biofuel consumption and by biofuel share of their fuel mix.",
    reportingYear: 2024,
    lastReviewed: "2026-09-01",
    metrics: [
      {
        label: "Biofuel consumed",
        unit: "thousand tonnes or million litres per year, per mode",
        basis:
          "Operator-reported biofuel or green-fuel consumption from sustainability and ESG reports and green-product disclosures (ECO Delivery, Ship Green, ACT+ and equivalents).",
      },
      {
        label: "Biofuel share of fuel mix",
        unit: "% of total fuel",
        basis:
          "Reported biofuel volume divided by the operator's reported total fuel consumption for the same year.",
        estimated: true,
      },
    ],
    sources: [
      {
        org: "International Maritime Organization",
        title: "Data Collection System (DCS) fuel-consumption reporting",
        url: "https://www.imo.org/en/OurWork/Environment/Pages/Data-Collection-System.aspx",
        year: 2025,
      },
      {
        org: "European Commission",
        title: "EU MRV — monitoring, reporting and verification of shipping emissions",
        url: "https://climate.ec.europa.eu/eu-action/transport/reducing-emissions-shipping-sector_en",
        year: 2025,
      },
      {
        org: "Covered operators",
        title: "Annual sustainability and ESG reports, green-freight product disclosures",
        url: "https://www.globalbioenergywatch.org/data-sources",
        year: 2025,
      },
      ...MARKET_SOURCES,
    ],
    coverage:
      "Global container lines, large road-freight fleets and national rail freight operators with a documented biofuel programme.",
    limitations: [
      "Green-freight products are sold on a book-and-claim basis, so an operator's biofuel volume is not tied to specific voyages or lanes.",
      "Road-freight fleets rarely split HVO from fossil diesel in public reporting; those figures are derived from purchase announcements.",
    ],
  },
  {
    id: "blending-terminals",
    panel: "Global blending terminals and capacity",
    description:
      "Storage and blending terminal operators ranked by terminal count and blended-product throughput.",
    reportingYear: 2024,
    lastReviewed: "2026-09-01",
    metrics: [
      {
        label: "Blended-product throughput",
        unit: "million litres per year",
        basis: "Throughput of blended fuel reported by the terminal operator or its parent group.",
      },
      {
        label: "Terminals",
        unit: "count of blending-capable terminals",
        basis:
          "Terminal network published by the operator, filtered to sites with biofuel blending capability.",
      },
    ],
    sources: [
      {
        org: "U.S. Energy Information Administration",
        title: "Refined product terminal and bulk storage capacity reports",
        url: "https://www.eia.gov/petroleum/",
        year: 2025,
      },
      {
        org: "U.S. Environmental Protection Agency",
        title: "RFS registered facilities and RIN separation data",
        url: "https://www.epa.gov/fuels-registration-reporting-and-compliance-help",
        year: 2025,
      },
      {
        org: "Port authorities (Rotterdam, Antwerp-Bruges, Houston, Singapore)",
        title: "Storage and throughput registries",
        url: "https://www.portofrotterdam.com/en/experience-online/facts-and-figures",
        year: 2025,
      },
      ...MARKET_SOURCES,
    ],
    coverage:
      "Independent tank-storage groups and refiner-owned terminal networks that blend biofuels for domestic obligation compliance.",
    limitations: [
      "Terminal operators report capacity in cubic metres of storage, not blended throughput; throughput is derived from utilisation disclosures.",
      "Joint-venture terminals may be counted by more than one parent in their own reporting.",
    ],
  },
  {
    id: "ethanol",
    panel: "Global ethanol production",
    description: "Fuel-ethanol producers ranked by nameplate production capacity and plant count.",
    reportingYear: 2024,
    lastReviewed: "2026-09-01",
    metrics: [
      {
        label: "Nameplate capacity",
        unit: "million litres per year",
        basis:
          "Plant nameplate capacity from the producer's own plant listing, cross-checked against the EIA capacity report and the RFA plant registry.",
      },
      {
        label: "Plants",
        unit: "operating production facilities",
        basis: "Count of producing plants, excluding idled and announced-but-unbuilt facilities.",
      },
    ],
    sources: [
      {
        org: "U.S. Energy Information Administration",
        title: "U.S. Fuel Ethanol Plant Production Capacity (released 26 September 2025)",
        url: "https://www.eia.gov/petroleum/ethanolcapacity/",
        year: 2025,
      },
      {
        org: "Renewable Fuels Association",
        title: "2025 Pocket Guide to Ethanol and the U.S. biorefinery registry",
        url: "https://ethanolrfa.org/file/2913/2025%20Pocket%20Guide.pdf",
        year: 2025,
      },
      {
        org: "U.S. Federal Trade Commission",
        title: "2024 Report on Ethanol Market Concentration",
        url: "https://www.ftc.gov/system/files/ftc_gov/pdf/2024REPORTONETHANOLMARKETCONCENTRATION%28final%29.pdf",
        year: 2024,
      },
      {
        org: "ePURE",
        title: "European renewable ethanol production statistics",
        url: "https://www.epure.org/about-ethanol/statistics/",
        year: 2025,
      },
      {
        org: "UNICA / CONAB",
        title: "Brazilian sugarcane and ethanol production data",
        url: "https://unicadata.com.br/",
        year: 2025,
      },
      ...MARKET_SOURCES,
    ],
    coverage:
      "Producers with at least one operating fuel-ethanol plant, covering the United States, Brazil, the EU, India and China.",
    limitations: [
      "Nameplate capacity is not actual output; US plants typically run above nameplate while Indian and EU plants often run below it.",
      "Capacity changes hands frequently; ownership reflects the latest completed transaction the sources record.",
    ],
  },
  {
    id: "marine-biofuel",
    panel: "Global marine biofuel suppliers and users",
    description:
      "Bunker suppliers and shipping lines ranked by bio-blended marine fuel delivered or consumed.",
    reportingYear: 2024,
    lastReviewed: "2026-09-01",
    metrics: [
      {
        label: "Bio-blended bunker volume",
        unit: "thousand tonnes per year",
        basis:
          "Port-published bio-blend bunker sales apportioned to named suppliers, and carrier-reported green-fuel consumption for shipping lines.",
        estimated: true,
      },
      {
        label: "Blend level",
        unit: "% biofuel in the delivered bunker",
        basis:
          "Typical delivered blend (B24, B30 and equivalents) reported by the supplier or the port authority.",
      },
    ],
    sources: [
      {
        org: "Maritime and Port Authority of Singapore",
        title: "Bunker sales breakdown — alternative bunker fuel sales reached 1.34 Mt in 2024",
        url: "https://data.gov.sg/datasets/d_4f5abbf4486bf8e52bbed3be56dde562/view",
        year: 2025,
      },
      {
        org: "Port of Rotterdam Authority",
        title: "Bunker sales throughput statistics (9.8 Mt total in 2024)",
        url: "https://www.portofrotterdam.com/en/experience-online/facts-and-figures",
        year: 2025,
      },
      {
        org: "ISCC System GmbH",
        title: "ISCC EU certification records for marine bio-blends",
        url: "https://www.iscc-system.org/certificates/all-certificates/",
        year: 2026,
      },
      {
        org: "International Maritime Organization",
        title: "DCS fuel-consumption reporting and EU MRV cross-checks",
        url: "https://www.imo.org/en/OurWork/Environment/Pages/Data-Collection-System.aspx",
        year: 2025,
      },
      ...MARKET_SOURCES,
    ],
    coverage:
      "Physical bunker suppliers at the major bio-blend hubs (Singapore, Rotterdam, Antwerp-Bruges, Fujairah, US Gulf) plus shipping lines with a green-fuel product.",
    limitations: [
      "Port authorities publish hub totals, not supplier-level splits; per-supplier volumes are apportioned from those totals and supplier announcements.",
      "Bio-blend volumes are reported as delivered tonnes of blend, so the pure biofuel content is the blend level times the volume.",
    ],
  },
  {
    id: "bio-power",
    panel: "Global electricity generators using biofuel",
    description:
      "Power generators ranked by biofuel- and biomass-fired generating capacity and annual output.",
    reportingYear: 2024,
    lastReviewed: "2026-09-01",
    metrics: [
      {
        label: "Bioenergy generating capacity",
        unit: "MW",
        basis:
          "Installed bioenergy capacity reported by the generator, restricted to biofuel and biomass-fired units.",
      },
      {
        label: "Annual bioenergy output",
        unit: "GWh per year",
        basis: "Generation from those units as reported by the operator or the national registry.",
      },
    ],
    sources: [
      {
        org: "IRENA",
        title: "Renewable Capacity Statistics — bioenergy",
        url: "https://www.irena.org/Publications/2025/Mar/Renewable-capacity-statistics-2025",
        year: 2025,
      },
      {
        org: "Ember",
        title: "Global Electricity Review — bioenergy generation by country",
        url: "https://ember-energy.org/data/",
        year: 2025,
      },
      {
        org: "IEA Bioenergy",
        title: "Country reports on bioenergy for power and heat",
        url: "https://www.ieabioenergy.com/iea-publications/country-reports/",
        year: 2025,
      },
      {
        org: "Covered generators",
        title: "Annual reports, sustainability filings and national renewables registries",
        url: "https://www.globalbioenergywatch.org/data-sources",
        year: 2025,
      },
      ...MARKET_SOURCES,
    ],
    coverage:
      "Utilities and independent power producers with at least 100 MW of biofuel or biomass-fired generating capacity.",
    limitations: [
      "Co-fired coal-and-biomass units are counted at their biomass share where the operator discloses it, and excluded where it is not disclosed.",
      "Waste-to-energy plants are included only where the biogenic fraction is separately reported.",
    ],
  },
  {
    id: "rng",
    panel: "Global renewable natural gas (RNG) producers",
    description:
      "Biomethane and renewable natural gas producers ranked by annual output and number of production facilities.",
    reportingYear: 2024,
    lastReviewed: "2026-09-01",
    metrics: [
      {
        label: "Annual RNG output",
        unit: "million MMBtu per year",
        basis:
          "Pipeline-quality biomethane produced or contracted, as reported by the operator or the EPA RIN/LCFS pathways.",
      },
      {
        label: "Production facilities",
        unit: "operating plants",
        basis: "Digesters and landfill upgrading plants in commercial operation.",
      },
    ],
    sources: [
      {
        org: "US EPA",
        title: "RFS RIN generation and D3 cellulosic biogas pathways",
        url: "https://www.epa.gov/fuels-registration-reporting-and-compliance-help/rin-generation-and-renewable-fuel-volume",
        year: 2025,
      },
      {
        org: "Coalition for Renewable Natural Gas",
        title: "RNG production facility database",
        url: "https://www.rngcoalition.com/rng-production-facilities",
        year: 2025,
      },
      {
        org: "European Biogas Association",
        title: "Statistical Report — biomethane plants in Europe",
        url: "https://www.europeanbiogas.eu/statistical-report/",
        year: 2025,
      },
      ...MARKET_SOURCES,
    ],
    coverage:
      "Producers with pipeline-injected or liquefied biomethane in commercial operation in North America, Europe and Asia Pacific.",
    limitations: [
      "Plant counts include joint ventures where the operator reports them, so equity shares may differ.",
      "Output for private developers is estimated from announced plant capacity and typical utilisation.",
    ],
  },
  {
    id: "biochar",
    panel: "Global biochar producers",
    description:
      "Pyrolysis operators ranked by annual biochar production capacity and durable CO₂ removal issued.",
    reportingYear: 2024,
    lastReviewed: "2026-09-01",
    metrics: [
      {
        label: "Biochar capacity",
        unit: "tonnes per year",
        basis: "Nameplate pyrolysis capacity disclosed by the producer or its certifier.",
      },
      {
        label: "Durable CO₂ removal",
        unit: "tonnes CO₂e per year",
        basis:
          "Removals issued or claimed under biochar carbon-removal registries, typically ~2 tCO₂e per tonne of biochar.",
      },
    ],
    sources: [
      {
        org: "International Biochar Initiative",
        title: "Global biochar market report",
        url: "https://biochar-international.org/",
        year: 2025,
      },
      {
        org: "European Biochar Certificate",
        title: "Certified producer register",
        url: "https://www.european-biochar.org/en",
        year: 2025,
      },
      {
        org: "Puro.earth / Carbonfuture",
        title: "Biochar CORC issuance registries",
        url: "https://puro.earth/registry",
        year: 2025,
      },
      ...MARKET_SOURCES,
    ],
    coverage:
      "Commercial biochar producers with certified output or registry-issued carbon removals.",
    limitations: [
      "Most producers are private; capacities are nameplate rather than realised output.",
      "Removal figures depend on registry methodology and permanence assumptions, which differ between registries.",
    ],
  },
  {
    id: "wood-pellets",
    panel: "Global wood pellet producers",
    description:
      "Industrial and heating wood pellet producers ranked by nameplate capacity and number of mills.",
    reportingYear: 2024,
    lastReviewed: "2026-09-01",
    metrics: [
      {
        label: "Pellet capacity",
        unit: "thousand tonnes per year",
        basis: "Nameplate pellet production capacity across the producer's mills.",
      },
      {
        label: "Pellet plants",
        unit: "operating mills",
        basis:
          "Mills in commercial operation as reported by the producer or its national association.",
      },
    ],
    sources: [
      {
        org: "FAO",
        title: "FAOSTAT Forestry Production and Trade — wood pellets",
        url: "https://www.fao.org/faostat/en/#data/FO",
        year: 2025,
      },
      {
        org: "Bioenergy Europe",
        title: "Statistical Report — Pellet",
        url: "https://bioenergyeurope.org/statistical-report.html",
        year: 2025,
      },
      {
        org: "Wood Pellet Association of Canada / US Industrial Pellet Association",
        title: "Member plant capacity listings",
        url: "https://www.pellet.org/",
        year: 2025,
      },
      ...MARKET_SOURCES,
    ],
    coverage:
      "Industrial exporters and major heating pellet producers in North America, Europe, Asia Pacific and Latin America.",
    limitations: [
      "Association aggregates are shown as a single entry where individual member capacities are not published.",
      "Capacity is nameplate; actual output varies with fibre supply and export demand.",
    ],
  },
];

/** Dataset entry whose panel title matches, including the three carrier variants. */
export function datasetFor(panel: string): DatasetMeta | undefined {
  const exact = DATASETS.find((d) => d.panel === panel);
  if (exact) return exact;
  if (/carrier/i.test(panel)) return DATASETS.find((d) => d.id === "carriers");
  return undefined;
}

/** Human-readable citation line, e.g. "IRENA — Renewable Capacity Statistics (2025): https://…". */
export function citationLine(s: SourceRef): string {
  return `${s.org} — ${s.title} (${s.year}): ${s.url}`;
}
