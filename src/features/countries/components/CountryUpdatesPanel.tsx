import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { CalendarRangeFilter } from "@/components/CalendarRangeFilter";
import { EMPTY_RANGE, withinRange } from "@/components/DateRangeFilter";
import { feedQueryWithInitial } from "@/features/policy/feed-query";
import type { PolicyFeed } from "@/features/policy/contracts";
import type { CountryProfile } from "@/features/policy/taxonomy";
import { mandatesForCountry, updateMatchesMandate } from "@/features/countries/mandates";

export function CountryUpdatesPanel({
  country,
  initialFeed = null,
}: {
  country: CountryProfile;
  initialFeed?: PolicyFeed | null;
}) {
  const { data, isPending, isError } = useQuery(feedQueryWithInitial(initialFeed));
  const [range, setRange] = useState(EMPTY_RANGE);
  const [category, setCategory] = useState<"all" | "market" | "policy">("all");
  const keywords = (country.updateKeywords ?? []).map((k) => k.toLowerCase());
  const mandates = mandatesForCountry(country.slug);
  const updates = (data?.updates ?? [])
    .filter((u) => {
      if (
        (category !== "all" && u.category !== category) ||
        !withinRange(u.publishedAt ?? u.createdAt, range)
      )
        return false;
      if (u.countrySlug === country.slug) return true;
      const text = ` ${`${u.title} ${u.summary ?? ""}`.toLowerCase()} `;
      return keywords.some((k) =>
        k.length <= 4
          ? new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text)
          : text.includes(k),
      );
    })
    .sort(
      (a, b) =>
        new Date(b.publishedAt ?? b.createdAt).getTime() -
        new Date(a.publishedAt ?? a.createdAt).getTime(),
    );
  const failed = isError || Boolean(data?.error);
  return (
    <section className="card" id="updates" aria-labelledby="country-updates-title">
      <p className="k">Calendar-filtered changes</p>
      <h2 id="country-updates-title">Live updates</h2>
      <div className="updates-toolbar">
        <div className="filters" aria-label="Filter updates">
          {(["all", "market", "policy"] as const).map((filter) => (
            <button
              type="button"
              key={filter}
              aria-pressed={category === filter}
              onClick={() => setCategory(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
        <CalendarRangeFilter value={range} onChange={setRange} />
      </div>
      {failed && (
        <p className="feed-error" role="status">
          Updates could not be refreshed.{" "}
          {updates.length ? "Showing available items." : "Please try again shortly."}
        </p>
      )}
      {updates.length ? (
        <ul className="ups">
          {updates.map((u) => {
            const tags = mandates.filter((m) =>
              updateMatchesMandate(m, `${u.title} ${u.summary ?? ""}`),
            );
            return (
              <li key={u.id}>
                <div className="m">
                  <span className={`pill ${u.category === "market" ? "Market" : "Policy"}`}>
                    {u.category === "market" ? "Market" : "Policy"}
                  </span>
                  <time dateTime={u.publishedAt ?? u.createdAt}>
                    {new Date(u.publishedAt ?? u.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </time>
                  <span>{u.source}</span>
                </div>
                <a href={u.url} target="_blank" rel="noopener noreferrer">
                  {u.title} <ExternalLink className="inline-block" size={13} />
                </a>
                {tags.length > 0 && (
                  <div className="tags">
                    {tags.map((m) => (
                      <span className="tag" key={m.id}>
                        {m.instrument}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="empty" role="status">
          {isPending
            ? "Loading country updates…"
            : failed
              ? "No updates available right now."
              : `No updates match ${country.name} and the selected filters.`}
        </p>
      )}
    </section>
  );
}
