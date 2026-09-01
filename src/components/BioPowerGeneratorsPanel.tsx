import { useState } from "react";
import { Zap } from "lucide-react";
import {
  ChartBars,
  ChartHeat,
  ChartPanel,
  ChartScatter,
  ChartTable,
  PANEL_VIEWS,
  chartFmt as fmt,
  type PanelView,
  type ScatterPoint,
} from "@/components/chart-kit";
import { detailTone, useEntityDetail, type GraphContext } from "@/components/EntityDetailSheet";
import { ChartFilterBar, countryFilterOptions, useChartFilter } from "@/components/chart-filters";
import { entityLogoByName } from "@/lib/entity-logos";
import { BIOPOWER_TICKERS } from "@/lib/entity-tickers";
import { priceMeta, priceTone, useEntityQuotes } from "@/lib/use-entity-quotes";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { ChartSummaryAssistant } from "@/components/ChartSummaryAssistant";

type Generator = {
  name: string;
  country: string;
  flag: string;
  /** Installed biomass / biofuel generating capacity, MW */
  capacityMw: number;
  /** Annual electricity generated from biofuels, GWh per year */
  generationGwh: number;
  feedstock: string;
  note: string;
};

/**
 * Global electricity generators burning biofuels — solid biomass, bagasse,
 * biogas, waste-to-energy and co-firing fleets. Capacities are indicative
 * installed MW of biofuel-fired generation.
 */
