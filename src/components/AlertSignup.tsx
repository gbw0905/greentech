import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BellRing, Check, Loader2, MapPin, Fuel } from "lucide-react";
import {
  COUNTRIES,
  FUEL_TYPES,
  FUEL_ACCENT,
  COUNTRY_FLAG,
  type FuelType,
} from "@/lib/policy-taxonomy";
import { subscribeToAlerts } from "@/lib/alerts.functions";

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

  const toggleCountry = (slug: string) => {
    setCountries((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const toggleFuel = (fuel: FuelType) => {
    setFuels((prev) =>
      prev.includes(fuel) ? prev.filter((f) => f !== fuel) : [...prev, fuel]
    );
  };

  const selectedCountryLabel =
    countries.length === 0
      ? "All jurisdictions"
      : `${countries.length} jurisdiction${countries.length === 1 ? "" : "s"}`;

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
        {/* Country coverage */}
        <div className="mb-5">
          <div className="mb-2.5 flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            <span className="label-mono text-foreground">Jurisdictions</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {selectedCountryLabel}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {COUNTRIES.map((c) => {
              const active = countries.includes(c.slug);
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => toggleCountry(c.slug)}
                  aria-pressed={active}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-all ${
                    active
                      ? "border-primary bg-primary/10 font-medium text-primary shadow-sm"
                      : "border-border bg-surface-1 text-foreground hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  <span className="text-base leading-none">{COUNTRY_FLAG[c.slug]}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  {active ? (
                    <Check className="size-3.5 shrink-0 text-primary" />
                  ) : (
                    <span className="size-3.5 shrink-0 rounded-full border border-border" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fuel coverage */}
        <div className="mb-5">
          <div className="mb-2.5 flex items-center gap-2">
            <Fuel className="size-4 text-primary" />
            <span className="label-mono text-foreground">Fuel types</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {fuels.length === 0 ? "All fuels" : `${fuels.length} selected`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {FUEL_TYPES.map((f) => {
              const active = fuels.includes(f);
              const accent = FUEL_ACCENT[f];
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFuel(f)}
                  aria-pressed={active}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all"
                  style={{
                    borderColor: active ? accent : "var(--border)",
                    backgroundColor: active
                      ? `color-mix(in oklab, ${accent} 15%, transparent)`
                      : `color-mix(in oklab, ${accent} 8%, transparent)`,
                    color: active ? `color-mix(in oklab, ${accent} 55%, var(--foreground))` : "var(--foreground)",
                  }}
                >
                  {active ? (
                    <Check className="size-3.5" style={{ color: accent }} />
                  ) : (
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                  )}
                  {f}
                </button>
              );
            })}
          </div>
        </div>

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
