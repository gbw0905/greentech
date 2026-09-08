import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Layers, Newspaper } from "lucide-react";
import { countryBySlug } from "@/lib/policy-taxonomy";
import { CountryProfileHeader } from "@/components/CountryProfileHeader";
import { governmentSitesForCountry, mandatesForCountry } from "@/lib/mandates";
import { useVisitTracker } from "@/hooks/useVisitTracker";

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
    const keywords = Array.from(
      new Set([...(country?.updateKeywords ?? []), ...frameworks]),
    ).slice(0, 10);
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
  const country = countryBySlug(slug)!;
  const trackedMandates = mandatesForCountry(slug);
  const govSites = governmentSitesForCountry(slug);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <CountryProfileHeader country={country} />

      <p className="mt-6 max-w-2xl text-base/relaxed text-muted-foreground">{country.blurb}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {country.frameworks.map((f) => (
          <span key={f} className="label-mono rounded-md border border-border bg-surface-1 px-2.5 py-1">
            {f}
          </span>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          to="/countries/$slug/mandates"
          params={{ slug }}
          className="glass-panel lift block p-5"
        >
          <span className="label-mono inline-flex items-center gap-1.5 text-muted-foreground">
            <Layers className="size-3.5" /> Mandates &amp; targets
          </span>
          <h2 className="mt-2 font-display text-xl font-bold">
            {trackedMandates.length > 0
              ? `${trackedMandates.length} tracked obligation${trackedMandates.length === 1 ? "" : "s"}`
              : "Published targets"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Timelines, requirements, compliance status and official government sources.
          </p>
        </Link>

        <Link to="/countries/$slug/updates" params={{ slug }} className="glass-panel lift block p-5">
          <span className="label-mono inline-flex items-center gap-1.5 text-muted-foreground">
            <Newspaper className="size-3.5" /> Live updates
          </span>
          <h2 className="mt-2 font-display text-xl font-bold">Policy &amp; market news</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Grouped by mandate, with a calendar date range to track changes over time.
          </p>
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="label-mono text-muted-foreground">Targets at a glance</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {country.mandates.map((m) => (
            <div key={m.label} className="glass-panel lift p-4">
              <dt className="label-mono text-muted-foreground">{m.label}</dt>
              <dd className="mt-1 font-mono text-sm text-foreground">{m.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {govSites.length > 0 && (
        <section className="mt-10">
          <h2 className="label-mono text-muted-foreground">
            Government &amp; regulator sources · {govSites.length}
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {govSites.map((s) => (
              <li key={s.url} className="min-w-0">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-panel lift flex w-full min-w-0 items-center justify-between gap-3 p-3 text-sm text-foreground hover:text-primary"
                >
                  <span className="min-w-0 truncate">{s.label}</span>
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
