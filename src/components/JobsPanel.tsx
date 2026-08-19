import { useMemo, useState } from "react";
import { Briefcase, ExternalLink, Search } from "lucide-react";
import {
  CATEGORY_QUERY,
  FUEL_JOB_QUERY,
  JOB_BOARDS,
  JOB_CATEGORIES,
  type JobCategory,
} from "@/lib/jobs";
import { FUEL_ACCENT, FUEL_TYPES, type FuelType } from "@/lib/policy-taxonomy";

export function JobsPanel({ compact = false }: { compact?: boolean }) {
  const [fuel, setFuel] = useState<FuelType | null>(null);
  const [category, setCategory] = useState<JobCategory | null>(null);

  const query = useMemo(() => {
    const parts = [
      fuel ? FUEL_JOB_QUERY[fuel] : "biofuel bioenergy",
      category ? CATEGORY_QUERY[category] : "",
    ].filter(Boolean);
    return parts.join(" ");
  }, [fuel, category]);

  return (
    <div className="space-y-4">
      <div className="glass-panel overflow-hidden">
        <div className="panel-head">
          <h3 className="label-mono flex items-center gap-2 text-muted-foreground">
            <Briefcase className="size-3.5" /> Refine your search
          </h3>
          <button
            type="button"
            onClick={() => {
              setFuel(null);
              setCategory(null);
            }}
            disabled={!fuel && !category}
            className="label-mono text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            Reset
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <div className="mb-2 flex items-baseline gap-2">
              <span className="font-display text-sm font-bold tracking-tight text-foreground">
                Fuel
              </span>
              <span className="label-mono text-muted-foreground/70">
                {fuel ?? "All fuels"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {FUEL_TYPES.map((f) => {
                const active = fuel === f;
                const tint = FUEL_ACCENT[f];
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFuel(active ? null : f)}
                    aria-pressed={active}
                    className="flex items-center gap-2 border px-3.5 py-2 text-sm font-semibold transition-colors"
                    style={
                      active
                        ? {
                            backgroundColor: tint,
                            borderColor: tint,
                            color: "var(--primary-foreground)",
                          }
                        : {
                            backgroundColor: "var(--surface-1)",
                            borderColor: "var(--border)",
                            color: "var(--foreground)",
                          }
                    }
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: active ? "var(--primary-foreground)" : tint,
                      }}
                    />
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-baseline gap-2">
              <span className="font-display text-sm font-bold tracking-tight text-foreground">
                Function
              </span>
              <span className="label-mono text-muted-foreground/70">
                {category ?? "All functions"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {JOB_CATEGORIES.map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(active ? null : c)}
                    aria-pressed={active}
                    className={`border px-3.5 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface-1 text-foreground hover:border-primary/40"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <div className="panel-head">
          <h3 className="label-mono flex items-center gap-2 text-muted-foreground">
            <Search className="size-3.5" /> Open searches
          </h3>
          <span className="label-mono text-accent">{query}</span>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {JOB_BOARDS.map((b) => (
            <a
              key={b.name}
              href={b.url(query)}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-lg border border-border bg-surface-1 p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-bold text-foreground">{b.name}</span>
                <ExternalLink className="size-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{b.note}</p>
            </a>
          ))}
        </div>
      </div>

      {compact && (
        <p className="label-mono flex items-center gap-2 text-muted-foreground">
          <Briefcase className="size-3.5" /> Openings are listed on employer and job-board sites;
          verify details before applying.
        </p>
      )}
    </div>
  );
}
