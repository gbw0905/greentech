import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Users, Linkedin } from "lucide-react";
import { PageShell, PageHeading } from "@/components/PageShell";

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
        className="size-16 rounded-full border border-border object-cover"
      />
    );
  }
  return (
    <div className="flex size-16 items-center justify-center rounded-full bg-foreground font-display text-lg font-extrabold text-background">
      {initials}
    </div>
  );
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
    <PageShell>
      <PageHeading
        icon={Users}
        title="Team members"
        subtitle="The people who build, curate, and verify the Global Bioenergy Watch desk."
      />

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-lg border border-border bg-white p-6 shadow-sm">
          <Avatar src={founderPhoto} alt="Syed Asiful Alam, PhD" initials="SA" />
          <h2 className="mt-4 font-display text-lg font-extrabold tracking-tight text-foreground">
            Syed Asiful Alam, PhD
          </h2>
          <p className="kicker mt-1 text-muted-foreground">Founder &amp; Editor</p>
          <p className="mt-3 text-sm/relaxed text-muted-foreground">
            Founded Global Bioenergy Watch to make bioenergy policy and market intelligence open
            and verifiable. Leads editorial standards, data methodology, and platform development.
          </p>
          <a
            href={FOUNDER_LINKEDIN}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#0A66C2]/10 px-2.5 py-1.5 text-sm font-bold text-[#0A66C2] transition-colors hover:bg-[#0A66C2]/15"
          >
            <Linkedin className="size-4 fill-current" />
            LinkedIn profile
          </a>
        </article>

        <article className="rounded-lg border border-border bg-white p-6 shadow-sm">
          <Avatar src={okoloPhoto} alt="Chukwuemeka Valentine Okolo" initials="CVO" />
          <h2 className="mt-4 font-display text-lg font-extrabold tracking-tight text-foreground">
            Chukwuemeka Valentine Okolo
          </h2>
          <p className="kicker mt-1 text-muted-foreground">Contributor</p>
          <p className="mt-3 text-sm/relaxed text-muted-foreground">
            Supports policy scanning and market research across global bioenergy jurisdictions,
            helping verify sources and keep the tracker current.
          </p>
          <a
            href="https://www.linkedin.com/in/chukwuemeka-valentine-okolo-9332a2a7/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#0A66C2]/10 px-2.5 py-1.5 text-sm font-bold text-[#0A66C2] transition-colors hover:bg-[#0A66C2]/15"
          >
            <Linkedin className="size-4 fill-current" />
            LinkedIn profile
          </a>
        </article>

        <article className="flex flex-col justify-center rounded-lg border border-dashed border-border bg-muted/30 p-6">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
            More members coming soon
          </h2>
          <p className="mt-3 text-sm/relaxed text-muted-foreground">
            We are growing the desk. If you work in bioenergy research, policy analysis, or energy
            journalism and want to contribute, reach out via our{" "}
            <a
              href="https://www.linkedin.com/company/global-bioenergy-watch/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-foreground underline underline-offset-4"
            >
              LinkedIn page
            </a>
            .
          </p>
        </article>
      </section>
    </PageShell>
  );
}
