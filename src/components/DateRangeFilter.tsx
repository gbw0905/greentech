import { CalendarRange, RotateCcw } from "lucide-react";

export type DateRange = { from: string; to: string };

export const EMPTY_RANGE: DateRange = { from: "", to: "" };

const PRESETS: { label: string; days: number | null }[] = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "12m", days: 365 },
  { label: "All", days: null },
];

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function withinRange(dateStr: string | null | undefined, range: DateRange) {
  if (!dateStr) return true;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return true;
  if (range.from) {
    const from = new Date(`${range.from}T00:00:00.000Z`).getTime();
    if (t < from) return false;
  }
  if (range.to) {
    const to = new Date(`${range.to}T23:59:59.999Z`).getTime();
    if (t > to) return false;
  }
  return true;
}

export function DateRangeFilter({
  value,
  onChange,
  label = "Date range",
  className = "",
}: {
  value: DateRange;
  onChange: (next: DateRange) => void;
  label?: string;
  className?: string;
}) {
  const active = Boolean(value.from || value.to);

  const applyPreset = (days: number | null) => {
    if (days === null) {
      onChange(EMPTY_RANGE);
      return;
    }
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    onChange({ from: isoDay(from), to: isoDay(to) });
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="label-mono inline-flex items-center gap-1.5 text-muted-foreground">
        <CalendarRange className="size-3.5" />
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p.days)}
            className="label-mono rounded-full border border-border bg-surface-2 px-2.5 py-1 text-muted-foreground transition-transform hover:-translate-y-0.5 hover:text-primary"
          >
            {p.label}
          </button>
        ))}
      </div>
      <label className="label-mono flex items-center gap-1.5 text-muted-foreground">
        <span className="sr-only">Start date</span>
        <input
          type="date"
          value={value.from}
          max={value.to || undefined}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className="rounded-md border border-border bg-surface-2 px-2 py-1 text-foreground"
        />
      </label>
      <span className="label-mono text-muted-foreground">to</span>
      <label className="label-mono flex items-center gap-1.5 text-muted-foreground">
        <span className="sr-only">End date</span>
        <input
          type="date"
          value={value.to}
          min={value.from || undefined}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className="rounded-md border border-border bg-surface-2 px-2 py-1 text-foreground"
        />
      </label>
      {active && (
        <button
          type="button"
          onClick={() => onChange(EMPTY_RANGE)}
          className="label-mono inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-muted-foreground hover:text-primary"
        >
          <RotateCcw className="size-3" /> Reset
        </button>
      )}
    </div>
  );
}
