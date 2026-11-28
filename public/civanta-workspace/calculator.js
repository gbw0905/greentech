const CATALOG=[{"id":"ethanol-corn","name":"Ethanol — corn dry mill (natural gas)","group":"Ethanol","ci":61.096,"gas":0.34,"kwh":0.021,"tr":2.2,"kg":0.044,"energy":80.53,"fuel":"ethanol","feedstock":"Corn grain","technology":"Dry-mill fermentation","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"ethanol-corn-ccs","name":"Ethanol — corn dry mill with CCS","group":"Ethanol","ci":37.07,"gas":0.34,"kwh":0.03,"tr":2.2,"kg":0.044,"energy":80.53,"fuel":"ethanol","feedstock":"Corn grain","technology":"Dry-mill fermentation + CCS","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"ethanol-sugarcane","name":"Ethanol — Brazilian sugarcane","group":"Ethanol","ci":32.552,"gas":0.0,"kwh":0.002,"tr":2.0,"kg":0.04,"energy":80.53,"fuel":"ethanol","feedstock":"Sugarcane","technology":"Fermentation","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"ethanol-cellulosic","name":"Ethanol — cellulosic (corn stover)","group":"Ethanol","ci":20.18,"gas":0.0,"kwh":0.01,"tr":3.0,"kg":0.06,"energy":80.53,"fuel":"ethanol","feedstock":"Corn stover","technology":"Cellulosic fermentation","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"biodiesel-soy","name":"Biodiesel (FAME) — soybean oil","group":"Biodiesel","ci":43.862,"gas":0.09,"kwh":0.006,"tr":2.0,"kg":0.04,"energy":126.13,"fuel":"bd","feedstock":"Soybean oil","technology":"Transesterification (FAME)","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"biodiesel-uco","name":"Biodiesel (FAME) — used cooking oil","group":"Biodiesel","ci":17.41,"gas":0.08,"kwh":0.005,"tr":3.0,"kg":0.06,"energy":126.13,"fuel":"bd","feedstock":"Used cooking oil","technology":"Transesterification (FAME)","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"biodiesel-tallow","name":"Biodiesel (FAME) — tallow","group":"Biodiesel","ci":24.481,"gas":0.09,"kwh":0.006,"tr":3.0,"kg":0.06,"energy":126.13,"fuel":"bd","feedstock":"Tallow","technology":"Transesterification (FAME)","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"rd-uco","name":"Renewable diesel (HEFA) — used cooking oil","group":"Renewable diesel","ci":16.326,"gas":0.06,"kwh":0.006,"tr":3.5,"kg":0.07,"energy":131,"fuel":"rd","feedstock":"Used cooking oil","technology":"Hydrotreating / HEFA","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"rd-soy","name":"Renewable diesel (HEFA) — soybean oil","group":"Renewable diesel","ci":44.326,"gas":0.06,"kwh":0.006,"tr":2.5,"kg":0.05,"energy":131,"fuel":"rd","feedstock":"Soybean oil","technology":"Hydrotreating / HEFA","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"rd-tallow","name":"Renewable diesel (HEFA) — tallow","group":"Renewable diesel","ci":21.826,"gas":0.06,"kwh":0.006,"tr":3.0,"kg":0.06,"energy":131,"fuel":"rd","feedstock":"Tallow","technology":"Hydrotreating / HEFA","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"saf-hefa-uco","name":"SAF — HEFA from used cooking oil","group":"Sustainable aviation fuel","ci":18.137,"gas":0.07,"kwh":0.007,"tr":3.5,"kg":0.07,"energy":135,"fuel":"saf","feedstock":"Used cooking oil","technology":"HEFA","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"saf-atj","name":"SAF — alcohol to jet from ethanol","group":"Sustainable aviation fuel","ci":46.9,"gas":0.12,"kwh":0.02,"tr":3.0,"kg":0.06,"energy":135,"fuel":"saf","feedstock":"Ethanol","technology":"Alcohol-to-jet","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"saf-ft","name":"SAF — Fischer-Tropsch from forest residue","group":"Sustainable aviation fuel","ci":21.74,"gas":0.0,"kwh":0.03,"tr":4.0,"kg":0.08,"energy":135,"fuel":"saf","feedstock":"Forest residues","technology":"Fischer–Tropsch","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"rng-landfill","name":"Renewable natural gas — landfill gas","group":"Renewable gas","ci":30.09,"gas":0.02,"kwh":0.02,"tr":0.0,"kg":0,"energy":1055.06,"fuel":"rng","feedstock":"Landfill gas","technology":"Gas collection + upgrading","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"rng-dairy","name":"Dairy RNG — farm calculator","group":"Renewable gas","ci":-183.558,"gas":0.02,"kwh":0.03,"tr":0.0,"kg":0,"energy":1055.06,"fuel":"rng","feedstock":"Dairy manure","technology":"Anaerobic digestion + upgrading","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"rng-wastewater","name":"Renewable natural gas — wastewater sludge","group":"Renewable gas","ci":27.335,"gas":0.01,"kwh":0.025,"tr":0.0,"kg":0,"energy":1055.06,"fuel":"rng","feedstock":"Wastewater sludge","technology":"Anaerobic digestion + upgrading","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"h2-electrolysis","name":"Renewable hydrogen — electrolysis","group":"Hydrogen","ci":16.06,"gas":0.0,"kwh":0.0,"tr":0.0,"kg":0,"energy":0,"fuel":"h2","feedstock":"Water + electricity","technology":"Electrolysis","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"h2-biomass","name":"Renewable hydrogen — biomass gasification","group":"Hydrogen","ci":36.68,"gas":0.0,"kwh":0.04,"tr":4.0,"kg":0.08,"energy":0,"fuel":"h2","feedstock":"Woody biomass","technology":"Gasification","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"biomethanol","name":"Bio-methanol — biomass gasification","group":"Other liquids","ci":30.84,"gas":0.0,"kwh":0.04,"tr":4.0,"kg":0.08,"energy":0,"fuel":"other","feedstock":"Woody biomass","technology":"Gasification + methanol synthesis","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"rlpg","name":"Renewable LPG — HEFA co-product","group":"Other liquids","ci":18.786,"gas":0.06,"kwh":0.006,"tr":3.0,"kg":0.06,"energy":0,"fuel":"other","feedstock":"Lipid feedstocks","technology":"HEFA co-product","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"marine-b100","name":"Marine biofuel — B100 from waste oils","group":"Other liquids","ci":19.41,"gas":0.08,"kwh":0.005,"tr":4.0,"kg":0.08,"energy":0,"fuel":"other","feedstock":"Waste oils","technology":"FAME marine fuel","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"wood-pellets","name":"Wood pellets — industrial heat and power","group":"Solid biomass","ci":25.01,"gas":0.02,"kwh":0.02,"tr":4.0,"kg":0.08,"energy":0,"fuel":"solid","feedstock":"Woody biomass","technology":"Pelletization","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"ethanol-wheat","name":"Ethanol — wheat grain (EU)","group":"Ethanol","ci":66.08,"gas":0.38,"kwh":0.025,"tr":2.5,"kg":0.05,"energy":80.53,"fuel":"ethanol","feedstock":"Wheat grain","technology":"Fermentation","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"ethanol-sorghum","name":"Ethanol — grain sorghum","group":"Ethanol","ci":56.496,"gas":0.34,"kwh":0.021,"tr":2.2,"kg":0.044,"energy":80.53,"fuel":"ethanol","feedstock":"Sorghum grain","technology":"Fermentation","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"ethanol-msw","name":"Ethanol — municipal solid waste (biogenic fraction)","group":"Ethanol","ci":20.74,"gas":0.0,"kwh":0.03,"tr":2.0,"kg":0.04,"energy":80.53,"fuel":"ethanol","feedstock":"Municipal solid waste","technology":"Cellulosic fermentation","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"biodiesel-canola","name":"Biodiesel (FAME) — canola / rapeseed oil","group":"Biodiesel","ci":49.481,"gas":0.09,"kwh":0.006,"tr":2.0,"kg":0.04,"energy":126.13,"fuel":"bd","feedstock":"Canola oil","technology":"Transesterification (FAME)","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"biodiesel-palm","name":"Biodiesel (FAME) — palm oil","group":"Biodiesel","ci":61.796,"gas":0.08,"kwh":0.006,"tr":4.0,"kg":0.08,"energy":126.13,"fuel":"bd","feedstock":"Palm oil","technology":"Transesterification (FAME)","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"biodiesel-corn-oil","name":"Biodiesel (FAME) — distillers corn oil","group":"Biodiesel","ci":18.41,"gas":0.08,"kwh":0.005,"tr":2.0,"kg":0.04,"energy":126.13,"fuel":"bd","feedstock":"Distillers corn oil","technology":"Transesterification (FAME)","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"rd-canola","name":"Renewable diesel (HEFA) — canola oil","group":"Renewable diesel","ci":48.326,"gas":0.06,"kwh":0.006,"tr":2.5,"kg":0.05,"energy":131,"fuel":"rd","feedstock":"Canola oil","technology":"Hydrotreating / HEFA","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"rd-corn-oil","name":"Renewable diesel (HEFA) — distillers corn oil","group":"Renewable diesel","ci":16.826,"gas":0.06,"kwh":0.006,"tr":2.0,"kg":0.04,"energy":131,"fuel":"rd","feedstock":"Distillers corn oil","technology":"Hydrotreating / HEFA","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"rd-palm","name":"Renewable diesel (HEFA) — palm and PFAD","group":"Renewable diesel","ci":55.826,"gas":0.06,"kwh":0.006,"tr":5.0,"kg":0.1,"energy":131,"fuel":"rd","feedstock":"Palm oil / PFAD","technology":"Hydrotreating / HEFA","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"saf-hefa-tallow","name":"SAF — HEFA from tallow and animal fats","group":"Sustainable aviation fuel","ci":23.637,"gas":0.07,"kwh":0.007,"tr":3.0,"kg":0.06,"energy":135,"fuel":"saf","feedstock":"Tallow / animal fats","technology":"HEFA","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"saf-ft-msw","name":"SAF — Fischer-Tropsch from municipal solid waste","group":"Sustainable aviation fuel","ci":21.51,"gas":0.0,"kwh":0.035,"tr":2.0,"kg":0.04,"energy":135,"fuel":"saf","feedstock":"Municipal solid waste","technology":"Fischer–Tropsch","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"saf-ptl","name":"SAF — power to liquid (e-kerosene)","group":"Sustainable aviation fuel","ci":16.52,"gas":0.0,"kwh":0.0,"tr":0.0,"kg":0,"energy":135,"fuel":"saf","feedstock":"Renewable H₂ + captured CO₂","technology":"Power-to-liquid","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"saf-corn-atj","name":"SAF — alcohol to jet from sugarcane ethanol","group":"Sustainable aviation fuel","ci":40.92,"gas":0.0,"kwh":0.02,"tr":2.0,"kg":0.04,"energy":135,"fuel":"saf","feedstock":"Sugarcane ethanol","technology":"Alcohol-to-jet","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"rng-foodwaste","name":"Renewable natural gas — food waste digester","group":"Renewable gas","ci":-27.393,"gas":0.015,"kwh":0.03,"tr":0.0,"kg":0,"energy":1055.06,"fuel":"rng","feedstock":"Food waste","technology":"Anaerobic digestion + upgrading","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"rng-agresidue","name":"Renewable natural gas — agricultural residue digestion","group":"Renewable gas","ci":36.95,"gas":0.02,"kwh":0.03,"tr":3.0,"kg":0.06,"energy":1055.06,"fuel":"rng","feedstock":"Agricultural residues","technology":"Anaerobic digestion + upgrading","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"h2-rng-smr","name":"Renewable hydrogen — reforming of renewable natural gas","group":"Hydrogen","ci":43.855,"gas":0.15,"kwh":0.03,"tr":0.0,"kg":0,"energy":0,"fuel":"h2","feedstock":"Renewable natural gas","technology":"Steam methane reforming","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"e-methanol","name":"E-methanol — renewable hydrogen and captured CO2","group":"Other liquids","ci":16.1,"gas":0.0,"kwh":0.0,"tr":0.0,"kg":0,"energy":0,"fuel":"other","feedstock":"Renewable H₂ + captured CO₂","technology":"E-methanol synthesis","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"biobutanol","name":"Bio-butanol — fermentation from starch and sugar","group":"Other liquids","ci":72.95,"gas":0.42,"kwh":0.03,"tr":2.2,"kg":0.044,"energy":0,"fuel":"other","feedstock":"Starch / sugar","technology":"Fermentation","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"pyrolysis-oil","name":"Pyrolysis bio-oil — industrial heat","group":"Other liquids","ci":22.5,"gas":0.0,"kwh":0.03,"tr":4.0,"kg":0.08,"energy":0,"fuel":"other","feedstock":"Biomass","technology":"Fast pyrolysis","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"torrefied-pellets","name":"Torrefied pellets — coal replacement","group":"Solid biomass","ci":25.794,"gas":0.0,"kwh":0.025,"tr":4.0,"kg":0.08,"energy":0,"fuel":"solid","feedstock":"Woody biomass","technology":"Torrefaction","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"ag-briquettes","name":"Agricultural residue briquettes — process heat","group":"Solid biomass","ci":26.34,"gas":0.0,"kwh":0.03,"tr":3.0,"kg":0.06,"energy":0,"fuel":"solid","feedstock":"Agricultural residues","technology":"Briquetting","status":"existing-screening","source":"GBW existing screening catalog"},{"id":"biodiesel-rapeseed","name":"Biodiesel — Rapeseed oil (non-canola)","group":"Biodiesel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":126.13,"fuel":"bd","feedstock":"Rapeseed oil (non-canola)","technology":"Transesterification (FAME)","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"biodiesel-carinata","name":"Biodiesel — Carinata oil (intermediate crop)","group":"Biodiesel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":126.13,"fuel":"bd","feedstock":"Carinata oil (intermediate crop)","technology":"Transesterification (FAME)","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"biodiesel-camelina","name":"Biodiesel — Camelina oil (intermediate crop)","group":"Biodiesel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":126.13,"fuel":"bd","feedstock":"Camelina oil (intermediate crop)","technology":"Transesterification (FAME)","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"biodiesel-pennycress","name":"Biodiesel — Pennycress oil (intermediate crop)","group":"Biodiesel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":126.13,"fuel":"bd","feedstock":"Pennycress oil (intermediate crop)","technology":"Transesterification (FAME)","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"biodiesel-dso","name":"Biodiesel — Distillers sorghum oil","group":"Biodiesel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":126.13,"fuel":"bd","feedstock":"Distillers sorghum oil","technology":"Transesterification (FAME)","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"biodiesel-sunflower","name":"Biodiesel — Sunflower oil","group":"Biodiesel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":126.13,"fuel":"bd","feedstock":"Sunflower oil","technology":"Transesterification (FAME)","status":"exploratory","source":"Additional feedstock/technology concept; verify applicability, data and program acceptance before claiming credits"},{"id":"biodiesel-brown-grease","name":"Biodiesel — Brown grease / trap grease","group":"Biodiesel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":126.13,"fuel":"bd","feedstock":"Brown grease / trap grease","technology":"Transesterification (FAME)","status":"exploratory","source":"Additional feedstock/technology concept; verify applicability, data and program acceptance before claiming credits"},{"id":"biodiesel-cottonseed","name":"Biodiesel — Cottonseed oil","group":"Biodiesel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":126.13,"fuel":"bd","feedstock":"Cottonseed oil","technology":"Transesterification (FAME)","status":"exploratory","source":"Additional feedstock/technology concept; verify applicability, data and program acceptance before claiming credits"},{"id":"biodiesel-poultry","name":"Biodiesel — Poultry fat","group":"Biodiesel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":126.13,"fuel":"bd","feedstock":"Poultry fat","technology":"Transesterification (FAME)","status":"exploratory","source":"Additional feedstock/technology concept; verify applicability, data and program acceptance before claiming credits"},{"id":"rd-rapeseed","name":"Renewable diesel — Rapeseed oil (non-canola)","group":"Renewable diesel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":131,"fuel":"rd","feedstock":"Rapeseed oil (non-canola)","technology":"Hydrotreating / HEFA","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"rd-carinata","name":"Renewable diesel — Carinata oil (intermediate crop)","group":"Renewable diesel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":131,"fuel":"rd","feedstock":"Carinata oil (intermediate crop)","technology":"Hydrotreating / HEFA","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"rd-camelina","name":"Renewable diesel — Camelina oil (intermediate crop)","group":"Renewable diesel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":131,"fuel":"rd","feedstock":"Camelina oil (intermediate crop)","technology":"Hydrotreating / HEFA","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"rd-pennycress","name":"Renewable diesel — Pennycress oil (intermediate crop)","group":"Renewable diesel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":131,"fuel":"rd","feedstock":"Pennycress oil (intermediate crop)","technology":"Hydrotreating / HEFA","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"rd-dso","name":"Renewable diesel — Distillers sorghum oil","group":"Renewable diesel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":131,"fuel":"rd","feedstock":"Distillers sorghum oil","technology":"Hydrotreating / HEFA","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"rd-sunflower","name":"Renewable diesel — Sunflower oil","group":"Renewable diesel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":131,"fuel":"rd","feedstock":"Sunflower oil","technology":"Hydrotreating / HEFA","status":"exploratory","source":"Additional feedstock/technology concept; verify applicability, data and program acceptance before claiming credits"},{"id":"rd-brown-grease","name":"Renewable diesel — Brown grease / trap grease","group":"Renewable diesel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":131,"fuel":"rd","feedstock":"Brown grease / trap grease","technology":"Hydrotreating / HEFA","status":"exploratory","source":"Additional feedstock/technology concept; verify applicability, data and program acceptance before claiming credits"},{"id":"rd-poultry","name":"Renewable diesel — Poultry fat","group":"Renewable diesel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":131,"fuel":"rd","feedstock":"Poultry fat","technology":"Hydrotreating / HEFA","status":"exploratory","source":"Additional feedstock/technology concept; verify applicability, data and program acceptance before claiming credits"},{"id":"saf-hefa-soy","name":"Sustainable aviation fuel — Soybean oil","group":"Sustainable aviation fuel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":135,"fuel":"saf","feedstock":"Soybean oil","technology":"HEFA","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"saf-hefa-canola","name":"Sustainable aviation fuel — Canola oil","group":"Sustainable aviation fuel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":135,"fuel":"saf","feedstock":"Canola oil","technology":"HEFA","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"saf-hefa-rapeseed","name":"Sustainable aviation fuel — Rapeseed oil (non-canola)","group":"Sustainable aviation fuel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":135,"fuel":"saf","feedstock":"Rapeseed oil (non-canola)","technology":"HEFA","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"saf-hefa-carinata","name":"Sustainable aviation fuel — Carinata oil (intermediate crop)","group":"Sustainable aviation fuel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":135,"fuel":"saf","feedstock":"Carinata oil (intermediate crop)","technology":"HEFA","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"saf-hefa-camelina","name":"Sustainable aviation fuel — Camelina oil (intermediate crop)","group":"Sustainable aviation fuel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":135,"fuel":"saf","feedstock":"Camelina oil (intermediate crop)","technology":"HEFA","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"saf-hefa-pennycress","name":"Sustainable aviation fuel — Pennycress oil (intermediate crop)","group":"Sustainable aviation fuel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":135,"fuel":"saf","feedstock":"Pennycress oil (intermediate crop)","technology":"HEFA","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"saf-hefa-dco","name":"Sustainable aviation fuel — Distillers corn oil","group":"Sustainable aviation fuel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":135,"fuel":"saf","feedstock":"Distillers corn oil","technology":"HEFA","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"saf-hefa-dso","name":"Sustainable aviation fuel — Distillers sorghum oil","group":"Sustainable aviation fuel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":135,"fuel":"saf","feedstock":"Distillers sorghum oil","technology":"HEFA","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"saf-atj-corn","name":"Sustainable aviation fuel — Corn-derived ethanol","group":"Sustainable aviation fuel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":135,"fuel":"saf","feedstock":"Corn-derived ethanol","technology":"Alcohol-to-jet","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"saf-atj-sorghum","name":"Sustainable aviation fuel — Sorghum-derived ethanol","group":"Sustainable aviation fuel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":135,"fuel":"saf","feedstock":"Sorghum-derived ethanol","technology":"Alcohol-to-jet","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"saf-ft-cornstover","name":"Sustainable aviation fuel — Corn stover","group":"Sustainable aviation fuel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":135,"fuel":"saf","feedstock":"Corn stover","technology":"Fischer–Tropsch","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"saf-ft-agresidue","name":"Sustainable aviation fuel — Agricultural residues","group":"Sustainable aviation fuel","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":135,"fuel":"saf","feedstock":"Agricultural residues","technology":"Fischer–Tropsch","status":"exploratory","source":"Additional feedstock/technology concept; verify applicability, data and program acceptance before claiming credits"},{"id":"ethanol-beet","name":"Ethanol — Sugar beet","group":"Ethanol","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":80.53,"fuel":"ethanol","feedstock":"Sugar beet","technology":"Fermentation","status":"exploratory","source":"Additional feedstock/technology concept; verify applicability, data and program acceptance before claiming credits"},{"id":"ethanol-molasses","name":"Ethanol — Molasses","group":"Ethanol","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":80.53,"fuel":"ethanol","feedstock":"Molasses","technology":"Fermentation","status":"exploratory","source":"Additional feedstock/technology concept; verify applicability, data and program acceptance before claiming credits"},{"id":"ethanol-cassava","name":"Ethanol — Cassava starch","group":"Ethanol","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":80.53,"fuel":"ethanol","feedstock":"Cassava starch","technology":"Fermentation","status":"exploratory","source":"Additional feedstock/technology concept; verify applicability, data and program acceptance before claiming credits"},{"id":"ethanol-forest","name":"Ethanol — Forest residues","group":"Ethanol","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":80.53,"fuel":"ethanol","feedstock":"Forest residues","technology":"Cellulosic fermentation","status":"exploratory","source":"Additional feedstock/technology concept; verify applicability, data and program acceptance before claiming credits"},{"id":"ethanol-waste-gas","name":"Ethanol — Industrial waste gas","group":"Ethanol","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":80.53,"fuel":"ethanol","feedstock":"Industrial waste gas","technology":"Gas fermentation","status":"exploratory","source":"Additional feedstock/technology concept; verify applicability, data and program acceptance before claiming credits"},{"id":"rng-swine","name":"Renewable gas — Swine manure","group":"Renewable gas","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":1055.05585,"fuel":"rng","feedstock":"Swine manure","technology":"Anaerobic digestion + upgrading","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"rng-beef","name":"Renewable gas — Beef cattle manure","group":"Renewable gas","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":1055.05585,"fuel":"rng","feedstock":"Beef cattle manure","technology":"Anaerobic digestion + upgrading","status":"exploratory","source":"Listed feedstock and pathway family in 2026 45ZCF-GREET guidance; GBW-specific CI factors not yet parameterized"},{"id":"rng-codigestion","name":"Renewable gas — Mixed food waste + manure","group":"Renewable gas","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":1055.05585,"fuel":"rng","feedstock":"Mixed food waste + manure","technology":"Co-digestion + upgrading","status":"exploratory","source":"Additional feedstock/technology concept; verify applicability, data and program acceptance before claiming credits"},{"id":"h2-wind","name":"Hydrogen — Wind-powered water + electricity","group":"Hydrogen","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":120,"fuel":"h2","feedstock":"Wind-powered water + electricity","technology":"Electrolysis","status":"exploratory","source":"Additional feedstock/technology concept; verify applicability, data and program acceptance before claiming credits"},{"id":"h2-solar","name":"Hydrogen — Solar-powered water + electricity","group":"Hydrogen","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":120,"fuel":"h2","feedstock":"Solar-powered water + electricity","technology":"Electrolysis","status":"exploratory","source":"Additional feedstock/technology concept; verify applicability, data and program acceptance before claiming credits"},{"id":"h2-smr-ccs","name":"Hydrogen — Natural gas","group":"Hydrogen","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":120,"fuel":"h2","feedstock":"Natural gas","technology":"Steam methane reforming + CCS","status":"exploratory","source":"Additional feedstock/technology concept; verify applicability, data and program acceptance before claiming credits"},{"id":"msw-methanol","name":"Other liquids — Municipal solid waste","group":"Other liquids","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":0,"fuel":"other","feedstock":"Municipal solid waste","technology":"Gasification + methanol synthesis","status":"exploratory","source":"Additional feedstock/technology concept; verify applicability, data and program acceptance before claiming credits"},{"id":"marine-rd","name":"Other liquids — Waste oils","group":"Other liquids","ci":null,"gas":null,"kwh":null,"tr":null,"kg":null,"energy":0,"fuel":"other","feedstock":"Waste oils","technology":"HEFA marine diesel","status":"exploratory","source":"Additional feedstock/technology concept; verify applicability, data and program acceptance before claiming credits"}];
const $=id=>document.getElementById(id),fmt=(n,d=2)=>Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:d}):'—',money=n=>Number.isFinite(n)?n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}):'—',esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let sel={fuel:'',feed:'',tech:'',id:''},stage=0,baseline=null,dirty=false,dairyTab=0,optim={power:0,rail:0,heat:0,tuning:0,leak:0,demand:0,gas:0};let generic={},dairy={},allocation=newAllocation();const gfields=[['volume','Annual fuel production','US gallons/year or MMBtu/year for renewable gas','number'],['ng','Natural gas use','MJ natural gas / MJ fuel','number'],['kwh','Grid electricity use','kWh / MJ fuel','number'],['km','Feedstock transportation distance','km','number'],['grid','Grid emission intensity','g CO₂e/kWh','number'],['fixed','Upstream & other net CI contribution','g CO₂e/MJ · enter a modeled or documented value','number'],['kg','Feedstock mass moved per MJ output','kg/MJ fuel · use 0 only if no feedstock haul','number']];const gadvance=[['gasfactor','Natural gas emission factor','g CO₂e/MJ gas','number'],['truckfactor','Truck emission factor','g CO₂e/tonne-km','number']];
const levels = [
 {key: 'group', type: 'fuel'},
 {key: 'feedstock', type: 'feed'},
 {key: 'technology', type: 'tech'}
];
function pathwayNodes(paths, depth = 0) {
 const level = levels[depth];
 const groups = new Map();
 for (const path of paths) {
  const name = path[level.key];
  if (!groups.has(name)) groups.set(name, []);
  groups.get(name).push(path);
 }
 const entries = [...groups];
 if (level.type === 'feed') entries.sort(([a], [b]) => a.localeCompare(b));
 return entries.map(([value, members]) => ({
  id: value, label: value, count: members.length,
  ...(level.type === 'tech' ? {routes: members} : {children: pathwayNodes(members, depth + 1)})
 }));
}

