import { loadNavigationFeed } from "@/features/policy/navigation-feed";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { countryBySlug } from "@/features/policy/taxonomy";
import { feedQueryWithInitial } from "@/features/policy/feed-query";
import { CountryProfileHeader } from "@/features/countries/components/CountryProfileHeader";
import { UpdateCard } from "@/features/policy/components/UpdateCard";
import { CalendarRangeFilter } from "@/components/CalendarRangeFilter";
import { EMPTY_RANGE, withinRange } from "@/components/DateRangeFilter";
import { mandatesForCountry, updateMatchesMandate } from "@/features/countries/mandates";
import { useVisitTracker } from "@/features/traffic/hooks/useVisitTracker";
import { Activity, CalendarDays, FileCheck2 } from "lucide-react";

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
  const { data, isFetching } = useQuery(feedQueryWithInitial(initialFeed));
  const [range, setRange] = useState(EMPTY_RANGE);

  if (!country) return null;

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

  const monthLabel = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

  let lastMonth = "";
  const rows = updates.map((u) => {
    const month = monthLabel(u.publishedAt ?? u.createdAt);
    const isNew = month !== lastMonth;
    lastMonth = month;
    const tags = trackedMandates
      .filter((m) => updateMatchesMandate(m, `${u.title} ${u.summary ?? ""}`))
      .map((m) => m.instrument);
    return { update: u, month, isNew, tags };
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <CountryProfileHeader country={country} compact />

      <section className="mt-5 overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
          <div>
            <p className="label-mono inline-flex items-center gap-1.5 text-muted-foreground">
              <Activity className="size-3.5 text-destructive" /> Live monitoring
            </p>
            <h2 className="mt-1 font-display text-xl font-extrabold">Latest updates first</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {updates.length} matched item{updates.length === 1 ? "" : "s"}, newest to oldest,
              across {trackedMandates.length} tracked obligation
              {trackedMandates.length === 1 ? "" : "s"}.
            </p>
          </div>
          <CalendarRangeFilter value={range} onChange={setRange} />
        </div>
        <div className="flex items-center gap-2 border-t border-border bg-surface-1 px-4 py-2.5 text-xs text-muted-foreground sm:px-5">
          <CalendarDays className="size-3.5 text-tracker-blue" /> Select a preset or exact dates to
          review policy changes over time.
        </div>
      </section>

      <section>
        {updates.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            {isFetching
              ? "Scanning global sources…"
              : "No items matched this jurisdiction in the selected date range."}
          </p>
        )}

        <div className="mt-6 space-y-3">
          {rows.map(({ update, month, isNew, tags }) => (
            <div key={update.id}>
              {isNew && (
                <div className="mb-3 flex items-center gap-3 pt-2">
                  <h3 className="font-display text-sm font-extrabold uppercase tracking-wide">
                    {month}
                  </h3>
                  <span className="h-px flex-1 bg-border" />
                </div>
              )}
              <UpdateCard update={update} />
              {tags.length > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="label-mono inline-flex items-center gap-1 rounded-full border border-border bg-surface-1 px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      <FileCheck2 className="size-3 text-tracker-green" /> {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
