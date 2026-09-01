import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, ExternalLink } from "lucide-react";
import { PageHeading, PageShell } from "@/components/PageShell";
import { DATASETS } from "@/lib/datasets/provenance";
import { REFERENCE_NOTE } from "@/lib/data-sources";

const TITLE = "Data sources & methodology — Global Bioenergy Watch";
const DESCRIPTION =
  "Every dataset behind the Global Bioenergy Watch panels: what each metric measures, the primary public sources it comes from, coverage rules and known limitations.";

export const Route = createFileRoute("/data-sources")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://globalbioenergywatch.org/data-sources" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://globalbioenergywatch.org/data-sources" }],
  }),
  component: DataSourcesPage,
});

function DataSourcesPage() {
  return (
    <PageShell>
      <PageHeading
        icon={BookOpen}
        title="Data sources & methodology"
        subtitle="One section per dataset: what it measures, where every figure comes from, how entities are selected, and what the data cannot tell you."
      />

      <section className="rounded-lg border border-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-xl font-extrabold tracking-tight">How we compile the panels</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm/relaxed text-muted-foreground">
          <li>
            Entity figures are taken from primary public documents — annual reports, regulatory
            filings, national obligation registers and statistical agencies — never from unattributed
            aggregations.
          </li>
          <li>
            Where a company does not publish a figure directly, the value is derived from a published
            total and clearly marked as an estimate in the metric notes below.
          </li>
          <li>
            Each dataset states the reporting year its figures refer to and the date it was last
            reviewed against its sources.
          </li>
          <li>
            Share prices and 1-day changes are live delayed exchange quotes and are not part of the
            curated datasets.
          </li>
        </ul>
      </section>

      <nav aria-label="Datasets" className="flex flex-wrap gap-2">
        {DATASETS.map((d) => (
          <a
            key={d.id}
            href={`#${d.id}`}
            className="label-mono border border-border bg-white px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:border-foreground hover:bg-muted"
          >
            {d.panel}
          </a>
        ))}
      </nav>

      {DATASETS.map((d) => (
        <section
          key={d.id}
          id={d.id}
          className="scroll-mt-24 rounded-lg border border-border bg-white p-5 shadow-sm sm:p-6"
        >
          <header className="border-b border-border pb-3">
            <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">{d.panel}</h2>
            <p className="mt-1.5 text-sm/relaxed text-muted-foreground">{d.description}</p>
            <p className="label-mono mt-2 text-xs text-muted-foreground">
              Figures as reported for {d.reportingYear} · Last reviewed {d.lastReviewed}
            </p>
          </header>

          <div className="mt-4 grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="label-mono text-foreground">Metrics</h3>
              <ul className="mt-2 space-y-2.5">
                {d.metrics.map((m) => (
                  <li key={m.label} className="text-sm">
                    <span className="font-semibold text-foreground">{m.label}</span>{" "}
                    <span className="text-muted-foreground">({m.unit})</span>
                    {m.estimated ? (
                      <span className="ml-2 border border-accent px-1.5 py-0.5 text-[0.65rem] font-bold tracking-wide text-accent uppercase">
                        Estimate
                      </span>
                    ) : null}
                    <p className="mt-1 text-sm/relaxed text-muted-foreground">{m.basis}</p>
                  </li>
                ))}
              </ul>

              <h3 className="label-mono mt-5 text-foreground">Coverage</h3>
              <p className="mt-2 text-sm/relaxed text-muted-foreground">{d.coverage}</p>

              <h3 className="label-mono mt-5 text-foreground">Known limitations</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm/relaxed text-muted-foreground">
                {d.limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="label-mono text-foreground">Sources</h3>
              <ul className="mt-2 space-y-3">
                {d.sources.map((s) => (
                  <li key={`${s.org}-${s.title}`} className="text-sm">
                    <div className="font-semibold text-foreground">{s.org}</div>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-start gap-1.5 text-sm/relaxed text-primary underline underline-offset-4 hover:opacity-80"
                    >
                      <span>
                        {s.title} ({s.year})
                      </span>
                      <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ))}

      <section className="rounded-lg border border-border bg-muted p-5 text-sm/relaxed text-muted-foreground">
        {REFERENCE_NOTE}
      </section>
    </PageShell>
  );
}
