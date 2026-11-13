import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

const TITLE = "Privacy Policy — Global Bioenergy Watch";
const DESCRIPTION =
  "Read the Global Bioenergy Watch Privacy Policy: how we collect, use, store and protect visitor data and cookies.";
const URL = "https://globalbioenergywatch.org/privacy";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="How Global Bioenergy Watch collects, uses, stores and protects your data and cookies."
    >
      <section className="legal-document">
        <div className="space-y-6 text-sm/relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">Last updated: November 2026</p>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              1. Introduction
            </h2>
            <p className="mt-2">
              This Privacy Policy explains how Global Bioenergy Watch (the “Site”) handles
              information about visitors and registered users. It describes what we collect, why we
              collect it, how long we keep it, and the rights you have over your information. By
              using the Site, you agree to this policy. If you do not agree, please do not use the
              Site.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              2. Information we collect
            </h2>
            <p className="mt-2">
              We collect different types of information depending on how you use the Site:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Visit data.</strong> We record page views, approximate location,
                referrer/UTM source, browser type, device category, operating system, and IP-derived
                metadata. This helps us understand which jurisdictions, topics and channels drive
                interest in bioenergy policy.
              </li>
              <li>
                <strong>Account data.</strong> If you create an account or sign in with email,
                Google or Microsoft, we store the email address, provider name and any profile name
                supplied by the authentication provider. We do not collect or store passwords
                directly; sign-in is handled by our identity provider.
              </li>
              <li>
                <strong>Usage and preference data.</strong> We may record feature usage, export
                requests, alert preferences, calculator inputs, and filter selections to improve the
                Site and detect abuse.
              </li>
              <li>
                <strong>Communication data.</strong> If you contact us through our public channels,
                we collect the information you choose to provide.
              </li>
            </ul>
          </div>

          <div>
            <h2
              id="cookies"
              className="font-display text-lg font-extrabold tracking-tight text-foreground"
            >
              3. Cookies and similar technologies
            </h2>
            <p className="mt-2">
              The Site uses cookies and local browser storage to remember your session and measure
              traffic.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Essential cookies.</strong> Required for authentication, security, and basic
                Site operation. These cannot be disabled without breaking sign-in or related
                features.
              </li>
              <li>
                <strong>Analytics cookies.</strong> Help us count visits, measure traffic sources,
                and understand how users move through the Site. These are generally first-party or
                privacy-focused analytics tools.
              </li>
              <li>
                <strong>PostHog analytics (when enabled).</strong> We use PostHog to measure
                anonymous page views and navigation on public GBW pages. The integration
                disables session recording, click and form autocapture, and browser
                persistence. Calculator inputs and authentication pages are not tracked.
              </li>
              <li>
                <strong>Functional storage.</strong> Local storage may be used to cache calculator
                scenarios, saved filters, or other preferences for a smoother experience.
              </li>
            </ul>
            <p className="mt-2">
              You can block or delete cookies through your browser settings, but some features may
              not work correctly if you do. We do not use cookies to sell advertising profiles or
              share browsing history with unrelated third parties for marketing purposes.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              4. How we use your information
            </h2>
            <p className="mt-2">We use the information we collect to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Provide, operate, and improve the Site, including the policy feed, maps, dashboards,
                and calculators.
              </li>
              <li>
                Authenticate users and enforce access controls for exports, email summaries, and
                saved preferences.
              </li>
              <li>
                Measure traffic, understand audience interests, and optimize content and
                performance.
              </li>
              <li>
                Detect and prevent abuse, spam, unauthorized access, or other harmful activity.
              </li>
              <li>Communicate with you about updates, alerts, or support requests.</li>
              <li>Comply with legal obligations and protect our rights.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              5. Legal basis for processing
            </h2>
            <p className="mt-2">
              Where applicable data-protection law requires a legal basis, we process personal data
              on the following grounds: (a) performance of our contract with you, such as providing
              access to authenticated features; (b) compliance with legal obligations; (c) our
              legitimate interests in operating, securing and improving the Site, provided those
              interests are not overridden by your rights; and (d) your consent, for example where
              you opt in to email alerts or analytics cookies.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              6. Data retention
            </h2>
            <p className="mt-2">
              We keep information only as long as necessary for the purposes described here.
              Visit-level analytics data is typically retained for up to 26 months, after which it
              is aggregated or deleted. Account-related records are retained while your account
              exists, unless you delete them sooner. Aggregated, non-identifiable statistics may be
              kept longer for reporting and research.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              7. Data sharing
            </h2>
            <p className="mt-2">
              We do not sell your personal information. We share information only in the following
              limited circumstances:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Service providers.</strong> With trusted vendors that provide hosting,
                authentication, analytics, and email delivery, bound by confidentiality and security
                obligations.
              </li>
              <li>
                <strong>Legal requirements.</strong> When required by law, court order, or
                government request, or to protect our rights, safety, and property.
              </li>
              <li>
                <strong>Business transfers.</strong> In connection with a merger, acquisition, or
                sale of assets, subject to appropriate safeguards.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              8. Data security
            </h2>
            <p className="mt-2">
              We use industry-standard technical and organizational measures to protect your
              information, including encryption in transit, access controls, row-level security in
              the database, and regular review of our infrastructure. No method of transmission or
              storage is completely secure, so we cannot guarantee absolute security.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              9. Your rights and choices
            </h2>
            <p className="mt-2">
              Depending on your location, you may have rights to access, correct, delete, restrict,
              or port your personal data, and to object to or withdraw consent for certain
              processing. To exercise these rights, contact us through our{" "}
              <Link
                to="/"
                hash="footer-contact"
                className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
              >
                Contact us
              </Link>{" "}
              page. We will respond within the time required by applicable law.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              10. Third-party services and links
            </h2>
            <p className="mt-2">
              The Site links to government portals, company websites, job boards, news outlets,
              LinkedIn, and other third-party services. Their privacy practices are governed by
              their own policies, not ours. Authentication providers process data under their own
              terms.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              11. Children's privacy
            </h2>
            <p className="mt-2">
              The Site is not directed at children under 16, and we do not knowingly collect
              personal information from children. If you believe we have collected data from a
              child, please contact us and we will delete it.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              12. International data transfers
            </h2>
            <p className="mt-2">
              The Site is operated from the United States and may use service providers in other
              countries. If you access the Site from outside the United States, your information may
              be transferred to, stored in, and processed in the United States or other
              jurisdictions with different data-protection laws. We rely on appropriate safeguards,
              such as standard contractual clauses, where required.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              13. Changes to this Privacy Policy
            </h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time to reflect changes in our
              practices, services, or legal requirements. Material changes will be posted on this
              page with an updated “Last updated” date. Continued use of the Site after changes
              means you accept the revised policy.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              14. Contact
            </h2>
            <p className="mt-2">
              For questions about this Privacy Policy, to exercise your data rights, or to report a
              privacy concern, please reach out through our{" "}
              <Link
                to="/"
                hash="footer-contact"
                className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
              >
                Contact us
              </Link>{" "}
              page.
            </p>
          </div>
        </div>
      </section>
    </LegalPage>
  );
}
