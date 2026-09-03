import { useState } from "react";
import { Flame } from "lucide-react";
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
import { useEntityDetail, type GraphContext } from "@/components/EntityDetailSheet";
import { ChartFilterBar, countryFilterOptions, useChartFilter } from "@/components/chart-filters";
import { entityLogoByName } from "@/lib/entity-logos";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { ChartSummaryAssistant } from "@/components/ChartSummaryAssistant";

type Producer = {
  name: string;
  country: string;
  flag: string;
  /** Annual renewable natural gas output, million MMBtu per year */
  outputMmbtu: number;
  /** Operating RNG production facilities */
  facilities: number;
  feedstock: string;
  note: string;
};

/**
 * Renewable natural gas (biomethane) producers — landfill gas, dairy and swine
 * manure digesters, wastewater sludge and food-waste digestion upgraded to
 * pipeline-quality gas or liquefied for transport fuel.
 */
const PRODUCERS: Producer[] = [
  // ---------- North America ----------
  { name: "Archaea Energy (bp)", country: "United States", flag: "🇺🇸", outputMmbtu: 26, facilities: 50, feedstock: "Landfill gas", note: "Largest US RNG platform, bp-owned, modular landfill upgrading plants" },
  { name: "Waste Management Renewable Energy", country: "United States", flag: "🇺🇸", outputMmbtu: 22, facilities: 24, feedstock: "Landfill gas", note: "Landfill RNG build-out targeting ~28 plants by 2027" },
  { name: "Republic Services RNG", country: "United States", flag: "🇺🇸", outputMmbtu: 12, facilities: 18, feedstock: "Landfill gas", note: "Landfill gas-to-energy joint ventures with Archaea and Enbridge" },
  { name: "Clean Energy Fuels", country: "United States", flag: "🇺🇸", outputMmbtu: 11, facilities: 12, feedstock: "Dairy / landfill gas", note: "Largest RNG vehicle-fuel marketer across US natural gas stations" },
  { name: "Montauk Renewables", country: "United States", flag: "🇺🇸", outputMmbtu: 6, facilities: 13, feedstock: "Landfill / dairy gas", note: "Pure-play RNG operator with landfill and agricultural digester sites" },
  { name: "Enbridge RNG", country: "Canada", flag: "🇨🇦", outputMmbtu: 8, facilities: 20, feedstock: "Landfill / wastewater", note: "RNG portfolio feeding regulated gas utilities in the US and Ontario" },
  { name: "Brightmark RNG", country: "United States", flag: "🇺🇸", outputMmbtu: 5, facilities: 30, feedstock: "Dairy manure", note: "Dairy digester clusters with Chevron offtake" },
  { name: "Chevron Renewable Energy Group RNG", country: "United States", flag: "🇺🇸", outputMmbtu: 5, facilities: 10, feedstock: "Dairy manure", note: "Manure-based RNG feeding California LCFS transport pools" },
  { name: "Ameresco RNG", country: "United States", flag: "🇺🇸", outputMmbtu: 4.5, facilities: 10, feedstock: "Landfill gas", note: "Landfill RNG plants developed under long-term utility contracts" },
  { name: "OPAL Fuels", country: "United States", flag: "🇺🇸", outputMmbtu: 7, facilities: 26, feedstock: "Landfill / dairy gas", note: "Vertically integrated RNG production plus fuelling station network" },
  { name: "Aemetis Biogas", country: "United States", flag: "🇺🇸", outputMmbtu: 1.2, facilities: 20, feedstock: "Dairy manure", note: "Central Valley dairy digester cluster with dedicated pipeline" },
  { name: "DTE Vantage RNG", country: "United States", flag: "🇺🇸", outputMmbtu: 3.5, facilities: 8, feedstock: "Landfill / dairy gas", note: "Utility-affiliated RNG development arm" },
  { name: "Kinetrex Energy (Kinder Morgan)", country: "United States", flag: "🇺🇸", outputMmbtu: 3, facilities: 6, feedstock: "Landfill gas", note: "Midwest landfill RNG and small-scale LNG supply" },
  { name: "Fortistar", country: "United States", flag: "🇺🇸", outputMmbtu: 2.5, facilities: 12, feedstock: "Landfill gas", note: "Long-standing landfill gas developer converting sites to RNG" },
  { name: "Anaergia", country: "Canada", flag: "🇨🇦", outputMmbtu: 2, facilities: 15, feedstock: "Food & organic waste", note: "Organics digestion and biogas upgrading across North America and Europe" },
  { name: "Waga Energy", country: "France", flag: "🇫🇷", outputMmbtu: 2.2, facilities: 25, feedstock: "Landfill gas", note: "WAGABOX cryogenic upgrading units on landfills in Europe and North America" },
  { name: "GreenGasUSA", country: "United States", flag: "🇺🇸", outputMmbtu: 1, facilities: 9, feedstock: "Wastewater / industrial", note: "Captures biogas at wastewater and food-processing sites" },

  // ---------- Europe ----------
  { name: "Nature Energy (Shell)", country: "Denmark", flag: "🇩🇰", outputMmbtu: 9, facilities: 14, feedstock: "Manure / food waste", note: "Europe's largest manure-based biomethane producer, Shell-owned" },
  { name: "Gasum", country: "Finland", flag: "🇫🇮", outputMmbtu: 4, facilities: 17, feedstock: "Manure / biowaste", note: "Nordic biogas producer with LBG fuelling network for trucks and ships" },
  { name: "Verbio biomethane", country: "Germany", flag: "🇩🇪", outputMmbtu: 6, facilities: 8, feedstock: "Straw / stillage", note: "Straw-to-biomethane plants in Germany, India and the US" },
  { name: "EnviTec Biogas", country: "Germany", flag: "🇩🇪", outputMmbtu: 3.5, facilities: 90, feedstock: "Energy crops / manure", note: "Biogas plant builder and operator with own biomethane fleet" },
  { name: "Engie BiOZ", country: "France", flag: "🇫🇷", outputMmbtu: 3.2, facilities: 30, feedstock: "Agricultural waste", note: "French agricultural biomethane injection portfolio" },
  { name: "TotalEnergies biomethane", country: "France", flag: "🇫🇷", outputMmbtu: 3, facilities: 20, feedstock: "Agricultural waste", note: "European biomethane injection portfolio targeting 20 TWh by 2030" },
  { name: "Nordic Ren-Gas", country: "Finland", flag: "🇫🇮", outputMmbtu: 0.8, facilities: 4, feedstock: "Power-to-gas / biogenic CO₂", note: "E-methane projects pairing biogenic CO₂ with electrolytic hydrogen" },
  { name: "Air Liquide biomethane", country: "France", flag: "🇫🇷", outputMmbtu: 2.8, facilities: 25, feedstock: "Agricultural / landfill", note: "Biomethane production and upgrading units across Europe and the US" },
  { name: "Snam Bioenergy", country: "Italy", flag: "🇮🇹", outputMmbtu: 2.5, facilities: 25, feedstock: "Agricultural / OFMSW", note: "Italian biomethane plants injecting into the national grid" },
  { name: "Iberdrola / Naturgy biomethane", country: "Spain", flag: "🇪🇸", outputMmbtu: 1.5, facilities: 12, feedstock: "Manure / OFMSW", note: "Spanish biomethane plants under the national biogas roadmap" },
  { name: "Future Biogas", country: "United Kingdom", flag: "🇬🇧", outputMmbtu: 1.6, facilities: 11, feedstock: "Energy crops / manure", note: "UK anaerobic digestion operator injecting green gas to the grid" },
  { name: "Bio Capital", country: "United Kingdom", flag: "🇬🇧", outputMmbtu: 1.3, facilities: 12, feedstock: "Food & farm waste", note: "UK green-gas producer under the Green Gas Support Scheme" },
  { name: "Nordic Biogas / Scandinavian Biogas", country: "Sweden", flag: "🇸🇪", outputMmbtu: 1.1, facilities: 8, feedstock: "Manure / sludge", note: "Nordic and Korean biogas plants supplying transport biomethane" },
  { name: "Wärtsilä Biogas Solutions", country: "Finland", flag: "🇫🇮", outputMmbtu: 0.9, facilities: 10, feedstock: "Manure / waste", note: "Biogas upgrading and liquefaction technology with operated assets" },

  // ---------- Asia Pacific & rest of world ----------
  { name: "Gujarat Gas / GGL biomethane", country: "India", flag: "🇮🇳", outputMmbtu: 1.4, facilities: 15, feedstock: "Agri-residue / manure", note: "Compressed biogas offtake under India's SATAT programme" },
  { name: "Indian Oil CBG", country: "India", flag: "🇮🇳", outputMmbtu: 2, facilities: 25, feedstock: "Agri-residue / press mud", note: "Largest SATAT compressed biogas offtaker and plant developer" },
  { name: "Adani Total Gas biogas", country: "India", flag: "🇮🇳", outputMmbtu: 0.7, facilities: 5, feedstock: "MSW / agri-waste", note: "Barsana and Indore compressed biogas plants" },
  { name: "PetroChina biomethane", country: "China", flag: "🇨🇳", outputMmbtu: 2.6, facilities: 20, feedstock: "Straw / manure", note: "Rural biogas upgrading projects feeding provincial pipelines" },
  { name: "Air Water Japan biogas", country: "Japan", flag: "🇯🇵", outputMmbtu: 0.6, facilities: 8, feedstock: "Dairy manure", note: "Hokkaido dairy biogas and liquefied biomethane supply" },
  { name: "Jemena / LMS Energy", country: "Australia", flag: "🇦🇺", outputMmbtu: 0.8, facilities: 10, feedstock: "Landfill / wastewater", note: "Australian landfill biogas and Malabar biomethane injection" },
  { name: "Bio Bin / Bioenergy Brasil", country: "Brazil", flag: "🇧🇷", outputMmbtu: 1.2, facilities: 12, feedstock: "Vinasse / manure", note: "Sugarcane vinasse biogas upgrading in São Paulo state" },
  { name: "Raízen biogas", country: "Brazil", flag: "🇧🇷", outputMmbtu: 1.5, facilities: 6, feedstock: "Vinasse / bagasse", note: "Mill-integrated biogas plants supplying fleet fuel and power" },
];