function renderFuelPath(list, route) {
 list.replaceChildren(...[
  ['Fuel', route.group], ['Feedstock', route.feedstock], ['Technology', route.technology]
 ].map(([label, value]) => {
  const step = document.createElement('li');
  const heading = document.createElement('small');
  const detail = document.createElement('strong');
  heading.textContent = label;
  detail.textContent = value;
  step.append(heading, detail);
  return step;
 }));
}

function openWorkspaceDialog(dialog,onClose) {
 const frame = window.frameElement;
 const host = frame?.ownerDocument.defaultView || window;
 const siteBackdrop = ['pathwayReview','civantaProDialog'].includes(dialog.id) && frame?.parentElement?.matches('.civanta-host')
  ? host.document.createElement('div')
  : null;
 const siteSiblings = [];
 const positionDialog = () => {
  const viewport = frame?.getBoundingClientRect();
  const chrome = frame?.ownerDocument.querySelector('.site-chrome');
  const top = Math.max(viewport?.top || 0, chrome?.getBoundingClientRect().bottom || 0);
  const bottom = Math.min(viewport?.bottom ?? host.innerHeight, host.innerHeight);
  dialog.style.setProperty('--review-inset', (top - (viewport?.top || 0)) + 'px');
  dialog.style.setProperty('--review-space', Math.max(0, bottom - top) + 'px');
  if (siteBackdrop && viewport) {
   siteBackdrop.style.setProperty('--review-left', viewport.left + 'px');
   siteBackdrop.style.setProperty('--review-right', viewport.right + 'px');
   siteBackdrop.style.setProperty('--review-top', top + 'px');
   siteBackdrop.style.setProperty('--review-bottom', Math.max(top, bottom) + 'px');
  }
 };

 dialog.returnValue = '';
 positionDialog();
 dialog.showModal();
 if (siteBackdrop) {
  siteBackdrop.className = 'civanta-review-backdrop';
  siteBackdrop.setAttribute('aria-hidden', 'true');
  host.document.body.append(siteBackdrop);
  for (let node = frame; node !== host.document.body; node = node.parentElement) {
   for (const sibling of node.parentElement.children) {
    if (sibling === node || sibling === siteBackdrop || sibling.inert || !(sibling instanceof host.HTMLElement)) continue;
    sibling.inert = true;
    siteSiblings.push(sibling);
   }
  }
 }
 const resize = new ResizeObserver(positionDialog);
 if (frame) resize.observe(frame);
 host.addEventListener('scroll', positionDialog, {passive: true});
 host.addEventListener('resize', positionDialog);
 function restoreSite() {
  siteBackdrop?.remove();
  siteSiblings.forEach(element => { element.inert = false; });
 }
 if (siteBackdrop) window.addEventListener('pagehide', restoreSite, {once: true});
 dialog.addEventListener('close', () => {
  window.removeEventListener('pagehide', restoreSite);
  restoreSite();
  resize.disconnect();
  host.removeEventListener('scroll', positionDialog);
  host.removeEventListener('resize', positionDialog);
  onClose?.(dialog.returnValue);
 }, {once: true});
}

const review = $('pathwayReview');
const reviewChoice = $('pathwayReviewChoice');
function reviewPathway({routes}, onClose) {
 reviewChoice.replaceChildren(...routes.map(route => new Option(route.name, route.id)));
 reviewChoice.value = routes.find(route => route.id === sel.id)?.id || routes[0].id;
 $('pathwayReviewOptions').hidden = routes.length === 1;

 function updateReview() {
  renderFuelPath($('pathwayReviewFlow'), routes.find(item => item.id === reviewChoice.value));
 }
 reviewChoice.onchange = updateReview;
 updateReview();

 openWorkspaceDialog(review,value => onClose(value === 'confirm'));
 $('pathwayReviewBack').onclick = () => review.close();
 $('toInput').onclick = () => {
  const route = routes.find(item => item.id === reviewChoice.value);
  if (sel.id !== route.id) {
   sel = {fuel: route.group, feed: route.feedstock, tech: route.technology, id: route.id};
   generic = {};
   allocation = newAllocation();
   $('confirmEconomics').checked = false;
   dairy = {};
   dairyTab = 0;
   renderPlantPathway();
   markDirty();
  }
  review.close('confirm');
  show(1);
  $('inputTitle').focus({preventScroll: true});
 };
}

const pathwayPicker = createPathwayPicker($('pathwayPicker'), pathwayNodes(CATALOG), reviewPathway);
function renderSetup() {
 pathwayPicker.setSelection([sel.fuel, sel.feed, sel.tech].filter(Boolean));
 renderPlantPathway();
}
function renderPlantPathway() {
 const path = CATALOG.find(item => item.id === sel.id);
 const flow = $('plantPathway');
 $('plantPathwayRow').hidden = !path;
 if (path) renderFuelPath(flow, path);
 else flow.replaceChildren();
}
function requestWorkspaceScroll(){
 const request=new Event('civanta-scroll-request',{cancelable:true});
 if(window.dispatchEvent(request))window.scrollTo({top:0,behavior:'auto'});
}
const excelDownloadButtons = document.querySelectorAll('[data-download-excel]');
const excelDownloadStatuses = document.querySelectorAll('.excel-download-status');
let excelDownloadPending = false;
function syncExcelDownloadActions() {
 for (const button of excelDownloadButtons) {
  const creditPanel = button.id === 'creditDownloadExcel'
   ? document.querySelector('#view3 [role="tabpanel"]:not([hidden])') : null;
  const needsCreditRun = button.id === 'creditDownloadExcel' &&
   !creditPanel?.querySelector('.credit-result-grid .rin-stat');
  button.disabled = !baseline || excelDownloadPending || needsCreditRun;
  button.title = !baseline ? 'Run CI to unlock Excel' :
   needsCreditRun ? 'Run this credit estimate to unlock Excel' : '';
 }
}
function setExcelDownloadStatus(message) {
 for (const status of excelDownloadStatuses) status.textContent = message;
}
function syncResultActions() {
 const calculated = !!baseline;
 $('runButton').hidden = calculated;
 $('runButton').disabled = !calculated && !hasRequiredCiInputs();
 syncExcelDownloadActions();
 $('excelDownloadHint').hidden = calculated;
 $('goOptimize').hidden = !calculated;
 if (!calculated) {
  setExcelDownloadStatus('');
 }
 for (const button of document.querySelectorAll('.nav [data-go="2"], .nav [data-go="3"]')) {
  button.disabled = false;
 }
}

function show(i, accessVerified = false) {
 if (i >= 2 && !accessVerified) {
  if (baseline && stage < 2) show(1);
  void civantaPro.enter(i, () => show(i, true));
  return;
 }
 if ((i >= 1 && !sel.id) || (i >= 2 && !baseline)) return;
 stage = i;
 document.querySelectorAll('section[id^="view"]').forEach((view, index) => view.classList.toggle('hide', index !== i));
 document.querySelectorAll('.nav button').forEach((button, index) => button.classList.toggle('active', index === i));
 document.querySelector('.nav [data-go="1"]').disabled = !sel.id;
 syncResultActions();
 if (i === 1) renderInputs();
 if (i === 2) renderOptimizer();
 if (i === 3) renderCredits();
 window.dispatchEvent(new Event('civanta-stage-changed'));
 pathwayPicker.setStageVisible(i === 0);
 requestWorkspaceScroll();
}
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => show(Number(button.dataset.go))));
function fieldHtml(k,label,help,obj){const v=obj[k];return `<label class="field"><span class="label">${esc(label)}</span><input data-key="${k}" type="number" step="any" ${v===undefined?'':`value="${esc(v)}"`} placeholder="Enter value"><small>${esc(help)}</small></label>`}
function markDirty() {
 if (baseline) {
  baseline = null;
  $('runResult').classList.add('hide');
 }
 syncResultActions();
 $('validation').textContent = '';
}
function renderInputs() {
 const farm = sel.id === 'rng-dairy';
 $('inputTitle').textContent = farm ? 'Dairy RNG inventory' : 'Facility inventory';
 $('genericForm').classList.toggle('hide', farm);
 $('dairyForm').classList.toggle('hide', !farm);
 if (farm) renderDairy();
 else renderGFields();
 $('runResult').classList.toggle('hide', !baseline);
 if (baseline) renderRunResult();
}
const standardFuelSource = 'https://afdc.energy.gov/fuels/properties';
const liquidFuelLhvBtu = {
 biomethanol: 57250, 'e-methanol': 57250, 'msw-methanol': 57250,
 'marine-b100': 119550, 'marine-rd': 123710
};
const energyField = ['lhv', 'Fuel lower heating value', 'MJ/kg · measured for your fuel'];
function productionBasis(path) {
 if (path.fuel === 'h2') return { unit: 'kg', energy: 120, source: standardFuelSource };
 if (liquidFuelLhvBtu[path.id]) return { unit: 'US gallons', energy: liquidFuelLhvBtu[path.id] * 0.00105505585262, source: standardFuelSource };
 if (path.energy > 0) return { unit: path.fuel === 'rng' ? 'MMBtu' : 'US gallons', energy: path.energy, source: 'GBW screening catalog' };
 return { unit: 'kg', energy: generic.lhv, source: 'User-entered fuel lower heating value' };
}
function usesMeasuredLhv(path) {
 return path.fuel !== 'h2' && !liquidFuelLhvBtu[path.id] && path.energy <= 0;
}
function requiredInventoryFields(path) {
 const legacy = generic._mode === 'legacy';
 const keys = ['volume', legacy ? 'fixed' : 'upstream', 'km', 'kg', 'ng', 'kwh'];
 if (usesMeasuredLhv(path)) keys.splice(1, 0, 'lhv');
 if (legacy || generic.kwh > 0) keys.push('grid');
 if (generic.ng > 0) keys.push('gasfactor');
 if (generic.km > 0 && generic.kg > 0) keys.push('truckfactor');
 return keys;
}
function requiredAllocationEntries() {
 const a = allocation;
 if (generic._mode === 'legacy' || a.method === 'none') return [];
 const entries = [['allocClass', a.classification === 'unreviewed' ? '' : a.classification], ['allocConfirmed', a.confirmed]];
 if (a.method === 'displacement') return [...entries,['allocAvoided',a.avoided],['allocEvidence',a.evidence]];
 entries.push(['allocationShared',a.scope.length > 0]);
 if (a.method !== 'energy') entries.push(['allocFuelMass',a.fuelMass]);
 if (a.method === 'economic') entries.push(['allocFuelPrice',a.fuelPrice]);
 const activeRows = a.products.map((product,index) => Object.values(product).some(value => value != null && value !== '') ? index : -1).filter(index=>index>=0);
 for (const index of activeRows.length ? activeRows : [0]) {
  const product = a.products[index];
  entries.push(['alloc'+index+'name',product.name],['alloc'+index+'mass',product.mass]);
  if (a.method === 'energy') entries.push(['alloc'+index+'lhv',product.lhv]);
  if (a.method === 'economic') entries.push(['alloc'+index+'price',product.price]);
 }
 return entries;
}
function hasRequiredCiInputs() {
 const path = CATALOG.find(item => item.id === sel.id);
 if (!path) return false;
 if (path.id === 'rng-dairy') return dairy.digester && dairyNumericFields.every(key=>Number.isFinite(dairy[key]));
 return requiredInventoryFields(path).every(key=>Number.isFinite(generic[key])) &&
  requiredAllocationEntries().every(([,value])=>value===true || Number.isFinite(value) || (typeof value==='string' && value.trim()!==''));
}
function syncInventoryRequired(path) {
 const required = new Set([...requiredInventoryFields(path),...requiredAllocationEntries().map(([key])=>key)]);
 for (const input of $('genericFields').querySelectorAll('[data-key]')) {
  const needed = required.has(input.dataset.key);
  input.closest('label')?.classList.toggle('ci-required',needed);
  if (needed) input.setAttribute('aria-required','true');
  else input.removeAttribute('aria-required');
 }
 $('allocationShared').classList.toggle('ci-required',required.has('allocationShared'));
}

