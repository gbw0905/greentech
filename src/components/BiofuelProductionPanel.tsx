import { useState } from "react";
import { ChartMap } from "@/components/ChartMap";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { Fuel } from "lucide-react";
import {
  ChartBars,
  ChartHeat,
  ChartPanel,
  ChartScatter,
  ChartTable,
  ChartTrend,
  PANEL_VIEWS,
  chartFmt as fmt,
  type PanelView,
  type ScatterPoint, PanelActions, summaryOf, } from "@/components/chart-kit";
import { ghgSavingsMt, GHG_NOTE } from "@/lib/ghg-savings";
import { GhgEmptyNotice } from "@/components/GhgEmptyNotice";
import { detailTone, useEntityDetail, type GraphContext } from "@/components/EntityDetailSheet";
import { ChartFilterBar, countryFilterOptions, useChartFilter } from "@/components/chart-filters";
import { entityLogoByName } from "@/lib/entity-logos";
import type { FuelType } from "@/lib/policy-taxonomy";
import { STATION_TICKERS } from "@/lib/entity-tickers";
import { priceMeta, priceTone, useEntityQuotes } from "@/lib/use-entity-quotes";
import { marketCapValue, marketCapLabel, MARKET_CAP_NOTE } from "@/lib/market-caps";

type Station = {
  name: string;
  country: string;
  flag: string;
  /** approx. number of retail sites offering biofuel blends */
  sites: number;
  /** approx. biofuel volume sold per year, million litres */
  volumeMnL: number;
  /** biofuel products offered at the forecourt */
  fuels: FuelType[];
  note: string;
  color: string;
};

/**
 * Global directory of retail fuel-station networks that sell biofuel blends at
 * the pump. Coverage spans every jurisdiction the tracker follows that has at
 * least one biofuel-dispensing retail network, so selecting a country in the
 * filter reveals that country's stations.
 */
