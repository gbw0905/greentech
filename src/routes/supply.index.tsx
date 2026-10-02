import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MotionReveal } from "@/components/MotionReveal";
import { LiveMarquee } from "@/features/markets/components/LiveMarquee";
import { SupplyDirectory } from "@/features/supply/components/SupplyDirectory";
import { feedQueryWithInitial, loadFeed } from "@/features/policy/feed-query";

const TITLE = "Global Biofuel Suppliers and Users";
const DESCRIPTION =
  "Track the companies, producers, and users driving the bioenergy value chain — from feedstock and fuel stations to blending, shipping, and bioproducts.";

export const Route = createFileRoute("/supply/")({
  loader: () => loadFeed(),
  head: () => ({
    meta: [
      { title: `${TITLE} | Global Bioenergy Watch` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "https://globalbioenergywatch.org/supply/" },
    ],
    links: [{ rel: "canonical", href: "https://globalbioenergywatch.org/supply/" }],
  }),
  component: SupplyDirectoryPage,
});

function SupplyDirectoryPage() {
  const { feed: initialFeed } = Route.useLoaderData();
  useQuery(feedQueryWithInitial(initialFeed));

  return (
    <div className="supply-directory-page">
      <LiveMarquee />
      <main className="supply-directory-main">
        <MotionReveal as="header" className="supply-directory-heading">
          <span className="supply-directory-kicker">Supply &amp; producers</span>
          <h1>{TITLE}</h1>
          <p>{DESCRIPTION}</p>
        </MotionReveal>
        <SupplyDirectory />
      </main>
    </div>
  );
}
