import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { AlertTriangle, BellRing } from "lucide-react";
import { feedQueryWithInitial, loadFeed } from "@/features/policy/feed-query";
import { PolicyMapSection } from "@/features/countries/components/PolicyMapSection";

import { OilPricePanel } from "@/features/markets/components/OilPricePanel";
import { LiveMarquee } from "@/features/markets/components/LiveMarquee";

import { AlertSignup } from "@/features/alerts/components/AlertSignup";
import { TrafficPanel } from "@/features/traffic/components/TrafficPanel";
import { useVisitTracker } from "@/features/traffic/hooks/useVisitTracker";
import { MotionReveal } from "@/components/MotionReveal";
import { IndustryCarousel } from "@/features/home/components/IndustryCarousel";
import { IntelligenceSection } from "@/components/IntelligenceSection";
import { getErrorMessage } from "@/shared/errors";
import { HomeHero } from "@/features/home/components/HomeHero";
import { LatestUpdatesSection } from "@/features/home/components/LatestUpdatesSection";

const TITLE = "Global Bioenergy Watch | Worldwide Biofuel Policy Tracker";

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
  useVisitTracker();
  const { feed: initialFeed } = Route.useLoaderData();
  const { data: feed } = useQuery(feedQueryWithInitial(initialFeed));
  const data = feed ?? {
    updates: [],
    fetchedAt: null as string | null,
    error: null as string | null,
  };

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
    <div>
      <LiveMarquee />

      <HomeHero updates={topFive} stats={stats} />
      <LatestUpdatesSection updates={topFive} />

      <section id="markets" className="benchmark-section" aria-labelledby="markets-title">
        <OilPricePanel />
      </section>

      <PolicyMapSection counts={counts} />

      <div className="mx-auto max-w-[80rem] px-5 py-8 lg:px-8 lg:py-10">
        <main className="space-y-8">
          {data.error && (
            <p className="glass-panel border-l-4 border-l-destructive p-4 text-sm text-muted-foreground">
              Live scan issue: {data.error}
            </p>
          )}

          <MotionReveal className="pt-4">
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
          </MotionReveal>

          <MotionReveal>
            <TrafficPanel />
          </MotionReveal>

          <MotionReveal as="section" id="disclaimer">
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
          </MotionReveal>
        </main>
      </div>
      <IndustryCarousel />
      <IntelligenceSection />
    </div>
  );
}
