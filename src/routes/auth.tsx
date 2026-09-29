import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/features/auth/components/AuthPage";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Global Bioenergy Watch" },
      {
        name: "description",
        content:
          "Sign in to Global Bioenergy Watch to export chart data as CSV and receive AI-written analyst summaries by email.",
      },
      { property: "og:title", content: "Sign in — Global Bioenergy Watch" },
      {
        property: "og:description",
        content: "Account access for CSV exports and emailed bioenergy analyst summaries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});
