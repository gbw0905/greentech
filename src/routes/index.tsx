import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { RefreshCw, Filter, X, AlertTriangle, Map, Factory, Flame, TrendingUp, BellRing, Activity } from "lucide-react";
import { getPolicyFeed, refreshPolicyFeed } from "@/lib/policy.functions";
import siteLogo from "@/assets/logo.png";
import {
  COUNTRIES,
  FUEL_TYPES,
  FUEL_ACCENT,
  flagFor,
  type FuelType,
} from "@/lib/policy-taxonomy";
import { formatDate } from "@/components/UpdateCard";
import { WorldPolicyMap } from "@/components/WorldPolicyMap";
import { CountryFocusPanel } from "@/components/CountryFocusPanel";

import { OilPricePanel } from "@/components/OilPricePanel";
import { OilStocksPanel } from "@/components/OilStocksPanel";
import { BiofuelProductionPanel } from "@/components/BiofuelProductionPanel";
import { SafAirlinesPanel } from "@/components/SafAirlinesPanel";
import { AlertSignup } from "@/components/AlertSignup";
import { TrafficPanel } from "@/components/TrafficPanel";
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
    <div className="mb-5 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-primary via-primary-glow to-accent shadow-[var(--shadow-lift)]">
      <div className="relative px-6 py-5 sm:px-8 sm:py-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 16px, currentColor 16px, currentColor 18px)",
          }}
        />
        <div className="relative flex items-center gap-4 sm:gap-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-foreground/20 font-mono text-base font-bold text-primary-foreground ring-1 ring-inset ring-primary-foreground/30 sm:size-14 sm:text-lg">
            {step}
          </span>
          <div className="min-w-0">
            <h2 className="flex items-center gap-3 font-display text-3xl font-black leading-none tracking-tight text-primary-foreground sm:text-4xl [text-shadow:0_2px_16px_rgba(0,0,0,0.15)]">
              <Icon className="size-7 shrink-0 text-primary-foreground/90 sm:size-8" />
              <span className="truncate">{title}</span>
            </h2>
            <p className="mt-2 text-base font-semibold whitespace-nowrap truncate text-primary-foreground/85">
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
  const [fuels, setFuels] = useState<FuelType[]>([]);
  const [country, setCountry] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const u of data.updates) if (u.countrySlug) c[u.countrySlug] = (c[u.countrySlug] ?? 0) + 1;
    return c;
  }, [data.updates]);

  const toggle = <T,>(list: T[], set: (v: T[]) => void, value: T) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const fuelCounts = useMemo(() => {
    const m = {} as Record<FuelType, number>;
    for (const f of FUEL_TYPES) m[f] = data.updates.filter((u) => u.fuels.includes(f)).length;
    return m;
  }, [data.updates]);

  const hasFilters = Boolean(country) || fuels.length > 0;
  const clearFilters = () => {
    setCountry(null);
    setFuels([]);
  };



  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-surface/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[110rem] flex-wrap items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src={siteLogo}
              alt="Global Bioenergy Watch logo: a globe with a leaf and rising data line"
              width={1024}
              height={1024}
              className="size-12 rounded-xl object-contain drop-shadow-[0_0_16px_rgba(0,240,255,0.35)]"
            />
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

      <div className="mx-auto max-w-[110rem] px-5 py-6 lg:px-8 lg:py-8">
        {/* Active filters summary (replaces left sidebar) */}
        {hasFilters && (
          <div className="glass-panel mb-6 flex flex-wrap items-center gap-2 p-3">
            <span className="label-mono mr-1 inline-flex items-center gap-1.5 text-muted-foreground">
              <Filter className="size-3.5" /> Active filters
            </span>
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
            {fuels.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => toggle(fuels, setFuels, f)}
                className="label-mono inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2 py-1 transition-colors hover:border-destructive hover:text-destructive"
                style={{ color: FUEL_ACCENT[f] }}
              >
                {f} <X className="size-3" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="label-mono ml-auto inline-flex items-center gap-1 text-primary transition-transform hover:underline active:scale-95"
            >
              <X className="size-3" /> Clear all
            </button>
          </div>
        )}

        <main className="space-y-6">
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
              <p className="mt-4 text-sm/relaxed whitespace-nowrap opacity-90">
                Continuously scanned mandates, blending obligations and regulatory decisions across all global jurisdictions — with live readership of the desk.
              </p>
            </div>
            <div className="border-t border-border px-6 py-3 sm:px-8 sm:py-4">
              <nav
                aria-label="Page sections"
                className="flex flex-wrap gap-2.5"
              >
                {[
                  ["#markets", "1 · Markets", "oklch(0.55 0.18 230)"],
                  ["#map", "2 · Map & country desk", "oklch(0.55 0.16 320)"],
                  ["#production", "3 · Production", "oklch(0.55 0.16 150)"],
                  ["#alerts", "4 · Email alerts", "oklch(0.55 0.17 265)"],
                  ["#traffic", "5 · Live audience", "oklch(0.6 0.18 25)"],
                  ["#disclaimer", "6 · AI disclaimer", "oklch(0.45 0.02 240)"],
                ].map(([href, label, color]) => {
                  const cls =
                    "label-mono rounded-full border px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-md";
                  const style = { backgroundColor: color, borderColor: color };
                  return href!.startsWith("/") ? (
                    <Link key={href} to={href!} className={cls} style={style}>
                      {label}
                    </Link>
                  ) : (
                    <a key={href} href={href} className={cls} style={style}>
                      {label}
                    </a>
                  );
                })}
              </nav>
            </div>
          </section>

          {data.error && (
            <p className="glass-panel border-l-4 border-l-destructive p-4 text-sm text-muted-foreground">
              Live scan issue: {data.error}
            </p>
          )}

          <section id="markets">
            <SectionHeading
              step={1}
              icon={TrendingUp}
              title="Real time Crude Oil price, S&P 500 Index and Gold Price"
              subtitle="Live benchmark markets that move biofuel economics — 30-day trend, daily change and last close for each."
            />
            <OilPricePanel />
          </section>

          <section id="production" className="pt-4">
            <SectionHeading
              step={2}
              icon={Factory}
              title="Biofuel supply at the pump and top users"
              subtitle="Retail networks selling biofuels worldwide and the largest users — filter both with the fuel-type menu below."
            />
            <nav
              aria-label="Fuel type filter"
              className="glass-panel mb-4 flex flex-wrap items-center gap-2 p-3"
            >
              <span className="label-mono mr-1 inline-flex items-center gap-1.5 text-muted-foreground">
                <Flame className="size-3.5" /> Fuel type
              </span>
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
              {fuels.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFuels([])}
                  className="label-mono ml-auto inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-destructive"
                >
                  Clear <X className="size-3" />
                </button>
              )}
            </nav>
            <BiofuelProductionPanel fuels={fuels} />
            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-stretch">
              <OilStocksPanel />
              <SafAirlinesPanel />
            </div>
          </section>

          <section id="map" className="pt-4">
            <SectionHeading
              step={3}
              icon={Map}
              title="Policy activity by jurisdiction"
              subtitle="Click a country on the map to filter the timeline, profiles and videos below."
            />
            <div className="glass-panel rise flex min-w-0 flex-col p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="label-mono text-muted-foreground">Jurisdiction map</h2>
                <span className="label-mono inline-flex items-center gap-1.5 text-primary">
                  <span className="pulse-dot size-2 rounded-full bg-primary" />
                  interactive
                </span>
              </div>
              <div className="min-h-0 flex-1">
                <WorldPolicyMap counts={counts} activeCountry={country} onSelect={setCountry} />
              </div>
            </div>
          </section>

          <section className="pt-4">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  to: "/timeline" as const,
                  step: 4,
                  icon: Layers,
                  title: "Policy update timeline",
                  desc: `${data.updates.length} mandates, obligations and regulatory decisions from the live scan.`,
                  color: "oklch(0.55 0.2 50)",
                },
                {
                  to: "/profiles" as const,
                  step: 5,
                  icon: Flag,
                  title: "Country policy profiles",
                  desc: `Headline mandates for ${COUNTRIES.length} tracked jurisdictions.`,
                  color: "oklch(0.55 0.14 180)",
                },
                {
                  to: "/videos" as const,
                  step: 6,
                  icon: Video,
                  title: "Video briefing room",
                  desc: "YouTube channels and official video hubs by country and fuel type.",
                  color: "oklch(0.55 0.16 340)",
                },
              ].map(({ to, step, icon: Icon, title, desc, color }) => (
                <Link key={to} to={to} className="glass-panel lift group flex gap-4 p-5">
                  <div
                    className="grid size-12 shrink-0 place-items-center rounded-xl text-white"
                    style={{ backgroundColor: color }}
                  >
                    <Icon className="size-6" />
                  </div>
                  <div>
                    <div className="label-mono text-muted-foreground">Section {step}</div>
                    <div className="font-display text-lg font-bold transition-colors group-hover:text-primary">
                      {title}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <div className="grid gap-6 pt-4 xl:grid-cols-2 xl:items-start">
            <section id="alerts">
              <SectionHeading
                step={8}
                icon={BellRing}
                title="News alerts by email"
                subtitle="Daily email digest of new bioenergy policy updates, filtered to the fuels you follow."
              />
              <AlertSignup />
            </section>

            <section id="traffic">
              <SectionHeading
                step={9}
                icon={Activity}
                title="Live audience"
                subtitle="Real-time readership of the desk — who is reading now and how it trends."
              />
              <TrafficPanel />
            </section>
          </div>

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
