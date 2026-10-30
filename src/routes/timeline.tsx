import { loadNavigationFeed } from "@/features/policy/navigation-feed";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useMemo, useRef, useState } from "react";
import { Radio, Search, CalendarDays, ArrowUpRight, X } from "lucide-react";
import { feedQueryWithInitial } from "@/features/policy/feed-query";
import { COUNTRIES, FUEL_TYPES, type FuelType } from "@/features/policy/taxonomy";
import { formatDate } from "@/features/policy/components/UpdateCard";
import { imageForUpdate } from "@/features/policy/update-images";
import { CountryFlag } from "@/features/countries/components/CountryFlag";
import { TimelinePagination } from "@/components/TimelinePagination";
import { IntelligencePage } from "@/components/IntelligencePage";
import { useVisitTracker } from "@/features/traffic/hooks/useVisitTracker";

const TITLE = "Policy update timeline | Global Bioenergy Watch";
const DESCRIPTION =
  "Newest global biofuel and bioenergy mandates, blending obligations and regulatory decisions, filterable by country and fuel type.";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://globalbioenergywatch.org/timeline" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://globalbioenergywatch.org/timeline" }],
  }),
  loader: ({ context }) => loadNavigationFeed(context.queryClient),
  component: TimelinePage,
});

function TimelinePage() {
  useVisitTracker();
  const { feed: initialFeed } = Route.useLoaderData();
  const { data: feed, isFetching } = useQuery(feedQueryWithInitial(initialFeed));
  const updates = useMemo(() => feed?.updates ?? [], [feed?.updates]);
  const [fuels, setFuels] = useState<FuelType[]>([]);
  const [country, setCountry] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const resultsRef = useRef<HTMLDivElement>(null);
  const fuelCounts = useMemo(
    () =>
      Object.fromEntries(
        FUEL_TYPES.map((f) => [f, updates.filter((u) => u.fuels.includes(f)).length]),
      ),
    [updates],
  );
  const filtered = useMemo(
    () =>
      updates
        .filter(
          (u) =>
            (fuels.length === 0 || u.fuels.some((f) => fuels.includes(f))) &&
            (!country || u.countrySlug === country) &&
            (category === "all" || u.category === category) &&
            (!query.trim() ||
              `${u.title} ${u.summary ?? ""} ${u.countryName ?? ""}`
                .toLowerCase()
                .includes(query.trim().toLowerCase())),
        )
        .sort(
          (a, b) =>
            new Date(b.publishedAt ?? b.createdAt).getTime() -
            new Date(a.publishedAt ?? a.createdAt).getTime(),
        ),
    [updates, fuels, country, query, category],
  );
  const pageSize = 24;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const changePage = (next: number) => {
    setPage(Math.max(1, Math.min(next, totalPages)));
    const results = resultsRef.current;
    if (results) {
      results.focus({ preventScroll: true });
      window.scrollTo({
        top: window.scrollY + results.getBoundingClientRect().top - 88,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    }
  };
  const clear = () => {
    setPage(1);
    setCountry(null);
    setFuels([]);
    setQuery("");
    setCategory("all");
  };
  let lastDate = "";
  return (
    <IntelligencePage
      icon={Radio}
      eyebrow=""
      title="Policy update timeline"
      subtitle="Follow the decisions and market developments shaping global bioenergy. Filter the live feed by jurisdiction, fuel and the signals that matter to you."
      className="intelligence-timeline"
      aside={
        <>
          <strong>{updates.length.toLocaleString()}</strong>
          <span>Updates tracked</span>
        </>
      }
    >
      <section className="intelligence-filter-panel timeline-filters" aria-label="Filter updates">
        <div className="timeline-filter-row">
          <label className="intelligence-search">
            <Search size={18} aria-hidden />
            <span className="sr-only">Search updates</span>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search headlines, countries or topics…"
            />
          </label>
          <label className="intelligence-select">
            <span>Jurisdiction</span>
            <select
              value={country ?? ""}
              onChange={(e) => {
                setCountry(e.target.value || null);
                setPage(1);
              }}
            >
              <option value="">All countries</option>
              {COUNTRIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="intelligence-filter-chips" role="group" aria-label="Fuel type">
          <span>Fuel type</span>
          {FUEL_TYPES.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={fuels.includes(f)}
              onClick={() => {
                setFuels((list) => (list.includes(f) ? list.filter((v) => v !== f) : [...list, f]));
                setPage(1);
              }}
            >
              {f}
              <small>{fuelCounts[f]}</small>
            </button>
          ))}
        </div>
      </section>
      <div className="intelligence-results-heading" ref={resultsRef} tabIndex={-1}>
        <div className="intelligence-tabs" role="group" aria-label="Update category">
          {["all", "policy", "market"].map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={category === value}
              onClick={() => {
                setCategory(value);
                setPage(1);
              }}
            >
              {value === "all" ? "All updates" : value === "policy" ? "Policy" : "Market"}
            </button>
          ))}
        </div>
        <span role="status">
          {filtered.length.toLocaleString()} updates
          {country || fuels.length || query || category !== "all" ? (
            <button type="button" className="intelligence-reset" onClick={clear}>
              Clear filters <X size={13} />
            </button>
          ) : null}
        </span>
      </div>
      <div className="intelligence-timeline-list">
        {filtered.slice(start, start + pageSize).map((u) => {
          const date = formatDate(u.publishedAt ?? u.createdAt);
          const heading = date !== lastDate;
          lastDate = date;
          const photo = imageForUpdate(u);
          return (
            <Fragment key={u.id}>
              {heading && (
                <h2 className="timeline-date">
                  <CalendarDays size={16} aria-hidden />
                  {date}
                </h2>
              )}
              <article className="timeline-update-card">
                <a
                  className="timeline-update-image"
                  href={u.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={-1}
                  aria-hidden
                >
                  <img src={photo.src} alt="" loading="lazy" />
                </a>
                <div className="timeline-update-copy">
                  <div className="timeline-update-meta">
                    <span className="intelligence-category" data-category={u.category}>
                      {u.category === "market" ? "Market" : "Policy"}
                    </span>
                    {u.countrySlug && u.countryName && (
                      <Link to="/countries/$slug" params={{ slug: u.countrySlug }}>
                        <CountryFlag slug={u.countrySlug} />
                        {u.countryName}
                      </Link>
                    )}
                    <time>{date}</time>
                  </div>
                  <h3>
                    <a href={u.url} target="_blank" rel="noopener noreferrer">
                      {u.title}
                      <ArrowUpRight size={17} aria-hidden />
                    </a>
                  </h3>
                  {u.summary && u.summary !== u.title && <p>{u.summary}</p>}
                  <div className="timeline-update-bottom">
                    <div>
                      {u.fuels.map((f) => (
                        <span key={f}>{f}</span>
                      ))}
                    </div>
                    <a href={u.url} target="_blank" rel="noopener noreferrer">
                      Read source <ArrowUpRight size={14} />
                    </a>
                  </div>
                </div>
              </article>
            </Fragment>
          );
        })}
        {!filtered.length && (
          <div className="intelligence-empty">
            <Search size={32} />
            <h2>{isFetching && !feed ? "Loading updates…" : "No updates match these filters"}</h2>
            <p>Try a broader topic, another jurisdiction or fewer fuel types.</p>
            <button type="button" onClick={clear}>
              Reset filters
            </button>
          </div>
        )}
      </div>
      {filtered.length > 0 && (
        <TimelinePagination
          page={currentPage}
          pages={totalPages}
          total={filtered.length}
          pageSize={pageSize}
          onChange={changePage}
        />
      )}
    </IntelligencePage>
  );
}
