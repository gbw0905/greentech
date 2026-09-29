import { createFileRoute } from "@tanstack/react-router";
import { GetAlertsPage } from "@/features/alerts/components/GetAlertsPage";

const TITLE = "Free Bioenergy Policy Alerts | Global Bioenergy Watch";
const DESCRIPTION =
  "Get a free daily email digest of biofuel policy and market updates — SAF, ethanol, biodiesel and renewable diesel mandates tracked across governments worldwide.";

export const Route = createFileRoute("/get-alerts")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "https://globalbioenergywatch.org/get-alerts" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://globalbioenergywatch.org/get-alerts" }],
  }),
  component: GetAlertsPage,
});
