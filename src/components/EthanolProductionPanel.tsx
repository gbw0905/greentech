import { useState } from "react";
import { Wheat } from "lucide-react";
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
import { detailTone, useEntityDetail } from "@/components/EntityDetailSheet";
import { ChartFilterBar, countryFilterOptions, useChartFilter } from "@/components/chart-filters";
import { entityLogoByName } from "@/lib/entity-logos";
import { ETHANOL_TICKERS } from "@/lib/entity-tickers";
import { priceMeta, priceTone, useEntityQuotes } from "@/lib/use-entity-quotes";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { ChartSummaryAssistant } from "@/components/ChartSummaryAssistant";

type Producer = {
  name: string;
  country: string;
  flag: string;
  /** Annual fuel ethanol production capacity, million litres per year */
  capacityMl: number;
  /** Number of ethanol plants / mills operated */
  plants: number;
  feedstock: string;
  note: string;
};

/**
 * Global fuel ethanol producers — corn, sugarcane, wheat, cassava and
 * cellulosic plants supplying blended gasoline, ETBE and ethanol-to-jet.
 * Capacities are indicative annual output in million litres per year.
 */
const PRODUCERS: Producer[] = [
  // ---------- United States (corn belt) ----------
  { name: "POET", country: "United States", flag: "🇺🇸", capacityMl: 12100, plants: 34, feedstock: "Corn", note: "World's largest corn ethanol producer, biorefineries across the Midwest" },
  { name: "Valero Renewable Fuels", country: "United States", flag: "🇺🇸", capacityMl: 6800, plants: 12, feedstock: "Corn", note: "Refiner-owned ethanol fleet with carbon-capture pipeline plans" },
  { name: "Archer Daniels Midland", country: "United States", flag: "🇺🇸", capacityMl: 6200, plants: 8, feedstock: "Corn", note: "Dry and wet mill ethanol with Decatur CCS integration" },
  { name: "Green Plains", country: "United States", flag: "🇺🇸", capacityMl: 4200, plants: 10, feedstock: "Corn", note: "Low-carbon ethanol and high-protein co-products" },
  { name: "Flint Hills Resources", country: "United States", flag: "🇺🇸", capacityMl: 3400, plants: 7, feedstock: "Corn", note: "Koch-owned ethanol platform in Iowa and Nebraska" },
  { name: "Marquis Energy", country: "United States", flag: "🇺🇸", capacityMl: 1900, plants: 2, feedstock: "Corn", note: "Illinois mega-plant with carbon sequestration project" },
  { name: "Southwest Iowa Renewable Energy", country: "United States", flag: "🇺🇸", capacityMl: 550, plants: 1, feedstock: "Corn", note: "Council Bluffs plant serving western corn belt" },
  { name: "Pacific Ethanol / Alto", country: "United States", flag: "🇺🇸", capacityMl: 1500, plants: 5, feedstock: "Corn", note: "West-coast specialty alcohol and fuel ethanol" },
  { name: "LanzaJet / LanzaTech", country: "United States", flag: "🇺🇸", capacityMl: 400, plants: 3, feedstock: "Waste gas", note: "Gas-fermentation ethanol and alcohol-to-jet SAF" },

  // ---------- Brazil (sugarcane) ----------
  { name: "Raízen", country: "Brazil", flag: "🇧🇷", capacityMl: 3300, plants: 35, feedstock: "Sugarcane", note: "World's biggest sugarcane ethanol group; cellulosic E2G plants" },
  { name: "Copersucar", country: "Brazil", flag: "🇧🇷", capacityMl: 2600, plants: 30, feedstock: "Sugarcane", note: "Mill cooperative and largest ethanol trader in Brazil" },
  { name: "São Martinho", country: "Brazil", flag: "🇧🇷", capacityMl: 1200, plants: 4, feedstock: "Sugarcane", note: "High-efficiency mills with corn ethanol expansion" },
  { name: "Tereos Brazil", country: "Brazil", flag: "🇧🇷", capacityMl: 1100, plants: 7, feedstock: "Sugarcane", note: "Guarani mills producing anhydrous and hydrous ethanol" },
  { name: "BP Bunge Bioenergia", country: "Brazil", flag: "🇧🇷", capacityMl: 1000, plants: 11, feedstock: "Sugarcane", note: "Joint-venture mills supplying RenovaBio CBIO credits" },
  { name: "FS Bioenergia", country: "Brazil", flag: "🇧🇷", capacityMl: 1800, plants: 3, feedstock: "Corn", note: "Mato Grosso corn ethanol pioneer with biomass power" },
  { name: "Inpasa", country: "Brazil", flag: "🇧🇷", capacityMl: 2400, plants: 6, feedstock: "Corn", note: "Fastest-growing corn ethanol producer in the centre-west" },
  { name: "Jalles Machado", country: "Brazil", flag: "🇧🇷", capacityMl: 450, plants: 2, feedstock: "Sugarcane", note: "Organic sugar and ethanol producer in Goiás" },

  // ---------- Asia ----------
  { name: "COFCO Biochemical", country: "China", flag: "🇨🇳", capacityMl: 2000, plants: 6, feedstock: "Corn", note: "China's largest fuel ethanol producer for E10 provinces" },
  { name: "Anhui BBCA", country: "China", flag: "🇨🇳", capacityMl: 900, plants: 4, feedstock: "Corn", note: "Corn processing group with fuel ethanol and bioplastics" },
  { name: "Henan Tianguan", country: "China", flag: "🇨🇳", capacityMl: 600, plants: 3, feedstock: "Wheat / cassava", note: "Cellulosic ethanol pilot alongside grain-based output" },
  { name: "Praj-supplied Indian distilleries", country: "India", flag: "🇮🇳", capacityMl: 3200, plants: 120, feedstock: "Sugarcane / grain", note: "Distillery fleet built out for the Indian E20 mandate" },
  { name: "Balrampur Chini Mills", country: "India", flag: "🇮🇳", capacityMl: 1050, plants: 10, feedstock: "Sugarcane", note: "Major Indian sugar-ethanol producer under OMC tenders" },
  { name: "Shree Renuka Sugars", country: "India", flag: "🇮🇳", capacityMl: 900, plants: 7, feedstock: "Sugarcane", note: "Wilmar-owned mills supplying ethanol blending programme" },
  { name: "Triveni Engineering", country: "India", flag: "🇮🇳", capacityMl: 660, plants: 4, feedstock: "Sugarcane", note: "Dual-feed distilleries for grain and cane juice ethanol" },
  { name: "Bajaj Hindusthan Sugar", country: "India", flag: "🇮🇳", capacityMl: 800, plants: 6, feedstock: "Sugarcane", note: "Uttar Pradesh mills feeding E20 supply" },
  { name: "Ubon Bio Ethanol", country: "Thailand", flag: "🇹🇭", capacityMl: 450, plants: 3, feedstock: "Cassava", note: "Cassava ethanol for Thai gasohol E20/E85" },
  { name: "Mitr Phol Bio Fuel", country: "Thailand", flag: "🇹🇭", capacityMl: 520, plants: 5, feedstock: "Sugarcane / cassava", note: "Integrated sugar group supplying gasohol blends" },
  { name: "Molindo Raya", country: "Indonesia", flag: "🇮🇩", capacityMl: 130, plants: 2, feedstock: "Molasses", note: "Indonesian molasses ethanol ahead of the E5 roadmap" },

  // ---------- Europe ----------
  { name: "CropEnergies", country: "Germany", flag: "🇩🇪", capacityMl: 1300, plants: 5, feedstock: "Wheat / sugar beet", note: "Europe's largest ethanol producer, part of Südzucker" },
  { name: "Verbio", country: "Germany", flag: "🇩🇪", capacityMl: 700, plants: 4, feedstock: "Grain / straw", note: "Grain ethanol plus cellulosic straw biomethane and ethanol" },
  { name: "Tereos Europe", country: "France", flag: "🇫🇷", capacityMl: 1100, plants: 6, feedstock: "Sugar beet / wheat", note: "French beet and wheat ethanol for E10 and ETBE" },
  { name: "Cristal Union / Cristanol", country: "France", flag: "🇫🇷", capacityMl: 700, plants: 3, feedstock: "Sugar beet", note: "Beet ethanol cooperative supplying E85 and ETBE" },
  { name: "Vivergo Fuels", country: "United Kingdom", flag: "🇬🇧", capacityMl: 550, plants: 1, feedstock: "Wheat", note: "Hull plant supplying UK E10 gasoline" },
  { name: "Ensus (CropEnergies UK)", country: "United Kingdom", flag: "🇬🇧", capacityMl: 400, plants: 1, feedstock: "Wheat", note: "Teesside wheat ethanol with CO2 capture" },
  { name: "Alcogroup", country: "Belgium", flag: "🇧🇪", capacityMl: 600, plants: 4, feedstock: "Grain", note: "Ethanol producer and trader across the ARA hub" },
  { name: "Pannonia Bio", country: "Hungary", flag: "🇭🇺", capacityMl: 700, plants: 1, feedstock: "Corn", note: "Europe's largest single-site corn ethanol biorefinery" },
  { name: "Lantmännen Agroetanol", country: "Sweden", flag: "🇸🇪", capacityMl: 250, plants: 1, feedstock: "Grain / residues", note: "Norrköping plant producing low-carbon ethanol for ED95" },
  { name: "Orlen Południe", country: "Poland", flag: "🇵🇱", capacityMl: 320, plants: 3, feedstock: "Grain", note: "Polish ethanol and cellulosic UCO-adjacent biorefining" },

  // ---------- Other regions ----------
  { name: "Manildra Group", country: "Australia", flag: "🇦🇺", capacityMl: 300, plants: 2, feedstock: "Wheat starch", note: "Shoalhaven plant supplying Australian E10" },
  { name: "Wilmar Sarina", country: "Australia", flag: "🇦🇺", capacityMl: 60, plants: 1, feedstock: "Molasses", note: "Queensland molasses ethanol distillery" },
  { name: "Suncor Ethanol", country: "Canada", flag: "🇨🇦", capacityMl: 400, plants: 1, feedstock: "Corn", note: "Sarnia plant supplying Canadian Clean Fuel Regulations blending" },
  { name: "GreenField Global", country: "Canada", flag: "🇨🇦", capacityMl: 700, plants: 5, feedstock: "Corn", note: "Canada's largest ethanol producer across Ontario and Quebec" },
  { name: "Ethanol Argentina (ACABIO/Bio4)", country: "Argentina", flag: "🇦🇷", capacityMl: 600, plants: 5, feedstock: "Corn", note: "Córdoba corn ethanol cooperatives supplying E12" },
  { name: "Ledesma", country: "Argentina", flag: "🇦🇷", capacityMl: 180, plants: 1, feedstock: "Sugarcane", note: "Northern Argentine cane ethanol producer" },
  { name: "Kenya / Agro-Chemical & Food Co.", country: "Kenya", flag: "🇰🇪", capacityMl: 60, plants: 1, feedstock: "Molasses", note: "East African molasses ethanol for blended gasoline" },
];

