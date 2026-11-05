import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/document-explain")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleExplainSelection } =
          await import("@/features/documents/server/explain-selection.server");
        return handleExplainSelection(request);
      },
    },
  },
});
