import { createFileRoute } from "@tanstack/react-router";
import { Compass, Target, Telescope } from "lucide-react";
import { PageShell, PageHeading } from "@/components/PageShell";

const TITLE = "Mission & Vision — Global Bioenergy Watch";
const DESCRIPTION =
  "Our mission: transparent, real-time bioenergy policy and market intelligence for everyone. Our vision: the reference desk for the global energy transition's biofuel dimension.";

export const Route = createFileRoute("/about/mission-vision")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://globalbioenergywatch.org/about/mission-vision" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://globalbioenergywatch.org/about/mission-vision" }],
  }),
  component: MissionVisionPage,
});

function MissionVisionPage() {
  return (
    <PageShell>
      <PageHeading
        icon={Compass}
        title="Mission & vision"
        subtitle="Why Global Bioenergy Watch exists — and the standard we hold ourselves to every day."
      />

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-9 items-center justify-center rounded-md bg-foreground text-background">
              <Target className="size-5" />
            </span>
            <h2 className="font-display text-xl font-extrabold tracking-tight text-foreground">
              Our mission
            </h2>
          </div>
          <div className="mt-4 space-y-4 text-sm/relaxed text-muted-foreground">
            <p>
              To make global bioenergy policy and market intelligence transparent, timely, and
              accessible to everyone — not just those who can afford expensive terminal
              subscriptions.
            </p>
            <p>
              Every day we scan government regulators and credible media across jurisdictions
              worldwide, classify what matters, and publish it with sources — so an analyst in
              Jakarta, a policymaker in Brussels, and a student in São Paulo all see the same
              picture at the same time.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-9 items-center justify-center rounded-md bg-foreground text-background">
              <Telescope className="size-5" />
            </span>
            <h2 className="font-display text-xl font-extrabold tracking-tight text-foreground">
              Our vision
            </h2>
          </div>
          <div className="mt-4 space-y-4 text-sm/relaxed text-muted-foreground">
            <p>
              To become the reference desk for the biofuel dimension of the global energy
              transition — the first place professionals check when a mandate changes, a feedstock
              market moves, or a new production pathway emerges.
            </p>
            <p>
              Long term, we see open, verifiable energy policy data as essential infrastructure:
              it accelerates investment, improves regulation, and holds the transition honest.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-display text-xl font-extrabold tracking-tight text-foreground">
          What guides our coverage
        </h2>
        <ul className="mt-4 grid gap-3 text-sm/relaxed text-muted-foreground sm:grid-cols-2">
          <li className="rounded-md border border-border bg-muted/40 p-4">
            <strong className="text-foreground">Sources first.</strong> Government acts and
            regulator filings lead; media coverage adds context. Every item links to its source.
          </li>
          <li className="rounded-md border border-border bg-muted/40 p-4">
            <strong className="text-foreground">Policy and markets together.</strong> Mandates
            move markets and markets test mandates — we track both side by side.
          </li>
          <li className="rounded-md border border-border bg-muted/40 p-4">
            <strong className="text-foreground">Global by default.</strong> From Washington's 45Z
            credits to Indonesia's B40 blend, no jurisdiction is too small to matter.
          </li>
          <li className="rounded-md border border-border bg-muted/40 p-4">
            <strong className="text-foreground">Honest about AI.</strong> Summaries are
            machine-assisted and clearly labeled — always cross-verify against primary legislation.
          </li>
        </ul>
      </section>
    </PageShell>
  );
}
