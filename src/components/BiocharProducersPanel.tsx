import { useState } from "react";
import { Layers } from "lucide-react";
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
  type ScatterPoint,
} from "@/components/chart-kit";
import { ghgSavingsMt, GHG_NOTE } from "@/lib/ghg-savings";
import { detailTone, useEntityDetail, type GraphContext } from "@/components/EntityDetailSheet";
import { priceMeta, priceTone, useEntityQuotes } from "@/lib/use-entity-quotes";
import { ChartFilterBar, countryFilterOptions, useChartFilter } from "@/components/chart-filters";
import { entityLogoByName } from "@/lib/entity-logos";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { ChartSummaryAssistant } from "@/components/ChartSummaryAssistant";
import { marketCapValue, marketCapLabel, MARKET_CAP_NOTE } from "@/lib/market-caps";
import { BIOCHAR_TICKERS } from "@/lib/entity-tickers";

type Producer = {
  name: string;
  country: string;
  flag: string;
  /** Annual biochar production capacity, tonnes per year */
  capacityT: number;
  /** Durable CO2 removal issued or claimed, tonnes CO2e per year */
  co2RemovalT: number;
  feedstock: string;
  note: string;
};

/**
 * Biochar producers — pyrolysis operators turning forestry, agricultural and
 * sludge residues into durable carbon, sold as soil amendment, industrial
 * carbon and carbon-removal credits.
 */
