import { useState } from "react";
import { Ship, Truck, TrainFront } from "lucide-react";
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
import { ChartFilterBar, countryFilterOptions, useChartFilter } from "@/components/chart-filters";
import { entityLogoByName } from "@/lib/entity-logos";
import { CARRIER_TICKERS } from "@/lib/entity-tickers";
import { priceMeta, priceTone, useEntityQuotes } from "@/lib/use-entity-quotes";
import { marketCapValue, marketCapLabel, MARKET_CAP_NOTE } from "@/lib/market-caps";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { ChartSummaryAssistant } from "@/components/ChartSummaryAssistant";

type Carrier = {
  name: string;
  country: string;
  flag: string;
  /** Renewable / biofuel volume consumed, million litres per year */
  volumeMnL: number;
  /** Biofuel share of total fuel burn, % */
  share: number;
  note: string;
};

const SHIPPING: Carrier[] = [
  { name: "Maersk", country: "Denmark", flag: "🇩🇰", volumeMnL: 620, share: 3.4, note: "Green methanol and B30 bio-bunker fuel across mainline vessels" },
  { name: "CMA CGM", country: "France", flag: "🇫🇷", volumeMnL: 480, share: 2.6, note: "Biomethane and B24 bunkering in Singapore and Rotterdam" },
  { name: "MSC", country: "Switzerland", flag: "🇨🇭", volumeMnL: 430, share: 1.9, note: "Large-scale B30 biofuel blend trials fleetwide" },
  { name: "Hapag-Lloyd", country: "Germany", flag: "🇩🇪", volumeMnL: 260, share: 2.2, note: "Ship Green service using waste-based biofuel" },
  { name: "ONE (Ocean Network Express)", country: "Japan", flag: "🇯🇵", volumeMnL: 190, share: 1.6, note: "B24 uplift at Singapore hub" },
  { name: "Evergreen", country: "Taiwan", flag: "🇹🇼", volumeMnL: 150, share: 1.3, note: "Biofuel bunkering under FuelEU compliance" },
  { name: "HMM", country: "South Korea", flag: "🇰🇷", volumeMnL: 120, share: 1.4, note: "Bio-blend bunkering on Asia–Europe loops" },
  { name: "Wallenius Wilhelmsen", country: "Norway", flag: "🇳🇴", volumeMnL: 110, share: 4.1, note: "Highest biofuel share in ro-ro shipping" },
  { name: "NYK Line", country: "Japan", flag: "🇯🇵", volumeMnL: 95, share: 1.2, note: "Biofuel and bio-LNG dual programmes" },
  { name: "Cosco Shipping", country: "China", flag: "🇨🇳", volumeMnL: 90, share: 0.7, note: "B24 pilots from Chinese used-cooking-oil supply" },
  { name: "ZIM", country: "Israel", flag: "🇮🇱", volumeMnL: 70, share: 1.5, note: "Customer-funded biofuel programme" },
  { name: "Stena Line", country: "Sweden", flag: "🇸🇪", volumeMnL: 65, share: 5.2, note: "Nordic ferries on HVO and bio-blends" },
  { name: "Hapag-Lloyd Ship Green", country: "Germany", flag: "🇩🇪", volumeMnL: 210, share: 2.4, note: "Customer-funded waste-based biofuel product" },
  { name: "Grimaldi Group", country: "Italy", flag: "🇮🇹", volumeMnL: 85, share: 2.0, note: "Mediterranean ro-ro fleet blending biofuel for FuelEU" },
  { name: "DFDS", country: "Denmark", flag: "🇩🇰", volumeMnL: 80, share: 3.6, note: "North Sea ferries and ro-ro on waste-based biofuel" },
  { name: "Fortescue shipping", country: "Australia", flag: "🇦🇺", volumeMnL: 60, share: 8.0, note: "Iron-ore carriers on 100% biofuel voyages" },
  { name: "Rio Tinto Marine", country: "Australia", flag: "🇦🇺", volumeMnL: 55, share: 3.2, note: "Bulk carriers running B30 on Asian routes" },
  { name: "Cargill Ocean Transportation", country: "United States", flag: "🇺🇸", volumeMnL: 90, share: 2.8, note: "Charterer running biofuel voyages across dry bulk" },
  { name: "Anglo American shipping", country: "United Kingdom", flag: "🇬🇧", volumeMnL: 45, share: 3.0, note: "Bio-LNG and biofuel voyages for bulk exports" },
  { name: "Yang Ming", country: "Taiwan", flag: "🇹🇼", volumeMnL: 60, share: 1.1, note: "B24 bunkering at Kaohsiung and Singapore" },
  { name: "PIL (Pacific International Lines)", country: "Singapore", flag: "🇸🇬", volumeMnL: 50, share: 1.4, note: "Biofuel blends on Asia-Africa services" },
  { name: "Fesco / Asian regional lines", country: "South Korea", flag: "🇰🇷", volumeMnL: 30, share: 0.9, note: "Regional feeder services trialling bio-blends" },
  { name: "Bahri", country: "Saudi Arabia", flag: "🇸🇦", volumeMnL: 35, share: 0.8, note: "Tanker fleet trialling biofuel bunkering at Fujairah" },
  { name: "Ultranav / Latin American operators", country: "Chile", flag: "🇨🇱", volumeMnL: 25, share: 1.2, note: "South American coastal shipping using bio-blends" },
];

