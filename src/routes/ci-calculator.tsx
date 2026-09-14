import { createFileRoute } from "@tanstack/react-router";
import { Calculator } from "lucide-react";
import { PageShell, PageHeading } from "@/components/PageShell";
import { PathwayCiBuilder } from "@/components/PathwayCiBuilder";

const TITLE = "Biofuel Carbon Intensity Calculator | Pathways, Feedstocks and Programs";
const DESCRIPTION =
  "Model the lifecycle carbon intensity of any biofuel pathway: feedstock source, electricity, natural gas and other process energy, full emission breakdown and regulatory program comparison in gCO2e/MJ.";
const PAGE_URL = "https://globalbioenergywatch.org/ci-calculator";

const CI_STEPS: { h: string; b: string }[] = [
  {
    h: "1. Count feedstock production emissions",
    b: "Start with growing or collecting the feedstock: fertiliser, field energy and land-use effects for crops, or collection and pre-processing for wastes and residues. Waste feedstocks such as used cooking oil or manure typically carry a much smaller production footprint than purpose-grown crops.",
  },
  {
    h: "2. Add transport to the facility",
    b: "Emissions from moving the feedstock to the processing plant depend on distance and mode — truck, rail, barge or ocean vessel each carry a different emission factor per tonne-kilometre.",
  },
  {
    h: "3. Add processing energy and inputs",
    b: "Conversion is usually the largest term: electricity, natural gas, propane, diesel, steam, hydrogen or biomass used in the plant, plus chemicals and fugitive emissions. The electricity grid region matters — the same pathway scores very differently on a coal-heavy grid versus a hydro-heavy one.",
  },
  {
    h: "4. Subtract co-product credits",
    b: "Most pathways make more than one product — animal feed, renewable power, glycerine or captured CO2. Programs credit the fuel for the products it displaces, which lowers the score and can push some pathways below zero.",
  },
  {
    h: "5. Add distribution and finishing",
    b: "Include the fuel's journey to the end user — transport to blending terminals or airports, blending, and any program-specific adjustments such as tailpipe factors or energy economy ratios.",
  },
  {
    h: "6. Divide by the fuel's energy content",
    b: "Total lifecycle emissions divided by the fuel's energy gives the CI score in gCO2e/MJ. Comparing it with each program's benchmark gives the GHG saving: (benchmark − CI) ÷ benchmark. A pathway earns credits when its CI sits below the benchmark.",
  },
];

const CI_FAQS: { q: string; a: string }[] = [
  {
    q: "How is the carbon intensity of a biofuel calculated?",
    a: "Add up the lifecycle emissions — feedstock production, transport, processing energy and chemicals, distribution — subtract co-product and avoided-emission credits, then divide by the fuel's energy content. The result is expressed in grams of CO2-equivalent per megajoule (gCO2e/MJ).",
  },
  {
    q: "What units is carbon intensity measured in?",
    a: "The standard unit is gCO2e/MJ — grams of carbon-dioxide-equivalent emissions per megajoule of fuel energy. Some programs express benchmarks the same way, which allows a direct comparison between a pathway score and the program baseline.",
  },
  {
    q: "How is carbon intensity calculated for California's LCFS?",
    a: "The Low Carbon Fuel Standard scores each fuel pathway against an annual declining benchmark for gasoline and diesel. Pathways with a CI below the benchmark generate credits; those above it generate deficits. The scoring follows CA-GREET, which uses the same lifecycle stages shown in this calculator.",
  },
  {
    q: "Can a biofuel have a negative carbon intensity?",
    a: "Yes. Pathways that avoid emissions elsewhere — dairy manure RNG capturing methane that would otherwise escape, for example — can score below zero once the avoided-emission credit exceeds all other lifecycle emissions. This calculator shows negative scores on a signed scale.",
  },
  {
    q: "What is a good carbon intensity score?",
    a: "It depends on the benchmark. Fossil diesel sits near 100 gCO2e/MJ and the California LCFS diesel benchmark declines each year; ethanol pathways often land around 50–70, waste-based biodiesel and renewable diesel around 20–40, and some RNG pathways below zero. Use the program comparison in the calculator to see where a pathway stands.",
  },
];

const WEBAPP_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Global Bioenergy Watch Carbon Intensity Calculator",
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
  mainEntity: CI_FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export const Route = createFileRoute("/ci-calculator")({
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
  component: CiCalculatorPage,
});

function CiCalculatorPage() {
  return (
    <PageShell>
      <PageHeading
        icon={Calculator}
        title="Carbon intensity calculator"
        subtitle="Lifecycle carbon intensity for every biofuel pathway — start with feedstock production, set electricity, natural gas and other process energy with your own units, and see the full emission breakdown against the major regulatory programs."
      />

      <PathwayCiBuilder />

      <aside className="border-t border-border pt-5 text-xs/relaxed text-muted-foreground" aria-label="Copyright and permitted use">
        <p>
          The Global Bioenergy Watch Carbon Intensity Calculator, including its underlying
          algorithms, datasets, interface design, and generated outputs, is the exclusive
          intellectual property of Global Bioenergy Watch and is protected by international
          copyright and intellectual property laws.
        </p>
        <p className="mt-3">
          <strong className="text-foreground">Permitted Use:</strong> You are welcome to use this
          calculator for personal, academic, or internal non-commercial research purposes. When
          citing data or results generated by this tool in publications or reports, please attribute
          them clearly to the “Global Bioenergy Watch Carbon Intensity Calculator.”
        </p>
        <p className="mt-3">
          <strong className="text-foreground">Restrictions:</strong> Unauthorized reproduction,
          modification, distribution, or commercial exploitation of this tool is strictly
          prohibited. Users may not scrape, reverse-engineer, or integrate the calculator’s backend
          logic into third-party platforms without explicit written consent.
        </p>
        <p className="mt-3">
          <strong className="text-foreground">Disclaimer:</strong> The carbon intensity estimates
          provided by this tool are for informational purposes only. Global Bioenergy Watch assumes
          no liability for operational or financial decisions made based on these calculations.
        </p>
      </aside>
    </PageShell>
  );
}
