import { useCallback, useEffect, useState } from "react";
import { X, ExternalLink, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { openEntityNews, type NewsTarget } from "@/lib/open-news";
import { getEntityNewsFn } from "@/lib/videos.functions";

/** Live headline list for the entity, fetched from the news index on open. */
function EntityNews({ target }: { target: NewsTarget }) {
  const fetchNews = useServerFn(getEntityNewsFn);
  const query = target?.query ?? "";
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["entity-news", query],
    queryFn: () => fetchNews({ data: { query, limit: 8 } }),
    enabled: query.length > 1,
    staleTime: 10 * 60_000,
  });
  const articles = data?.articles ?? [];

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-2">
        <h5 className="chart-sub uppercase tracking-[0.12em] text-muted-foreground">Latest news</h5>
        <button
          type="button"
          onClick={() => refetch()}
          className="label-mono inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
        >
          <RefreshCw className={`size-3 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>
      {isFetching && articles.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Loading headlines…</p>
      ) : articles.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          No recent headlines found — open the full search below.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-border border-y border-border">
          {articles.map((a) => (
            <li key={a.url}>
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-2 text-sm/snug hover:text-primary"
              >
                {a.title}
                <span className="label-mono mt-0.5 block text-muted-foreground">
                  {a.source}
                  {a.published ? ` · ${new Date(a.published).toLocaleDateString()}` : ""}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Stat = { label: string; value: string; tone?: "default" | "up" | "down" | undefined };

export type EntityDetail = {
  name: string;
  sub?: string;
  country?: string;
  flag?: string;
  logo?: string | undefined;
  note?: string;
  stats: Stat[];
  /** Extra titled stat groups rendered below the main stats. */
  sections?: { title: string; stats: Stat[] }[];
  news: NewsTarget;
};

/**
 * Snapshot of the chart the user clicked: which measure/view/filters were
 * active and the ranked values behind the graph, so the detail sheet can
 * explain exactly what the clicked tile/bar/bubble means.
 */
export type GraphContext = {
  /** Selected dropdown measure, e.g. "Annual capacity (MMboe/yr)". */
  measure: string;
  unit: string;
  /** Current chart view label, e.g. "Heat map". */
  view: string;
  /** Active filter parameters as [label, value] pairs. */
  filters: [string, string][];
  /** Ranked (highest first) entries currently shown in the chart. */
  items: { name: string; value: number }[];
  format: (n: number) => string;
};

/** Adds the published certification / compliance block for the entity. */
function complianceSection(name: string): { title: string; stats: Stat[] } {
  const rec = certificationFor(name);
  if (!rec) {
    return {
      title: "Environmental compliance & certification",
      stats: [
        { label: "Certification", value: "No published certification found" },
        { label: "How to check", value: "ISCC, RSB, Bonsucro or SBP public registers" },
      ],
    };
  }
  const stats: Stat[] = [];
  if (rec.schemes.length) stats.push({ label: "Certification schemes", value: rec.schemes.join(", ") });
  if (rec.regulatory?.length) stats.push({ label: "Regulatory programmes", value: rec.regulatory.join(", ") });
  if (rec.source) stats.push({ label: "Source", value: rec.source });
  return { title: "Environmental compliance & certification", stats };
}

/** Derives rank, share, range and percentile for the clicked entity. */
function enrichDetail(d: EntityDetail, g: GraphContext): EntityDetail {
  const idx = g.items.findIndex((i) => i.name === d.name);
  const sections: { title: string; stats: Stat[] }[] = [...(d.sections ?? [])];
  sections.push(complianceSection(d.name));

  if (idx >= 0) {
    const v = g.items[idx]!.value;
    const values = g.items.map((i) => i.value);
    const total = values.reduce((s, x) => s + Math.max(x, 0), 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const beaten = values.filter((x) => x < v).length;
    const share = total > 0 ? (Math.max(v, 0) / total) * 100 : 0;
    sections.push({
      title: "Graph values for this entry",
      stats: [
        { label: "Rank in this view", value: `#${idx + 1} of ${g.items.length}` },
        { label: g.measure, value: `${g.format(v)} (${g.unit})` },
        { label: "Share of all shown", value: `${share.toFixed(1)}%` },
        { label: "Range across entries", value: `${g.format(min)} – ${g.format(max)}` },
        { label: "Standing", value: `Higher than ${Math.round((beaten / g.items.length) * 100)}% of entries shown` },
      ],
    });
  }
  sections.push({
    title: "Active filters when clicked",
    stats: [
      { label: "Chart view", value: g.view },
      { label: "Measure", value: g.measure },
      { label: "Entries shown", value: String(g.items.length) },
      ...g.filters.map(([label, value]): Stat => ({ label, value })),
    ],
  });
  return { ...d, sections };
}

