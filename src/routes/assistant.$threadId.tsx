import { lazy, Suspense } from "react";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";

const AssistantWorkspace = lazy(() =>
  import("@/features/assistant/components/AssistantWorkspace").then((module) => ({
    default: module.AssistantWorkspace,
  })),
);

export const Route = createFileRoute("/assistant/$threadId")({
  head: () => ({
    meta: [
      { title: "Conversation — Watch Assistant | Global Bioenergy Watch" },
      {
        name: "description",
        content:
          "A saved conversation with the Global Bioenergy Watch AI analyst covering biofuel mandates, policy updates and producer data.",
      },
      { property: "og:title", content: "Watch Assistant conversation" },
      {
        property: "og:description",
        content: "Saved AI analyst conversation on global bioenergy policy and markets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  return (
    <ClientOnly fallback={<AssistantLoading />}>
      <Suspense fallback={<AssistantLoading />}>
        <AssistantWorkspace threadIdFromRoute={threadId} />
      </Suspense>
    </ClientOnly>
  );
}

function AssistantLoading() {
  return <main className="min-h-screen bg-background" aria-label="Loading Watch Assistant" />;
}
