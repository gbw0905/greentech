import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { countryBySlug } from "@/lib/policy-taxonomy";
import { feedQueryWithInitial, loadFeed } from "@/lib/feed-query";
import { CountryProfileHeader } from "@/components/CountryProfileHeader";
import { UpdateCard } from "@/components/UpdateCard";
import { CalendarRangeFilter } from "@/components/CalendarRangeFilter";
import { EMPTY_RANGE, withinRange } from "@/components/DateRangeFilter";
import { mandatesForCountry, updateMatchesMandate } from "@/lib/mandates";
import { useVisitTracker } from "@/hooks/useVisitTracker";
import { Activity, CalendarDays, FileCheck2 } from "lucide-react";

export const Route = createFileRoute("/countries/$slug/updates")({
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
  loader: () => loadFeed(),
  component: CountryUpdatesPage,
});

function CountryUpdatesPage() {
  useVisitTracker();
  const { slug } = Route.useParams();
  const country = countryBySlug(slug);
  if (!country) return null;
  const { feed: initialFeed } = Route.useLoaderData();
  const { data, isFetching } = useQuery(feedQueryWithInitial(initialFeed));
  const [range, setRange] = useState(EMPTY_RANGE);

  const trackedMandates = mandatesForCountry(slug);
  const keywords = (country.updateKeywords ?? []).map((k) => k.toLowerCase());

  const updates = (data?.updates ?? [])
    .filter((u) => withinRange(u.publishedAt ?? u.createdAt, range))
    .filter((u) => {
      if (u.countrySlug === slug) return true;
      if (keywords.length === 0) return false;
      const text = ` ${`${u.title} ${u.summary ?? ""}`.toLowerCase()} `;
      return keywords.some((k) =>
        k.length <= 4
          ? new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text)
          : text.includes(k),
      );
    })
    .sort((a, b) => {
      const aDate = a.publishedAt ?? a.createdAt;
      const bDate = b.publishedAt ?? b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  const mandateGroups = trackedMandates.map((mandate) => ({
    mandate,
    items: updates.filter((u) => updateMatchesMandate(mandate, `${u.title} ${u.summary ?? ""}`)),
  }));
  const grouped = new Set(mandateGroups.flatMap((g) => g.items.map((u) => u.id)));
  const otherUpdates = updates.filter((u) => !grouped.has(u.id));

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <CountryProfileHeader country={country} compact />

      <section className="mt-5 overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
          <div>
            <p className="label-mono inline-flex items-center gap-1.5 text-muted-foreground"><Activity className="size-3.5 text-destructive" /> Live monitoring</p>
            <h2 className="mt-1 font-display text-xl font-extrabold">Updates by mandate</h2>
            <p className="mt-1 text-sm text-muted-foreground">{updates.length} matched item{updates.length === 1 ? "" : "s"} across {trackedMandates.length} tracked obligation{trackedMandates.length === 1 ? "" : "s"}.</p>
          </div>
          <CalendarRangeFilter value={range} onChange={setRange} />
        </div>
        <div className="flex items-center gap-2 border-t border-border bg-surface-1 px-4 py-2.5 text-xs text-muted-foreground sm:px-5"><CalendarDays className="size-3.5 text-tracker-blue" /> Select a preset or exact dates to review policy changes over time.</div>
      </section>

      <section>

        {updates.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            {isFetching
              ? "Scanning global sources…"
              : "No items matched this jurisdiction in the selected date range."}
          </p>
        )}

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-2">
          {mandateGroups.map(({ mandate, items }) => (
            <div key={mandate.id} className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-1 px-4 py-3 sm:px-5">
              <div><h3 className="font-display text-base font-extrabold">
                {mandate.instrument}
              </h3><p className="label-mono mt-1 text-muted-foreground">
                {items.length} update{items.length === 1 ? "" : "s"}
              </p></div><FileCheck2 className="size-4 text-tracker-green" />
              </div>
              <div className="space-y-3 p-3 sm:p-4">
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
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
              <div className="border-b border-border bg-surface-1 px-4 py-3 sm:px-5">
              <h3 className="font-display text-base font-extrabold tracking-tight">
                Other {country.name} bioenergy updates
              </h3>
              <p className="label-mono mt-1 text-muted-foreground">
                {otherUpdates.length} update{otherUpdates.length === 1 ? "" : "s"}
              </p>
              </div><div className="space-y-3 p-3 sm:p-4">
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
