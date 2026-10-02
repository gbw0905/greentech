import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Users, Linkedin } from "lucide-react";
import { InformationPage } from "@/components/InformationPage";

import founderAsset from "@/assets/syed-asiful-alam.jpg.asset.json";
import okoloAsset from "@/assets/chukwuemeka-okolo.jpg.asset.json";

const founderPhoto: string | undefined = founderAsset.url;
const okoloPhoto: string | undefined = okoloAsset.url;

/** Round headshot with an initials fallback when no photo is supplied. */
function Avatar({
  src,
  alt,
  initials,
}: {
  src: string | undefined;
  alt: string;
  initials: string;
}) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className="information-avatar"
      />
    );
  }
  return <div className="information-avatar information-avatar-fallback">{initials}</div>;
}

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
      <section className="information-team-grid">
        <article className="information-card information-member">
          <Avatar src={founderPhoto} alt="Syed Asiful Alam, PhD" initials="SA" />
          <h2 className="information-card-title">Syed Asiful Alam, PhD</h2>
          <p className="information-member-role">Founder &amp; Editor</p>
          <p className="information-description">
            Syed brings a wealth of experience in GHG sustainability, GIS &amp; Remote Sensing, and
            cradle to gate life cycle analysis of renewable fuels and feedstock materials.
            Throughout his career, he has been at the forefront of environmental sustainability,
            specializing in greenhouse gas emissions reduction and management. His proficiency in
            GIS &amp; Remote Sensing technologies has allowed him to analyze spatial data with
            precision, facilitating informed decision-making in environmental conservation. In the
            realm of LCA practices, Syed conducted thorough assessments of fuel production
            processes, carbon balances and materials statement. His career journey reflects a
            passion for integrating technological innovations with environmental stewardship.
            Whether it's developing strategies for GHG reduction or utilizing GIS &amp; Remote
            Sensing for spatial analysis, he is dedicated to making impactful contributions to the
            field of environmental sustainability.
          </p>
          <a
            href={FOUNDER_LINKEDIN}
            target="_blank"
            rel="noopener noreferrer"
            className="information-profile-link"
          >
            <Linkedin className="size-4 fill-current" />
            LinkedIn profile
          </a>
        </article>

        <article className="information-card information-member">
          <Avatar src={okoloPhoto} alt="Chukwuemeka Valentine Okolo" initials="CVO" />
          <h2 className="information-card-title">Chukwuemeka Valentine Okolo</h2>
          <p className="information-member-role">Contributor</p>
          <p className="information-description">
            Supports policy scanning and market research across global bioenergy jurisdictions,
            helping verify sources and keep the tracker current.
          </p>
          <a
            href="https://www.linkedin.com/in/chukwuemeka-valentine-okolo-9332a2a7/"
            target="_blank"
            rel="noopener noreferrer"
            className="information-profile-link"
          >
            <Linkedin className="size-4 fill-current" />
            LinkedIn profile
          </a>
        </article>

        <article className="information-card information-team-invite">
          <h2 className="information-card-title">More members coming soon</h2>
          <p className="information-description">
            We are growing the desk. If you work in bioenergy research, policy analysis, or energy
            journalism and want to contribute, reach out via our{" "}
            <a
              href="https://www.linkedin.com/company/global-bioenergy-watch/"
              target="_blank"
              rel="noopener noreferrer"
              className="information-inline-link"
            >
              LinkedIn page
            </a>
            .
          </p>
        </article>
      </section>
    </InformationPage>
  );
}
