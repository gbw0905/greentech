import { createFileRoute } from "@tanstack/react-router";
import { DocumentAnalyzerPage } from "@/features/documents/components/DocumentAnalyzerPage";

export const Route = createFileRoute("/document-analyzer")({
  head: () => ({
    meta: [
      { title: "Document analyzer — Global Bioenergy Watch" },
      {
        name: "description",
        content:
          "Analyze PDF, Word, Excel, CSV, and text documents around selected topics using grounded AI summaries.",
      },
    ],
  }),
  component: DocumentAnalyzerPage,
});
