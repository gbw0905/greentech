import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { countryBySlug } from "@/lib/policy-taxonomy";
import { CountryProfileHeader } from "@/components/CountryProfileHeader";
import { MandateDetailCard } from "@/components/MandateDetailCard";
import { governmentSitesForCountry, mandatesForCountry } from "@/lib/mandates";
import { useVisitTracker } from "@/hooks/useVisitTracker";

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
  const country = countryBySlug(slug)!;
  const trackedMandates = mandatesForCountry(slug);
  const govSites = governmentSitesForCountry(slug);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <CountryProfileHeader country={country} compact />

      <section className="mt-8">
        <h2 className="label-mono text-muted-foreground">
          Mandates &amp; targets
          {trackedMandates.length > 0 &&
            ` · ${trackedMandates.length} tracked obligation${trackedMandates.length === 1 ? "" : "s"}`}
        </h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {country.mandates.map((m) => (
            <div key={m.label} className="glass-panel lift p-4">
              <dt className="label-mono text-muted-foreground">{m.label}</dt>
              <dd className="mt-1 font-mono text-sm text-foreground">{m.value}</dd>
            </div>
          ))}
        </dl>
        {trackedMandates.length > 0 ? (
          <div className="mt-5 space-y-5">
            {trackedMandates.map((m) => (
              <MandateDetailCard key={m.id} mandate={m} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No enforceable blending obligation is tracked for {country.name} yet — the summary above
            reflects published targets and policy statements.
          </p>
        )}
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