/** Maps a percent change to the shared up/down colour tone. */
export function detailTone(changePct?: number): "default" | "up" | "down" {
  if (changePct === undefined || Number.isNaN(changePct)) return "default";
  return changePct >= 0 ? "up" : "down";
}

/**
 * Shared slide-over used by every Supply & producers panel: clicking a tile,
 * bubble, bar or table row opens the entity's full metric card instead of
 * navigating straight out to a news search.
 */
export function useEntityDetail() {
  const [detail, setDetail] = useState<EntityDetail | null>(null);
  const open = useCallback((d: EntityDetail | null) => setDetail(d), []);
  const close = useCallback(() => setDetail(null), []);
  return {
    open,
    /**
     * Wraps a NewsTarget-based onSelect so panels can keep their existing
     * handlers. Pass the current GraphContext as the second argument so the
     * sheet also shows the active filter parameters and graph values.
     */
    onSelect:
      (lookup: (t: NewsTarget) => EntityDetail | null | undefined, graph?: GraphContext) =>
      (t: NewsTarget) => {
        if (!t) return;
        const d = lookup(t);
        if (d) setDetail(graph ? enrichDetail(d, graph) : d);
        else openEntityNews(t);
      },
    sheet: <EntityDetailSheet detail={detail} onClose={close} />,
  };
}

export function EntityDetailSheet({
  detail,
  onClose,
}: {
  detail: EntityDetail | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail, onClose]);

  if (!detail) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`${detail.name} details`}>
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
      />
      <aside className="relative flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-border bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {detail.logo ? (
              <img
                src={detail.logo}
                alt=""
                className="size-10 shrink-0 rounded-sm bg-surface-2 object-contain p-1"
                loading="lazy"
              />
            ) : null}
            <div className="min-w-0">
              <h4 className="font-display text-lg leading-tight font-bold text-foreground">
                {detail.flag ? `${detail.flag} ` : ""}
                {detail.name}
              </h4>
              {detail.sub ? (
                <p className="label-mono mt-1 text-muted-foreground">{detail.sub}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-sm border border-border p-1.5 text-muted-foreground transition-colors hover:bg-surface-2"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {detail.note ? (
          <p className="mt-4 text-sm/relaxed text-muted-foreground">{detail.note}</p>
        ) : null}

        <dl className="mt-4 divide-y divide-border border-y border-border">
          {detail.stats.map((s) => (
            <div key={s.label} className="flex items-baseline justify-between gap-3 py-2">
              <dt className="chart-sub text-muted-foreground">{s.label}</dt>
              <dd
                className={`chart-value tabular-nums ${
                  s.tone === "up"
                    ? "text-primary"
                    : s.tone === "down"
                      ? "text-destructive"
                      : "text-foreground"
                }`}
              >
                {s.value}
              </dd>
            </div>
          ))}
        </dl>

        {detail.sections?.map((sec) => (
          <div key={sec.title} className="mt-4">
            <h5 className="chart-sub uppercase tracking-[0.12em] text-muted-foreground">
              {sec.title}
            </h5>
            <dl className="mt-1.5 divide-y divide-border border-y border-border">
              {sec.stats.map((s) => (
                <div key={s.label} className="flex items-baseline justify-between gap-3 py-2">
                  <dt className="chart-sub text-muted-foreground">{s.label}</dt>
                  <dd
                    className={`chart-value text-right tabular-nums ${
                      s.tone === "up"
                        ? "text-primary"
                        : s.tone === "down"
                          ? "text-destructive"
                          : "text-foreground"
                    }`}
                  >
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}

        <EntityNews target={detail.news} />

        <button
          type="button"
          onClick={() => openEntityNews(detail.news)}
          className="mt-4 inline-flex items-center justify-center gap-2 border border-ink bg-ink px-3 py-2 text-sm font-semibold text-ink-foreground transition-opacity hover:opacity-85"
        >
          <ExternalLink className="size-4" />
          More news for {detail.name}
        </button>
      </aside>
    </div>
  );
}
