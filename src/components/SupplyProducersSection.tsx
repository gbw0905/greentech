import { useState } from "react";
import { Fuel, Recycle, Building2, Plane, Truck, ChevronRight } from "lucide-react";
import { BiofuelProductionPanel } from "@/components/BiofuelProductionPanel";
import { UcoSuppliersPanel } from "@/components/UcoSuppliersPanel";
import { OilStocksPanel } from "@/components/OilStocksPanel";
import { SafAirlinesPanel } from "@/components/SafAirlinesPanel";
import { CarriersPanel } from "@/components/CarriersPanel";

type PanelId = "stations" | "uco" | "oil" | "saf" | "carriers";

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
  if (id === "oil") return <OilStocksPanel />;
  if (id === "saf") return <SafAirlinesPanel />;
  return <CarriersPanel />;
}

export function SupplyProducersSection() {
  const [active, setActive] = useState<PanelId | null>(null);

  if (active) {
    return (
      <div className="space-y-4">
        <div
          role="tablist"
          aria-label="Supply and producer datasets"
          className="flex items-stretch gap-2 overflow-x-auto pb-1"
        >
          <button
            type="button"
            onClick={() => setActive(null)}
            className="label-mono shrink-0 border border-border bg-white px-3 py-2 font-bold text-foreground transition-colors hover:bg-muted"
          >
            All datasets
          </button>
          {CARDS.map((c) => {
            const on = c.id === active;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActive(c.id)}
                className="label-mono inline-flex shrink-0 items-center gap-2 border px-3 py-2 font-bold whitespace-nowrap transition-colors"
                style={
                  on
                    ? { background: c.tone, borderColor: c.tone, color: "white" }
                    : { borderColor: "var(--border)", background: "white", color: "var(--foreground)" }
                }
              >
                <c.icon className="size-3.5" />
                {c.title}
              </button>
            );
          })}
        </div>
        <PanelBody id={active} />
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
