import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

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
    <LegalPage
      title="Terms of Use"
      subtitle="The rules and disclaimers that apply when you use the Global Bioenergy Watch website, data feeds, email summaries, and exports."
    >
      <section className="legal-document">
        <div className="space-y-6 text-sm/relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">Last updated: September 2026</p>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              1. Acceptance of terms
            </h2>
            <p className="mt-2">
              By accessing or using Global Bioenergy Watch (the “Site”), you agree to be bound by
              these Terms of Use and all applicable laws and regulations. If you do not agree to
              these terms, please do not access or use the Site. We may update these terms at any
              time, and your continued use of the Site after such changes constitutes acceptance of
              the revised terms.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              2. Definitions
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>“Site”</strong> means the Global Bioenergy Watch website, applications, data
                feeds, email summaries, and related services.
              </li>
              <li>
                <strong>“Content”</strong> means all information, data, text, images, charts, maps,
                videos, and other materials available through the Site.
              </li>
              <li>
                <strong>“User,” “you,” and “your”</strong> mean any person or entity accessing or
                using the Site.
              </li>
              <li>
                <strong>“We,” “us,” and “our”</strong> mean Global Bioenergy Watch and its
                operators.
              </li>
              <li>
                <strong>“Third-Party Content”</strong> means content sourced from external
                governments, regulators, companies, news outlets, job boards, and other third
                parties.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              3. What we provide
            </h2>
            <p className="mt-2">
              The Site aggregates and classifies publicly available biofuel and bioenergy policy
              updates, market indicators, producer profiles, job listings, carbon-intensity
              calculators, and related news from a range of third-party sources. We do not create
              the underlying legislation, filings, press releases, or corporate disclosures. Our
              role is to organize, summarize, and present information to help users track
              developments in global bioenergy policy and markets.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              4. Eligibility and accounts
            </h2>
            <p className="mt-2">
              You must be at least 18 years old or have reached the legal age of majority in your
              jurisdiction to create an account or use features that require authentication. When
              you register, you agree to provide accurate, current, and complete information and to
              keep it updated. You are responsible for maintaining the confidentiality of your
              account credentials and for all activities that occur under your account. Notify us
              immediately of any unauthorized use or security breach.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              5. Use of content and permitted activities
            </h2>
            <p className="mt-2">
              Subject to these terms, we grant you a limited, non-exclusive, non-transferable,
              revocable license to access and use the Site and its Content for personal, research,
              journalistic, or internal business purposes. Permitted activities include:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Viewing, reading, and sharing links to Site pages.</li>
              <li>
                Downloading exports and email summaries where authentication or subscription
                entitlements permit.
              </li>
              <li>
                Using the carbon-intensity calculator and other interactive tools for analysis and
                reporting.
              </li>
              <li>
                Citing short excerpts with proper attribution to Global Bioenergy Watch and the
                original source.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              6. Prohibited activities
            </h2>
            <p className="mt-2">You may not:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Republish, redistribute, or sell Site Content in bulk as a standalone database or
                API-style feed without written permission.
              </li>
              <li>
                Use automated tools, scrapers, bots, or crawlers to extract data in a way that
                degrades service for others or bypasses authentication.
              </li>
              <li>
                Reverse-engineer, decompile, or attempt to access the source code or infrastructure
                of the Site.
              </li>
              <li>
                Interfere with the Site’s security features, gain unauthorized access to systems, or
                disrupt service availability.
              </li>
              <li>Use the Site to distribute malware, spam, or unlawful content.</li>
              <li>Impersonate another person or misrepresent your affiliation with any entity.</li>
              <li>
                Remove or alter copyright notices, watermarks, or other proprietary markings from
                exports or downloads.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              7. No legal, investment, or compliance advice
            </h2>
            <p className="mt-2">
              All information on the Site is provided for informational purposes only. It is not
              legal, tax, investment, environmental, engineering, or regulatory compliance advice.
              Decisions based on Site Content should be verified against the original government or
              source document and, where appropriate, qualified professional advisors.
              Carbon-intensity estimates, market figures, and policy summaries are illustrative and
              may not reflect the latest amendments or jurisdictional nuances.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              8. Accuracy, availability, and disclaimer of warranties
            </h2>
            <p className="mt-2">
              We aim to keep the Site accurate and current, but we do not guarantee completeness,
              timeliness, accuracy, or error-free operation. Sources, classifications, market
              figures, and policy statuses may change without notice. The Site is provided on an “as
              is” and “as available” basis without warranties of any kind, whether express or
              implied, including but not limited to warranties of merchantability, fitness for a
              particular purpose, or non-infringement.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              9. Limitation of liability
            </h2>
            <p className="mt-2">
              To the maximum extent permitted by law, Global Bioenergy Watch and its operators,
              affiliates, officers, directors, employees, agents, and licensors will not be liable
              for any direct, indirect, incidental, consequential, special, or punitive damages
              arising out of your use of, or inability to use, the Site or its Content, even if
              advised of the possibility of such damages. This includes losses related to business
              interruption, lost profits, lost data, or reliance on any information obtained through
              the Site.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              10. Intellectual property
            </h2>
            <p className="mt-2">
              The Global Bioenergy Watch name, logo, visual design, compiled datasets, charts, maps,
              written summaries, videos, calculators, and software are our property or licensed to
              us and are protected by copyright, trademark, and other intellectual property laws.
              Third-party trademarks, logos, and source content belong to their respective owners
              and are used under fair-use, attribution, or license principles. Nothing in these
              terms grants you any right to use our trademarks or branding without prior written
              consent.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              11. Third-party links, job listings, and integrations
            </h2>
            <p className="mt-2">
              The Site links to external sources, employer career pages, job boards, government
              portals, social media platforms, and other third-party services. We are not
              responsible for their content, privacy practices, terms, or availability. Job listings
              are aggregated and do not imply endorsement of the employer or the vacancy. Use of
              third-party integrations, such as LinkedIn publishing, is subject to those providers’
              terms as well as ours.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              12. User-generated content and conduct
            </h2>
            <p className="mt-2">
              If the Site allows you to submit comments, feedback, or other content, you retain
              ownership of your submissions but grant us a perpetual, worldwide, royalty-free
              license to use, reproduce, modify, adapt, publish, and display them for the purpose of
              operating and promoting the Site. You represent that your submissions do not violate
              any third-party rights or applicable laws. We reserve the right to remove content that
              is unlawful, abusive, spam, or otherwise objectionable.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              13. Privacy and cookies
            </h2>
            <p className="mt-2">
              Your use of the Site is also governed by our Privacy Policy and Cookie practices,
              which describe how we collect, use, store, and protect your information. By using the
              Site, you consent to those practices. If you do not agree with our Privacy Policy,
              please discontinue use of the Site.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              14. Subscriptions, billing, and refunds
            </h2>
            <p className="mt-2">
              Some features, such as bulk exports, emailed analyst summaries, or advanced analytics,
              may be offered on a subscription or one-time purchase basis. Fees, billing cycles, and
              refund policies will be presented at the point of purchase. You agree to provide
              accurate billing information and authorize us to charge the applicable fees.
              Subscriptions automatically renew unless cancelled before the renewal date. You may
              cancel at any time through your account settings or by contacting us.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              15. Termination and suspension
            </h2>
            <p className="mt-2">
              We may suspend or terminate your access to the Site, in whole or in part, at any time
              and without prior notice if we believe you have violated these terms, engaged in
              fraudulent or harmful activity, or pose a risk to the Site or other users. Upon
              termination, all licenses granted to you will immediately cease, but provisions
              related to intellectual property, disclaimers, limitation of liability, and governing
              law will survive.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              16. Indemnification
            </h2>
            <p className="mt-2">
              You agree to indemnify, defend, and hold harmless Global Bioenergy Watch and its
              operators, affiliates, officers, directors, employees, and agents from and against any
              claims, liabilities, damages, losses, or expenses (including reasonable attorneys’
              fees) arising out of your use of the Site, your violation of these terms, or your
              infringement of any third-party rights.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              17. DMCA and copyright complaints
            </h2>
            <p className="mt-2">
              If you believe that material on the Site infringes your copyright, please send a
              written notice to our designated copyright agent with a description of the copyrighted
              work, the URL of the allegedly infringing material, your contact information, a
              statement of good faith, and a declaration under penalty of perjury that the
              information is accurate and that you are authorized to act on behalf of the copyright
              owner. We will respond in accordance with applicable law.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              18. Dispute resolution and governing law
            </h2>
            <p className="mt-2">
              These terms are governed by the laws of the State of New York, United States, without
              regard to conflict-of-law principles. Any dispute arising out of or relating to these
              terms or your use of the Site shall be resolved exclusively in the state or federal
              courts located in New York County, New York, and you consent to the personal
              jurisdiction and venue of those courts. Before filing a claim, you agree to attempt to
              resolve the dispute informally by contacting us.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              19. International use
            </h2>
            <p className="mt-2">
              The Site is controlled and operated from the United States. We make no representation
              that the Site is appropriate or available for use in other jurisdictions. Users
              accessing the Site from outside the United States do so at their own initiative and
              are responsible for compliance with local laws.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              20. Force majeure
            </h2>
            <p className="mt-2">
              We will not be liable for any failure or delay in performance due to circumstances
              beyond our reasonable control, including but not limited to acts of God, war,
              terrorism, riots, embargoes, pandemics, labor disputes, government actions, internet
              outages, or failures of third-party service providers.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              21. Severability and entire agreement
            </h2>
            <p className="mt-2">
              If any provision of these terms is found to be invalid or unenforceable, the remaining
              provisions will continue in full force and effect. These terms, together with our
              Privacy Policy and any other policies referenced herein, constitute the entire
              agreement between you and Global Bioenergy Watch regarding the Site and supersede any
              prior agreements or understandings.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              22. Changes to these terms
            </h2>
            <p className="mt-2">
              We may update these Terms of Use at any time to reflect changes in our services, legal
              requirements, or business practices. Material changes will be posted on this page with
              an updated “Last updated” date. Continued use of the Site after changes are posted
              means you accept the revised terms.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              23. Contact
            </h2>
            <p className="mt-2">
              For questions about these terms, to report abuse, or to submit a copyright notice,
              reach out through our{" "}
              <a
                href="/#footer-contact"
                className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
              >
                Contact us
              </a>{" "}
              page.
            </p>
          </div>
        </div>
      </section>
    </LegalPage>
  );
}
