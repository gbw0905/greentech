import { createFileRoute } from "@tanstack/react-router";
import { Github, Users, Linkedin } from "lucide-react";
import { InformationPage } from "@/components/InformationPage";

const TITLE = "Team Members — Global Bioenergy Watch";
const DESCRIPTION =
  "Meet the people behind Global Bioenergy Watch, the independent bioenergy policy and market intelligence desk.";

const LEADERSHIP = [
  {
    name: "Syed Asiful Alam, PhD",
    role: "Founder & Editor",
    image: "/team/syed-asiful-alam.png",
    description:
      "Bioenergy policy, GHG sustainability, GIS & Remote Sensing, and life cycle analysis of renewable fuels and feedstocks.",
    url: "https://www.linkedin.com/in/asifulalam0905024/",
  },
  {
    name: "Chukwuemeka Valentine Okolo",
    role: "Contributor",
    image: "/team/chukwuemeka-okolo.jpg",
    description: null,
    url: "https://www.linkedin.com/in/chukwuemeka-valentine-okolo-9332a2a7/",
  },
];

// Profile portraits from the GitHub accounts linked below.
const DEVELOPMENT_TEAM = [
  {
    name: "Shahnaeous Ali",
    role: "Lead Developer",
    image: "/team/shahnaeous-ali.jpg",
    url: "https://github.com/Shah139",
  },
  {
    name: "Muhammad Asif",
    role: "Developer",
    image: "/team/muhammad-asif.jpg",
    url: "https://github.com/asifhasan973",
  },
  {
    name: "Rakibul Islam",
    role: "UI/UX",
    image: "/team/rakibul-islam.jpg",
    url: "https://github.com/rakib120822",
  },
];

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
      <div className="team-page">
        <section className="team-leadership" aria-label="Founder and contributor">
          {LEADERSHIP.map((member) => (
            <article className="member lead" key={member.name}>
              <img
                className="av"
                src={member.image}
                alt={member.name}
                width={112}
                height={112}
                loading="lazy"
                decoding="async"
              />
              <div>
                <h2>{member.name}</h2>
                <span className="role">{member.role}</span>
                {member.description && <p>{member.description}</p>}
                <a
                  className="profile-link"
                  href={member.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name} on LinkedIn`}
                >
                  <Linkedin size={15} aria-hidden="true" />
                  LinkedIn profile
                </a>
              </div>
            </article>
          ))}
        </section>
        <section className="team-builders" aria-label="Development and design team">
          {DEVELOPMENT_TEAM.map((member) => (
            <article className="member" key={member.name}>
              <img
                className="av"
                src={member.image}
                alt={member.name}
                width={92}
                height={92}
                loading="lazy"
                decoding="async"
              />
              <h3>{member.name}</h3>
              <span className="role">{member.role}</span>
              <a
                className="profile-link"
                href={member.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on GitHub`}
              >
                <Github size={15} aria-hidden="true" />
                GitHub profile
              </a>
            </article>
          ))}
        </section>
        <article className="soonc">
          <h2>More members coming soon</h2>
          <p>
            We are growing the desk. If you work in bioenergy research, policy analysis, or energy
            journalism and want to contribute, reach out at{" "}
            <a href="mailto:hello@globalbioenergywatch.com">hello@globalbioenergywatch.com</a>.
          </p>
        </article>
      </div>
    </InformationPage>
  );
}
