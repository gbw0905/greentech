import { useState } from "react";
import { Ship } from "lucide-react";
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
import { MARINE_TICKERS } from "@/lib/entity-tickers";
import { priceMeta, priceTone, useEntityQuotes } from "@/lib/use-entity-quotes";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { ChartSummaryAssistant } from "@/components/ChartSummaryAssistant";

type MarineRole = "Supplier" | "User";

type MarineEntity = {
  name: string;
  country: string;
  flag: string;
  role: MarineRole;
  /** Approximate marine biofuel supplied or consumed, thousand tonnes per year */
  volumeKt: number;
  /** Bunkering ports supplied, or vessels running biofuel blends */
  reach: number;
  /** Typical blend level offered or bunkered, % FAME/HVO in VLSFO */
  blendPct: number;
  note: string;
};

/**
 * Global marine biofuel market: bunker suppliers blending FAME/HVO into VLSFO
 * and MGO, and the shipping operators bunkering those blends at scale.
 * Volumes are indicative annual estimates in kilotonnes of biofuel component.
 */
const ENTITIES: MarineEntity[] = [
  // ---------- Suppliers ----------
  { name: "GoodFuels", country: "Netherlands", flag: "🇳🇱", role: "Supplier", volumeKt: 190, reach: 22, blendPct: 30, note: "Pioneer marine biofuel supplier (FincoEnergies), ISCC-certified waste-based blends" },
  { name: "TotalEnergies Marine Fuels", country: "France", flag: "🇫🇷", role: "Supplier", volumeKt: 175, reach: 18, blendPct: 30, note: "B24/B30 blends in Singapore, Rotterdam and Gibraltar" },
  { name: "Shell Marine", country: "United Kingdom", flag: "🇬🇧", role: "Supplier", volumeKt: 215, reach: 25, blendPct: 30, note: "Global bio-VLSFO supply across Rotterdam, Singapore and US Gulf" },
  { name: "BP Marine", country: "United Kingdom", flag: "🇬🇧", role: "Supplier", volumeKt: 135, reach: 16, blendPct: 24, note: "Bio-bunker blends at ARA and Asian hubs" },
  { name: "Chevron Marine Products", country: "United States", flag: "🇺🇸", role: "Supplier", volumeKt: 85, reach: 11, blendPct: 25, note: "B24 and B30 bunker deliveries in Europe and Singapore" },
  { name: "Exxon Mobil Marine", country: "United States", flag: "🇺🇸", role: "Supplier", volumeKt: 95, reach: 12, blendPct: 25, note: "Bio-blended residual and distillate bunkers" },
  { name: "Vitol Bunkers", country: "Switzerland", flag: "🇨🇭", role: "Supplier", volumeKt: 160, reach: 20, blendPct: 30, note: "Physical bio-bunker supply across ARA, Med and Asia" },
  { name: "Trafigura / TFG Marine", country: "Singapore", flag: "🇸🇬", role: "Supplier", volumeKt: 185, reach: 24, blendPct: 30, note: "Fast-growing physical supplier of B24/B30 blends" },
  { name: "Bunker One", country: "Denmark", flag: "🇩🇰", role: "Supplier", volumeKt: 105, reach: 15, blendPct: 30, note: "Bio-bunkering in Northern Europe and the Americas" },
  { name: "Peninsula Petroleum", country: "Gibraltar", flag: "🇬🇮", role: "Supplier", volumeKt: 80, reach: 10, blendPct: 24, note: "Med and Iberia bio-blend bunker deliveries" },
  { name: "Minerva Bunkering", country: "Switzerland", flag: "🇨🇭", role: "Supplier", volumeKt: 70, reach: 12, blendPct: 24, note: "Physical supplier of biofuel bunkers in Europe and West Africa" },
  { name: "Monjasa", country: "Denmark", flag: "🇩🇰", role: "Supplier", volumeKt: 55, reach: 9, blendPct: 24, note: "Bio-blends across Northwest Europe, Panama and UAE" },
  { name: "Sinopec Fuel Oil", country: "China", flag: "🇨🇳", role: "Supplier", volumeKt: 155, reach: 8, blendPct: 24, note: "B24 supply at Zhoushan and Shanghai bonded bunkering" },
  { name: "Global Energy Trading (SG)", country: "Singapore", flag: "🇸🇬", role: "Supplier", volumeKt: 115, reach: 6, blendPct: 24, note: "Singapore MPA-licensed B24 bio-bunker supplier" },
  { name: "Hong Lam Marine", country: "Singapore", flag: "🇸🇬", role: "Supplier", volumeKt: 45, reach: 4, blendPct: 24, note: "Bunker tanker operator delivering biofuel blends" },
  { name: "Neste Marine", country: "Finland", flag: "🇫🇮", role: "Supplier", volumeKt: 125, reach: 14, blendPct: 100, note: "Neste Marine 0.1 Co-processed and 100% renewable marine fuels" },
  { name: "Preem Marine", country: "Sweden", flag: "🇸🇪", role: "Supplier", volumeKt: 40, reach: 5, blendPct: 30, note: "Nordic bio-marine gasoil for coastal and ferry fleets" },
  { name: "Eni Sustainable Mobility (marine)", country: "Italy", flag: "🇮🇹", role: "Supplier", volumeKt: 65, reach: 7, blendPct: 30, note: "HVO-based marine diesel for Med shipping" },
  { name: "Repsol Marine", country: "Spain", flag: "🇪🇸", role: "Supplier", volumeKt: 50, reach: 8, blendPct: 25, note: "Advanced-biofuel bunkers at Spanish ports" },
  { name: "Cepsa / Moeve Marine", country: "Spain", flag: "🇪🇸", role: "Supplier", volumeKt: 45, reach: 7, blendPct: 25, note: "Second-generation biofuel bunkering in Algeciras" },
  { name: "Itochu Enex Marine", country: "Japan", flag: "🇯🇵", role: "Supplier", volumeKt: 40, reach: 5, blendPct: 24, note: "Japanese biofuel bunker trials and commercial supply" },
  { name: "GS Caltex Marine", country: "South Korea", flag: "🇰🇷", role: "Supplier", volumeKt: 35, reach: 4, blendPct: 24, note: "Korean B24 bunkering at Busan and Ulsan" },
  { name: "Viva Energy Marine", country: "Australia", flag: "🇦🇺", role: "Supplier", volumeKt: 25, reach: 4, blendPct: 20, note: "Australian coastal biofuel bunker supply" },
  { name: "Vibra Energia Marine", country: "Brazil", flag: "🇧🇷", role: "Supplier", volumeKt: 30, reach: 5, blendPct: 24, note: "Brazilian B24 marine blends at Santos and Rio" },
  { name: "ADNOC Marine Fuels", country: "United Arab Emirates", flag: "🇦🇪", role: "Supplier", volumeKt: 40, reach: 4, blendPct: 24, note: "Bio-bunker deliveries at Fujairah" },

  // ---------- Users ----------
  { name: "Maersk", country: "Denmark", flag: "🇩🇰", role: "User", volumeKt: 280, reach: 130, blendPct: 30, note: "ECO Delivery green fuel programme across container fleet" },
  { name: "CMA CGM", country: "France", flag: "🇫🇷", role: "User", volumeKt: 215, reach: 95, blendPct: 30, note: "ACT+ biofuel offering and large B30 bunkerings" },
  { name: "MSC", country: "Switzerland", flag: "🇨🇭", role: "User", volumeKt: 235, reach: 110, blendPct: 30, note: "World's largest container fleet running routine bio-blend bunkers" },
  { name: "Hapag-Lloyd", country: "Germany", flag: "🇩🇪", role: "User", volumeKt: 135, reach: 70, blendPct: 30, note: "Ship Green product with waste-based biofuel" },
  { name: "ONE (Ocean Network Express)", country: "Singapore", flag: "🇸🇬", role: "User", volumeKt: 95, reach: 55, blendPct: 24, note: "B24 bunkerings in Singapore and Rotterdam" },
  { name: "Evergreen", country: "Taiwan", flag: "🇹🇼", role: "User", volumeKt: 70, reach: 40, blendPct: 24, note: "Biofuel trials scaled into regular Asia-Europe services" },
  { name: "HMM", country: "South Korea", flag: "🇰🇷", role: "User", volumeKt: 55, reach: 32, blendPct: 24, note: "Korean carrier bunkering B24 on long-haul loops" },
  { name: "Cosco Shipping", country: "China", flag: "🇨🇳", role: "User", volumeKt: 110, reach: 60, blendPct: 24, note: "Zhoushan B24 bunkerings across container and bulk fleets" },
  { name: "Wallenius Wilhelmsen", country: "Norway", flag: "🇳🇴", role: "User", volumeKt: 80, reach: 45, blendPct: 30, note: "Car-carrier fleet with biofuel-powered customer programme" },
  { name: "NYK Line", country: "Japan", flag: "🇯🇵", role: "User", volumeKt: 60, reach: 38, blendPct: 24, note: "Japanese operator using biofuel on bulk and car carriers" },
  { name: "Mitsui O.S.K. Lines", country: "Japan", flag: "🇯🇵", role: "User", volumeKt: 55, reach: 36, blendPct: 24, note: "Biofuel bunkering across LNG, bulk and car carriers" },
  { name: "ZIM", country: "Israel", flag: "🇮🇱", role: "User", volumeKt: 30, reach: 20, blendPct: 24, note: "Bio-blend bunkers on selected transatlantic services" },
  { name: "Stena Line", country: "Sweden", flag: "🇸🇪", role: "User", volumeKt: 45, reach: 25, blendPct: 30, note: "Ferry operator running biofuel blends on Nordic routes" },
  { name: "DFDS", country: "Denmark", flag: "🇩🇰", role: "User", volumeKt: 40, reach: 22, blendPct: 30, note: "Ro-ro and ferry fleet with green-fuel customer product" },
  { name: "Grimaldi Group", country: "Italy", flag: "🇮🇹", role: "User", volumeKt: 35, reach: 24, blendPct: 24, note: "Med ro-ro operator bunkering advanced marine biofuels" },
  { name: "Norwegian Cruise Line", country: "United States", flag: "🇺🇸", role: "User", volumeKt: 20, reach: 12, blendPct: 24, note: "Cruise biofuel trials in Northern Europe" },
  { name: "Carnival Corporation", country: "United States", flag: "🇺🇸", role: "User", volumeKt: 25, reach: 15, blendPct: 24, note: "Bio-blend bunkering across AIDA and Holland America brands" },
  { name: "Royal Caribbean", country: "United States", flag: "🇺🇸", role: "User", volumeKt: 25, reach: 14, blendPct: 24, note: "Biofuel bunkering at Rotterdam and Barcelona" },
  { name: "Bahri", country: "Saudi Arabia", flag: "🇸🇦", role: "User", volumeKt: 20, reach: 10, blendPct: 20, note: "Tanker operator trialling bio-blends on Europe voyages" },
  { name: "Fortescue Shipping", country: "Australia", flag: "🇦🇺", role: "User", volumeKt: 15, reach: 8, blendPct: 30, note: "Ore carriers on biofuel and green-fuel pilots" },
  { name: "BHP Chartered Fleet", country: "Australia", flag: "🇦🇺", role: "User", volumeKt: 30, reach: 18, blendPct: 24, note: "Bulk charterer procuring biofuel-powered voyages" },
  { name: "Rio Tinto Marine", country: "Australia", flag: "🇦🇺", role: "User", volumeKt: 25, reach: 16, blendPct: 24, note: "Iron-ore shipping with biofuel bunkering programme" },
  { name: "Cargill Ocean Transportation", country: "United States", flag: "🇺🇸", role: "User", volumeKt: 50, reach: 30, blendPct: 30, note: "Dry-bulk charterer with large biofuel voyage programme" },
  { name: "Louis Dreyfus Company", country: "Netherlands", flag: "🇳🇱", role: "User", volumeKt: 20, reach: 14, blendPct: 24, note: "Agri-commodity shipper using bio-bunkers on export routes" },
  { name: "Amazon (ocean freight)", country: "United States", flag: "🇺🇸", role: "User", volumeKt: 35, reach: 20, blendPct: 30, note: "Shipper buying biofuel-powered container slots" },
  { name: "IKEA / Inter IKEA", country: "Sweden", flag: "🇸🇪", role: "User", volumeKt: 30, reach: 18, blendPct: 30, note: "Cargo owner committed to biofuel or zero-emission ocean freight" },
];

