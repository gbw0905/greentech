const pathwayInventory = (() => {
  const sources = {
    greet: ['Argonne R&D GREET 2024 pathway report', 'https://www.osti.gov/servlets/purl/2520162'],
    jrc: ['European Commission JRC biofuel inventory (2017)', 'https://publications.jrc.ec.europa.eu/repository/bitstream/JRC104483/kj1a28349enn.pdf'],
    red: ['EU RED Annex V, June 2024 consolidated text', 'https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX%3A02018L2001-20240606'],
    beetDesign: ['Sugar beet ethanol process model (2012)', 'https://www.sciencedirect.com/science/article/pii/S0960852411015732'],
    rapeseedDesign: ['Wageningen rapeseed biodiesel process case', 'https://edepot.wur.nl/202366'],
    sunflowerDesign: ['Sunflower biodiesel biorefinery process study (2021)', 'https://www.sciencedirect.com/science/article/pii/S0960852421000493'],
    icao: ['ICAO SAF Rules of Thumb', 'https://www.icao.int/SAF/saf-rules-of-thumb'],
    corsia: ['ICAO CORSIA core LCA values (October 2024)', 'https://www.icao.int/environmental-protection/CORSIA/Documents/CORSIA_Eligible_Fuels/ICAO%20document%2006%20-%20Default%20Life%20Cycle%20Emissions%20-%20October%202024.pdf'],
    epa: ['US EPA canola and rapeseed pathways', 'https://www.epa.gov/renewable-fuel-standard/approved-pathways-renewable-fuel'],
    dso: ['US EPA distillers sorghum oil determination', 'https://www.epa.gov/renewable-fuel-standard/final-rulemaking-grain-sorghum-oil-pathways'],
    brown: ['REG Seneca brown grease biodiesel application, published by CARB', 'https://ww2.arb.ca.gov/sites/default/files/classic/fuels/lcfs/fuelpathways/comments/tier2/t2n-1243_report.pdf'],
    grease: ['Drexel brown grease purification study', 'https://drexel.esploro.exlibrisgroup.com/esploro/outputs/report/PURIFICATION-OF-BROWN-GREASE-FOR-FUEL/991019295188004721?institution=01DRXU_INST'],
    cotton: ['Türkiye cottonseed biodiesel LCA', 'https://dergipark.org.tr/en/download/article-file/4696995'],
    poultry: ['Rendered animal fat biodiesel LCA', 'https://fprf.org/wp-content/uploads/2022/07/Emissions-Life-Cycle-Analysis-for-Biodiesel-Derived-from-Rendered-Animal-Fats-David-Bruce-2010.pdf'],
    rendering: ['Poultry-fat rendering LCA', 'https://www.sciencedirect.com/science/article/pii/S0959652619347158'],
    molasses: ['Thai cane molasses ethanol LCA', 'https://aoatools.aua.gr/pilotec/files/bibliography/Life%20cycle%20assessment%20of%20fuel%20ethanol%20from%20cane%20molasses-1009424384/Life%20cycle%20assessment%20of%20fuel%20ethanol%20from%20cane%20molasses.pdf'],
    cassava: ['Choo et al. cassava starch ethanol simulation (2021)', 'https://doi.org/10.1088/1755-1315/765/1/012004'],
    ethanolDensity: ['PubChem ethanol density', 'https://pubchem.ncbi.nlm.nih.gov/compound/Ethanol#section=Density'],
    forest: ['NREL northeastern California forest biomass design study', 'https://www.nrel.gov/docs/legosti/fy98/24676.pdf'],
    steelanol: ['Steelanol project paper', 'https://innovation-centre-for-industrial-transformation.ec.europa.eu/sites/default/files/2025-07/wim-van-der-stricht-et-al-steelanol-project_0.pdf'],
    swine: ['CARB dairy and swine biomethane model manual', 'https://ww2.arb.ca.gov/sites/default/files/barcu/regact/2024/lcfs2024/instr.manual_tier1_ci_calc_%20dairy%26swine_manure_biomethane.pdf'],
    beef: ['Beef feedlot manure digestion study', 'https://www.sciencedirect.com/science/article/pii/S0956053X21006413'],
    codigest: ['US EPA Noblehurst Farms case study', 'https://www.epa.gov/sites/default/files/2018-04/documents/agstar_profile_noblehurst_2018.pdf'],
    pem: ['US DOE PEM electrolyzer system data', 'https://www.energy.gov/cmei/fuels/technical-targets-proton-exchange-membrane-electrolysis'],
    smr: ['US DOE NETL hydrogen production study', 'https://www.netl.doe.gov/projects/files/ComparisonofCommercialStateoftheArtFossilBasedHydrogenProductionTechnologies_080122.pdf'],
    waste: ['Enerkem Edmonton facility record', 'https://enerkem.com/publications/enerkem-to-retire-its-edmonton-biofuels-facility'],
    imo: ['IMO marine fuel lifecycle methodology', 'https://www.imo.org/en/ourwork/environment/pages/lifecycle-ghg---carbon-intensity-guidelines.aspx']
  };

  const reference = (source, section, note, inputs = {}, result) => {
    const [title, url] = sources[source];
    return { title, url, section, note, inputs, result };
  };
  const directCI = (value, feedstock, feedstockFreight, fuel, fuelFreight) => reference('greet', 'Table 1',
    'Direct lifecycle CI for the Argonne modeled case. The displayed study total may differ from the sum of rounded stages.', {},
    { value, unit: 'g CO₂e/MJ', parts: { 'Feedstock': feedstock, 'Feedstock transport': feedstockFreight, 'Fuel': fuel, 'Fuel transport': fuelFreight } });
  const coreCI = (table, value, context) => reference('corsia', table,
    `Core lifecycle CI. ${context}`, {}, { value, unit: 'g CO₂e/MJ' });
  const redCI = (value, scenario) => reference('red', 'Annex V, Part D, typical total',
    scenario, {}, { value, unit: 'g CO₂e/MJ' });
  const safCapacity = (feedstock, litres) => reference('icao', 'Table 1',
    `${feedstock} mature-plant design case: ${litres / 1e6} million litres of SAF/year. This is design capacity, not actual plant output.`,
    { volume: litres / 3.785411784 });
  const dso = reference('dso', 'Final rule materials',
    'EPA evaluates distillers sorghum oil as its own feedstock. Its RFS finding does not supply facility utility use or a CI input.');
  const pem = reference('pem', 'System efficiency, 2022 status',
    'PEM electrolyzer system electricity use. Site output and the wind or solar electricity emissions factor depend on the project.', {},
    { value: 55, unit: 'kWh/kg H₂', label: 'Published electricity use' });
  const cassavaGallons = 26667.76 / 0.7893 / 3.785411784;

  function jrcBoilerCase({ volume, steam, electricity, km, truckTonneKmPerMj, ci }) {
    const inputs = {
      volume,
      ng: steam * 1.111, // Table 63, purchase energy per MJ of steam
      kwh: (electricity + steam * 0.020) / 3.6,
      km,
      grid: 150.1 * 3.6, // Table 2, low-voltage electricity
      kg: truckTonneKmPerMj * 1000 / km,
      gasfactor: 9.7 + 56.2 + (0.0028 * 25 + 0.0011 * 298) / 1.111,
      truckfactor: 0.81 * 95.1 + 0.0034 * 25 + 0.0015 * 298
    };
    // Subtract modeled utility and freight components from the published total to avoid double counting.
    inputs.fixed = ci - inputs.ng * inputs.gasfactor - inputs.kwh * inputs.grid - truckTonneKmPerMj * inputs.truckfactor;
    return inputs;
  }
  const beet = jrcBoilerCase({
    volume: 44e6 / 3.785411784, steam: 0.2806, electricity: 0.0345, km: 30,
    truckTonneKmPerMj: 0.0074 * 1.8388, ci: 30.7
  });
  const rapeseed = jrcBoilerCase({
    volume: 100e6 * 37.2 / 126.13, steam: 0.033, electricity: 0.00405, km: 163,
    truckTonneKmPerMj: 0.737 * 0.0066 * 1.57965 * 1.0246 * 1.00063, ci: 45.5
  });
  const sunflower = jrcBoilerCase({
    volume: 50e6 * 37.2 / 126.13, steam: 0.033, electricity: 0.00405, km: 292,
    truckTonneKmPerMj: 0.686 * 0.0118 * 1.5264 * 1.0256 * 1.0101 * 1.00063, ci: 40.0
  });
  const oilCaseNote = 'Complete composite screening example. Natural gas boiler and transesterification electricity are modeled explicitly. Feedstock mass is the share of seed freight in the study carried by truck. The other modes and remaining supply-chain contributions stay in the residual calibrated to the EU typical CI. Design-scale output comes from a separate study.';

  return {
    'biodiesel-rapeseed': [
      reference('jrc', 'Tables 1–2, 7, 63, 70, 149–150, 154 and 157–158', oilCaseNote, rapeseed),
      redCI(45.5, 'Typical European rapeseed biodiesel lifecycle result.'),
      reference('rapeseedDesign', 'Base case', 'Design output of 100,000 tonnes per year. The form converts this to US gallons using the JRC FAME LHV and the workspace fuel energy basis.')
    ],
    'biodiesel-carinata': [directCI(28.3, 18.8, 0.7, 8.5, 0.3)],
    'biodiesel-camelina': [directCI(41.2, 31.73, 0.7, 8.5, 0.3)],
    'biodiesel-pennycress': [directCI(28.2, 18.6, 0.7, 8.5, 0.3)],
    'biodiesel-dso': [dso],
    'biodiesel-sunflower': [
      reference('jrc', 'Tables 1–2, 7, 63, 70, 158, 169–170, 172 and 175–176', oilCaseNote, sunflower),
      redCI(40.0, 'Typical European sunflower biodiesel lifecycle result.'),
      reference('sunflowerDesign', 'Industrial plant design', 'Modeled output of 50,000 tonnes per year. The form converts this to US gallons using the JRC FAME LHV and the workspace fuel energy basis.')
    ],
    'biodiesel-brown-grease': [reference('brown', 'Tables ES-1 and 3', 'The public facility report identifies process heat and power but withholds site inventory quantities.')],
    'biodiesel-cottonseed': [reference('cotton', 'Table 6', 'The modeled transesterification stage uses 90.05 MJ of electricity and 648.36 kg refined cottonseed oil for 577 kg of biodiesel. The table is on a per-hectare basis.')],
    'biodiesel-poultry': [reference('poultry', 'Figure 4 and Table 4', 'This methyl-ester case hauls 1.013 kg of rendered poultry fat per kg of biodiesel. The study models an LHV of 37.358 MJ/kg of biodiesel.', { kg: 1.013 / 37.358 })],
    'rd-rapeseed': [redCI(45.8, 'Typical European hydrotreated rapeseed oil lifecycle result.'), reference('epa', 'Table 1, pathway G', 'EPA lists non-co-processed hydrotreating under canola/rapeseed oil. The grouping does not give a separate non-canola facility inventory.')],
    'rd-carinata': [directCI(31.8, 20.0, 0.7, 10.6, 0.4)],
    'rd-camelina': [directCI(45.3, 33.5, 0.8, 10.6, 0.4)],
    'rd-pennycress': [directCI(31.7, 19.9, 0.8, 10.6, 0.4)],
    'rd-dso': [dso],
    'rd-sunflower': [redCI(39.4, 'Typical European hydrotreated sunflower oil lifecycle result.'), reference('jrc', '§6.9, Tables 172 and 175–176', 'Sunflower oil extraction, refining and winterisation inputs are published. The downstream biodiesel conversion in this source uses FAME, so its energy inputs cannot be applied to hydrotreating.')],
    'rd-brown-grease': [reference('grease', 'Feedstock purification study', 'Brown grease can require sulfur removal before fuel production. The study covers feedstock treatment and does not provide a full hydrotreater inventory.')],
    'rd-poultry': [reference('rendering', 'Rendering LCA', 'The source covers poultry-fat production up to rendering. Hydrotreater hydrogen, heat and conversion yield still require plant-specific values.')],
    'saf-hefa-soy': [safCapacity('Soybean HEFA', 550e6), directCI(24.7, 12.8, 0.9, 10.64, 0.4)],
    'saf-hefa-canola': [directCI(37.1, 25.3, 0.7, 10.6, 0.4)],
    'saf-hefa-rapeseed': [coreCI('Table 2, rapeseed/canola row', 47.4, 'The model groups rapeseed and canola and excludes induced land-use change.')],
    'saf-hefa-carinata': [directCI(31.8, 20.0, 0.7, 10.6, 0.4)],
    'saf-hefa-camelina': [directCI(45.3, 33.5, 0.8, 10.6, 0.4)],
    'saf-hefa-pennycress': [directCI(31.7, 19.9, 0.8, 10.6, 0.4)],
    'saf-hefa-dco': [directCI(12.6, 1.3, 0.3, 10.6, 0.4)],
    'saf-hefa-dso': [dso],
    'saf-atj-corn': [safCapacity('Corn-ethanol ATJ', 700e6), directCI(61.4, 43.6, 0.2, 17.0, 0.6)],
    'saf-atj-sorghum': [directCI(63.2, 45.4, 0.2, 17.0, 0.6)],
    'saf-ft-cornstover': [directCI(5.7, 1.5, 0.8, 3.0, 0.4)],
    'saf-ft-agresidue': [safCapacity('Agricultural-residue Fischer–Tropsch', 120e6), coreCI('Table 1, agricultural residues row', 7.7, 'The listed case assumes no extra nutrient replacement.')],
    'ethanol-beet': [
      reference('jrc', 'Tables 1–2, 7, 63, 70 and 131–132', 'Complete composite screening example. JRC electricity, boiler fuel and beet haul are modeled separately. The remaining contribution is calibrated to the EU Annex V typical CI. Annual volume comes from a separate published sugar-beet plant design.', beet),
      redCI(30.7, 'Sugar beet ethanol without slops biogas, using a conventional natural gas boiler.'),
      reference('beetDesign', 'Base-case design throughput', 'Modeled plant capacity of 44 million litres per year. This supplies the scale of the screening example.')
    ],
    'ethanol-molasses': [reference('molasses', 'Tables 1–2', 'The study distinguishes rice-husk, biogas and coal process-energy cases. Choose the utility inventory for the actual distillery; heat cannot be entered as natural gas by default.')],
    'ethanol-cassava': [
      reference('cassava', '§3.3.2, SuperPro base case', 'The small-scale simulation processes 56,000 kg cassava starch and produces 26,667.76 kg ethanol per year. The form uses the equivalent volume of pure ethanol at 20 °C and the workspace ethanol basis of 80.53 MJ/US gal. Use the feedstock value only if the delivered material is starch.', { volume: cassavaGallons, kg: 56000 / (cassavaGallons * 80.53) }),
      reference('ethanolDensity', 'Chemical and physical properties', 'The reference density of 0.7893 kg/L at 20 °C converts the study’s ethanol mass to litres before converting to US gallons.')
    ],
    'ethanol-forest': [reference('forest', 'Table 5, Anderson concentrated-acid case', 'Historical design capacity of 22.3 million US gallons of ethanol/year for a forest-biomass facility. Use measured throughput for an operating plant.', { volume: 22.3e6 })],
    'ethanol-waste-gas': [reference('steelanol', 'Project design, Ghent', 'Steelanol design capacity is 80 million litres of ethanol/year from steelmaking gases. A site-specific gas counterfactual and energy inventory are still required.', { volume: 80e6 / 3.785411784 })],
    'rng-swine': [reference('swine', 'Swine manure project inputs', 'Use the swine manure baseline, digester and upgrading data. Avoided methane depends on the site’s prior manure management and the project leakage.')],
    'rng-beef': [reference('beef', 'Feedlot manure experiments', 'The study uses dry batch digestion of feedlot manure. Use project data for manure moisture, baseline management, gas yield and upgrading.')],
    'rng-codigestion': [reference('codigest', 'Digester and feedstock details', 'Noblehurst runs its digester on 65% manure and 35% food and milk-processing waste by mass. Its reported energy use is for on-site generation, not pipeline RNG.')],
    'h2-wind': [pem],
    'h2-solar': [pem],
    'h2-smr-ccs': [reference('smr', 'Case 2, lifecycle GHG comparison', 'Case includes capture, upstream methane and power. The study reports hydrogen mass as its functional unit.', {}, { value: 4.6, unit: 'kg CO₂e/kg H₂' })],
    'msw-methanol': [reference('waste', 'Edmonton commercial demonstration', 'The site made both methanol and ethanol. The public record does not give methanol-only annual output and the full inventory needed here.')],
    'marine-rd': [reference('imo', 'Well-to-wake framework', 'Marine fuels need a fuel-specific lifecycle inventory covering upstream production and ship use. A road-fuel CI cannot stand in for the marine pathway.')]
  };
})();
