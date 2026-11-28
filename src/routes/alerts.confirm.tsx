import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { confirmAlertSubscription } from "@/features/alerts/server-functions";

const TITLE = "Confirm policy alerts | Global Bioenergy Watch";
const DESCRIPTION =
  "Confirm your email subscription to daily global bioenergy and biofuel policy update alerts.";

export const Route = createFileRoute("/alerts/confirm")({
  validateSearch: z.object({ token: z.string().optional() }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfirmPage,
});

function ConfirmPage() {
  const { token } = Route.useSearch();
  const confirm = useServerFn(confirmAlertSubscription);
  const mutation = useMutation({
    mutationFn: (value: string) => confirm({ data: { token: value } }),
  });
  const done = mutation.data?.ok === true;
  const invalid = !token || !/^[a-f0-9]{48}$/i.test(token) || mutation.data?.ok === false;

  return (
    <main className="mx-auto max-w-xl px-5 py-20">
      <section className="glass-panel rise p-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {done ? "You're subscribed" : invalid ? "Link not valid" : "Confirm your subscription"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {done
            ? "You'll receive the daily policy brief. Each email has an unsubscribe link."
            : invalid
              ? "Use the link in your confirmation email or sign up again."
              : "Confirm to receive daily bioenergy policy and market briefs."}
        </p>
        {done || invalid ? (
          <Link
            to="/"
            className="mt-6 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Back to the desk
          </Link>
        ) : (
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(token)}
            className="mt-6 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {mutation.isPending ? "Confirming…" : "Confirm subscription"}
          </button>
        )}
        {mutation.isError ? (
          <p role="alert" className="mt-4 text-sm text-destructive">
            Could not confirm the subscription. Please try again.
          </p>
        ) : null}
      </section>
    </main>
  );
}