const GENERATORS: Generator[] = [
  // ---------- United Kingdom & Europe ----------
  { name: "Drax Power", country: "United Kingdom", flag: "🇬🇧", capacityMw: 2600, generationGwh: 14000, feedstock: "Wood pellets", note: "World's largest single-site biomass plant, former coal station fully converted" },
  { name: "Lynemouth Power (EPH)", country: "United Kingdom", flag: "🇬🇧", capacityMw: 420, generationGwh: 2900, feedstock: "Wood pellets", note: "Coal-to-biomass conversion supplying UK capacity market" },
  { name: "Ørsted bioenergy", country: "Denmark", flag: "🇩🇰", capacityMw: 800, generationGwh: 3600, feedstock: "Wood chips / straw", note: "Biomass CHP fleet across Greater Copenhagen and Jutland" },
  { name: "RWE bioenergy", country: "Netherlands", flag: "🇳🇱", capacityMw: 700, generationGwh: 4100, feedstock: "Wood pellets", note: "Amer and Eemshaven co-firing ahead of planned full biomass conversion" },
  { name: "Uniper Maasvlakte", country: "Netherlands", flag: "🇳🇱", capacityMw: 180, generationGwh: 900, feedstock: "Biomass / waste", note: "Maasvlakte co-firing and Provence biomass conversion projects" },
  { name: "E.ON bioenergy & waste", country: "Germany", flag: "🇩🇪", capacityMw: 450, generationGwh: 2400, feedstock: "Biogas / biomass", note: "Distributed biomass CHP and biogas plants across Germany and Sweden" },
  { name: "RWE Americas biomass", country: "United States", flag: "🇺🇸", capacityMw: 200, generationGwh: 1400, feedstock: "Biomass", note: "Legacy US biomass fleet inside the RWE clean energy portfolio" },
  { name: "Fortum CHP", country: "Finland", flag: "🇫🇮", capacityMw: 950, generationGwh: 3800, feedstock: "Forest residues / waste", note: "Nordic bio-CHP and waste-to-energy fleet after the Polish divestment" },
  { name: "Vattenfall biomass", country: "Sweden", flag: "🇸🇪", capacityMw: 600, generationGwh: 2100, feedstock: "Wood chips / residues", note: "District-heating biomass boilers in Uppsala and Berlin joint operations" },
  { name: "Statkraft bioenergy", country: "Norway", flag: "🇳🇴", capacityMw: 260, generationGwh: 1100, feedstock: "Forest biomass", note: "Tofte and district-heating bioenergy plants in Norway" },
  { name: "Engie bioenergy", country: "France", flag: "🇫🇷", capacityMw: 800, generationGwh: 3200, feedstock: "Biomass / biogas / RDF", note: "Biomass CHP, biogas-to-grid and waste recovery plants across France" },
  { name: "Veolia waste-to-energy", country: "France", flag: "🇫🇷", capacityMw: 1300, generationGwh: 5600, feedstock: "Municipal waste / biogas", note: "Global EfW fleet plus landfill and digester biogas generation" },
  { name: "PGE biomass cofiring", country: "Poland", flag: "🇵🇱", capacityMw: 350, generationGwh: 1800, feedstock: "Wood biomass", note: "Co-firing biomass in Polish lignite and hard-coal stations" },
  { name: "A2A waste-to-energy", country: "Italy", flag: "🇮🇹", capacityMw: 700, generationGwh: 3200, feedstock: "Waste / biogas", note: "Milan-area EfW fleet and anaerobic digestion generation" },
  { name: "Ence biomass", country: "Spain", flag: "🇪🇸", capacityMw: 270, generationGwh: 1700, feedstock: "Forest residues / agro", note: "Iberia's largest dedicated biomass generation fleet" },

  // ---------- United States & Canada ----------
  { name: "Georgia-Pacific", country: "United States", flag: "🇺🇸", capacityMw: 900, generationGwh: 5200, feedstock: "Black liquor / wood waste", note: "Pulp-mill biomass cogeneration across US Southeast mills" },
  { name: "Duke Energy bioenergy", country: "United States", flag: "🇺🇸", capacityMw: 250, generationGwh: 1400, feedstock: "Biogas / wood", note: "Swine and landfill biogas generation plus biomass co-firing" },
  { name: "Southern Company biomass", country: "United States", flag: "🇺🇸", capacityMw: 300, generationGwh: 1900, feedstock: "Wood / landfill gas", note: "Georgia biomass and landfill-gas fleet under state PPAs" },
  { name: "Dominion biomass", country: "United States", flag: "🇺🇸", capacityMw: 230, generationGwh: 1600, feedstock: "Wood", note: "Three 51 MW woody-biomass stations in Virginia" },
  { name: "We Energies biomass", country: "United States", flag: "🇺🇸", capacityMw: 50, generationGwh: 300, feedstock: "Wood waste", note: "Rothschild biomass plant running on sawmill residues" },
  { name: "Boralex biomass", country: "Canada", flag: "🇨🇦", capacityMw: 300, generationGwh: 1800, feedstock: "Wood residues", note: "Biomass cogeneration in Quebec, France and the US Northeast" },
  { name: "BC Hydro biomass IPPs", country: "Canada", flag: "🇨🇦", capacityMw: 800, generationGwh: 4800, feedstock: "Sawmill residues", note: "Independent biomass projects under BC Hydro electricity purchase agreements" },

  // ---------- Brazil & Latin America ----------
  { name: "Raízen bioenergy", country: "Brazil", flag: "🇧🇷", capacityMw: 1100, generationGwh: 5200, feedstock: "Sugarcane bagasse", note: "Largest bagasse cogeneration exporter to Brazil's grid" },
  { name: "Copersucar mills", country: "Brazil", flag: "🇧🇷", capacityMw: 900, generationGwh: 4300, feedstock: "Bagasse", note: "Mill cooperative fleet exporting surplus bagasse power" },
  { name: "FS Bioenergia cogeneration", country: "Brazil", flag: "🇧🇷", capacityMw: 180, generationGwh: 900, feedstock: "Bagasse / wood", note: "Mato Grosso corn-ethanol plants with biomass self-generation" },
  { name: "Suzano bioenergy", country: "Brazil", flag: "🇧🇷", capacityMw: 500, generationGwh: 2400, feedstock: "Black liquor", note: "Pulp mill cogeneration exporting renewable power to the grid" },

  // ---------- Asia Pacific ----------
  { name: "eREX biomass", country: "Japan", flag: "🇯🇵", capacityMw: 350, generationGwh: 2000, feedstock: "Wood pellets / PKS", note: "Japan's largest independent biomass IPP across Tohoku and Kyushu" },
  { name: "Renova", country: "Japan", flag: "🇯🇵", capacityMw: 330, generationGwh: 1800, feedstock: "Wood pellets / PKS", note: "Tokyo-listed biomass developer with plants from Akita to Okinawa" },
  { name: "Sumitomo Forestry power", country: "Japan", flag: "🇯🇵", capacityMw: 250, generationGwh: 1600, feedstock: "Wood biomass", note: "Woody-biomass plants in Mombetsu, Hachinohe and Tomakomai" },
  { name: "KEPCO biomass cofiring", country: "South Korea", flag: "🇰🇷", capacityMw: 300, generationGwh: 1500, feedstock: "Wood pellets", note: "Biomass co-firing in coal fleet under Korea's RPS obligations" },
  { name: "NTPC biomass cofiring", country: "India", flag: "🇮🇳", capacityMw: 400, generationGwh: 2200, feedstock: "Agro-residue pellets", note: "National SAMARTH co-firing programme replacing coal with crop residue" },
  { name: "Gulf Energy bioenergy", country: "Thailand", flag: "🇹🇭", capacityMw: 220, generationGwh: 1300, feedstock: "Rice husk / bagasse", note: "Agro-waste biomass plants across Thailand" },
  { name: "Medco biomass & WtE", country: "Indonesia", flag: "🇮🇩", capacityMw: 90, generationGwh: 450, feedstock: "Palm waste", note: "Palm-oil-mill-waste generation in Sumatra" },
  { name: "Cleanaway WtE", country: "Australia", flag: "🇦🇺", capacityMw: 70, generationGwh: 420, feedstock: "Waste / landfill gas", note: "Landfill-gas generation and Kwinana waste-to-energy participation" },

  // ---------- Nordics & other regions ----------
  { name: "UPM bioenergy", country: "Finland", flag: "🇫🇮", capacityMw: 1000, generationGwh: 4800, feedstock: "Black liquor / residues", note: "Pulp mill CHP fleet in Finland, Germany and Uruguay" },
  { name: "Stora Enso energy", country: "Sweden", flag: "🇸🇪", capacityMw: 950, generationGwh: 4600, feedstock: "Black liquor / wood", note: "Mill bioenergy across Sweden, Finland, Poland and Brazil" },
  { name: "SCA biomass", country: "Sweden", flag: "🇸🇪", capacityMw: 600, generationGwh: 2800, feedstock: "Forest residues", note: "Östrand and Obbola mills among Europe's largest bio-CHP sites" },
  { name: "Södra bioenergy", country: "Sweden", flag: "🇸🇪", capacityMw: 450, generationGwh: 2200, feedstock: "Black liquor", note: "Member-owned pulp mills exporting surplus biomass power" },
  { name: "Mondi bioenergy", country: "South Africa", flag: "🇿🇦", capacityMw: 250, generationGwh: 1300, feedstock: "Black liquor / bark", note: "Mill biomass cogeneration across Europe and South Africa" },
  { name: "MPC Biomass (Muara Enim)", country: "Indonesia", flag: "🇮🇩", capacityMw: 130, generationGwh: 700, feedstock: "Empty fruit bunches", note: "Palm-waste biomass projects replacing diesel gensets" },
  { name: "Essex Bioenergy / Renewi EfW", country: "United Kingdom", flag: "🇬🇧", capacityMw: 260, generationGwh: 1500, feedstock: "Municipal waste", note: "UK waste-to-energy fleet under long-term council contracts" },
  { name: "Hitachi Zosen Inova", country: "Switzerland", flag: "🇨🇭", capacityMw: 900, generationGwh: 5200, feedstock: "Municipal waste / biogas", note: "Global EfW EPC and operator with plants on four continents" },
];

