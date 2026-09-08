import type { PanelId } from "@/components/SupplyProducersSection";

export interface SupplySeo {
  title: string;
  description: string;
  keywords: string;
}

/**
 * Search-facing titles, descriptions and keywords for each /supply/$panel
 * dataset page. Kept separate from display copy so metadata can target the
 * queries each dataset actually answers.
 */
export const SUPPLY_SEO: Record<PanelId, SupplySeo> = {
  stations: {
    title: "Global Biofuel Station Networks — Ethanol, Biodiesel & Renewable Diesel Retail",
    description:
      "Directory of 100+ retail fuel networks selling ethanol, biodiesel, renewable diesel and renewable gas worldwide, with market caps, share prices and regional coverage.",
    keywords:
      "biofuel stations, ethanol retail networks, biodiesel stations, renewable diesel retail, E85 stations, alternative fuel stations",
  },
  uco: {
    title: "Global UCO Suppliers — Used Cooking Oil Collectors & Traders",
    description:
      "Used cooking oil (UCO) collectors and traders feeding HVO, renewable diesel and SAF refineries — global directory with company details, market data and news.",
    keywords:
      "UCO suppliers, used cooking oil collectors, UCO traders, waste cooking oil supply, HVO feedstock, SAF feedstock",
  },
  ethanol: {
    title: "Global Ethanol Producers — Corn, Cane, Wheat & Cellulosic Production",
    description:
      "Worldwide ethanol production companies by capacity: corn, sugarcane, wheat and cellulosic producers supplying blended gasoline and alcohol-to-jet SAF.",
    keywords:
      "ethanol producers, ethanol production capacity, corn ethanol, sugarcane ethanol, cellulosic ethanol, alcohol-to-jet",
  },
  biopower: {
    title: "Biofuel Power Generators — Biomass, Bagasse & Biogas Electricity",
    description:
      "Electricity generators burning biomass, bagasse, biogas and waste-derived fuels — global capacity, operators and market data.",
    keywords:
      "biomass power plants, biopower generators, bagasse electricity, biogas power, waste-to-energy generators",
  },
  rng: {
    title: "RNG Producers — Renewable Natural Gas from Landfills & Digesters",
    description:
      "Renewable natural gas producers worldwide: landfill gas, dairy digesters, wastewater and food-waste projects, with company and capacity detail.",
    keywords:
      "RNG producers, renewable natural gas companies, biomethane producers, landfill gas, anaerobic digester projects",
  },
  biochar: {
    title: "Global Biochar Producers — Pyrolysis & Carbon Removal",
    description:
      "Biochar producers and pyrolysis operators making durable carbon for soils, industry and carbon-removal credits — global directory and market data.",
    keywords:
      "biochar producers, pyrolysis companies, biochar carbon removal, biochar suppliers, carbon removal credits",
  },
  pellets: {
    title: "Wood Pellet Producers — Industrial & Heating Pellet Mills Worldwide",
    description:
      "Industrial and heating wood pellet mills feeding power stations and district heating — global producer directory with capacity and market data.",
    keywords:
      "wood pellet producers, pellet mills, industrial wood pellets, biomass pellets, district heating fuel",
  },
  terminals: {
    title: "Biofuel Blending Terminals & Capacity — Tank Farms & Loading Racks",
    description:
      "Tank farms and loading racks blending ethanol, biodiesel, HVO and SAF into finished fuel — global terminal directory with capacity and operator detail.",
    keywords:
      "biofuel blending terminals, fuel tank farms, ethanol blending capacity, HVO terminals, SAF blending infrastructure",
  },
  marine: {
    title: "Marine Biofuels — B24/B30 Bunker Suppliers & Biofuel Shipping Lines",
    description:
      "Bunker suppliers of B24/B30 biofuel blends and the shipping lines burning them — ports, suppliers, carriers and market context worldwide.",
    keywords:
      "marine biofuel, biofuel bunker suppliers, B24 B30 bunker, biofuel shipping, sustainable marine fuel",
  },
  oil: {
    title: "Oil Companies in Biofuels — Live Share Prices & Production Capacity",
    description:
      "47 global oil majors and refiners with live share prices, market caps and annual biofuel production capacity — tracked across every major exchange.",
    keywords:
      "oil companies biofuel, refiner share prices, renewable diesel capacity, oil majors SAF, energy company market cap",
  },
  saf: {
    title: "SAF Airlines — Carriers with the Largest Sustainable Aviation Fuel Uplift",
    description:
      "Airlines with the largest sustainable aviation fuel (SAF) uplift worldwide — offtake agreements, blend targets, market caps and share prices.",
    keywords:
      "SAF airlines, sustainable aviation fuel offtake, airline SAF agreements, aviation biofuel carriers",
  },
  carriers: {
    title: "Biofuel Freight Carriers — Shipping, Trucking & Rail on Biofuel Blends",
    description:
      "Shipping, trucking and rail operators running on biodiesel, renewable diesel and biofuel blends — global directory with fleet and market detail.",
    keywords:
      "biofuel trucking, renewable diesel fleets, biodiesel shipping lines, rail biofuel, freight decarbonisation",
  },
  hydrogen: {
    title: "Renewable Hydrogen Producers — Global Green Hydrogen & Electrolyser Projects",
    description:
      "Global directory of renewable hydrogen producers: electrolytic green hydrogen output, electrolyser capacity, production routes, market caps and live share prices.",
    keywords:
      "renewable hydrogen producers, green hydrogen companies, electrolyser capacity, green ammonia projects, hydrogen production capacity",
  },
  rlpg: {
    title: "Renewable LPG Suppliers — BioLPG & rDME Producers and Distributors",
    description:
      "Renewable LPG worldwide: bioLPG produced alongside HVO and SAF, rDME plants, and the distributors delivering renewable propane to heating, cooking and autogas.",
    keywords:
      "renewable LPG, bioLPG producers, rDME, renewable propane, biopropane suppliers, renewable autogas",
  },
  methanol: {
    title: "Bio-Methanol Producers — Green & E-Methanol Plants Worldwide",
    description:
      "Bio-methanol and e-methanol producers by capacity: biomass and waste gasification, black liquor and green-hydrogen routes supplying shipping fuel and chemicals.",
    keywords:
      "bio-methanol producers, green methanol, e-methanol plants, renewable methanol capacity, methanol marine fuel",
  },
};

