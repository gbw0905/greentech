import { useState } from "react";
import { Recycle } from "lucide-react";
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
import { UCO_TICKERS } from "@/lib/entity-tickers";
import { priceMeta, priceTone, useEntityQuotes } from "@/lib/use-entity-quotes";
import { marketCapValue, marketCapLabel, MARKET_CAP_NOTE } from "@/lib/market-caps";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { ChartSummaryAssistant } from "@/components/ChartSummaryAssistant";

type UcoSupplier = {
  name: string;
  country: string;
  flag: string;
  /** Approximate used cooking oil collected / supplied, thousand tonnes per year */
  volumeKt: number;
  /** Countries the collector operates collection or sourcing in */
  countriesServed: number;
  note: string;
};

/**
 * Global used cooking oil (UCO) collectors, aggregators and traders — the waste
 * feedstock layer supplying biodiesel, HVO renewable diesel and SAF producers.
 * Volumes are indicative annual UCO collection/supply estimates in kilotonnes.
 */
const SUPPLIERS: UcoSupplier[] = [
  // ---------- North America ----------
  { name: "Darling Ingredients", country: "United States", flag: "🇺🇸", volumeKt: 1450, countriesServed: 17, note: "World's largest rendering and UCO collector; feeds Diamond Green Diesel" },
  { name: "Baker Commodities", country: "United States", flag: "🇺🇸", volumeKt: 320, countriesServed: 1, note: "Rendering and restaurant grease collection across the US" },
  { name: "Mahoney Environmental", country: "United States", flag: "🇺🇸", volumeKt: 210, countriesServed: 1, note: "Darling-owned nationwide UCO collection network" },
  { name: "Restaurant Technologies", country: "United States", flag: "🇺🇸", volumeKt: 190, countriesServed: 1, note: "Closed-loop oil delivery and UCO recovery for 40,000+ kitchens" },
  { name: "Valley Proteins / Darling", country: "United States", flag: "🇺🇸", volumeKt: 160, countriesServed: 1, note: "Rendering with used cooking oil recovery in the US south-east" },
  { name: "Rothsay (Darling Canada)", country: "Canada", flag: "🇨🇦", volumeKt: 95, countriesServed: 1, note: "Canadian rendering and UCO collection under Clean Fuel Regulations" },
  { name: "Sanimax", country: "Canada", flag: "🇨🇦", volumeKt: 85, countriesServed: 3, note: "Rendering and UCO recovery across Canada, US and Mexico" },
  { name: "Grupo Bioils Mexico", country: "Mexico", flag: "🇲🇽", volumeKt: 70, countriesServed: 2, note: "UCO aggregation for export to EU and US biodiesel plants" },

  // ---------- Europe ----------
  { name: "Olleco", country: "United Kingdom", flag: "🇬🇧", volumeKt: 240, countriesServed: 2, note: "UK's largest UCO collector; ISCC-certified Annex IX feedstock" },
  { name: "Brocklesby", country: "United Kingdom", flag: "🇬🇧", volumeKt: 110, countriesServed: 4, note: "UCO and food-waste oil processing for UK biodiesel" },
  { name: "Argent Energy (feedstock)", country: "United Kingdom", flag: "🇬🇧", volumeKt: 180, countriesServed: 5, note: "Waste-oil sourcing arm feeding UK and NL biodiesel plants" },
  { name: "Greenergy feedstock", country: "United Kingdom", flag: "🇬🇧", volumeKt: 200, countriesServed: 8, note: "Global waste-oil trading for UK and Amsterdam biodiesel" },
  { name: "SARIA / ecoMotion", country: "Germany", flag: "🇩🇪", volumeKt: 420, countriesServed: 12, note: "European rendering group with large UCO and animal-fat streams" },
  { name: "Reststoff / Refood", country: "Germany", flag: "🇩🇪", volumeKt: 150, countriesServed: 6, note: "Food-waste and catering-oil recovery across Germany and Benelux" },
  { name: "Quatra", country: "Belgium", flag: "🇧🇪", volumeKt: 130, countriesServed: 6, note: "Benelux and France catering-oil collection, ISCC EU certified" },
  { name: "Rotie / Simadan", country: "Netherlands", flag: "🇳🇱", volumeKt: 180, countriesServed: 9, note: "Amsterdam-port UCO collection and pre-treatment hub" },
  { name: "MBP Solutions", country: "Norway", flag: "🇳🇴", volumeKt: 90, countriesServed: 14, note: "By-product and waste-oil trading into European HVO plants" },
  { name: "Neste feedstock sourcing", country: "Finland", flag: "🇫🇮", volumeKt: 1200, countriesServed: 24, note: "Largest UCO buyer worldwide; global sourcing for HVO and SAF" },
  { name: "Biokraft / ScanOil", country: "Sweden", flag: "🇸🇪", volumeKt: 75, countriesServed: 4, note: "Nordic UCO aggregation for HVO100 production" },
  { name: "Saipol / Avril waste oils", country: "France", flag: "🇫🇷", volumeKt: 120, countriesServed: 5, note: "French waste-oil feedstock for B100 and HVO" },
  { name: "Bunge Loders (waste streams)", country: "Netherlands", flag: "🇳🇱", volumeKt: 140, countriesServed: 11, note: "Oilseed processor trading UCO and acid-oil residues" },
  { name: "Ecoslops", country: "France", flag: "🇫🇷", volumeKt: 45, countriesServed: 4, note: "Marine and catering waste-oil regeneration" },
  { name: "Bionor / Ecogras", country: "Spain", flag: "🇪🇸", volumeKt: 105, countriesServed: 3, note: "Iberian catering-oil collection for biodiesel" },
  { name: "Comgest / Oleoalgarve", country: "Portugal", flag: "🇵🇹", volumeKt: 40, countriesServed: 2, note: "Portuguese UCO recovery for regional biodiesel plants" },
  { name: "Mythen / Italbiolio", country: "Italy", flag: "🇮🇹", volumeKt: 95, countriesServed: 3, note: "Italian CONOE-registered UCO collection network" },
  { name: "Eni Biofeedstock sourcing", country: "Italy", flag: "🇮🇹", volumeKt: 230, countriesServed: 15, note: "UCO and waste-oil sourcing for Venice and Gela biorefineries" },
  { name: "Orlen waste-oil sourcing", country: "Poland", flag: "🇵🇱", volumeKt: 85, countriesServed: 6, note: "Central European UCO supply for HVO co-processing" },

  // ---------- Asia-Pacific ----------
  { name: "Jinshang Bio (China UCO)", country: "China", flag: "🇨🇳", volumeKt: 620, countriesServed: 1, note: "Major Chinese UCO aggregator and exporter to EU/US" },
  { name: "Zhuoyue New Energy", country: "China", flag: "🇨🇳", volumeKt: 540, countriesServed: 1, note: "UCO-based biodiesel and Annex IX export supplier" },
  { name: "Hebei Jingu", country: "China", flag: "🇨🇳", volumeKt: 380, countriesServed: 1, note: "Waste-oil refiner and UCO exporter" },
  { name: "EcoCeres feedstock", country: "China", flag: "🇨🇳", volumeKt: 300, countriesServed: 4, note: "UCO sourcing across Asia for HVO and SAF" },
  { name: "Revoil / Malaysia UCO traders", country: "Malaysia", flag: "🇲🇾", volumeKt: 190, countriesServed: 3, note: "South-East Asian UCO consolidation and export" },
  { name: "Apical / RGE waste oils", country: "Indonesia", flag: "🇮🇩", volumeKt: 260, countriesServed: 4, note: "Indonesian UCO collection alongside palm-residue streams" },
  { name: "Yoshihara Oil Mill", country: "Japan", flag: "🇯🇵", volumeKt: 70, countriesServed: 1, note: "Japanese UCO recovery for domestic SAF programmes" },
  { name: "Revive Eco / Gaia (India)", country: "India", flag: "🇮🇳", volumeKt: 210, countriesServed: 1, note: "FSSAI RUCO programme collectors feeding Indian biodiesel" },
  { name: "Refuel Energy Korea", country: "South Korea", flag: "🇰🇷", volumeKt: 80, countriesServed: 1, note: "Korean UCO collection for bio-heavy oil and HVO" },
  { name: "Cookers Australia", country: "Australia", flag: "🇦🇺", volumeKt: 95, countriesServed: 2, note: "Australia's largest UCO collector, supplying export HVO/SAF" },

  // ---------- Latin America / other ----------
  { name: "BSBIOS waste-oil sourcing", country: "Brazil", flag: "🇧🇷", volumeKt: 130, countriesServed: 1, note: "Brazilian UCO and residue supply for B15 biodiesel" },
  { name: "Ambipar Environment", country: "Brazil", flag: "🇧🇷", volumeKt: 110, countriesServed: 3, note: "Waste-management group collecting catering oils nationwide" },
  { name: "Explora / Argentina UCO", country: "Argentina", flag: "🇦🇷", volumeKt: 60, countriesServed: 1, note: "UCO aggregation for export to EU Annex IX markets" },
  { name: "Vuthisa / SA waste oils", country: "South Africa", flag: "🇿🇦", volumeKt: 45, countriesServed: 2, note: "Southern African catering-oil recovery" },
  // ---------- Added global coverage ----------
  { name: "Vinasse & Oils Vietnam (UCO exporters)", country: "Vietnam", flag: "🇻🇳", volumeKt: 150, countriesServed: 2, note: "Fast-growing UCO export stream to EU and Singapore SAF plants" },
  { name: "Thai UCO Collectors (BSGF)", country: "Thailand", flag: "🇹🇭", volumeKt: 170, countriesServed: 1, note: "Bangchak-linked collection feeding Thailand's first SAF unit" },
  { name: "Singapore UCO aggregators", country: "Singapore", flag: "🇸🇬", volumeKt: 120, countriesServed: 5, note: "Regional trading hub consolidating South-East Asian UCO cargoes" },
  { name: "Sime Darby / Malaysian UCO", country: "Malaysia", flag: "🇲🇾", volumeKt: 140, countriesServed: 3, note: "UCO and palm-residue streams alongside plantation feedstock" },
  { name: "Philippine UCO consolidators", country: "Philippines", flag: "🇵🇭", volumeKt: 80, countriesServed: 2, note: "Manila and Cebu catering-oil recovery for export" },
  { name: "Wilmar waste-oil sourcing", country: "Indonesia", flag: "🇮🇩", volumeKt: 230, countriesServed: 6, note: "UCO and POME residue sourcing for HVO and SAF" },
  { name: "Munzer Bioindustrie", country: "Austria", flag: "🇦🇹", volumeKt: 160, countriesServed: 9, note: "Central European UCO collection and biodiesel production" },
  { name: "Greenfuel / Czech UCO", country: "Czechia", flag: "🇨🇿", volumeKt: 70, countriesServed: 4, note: "Catering-oil collection across Czechia and Slovakia" },
  { name: "Bunge Hungary waste oils", country: "Hungary", flag: "🇭🇺", volumeKt: 65, countriesServed: 5, note: "Central European waste-oil aggregation for EU Annex IX" },
  { name: "Rompetrol / Romanian UCO", country: "Romania", flag: "🇷🇴", volumeKt: 55, countriesServed: 3, note: "Collection network supplying regional biodiesel plants" },
  { name: "Baltic UCO Group", country: "Lithuania", flag: "🇱🇹", volumeKt: 60, countriesServed: 4, note: "Baltic catering-oil consolidation for Northern European HVO" },
  { name: "Ekoil / Greek UCO", country: "Greece", flag: "🇬🇷", volumeKt: 50, countriesServed: 2, note: "Hellenic catering-oil recovery for Motor Oil and Helleniq biodiesel" },
  { name: "Turkish UCO collectors (Petrol Ofisi)", country: "Türkiye", flag: "🇹🇷", volumeKt: 130, countriesServed: 2, note: "Municipal UCO schemes feeding domestic and EU biodiesel" },
  { name: "Al Serkal / Gulf waste oils", country: "United Arab Emirates", flag: "🇦🇪", volumeKt: 90, countriesServed: 5, note: "Gulf hotel and catering UCO recovery for export and local HVO" },
  { name: "Neutral Fuels", country: "United Arab Emirates", flag: "🇦🇪", volumeKt: 40, countriesServed: 3, note: "Dubai closed-loop UCO biodiesel for fleets and restaurants" },
  { name: "Saudi Aramco / Jeddah UCO pilots", country: "Saudi Arabia", flag: "🇸🇦", volumeKt: 35, countriesServed: 1, note: "Kingdom-level UCO collection pilots for HEFA feedstock" },
  { name: "Egypt UCO collectors (Tagaddod)", country: "Egypt", flag: "🇪🇬", volumeKt: 75, countriesServed: 3, note: "Cairo-based collection exporting Annex IX-certified UCO" },
  { name: "Nigeria UCO consolidators", country: "Nigeria", flag: "🇳🇬", volumeKt: 30, countriesServed: 2, note: "Lagos catering-oil aggregation for export markets" },
  { name: "Kenya UCO (Nairobi collectors)", country: "Kenya", flag: "🇰🇪", volumeKt: 25, countriesServed: 2, note: "Hotel and food-processor oil recovery for regional biodiesel" },
  { name: "Morocco UCO (Bio Beladi)", country: "Morocco", flag: "🇲🇦", volumeKt: 45, countriesServed: 2, note: "North African collection largely exported to Spain and Italy" },
  { name: "Chilean UCO collectors (Rendic)", country: "Chile", flag: "🇨🇱", volumeKt: 35, countriesServed: 1, note: "Santiago catering-oil recovery for local biodiesel plants" },
  { name: "Colombia UCO (BioD)", country: "Colombia", flag: "🇨🇴", volumeKt: 40, countriesServed: 1, note: "Waste-oil collection complementing palm biodiesel supply" },
  { name: "Mexican UCO exporters (Reoil)", country: "Mexico", flag: "🇲🇽", volumeKt: 95, countriesServed: 2, note: "Cross-border UCO supply into US renewable diesel plants" },
  { name: "New Zealand UCO (Ecogas / Green Oil)", country: "New Zealand", flag: "🇳🇿", volumeKt: 25, countriesServed: 1, note: "Tallow and UCO recovery for domestic and export biofuel" },
];