type Metric = "capacity" | "plants" | "price";

const METRICS: Record<
  Metric,
  { label: string; unit: string; help: string; decimals: number; value: (p: Producer) => number }
> = {
  capacity: {
    label: "Ethanol output (Ml/yr)",
    unit: "million litres of fuel ethanol / year",
    help: "Indicative annual fuel ethanol production capacity in million litres. Bigger tiles mean more ethanol reaching blended gasoline, ETBE and alcohol-to-jet routes.",
    decimals: 0,
    value: (p) => p.capacityMl,
  },
  plants: {
    label: "Plants / distilleries",
    unit: "ethanol plants or distilleries operated",
    help: "Number of ethanol plants, mills or distilleries the producer operates. A single mega-plant can outrank a wide fleet on volume but not here.",
    decimals: 0,
    value: (p) => p.plants,
  },
  price: {
    label: "Share price (listing currency)",
    unit: "share price, primary listing currency",
    help: "Latest traded share price on the producer's primary listing, in that exchange's currency. Cooperatives and private producers have no listing and sit at the end.",
    decimals: 2,
    value: () => 0,
  },
};

function scatterAxes(metricKey: Metric) {
  if (metricKey === "capacity") {
    return {
      x: { metric: METRICS.plants, help: "X-axis shows plant count; Y-axis shows annual ethanol output." },
      size: { label: "Ethanol output", unit: "Ml/yr", value: (p: Producer) => p.capacityMl },
    };
  }
  return {
    x: { metric: METRICS.capacity, help: "X-axis shows annual ethanol output; Y-axis shows the selected measure." },
    size: { label: "Plants", unit: "plants", value: (p: Producer) => p.plants },
  };
}

