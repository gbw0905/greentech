import { useState } from "react";
import { Container } from "lucide-react";
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
import { TERMINAL_TICKERS } from "@/lib/entity-tickers";
import { priceMeta, priceTone, useEntityQuotes } from "@/lib/use-entity-quotes";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { marketCapValue, marketCapLabel, MARKET_CAP_NOTE } from "@/lib/market-caps";
import { ChartSummaryAssistant } from "@/components/ChartSummaryAssistant";

type Terminal = {
  name: string;
  country: string;
  flag: string;
  /** Blending / storage throughput capacity, thousand cubic metres per year */
  capacityKm3: number;
  /** Number of blending terminals or racks in the network */
  terminals: number;
  note: string;
};

/**
 * Major biofuel blending terminal operators worldwide — the tank farms, import
 * jetties and truck-loading racks where ethanol, biodiesel, HVO and SAF are
 * splash- or in-line blended into finished road, marine and jet fuel.
 * Capacities are indicative annual blended-product throughput in thousand m³.
 */
const TERMINALS: Terminal[] = [
  // ---------- North America ----------
  { name: "Kinder Morgan Terminals", country: "United States", flag: "🇺🇸", capacityKm3: 42000, terminals: 140, note: "Largest US independent terminal network; ethanol and biodiesel blending racks" },
  { name: "Buckeye Partners", country: "United States", flag: "🇺🇸", capacityKm3: 26000, terminals: 110, note: "East-coast pipeline terminals with ethanol receipt and blend racks" },
  { name: "Magellan / ONEOK Terminals", country: "United States", flag: "🇺🇸", capacityKm3: 24000, terminals: 55, note: "Mid-continent ethanol and biodiesel blending across refined-product racks" },
  { name: "NuStar Energy", country: "United States", flag: "🇺🇸", capacityKm3: 18000, terminals: 60, note: "Gulf coast and mid-west renewable blending and storage" },
  { name: "TransMontaigne Partners", country: "United States", flag: "🇺🇸", capacityKm3: 14000, terminals: 50, note: "Refined-product terminals with dedicated ethanol tankage" },
  { name: "World Fuel / Flyers Energy racks", country: "United States", flag: "🇺🇸", capacityKm3: 9000, terminals: 35, note: "West-coast renewable diesel and biodiesel splash blending" },
  { name: "Global Partners LP", country: "United States", flag: "🇺🇸", capacityKm3: 8500, terminals: 30, note: "North-east ethanol receipt terminals serving RFS obligated parties" },
  { name: "Vertex / Gulf blending", country: "United States", flag: "🇺🇸", capacityKm3: 5200, terminals: 12, note: "Gulf coast renewable diesel blending and export loading" },
  { name: "Parkland Terminals", country: "Canada", flag: "🇨🇦", capacityKm3: 7800, terminals: 40, note: "Canadian Clean Fuel Regulations blending across western terminals" },
  { name: "Suncor Terminals", country: "Canada", flag: "🇨🇦", capacityKm3: 6900, terminals: 25, note: "Ethanol and biodiesel blending into Petro-Canada supply" },

  // ---------- Europe ----------
  { name: "Vopak", country: "Netherlands", flag: "🇳🇱", capacityKm3: 38000, terminals: 78, note: "World's largest independent tank storage; ARA biofuel blending hubs" },
  { name: "Evos Terminals", country: "Netherlands", flag: "🇳🇱", capacityKm3: 9500, terminals: 9, note: "Amsterdam, Rotterdam, Ghent and Hamburg biofuel blending tankage" },
  { name: "GPS Terminals Amsterdam", country: "Netherlands", flag: "🇳🇱", capacityKm3: 7200, terminals: 3, note: "Dedicated biodiesel and ethanol blending in the Amsterdam gasoline hub" },
  { name: "Oiltanking", country: "Germany", flag: "🇩🇪", capacityKm3: 16000, terminals: 45, note: "Global storage group with European FAME and HVO blending" },
  { name: "TanQuid", country: "Germany", flag: "🇩🇪", capacityKm3: 6400, terminals: 17, note: "German and Polish inland terminals blending to E10 and B7" },
  { name: "HES International", country: "Belgium", flag: "🇧🇪", capacityKm3: 8800, terminals: 12, note: "ARA-range liquid bulk terminals with Annex IX biodiesel handling" },
  { name: "Rubis Terminal", country: "France", flag: "🇫🇷", capacityKm3: 7600, terminals: 20, note: "French and Iberian terminals blending B100, B7 and E10" },
  { name: "Exolum (CLH)", country: "Spain", flag: "🇪🇸", capacityKm3: 15000, terminals: 68, note: "Spanish pipeline network with in-line biofuel blending at every rack" },
  { name: "Inter Terminals", country: "United Kingdom", flag: "🇬🇧", capacityKm3: 6100, terminals: 22, note: "UK and Nordic terminals supporting RTFO-compliant blending" },
  { name: "Navigator Terminals", country: "United Kingdom", flag: "🇬🇧", capacityKm3: 4800, terminals: 6, note: "Thames and Humber biofuel storage and blending" },
  { name: "Preem Terminals", country: "Sweden", flag: "🇸🇪", capacityKm3: 5400, terminals: 14, note: "Swedish HVO100 and reduction-obligation blending depots" },
  { name: "Neste terminals", country: "Finland", flag: "🇫🇮", capacityKm3: 8200, terminals: 18, note: "Renewable diesel and SAF blending and dispatch terminals" },
  { name: "PKN Orlen terminals", country: "Poland", flag: "🇵🇱", capacityKm3: 7100, terminals: 26, note: "Central European blending under national NIT obligations" },
  { name: "MOL logistics terminals", country: "Hungary", flag: "🇭🇺", capacityKm3: 4300, terminals: 16, note: "Danube-region ethanol and FAME blending racks" },
  { name: "Eni Sustainable Mobility depots", country: "Italy", flag: "🇮🇹", capacityKm3: 9800, terminals: 30, note: "HVOlution and B7 blending across Italian logistics network" },
  { name: "Galp terminals", country: "Portugal", flag: "🇵🇹", capacityKm3: 3600, terminals: 11, note: "Iberian biodiesel and ethanol blending for RED III targets" },

  // ---------- Asia-Pacific ----------
  { name: "Sinopec blending terminals", country: "China", flag: "🇨🇳", capacityKm3: 30000, terminals: 90, note: "E10 gasoline blending across provincial distribution depots" },
  { name: "PetroChina terminals", country: "China", flag: "🇨🇳", capacityKm3: 26000, terminals: 80, note: "Ethanol blending and biodiesel B5 pilots in coastal provinces" },
  { name: "Indian Oil terminals", country: "India", flag: "🇮🇳", capacityKm3: 34000, terminals: 130, note: "E20 ethanol blending racks nationwide under the EBP programme" },
  { name: "Bharat Petroleum terminals", country: "India", flag: "🇮🇳", capacityKm3: 19000, terminals: 70, note: "Ethanol blending and storage supporting the E20 mandate" },
  { name: "Hindustan Petroleum terminals", country: "India", flag: "🇮🇳", capacityKm3: 17000, terminals: 65, note: "Ethanol receipt tankage and blending across the HPCL network" },
  { name: "Pertamina Patra Niaga", country: "Indonesia", flag: "🇮🇩", capacityKm3: 28000, terminals: 110, note: "B35/B40 biodiesel blending across Indonesian fuel terminals" },
  { name: "Petronas Dagangan terminals", country: "Malaysia", flag: "🇲🇾", capacityKm3: 9200, terminals: 26, note: "B10/B20 palm biodiesel blending for road transport" },
  { name: "PTT OR terminals", country: "Thailand", flag: "🇹🇭", capacityKm3: 11000, terminals: 30, note: "Gasohol E20/E85 and B7 blending across Thai depots" },
  { name: "Eneos terminals", country: "Japan", flag: "🇯🇵", capacityKm3: 8600, terminals: 34, note: "ETBE blending and SAF supply terminals for Japanese airports" },
  { name: "Ampol terminals", country: "Australia", flag: "🇦🇺", capacityKm3: 6200, terminals: 20, note: "Australian ethanol E10 blending and renewable diesel imports" },
  { name: "Viva Energy terminals", country: "Australia", flag: "🇦🇺", capacityKm3: 5800, terminals: 18, note: "Geelong and coastal terminals with renewable blending capacity" },

  // ---------- Latin America / Africa / Middle East ----------
  { name: "Vibra Energia terminals", country: "Brazil", flag: "🇧🇷", capacityKm3: 32000, terminals: 95, note: "Brazil's largest distributor; E27 and B15 blending nationwide" },
  { name: "Raízen logistics", country: "Brazil", flag: "🇧🇷", capacityKm3: 29000, terminals: 70, note: "Ethanol terminals integrated with sugarcane mills and ports" },
  { name: "Ipiranga terminals", country: "Brazil", flag: "🇧🇷", capacityKm3: 21000, terminals: 60, note: "Anhydrous ethanol and biodiesel blending racks" },
  { name: "YPF terminals", country: "Argentina", flag: "🇦🇷", capacityKm3: 8400, terminals: 28, note: "Argentine E12 and B7.5 blending under national mandates" },
  { name: "Copec terminals", country: "Chile", flag: "🇨🇱", capacityKm3: 4100, terminals: 15, note: "Chilean renewable diesel import and blending logistics" },
  { name: "Engen terminals", country: "South Africa", flag: "🇿🇦", capacityKm3: 3800, terminals: 12, note: "Southern African blending ahead of the national biofuel mandate" },
  { name: "ADNOC Distribution terminals", country: "United Arab Emirates", flag: "🇦🇪", capacityKm3: 5600, terminals: 14, note: "SAF blending and dispatch for Gulf airport supply" },
];