type Metric = "volume" | "reach" | "blend" | "price";

const METRICS: Record<
  Metric,
  { label: string; unit: string; help: string; decimals: number; value: (e: MarineEntity) => number }
> = {
  volume: {
    label: "Marine biofuel (kt/yr)",
    unit: "thousand tonnes of biofuel component / year",
    help: "Estimated marine biofuel supplied or bunkered each year, in thousand tonnes of the bio component (not the whole blended bunker).",
    decimals: 0,
    value: (e) => e.volumeKt,
  },
  reach: {
    label: "Ports / vessels covered",
    unit: "bunkering ports supplied, or vessels bunkering blends",
    help: "For suppliers this is the number of bunkering ports offering bio-blends; for users it is the number of vessels regularly bunkering them.",
    decimals: 0,
    value: (e) => e.reach,
  },
  blend: {
    label: "Typical blend level (%)",
    unit: "% bio component in the delivered bunker",
    help: "Typical blend level offered or bunkered — B24 and B30 dominate today, with a few fully renewable marine fuels at 100%.",
    decimals: 0,
    value: (e) => e.blendPct,
  },
  price: {
    label: "Share price (listing currency)",
    unit: "share price, primary listing currency",
    help: "Latest traded share price on the entity's primary listing. Private, state-owned and cargo-owner entities have no listing and sit at the end.",
    decimals: 2,
    value: () => 0,
  },
};

