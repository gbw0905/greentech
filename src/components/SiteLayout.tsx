import type { ReactNode } from "react";
import { useMatches, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageMotion } from "@/components/PageMotion";
import { PostHogPageviews } from "@/features/analytics/PostHogPageviews";
import { SiteHeader } from "@/components/SiteHeader";
import { IntelligenceFooter } from "@/components/IntelligenceFooter";
import { feedQueryWithInitial } from "@/features/policy/feed-query";
import type { PolicyFeed } from "@/features/policy/contracts";
import { LiveMarquee } from "@/features/markets/components/LiveMarquee";
import "./SiteLayout.css";

export function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const matches = useMatches();
  // Seed the shared query with the existing route loader's feed before child components render.
  const loader = matches.find((match) => match.routeId === "/" || match.routeId === "/supply/")
    ?.loaderData as
    | { feed: PolicyFeed | null; market?: Parameters<typeof LiveMarquee>[0]["initialMarket"] }
    | undefined;
  useQuery(feedQueryWithInitial(loader?.feed ?? null));

  return (
    <div
      data-home={pathname === "/" ? "true" : undefined}
      id="top"
      className="site-shell flex min-h-screen flex-col"
    >
      <PostHogPageviews />
      <div className="site-chrome">
        <SiteHeader
          activeSection={
            pathname.startsWith("/supply")
              ? "supply"
              : pathname === "/jobs"
                ? "jobs"
                : pathname === "/"
                  ? "markets"
                  : null
          }
        />
        <LiveMarquee initialMarket={loader?.market ?? null} />
      </div>
      <PageMotion pathname={pathname}>{children}</PageMotion>
      <IntelligenceFooter />
    </div>
  );
}