type Metric = "capacity" | "sites" | "price" | "marketcap";

const METRICS: Record<
  Metric,
  { label: string; unit: string; help: string; decimals: number; value: (t: Terminal) => number }
> = {
  capacity: {
    label: "Blending capacity (k m³/yr)",
    unit: "thousand cubic metres of blended fuel / year",
    help: "Indicative annual throughput of blended fuel handled by the operator's terminals, in thousand cubic metres. Bigger tiles mean more finished biofuel-blended product moving to market.",
    decimals: 0,
    value: (t) => t.capacityKm3,
  },
  sites: {
    label: "Blending terminals",
    unit: "terminals or loading racks in the network",
    help: "Number of terminals and truck-loading racks capable of blending biofuels. A single very large hub can outrank a wide network on capacity but not here.",
    decimals: 0,
    value: (t) => t.terminals,
  },
  price: {
    label: "Share price (listing currency)",
    unit: "share price, primary listing currency",
    help: "Latest traded share price on the operator's primary listing, in that exchange's currency. Private or state-owned operators have no listing and sit at the end.",
    decimals: 2,
    value: () => 0,
  },
  marketcap: {
    label: "Market cap (approx.)",
    unit: "approximate market capitalisation, USD billions",
    help: "Approximate latest market capitalisation in USD billions, converted at recent exchange rates. Private, state-owned or unlisted entities rank last.",
    decimals: 1,
    value: (t) => marketCapValue(TERMINAL_TICKERS[t.name]),
  },
};