const TRUCKING: Carrier[] = [
  { name: "UPS", country: "United States", flag: "🇺🇸", volumeMnL: 720, share: 12.5, note: "Renewable diesel and RNG across the ground fleet" },
  { name: "FedEx Freight", country: "United States", flag: "🇺🇸", volumeMnL: 430, share: 8.1, note: "R99 renewable diesel on West Coast lanes" },
  { name: "DHL / Deutsche Post", country: "Germany", flag: "🇩🇪", volumeMnL: 400, share: 9.4, note: "HVO100 across European road network" },
  { name: "Ryder System", country: "United States", flag: "🇺🇸", volumeMnL: 310, share: 7.2, note: "Renewable diesel and RNG in leased fleets" },
  { name: "Schneider National", country: "United States", flag: "🇺🇸", volumeMnL: 240, share: 6.4, note: "California renewable diesel corridors" },
  { name: "J.B. Hunt", country: "United States", flag: "🇺🇸", volumeMnL: 220, share: 5.6, note: "Renewable diesel and RNG intermodal drayage" },
  { name: "DSV", country: "Denmark", flag: "🇩🇰", volumeMnL: 180, share: 6.8, note: "HVO book-and-claim for European road freight" },
  { name: "Girteka", country: "Lithuania", flag: "🇱🇹", volumeMnL: 150, share: 7.5, note: "HVO100 trucks on long-haul EU lanes" },
  { name: "XPO", country: "United States", flag: "🇺🇸", volumeMnL: 140, share: 4.8, note: "Renewable diesel in LTL terminals" },
  { name: "Kuehne+Nagel", country: "Switzerland", flag: "🇨🇭", volumeMnL: 130, share: 5.1, note: "Biofuel insetting for road freight customers" },
  { name: "Waste Management", country: "United States", flag: "🇺🇸", volumeMnL: 620, share: 70.0, note: "Largest RNG-powered collection fleet worldwide" },
  { name: "Republic Services", country: "United States", flag: "🇺🇸", volumeMnL: 330, share: 42.0, note: "Renewable natural gas refuse fleet" },
  { name: "Girteka Europe (extended fleet)", country: "Lithuania", flag: "🇱🇹", volumeMnL: 95, share: 5.0, note: "HVO-powered long-haul across Central Europe" },
  { name: "Geodis", country: "France", flag: "🇫🇷", volumeMnL: 120, share: 6.0, note: "B100 and HVO across French and Iberian road freight" },
  { name: "STEF", country: "France", flag: "🇫🇷", volumeMnL: 70, share: 8.5, note: "Cold-chain fleet on B100 rapeseed biodiesel" },
  { name: "Primafrio", country: "Spain", flag: "🇪🇸", volumeMnL: 60, share: 5.5, note: "Refrigerated transport using HVO on EU corridors" },
  { name: "Gruber Logistics", country: "Italy", flag: "🇮🇹", volumeMnL: 45, share: 6.2, note: "HVO100 fleet across Alpine and Central European lanes" },
  { name: "Raben Group", country: "Poland", flag: "🇵🇱", volumeMnL: 55, share: 4.4, note: "HVO deployment across Central European distribution" },
  { name: "Ewals Cargo Care", country: "Netherlands", flag: "🇳🇱", volumeMnL: 40, share: 6.0, note: "Bio-LNG and HVO intermodal road legs" },
  { name: "PostNL", country: "Netherlands", flag: "🇳🇱", volumeMnL: 35, share: 7.0, note: "HVO in urban and regional delivery fleets" },
  { name: "Toll Group", country: "Australia", flag: "🇦🇺", volumeMnL: 50, share: 3.5, note: "Renewable diesel trials across Australian linehaul" },
  { name: "Linfox", country: "Australia", flag: "🇦🇺", volumeMnL: 45, share: 3.2, note: "Renewable diesel and bio-blends in retail distribution" },
  { name: "JSL Logística", country: "Brazil", flag: "🇧🇷", volumeMnL: 260, share: 12.0, note: "B15 mandated biodiesel plus dedicated B100 fleets" },
  { name: "Grupo André Maggi transport", country: "Brazil", flag: "🇧🇷", volumeMnL: 180, share: 11.0, note: "Agri-commodity trucking on high biodiesel blends" },
  { name: "VRL Logistics", country: "India", flag: "🇮🇳", volumeMnL: 110, share: 5.5, note: "B7 blends and CBG trucks under Indian fuel policy" },
  { name: "Delhivery", country: "India", flag: "🇮🇳", volumeMnL: 70, share: 4.0, note: "Bio-CNG and blended diesel in line-haul fleets" },
  { name: "SF Express", country: "China", flag: "🇨🇳", volumeMnL: 90, share: 2.5, note: "Bio-LNG and blended diesel pilots on trunk routes" },
  { name: "Imperial Logistics", country: "South Africa", flag: "🇿🇦", volumeMnL: 40, share: 3.0, note: "B5 blends and biodiesel pilots in Southern Africa" },
];

