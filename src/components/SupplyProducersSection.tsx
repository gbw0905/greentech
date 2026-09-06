import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Fuel, Recycle, Building2, Plane, Truck, Ship, Container, Wheat, Zap, Flame, Layers, Trees, ChevronRight } from "lucide-react";
import imgStations from "@/assets/supply-stations.jpg";
import imgUco from "@/assets/supply-uco.jpg";
import imgEthanol from "@/assets/supply-ethanol.jpg";
import imgBiopower from "@/assets/supply-biopower.jpg";
import imgRng from "@/assets/supply-rng.jpg";
import imgBiochar from "@/assets/supply-biochar.jpg";
import imgPellets from "@/assets/supply-pellets.jpg";
import imgTerminals from "@/assets/supply-terminals.jpg";
import imgMarine from "@/assets/supply-marine.jpg";
import imgOil from "@/assets/supply-oil.jpg";
import imgSaf from "@/assets/supply-saf.jpg";
import imgCarriers from "@/assets/supply-carriers.jpg";
import { BiofuelProductionPanel } from "@/components/BiofuelProductionPanel";
import { UcoSuppliersPanel } from "@/components/UcoSuppliersPanel";
import { MarineBiofuelPanel } from "@/components/MarineBiofuelPanel";
import { OilStocksPanel } from "@/components/OilStocksPanel";
import { SafAirlinesPanel } from "@/components/SafAirlinesPanel";
import { CarriersPanel } from "@/components/CarriersPanel";
import { BlendingTerminalsPanel } from "@/components/BlendingTerminalsPanel";
import { EthanolProductionPanel } from "@/components/EthanolProductionPanel";
import { BioPowerGeneratorsPanel } from "@/components/BioPowerGeneratorsPanel";
import { RngProducersPanel } from "@/components/RngProducersPanel";
import { BiocharProducersPanel } from "@/components/BiocharProducersPanel";
import { WoodPelletProducersPanel } from "@/components/WoodPelletProducersPanel";

export type PanelId =
  | "stations"
  | "uco"
  | "ethanol"
  | "rng"
  | "biochar"
  | "pellets"
  | "terminals"
  | "marine"
  | "oil"
  | "saf"
  | "carriers"
  | "biopower";

export const SUPPLY_PANELS: {
  id: PanelId;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  blurb: string;
  stat: string;
  statLabel: string;
  tone: string;
  image: string;
}[] = [
  {
    id: "stations",
    icon: Fuel,
    title: "Fuel station networks",
    blurb: "Retail networks selling ethanol, biodiesel, renewable diesel and renewable gas.",
    stat: "100+",
    statLabel: "networks tracked",
    tone: "var(--chart-6)",
    image: imgStations,
  },
  {
    id: "uco",
    icon: Recycle,
    title: "UCO suppliers",
    blurb: "Used cooking oil collectors and traders feeding HVO and SAF refineries.",
    stat: "65",
    statLabel: "collectors & traders",
    tone: "var(--chart-3)",
    image: imgUco,
  },
  {
    id: "ethanol",
    icon: Wheat,
    title: "Ethanol production",
    blurb: "Corn, cane, wheat and cellulosic ethanol producers supplying blended gasoline and ATJ.",
    stat: "69",
    statLabel: "producers tracked",
    tone: "var(--chart-1)",
    image: imgEthanol,
  },
  {
    id: "biopower",
    icon: Zap,
    title: "Biofuel power generators",
    blurb: "Electricity generators burning biomass, bagasse, biogas and waste-derived fuels.",
    stat: "74",
    statLabel: "generators tracked",
    tone: "var(--chart-9)",
    image: imgBiopower,
  },
  {
    id: "rng",
    icon: Flame,
    title: "RNG producers",
    blurb: "Renewable natural gas from landfills, dairy digesters, wastewater and food waste.",
    stat: "59",
    statLabel: "producers tracked",
    tone: "var(--chart-5)",
    image: imgRng,
  },
  {
    id: "biochar",
    icon: Layers,
    title: "Biochar producers",
    blurb: "Pyrolysis operators making durable carbon for soils, industry and removal credits.",
    stat: "44",
    statLabel: "producers tracked",
    tone: "var(--chart-3)",
    image: imgBiochar,
  },
  {
    id: "pellets",
    icon: Trees,
    title: "Wood pellet producers",
    blurb: "Industrial and heating pellet mills feeding power stations and district heating.",
    stat: "60",
    statLabel: "producers tracked",
    tone: "var(--chart-6)",
    image: imgPellets,
  },
  {
    id: "terminals",
    icon: Container,
    title: "Blending terminals & capacity",
    blurb: "Tank farms and loading racks blending ethanol, biodiesel, HVO and SAF into finished fuel.",
    stat: "70+",
    statLabel: "terminal operators",
    tone: "var(--chart-8)",
    image: imgTerminals,
  },
  {
    id: "marine",
    icon: Ship,
    title: "Marine biofuels",
    blurb: "Bunker suppliers of B24/B30 blends and the shipping lines burning them.",
    stat: "68",
    statLabel: "suppliers & users",
    tone: "var(--chart-5)",
    image: imgMarine,
  },
  {
    id: "oil",
    icon: Building2,
    title: "Oil companies",
    blurb: "Global majors with live share prices and annual production capacity.",
    stat: "20",
    statLabel: "listed majors",
    tone: "var(--chart-2)",
    image: imgOil,
  },
  {
    id: "saf",
    icon: Plane,
    title: "SAF airlines",
    blurb: "Carriers with the largest sustainable aviation fuel uplift worldwide.",
    stat: "52",
    statLabel: "airlines ranked",
    tone: "var(--chart-4)",
    image: imgSaf,
  },
  {
    id: "carriers",
    icon: Truck,
    title: "Freight carriers",
    blurb: "Shipping, trucking and rail operators running on biofuel blends.",
    stat: "76",
    statLabel: "carriers across 3 modes",
    tone: "var(--chart-7)",
    image: imgCarriers,
  },
];

