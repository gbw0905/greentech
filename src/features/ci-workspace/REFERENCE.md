# CI Workspace source

Ported from the GBW-owned reference at https://globalbioenergywatch.org/civanta-ci-scenario.html on 14 October 2026. The lifecycle and dairy engines, pathway presets, regulatory comparison logic, plots, baseline, custom emissions and device history are preserved. The local page adds explicit blank inputs, an opt-in default fill, GBW styling and a same-origin Excel export bridge.

Reference snapshot SHA-256: bd15e432859f87494cd762f54bdab88b6d20748de70d2d622b3cddfc3804903b

The original model qualifications and inventory warnings remain visible. Agreement with this implementation verifies migration parity, not regulatory certification or approval of the inherited model factors.

Tab 5 adds the GBW-owned Credit/RIN planning engine from
https://globalbioenergywatch.org/civanta-credit-calculator.html and the CIVanta hero artwork.
The credit engine is preserved locally with namespaced device storage, GBW styling,
same-origin height/export messages and an Excel workbook export. The workspace handoff
retains full CI precision and its liquid fuel energy density. This migration preserves
reference behavior; it is not an independent certification of regulatory assumptions.

Premium workflow update: both calculators send versioned snapshots to the authenticated
same-origin parent after explicit successful Run / Calculate clicks. History uses the existing
`ci_runs` account repository with reserved `civanta/ci` and `civanta/credit` tags. Credit
metrics are stored in the JSON record; legacy CI dashboards exclude both tags. Row-level
security and explicit user predicates keep list/restore operations private. History is
paginated by date and supports restoration from either a calculator or the profile.
Draft inputs save automatically in the current browser, including unfinished edits. Subsequent calculation corrections are documented in FINAL-REVIEW.md.
Excel exports use Aptos, frozen titles, print settings and formatted numeric cells; stored
numeric precision is preserved.

Final software review (15 October 2026): calculation engines are now separate ES modules.
`credit-engine.mjs` is shared by both pages; `workspace-engine.mjs` exposes the lifecycle,
dairy, overrides and scope allocation functions without a DOM dependency.
See [FINAL-REVIEW.md](./FINAL-REVIEW.md) for corrected sample inputs, Oregon standards,
validation changes, reproducible checks and the limits of this review.
