import { useState } from "react";
import { Fuel, Recycle, Building2, Plane, Truck, Ship, Container, Wheat, Zap, Flame, Layers, Trees, ChevronDown } from "lucide-react";
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
 * Previous stacked layout, made dynamic: every dataset is its own panel in one
 * vertical stack, each independently expandable. The first panel opens by
 * default; several can stay open at once.
 */
export function SupplyProducersSection() {
  const [open, setOpen] = useState<PanelId[]>(["stations"]);

  const toggle = (id: PanelId) =>
    setOpen((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const allOpen = open.length === CARDS.length;

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(allOpen ? [] : CARDS.map((c) => c.id))}
          className="label-mono inline-flex items-center gap-1.5 border border-border bg-white px-3 py-1.5 font-bold text-foreground transition-colors hover:bg-muted"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {CARDS.map((c) => {
        const isOpen = open.includes(c.id);
        return (
          <section
            key={c.id}
            className="glass-panel flex w-full min-w-0 flex-col overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggle(c.id)}
              aria-expanded={isOpen}
              className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-l-4 px-4 py-3 text-left transition-colors hover:bg-muted/50 sm:px-5"
              style={{ borderLeftColor: c.tone }}
            >
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
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="truncate font-display text-base font-extrabold tracking-tight text-foreground sm:text-lg">
                    {c.title}
                  </span>
                  <span className="label-mono text-muted-foreground">
                    {c.stat} {c.statLabel}
                  </span>
                </span>
                <span className="mt-0.5 line-clamp-2 block text-xs/relaxed text-muted-foreground sm:text-sm/relaxed">
                  {c.blurb}
                </span>
              </span>
              <ChevronDown
                className="size-4 shrink-0 transition-transform"
                style={{
                  color: c.tone,
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>

            {isOpen ? (
              <div className="min-w-0 border-t border-border p-4 sm:p-5">
                <PanelBody id={c.id} />
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