const TITLE = "Global ethanol production";
const NEWS_SUFFIX = "ethanol production biofuel";

export function EthanolProductionPanel() {
  const [metricKey, setMetricKey] = useState<Metric>("capacity");
  const [view, setView] = useState<PanelView>("heat");
  const detail = useEntityDetail();
  const { get } = useEntityQuotes();
  const metric = METRICS[metricKey];
  const valueOf = (p: Producer) =>
    metricKey === "price" ? (get(ETHANOL_TICKERS[p.name])?.price ?? 0) : metric.value(p);

  const f = useChartFilter(PRODUCERS, {
    text: (p) => `${p.name} ${p.country} ${p.feedstock} ${p.note}`,
    facetA: (p) => p.country,
    facetB: (p) => p.feedstock,
  });
  const ranked = f.filtered.slice().sort((a, b) => valueOf(b) - valueOf(a));
  const isFiltered = Boolean(f.a || f.b || f.query.trim());
  const rows = ranked.slice(0, isFiltered ? 20 : 10);

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
    meta: priceMeta(get(ETHANOL_TICKERS[p.name])),
    changePct: get(ETHANOL_TICKERS[p.name])?.changePct,
    newsTarget: { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` },
  }));

  const items = rows.map((p) => ({
    key: p.name,
    label: p.name,
    sub: `${p.feedstock} · ${p.note}`,
    value: valueOf(p),
    logo: entityLogoByName(p.name),
    meta: priceMeta(get(ETHANOL_TICKERS[p.name])),
    tone: priceTone(get(ETHANOL_TICKERS[p.name])),
    changePct: get(ETHANOL_TICKERS[p.name])?.changePct,
  }));
  const newsMap = Object.fromEntries(
    rows.map((p) => [p.name, { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` }]),
  );
  const onSelect = detail.onSelect((target) => {
    const p = rows.find((r) => r.name === target?.name);
    if (!p) return null;
    const q = get(ETHANOL_TICKERS[p.name]);
    return {
      name: p.name,
      sub: `${p.flag} ${p.country}`,
      logo: entityLogoByName(p.name),
      note: p.note,
      stats: [
        { label: "Ethanol output", value: `${fmt(p.capacityMl, 0)} Ml/yr` },
        { label: "Plants", value: fmt(p.plants, 0) },
        { label: "Feedstock", value: p.feedstock },
        { label: "Ticker", value: ETHANOL_TICKERS[p.name] ?? "Not listed" },
        { label: "Share price", value: q ? fmt(q.price, 2) : "—" },
        {
          label: "1-day change",
          value: q ? `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%` : "—",
          tone: detailTone(q?.changePct),
        },
      ],
      news: { name: p.name, query: `"${p.name}" ${NEWS_SUFFIX}` },
    };
  });

  return (
    <>
      {detail.sheet}
      <ChartPanel
        icon={Wheat}
        title={TITLE}
        blurb="Corn, sugarcane, wheat, cassava and cellulosic ethanol producers supplying blended gasoline, ETBE and alcohol-to-jet SAF."
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
              filename: "global-ethanol-production",
              note: `Measure shown: ${metric.label}`,
              header: [
                "Producer",
                "Country",
                "Feedstock",
                "Ethanol output (Ml/yr)",
                "Plants",
                "Ticker",
                "Share price",
                "1-day change %",
                "Note",
              ],
              rows: ranked.map((p) => {
                const q = get(ETHANOL_TICKERS[p.name]);
                return [
                  p.name,
                  p.country,
                  p.feedstock,
                  p.capacityMl,
                  p.plants,
                  ETHANOL_TICKERS[p.name] ?? "",
                  q ? q.price.toFixed(2) : "",
                  q ? q.changePct.toFixed(2) : "",
                  p.note,
                ];
              }),
            })}
          />
        }
        filters={
          <ChartFilterBar
            query={f.query}
            onQueryChange={f.setQuery}
            placeholder="Search ethanol producers…"
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
        footnote="Indicative ethanol capacities from producer reports, RFA/ePURE/UNICA statistics and national blending-programme filings. Click any tile for the latest news."
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
                price: get(ETHANOL_TICKERS[p.name])?.price,
                changePct: get(ETHANOL_TICKERS[p.name])?.changePct,
              })),
            })}
          />
        }
      >
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No ethanol producers listed for this filter — open that country's profile page for its
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
            indexLabel="Global ethanol production index"
          />
        ) : view === "bars" ? (
          <ChartBars
            items={items}
            unitLabel={metric.unit}
            yLabel="Ethanol producer"
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
            indexLabel="Global ethanol production index"
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
