import "@/features/home/HomePage.css";
import { loadNavigationFeed } from "@/features/policy/navigation-feed";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { feedQueryWithInitial } from "@/features/policy/feed-query";
import { PolicyMapSection } from "@/features/countries/components/PolicyMapSection";

import { OilPricePanel } from "@/features/markets/components/OilPricePanel";
import { LiveMarquee } from "@/features/markets/components/LiveMarquee";

import { useVisitTracker } from "@/features/traffic/hooks/useVisitTracker";
import { IndustryCarousel } from "@/features/home/components/IndustryCarousel";
import { IntelligenceSection } from "@/components/IntelligenceSection";
import { getErrorMessage } from "@/shared/errors";
import { HomeHero } from "@/features/home/components/HomeHero";
import { LatestUpdatesSection } from "@/features/home/components/LatestUpdatesSection";

const TITLE = "Global Bioenergy Watch | Worldwide Biofuel Policy Tracker";

const DESCRIPTION =
  "Live tracker of global bioenergy and biofuel policy: ethanol, biodiesel, renewable diesel and SAF mandates by region, country and fuel type.";

export const Route = createFileRoute("/")({
  loader: ({ context }) => loadNavigationFeed(context.queryClient),
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

  const topFive = useMemo(() => data.updates.slice(0, 5), [data.updates]);

  return (
    <main>
      <LiveMarquee />

      <HomeHero stats={stats} />

      <section id="markets" className="benchmark-section" aria-labelledby="markets-title">
        <OilPricePanel />
      </section>

      <LatestUpdatesSection updates={topFive} />

      <PolicyMapSection counts={counts} />

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
