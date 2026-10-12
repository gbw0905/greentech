import { createFileRoute } from "@tanstack/react-router";
import { countryBySlug } from "@/features/policy/taxonomy";
import { CountryPolicyPage } from "@/features/countries/components/CountryPolicyPage";
import { useVisitTracker } from "@/features/traffic/hooks/useVisitTracker";
export const Route = createFileRoute("/countries/$slug/")({
  head: ({ params }) => {
    const country = countryBySlug(params.slug);
    const name = country?.name ?? "Country";
    const frameworks = country?.frameworks ?? [];
    const headline = frameworks.slice(0, 3).join(", ");
    const title = headline
      ? `${name} Biofuel Policy — ${headline} | Global Bioenergy Watch`
      : `${name} Biofuel Policy | Global Bioenergy Watch`;
    const description = frameworks.length
      ? `Latest ${name} biofuel and bioenergy policy updates: ${frameworks.join(", ")}. Mandates, blending targets and market news, tracked daily by Global Bioenergy Watch.`
      : `Mandates, blending targets and the latest bioenergy policy updates for ${name}.`;
    const url = `https://globalbioenergywatch.org/countries/${params.slug}`;
    const keywords = Array.from(new Set([...(country?.updateKeywords ?? []), ...frameworks])).slice(
      0,
      10,
    );
    return {
      meta: [
        { title },
        { name: "description", content: description },
        {
          name: "keywords",
          content: [`${name} biofuel policy`, `${name} bioenergy`, ...keywords].join(", "),
        },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            description,
            url,
            about: { "@type": "Thing", name: `${name} biofuel and bioenergy policy` },
            keywords: keywords.join(", "),
            isPartOf: {
              "@type": "WebSite",
              name: "Global Bioenergy Watch",
              url: "https://globalbioenergywatch.org",
            },
          }),
        },
      ],
    };
  },
  component: CountryOverviewPage,
});

function CountryOverviewPage() {
  useVisitTracker();
  const { slug } = Route.useParams();
  const country = countryBySlug(slug);
  if (!country) return null;
  return <CountryPolicyPage country={country} focusSection="overview" />;
}