function renderGFields() {
 const path = CATALOG.find(item => item.id === sel.id);
 const basis = productionBasis(path);
 const legacy = generic._mode === 'legacy';
 const fields = new Map([...gfields, ...gadvance, ...inventoryDetails, energyField].map(field => [field[0],field]));
 const field = key => {
  const [,label,help] = fields.get(key);
  return fieldHtml(key, label, key === 'volume' ? basis.unit + '/year' : help, generic);
 };
 const section = (title, keys, note = '') => `<section class="inventory-section"><h3>${title}</h3>${note ? `<p class="small muted">${note}</p>` : ''}<div class="grid">${keys.map(field).join('')}</div></section>`;
 $('productionFields').innerHTML = field('volume') + (usesMeasuredLhv(path) ? field('lhv') : '');
 $('inventoryStages').innerHTML =
  section('Upstream & feedstock transport', [legacy ? 'fixed' : 'upstream','km','kg','truckfactor'],
   legacy ? 'Combined net contribution from this plant’s saved inventory.'
    : 'Enter upstream supply emissions separately from the transport, energy and downstream stages below.') +
  section('Process energy', ['ng','gasfactor','kwh','grid'], 'Enter the applicable emission factors when the energy source is used.') +
  (legacy ? '' : section('Chemicals & fugitives', ['chemicals'], 'Optional · enter documented process emissions.')) +
  `<section class="inventory-section"><div class="row space"><h3>Co-product allocation</h3><button type="button" class="secondary" id="resetAllocation">Reset</button></div><p class="small muted">Allocate shared lifecycle emissions once. Fuel distribution and end use stay with the fuel.</p><div id="allocationFields"></div></section>` +
  (legacy ? '' : section('Fuel distribution', ['distribution'], 'Optional · finished fuel delivery.') +
   section('End use', ['endUse'], 'Optional · documented end-use emissions.'));
 $('resetAllocation').onclick = () => {
  allocation = newAllocation();
  markDirty();
  renderAllocationFields();
  updateAllocationPreview();
  syncInventoryRequired(path);
 };
 renderAllocationFields();
 updateAllocationPreview();
 syncInventoryRequired(path);
}

$('genericFields').addEventListener('input', event => {
 const control = event.target;
 const key = control.dataset.key;
 if (!key) return;
 if (key.startsWith('alloc')) editAllocation(control);
 else generic[key] = control.value === '' ? undefined : control.valueAsNumber;
 markDirty();
 updateAllocationPreview();
 syncInventoryRequired(CATALOG.find(item=>item.id===sel.id));
});

const exampleByFuel = {
 // Illustrative operating assumptions for testing each fuel family.
 ethanol: {volume: 30e6, ng: .30, kwh: .018, kg: .045, fixed: 25},
 bd: {volume: 15e6, ng: .045, kwh: .003, kg: .028, fixed: 18},
 rd: {volume: 30e6, ng: .025, kwh: .004, kg: .030, fixed: 20},
 saf: {volume: 20e6, ng: .13, kwh: .015, kg: .033, fixed: 24},
 rng: {volume: 150000, ng: .015, kwh: .008, kg: .20, fixed: 12},
 h2: {volume: 2e6, ng: 0, kwh: 55/120, km: 0, kg: 0, grid: 20, fixed: 2},
 other: {volume: 5e6, ng: .08, kwh: .012, kg: .08, fixed: 20},
 solid: {volume: 20e6, ng: .025, kwh: .006, kg: .078, fixed: 11}
};
const exampleOverrides = {
 'rd-brown-grease': {ng: .06, kwh: .009, kg: .039, fixed: 13},
 'biodiesel-brown-grease': {ng: .08, kwh: .006, kg: .037, fixed: 12},
 'ethanol-cassava': {ng: .27, kwh: .016},
 'ethanol-molasses': {ng: .25, kwh: .014, kg: .195},
 'rng-swine': {km: 0, kg: 0, fixed: -35},
 'rng-beef': {km: 20, kg: .35, fixed: -15},
 'rng-codigestion': {km: 35, kg: .27, fixed: -10},
 'h2-wind': {grid: 12},
 'h2-solar': {grid: 40},
 'h2-smr-ccs': {ng: .42, kwh: .017, grid: 400, fixed: 5},
 'saf-ft-cornstover': {ng: .02, kwh: .010, kg: .11},
 'saf-ft-agresidue': {ng: .02, kwh: .010, kg: .10},
 'msw-methanol': {kg: .15, ng: .04, fixed: 12},
 'marine-rd': {kg: .033, ng: .04, kwh: .006},
 'wood-pellets': {lhv: 17},
 'torrefied-pellets': {lhv: 21},
 'ag-briquettes': {lhv: 15},
 'pyrolysis-oil': {lhv: 16},
 'rlpg': {lhv: 46},
 'biobutanol': {lhv: 33}
};
$('resetInventory').onclick = () => {
 generic = {};
 allocation = newAllocation();
 dairy = {};
 dairyTab = 0;
 calculationError = null;
 markDirty();
 renderInputs();
};
$('genericExample').onclick = () => {
 if (sel.id === 'rng-dairy') { loadDairyExample(); return; }
 const path = CATALOG.find(item => item.id === sel.id);
 const study = pathwayInventory[path.id]?.find(item => Object.keys(item.inputs).length);
 const input = { km: 120, grid: 400, gasfactor: 63, truckfactor: 100, ...exampleByFuel[path.fuel], ...exampleOverrides[path.id] };
 if (path.status === 'existing-screening') {
  Object.assign(input, {volume: path.fuel === 'rng' ? 100000 : 1000000, ng: path.gas ?? 0, kwh: path.kwh ?? 0, km: 500, kg: path.kg ?? .05});
  input.fixed = path.ci - input.ng * input.gasfactor - input.kwh * input.grid - input.kg / 1000 * input.km * input.truckfactor;
 } else {
  Object.assign(input, study?.inputs);
 }
 generic = {...input, upstream:input.fixed, _mode:generic._mode || 'detailed', _example:true};
 markDirty();
 renderGFields();
};
function validateRouteInventory() {
 if (sel.id === 'rng-dairy') return;
 const path = CATALOG.find(item => item.id === sel.id);
 const error = validate(generic, requiredInventoryFields(path));
 if (error) throw Error(error);
 if (usesMeasuredLhv(path) && generic.lhv <= 0) throw inputError('Fuel lower heating value must be greater than zero.', 'lhv');
}
const DSEC=[{title:'Farm & herd',intro:'Enter average animal counts and manure volatile solids. These determine methane-generating potential.',fields:[['cows','Milking cows','Average head'],['dry','Non-milking cows','Average head'],['heifers','Heifers','Average head'],['vs','Milking-cow volatile solids','kg VS/animal/day'],['temp','Average annual temperature','°C'],['months','Reporting period','Months (1–12)']]},{title:'Baseline manure',intro:'Describe what happens to manure without the project. Avoided methane depends on this counterfactual.',fields:[['storage','Anaerobic manure share','% of volatile solids to anaerobic storage'],['mcf','Baseline methane conversion factor','Fraction 0–1; illustrative project-specific input'],['bo','Maximum methane production','m³ CH₄/kg volatile solids'],['dryvs','Other-cow volatile solids','kg VS/animal/day'],['heifervs','Heifer volatile solids','kg VS/animal/day']]},{title:'Digester & capture',intro:'Represent the on-farm methane treatment system and where methane is lost.',fields:[['digester','Digester','select'],['raw','Raw biogas produced','Standard cubic feet over reporting period'],['methane','Methane fraction of raw biogas','% CH₄'],['leak','Digester methane leakage','% of captured methane'],['vent','Uncontrolled vented biogas','Standard cubic feet'],['flare','Biogas flared','Standard cubic feet']]},{title:'Upgrading & delivery',intro:'Measure saleable gas. This is the denominator for gCO₂e per MJ of delivered RNG.',fields:[['injected','Injected biomethane','MMBtu HHV over reporting period'],['upgrading','Upgrading methane leakage','% of methane entering upgrader'],['pipe','Pipeline delivery distance','Miles'],['biogasToUpgrading','Raw biogas sent to upgrading','Standard cubic feet']]},{title:'Energy & utilities',intro:'Enter energy consumed by digestion and upgrading; these are added to project emissions.',fields:[['grid','Grid emission intensity','g CO₂e/kWh'],['electricity','Digester + upgrading electricity','kWh over reporting period'],['naturalGas','Natural gas consumed','MMBtu HHV over reporting period'],['diesel','Diesel consumed','US gallons over reporting period']]},{title:'Review',intro:'Check each input before calculating. A negative CI is not assumed in advance.',fields:[]}];
const dairyNumericFields = DSEC.flatMap(section=>section.fields.map(([key])=>key)).filter(key=>key!=='digester');
function renderDairy(){const sections=DSEC;$('dairyTabs').innerHTML=sections.map((s,i)=>`<button type="button" data-dairy-tab="${i}" class="${i===dairyTab?'active':''}">${i+1}. ${s.title}</button>`).join('');const sec=sections[dairyTab];$('dairyContent').innerHTML=`<h3>${sec.title}</h3><p class="muted">${sec.intro}</p>${dairyTab===5?reviewDairy():`<div class="grid">${sec.fields.map(([k,l,h])=>k==='digester'?`<label class="field"><span class="label">Digester type</span><select data-key="digester"><option value="">Choose digester type</option>${['Covered Lagoon','Enclosed Vessel','Complete Mix','Plug Flow','Fixed Film'].map(x=>`<option ${dairy.digester===x?'selected':''}>${x}</option>`).join('')}</select><small>Leakage should reflect project evidence</small></label>`:fieldHtml(k,l,h,dairy)).join('')}</div>`}`;
for (const input of $('dairyContent').querySelectorAll('[data-key]')) {
 input.setAttribute('aria-required','true');
 input.closest('label').classList.add('ci-required');
}
$('dairyPrev').disabled=dairyTab===0;$('dairyNext').textContent=dairyTab===5?'Review complete ✓':'Next section →';document.querySelectorAll('[data-dairy-tab]').forEach(b=>b.onclick=()=>{dairyTab=Number(b.dataset.dairyTab);renderDairy()});document.querySelectorAll('#dairyContent input,#dairyContent select').forEach(e=>e.addEventListener('input',()=>{dairy[e.dataset.key]=e.value===''?undefined:e.dataset.key==='digester'?e.value:Number(e.value);markDirty()}))}
function reviewDairy(){const sections=DSEC.slice(0,-1);return `<div class="grid">${sections.map(s=>`<div class="panel-soft"><strong>${s.title}</strong>${s.fields.map(([k,l,h])=>`<div class="row space small"><span class="muted">${l}</span><b>${dairy[k]===undefined?'Not supplied':esc(dairy[k])}</b></div>`).join('')}</div>`).join('')}</div>`}
$('dairyPrev').onclick=()=>{dairyTab=Math.max(0,dairyTab-1);renderDairy()};$('dairyNext').onclick=()=>{dairyTab=Math.min(5,dairyTab+1);renderDairy()};function loadDairyExample(){dairy={_example:true,cows:3351,dry:449,heifers:142,vs:7.0448,dryvs:3.80304,heifervs:3.43508,bo:.24,temp:19,months:5,storage:82.17,mcf:.75,digester:'Enclosed Vessel',raw:53421950,methane:58.53,leak:2,vent:0,flare:96167.25,biogasToUpgrading:51171132,upgrading:1.5,injected:28774.45,pipe:2376,grid:500.09,electricity:1299297.89,naturalGas:14961.75,diesel:0};markDirty();renderDairy()}
function validate(obj,fields){const missing=fields.filter(k=>typeof obj[k]!=='number'||!Number.isFinite(obj[k]));return missing.length?'Missing required input(s): '+missing.join(', '):''}
function genericGrossParts(v) {
 const legacy = v._mode === 'legacy';
 const has = (...keys) => keys.every(key => Number.isFinite(v[key]));
 return {
  Upstream: (legacy ? v.fixed : v.upstream) ?? null,
  'Process heat': v.ng === 0 ? 0 : has('ng','gasfactor') ? v.ng * v.gasfactor : null,
  Electricity: v.kwh === 0 ? 0 : has('kwh','grid') ? v.kwh * v.grid : null,
  Transport: !has('km','kg') ? null : v.km === 0 || v.kg === 0 ? 0 :
   has('truckfactor') ? v.kg / 1000 * v.km * v.truckfactor : null,
  'Chemicals and fugitives': legacy ? null : v.chemicals ?? null,
  'Fuel distribution': legacy ? null : v.distribution ?? null,
  'End use': legacy ? null : v.endUse ?? null
 };
}
function computeGeneric() {
 const p = CATALOG.find(x => x.id === sel.id);
 const v = generic;
 if (v.volume <= 0) throw inputError('Enter production greater than zero.', 'volume');
 const nonnegative = ['ng','kwh','km','grid','kg','gasfactor','truckfactor'];
 if (v._mode !== 'legacy') nonnegative.push('chemicals', 'distribution', 'endUse');
 const negative = nonnegative.find(key => v[key] < 0);
 if (negative) throw inputError('Enter zero or a positive value.', negative);
 const basis = productionBasis(p);
 const energyMj = v.volume * basis.energy;
 if (!Number.isFinite(energyMj)) throw inputError('Check the production and energy units.', 'volume');
 const gross = genericGrossParts(v);
 const applied = allocateCivanta(v._mode === 'legacy' ? newAllocation() : allocation, energyMj, gross);
 const parts = applyCivantaAllocation(gross, applied);
 const ci = Object.values(parts).reduce((total, x) => total + x, 0);
 if (!Number.isFinite(ci)) throw inputError('Check the magnitude of your inventory values.', 'volume');
 return {kind:'generic', ci, parts, gross, allocation:applied, energyMj, volume:v.volume,
  unit:basis.unit, path:{...p,energy:basis.energy}, gas:v.ng,kwh:v.kwh, grid:v.grid, km:v.km,
  kg:v.kg, gasfactor:v.gasfactor, truckfactor:v.truckfactor};
}
function computeDairy(){let err=validate(dairy,dairyNumericFields);if(err)throw Error(err);if(!dairy.digester)throw inputError('Select digester type.', 'digester');const d=dairy;
 if (d.months<1 || d.months>12) throw inputError('Enter a reporting period from 1 to 12 months.', 'months');
 if (d.injected<=0) throw inputError('Enter injected gas greater than zero.', 'injected');
 const negative = ['cows','dry','heifers','vs','dryvs','heifervs','bo','raw','vent','flare','pipe','grid','electricity','naturalGas','diesel','biogasToUpgrading'].find(key => d[key]<0);
 if (negative) throw inputError('Enter zero or a positive value.', negative);
 const percent = ['storage','methane','leak','upgrading'].find(key => d[key]<0 || d[key]>100);
 if (percent) throw inputError('Enter a percentage from 0 to 100.', percent);
 if (d.mcf<0 || d.mcf>1) throw inputError('Enter a fraction from 0 to 1.', 'mcf');
 if (d.biogasToUpgrading>d.raw) throw inputError('Biogas sent to upgrading cannot exceed total raw biogas.', 'biogasToUpgrading');
 if (d.vent+d.flare>d.raw) throw inputError('Vented and flared gas cannot exceed total raw biogas.', 'flare');
 const days=d.months/12*365;const vs=(d.cows*d.vs+d.dry*d.dryvs+d.heifers*d.heifervs)*days;const baselineCH4=vs*d.bo*(d.storage/100)*d.mcf*.716/1000;const capturedCH4=d.raw*(d.methane/100)*.0192/1000;const leakCH4=capturedCH4*d.leak/100;const upgraderCH4=d.biogasToUpgrading*(d.methane/100)*.0192/1000*d.upgrading/100;const ventCH4=d.vent*(d.methane/100)*.0192/1000;const flareCH4=d.flare*(d.methane/100)*.0192/1000*.02;const losses=leakCH4+upgraderCH4+ventCH4+flareCH4;const avoidedCH4= Math.max(0,Math.min(baselineCH4,capturedCH4-losses));const mj=d.injected*1055.05585*(930/1030);const parts={'Avoided baseline methane':-avoidedCH4*1000000*25/mj,'Methane leakage / slip':losses*1000000*25/mj,'Grid electricity':d.electricity*d.grid/mj,'Process natural gas':d.naturalGas*1055.05585*.903*63/mj,'Diesel use':d.diesel*12308/mj,'Pipeline delivery':d.pipe*.0038875};return {kind:'dairy',ci:Object.values(parts).reduce((a,b)=>a+b,0),parts,energyMj:mj,volume:d.injected,unit:'MMBtu HHV',path:CATALOG.find(x=>x.id===sel.id),baselineCH4,avoidedCH4,losses,mj,inputs:{...d}}}
function inputError(message, field) {
 return Object.assign(new Error(message), {field});
}
// Saved with every calculation in the member's history. Change it whenever
// computeGeneric or computeDairy would give a different result for the same inputs.
const CIVANTA_ENGINE_VERSION = 'civanta-frontend-2026-11';