type Metric = "capacity" | "generation" | "price";

const METRICS: Record<
  Metric,
  { label: string; unit: string; help: string; decimals: number; value: (g: Generator) => number }
> = {
  capacity: {
    label: "Biofuel capacity (MW)",
    unit: "MW of installed biofuel-fired generation",
    help: "Installed generating capacity that runs on solid biomass, bagasse, biogas or waste-derived fuels. Bigger tiles mean more biofuel-fired megawatts.",
    decimals: 0,
    value: (g) => g.capacityMw,
  },
  generation: {
    label: "Biofuel generation (GWh/yr)",
    unit: "GWh of electricity generated from biofuels / year",
    help: "Indicative annual electricity generated from biofuels. High capacity factors on biomass mean the biggest plants here punch above their MW.",
    decimals: 0,
    value: (g) => g.generationGwh,
  },
  price: {
    label: "Share price (listing currency)",
    unit: "share price, primary listing currency",
    help: "Latest traded share price on the generator's primary listing. State-owned and private operators have no listing and sit at the end.",
    decimals: 2,
    value: () => 0,
  },
};

function scatterAxes(metricKey: Metric) {
  if (metricKey === "capacity") {
    return {
      x: { metric: METRICS.generation, help: "X-axis shows annual biofuel generation; Y-axis shows installed biofuel capacity." },
      size: { label: "Biofuel capacity", unit: "MW", value: (g: Generator) => g.capacityMw },
    };
  }
  return {
    x: { metric: METRICS.capacity, help: "X-axis shows installed biofuel capacity; Y-axis shows the selected measure." },
    size: { label: "Biofuel generation", unit: "GWh/yr", value: (g: Generator) => g.generationGwh },
  };
}

