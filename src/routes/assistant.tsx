import { lazy, Suspense } from "react";
import { ClientOnly, createFileRoute, Outlet, useMatches } from "@tanstack/react-router";

const AssistantWorkspace = lazy(() =>
  import("@/features/assistant/components/AssistantWorkspace").then((module) => ({
    default: module.AssistantWorkspace,
  })),
);

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "Watch Assistant — AI Bioenergy Policy & Market Analyst" },
      {
        name: "description",
        content:
          "Ask the Global Bioenergy Watch assistant about biofuel mandates, government policy updates, producers and market data, with links to the tracked sources.",
      },
      { property: "og:title", content: "Watch Assistant — AI Bioenergy Policy Analyst" },
      {
        property: "og:description",
        content:
          "Chat with an AI analyst about global biofuel mandates, policy updates and producer datasets tracked by Global Bioenergy Watch.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssistantIndex,
});

function AssistantIndex() {
  const matches = useMatches();
  const hasChild = matches.some((m) => m.routeId === "/assistant/$threadId");
  if (hasChild) return <Outlet />;
  return (
    <ClientOnly fallback={<AssistantLoading />}>
      <Suspense fallback={<AssistantLoading />}>
        <AssistantWorkspace threadIdFromRoute={null} />
      </Suspense>
    </ClientOnly>
  );
}

function AssistantLoading() {
  return <main className="min-h-screen bg-background" aria-label="Loading Watch Assistant" />;
}
