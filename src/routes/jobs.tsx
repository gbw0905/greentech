import { createFileRoute } from "@tanstack/react-router";
import { JobsPanel } from "@/features/jobs/components/JobsPanel";
import { EMPLOYERS } from "@/features/jobs/data";
import { JobsHero } from "@/features/jobs/components/JobsHero";
import { LiveMarquee } from "@/features/markets/components/LiveMarquee";
import { useVisitTracker } from "@/features/traffic/hooks/useVisitTracker";

const TITLE = "Biofuel & bioenergy jobs | Global Bioenergy Watch";
const DESCRIPTION =
  "Bioenergy careers desk: live job searches by fuel and function, major biofuel employers hiring worldwide, and workforce news across ethanol, biodiesel, renewable diesel, SAF and biogas.";
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
            name: "Biofuel and bioenergy employers hiring worldwide",
            numberOfItems: EMPLOYERS.length,
            itemListElement: EMPLOYERS.map((e, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Organization",
                name: e.name,
                url: e.careers,
                address: { "@type": "PostalAddress", addressCountry: e.hq },
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
      <LiveMarquee />
      <main className="jobs-main">
        <JobsHero />
        <JobsPanel />
      </main>
    </div>
  );
}