type Metric = "output" | "facilities";

const METRICS: Record<
  Metric,
  { label: string; unit: string; help: string; decimals: number; value: (p: Producer) => number }
> = {
  output: {
    label: "RNG output (million MMBtu/yr)",
    unit: "million MMBtu of renewable natural gas / year",
    help: "Annual pipeline-quality renewable natural gas produced. Bigger tiles mean more biomethane delivered to grids and vehicle fleets.",
    decimals: 1,
    value: (p) => p.outputMmbtu,
  },
  facilities: {
    label: "Production facilities",
    unit: "operating RNG plants",
    help: "Number of operating digesters or landfill upgrading plants. A large fleet of small plants can rank high here but low on output.",
    decimals: 0,
    value: (p) => p.facilities,
  },
};

function scatterAxes(metricKey: Metric) {
  if (metricKey === "output") {
    return {
      x: { metric: METRICS.facilities, help: "X-axis shows the plant count; Y-axis shows annual RNG output." },
      size: { label: "RNG output", unit: "million MMBtu/yr", value: (p: Producer) => p.outputMmbtu },
    };
  }
  return {
    x: { metric: METRICS.output, help: "X-axis shows annual RNG output; Y-axis shows the selected measure." },
    size: { label: "Production facilities", unit: "plants", value: (p: Producer) => p.facilities },
  };
}

