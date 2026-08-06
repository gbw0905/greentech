import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { RefreshCw, Globe2, Layers, Filter, X } from "lucide-react";
import { getPolicyFeed } from "@/lib/policy.functions";
import {
  COUNTRIES,
  FUEL_TYPES,
  REGIONS,
  REGION_ACCENT,
  type FuelType,
  type Region,
} from "@/lib/policy-taxonomy";
import { UpdateCard, formatDate } from "@/components/UpdateCard";
import { WorldPolicyMap } from "@/components/WorldPolicyMap";

const feedQuery = queryOptions({
  queryKey: ["policy-feed"],
  queryFn: () => getPolicyFeed(),
  staleTime: 10 * 60 * 1000,
});

const TITLE = "Biofuel Policy Radar | Global Mandate & Regulation Tracker";
const DESCRIPTION =
  "Live tracker of global biofuel policy: ethanol, biodiesel, renewable diesel and SAF mandates by region, country and fuel type.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
  errorComponent: ({ error }) => (
    <div className="p-10 text-sm text-destructive" role="alert">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-sm">Nothing here.</div>,
});

function Chip({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`label-mono rounded-full border px-3 py-1.5 transition-all duration-200 active:scale-95 ${
        active
          ? "border-transparent bg-primary text-primary-foreground shadow-[var(--shadow-frost)]"
          : "border-border bg-surface text-muted-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground"
      }`}
      style={!active && color ? { color } : undefined}
    >
      {children}
    </button>
  );
}