type Metric = "volume" | "reach" | "price" | "marketcap";

const METRICS: Record<
  Metric,
  { label: string; unit: string; help: string; decimals: number; value: (s: UcoSupplier) => number }
> = {
  volume: {
    label: "UCO collected (kt/yr)",
    unit: "thousand tonnes of used cooking oil / year",
    help: "Estimated used cooking oil collected or supplied each year, in thousand tonnes. Bigger tiles mean more waste feedstock reaching biodiesel, HVO and SAF plants.",
    decimals: 0,
    value: (s) => s.volumeKt,
  },
  reach: {
    label: "Collection countries",
    unit: "countries with collection or sourcing operations",
    help: "Number of countries where the supplier collects or sources UCO. A domestic collector can be large in volume yet score low here.",
    decimals: 0,
    value: (s) => s.countriesServed,
  },
  price: {
    label: "Share price (listing currency)",
    unit: "share price, primary listing currency",
    help: "Latest traded share price on the supplier's primary listing, in that exchange's currency. Private or state-owned collectors have no listing and sit at the end.",
    decimals: 2,
    value: () => 0,
  },
  marketcap: {
    label: "Market cap (approx.)",
    unit: "approximate market capitalisation, USD billions",
    help: "Approximate latest market capitalisation in USD billions, converted at recent exchange rates. Private, state-owned or unlisted entities rank last.",
    decimals: 1,
    value: (s) => marketCapValue(UCO_TICKERS[s.name]),
  },
};

