import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Check, ChevronDown, ExternalLink, Search, RotateCcw, X } from "lucide-react";
import { createPortal } from "react-dom";
import {
  CATEGORY_QUERY,
  EMPLOYERS,
  JOB_BOARDS,
  JOB_CATEGORIES,
  JOB_REGIONS,
  SENIORITY_LEVELS,
  SENIORITY_QUERY,
} from "@/features/jobs/data";
import type { JobCategory, Seniority } from "@/features/jobs/contracts";
import { logoForDomain } from "@/features/markets/entity-logos";
import { JobsReveal } from "./JobsReveal";

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
  const keyboardOpenRef = useRef(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, maxHeight: 288 });
  const t = GROUP_TONES[tone];

  useEffect(() => {
    if (!open) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const width = Math.min(Math.max(rect.width, 220), window.innerWidth - 16);
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
      const desiredHeight = Math.min(288, options.length * 41);
      const below = window.innerHeight - rect.bottom - 14;
      const above = rect.top - 14;
      const opensAbove = below < Math.min(desiredHeight, 180) && above > below;
      const maxHeight = Math.max(80, Math.min(desiredHeight, opensAbove ? above : below));
      setPos({
        top: opensAbove ? rect.top - maxHeight - 6 : rect.bottom + 6,
        left,
        width,
        maxHeight,
      });
    }
    if (keyboardOpenRef.current) {
      const option =
        menuRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]') ??
        menuRef.current?.querySelector<HTMLButtonElement>('[role="option"]');
      option?.focus({ preventScroll: true });
      keyboardOpenRef.current = false;
    }
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }
    };
    // The menu is fixed-positioned; close it when the page scrolls or the
    // window resizes so it never floats detached from its trigger. Ignore
    // scroll events that originate inside the menu itself (e.g. scrolling a
    // long option list).
    const close = () => setOpen(false);
    const onScroll = (e: Event) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open, options.length]);

  return (
    <div className="relative min-w-0 flex-1">
      <button
        ref={triggerRef}
        type="button"
        onClick={(event) => {
          keyboardOpenRef.current = event.detail === 0;
          setOpen((value) => !value);
        }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          keyboardOpenRef.current = true;
          if (open) menuRef.current?.querySelector<HTMLButtonElement>('[role="option"]')?.focus();
          else setOpen(true);
        }}
        aria-label={`${label}: ${valueLabel}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`jobs-filter jobs-filter-${tone}`}
      >
        <span className="min-w-0">
          <span className="jobs-filter-label">{label}</span>
          <span className="jobs-filter-value">{valueLabel}</span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 ${t.text} transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label={label}
            onKeyDown={(event) => {
              if (event.key === "Tab") {
                setOpen(false);
                triggerRef.current?.focus({ preventScroll: true });
                return;
              }
              if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const options = Array.from(
                event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]'),
              );
              const current = options.indexOf(document.activeElement as HTMLButtonElement);
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? options.length - 1
                    : (current + (event.key === "ArrowDown" ? 1 : -1) + options.length) %
                      options.length;
              const option = options[next];
              if (!option) return;
              option.focus({ preventScroll: true });
              const menu = event.currentTarget;
              if (option.offsetTop < menu.scrollTop) menu.scrollTop = option.offsetTop;
              else if (option.offsetTop + option.offsetHeight > menu.scrollTop + menu.clientHeight)
                menu.scrollTop = option.offsetTop + option.offsetHeight - menu.clientHeight;
            }}
            aria-multiselectable={multi}
            className="jobs-filter-menu fixed z-[60] max-h-72 overflow-y-auto rounded-xl border border-[#d6e1ea] bg-white shadow-xl"
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
            }}
          >
            {options.map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelect(opt.value);
                    if (!multi) {
                      setOpen(false);
                      triggerRef.current?.focus({ preventScroll: true });
                    }
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-[#0e2a43] transition-colors hover:bg-[#edf4f8] focus-visible:bg-[#e3f4ee] focus-visible:outline-none"
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

function SourceLogo({ name, domain }: { name: string; domain: string }) {
  const [failed, setFailed] = useState(false);
  const logo = logoForDomain(domain, 64);
  return (
    <span className="jobs-source-icon">
      {logo && !failed ? (
        <img
          src={logo}
          alt=""
          width={28}
          height={28}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        name
          .split(/[ /]/)
          .filter(Boolean)
          .map((part) => part[0])
          .slice(0, 2)
          .join("")
      )}
    </span>
  );
}

export function JobsPanel() {
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
    const base = '(biofuel OR bioenergy OR biogas OR "renewable fuel")';
    const fn = or(categories.map((c) => CATEGORY_QUERY[c]));
    const lvl = seniority ? `(${SENIORITY_QUERY[seniority]})` : "";
    return [base, fn, lvl, remoteOnly ? "remote" : "", keyword.trim()].filter(Boolean).join(" ");
  }, [categories, seniority, remoteOnly, keyword]);

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
    <div className="jobs-desk">
      <section id="job-search" className="jobs-search" aria-label="Refine your job search">
        <div className="jobs-search-toolbar">
          <label className="jobs-search-input">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Job keyword</span>
            <input
              id="job-keyword"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Search roles, companies, or keywords…"
            />
          </label>
          <Dropdown
            tone="region"
            label="Region"
            valueLabel={region.name}
            options={JOB_REGIONS.map((r) => ({ value: r.name, label: r.name }))}
            selected={[region.name]}
            onSelect={setRegionName}
          />
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
            options={SENIORITY_LEVELS.map((level) => ({ value: level, label: level }))}
            selected={seniority ? [seniority] : []}
            onSelect={(v) => setSeniority(seniority === v ? null : (v as Seniority))}
          />
          <button
            type="button"
            onClick={() => setRemoteOnly((value) => !value)}
            aria-pressed={remoteOnly}
            className="jobs-remote"
          >
            <span>{remoteOnly && <Check size={12} />}</span>Remote only
          </button>
        </div>
        {activeCount > 0 && (
          <div className="jobs-active-filters" aria-label="Active job filters">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                aria-label={`Remove ${category} filter`}
                onClick={() => toggle(categories, setCategories, category)}
              >
                {category}
                <X size={13} />
              </button>
            ))}
            {seniority && (
              <button
                type="button"
                aria-label="Remove seniority filter"
                onClick={() => setSeniority(null)}
              >
                {seniority}
                <X size={13} />
              </button>
            )}
            {region.location && (
              <button
                type="button"
                aria-label="Remove region filter"
                onClick={() => setRegionName("Worldwide")}
              >
                {region.name}
                <X size={13} />
              </button>
            )}
            <button type="button" className="jobs-reset" onClick={reset}>
              <RotateCcw size={13} />
              Reset all ({activeCount})
            </button>
          </div>
        )}
      </section>

      <JobsReveal className="jobs-stats" aria-label="Career directory coverage">
        {[
          [EMPLOYERS.length, "Bioenergy employers"],
          [JOB_REGIONS.length - 1, "Regional searches"],
          [JOB_BOARDS.length, "Trusted sources"],
          [JOB_CATEGORIES.length, "Career functions"],
        ].map(([value, label]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </JobsReveal>

      <section id="job-sources" className="jobs-section" aria-labelledby="jobs-sources-title">
        <JobsReveal className="jobs-section-heading">
          <div>
            <h2 id="jobs-sources-title">Browse job sources</h2>
            <p>Explore opportunities on trusted job boards, using your selected filters.</p>
          </div>
          <span className="jobs-count">
            {JOB_BOARDS.length} sources · {region.name}
          </span>
        </JobsReveal>
        <div className="jobs-source-grid">
          {JOB_BOARDS.map((board, index) => (
            <JobsReveal as="article" key={board.name} delay={Math.min(index * 0.04, 0.2)}>
              <a
                href={board.url({ keywords: query, location: region.location })}
                target="_blank"
                rel="noopener noreferrer"
                className="jobs-source-card"
              >
                <div className="jobs-source-top">
                  <SourceLogo name={board.name} domain={board.domain} />
                  <ArrowUpRight size={17} aria-hidden="true" />
                </div>
                <h3>{board.name}</h3>
                <p>{board.note}</p>
                <span className="jobs-careers-link">
                  Search opportunities <ExternalLink size={12} aria-hidden="true" />
                </span>
              </a>
            </JobsReveal>
          ))}
        </div>
      </section>
    </div>
  );
}
