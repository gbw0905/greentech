import { createFileRoute, Link } from "@tanstack/react-router";
import { Calculator } from "lucide-react";
import { PageShell, PageHeading } from "@/components/PageShell";
import { PathwayCiBuilder } from "@/features/calculators/components/PathwayCiBuilder";

const TITLE = "Dairy Manure RNG Carbon Intensity Calculator | Digester Farm Model";
const DESCRIPTION =
  "Model the carbon intensity of renewable natural gas from a dairy manure digester: herd size, manure volumes, avoided lagoon methane, digester and upgrading energy, pipeline transmission and program benchmarks in gCO2e/MJ.";
const PAGE_URL = "https://globalbioenergywatch.org/dairy-rng-calculator";

const DAIRY_FAQS: { q: string; a: string }[] = [
  {
    q: "Why can dairy manure RNG have a negative carbon intensity?",
    a: "Manure left in an open lagoon releases methane to the atmosphere. A digester captures that methane instead, so the pathway earns an avoided-emission credit that can be larger than all of its own lifecycle emissions — pushing the score below zero.",
  },
  {
    q: "What drives the score most on a dairy farm?",
    a: "The baseline methane conversion factor of the manure storage being replaced, herd size and manure volumes, the RNG yield per tonne of dry solids, and the electricity and natural gas used by the digester and the upgrading skid.",
  },
  {
    q: "How is this different from the general CI calculator?",
    a: "The dairy model is a complete farm-level pathway of its own: herd and manure inputs replace the usual feedstock, transport and processing sections. Every other biofuel pathway is on the main carbon intensity calculator.",
  },
];

const WEBAPP_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Global Bioenergy Watch Dairy Manure RNG Carbon Intensity Calculator",
  url: PAGE_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  description: DESCRIPTION,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  publisher: {
    "@type": "Organization",
    name: "Global Bioenergy Watch",
    url: "https://globalbioenergywatch.org/",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: DAIRY_FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export const Route = createFileRoute("/dairy-rng-calculator")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: PAGE_URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(WEBAPP_JSONLD) },
      { type: "application/ld+json", children: JSON.stringify(FAQ_JSONLD) },
    ],
  }),
  component: DairyRngCalculatorPage,
});

function DairyRngCalculatorPage() {
  return (
    <PageShell>
      <PageHeading
        icon={Calculator}
        title="Dairy RNG carbon intensity calculator"
        subtitle="A farm-level model for renewable natural gas from dairy manure digesters — herd size, manure volumes, avoided lagoon methane, digester and upgrading energy — scored against the major regulatory programs."
      />

      <p className="mb-4 text-sm text-muted-foreground">
        Looking at a different fuel?{" "}
        <Link
          to="/ci-calculator"
          className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
        >
          Use the main carbon intensity calculator
        </Link>{" "}
        for every other biofuel pathway.
      </p>

      <PathwayCiBuilder mode="dairy" />

      <section aria-label="Frequently asked questions" className="mt-10">
        <h2 className="font-display text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
          Dairy RNG questions, answered
        </h2>
        <dl className="mt-4 space-y-3">
          {DAIRY_FAQS.map((f) => (
            <div key={f.q} className="glass-panel p-4">
              <dt className="font-display text-sm font-bold text-foreground">{f.q}</dt>
              <dd className="mt-1.5 text-sm/relaxed text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </PageShell>
  );
}
