import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
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
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(feedQuery);
  },
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
      className={`label-mono rounded-full border px-3 py-1.5 transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
      }`}
      style={!active && color ? { color } : undefined}
    >
      {children}
    </button>
  );
}

function Index() {
  const { data, isFetching, refetch } = useSuspenseQuery(feedQuery);
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

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface/50 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-6 py-6">
          <div>
            <div className="label-mono text-primary">Global biofuel intelligence</div>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Biofuel Policy Radar</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Continuously scanned mandates, blending obligations and regulatory decisions across{" "}
              {COUNTRIES.length} tracked jurisdictions.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="label-mono text-muted-foreground">Last scan</div>
              <div className="font-mono text-sm">{formatDate(data.fetchedAt)}</div>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="label-mono inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 hover:border-primary hover:text-primary"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Rescan
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {data.error && (
          <p className="mb-6 border-l-2 border-destructive bg-surface p-4 text-sm text-muted-foreground">
            Live scan issue: {data.error}
          </p>
        )}

        <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-md border border-border bg-surface/50 p-4">
            <h2 className="label-mono text-muted-foreground">Policy activity by jurisdiction</h2>
            <WorldPolicyMap counts={counts} activeCountry={country} onSelect={setCountry} />
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border bg-border">
              {[
                ["Updates", data.updates.length],
                ["Jurisdictions", Object.keys(counts).length],
                ["In view", filtered.length],
              ].map(([label, value]) => (
                <div key={label as string} className="bg-surface p-4">
                  <div className="label-mono text-muted-foreground">{label}</div>
                  <div className="mt-1 font-display text-2xl font-bold text-primary">{value}</div>
                </div>
              ))}
            </div>

            <div className="rounded-md border border-border bg-surface/50 p-4">
              <h2 className="label-mono text-muted-foreground">Most active markets</h2>
              <ul className="mt-3 space-y-2">
                {topCountries.length === 0 && (
                  <li className="text-sm text-muted-foreground">No matches in this scan.</li>
                )}
                {topCountries.map(([slug, n]) => {
                  const c = COUNTRIES.find((x) => x.slug === slug)!;
                  return (
                    <li key={slug} className="flex items-center gap-3">
                      <Link
                        to="/countries/$slug"
                        params={{ slug }}
                        className="w-40 shrink-0 truncate text-sm hover:text-primary"
                      >
                        {c.name}
                      </Link>
                      <div className="h-2 flex-1 rounded-full bg-surface-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${(n / topCountries[0]![1]) * 100}%`,
                            backgroundColor: REGION_ACCENT[c.region],
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">{n}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-10 border-t border-border pt-6">
          <div className="flex flex-wrap items-start gap-x-10 gap-y-5">
            <div>
              <h2 className="label-mono mb-3 text-muted-foreground">Region</h2>
              <div className="flex flex-wrap gap-2">
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
              <h2 className="label-mono mb-3 text-muted-foreground">Fuel type</h2>
              <div className="flex flex-wrap gap-2">
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
            {(country || regions.length > 0 || fuels.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setCountry(null);
                  setRegions([]);
                  setFuels([]);
                }}
                className="label-mono self-end text-primary underline-offset-4 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="label-mono text-muted-foreground">
            Timeline · {filtered.length} updates
            {country && ` · ${COUNTRIES.find((c) => c.slug === country)?.name}`}
          </h2>
          <div className="mt-4 space-y-3 border-l border-border pl-0">
            {filtered.length === 0 && (
              <p className="p-6 text-sm text-muted-foreground">
                No updates match the current filters.
              </p>
            )}
            {filtered.map((u) => (
              <UpdateCard key={u.id} update={u} />
            ))}
          </div>
        </section>

        <section className="mt-14 border-t border-border pt-6">
          <h2 className="label-mono text-muted-foreground">Country profiles</h2>
          <div className="mt-4 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {COUNTRIES.map((c) => (
              <Link
                key={c.slug}
                to="/countries/$slug"
                params={{ slug: c.slug }}
                className="group bg-surface p-4 transition-colors hover:bg-surface-2"
              >
                <div className="label-mono" style={{ color: REGION_ACCENT[c.region] }}>
                  {c.region}
                </div>
                <div className="mt-1 font-display font-semibold group-hover:text-primary">
                  {c.name}
                </div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">
                  {c.mandates[0]?.value}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-10 border-t border-border py-8">
        <p className="mx-auto max-w-7xl px-6 text-xs text-muted-foreground">
          Updates are aggregated from live web sources and auto-classified by jurisdiction and fuel
          type. Verify against primary legislation before use in compliance decisions.
        </p>
      </footer>
    </div>
  );
}
