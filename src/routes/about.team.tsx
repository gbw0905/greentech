import { createFileRoute } from "@tanstack/react-router";
import { Linkedin } from "lucide-react";
import { InformationPage } from "@/components/InformationPage";

const TITLE = "Team Members — Global Bioenergy Watch";
const DESCRIPTION =
  "Meet the people behind Global Bioenergy Watch, the independent bioenergy policy and market intelligence desk.";

const TEAM_MEMBERS = [
  {
    name: "Syed Asiful Alam, PhD",
    role: "Founder",
    linkedinUrl: "https://www.linkedin.com/in/asifulalam0905024/",
  },
  {
    name: "Chukwuemeka Valentine Okolo",
    role: "Analyst",
    linkedinUrl: "https://www.linkedin.com/in/chukwuemeka-valentine-okolo-9332a2a7/",
  },
  {
    name: "Ananta Karmakar",
    role: "Research Analyst",
    linkedinUrl: "https://www.linkedin.com/in/ananta-karmakar-ananta/",
  },
  {
    name: "Shahnaeous Ali",
    role: "Lead Developer",
    linkedinUrl: "https://www.linkedin.com/in/shahneous-ali-0b3a53349/",
  },
  {
    name: "Muhammad Asif",
    role: "Developer",
    linkedinUrl: "https://www.linkedin.com/in/asifhasan973/",
  },
  {
    name: "Rakibul Islam",
    role: "UI/UX",
    linkedinUrl: "https://www.linkedin.com/in/rakibul-islam-payel/",
  },
  {
    name: "Jubaed Islam",
    role: "Media Administrator",
    linkedinUrl: "https://www.linkedin.com/in/jubaed-islam-587213354/",
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
        <section className="team-grid" aria-label="Global Bioenergy Watch team members">
          {TEAM_MEMBERS.map((member) => (
            <article className="member team-grid-card" key={member.name}>
              <h2>{member.name}</h2>
              <span className="role">{member.role}</span>
              <a
                className="profile-link"
                href={member.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on LinkedIn`}
              >
                <Linkedin size={15} aria-hidden="true" />
                LinkedIn profile
              </a>
            </article>
          ))}
        </section>
      </div>
    </InformationPage>
  );
}
