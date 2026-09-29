import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/document-analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleDocumentAnalysis } =
          await import("@/features/documents/server/handle-document-analysis.server");
        return handleDocumentAnalysis(request);
      },
    },
  },
});