const PRODUCERS: Producer[] = [
  // ---------- Americas ----------
  { name: "Exomad Green", country: "Bolivia", flag: "🇧🇴", capacityT: 60000, co2RemovalT: 120000, feedstock: "Sawmill residues", note: "World's largest biochar producer, Concepción and Riberalta plants" },
  { name: "Wakefield BioChar", country: "United States", flag: "🇺🇸", capacityT: 12000, co2RemovalT: 24000, feedstock: "Forestry residues", note: "US soil-amendment brand with retail and agricultural channels" },
  { name: "Airex Energy", country: "Canada", flag: "🇨🇦", capacityT: 15000, co2RemovalT: 30000, feedstock: "Forest biomass", note: "CarbonFX torrefaction plants scaling with Groupe Rémabec" },
  { name: "Bioforcetech", country: "United States", flag: "🇺🇸", capacityT: 6000, co2RemovalT: 12000, feedstock: "Sewage sludge", note: "Wastewater biosolids pyrolysis with OxyPyr systems" },
  { name: "Pacific Biochar", country: "United States", flag: "🇺🇸", capacityT: 9000, co2RemovalT: 18000, feedstock: "Forestry residues", note: "California wildfire-fuel residues converted at partner bioenergy plants" },
  { name: "Standard Biocarbon", country: "United States", flag: "🇺🇸", capacityT: 4000, co2RemovalT: 8000, feedstock: "Sawmill residues", note: "Maine plant supplying horticulture and CDR markets" },
  { name: "Aries Clean Technologies", country: "United States", flag: "🇺🇸", capacityT: 7000, co2RemovalT: 14000, feedstock: "Biosolids / wood", note: "Gasification plants producing biochar for concrete admixtures" },
  { name: "Restoration Bioproducts", country: "United States", flag: "🇺🇸", capacityT: 3500, co2RemovalT: 7000, feedstock: "Forest thinnings", note: "Virginia forest-restoration biochar with CDR offtakes" },
  { name: "Genesis Industries / Biochar Now", country: "United States", flag: "🇺🇸", capacityT: 10000, co2RemovalT: 20000, feedstock: "Beetle-kill wood", note: "Colorado kiln fleet supplying plastics fillers and remediation" },
  { name: "Oregon Biochar Solutions", country: "United States", flag: "🇺🇸", capacityT: 5000, co2RemovalT: 10000, feedstock: "Forestry residues", note: "Pacific Northwest producer serving agriculture and CDR buyers" },
  { name: "Charm Industrial", country: "United States", flag: "🇺🇸", capacityT: 2000, co2RemovalT: 12000, feedstock: "Crop residues", note: "Bio-oil sequestration plus biochar co-product for durable removals" },
  { name: "NetZero (Cameroon/Brazil)", country: "Brazil", flag: "🇧🇷", capacityT: 8000, co2RemovalT: 16000, feedstock: "Coffee / cocoa husks", note: "Tropical agri-residue plants issuing Puro.earth CORCs" },
  { name: "Suzano biochar", country: "Brazil", flag: "🇧🇷", capacityT: 6000, co2RemovalT: 12000, feedstock: "Eucalyptus residues", note: "Pulp-mill residue pyrolysis pilot scaling to industrial carbon" },

  // ---------- Europe ----------
  { name: "Carbo Culture", country: "Finland", flag: "🇫🇮", capacityT: 3000, co2RemovalT: 9000, feedstock: "Woody residues", note: "Carbolysis reactors targeting 1,000-year carbon durability" },
  { name: "Novocarbo", country: "Germany", flag: "🇩🇪", capacityT: 9000, co2RemovalT: 18000, feedstock: "Woody / agri residues", note: "Carbon Removal Parks combining biochar with waste-heat supply" },
  { name: "Circular Carbon", country: "Germany", flag: "🇩🇪", capacityT: 7000, co2RemovalT: 14000, feedstock: "Nut shells / wood", note: "Hamburg plant supplying biochar and process heat to industry" },
  { name: "PYREG customers", country: "Germany", flag: "🇩🇪", capacityT: 20000, co2RemovalT: 40000, feedstock: "Sludge / green waste", note: "Installed base of PYREG carbonisation units across Europe" },
  { name: "Vow / Biogenic Refinery", country: "Norway", flag: "🇳🇴", capacityT: 5000, co2RemovalT: 10000, feedstock: "Biomass / waste", note: "Oslo-listed pyrolysis technology group with operated plants" },
  { name: "Sonnenerde", country: "Austria", flag: "🇦🇹", capacityT: 1200, co2RemovalT: 2400, feedstock: "Agricultural residues", note: "Pioneering EBC-certified biochar and terra preta soils" },
  { name: "Swiss Biochar", country: "Switzerland", flag: "🇨🇭", capacityT: 1500, co2RemovalT: 3000, feedstock: "Green waste", note: "Lausanne producer supplying European Biochar Certificate markets" },
  { name: "Carbonzero / Verora", country: "Switzerland", flag: "🇨🇭", capacityT: 1000, co2RemovalT: 2000, feedstock: "Forest residues", note: "Biochar plus district heat in central Switzerland" },
  { name: "Earthly Biochar (UK)", country: "United Kingdom", flag: "🇬🇧", capacityT: 2500, co2RemovalT: 5000, feedstock: "Woodland residues", note: "UK woodland-management biochar with verified removals" },
  { name: "Carbonfuture partners", country: "Germany", flag: "🇩🇪", capacityT: 25000, co2RemovalT: 50000, feedstock: "Mixed biomass", note: "Registry and marketplace aggregating certified biochar suppliers" },
  { name: "Green Man Char", country: "United Kingdom", flag: "🇬🇧", capacityT: 900, co2RemovalT: 1800, feedstock: "Woodchip", note: "Small-scale UK producer for agriculture and viticulture" },

  // ---------- Asia, Africa & Oceania ----------
  { name: "Takachar", country: "India", flag: "🇮🇳", capacityT: 3000, co2RemovalT: 6000, feedstock: "Crop residues", note: "Portable reactors converting field residue instead of stubble burning" },
  { name: "Varaha (India)", country: "India", flag: "🇮🇳", capacityT: 5000, co2RemovalT: 10000, feedstock: "Agri residues", note: "Smallholder biochar network with Frontier and Google offtakes" },
  { name: "Husk Ventures", country: "India", flag: "🇮🇳", capacityT: 2000, co2RemovalT: 4000, feedstock: "Rice husk", note: "Rice-husk gasification with biochar co-product in Bihar" },
  { name: "Carbo Cycle Kenya", country: "Kenya", flag: "🇰🇪", capacityT: 1500, co2RemovalT: 3000, feedstock: "Agri residues", note: "East African biochar for soil restoration and cookstove fuel" },
  { name: "Rainbow Bee Eater", country: "Australia", flag: "🇦🇺", capacityT: 2500, co2RemovalT: 5000, feedstock: "Crop / nut residues", note: "ECHO2 pyrolysis units producing biochar, heat and power" },
  { name: "Nippon Biochar / Kuraray", country: "Japan", flag: "🇯🇵", capacityT: 4000, co2RemovalT: 8000, feedstock: "Wood / coconut shell", note: "Industrial carbon producer entering agricultural biochar J-Credits" },
  // ---------- Added global coverage ----------
  { name: "Carbofex", country: "Finland", flag: "🇫🇮", capacityT: 2500, co2RemovalT: 6000, feedstock: "Spruce chips", note: "Tampere pyrolysis plant supplying premium removal credits" },
  { name: "PYREG", country: "Germany", flag: "🇩🇪", capacityT: 5000, co2RemovalT: 11000, feedstock: "Sludge / green waste", note: "Carbonisation plant supplier with operated reference sites" },
  { name: "Verora", country: "Switzerland", flag: "🇨🇭", capacityT: 2000, co2RemovalT: 4500, feedstock: "Forest residues", note: "Swiss biochar and heat cogeneration for agriculture" },
  { name: "Carbon Cycle / Schottdorf", country: "Austria", flag: "🇦🇹", capacityT: 2200, co2RemovalT: 5000, feedstock: "Wood chips", note: "Alpine biochar network for livestock and soils" },
  { name: "Carbonfuture partners (EU)", country: "Germany", flag: "🇩🇪", capacityT: 9000, co2RemovalT: 20000, feedstock: "Mixed biomass", note: "Aggregated European supplier network on the Carbonfuture registry" },
  { name: "Wakachiku / Nippon biochar", country: "Japan", flag: "🇯🇵", capacityT: 2600, co2RemovalT: 5200, feedstock: "Rice husk / wood", note: "J-Credit registered biochar for paddy soils" },
  { name: "Varaha", country: "India", flag: "🇮🇳", capacityT: 12000, co2RemovalT: 25000, feedstock: "Agri residues", note: "Smallholder biochar removal programme selling to tech buyers" },
  { name: "Wahaj / Gulf biochar", country: "United Arab Emirates", flag: "🇦🇪", capacityT: 1500, co2RemovalT: 3000, feedstock: "Date palm residues", note: "Palm-frond pyrolysis for desert soil improvement" },
  { name: "Carbon Zero Tanzania", country: "Tanzania", flag: "🇹🇿", capacityT: 3000, co2RemovalT: 6000, feedstock: "Agri residues", note: "Smallholder biochar and clean cookstove carbon programme" },
  { name: "Wangari / Kenya biochar", country: "Kenya", flag: "🇰🇪", capacityT: 2500, co2RemovalT: 5000, feedstock: "Macadamia / coffee husk", note: "Nut-shell pyrolysis producing removal credits and soil carbon" },
  { name: "Carbon Cycle Ghana", country: "Ghana", flag: "🇬🇭", capacityT: 1800, co2RemovalT: 3600, feedstock: "Cocoa / palm residues", note: "Agro-residue biochar for cocoa farm soils" },
  { name: "Bolivia Inti / Andes biochar", country: "Peru", flag: "🇵🇪", capacityT: 1400, co2RemovalT: 2800, feedstock: "Coffee husk", note: "Andean coffee-residue biochar for soil restoration" },
  { name: "NetZero", country: "Cameroon", flag: "🇨🇲", capacityT: 9000, co2RemovalT: 18000, feedstock: "Coffee / cocoa husk", note: "Tropical biochar plants in Cameroon and Brazil for removal credits" },
  { name: "Carbonaught", country: "Australia", flag: "🇦🇺", capacityT: 5000, co2RemovalT: 10000, feedstock: "Cane trash", note: "Queensland cane-residue biochar applied to farm soils" },
];

