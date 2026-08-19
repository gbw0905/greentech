import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BellRing, Check, Loader2, MapPin, Fuel, ChevronDown, X } from "lucide-react";
import {
  COUNTRIES,
  FUEL_TYPES,
  FUEL_ACCENT,
  COUNTRY_FLAG,
  type FuelType,
} from "@/lib/policy-taxonomy";
import { subscribeToAlerts } from "@/lib/alerts.functions";

function MultiSelectDropdown({
  label,
  icon: Icon,
  options,
  selected,
  onChange,
  renderLabel,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  options: { value: string; label: React.ReactNode }[];
  selected: string[];
  onChange: (values: string[]) => void;
  renderLabel: (count: number) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:border-primary"
      >
        <span className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          <span className="font-medium text-foreground">{label}</span>
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {renderLabel(selected.length)}
          <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 max-h-[260px] w-full overflow-y-auto rounded-md border border-border bg-background shadow-lg">
          <div className="sticky top-0 border-b border-border bg-background px-3 py-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-border"
                checked={selected.length === options.length}
                onChange={(e) =>
                  onChange(e.target.checked ? options.map((o) => o.value) : [])
                }
              />
              <span className="font-medium text-foreground">Select all</span>
            </label>
          </div>
          {options.map((o) => {
            const active = selected.includes(o.value);
            return (
              <label
                key={o.value}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted ${
                  active ? "bg-primary/5" : ""
                }`}
              >
                <input
                  type="checkbox"
                  className="size-4 rounded border-border"
                  checked={active}
                  onChange={() => toggle(o.value)}
                />
                <span className="flex-1 text-foreground">{o.label}</span>
                {active && <Check className="size-3.5 text-primary" />}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AlertSignup() {
  const subscribe = useServerFn(subscribeToAlerts);
  const [email, setEmail] = useState("");
  const [fuels, setFuels] = useState<FuelType[]>([]);
  const [countries, setCountries] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: (input: { email: string; fuels: string[]; countries: string[] }) =>
      subscribe({ data: input }),
  });

  const status = mutation.data?.status;

  const countryOptions = COUNTRIES.map((c: { slug: string; name: string }) => ({
    value: c.slug,
    label: (
      <span className="flex items-center gap-2">
        <span>{COUNTRY_FLAG[c.slug]}</span>
        <span>{c.name}</span>
      </span>
    ),
  }));

  const fuelOptions = FUEL_TYPES.map((f: FuelType) => ({
    value: f,
    label: (
      <span className="flex items-center gap-2">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: FUEL_ACCENT[f] }}
        />
        <span>{f}</span>
      </span>
    ),
  }));

  return (
    <div className="glass-panel rise overflow-hidden">
      <div className="ink-bar px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center bg-white/10">
            <BellRing className="size-5 text-ink-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-bold text-ink-foreground">
              Get AI policy briefs by email
            </h3>
            <p className="mt-1 text-sm text-ink-muted">
              One daily digest of the latest bioenergy policy and market moves,
              written by AI and sourced from global governments and credible
              outlets. Pick your coverage below.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {/* Compact filters */}
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <MultiSelectDropdown
            label="Jurisdictions"
            icon={MapPin}
            options={countryOptions}
            selected={countries}
            onChange={setCountries}
            renderLabel={(count) =>
              count === 0 ? "All jurisdictions" : `${count} selected`
            }
          />
          <MultiSelectDropdown
            label="Fuel types"
            icon={Fuel}
            options={fuelOptions}
            selected={fuels}
            onChange={(values) => setFuels(values as FuelType[])}
            renderLabel={(count) =>
              count === 0 ? "All fuels" : `${count} selected`
            }
          />
        </div>

        {/* Active chips */}
        {(countries.length > 0 || fuels.length > 0) && (
          <div className="mb-5 flex flex-wrap gap-2">
            {countries.map((slug) => {
              const c = COUNTRIES.find((x: { slug: string; name: string }) => x.slug === slug);
              return (
                <span
                  key={slug}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  <span>{COUNTRY_FLAG[slug]}</span>
                  {c?.name}
                  <button
                    type="button"
                    onClick={() => setCountries((prev) => prev.filter((s) => s !== slug))}
                    className="rounded-full hover:bg-primary/20"
                    aria-label={`Remove ${c?.name}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              );
            })}
            {fuels.map((fuel) => (
              <span
                key={fuel}
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
                style={{
                  borderColor: FUEL_ACCENT[fuel],
                  backgroundColor: `color-mix(in oklab, ${FUEL_ACCENT[fuel]} 15%, transparent)`,
                  color: `color-mix(in oklab, ${FUEL_ACCENT[fuel]} 55%, var(--foreground))`,
                }}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: FUEL_ACCENT[fuel] }}
                />
                {fuel}
                <button
                  type="button"
                  onClick={() => setFuels((prev) => prev.filter((f) => f !== fuel))}
                  className="rounded-full hover:bg-black/5"
                  aria-label={`Remove ${fuel}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Email form */}
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.trim()) return;
            mutation.mutate({ email: email.trim(), fuels, countries });
          }}
        >
          <input
            type="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            aria-label="Email address"
            className="min-w-0 flex-1 rounded-md border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Subscribe
          </button>
        </form>

        <p className="mt-2 text-xs text-muted-foreground">
          Daily digest only. Unsubscribe any time via the link in every email.
        </p>

        {status === "confirmation_sent" && (
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
            <Check className="size-4" /> Check your inbox — confirm the link to activate your daily briefs.
          </p>
        )}
        {status === "already_confirmed" && (
          <p className="mt-4 text-sm font-medium text-primary">
            You're already subscribed — your coverage preferences have been updated.
          </p>
        )}
        {status === "suppressed" && (
          <p className="mt-4 text-sm text-muted-foreground">
            This address previously unsubscribed or bounced, so we can't email it.
          </p>
        )}
        {mutation.isError && (
          <p className="mt-4 text-sm text-destructive">
            Could not subscribe right now. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