const TITLE = "Global renewable natural gas (RNG) producers";
const NEWS_SUFFIX = "renewable natural gas biomethane";

export function RngProducersPanel() {
  const [metricKey, setMetricKey] = useState<Metric>("output");
  const [view, setView] = useState<PanelView>("heat");
  const detail = useEntityDetail();
  const metric = METRICS[metricKey];
  const valueOf = (p: Producer) => metric.value(p);

  const f = useChartFilter(PRODUCERS, {
    text: (p) => `${p.name} ${p.country} ${p.feedstock} ${p.note}`,
    facetA: (p) => p.country,
    facetB: (p) => p.feedstock,
  });
  const ranked = f.filtered.slice().sort((a, b) => valueOf(b) - valueOf(a));
  const isFiltered = Boolean(f.a || f.b || f.query.trim());
  const rows = view === "table" ? ranked : ranked.slice(0, isFiltered ? 20 : 10);

  const axes = scatterAxes(metricKey);
  const scatterPoints: ScatterPoint[] = rows.map((p) => ({
    key: p.name,
    label: p.name,
    sub: `${p.country} · ${p.feedstock}`,
    x: axes.x.metric.value(p),
    y: valueOf(p),
    size: axes.size.value(p),
    group: p.country,
    logo: entityLogoByName(p.name),
    newsTarget: { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` },
  }));

  const items = rows.map((p) => ({
    key: p.name,
    label: p.name,
    sub: `${p.feedstock} · ${p.note}`,
    value: valueOf(p),
    logo: entityLogoByName(p.name),
  }));
  const newsMap = Object.fromEntries(
    rows.map((p) => [p.name, { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` }]),
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
    items: rows.map((p) => ({ name: p.name, value: valueOf(p) })),
    format: (n: number) => fmt(n, metric.decimals),
  };
  const onSelect = detail.onSelect((target) => {
    const p = rows.find((r) => r.name === target?.name);
    if (!p) return null;
    return {
      name: p.name,
      sub: `${p.flag} ${p.country}`,
      logo: entityLogoByName(p.name),
      note: p.note,
      stats: [
        { label: "RNG output", value: `${fmt(p.outputMmbtu, 1)} million MMBtu/yr` },
        { label: "Production facilities", value: `${fmt(p.facilities, 0)} plants` },
        { label: "Feedstock", value: p.feedstock },
      ],
      news: { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` },
    };
  }, graph);

  return (
    <>
      {detail.sheet}
      <ChartPanel
        icon={Flame}
        title={TITLE}
        blurb="Landfill gas, manure digester, wastewater and food-waste producers upgrading biogas to pipeline-quality renewable natural gas."
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
              filename: "global-rng-producers",
              note: `Measure shown: ${metric.label}`,
              header: [
                "Producer",
                "Country",
                "Feedstock",
                "RNG output (million MMBtu/yr)",
                "Production facilities",
                "Note",
              ],
              rows: ranked.map((p) => [
                  p.name,
                  p.country,
                  p.feedstock,
                  p.outputMmbtu,
                  p.facilities,
                  p.note,
                ]),
            })}
          />
        }
        filters={
          <ChartFilterBar
            query={f.query}
            onQueryChange={f.setQuery}
            placeholder="Search RNG producers…"
            selects={[
              {
                label: "Country",
                value: f.a,
                options: countryFilterOptions(PRODUCERS.map((p) => p.country)),
                onChange: f.setA,
                allLabel: "All countries",
              },
              {
                label: "Feedstock",
                value: f.b,
                options: countryFilterOptions(PRODUCERS.map((p) => p.feedstock)),
                onChange: f.setB,
                allLabel: "All feedstocks",
              },
            ]}
            shown={rows.length}
            total={PRODUCERS.length}
            matched={ranked.length}
          />
        }
        footnote="Indicative RNG volumes from company disclosures, US EPA RIN generation data, the Coalition for Renewable Natural Gas and the European Biogas Association. Click any tile for the latest news."
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
              total: PRODUCERS.length,
              rows: rows.map((p) => ({
                label: p.name,
                sub: `${p.country} · ${p.feedstock} · ${p.note}`,
                value: valueOf(p),
                          })),
            })}
          />
        }
      >
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No RNG producers listed for this filter — open that country's profile page for its
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
            formatSize={(n) => fmt(n, 1)}
            onSelect={onSelect}
            indexLabel="Global RNG production index"
          />
        ) : view === "bars" ? (
          <ChartBars
            items={items}
            unitLabel={metric.unit}
            yLabel="RNG producer"
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
            indexLabel="Global RNG production index"
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
