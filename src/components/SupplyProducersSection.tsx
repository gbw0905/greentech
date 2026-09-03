import { useState } from "react";
import { Fuel, Recycle, Building2, Plane, Truck, Ship, Container, Wheat, Zap, Flame, Layers, Trees, ChevronRight } from "lucide-react";
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

export function SupplyProducersSection() {
  const [active, setActive] = useState<PanelId | null>(null);

  if (active) {
    const current = CARDS.find((c) => c.id === active)!;
    return (
      <div className="glass-panel flex w-full min-w-0 flex-col">
        {/* Workspace header: dataset identity + back control */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md"
              style={{
                background: `color-mix(in oklab, ${current.tone} 14%, white)`,
                color: current.tone,
              }}
            >
              <current.icon className="size-4.5" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-display text-base font-extrabold tracking-tight text-foreground sm:text-lg">
                {current.title}
              </h3>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                {current.blurb}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActive(null)}
            className="label-mono inline-flex shrink-0 items-center gap-1.5 border border-border bg-white px-3 py-1.5 font-bold text-foreground transition-colors hover:bg-muted"
          >
            <Layers className="size-3.5" />
            All datasets
          </button>
        </div>

        {/* Mobile: a dataset picker, so every dataset is reachable without
            discovering a horizontal scroller. */}
        <div className="border-b border-border px-4 py-2 sm:hidden">
          <select
            aria-label="Choose dataset"
            value={active}
            onChange={(e) => setActive(e.target.value as PanelId)}
            className="chart-select w-full min-w-0"
          >
            {CARDS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop: underline tab strip */}
        <div
          role="tablist"
          aria-label="Supply and producer datasets"
          className="hidden items-stretch gap-1 overflow-x-auto border-b border-border px-3 sm:flex"
        >
          {CARDS.map((c) => {
            const on = c.id === active;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActive(c.id)}
                className="label-mono inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 font-bold whitespace-nowrap transition-colors"
                style={
                  on
                    ? { borderBottomColor: c.tone, color: c.tone }
                    : {
                        borderBottomColor: "transparent",
                        color: "var(--muted-foreground)",
                      }
                }
              >
                <c.icon className="size-3.5" />
                {c.title}
              </button>
            );
          })}
        </div>

        <div className="min-w-0 p-4 sm:p-5">
          <PanelBody id={active} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {CARDS.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => setActive(c.id)}
          className="group flex flex-col items-start rounded-lg border border-border border-t-4 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          style={{ borderTopColor: c.tone }}
        >
          <span
            className="inline-flex size-9 items-center justify-center rounded-md"
            style={{ background: `color-mix(in oklab, ${c.tone} 14%, white)`, color: c.tone }}
          >
            <c.icon className="size-4.5" />
          </span>
          <h3 className="mt-3 font-display text-lg font-extrabold tracking-tight text-foreground">
            {c.title}
          </h3>
          <p className="mt-1 text-sm/relaxed text-muted-foreground">{c.blurb}</p>
          <div className="mt-4 flex w-full items-end justify-between border-t border-border pt-3">
            <div>
              <div className="font-display text-2xl font-extrabold tabular-nums" style={{ color: c.tone }}>
                {c.stat}
              </div>
              <div className="label-mono text-muted-foreground">{c.statLabel}</div>
            </div>
            <span className="label-mono inline-flex items-center gap-1 font-bold text-foreground transition-transform group-hover:translate-x-0.5">
              Explore
              <ChevronRight className="size-3.5" />
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
