import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, RotateCcw } from "lucide-react";
import type { DateRange as DayPickerRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { EMPTY_RANGE, type DateRange } from "@/components/DateRangeFilter";

const PRESETS: { label: string; days: number | null }[] = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 12 months", days: 365 },
  { label: "All time", days: null },
];

function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toDate(value: string) {
  if (!value) return undefined;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function CalendarRangeFilter({
  value,
  onChange,
  className = "",
}: {
  value: DateRange;
  onChange: (next: DateRange) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo<DayPickerRange | undefined>(() => {
    const from = toDate(value.from);
    const to = toDate(value.to);
    return from || to ? { from, to } : undefined;
  }, [value.from, value.to]);

  const active = Boolean(value.from || value.to);
  const label = active
    ? `${value.from ? format(new Date(`${value.from}T00:00:00`), "d MMM yyyy") : "Earliest"} — ${
        value.to ? format(new Date(`${value.to}T00:00:00`), "d MMM yyyy") : "Today"
      }`
    : "All dates";

  const applyPreset = (days: number | null) => {
    if (days === null) {
      onChange(EMPTY_RANGE);
      return;
    }
    const to = new Date();
    const from = new Date(to.getTime() - days * 86400000);
    onChange({ from: isoDay(from), to: isoDay(to) });
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "label-mono h-auto justify-start gap-2 rounded-full px-3.5 py-2 text-left",
              !active && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="size-3.5" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] p-0">
          <div className="flex flex-col sm:flex-row">
            <div className="flex flex-row flex-wrap gap-1 border-b border-border p-2 sm:w-40 sm:flex-col sm:border-b-0 sm:border-r">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p.days)}
                  className="label-mono rounded-md px-2.5 py-1.5 text-left text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="pointer-events-auto">
              <Calendar
                mode="range"
                numberOfMonths={1}
                defaultMonth={selected?.from ?? new Date()}
                selected={selected}
                captionLayout="dropdown"
                startMonth={new Date(2000, 0)}
                endMonth={new Date()}
                onSelect={(r) =>
                  onChange({
                    from: r?.from ? isoDay(r.from) : "",
                    to: r?.to ? isoDay(r.to) : "",
                  })
                }
                className="pointer-events-auto p-3 sm:[--cell-size:2.1rem]"
              />
              <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
                <button
                  type="button"
                  onClick={() => onChange(EMPTY_RANGE)}
                  className="label-mono inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary"
                >
                  <RotateCcw className="size-3" /> Reset
                </button>
                <Button size="sm" onClick={() => setOpen(false)} className="label-mono">
                  Done
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {active && (
        <button
          type="button"
          onClick={() => onChange(EMPTY_RANGE)}
          className="label-mono inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1.5 text-muted-foreground hover:text-primary"
        >
          <RotateCcw className="size-3" /> Clear
        </button>
      )}
    </div>
  );
}
