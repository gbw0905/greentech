import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { countryBySlug } from "@/lib/policy-taxonomy";
import { CountryProfileHeader } from "@/components/CountryProfileHeader";
import { MandateDetailCard } from "@/components/MandateDetailCard";
import { governmentSitesForCountry, mandatesForCountry } from "@/lib/mandates";
import { useVisitTracker } from "@/hooks/useVisitTracker";
import { CountryTrackingStrip } from "@/components/CountryTrackingStrip";

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
  const trackedMandates = mandatesForCountry(slug);
  const govSites = governmentSitesForCountry(slug);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <CountryProfileHeader country={country} compact />
      <div className="mt-5"><CountryTrackingStrip mandates={trackedMandates.length} targets={country.mandates.length} sources={govSites.length} /></div>

      <div className="mt-6 grid overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)] lg:grid-cols-12">
      <section className="p-5 sm:p-6 lg:col-span-8 lg:border-r lg:border-border">
        <p className="label-mono text-muted-foreground">Mandate register</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold">Requirements, timelines &amp; compliance</h2>
        <p className="mt-2 max-w-3xl text-sm/relaxed text-muted-foreground">Each obligation is tied to its administering authority and primary published source.</p>
        <dl className="mt-4 grid overflow-hidden border border-border sm:grid-cols-2">
          {country.mandates.map((m) => (
            <div key={m.label} className="border-b border-border p-4 last:border-b-0 sm:odd:border-r">
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
        <aside className="h-fit overflow-hidden bg-ink text-ink-foreground lg:col-span-4 lg:sticky lg:top-5">
          <div className="border-b border-ink-foreground/15 px-5 py-4"><p className="label-mono text-ink-muted">Evidence library</p><h2 className="mt-1 font-display text-lg font-bold">Government &amp; regulator sources</h2></div>
          <ul className="divide-y divide-ink-foreground/10 p-2">
            {govSites.map((s) => (
              <li key={s.url} className="min-w-0">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full min-w-0 items-center justify-between gap-3 rounded-md p-3 text-sm text-ink-foreground transition-colors hover:bg-ink-foreground/10"
                >
                  <span className="min-w-0 truncate">{s.label}</span>
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
      </div>
    </main>
  );
}
