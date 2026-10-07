import { createFileRoute } from "@tanstack/react-router";
import {
  Compass,
  Target,
  Telescope,
  ArrowRight,
  FileCheck2,
  ChartNoAxesCombined,
  Globe2,
  Sparkles,
} from "lucide-react";
import { InformationPage } from "@/components/InformationPage";

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
    <InformationPage
      active="mission"
      icon={Compass}
      title="Mission & vision"
      subtitle="Why Global Bioenergy Watch exists — and the standard we hold ourselves to every day."
    >
      <section className="even">
        <div className="card">
          <div className="head-ic">
            <span className="icon">
              <Target className="size-5" />
            </span>
            <h2>Our mission</h2>
          </div>
          <blockquote className="quote">
            Make global bioenergy policy and market intelligence transparent, timely, and accessible
            to everyone.
          </blockquote>
          <div className="prose">
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

        <div className="card">
          <div className="head-ic">
            <span className="icon">
              <Telescope className="size-5" />
            </span>
            <h2>Our vision</h2>
          </div>
          <blockquote className="quote">
            Be the first place professionals check when a mandate changes.
          </blockquote>
          <div className="prose">
            <p>
              To become the reference desk for the biofuel dimension of the global energy transition
              — the first place professionals check when a mandate changes, a feedstock market
              moves, or a new production pathway emerges.
            </p>
            <p>
              Long term, we see open, verifiable energy policy data as essential infrastructure: it
              accelerates investment, improves regulation, and holds the transition honest.
            </p>
          </div>
        </div>
      </section>

      <section className="card">
        <p className="k">Principles</p>
        <h2>What guides our coverage</h2>
        <div className="princ">
          {[
            {
              icon: FileCheck2,
              title: "Sources first",
              text: "Government acts and regulator filings lead; media coverage adds context. Every item links to its source.",
            },
            {
              icon: ChartNoAxesCombined,
              title: "Policy and markets together",
              text: "Mandates move markets and markets test mandates — we track both side by side.",
            },
            {
              icon: Globe2,
              title: "Global by default",
              text: "From Washington’s 45Z credits to Indonesia’s B40 blend, no jurisdiction is too small to matter.",
            },
            {
              icon: Sparkles,
              title: "Honest about AI",
              text: "Summaries are machine-assisted and clearly labeled — always cross-verify against primary legislation.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <article className="pr" key={title}>
              <h3>
                <Icon size={18} />
                {title}
              </h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="cta">
        <div>
          <h2>Follow the sector, one brief a day</h2>
          <p>AI-assisted policy and market summaries, delivered once a day.</p>
        </div>
        <a className="btn" href="#brief">
          Get the daily brief <ArrowRight size={17} />
        </a>
      </section>
    </InformationPage>
  );
}
