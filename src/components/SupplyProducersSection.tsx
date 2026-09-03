import { useState } from "react";
import { Fuel, Recycle, Building2, Plane, Truck, Ship, Container, Wheat, Zap, Flame, Layers, Trees, ArrowLeft, ChevronRight } from "lucide-react";
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

type PanelId =
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

const CARDS: {
  id: PanelId;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  blurb: string;
  stat: string;
  statLabel: string;
  tone: string;
}[] = [
  {
    id: "stations",
    icon: Fuel,
    title: "Fuel station networks",
    blurb: "Retail networks selling ethanol, biodiesel, renewable diesel and renewable gas.",
    stat: "95+",
    statLabel: "networks tracked",
    tone: "var(--chart-6)",
  },
  {
    id: "uco",
    icon: Recycle,
    title: "UCO suppliers",
    blurb: "Used cooking oil collectors and traders feeding HVO and SAF refineries.",
    stat: "40+",
    statLabel: "collectors & traders",
    tone: "var(--chart-3)",
  },
  {
    id: "ethanol",
    icon: Wheat,
    title: "Ethanol production",
    blurb: "Corn, cane, wheat and cellulosic ethanol producers supplying blended gasoline and ATJ.",
    stat: "45+",
    statLabel: "producers tracked",
    tone: "var(--chart-1)",
  },
  {
    id: "biopower",
    icon: Zap,
    title: "Biofuel power generators",
    blurb: "Electricity generators burning biomass, bagasse, biogas and waste-derived fuels.",
    stat: "40+",
    statLabel: "generators tracked",
    tone: "var(--chart-9)",
  },
  {
    id: "rng",
    icon: Flame,
    title: "RNG producers",
    blurb: "Renewable natural gas from landfills, dairy digesters, wastewater and food waste.",
    stat: "45+",
    statLabel: "producers tracked",
    tone: "var(--chart-5)",
  },
  {
    id: "biochar",
    icon: Layers,
    title: "Biochar producers",
    blurb: "Pyrolysis operators making durable carbon for soils, industry and removal credits.",
    stat: "30+",
    statLabel: "producers tracked",
    tone: "var(--chart-3)",
  },
  {
    id: "pellets",
    icon: Trees,
    title: "Wood pellet producers",
    blurb: "Industrial and heating pellet mills feeding power stations and district heating.",
    stat: "40+",
    statLabel: "producers tracked",
    tone: "var(--chart-6)",
  },
  {
    id: "terminals",
    icon: Container,
    title: "Blending terminals & capacity",
    blurb: "Tank farms and loading racks blending ethanol, biodiesel, HVO and SAF into finished fuel.",
    stat: "45+",
    statLabel: "terminal operators",
    tone: "var(--chart-8)",
  },
  {
    id: "marine",
    icon: Ship,
    title: "Marine biofuels",
    blurb: "Bunker suppliers of B24/B30 blends and the shipping lines burning them.",
    stat: "50",
    statLabel: "suppliers & users",
    tone: "var(--chart-5)",
  },
  {
    id: "oil",
    icon: Building2,
    title: "Oil companies",
    blurb: "Global majors with live share prices and annual production capacity.",
    stat: "20",
    statLabel: "listed majors",
    tone: "var(--chart-2)",
  },
  {
    id: "saf",
    icon: Plane,
    title: "SAF airlines",
    blurb: "Carriers with the largest sustainable aviation fuel uplift worldwide.",
    stat: "20",
    statLabel: "airlines ranked",
    tone: "var(--chart-4)",
  },
  {
    id: "carriers",
    icon: Truck,
    title: "Freight carriers",
    blurb: "Shipping, trucking and rail operators running on biofuel blends.",
    stat: "3",
    statLabel: "transport modes",
    tone: "var(--chart-7)",
  },
];

function PanelBody({ id }: { id: PanelId }) {
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
 * Cascade layout: an overview card grid, and selecting a dataset cascades the
 * section into a full-width workspace showing just that panel. Switch datasets
 * via the tab bar (desktop) or the select (mobile), or return to the overview.
 */
export function SupplyProducersSection() {
  const [active, setActive] = useState<PanelId | null>(null);
  const activeCard = active ? CARDS.find((c) => c.id === active)! : null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {/* Mobile dataset selector (visible when a dataset is open) */}
      {activeCard ? (
        <div className="flex items-center gap-2 sm:hidden">
          <button
            type="button"
            onClick={() => setActive(null)}
            className="label-mono inline-flex shrink-0 items-center gap-1 border border-border bg-white px-2.5 py-2 font-bold text-foreground"
          >
            <ArrowLeft className="size-3.5" /> All
          </button>
          <select
            value={activeCard.id}
            onChange={(e) => setActive(e.target.value as PanelId)}
            className="label-mono min-w-0 flex-1 border border-border bg-white px-2.5 py-2 font-bold text-foreground"
          >
            {CARDS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {/* Overview card grid */}
      {!activeCard ? (
        <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActive(c.id)}
              className="glass-panel group relative flex min-w-0 flex-col gap-2 overflow-hidden p-4 text-left transition-shadow hover:shadow-lg"
            >
              <span
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: c.tone }}
              />
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
                Explore dataset <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          ))}
        </div>
      ) : (
        /* Cascaded workspace for the selected dataset */
        <div className="flex w-full min-w-0 flex-col gap-3">
          <div className="glass-panel hidden flex-wrap items-center gap-1 overflow-x-auto p-1.5 sm:flex">
            <button
              type="button"
              onClick={() => setActive(null)}
              className="label-mono inline-flex shrink-0 items-center gap-1.5 px-3 py-2 font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" /> All datasets
            </button>
            {CARDS.map((c) => {
              const isActive = c.id === activeCard.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActive(c.id)}
                  className="label-mono relative shrink-0 px-3 py-2 font-bold transition-colors"
                  style={{ color: isActive ? c.tone : "var(--muted-foreground)" }}
                >
                  {c.title}
                  <span
                    className="absolute inset-x-2 bottom-0 h-0.5 transition-opacity"
                    style={{ background: c.tone, opacity: isActive ? 1 : 0 }}
                  />
                </button>
              );
            })}
          </div>

          <section className="glass-panel flex w-full min-w-0 flex-col overflow-hidden">
            <header
              className="flex items-center gap-3 border-l-4 px-4 py-3 sm:px-5"
              style={{ borderLeftColor: activeCard.tone }}
            >
              <span
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-md"
                style={{
                  background: `color-mix(in oklab, ${activeCard.tone} 14%, white)`,
                  color: activeCard.tone,
                }}
              >
                <activeCard.icon className="size-4.5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-lg font-extrabold tracking-tight text-foreground">
                  {activeCard.title}
                </span>
                <span className="label-mono text-muted-foreground">
                  {activeCard.stat} {activeCard.statLabel}
                </span>
              </span>
            </header>
            <div className="min-w-0 border-t border-border p-4 sm:p-5">
              <PanelBody id={activeCard.id} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
