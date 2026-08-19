import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { RefreshCw, AlertTriangle, Map, Factory, TrendingUp, BellRing, Briefcase } from "lucide-react";
import { getPolicyFeed, refreshPolicyFeed } from "@/lib/policy.functions";
import siteLogo from "@/assets/logo.png";
import { formatDate, UpdateCard } from "@/components/UpdateCard";
import { WorldPolicyMap } from "@/components/WorldPolicyMap";

import { OilPricePanel } from "@/components/OilPricePanel";
import { OilStocksPanel } from "@/components/OilStocksPanel";
import { BiofuelProductionPanel } from "@/components/BiofuelProductionPanel";
import { SafAirlinesPanel } from "@/components/SafAirlinesPanel";
import { CarriersPanel } from "@/components/CarriersPanel";
import { AlertSignup } from "@/components/AlertSignup";
import { HeroAnimation } from "@/components/HeroAnimation";
import { JobsPanel } from "@/components/JobsPanel";
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

const SECTIONS: { href: string; label: string; tone: string }[] = [
  { href: "#markets", label: "Markets", tone: "var(--chart-2)" },
  { href: "#map", label: "Jurisdiction map", tone: "var(--chart-3)" },
  { href: "#production", label: "Supply & producers", tone: "var(--chart-6)" },
  { href: "#jobs", label: "Jobs", tone: "var(--chart-7)" },
  { href: "#alerts", label: "Email alerts", tone: "var(--chart-4)" },
  { href: "#disclaimer", label: "Method & disclaimer", tone: "var(--chart-8)" },
];

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