const RAIL: Carrier[] = [
  { name: "Union Pacific", country: "United States", flag: "🇺🇸", volumeMnL: 340, share: 12.0, note: "Renewable diesel blending across western network" },
  { name: "BNSF Railway", country: "United States", flag: "🇺🇸", volumeMnL: 300, share: 10.5, note: "R99 renewable diesel in California operations" },
  { name: "Canadian National (CN)", country: "Canada", flag: "🇨🇦", volumeMnL: 150, share: 7.0, note: "Biodiesel blending under Canada's Clean Fuel Regulations" },
  { name: "Canadian Pacific Kansas City", country: "Canada", flag: "🇨🇦", volumeMnL: 120, share: 6.2, note: "B20 blends plus hydrogen pilots" },
  { name: "CSX", country: "United States", flag: "🇺🇸", volumeMnL: 110, share: 5.4, note: "Renewable diesel trials on eastern corridors" },
  { name: "Norfolk Southern", country: "United States", flag: "🇺🇸", volumeMnL: 95, share: 4.9, note: "B20 biodiesel locomotive programme" },
  { name: "Deutsche Bahn Cargo", country: "Germany", flag: "🇩🇪", volumeMnL: 90, share: 22.0, note: "HVO100 on all non-electrified diesel routes" },
  { name: "SNCF Fret", country: "France", flag: "🇫🇷", volumeMnL: 60, share: 15.0, note: "B100 rapeseed biodiesel locomotives" },
  { name: "Aurizon", country: "Australia", flag: "🇦🇺", volumeMnL: 45, share: 3.1, note: "Renewable diesel trials in Queensland coal haulage" },
  { name: "Rio Tinto Rail", country: "Australia", flag: "🇦🇺", volumeMnL: 40, share: 4.0, note: "HVO in Pilbara iron-ore rail fleet" },
  { name: "Indian Railways (diesel fleet)", country: "India", flag: "🇮🇳", volumeMnL: 210, share: 5.0, note: "B5–B20 blending on the remaining diesel fleet" },
  { name: "Amtrak", country: "United States", flag: "🇺🇸", volumeMnL: 35, share: 6.5, note: "Renewable diesel on long-distance diesel routes" },
  { name: "Kansas City Southern de México", country: "Mexico", flag: "🇲🇽", volumeMnL: 55, share: 3.5, note: "Cross-border biodiesel blending on CPKC corridors" },
  { name: "Rumo Logística", country: "Brazil", flag: "🇧🇷", volumeMnL: 210, share: 14.0, note: "Grain corridors running mandated biodiesel blends" },
  { name: "VLI Multimodal", country: "Brazil", flag: "🇧🇷", volumeMnL: 120, share: 13.0, note: "Mining and agri rail on B15 biodiesel" },
  { name: "Ferrocarril Central Andino", country: "Peru", flag: "🇵🇪", volumeMnL: 20, share: 5.0, note: "B5 blends on Andean freight lines" },
  { name: "Transnet Freight Rail", country: "South Africa", flag: "🇿🇦", volumeMnL: 60, share: 4.0, note: "B5 diesel blending across the South African network" },
  { name: "PKP Cargo", country: "Poland", flag: "🇵🇱", volumeMnL: 35, share: 6.0, note: "Bio-blended diesel on non-electrified Polish lines" },
  { name: "Green Cargo", country: "Sweden", flag: "🇸🇪", volumeMnL: 30, share: 40.0, note: "HVO100 across the Swedish diesel locomotive fleet" },
  { name: "VR Transpoint", country: "Finland", flag: "🇫🇮", volumeMnL: 25, share: 25.0, note: "Renewable diesel on Finnish freight shunting and haulage" },
  { name: "ÖBB Rail Cargo", country: "Austria", flag: "🇦🇹", volumeMnL: 22, share: 18.0, note: "HVO for diesel traction on unelectrified branches" },
  { name: "KTZ (Kazakhstan Temir Zholy)", country: "Kazakhstan", flag: "🇰🇿", volumeMnL: 40, share: 2.0, note: "Biodiesel blending trials on trans-Caspian corridors" },
  { name: "China Railway diesel fleet", country: "China", flag: "🇨🇳", volumeMnL: 80, share: 1.5, note: "B5 pilots on remaining diesel-hauled freight lines" },
  { name: "KiwiRail", country: "New Zealand", flag: "🇳🇿", volumeMnL: 18, share: 5.0, note: "Renewable diesel trials on South Island freight" },
];

