import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Loader2, MapPin, Fuel } from "lucide-react";
import { subscribeToAlerts } from "@/features/alerts/server-functions";
import { MultiSelectDropdown } from "@/features/alerts/components/AlertSignup";
import { COUNTRIES, FUEL_TYPES } from "@/features/policy/taxonomy";

export function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [fuels, setFuels] = useState<string[]>([]);
  const subscribe = useServerFn(subscribeToAlerts);
  const mutation = useMutation({
    mutationFn: (input: { email: string; fuels: string[]; countries: string[] }) =>
      subscribe({ data: input }),
  });
  const status = mutation.data?.status;
  const message = mutation.isError
    ? "Could not subscribe. Please try again."
    : status === "confirmation_sent"
      ? "Check your inbox and confirm your subscription to start receiving the daily brief."
      : status === "already_confirmed"
        ? "You’re subscribed to the daily brief."
        : status === "suppressed"
          ? "This address cannot receive emails. Please try another address."
          : null;
  return (
    <section className="footer-newsletter" id="brief" aria-labelledby="brief-title">
      <h2 id="brief-title">Get the daily brief</h2>
      <p>AI-summarised policy and market updates from around the world, delivered once a day.</p>
      <div className="footer-coverage-controls">
        <MultiSelectDropdown
          label="Country"
          icon={MapPin}
          options={[...COUNTRIES]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((country) => ({
              value: country.slug,
              name: country.name,
              label: country.name,
            }))}
          selected={countries}
          onChange={(values) => {
            setCountries(values);
            mutation.reset();
          }}
          renderSummary={(names) => (names.length ? `${names.length} selected` : "All countries")}
        />
        <MultiSelectDropdown
          label="Fuel type"
          icon={Fuel}
          options={FUEL_TYPES.map((fuel) => ({ value: fuel, name: fuel, label: fuel }))}
          selected={fuels}
          onChange={(values) => {
            setFuels(values);
            mutation.reset();
          }}
          renderSummary={(names) => (names.length ? `${names.length} selected` : "All fuels")}
        />
      </div>
      <form
        className="footer-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!mutation.isPending) mutation.mutate({ email: email.trim(), fuels, countries });
        }}
      >
        <label className="sr-only" htmlFor="brief-email">
          Email address
        </label>
        <input
          id="brief-email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          maxLength={255}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            mutation.reset();
          }}
          disabled={mutation.isPending}
        />
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <>
              Subscribing <Loader2 className="animate-spin" />
            </>
          ) : (
            <>
              Subscribe <ArrowRight />
            </>
          )}
        </button>
      </form>
      {message ? (
        <p
          className="footer-feedback"
          role={mutation.isError || status === "suppressed" ? "alert" : "status"}
          data-error={mutation.isError || status === "suppressed"}
        >
          {message}
        </p>
      ) : (
        <p className="footer-fine">Unsubscribe anytime.</p>
      )}
    </section>
  );
}
