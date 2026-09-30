import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  RefreshCw,
  AlertTriangle,
  Map,
  Factory,
  TrendingUp,
  BellRing,
  Briefcase,
  Linkedin,
  Menu,
  X,
} from "lucide-react";
import { refreshPolicyFeed } from "@/features/policy/server-functions";
import { feedQueryWithInitial, loadFeed } from "@/features/policy/feed-query";
import { AuthButton } from "@/features/auth/components/AuthButton";
import siteLogo from "@/assets/logo.png";
import { WorldPolicyMap } from "@/features/countries/components/WorldPolicyMap";

import { OilPricePanel } from "@/features/markets/components/OilPricePanel";
import { SupplyProducersSection } from "@/features/supply/components/SupplyProducersSection";
import { LiveMarquee } from "@/features/markets/components/LiveMarquee";

import { AlertSignup } from "@/features/alerts/components/AlertSignup";
import { JobsPanel } from "@/features/jobs/components/JobsPanel";
import { TrafficPanel } from "@/features/traffic/components/TrafficPanel";
import { useVisitTracker } from "@/features/traffic/hooks/useVisitTracker";
import { AboutMenu } from "@/components/AboutMenu";
import { getErrorMessage } from "@/shared/errors";
import { HomeHero } from "@/features/home/components/HomeHero";
import { LatestUpdatesSection } from "@/features/home/components/LatestUpdatesSection";

const TITLE = "Global Bioenergy Watch | Worldwide Biofuel Policy Tracker";

const SECTIONS: { href: string; label: string; tone: string }[] = [
  { href: "#markets", label: "Markets", tone: "var(--chart-2)" },
  { href: "#map", label: "Jurisdiction map", tone: "var(--chart-3)" },
  { href: "#production", label: "Supply and producers", tone: "var(--chart-6)" },
  { href: "#jobs", label: "Jobs", tone: "var(--chart-7)" },
  { href: "#alerts", label: "Email alerts", tone: "var(--chart-4)" },
  { href: "#disclaimer", label: "Method and disclaimer", tone: "var(--chart-8)" },
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
      { property: "og:url", content: "https://globalbioenergywatch.org/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://globalbioenergywatch.org/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Global Bioenergy Watch",
          url: "https://globalbioenergywatch.org/",
          description: DESCRIPTION,
          publisher: {
            "@type": "Organization",
            name: "Global Bioenergy Watch",
            url: "https://globalbioenergywatch.org/",
          },
        }),
      },
    ],
  }),
  component: Index,
  errorComponent: ({ error }) => (
    <div className="p-10 text-sm text-destructive" role="alert">
      {getErrorMessage(error)}
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
  singleLine,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  tone: string;
  kicker: string;
  singleLine?: boolean;
}) {
  return (
    <div
      className={`ink-bar ribbon-sheen mb-4 border-l-4 px-4 py-3 sm:px-5 ${
        singleLine
          ? "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "overflow-hidden"
      }`}
      style={{
        ["--tone" as string]: `color-mix(in oklab, ${tone} 62%, white)`,
        borderLeftColor: "var(--tone)",
      }}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span
          className="kicker inline-flex shrink-0 items-center gap-1.5"
          style={{ color: "var(--tone)" }}
        >
          <Icon className="size-3" />
          {kicker}
        </span>
        <h2 className="min-w-0 font-display text-lg leading-tight font-extrabold tracking-tight text-ink-foreground sm:text-2xl">
          {title}
        </h2>
      </div>
      <p
        className={`mt-1 w-full text-xs/relaxed text-ink-muted sm:text-sm/relaxed ${
          singleLine ? "whitespace-nowrap" : "max-w-3xl"
        }`}
      >
        {subtitle}
      </p>
    </div>
  );
}

