import { Building2, FileCheck2, Milestone } from "lucide-react";

export function CountryTrackingStrip({
  mandates,
  targets,
  sources,
}: {
  mandates: number;
  targets: number;
  sources: number;
}) {
  const metrics = [
    {
      label: "Tracked mandates",
      value: mandates,
      detail: mandates === 1 ? "Active obligation" : "Active obligations",
      icon: FileCheck2,
      tone: "text-tracker-red bg-tracker-red/10",
      bar: "bg-tracker-red",
    },
    {
      label: "Policy targets",
      value: targets,
      detail: "Published markers",
      icon: Milestone,
      tone: "text-tracker-blue bg-tracker-blue/10",
      bar: "bg-tracker-blue",
    },
    {
      label: "Official sources",
      value: sources,
      detail: "Government records",
      icon: Building2,
      tone: "text-tracker-green bg-tracker-green/10",
      bar: "bg-tracker-green",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-3" aria-label="Country tracking summary">
      {metrics.map(({ label, value, detail, icon: Icon, tone, bar }) => (
        <div key={label} className="relative overflow-hidden rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="label-mono text-[0.65rem] font-bold text-muted-foreground">{label}</p>
              <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-foreground">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
            </div>
            <span className={`grid size-9 place-items-center rounded-md ${tone}`}>
              <Icon className="size-4" />
            </span>
          </div>
          <span className={`absolute inset-x-0 bottom-0 h-1 ${bar}`} aria-hidden />
        </div>
      ))}
    </section>
  );
}