function scatterAxes(metricKey: Metric) {
  if (metricKey === "reach") {
    return {
      x: { metric: METRICS.volume, help: "X-axis shows annual UCO volume; Y-axis shows collection footprint." },
      size: { label: "Collection countries", unit: "countries", value: (s: UcoSupplier) => s.countriesServed },
    };
  }
  if (metricKey === "price") {
    return {
      x: { metric: METRICS.volume, help: "X-axis shows annual UCO volume; Y-axis shows share price." },
      size: { label: "Collection countries", unit: "countries", value: (s: UcoSupplier) => s.countriesServed },
    };
  }
  if (metricKey === "marketcap") {
    return {
      x: { metric: METRICS.volume, help: "X-axis shows annual UCO volume; Y-axis shows market cap." },
      size: { label: "Collection countries", unit: "countries", value: (s: UcoSupplier) => s.countriesServed },
    };
  }
  return {
    x: { metric: METRICS.reach, help: "X-axis shows collection footprint; Y-axis shows annual UCO volume." },
    size: { label: "UCO collected", unit: "kt/yr", value: (s: UcoSupplier) => s.volumeKt },
  };
}

const TITLE = "Global UCO (used cooking oil) suppliers";
const NEWS_SUFFIX = "used cooking oil OR UCO feedstock biofuel";