type Metric = "volume" | "share" | "price" | "marketcap" | "ghg";

const METRICS: Record<Metric, { label: string; unit: string; help: string; decimals: number; value: (c: Carrier) => number }> = {
  volume: {
    label: "Biofuel volume used (Ml/yr)",
    unit: "million litres of biofuel used / year",
    help: "Estimated biofuel the operator consumes each year, in million litres. Bigger tiles mean more biofuel burned in absolute terms across the fleet.",
    decimals: 0,
    value: (c) => c.volumeMnL,
  },
  share: {
    label: "Biofuel share of fuel burn (%)",
    unit: "% of total fuel burn from biofuels",
    help: "Share of the operator's total fuel burn met by biofuels. A smaller fleet can rank high here — it measures intensity of use, not scale.",
    decimals: 1,
    value: (c) => c.share,
  },
  price: {
    label: "Share price (listing currency)",
    unit: "share price, primary listing currency",
    help: "Latest traded share price on the operator's primary listing, in that exchange's currency. State-owned or private operators have no listing and sit at the end.",
    decimals: 2,
    value: () => 0,
  },
  marketcap: {
    label: "Market cap (approx.)",
    unit: "approximate market capitalisation, USD billions",
    help: "Approximate latest market capitalisation in USD billions, converted at recent exchange rates. Private, state-owned or unlisted entities rank last.",
    decimals: 1,
    value: (c) => marketCapValue(CARRIER_TICKERS[c.name]),
  },

  ghg: {
    label: "GHG savings (reported)",
    unit: "million tonnes CO₂e avoided per year",
    help: GHG_NOTE,
    decimals: 1,
    value: (c) => ghgSavingsMt(c.name),
  },
};

/** Defines the scatter-plot axes for each selected metric so X and Y never collide. */
function scatterAxes(metricKey: Metric) {
  if (metricKey === "share") {
    return {
      x: { metric: METRICS.volume, help: "X-axis shows absolute biofuel volume; Y-axis shows biofuel intensity." },
      y: METRICS.share,
      size: { label: "Biofuel share of fuel burn", unit: "%", value: (c: Carrier) => c.share },
    };
  }
  if (metricKey === "price") {
    return {
      x: { metric: METRICS.share, help: "X-axis shows biofuel intensity; Y-axis shows share price." },
      y: METRICS.price,
      size: { label: "Biofuel volume used", unit: "Ml/yr", value: (c: Carrier) => c.volumeMnL },
    };
  }
  if (metricKey === "marketcap") {
    return {
      x: { metric: METRICS.volume, help: "X-axis shows absolute biofuel volume; Y-axis shows market cap." },
      y: METRICS.marketcap,
      size: { label: "Biofuel volume used", unit: "Ml/yr", value: (c: Carrier) => c.volumeMnL },
    };
  }
  return {
    x: { metric: METRICS.share, help: "X-axis shows biofuel intensity; Y-axis shows absolute biofuel volume." },
    y: METRICS.volume,
    size: { label: "Biofuel share of fuel burn", unit: "%", value: (c: Carrier) => c.share },
  };
}