if (typeof window !== 'undefined' && new URLSearchParams(window.location?.search).get('audit') === '1') {
 window.civantaEngineAudit = {
  version: CIVANTA_ENGINE_VERSION,
  run(test, allocationState, levers) {
   sel = {fuel: '', feed: '', tech: '', id: test.pathwayId};
   let baseline;
   if (test.kind === 'dairy') {
    dairy = {...test.inputs, digester: test.digester};
    baseline = computeDairy();
   } else {
    generic = {...test.inputs, _mode: 'detailed'};
    allocation = allocationState;
    baseline = computeGeneric();
   }
   return Object.values(levers).some(value => value > 0) ? scenarioFor(baseline, levers).ci : baseline.ci;
  },
 };
}
let calculationError;
$('runButton').onclick = () => {
 calculationError = null;
 try {
  validateRouteInventory();
  baseline = sel.id === 'rng-dairy' ? computeDairy() : computeGeneric();
  optim = {power:0,rail:0,heat:0,tuning:0,leak:0,demand:0,gas:0};
  optimizationTarget = NaN;
  $('validation').textContent = '';
  $('runResult').classList.remove('hide');
  renderRunResult();
 } catch (error) {
  calculationError = error;
  baseline = null;
  $('runResult').classList.add('hide');
 } finally {
  syncResultActions();
 }
};
function bars(container,parts){const max=Math.max(1,...Object.values(parts).map(v=>Math.abs(v)));$(container).innerHTML=Object.entries(parts).map(([name,value])=>`<div class="chartrow"><span>${esc(name)}</span><div class="track"><div class="bar ${value<0?'neg':''}" style="width:${100*Math.abs(value)/max}%"></div></div><b style="text-align:right">${fmt(value,1)}</b></div>`).join('')}
function renderRunResult(){if(!baseline)return;const b=baseline;$('runResultContent').innerHTML=`<div style="margin-top:22px" class="grid"><div class="metric"><span class="small muted">Modeled baseline CI</span><strong>${fmt(b.ci,2)}</strong><small>g CO₂e/MJ · ${(b.kind==='dairy'?b.inputs:generic)._example?'illustrative inputs':'screening output'}</small></div><div class="metric"><span class="small muted">${b.kind==='dairy'?'Farm gas delivered':'Annual fuel production'}</span><strong>${fmt(b.volume,0)}</strong><small>${b.unit} ${b.kind==='dairy'?'during reporting period':'per year'}</small></div></div><h3 style="margin-top:23px">Where the emissions come from</h3><div id="runBars"></div><div class="callout">${b.kind==='dairy'?'Negative bars represent modeled avoided manure methane. Positive bars represent project losses, energy use and delivery. This demonstration simplifies the official CARB approach.':'The upstream component uses the separate net lifecycle contribution entered in the form. Check its model boundary and avoid counting utilities or transport twice.'}</div>`;bars('runBars',b.parts)}
$('goOptimize').onclick = () => show(2);
function scenario(o){return scenarioFor(baseline,o)}
function scenarioFor(b,o){if(!b)return null;let parts={...b.parts};if(b.kind==='generic'){parts=applyCivantaAllocation({...b.gross, Electricity:b.gross.Electricity*(1-o.power/100),Transport:b.gross.Transport*(1-o.rail/100*.78),'Process heat':b.gross['Process heat']*(1-o.heat/100)*(1-o.tuning/100)},b.allocation)}else{parts['Methane leakage / slip']=b.parts['Methane leakage / slip']*(1-o.leak/100);parts['Grid electricity']=b.parts['Grid electricity']*(1-o.power/100);parts['Process natural gas']=b.parts['Process natural gas']*(1-o.gas/100);parts['Pipeline delivery']=b.parts['Pipeline delivery']*(1-o.demand/100)}return {parts,ci:Object.values(parts).reduce((a,v)=>a+v,0)}}
const OPT_LABELS={power:'Renewable electricity',rail:'Rail freight',heat:'Heat recovery',tuning:'Process tuning',leak:'Methane leak control',gas:'Thermal efficiency',demand:'Pipeline distance'};

/* V15 economics — all monetary inputs are explicit editable assumptions. */
const exampleEconomics={price:75,share:0,eer:1,life:15,rate:8,ppa:.015,gasPrice:.004,railCost:0,pipeCost:0,
 cost:{power:{capex:0,opex:0},rail:{capex:400000,opex:20000},heat:{capex:600000,opex:10000},tuning:{capex:150000,opex:5000},leak:{capex:300000,opex:10000},gas:{capex:600000,opex:10000},demand:{capex:0,opex:0}}};
function emptyEconomics() {
 const {cost, ...assumptions} = exampleEconomics;
 return {
  ...Object.fromEntries(Object.keys(assumptions).map(key => [key,null])),
  cost: Object.fromEntries(Object.keys(cost).map(key => [key,{capex:null,opex:null}]))
 };
}
const econ = emptyEconomics();
function numberEntry(id) {
 const value = $(id)?.value;
 return value == null || value === '' ? NaN : Number(value);
}
const dollars=n=>Number.isFinite(n)?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n):'—';
const hasScreeningLcfs = fuel => ['rd','bd','ethanol','rng'].includes(fuel);
function econAnnualMj(){const b=baseline;return b.kind==='dairy'?b.energyMj*12/b.inputs.months:b.energyMj;}
function economicScenario(o){return economicScenarioFor(baseline,o,econ)}
function economicScenarioFor(b,o,econ){const sc=scenarioFor(b,o),mj=b.kind==='dairy'?b.energyMj*12/b.inputs.months:b.energyMj,annual=Object.entries(econ.cost).reduce((a,[key,c])=>{const fraction=(o[key]||0)/100;if(!fraction)return a;return {capex:a.capex+c.capex*fraction, fixed:a.fixed+c.opex*fraction}}, {capex:0,fixed:0});
 const cf=econ.rate===0?1/econ.life:(econ.rate/100)/(1-Math.pow(1+econ.rate/100,-econ.life));
 const fractionPower=o.power/100;
 // Generic electricity per MJ and dairy metered power per annualized report year.
 const annualPower=b.kind==='dairy'?b.inputs.electricity*12/b.inputs.months:b.kwh*mj;
 const electricityCost=annualPower*fractionPower*econ.ppa;
 const gasReduction=b.kind==='dairy'?b.inputs.naturalGas*1055.05585*12/b.inputs.months*(o.gas/100):b.gas*mj*(1-(1-o.heat/100)*(1-o.tuning/100));
 const gasSavings=gasReduction*econ.gasPrice;
 const transportChange=b.kind==='generic'?(b.kg/1000)*b.km*mj*(o.rail/100)*econ.railCost:0;
 const pipeChange=b.kind==='dairy'?b.inputs.pipe*mj*(o.demand/100)*econ.pipeCost:0;
 const annualCapex=annual.capex*cf,opex=annual.fixed+electricityCost+transportChange+pipeChange-gasSavings;
 const credit=hasScreeningLcfs(b.path.fuel) ? (b.ci-sc.ci)*(mj*econ.share/100)/1e6*econ.price : 0;
 const net=credit-annualCapex-opex, tonnes=(b.ci-sc.ci)*mj/1e6;
 return {sc,mj,capex:annual.capex,fixed:annual.fixed,electricityCost,gasSavings,annualCapex,opex,credit,net,tonnes,mac:tonnes>1e-9?(annualCapex+opex)/tonnes:null};}
function loadEconUI(){const farm=baseline?.kind==='dairy';const controls=farm?['leak','power','gas','demand']:['power','rail','heat','tuning'];
 const screeningLcfs = hasScreeningLcfs(baseline.path.fuel);
 for (const id of ['ecPrice','ecShare','ecEer']) $(id).closest('label').classList.toggle('hide', !screeningLcfs);
 $('ecRailCost').closest('label').hidden = farm;
 $('ecPipeCost').closest('label').hidden = !farm;
 for(const k of ['price','share','eer','life','rate','ppa','gasPrice','railCost','pipeCost']){const el=document.querySelector(`[data-ec="${k}"]`);if(el){el.value=econ[k] ?? '';el.oninput=()=>{econ[k]=el.value===''?NaN:Number(el.value);updateEcon();}}}
 $('econMeasures').innerHTML=controls.map(k=>`<tr><th scope="row">${OPT_LABELS[k]}</th><td><input type="number" min="0" step="1000" aria-label="${OPT_LABELS[k]} capital cost" data-ec-cost="${k}:capex" value="${econ.cost[k].capex ?? ''}"></td><td><input type="number" step="1000" aria-label="${OPT_LABELS[k]} annual O&M" data-ec-cost="${k}:opex" value="${econ.cost[k].opex ?? ''}"></td><td id="econPct-${k}">0%</td></tr>`).join('');
 document.querySelectorAll('[data-ec-cost]').forEach(el=>el.oninput=()=>{const [k,f]=el.dataset.ecCost.split(':');econ.cost[k][f]=el.value===''?NaN:Number(el.value);updateEcon()});updateEcon();}
function setEconomics(values) {
 Object.assign(econ,values);
 $('confirmEconomics').checked = false;
 loadEconUI();
}
$('econReset').onclick = () => setEconomics(emptyEconomics());
$('econExample').onclick = () => {
 setEconomics(structuredClone(exampleEconomics));
 $('ecLife').closest('details').open = true;
};
function creditActions(prefix,heading,run) {
 return `<div class="credit-toolbar">
  <h3>${heading}</h3>
  <span class="sr-only" id="${prefix}Badge" role="status">${run?'Needs inputs':'Not modelled'}</span>
  <div class="credit-actions">
   ${run?`<button class="secondary" type="button" id="${prefix}Reset">Reset</button>
   <button class="secondary" type="button" id="${prefix}Example">Load example</button>
   <button class="primary" type="button" id="${run}" disabled>Run</button>`:''}
  </div>
  ${run?`<small class="muted credit-action-status" id="${prefix}ExampleStatus" role="status"></small>`:''}
 </div>`;
}
function clearCreditFields(panel) {
 for (const field of panel.querySelectorAll('input, select')) {
  if (field.type==='checkbox') field.checked = false;
  else field.value = '';
 }
}
function bindCreditReset(prefix, panel) {
 $(prefix+'Reset').onclick = () => {
  clearCreditFields(panel);
  panel.querySelector('input, select').dispatchEvent(new Event('input',{bubbles:true}));
 };
}
function creditState(prefix, state = 'Needs inputs') {
 const badge = $(prefix+'Badge');
 badge.textContent = state;
 if (state === 'Needs inputs') badge.dataset.example = '';
 if (state === 'Example inputs') badge.dataset.example = 'true';
 syncCreditRunButtons();
}
function syncCreditRunButtons() {
 if (!baseline) return;
 const validNumbers = (...ids) => ids.every(id => Number.isFinite(numberEntry(id)));
 const lcfsRun = $('estimate');
 if (lcfsRun) {
  if ($('lcfsUse')) {
   const config = documentedLcfs[baseline.path.fuel];
   lcfsRun.disabled = !config?.uses[numberEntry('lcfsUse')] ||
    !validNumbers('lcfsApprovedCi','lcfsQuantity','lcfsprice') ||
    numberEntry('lcfsQuantity')<0 || numberEntry('lcfsprice')<0 ||
    !($('lcfsBadge').dataset.example || $('lconfirm').checked && $('lcfsPathCode').value.trim());
  } else {
   lcfsRun.disabled = !validNumbers('bench','share','lcfsprice','eer') ||
    numberEntry('bench')<0 || numberEntry('share')<0 || numberEntry('share')>100 ||
    numberEntry('lcfsprice')<0 || numberEntry('eer')<=0;
  }
 }
 const zRun = $('z45Run');
 if (zRun) {
  const animal = ['Dairy manure','Swine manure','Beef cattle manure'].includes(baseline.path.feedstock);
  const rates = [numberEntry('z45BaseRate'),numberEntry('z45OptRate')];
  zRun.disabled = !validNumbers('z45Qty','z45BaseRate','z45OptRate') || numberEntry('z45Qty')<=0 ||
   !['yes','no'].includes($('z45Pwa').value) || rates.some(rate=>rate>50 || !animal && rate<0) ||
   !($('z45Badge').dataset.example || ['z45Domestic','z45Origin','z45Reg','z45Sale'].every(id=>$(id).checked));
 }
}
let rinExampleLoaded = false;
const creditExampleMessage = 'Illustrative inputs loaded. Select Run to preview.';
$('rinActions').innerHTML = creditActions('rin','EPA RINs','rinRun');
bindCreditReset('rin',$('rinSupported'));

function updateRinEconomics(run = false){
 const b=baseline,root=$('rinEconomicsPanel');if(!b||!root)return;
 $('rinExampleStatus').textContent = '';
 const fuel=b.path.fuel, supported=['rd','bd','ethanol','rng'].includes(fuel),rng=fuel==='rng';
 $('rinNotSupported').classList.toggle('hide',supported);
 $('rinSupported').classList.toggle('hide',!supported);
 $('rinMethod').hidden = !supported;
 for (const action of $('rinActions').querySelectorAll('.credit-actions button:not([data-download-excel])')) {
  action.hidden = !supported;
 }
 if(rinLastPath!==b.path.id){
  rinLastPath=b.path.id;
  rinExampleLoaded = false;
  clearCreditFields($('rinSupported'));
 }
 if (!supported) {
  $('rinNotSupported').textContent = 'CIVanta has no RIN estimate for this fuel category. Use an EPA-approved pathway to establish RIN eligibility.';
  return;
 }
 const year=numberEntry('rinYear'),share=numberEntry('rinShare'),ev=numberEntry('rinEv'),price=numberEntry('rinPrice'),dcode=$('rinDcode').value;
 $('rinEv').disabled=rng;$('rinEv').title=rng?'RNG uses 77,000 Btu LHV per RIN, rather than the liquid-fuel EV':'Verify approved pathway equivalence value';
 const annualMj=b.kind==='dairy'?b.energyMj*12/b.inputs.months:b.energyMj;
 const volume=rng?annualMj/(77000*0.00105505585262):b.volume;
 $('rinVolume').textContent=rng?`${fmt(annualMj,0)} MJ LHV/year`:`${fmt(volume,0)} US gallons/year`;
 let error='';
 if(![2026,2027].includes(year))error='Select a compliance year.';
 else if(!Number.isFinite(share)||share<0||share>100||!Number.isFinite(price)||price<0)error='Enter an eligible share of 0–100% and a nonnegative RIN price.';
 else if(!rng&&(!Number.isFinite(ev)||ev<=0||ev>5))error='Enter an EPA-approved equivalence value from 0 to 5.';
 else if(!Number.isFinite(volume)||volume<=0)error='A positive annual production quantity is required.';
 if(!error&&fuel==='rd'&&year===2026&&Math.abs(ev-1.7)<0.001&&b.path.energy>0&&b.path.energy/0.00105505585262<123500)error='The 2026 RD EV 1.7 presupposes a qualifying LHV; verify the applicable EPA factor.';
 $('rinRun').disabled = Boolean(error) || (!dcode && !rinExampleLoaded);
 if (!run) {
  $('rinError').textContent = '';
  $('rinStats').replaceChildren();
  $('rinInterpret').textContent = 'Enter your inputs, then select Run.';
  return;
 }
 $('rinError').textContent=error;
 if(error){$('rinStats').innerHTML='';$('rinInterpret').textContent='Review the inputs before estimating RIN quantities.';return;}
 const rins=rng?volume*share/100:volume*share/100*ev;
 const gross=rins*price,confirmed=$('rinConfirmed').checked,approved=!!dcode&&confirmed;
 $('rinStats').innerHTML=`<div class="rin-stat"><span>Baseline estimated RINs</span><strong>${fmt(rins,0)}</strong><small>${approved?'User-confirmed inputs':'Conditional · eligibility unconfirmed'}</small></div><div class="rin-stat"><span>Optimized estimated RINs</span><strong>${fmt(rins,0)}</strong><small>Same eligible production assumption</small></div><div class="rin-stat"><span>Assumed gross annual RIN value</span><strong>${dollars(gross)}</strong><small>${approved?'Conditional gross value':'Not confirmed or monetizable'}</small></div>`;
 $('rinInterpret').innerHTML=`<strong>Incremental RIN revenue from CI-only optimization: $0/year.</strong> The same eligible volume ${rng?'and LHV-energy basis':`and equivalence value (${fmt(ev,2)})`} gives the same RIN count before and after the sensitivity changes. ${dcode?'Selected D-code: '+dcode+'.':'Choose the approved D-code; this cannot be inferred from fuel type alone.'} ${confirmed?'You have checked the EPA eligibility attestation.':'Check the eligibility attestation only after verifying the EPA-approved pathway.'} The displayed gross RIN value is not added to the incremental LCFS net benefit. Prices are illustrative, not live.`;
}
$('rinExample').onclick = () => {
 if (!baseline) return;
 const fuel = baseline.path.fuel;
 const example = {rinConfirmed:false,rinDcode:'',rinYear:'2026',rinShare:'50',rinPrice:'1'};
 if (fuel !== 'rng') example.rinEv = fuel === 'bd' || fuel === 'rd' ? '1.5' : '1';
 for (const [id,value] of Object.entries(example)) {
  const control = $(id);
  if (control.type === 'checkbox') control.checked = value;
  else control.value = value;
 }
 for (const id of Object.keys(example)) $(id).dispatchEvent(new Event('input',{bubbles:true}));
 rinExampleLoaded = true;
 updateRinEconomics();
 $('rinExampleStatus').textContent = creditExampleMessage;
 creditState('rin','Example inputs');
};
$('rinRun').onclick = () => updateRinEconomics(true);
['rinYear','rinDcode','rinEv','rinShare','rinPrice','rinConfirmed'].forEach(id=>$(id).addEventListener('input',()=>{rinExampleLoaded=false;updateRinEconomics()} ));

/* ===== V21 redesign: decision-first optimization & credit planning ===== */
let rinLastPath='';let responseKey='';const Z45_ELIGIBLE=['bd','rd','ethanol','saf','rng','h2'];
const ZERO={power:0,rail:0,heat:0,tuning:0,leak:0,demand:0,gas:0};
const only=(k,v)=>({...ZERO,[k]:v});
const C={base:'#5f7d8c',opt:'#0e8a6b',pale:'#cfe3dc',target:'#b26a00',grid:'#eef3f1',axis:'#b9c9c3',text:'#61747b',ink:'#152c35'};
const cwOf=id=>{const e=$(id);const w=e?e.clientWidth:0;return Math.max(300,Math.min(1120,w||1000))};
const narrow=w=>w<620;
const SVG=(w,h,inner,label)=>`<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${inner}</svg>`;
const TXT=(x,y,s,o={})=>`<text x="${x}" y="${y}" font-size="${o.size||12}" fill="${o.fill||C.text}" text-anchor="${o.anchor||'start'}"${o.weight?` font-weight="${o.weight}"`:''}${o.tr?` transform="${o.tr}"`:''}>${esc(s)}</text>`;
const signed=(v,d=2)=>(v>0?'−':v<0?'+':'')+fmt(Math.abs(v),d);   // a positive reduction reads as a minus on CI
function niceTicks(lo,hi,n=5){const span=hi-lo||1,raw=span/n,mag=Math.pow(10,Math.floor(Math.log10(raw))),norm=raw/mag;
 const step=(norm<1.5?1:norm<3?2:norm<7?5:10)*mag,start=Math.ceil(lo/step)*step,out=[];
 for(let v=start;v<=hi+step*1e-6;v+=step)out.push(Math.abs(v)<step*1e-6?0:v);return out}
