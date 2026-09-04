import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, ExternalLink, Newspaper, Search, RotateCcw } from "lucide-react";
import {
  JOB_BOARDS,
  JOB_CATEGORIES,
  JOB_REGIONS,
  SENIORITY_LEVELS,
  type JobCategory,
  type Seniority,
} from "@/lib/jobs";
import { getHiringNewsFn } from "@/lib/jobs.functions";
import { logoForDomain } from "@/lib/entity-logos";

/** Light pastel tones per filter group — active chips pick up the group's tint. */
const GROUP_TONES = {
  function: {
    active: "border-sky-400 bg-sky-100 text-sky-900 shadow-sm",
    idle: "border-sky-200 bg-sky-50/60 text-sky-900/80 hover:border-sky-400 hover:bg-sky-100",
  },
  seniority: {
    active: "border-emerald-400 bg-emerald-100 text-emerald-900 shadow-sm",
    idle: "border-emerald-200 bg-emerald-50/60 text-emerald-900/80 hover:border-emerald-400 hover:bg-emerald-100",
  },
  region: {
    active: "border-amber-400 bg-amber-100 text-amber-900 shadow-sm",
    idle: "border-amber-200 bg-amber-50/60 text-amber-900/80 hover:border-amber-400 hover:bg-amber-100",
  },
} as const;

type ToneKey = keyof typeof GROUP_TONES;