const STATIONS: Station[] = [
  // ---------- South America ----------
  { name: "Petrobras BR", country: "Brazil", flag: "🇧🇷", volumeMnL: 9800, sites: 7800, fuels: ["Ethanol", "Biodiesel"], note: "E100 hydrous ethanol at nearly every site", color: "var(--primary)" },
  { name: "Ipiranga", country: "Brazil", flag: "🇧🇷", volumeMnL: 7200, sites: 6000, fuels: ["Ethanol", "Biodiesel"], note: "E27 blend + hydrous ethanol", color: "var(--accent)" },
  { name: "Raízen / Shell Brazil", country: "Brazil", flag: "🇧🇷", volumeMnL: 7000, sites: 5800, fuels: ["Ethanol", "Biodiesel"], note: "Sugarcane ethanol retail arm", color: "var(--signal)" },
  { name: "Vibra Energia", country: "Brazil", flag: "🇧🇷", volumeMnL: 3400, sites: 2900, fuels: ["Ethanol", "Biodiesel"], note: "Independent BR-branded forecourts", color: "var(--primary-glow)" },
  { name: "ALE Combustíveis", country: "Brazil", flag: "🇧🇷", volumeMnL: 900, sites: 1500, fuels: ["Ethanol"], note: "Regional ethanol retailer", color: "var(--muted-foreground)" },
  { name: "YPF", country: "Argentina", flag: "🇦🇷", volumeMnL: 1200, sites: 1600, fuels: ["Ethanol", "Biodiesel"], note: "E12 / B10 mandated blends", color: "var(--muted-foreground)" },
  { name: "Axion Energy", country: "Argentina", flag: "🇦🇷", volumeMnL: 380, sites: 620, fuels: ["Ethanol", "Biodiesel"], note: "Mandated bioethanol cut nationwide", color: "var(--primary)" },
  { name: "Terpel", country: "Colombia", flag: "🇨🇴", volumeMnL: 620, sites: 2100, fuels: ["Ethanol", "Biodiesel"], note: "E10 / B10 across the network", color: "var(--accent)" },
  { name: "Primax", country: "Peru", flag: "🇵🇪", volumeMnL: 280, sites: 700, fuels: ["Ethanol", "Biodiesel"], note: "E7.8 / B5 blends", color: "var(--signal)" },
  { name: "Copec", country: "Chile", flag: "🇨🇱", volumeMnL: 210, sites: 650, fuels: ["Renewable Diesel", "Ethanol"], note: "HVO pilots + imported ethanol blends", color: "var(--primary-glow)" },
  { name: "Petrobras Uruguay / ANCAP", country: "Uruguay", flag: "🇺🇾", volumeMnL: 190, sites: 320, fuels: ["Ethanol", "Biodiesel"], note: "E10 / B5 state blending", color: "var(--muted-foreground)" },
  { name: "Petropar", country: "Paraguay", flag: "🇵🇾", volumeMnL: 240, sites: 300, fuels: ["Ethanol"], note: "E25 sugarcane ethanol", color: "var(--primary)" },
  { name: "PDV / Petroecuador", country: "Ecuador", flag: "🇪🇨", volumeMnL: 130, sites: 420, fuels: ["Ethanol"], note: "Ecopaís E5 programme", color: "var(--accent)" },

  // ---------- North America ----------
  { name: "Casey's", country: "United States", flag: "🇺🇸", volumeMnL: 1400, sites: 2600, fuels: ["Ethanol"], note: "E15 / E85 flex pumps", color: "var(--accent)" },
  { name: "Sheetz", country: "United States", flag: "🇺🇸", volumeMnL: 900, sites: 1800, fuels: ["Ethanol"], note: "Unleaded 88 (E15) chainwide", color: "var(--signal)" },
  { name: "Kwik Trip", country: "United States", flag: "🇺🇸", volumeMnL: 800, sites: 1500, fuels: ["Ethanol", "Biogas"], note: "E85 plus renewable natural gas", color: "var(--primary-glow)" },
  { name: "Shell US", country: "United States", flag: "🇺🇸", volumeMnL: 700, sites: 650, fuels: ["Renewable Diesel", "Biogas"], note: "R99 renewable diesel + RNG sites", color: "var(--muted-foreground)" },
  { name: "Clean Energy Fuels", country: "United States", flag: "🇺🇸", volumeMnL: 520, sites: 550, fuels: ["Biogas"], note: "Renewable natural gas stations", color: "var(--signal)" },
  { name: "Pilot Flying J", country: "United States", flag: "🇺🇸", volumeMnL: 1100, sites: 750, fuels: ["Renewable Diesel", "Biodiesel"], note: "B20 / R99 truck-stop lanes", color: "var(--primary)" },
  { name: "Love's Travel Stops", country: "United States", flag: "🇺🇸", volumeMnL: 950, sites: 640, fuels: ["Biodiesel", "Biogas"], note: "B20 lanes + RNG for fleets", color: "var(--accent)" },
  { name: "Propel Fuels", country: "United States", flag: "🇺🇸", volumeMnL: 240, sites: 60, fuels: ["Renewable Diesel", "Ethanol"], note: "California low-carbon fuel retailer", color: "var(--primary-glow)" },
  { name: "Parkland / On the Run", country: "Canada", flag: "🇨🇦", volumeMnL: 610, sites: 1800, fuels: ["Ethanol", "Renewable Diesel"], note: "Clean Fuel Regulations blends", color: "var(--muted-foreground)" },
  { name: "Petro-Canada", country: "Canada", flag: "🇨🇦", volumeMnL: 540, sites: 1500, fuels: ["Ethanol", "Biodiesel"], note: "E10 nationwide, B5 in the west", color: "var(--primary)" },
  { name: "Federated Co-op", country: "Canada", flag: "🇨🇦", volumeMnL: 300, sites: 900, fuels: ["Ethanol", "Renewable Diesel"], note: "Prairie renewable diesel supply", color: "var(--accent)" },
  { name: "Pemex", country: "Mexico", flag: "🇲🇽", volumeMnL: 160, sites: 1200, fuels: ["Biodiesel"], note: "Limited B5 pilots in the north", color: "var(--signal)" },

  // ---------- Europe ----------
  { name: "Preem", country: "Sweden", flag: "🇸🇪", volumeMnL: 1100, sites: 950, fuels: ["Renewable Diesel", "Ethanol"], note: "HVO100 widely available", color: "var(--muted-foreground)" },
  { name: "OKQ8", country: "Sweden", flag: "🇸🇪", volumeMnL: 780, sites: 750, fuels: ["Renewable Diesel", "Ethanol", "Biogas"], note: "HVO100, E85 and biogas pumps", color: "var(--primary)" },
  { name: "St1 Sweden", country: "Sweden", flag: "🇸🇪", volumeMnL: 620, sites: 500, fuels: ["Ethanol", "Renewable Diesel"], note: "RE85 flex-fuel network", color: "var(--accent)" },
  { name: "Neste retail", country: "Finland", flag: "🇫🇮", volumeMnL: 950, sites: 900, fuels: ["Renewable Diesel"], note: "MY renewable diesel network", color: "var(--primary)" },
  { name: "ABC (S-ryhmä)", country: "Finland", flag: "🇫🇮", volumeMnL: 430, sites: 430, fuels: ["Renewable Diesel", "Biogas"], note: "HVO + biogas at travel centres", color: "var(--signal)" },
  { name: "Circle K Europe", country: "Norway", flag: "🇳🇴", volumeMnL: 620, sites: 800, fuels: ["Renewable Diesel", "Ethanol"], note: "HVO100 + E85 in Nordics", color: "var(--signal)" },
  { name: "Uno-X", country: "Norway", flag: "🇳🇴", volumeMnL: 260, sites: 460, fuels: ["Renewable Diesel"], note: "Unmanned HVO100 forecourts", color: "var(--primary-glow)" },
  { name: "OK Denmark", country: "Denmark", flag: "🇩🇰", volumeMnL: 240, sites: 650, fuels: ["Renewable Diesel", "Biogas"], note: "HVO and biomethane lanes", color: "var(--muted-foreground)" },
  { name: "TotalEnergies", country: "France", flag: "🇫🇷", volumeMnL: 700, sites: 850, fuels: ["Renewable Diesel", "Biodiesel"], note: "B100 and HVO truck lanes", color: "var(--accent)" },
  { name: "Avia France", country: "France", flag: "🇫🇷", volumeMnL: 420, sites: 700, fuels: ["Biodiesel", "Ethanol"], note: "B100 Oleo100 + E85 pumps", color: "var(--primary)" },
  { name: "Intermarché stations", country: "France", flag: "🇫🇷", volumeMnL: 560, sites: 1500, fuels: ["Ethanol"], note: "Superéthanol E85 supermarket network", color: "var(--signal)" },
  { name: "OMV", country: "Austria", flag: "🇦🇹", volumeMnL: 540, sites: 700, fuels: ["Renewable Diesel", "Biodiesel"], note: "HVO diesel across CEE", color: "var(--primary-glow)" },
  { name: "Repsol", country: "Spain", flag: "🇪🇸", volumeMnL: 480, sites: 600, fuels: ["Renewable Diesel"], note: "100% renewable diesel rollout", color: "var(--primary)" },
  { name: "Cepsa / Moeve", country: "Spain", flag: "🇪🇸", volumeMnL: 320, sites: 480, fuels: ["Renewable Diesel", "Biogas"], note: "HVO100 + bio-LNG corridors", color: "var(--accent)" },
  { name: "Certas / Shell UK", country: "United Kingdom", flag: "🇬🇧", volumeMnL: 300, sites: 450, fuels: ["Renewable Diesel"], note: "Shell Renewable Diesel fleet sites", color: "var(--accent)" },
  { name: "Greenergy / Esso UK", country: "United Kingdom", flag: "🇬🇧", volumeMnL: 520, sites: 900, fuels: ["Biodiesel", "Ethanol"], note: "E10 petrol + B7 diesel supply", color: "var(--signal)" },
  { name: "Aral", country: "Germany", flag: "🇩🇪", volumeMnL: 640, sites: 2400, fuels: ["Biodiesel", "Ethanol"], note: "E10 nationwide, HVO100 rollout", color: "var(--primary)" },
  { name: "Shell Germany", country: "Germany", flag: "🇩🇪", volumeMnL: 580, sites: 1900, fuels: ["Renewable Diesel", "Ethanol"], note: "Shell HVO100 at motorway sites", color: "var(--muted-foreground)" },
  { name: "Bft (independent)", country: "Germany", flag: "🇩🇪", volumeMnL: 350, sites: 2600, fuels: ["Biodiesel", "Biogas"], note: "B100 fleet pumps + bio-CNG", color: "var(--accent)" },
  { name: "Shell Netherlands", country: "Netherlands", flag: "🇳🇱", volumeMnL: 300, sites: 800, fuels: ["Renewable Diesel", "Biogas"], note: "GTL/HVO and bio-LNG for trucks", color: "var(--signal)" },
  { name: "OrangeGas", country: "Netherlands", flag: "🇳🇱", volumeMnL: 120, sites: 200, fuels: ["Biogas"], note: "Green gas / bio-CNG stations", color: "var(--primary-glow)" },
  { name: "Q8 Belgium", country: "Belgium", flag: "🇧🇪", volumeMnL: 180, sites: 500, fuels: ["Biodiesel", "Ethanol"], note: "B7 / E10 mandated blends", color: "var(--muted-foreground)" },
  { name: "Eni Live", country: "Italy", flag: "🇮🇹", volumeMnL: 620, sites: 4000, fuels: ["Renewable Diesel", "Biogas"], note: "HVOlution renewable diesel network", color: "var(--primary)" },
  { name: "Q8 Italy", country: "Italy", flag: "🇮🇹", volumeMnL: 210, sites: 2500, fuels: ["Biodiesel", "Biogas"], note: "B7 plus biomethane sites", color: "var(--accent)" },
  { name: "Orlen", country: "Poland", flag: "🇵🇱", volumeMnL: 420, sites: 1900, fuels: ["Ethanol", "Biodiesel"], note: "E10 rollout and B7 diesel", color: "var(--signal)" },
  { name: "MOL", country: "Hungary", flag: "🇭🇺", volumeMnL: 230, sites: 1000, fuels: ["Ethanol", "Biodiesel"], note: "E10 + B7 across CEE forecourts", color: "var(--primary-glow)" },
  { name: "Orlen Unipetrol", country: "Czechia", flag: "🇨🇿", volumeMnL: 160, sites: 420, fuels: ["Ethanol", "Biodiesel"], note: "E10 petrol, B7 diesel", color: "var(--muted-foreground)" },
  { name: "Circle K Ireland", country: "Ireland", flag: "🇮🇪", volumeMnL: 130, sites: 420, fuels: ["Ethanol", "Renewable Diesel"], note: "E10 and HVO for fleets", color: "var(--primary)" },
  { name: "Galp", country: "Portugal", flag: "🇵🇹", volumeMnL: 170, sites: 700, fuels: ["Renewable Diesel", "Biodiesel"], note: "HVO blends at motorway sites", color: "var(--accent)" },
  { name: "Coop Pronto / Agrola", country: "Switzerland", flag: "🇨🇭", volumeMnL: 90, sites: 300, fuels: ["Biogas", "Renewable Diesel"], note: "Biogas and HVO pumps", color: "var(--signal)" },
  { name: "Neste Baltics", country: "Estonia", flag: "🇪🇪", volumeMnL: 110, sites: 260, fuels: ["Renewable Diesel", "Ethanol"], note: "HVO + E10 in the Baltics", color: "var(--primary-glow)" },
  { name: "Circle K Lithuania", country: "Lithuania", flag: "🇱🇹", volumeMnL: 80, sites: 200, fuels: ["Ethanol", "Biodiesel"], note: "Mandated bio-component blends", color: "var(--muted-foreground)" },
  { name: "OKKO", country: "Ukraine", flag: "🇺🇦", volumeMnL: 150, sites: 400, fuels: ["Ethanol"], note: "E5-E7 bioethanol blends", color: "var(--primary)" },
  { name: "Petrol Ofisi", country: "Turkey", flag: "🇹🇷", volumeMnL: 190, sites: 1800, fuels: ["Ethanol", "Biodiesel"], note: "Mandatory ethanol and biodiesel cut", color: "var(--accent)" },

  // ---------- Asia-Pacific ----------
  { name: "Indian Oil", country: "India", flag: "🇮🇳", volumeMnL: 5200, sites: 5400, fuels: ["Ethanol", "Biodiesel"], note: "E20 rollout across retail outlets", color: "var(--primary-glow)" },
  { name: "Bharat Petroleum", country: "India", flag: "🇮🇳", volumeMnL: 3100, sites: 3300, fuels: ["Ethanol"], note: "E20 petrol network", color: "var(--primary-glow)" },
  { name: "Hindustan Petroleum", country: "India", flag: "🇮🇳", volumeMnL: 2800, sites: 3000, fuels: ["Ethanol", "Biodiesel"], note: "E20 petrol and B7 pilots", color: "var(--signal)" },
  { name: "Nayara Energy", country: "India", flag: "🇮🇳", volumeMnL: 900, sites: 1400, fuels: ["Ethanol"], note: "Private E20 retail chain", color: "var(--accent)" },
  { name: "Sinopec", country: "China", flag: "🇨🇳", volumeMnL: 2600, sites: 3200, fuels: ["Ethanol", "Biodiesel"], note: "E10 provinces + B5 pilots", color: "var(--muted-foreground)" },
  { name: "PetroChina", country: "China", flag: "🇨🇳", volumeMnL: 2100, sites: 2800, fuels: ["Ethanol"], note: "E10 mandate provinces", color: "var(--primary)" },
  { name: "Pertamina", country: "Indonesia", flag: "🇮🇩", volumeMnL: 6400, sites: 3000, fuels: ["Biodiesel"], note: "B35 mandate at all forecourts", color: "var(--primary)" },
  { name: "Vivo Energy Indonesia", country: "Indonesia", flag: "🇮🇩", volumeMnL: 320, sites: 200, fuels: ["Biodiesel"], note: "B35 compliant retail", color: "var(--accent)" },
  { name: "PTT Station", country: "Thailand", flag: "🇹🇭", volumeMnL: 2400, sites: 2100, fuels: ["Ethanol", "Biodiesel"], note: "Gasohol E20/E85 and B7-B20", color: "var(--signal)" },
  { name: "Bangchak", country: "Thailand", flag: "🇹🇭", volumeMnL: 1200, sites: 1300, fuels: ["Ethanol", "Biodiesel"], note: "Gasohol + palm biodiesel blends", color: "var(--primary-glow)" },
  { name: "Petronas", country: "Malaysia", flag: "🇲🇾", volumeMnL: 1100, sites: 1100, fuels: ["Biodiesel"], note: "B10 / B20 palm biodiesel", color: "var(--muted-foreground)" },
  { name: "Petron Malaysia", country: "Malaysia", flag: "🇲🇾", volumeMnL: 480, sites: 720, fuels: ["Biodiesel"], note: "B10 across retail sites", color: "var(--primary)" },
  { name: "Petron Philippines", country: "Philippines", flag: "🇵🇭", volumeMnL: 620, sites: 2400, fuels: ["Ethanol", "Biodiesel"], note: "E10 and B3 mandated blends", color: "var(--accent)" },
  { name: "Shell Philippines", country: "Philippines", flag: "🇵🇭", volumeMnL: 380, sites: 1100, fuels: ["Ethanol", "Biodiesel"], note: "E10 / B3 compliant network", color: "var(--signal)" },
  { name: "Petrolimex", country: "Vietnam", flag: "🇻🇳", volumeMnL: 540, sites: 2700, fuels: ["Ethanol"], note: "E5 RON92 nationwide", color: "var(--primary-glow)" },
  { name: "Eneos", country: "Japan", flag: "🇯🇵", volumeMnL: 420, sites: 12000, fuels: ["Ethanol", "Renewable Diesel"], note: "ETBE-blended petrol, HVO trials", color: "var(--muted-foreground)" },
  { name: "Idemitsu", country: "Japan", flag: "🇯🇵", volumeMnL: 260, sites: 6000, fuels: ["Ethanol"], note: "Bio-ETBE gasoline supply", color: "var(--primary)" },
  { name: "SK Energy", country: "South Korea", flag: "🇰🇷", volumeMnL: 480, sites: 2900, fuels: ["Biodiesel"], note: "BD4 mandated diesel blend", color: "var(--accent)" },
  { name: "GS Caltex", country: "South Korea", flag: "🇰🇷", volumeMnL: 400, sites: 2300, fuels: ["Biodiesel"], note: "Mandated biodiesel content", color: "var(--signal)" },
  { name: "Ampol", country: "Australia", flag: "🇦🇺", volumeMnL: 220, sites: 1900, fuels: ["Ethanol", "Biodiesel"], note: "E10 across eastern states", color: "var(--primary-glow)" },
  { name: "United Petroleum", country: "Australia", flag: "🇦🇺", volumeMnL: 180, sites: 480, fuels: ["Ethanol"], note: "E85 and E10 flex network", color: "var(--muted-foreground)" },
  { name: "Z Energy", country: "New Zealand", flag: "🇳🇿", volumeMnL: 90, sites: 330, fuels: ["Biodiesel", "Renewable Diesel"], note: "B5 and HVO for fleets", color: "var(--primary)" },

  // ---------- Africa & Middle East ----------
  { name: "Engen", country: "South Africa", flag: "🇿🇦", volumeMnL: 210, sites: 1300, fuels: ["Ethanol", "Biodiesel"], note: "Voluntary bio-blends at forecourts", color: "var(--accent)" },
  { name: "Sasol", country: "South Africa", flag: "🇿🇦", volumeMnL: 150, sites: 400, fuels: ["Biodiesel"], note: "Biodiesel blending pilots", color: "var(--signal)" },
  { name: "Vivo Energy Kenya (Shell)", country: "Kenya", flag: "🇰🇪", volumeMnL: 60, sites: 380, fuels: ["Ethanol"], note: "E10 pilot in coastal counties", color: "var(--primary-glow)" },
  { name: "NNPC Retail", country: "Nigeria", flag: "🇳🇬", volumeMnL: 90, sites: 1500, fuels: ["Ethanol"], note: "E10 programme rollout", color: "var(--muted-foreground)" },
  { name: "Petromoc", country: "Mozambique", flag: "🇲🇿", volumeMnL: 40, sites: 180, fuels: ["Ethanol"], note: "E10 from local sugarcane", color: "var(--primary)" },
  { name: "Zuva Petroleum", country: "Zimbabwe", flag: "🇿🇼", volumeMnL: 70, sites: 130, fuels: ["Ethanol"], note: "E20 mandated blend", color: "var(--accent)" },
  { name: "ADNOC Distribution", country: "United Arab Emirates", flag: "🇦🇪", volumeMnL: 45, sites: 500, fuels: ["Biodiesel"], note: "B5 fleet lanes in Dubai", color: "var(--signal)" },
  // ---------- Added global coverage ----------
  { name: "Sasol Retail", country: "South Africa", flag: "🇿🇦", volumeMnL: 160, sites: 400, fuels: ["Biodiesel", "Ethanol"], note: "Synthetic and bio-blended fuels at Sasol sites", color: "var(--accent)" },
  { name: "TotalEnergies Marketing Africa", country: "Nigeria", flag: "🇳🇬", volumeMnL: 120, sites: 550, fuels: ["Ethanol"], note: "E10 pilot lanes under Nigeria's ethanol policy", color: "var(--signal)" },
  { name: "Vivo Energy (Shell licensee)", country: "Kenya", flag: "🇰🇪", volumeMnL: 95, sites: 340, fuels: ["Ethanol", "Biodiesel"], note: "Pan-African retailer piloting blended gasoline and B5", color: "var(--primary)" },
  { name: "OiLibya / Ola Energy", country: "Morocco", flag: "🇲🇦", volumeMnL: 60, sites: 260, fuels: ["Biodiesel"], note: "North African network trialling waste-oil biodiesel blends", color: "var(--accent)" },
  { name: "Puma Energy Africa", country: "Ghana", flag: "🇬🇭", volumeMnL: 55, sites: 190, fuels: ["Ethanol"], note: "Blended gasoline supply in West African markets", color: "var(--signal)" },
  { name: "Pertamina Retail", country: "Indonesia", flag: "🇮🇩", volumeMnL: 9500, sites: 7500, fuels: ["Biodiesel"], note: "B35 mandatory biodiesel across the national network", color: "var(--signal)" },
  { name: "Petronas Dagangan", country: "Malaysia", flag: "🇲🇾", volumeMnL: 1800, sites: 1100, fuels: ["Biodiesel"], note: "B10/B20 palm biodiesel at retail and fleet sites", color: "var(--primary)" },
  { name: "Shell Malaysia", country: "Malaysia", flag: "🇲🇾", volumeMnL: 900, sites: 950, fuels: ["Biodiesel"], note: "B10 diesel under national blending mandate", color: "var(--accent)" },
  { name: "Phoenix Petroleum", country: "Philippines", flag: "🇵🇭", volumeMnL: 320, sites: 700, fuels: ["Ethanol", "Biodiesel"], note: "Coconut methyl ester blends at retail sites", color: "var(--primary)" },
  { name: "Indian Oil Corporation", country: "India", flag: "🇮🇳", volumeMnL: 12500, sites: 39000, fuels: ["Ethanol", "Biodiesel"], note: "E20 rollout across the largest retail network in Asia", color: "var(--accent)" },
  { name: "MOL Group", country: "Hungary", flag: "🇭🇺", volumeMnL: 780, sites: 2400, fuels: ["Ethanol", "Biodiesel"], note: "E10 and B7 across Central and South-East Europe", color: "var(--signal)" },
  { name: "OMV / Petrom", country: "Romania", flag: "🇷🇴", volumeMnL: 690, sites: 1800, fuels: ["Ethanol", "Biodiesel"], note: "Regional blending plus co-processed renewable diesel", color: "var(--primary)" },
  { name: "St1 / Shell Nordics", country: "Finland", flag: "🇫🇮", volumeMnL: 700, sites: 1300, fuels: ["Renewable Diesel", "Ethanol"], note: "RE85 and HVO from own waste-based refineries", color: "var(--signal)" },
  { name: "Viva Energy", country: "Australia", flag: "🇦🇺", volumeMnL: 190, sites: 1300, fuels: ["Ethanol", "Renewable Diesel"], note: "E10 retail plus renewable diesel trials at Geelong", color: "var(--signal)" },
];