export function UcoSuppliersPanel() {
  const [metricKey, setMetricKey] = useState<Metric>("volume");
  const [view, setView] = useState<PanelView>("heat");
  const detail = useEntityDetail();
  const { get } = useEntityQuotes();
  const metric = METRICS[metricKey];
  const valueOf = (s: UcoSupplier) =>
    metricKey === "price" ? (get(UCO_TICKERS[s.name])?.price ?? 0) : metric.value(s);

  const f = useChartFilter(SUPPLIERS, {
    text: (s) => `${s.name} ${s.country} ${s.note}`,
    facetA: (s) => s.country,
  });
  const ranked = f.filtered.slice().sort((a, b) => valueOf(b) - valueOf(a));
  const isFiltered = Boolean(f.a || f.b || f.query.trim());
  const rows = view === "table" ? ranked : ranked.slice(0, isFiltered ? 20 : 10);

  const axes = scatterAxes(metricKey);
  const scatterPoints: ScatterPoint[] = rows.map((s) => ({
    key: s.name,
    label: s.name,
    sub: s.country,
    x: axes.x.metric.value(s),
    y: valueOf(s),
    size: axes.size.value(s),
    group: s.country,
    logo: entityLogoByName(s.name),
    meta: priceMeta(get(UCO_TICKERS[s.name])),
    changePct: get(UCO_TICKERS[s.name])?.changePct,
    newsTarget: { name: s.name, query: `"${s.name}" ${NEWS_SUFFIX}` },
  }));

  const items = rows.map((s) => ({
    key: s.name,
    label: s.name,
    sub: s.note,
    value: valueOf(s),
    logo: entityLogoByName(s.name),
    meta: priceMeta(get(UCO_TICKERS[s.name])),
    tone: priceTone(get(UCO_TICKERS[s.name])),
    changePct: get(UCO_TICKERS[s.name])?.changePct,
  }));
  const newsMap = Object.fromEntries(
    rows.map((s) => [s.name, { name: s.name, query: `"${s.name}" ${NEWS_SUFFIX}` }]),
  );
  const filters: [string, string][] = [["Country", f.a || "All countries"]];
  if (f.query.trim()) filters.push(["Search", `"${f.query.trim()}"`]);
  const graph: GraphContext = {
    measure: metric.label,
    unit: metric.unit,
    view: PANEL_VIEWS.find((v) => v.value === view)?.label ?? view,
    filters,
    items: rows.map((s) => ({ name: s.name, value: valueOf(s) })),
    format: (n: number) => fmt(n, metric.decimals),
  };
  const onSelect = detail.onSelect((t) => {
    const s = rows.find((r) => r.name === t?.name);
    if (!s) return null;
    const q = get(UCO_TICKERS[s.name]);
    return {
      name: s.name,
      sub: `${s.flag} ${s.country}`,
      logo: entityLogoByName(s.name),
      note: s.note,
      stats: [
        { label: "UCO collected", value: `${fmt(s.volumeKt, 0)} kt/yr` },
        { label: "Collection countries", value: fmt(s.countriesServed, 0) },
        { label: "Ticker", value: UCO_TICKERS[s.name] ?? "Not listed" },
        { label: "Share price", value: q ? fmt(q.price, 2) : "—" },
        { label: "Market cap (approx.)", value: marketCapLabel(UCO_TICKERS[s.name]) ?? "Private / state-owned" },
        {
          label: "1-day change",
          value: q ? `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%` : "—",
          tone: detailTone(q?.changePct),
        },
      ],
      news: { name: s.name, query: `"${s.name}" ${NEWS_SUFFIX}` },
    };
  }, graph);

  return (
    <>
    {detail.sheet}
    <ChartPanel
      icon={Recycle}
      title={TITLE}
      blurb="Collectors, renderers and traders of used cooking oil — the waste feedstock behind biodiesel, HVO renewable diesel and sustainable aviation fuel."
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
            filename: "global-uco-suppliers",
            note: `Measure shown: ${metric.label}`,
            header: [
              "UCO supplier",
              "Country",
              "UCO collected (kt/yr)",
              "Collection countries",
              "Ticker",
              "Share price",
              "1-day change %",
              "Market cap (approx., USD bn)",
              "Note",
            ],
            rows: ranked.map((s) => {
              const q = get(UCO_TICKERS[s.name]);
              return [
                s.name,
                s.country,
                s.volumeKt,
                s.countriesServed,
                UCO_TICKERS[s.name] ?? "",
                q ? q.price.toFixed(2) : "",
                q ? q.changePct.toFixed(2) : "",
                marketCapLabel(UCO_TICKERS[s.name]) ?? "",
                s.note,
              ];
            }),
          })}
        />
      }
      filters={
        <ChartFilterBar
          query={f.query}
          onQueryChange={f.setQuery}
          placeholder="Search UCO suppliers…"
          selects={[
            {
              label: "Country",
              value: f.a,
              options: countryFilterOptions(SUPPLIERS.map((s) => s.country)),
              onChange: f.setA,
              allLabel: "All countries",
            },
          ]}
          shown={rows.length}
          total={SUPPLIERS.length}
          matched={ranked.length}
        />
      }
      footnote={`Indicative annual used cooking oil collection volumes from company reports, ISCC certification registers and EU Annex IX / US RFS feedstock filings. Click any tile for the latest news. ${MARKET_CAP_NOTE}`}
      assistant={
        <ChartSummaryAssistant
          disabled={rows.length === 0}
          build={() => ({
            panel: TITLE,
            measureLabel: metric.label,
            unit: metric.unit,
            filterLabel: [f.a || "All countries", f.query ? `search "${f.query}"` : ""]
              .filter(Boolean)
              .join(" · "),
            shown: rows.length,
            total: SUPPLIERS.length,
            rows: rows.map((s) => ({
              label: s.name,
              sub: `${s.country} · ${s.note}`,
              value: valueOf(s),
              price: get(UCO_TICKERS[s.name])?.price,
              changePct: get(UCO_TICKERS[s.name])?.changePct,
            })),
          })}
        />
      }
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No UCO suppliers listed for this filter — open that country's profile page for its policy
          and market updates.
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
          indexLabel="Global UCO suppliers index"
        />
      ) : view === "bars" ? (
        <ChartBars
          items={items}
          unitLabel={metric.unit}
          yLabel="UCO supplier"
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
          indexLabel="Global UCO suppliers index"
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
