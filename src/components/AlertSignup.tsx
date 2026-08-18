import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BellRing, Check, Loader2 } from "lucide-react";
import { FUEL_TYPES, FUEL_ACCENT, type FuelType } from "@/lib/policy-taxonomy";
import { subscribeToAlerts } from "@/lib/alerts.functions";

export function AlertSignup() {
  const subscribe = useServerFn(subscribeToAlerts);
  const [email, setEmail] = useState("");
  const [fuels, setFuels] = useState<FuelType[]>([]);
  const [cadence, setCadence] = useState<"instant" | "daily" | "weekly">("daily");

  const mutation = useMutation({
    mutationFn: (input: {
      email: string;
      fuels: string[];
      countries: string[];
      cadence: "instant" | "daily" | "weekly";
    }) => subscribe({ data: input }),
  });

  const status = mutation.data?.status;

  return (
    <div className="glass-panel rise p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15">
          <BellRing className="size-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold">Get AI policy briefs by email</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-written briefs whenever new bioenergy policy moves land. Choose how often you hear
            from us and pick the fuels you follow, or leave blank for everything. Unsubscribe any
            time.
          </p>

          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.trim()) return;
              mutation.mutate({ email: email.trim(), fuels, countries: [], cadence });
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
              className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
            >
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Subscribe
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="label-mono text-muted-foreground">Frequency</span>
            {(["instant", "daily", "weekly"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCadence(c)}
                aria-pressed={cadence === c}
                className={`label-mono rounded-full px-3 py-1 transition-colors ${
                  cadence === c
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {c === "instant" ? "Instant" : c === "daily" ? "Daily digest" : "Weekly digest"}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {FUEL_TYPES.map((f) => {
              const active = fuels.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() =>
                    setFuels((prev) => (active ? prev.filter((x) => x !== f) : [...prev, f]))
                  }
                  className="label-mono rounded-full px-3 py-1 transition-colors"
                  style={{
                    backgroundColor: active
                      ? FUEL_ACCENT[f]
                      : `color-mix(in oklab, ${FUEL_ACCENT[f]} 14%, transparent)`,
                    color: active ? "white" : FUEL_ACCENT[f],
                  }}
                  aria-pressed={active}
                >
                  {f}
                </button>
              );
            })}
          </div>

          {status === "confirmation_sent" && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
              <Check className="size-4" /> Check your inbox — confirm the link to activate alerts.
            </p>
          )}
          {status === "already_confirmed" && (
            <p className="mt-4 text-sm font-medium text-primary">
              You're already subscribed — your fuel preferences have been updated.
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
    </div>
  );
}