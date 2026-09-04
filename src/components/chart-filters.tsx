import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { COUNTRIES, COUNTRY_FLAG,
  COUNTRY_NAME_FLAG } from "@/lib/policy-taxonomy";

export type ChartFilterOption = {
  value: string;
  label: string;
  /** Optional <optgroup> heading. */
  group?: string;
};

export type SelectFilter = {
  /** Short label, e.g. "Country" */
  label: string;
  value: string;
  options: (string | ChartFilterOption)[];
  onChange: (v: string) => void;
  /** Label used for the "no filter" option. */
  allLabel?: string;
};

/** Every jurisdiction the tracker follows, by display name. */
export const TRACKED_COUNTRIES: string[] = COUNTRIES.map((c) => c.name);

const flagByName = new Map(COUNTRIES.map((c) => [c.name, COUNTRY_FLAG[c.slug] ?? "🌐"]));

/**
 * Country dropdown options: every tracked jurisdiction plus every country that
 * appears in the panel's own dataset. Jurisdictions with no listed entity are
 * kept, grouped separately so the user still sees they are tracked.
 */
export function countryFilterOptions(dataCountries: string[]): ChartFilterOption[] {
  const present = new Set(dataCountries.filter(Boolean));
  const all = [...new Set([...present, ...TRACKED_COUNTRIES])].sort((a, b) => a.localeCompare(b));
  return all.map((name) => ({
    value: name,
    label: `${flagByName.get(name) ?? COUNTRY_NAME_FLAG[name] ?? "🌐"} ${name}`,
    group: present.has(name) ? "Listed entities" : "No listed entities",
  }));
}

const asOption = (o: string | ChartFilterOption): ChartFilterOption =>
  typeof o === "string" ? { value: o, label: o } : o;

/** Shared search + dropdown filter bar used above every treemap. */
export function ChartFilterBar({
  query,
  onQueryChange,
  placeholder = "Search companies…",
  selects = [],
  shown,
  total,
  matched,
  bare = false,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  placeholder?: string;
  selects?: SelectFilter[];
  shown: number;
  total: number;
  /** Rows matching the filters before the Top-N limit is applied. */
  matched?: number;
  /** Render without its own boxed wrapper, so it can sit inside a shared toolbar. */
  bare?: boolean;
}) {
  const dirty = query.trim().length > 0 || selects.some((s) => s.value !== "");

  const content = (
    <>
      <div className="relative w-full shrink-0 sm:w-44">
        <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="chart-select w-full pl-7"
        />
      </div>

      {selects.map((s) => {
        const opts = s.options.map(asOption);
        const groups = [...new Set(opts.map((o) => o.group ?? ""))];
        return (
          <label key={s.label} className="flex w-full shrink-0 items-center gap-1.5 sm:w-auto">
            <span className="label-mono shrink-0 text-muted-foreground">{s.label}</span>
            <select
              className="chart-select min-w-0 flex-1 sm:w-36 sm:flex-none"
              value={s.value}
              aria-label={`Filter by ${s.label.toLowerCase()}`}
              onChange={(e) => s.onChange(e.target.value)}
            >
              <option value="">{s.allLabel ?? `All ${s.label.toLowerCase()}s`}</option>
              {groups.length === 1 && !groups[0]
                ? opts.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))
                : groups.map((g) => (
                    <optgroup key={g || "other"} label={g || "Other"}>
                      {opts
                        .filter((o) => (o.group ?? "") === g)
                        .map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                    </optgroup>
                  ))}
            </select>
          </label>
        );
      })}

      <span className="label-mono shrink-0 text-muted-foreground">
        {typeof matched === "number" && matched !== shown
          ? `${shown}/${matched}`
          : `${shown}/${total}`}
      </span>

      {dirty ? (
        <button
          type="button"
          onClick={() => {
            onQueryChange("");
            selects.forEach((s) => s.onChange(""));
          }}
          className="label-mono inline-flex shrink-0 items-center gap-1 rounded-sm border border-border px-2 py-1 text-muted-foreground transition-colors hover:bg-surface-2"
        >
          <X className="size-3" />
          Clear
        </button>
      ) : null}
    </>
  );

  if (bare) return content;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-sm border border-border bg-surface-2/60 p-2 sm:flex-nowrap sm:overflow-x-auto sm:whitespace-nowrap">
      {content}
    </div>
  );
}

/** Local search + up-to-two dropdown filters over any row list. */
export function useChartFilter<T>(
  rows: T[],
  opts: {
    /** Free-text haystack for each row. */
    text: (row: T) => string;
    /** Optional first facet (usually country). */
    facetA?: (row: T) => string | string[] | undefined;
    /** Optional second facet (usually fuel category). */
    facetB?: (row: T) => string | string[] | undefined;
  },
) {
  return useChartFilterImpl(rows, opts);
}

/** Top-N limiter shared by every treemap panel. */
export function useTopLimit(initial = "10") {
  const [value, setValue] = useState(initial);
  const limit = value === "all" ? Infinity : Number(value);
  const options = [
    { value: "10", label: "Top 10 leaders" },
    { value: "20", label: "Top 20" },
    { value: "all", label: "All entities" },
  ];
  return { value, setValue, limit, options };
}

function useChartFilterImpl<T>(
  rows: T[],
  opts: {
    /** Free-text haystack for each row. */
    text: (row: T) => string;
    /** Optional first facet (usually country). */
    facetA?: (row: T) => string | string[] | undefined;
    /** Optional second facet (usually fuel category). */
    facetB?: (row: T) => string | string[] | undefined;
  },
) {
  const [query, setQuery] = useState("");
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  const list = (v: string | string[] | undefined) =>
    v === undefined ? [] : Array.isArray(v) ? v : [v];

  const optionsA = useMemo(
    () =>
      opts.facetA
        ? [...new Set(rows.flatMap((r) => list(opts.facetA!(r))))].filter(Boolean).sort()
        : [],
    [rows, opts.facetA],
  );
  const optionsB = useMemo(
    () =>
      opts.facetB
        ? [...new Set(rows.flatMap((r) => list(opts.facetB!(r))))].filter(Boolean).sort()
        : [],
    [rows, opts.facetB],
  );

  const q = query.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    if (q && !opts.text(r).toLowerCase().includes(q)) return false;
    if (a && opts.facetA && !list(opts.facetA(r)).includes(a)) return false;
    if (b && opts.facetB && !list(opts.facetB(r)).includes(b)) return false;
    return true;
  });

  return { query, setQuery, a, setA, b, setB, optionsA, optionsB, filtered };
}
