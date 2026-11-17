import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { usePostHog } from "@posthog/react";
import { BellRing, Check, Loader2, MapPin, Fuel, ChevronDown, X } from "lucide-react";
import {
  COUNTRIES,
  FUEL_TYPES,
  FUEL_ACCENT,
  COUNTRY_FLAG,
  type FuelType,
} from "@/features/policy/taxonomy";
import { subscribeToAlerts } from "@/features/alerts/server-functions";

export function MultiSelectDropdown({
  label,
  icon: Icon,
  options,
  selected,
  onChange,
  renderSummary,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  options: { value: string; label: React.ReactNode; name: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  renderSummary: (selectedNames: string[]) => string;
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
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const selectedNames = options.filter((o) => selected.includes(o.value)).map((o) => o.name);
  const summary = renderSummary(selectedNames);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2.5 text-sm shadow-sm transition-colors hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Icon className="size-4 shrink-0 text-primary" />
          <span className="truncate font-semibold text-foreground">{label}</span>
        </span>
        <span className="ml-2 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{summary}</span>
          <ChevronDown
            className={`size-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 max-h-[280px] w-full overflow-y-auto rounded-md border border-border bg-background shadow-xl">
          <div className="sticky top-0 border-b border-border bg-muted/50 px-3 py-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-border"
                checked={selected.length === options.length && options.length > 0}
                onChange={(e) => onChange(e.target.checked ? options.map((o) => o.value) : [])}
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

export function AlertSignup({ appearance = "default" }: { appearance?: "default" | "footer" }) {
  const subscribe = useServerFn(subscribeToAlerts);
  const posthog = usePostHog();
  const [email, setEmail] = useState("");
  const [fuels, setFuels] = useState<FuelType[]>([]);
  const [countries, setCountries] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: (input: { email: string; fuels: string[]; countries: string[] }) =>
      subscribe({ data: input }),
    onSuccess: (result, input) => {
      posthog.capture("alert_subscription_requested", {
        subscription_status: result.status,
        country_count: input.countries.length,
        fuel_count: input.fuels.length,
        placement: appearance,
      });
    },
  });

  const status = mutation.data?.status;

  const countryOptions = COUNTRIES.map((c: { slug: string; name: string }) => ({
    value: c.slug,
    name: c.name,
    label: (
      <span className="flex items-center gap-2">
        <span>{COUNTRY_FLAG[c.slug]}</span>
        <span>{c.name}</span>
      </span>
    ),
  }));

  const fuelOptions = FUEL_TYPES.map((f: FuelType) => ({
    value: f,
    name: f,
    label: (
      <span className="flex items-center gap-2">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: FUEL_ACCENT[f] }} />
        <span>{f}</span>
      </span>
    ),
  }));

  const countrySummary = (names: string[]) =>
    names.length === 0 ? "All countries" : names.join(", ");

  const fuelSummary = (names: string[]) =>
    names.length === 0 ? "All fuel types" : names.join(", ");

  const coverageControls = (
    <div className="mb-4 grid gap-3 sm:grid-cols-2">
      <MultiSelectDropdown
        label="Country"
        icon={MapPin}
        options={countryOptions}
        selected={countries}
        onChange={setCountries}
        renderSummary={countrySummary}
      />
      <MultiSelectDropdown
        label="Fuel type"
        icon={Fuel}
        options={fuelOptions}
        selected={fuels}
        onChange={(values) => setFuels(values as FuelType[])}
        renderSummary={fuelSummary}
      />
    </div>
  );

  return (
    <div
      className={
        appearance === "footer"
          ? "footer-alert-signup"
          : "rounded-lg border border-border bg-white p-5 shadow-sm sm:p-6"
      }
    >
      {appearance === "default" && (
        <p className="mb-4 text-sm text-muted-foreground">
          Pick your coverage and subscribe to a daily AI-written digest of bioenergy policy and
          market updates.
        </p>
      )}

      {/* Compact filters */}
      {appearance === "default" && coverageControls}

      {/* Active chips */}
      {(countries.length > 0 || fuels.length > 0) && (
        <div className="alert-selected-coverage mb-4 flex flex-wrap gap-2">
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

      {appearance === "footer" && (
        <details className="footer-coverage-options">
          <summary>Choose countries and fuel types</summary>
          {coverageControls}
        </details>
      )}

      {status === "confirmation_sent" && (
        <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
          <Check className="size-4" /> Check your inbox — confirm the link to activate your daily
          briefs.
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
  );
}
