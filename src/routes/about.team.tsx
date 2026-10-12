import { createFileRoute } from "@tanstack/react-router";
import { Users, Linkedin } from "lucide-react";
import { InformationPage } from "@/components/InformationPage";

const TITLE = "Team Members — Global Bioenergy Watch";
const DESCRIPTION =
  "Meet the people behind Global Bioenergy Watch, the independent bioenergy policy and market intelligence desk.";

const FOUNDER_LINKEDIN = "https://www.linkedin.com/in/asifulalam0905024/";

export const Route = createFileRoute("/about/team")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://globalbioenergywatch.org/about/team" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://globalbioenergywatch.org/about/team" }],
  }),
  component: TeamPage,
});

function TeamPage() {
  return (
    <InformationPage
      active="team"
      icon={Users}
      title="Team members"
      subtitle="The people who build, curate, and verify the Global Bioenergy Watch desk."
    >
      <section className="team">
        <article className="member lead">
          <div className="av" aria-hidden="true">
            SA
          </div>
          <div>
            <h2>Syed Asiful Alam, PhD</h2>
            <span className="role">Founder &amp; Editor</span>
            <p>
              Bioenergy policy, GHG sustainability, GIS &amp; Remote Sensing, and life cycle
              analysis of renewable fuels and feedstocks.
            </p>
            <a
              className="profile-link"
              href={FOUNDER_LINKEDIN}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Linkedin size={15} />
              LinkedIn profile
            </a>
          </div>
        </article>
        {[
          {
            name: "Shahnaeous Ali",
            role: "Lead Developer",
            initials: "SA",
            tone: "blue",
            url: null,
          },
          {
            name: "Rakibul Islam",
            role: "UI/UX Developer",
            initials: "RI",
            tone: "green",
            url: null,
          },
          {
            name: "Chukwuemeka Valentine Okolo",
            role: "Contributor",
            initials: "CO",
            tone: "red",
            url: "https://www.linkedin.com/in/chukwuemeka-valentine-okolo-9332a2a7/",
          },
        ].map((member) => (
          <article className={`member ${member.tone}`} key={member.name}>
            <div className="av" aria-hidden="true">
              {member.initials}
            </div>
            <h3>{member.name}</h3>
            <span className="role">{member.role}</span>
            {member.url && (
              <a
                className="profile-link"
                href={member.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin size={15} />
                LinkedIn profile
              </a>
            )}
          </article>
        ))}
        <article className="soonc">
          <h2>More members coming soon</h2>
          <p>
            We are growing the desk. If you work in bioenergy research, policy analysis, or energy
            journalism and want to contribute, reach out at{" "}
            <a href="mailto:hello@globalbioenergywatch.com">hello@globalbioenergywatch.com</a>.
          </p>
        </article>
      </section>
    </InformationPage>
  );
}