function Index() {
  return <Dashboard />;
}

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
  tone,
  kicker,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  tone: string;
  kicker: string;
}) {
  return (
    <div
      className="ink-bar mb-6 px-5 py-5 sm:px-7 sm:py-6"
      style={{ ["--tone" as string]: `color-mix(in oklab, ${tone} 62%, white)` }}
    >
      <div className="flex items-center gap-2" style={{ color: "var(--tone)" }}>
        <Icon className="size-3.5" />
        <span className="kicker" style={{ color: "var(--tone)" }}>
          {kicker}
        </span>
      </div>
      <h2 className="mt-2 font-display text-[1.75rem] leading-[1.1] font-extrabold tracking-tight text-ink-foreground sm:text-4xl">
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm/relaxed text-ink-muted">{subtitle}</p>
      <div
        className="mt-4 h-0.5 w-24 rounded-full"
        style={{ background: "var(--tone)" }}
      />
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
  const navigate = useNavigate();

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const u of data.updates) if (u.countrySlug) c[u.countrySlug] = (c[u.countrySlug] ?? 0) + 1;
    return c;
  }, [data.updates]);

  const stats = useMemo(
    () => ({
      total: data.updates.length,
      countries: new Set(data.updates.map((u) => u.countrySlug).filter(Boolean)).size,
      policy: data.updates.filter((u) => u.category !== "market").length,
    }),
    [data.updates],
  );

  const topFive = data.updates.slice(0, 5);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-ink bg-ink text-ink-foreground backdrop-blur-xl">
        <div className="mx-auto flex max-w-[80rem] flex-wrap items-center justify-between gap-4 px-5 py-2.5 lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src={siteLogo}
              alt="Global Bioenergy Watch logo: a globe with a leaf and rising data line"
              width={1024}
              height={1024}
              className="size-9 rounded-md object-contain"
            />
            <div>
              <div className="font-display text-xl leading-none font-extrabold tracking-tight text-ink-foreground sm:text-[1.4rem]">
                Global Bioenergy Watch
              </div>
              <div className="kicker mt-1 flex items-center gap-1.5 text-ink-muted">
                <span className="size-1.5 rounded-full bg-accent" />
                Independent policy &amp; market desk
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <div className="label-mono text-ink-muted">Last scan</div>
              <div className="font-mono text-xs">
                {busy && !feed ? "scanning…" : formatDate(data.fetchedAt)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => rescan.mutate()}
              disabled={busy}
              className="label-mono inline-flex items-center gap-2 rounded-md bg-accent px-3.5 py-2 font-bold text-accent-foreground transition-colors hover:opacity-90 disabled:opacity-60"
            >
              <RefreshCw className={`size-3.5 ${busy ? "animate-spin" : ""}`} />
              Rescan
            </button>
          </div>
        </div>
        <nav
          aria-label="Page sections"
          className="mx-auto hidden max-w-[80rem] items-center gap-2 overflow-x-auto border-t border-white/10 px-5 py-2.5 lg:flex lg:px-8"
        >
          {SECTIONS.map((s) => (
            <a
              key={s.href}
              href={s.href}
              className="label-mono group inline-flex items-center gap-2 whitespace-nowrap rounded-sm px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-px hover:brightness-110"
              style={{ background: s.tone }}
            >
              {s.label}
            </a>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-[80rem] px-5 py-6 lg:px-8 lg:py-8">

        <main className="space-y-10">
          <HeroAnimation />
          <section className="rise grid gap-8 border-b border-border pb-10 lg:grid-cols-[1.15fr_minmax(0,1fr)] lg:gap-12">
            <div className="flex flex-col justify-center">
              <div className="kicker inline-flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-accent" />
                Global biofuel intelligence
              </div>
              <h2 className="mt-4 font-display text-[2rem] leading-[1.05] font-extrabold tracking-[-0.03em] text-foreground sm:text-[2.5rem]">
                The desk behind the outlook
              </h2>
              <p className="mt-5 max-w-[64ch] text-base/relaxed text-muted-foreground">
                A real-time intelligence desk for biofuel policy, supply chains and benchmark
                markets. We track mandates, blending targets, tax incentives and regulatory shifts
                across every major jurisdiction — from the U.S. IRA and EU ReFuelEU to emerging SAF
                frameworks in Asia-Pacific — then synthesise them into a single, searchable outlook
                so analysts, traders and policymakers can act on what matters first.
              </p>
              <dl className="mt-8 grid grid-cols-3 divide-x divide-border border-y border-border">
                {[
                  ["Updates tracked", String(stats.total)],
                  ["Jurisdictions covered", String(stats.countries)],
                  ["Government policy items", String(stats.policy)],
                ].map(([label, value]) => (
                  <div key={label} className="px-4 py-4 first:pl-0">
                    <dt className="kicker">{label}</dt>
                    <dd className="mt-1.5 font-display text-2xl font-extrabold tabular-nums text-foreground sm:text-3xl">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="flex flex-col">
              <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-border pb-2">
                <span className="kicker">Top 5 latest updates</span>
                <span className="label-mono text-muted-foreground/70">Live</span>
              </div>
              {topFive.length > 0 ? (
                <div className="space-y-2">
                  {topFive.map((u, i) => (
                    <div key={u.id} className="flex items-start gap-2">
                      <span
                        className="label-mono mt-3 shrink-0 text-xs font-bold tabular-nums text-muted-foreground/70"
                        aria-hidden="true"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <UpdateCard update={u} compact />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel p-6 text-sm text-muted-foreground">
                  {busy ? "Scanning global sources…" : "No updates available yet."}
                </div>
              )}
            </div>
          </section>

          {data.error && (
            <p className="glass-panel border-l-4 border-l-destructive p-4 text-sm text-muted-foreground">
              Live scan issue: {data.error}
            </p>
          )}

          <section id="markets">
            <SectionHeading
              tone="var(--chart-2)"
              kicker="Markets"
              icon={TrendingUp}
              title="Real time Crude Oil price, S&P 500 Index and Gold Price"
              subtitle="Live benchmark markets that move biofuel economics — 30-day trend, daily change and last close for each."
            />
            <OilPricePanel />
          </section>

          <section id="map" className="pt-4">
            <SectionHeading
              tone="var(--chart-3)"
              kicker="Jurisdiction map"
              icon={Map}
              title="Policy activity by jurisdiction"
              subtitle="Government mandates and market moves side by side — including jurisdictions still developing their frameworks. Click any country to open its full profile."
            />
            <div className="glass-panel flex w-full min-w-0 flex-col">
              <div className="panel-head">
                <h3 className="label-mono text-muted-foreground">Jurisdiction map</h3>
                <span className="label-mono text-accent">Click a country to open its profile</span>
              </div>
              <div className="min-h-0 w-full flex-1 p-5">
                <WorldPolicyMap
                  counts={counts}
                  activeCountry={null}
                  onSelect={(slug) => {
                    if (slug) navigate({ to: "/countries/$slug", params: { slug } });
                  }}
                />
              </div>
            </div>
          </section>

          <section id="production" className="pt-4">
            <SectionHeading
              tone="var(--chart-6)"
              kicker="Supply & producers"
              icon={Factory}
              title="Biofuel supply at the pump and top users"
              subtitle="Retail networks selling biofuels worldwide and the largest users of each fuel."
            />
            <BiofuelProductionPanel fuels={[]} />
            <div className="mt-4 space-y-4">
              <OilStocksPanel />
              <SafAirlinesPanel />
              <CarriersPanel />
            </div>
          </section>

          <section id="jobs" className="pt-4">
            <SectionHeading
              tone="var(--chart-7)"
              kicker="Careers"
              icon={Briefcase}
              title="Biofuel and bioenergy jobs"
              subtitle="Live openings across biorefineries, policy teams, trading desks and R&D labs — filtered by fuel and function, with the employers hiring right now."
            />
            <JobsPanel compact />
          </section>

          <div className="pt-4">
            <section id="alerts">
              <SectionHeading
                tone="var(--chart-4)"
                kicker="Email alerts"
                icon={BellRing}
                title="News alerts by email"
                subtitle="Daily email digest of new bioenergy policy updates, filtered to the fuels you follow."
              />
              <AlertSignup />
            </section>
          </div>

          <section id="disclaimer">
            <SectionHeading
              tone="var(--chart-8)"
              kicker="Editorial standards"
              icon={AlertTriangle}
              title="Methodology & AI disclosure"
              subtitle="How this desk sources, classifies and summarises every item you read here."
            />
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  h: "Sourcing",
                  b: "Items are collected from official government and regulatory portals, intergovernmental agencies, and established energy trade and financial press. Sources outside that set are excluded.",
                },
                {
                  h: "AI processing",
                  b: "An automated language model classifies each item by jurisdiction, fuel type and category, and drafts the summary shown. Summaries are generated, not editorially reviewed line by line.",
                },
                {
                  h: "Limitations & use",
                  b: "Automated summaries can contain errors, omissions or outdated figures. Always verify against the original source and the governing legislation before relying on an item for compliance, trading or investment decisions.",
                },
              ].map((c) => (
                <div key={c.h} className="glass-panel p-5">
                  <h3 className="font-display text-base font-bold text-foreground">{c.h}</h3>
                  <p className="mt-2 text-sm/relaxed text-muted-foreground">{c.b}</p>
                </div>
              ))}
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
