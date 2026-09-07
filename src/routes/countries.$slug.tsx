import { CountryFlag } from "@/components/CountryFlag";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { feedQueryWithInitial, loadFeed } from "@/lib/feed-query";
import {
  countryBySlug,
  REGION_ACCENT,
  flagFor,
  policyStatusFor,
  POLICY_STATUS_COLOR,
} from "@/lib/policy-taxonomy";
import { UpdateCard } from "@/components/UpdateCard";
import { MandateDetailCard } from "@/components/MandateDetailCard";
import {
  mandatesForCountry,
  governmentSitesForCountry,
  updateMatchesMandate,
} from "@/lib/mandates";
import { useVisitTracker } from "@/hooks/useVisitTracker";


export const Route = createFileRoute("/countries/$slug")({
  beforeLoad: ({ params }) => {
    if (!countryBySlug(params.slug)) throw notFound();
  },
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
          content: [
            `${name} biofuel policy`,
            `${name} bioenergy`,
            ...keywords,
          ].join(", "),
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
            about: {
              "@type": "Thing",
              name: `${name} biofuel and bioenergy policy`,
            },
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
  loader: () => loadFeed(),
  component: CountryPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-sm text-destructive" role="alert">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-10 text-sm text-muted-foreground">Country profile not tracked yet.</div>
  ),
});

function CountryPage() {
  useVisitTracker();
  const { slug } = Route.useParams();
  const country = countryBySlug(slug)!;
  const { feed: initialFeed } = Route.useLoaderData();
  const { data, isFetching } = useQuery(feedQueryWithInitial(initialFeed));
  const trackedMandates = mandatesForCountry(slug);
  const keywords = (country.updateKeywords ?? []).map((k) => k.toLowerCase());
  const updates = (data?.updates ?? [])
    .filter((u) => {
      if (u.countrySlug === slug) return true;
      if (keywords.length === 0) return false;
      const text = ` ${`${u.title} ${u.summary ?? ""}`.toLowerCase()} `;
      return keywords.some((k) =>
        k.length <= 4 ? new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text) : text.includes(k),
      );
    })
    .sort((a, b) => {
      const aDate = a.publishedAt ?? a.createdAt;
      const bDate = b.publishedAt ?? b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  const govSites = governmentSitesForCountry(slug);
  const mandateGroups = trackedMandates.map((mandate) => ({
    mandate,
    items: updates.filter((u) => updateMatchesMandate(mandate, `${u.title} ${u.summary ?? ""}`)),
  }));
  const grouped = new Set(mandateGroups.flatMap((g) => g.items.map((u) => u.id)));
  const otherUpdates = updates.filter((u) => !grouped.has(u.id));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link to="/" className="label-mono inline-flex items-center gap-2 text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-3.5" /> Back to tracker
      </Link>

      <header className="rise mt-6 border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="label-mono" style={{ color: REGION_ACCENT[country.region] }}>
            {country.region}
          </span>
          <span
            className="label-mono inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5"
            style={{
              borderColor: POLICY_STATUS_COLOR[policyStatusFor(country)],
              color: POLICY_STATUS_COLOR[policyStatusFor(country)],
            }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ background: POLICY_STATUS_COLOR[policyStatusFor(country)] }}
            />
            {policyStatusFor(country)}
          </span>
        </div>
        <h1 className="mt-3 flex items-center gap-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          <CountryFlag slug={country.slug} />
          {country.name}
        </h1>
        <p className="mt-4 max-w-2xl text-base/relaxed text-muted-foreground">{country.blurb}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {country.frameworks.map((f) => (
            <span
              key={f}
              className="label-mono rounded-md border border-border bg-surface-1 px-2.5 py-1"
            >
              {f}
            </span>
          ))}
        </div>
      </header>

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
        {trackedMandates.length > 0 && (
          <div className="mt-5 space-y-5">
            {trackedMandates.map((m) => (
              <MandateDetailCard key={m.id} mandate={m} />
            ))}
          </div>
        )}
        {trackedMandates.length === 0 && (
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
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-panel lift flex items-center justify-between gap-3 p-3 text-sm text-foreground hover:text-primary"
                >
                  <span className="min-w-0 truncate">{s.label}</span>
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="label-mono text-muted-foreground">
          Live updates by mandate · {updates.length} matched
        </h2>
        {updates.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            {isFetching
              ? "Scanning global sources…"
              : "No recent items matched this jurisdiction in the current scan window."}
          </p>
        )}
        <div className="mt-4 space-y-8">
          {mandateGroups.map(({ mandate, items }) => (
            <div key={mandate.id}>
              <h3 className="font-display text-base font-extrabold tracking-tight">
                {mandate.instrument}
              </h3>
              <p className="label-mono mt-1 text-muted-foreground">
                {items.length} update{items.length === 1 ? "" : "s"}
              </p>
              <div className="mt-3 space-y-3">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No news items mention this obligation in the current scan window.
                  </p>
                ) : (
                  items.map((u) => <UpdateCard key={`${mandate.id}-${u.id}`} update={u} />)
                )}
              </div>
            </div>
          ))}

          {otherUpdates.length > 0 && (
            <div>
              <h3 className="font-display text-base font-extrabold tracking-tight">
                Other {country.name} bioenergy updates
              </h3>
              <p className="label-mono mt-1 text-muted-foreground">
                {otherUpdates.length} update{otherUpdates.length === 1 ? "" : "s"}
              </p>
              <div className="mt-3 space-y-3">
                {otherUpdates.map((u) => (
                  <UpdateCard key={u.id} update={u} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}