type Metric = "capacity" | "removal" | "marketcap" | "price" | "ghg";

const METRICS: Record<
  Metric,
  { label: string; unit: string; help: string; decimals: number; value: (p: Producer) => number }
> = {
  capacity: {
    label: "Biochar capacity (t/yr)",
    unit: "tonnes of biochar produced / year",
    help: "Annual biochar production capacity. Bigger tiles mean more pyrolysis throughput of forestry, agricultural or sludge residues.",
    decimals: 0,
    value: (p) => p.capacityT,
  },
  removal: {
    label: "Durable CO₂ removal (tCO₂e/yr)",
    unit: "tonnes CO₂e of durable removal / year",
    help: "Carbon locked away per year, issued or claimed under biochar carbon-removal registries. Roughly two tonnes CO₂e per tonne of biochar.",
    decimals: 0,
    value: (p) => p.co2RemovalT,
  },
  price: {
    label: "Share price (listing currency)",
    unit: "share price, primary listing currency",
    help: "Latest traded share price on the producer's primary listing, in that exchange's currency. Private, state-owned or unlisted producers have no price and sit at the end.",
    decimals: 2,
    value: () => 0,
  },
  marketcap: {
    label: "Market cap (approx.)",
    unit: "approximate market capitalisation, USD billions",
    help: "Approximate latest market capitalisation in USD billions, converted at recent exchange rates. Private, state-owned or unlisted entities rank last.",
    decimals: 1,
    value: (p) => marketCapValue(BIOCHAR_TICKERS[p.name]),
  },

  ghg: {
    label: "GHG savings (reported)",
    unit: "million tonnes CO₂e avoided per year",
    help: GHG_NOTE,
    decimals: 1,
    value: (p) => ghgSavingsMt(p.name),
  },
};

function scatterAxes(metricKey: Metric) {
  if (metricKey === "capacity") {
    return {
      x: { metric: METRICS.removal, help: "X-axis shows durable CO₂ removal; Y-axis shows biochar capacity." },
      size: { label: "Biochar capacity", unit: "t/yr", value: (p: Producer) => p.capacityT },
    };
  }
  if (metricKey === "marketcap") {
    return {
      x: { metric: METRICS.capacity, help: "X-axis shows biochar capacity; Y-axis shows approximate market cap." },
      size: { label: "Biochar capacity", unit: "t/yr", value: (p: Producer) => p.capacityT },
    };
  }
  return {
    x: { metric: METRICS.capacity, help: "X-axis shows biochar capacity; Y-axis shows the selected measure." },
    size: { label: "Durable CO₂ removal", unit: "tCO₂e/yr", value: (p: Producer) => p.co2RemovalT },
  };
}

