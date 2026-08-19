import { useState } from "react";
import { Ship, Truck, TrainFront } from "lucide-react";
import { ChartBars, ChartPanel, chartFmt as fmt } from "@/components/chart-kit";
import { openEntityNews } from "@/lib/open-news";
import { CARRIER_TICKERS } from "@/lib/entity-tickers";
import { priceMeta, priceTone, useEntityQuotes } from "@/lib/use-entity-quotes";

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
];

type Metric = "volume" | "share" | "price";

const METRICS: Record<Metric, { label: string; unit: string; decimals: number; value: (c: Carrier) => number }> = {
  volume: {
    label: "Biofuel volume used (Ml/yr)",
    unit: "million litres of biofuel used / year",
    decimals: 0,
    value: (c) => c.volumeMnL,
  },
  share: {
    label: "Biofuel share of fuel burn (%)",
    unit: "% of total fuel burn from biofuels",
    decimals: 1,
    value: (c) => c.share,
  },
  price: {
    label: "Share price (listing currency)",
    unit: "share price, primary listing currency",
    decimals: 2,
    value: () => 0,
  },
};

function CarrierChart({
  title,
  blurb,
  icon: Icon,
  data,
  yLabel,
  newsSuffix,
  footnote,
}: {
  title: string;
  blurb: string;
  icon: typeof Ship;
  data: Carrier[];
  yLabel: string;
  newsSuffix: string;
  footnote: string;
}) {
  const [metricKey, setMetricKey] = useState<Metric>("volume");
  const { get } = useEntityQuotes();
  const metric = METRICS[metricKey];
  const valueOf = (c: Carrier) =>
    metricKey === "price" ? (get(CARRIER_TICKERS[c.name])?.price ?? 0) : metric.value(c);
  const rows = data.slice().sort((a, b) => valueOf(b) - valueOf(a));

  return (
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
      footnote={footnote}
    >
      <ChartBars
        unitLabel={metric.unit}
        yLabel={yLabel}
        metaHeader="Share price"
        format={(n) => fmt(n, metric.decimals)}
        items={rows.map((c) => ({
          key: c.name,
          label: c.name,
          sub: c.note,
          value: valueOf(c),
          meta: priceMeta(get(CARRIER_TICKERS[c.name])),
          tone: priceTone(get(CARRIER_TICKERS[c.name])),
        }))}
        onSelect={openEntityNews}
        news={Object.fromEntries(
          rows.map((c) => [c.name, { name: c.name, query: `"${c.name}" ${newsSuffix}` }]),
        )}
      />
    </ChartPanel>
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
        newsSuffix="biofuel OR bio-bunker OR green methanol shipping"
        footnote="Indicative annual bio-bunker volumes from carrier sustainability reports, FuelEU Maritime filings and bunkering disclosures. Click any bar for the latest news."
      />
      <CarrierChart
        icon={Truck}
        title="Top global trucking carriers using biofuel"
        blurb="Road freight and logistics fleets running renewable diesel, HVO100, biodiesel blends and renewable natural gas."
        data={TRUCKING}
        yLabel="Trucking carrier"
        newsSuffix="renewable diesel OR HVO OR renewable natural gas fleet"
        footnote="Indicative annual renewable fuel volumes from fleet sustainability reports and low-carbon fuel programme filings. Click any bar for the latest news."
      />
      <CarrierChart
        icon={TrainFront}
        title="Top global rail carriers using biofuel"
        blurb="Freight and passenger railroads blending renewable diesel, HVO100 and biodiesel in diesel locomotive fleets."
        data={RAIL}
        yLabel="Rail carrier"
        newsSuffix="renewable diesel OR biodiesel locomotive rail"
        footnote="Indicative annual biofuel volumes from railroad sustainability disclosures and national rail decarbonisation programmes. Click any bar for the latest news."
      />
    </div>
  );
}
