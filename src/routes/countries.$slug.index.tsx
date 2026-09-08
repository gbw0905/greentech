import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink, FileText, Layers, Newspaper } from "lucide-react";
import { countryBySlug } from "@/lib/policy-taxonomy";
import { CountryProfileHeader } from "@/components/CountryProfileHeader";
import { governmentSitesForCountry, mandatesForCountry } from "@/lib/mandates";
import { useVisitTracker } from "@/hooks/useVisitTracker";
import { CountryTrackingStrip } from "@/components/CountryTrackingStrip";

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
  const country = countryBySlug(slug);
  if (!country) return null;
  const trackedMandates = mandatesForCountry(slug);
  const govSites = governmentSitesForCountry(slug);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <CountryProfileHeader country={country} />
      <div className="mt-5">
        <CountryTrackingStrip mandates={trackedMandates.length} targets={country.mandates.length} sources={govSites.length} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <div className="space-y-6">
          <section className="border-b border-border pb-6">
            <p className="label-mono text-muted-foreground">Policy briefing</p>
            <p className="mt-3 max-w-3xl text-base/relaxed text-foreground">{country.blurb}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {country.frameworks.map((f) => (
                <span key={f} className="label-mono rounded-md border border-tracker-green/30 bg-tracker-green/10 px-2.5 py-1 text-tracker-green">{f}</span>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="label-mono text-muted-foreground">Current policy markers</p>
                <h2 className="mt-1 font-display text-xl font-extrabold">Targets at a glance</h2>
              </div>
              <Link to="/countries/$slug/mandates" params={{ slug }} className="label-mono inline-flex shrink-0 items-center gap-1.5 font-bold text-primary hover:underline">Full detail <ArrowRight className="size-3.5" /></Link>
            </div>
            <dl className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
          {country.mandates.map((m) => (
            <div key={m.label} className="grid gap-1 p-4 transition-colors hover:bg-surface-1 sm:grid-cols-[minmax(10rem,0.7fr)_1.3fr] sm:items-center">
              <dt className="label-mono font-bold text-muted-foreground">{m.label}</dt>
              <dd className="font-mono text-sm font-semibold text-foreground">{m.value}</dd>
            </div>
          ))}
            </dl>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="overflow-hidden rounded-lg bg-ink text-ink-foreground shadow-[var(--shadow-lift)]">
            <div className="border-b border-ink-foreground/15 px-5 py-4">
              <p className="label-mono text-ink-muted">Verified evidence</p>
              <h2 className="mt-1 font-display text-lg font-bold">Official sources</h2>
            </div>
            <ul className="divide-y divide-ink-foreground/10 px-2 py-2">
            {govSites.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 items-center justify-between gap-3 rounded-md px-3 py-3 text-sm text-ink-foreground transition-colors hover:bg-ink-foreground/10"
                >
                  <span className="min-w-0 truncate">{s.label}</span>
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              </li>
            ))}
            </ul>
          </section>

          <nav className="space-y-2" aria-label="Country tracking shortcuts">
            <Link to="/countries/$slug/mandates" params={{ slug }} className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5">
              <span className="grid size-9 place-items-center rounded-md bg-tracker-blue/10 text-tracker-blue"><Layers className="size-4" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold">Mandates &amp; targets</span><span className="block text-xs text-muted-foreground">Timeline and compliance</span></span>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary" />
            </Link>
            <Link to="/countries/$slug/updates" params={{ slug }} className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5">
              <span className="grid size-9 place-items-center rounded-md bg-destructive/10 text-destructive"><Newspaper className="size-4" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold">Live updates</span><span className="block text-xs text-muted-foreground">Calendar-filtered changes</span></span>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary" />
            </Link>
          </nav>

          <div className="flex items-start gap-3 border-t border-border pt-4 text-xs/relaxed text-muted-foreground">
            <FileText className="mt-0.5 size-4 shrink-0 text-tracker-red" />
            Information is compiled from the linked government records and reviewed against published timelines.
          </div>
        </aside>
      </div>
    </main>
  );
}