function Chip({
  active,
  onClick,
  tone,
  children,
}: {
  active: boolean;
  onClick: () => void;
  tone: ToneKey;
  children: React.ReactNode;
}) {
  const t = GROUP_TONES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
        active ? t.active : t.idle
      }`}
    >
      {children}
    </button>
  );
}

function FilterGroup({
  title,
  value,
  children,
}: {
  title: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline gap-2">
        <span className="font-display text-sm font-bold tracking-tight text-foreground">{title}</span>
        <span className="label-mono text-muted-foreground/70">{value}</span>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function JobsPanel({ compact = false }: { compact?: boolean }) {
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [fuels, setFuels] = useState<FuelType[]>([]);
  const [seniority, setSeniority] = useState<Seniority | null>(null);
  const [regionName, setRegionName] = useState<string>("Worldwide");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [keyword, setKeyword] = useState("");

  const region = JOB_REGIONS.find((r) => r.name === regionName) ?? JOB_REGIONS[0]!;

  const toggle = <T,>(list: T[], set: (v: T[]) => void, v: T) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const query = useMemo(() => {
    const or = (parts: string[]) =>
      parts.length === 0 ? "" : parts.length === 1 ? parts[0]! : `(${parts.join(" OR ")})`;
    const base = fuels.length
      ? or(fuels.map((f) => FUEL_JOB_QUERY[f]))
      : "(biofuel OR bioenergy OR biogas OR \"renewable fuel\")";
    const fn = or(categories.map((c) => CATEGORY_QUERY[c]));
    const lvl = seniority ? `(${SENIORITY_QUERY[seniority]})` : "";
    return [base, fn, lvl, remoteOnly ? "remote" : "", keyword.trim()]
      .filter(Boolean)
      .join(" ");
  }, [fuels, categories, seniority, remoteOnly, keyword]);

  const newsKeywords = useMemo(() => {
    const list = fuels.length
      ? fuels.map((f) => `${FUEL_JOB_QUERY[f]} hiring jobs`)
      : ["biofuel hiring jobs", "bioenergy hiring jobs"];
    if (categories.length) list.push(`${CATEGORY_QUERY[categories[0]!]} hiring`);
    if (region.location) list.push(`biofuel jobs ${region.location}`);
    return list.slice(0, 4);
  }, [fuels, categories, region]);

  const news = useQuery({
    queryKey: ["hiring-news", newsKeywords],
    queryFn: () => getHiringNewsFn({ data: { keywords: newsKeywords } }),
    staleTime: 15 * 60_000,
  });

  const activeCount =
    categories.length +
    fuels.length +
    (seniority ? 1 : 0) +
    (region.location ? 1 : 0) +
    (remoteOnly ? 1 : 0) +
    (keyword.trim() ? 1 : 0);

  const reset = () => {
    setCategories([]);
    setFuels([]);
    setSeniority(null);
    setRegionName("Worldwide");
    setRemoteOnly(false);
    setKeyword("");
  };

  return (
    <div className="space-y-4">
      <div className="glass-panel overflow-hidden">
        <div className="panel-head">
          <h3 className="label-mono flex items-center gap-2 text-muted-foreground">
            <Briefcase className="size-3.5" /> Refine your search
            {activeCount > 0 && <span className="text-accent">· {activeCount} active</span>}
          </h3>
          <button
            type="button"
            onClick={reset}
            disabled={activeCount === 0}
            className="label-mono flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            <RotateCcw className="size-3" /> Reset
          </button>
        </div>

        <div className="space-y-5 p-5">
          <FilterGroup
            title="Fuel"
            value={fuels.length ? fuels.join(", ") : "All fuels"}
          >
            {FUELS.map((f) => (
              <Chip key={f} active={fuels.includes(f)} onClick={() => toggle(fuels, setFuels, f)}>
                {f}
              </Chip>
            ))}
          </FilterGroup>

          <FilterGroup
            title="Function"
            value={categories.length ? categories.join(", ") : "All functions"}
          >
            {JOB_CATEGORIES.map((c) => (
              <Chip
                key={c}
                active={categories.includes(c)}
                onClick={() => toggle(categories, setCategories, c)}
              >
                {c}
              </Chip>
            ))}
          </FilterGroup>

          <FilterGroup title="Seniority" value={seniority ?? "Any level"}>
            {SENIORITY_LEVELS.map((s) => (
              <Chip
                key={s}
                active={seniority === s}
                onClick={() => setSeniority(seniority === s ? null : s)}
              >
                {s}
              </Chip>
            ))}
          </FilterGroup>

          <FilterGroup title="Region" value={region.name}>
            {JOB_REGIONS.map((r) => (
              <Chip key={r.name} active={region.name === r.name} onClick={() => setRegionName(r.name)}>
                {r.name}
              </Chip>
            ))}
            <Chip active={remoteOnly} onClick={() => setRemoteOnly(!remoteOnly)}>
              Remote only
            </Chip>
          </FilterGroup>

          <div>
            <label
              htmlFor="job-keyword"
              className="mb-2 block font-display text-sm font-bold tracking-tight text-foreground"
            >
              Keyword
            </label>
            <input
              id="job-keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. fermentation, HVO, carbon intensity"
              className="w-full border border-border bg-surface-1 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <div className="panel-head">
          <h3 className="label-mono flex items-center gap-2 text-muted-foreground">
            <Search className="size-3.5" /> Open searches
          </h3>
          <span className="label-mono max-w-[60%] truncate text-accent" title={query}>
            {query}
          </span>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {JOB_BOARDS.map((b) => {
            const logo = logoForDomain(b.domain, 64);
            return (
              <a
                key={b.name}
                href={b.url({ keywords: query, location: region.location })}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-lg border border-border bg-surface-1 p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-white">
                      {logo ? (
                        <img
                          src={logo}
                          alt=""
                          width={28}
                          height={28}
                          loading="lazy"
                          className="size-full object-contain p-0.5"
                        />
                      ) : (
                        <span className="label-mono text-[0.6rem] text-muted-foreground">
                          {b.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="truncate font-display text-sm font-bold text-foreground">
                      {b.name}
                    </span>
                  </span>
                  <ExternalLink className="size-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{b.note}</p>
              </a>
            );
          })}
        </div>
      </div>

      <div className="glass-panel">
        <div className="panel-head">
          <h3 className="label-mono flex items-center gap-2 text-muted-foreground">
            <Newspaper className="size-3.5" /> Hiring signals
          </h3>
          <span className="label-mono text-muted-foreground/70">
            {news.isFetching ? "Loading…" : `${news.data?.items.length ?? 0} items`}
          </span>
        </div>
        <div className="divide-y divide-border">
          {news.isLoading && (
            <p className="p-5 text-sm text-muted-foreground">Scanning recruitment news…</p>
          )}
          {!news.isLoading && !news.data?.items.length && (
            <p className="p-5 text-sm text-muted-foreground">
              No recent hiring news for these filters — widen the fuel or region selection.
            </p>
          )}
          {news.data?.items.slice(0, 10).map((item) => (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-5 py-3 transition-colors hover:bg-surface-2"
            >
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="label-mono mt-1 text-muted-foreground">
                {item.source}
                {item.published ? ` · ${new Date(item.published).toISOString().slice(0, 10)}` : ""}
              </p>
            </a>
          ))}
        </div>
      </div>

      {compact && (
        <p className="label-mono flex items-center gap-2 text-muted-foreground">
          <Briefcase className="size-3.5" /> Openings are listed on employer and job-board sites;
          verify details before applying.
        </p>
      )}
    </div>
  );
}