type StationMetric = "sites" | "volume" | "perSite" | "price" | "marketcap" | "ghg";

const STATION_METRICS: Record<
  StationMetric,
  { label: string; unit: string; help: string; decimals: number; value: (s: Station) => number }
> = {
  sites: {
    label: "Retail sites offering biofuels",
    unit: "retail sites offering biofuels",
    help: "Number of forecourts in the network that sell at least one biofuel blend (ethanol, biodiesel, renewable diesel or renewable gas). Bigger tiles mean wider pump coverage.",
    decimals: 0,
    value: (s) => s.sites,
  },
  volume: {
    label: "Biofuel volume sold (Ml/yr)",
    unit: "million litres of biofuel sold / year",
    help: "Estimated biofuel volume sold across the whole network each year, in million litres. This measures total throughput, not how many stations there are.",
    decimals: 0,
    value: (s) => s.volumeMnL,
  },
  perSite: {
    label: "Volume per site (litres x1000/yr)",
    unit: "thousand litres of biofuel sold per site / year",
    help: "Average biofuel sold per station per year (thousand litres) — volume divided by sites. It shows how intensively each forecourt sells biofuel, regardless of network size.",
    decimals: 1,
    value: (s) => (s.volumeMnL * 1000) / Math.max(s.sites, 1),
  },
  price: {
    label: "Share price (listing currency)",
    unit: "share price, primary listing currency",
    help: "Latest traded share price of the parent company on its primary listing, in that exchange's currency. State-owned or private networks have no listing and sit at the end.",
    decimals: 2,
    value: () => 0,
  },
  marketcap: {
    label: "Market cap (approx.)",
    unit: "approximate market capitalisation, USD billions",
    help: "Approximate latest market capitalisation in USD billions, converted at recent exchange rates. Private, state-owned or unlisted entities rank last.",
    decimals: 1,
    value: (s) => marketCapValue(STATION_TICKERS[s.name]),
  },

  ghg: {
    label: "GHG savings (reported)",
    unit: "million tonnes CO₂e avoided per year",
    help: GHG_NOTE,
    decimals: 1,
    value: (s) => ghgSavingsMt(s.name),
  },
};