const TITLE = "Global electricity generators using biofuel";
const NEWS_SUFFIX = "biomass biogas power generation";

export function BioPowerGeneratorsPanel() {
  const [metricKey, setMetricKey] = useState<Metric>("capacity");
  const [view, setView] = useState<PanelView>("heat");
  const detail = useEntityDetail();
  const { get } = useEntityQuotes();
  const metric = METRICS[metricKey];
  const valueOf = (g: Generator) =>
    metricKey === "price" ? (get(BIOPOWER_TICKERS[g.name])?.price ?? 0) : metric.value(g);

  const f = useChartFilter(GENERATORS, {
    text: (g) => `${g.name} ${g.country} ${g.feedstock} ${g.note}`,
    facetA: (g) => g.country,
    facetB: (g) => g.feedstock,
  });
  const ranked = f.filtered.slice().sort((a, b) => valueOf(b) - valueOf(a));
  const isFiltered = Boolean(f.a || f.b || f.query.trim());
  const rows = ranked.slice(0, isFiltered ? 20 : 10);

  const axes = scatterAxes(metricKey);
  const scatterPoints: ScatterPoint[] = rows.map((g) => ({
    key: g.name,
    label: g.name,
    sub: `${g.country} · ${g.feedstock}`,
    x: axes.x.metric.value(g),
    y: valueOf(g),
    size: axes.size.value(g),
    group: g.country,
    logo: entityLogoByName(g.name),
    meta: priceMeta(get(BIOPOWER_TICKERS[g.name])),
    changePct: get(BIOPOWER_TICKERS[g.name])?.changePct,
    newsTarget: { name: g.name, query: `"${g.name}" ${NEWS_SUFFIX}` },
  }));

  const items = rows.map((g) => ({
    key: g.name,
    label: g.name,
    sub: `${g.feedstock} · ${g.note}`,
    value: valueOf(g),
    logo: entityLogoByName(g.name),
    meta: priceMeta(get(BIOPOWER_TICKERS[g.name])),
    tone: priceTone(get(BIOPOWER_TICKERS[g.name])),
    changePct: get(BIOPOWER_TICKERS[g.name])?.changePct,
  }));
  const newsMap = Object.fromEntries(
    rows.map((g) => [g.name, { name: g.name, query: `"${g.name}" ${NEWS_SUFFIX}` }]),
  );
  const filters: [string, string][] = [
    ["Country", f.a || "All countries"],
    ["Feedstock", f.b || "All feedstocks"],
  ];
  if (f.query.trim()) filters.push(["Search", `"${f.query.trim()}"`]);
  const graph: GraphContext = {
    measure: metric.label,
    unit: metric.unit,
    view: PANEL_VIEWS.find((v) => v.value === view)?.label ?? view,
    filters,
    items: rows.map((g) => ({ name: g.name, value: valueOf(g) })),
    format: (n: number) => fmt(n, metric.decimals),
  };
  const onSelect = detail.onSelect((target) => {
    const g = rows.find((r) => r.name === target?.name);
    if (!g) return null;
    const q = get(BIOPOWER_TICKERS[g.name]);
    return {
      name: g.name,
      sub: `${g.flag} ${g.country}`,
      logo: entityLogoByName(g.name),
      note: g.note,
      stats: [
        { label: "Biofuel capacity", value: `${fmt(g.capacityMw, 0)} MW` },
        { label: "Biofuel generation", value: `${fmt(g.generationGwh, 0)} GWh/yr` },
        { label: "Feedstock", value: g.feedstock },
        { label: "Ticker", value: BIOPOWER_TICKERS[g.name] ?? "Not listed" },
        { label: "Share price", value: q ? fmt(q.price, 2) : "—" },
        {
          label: "1-day change",
          value: q ? `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%` : "—",
          tone: detailTone(q?.changePct),
        },
      ],
      news: { name: g.name, query: `"${g.name}" ${NEWS_SUFFIX}` },
    };
  }, graph);

  return (
    <>
      {detail.sheet}
      <ChartPanel
        icon={Zap}
        title={TITLE}
        blurb="Power utilities and IPPs generating electricity from solid biomass, sugarcane bagasse, biogas and waste-derived fuels."
        metricValue={metricKey}
        metricOptions={(Object.keys(METRICS) as Metric[]).map((m) => ({
          value: m,
          label: METRICS[m].label,
        }))}
        onMetricChange={(v) => setMetricKey(v as Metric)}
        viewValue={view}
        viewOptions={PANEL_VIEWS}
        onViewChange={(v) => setView(v as PanelView)}
        actions={
          <ExportCsvButton
            disabled={ranked.length === 0}
            build={() => ({
              title: TITLE,
              filename: "global-biopower-generators",
              note: `Measure shown: ${metric.label}`,
              header: [
                "Generator",
                "Country",
                "Feedstock",
                "Biofuel capacity (MW)",
                "Biofuel generation (GWh/yr)",
                "Ticker",
                "Share price",
                "1-day change %",
                "Note",
              ],
              rows: ranked.map((g) => {
                const q = get(BIOPOWER_TICKERS[g.name]);
                return [
                  g.name,
                  g.country,
                  g.feedstock,
                  g.capacityMw,
                  g.generationGwh,
                  BIOPOWER_TICKERS[g.name] ?? "",
                  q ? q.price.toFixed(2) : "",
                  q ? q.changePct.toFixed(2) : "",
                  g.note,
                ];
              }),
            })}
          />
        }
        filters={
          <ChartFilterBar
            query={f.query}
            onQueryChange={f.setQuery}
            placeholder="Search biofuel generators…"
            selects={[
              {
                label: "Country",
                value: f.a,
                options: countryFilterOptions(GENERATORS.map((g) => g.country)),
                onChange: f.setA,
                allLabel: "All countries",
              },
              {
                label: "Feedstock",
                value: f.b,
                options: countryFilterOptions(GENERATORS.map((g) => g.feedstock)),
                onChange: f.setB,
                allLabel: "All feedstocks",
              },
            ]}
            shown={rows.length}
            total={GENERATORS.length}
            matched={ranked.length}
          />
        }
        footnote="Indicative biofuel-fired capacities from generator annual reports, IEA Bioenergy and national renewables registries. Click any tile for the latest news."
        assistant={
          <ChartSummaryAssistant
            disabled={rows.length === 0}
            build={() => ({
              panel: TITLE,
              measureLabel: metric.label,
              unit: metric.unit,
              filterLabel: [
                f.a || "All countries",
                f.b || "All feedstocks",
                f.query ? `search "${f.query}"` : "",
              ]
                .filter(Boolean)
                .join(" · "),
              shown: rows.length,
              total: GENERATORS.length,
              rows: rows.map((g) => ({
                label: g.name,
                sub: `${g.country} · ${g.feedstock} · ${g.note}`,
                value: valueOf(g),
                price: get(BIOPOWER_TICKERS[g.name])?.price,
                changePct: get(BIOPOWER_TICKERS[g.name])?.changePct,
              })),
            })}
          />
        }
      >
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No biofuel generators listed for this filter — open that country's profile page for its
            policy and market updates.
          </p>
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
            indexLabel="Global biofuel power generation index"
          />
        ) : view === "bars" ? (
          <ChartBars
            items={items}
            unitLabel={metric.unit}
            yLabel="Biofuel generator"
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
            indexLabel="Global biofuel power generation index"
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