const optControls=()=>baseline?.kind==='dairy'?['leak','power','gas','demand']:['power','rail','heat','tuning'];
const LEVER_HELP={power:'Replace a share of grid electricity with zero-emission supply.',rail:'Move a share of modelled truck haul to rail.',heat:'Cut thermal energy needed in production.',tuning:'Reduce additional gas use through operational tuning.',leak:'Reduce methane lost from digestion and upgrading.',gas:'Reduce natural gas used in the digester and upgrading.',demand:'Shorten modelled delivery distance; real routes may be fixed.'};
let optTab='impact';
let curveFocus='all',heatX='',heatY='';

/* ---------- Step 3 ---------- */
function renderOptimizer(){const b=baseline;if(!b)return;const farm=b.kind==='dairy',controls=optControls();
 if(!controls.includes(responseKey))responseKey=controls[0];
 $('ciTarget').value=Number.isFinite(optimizationTarget)?optimizationTarget:'';
 $('optControls').innerHTML=controls.map(k=>`<div class="lever"><div class="lever-top"><b>${esc(OPT_LABELS[k])}</b><span class="lever-pct" id="out-${k}">${optim[k]}%</span></div>
  <input id="slider-${k}" data-opt="${k}" type="range" min="0" max="100" step="5" value="${optim[k]}" aria-label="${esc(OPT_LABELS[k])} improvement percentage">
  <div class="lever-bar"><i id="bar-${k}" style="width:0%"></i></div>
  <div class="lever-foot"><span>Reduction at this setting</span><b id="impact-${k}">—</b></div>
  <p class="lever-help">${esc(LEVER_HELP[k]||'')}</p></div>`).join('');
 document.querySelectorAll('[data-opt]').forEach(x=>x.addEventListener('input',()=>{optim[x.dataset.opt]=Number(x.value);updateOpt()}));
 $('ciTarget').oninput=()=>{optimizationTarget=$('ciTarget').value.trim()===''?NaN:Number($('ciTarget').value);updateOpt()};
 document.querySelectorAll('[data-preset]').forEach(x=>x.onclick=()=>{for(const k of Object.keys(optim))optim[k]=0;
  const p=x.dataset.preset;if(p==='power')optim[controls.includes('power')?'power':controls[0]]=100;
  else if(p==='balanced')controls.forEach(k=>optim[k]=50);else controls.forEach(k=>optim[k]=100);syncSliders();updateOpt()});
 $('resetOpt2').onclick = () => {
  optim = {...ZERO};
  optimizationTarget = NaN;
  $('ciTarget').value = '';
  syncSliders();
  updateOpt();
 };
 const tabs = [...document.querySelectorAll('#optTabs button')];
 function syncOptimizerTab() {
  for (const tab of tabs) {
   const current = tab.dataset.pane === optTab;
   tab.classList.toggle('active',current);
   tab.setAttribute('aria-selected',String(current));
   $('pane-'+tab.dataset.pane).hidden = !current;
  }
 }
 if (!tabs.some(tab=>tab.dataset.pane===optTab)) optTab='impact';
 tabs.forEach(tab=>tab.onclick=()=>{optTab=tab.dataset.pane;syncOptimizerTab();drawActivePane()});
 syncOptimizerTab();
 loadEconUI();updateOpt()}

const displayedValues = new WeakMap();
const countFrames = new WeakMap();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function countTo(element, target, decimals){
 if(!element)return;
 cancelAnimationFrame(countFrames.get(element) || 0);
 const from=displayedValues.get(element);
 if(!Number.isFinite(from)||Math.abs(target-from)<0.005||reducedMotion.matches){
  displayedValues.set(element,target);
  element.textContent=fmt(target,decimals);
  return;
 }
 const started=performance.now();
 function frame(now){
  const progress=Math.min(1,Math.max(0,(now-started)/180));
  const value=from+(target-from)*(1-Math.pow(1-progress,3));
  displayedValues.set(element,value);
  element.textContent=fmt(value,decimals);
  if(progress<1)countFrames.set(element,requestAnimationFrame(frame));
 }
 countFrames.set(element,requestAnimationFrame(frame));
}
let redrawFrame=0;
let chartWidth=0;
new ResizeObserver(([entry])=>{
 const width=entry.contentRect.width;
 if(width<=0||Math.abs(width-chartWidth)<1)return;
 chartWidth=width;
 cancelAnimationFrame(redrawFrame);
 redrawFrame=requestAnimationFrame(()=>{
  if(!baseline||stage!==2)return;
  drawActivePane();
  drawCiScale(baseline,scenario(optim),optimizationTarget);
 });
}).observe($('view2'));
function syncSliders(){optControls().forEach(k=>{const s=$('slider-'+k);if(s)s.value=optim[k]})}
function applyLever(k,v){optim[k]=v;syncSliders();updateOpt()}

let updateFrame=0;
function updateOpt(){
 if(updateFrame)return;
 updateFrame=requestAnimationFrame(()=>{
  updateFrame=0;
  if(stage===2)renderOptimization();
 });
}
function renderOptimization(){const b=baseline;if(!b)return;const o=scenario(optim),delta=b.ci-o.ci,controls=optControls();
 const eff=controls.map(k=>({k,label:OPT_LABELS[k],now:b.ci-scenario(only(k,optim[k])).ci,full:b.ci-scenario(only(k,100)).ci}));
 const maxFull=Math.max(1e-9,...eff.map(e=>Math.abs(e.full)));
 for(const e of eff){const el=$('out-'+e.k);if(el)el.textContent=optim[e.k]+'%';
  const im=$('impact-'+e.k);if(im){im.textContent=Math.abs(e.now)<1e-5?'none yet':signed(e.now,2)+' g/MJ';im.classList.toggle('none',Math.abs(e.now)<1e-5)}
  const bar=$('bar-'+e.k);if(bar)bar.style.width=(Math.abs(e.now)/maxFull*100).toFixed(1)+'%'}
 // result bar
 $('rbBase').textContent=fmt(b.ci,2);countTo($('rbOpt'),o.ci,2);
 const chip=$('rbDelta'),pct=b.ci!==0?Math.abs(delta/b.ci*100):0;
 const hasTarget = Number.isFinite(optimizationTarget);
 const met = hasTarget && o.ci <= optimizationTarget;
 chip.textContent=delta>1e-5?(`${signed(delta,2)} g/MJ`+(b.ci!==0?` · ${fmt(pct,0)}% lower`:'')):
  delta<-1e-5?`+${fmt(-delta,2)} g/MJ higher`:'No change yet';
 chip.classList.toggle('has-reduction',delta>1e-5);
 chip.classList.toggle('has-increase',delta<-1e-5);
 const need=hasTarget?b.ci-optimizationTarget:0;
 const prog=met?100:need>0?Math.max(0,Math.min(100,delta/need*100)):0;
 const targetState=$('rbTargetState');
 targetState.textContent=met?'Target reached':hasTarget?`${fmt(o.ci-optimizationTarget,2)} g/MJ above target`:'Enter a target to track progress';
 targetState.classList.toggle('is-met',met);
 const meter=$('rbMeter');
 meter.hidden=!hasTarget;
 meter.firstElementChild.style.width=prog.toFixed(1)+'%';
 meter.setAttribute('aria-valuenow',String(Math.round(prog)));
 syncValueStat();
 drawCiScale(b,o,optimizationTarget);
 drawActivePane();}

function syncValueStat(){const vw=$('rbValWrap');if(!vw||!baseline)return;
 const d=baseline.ci-scenario(optim).ci;
 if(hasScreeningLcfs(baseline.path.fuel)&&econ.share>0&&econ.share<=100&&Number.isFinite(econ.price)&&econ.price>=0&&d>1e-5){const z=economicScenario(optim);vw.hidden=false;
  $('rbVal').textContent=dollars(z.credit);$('rbValSub').textContent=`per year at ${fmt(econ.share,0)}% eligible`}
 else vw.hidden=true}
function drawActivePane(){const b=baseline;if(!b)return;const o=scenario(optim),controls=optControls();
 const eff=controls.map(k=>({k,label:OPT_LABELS[k],now:b.ci-scenario(only(k,optim[k])).ci,full:b.ci-scenario(only(k,100)).ci}));
 if(optTab==='impact')drawTornado(b,eff);
 else if(optTab==='range'){drawCurves(b,controls);drawHeatmap(b,controls);}
 else if(optTab==='stages')drawStages(b,o);
 else updateEcon();}

/* --- the CI scale: baseline, scenario and target on one axis --- */
$('ciScaleDetails').addEventListener('toggle', () => {
 if (baseline && $('ciScaleDetails').open) drawCiScale(baseline,scenario(optim),optimizationTarget);
});
function drawCiScale(b,o,target){if (!$('ciScaleDetails').open) return;const W=cwOf('ciScale'),H=92,L=16,R=16,nw=narrow(W);
 const vals=[b.ci,o.ci,0].concat(Number.isFinite(target)?[target]:[]);
 let lo=Math.min(...vals),hi=Math.max(...vals);const pad=Math.max((hi-lo)*.18,Math.abs(hi)*.06,.5);lo-=pad;hi+=pad;
 const x=v=>L+(W-L-R)*((v-lo)/(hi-lo||1)),axisY=50;
 const pill=(cx,cy,txt,fill,ink,bold)=>{const w=txt.length*6.6+18,x0=Math.max(2,Math.min(W-w-2,cx-w/2));
  return `<rect x="${x0}" y="${cy-13}" width="${w}" height="21" rx="10.5" fill="${fill}"/>`+TXT(x0+w/2,cy+2,txt,{anchor:'middle',size:11.5,fill:ink,weight:bold?800:700})};

 const tgtLow=Number.isFinite(target)&&Math.abs(x(target)-x(o.ci))<150&&!nw;
 let g=`<defs><linearGradient id="ciTrack" x1="0" x2="1"><stop offset="0" stop-color="#2FB7C9" stop-opacity=".55"/><stop offset=".55" stop-color="#cfd9d6" stop-opacity=".5"/><stop offset="1" stop-color="#d99a4e" stop-opacity=".6"/></linearGradient></defs>`;
 if(Number.isFinite(target)&&x(target)>L)g+=`<rect x="${L}" y="${axisY-13}" width="${Math.max(0,x(target)-L)}" height="26" rx="13" fill="#0e8a6b" opacity=".07"/>`;
 g+=`<rect x="${L}" y="${axisY-2}" width="${W-L-R}" height="4" rx="2" fill="url(#ciTrack)"/>`;
 niceTicks(lo,hi,narrow(W)?4:6).forEach(t=>{g+=`<line x1="${x(t)}" y1="${axisY+4}" x2="${x(t)}" y2="${axisY+9}" stroke="${C.axis}"/>`+TXT(x(t),axisY+24,fmt(t,0),{anchor:'middle',size:11})});
 const bx=x(b.ci),ox=x(o.ci);
 if(Math.abs(b.ci-o.ci)>1e-6)g+=`<rect x="${Math.min(bx,ox)}" y="${axisY-7}" width="${Math.abs(ox-bx)}" height="14" rx="7" fill="${C.opt}" opacity=".18"/>`;
 if(Number.isFinite(target)){const tx=x(target);
  g+=`<line x1="${tx}" y1="${tgtLow?axisY-9:16}" x2="${tx}" y2="${tgtLow?axisY+19:axisY+9}" stroke="${C.target}" stroke-width="2" stroke-dasharray="4 4"/>`+pill(tx,tgtLow?axisY+30:12,nw?'Target':'Target '+fmt(target,1),'#fdf1dd',C.target)}
 const same=Math.abs(bx-ox)<2,an=p=>p>W*.85?'end':p<70?'start':'middle';
 g+=`<circle cx="${bx}" cy="${axisY}" r="8" fill="white" stroke="${C.base}" stroke-width="3"/>`;
 g+=`<circle cx="${ox}" cy="${axisY}" r="9" fill="${C.opt}" stroke="white" stroke-width="3"/>`;
 if(nw){ /* the numbers already sit in the result bar above, so keep the axis uncluttered */ }
 else if(same)g+=pill(ox,axisY-22,'Baseline & scenario '+fmt(b.ci,2),'#e7edeb',C.base);
 else g+=pill(ox,axisY-22,'Scenario '+fmt(o.ci,2),'#0e8a6b','#ffffff',true);
 $('ciScale').innerHTML=SVG(W,H,g,'Carbon intensity scale showing baseline, scenario and target');
 const met=Number.isFinite(target)&&o.ci<=target;
 const gap=Number.isFinite(target)?o.ci-target:NaN;
 $('ciScaleNote').innerHTML=!Number.isFinite(target)?'Set a target to measure progress against it.'
  :met?`<strong style="color:#0a6a53">Target met.</strong> The scenario sits ${fmt(Math.abs(gap),2)} g/MJ below your target of ${fmt(target,2)}.`
  :`Still <strong>${fmt(gap,2)} g/MJ</strong> above the ${fmt(target,2)} target. All levers at 100% would reach ${fmt(scenario({...ZERO,...Object.fromEntries(optControls().map(k=>[k,100]))}).ci,2)}.`;}

/* --- ranked next actions, so the page is never blank on arrival --- */
/* --- tornado: full range vs current setting --- */
function drawTornado(b,eff){const rows=[...eff].sort((x,y)=>Math.abs(y.full)-Math.abs(x.full));
 const W=cwOf('tornadoChart'),n=narrow(W),rowH=n?62:54,H=rows.length*rowH+16,LBL=n?110:190,R=n?64:96,max=Math.max(1e-9,...rows.map(e=>Math.abs(e.full)));
 const w=v=>Math.abs(v)/max*(W-LBL-R);
 let g='';
 rows.forEach((e,i)=>{const y=i*rowH+10;
  g+=TXT(LBL-14,y+21,n&&e.label.length>14?e.label.slice(0,13)+'…':e.label,{anchor:'end',size:n?11.5:13,fill:C.ink,weight:700});
  g+=`<rect x="${LBL}" y="${y+6}" width="${Math.max(2,w(e.full))}" height="26" rx="6" fill="${C.pale}"/>`;
  g+=`<rect x="${LBL}" y="${y+6}" width="${Math.max(e.now>1e-6?3:0,w(e.now))}" height="26" rx="6" fill="${C.opt}"/>`;
  g+=TXT(LBL+Math.max(2,w(e.full))+10,y+24,signed(e.full,2),{size:12,fill:C.text,weight:700});
  if(Math.abs(e.now)>1e-5)g+=TXT(LBL+8,y+24,optim[e.k]+'%',{size:11,fill:'white',weight:800});
 });
 $('tornadoChart').innerHTML=SVG(W,H,g,'Reduction available from each lever and the amount currently applied');
 $('impactActions').innerHTML=rows.map(e=>`<button type="button" data-apply-graph="${e.k}" title="Apply ${esc(e.label)} at 100%">Test ${esc(e.label)} at 100% <span class="chart-action-value">(${signed(e.full,2)} g/MJ)</span></button>`).join('');
 $('impactActions').querySelectorAll('[data-apply-graph]').forEach(btn=>btn.onclick=()=>applyLever(btn.dataset.applyGraph,100));
 const best=rows[0],unused=rows.filter(e=>Math.abs(e.full)>1e-6&&optim[e.k]<100).slice(0,3);
 const allMax=b.ci-scenario({...ZERO,...Object.fromEntries(rows.map(e=>[e.k,100]))}).ci;
 const sum=rows.reduce((a,e)=>a+Math.max(0,e.full),0);
 const pairs=[];for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
  const a=stagesTouched(b,rows[i].k),c=stagesTouched(b,rows[j].k);
  if(a.some(x=>c.includes(x)))pairs.push([rows[i].label,rows[j].label])}
 $('impactReadout').innerHTML=`<b>${esc(best.label)}</b> has the longest reach: ${signed(best.full,2)} g/MJ at 100%. Every lever at 100% together reaches <b>${signed(allMax,2)} g/MJ</b>`+
  (sum>allMax*1.02&&pairs.length?`, less than the ${signed(sum,2)} the bars add up to, because ${esc(pairs[0][0].toLowerCase())} and ${esc(pairs[0][1].toLowerCase())} act on the same stage.`:'.')+
  (unused.length?` Headroom left on ${unused.map(e=>esc(e.label).toLowerCase()).join(', ')}.`:' Every lever is already at 100%.');}
function stagesTouched(b,k){const t=scenario(only(k,100));return Object.keys(b.parts).filter(s=>Math.abs((b.parts[s]||0)-(t.parts[s]||0))>1e-9)}

