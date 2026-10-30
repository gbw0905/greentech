# Handoff

## Completed work
- Combined local work from both Bioenergy chats in the Greentech checkout.
- Added the homepage program-logo ribbon and local assets, refined hero spacing and animations, deferred the policy map, and clarified rolling archive counts and the annual bioenergy market estimate.
- Updated map zoom controls, newsletter country sorting, footer alignment, document analyzer layout, pipeline labels, video browsing controls, and legal-page presentation.
- Updated calculator typography, manual Run behavior, stable results while editing, validation, toolbars, and iframe content sizing. Optimizer inputs use page scrolling.
- Added a Pro CI accounting flow with overview/source detail, interactive ledger contributions, separate negative adjustments, reconciliation, baseline difference, and an accessible table.
- Balanced secondary CI result cards between desktop columns.

## Key files
- `public/tools/ci-flow.mjs`, `ci-workspace.js`, `credit-calculator.js`, `manual-run.mjs`, `calculator-premium.css` — embedded calculator behavior and visualization.
- `src/routes/ci-workspace.tsx`, `src/routes/credit-calculator.tsx` — iframe sizing and calculator integration.
- `src/features/optimizer/OptimizerPage.tsx`, `optimizer.css` — optimizer interaction and layout.
- `src/features/home/components/ProgramRibbon.*`, `program-logos.json`, `public/program-logos/` — logo ribbon.
- `src/features/home/bioenergy-market-value.ts`, `src/routes/index.tsx` — dated annual market estimate.
- `src/components/IntelligenceFooter.*`, `FooterNewsletter.tsx` — footer and newsletter.
- `src/features/documents/components/document-analyzer.css`, `DocumentAnalyzerPage.tsx` — analyzer.
- `tests/ci-flow.test.mjs`, `tests/manual-run.test.mjs` — new regression coverage.

## Important decisions
- Sankey widths represent positive CI ledger contributions in one unit. Negative accounting adjustments are presented separately; they do not establish physical carbon removal or regulatory credits.
- Preserve the existing Pro gate for detailed flow and downloads.
- Annual market size is a dated estimate, distinct from intraday market quotes.

## Things that should not change
- Preserve calculator formulas, authentication, server-side premium checks, and unrelated developer changes.
- Do not force-push or rewrite published history; the repository syncs with Lovable.
- Keep environment secrets out of Git.

## Verification results
- On 2026-10-30, fetched origin and verified HEAD matched origin/main at 55dc154 before committing these changes.
- Production build passed. Full Node test invocation: 297 passed; one test file failed to load because direct Node execution cannot resolve its existing @/ import alias.
- CI flow and calculator tests: 121 passed, including every preset, zero/negative-only cases, reconciliation mismatches and dense source grouping.
- Codex browser verified CI flow overview/source views and electricity-node calculation details.
- git diff --check passed.

## Unresolved issues
- tests/request-auth.test.mjs needs a runner that resolves TypeScript @/ imports; the direct Node invocation fails before assertions.
- Latest column-balancing and iframe whitespace fixes passed build but have not received a fresh visual inspection.
- This task has not verified production deployment.

## Next step
- Review the combined pull request and verify calculator flows, footer and responsive spacing on its deployment preview before merging.