function perSiteValue(s: Station) {
  return (s.volumeMnL * 1000) / Math.max(s.sites, 1);
}

/** Defines the scatter-plot axes for each selected metric so X and Y never collide. */
function scatterAxes(metricKey: StationMetric) {
  if (metricKey === "sites") {
    return {
      x: { metric: STATION_METRICS.volume, help: "X-axis shows total volume sold; Y-axis shows number of sites." },
      y: STATION_METRICS.sites,
      size: { label: "Volume per site", unit: "litres x1000/yr", value: perSiteValue },
    };
  }
  if (metricKey === "volume") {
    return {
      x: { metric: STATION_METRICS.perSite, help: "X-axis shows throughput per site; Y-axis shows total volume sold." },
      y: STATION_METRICS.volume,
      size: { label: "Retail sites", unit: "sites", value: (s: Station) => s.sites },
    };
  }
  if (metricKey === "perSite") {
    return {
      x: { metric: STATION_METRICS.sites, help: "X-axis shows network size; Y-axis shows throughput per site." },
      y: STATION_METRICS.perSite,
      size: { label: "Biofuel volume sold", unit: "Ml/yr", value: (s: Station) => s.volumeMnL },
    };
  }
  if (metricKey === "marketcap") {
    return {
      x: { metric: STATION_METRICS.volume, help: "X-axis shows total volume sold; Y-axis shows market cap." },
      y: STATION_METRICS.marketcap,
      size: { label: "Retail sites", unit: "sites", value: (s: Station) => s.sites },
    };
  }
  return {
    x: { metric: STATION_METRICS.volume, help: "X-axis shows total volume sold; Y-axis shows share price." },
    y: STATION_METRICS.price,
    size: { label: "Retail sites", unit: "sites", value: (s: Station) => s.sites },
  };
}

