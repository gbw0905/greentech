import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import { AssistantWorkspace } from "@/components/assistant/AssistantWorkspace";

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
  return <AssistantWorkspace threadIdFromRoute={null} />;
}
