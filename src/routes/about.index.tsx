import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe2, ArrowRight, Compass, Users } from "lucide-react";
import { PageShell, PageHeading } from "@/components/PageShell";

const TITLE = "About Us — Global Bioenergy Watch";
const DESCRIPTION =
  "Global Bioenergy Watch is an independent intelligence desk tracking biofuel policy and market developments across jurisdictions worldwide.";

export const Route = createFileRoute("/about/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://globalbioenergywatch.org/about" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://globalbioenergywatch.org/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageShell>
      <PageHeading
        icon={Globe2}
        title="About Global Bioenergy Watch"
        subtitle="An independent policy and market intelligence desk for the global bioenergy sector — tracking what governments mandate and what markets do, in one place."
      />

      <section className="rounded-lg border border-border bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-display text-xl font-extrabold tracking-tight text-foreground">
          What we do
        </h2>
        <div className="mt-4 space-y-4 text-sm/relaxed text-muted-foreground">
          <p>
            Global Bioenergy Watch continuously scans government agencies, regulators, and highly
            credible media outlets worldwide for bioenergy developments — ethanol, biodiesel,
            renewable diesel, sustainable aviation fuel (SAF), and emerging feedstocks such as used
            cooking oil (UCO). Every verified policy act and market move is classified by
            jurisdiction and fuel type, then published to a live tracker with source citations.
          </p>
          <p>
            Beyond the news feed, the platform maps policy mandates by country, benchmarks crude
            oil, equities and gold, profiles the companies moving the sector — oil majors, SAF
            airlines, fuel retailers, marine suppliers, and UCO traders — and connects readers to
            bioenergy careers. AI-powered summaries turn dense regulatory filings into readable
            briefings delivered by email on demand.
          </p>
          <p>
            The desk is built for analysts, researchers, investors, policymakers, and journalists
            who need one trustworthy place to follow a fast-moving global sector.
          </p>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <Link
          to="/about/mission-vision"
          className="group rounded-lg border border-border bg-white p-6 shadow-sm transition-all hover:border-foreground/30 hover:shadow-md"
        >
          <Compass className="size-6 text-foreground" />
          <h3 className="mt-3 font-display text-lg font-extrabold text-foreground">
            Mission &amp; vision
          </h3>
          <p className="mt-2 text-sm/relaxed text-muted-foreground">
            Why this desk exists and where it is heading.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
            Read more
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
        <Link
          to="/about/team"
          className="group rounded-lg border border-border bg-white p-6 shadow-sm transition-all hover:border-foreground/30 hover:shadow-md"
        >
          <Users className="size-6 text-foreground" />
          <h3 className="mt-3 font-display text-lg font-extrabold text-foreground">
            Team members
          </h3>
          <p className="mt-2 text-sm/relaxed text-muted-foreground">
            The people behind the tracker.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
            Meet the team
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </section>
    </PageShell>
  );
}
