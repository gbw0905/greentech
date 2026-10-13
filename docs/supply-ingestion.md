# Supply ingestion architecture

The supply pages are moving from static TypeScript arrays toward dynamic,
source-backed datasets. The current implementation starts that migration without
removing the existing panels.

## Source of truth

`/data-sources` remains the approved public source list. Its data comes from
`src/shared/data/provenance.ts`. The supply ingestion layer projects that list
into a scrape registry in `src/features/supply/source-registry.ts`.

The public methodology page answers: "Where did this dataset come from?"

The ingestion registry answers: "How can the system fetch and normalize it?"

## Database layer

Migration `20261006090000_supply_ingestion_foundation.sql` adds five tables:

- `supply_datasets` stores one row per approved dataset.
- `supply_sources` stores scrape-ready source metadata tied to a dataset.
- `supply_entities` stores normalized companies, networks, terminals, carriers,
  or other tracked entities.
- `supply_observations` stores metric values for entities with source links,
  reporting years, confidence, and estimate flags.
- `supply_ingest_runs` stores scraper/parser run history and errors.

Client roles can read datasets, active sources, entities, and observations.
Only the service role can write or read ingest run internals.

## Runtime layer

`src/features/supply/server-functions.ts` exposes:

- `getSupplyRegistryFn()` for the approved dataset/source registry.
- `getSupplyDatasetFn({ datasetId })` for normalized dynamic rows.

`getSupplyDatasetFn` is intentionally tolerant: if the new dynamic tables do not
exist yet or contain no observations, it returns an empty dynamic payload instead
of breaking current pages.

The manual ingest route at `/api/public/ingest-supply` is protected by
`SUPPLY_INGEST_ADMIN_KEY`. Call it with either `Authorization: Bearer <key>` or
`x-supply-ingest-key: <key>`. Scheduled refreshes may also use `CRON_SECRET`,
which Vercel sends as a bearer token for cron invocations. If neither
environment variable is configured, ingest routes fail closed with `503`.

`/api/public/refresh-stale-supply` is the cron-safe refresh route. It checks the
latest successful run for each parser-backed supply dataset and only calls the
scraper when the dataset is stale for its source cadence. Public pages continue
to serve the last successful normalized rows from Supabase.

## Migration strategy

1. Keep the current static panel arrays as fallback data.
2. Add parser modules source by source, prioritizing official APIs, CSV/XLS, and
   RSS before PDFs and HTML.
3. Write parser output into `supply_entities` and `supply_observations`.
4. Convert one panel at a time to read dynamic rows first and static rows second.
5. Once a panel has reliable dynamic coverage, remove its static data or keep it
   only as a seed/fallback fixture.

## Refresh cadence

Freshness is based on source cadence, not page views:

- `daily`: stale after 6 hours.
- `weekly`: stale after 24 hours.
- `monthly`: stale after 7 days.
- `quarterly`: stale after 14 days.
- `annual`: stale after 30 days.
- `manual`: never auto-refreshed.

Vercel Cron calls `/api/public/refresh-stale-supply` daily on the Hobby plan. The route is cheap
when data is fresh because it skips scraping and returns the freshness state.

## First parser: ethanol

The first implemented parser is `ethanol-eia-capacity`. It starts from the
approved EIA ethanol capacity source page, follows the XLSX workbook link, reads
the plant-level rows, and aggregates U.S. respondents into producer entities.

It writes two observations per producer:

- `capacityMl`: reported EIA annual capacity converted from million gallons to
  million litres.
- `plants`: count of EIA-listed operating ethanol plants represented by the
  producer aggregate.

This parser intentionally covers the U.S. slice first. Brazil, EU, India, and
China coverage still need parsers for the other approved ethanol sources before
the static ethanol panel can be fully retired.

## Parser contract

Each parser should normalize external data into observations like:

```ts
{
  datasetId: "ethanol",
  entityName: "POET",
  metricKey: "capacityMl",
  metricLabel: "Nameplate capacity",
  value: 11350,
  unit: "million litres per year",
  reportingYear: 2024,
  sourceUrl: "https://...",
  confidence: "reported"
}
```

Do not scrape unapproved sources into supply datasets. Add new public sources to
the provenance registry first, then attach parser metadata.
