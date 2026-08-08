import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { confirmAlertSubscription } from "@/lib/alerts.functions";

const TITLE = "Confirm policy alerts | Global Bioenergy Watch";
const DESCRIPTION =
  "Confirm your email subscription to daily global bioenergy and biofuel policy update alerts.";

export const Route = createFileRoute("/alerts/confirm")({
  validateSearch: z.object({ token: z.string().optional() }),
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: async ({ deps }) => {
    if (!deps.token) return { ok: false as const };
    return confirmAlertSubscription({ data: { token: deps.token } });
  },
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
  errorComponent: ({ error }) => (
    <div className="p-10 text-sm text-destructive" role="alert">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-sm">Nothing here.</div>,
});

function ConfirmPage() {
  const result = Route.useLoaderData();
  return (
    <main className="mx-auto max-w-xl px-5 py-20">
      <div className="glass-panel rise p-8">
        <h1 className="font-display text-2xl font-black tracking-tight">
          {result.ok ? "You're subscribed" : "Link not valid"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {result.ok
            ? "You'll get a daily email whenever new bioenergy policy updates land, covering the fuel types you selected. Every email has an unsubscribe link."
            : "This confirmation link is missing, expired or already used. Sign up again from the alerts section on the homepage."}
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Back to the desk
        </Link>
      </div>
    </main>
  );
}