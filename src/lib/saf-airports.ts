export type SafSupplyStatus = "regular" | "periodic" | "announced";

export type SafAirport = {
  iata: string;
  name: string;
  city: string;
  country: string;
  /** Slug of a tracked jurisdiction, when one exists. */
  countrySlug: string | null;
  lat: number;
  lon: number;
  status: SafSupplyStatus;
  suppliers: string;
};

export const SAF_STATUS_LABEL: Record<SafSupplyStatus, string> = {
  regular: "Regular supply",
  periodic: "Periodic uplift",
  announced: "Announced / ramping",
};

export const SAF_STATUS_RADIUS: Record<SafSupplyStatus, number> = {
  regular: 3.2,
  periodic: 2.4,
  announced: 1.8,
};

/**
 * Curated list of airports with sustainable aviation fuel uplift, compiled from
 * published airport, fuel-supplier and airline disclosures. Indicative, not
 * exhaustive.
 */
export const SAF_AIRPORTS: SafAirport[] = [
  // Europe
  { iata: "AMS", name: "Amsterdam Schiphol", city: "Amsterdam", country: "Netherlands", countrySlug: "netherlands", lat: 52.31, lon: 4.76, status: "regular", suppliers: "Neste, SkyNRG — blended into the hydrant system" },
  { iata: "OSL", name: "Oslo Gardermoen", city: "Oslo", country: "Norway", countrySlug: null, lat: 60.19, lon: 11.1, status: "regular", suppliers: "Neste, Air BP — Norwegian 0.5% blending mandate" },
  { iata: "ARN", name: "Stockholm Arlanda", city: "Stockholm", country: "Sweden", countrySlug: "sweden", lat: 59.65, lon: 17.92, status: "regular", suppliers: "Neste, Swedavia SAF programme" },
  { iata: "CDG", name: "Paris Charles de Gaulle", city: "Paris", country: "France", countrySlug: "france", lat: 49.01, lon: 2.55, status: "regular", suppliers: "TotalEnergies — French 1% blending mandate" },
  { iata: "ORY", name: "Paris Orly", city: "Paris", country: "France", countrySlug: "france", lat: 48.73, lon: 2.37, status: "regular", suppliers: "TotalEnergies La Mède supply" },
  { iata: "LHR", name: "London Heathrow", city: "London", country: "United Kingdom", countrySlug: "united-kingdom", lat: 51.47, lon: -0.45, status: "regular", suppliers: "Neste, Valero — UK SAF mandate compliance" },
  { iata: "LGW", name: "London Gatwick", city: "London", country: "United Kingdom", countrySlug: "united-kingdom", lat: 51.15, lon: -0.19, status: "periodic", suppliers: "UK SAF mandate blending via shared pipeline" },
  { iata: "FRA", name: "Frankfurt", city: "Frankfurt", country: "Germany", countrySlug: "germany", lat: 50.03, lon: 8.56, status: "regular", suppliers: "Lufthansa Group, Neste — ReFuelEU blending" },
  { iata: "MUC", name: "Munich", city: "Munich", country: "Germany", countrySlug: "germany", lat: 48.35, lon: 11.79, status: "regular", suppliers: "Lufthansa Group SAF programme" },
  { iata: "MAD", name: "Madrid Barajas", city: "Madrid", country: "Spain", countrySlug: null, lat: 40.47, lon: -3.56, status: "regular", suppliers: "Repsol, Cepsa/Moeve — Iberia uplift" },
  { iata: "BCN", name: "Barcelona El Prat", city: "Barcelona", country: "Spain", countrySlug: null, lat: 41.3, lon: 2.08, status: "regular", suppliers: "Repsol SAF from Tarragona" },
  { iata: "FCO", name: "Rome Fiumicino", city: "Rome", country: "Italy", countrySlug: null, lat: 41.8, lon: 12.25, status: "regular", suppliers: "Eni Enilive — ITA Airways uplift" },
  { iata: "MXP", name: "Milan Malpensa", city: "Milan", country: "Italy", countrySlug: null, lat: 45.63, lon: 8.72, status: "periodic", suppliers: "Eni Enilive supply" },
  { iata: "ZRH", name: "Zurich", city: "Zurich", country: "Switzerland", countrySlug: null, lat: 47.46, lon: 8.55, status: "regular", suppliers: "Swiss CO2 Act blending obligation" },
  { iata: "GVA", name: "Geneva", city: "Geneva", country: "Switzerland", countrySlug: null, lat: 46.24, lon: 6.11, status: "periodic", suppliers: "Neste truck uplift" },
  { iata: "CPH", name: "Copenhagen Kastrup", city: "Copenhagen", country: "Denmark", countrySlug: null, lat: 55.62, lon: 12.66, status: "regular", suppliers: "Danish SAF blending from 2025" },
  { iata: "HEL", name: "Helsinki Vantaa", city: "Helsinki", country: "Finland", countrySlug: null, lat: 60.32, lon: 24.96, status: "regular", suppliers: "Neste — home-market supply" },
  { iata: "VIE", name: "Vienna", city: "Vienna", country: "Austria", countrySlug: null, lat: 48.11, lon: 16.57, status: "regular", suppliers: "OMV SAF from Schwechat refinery" },
  { iata: "BRU", name: "Brussels", city: "Brussels", country: "Belgium", countrySlug: null, lat: 50.9, lon: 4.48, status: "regular", suppliers: "TotalEnergies — ReFuelEU blending" },
  { iata: "LIS", name: "Lisbon Humberto Delgado", city: "Lisbon", country: "Portugal", countrySlug: null, lat: 38.77, lon: -9.13, status: "periodic", suppliers: "Galp SAF from Sines" },
  { iata: "DUB", name: "Dublin", city: "Dublin", country: "Ireland", countrySlug: null, lat: 53.43, lon: -6.27, status: "periodic", suppliers: "Neste imports, ReFuelEU compliance" },
  { iata: "WAW", name: "Warsaw Chopin", city: "Warsaw", country: "Poland", countrySlug: null, lat: 52.17, lon: 20.97, status: "announced", suppliers: "Orlen SAF ramp-up" },
  { iata: "IST", name: "Istanbul", city: "Istanbul", country: "Türkiye", countrySlug: null, lat: 41.28, lon: 28.75, status: "periodic", suppliers: "Tüpraş domestic SAF blending" },

  // North America
  { iata: "SFO", name: "San Francisco Intl", city: "San Francisco", country: "United States", countrySlug: "united-states", lat: 37.62, lon: -122.38, status: "regular", suppliers: "Neste, World Energy — LCFS-backed supply" },
  { iata: "LAX", name: "Los Angeles Intl", city: "Los Angeles", country: "United States", countrySlug: "united-states", lat: 33.94, lon: -118.41, status: "regular", suppliers: "World Energy Paramount, Neste" },
  { iata: "SEA", name: "Seattle-Tacoma Intl", city: "Seattle", country: "United States", countrySlug: "united-states", lat: 47.45, lon: -122.31, status: "regular", suppliers: "Alaska Airlines SAF corridor, Neste" },
  { iata: "ORD", name: "Chicago O'Hare", city: "Chicago", country: "United States", countrySlug: "united-states", lat: 41.98, lon: -87.9, status: "regular", suppliers: "United Airlines, Neste blend at hydrant" },
  { iata: "IAH", name: "Houston George Bush", city: "Houston", country: "United States", countrySlug: "united-states", lat: 29.99, lon: -95.34, status: "periodic", suppliers: "United Airlines Gulf Coast supply" },
  { iata: "JFK", name: "New York JFK", city: "New York", country: "United States", countrySlug: "united-states", lat: 40.64, lon: -73.78, status: "periodic", suppliers: "Delta, JetBlue barge deliveries" },
  { iata: "BOS", name: "Boston Logan", city: "Boston", country: "United States", countrySlug: "united-states", lat: 42.36, lon: -71.01, status: "periodic", suppliers: "JetBlue World Energy offtake" },
  { iata: "DEN", name: "Denver Intl", city: "Denver", country: "United States", countrySlug: "united-states", lat: 39.86, lon: -104.67, status: "announced", suppliers: "Gevo Net-Zero 1 planned supply" },
  { iata: "ATL", name: "Atlanta Hartsfield-Jackson", city: "Atlanta", country: "United States", countrySlug: "united-states", lat: 33.64, lon: -84.43, status: "announced", suppliers: "Delta SAF hub development" },
  { iata: "PHX", name: "Phoenix Sky Harbor", city: "Phoenix", country: "United States", countrySlug: "united-states", lat: 33.44, lon: -112.01, status: "periodic", suppliers: "American Airlines Gevo offtake" },
  { iata: "YYZ", name: "Toronto Pearson", city: "Toronto", country: "Canada", countrySlug: "canada", lat: 43.68, lon: -79.63, status: "periodic", suppliers: "Air Canada, Canadian SAF coalition" },
  { iata: "YVR", name: "Vancouver Intl", city: "Vancouver", country: "Canada", countrySlug: "canada", lat: 49.19, lon: -123.18, status: "regular", suppliers: "BC low-carbon fuel standard supply" },
  { iata: "YUL", name: "Montréal-Trudeau", city: "Montréal", country: "Canada", countrySlug: "canada", lat: 45.47, lon: -73.74, status: "announced", suppliers: "SAF+ Consortium pilot volumes" },
  { iata: "MEX", name: "Mexico City Intl", city: "Mexico City", country: "Mexico", countrySlug: null, lat: 19.44, lon: -99.07, status: "announced", suppliers: "Early SAF import trials" },

  // Latin America
  { iata: "GRU", name: "São Paulo Guarulhos", city: "São Paulo", country: "Brazil", countrySlug: "brazil", lat: -23.43, lon: -46.47, status: "periodic", suppliers: "Raízen, Petrobras — Fuel of the Future law" },
  { iata: "GIG", name: "Rio de Janeiro Galeão", city: "Rio de Janeiro", country: "Brazil", countrySlug: "brazil", lat: -22.81, lon: -43.25, status: "announced", suppliers: "Petrobras SAF programme" },
  { iata: "BOG", name: "Bogotá El Dorado", city: "Bogotá", country: "Colombia", countrySlug: "colombia", lat: 4.7, lon: -74.15, status: "announced", suppliers: "Ecopetrol SAF pilot" },
  { iata: "SCL", name: "Santiago Arturo Merino Benítez", city: "Santiago", country: "Chile", countrySlug: null, lat: -33.39, lon: -70.79, status: "announced", suppliers: "HIF e-fuels and SAF roadmap" },

  // Asia-Pacific
  { iata: "SIN", name: "Singapore Changi", city: "Singapore", country: "Singapore", countrySlug: null, lat: 1.36, lon: 103.99, status: "regular", suppliers: "Neste Singapore refinery — 1% SAF levy from 2026" },
  { iata: "HND", name: "Tokyo Haneda", city: "Tokyo", country: "Japan", countrySlug: "japan", lat: 35.55, lon: 139.78, status: "regular", suppliers: "Cosmo, ENEOS — Japan 10% by 2030 target" },
  { iata: "NRT", name: "Tokyo Narita", city: "Tokyo", country: "Japan", countrySlug: "japan", lat: 35.77, lon: 140.39, status: "regular", suppliers: "ENEOS, Neste imports" },
  { iata: "KIX", name: "Osaka Kansai", city: "Osaka", country: "Japan", countrySlug: "japan", lat: 34.43, lon: 135.23, status: "periodic", suppliers: "Cosmo Sakai SAF plant" },
  { iata: "ICN", name: "Seoul Incheon", city: "Seoul", country: "South Korea", countrySlug: "south-korea", lat: 37.46, lon: 126.44, status: "regular", suppliers: "SK Energy, HD Hyundai — 1% mandate from 2027" },
  { iata: "HKG", name: "Hong Kong Intl", city: "Hong Kong", country: "Hong Kong", countrySlug: null, lat: 22.31, lon: 113.91, status: "periodic", suppliers: "Cathay Pacific corporate SAF programme" },
  { iata: "PVG", name: "Shanghai Pudong", city: "Shanghai", country: "China", countrySlug: "china", lat: 31.14, lon: 121.81, status: "periodic", suppliers: "Sinopec Zhenhai SAF trials" },
  { iata: "PEK", name: "Beijing Capital", city: "Beijing", country: "China", countrySlug: "china", lat: 40.08, lon: 116.58, status: "periodic", suppliers: "Sinopec national SAF pilot programme" },
  { iata: "DEL", name: "Delhi Indira Gandhi", city: "Delhi", country: "India", countrySlug: "india", lat: 28.56, lon: 77.1, status: "announced", suppliers: "Indian Oil, Praj — 1% SAF indicative target" },
  { iata: "BOM", name: "Mumbai Chhatrapati Shivaji", city: "Mumbai", country: "India", countrySlug: "india", lat: 19.09, lon: 72.87, status: "announced", suppliers: "IOC/HPCL SAF blending trials" },
  { iata: "CGK", name: "Jakarta Soekarno-Hatta", city: "Jakarta", country: "Indonesia", countrySlug: "indonesia", lat: -6.13, lon: 106.66, status: "periodic", suppliers: "Pertamina J2.4 bioavtur blend" },
  { iata: "KUL", name: "Kuala Lumpur Intl", city: "Kuala Lumpur", country: "Malaysia", countrySlug: "malaysia", lat: 2.75, lon: 101.71, status: "announced", suppliers: "Petronas SAF roadmap" },
  { iata: "BKK", name: "Bangkok Suvarnabhumi", city: "Bangkok", country: "Thailand", countrySlug: "thailand", lat: 13.69, lon: 100.75, status: "periodic", suppliers: "Bangchak SAF unit supply" },
  { iata: "SYD", name: "Sydney Kingsford Smith", city: "Sydney", country: "Australia", countrySlug: "australia", lat: -33.94, lon: 151.18, status: "periodic", suppliers: "Qantas SAF fund, imported blends" },
  { iata: "MEL", name: "Melbourne Tullamarine", city: "Melbourne", country: "Australia", countrySlug: "australia", lat: -37.67, lon: 144.84, status: "announced", suppliers: "Domestic SAF projects in development" },
  { iata: "AKL", name: "Auckland", city: "Auckland", country: "New Zealand", countrySlug: null, lat: -37.01, lon: 174.79, status: "periodic", suppliers: "Air New Zealand Neste imports" },

  // Middle East & Africa
  { iata: "DXB", name: "Dubai Intl", city: "Dubai", country: "UAE", countrySlug: "united-arab-emirates", lat: 25.25, lon: 55.36, status: "regular", suppliers: "Neste supply for Emirates uplift" },
  { iata: "AUH", name: "Abu Dhabi Zayed Intl", city: "Abu Dhabi", country: "UAE", countrySlug: "united-arab-emirates", lat: 24.43, lon: 54.65, status: "periodic", suppliers: "ADNOC/Masdar SAF initiatives" },
  { iata: "DOH", name: "Doha Hamad Intl", city: "Doha", country: "Qatar", countrySlug: null, lat: 25.27, lon: 51.61, status: "periodic", suppliers: "Qatar Airways Shell SAF agreement" },
  { iata: "RUH", name: "Riyadh King Khalid", city: "Riyadh", country: "Saudi Arabia", countrySlug: "saudi-arabia", lat: 24.96, lon: 46.7, status: "announced", suppliers: "Aramco SAF development" },
  { iata: "JNB", name: "Johannesburg O.R. Tambo", city: "Johannesburg", country: "South Africa", countrySlug: "south-africa", lat: -26.14, lon: 28.25, status: "announced", suppliers: "Sasol/Haldor Topsoe SAF venture" },
  { iata: "NBO", name: "Nairobi Jomo Kenyatta", city: "Nairobi", country: "Kenya", countrySlug: "kenya", lat: -1.32, lon: 36.93, status: "announced", suppliers: "Kenya Airways SAF pilot flights" },
];
