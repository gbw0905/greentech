import { createFileRoute } from "@tanstack/react-router";
import { countryBySlug } from "@/features/policy/taxonomy";
import { CountryPolicyPage } from "@/features/countries/components/CountryPolicyPage";
import { useVisitTracker } from "@/features/traffic/hooks/useVisitTracker";
export const Route = createFileRoute("/countries/$slug/mandates")({
  head: ({ params }) => {
    const name = countryBySlug(params.slug)?.name ?? "Country";
    const title = `${name} Biofuel Mandates & Targets | Global Bioenergy Watch`;
    const description = `Active ${name} biofuel mandates: blending obligations, milestone timelines, compliance requirements and official government sources.`;
    const url = `https://globalbioenergywatch.org/countries/${params.slug}/mandates`;
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
  component: CountryMandatesPage,
});

function CountryMandatesPage() {
  useVisitTracker();
  const { slug } = Route.useParams();
  const country = countryBySlug(slug);
  if (!country) return null;
  return <CountryPolicyPage country={country} focusSection="mandates" />;
}
