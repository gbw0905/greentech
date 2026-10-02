import type { ReactNode } from "react";
import { useMatches, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { IntelligenceFooter } from "@/components/IntelligenceFooter";
import { feedQueryWithInitial } from "@/features/policy/feed-query";
import type { PolicyFeed } from "@/features/policy/contracts";
import { refreshPolicyFeed } from "@/features/policy/server-functions";

export function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const matches = useMatches();
  // Seed the shared query with the existing route loader's feed before child components render.
  const loader = matches.find((match) => match.routeId === "/" || match.routeId === "/supply/")
    ?.loaderData as { feed: PolicyFeed | null } | undefined;
  const { isFetching } = useQuery(feedQueryWithInitial(loader?.feed ?? null));
  const queryClient = useQueryClient();
  const rescan = useMutation({
    mutationFn: () => refreshPolicyFeed(),
    onSuccess: (fresh) => queryClient.setQueryData(["policy-feed"], fresh),
  });

  return (
    <div id="top" className="flex min-h-screen flex-col">
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
        busy={isFetching || rescan.isPending}
        onRescan={() => rescan.mutate()}
      />
      {rescan.isError && (
        <p role="alert" className="supply-rescan-error mx-auto w-full max-w-[1240px] px-5 py-3">
          The feed could not be refreshed. Please try Rescan again.
        </p>
      )}
      <div className="flex-1">{children}</div>
      <IntelligenceFooter />
    </div>
  );
}
