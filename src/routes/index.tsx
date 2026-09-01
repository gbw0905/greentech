import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { RefreshCw, AlertTriangle, Map, Factory, TrendingUp, BellRing, Briefcase, Linkedin } from "lucide-react";
import { refreshPolicyFeed } from "@/lib/policy.functions";
import { feedQueryWithInitial, loadFeed } from "@/lib/feed-query";
import siteLogo from "@/assets/logo.png";
import { UpdateCard, formatDate } from "@/components/UpdateCard";
import { WorldPolicyMap } from "@/components/WorldPolicyMap";

import { OilPricePanel } from "@/components/OilPricePanel";
import { SupplyProducersSection } from "@/components/SupplyProducersSection";

import { AlertSignup } from "@/components/AlertSignup";
import { JobsPanel } from "@/components/JobsPanel";
import { TrafficPanel } from "@/components/TrafficPanel";
import { useVisitTracker } from "@/hooks/useVisitTracker";
import { AboutMenu } from "@/components/AboutMenu";


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
  loader: () => loadFeed(),
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
  const { feed: initialFeed } = Route.useLoaderData();
  const { data: feed, isFetching } = useQuery(feedQueryWithInitial(initialFeed));
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
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-[80rem] items-center justify-between gap-2 px-4 py-2 sm:gap-4 sm:px-5 sm:py-2.5 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <img
              src={siteLogo}
              alt="Global Bioenergy Watch logo: a globe with a leaf and rising data line"
              width={1024}
              height={1024}
              className="size-8 shrink-0 rounded-md object-contain sm:size-9"
            />
            <div className="min-w-0">
              <a
                href="https://www.linkedin.com/company/global-bioenergy-watch/?viewAsMember=true"
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate font-display text-base leading-none font-extrabold tracking-tight text-white transition-colors hover:text-white/80 sm:text-xl lg:text-[1.4rem]"
              >
                Global Bioenergy Watch
              </a>
              <div className="kicker mt-1 hidden items-center gap-1.5 text-white/70 sm:flex">
                <span className="size-1.5 rounded-full bg-white" />
                Independent policy &amp; market desk
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="hidden text-right sm:block">
              <div className="label-mono text-white/70">Last scan</div>
              <div className="font-mono text-xs text-white">
                {busy && !feed ? "scanning…" : formatDate(data.fetchedAt)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => rescan.mutate()}
              disabled={busy}
              className="label-mono inline-flex items-center gap-2 rounded-md bg-white px-3 py-1.5 font-bold text-black transition-colors hover:opacity-90 disabled:opacity-60 sm:px-3.5 sm:py-2"
            >
              <RefreshCw className={`size-3.5 ${busy ? "animate-spin" : ""}`} />
              Rescan
            </button>
          </div>
        </div>
        <nav
          aria-label="Page sections"
          className="mx-auto flex max-w-[80rem] items-stretch gap-2 overflow-x-auto border-t border-white/20 bg-black px-4 py-2 sm:gap-3 sm:px-5 sm:py-2.5 lg:px-8"
        >
          {SECTIONS.map((s) => (
            <a
              key={s.href}
              href={s.href}
              className="label-mono group inline-flex min-w-max flex-1 items-center justify-center gap-2 text-center whitespace-nowrap border border-white/40 bg-black px-3 py-1.5 text-xs font-extrabold text-white shadow-sm transition-all hover:border-white hover:bg-white/10 sm:px-4 sm:py-2"
            >
              {s.label}
            </a>
          ))}
          <AboutMenu />
        </nav>
      </header>

      <div className="mx-auto max-w-[80rem] px-5 py-5 lg:px-8 lg:py-6">

        <main className="space-y-8">
          <section className="grid items-stretch gap-5 lg:grid-cols-[1.1fr_minmax(0,1fr)]">
            <div className="h-full rounded-lg border border-border bg-white px-6 py-6 shadow-sm sm:px-8 sm:py-7">
              <div className="kicker inline-flex items-center gap-2 text-muted-foreground">
                <span className="size-1.5 rounded-full bg-accent" />
                Live policy &amp; market intelligence
              </div>
              <h1 className="mt-2 font-display text-[1.65rem] leading-[1.05] font-extrabold tracking-[-0.03em] text-foreground sm:text-[2.1rem] lg:text-[2.35rem]">
                AI powered global bioenergy outlook
              </h1>
              <p className="mt-2 max-w-[72ch] text-sm/relaxed text-muted-foreground">
                Global Bioenergy Watch scans official government sources, regulators, intergovernmental agencies and credible energy media worldwide, then uses AI to classify and summarise every biofuel policy and market update by jurisdiction, fuel type and relevance. Track mandates, blending targets, tax credits and SAF incentives across ethanol, biodiesel, renewable diesel and sustainable aviation fuel in one live dashboard. Click any country on the jurisdiction map to see its full policy profile, latest news and market context. The desk refreshes continuously so analysts, traders, researchers and investors can monitor the global bioenergy outlook without chasing headlines across dozens of sites.
              </p>
              <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4 sm:gap-4">
                {[
                  ["Updates", String(stats.total)],
                  ["Jurisdictions", String(stats.countries)],
                  ["Policy items", String(stats.policy)],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="font-mono text-[0.58rem] leading-tight uppercase break-words tracking-[0.08em] text-muted-foreground sm:text-[0.6875rem] sm:tracking-[0.18em]">
                      {label}
                    </dt>
                    <dd className="mt-1 font-display text-xl font-extrabold tabular-nums text-foreground sm:text-2xl">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex flex-col rounded-lg border border-border bg-white p-4 shadow-sm">
              <div className="mb-2.5 flex items-baseline justify-between gap-3 border-b border-border pb-2">
                <span className="kicker">Top 5 latest updates</span>
                <span className="label-mono text-muted-foreground/70">Live</span>
              </div>
              {topFive.length > 0 ? (
                <ol className="flex flex-1 flex-col divide-y divide-border">
                  {topFive.map((update, i) => (
                    <li key={update.id} className="flex flex-1 items-stretch gap-3">
                      <span className="flex items-center font-mono text-sm font-bold text-muted-foreground/50 tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <UpdateCard update={update} compact />
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="p-4 text-sm text-muted-foreground">
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
              title="Global Biofuel Suppliers and Users"
              subtitle="Pick a dataset to open its full workspace — heat map, scatter plot, ranked bars or data table, with per-entity detail."
            />
            <SupplyProducersSection />
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

          <TrafficPanel />

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
                  tone: "var(--chart-2)",
                  b: "Items are collected from official government and regulatory portals, intergovernmental agencies, and established energy trade and financial press. Sources outside that set are excluded.",
                },
                {
                  h: "AI processing",
                  tone: "var(--chart-4)",
                  b: "An automated language model classifies each item by jurisdiction, fuel type and category, and drafts the summary shown. Summaries are generated, not editorially reviewed line by line.",
                },
                {
                  h: "Limitations & use",
                  tone: "var(--chart-8)",
                  b: "Automated summaries can contain errors, omissions or outdated figures. Always verify against the original source and the governing legislation before relying on an item for compliance, trading or investment decisions.",
                },
              ].map((c) => (
                <div
                  key={c.h}
                  className="glass-panel border-t-4 p-5"
                  style={{
                    borderTopColor: c.tone,
                    background: `color-mix(in oklab, ${c.tone} 7%, white)`,
                  }}
                >
                  <h3 className="font-display text-base font-bold" style={{ color: c.tone }}>
                    {c.h}
                  </h3>
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
            <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-foreground">
              <span>© 2026 All rights reserved — Global Bioenergy Watch —</span>
              <a
                href="https://www.linkedin.com/in/asifulalam0905024/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-[#0A66C2]/10 px-2 py-1 text-[#0A66C2] transition-colors hover:bg-[#0A66C2]/15"
              >
                <Linkedin className="size-4 fill-current" />
                <span>Syed Asiful Alam, PhD</span>
              </a>
            </p>
            <p className="text-sm">
              <Link
                to="/contact"
                className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
              >
                Contact us
              </Link>
            </p>

          </footer>
        </main>
      </div>
    </div>
  );
}