const TITLE = "Global biochar producers";
const NEWS_SUFFIX = "biochar carbon removal pyrolysis";

export function BiocharProducersPanel() {
  const [metricKey, setMetricKey] = useState<Metric>("capacity");
  const [view, setView] = useState<PanelView>("heat");
  const detail = useEntityDetail();
  const { get } = useEntityQuotes();
  const metric = METRICS[metricKey];
  const valueOf = (p: Producer) =>
    metricKey === "price" ? (get(BIOCHAR_TICKERS[p.name])?.price ?? 0) : metric.value(p);

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
    meta: priceMeta(get(BIOCHAR_TICKERS[p.name])),
    changePct: get(BIOCHAR_TICKERS[p.name])?.changePct,
    newsTarget: { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` },
  }));

  const items = rows.map((p) => ({
    key: p.name,
    label: p.name,
    sub: `${p.feedstock} · ${p.note}`,
    value: valueOf(p),
    logo: entityLogoByName(p.name),
    meta: priceMeta(get(BIOCHAR_TICKERS[p.name])),
    tone: priceTone(get(BIOCHAR_TICKERS[p.name])),
    changePct: get(BIOCHAR_TICKERS[p.name])?.changePct,
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
        { label: "Ticker", value: BIOCHAR_TICKERS[p.name] ?? "Not listed" },
        {
          label: "Share price",
          value: get(BIOCHAR_TICKERS[p.name]) ? fmt(get(BIOCHAR_TICKERS[p.name])!.price, 2) : "—",
        },
        {
          label: "1-day change",
          value: get(BIOCHAR_TICKERS[p.name])
            ? `${get(BIOCHAR_TICKERS[p.name])!.changePct >= 0 ? "+" : ""}${get(BIOCHAR_TICKERS[p.name])!.changePct.toFixed(2)}%`
            : "—",
          tone: detailTone(get(BIOCHAR_TICKERS[p.name])?.changePct),
        },
        { label: "Biochar capacity", value: `${fmt(p.capacityT, 0)} t/yr` },
        { label: "Durable CO₂ removal", value: `${fmt(p.co2RemovalT, 0)} tCO₂e/yr` },
        { label: "Feedstock", value: p.feedstock },
        { label: "Market cap (approx.)", value: marketCapLabel(BIOCHAR_TICKERS[p.name]) ?? "Private / state-owned" },
      ],
      news: { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` },
    };
  }, graph);

  return (
    <>
      {detail.sheet}
      <ChartPanel
        icon={Layers}
        title={TITLE}
        blurb="Pyrolysis operators converting forestry, agricultural and sludge residues into durable carbon for soils, industry and carbon-removal markets."
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
              filename: "global-biochar-producers",
              note: `Measure shown: ${metric.label}`,
              header: [
                "Ticker",
                "Share price",
                "1-day change %",
                "Producer",
                "Country",
                "Feedstock",
                "Biochar capacity (t/yr)",
                "Durable CO2 removal (tCO2e/yr)",
                "Market cap (approx., USD bn)",
                "Note",
              ],
              rows: ranked.map((p) => [
                  BIOCHAR_TICKERS[p.name] ?? "Not listed",
                  get(BIOCHAR_TICKERS[p.name])?.price ?? "",
                  get(BIOCHAR_TICKERS[p.name])?.changePct?.toFixed(2) ?? "",
                  p.name,
                  p.country,
                  p.feedstock,
                  p.capacityT,
                  p.co2RemovalT,
                  marketCapValue(BIOCHAR_TICKERS[p.name]),
                  p.note,
                ]),
            })}
          />
        }
        filters={
          <ChartFilterBar
            query={f.query}
            onQueryChange={f.setQuery}
            placeholder="Search biochar producers…"
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
        footnote={`Indicative capacities from producer disclosures, the International Biochar Initiative, European Biochar Certificate and Puro.earth / Carbonfuture registries. Click any tile for the latest news. ${MARKET_CAP_NOTE}`}
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
                price: get(BIOCHAR_TICKERS[p.name])?.price,
                          })),
            })}
          />
        }
      >
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No biochar producers listed for this filter — open that country's profile page for its
            policy and market updates.
          </p>
        ) : view === "line" ? (
        <ChartTrend panel="biochar" />
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
            indexLabel="Global biochar production index"
          />
        ) : view === "bars" ? (
          <ChartBars
            items={items}
            unitLabel={metric.unit}
            yLabel="Biochar producer"
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
            indexLabel="Global biochar production index"
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
