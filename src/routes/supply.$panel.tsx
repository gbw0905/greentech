import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight } from "lucide-react";
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
  const others = SUPPLY_PANELS.filter((p) => p.id !== panelId);

  return (
    <PageShell>
      {/* Green ribbon header for the focused dataset */}
      <div
        className="ink-bar ribbon-sheen px-5 py-6 sm:px-7"
        style={{ borderLeft: `4px solid ${panel.tone}` }}
      >
        <div className="flex items-center gap-2 text-accent">
          <panel.icon className="size-3.5" />
          <span className="kicker" style={{ color: "var(--ink-accent)" }}>
            Supply &amp; producers
          </span>
        </div>
        <h1 className="mt-2 font-display text-3xl leading-[1.05] font-extrabold tracking-[-0.03em] text-ink-foreground sm:text-[2.6rem]">
          {panel.title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm/relaxed text-ink-muted">{panel.blurb}</p>
        <div className="label-mono mt-3 text-ink-muted">
          {panel.stat} {panel.statLabel}
        </div>
        <div className="mt-4 h-0.5 w-24 rounded-full" style={{ background: panel.tone }} />
      </div>

      {/* The focused dataset — the only thing on this page */}
      <section
        className="glass-panel flip-in-side min-w-0 p-4 sm:p-5"
        style={{ perspective: "900px" }}
      >
        <SupplyPanelBody id={panelId} />
      </section>

      {/* Switch to another dataset */}
      <nav aria-label="Other supply datasets" className="glass-panel p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
            Explore other datasets
          </h2>
          <Link
            to="/"
            hash="production"
            className="label-mono inline-flex shrink-0 items-center gap-1.5 font-bold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> All datasets
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((c) => (
            <Link
              key={c.id}
              to="/supply/$panel"
              params={{ panel: c.id }}
              className="pill-motion group flex min-w-0 items-center gap-2.5 border border-border bg-background p-3"
            >
              <span
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md"
                style={{
                  background: `color-mix(in oklab, ${c.tone} 14%, white)`,
                  color: c.tone,
                }}
              >
                <c.icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-foreground">{c.title}</span>
                <span className="label-mono text-muted-foreground">
                  {c.stat} {c.statLabel}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </nav>
    </PageShell>
  );
}

function SupplyNotFound() {
  return (
    <PageShell>
      <div className="glass-panel p-6 text-center">
        <h1 className="font-display text-2xl font-extrabold text-foreground">Dataset not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          That supply dataset does not exist. Pick one from the dashboard instead.
        </p>
        <Link
          to="/"
          hash="production"
          className="label-mono mt-4 inline-flex items-center gap-1.5 font-bold text-foreground underline underline-offset-4"
        >
          <ArrowLeft className="size-3.5" /> Back to Supply &amp; producers
        </Link>
      </div>
    </PageShell>
  );
}
