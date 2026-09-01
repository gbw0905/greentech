// Shared data-source citations shown in every CSV export and AI summary.
// The per-panel citations come from the dataset provenance registry so a
// reference is written once and reused everywhere.

import { citationLine, datasetFor } from "@/lib/datasets/provenance";

export const SITE_URL = "https://www.globalbioenergywatch.org";

const BASE: string[] = [
  "Company identifiers and logos: Logo.dev brand API.",
  `Full dataset documentation, coverage rules and limitations: ${SITE_URL}/data-sources`,
];

/** Reference list for a panel, always non-empty. */
export function sourcesFor(panel: string): string[] {
  const meta = datasetFor(panel);
  if (!meta) return BASE;
  return [
    `Dataset: ${meta.description} Figures as reported for ${meta.reportingYear}; last reviewed ${meta.lastReviewed}.`,
    ...meta.sources.map(citationLine),
    ...BASE,
  ];
}

/** One-line provenance note appended to summaries and exports. */
export const REFERENCE_NOTE =
  "Figures are compiled from the primary public sources listed above and may lag the latest filings — always cross-verify against those sources before use in compliance or investment decisions.";
