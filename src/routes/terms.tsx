import { createFileRoute } from "@tanstack/react-router";
import { Scale } from "lucide-react";
import { PageHeading, PageShell } from "@/components/PageShell";

const TITLE = "Terms of Use — Global Bioenergy Watch";
const DESCRIPTION =
  "Read the terms of use for Global Bioenergy Watch, including how our aggregated biofuel policy data, market updates, and analytics may be used.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://globalbioenergywatch.org/terms" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://globalbioenergywatch.org/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PageShell>
      <PageHeading
        icon={Scale}
        title="Terms of Use"
        subtitle="The rules and disclaimers that apply when you use the Global Bioenergy Watch website, data feeds, email summaries, and exports."
      />

      <section className="rounded-lg border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-6 text-sm/relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">Last updated: September 2026</p>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              1. Acceptance of terms
            </h2>
            <p className="mt-2">
              By accessing or using Global Bioenergy Watch (the “Site”), you agree to these Terms of
              Use. If you do not agree, please do not use the Site.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              2. What we provide
            </h2>
            <p className="mt-2">
              The Site aggregates and classifies publicly available biofuel and bioenergy policy
              updates, market indicators, producer profiles, job listings, and related news from a
              range of third-party sources. We do not create the underlying legislation, filings, or
              press releases.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              3. Use of content
            </h2>
            <p className="mt-2">
              You may view, share links to, and download exports of the Site’s content for personal,
              research, journalistic, or internal business purposes. You may not republish the data
              in bulk as a standalone database, sell access to our exports or API-style feeds, or
              scrape the Site in a way that degrades service for others.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              4. No legal, investment, or compliance advice
            </h2>
            <p className="mt-2">
              All information is provided for informational purposes only. It is not legal, tax,
              investment, environmental, or regulatory compliance advice. Always verify against the
              original government or source document before making decisions.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              5. Accuracy and availability
            </h2>
            <p className="mt-2">
              We aim to keep the Site accurate and current, but we do not guarantee completeness,
              timeliness, or error-free operation. Sources, classifications, and market figures may
              change without notice. The Site is provided on an “as is” and “as available” basis.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              6. Limitation of liability
            </h2>
            <p className="mt-2">
              To the maximum extent permitted by law, Global Bioenergy Watch and its operators will
              not be liable for any direct, indirect, incidental, consequential, or punitive damages
              arising out of your use of, or inability to use, the Site or its content.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              7. Intellectual property
            </h2>
            <p className="mt-2">
              The Global Bioenergy Watch name, logo, visual design, compiled datasets, charts, and
              written summaries are our property or licensed to us. Third-party trademarks, logos, and
              source content belong to their respective owners and are used under fair-use or
              attribution principles.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              8. Third-party links and job listings
            </h2>
            <p className="mt-2">
              The Site links to external sources, employer career pages, and job boards. We are not
              responsible for their content, privacy practices, or availability. Job listings are
              aggregated and do not imply endorsement of the employer or the vacancy.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              9. Changes to these terms
            </h2>
            <p className="mt-2">
              We may update these Terms of Use at any time. Continued use of the Site after changes
              are posted means you accept the revised terms.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              10. Governing law
            </h2>
            <p className="mt-2">
              These terms are governed by the laws of the State of New York, United States, without
              regard to conflict-of-law principles.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              11. Contact
            </h2>
            <p className="mt-2">
              For questions about these terms, reach out through our{" "}
              <a href="/contact" className="font-semibold text-foreground underline underline-offset-4 hover:text-primary">
                Contact us
              </a>{" "}
              page.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
