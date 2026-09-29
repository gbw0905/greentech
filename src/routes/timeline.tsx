import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Layers, X } from "lucide-react";
import { feedQueryWithInitial, loadFeed } from "@/features/policy/feed-query";
import {
  COUNTRIES,
  FUEL_TYPES,
  FUEL_ACCENT,
  flagFor,
  type FuelType,
} from "@/features/policy/taxonomy";
import { UpdateCard } from "@/features/policy/components/UpdateCard";
import { PageShell, PageHeading } from "@/components/PageShell";
import { useVisitTracker } from "@/features/traffic/hooks/useVisitTracker";

const TITLE = "Policy update timeline | Global Bioenergy Watch";
const DESCRIPTION =
  "Newest global biofuel and bioenergy mandates, blending obligations and regulatory decisions, filterable by country and fuel type.";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://globalbioenergywatch.org/timeline" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://globalbioenergywatch.org/timeline" }],
  }),
  loader: () => loadFeed(),
  component: TimelinePage,
});

function TimelinePage() {
  useVisitTracker();
  const { feed: initialFeed } = Route.useLoaderData();
  const { data: feed, isFetching } = useQuery(feedQueryWithInitial(initialFeed));
  const updates = useMemo(() => feed?.updates ?? [], [feed?.updates]);
  const [fuels, setFuels] = useState<FuelType[]>([]);
  const [country, setCountry] = useState<string | null>(null);

  const fuelCounts = useMemo(() => {
    const m = {} as Record<FuelType, number>;
    for (const f of FUEL_TYPES) m[f] = updates.filter((u) => u.fuels.includes(f)).length;
    return m;
  }, [updates]);

  const filtered = useMemo(
    () =>
      updates
        .filter(
          (u) =>
            (fuels.length === 0 || u.fuels.some((f) => fuels.includes(f))) &&
            (!country || u.countrySlug === country),
        )
        .sort((a, b) => {
          const aDate = a.publishedAt ?? a.createdAt;
          const bDate = b.publishedAt ?? b.createdAt;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        }),
    [updates, fuels, country],
  );

  const toggleFuel = (f: FuelType) =>
    setFuels((list) => (list.includes(f) ? list.filter((v) => v !== f) : [...list, f]));

  return (
    <PageShell>
      <PageHeading
        icon={Layers}
        title={`Policy update timeline · ${filtered.length} updates`}
        subtitle="Newest mandates, obligations and regulatory decisions from the live scan."
      />

      <div className="glass-panel flex flex-wrap items-center gap-2 p-3">
        <span className="label-mono mr-1 text-muted-foreground">Fuel type</span>
        {FUEL_TYPES.map((f) => {
          const active = fuels.includes(f);
          const tint = FUEL_ACCENT[f];
          return (
            <button
              key={f}
              type="button"
              onClick={() => toggleFuel(f)}
              aria-pressed={active}
              className="label-mono inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-all hover:-translate-y-0.5"
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
              <span className="tabular-nums opacity-80">{fuelCounts[f]}</span>
            </button>
          );
        })}
        <select
          value={country ?? ""}
          onChange={(e) => setCountry(e.target.value || null)}
          className="label-mono ml-auto rounded-full border border-border bg-surface-2 px-3 py-1.5 text-foreground"
          aria-label="Filter by country"
        >
          <option value="">All countries</option>
          {COUNTRIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {flagFor(c.slug)} {c.name}
            </option>
          ))}
        </select>
        {(country || fuels.length > 0) && (
          <button
            type="button"
            onClick={() => {
              setCountry(null);
              setFuels([]);
            }}
            className="label-mono inline-flex items-center gap-1 text-primary hover:underline"
          >
            <X className="size-3" /> Clear
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 &&
          (isFetching && !feed ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="scanning-bar h-28 rounded-[var(--radius)]" />
              ))}
            </div>
          ) : (
            <p className="glass-panel p-6 text-sm text-muted-foreground">
              No updates match the current filters.
            </p>
          ))}
        {filtered.map((u) => (
          <UpdateCard key={u.id} update={u} />
        ))}
      </div>
    </PageShell>
  );
}
