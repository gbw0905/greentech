import { createFileRoute } from "@tanstack/react-router";
import { countryBySlug } from "@/features/policy/taxonomy";
import { CountryPolicyPage } from "@/features/countries/components/CountryPolicyPage";
import { useVisitTracker } from "@/features/traffic/hooks/useVisitTracker";
import { loadNavigationFeed } from "@/features/policy/navigation-feed";
export const Route = createFileRoute("/countries/$slug/updates")({
  loader: ({ context }) => loadNavigationFeed(context.queryClient),
  head: ({ params }) => {
    const name = countryBySlug(params.slug)?.name ?? "Country";
    const title = `${name} Bioenergy Policy Updates | Global Bioenergy Watch`;
    const description = `Live ${name} biofuel and bioenergy policy and market updates, grouped by mandate and filterable by date range.`;
    const url = `https://globalbioenergywatch.org/countries/${params.slug}/updates`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: CountryUpdatesPage,
});

function CountryUpdatesPage() {
  useVisitTracker();
  const { slug } = Route.useParams();
  const country = countryBySlug(slug);
  const { feed: initialFeed } = Route.useLoaderData();
  if (!country) return null;
  return <CountryPolicyPage country={country} focusSection="updates" initialFeed={initialFeed} />;
}
