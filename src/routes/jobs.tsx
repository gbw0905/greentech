import { createFileRoute } from "@tanstack/react-router";
import { Briefcase } from "lucide-react";
import { JobsPanel } from "@/components/JobsPanel";
import { PageShell, PageHeading } from "@/components/PageShell";
import { useVisitTracker } from "@/hooks/useVisitTracker";

const TITLE = "Biofuel & bioenergy jobs | Global Bioenergy Watch";
const DESCRIPTION =
  "Bioenergy careers desk: live job searches by fuel and function, major biofuel employers hiring worldwide, and workforce news across ethanol, biodiesel, renewable diesel, SAF and biogas.";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://globalbioenergywatch.org/jobs" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://globalbioenergywatch.org/jobs" }],
  }),
  component: JobsPage,
});

function JobsPage() {
  useVisitTracker();
  return (
    <PageShell>
      <PageHeading
        icon={Briefcase}
        title="Bioenergy jobs desk"
        subtitle="Roles across biorefineries, policy teams, trading floors and R&D labs — refined by function, seniority and region."
      />
      <JobsPanel />
    </PageShell>
  );
}
