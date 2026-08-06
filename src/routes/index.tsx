import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { RefreshCw, Globe2, Layers, Filter, X, AlertTriangle, Map, Video, Activity, Flag } from "lucide-react";
import { getPolicyFeed, refreshPolicyFeed } from "@/lib/policy.functions";
import {
  COUNTRIES,
  FUEL_TYPES,
  REGIONS,
  REGION_ACCENT,
  FUEL_ACCENT,
  flagFor,
  type FuelType,
  type Region,
} from "@/lib/policy-taxonomy";
import { UpdateCard, formatDate } from "@/components/UpdateCard";
import { WorldPolicyMap } from "@/components/WorldPolicyMap";
import { TrafficPanel } from "@/components/TrafficPanel";
import { OilPricePanel } from "@/components/OilPricePanel";
import { VideoLibrary } from "@/components/VideoLibrary";
import { BiofuelProductionPanel } from "@/components/BiofuelProductionPanel";
import { Counter } from "@/components/Counter";
import { useVisitTracker } from "@/hooks/useVisitTracker";

const feedQuery = queryOptions({
  queryKey: ["policy-feed"],
  queryFn: () => getPolicyFeed(),
  staleTime: 5 * 60 * 1000,
  // Keeps the desk current without a page reload.
  refetchInterval: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
});