export function SupplyPanelBody({ id }: { id: PanelId }) {
  if (id === "stations") return <BiofuelProductionPanel fuels={[]} />;
  if (id === "uco") return <UcoSuppliersPanel />;
  if (id === "ethanol") return <EthanolProductionPanel />;
  if (id === "rng") return <RngProducersPanel />;
  if (id === "biochar") return <BiocharProducersPanel />;
  if (id === "pellets") return <WoodPelletProducersPanel />;
  if (id === "biopower") return <BioPowerGeneratorsPanel />;
  if (id === "terminals") return <BlendingTerminalsPanel />;
  if (id === "marine") return <MarineBiofuelPanel />;
  if (id === "oil") return <OilStocksPanel />;
  if (id === "saf") return <SafAirlinesPanel />;
  return <CarriersPanel />;
}

/**
 * Overview grid: each card links to a dedicated page for that dataset so
 * visitors can focus on (and share) a single supply dataset at a time.
 */
export function SupplyProducersSection({ isRefreshing = false }: { isRefreshing?: boolean }) {
  const [shimmer, setShimmer] = useState(false);

  useEffect(() => {
    if (!isRefreshing) return;
    setShimmer(true);
    const t = setTimeout(() => setShimmer(false), 1200);
    return () => clearTimeout(t);
  }, [isRefreshing]);

  return (
    <div
      className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      style={{ perspective: "900px" }}
    >
      {SUPPLY_PANELS.map((c, i) => (
        <Link
          key={c.id}
          to="/supply/$panel"
          params={{ panel: c.id }}
          className="glass-panel flip-in flip-tilt group relative flex min-w-0 flex-col gap-2 overflow-hidden p-4 text-left"
          style={{ animationDelay: `${i * 55}ms` }}
        >
          <span
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: c.tone }}
          />
          <span className="relative -mx-4 -mt-4 block h-28 overflow-hidden">
            <img
              src={c.image}
              alt={`${c.title} illustration`}
              loading="lazy"
              width={768}
              height={512}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span
              className="absolute inset-0"
              style={{ background: `linear-gradient(to top, color-mix(in oklab, ${c.tone} 25%, transparent), transparent 60%)` }}
            />
          </span>
          <span className="flex items-center gap-2.5">
            <span
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md"
              style={{
                background: `color-mix(in oklab, ${c.tone} 14%, white)`,
                color: c.tone,
              }}
            >
              <c.icon className="size-4.5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-base font-extrabold tracking-tight text-foreground">
                {c.title}
              </span>
              <span className="label-mono text-muted-foreground">
                {c.stat} {c.statLabel}
              </span>
            </span>
          </span>
          <span className="line-clamp-2 text-xs/relaxed text-muted-foreground sm:text-sm/relaxed">
            {c.blurb}
          </span>
          <span
            className="label-mono mt-auto inline-flex items-center gap-1 font-bold"
            style={{ color: c.tone }}
          >
            Open dataset <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}
