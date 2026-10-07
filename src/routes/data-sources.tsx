import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  Database,
  ExternalLink,
  FileText,
  Info,
  Layers3,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { MotionReveal } from "@/components/MotionReveal";
import { DATASETS, type DatasetMeta } from "@/shared/data/provenance";
import { REFERENCE_NOTE } from "@/shared/data/data-sources";

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

const COMPILATION_NOTES = [
  {
    title: "Primary documents",
    text: "Entity figures are taken from primary public documents — annual reports, regulatory filings, national obligation registers and statistical agencies — never from unattributed aggregations.",
  },
  {
    title: "Transparent estimates",
    text: "Where a company does not publish a figure directly, the value is derived from a published total and clearly marked as an estimate in the metric notes below.",
  },
  {
    title: "Reporting periods",
    text: "Each dataset states the reporting year its figures refer to and the date it was last reviewed against its sources.",
  },
  {
    title: "Market quotes",
    text: "Share prices and 1-day changes are live delayed exchange quotes and are not part of the curated datasets.",
  },
];

const METRIC_COUNT = DATASETS.reduce((count, dataset) => count + dataset.metrics.length, 0);
const CITATION_COUNT = DATASETS.reduce((count, dataset) => count + dataset.sources.length, 0);

function DatasetLinks() {
  return (
    <ol className="sources-index-list">
      {DATASETS.map((dataset, index) => (
        <li key={dataset.id}>
          <a href={`#${dataset.id}`}>
            <span className="sources-index-number" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{dataset.panel}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

function DatasetCard({ dataset, index }: { dataset: DatasetMeta; index: number }) {
  return (
    <section className="sources-dataset" id={dataset.id} aria-labelledby={`${dataset.id}-title`}>
      <header className="sources-dataset-heading">
        <div className="sources-dataset-eyebrow">
          <span>Dataset {String(index + 1).padStart(2, "0")}</span>
          <span>{dataset.sources.length} source citations</span>
        </div>
        <h2 id={`${dataset.id}-title`}>{dataset.panel}</h2>
        <p>{dataset.description}</p>
        <div className="sources-dataset-dates">
          <span>
            <CalendarDays aria-hidden="true" /> Figures as reported for{" "}
            <strong>{dataset.reportingYear}</strong>
          </span>
          <span>
            Last reviewed <time dateTime={dataset.lastReviewed}>{dataset.lastReviewed}</time>
          </span>
        </div>
      </header>

      <div className="sources-dataset-body">
        <div className="sources-evidence-grid">
          <div className="sources-metrics">
            <h3 className="sources-group-title">
              <ListChecks aria-hidden="true" /> Metrics
            </h3>
            <ul className="sources-metric-list">
              {dataset.metrics.map((metric) => (
                <li key={metric.label}>
                  <div className="sources-metric-heading">
                    <h4>{metric.label}</h4>
                    {metric.estimated ? <span className="sources-estimate">Estimate</span> : null}
                  </div>
                  <p className="sources-metric-unit">{metric.unit}</p>
                  <p className="sources-metric-basis">{metric.basis}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="sources-documents">
            <h3 className="sources-group-title">
              <FileText aria-hidden="true" /> Sources
            </h3>
            <ul className="sources-document-list">
              {dataset.sources.map((source) => (
                <li key={`${source.org}-${source.title}`}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sources-document-link"
                  >
                    <div className="sources-document-meta">
                      <span>{source.org}</span>
                      <span className="sources-document-year">{source.year}</span>
                    </div>
                    <div className="sources-document-title">
                      <span>{source.title}</span>
                      <ExternalLink aria-hidden="true" />
                    </div>
                    <span className="sources-document-action">
                      View source <span className="sr-only">(opens in a new tab)</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="sources-scope-grid">
          <section className="sources-coverage" aria-labelledby={`${dataset.id}-coverage`}>
            <h3 id={`${dataset.id}-coverage`} className="sources-group-title">
              <ShieldCheck aria-hidden="true" /> Coverage
            </h3>
            <p>{dataset.coverage}</p>
          </section>
          <section className="sources-limitations" aria-labelledby={`${dataset.id}-limitations`}>
            <h3 id={`${dataset.id}-limitations`} className="sources-group-title">
              <Info aria-hidden="true" /> Known limitations
            </h3>
            <ul>
              {dataset.limitations.map((limitation) => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}

function DataSourcesPage() {
  return (
    <div className="sources-page">
      <main className="sources-main">
        <MotionReveal as="header" className="sources-hero">
          <div className="sources-hero-copy">
            <span className="information-eyebrow">
              <BookOpen className="size-3.5" aria-hidden="true" /> Data & provenance
            </span>
            <h1>
              Data sources <span>& methodology</span>
            </h1>
            <p>
              One section per dataset: what it measures, where every figure comes from, how entities
              are selected, and what the data cannot tell you.
            </p>
          </div>
          <div className="sources-hero-stats" aria-label="Dataset registry overview">
            <div>
              <Database aria-hidden="true" />
              <span>
                <strong>{DATASETS.length}</strong>Documented datasets
              </span>
            </div>
            <div>
              <Layers3 aria-hidden="true" />
              <span>
                <strong>{METRIC_COUNT}</strong>Defined metrics
              </span>
            </div>
            <div>
              <FileText aria-hidden="true" />
              <span>
                <strong>{CITATION_COUNT}</strong>Source citations
              </span>
            </div>
          </div>
        </MotionReveal>

        <div className="sources-library-heading" id="dataset-library">
          <div>
            <p className="sources-kicker">The source registry</p>
            <h2>Explore the datasets</h2>
          </div>
          <span>{DATASETS.length} datasets</span>
        </div>
        <div className="sources-library-layout">
          <aside className="sources-sidebar">
            <nav className="sources-desktop-index" aria-label="Datasets">
              <div className="sources-index-heading">
                <BookOpen aria-hidden="true" />
                <h3>Browse datasets</h3>
              </div>
              <DatasetLinks />
            </nav>
            <details className="sources-mobile-index">
              <summary>
                Browse datasets <span>{DATASETS.length}</span>
                <ChevronDown aria-hidden="true" />
              </summary>
              <nav aria-label="Datasets">
                <DatasetLinks />
              </nav>
            </details>
            <p className="sources-sidebar-note">
              <Info aria-hidden="true" />
              <span>Reporting years refer to the figures, not the date you view them.</span>
            </p>
          </aside>
          <div className="sources-dataset-list">
            {DATASETS.map((dataset, index) => (
              <DatasetCard key={dataset.id} dataset={dataset} index={index} />
            ))}
          </div>
        </div>

        <MotionReveal
          as="section"
          className="sources-methodology"
          id="methodology"
          aria-labelledby="sources-methodology-title"
        >
          <div className="sources-section-heading">
            <span className="sources-heading-icon">
              <ShieldCheck aria-hidden="true" />
            </span>
            <div>
              <p className="sources-kicker">Our approach</p>
              <h2 id="sources-methodology-title">How we compile the panels</h2>
            </div>
          </div>
          <ol className="sources-principles">
            {COMPILATION_NOTES.map((note, index) => (
              <li key={note.title}>
                <span className="sources-principle-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{note.title}</h3>
                <p>{note.text}</p>
              </li>
            ))}
          </ol>
        </MotionReveal>

        <section className="sources-reference-note" aria-label="Reference note">
          <Info aria-hidden="true" />
          <p>{REFERENCE_NOTE}</p>
        </section>
      </main>
    </div>
  );
}