function scatterAxes(metricKey: Metric) {
  if (metricKey === "volume") {
    return {
      x: { metric: METRICS.reach, help: "X-axis shows port or vessel coverage; Y-axis shows annual marine biofuel volume." },
      size: { label: "Marine biofuel", unit: "kt/yr", value: (e: MarineEntity) => e.volumeKt },
    };
  }
  return {
    x: { metric: METRICS.volume, help: "X-axis shows annual marine biofuel volume." },
    size: { label: "Ports / vessels", unit: "count", value: (e: MarineEntity) => e.reach },
  };
}

const TITLE = "Global marine biofuel suppliers and users";
const NEWS_SUFFIX = "marine biofuel OR bio-bunker OR B30 bunkering";

export function MarineBiofuelPanel() {
  const [metricKey, setMetricKey] = useState<Metric>("volume");
  const [view, setView] = useState<PanelView>("heat");
  const detail = useEntityDetail();
  const { get } = useEntityQuotes();
  const metric = METRICS[metricKey];
  const valueOf = (e: MarineEntity) =>
    metricKey === "price" ? (get(MARINE_TICKERS[e.name])?.price ?? 0) : metric.value(e);

  const f = useChartFilter(ENTITIES, {
    text: (e) => `${e.name} ${e.country} ${e.role} ${e.note}`,
    facetA: (e) => e.country,
    facetB: (e) => e.role,
  });
  const ranked = f.filtered.slice().sort((a, b) => valueOf(b) - valueOf(a));
  const isFiltered = Boolean(f.a || f.b || f.query.trim());
  const rows = ranked.slice(0, isFiltered ? 20 : 10);

  const axes = scatterAxes(metricKey);
  const scatterPoints: ScatterPoint[] = rows.map((e) => ({
    key: e.name,
    label: e.name,
    sub: `${e.role} · ${e.country}`,
    x: axes.x.metric.value(e),
    y: valueOf(e),
    size: axes.size.value(e),
    group: e.role,
    logo: entityLogoByName(e.name),
    meta: priceMeta(get(MARINE_TICKERS[e.name])),
    changePct: get(MARINE_TICKERS[e.name])?.changePct,
    newsTarget: { name: e.name, query: `"${e.name}" ${NEWS_SUFFIX}` },
  }));

  const items = rows.map((e) => ({
    key: e.name,
    label: e.name,
    sub: `${e.role} · ${e.note}`,
    value: valueOf(e),
    logo: entityLogoByName(e.name),
    meta: priceMeta(get(MARINE_TICKERS[e.name])),
    tone: priceTone(get(MARINE_TICKERS[e.name])),
    changePct: get(MARINE_TICKERS[e.name])?.changePct,
  }));
  const newsMap = Object.fromEntries(
    rows.map((e) => [e.name, { name: e.name, query: `"${e.name}" ${NEWS_SUFFIX}` }]),
  );
  const filters: [string, string][] = [
    ["Role", f.b || "Suppliers & users"],
    ["Country", f.a || "All countries"],
  ];
  if (f.query.trim()) filters.push(["Search", `"${f.query.trim()}"`]);
  const graph: GraphContext = {
    measure: metric.label,
    unit: metric.unit,
    view: PANEL_VIEWS.find((v) => v.value === view)?.label ?? view,
    filters,
    items: rows.map((e) => ({ name: e.name, value: valueOf(e) })),
    format: (n: number) => fmt(n, metric.decimals),
  };
  const onSelect = detail.onSelect((t) => {
    const e = rows.find((r) => r.name === t?.name);
    if (!e) return null;
    const q = get(MARINE_TICKERS[e.name]);
    return {
      name: e.name,
      sub: `${e.flag} ${e.country} · ${e.role}`,
      logo: entityLogoByName(e.name),
      note: e.note,
      stats: [
        { label: "Marine biofuel", value: `${fmt(e.volumeKt, 0)} kt/yr` },
        { label: "Ports / vessels", value: fmt(e.reach, 0) },
        { label: "Typical blend", value: `${fmt(e.blendPct, 0)}%` },
        { label: "Ticker", value: MARINE_TICKERS[e.name] ?? "Not listed" },
        { label: "Share price", value: q ? fmt(q.price, 2) : "—" },
        {
          label: "1-day change",
          value: q ? `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%` : "—",
          tone: detailTone(q?.changePct),
        },
      ],
      news: { name: e.name, query: `"${e.name}" ${NEWS_SUFFIX}` },
    };
  }, graph);

  return (
    <>
      {detail.sheet}
      <ChartPanel
        icon={Ship}
        title={TITLE}
        blurb="Bunker suppliers blending FAME and HVO into VLSFO and MGO, and the shipping lines, ferry operators and cargo owners bunkering those blends."
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
              filename: "global-marine-biofuel",
              note: `Measure shown: ${metric.label}`,
              header: [
                "Entity",
                "Role",
                "Country",
                "Marine biofuel (kt/yr)",
                "Ports / vessels",
                "Typical blend %",
                "Ticker",
                "Share price",
                "1-day change %",
                "Note",
              ],
              rows: ranked.map((e) => {
                const q = get(MARINE_TICKERS[e.name]);
                return [
                  e.name,
                  e.role,
                  e.country,
                  e.volumeKt,
                  e.reach,
                  e.blendPct,
                  MARINE_TICKERS[e.name] ?? "",
                  q ? q.price.toFixed(2) : "",
                  q ? q.changePct.toFixed(2) : "",
                  e.note,
                ];
              }),
            })}
          />
        }
        filters={
          <ChartFilterBar
            query={f.query}
            onQueryChange={f.setQuery}
            placeholder="Search marine biofuel entities…"
            selects={[
              {
                label: "Role",
                value: f.b,
                options: ["Supplier", "User"],
                onChange: f.setB,
                allLabel: "Suppliers & users",
              },
              {
                label: "Country",
                value: f.a,
                options: countryFilterOptions(ENTITIES.map((e) => e.country)),
                onChange: f.setA,
                allLabel: "All countries",
              },
            ]}
            shown={rows.length}
            total={ENTITIES.length}
            matched={ranked.length}
          />
        }
        footnote="Indicative annual marine biofuel volumes from bunker supplier disclosures, MPA Singapore and Port of Rotterdam bunker statistics, and shipping-line sustainability reports. Click any tile for the latest news."
        assistant={
          <ChartSummaryAssistant
            disabled={rows.length === 0}
            build={() => ({
              panel: TITLE,
              measureLabel: metric.label,
              unit: metric.unit,
              filterLabel: [f.b || "Suppliers & users", f.a || "All countries", f.query ? `search "${f.query}"` : ""]
                .filter(Boolean)
                .join(" · "),
              shown: rows.length,
              total: ENTITIES.length,
              rows: rows.map((e) => ({
                label: e.name,
                sub: `${e.role} · ${e.country} · ${e.note}`,
                value: valueOf(e),
                price: get(MARINE_TICKERS[e.name])?.price,
                changePct: get(MARINE_TICKERS[e.name])?.changePct,
              })),
            })}
          />
        }
      >
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No marine biofuel suppliers or users listed for this filter — open that country's profile
            page for its policy and market updates.
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
            indexLabel="Global marine biofuel index"
          />
        ) : view === "bars" ? (
          <ChartBars
            items={items}
            unitLabel={metric.unit}
            yLabel="Marine biofuel entity"
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
            indexLabel="Global marine biofuel index"
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
