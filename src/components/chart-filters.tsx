import { useMemo, useState } from "react";
import { X } from "lucide-react";
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

/** Shared dropdown filter bar used above every Supply & producers visualization. */
export function ChartFilterBar({
  onQueryChange,
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
  const dirty = selects.some((s) => s.value !== "");

  const content = (
    <>
      {selects.map((s) => {
        const opts = s.options.map(asOption);
        const groups = [...new Set(opts.map((o) => o.group ?? ""))];
        return (
          <label
            key={s.label}
            className="order-1 flex min-w-0 flex-col gap-1.5 sm:min-w-40 sm:flex-1 xl:w-auto xl:flex-none"
          >
            <span className="label-mono text-muted-foreground">{s.label}</span>
            <select
              className="chart-select h-10 w-full min-w-0 xl:w-44"
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

      <span className="order-5 flex h-10 min-w-20 flex-col justify-center border-l border-border pl-3">
        <span className="label-mono text-muted-foreground">Results</span>
        <strong className="text-sm font-bold tabular-nums text-foreground">
          {typeof matched === "number" && matched !== shown
            ? `${shown} of ${matched}`
            : `${shown} of ${total}`}
        </strong>
      </span>

      {dirty ? (
        <button
          type="button"
          onClick={() => {
            onQueryChange("");
            selects.forEach((s) => s.onChange(""));
          }}
          className="order-6 inline-flex h-10 shrink-0 items-center gap-1.5 px-2 text-xs font-semibold text-primary transition-colors hover:text-foreground"
        >
          <X className="size-3" />
          Clear
        </button>
      ) : null}
    </>
  );

  if (bare) return content;

  return (
    <div className="grid grid-cols-1 items-end gap-3 rounded-sm border border-border bg-surface-2/60 p-3 sm:grid-cols-2 xl:flex">
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