function Dashboard() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
  const data = feed ?? {
    updates: [],
    fetchedAt: null as string | null,
    error: null as string | null,
  };
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
      <header className="sticky top-0 z-50 border-b border-[#d6e1ea] bg-white/[.88] font-['Instrument_Sans'] text-[#0e2a43] backdrop-blur-[14px] backdrop-saturate-[1.4]">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-3 px-5 min-[621px]:px-8 min-[1160px]:gap-7">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={siteLogo}
              alt="Global Bioenergy Watch logo: a globe with a leaf and rising data line"
              width={1024}
              height={1024}
              className="size-9 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <a
                href="https://www.linkedin.com/company/global-bioenergy-watch/?viewAsMember=true"
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate font-['Bricolage_Grotesque'] text-[1.05rem] leading-[1.15] font-semibold tracking-[-0.01em] text-[#0e2a43] no-underline"
              >
                Global Bioenergy Watch
              </a>
              <div className="hidden text-xs leading-[1.25] text-[#7b8ea0] min-[1160px]:block">
                Policy, Markets, Sustainability
              </div>
            </div>
          </div>

          <nav aria-label="Page sections" className="hidden min-[1160px]:block">
            <div className="flex items-center gap-0.5">
              {SECTIONS.slice(0, 5).map((section, index) => (
                <a
                  key={section.href}
                  href={section.href}
                  className={`inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    index === 0
                      ? "bg-[#e3f4ee] text-[#178a6b]"
                      : "text-[#4c6278] hover:bg-[#eef3f7] hover:text-[#0e2a43]"
                  }`}
                >
                  {section.label}
                </a>
              ))}
              <AboutMenu />
            </div>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => rescan.mutate()}
              disabled={busy}
              aria-label="Rescan feeds"
              className="hidden h-9 items-center justify-center gap-2 rounded-[9px] border border-[#d6e1ea] bg-white px-3 text-sm font-semibold text-[#0e2a43] transition-colors hover:border-[#178a6b] disabled:opacity-60 min-[561px]:inline-flex min-[621px]:px-3.5 min-[1160px]:min-w-[120px]"
            >
              <RefreshCw className={`size-3.5 ${busy ? "animate-spin" : ""}`} />
              <span className="hidden min-[621px]:inline">Rescan</span>
            </button>
            <div className="[&_a]:grid [&_a]:size-10 [&_a]:place-items-center [&_a]:rounded-full [&_a]:border [&_a]:border-[#d6e1ea] [&_a]:bg-[#e3f4ee] [&_a]:p-0 [&_a]:text-[#178a6b] [&_a]:shadow-none [&_a]:hover:border-[#178a6b] [&_a_.auth-label]:sr-only [&_a_svg]:size-4 [&_button]:grid [&_button]:size-10 [&_button]:place-items-center [&_button]:rounded-full [&_button]:border [&_button]:border-[#d6e1ea] [&_button]:bg-[#e3f4ee] [&_button]:p-0 [&_button]:text-[#178a6b] [&_button]:shadow-none [&_button]:hover:border-[#178a6b] [&_button_span]:hidden [&>div>span]:hidden">
              <AuthButton />
            </div>
            <button
              type="button"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((open) => !open)}
              className="grid size-10 place-items-center rounded-[10px] border border-[#d6e1ea] bg-white text-[#0e2a43] min-[1160px]:hidden"
            >
              {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        <nav
          aria-label="Mobile page sections"
          className={`absolute top-full right-0 left-0 z-50 border-b border-[#d6e1ea] bg-white px-5 pt-2 pb-4 shadow-[0_24px_40px_-28px_rgba(14,42,67,.5)] transition-all duration-200 min-[1160px]:hidden ${
            mobileNavOpen
              ? "visible translate-y-0 opacity-100"
              : "invisible pointer-events-none -translate-y-2 opacity-0"
          }`}
        >
          {SECTIONS.map((section, index) => (
            <a
              key={section.href}
              href={section.href}
              onClick={() => setMobileNavOpen(false)}
              className={`block border-b border-[#d6e1ea] px-1 py-3 font-medium no-underline ${index === 0 ? "text-[#178a6b]" : "text-[#0e2a43]"}`}
            >
              {section.label}
            </a>
          ))}
          <Link
            to="/ci-calculator"
            onClick={() => setMobileNavOpen(false)}
            className="block border-b border-[#d6e1ea] px-1 py-3 font-medium text-[#0e2a43] no-underline"
          >
            CI calculator
          </Link>
          <Link
            to="/videos"
            onClick={() => setMobileNavOpen(false)}
            className="block border-b border-[#d6e1ea] px-1 py-3 font-medium text-[#0e2a43] no-underline"
          >
            Videos
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileNavOpen(false)}
            className="block border-b border-[#d6e1ea] px-1 py-3 font-medium text-[#0e2a43] no-underline"
          >
            About us
          </Link>
          <Link
            to="/about/mission-vision"
            onClick={() => setMobileNavOpen(false)}
            className="block border-b border-[#d6e1ea] px-1 py-3 font-medium text-[#0e2a43] no-underline"
          >
            Mission &amp; vision
          </Link>
          <Link
            to="/about/team"
            onClick={() => setMobileNavOpen(false)}
            className="block border-b border-[#d6e1ea] px-1 py-3 font-medium text-[#0e2a43] no-underline"
          >
            Team members
          </Link>
          <button
            type="button"
            onClick={() => {
              setMobileNavOpen(false);
              rescan.mutate();
            }}
            disabled={busy}
            className="mt-2 hidden w-full items-center justify-center gap-2 rounded-[9px] border border-[#d6e1ea] bg-white px-3 py-2.5 text-sm font-medium text-[#4c6278] disabled:opacity-60 max-[560px]:flex"
          >
            <RefreshCw className={`size-3.5 ${busy ? "animate-spin" : ""}`} />
            Rescan sources
          </button>
        </nav>
      </header>

      <LiveMarquee />

      <HomeHero updates={topFive} stats={stats} />
      <LatestUpdatesSection updates={topFive} />

      <div className="mx-auto max-w-[80rem] px-5 py-8 lg:px-8 lg:py-10">
        <main className="space-y-8">
          {data.error && (
            <p className="glass-panel border-l-4 border-l-destructive p-4 text-sm text-muted-foreground">
              Live scan issue: {data.error}
            </p>
          )}

          <section id="markets" className="reveal">
            <SectionHeading
              tone="var(--chart-2)"
              kicker="Markets"
              icon={TrendingUp}
              title="Real time Crude Oil price, S&P 500 Index and Natural Gas Price"
              subtitle="Live benchmark markets that move biofuel economics — 30-day trend, daily change and last close for each."
            />
            <OilPricePanel />
          </section>

          <section id="map" className="reveal pt-4">
            <SectionHeading
              tone="var(--chart-3)"
              kicker="Jurisdiction map"
              icon={Map}
              title="Policy activity by jurisdiction"
              subtitle="Government mandates and market moves side by side — including jurisdictions still developing their frameworks. Click any country to open its full profile."
              singleLine
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

          <section id="production" className="reveal pt-4">
            <SectionHeading
              tone="var(--chart-6)"
              kicker="Supply & producers"
              icon={Factory}
              title="Global Biofuel Suppliers and Users"
              subtitle="Pick a dataset to open its full workspace — heat map, scatter plot, ranked bars or data table, with per-entity detail."
            />
            <SupplyProducersSection isRefreshing={busy} />
          </section>

          <section id="jobs" className="reveal pt-4">
            <SectionHeading
              tone="var(--chart-7)"
              kicker="Careers"
              icon={Briefcase}
              title="Biofuel and bioenergy jobs"
              subtitle="Live openings across biorefineries, policy teams, trading desks and R&D labs — refined by function, seniority and region."
            />
            <JobsPanel compact />
          </section>

          <div className="reveal pt-4">
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

          <div className="">
            <TrafficPanel />
          </div>

          <section id="disclaimer" className="reveal">
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
                  className="glass-panel card-motion border-t-4 p-5"
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
        </main>

        <footer className="space-y-3 border-t border-border pt-6 pb-10">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-foreground">
            <a
              href="https://www.linkedin.com/company/global-bioenergy-watch/?viewAsMember=true"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-primary"
            >
              <Linkedin className="size-4 fill-current" />
              Contact us
            </a>
            <span className="text-muted-foreground">·</span>
            <Link to="/terms" className="underline underline-offset-4 hover:text-primary">
              Terms of Use
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/privacy" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/mandates" className="underline underline-offset-4 hover:text-primary">
              Mandate tracker
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
