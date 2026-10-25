import { createFileRoute } from "@tanstack/react-router";
import { JobsPanel } from "@/features/jobs/components/JobsPanel";
import { JOB_BOARDS } from "@/features/jobs/data";
import { JobsHero } from "@/features/jobs/components/JobsHero";
import { useVisitTracker } from "@/features/traffic/hooks/useVisitTracker";

const TITLE = "Biofuel & bioenergy jobs | Global Bioenergy Watch";
const DESCRIPTION =
  "Bioenergy careers desk: search trusted job boards by function, seniority and region for opportunities across ethanol, biodiesel, renewable diesel, SAF and biogas.";
const URL = "https://globalbioenergywatch.org/jobs";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: TITLE,
          description: DESCRIPTION,
          url: URL,
          isPartOf: {
            "@type": "WebSite",
            name: "Global Bioenergy Watch",
            url: "https://globalbioenergywatch.org",
          },
          mainEntity: {
            "@type": "ItemList",
            name: "Trusted biofuel and bioenergy job sources",
            numberOfItems: JOB_BOARDS.length,
            itemListElement: JOB_BOARDS.map((board, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Organization",
                name: board.name,
                url: `https://${board.domain}`,
              },
            })),
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://globalbioenergywatch.org/",
            },
            { "@type": "ListItem", position: 2, name: "Jobs", item: URL },
          ],
        }),
      },
    ],
  }),
  component: JobsPage,
});

function JobsPage() {
  useVisitTracker();
  return (
    <div className="jobs-page">
      <main className="jobs-main">
        <JobsHero />
        <JobsPanel />
      </main>
    </div>
  );
}