const TITLE = "Global Bioenergy Watch | Worldwide Biofuel Policy Tracker";
const DESCRIPTION =
  "Live tracker of global bioenergy and biofuel policy: ethanol, biodiesel, renewable diesel and SAF mandates by region, country and fuel type.";

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
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
  count?: number;
}) {
  const tint = color ?? "var(--primary)";
  const empty = count === 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`label-mono inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-125 active:scale-95 ${
        empty && !active ? "opacity-45" : ""
      }`}
      style={
        active
          ? {
              backgroundColor: tint,
              borderColor: tint,
              color: "var(--primary-foreground)",
              boxShadow: `0 0 0 3px color-mix(in oklab, ${tint} 28%, transparent), var(--shadow-frost)`,
            }
          : {
              backgroundColor: `color-mix(in oklab, ${tint} 12%, var(--surface))`,
              borderColor: `color-mix(in oklab, ${tint} 35%, transparent)`,
              color: tint,
            }
      }
    >
      <span
        className={`size-1.5 rounded-full ${active ? "pulse-dot" : ""}`}
        style={{ backgroundColor: active ? "var(--primary-foreground)" : tint }}
      />
      {children}
      {typeof count === "number" && (
        <span
          className="ml-0.5 rounded-full px-1.5 text-[0.65rem] tabular-nums"
          style={{
            backgroundColor: active
              ? "color-mix(in oklab, var(--primary-foreground) 22%, transparent)"
              : `color-mix(in oklab, ${tint} 20%, transparent)`,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function Index() {
  return <Dashboard />;
}

function SectionHeading({
  step,
  icon: Icon,
  title,
  subtitle,
}: {
  step: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-primary via-primary-glow to-accent shadow-[var(--shadow-lift)]">
      <div className="relative px-5 py-4 sm:px-6 sm:py-5">
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 16px, currentColor 16px, currentColor 18px)",
          }}
        />
        <div className="relative flex items-center gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-foreground/20 font-mono text-sm font-bold text-primary-foreground ring-1 ring-inset ring-primary-foreground/30">
            {step}
          </span>
          <div className="min-w-0">
            <h2 className="flex items-center gap-2.5 font-display text-2xl font-black leading-none tracking-tight text-primary-foreground sm:text-3xl">
              <Icon className="size-6 shrink-0 text-primary-foreground/90" />
              <span className="truncate">{title}</span>
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm font-medium text-primary-foreground/80">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  useVisitTracker();
  const queryClient = useQueryClient();
  const { data: feed, isFetching } = useQuery(feedQuery);
  const rescan = useMutation({
    mutationFn: () => refreshPolicyFeed(),
    onSuccess: (fresh) => {
      queryClient.setQueryData(["policy-feed"], fresh);
    },
  });
  const busy = isFetching || rescan.isPending;
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

  const regionCounts = useMemo(() => {
    const m = {} as Record<Region, number>;
    for (const r of REGIONS) m[r] = data.updates.filter((u) => u.region === r).length;
    return m;
  }, [data.updates]);

  const fuelCounts = useMemo(() => {
    const m = {} as Record<FuelType, number>;
    for (const f of FUEL_TYPES) m[f] = data.updates.filter((u) => u.fuels.includes(f)).length;
    return m;
  }, [data.updates]);

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
            <span className="grid size-10 place-items-center rounded-xl surface-gradient-primary text-primary-foreground shadow-[var(--shadow-frost)]">
              <Globe2 className="size-5" />
            </span>
            <div>
              <div className="font-display text-3xl leading-tight font-black text-gradient drop-shadow-[0_0_16px_rgba(0,240,255,0.45)]">
                Global Bioenergy Watch
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="label-mono text-muted-foreground">Last scan</div>
              <div className="font-mono text-xs">
                {busy && !feed ? "scanning…" : formatDate(data.fetchedAt)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => rescan.mutate()}
              disabled={busy}
              className="label-mono inline-flex items-center gap-2 rounded-full surface-gradient-primary px-4 py-2 text-primary-foreground shadow-[var(--shadow-frost)] transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
            >
              <RefreshCw className={`size-3.5 ${busy ? "animate-spin" : ""}`} />
              Rescan
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[110rem] gap-6 px-5 py-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:px-8 lg:py-8">
        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
          <div className="glass-panel rise space-y-5 p-5 transition-shadow duration-300 hover:shadow-[var(--shadow-frost)]">
            <div className="flex items-center justify-between">
              <h2 className="label-mono flex items-center gap-2 text-muted-foreground">
                <Filter className="size-3.5" /> Filters
                {hasFilters && (
                  <span className="rounded-full bg-primary/20 px-1.5 text-[0.65rem] text-primary tabular-nums">
                    {regions.length + fuels.length + (country ? 1 : 0)}
                  </span>
                )}
              </h2>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="label-mono inline-flex items-center gap-1 text-primary transition-transform hover:underline active:scale-95"
                >
                  <X className="size-3" /> Clear
                </button>
              )}
            </div>

            {/* Live match meter */}
            <div className="rounded-[var(--radius)] border border-border bg-surface-2/50 p-3">
              <div className="flex items-baseline justify-between">
                <span className="label-mono text-muted-foreground">Matching now</span>
                <span className="font-display text-lg font-bold text-primary tabular-nums">
                  {filtered.length}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                  style={{
                    width: `${data.updates.length ? (filtered.length / data.updates.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {hasFilters && (
              <div className="flex flex-wrap gap-1.5">
                {country && (
                  <button
                    type="button"
                    onClick={() => setCountry(null)}
                    className="label-mono inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2 py-1 transition-colors hover:border-destructive hover:text-destructive"
                  >
                    {flagFor(country)} {COUNTRIES.find((c) => c.slug === country)?.name}
                    <X className="size-3" />
                  </button>
                )}
                {regions.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggle(regions, setRegions, r)}
                    className="label-mono inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2 py-1 transition-colors hover:border-destructive hover:text-destructive"
                  >
                    {r} <X className="size-3" />
                  </button>
                ))}
                {fuels.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggle(fuels, setFuels, f)}
                    className="label-mono inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2 py-1 transition-colors hover:border-destructive hover:text-destructive"
                  >
                    {f} <X className="size-3" />
                  </button>
                ))}
              </div>
            )}

            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="label-mono text-muted-foreground">Region</h3>
                <button
                  type="button"
                  onClick={() => setRegions(regions.length === REGIONS.length ? [] : [...REGIONS])}
                  className="label-mono text-muted-foreground transition-colors hover:text-primary"
                >
                  {regions.length === REGIONS.length ? "None" : "All"}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {REGIONS.map((r) => (
                  <Chip
                    key={r}
                    active={regions.includes(r)}
                    color={REGION_ACCENT[r]}
                    count={regionCounts[r]}
                    onClick={() => toggle(regions, setRegions, r)}
                  >
                    {r}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="label-mono text-muted-foreground">Fuel type</h3>
                <button
                  type="button"
                  onClick={() => setFuels(fuels.length === FUEL_TYPES.length ? [] : [...FUEL_TYPES])}
                  className="label-mono text-muted-foreground transition-colors hover:text-primary"
                >
                  {fuels.length === FUEL_TYPES.length ? "None" : "All"}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FUEL_TYPES.map((f) => (
                  <Chip
                    key={f}
                    active={fuels.includes(f)}
                    color={FUEL_ACCENT[f]}
                    count={fuelCounts[f]}
                    onClick={() => toggle(fuels, setFuels, f)}
                  >
                    {f}
                  </Chip>
                ))}
              </div>
            </div>

          </div>

          <div className="glass-panel rise space-y-4 p-5">
            <h2 className="label-mono text-muted-foreground">Most active markets</h2>
            <ul className="space-y-2.5">
              {topCountries.length === 0 && (
                <li className="text-sm text-muted-foreground">No matches in this scan.</li>
              )}
              {topCountries.map(([slug, n]) => {
                const c = COUNTRIES.find((x) => x.slug === slug)!;
                return (
                  <li
                    key={slug}
                    className={`space-y-1 rounded-md px-1.5 py-1 transition-colors ${
                      country === slug ? "bg-primary/10" : "hover:bg-surface-2/70"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setCountry(country === slug ? null : slug)}
                        className={`flex min-w-0 items-center gap-1.5 truncate text-sm transition-colors hover:text-primary ${
                          country === slug ? "text-primary" : ""
                        }`}
                      >
                        <span aria-hidden>{flagFor(slug)}</span>
                        <span className="truncate">{c.name}</span>
                      </button>
                      <span className="font-mono text-xs text-muted-foreground">{n}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full transition-[width] duration-700 ease-out"
                        style={{
                          width: `${(n / topCountries[0]![1]) * 100}%`,
                          backgroundColor: REGION_ACCENT[c.region],
                          opacity: country && country !== slug ? 0.4 : 1,
                        }}
                      />
                    </div>
                    <Link
                      to="/countries/$slug"
                      params={{ slug }}
                      className="label-mono text-[0.65rem] text-muted-foreground transition-colors hover:text-primary"
                    >
                      View profile →
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 space-y-6">
          <section className="glass-panel rise overflow-hidden">
            <div style={{ containerType: "inline-size" }} className="hero-glow surface-gradient-aurora px-6 py-10 text-primary-foreground sm:px-8 sm:py-12">
              <div className="label-mono inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 backdrop-blur-sm">
                <span className="pulse-dot size-1.5 rounded-full bg-current" />
                Global biofuel intelligence
              </div>
              <h1 style={{ fontSize: "clamp(0.8rem, 4.5cqi, 3rem)" }}
                className="mt-5 font-display leading-[1.1] font-bold whitespace-nowrap [text-shadow:0_2px_24px_rgba(255,255,255,0.35)]">
                AI powered global bioenergy outlook
              </h1>
              <p className="mt-4 max-w-xl text-sm/relaxed opacity-90">
                Continuously scanned mandates, blending obligations and regulatory decisions across all global jurisdictions — with live readership of the desk.
              </p>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
              {stats.map(([label, value]) => (
                <div key={label} className="px-6 py-4">
                  <div className="label-mono text-muted-foreground">{label}</div>
                  <Counter
                    value={value}
                    className="mt-1 block font-display text-2xl font-bold text-primary tabular-nums"
                  />
                </div>
              ))}
            </div>
            <nav
              aria-label="Page sections"
              className="flex flex-wrap gap-2 border-t border-border px-6 py-3"
            >
              {[
                ["#map", "1 · Map"],
                ["#production", "2 · Production"],
                ["#timeline", "3 · Timeline"],
                ["#profiles", "4 · Country profiles"],
                ["#videos", "5 · Videos"],
                ["#audience", "6 · Live audience"],
                ["#disclaimer", "7 · AI disclaimer"],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="label-mono rounded-full border border-border bg-surface-2 px-3 py-1.5 text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:text-primary"
                >
                  {label}
                </a>
              ))}
            </nav>
          </section>

          {data.error && (
            <p className="glass-panel border-l-4 border-l-destructive p-4 text-sm text-muted-foreground">
              Live scan issue: {data.error}
            </p>
          )}

          <section id="map">
            <SectionHeading
              step={1}
              icon={Map}
              title="Policy activity by jurisdiction"
              subtitle="Click a country on the map or in the ranking to filter everything below — with live crude oil prices alongside."
            />
            <div className="grid items-start gap-4 xl:grid-cols-2">
            <div className="glass-panel rise min-w-0 p-5">
              <div className="mt-3">
                <WorldPolicyMap counts={counts} activeCountry={country} onSelect={setCountry} />
              </div>
            </div>
            <OilPricePanel />
            </div>
          </section>

          <section id="production" className="pt-4">
            <SectionHeading
              step={2}
              icon={Factory}
              title="Global biofuel production per day"
              subtitle="Daily output of every biofuel type worldwide — ethanol, biodiesel, renewable diesel, SAF and biomethane."
            />
            <BiofuelProductionPanel />
          </section>

          <section id="timeline">
            <SectionHeading
              step={3}
              icon={Layers}
              title={`Policy update timeline · ${filtered.length} updates${
                country ? ` · ${COUNTRIES.find((c) => c.slug === country)?.name}` : ""
              }`}
              subtitle="Newest mandates, obligations and regulatory decisions from the live scan."
            />
            <div className="mt-3 space-y-3">
              {filtered.length === 0 &&
                (busy && !feed ? (
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

          <section id="profiles" className="pt-4">
            <SectionHeading
              step={4}
              icon={Flag}
              title="Country policy profiles"
              subtitle="Headline mandate for each tracked jurisdiction — open a profile for full detail."
            />
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
                    <span className="mr-1.5" aria-hidden>
                      {flagFor(c.slug)}
                    </span>
                    {c.name}
                  </div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    {c.mandates[0]?.value}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section id="videos" className="pt-4">
            <SectionHeading
              step={5}
              icon={Video}
              title="Video briefing room"
              subtitle="YouTube channels and official video hubs, linked to the countries and policies they cover."
            />
            <VideoLibrary
              regions={regions}
              fuels={fuels}
              country={country}
              onSelectCountry={setCountry}
            />
          </section>

          <section id="audience" className="pt-4">
            <SectionHeading
              step={6}
              icon={Activity}
              title="Live audience"
              subtitle="Real-time readership of this desk."
            />
            <TrafficPanel />
          </section>

          <section id="disclaimer" className="glass-panel rise border-l-4 border-l-signal bg-signal/[0.03] p-5">
            <div className="flex items-start gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-signal/15 shrink-0">
                <AlertTriangle className="size-5 text-signal" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">AI-generated content disclaimer</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Stories are gathered from public web sources, including government policy portals, regulatory notices, international agencies, and energy trade press. An AI layer classifies each item by region, country and fuel type, then writes the summary you see here.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  <strong className="text-foreground">Cross-verify</strong> means checking any summary against the original source and the relevant official announcement or primary legislation before using it for compliance, trading or investment decisions. The feed may contain errors, omissions or outdated information.
                </p>
              </div>
            </div>
          </section>

          <footer className="space-y-3 border-t border-border pt-6 pb-10">
            <p className="text-xs text-muted-foreground">
              Updates are aggregated from live web sources and auto-classified by jurisdiction and
              fuel type. Verify against primary legislation before use in compliance decisions.
            </p>
            <p className="text-xs font-semibold text-foreground">
              © {new Date().getFullYear()} All rights reserved —{" "}
              <a
                href="https://www.linkedin.com/in/asifulalam0905024/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-2 transition-colors hover:text-primary-glow hover:underline"
              >
                Syed Asiful Alam, PhD
              </a>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
