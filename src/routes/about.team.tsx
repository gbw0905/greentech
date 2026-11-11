import { createFileRoute } from "@tanstack/react-router";
import { Linkedin } from "lucide-react";
import { InformationPage } from "@/components/InformationPage";

const TITLE = "Team Members — Global Bioenergy Watch";
const DESCRIPTION =
  "Meet the people behind Global Bioenergy Watch, the independent bioenergy policy and market intelligence desk.";

const LEADERSHIP = [
  {
    name: "Syed Asiful Alam, PhD",
    role: "Founder & Editor",
    image: "/team/syed-asiful-alam.png",
    url: "https://www.linkedin.com/in/asifulalam0905024/",
  },
];

// Local copies of each member's LinkedIn profile portrait.
const DEVELOPMENT_TEAM = [
  {
    name: "Shahnaeous Ali",
    role: "Lead Developer",
    image: "/team/shahnaeous-ali-linkedin.jpg",
    linkedinUrl: "https://www.linkedin.com/in/shahneous-ali-0b3a53349/",
  },
  {
    name: "Muhammad Asif",
    role: "Developer",
    image: "/team/muhammad-asif-linkedin.png",
    linkedinUrl: "https://www.linkedin.com/in/asifhasan973/",
  },
  {
    name: "Rakibul Islam",
    role: "UI/UX",
    image: "/team/rakibul-islam-portrait.png",
    linkedinUrl: "https://www.linkedin.com/in/rakibul-islam-payel/",
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
      title="Team members"
      subtitle="The people who build, curate, and verify the Global Bioenergy Watch desk."
    >
      <div className="team-page">
        <section className="team-leadership" aria-label="Founder">
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
                className={`av${member.name === "Rakibul Islam" ? " rakibul-portrait" : ""}`}
                src={member.image}
                alt={member.name}
                width={92}
                height={92}
                loading="lazy"
                decoding="async"
              />
              <h3>{member.name}</h3>
              <span className="role">{member.role}</span>
              <div className="team-profile-links">
                <a
                  className="profile-link"
                  href={member.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name} on LinkedIn`}
                >
                  <Linkedin size={15} aria-hidden="true" />
                  LinkedIn
                </a>
              </div>
            </article>
          ))}
        </section>
      </div>
    </InformationPage>
  );
}
