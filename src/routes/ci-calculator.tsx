import { createFileRoute } from "@tanstack/react-router";
import { Calculator } from "lucide-react";
import { PageShell, PageHeading } from "@/components/PageShell";
import { PathwayCiBuilder } from "@/components/PathwayCiBuilder";

const TITLE = "Biofuel Carbon Intensity Calculator | Pathways, Feedstocks and Programs";
const DESCRIPTION =
  "Model the lifecycle carbon intensity of any biofuel pathway: feedstock source, electricity, natural gas and other process energy, full emission breakdown and regulatory program comparison in gCO2e/MJ.";

export const Route = createFileRoute("/ci-calculator")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://globalbioenergywatch.org/ci-calculator" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://globalbioenergywatch.org/ci-calculator" }],
  }),
  component: CiCalculatorPage,
});

function CiCalculatorPage() {
  return (
    <PageShell>
      <PageHeading
        icon={Calculator}
        title="Carbon intensity calculator"
        subtitle="Lifecycle carbon intensity for every biofuel pathway — pick a feedstock source, set electricity, natural gas and other process energy with your own units, and see the full emission breakdown against the major regulatory programs."
      />

      <PathwayCiBuilder />

      <section className="glass-panel border-l-4 border-l-accent p-5">
        <h2 className="font-display text-base font-bold text-foreground">Method and limitations</h2>
        <p className="mt-2 text-sm/relaxed text-muted-foreground">
          Pathway, feedstock and energy defaults are indicative averages compiled from public GREET
          and CA-GREET documentation, CARB LCFS certified pathway summaries, EU RED II and III Annex
          V typical values and equivalent program guidance. Every line item is editable, so you can
          replace a default with plant-specific data. Program benchmarks are the published
          comparator or baseline carbon intensities; annual compliance standards step down from
          them.
        </p>
        <p className="mt-2 text-sm/relaxed text-muted-foreground">
          Results are indicative and pathway-specific. They are not a certified CI score: regulatory
          pathway certification requires site-specific data, verification and approval by the
          administering agency.
        </p>
      </section>
    </PageShell>
  );
}
