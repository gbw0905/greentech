import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Linkedin, Mail, UsersRound } from "lucide-react";
import { InformationPage } from "@/components/InformationPage";
import "./about-team.css";

const TITLE = "Our Team — Global Bioenergy Watch";
const DESCRIPTION =
  "Meet the research, leadership, and technology contributors behind Global Bioenergy Watch and CIVanta.";

type TeamMember = {
  name: string;
  role: string;
  image: string;
  linkedin: string;
  expertise?: string;
};

const FOUNDER: TeamMember = {
  name: "Syed Asiful Alam, PhD",
  role: "Founder & Editor",
  image: "/team/syed-asiful-alam.png",
  linkedin: "https://www.linkedin.com/in/asifulalam0905024/",
  expertise: "Bioenergy · Lifecycle assessment · Low-carbon fuels",
};

const RESEARCH_TEAM: TeamMember[] = [
  {
    name: "Chukwuemeka Valentine Okolo",
    role: "Contributor",
    image: "/team/chukwuemeka-okolo.jpg",
    linkedin: "https://www.linkedin.com/in/chukwuemeka-valentine-okolo-9332a2a7/",
  },
];

const PRODUCT_TEAM: TeamMember[] = [
  {
    name: "Shahnaeous Ali",
    role: "Lead Developer",
    image: "/team/shahnaeous-ali-linkedin.jpg",
    linkedin: "https://www.linkedin.com/in/shahneous-ali-0b3a53349/",
  },
  {
    name: "Muhammad Asif",
    role: "Developer",
    image: "/team/muhammad-asif-linkedin.png",
    linkedin: "https://www.linkedin.com/in/asifhasan973/",
  },
  {
    name: "Rakibul Islam",
    role: "UI/UX",
    image: "/team/rakibul-islam-portrait.png",
    linkedin: "https://www.linkedin.com/in/rakibul-islam-payel/",
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

function ProfileLink({ member }: { member: TeamMember }) {
  return (
    <a
      className="gbw-team-social"
      href={member.linkedin}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View ${member.name}'s LinkedIn profile`}
    >
      <Linkedin size={17} aria-hidden="true" />
      <span>LinkedIn</span>
      <ArrowUpRight size={14} aria-hidden="true" />
    </a>
  );
}

function TeamCard({ member }: { member: TeamMember }) {
  return (
    <article className="gbw-team-card">
      <div className="gbw-team-portrait">
        <img src={member.image} alt={member.name} width={320} height={320} loading="lazy" decoding="async" />
      </div>
      <div className="gbw-team-card-body">
        <h3>{member.name}</h3>
        <p className="gbw-team-role">{member.role}</p>
        <ProfileLink member={member} />
      </div>
    </article>
  );
}

function TeamPage() {
  return (
    <InformationPage
      active="team"
      title="The people behind GBW"
      subtitle="Research, policy intelligence, and technology working together to advance sustainable bioenergy."
    >
      <div className="gbw-team">
        <section className="gbw-team-intro" aria-label="Team overview">
          <p className="gbw-team-eyebrow"><UsersRound size={15} aria-hidden="true" /> People & purpose</p>
          <h2>Built on scientific expertise. Connected through technology.</h2>
          <p>
            Global Bioenergy Watch brings together research contributors and product builders
            to make bioenergy information and low-carbon fuel analysis more accessible.
          </p>
        </section>

        <section className="gbw-team-section" aria-labelledby="gbw-leadership">
          <header className="gbw-team-section-header">
            <span className="gbw-team-index">01 / Leadership</span>
            <h2 id="gbw-leadership">Leadership</h2>
          </header>
          <article className="gbw-team-founder">
            <div className="gbw-team-founder-photo">
              <img src={FOUNDER.image} alt={FOUNDER.name} width={420} height={420} loading="lazy" decoding="async" />
            </div>
            <div className="gbw-team-founder-content">
              <p className="gbw-team-eyebrow">Founder</p>
              <h3>{FOUNDER.name}</h3>
              <p className="gbw-team-role">{FOUNDER.role}</p>
              <p className="gbw-team-expertise">{FOUNDER.expertise}</p>
              <p className="gbw-team-description">
                Guiding GBW's research-led approach to bioenergy policy, market intelligence,
                lifecycle assessment, and low-carbon fuel analysis.
              </p>
              <ProfileLink member={FOUNDER} />
            </div>
          </article>
        </section>

        <section className="gbw-team-section" aria-labelledby="gbw-research">
          <header className="gbw-team-section-header">
            <span className="gbw-team-index">02 / Research</span>
            <h2 id="gbw-research">Research & contributors</h2>
            <p>Developing and sharing evidence-based perspectives on bioenergy and sustainability.</p>
          </header>
          <div className="gbw-team-grid">
            {RESEARCH_TEAM.map((member) => <TeamCard member={member} key={member.name} />)}
          </div>
        </section>

        <section className="gbw-team-section" aria-labelledby="gbw-product">
          <header className="gbw-team-section-header">
            <span className="gbw-team-index">03 / Technology</span>
            <h2 id="gbw-product">Technology & product development</h2>
            <p>Building the digital experiences and research tools behind GBW and CIVanta.</p>
          </header>
          <div className="gbw-team-grid">
            {PRODUCT_TEAM.map((member) => <TeamCard member={member} key={member.name} />)}
          </div>
        </section>

        <aside className="gbw-team-collaborate" aria-label="Collaborate with GBW">
          <div>
            <p className="gbw-team-eyebrow">Research & collaboration</p>
            <h2>Interested in working with GBW?</h2>
            <p>Connect with us about bioenergy research, market intelligence, and potential collaboration.</p>
          </div>
          <a href="mailto:info@globalbioenergywatch.org">
            <Mail size={17} aria-hidden="true" />
            Contact GBW
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </aside>
      </div>
    </InformationPage>
  );
}
