import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { PageHeading, PageShell } from "@/components/PageShell";

const TITLE = "Privacy Policy — Global Bioenergy Watch";
const DESCRIPTION =
  "Read the Global Bioenergy Watch Privacy Policy: how we collect, use, store and protect visitor data, cookies and AI assistant conversations.";
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
    <PageShell>
      <PageHeading
        icon={Shield}
        title="Privacy Policy"
        subtitle="How Global Bioenergy Watch collects, uses, stores and protects your data, cookies and assistant conversations."
      />

      <section className="rounded-lg border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-6 text-sm/relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">Last updated: September 2026</p>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              1. Introduction
            </h2>
            <p className="mt-2">
              This Privacy Policy explains how Global Bioenergy Watch (the “Site”) handles information about visitors, registered users, and people who use the AI assistant. It describes what we collect, why we collect it, how long we keep it, and the rights you have over your information. By using the Site, you agree to this policy. If you do not agree, please do not use the Site.
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
              <li><strong>Visit data.</strong> We record page views, approximate location, referrer/UTM source, browser type, device category, operating system, and IP-derived metadata. This helps us understand which jurisdictions, topics and channels drive interest in bioenergy policy.</li>
              <li><strong>Account data.</strong> If you create an account or sign in with email, Google or Microsoft, we store the email address, provider name and any profile name supplied by the authentication provider. We do not collect or store passwords directly; sign-in is handled by our identity provider.</li>
              <li><strong>Assistant conversations.</strong> Messages you send to the AI assistant, and the assistant’s replies, are stored so you can continue a conversation across sessions and refer back to prior answers. Threads are tied to your account when you are signed in.</li>
              <li><strong>Usage and preference data.</strong> We may record feature usage, export requests, alert preferences, calculator inputs, and filter selections to improve the Site and detect abuse.</li>
              <li><strong>Communication data.</strong> If you contact us through our public channels, we collect the information you choose to provide.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              3. Cookies and similar technologies
            </h2>
            <p className="mt-2">
              The Site uses cookies and local browser storage to remember your session, preserve assistant thread identifiers, and measure traffic.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Essential cookies.</strong> Required for authentication, security, and basic Site operation. These cannot be disabled without breaking sign-in or related features.</li>
              <li><strong>Analytics cookies.</strong> Help us count visits, measure traffic sources, and understand how users move through the Site. These are generally first-party or privacy-focused analytics tools.</li>
              <li><strong>Functional storage.</strong> Local storage may be used to cache calculator scenarios, saved filters, or assistant thread identifiers for a smoother experience.</li>
            </ul>
            <p className="mt-2">
              You can block or delete cookies through your browser settings, but some features may not work correctly if you do. We do not use cookies to sell advertising profiles or share browsing history with unrelated third parties for marketing purposes.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              4. AI assistant conversations
            </h2>
            <p className="mt-2">
              The AI assistant is designed to answer questions about bioenergy policy, mandates, country profiles, market data, producers and related topics. When you use it:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Your questions and the assistant’s responses are stored as conversation threads.</li>
              <li>Signed-in users can view and continue prior threads. Guest sessions are generally ephemeral and not tied to a persistent account.</li>
              <li>Conversations may be processed through an AI gateway to generate answers. Do not send personal data, confidential business information, or regulated data into the assistant unless you accept that it will be processed by these systems.</li>
              <li>We review conversation patterns only for quality, safety, abuse prevention, and service improvement. We do not use individual chat content for advertising.</li>
              <li>You can delete your assistant threads from your account context; deletion removes the thread from active storage in accordance with our retention schedule below.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              5. How we use your information
            </h2>
            <p className="mt-2">
              We use the information we collect to:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Provide, operate, and improve the Site, including the policy feed, maps, dashboards, calculators, and AI assistant.</li>
              <li>Authenticate users and enforce access controls for exports, email summaries, and saved preferences.</li>
              <li>Measure traffic, understand audience interests, and optimize content and performance.</li>
              <li>Detect and prevent abuse, spam, unauthorized access, or other harmful activity.</li>
              <li>Communicate with you about updates, alerts, or support requests.</li>
              <li>Comply with legal obligations and protect our rights.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              6. Legal basis for processing
            </h2>
            <p className="mt-2">
              Where applicable data-protection law requires a legal basis, we process personal data on the following grounds: (a) performance of our contract with you, such as providing access to authenticated features; (b) compliance with legal obligations; (c) our legitimate interests in operating, securing and improving the Site, provided those interests are not overridden by your rights; and (d) your consent, for example where you opt in to email alerts or analytics cookies.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              7. Data retention
            </h2>
            <p className="mt-2">
              We keep information only as long as necessary for the purposes described here. Visit-level analytics data is typically retained for up to 26 months, after which it is aggregated or deleted. Assistant conversation threads are retained while your account exists or while the ephemeral session is active, unless you delete them sooner. Aggregated, non-identifiable statistics may be kept longer for reporting and research.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              8. Data sharing
            </h2>
            <p className="mt-2">
              We do not sell your personal information. We share information only in the following limited circumstances:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Service providers.</strong> With trusted vendors that provide hosting, authentication, analytics, email delivery, and AI processing, bound by confidentiality and security obligations.</li>
              <li><strong>Legal requirements.</strong> When required by law, court order, or government request, or to protect our rights, safety, and property.</li>
              <li><strong>Business transfers.</strong> In connection with a merger, acquisition, or sale of assets, subject to appropriate safeguards.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              9. Data security
            </h2>
            <p className="mt-2">
              We use industry-standard technical and organizational measures to protect your information, including encryption in transit, access controls, row-level security in the database, and regular review of our infrastructure. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              10. Your rights and choices
            </h2>
            <p className="mt-2">
              Depending on your location, you may have rights to access, correct, delete, restrict, or port your personal data, and to object to or withdraw consent for certain processing. To exercise these rights, contact us through our{" "}
              <Link
                to="/contact"
                className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
              >
                Contact us
              </Link>{" "}
              page. We will respond within the time required by applicable law.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              11. Third-party services and links
            </h2>
            <p className="mt-2">
              The Site links to government portals, company websites, job boards, news outlets, LinkedIn, and other third-party services. Their privacy practices are governed by their own policies, not ours. Authentication providers and AI gateways each process data under their own terms.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              12. Children's privacy
            </h2>
            <p className="mt-2">
              The Site is not directed at children under 16, and we do not knowingly collect personal information from children. If you believe we have collected data from a child, please contact us and we will delete it.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              13. International data transfers
            </h2>
            <p className="mt-2">
              The Site is operated from the United States and may use service providers in other countries. If you access the Site from outside the United States, your information may be transferred to, stored in, and processed in the United States or other jurisdictions with different data-protection laws. We rely on appropriate safeguards, such as standard contractual clauses, where required.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              14. Changes to this Privacy Policy
            </h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time to reflect changes in our practices, services, or legal requirements. Material changes will be posted on this page with an updated “Last updated” date. Continued use of the Site after changes means you accept the revised policy.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              15. Contact
            </h2>
            <p className="mt-2">
              For questions about this Privacy Policy, to exercise your data rights, or to report a privacy concern, please reach out through our{" "}
              <Link
                to="/contact"
                className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
              >
                Contact us
              </Link>{" "}
              page. You may also request deletion of your account and associated assistant threads through the same channel.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