/* --- response curves: all levers on one chart --- */
function drawCurves(b,controls){
 if(curveFocus!=='all'&&!controls.includes(curveFocus))curveFocus='all';
 $('curveControls').innerHTML=[['all','All levers'],...controls.map(k=>[k,OPT_LABELS[k]])].map(([k,l])=>`<button type="button" data-focus="${k}" class="${curveFocus===k?'active':''}" aria-pressed="${curveFocus===k}">${esc(l)}</button>`).join('');
 $('curveControls').querySelectorAll('[data-focus]').forEach(btn=>btn.onclick=()=>{curveFocus=btn.dataset.focus;drawCurves(b,controls)});
 const W=cwOf('responseCurve'),n=narrow(W),H=n?300:330,L=n?44:62,R=n?96:140,T=18,B=48;
 const steps=[0,10,20,30,40,50,60,70,80,90,100];
 const series=controls.map(k=>({k,label:OPT_LABELS[k],pts:steps.map(v=>({x:v,y:scenario(only(k,v)).ci}))}));
 const all=series.flatMap(s=>s.pts.map(p=>p.y)).concat([b.ci],Number.isFinite(optimizationTarget)?[optimizationTarget]:[]);
 let lo=Math.min(...all),hi=Math.max(...all);const pad=Math.max((hi-lo)*.12,.4);lo-=pad;hi+=pad;
 const x=v=>L+(W-L-R)*(v/100),y=v=>T+(H-T-B)*(1-(v-lo)/(hi-lo||1));
 let g='';
 niceTicks(lo,hi,5).forEach(t=>{g+=`<line x1="${L}" y1="${y(t)}" x2="${W-R}" y2="${y(t)}" stroke="${C.grid}"/>`+TXT(L-10,y(t)+4,fmt(t,0),{anchor:'end',size:11})});
 [0,25,50,75,100].forEach(v=>{g+=`<line x1="${x(v)}" y1="${T}" x2="${x(v)}" y2="${H-B}" stroke="${C.grid}"/>`+TXT(x(v),H-B+20,v+'%',{anchor:'middle',size:11})});
 if(Number.isFinite(optimizationTarget)&&optimizationTarget>lo&&optimizationTarget<hi)
  g+=`<line x1="${L}" y1="${y(optimizationTarget)}" x2="${W-R}" y2="${y(optimizationTarget)}" stroke="${C.target}" stroke-width="2" stroke-dasharray="5 5"/>`+TXT(W-R+8,y(optimizationTarget)+4,'Target',{size:11,fill:C.target,weight:700});
 const hues=['#0e8a6b','#2f6f9e','#9a6b2f','#6b4f8f'];
 // keep end labels from colliding
 const ends=series.map((s,i)=>({i,y:y(s.pts[s.pts.length-1].y)})).sort((a,c)=>a.y-c.y);
 let last=-99;ends.forEach(e=>{e.ly=Math.max(e.y,last+15);last=e.ly});
 const lyFor=i=>ends.find(e=>e.i===i).ly;
 series.forEach((s,i)=>{const col=hues[i%hues.length];
  g+=`<path d="${s.pts.map((p,j)=>(j?'L':'M')+x(p.x).toFixed(1)+' '+y(p.y).toFixed(1)).join(' ')}" fill="none" stroke="${col}" stroke-width="${curveFocus===s.k?3.7:2.5}" stroke-linecap="round" opacity="${curveFocus!=='all'&&curveFocus!==s.k?.14:1}"/>`;
  if(curveFocus===s.k){[0,20,40,60,80,100].forEach(v=>{const cy=y(s.pts.find(p=>p.x===v).y);g+=`<circle class="response-dot" cx="${x(v)}" cy="${cy}" r="5" fill="white" stroke="${col}" stroke-width="2.5" data-curve-lever="${s.k}" data-curve-value="${v}" tabindex="0" role="button" aria-label="Apply ${esc(s.label)} at ${v}%"><title>${esc(s.label)} ${v}%: CI ${fmt(s.pts.find(p=>p.x===v).y,2)} g CO₂e/MJ — click to apply</title></circle>`})}
  const cur=optim[s.k],cp=scenario(only(s.k,cur)).ci;
  g+=`<circle cx="${x(cur)}" cy="${y(cp)}" r="${cur>0?6:4}" fill="${cur>0?col:'white'}" stroke="${col}" stroke-width="2.5" opacity="${curveFocus!=='all'&&curveFocus!==s.k?.2:1}"/>`;
  g+=TXT(W-R+8,lyFor(i)+4,n&&s.label.length>12?s.label.slice(0,11)+'…':s.label,{size:n?10.5:12,fill:col,weight:700})});
 g+=TXT((L+W-R)/2,H-8,'Share of the change applied',{anchor:'middle',size:12});
 g+=TXT(16,(T+H-B)/2,'CI · g CO₂e/MJ',{anchor:'middle',size:12,tr:`rotate(-90 16 ${(T+H-B)/2})`});
 $('responseCurve').innerHTML=SVG(W,H,g,'Carbon intensity against the share of each lever applied');
 $('responseCurve').querySelectorAll('[data-curve-lever]').forEach(dot=>{const apply=()=>applyLever(dot.dataset.curveLever,Number(dot.dataset.curveValue));dot.onclick=apply;dot.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();apply()}}});
 const steep=series.map(s=>({label:s.label,drop:b.ci-s.pts[s.pts.length-1].y})).sort((a,c)=>c.drop-a.drop)[0];
 $('rangeReadout').innerHTML=`Every line starts from the same baseline of <b>${fmt(b.ci,2)}</b>. <b>${esc(steep.label)}</b> falls fastest, reaching <b>${fmt(b.ci-steep.drop,2)} g/MJ</b> on its own at 100%. The dots mark your current settings. Lines are independent, so combining levers will not simply add their drops. <b>Choose a lever above, then click any point on its curve to apply that level.</b>`;}


/* --- two-lever grid, rerunning the same screening scenario function --- */
function drawHeatmap(b,controls){
 if(!controls.includes(heatX))heatX=controls[0];
 if(!controls.includes(heatY)||heatY===heatX)heatY=controls.find(k=>k!==heatX)||controls[0];
 if(heatX===heatY)heatX=controls.find(k=>k!==heatY)||controls[0];
 const opts=controls.map(k=>`<option value="${k}">${esc(OPT_LABELS[k])}</option>`).join('');
 $('heatX').innerHTML=opts;$('heatY').innerHTML=opts;$('heatX').value=heatX;$('heatY').value=heatY;
 $('heatX').onchange=e=>{heatX=e.target.value;if(heatX===heatY)heatY=controls.find(k=>k!==heatX)||heatY;drawHeatmap(b,controls)};
 $('heatY').onchange=e=>{heatY=e.target.value;if(heatX===heatY)heatX=controls.find(k=>k!==heatY)||heatX;drawHeatmap(b,controls)};
 const levels=[0,25,50,75,100];
 const points=[];
 for(const yy of levels)for(const xx of levels){const mix={...ZERO,[heatX]:xx,[heatY]:yy},ci=scenario(mix).ci;points.push({xx,yy,ci,red:b.ci-ci})}
 const worst=Math.min(0,...points.map(p=>p.red)),best=Math.max(1e-9,...points.map(p=>p.red));
 let html=`<div class="heat-corner">${esc(OPT_LABELS[heatY])} ↓<br>${esc(OPT_LABELS[heatX])} →</div>${levels.map(v=>`<div class="heat-label">${v}%</div>`).join('')}`;
 for(const yy of levels){html+=`<div class="heat-label">${yy}%</div>`;for(const xx of levels){const p=points.find(p=>p.xx===xx&&p.yy===yy),t=p.red>=0?Math.min(1,p.red/best):Math.min(1,Math.abs(p.red/(worst||1)));const light=p.red>=0?98-54*t:98-29*t;const color=t>.66&&p.red>=0?'#fff':'#183a33';const selected=Math.abs(optim[heatX]-xx)<12.5&&Math.abs(optim[heatY]-yy)<12.5&&controls.filter(k=>k!==heatX&&k!==heatY).every(k=>(optim[k]||0)===0);
 html+=`<button type="button" class="heat-cell ${selected?'selected':''}" data-heat-x="${xx}" data-heat-y="${yy}" style="background:hsl(${p.red>=0?156:28} 54% ${light.toFixed(1)}%);color:${color}" title="${esc(OPT_LABELS[heatX])} ${xx}%, ${esc(OPT_LABELS[heatY])} ${yy}%. Resulting CI ${fmt(p.ci,2)} g CO₂e/MJ" aria-label="Apply ${esc(OPT_LABELS[heatX])} ${xx} percent and ${esc(OPT_LABELS[heatY])} ${yy} percent; CI ${fmt(p.ci,2)}"><span>${fmt(p.ci,1)}</span><span class="heat-help">g/MJ</span></button>`}}
 $('interactionHeatmap').innerHTML=html;
 $('interactionHeatmap').querySelectorAll('[data-heat-x]').forEach(btn=>btn.onclick=()=>{for(const k of controls)optim[k]=0;optim[heatX]=Number(btn.dataset.heatX);optim[heatY]=Number(btn.dataset.heatY);syncSliders();updateOpt()});
 const lowest=points.reduce((x,y)=>y.ci<x.ci?y:x,points[0]);
 $('heatReadout').innerHTML=`<strong>How to read:</strong> each cell is a combined modeled CI, not an emission reduction. Darker green means lower modeled CI; an amber tint means CI increases. The best result in this two-lever grid is <strong>${fmt(lowest.ci,2)} g CO₂e/MJ</strong> at ${esc(OPT_LABELS[heatX])} ${lowest.xx}% and ${esc(OPT_LABELS[heatY])} ${lowest.yy}%. Selecting a cell resets the other levers to zero so the displayed scenario matches the grid.`;
}

/* --- stage comparison --- */
function drawStages(b,o){const stages=Array.from(new Set([...Object.keys(b.parts),...Object.keys(o.parts)]));
 const W=cwOf('contribCompare'),n=narrow(W),rowH=62,H=stages.length*rowH+34,LBL=n?104:196,R=n?56:108;
 const vals=stages.flatMap(k=>[b.parts[k]||0,o.parts[k]||0]);
 const lo=Math.min(0,...vals),hi=Math.max(0,...vals),span=hi-lo||1;
 const x=v=>LBL+(W-LBL-R)*((v-lo)/span),z=x(0);
 let g=`<line x1="${z}" y1="6" x2="${z}" y2="${H-26}" stroke="${C.axis}" stroke-width="1.5"/>`;
 niceTicks(lo,hi,5).forEach(t=>{if(Math.abs(t)<1e-9)return;g+=`<line x1="${x(t)}" y1="6" x2="${x(t)}" y2="${H-26}" stroke="${C.grid}"/>`+TXT(x(t),H-8,fmt(t,0),{anchor:'middle',size:11})});
 stages.forEach((k,i)=>{const yb=i*rowH+12,bv=b.parts[k]||0,ov=o.parts[k]||0,d=bv-ov;
  g+=TXT(LBL-14,yb+24,k.length>(n?13:24)?k.slice(0,n?12:23)+'…':k,{anchor:'end',size:n?11:12.5,fill:C.ink,weight:700});
  [[bv,C.base,0],[ov,C.opt,22]].forEach(([v,col,dy])=>{const x0=Math.min(z,x(v)),w=Math.max(2,Math.abs(x(v)-z));
   g+=`<rect x="${x0}" y="${yb+dy}" width="${w}" height="18" rx="4" fill="${col}"/>`;
   g+=TXT(v>=0?x0+w+8:z+8,yb+dy+13,fmt(v,2),{size:11,anchor:'start',fill:C.text,weight:600})});
  if(Math.abs(d)>1e-5)g+=TXT(W-8,yb+24,signed(d,2),{anchor:'end',size:12,fill:C.opt,weight:800});
 });
 $('contribCompare').innerHTML=SVG(W,H,g,'Lifecycle stage contributions, baseline against scenario');
 const moved=stages.map(k=>({k,d:(b.parts[k]||0)-(o.parts[k]||0)})).filter(s=>Math.abs(s.d)>1e-5).sort((a,c)=>c.d-a.d);
 const reach=new Set(optControls().flatMap(k=>stagesTouched(b,k)));
 const untouched=stages.filter(k=>!reach.has(k));
 const idle=stages.filter(k=>reach.has(k)&&Math.abs((b.parts[k]||0)-(o.parts[k]||0))<=1e-5);
 const biggest=stages.map(k=>({k,v:b.parts[k]||0})).filter(x=>x.v>0).sort((a,c)=>c.v-a.v)[0]||{k:stages[0],v:b.parts[stages[0]]||0};
 $('stageReadout').innerHTML=(moved.length?`Your scenario moves <b>${moved.map(s=>esc(s.k).toLowerCase()).join(', ')}</b>. `:'No stage has moved yet. ')+
  `<b>${esc(biggest.k)}</b> is the largest positive contributor at ${fmt(biggest.v,2)} g/MJ. `+
  (idle.length?`You have levers for ${idle.map(k=>esc(k).toLowerCase()).join(', ')} still at zero. `:'')+
  (untouched.length?`No lever here reaches ${untouched.map(k=>esc(k).toLowerCase()).join(', ')} — those need a different feedstock, site or process route.`:'');}

/* --- economics --- */
function economicInputError(){
 const screeningLcfs = hasScreeningLcfs(baseline?.path.fuel);
 const costs = optControls().map(key => econ.cost[key]);
 const transportCost = baseline?.kind==='dairy' ? econ.pipeCost : econ.railCost;
 const all=[...(screeningLcfs?[econ.price,econ.share,econ.eer]:[]),econ.life,econ.rate,econ.ppa,econ.gasPrice,transportCost,...costs.flatMap(x=>[x.capex,x.opex])];
 return !all.every(Number.isFinite)?'Enter assumptions or load an example to estimate costs.':screeningLcfs&&(econ.share<0||econ.share>100)?'Eligible share must be between 0 and 100%.':(screeningLcfs&&(econ.price<0||econ.eer<=0))||econ.life<=0||econ.rate<0||econ.ppa<0||econ.gasPrice<0?'Check positive project life, EER and nonnegative prices and discount rate.':costs.some(x=>x.capex<0)?'Capital costs cannot be negative.':'';
}
function updateEcon(){if(!baseline)return;
 const err = economicInputError();
 $('econError').textContent=err;syncValueStat();
 const controls=optControls();controls.forEach(k=>{const e=$('econPct-'+k);if(e)e.textContent=optim[k]+'%'});
 if(err){$('econNumbers').innerHTML='';$('econCharts').innerHTML='';$('frontierPlot').innerHTML='';$('frontierOptions').innerHTML='';$('frontierReadout').innerHTML='';$('econInsight').innerHTML='';$('econPrompt').innerHTML='';return}
 const z=economicScenario(optim),delta=baseline.ci-z.sc.ci;
 const screeningLcfs = hasScreeningLcfs(baseline.path.fuel);
 $('econPrompt').innerHTML=!screeningLcfs
  ? '<div class="note">This pathway’s optimization economics exclude LCFS revenue. See Credit potential for pathway-specific options.</div>'
  : econ.share>0?'':`<div class="prompt"><strong>No LCFS-eligible share set</strong><p>Credit value stays at zero until you say how much of your fuel is sold into California. Everything else below is already costed.</p><div class="econ-share-controls"><label><span>LCFS-eligible share</span><span class="econ-share-input"><input type="number" id="promptShare" min="0" max="100" placeholder="0–100" aria-describedby="promptShareError"><span aria-hidden="true">%</span></span></label><button type="button" id="promptApply">Apply share</button><small id="promptShareError" role="status"></small></div></div>`;
 if ($('promptApply')) {
  const share = $('promptShare');
  $('promptApply').onclick = () => {
   const v = numberEntry('promptShare');
   if (!Number.isFinite(v) || v < 0 || v > 100) {
    $('promptShareError').textContent = 'Enter a share from 0 to 100%.';
    share.focus();
    return;
   }
   econ.share=v;
   $('ecShare').value=v;
   updateEcon();
  };
  share.onkeydown = event => {
   if (event.key === 'Enter') $('promptApply').click();
  };
 }
 const payback=(z.credit-z.opex)>0?z.capex/(z.credit-z.opex):null;
 $('econNumbers').innerHTML=[
  ['Net annual benefit',dollars(z.net),screeningLcfs?'Credit value less all costs':'Savings less implementation costs',z.net>=0?'good':'bad'],
  ['Incremental LCFS value',screeningLcfs?dollars(z.credit):'—',!screeningLcfs?'Excluded for this pathway':econ.share>0?`At ${fmt(econ.share,0)}% eligible · $${fmt(econ.price,0)}/t`:'Set an eligible share',''],
  ['Annualized cost change',dollars(Math.abs(z.annualCapex+z.opex)),(z.annualCapex+z.opex)<0?`Net saving · capital ${dollars(z.capex)} over ${fmt(econ.life,0)} yrs`:`Capital ${dollars(z.capex)} spread over ${fmt(econ.life,0)} yrs`,''],
  [z.mac!=null&&z.mac<0?'Saving per tonne avoided':'Cost per tonne avoided',z.mac==null?'—':dollars(Math.abs(z.mac)),z.mac==null?'Move a lever first':z.mac<0?'The measures pay for themselves':'Annualized cost ÷ tonnes avoided',z.mac!=null&&z.mac<0?'good':''],
  ['Simple payback',payback==null?'—':fmt(payback,1)+' yrs',payback==null?'Not positive at these assumptions':'Capital ÷ net annual cash',''],
 ].map(([n,v,d,cls])=>`<div class="econ-kpi ${cls}"><span>${n}</span><strong>${v}</strong><small>${d}</small></div>`).join('');
 // waterfall + per-lever
 const w=[...(screeningLcfs?[['Incremental LCFS',z.credit]]:[]),['Annualized capital',-z.annualCapex],['Change in O&M',-z.opex],['Net benefit',z.net]];
 const max=Math.max(1,...w.map(x=>Math.abs(x[1])));
 const EW=cwOf('econCharts'),W=Math.max(320,Math.min(520,narrow(EW)?EW-56:(EW-24)/2)),rowH=46,H=w.length*rowH+10,LBL=Math.min(142,W*0.3);
 let g='';
 const neg=Math.min(0,...w.map(x=>x[1])),pos=Math.max(0,...w.map(x=>x[1])),span=(pos-neg)||1;
 const xw=v=>LBL+(W-LBL-86)*((v-neg)/span),zx=xw(0);
 g+=`<line x1="${zx}" y1="4" x2="${zx}" y2="${H-8}" stroke="${C.axis}"/>`;
 w.forEach(([n,v],i)=>{if(n==='Change in O&M'&&v>0)n='O&M saving';const y=i*rowH+10,x0=Math.min(zx,xw(v)),ww=Math.max(2,Math.abs(xw(v)-zx));
  g+=TXT(LBL-12,y+18,n,{anchor:'end',size:12,fill:C.ink,weight:n==='Net benefit'?800:600});
  g+=`<rect x="${x0}" y="${y+4}" width="${ww}" height="22" rx="5" fill="${n==='Net benefit'?(v>=0?C.opt:'#a4442f'):v>=0?'#8bbfae':'#c9a98b'}"/>`;
  g+=TXT(W-6,y+19,dollars(v),{anchor:'end',size:11.5,fill:n==='Net benefit'?C.ink:C.text,weight:n==='Net benefit'?800:700})});
 const ranking=controls.map(k=>({k,...economicScenario(only(k,optim[k]))})).sort((a,c)=>c.net-a.net);
 const rmax=Math.max(1,...ranking.map(r=>Math.abs(r.net)));
 const W2=W,H2=ranking.length*46+10,L2=LBL;
 const rneg=Math.min(0,...ranking.map(r=>r.net)),rpos=Math.max(0,...ranking.map(r=>r.net)),rspan=(rpos-rneg)||1;
 const xr=v=>L2+(W2-L2-86)*((v-rneg)/rspan),rz=xr(0);
 let g2=`<line x1="${rz}" y1="4" x2="${rz}" y2="${H2-8}" stroke="${C.axis}"/>`;
 ranking.forEach((r,i)=>{const y=i*46+10,x0=Math.min(rz,xr(r.net)),ww=Math.max(2,Math.abs(xr(r.net)-rz));
  g2+=TXT(L2-12,y+14,OPT_LABELS[r.k],{anchor:'end',size:12,fill:C.ink,weight:700});
  g2+=TXT(L2-12,y+28,`${optim[r.k]}% · ${signed(baseline.ci-r.sc.ci,2)} g/MJ`,{anchor:'end',size:10.5});
  g2+=`<rect x="${x0}" y="${y+4}" width="${ww}" height="22" rx="5" fill="${r.net>=0?C.opt:'#c08a6b'}"/>`;
  g2+=TXT(W2-6,y+19,dollars(r.net),{anchor:'end',size:11.5,fill:C.text,weight:700})});
 $('econCharts').innerHTML=`<div class="sense-charts"><div class="sense-chart"><h3 style="font-size:15px">Where the annual money goes</h3>${SVG(W,H,g,'Annual value waterfall')}</div>
  <div class="sense-chart"><h3 style="font-size:15px">Which lever pays back</h3>${SVG(W2,H2,g2,'Net annual benefit by lever')}</div></div>`;
 drawScenarioFrontier();
 const best=ranking[0];
 $('econInsight').innerHTML=screeningLcfs&&econ.share<=0?`With no eligible share set, credit value is zero and every lever looks like pure cost. Set the share above to see the trade-off.`
  :delta<=1e-5?`No lever is applied, so there is nothing to cost yet. Apply one from the ranked list to see its economics.`
  :`At these assumptions the scenario ${z.net>=0?'clears':'does not cover'} its costs: <b>${dollars(z.net)}</b> a year${z.mac!=null?` at <b>${dollars(z.mac)}</b> per tonne avoided`:''}. <b>${esc(OPT_LABELS[best.k])}</b> is the strongest single lever on money at its current setting (${dollars(best.net)}/yr). Prices and costs are examples; replace them with your own quotes before drawing conclusions.`;}


