import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import "@/features/supply/components/DatasetPage.css";
import { PageShell } from "@/components/PageShell";
import {
  SUPPLY_PANELS,
  SupplyPanelBody,
  type PanelId,
} from "@/features/supply/components/SupplyProducersSection";
import { SUPPLY_SEO } from "@/features/supply/seo";

function findPanel(id: string) {
  return SUPPLY_PANELS.find((p) => p.id === id);
}

export const Route = createFileRoute("/supply/$panel")({
  loader: ({ params }) => {
    const panel = findPanel(params.panel);
    if (!panel) throw notFound();
    return { panelId: panel.id as PanelId, title: panel.title, blurb: panel.blurb };
  },
  head: ({ loaderData, params }) => {
    const seo = SUPPLY_SEO[(loaderData?.panelId ?? params.panel) as PanelId];
    const title = seo
      ? `${seo.title} | Global Bioenergy Watch`
      : "Dataset — Global Bioenergy Watch";
    const description = seo?.description ?? loaderData?.blurb ?? "Global biofuel supply dataset.";
    const url = `https://globalbioenergywatch.org/supply/${params.panel}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        ...(seo ? [{ name: "keywords", content: seo.keywords }] : []),
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: seo
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Dataset",
                name: seo.title,
                description,
                url,
                keywords: seo.keywords,
                creator: {
                  "@type": "Organization",
                  name: "Global Bioenergy Watch",
                  url: "https://globalbioenergywatch.org/",
                },
                isAccessibleForFree: true,
              }),
            },
          ]
        : [],
    };
  },
  component: SupplyDatasetPage,
  notFoundComponent: SupplyNotFound,
});

function SupplyDatasetPage() {
  const { panelId } = Route.useLoaderData();
  const panel = SUPPLY_PANELS.find((p) => p.id === panelId)!;
  const accent =
    panelId === "rlpg" ? "LPG" : panelId === "hydrogen" ? "hydrogen" : panel.title.split(" ")[0]!;
  const [titleBefore, titleAfter] = panel.title.split(accent);

  return (
    <main className="dataset-page">
      <section className="dataset-hero" aria-labelledby="dataset-title">
        <div className="dataset-wrap">
          <h1 id="dataset-title">
            {titleBefore}
            <em>{accent}</em>
            {titleAfter}
          </h1>
          <p className="dataset-description">{panel.blurb}</p>
        </div>
      </section>
      <div className="dataset-content dataset-wrap">
        <SupplyPanelBody key={panelId} id={panelId} />
      </div>
    </main>
  );
}

function SupplyNotFound() {
  return (
    <PageShell>
      <div className="glass-panel p-6 text-center">
        <h1 className="font-display text-2xl font-extrabold text-foreground">Dataset not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          That supply dataset does not exist. Pick one from the supply directory instead.
        </p>
        <Link
          to="/supply"
          className="label-mono mt-4 inline-flex items-center gap-1.5 font-bold text-foreground underline underline-offset-4"
        >
          <ArrowLeft className="size-3.5" /> Back to Supply &amp; producers
        </Link>
      </div>
    </PageShell>
  );
}