function scatterAxes(metricKey: Metric) {
  if (metricKey === "capacity") {
    return {
      x: { metric: METRICS.sites, help: "X-axis shows terminal count; Y-axis shows blending capacity." },
      size: { label: "Blending capacity", unit: "k m³/yr", value: (t: Terminal) => t.capacityKm3 },
    };
  }
  if (metricKey === "marketcap") {
    return {
      x: { metric: METRICS.capacity, help: "X-axis shows blending capacity; Y-axis shows approximate market cap." },
      size: { label: "Blending capacity", unit: "k m³/yr", value: (t: Terminal) => t.capacityKm3 },
    };
  }
  return {
    x: { metric: METRICS.capacity, help: "X-axis shows blending capacity; Y-axis shows the selected measure." },
    size: { label: "Blending terminals", unit: "terminals", value: (t: Terminal) => t.terminals },
  };
}

const TITLE = "Global blending terminals and capacity";
const NEWS_SUFFIX = "biofuel blending terminal storage";

export function BlendingTerminalsPanel() {
  const [metricKey, setMetricKey] = useState<Metric>("capacity");
  const [view, setView] = useState<PanelView>("heat");
  const detail = useEntityDetail();
  const { get } = useEntityQuotes();
  const metric = METRICS[metricKey];
  const valueOf = (t: Terminal) =>
    metricKey === "price" ? (get(TERMINAL_TICKERS[t.name])?.price ?? 0) : metric.value(t);

  const f = useChartFilter(TERMINALS, {
    text: (t) => `${t.name} ${t.country} ${t.note}`,
    facetA: (t) => t.country,
  });
  const ranked = f.filtered.slice().sort((a, b) => valueOf(b) - valueOf(a));
  const isFiltered = Boolean(f.a || f.b || f.query.trim());
  const rows = view === "table" ? ranked : ranked.slice(0, isFiltered ? 20 : 10);

  const axes = scatterAxes(metricKey);
  const scatterPoints: ScatterPoint[] = rows.map((t) => ({
    key: t.name,
    label: t.name,
    sub: t.country,
    x: axes.x.metric.value(t),
    y: valueOf(t),
    size: axes.size.value(t),
    group: t.country,
    logo: entityLogoByName(t.name),
    meta: priceMeta(get(TERMINAL_TICKERS[t.name])),
    changePct: get(TERMINAL_TICKERS[t.name])?.changePct,
    newsTarget: { name: t.name, query: `"${t.name}" ${NEWS_SUFFIX}` },
  }));

  const items = rows.map((t) => ({
    key: t.name,
    label: t.name,
    sub: t.note,
    value: valueOf(t),
    logo: entityLogoByName(t.name),
    meta: priceMeta(get(TERMINAL_TICKERS[t.name])),
    tone: priceTone(get(TERMINAL_TICKERS[t.name])),
    changePct: get(TERMINAL_TICKERS[t.name])?.changePct,
  }));
  const newsMap = Object.fromEntries(
    rows.map((t) => [t.name, { name: t.name, query: `"${t.name}" ${NEWS_SUFFIX}` }]),
  );
  const filters: [string, string][] = [["Country", f.a || "All countries"]];
  if (f.query.trim()) filters.push(["Search", `"${f.query.trim()}"`]);
  const graph: GraphContext = {
    measure: metric.label,
    unit: metric.unit,
    view: PANEL_VIEWS.find((v) => v.value === view)?.label ?? view,
    filters,
    items: rows.map((t) => ({ name: t.name, value: valueOf(t) })),
    format: (n: number) => fmt(n, metric.decimals),
  };
  const onSelect = detail.onSelect((target) => {
    const t = rows.find((r) => r.name === target?.name);
    if (!t) return null;
    const q = get(TERMINAL_TICKERS[t.name]);
    return {
      name: t.name,
      sub: `${t.flag} ${t.country}`,
      logo: entityLogoByName(t.name),
      note: t.note,
      stats: [
        { label: "Blending capacity", value: `${fmt(t.capacityKm3, 0)} k m³/yr` },
        { label: "Blending terminals", value: fmt(t.terminals, 0) },
        { label: "Ticker", value: TERMINAL_TICKERS[t.name] ?? "Not listed" },
        { label: "Share price", value: q ? fmt(q.price, 2) : "—" },
        {
          label: "1-day change",
          value: q ? `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%` : "—",
          tone: detailTone(q?.changePct),
        },
        { label: "Market cap (approx.)", value: marketCapLabel(TERMINAL_TICKERS[t.name]) ?? "Private / state-owned" },
      ],
      news: { name: t.name, query: `"${t.name}" ${NEWS_SUFFIX}` },
    };
  }, graph);

  return (
    <>
      {detail.sheet}
      <ChartPanel
        icon={Container}
        title={TITLE}
        blurb="Tank farms, import jetties and truck-loading racks where ethanol, biodiesel, renewable diesel and SAF are blended into finished fuel."
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
              filename: "global-blending-terminals",
              note: `Measure shown: ${metric.label}`,
              header: [
                "Terminal operator",
                "Country",
                "Blending capacity (k m3/yr)",
                "Blending terminals",
                "Ticker",
                "Share price",
                "1-day change %",
                "Market cap (approx., USD bn)",
                "Note",
              ],
              rows: ranked.map((t) => {
                const q = get(TERMINAL_TICKERS[t.name]);
                return [
                  t.name,
                  t.country,
                  t.capacityKm3,
                  t.terminals,
                  TERMINAL_TICKERS[t.name] ?? "",
                  q ? q.price.toFixed(2) : "",
                  q ? q.changePct.toFixed(2) : "",
                  marketCapLabel(TERMINAL_TICKERS[t.name]) ?? "",
                  t.note,
                ];
              }),
            })}
          />
        }
        filters={
          <ChartFilterBar
            query={f.query}
            onQueryChange={f.setQuery}
            placeholder="Search terminal operators…"
            selects={[
              {
                label: "Country",
                value: f.a,
                options: countryFilterOptions(TERMINALS.map((t) => t.country)),
                onChange: f.setA,
                allLabel: "All countries",
              },
            ]}
            shown={rows.length}
            total={TERMINALS.length}
            matched={ranked.length}
          />
        }
        footnote={`Indicative blending throughput and terminal counts from operator annual reports, terminal registries and national fuel-obligation filings. Click any tile for the latest news. ${MARKET_CAP_NOTE}`}
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
              total: TERMINALS.length,
              rows: rows.map((t) => ({
                label: t.name,
                sub: `${t.country} · ${t.note}`,
                value: valueOf(t),
                price: get(TERMINAL_TICKERS[t.name])?.price,
                changePct: get(TERMINAL_TICKERS[t.name])?.changePct,
              })),
            })}
          />
        }
      >
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No blending terminals listed for this filter — open that country's profile page for its
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
            indexLabel="Global blending terminals index"
          />
        ) : view === "bars" ? (
          <ChartBars
            items={items}
            unitLabel={metric.unit}
            yLabel="Terminal operator"
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
            indexLabel="Global blending terminals index"
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