export function BiofuelProductionPanel({ fuels = [] }: { fuels?: FuelType[] }) {
  const [stationMetric, setStationMetric] = useState<StationMetric>("sites");
  const [view, setView] = useState<PanelView>("heat");
  const detail = useEntityDetail();
  const { get } = useEntityQuotes();
  const metric = STATION_METRICS[stationMetric];
  const valueOf = (s: Station) =>
    stationMetric === "price" ? (get(STATION_TICKERS[s.name])?.price ?? 0) : metric.value(s);

  const matched = STATIONS.filter((s) => fuels.length === 0 || s.fuels.some((f) => fuels.includes(f)));
  const base = matched.length > 0 ? matched : STATIONS;
  const f = useChartFilter(base, {
    text: (s) => `${s.name} ${s.country} ${s.note} ${s.fuels.join(" ")}`,
    facetA: (s) => s.country,
    facetB: (s) => s.fuels as string[],
  });
  const ranked = f.filtered.slice().sort((a, b) => valueOf(b) - valueOf(a));
  // Default view is the global top 10; once a country, fuel or search filter is
  // applied we show every matching station in that selection (capped at 20).
  const isFiltered = Boolean(f.a || f.b || f.query.trim());
  const stations = view === "table" || view === "map" ? ranked : ranked.slice(0, isFiltered ? 20 : 10);
  const ghgEmpty =
    stationMetric === "ghg" && ranked.length > 0 && !ranked.some((x) => ghgSavingsMt(x.name) > 0);

  const axes = scatterAxes(stationMetric);
  const scatterPoints: ScatterPoint[] = stations.map((s) => ({
    key: s.name,
    label: s.name,
    sub: `${s.country} · ${s.fuels.join(" / ")}`,
    x: axes.x.metric.value(s),
    y: valueOf(s),
    size: axes.size.value(s),
    group: s.country,
    logo: entityLogoByName(s.name),
    meta: priceMeta(get(STATION_TICKERS[s.name])),
    changePct: get(STATION_TICKERS[s.name])?.changePct,
    newsTarget: { name: s.name, query: `"${s.name}" biofuel OR ethanol OR renewable diesel station` },
  }));

  const items = stations.map((s) => ({
    key: s.name,
    label: s.name,
    sub: s.note,
    value: valueOf(s),
    logo: entityLogoByName(s.name),
    meta: priceMeta(get(STATION_TICKERS[s.name])),
    tone: priceTone(get(STATION_TICKERS[s.name])),
    changePct: get(STATION_TICKERS[s.name])?.changePct,
  }));
  const newsMap = Object.fromEntries(
    stations.map((s) => [
      s.name,
      { name: s.name, query: `"${s.name}" biofuel OR ethanol OR renewable diesel station` },
    ]),
  );
  const filters: [string, string][] = [
    ["Country", f.a || "All countries"],
    ["Fuel type", f.b || "All fuels"],
  ];
  if (fuels.length) filters.push(["Section fuel filter", fuels.join(", ")]);
  if (f.query.trim()) filters.push(["Search", `"${f.query.trim()}"`]);
  const graph: GraphContext = {
    measure: metric.label,
    unit: metric.unit,
    view: PANEL_VIEWS.find((v) => v.value === view)?.label ?? view,
    filters,
    items: stations.map((s) => ({ name: s.name, value: valueOf(s) })),
    format: (n: number) => fmt(n, metric.decimals),
  };
  const onSelect = detail.onSelect((t) => {
    const s = stations.find((x) => x.name === t?.name);
    if (!s) return null;
    const q = get(STATION_TICKERS[s.name]);
    return {
      name: s.name,
      sub: `${s.country} · ${s.fuels.join(" / ")}`,
      logo: entityLogoByName(s.name),
      note: s.note,
      stats: [
        { label: "Retail sites offering biofuels", value: fmt(s.sites, 0) },
        { label: "Biofuel volume sold", value: `${fmt(s.volumeMnL, 0)} Ml/yr` },
        { label: "Ticker", value: STATION_TICKERS[s.name] ?? "Not listed" },
        { label: "Share price", value: q ? fmt(q.price, 2) : "—" },
        { label: "Market cap (approx.)", value: marketCapLabel(STATION_TICKERS[s.name]) ?? "Private / state-owned" },
        {
          label: "1-day change",
          value: q ? `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%` : "—",
          tone: detailTone(q?.changePct),
        },
      ],
      news: { name: s.name, query: `"${s.name}" biofuel OR ethanol OR renewable diesel station` },
    };
  }, graph);

  return (
    <>
    {detail.sheet}
    <ChartPanel
      icon={Fuel}
      title="Top global fuel stations selling biofuels"
      blurb="Retail networks offering ethanol, biodiesel, renewable diesel or renewable gas at the pump."
      metricValue={stationMetric}
      metricOptions={(Object.keys(STATION_METRICS) as StationMetric[]).map((m) => ({
        value: m,
        label: STATION_METRICS[m].label,
      }))}
      onMetricChange={(v) => setStationMetric(v as StationMetric)}
      viewValue={view}
      viewOptions={PANEL_VIEWS}
      onViewChange={(v) => setView(v as PanelView)}
      actions={
        <PanelActions summaryBuild={() => summaryOf({ panel: "Top global fuel stations selling biofuels", measureLabel: metric.label, unit: metric.unit, filters: [f.a, f.b], items, total: ranked.length })}>
        <ExportCsvButton
          disabled={ranked.length === 0}
          build={() => ({
            title: "Top global fuel stations selling biofuels",
            filename: "biofuel-station-networks",
            note: `Measure shown: ${metric.label}`,
            header: [
              "Network",
              "Country",
              "Retail sites offering biofuels",
              "Biofuel volume sold (Ml/yr)",
              "Volume per site (litres x1000/yr)",
              "Fuels",
              "Ticker",
              "Share price",
              "1-day change %",
              "Market cap (approx., USD bn)",
              "Note",
            ],
            rows: ranked.map((s) => {
              const q = get(STATION_TICKERS[s.name]);
              return [
                s.name,
                s.country,
                s.sites,
                s.volumeMnL,
                ((s.volumeMnL * 1000) / Math.max(s.sites, 1)).toFixed(1),
                s.fuels.join(" / "),
                STATION_TICKERS[s.name] ?? "",
                q ? q.price.toFixed(2) : "",
                q ? q.changePct.toFixed(2) : "",
                marketCapLabel(STATION_TICKERS[s.name]) ?? "",
                s.note,
              ];
            }),
          })}
        />
        </PanelActions>
      }
      filters={
        <ChartFilterBar
          query={f.query}
          onQueryChange={f.setQuery}
          placeholder="Search networks…"
          selects={[
            {
              label: "Country",
              value: f.a,
              options: countryFilterOptions(base.map((s) => s.country)),
              onChange: f.setA,
              allLabel: "All countries",
            },
            { label: "Fuel", value: f.b, options: f.optionsB, onChange: f.setB, allLabel: "All fuels" },
          ]}
          shown={stations.length}
          total={base.length}
          matched={ranked.length}
        />
      }
      footnote={
        view === "scatter"
          ? `Scatter plot: X = ${axes.x.metric.label}, Y = ${metric.label}, bubble size = ${axes.size.label}. ${axes.x.help} Approximate site counts from company retail disclosures and national blending programmes. Click any bubble to open the latest news for that network. ${MARKET_CAP_NOTE}`
          : `Approximate site counts from company retail disclosures and national blending programmes. Click any row to open the latest news for that network. ${MARKET_CAP_NOTE}`
      }
          >
      {ghgEmpty ? (
        <GhgEmptyNotice />
      ) : stations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No listed station networks for this filter — open that country's profile page for its
          policy and market updates.
        </p>
      ) : view === "line" ? (
        <ChartTrend panel="stations" />
      ) : view === "scatter" ? (
        <ChartScatter
          points={scatterPoints}
          xAxis={{ label: axes.x.metric.label, unit: axes.x.metric.unit, help: axes.x.help }}
          yAxis={{ label: metric.label, unit: metric.unit, help: metric.help }}
          sizeAxis={{ label: axes.size.label, unit: axes.size.unit }}
          formatX={(n) => fmt(n, axes.x.metric.decimals)}
          formatY={(n) => fmt(n, metric.decimals)}
          formatSize={(n) => fmt(n, 0)}
          onSelect={onSelect}
          indexLabel="Listed fuel retailers & producers index"
        />
      ) : view === "map" ? (
        <ChartMap
          points={stations.map((s) => ({
            key: s.name,
            label: s.name,
            country: s.country,
            value: valueOf(s),
            sub: s.note,
            newsTarget: { name: s.name, query: `"${s.name}" biofuel OR ethanol OR renewable diesel station` },
          }))}
          measureLabel={metric.label}
          unitLabel={metric.unit}
          format={(n: number) => fmt(n, metric.decimals)}
          onSelect={onSelect}
        />
      ) : view === "bars" ? (
        <ChartBars
          items={items}
          unitLabel={metric.unit}
          yLabel="Network"
          metaHeader="Market"
          format={(n: number) => fmt(n, metric.decimals)}
          news={newsMap}
          onSelect={onSelect}
        />
      ) : view === "table" ? (
        <ChartTable
          items={items}
          measureLabel={metric.label}
          unitLabel={metric.unit}
          format={(n: number) => fmt(n, metric.decimals)}
          news={newsMap}
          onSelect={onSelect}
        />
      ) : (
        <ChartHeat
          unitLabel={metric.unit}
          measureLabel={metric.label}
          measureHelp={metric.help}
          indexLabel="Listed fuel retailers & producers index"
          format={(n: number) => fmt(n, metric.decimals)}
          items={items}
          onSelect={onSelect}
          news={newsMap}
        />
      )}
    </ChartPanel>
    </>
  );
}