/* --- cost / CI efficient frontier: all 16 binary measure combinations --- */
function drawScenarioFrontier(){
 const target=$('frontierPlot'),opts=$('frontierOptions'),read=$('frontierReadout');if(!target||!baseline)return;
 const keys=optControls(),all=[];
 for(let mask=0;mask<16;mask++){
  const set={...ZERO};keys.forEach((k,i)=>{if(mask&(1<<i))set[k]=100});
  const z=economicScenario(set);all.push({mask,set,ci:z.sc.ci,cost:z.annualCapex+z.opex,net:z.net,description:mask?keys.filter((k,i)=>mask&(1<<i)).map(k=>OPT_LABELS[k]).join(' + '):'Unchanged baseline'});
 }
 const focus=economicScenario(optim),current={ci:focus.sc.ci,cost:focus.annualCapex+focus.opex};
 if(!all.every(p=>Number.isFinite(p.ci)&&Number.isFinite(p.cost))||![current.ci,current.cost].every(Number.isFinite)){
  target.textContent='Enter valid economic assumptions to display the cost-versus-CI frontier.';opts.innerHTML='';read.textContent='';return;
 }
 const efficient=all.filter(p=>!all.some(q=>q!==p && q.cost<=p.cost+1e-6 && q.ci<=p.ci+1e-8 && (q.cost<p.cost-1e-6 || q.ci<p.ci-1e-8)));
 const allPts=[...all,current],W=Math.max(380,Math.min(780,target.clientWidth||740)),H=340,L=66,R=32,T=30,B=55;
 let loX=Math.min(...allPts.map(p=>p.cost),0),hiX=Math.max(...allPts.map(p=>p.cost),0),loY=Math.min(...allPts.map(p=>p.ci)),hiY=Math.max(...allPts.map(p=>p.ci));
 const padX=Math.max(1,(hiX-loX)*.09),padY=Math.max(.3,(hiY-loY)*.10);loX-=padX;hiX+=padX;loY-=padY;hiY+=padY;
 const x=v=>L+(W-L-R)*(v-loX)/(hiX-loX||1),y=v=>T+(H-T-B)*(hiY-v)/(hiY-loY||1);
 let g='';
 niceTicks(loY,hiY,5).forEach(v=>{g+=`<line x1="${L}" y1="${y(v)}" x2="${W-R}" y2="${y(v)}" stroke="#eaf1ed"/>${TXT(L-9,y(v)+4,fmt(v,1),{size:11,anchor:'end'})}`});
 niceTicks(loX,hiX,5).forEach(v=>{g+=`<line x1="${x(v)}" y1="${T}" x2="${x(v)}" y2="${H-B}" stroke="#eaf1ed"/>${TXT(x(v),H-B+19,dollars(v).replace('.00',''),{size:11,anchor:'middle'})}`});
 if(Number.isFinite(optimizationTarget)&&optimizationTarget>=loY&&optimizationTarget<=hiY){g+=`<line x1="${L}" y1="${y(optimizationTarget)}" x2="${W-R}" y2="${y(optimizationTarget)}" stroke="#b47c27" stroke-width="2" stroke-dasharray="6 5"/>${TXT(W-R-5,y(optimizationTarget)-6,'Your CI target',{anchor:'end',fill:'#ab7020',size:11,weight:750})}`}
 const frontier=efficient.slice().sort((a,b)=>a.cost-b.cost);
 if(frontier.length>1)g+=`<path d="${frontier.map((p,i)=>(i?'L':'M')+x(p.cost).toFixed(2)+' '+y(p.ci).toFixed(2)).join(' ')}" fill="none" stroke="#139a77" stroke-width="3" opacity=".58" stroke-dasharray="5 5"/>`;
 all.forEach(p=>{const eff=efficient.includes(p),col=eff?'#087b5b':'#b7c9c3';g+=`<g class="frontier-point" data-combo="${p.mask}" tabindex="0" role="button" aria-label="Apply ${esc(p.description)}; CI ${fmt(p.ci,2)}; annualized cost ${esc(dollars(p.cost))}"><title>${esc(p.description)} | CI ${fmt(p.ci,2)} g/MJ | Annualized cost ${dollars(p.cost)} / year | ${eff?'Efficient':'Dominated'}. Click to apply.</title><circle cx="${x(p.cost)}" cy="${y(p.ci)}" r="${eff?7:4.8}" fill="${col}" stroke="white" stroke-width="1.8"/></g>`});
 const ox=x(current.cost),oy=y(current.ci);
 g+=`<path d="M${ox} ${oy-12} L${ox+12} ${oy} L${ox} ${oy+12} L${ox-12} ${oy}Z" fill="#163d47" stroke="white" stroke-width="2"/><title>Currently selected scenario</title>`;
 g+=TXT(W/2,H-8,'Annualized cost change · USD/year',{size:12,anchor:'middle',fill:'#45665c'});
 g+=TXT(17,(T+H-B)/2,'Modeled CI · g CO₂e/MJ',{size:12,anchor:'middle',fill:'#45665c',tr:`rotate(-90 17 ${(T+H-B)/2})`});
 target.innerHTML=SVG(W,H,g,'Sixteen cost versus CI scenario combinations and the efficient frontier')+`<div class="graph-mini-legend"><span><b></b>Efficient scenario</span><span class="other"><b></b>Dominated option</span><span class="current"><b></b>Your current selection (diamond)</span></div>`;
 const applyMask=mask=>{const set=all.find(p=>p.mask===mask);if(!set)return;Object.assign(optim,set.set);syncSliders();updateOpt()};
 target.querySelectorAll('[data-combo]').forEach(el=>{const fn=()=>applyMask(Number(el.dataset.combo));el.onclick=fn;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn()}}});
 const promising=frontier.filter(p=>p.mask!==0).sort((a,b)=>a.ci-b.ci).slice(0,4);
 opts.innerHTML=promising.map(p=>`<button type="button" data-efficient="${p.mask}" title="Apply this combination"><strong>${esc(p.description)}</strong><small>CI ${fmt(p.ci,2)} g/MJ · annualized cost ${dollars(p.cost)}/year</small></button>`).join('');
 opts.querySelectorAll('[data-efficient]').forEach(el=>el.onclick=()=>applyMask(Number(el.dataset.efficient)));
 const cheapest=efficient.reduce((a,p)=>p.cost<a.cost?p:a,efficient[0]);
 read.innerHTML=`<b>${efficient.length} of 16</b> modeled combinations are nondominated under the stated cost assumptions. Lower CI and lower annualized cost are preferred. <b>${esc(cheapest.description)}</b> is the lowest-cost efficient combination. Click a plotted point or scenario card to test it; the sliders and other charts update together. Costs exclude credit eligibility checks, financing, and unmodeled project constraints.`;
}

/* ---------- Step 4 ---------- */
const creditTabs = [...document.querySelectorAll('.credit-tabs [role="tab"]')];
let creditTab = 'creditPanel';
const creditDownloadExcel = $('creditDownloadExcel');
const creditExcelDownloadStatus = $('creditExcelDownloadStatus');
function selectCreditTab(id) {
 syncCreditRunButtons();
 creditTab = creditTabs.some(tab => tab.getAttribute('aria-controls') === id) ? id : 'creditPanel';
 for (const tab of creditTabs) {
  const panel = tab.getAttribute('aria-controls');
  const selected = panel === creditTab;
  tab.setAttribute('aria-selected', String(selected));
  tab.tabIndex = selected ? 0 : -1;
  $(panel).hidden = !selected;
 }
 const toolbar = $(creditTab).querySelector('.credit-toolbar');
 const actions = toolbar?.querySelector('.credit-actions');
 if (actions && !actions.contains(creditDownloadExcel)) {
  actions.insertBefore(creditDownloadExcel, actions.querySelector('.primary:not([hidden])'));
  toolbar.after(creditExcelDownloadStatus);
 }
 syncExcelDownloadActions();
}
for (const type of ['input','change','click']) {
 $('view3').addEventListener(type,syncExcelDownloadActions);
}
creditTabs.forEach((tab, index) => {
 tab.onclick = () => selectCreditTab(tab.getAttribute('aria-controls'));
 tab.onkeydown = event => {
  const direction = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
  const next = direction ? (index + direction + creditTabs.length) % creditTabs.length :
   event.key === 'Home' ? 0 : event.key === 'End' ? creditTabs.length - 1 : -1;
  if (next < 0) return;
  event.preventDefault();
  creditTabs[next].click();
  creditTabs[next].focus();
 };
});
const documentedLcfs = {
 saf: {unit: 'US gal', energy: 126.37, uses: [['Alternative jet fuel', 80.17, 1]]},
 h2: {unit: 'kg', energy: 120, uses: [['Light- or medium-duty fuel cell vehicle', 75.16, 2.5],
  ['Heavy-duty fuel cell vehicle', 80.17, 1.9]]}
};
const lcfsReference = 'https://ww2.arb.ca.gov/sites/default/files/2025-08/2025_lcfs_fro_oal-approved_unofficial_08112025.pdf';
function documentedLcfsBalance(fuel, use, ci, quantity) {
 const config = documentedLcfs[fuel];
 const [, benchmark, eer] = use;
 const balance = (benchmark * eer - ci) * quantity * config.energy / 1e6;
 return fuel === 'saf' ? Math.max(0, balance) : balance;
}

function renderDocumentedLcfs(panel, fuel) {
 const config = documentedLcfs[fuel];
 const jet = fuel === 'saf';
 panel.innerHTML = `${creditActions('lcfs','California LCFS','estimate')}
  <div class="prog-fields">
   <label>Fuel use<select id="lcfsUse"><option value="">Select end use</option>${config.uses.map(([name], i) => `<option value="${i}">${name}</option>`).join('')}</select></label>
   <label>CARB fuel pathway code<input id="lcfsPathCode" type="text" placeholder="Enter approved pathway code"></label>
   <label>Approved pathway CI · g CO₂e/MJ<input id="lcfsApprovedCi" type="number" step="any" placeholder="Enter CI"><small>Enter the pathway CI before EER adjustment.</small></label>
   <label>Eligible 2026 quantity · ${config.unit}<input id="lcfsQuantity" type="number" min="0" step="any" placeholder="Enter quantity"><small>${jet?'Use only qualifying alternative jet fuel delivered for use in California.':'Use only qualifying hydrogen dispensed in California.'}</small></label>
   <label>Credit price · USD/t<input id="lcfsprice" type="number" min="0" step="any" placeholder="Enter price"></label>
  </div>
  <label class="prog-check"><input type="checkbox" id="lconfirm"><span>I verified the pathway, qualifying fuel quantity and reporting entitlement${jet?', including LCFS opt-in':''}.</span></label>
  <div id="creditResults" aria-live="polite"></div>
  <div class="prog-foot">Uses LCFS fuel-pathway accounting. <a href="${lcfsReference}" target="_blank" rel="noopener">CARB regulation §§95484, 95486 and 95486.1</a></div>`;
 let exampleLoaded = false;
 const output = $('creditResults');
 for (const field of panel.querySelectorAll('input,select')) field.addEventListener('input', () => {
  exampleLoaded = false;
  creditState('lcfs');
  $('lcfsExampleStatus').textContent = '';
  output.replaceChildren();
 });
 $('lcfsExample').onclick = () => {
  const sample = {lcfsUse:'0',lcfsPathCode:'',lcfsApprovedCi:'35',lcfsQuantity:'100000',lcfsprice:'75'};
  for (const [id, value] of Object.entries(sample)) $(id).value = value;
  $('lconfirm').checked = false;
  for (const id of [...Object.keys(sample),'lconfirm']) $(id).dispatchEvent(new Event('input',{bubbles:true}));
  exampleLoaded = true;
  $('lcfsExampleStatus').textContent = creditExampleMessage;
  creditState('lcfs','Example inputs');
 };
 $('estimate').onclick = () => {
  const use = config.uses[numberEntry('lcfsUse')];
  const ci = numberEntry('lcfsApprovedCi'), quantity = numberEntry('lcfsQuantity'), price = numberEntry('lcfsprice');
  const documented = $('lconfirm').checked && $('lcfsPathCode').value.trim();
  const showError = message => { output.innerHTML = `<div class="error" role="alert">${message}</div>`; };
  if (!use || ![ci, quantity, price].every(Number.isFinite) || quantity < 0 || price < 0) {
   showError('Select the fuel use and enter a pathway CI, a nonnegative quantity and a nonnegative price.');
   return;
  }
  if (!documented && !exampleLoaded) {
   showError('Enter the CARB pathway code and confirm the reporting conditions before running.');
   return;
  }
  const balance = documentedLcfsBalance(fuel, use, ci, quantity), value = Math.abs(balance) * price;
  if (![balance, value].every(Number.isFinite)) {
   showError('The estimate is too large. Check the CI, quantity and price.');
   return;
  }
  const [, benchmark, eer] = use;
  const deficit = balance < 0;
  $('lcfsExampleStatus').textContent = '';
  creditState('lcfs',exampleLoaded?'Illustrative':'Estimated');
  output.innerHTML = `<div class="rin-stat-grid credit-result-grid">
   <div class="rin-stat"><span>${deficit?'Estimated deficits':'Estimated credits'}</span><strong>${fmt(Math.abs(balance),2)}</strong><small>t CO₂e</small></div>
   <div class="rin-stat"><span>${deficit?'Estimated deficit cost':'Estimated gross value'}</span><strong>${dollars(value)}</strong><small>USD</small></div>
   <div class="rin-stat"><span>2026 benchmark</span><strong>${fmt(benchmark,2)}</strong><small>g CO₂e/MJ · EER ${eer}</small></div></div>
   <div class="note small">${exampleLoaded?'Illustrative values only.':'Estimate based on the pathway and quantity you supplied.'} CARB issues credits through LCFS reporting.</div>`;
 };
}

