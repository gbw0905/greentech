import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { feedQueryWithInitial, loadFeed } from "@/lib/feed-query";
import {
  countryBySlug,
  REGION_ACCENT,
  flagFor,
  policyStatusFor,
  POLICY_STATUS_COLOR,
} from "@/lib/policy-taxonomy";
import { UpdateCard } from "@/components/UpdateCard";
import { useVisitTracker } from "@/hooks/useVisitTracker";


export const Route = createFileRoute("/countries/$slug")({
  beforeLoad: ({ params }) => {
    if (!countryBySlug(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const country = countryBySlug(params.slug);
    const title = `${country?.name ?? "Country"} Bioenergy Policy Profile | Global Bioenergy Watch`;
    const description = `Mandates, blending targets and the latest bioenergy policy updates for ${country?.name ?? "this market"}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
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
          <span aria-hidden>{flagFor(country.slug)}</span>
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
        <h2 className="label-mono text-muted-foreground">Mandates &amp; targets</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {country.mandates.map((m) => (
            <div key={m.label} className="glass-panel lift p-4">
              <dt className="label-mono text-muted-foreground">{m.label}</dt>
              <dd className="mt-1 font-mono text-sm text-foreground">{m.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="label-mono text-muted-foreground">
          Live updates · {updates.length} matched
        </h2>
        <div className="mt-4 space-y-3">
          {updates.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {isFetching
                ? "Scanning global sources…"
                : "No recent items matched this jurisdiction in the current scan window."}
            </p>
          )}
          {updates.map((u) => (
            <UpdateCard key={u.id} update={u} />
          ))}
        </div>
      </section>
    </main>
  );
}