function Index() {
  const { data: feed, isFetching, refetch } = useQuery(feedQuery);
  const data = feed ?? { updates: [], fetchedAt: null as string | null, error: null as string | null };
  const [regions, setRegions] = useState<Region[]>([]);
  const [fuels, setFuels] = useState<FuelType[]>([]);
  const [country, setCountry] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const u of data.updates) if (u.countrySlug) c[u.countrySlug] = (c[u.countrySlug] ?? 0) + 1;
    return c;
  }, [data.updates]);

  const filtered = useMemo(
    () =>
      data.updates.filter(
        (u) =>
          (regions.length === 0 || regions.includes(u.region)) &&
          (fuels.length === 0 || u.fuels.some((f) => fuels.includes(f))) &&
          (!country || u.countrySlug === country),
      ),
    [data.updates, regions, fuels, country],
  );

  const toggle = <T,>(list: T[], set: (v: T[]) => void, value: T) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const topCountries = useMemo(
    () =>
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6),
    [counts],
  );

  const hasFilters = Boolean(country) || regions.length > 0 || fuels.length > 0;
  const clearFilters = () => {
    setCountry(null);
    setRegions([]);
    setFuels([]);
  };
  const stats: Array<[string, number]> = [
    ["Updates", data.updates.length],
    ["Jurisdictions", Object.keys(counts).length],
    ["In view", filtered.length],
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-surface/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[110rem] flex-wrap items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl surface-gradient-primary text-primary-foreground shadow-[var(--shadow-frost)]">
              <Globe2 className="size-4.5" />
            </span>
            <div>
              <div className="font-display text-base leading-tight font-bold">
                Biofuel Policy Radar
              </div>
              <div className="label-mono text-muted-foreground">
                {COUNTRIES.length} jurisdictions tracked
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="label-mono text-muted-foreground">Last scan</div>
              <div className="font-mono text-xs">
                {isFetching && !feed ? "scanning…" : formatDate(data.fetchedAt)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="label-mono inline-flex items-center gap-2 rounded-full surface-gradient-primary px-4 py-2 text-primary-foreground shadow-[var(--shadow-frost)] transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Rescan
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[110rem] gap-6 px-5 py-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:px-8 lg:py-8">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="glass-panel rise space-y-6 p-5">
            <div className="flex items-center justify-between">
              <h2 className="label-mono flex items-center gap-2 text-muted-foreground">
                <Filter className="size-3.5" /> Filters
              </h2>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="label-mono inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <X className="size-3" /> Clear
                </button>
              )}
            </div>

            <div>
              <h3 className="label-mono mb-2.5 text-muted-foreground">Region</h3>
              <div className="flex flex-wrap gap-1.5">
                {REGIONS.map((r) => (
                  <Chip
                    key={r}
                    active={regions.includes(r)}
                    color={REGION_ACCENT[r]}
                    onClick={() => toggle(regions, setRegions, r)}
                  >
                    {r}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <h3 className="label-mono mb-2.5 text-muted-foreground">Fuel type</h3>
              <div className="flex flex-wrap gap-1.5">
                {FUEL_TYPES.map((f) => (
                  <Chip
                    key={f}
                    active={fuels.includes(f)}
                    onClick={() => toggle(fuels, setFuels, f)}
                  >
                    {f}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-5">
              <h3 className="label-mono mb-3 text-muted-foreground">Most active markets</h3>
              <ul className="space-y-2.5">
                {topCountries.length === 0 && (
                  <li className="text-sm text-muted-foreground">No matches in this scan.</li>
                )}
                {topCountries.map(([slug, n]) => {
                  const c = COUNTRIES.find((x) => x.slug === slug)!;
                  return (
                    <li key={slug} className="space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <Link
                          to="/countries/$slug"
                          params={{ slug }}
                          className="truncate text-sm transition-colors hover:text-primary"
                        >
                          {c.name}
                        </Link>
                        <span className="font-mono text-xs text-muted-foreground">{n}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full transition-[width] duration-700 ease-out"
                          style={{
                            width: `${(n / topCountries[0]![1]) * 100}%`,
                            backgroundColor: REGION_ACCENT[c.region],
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 space-y-6">
          <section className="glass-panel rise overflow-hidden">
            <div className="surface-gradient-frost px-6 py-7">
              <div className="label-mono text-primary">Global biofuel intelligence</div>
              <h1 className="mt-2 max-w-2xl font-display text-3xl leading-tight font-bold sm:text-4xl">
                Every biofuel <span className="text-gradient">policy move</span>, tracked as it
                lands.
              </h1>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                Continuously scanned mandates, blending obligations and regulatory decisions across{" "}
                {COUNTRIES.length} jurisdictions.
              </p>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
              {stats.map(([label, value]) => (
                <div key={label} className="px-6 py-4">
                  <div className="label-mono text-muted-foreground">{label}</div>
                  <div className="mt-1 font-display text-2xl font-bold text-primary tabular-nums">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {data.error && (
            <p className="glass-panel border-l-4 border-l-destructive p-4 text-sm text-muted-foreground">
              Live scan issue: {data.error}
            </p>
          )}

          <section className="glass-panel rise p-5">
            <h2 className="label-mono text-muted-foreground">Policy activity by jurisdiction</h2>
            <WorldPolicyMap counts={counts} activeCountry={country} onSelect={setCountry} />
          </section>

          <section>
            <h2 className="label-mono flex items-center gap-2 text-muted-foreground">
              <Layers className="size-3.5" /> Timeline · {filtered.length} updates
              {country && ` · ${COUNTRIES.find((c) => c.slug === country)?.name}`}
            </h2>
            <div className="mt-3 space-y-3">
              {filtered.length === 0 &&
                (isFetching && !feed ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="scanning-bar h-28 rounded-[var(--radius)]" />
                    ))}
                    <p className="label-mono text-center text-muted-foreground">
                      Scanning global sources…
                    </p>
                  </div>
                ) : (
                  <p className="glass-panel p-6 text-sm text-muted-foreground">
                    No updates match the current filters.
                  </p>
                ))}
              {filtered.map((u, i) => (
                <div
                  key={u.id}
                  className="rise"
                  style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
                >
                  <UpdateCard update={u} />
                </div>
              ))}
            </div>
          </section>

          <section className="pt-4">
            <h2 className="label-mono text-muted-foreground">Country profiles</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {COUNTRIES.map((c) => (
                <Link
                  key={c.slug}
                  to="/countries/$slug"
                  params={{ slug: c.slug }}
                  className="glass-panel lift group p-4"
                >
                  <div className="label-mono" style={{ color: REGION_ACCENT[c.region] }}>
                    {c.region}
                  </div>
                  <div className="mt-1 font-display font-semibold transition-colors group-hover:text-primary">
                    {c.name}
                  </div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    {c.mandates[0]?.value}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <footer className="border-t border-border pt-6 pb-10">
            <p className="text-xs text-muted-foreground">
              Updates are aggregated from live web sources and auto-classified by jurisdiction and
              fuel type. Verify against primary legislation before use in compliance decisions.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
