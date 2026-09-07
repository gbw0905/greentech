import { createFileRoute, Link } from "@tanstack/react-router";
import { BellRing, Globe2, Fuel, Map, ShieldCheck, MailCheck, ArrowRight } from "lucide-react";
import { AlertSignup } from "@/components/AlertSignup";
import { PageShell, PageHeading } from "@/components/PageShell";
import { useVisitTracker } from "@/hooks/useVisitTracker";

const TITLE = "Free Bioenergy Policy Alerts | Global Bioenergy Watch";
const DESCRIPTION =
  "Get a free daily email digest of biofuel policy and market updates — SAF, ethanol, biodiesel and renewable diesel mandates tracked across governments worldwide.";

export const Route = createFileRoute("/get-alerts")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "https://globalbioenergywatch.org/get-alerts" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://globalbioenergywatch.org/get-alerts" }],
  }),
  component: GetAlertsPage,
});

const BENEFITS = [
  {
    icon: Globe2,
    title: "Worldwide coverage",
    body: "Government portals, regulators and agencies across the Americas, Europe, Asia, Africa and Oceania — scanned continuously.",
  },
  {
    icon: Fuel,
    title: "Every fuel that matters",
    body: "SAF, ethanol, biodiesel, renewable diesel, biogas and feedstock policy — filter your digest to the fuels you follow.",
  },
  {
    icon: MailCheck,
    title: "One daily digest",
    body: "AI-classified summaries with jurisdiction, fuel type and source link. No noise, no multiple emails per day.",
  },
  {
    icon: ShieldCheck,
    title: "Official sources first",
    body: "Items are collected from official government and regulatory portals and established energy press — always linked so you can verify.",
  },
];

function GetAlertsPage() {
  useVisitTracker();
  return (
    <PageShell
      kicker="Free email alerts"
      title="Never miss a biofuel policy change again"
      subtitle="A free daily digest of global bioenergy policy and market updates — mandates, blending targets, tax credits and SAF incentives, classified by AI and delivered to your inbox."
    >
      <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <div key={b.title} className="glass-panel card-motion p-5">
                <b.icon className="size-5 text-primary" />
                <h2 className="mt-2 font-display text-base font-bold text-foreground">{b.title}</h2>
                <p className="mt-1.5 text-sm/relaxed text-muted-foreground">{b.body}</p>
              </div>
            ))}
          </div>
          <div className="glass-panel border-l-4 border-l-primary p-5">
            <h2 className="font-display text-base font-bold text-foreground">Prefer to explore first?</h2>
            <p className="mt-1.5 text-sm/relaxed text-muted-foreground">
              Browse the live dashboard — jurisdiction map, market benchmarks, supply and producer datasets, and jobs.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to="/"
                className="label-mono inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10"
              >
                <Map className="size-3.5" /> Open the live dashboard
              </Link>
              <Link
                to="/data-sources"
                className="label-mono inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10"
              >
                See our data sources <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div id="subscribe" className="lg:sticky lg:top-24">
          <div className="ink-bar ribbon-sheen mb-4 border-l-4 border-l-primary px-4 py-3">
            <span className="kicker inline-flex items-center gap-1.5 text-accent-foreground">
              <BellRing className="size-3" />
              Subscribe free
            </span>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-ink-foreground">
              Daily bioenergy policy digest
            </h2>
          </div>
          <AlertSignup />
        </div>
      </div>
    </PageShell>
  );
}
