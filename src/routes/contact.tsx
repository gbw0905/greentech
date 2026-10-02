import { createFileRoute } from "@tanstack/react-router";
import { InformationPage } from "@/components/InformationPage";
import { Linkedin } from "lucide-react";

const LINKEDIN_URL = "https://www.linkedin.com/company/global-bioenergy-watch/";

const TITLE = "Contact Global Bioenergy Watch";
const DESCRIPTION =
  "Get in touch with the Global Bioenergy Watch desk about biofuel policy updates, data corrections or partnerships.";
const URL = "https://globalbioenergywatch.org/contact";

export const Route = createFileRoute("/contact")({
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
  component: ContactPage,
});

function ContactPage() {
  return (
    <InformationPage
      active="contact"
      icon={Linkedin}
      title="Get in touch"
      subtitle="Reach the Global Bioenergy Watch desk on LinkedIn for press, partnerships, data corrections, or general inquiries."
    >
      <div className="information-contact-grid">
        <section className="information-card information-contact-panel">
          <div className="information-card-heading">
            <span className="information-icon">
              <Linkedin className="size-5" />
            </span>
            <h2 className="information-card-title">Connect on LinkedIn</h2>
          </div>
          <p className="information-description">
            Messages are managed through the Global Bioenergy Watch company page.
          </p>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="information-company-link"
          >
            <div className="information-linkedin-mark">
              <Linkedin className="size-6 fill-current" />
            </div>
            <div className="min-w-0">
              <p className="information-company-name">Global Bioenergy Watch</p>
              <p className="information-company-url">linkedin.com/company/global-bioenergy-watch</p>
            </div>
          </a>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="information-contact-button"
          >
            <Linkedin className="size-4 fill-current" />
            Message on LinkedIn
          </a>
        </section>

        <aside className="information-card information-contact-note">
          <span className="information-contact-note-icon" aria-hidden="true">
            <Linkedin />
          </span>
          <h2 className="information-card-title">Contact method</h2>
          <p className="information-description">
            LinkedIn is the fastest way to reach the Global Bioenergy Watch desk for press,
            partnerships, data corrections, or general inquiries.
          </p>
        </aside>
      </div>
    </InformationPage>
  );
}