function renderCredits(){const b=baseline,o=scenario(optim);if(!b)return;
 const fuel=b.path.fuel,supported=hasScreeningLcfs(fuel);
 const dairyRun=b.kind==='dairy';
 const annualEnergy=dairyRun?b.energyMj*12/b.inputs.months:b.energyMj;
 const change=b.ci-o.ci;
 const compactEnergy=new Intl.NumberFormat('en-US',{notation:'compact',maximumSignificantDigits:4}).format(annualEnergy);
 const reportPeriod=dairyRun?` over ${b.inputs.months} months`:'/year';
 const allocation=b.allocation;
 const allocationNote=allocation && allocation.method!=='none'
  ? `<p class="credit-allocation"><strong>${allocationMethods[allocation.method]}</strong>${allocation.method==='displacement'?'':' · Fuel share '+fmt(allocation.factor*100,2)+'%'} · CI adjustment ${fmt(allocation.adjustment,2)} → ${fmt(o.parts['Co-product allocation adjustment'] ?? o.parts['Co-product displacement credit'],2)} g CO₂e/MJ</p>`
  : '';
 $('creditSummary').innerHTML=`<div class="credit-summary-heading">
   <h2 id="creditPathwayTitle">Credit potential</h2>
    </div>
  <div class="ci-snapshot-metrics">
   <div class="ci-snapshot-metric"><span class="ci-snapshot-label">Baseline CI</span><strong>${fmt(b.ci,2)}</strong><small>g CO₂e/MJ</small></div>
   <div class="ci-snapshot-metric ci-snapshot-scenario"><span class="ci-snapshot-label">Scenario CI</span><strong>${fmt(o.ci,2)}</strong><small>g CO₂e/MJ · modelled</small>${Math.abs(change)>1e-5?`<span class="ci-snapshot-change${change>0?' has-reduction':''}">${signed(change,2)} g/MJ</span>`:''}</div>
   <div class="ci-snapshot-metric annual-energy"><span class="ci-snapshot-label">Annual energy</span><strong>${compactEnergy}</strong><small>MJ/year</small></div>
   <div class="ci-snapshot-metric"><span class="ci-snapshot-label">Production</span><strong>${b.volume.toLocaleString('en-US',{maximumSignificantDigits:12})}</strong><small>${esc(b.unit+reportPeriod)}</small></div>
  </div>${allocationNote}`;
 const panel=$('creditPanel');
 if(documentedLcfs[fuel]) renderDocumentedLcfs(panel, fuel);
 else if(!supported){
  panel.innerHTML=`${creditActions('lcfs','California LCFS')}
   <div class="note">${fuel==='solid'
    ? 'This pathway models solid biomass for industrial energy. If the biomass is used to produce a qualifying transportation fuel, estimate LCFS credits under the finished fuel’s approved pathway.'
    : 'CIVanta does not have a California LCFS estimate for this fuel category. Check CARB’s approved pathway and end-use requirements.'}</div>
   <div class="prog-foot"><a href="https://ww2.arb.ca.gov/resources/documents/apply-lcfs-fuel-pathway" target="_blank" rel="noopener">CARB pathway guidance</a></div>`}
 else{
  panel.innerHTML=`${creditActions('lcfs','California LCFS','estimate')}
  <div class="prog-fields">
   <label>2026 benchmark · g/MJ<input type="number" step="any" id="bench" placeholder="Enter benchmark"><small>Editable; verify with CARB.</small></label>
   <label>Eligible quantity · %<input id="share" type="number" min="0" max="100" placeholder="Enter share"><small>Only qualifying California fuel.</small></label>
   <label>Credit price · USD/t<input id="lcfsprice" type="number" min="0" placeholder="Enter price"><small>Illustrative, not a market quote.</small></label>
   <label>EER<input id="eer" type="number" min="0.01" step="any" placeholder="Enter EER"><small>Must match fuel and end use.</small></label>
  </div>
  <label class="prog-check"><input type="checkbox" id="lconfirm"><span>I confirmed LCFS pathway certification, delivery and credit entitlement for this scenario.</span></label>
  <div id="creditResults" aria-live="polite"></div>
  <div class="prog-foot">Tonnes = (benchmark × EER − CI) × eligible energy ÷ 10⁶. ${esc(b.kind==='dairy'?'Dairy RNG requires a full CARB calculation and annualized reported energy before any real valuation.':'Screening energy basis; CARB approval and transfers need independent verification.')}</div>`;
  $('lcfsExample').onclick = () => {
   const sample = {bench:fuel==='ethanol'?'75.16':'80.17',share:'50',lcfsprice:'75',eer:'1'};
   for (const [id,value] of Object.entries(sample)) {
    $(id).value = value;
    $(id).dispatchEvent(new Event('input',{bubbles:true}));
   }
   $('lconfirm').checked = false;
   $('lconfirm').dispatchEvent(new Event('change',{bubbles:true}));
   creditState('lcfs','Example inputs');
   $('lcfsExampleStatus').textContent = creditExampleMessage;
  };
  for (const control of panel.querySelectorAll('input,select')) control.addEventListener('input', () => {
   creditState('lcfs');
   $('lcfsExampleStatus').textContent = '';
   $('creditResults').replaceChildren();
  });
  $('estimate').onclick=()=>{const bmk=numberEntry('bench'),share=numberEntry('share'),price=numberEntry('lcfsprice'),eer=numberEntry('eer');
   if([bmk,share,price,eer].some(x=>!Number.isFinite(x))||bmk<0||share<0||share>100||price<0||eer<=0){$('creditResults').innerHTML='<div class="error">Check the benchmark, eligible share, EER and a nonnegative price.</div>';return}
   const e=annualEnergy*share/100,baseT=(bmk*eer-b.ci)*e/1e6,testT=(bmk*eer-o.ci)*e/1e6,inc=(testT-baseT)*price;
   const conf=$('lconfirm').checked;
   $('lcfsExampleStatus').textContent = '';
   creditState('lcfs',conf?'Eligibility confirmed':'Conditional');
   $('creditResults').innerHTML=`<div class="rin-stat-grid credit-result-grid"><div class="rin-stat"><span>Baseline credits</span><strong>${fmt(baseT,1)}</strong><small>tonnes CO₂e/yr</small></div><div class="rin-stat"><span>Scenario credits</span><strong>${fmt(testT,1)}</strong><small>tonnes CO₂e/yr</small></div><div class="rin-stat"><span>Incremental value</span><strong>${dollars(inc)}</strong><small>USD/yr at $${fmt(price,0)}/t</small></div></div>
   <div class="note small">${conf?'You have confirmed the programme assumptions.':'Eligibility is unconfirmed, so treat this as conditional planning only.'} These are not issued credits.</div>`};}
 if ($('lcfsReset')) bindCreditReset('lcfs',panel);
 updateRinEconomics();render45Z();selectCreditTab(creditTab);
 const programmes=[supported||Boolean(documentedLcfs[fuel]),supported,Z45_ELIGIBLE.includes(fuel)];
 const stackNote=$('stackNote');
 stackNote.hidden=programmes.filter(Boolean).length<2;
 stackNote.textContent='Each program has its own eligibility and reporting rules. Confirm which credits can be combined before adding their estimates.';
}


/* --- 45Z programme card and separately documented emissions rates --- */
function render45Z(){const b=baseline,box=$('z45Panel');if(!b||!box)return;
 const fuel=b.path.fuel,supported=Z45_ELIGIBLE.includes(fuel),manure=['Dairy manure','Swine manure','Beef cattle manure'].includes(b.path.feedstock);
 if(!supported){
  box.innerHTML=`${creditActions('z45','45Z tax credit')}
   <p class="note">CIVanta has no 45Z estimate for this fuel category. The credit requires qualifying transportation fuel and a documented 45Z emissions rate.</p>`;return}
 box.innerHTML=`${creditActions('z45','45Z tax credit','z45Run')}
 <div class="warning small">${manure?'Animal-manure fuels can carry a negative 45Z rate under the 2026 exception; use the feedstock-specific methodology.':'For fuel produced after 2025, negative 45Z rates are not allowed unless the fuel derives from animal manure.'} Feedstocks must originate in the United States, Mexico or Canada.</div>
 <div class="prog-fields">
  <label>Qualifying fuel sold in 2026<input type="number" id="z45Qty" min="0" step="any" placeholder="US gallons or GGE"><small>Do not assume all output qualifies.</small></label>
  <label>Prevailing wage &amp; apprenticeship<select id="z45Pwa"><option value="">Select</option><option value="yes">Meets PWA · $1.09</option><option value="no">Does not meet PWA · $0.22</option></select></label>
  <label>Baseline 45Z emissions rate<input type="number" id="z45BaseRate" step="any" placeholder="kg CO₂e/MMBtu"><small>From 45ZCF-GREET, an approved method or PER.</small></label>
  <label>Optimized 45Z emissions rate<input type="number" id="z45OptRate" step="any" placeholder="kg CO₂e/MMBtu"><small>Recalculated separately; never copy the LCFS CI.</small></label>
 </div>
 <div class="prog-check" style="flex-direction:column;gap:7px">
  <label class="prog-check"><input type="checkbox" id="z45Domestic"><span>Produced at a qualified U.S. facility by an eligible producer.</span></label>
  <label class="prog-check"><input type="checkbox" id="z45Origin"><span>Feedstock grown or produced in the U.S., Mexico or Canada.</span></label>
  <label class="prog-check"><input type="checkbox" id="z45Reg"><span>Producer registered with the IRS (Form 637) at production.</span></label>
  <label class="prog-check"><input type="checkbox" id="z45Sale"><span>Qualified sale occurred; anti-double-credit rules reviewed.</span></label>
 </div>
 <div id="z45Results" aria-live="polite"></div>
 <div class="prog-foot">Factor = (50 − emissions rate) ÷ 50, rounded to the nearest 0.1; the rate must not exceed 50 kg CO₂e/MMBtu. 2026 amounts: $0.22/gal base, $1.09/gal with PWA. <a href="https://www.irs.gov/pub/irs-drop/n-26-53.pdf" target="_blank" rel="noopener">IRS Notice 2026-53</a> · <a href="https://www.energy.gov/documents/cmei-greet-user-manual-2026-sept-2026-update-final" target="_blank" rel="noopener">45ZCF-GREET</a></div>`;
 let exampleLoaded = false;
 const checks = ['z45Domestic','z45Origin','z45Reg','z45Sale'];
 for (const input of box.querySelectorAll('input,select')) input.addEventListener('input', () => {
  exampleLoaded = false;
  $('z45ExampleStatus').textContent = '';
  creditState('z45');
  $('z45Results').replaceChildren();
 });
 $('z45Example').onclick = () => {
  const example = {z45Qty:'100000',z45BaseRate:'40',z45OptRate:'25',z45Pwa:'no'};
  for (const [id,value] of Object.entries(example)) $(id).value = value;
  for (const id of checks) $(id).checked = false;
  for (const id of [...Object.keys(example),...checks]) $(id).dispatchEvent(new Event('input',{bubbles:true}));
  exampleLoaded = true;
  $('z45ExampleStatus').textContent = creditExampleMessage;
  creditState('z45','Example inputs');
 };
 $('z45Run').onclick = () => calculate45Z(exampleLoaded);
 bindCreditReset('z45',box);
}


/* Keep the RIN status in step with the estimate. */
const _rinBase=updateRinEconomics;
updateRinEconomics=function(run){_rinBase(run);syncRinCard()};
function syncRinCard(){const bd=$('rinBadge');
 if ($('rinSupported').classList.contains('hide')) {
  $('rinRun').disabled = true;
  bd.textContent = 'Not modelled';
  return;
 }
 const values = $('rinStats').querySelectorAll('strong');
 const confirmed = Boolean($('rinDcode').value && $('rinConfirmed').checked);
 if (values.length >= 3) creditState('rin',rinExampleLoaded?'Illustrative':confirmed?'Eligibility confirmed':'Conditional');
 else creditState('rin');
}

function calculate45Z(example = false){
  const out=$('z45Results');if(!out||!baseline)return;
  const data=['z45Qty','z45BaseRate','z45OptRate'].map(id=>$(id).value.trim()===''?NaN:Number($(id).value));
  const [qty,base,opt]=data,rate=$('z45Pwa').value;
  if(![qty,base,opt].every(Number.isFinite)||qty<=0||!rate){out.innerHTML='<div class="error">Enter positive qualifying sales, both documented 45Z emissions rates, and the PWA status.</div>';return;}
  if(!example && !['z45Domestic','z45Origin','z45Reg','z45Sale'].every(id=>$(id).checked)){out.innerHTML='<div class="warning">Verify all four qualifying producer, feedstock, registration and sale conditions before requesting a 45Z estimate. No tax credit is established by selecting a pathway.</div>';return;}
  const animal=['Dairy manure','Swine manure','Beef cattle manure'].includes(baseline.path.feedstock);
  if((base<0||opt<0)&&!animal){out.innerHTML='<div class="error">For 2026 fuel not derived from animal manure, a negative 45Z emissions rate is not allowed. Enter the applicable nonnegative 45Z rate.</div>';return;}
  if(base>50||opt>50){out.innerHTML='<div class="warning">One or both rates exceed the 50 kg CO₂e/MMBtu threshold. This scenario does not qualify for an affirmative 45Z tax credit under the supplied emissions rates.</div>';return;}
  // IRS emissions factor rounded to the nearest 0.1; 45Z is based on qualified sold volume.
  const factor=x=>Math.round(((50-x)/50)*10)/10;
  const fb=factor(base),fo=factor(opt),amount=rate==='yes'?1.09:.22;
  const total=f=>Math.round((qty*amount*f+Number.EPSILON)*100)/100;
  const bv=total(fb),ov=total(fo);
  $('z45ExampleStatus').textContent = '';
  creditState('z45',example?'Illustrative':'Eligibility confirmed');
  out.innerHTML=`<div class="rin-stat-grid credit-result-grid z45-results"><div class="rin-stat"><span>Baseline 45Z tax-credit estimate</span><strong>${money(bv)}</strong><small>Factor ${fmt(fb,1)} × $${amount.toFixed(2)} × qualified volume</small></div><div class="rin-stat"><span>Optimized 45Z tax-credit estimate</span><strong>${money(ov)}</strong><small>Factor ${fmt(fo,1)} · separately provided emissions rate</small></div><div class="rin-stat"><span>Incremental 45Z amount</span><strong>${money(ov-bv)}</strong><small>USD · scenario difference, not guaranteed income</small></div></div><div class="note"><strong>Interpretation:</strong> The estimate uses your user-entered 45Z emissions rates, <strong>not</strong> the generic CI generated in Step 2. Qualified producers should separately verify actual 45ZCF-GREET/CORSIA inputs, tax guidance, registration, sales, anti-double-credit provisions, documentation and the appropriate reporting period. Do not add these estimates to gross LCFS/RIN revenue as if eligibility and stacking were established.</div>`;
  if (example) {
   const notice = document.createElement('p');
   notice.className = 'note';
   notice.textContent = 'Illustrative preview using sample values. Eligibility has not been verified.';
   out.prepend(notice);
  }
}


/* V17 Excel export: dependency-free Office Open XML workbook, for prototype demonstration only. */
const encXml=x=>String(x??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const crcTable=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=data=>{let c=0xFFFFFFFF;for(let b of data)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
function zipStored(entries){const encoder=new TextEncoder(),chunks=[],central=[];let offset=0;const u16=v=>[v&255,(v>>>8)&255],u32=v=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];const push=a=>{chunks.push(new Uint8Array(a));offset+=a.length};for(const [name,str] of entries){const path=encoder.encode(name),data=str instanceof Uint8Array?str:encoder.encode(str),crc=crc32(data),start=offset;push([...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(path.length),...u16(0)]);push(path);push(data);central.push([...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(path.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(start),...path])}const at=offset;central.forEach(push);const csize=offset-at;push([...u32(0x06054b50),...u16(0),...u16(0),...u16(central.length),...u16(central.length),...u32(csize),...u32(at),...u16(0)]);return new Blob(chunks,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})}
function cvFormula(formula, cache=null){return {f:formula.replace(/^=/,''),v:cache};}
function cvXmlCell(v,ref,style){
 const s=style===undefined?'':` s="${style}"`;
 if(v===null||v===undefined||v===''||typeof v==='number'&&!Number.isFinite(v))return style!==undefined?`<c r="${ref}"${s}/>`:'';
 if(typeof v==='object'&&v.f){const isText=typeof v.v==='string';const vtag=v.v===null||v.v===undefined?'':isText?`<v>${encXml(v.v)}</v>`:Number.isFinite(Number(v.v))?`<v>${Number(v.v)}</v>`:'';return `<c r="${ref}"${isText?' t="str"':''}${s}><f>${encXml(v.f)}</f>${vtag}</c>`}
 if(typeof v==='number'&&Number.isFinite(v))return `<c r="${ref}"${s}><v>${v}</v></c>`;
 if(typeof v==='boolean')return `<c r="${ref}" t="b"${s}><v>${v?1:0}</v></c>`;
 return `<c r="${ref}" t="inlineStr"${s}><is><t xml:space="preserve">${encXml(v)}</t></is></c>`;
}
function cvWorksheetXml(sheet){
 const letter=n=>{let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s};
 const width = sheet.widths.length;
 const merges = [];
 const all = [];
 const colorStyles = {1:54,2:37,4:67,6:71,10:6,69:69};
 const rows = [...sheet.rows, {cells:[]}, {
  cells:['© '+new Date().getFullYear()+' Global Bioenergy Watch · CIVanta Excel calculation report'],
  styles:{0:78}, span:width, height:24
 }];
 for (let i=0; i<rows.length; i++) {
   const row = rows[i];
   const number = i+1;
   const span = row.span;
   if (span > 1) merges.push('A'+number+':'+letter(span-1)+number);
   const length = Math.max(row.cells.length,span || 0);
   let lines = 1;
   const cells = Array.from({length},(_,j) => {
    const v = row.cells[j];
    const key = row.styles?.[j];
    const style = span ? row.styles[0] : colorStyles[key] ?? (v?.f ? 40 : number%2 ? 9 : 7);
    if (typeof v === 'string') {
     const colWidth = span ? sheet.widths.slice(0,span).reduce((total,col)=>total+col,0) : sheet.widths[j];
     lines = Math.max(lines, ...v.split('\n').map(line=>Math.ceil(line.length/Math.max(10,(colWidth||24)*.86))));
    }
    if ((span || key===1) && v == null) return `<c r="${letter(j)}${number}" s="${style}"/>`;
    return cvXmlCell(v,letter(j)+number,style);
   }).join('');
   const ht = row.height || Math.min(90,Math.max(21,lines*14+6));
   all.push(`<row r="${number}" ht="${ht}" customHeight="1">${cells}</row>`);
 }
 const merged = merges.length ? `<mergeCells count="${merges.length}">${merges.map(range=>`<mergeCell ref="${range}"/>`).join('')}</mergeCells>` : '';
 const list = sheet.validation?.length ? `<dataValidations count="${sheet.validation.length}">${sheet.validation.map(([cell,values])=>
  `<dataValidation type="list" allowBlank="0" showErrorMessage="1" errorTitle="Choose a listed value" sqref="${cell}"><formula1>${encXml('"'+values.join(',')+'"')}</formula1></dataValidation>`).join('')}</dataValidations>` : '';
 const heat = sheet.heatmap ? `<conditionalFormatting sqref="${sheet.heatmap}"><cfRule type="colorScale" priority="1"><colorScale><cfvo type="min"/><cfvo type="max"/><color rgb="FFB9E4D2"/><color rgb="FFFFE0AD"/></colorScale></cfRule></conditionalFormatting>` : '';
 const freeze = 9;
 const cols = sheet.widths.map((width,i)=>`<col min="${i+1}" max="${i+1}" width="${width}" customWidth="1"/>`).join('');
 return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetPr><tabColor rgb="${sheet.name==="Calculation"?"FF0E2A43":"FF126F56"}"/><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="${freeze}" topLeftCell="A${freeze+1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="23"/><cols>${cols}</cols><sheetData>${all.join('')}</sheetData>${merged}${heat}${list}<pageMargins left="0.4" right="0.4" top="0.55" bottom="0.65" header="0.25" footer="0.30"/><pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/><headerFooter><oddFooter>&amp;L© 2026 Global Bioenergy Watch. All rights reserved.&amp;RPage &amp;P / &amp;N</oddFooter></headerFooter><drawing r:id="rId1"/></worksheet>`;
}
function cvWorkbookZip(sheets,styles,png){
 const workbook=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s,i)=>`<sheet name="${encXml(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets><calcPr calcId="191029" calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>`;
 const rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
 const types=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((sheet,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/drawings/drawing${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>${sheet.chart?`<Override PartName="/xl/charts/chart${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`:''}`).join('')}</Types>`;
 const assets=sheets.flatMap((sheet,i)=>{
   const drawing=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>50000</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>20000</xdr:rowOff></xdr:from><xdr:ext cx="914400" cy="914400"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="1" name="Official Global Bioenergy Watch logo"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="914400" cy="914400"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>${sheet.chart ? civantaChartAnchor(sheet) : ''}</xdr:wsDr>`;
   const sheetRel=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${i+1}.xml"/></Relationships>`;
   const imageRel=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/gbw-logo.png"/>${sheet.chart ? `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart${i+1}.xml"/>` : ''}</Relationships>`;
   return [[`xl/drawings/drawing${i+1}.xml`,drawing],[`xl/worksheets/_rels/sheet${i+1}.xml.rels`,sheetRel],[`xl/drawings/_rels/drawing${i+1}.xml.rels`,imageRel],...(sheet.chart ? [[`xl/charts/chart${i+1}.xml`,civantaChartXml(sheet)]] : [])];
 });
 return zipStored([['[Content_Types].xml',types],['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],['xl/workbook.xml',workbook],['xl/_rels/workbook.xml.rels',rels],['xl/styles.xml',styles],...sheets.map((s,i)=>[`xl/worksheets/sheet${i+1}.xml`,cvWorksheetXml(s)]),...assets,['xl/media/gbw-logo.png',png]]);
}
renderSetup();show(0);