function CarrierChart({
  title,
  blurb,
  icon: Icon,
  data,
  yLabel,
  newsSuffix,
  footnote,
  exportName,
}: {
  title: string;
  blurb: string;
  icon: typeof Ship;
  data: Carrier[];
  yLabel: string;
  newsSuffix: string;
  footnote: string;
  exportName: string;
}) {
  const [metricKey, setMetricKey] = useState<Metric>("volume");
  const [view, setView] = useState<PanelView>("heat");
  const detail = useEntityDetail();
  const { get } = useEntityQuotes();
  const metric = METRICS[metricKey];
  const valueOf = (c: Carrier) =>
    metricKey === "price" ? (get(CARRIER_TICKERS[c.name])?.price ?? 0) : metric.value(c);
  const f = useChartFilter(data, {
    text: (c) => `${c.name} ${c.country} ${c.note}`,
    facetA: (c) => c.country,
  });
  const ranked = f.filtered.slice().sort((a, b) => valueOf(b) - valueOf(a));
  // Default view is the global top 10; once a country or search filter is
  // applied we show every matching operator in that selection (capped at 20).
  const isFiltered = Boolean(f.a || f.b || f.query.trim());
  const rows = view === "table" ? ranked : ranked.slice(0, isFiltered ? 20 : 10);

  const axes = scatterAxes(metricKey);
  const scatterPoints: ScatterPoint[] = rows.map((c) => ({
    key: c.name,
    label: c.name,
    sub: `${c.country}`,
    x: axes.x.metric.value(c),
    y: valueOf(c),
    size: axes.size.value(c),
    group: c.country,
    logo: entityLogoByName(c.name),
    meta: priceMeta(get(CARRIER_TICKERS[c.name])),
    changePct: get(CARRIER_TICKERS[c.name])?.changePct,
    newsTarget: { name: c.name, query: `"${c.name}" ${newsSuffix}` },
  }));

  const items = rows.map((c) => ({
    key: c.name,
    label: c.name,
    sub: c.note,
    value: valueOf(c),
    logo: entityLogoByName(c.name),
    meta: priceMeta(get(CARRIER_TICKERS[c.name])),
    tone: priceTone(get(CARRIER_TICKERS[c.name])),
    changePct: get(CARRIER_TICKERS[c.name])?.changePct,
  }));
  const newsMap = Object.fromEntries(
    rows.map((c) => [c.name, { name: c.name, query: `"${c.name}" ${newsSuffix}` }]),
  );
  const filters: [string, string][] = [["Country", f.a || "All countries"]];
  if (f.query.trim()) filters.push(["Search", `"${f.query.trim()}"`]);
  const graph: GraphContext = {
    measure: metric.label,
    unit: metric.unit,
    view: PANEL_VIEWS.find((v) => v.value === view)?.label ?? view,
    filters,
    items: rows.map((c) => ({ name: c.name, value: valueOf(c) })),
    format: (n: number) => fmt(n, metric.decimals),
  };
  const onSelect = detail.onSelect((t) => {
    const c = rows.find((x) => x.name === t?.name);
    if (!c) return null;
    const q = get(CARRIER_TICKERS[c.name]);
    return {
      name: c.name,
      sub: `${c.flag} ${c.country}`,
      logo: entityLogoByName(c.name),
      note: c.note,
      stats: [
        { label: "Biofuel volume used", value: `${fmt(c.volumeMnL, 0)} Ml/yr` },
        { label: "Biofuel share of fuel burn", value: `${fmt(c.share, 1)}%` },
        { label: "Ticker", value: CARRIER_TICKERS[c.name] ?? "Not listed" },
        { label: "Share price", value: q ? fmt(q.price, 2) : "—" },
        { label: "Market cap (approx.)", value: marketCapLabel(CARRIER_TICKERS[c.name]) ?? "Private / state-owned" },
        {
          label: "1-day change",
          value: q ? `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%` : "—",
          tone: detailTone(q?.changePct),
        },
      ],
      news: { name: c.name, query: `"${c.name}" ${newsSuffix}` },
    };
  }, graph);

  return (
    <>
    {detail.sheet}
    <ChartPanel
      icon={Icon}
      title={title}
      blurb={blurb}
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
            title,
            filename: exportName,
            note: `Measure shown: ${metric.label}`,
            header: [
              yLabel,
              "Country",
              "Biofuel volume used (Ml/yr)",
              "Biofuel share of fuel burn (%)",
              "Ticker",
              "Share price",
              "1-day change %",
              "Market cap (approx., USD bn)",
              "Note",
            ],
            rows: ranked.map((c) => {
              const q = get(CARRIER_TICKERS[c.name]);
              return [
                c.name,
                c.country,
                c.volumeMnL,
                c.share,
                CARRIER_TICKERS[c.name] ?? "",
                q ? q.price.toFixed(2) : "",
                q ? q.changePct.toFixed(2) : "",
                marketCapLabel(CARRIER_TICKERS[c.name]) ?? "",
                c.note,
              ];
            }),
          })}
        />
      }
      filters={
        <ChartFilterBar
          query={f.query}
          onQueryChange={f.setQuery}
          placeholder="Search carriers…"
          selects={[
            {
              label: "Country",
              value: f.a,
              options: countryFilterOptions(data.map((c) => c.country)),
              onChange: f.setA,
              allLabel: "All countries",
            },
          ]}
          shown={rows.length}
          total={data.length}
          matched={ranked.length}
        />
      }
      footnote={`${footnote} ${MARKET_CAP_NOTE}`}
      assistant={
        <ChartSummaryAssistant
          disabled={rows.length === 0}
          build={() => ({
            panel: title,
            measureLabel: metric.label,
            unit: metric.unit,
            filterLabel: [f.a || "All countries", f.query ? `search "${f.query}"` : ""]
              .filter(Boolean)
              .join(" · "),
            shown: rows.length,
            total: data.length,
            rows: rows.map((c) => ({
              label: c.name,
              sub: `${c.country} · ${c.note}`,
              value: valueOf(c),
              price: get(CARRIER_TICKERS[c.name])?.price,
              changePct: get(CARRIER_TICKERS[c.name])?.changePct,
            })),
          })}
        />
      }
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No listed carriers for this filter — open that country's profile page for its policy and
          market updates.
        </p>
      ) : view === "line" ? (
        <ChartTrend panel="carriers" />
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
          indexLabel="Listed freight carriers index"
        />
      ) : view === "bars" ? (
        <ChartBars
          items={items}
          unitLabel={metric.unit}
          yLabel={yLabel}
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
          indexLabel="Listed freight carriers index"
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

export function CarriersPanel() {
  return (
    <div className="space-y-4">
      <CarrierChart
        icon={Ship}
        title="Top global shipping carriers using biofuel"
        blurb="Container lines, ro-ro and ferry operators bunkering bio-blends, biomethane and green methanol."
        data={SHIPPING}
        yLabel="Shipping carrier"
        exportName="shipping-carriers-biofuel"
        newsSuffix="biofuel OR bio-bunker OR green methanol shipping"
        footnote="Indicative annual bio-bunker volumes from carrier sustainability reports, FuelEU Maritime filings and bunkering disclosures. Click any bar for the latest news."
      />
      <CarrierChart
        icon={Truck}
        title="Top global trucking carriers using biofuel"
        blurb="Road freight and logistics fleets running renewable diesel, HVO100, biodiesel blends and renewable natural gas."
        data={TRUCKING}
        yLabel="Trucking carrier"
        exportName="trucking-carriers-biofuel"
        newsSuffix="renewable diesel OR HVO OR renewable natural gas fleet"
        footnote="Indicative annual renewable fuel volumes from fleet sustainability reports and low-carbon fuel programme filings. Click any bar for the latest news."
      />
      <CarrierChart
        icon={TrainFront}
        title="Top global rail carriers using biofuel"
        blurb="Freight and passenger railroads blending renewable diesel, HVO100 and biodiesel in diesel locomotive fleets."
        data={RAIL}
        yLabel="Rail carrier"
        exportName="rail-carriers-biofuel"
        newsSuffix="renewable diesel OR biodiesel locomotive rail"
        footnote="Indicative annual biofuel volumes from railroad sustainability disclosures and national rail decarbonisation programmes. Click any bar for the latest news."
      />
    </div>
  );
}
