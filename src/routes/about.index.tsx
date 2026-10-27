import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, GraduationCap, BriefcaseBusiness, Landmark, Newspaper } from "lucide-react";
import { InformationPage } from "@/components/InformationPage";

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
    <InformationPage
      active="about"
      title="About Global Bioenergy Watch"
      subtitle="An independent policy and market intelligence desk for the global bioenergy sector — tracking what governments mandate and what markets do, in one place."
    >
      <section className="two">
        <article className="card">
          <p className="k">Who we are</p>
          <h2>What we do</h2>
          <div className="prose">
            <p>
              Global Bioenergy Watch continuously scans government agencies, regulators, and highly
              credible media outlets worldwide for bioenergy developments — ethanol, biodiesel,
              renewable diesel, sustainable aviation fuel (SAF), and emerging feedstocks such as
              used cooking oil (UCO). Every verified policy act and market move is classified by
              jurisdiction and fuel type, then published to a live tracker with source citations.
            </p>
            <p>
              Beyond the news feed, the platform maps policy mandates by country, benchmarks crude
              oil, equities and natural gas, profiles the companies moving the sector — oil majors,
              SAF airlines, fuel retailers, marine suppliers, and UCO traders — and connects readers
              to bioenergy careers. AI-powered summaries turn dense regulatory filings into readable
              briefings delivered by email on demand.
            </p>
            <p>
              The desk is built for analysts, researchers, investors, policymakers, and journalists
              who need one trustworthy place to follow a fast-moving global sector.
            </p>
          </div>
        </article>
        <article className="card">
          <p className="k">Method</p>
          <h2>How the desk works</h2>
          <ol className="steps">
            {[
              ["Scan", "Regulators, agencies and credible media, worldwide."],
              ["Classify", "By jurisdiction and fuel type."],
              ["Publish", "To the live tracker, with source citations."],
              ["Brief", "AI-assisted summaries delivered by email."],
            ].map(([label, detail]) => (
              <li key={label}>
                <b>{label}</b>
                <span>{detail}</span>
              </li>
            ))}
          </ol>
        </article>
      </section>
      <section className="card">
        <p className="k">Audience</p>
        <h2>Built for people who follow the sector</h2>
        <div className="aud">
          {[
            { icon: BarChart3, label: "Analysts" },
            { icon: GraduationCap, label: "Researchers" },
            { icon: BriefcaseBusiness, label: "Investors" },
            { icon: Landmark, label: "Policymakers" },
            { icon: Newspaper, label: "Journalists" },
          ].map(({ icon: Icon, label }) => (
            <span key={label}>
              <Icon size={17} />
              {label}
            </span>
          ))}
        </div>
      </section>
    </InformationPage>
  );
}
