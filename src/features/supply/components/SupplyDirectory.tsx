import { useMemo, useState } from "react";
import { MotionReveal } from "@/components/MotionReveal";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  X,
} from "lucide-react";
import { SUPPLY_PANELS, type PanelId } from "./SupplyProducersSection";

const PAGE_SIZE = 10;
const CATEGORIES = ["Supply", "Production", "Transport", "Bioproducts", "Power"] as const;
type Category = (typeof CATEGORIES)[number];
// Directory filters are presentation metadata; dataset contents and panel IDs stay unchanged.
const CATEGORY: Record<PanelId, Category> = {
  stations: "Supply",
  uco: "Supply",
  ethanol: "Production",
  biopower: "Power",
  rng: "Production",
  biochar: "Bioproducts",
  pellets: "Bioproducts",
  terminals: "Supply",
  marine: "Transport",
  oil: "Supply",
  saf: "Transport",
  carriers: "Transport",
  hydrogen: "Production",
  rlpg: "Production",
  methanol: "Production",
};
const TONES = ["green", "teal", "blue", "purple"] as const;

export function SupplyDirectory() {
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("default");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const panels = SUPPLY_PANELS.filter(
      (panel) =>
        (category === "all" || CATEGORY[panel.id] === category) &&
        (!query ||
          `${panel.title} ${panel.blurb} ${panel.statLabel}`.toLowerCase().includes(query)),
    );
    if (sort === "name") panels.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "size") panels.sort((a, b) => parseFloat(b.stat) - parseFloat(a.stat));
    return panels;
  }, [category, search, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const reset = () => {
    setCategory("all");
    setSort("default");
    setSearch("");
    setPage(1);
  };
  const changePage = (next: number) => {
    setPage(next);
    document.getElementById("supply-filters")?.scrollIntoView({ block: "start", behavior: "auto" });
  };

  return (
    <>
      <div className="supply-filter-panel" id="supply-filters">
        <div className="supply-filter-row">
          <label className="supply-select-label">
            Category
            <span className="supply-select-wrap">
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" />
            </span>
          </label>
          <label className="supply-select-label">
            Sort
            <span className="supply-select-wrap supply-sort-wrap">
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                }}
              >
                <option value="default">Default order</option>
                <option value="name">Name A–Z</option>
                <option value="size">Most entities</option>
              </select>
              <ChevronDown aria-hidden="true" />
            </span>
          </label>
          <button
            type="button"
            className="supply-filter-toggle"
            aria-expanded={filtersOpen}
            aria-controls="supply-search"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <Filter size={18} aria-hidden="true" /> Filter
            {search.trim() && <span className="supply-filter-dot" />}
          </button>
        </div>
        {filtersOpen && (
          <div id="supply-search" className="supply-search-row">
            <label className="supply-search-field">
              <Search size={18} aria-hidden="true" />
              <span className="sr-only">Search datasets</span>
              <input
                type="search"
                placeholder="Search datasets"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </label>
            <button type="button" className="supply-clear" onClick={reset}>
              <X size={16} aria-hidden="true" /> Clear filters
            </button>
          </div>
        )}
      </div>
      <p className="sr-only" role="status">
        {filtered.length} datasets. Page {currentPage} of {pageCount}.
      </p>
      <div className="supply-directory-grid" aria-label="Supply datasets">
        {visible.map((panel, visibleIndex) => {
          const index = SUPPLY_PANELS.findIndex((item) => item.id === panel.id);
          return (
            <MotionReveal
              key={panel.id}
              delay={(visibleIndex % 4) * 0.09}
              className="flex [&>a]:w-full"
            >
              <Link
                key={panel.id}
                to="/supply/$panel"
                params={{ panel: panel.id }}
                className="supply-directory-card"
              >
                <div
                  className={`supply-card-art supply-art-${TONES[index % TONES.length]}`}
                  aria-hidden="true"
                >
                  <img
                    src={panel.image}
                    alt=""
                    width={768}
                    height={512}
                    loading={index < 4 ? "eager" : "lazy"}
                    decoding="async"
                  />
                  <span className="supply-art-badge">{CATEGORY[panel.id]}</span>
                </div>
                <div className="supply-card-copy">
                  <h2>{panel.title}</h2>
                  <p>{panel.blurb}</p>
                  <div className="supply-card-meta">
                    <span>
                      <strong>{panel.stat}</strong> {panel.statLabel}
                    </span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </div>
                </div>
              </Link>
            </MotionReveal>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="supply-empty">
          <Search size={28} aria-hidden="true" />
          <h2>No matching datasets</h2>
          <p>Try another category or search term.</p>
          <button type="button" onClick={reset}>
            Show all datasets
          </button>
        </div>
      )}
      {pageCount > 1 && (
        <nav aria-label="Supply directory pages" className="supply-pagination">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => changePage(currentPage - 1)}
          >
            <ChevronLeft size={14} aria-hidden="true" /> Prev
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
            <button
              key={number}
              type="button"
              aria-label={`Page ${number}`}
              aria-current={number === currentPage ? "page" : undefined}
              onClick={() => changePage(number)}
            >
              {number}
            </button>
          ))}
          <button
            type="button"
            disabled={currentPage === pageCount}
            onClick={() => changePage(currentPage + 1)}
          >
            Next <ChevronRight size={14} aria-hidden="true" />
          </button>
        </nav>
      )}
    </>
  );
}
