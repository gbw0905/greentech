import "@/features/home/HomePage.css";
import { loadNavigationFeed } from "@/features/policy/navigation-feed";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { feedQueryWithInitial } from "@/features/policy/feed-query";
import { PolicyMapSection } from "@/features/countries/components/PolicyMapSection";
import { ProgramRibbon } from "@/features/home/components/ProgramRibbon";

import { OilPricePanel } from "@/features/markets/components/OilPricePanel";
import { getOilPricesFn } from "@/features/markets/oil-server-functions";

import { useVisitTracker } from "@/features/traffic/hooks/useVisitTracker";
import { IndustryCarousel } from "@/features/home/components/IndustryCarousel";
import { IntelligenceSection } from "@/components/IntelligenceSection";
import { getErrorMessage } from "@/shared/errors";
import { HomeHero } from "@/features/home/components/HomeHero";
import { LatestUpdatesSection } from "@/features/home/components/LatestUpdatesSection";
import { getHomeStats, homeStatsQuery } from "@/features/home/home-stats";
import {
  BIOENERGY_MARKET_VALUE_BASELINE,
  bioenergyMarketValueQuery,
} from "@/features/home/bioenergy-market-value";

const TITLE = "Global Bioenergy Watch | Worldwide Biofuel Policy Tracker";

const DESCRIPTION =
  "Live tracker of global bioenergy and biofuel policy: ethanol, biodiesel, renewable diesel and SAF mandates by region, country and fuel type.";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const [{ feed }, market] = await Promise.all([
      loadNavigationFeed(context.queryClient),
      getOilPricesFn().catch(() => null),
    ]);
    // The first feed load can populate an empty archive; count after it completes.
    const stats = await getHomeStats().catch(() => null);
    // The annual report can take six seconds. Refresh it after hydration, not before first paint.
    return { feed, market, stats, marketValue: BIOENERGY_MARKET_VALUE_BASELINE };
  },
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

function Dashboard() {
  useVisitTracker();
  const {
    feed: initialFeed,
    market: initialMarket,
    stats: initialStats,
    marketValue: initialMarketValue,
  } = Route.useLoaderData();
  const { data: feed } = useQuery(feedQueryWithInitial(initialFeed));
  const { data: stats } = useQuery(
    initialStats ? { ...homeStatsQuery, initialData: initialStats } : homeStatsQuery,
  );
  const { data: marketValue } = useQuery(
    initialMarketValue
      ? { ...bioenergyMarketValueQuery, initialData: initialMarketValue, initialDataUpdatedAt: 0 }
      : bioenergyMarketValueQuery,
  );
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

  const topFive = useMemo(() => data.updates.slice(0, 5), [data.updates]);

  return (
    <main>
      <HomeHero stats={stats ?? null} marketValue={marketValue ?? null} />

      <section id="markets" className="benchmark-section" aria-labelledby="markets-title">
        <OilPricePanel initialMarket={initialMarket} />
      </section>

      <ProgramRibbon />
      <PolicyMapSection counts={counts} />

      <LatestUpdatesSection updates={topFive} />

      {data.error && (
        <div className="mx-auto max-w-[80rem] px-5 py-8 lg:px-8 lg:py-10">
          <p className="glass-panel border-l-4 border-l-destructive p-4 text-sm text-muted-foreground">
            Live scan issue: {data.error}
          </p>
        </div>
      )}
      <IndustryCarousel />
      <IntelligenceSection />
    </main>
  );
}
