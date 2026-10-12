import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Loader2 } from "lucide-react";
import { subscribeToAlerts } from "@/features/alerts/server-functions";

export function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const subscribe = useServerFn(subscribeToAlerts);
  const mutation = useMutation({
    mutationFn: (address: string) =>
      subscribe({ data: { email: address, fuels: [], countries: [] } }),
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
      <form
        className="footer-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!mutation.isPending) mutation.mutate(email.trim());
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
        <p className="footer-fine">No spam. Unsubscribe anytime.</p>
      )}
    </section>
  );
}
