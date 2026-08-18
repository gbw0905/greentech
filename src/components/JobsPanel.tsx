import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Briefcase, Building2, ExternalLink, Newspaper, Search } from "lucide-react";
import { getHiringNewsFn } from "@/lib/jobs.functions";
import {
  CATEGORY_QUERY,
  EMPLOYERS,
  FUEL_JOB_QUERY,
  JOB_BOARDS,
  JOB_CATEGORIES,
  type JobCategory,
} from "@/lib/jobs";
import { FUEL_ACCENT, FUEL_TYPES, type FuelType } from "@/lib/policy-taxonomy";

function when(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

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

  const keywords = useMemo(
    () => [`${fuel ?? "biofuel"} jobs hiring`, `${category ?? "bioenergy"} jobs biorefinery`],
    [fuel, category],
  );

  const fetchNews = useServerFn(getHiringNewsFn);
  const { data, isFetching } = useQuery({
    queryKey: ["hiring-news", keywords],
    queryFn: () => fetchNews({ data: { keywords } }),
    staleTime: 30 * 60_000,
  });

  const employers = useMemo(
    () => (fuel ? EMPLOYERS.filter((e) => e.focus.includes(fuel)) : EMPLOYERS),
    [fuel],
  );
  const shownEmployers = compact ? employers.slice(0, 9) : employers;
  const news = (data?.items ?? []).slice(0, compact ? 4 : 10);

  return (
    <div className="space-y-4">
      <div className="glass-panel flex flex-wrap items-center gap-2 p-3">
        <span className="label-mono mr-1 text-muted-foreground">Fuel</span>
        {FUEL_TYPES.map((f) => {
          const active = fuel === f;
          const tint = FUEL_ACCENT[f];
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFuel(active ? null : f)}
              aria-pressed={active}
              className="label-mono rounded-full border px-3 py-1.5 transition-all hover:-translate-y-0.5"
              style={
                active
                  ? { backgroundColor: tint, borderColor: tint, color: "var(--primary-foreground)" }
                  : {
                      backgroundColor: `color-mix(in oklab, ${tint} 12%, var(--surface))`,
                      borderColor: `color-mix(in oklab, ${tint} 35%, transparent)`,
                      color: tint,
                    }
              }
            >
              {f}
            </button>
          );
        })}
        <span className="label-mono mr-1 ml-3 text-muted-foreground">Function</span>
        {JOB_CATEGORIES.map((c) => {
          const active = category === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(active ? null : c)}
              aria-pressed={active}
              className={`label-mono rounded-full border px-3 py-1.5 transition-all hover:-translate-y-0.5 ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface-1 text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          );
        })}
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

      <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
        <div className="glass-panel">
          <div className="panel-head">
            <h3 className="label-mono flex items-center gap-2 text-muted-foreground">
              <Building2 className="size-3.5" /> Employers hiring in bioenergy
            </h3>
            <span className="label-mono text-muted-foreground/70">{employers.length}</span>
          </div>
          <ul className="divide-y divide-border">
            {shownEmployers.map((e) => (
              <li key={e.name}>
                <a
                  href={e.careers}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-surface-1"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{e.name}</div>
                    <div className="label-mono mt-0.5 text-muted-foreground">
                      {e.hq} · {e.focus.join(", ")}
                    </div>
                  </div>
                  <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel">
          <div className="panel-head">
            <h3 className="label-mono flex items-center gap-2 text-muted-foreground">
              <Newspaper className="size-3.5" /> Hiring &amp; workforce news
            </h3>
            <span className="label-mono text-muted-foreground/70">
              {isFetching ? "loading…" : "live"}
            </span>
          </div>
          {news.length ? (
            <ul className="divide-y divide-border">
              {news.map((n) => (
                <li key={n.url}>
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-5 py-3 transition-colors hover:bg-surface-1"
                  >
                    <div className="text-sm font-medium text-foreground">{n.title}</div>
                    <div className="label-mono mt-1 text-muted-foreground">
                      {n.source} {n.published ? `· ${when(n.published)}` : ""}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-5 text-sm text-muted-foreground">
              {isFetching ? "Searching hiring news…" : "No hiring news right now."}
            </p>
          )}
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
