import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { unsubscribeFromAlerts } from "@/features/alerts/server-functions";

export const Route = createFileRoute("/alerts/unsubscribe")({
  validateSearch: z.object({ token: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Unsubscribe from GBW daily briefs | Global Bioenergy Watch" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const { token } = Route.useSearch();
  const unsubscribe = useServerFn(unsubscribeFromAlerts);
  const mutation = useMutation({
    mutationFn: (value: string) => unsubscribe({ data: { token: value } }),
  });
  const hasValidToken = typeof token === "string" && /^[a-f0-9]{48}$/i.test(token);
  const done = mutation.data?.ok === true;

  return (
    <main className="mx-auto max-w-xl px-5 py-20">
      <section className="glass-panel p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Global Bioenergy Watch · Email preferences
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">
          {done ? "You're unsubscribed" : "Unsubscribe from daily briefs"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {done
            ? "Your daily policy and market email subscription is now inactive. You can subscribe again at any time."
            : "You can stop receiving the Global Bioenergy Watch daily policy and market brief. This will not affect your website account or saved calculations."}
        </p>
        {done ? (
          <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Return to Global Bioenergy Watch
          </Link>
        ) : !hasValidToken ? (
          <p role="alert" className="mt-6 text-sm text-destructive">
            This unsubscribe link is missing or invalid. Please use the link in your most recent daily brief.
          </p>
        ) : (
          <>
            <button
              type="button"
              className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(token)}
            >
              {mutation.isPending ? "Unsubscribing…" : "Confirm unsubscribe"}
            </button>
            {mutation.data && !mutation.data.ok ? (
              <p role="status" className="mt-4 text-sm text-muted-foreground">
                This subscription is already inactive or the link has been replaced.
              </p>
            ) : null}
            {mutation.isError ? (
              <p role="alert" className="mt-4 text-sm text-destructive">
                We could not update the subscription. Please try again.
              </p>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
