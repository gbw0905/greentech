import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Check, ChevronDown, ExternalLink, Newspaper, Search, RotateCcw } from "lucide-react";
import { createPortal } from "react-dom";
import {
  CATEGORY_QUERY,
  JOB_BOARDS,
  JOB_CATEGORIES,
  JOB_REGIONS,
  SENIORITY_LEVELS,
  SENIORITY_QUERY,
  type JobCategory,
  type Seniority,
} from "@/lib/jobs";
import { getHiringNewsFn } from "@/lib/jobs.functions";
import { logoForDomain } from "@/lib/entity-logos";

/** Light pastel tones per filter group — active picks up the group's tint. */
const GROUP_TONES = {
  function: {
    ring: "ring-sky-200",
    border: "border-sky-300",
    bg: "bg-sky-50",
    text: "text-sky-900",
    muted: "text-sky-700/70",
    badge: "bg-sky-100 text-sky-900 ring-sky-200",
    check: "text-sky-700",
  },
  seniority: {
    ring: "ring-emerald-200",
    border: "border-emerald-300",
    bg: "bg-emerald-50",
    text: "text-emerald-900",
    muted: "text-emerald-700/70",
    badge: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    check: "text-emerald-700",
  },
  region: {
    ring: "ring-amber-200",
    border: "border-amber-300",
    bg: "bg-amber-50",
    text: "text-amber-900",
    muted: "text-amber-700/70",
    badge: "bg-amber-100 text-amber-900 ring-amber-200",
    check: "text-amber-700",
  },
} as const;

type ToneKey = keyof typeof GROUP_TONES;

interface DropdownOption {
  value: string;
  label: string;
}

function Dropdown({
  tone,
  label,
  valueLabel,
  options,
  selected,
  multi = false,
  onSelect,
}: {
  tone: ToneKey;
  label: string;
  valueLabel: string;
  options: DropdownOption[];
  selected: string[];
  multi?: boolean;
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const t = GROUP_TONES[tone];

  useEffect(() => {
    if (!open) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const width = Math.max(rect.width, 220);
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
      setPos({ top: rect.bottom + 6, left, width });
    }
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative min-w-0 flex-1">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border ${t.border} ${t.bg} px-3 py-2.5 text-left shadow-sm ring-1 ring-transparent transition-all hover:shadow-md focus:outline-none focus:ring-2 ${t.ring}`}
      >
        <span className="min-w-0">
          <span className={`block text-[0.65rem] font-bold uppercase tracking-wider ${t.muted}`}>{label}</span>
          <span className={`block truncate text-sm font-semibold ${t.text}`}>{valueLabel}</span>
        </span>
        <ChevronDown className={`size-4 shrink-0 ${t.text} transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-multiselectable={multi}
            className="fixed z-50 max-h-72 overflow-y-auto rounded-lg border border-border bg-surface-1 shadow-xl"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            {options.map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onSelect(opt.value)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-2"
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className={`size-4 ${t.check}`} />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}


export function JobsPanel({ compact = false }: { compact?: boolean }) {
  const [categories, setCategories] = useState<JobCategory[]>([]);
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
    const base = "(biofuel OR bioenergy OR biogas OR \"renewable fuel\")";
    const fn = or(categories.map((c) => CATEGORY_QUERY[c]));
    const lvl = seniority ? `(${SENIORITY_QUERY[seniority]})` : "";
    return [base, fn, lvl, remoteOnly ? "remote" : "", keyword.trim()]
      .filter(Boolean)
      .join(" ");
  }, [categories, seniority, remoteOnly, keyword]);

  const newsKeywords = useMemo(() => {
    const list = ["biofuel hiring jobs", "bioenergy hiring jobs"];
    if (categories.length) list.push(`${CATEGORY_QUERY[categories[0]!]} hiring`);
    if (region.location) list.push(`biofuel jobs ${region.location}`);
    return list.slice(0, 4);
  }, [categories, region]);

  const news = useQuery({
    queryKey: ["hiring-news", newsKeywords],
    queryFn: () => getHiringNewsFn({ data: { keywords: newsKeywords } }),
    staleTime: 15 * 60_000,
  });

  const activeCount =
    categories.length +
    (seniority ? 1 : 0) +
    (region.location ? 1 : 0) +
    (remoteOnly ? 1 : 0) +
    (keyword.trim() ? 1 : 0);

  const reset = () => {
    setCategories([]);
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

        <div className="space-y-4 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <Dropdown
              tone="function"
              label="Function"
              valueLabel={
                categories.length === 0
                  ? "All functions"
                  : categories.length === 1
                    ? categories[0]!
                    : `${categories[0]!} +${categories.length - 1}`
              }
              options={JOB_CATEGORIES.map((c) => ({ value: c, label: c }))}
              selected={categories}
              multi
              onSelect={(v) => toggle(categories, setCategories, v as JobCategory)}
            />
            <Dropdown
              tone="seniority"
              label="Seniority"
              valueLabel={seniority ?? "Any level"}
              options={SENIORITY_LEVELS.map((s) => ({ value: s, label: s }))}
              selected={seniority ? [seniority] : []}
              onSelect={(v) => setSeniority(seniority === v ? null : (v as Seniority))}
            />
            <Dropdown
              tone="region"
              label="Region"
              valueLabel={region.name}
              options={JOB_REGIONS.map((r) => ({ value: r.name, label: r.name }))}
              selected={[region.name]}
              onSelect={(v) => setRegionName(v)}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="job-keyword"
                className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Keyword
              </label>
              <input
                id="job-keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. fermentation, HVO, carbon intensity"
                className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <button
              type="button"
              onClick={() => setRemoteOnly((v) => !v)}
              aria-pressed={remoteOnly}
              className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                remoteOnly
                  ? "border-emerald-400 bg-emerald-100 text-emerald-900 shadow-sm"
                  : "border-border bg-surface-1 text-foreground hover:bg-surface-2"
              }`}
            >
              {remoteOnly ? "Remote only ✓" : "Remote only"}
            </button>
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
