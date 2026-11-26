# Archived CIVanta tools

The current CIVanta is served at `/civanta`. `/civanta-new` and the former calculator routes redirect there.

The original route implementations are preserved in `routes/`. The original standalone tool HTML/JS entry points are preserved in `public/tools/`. This folder is outside the application route tree and public directory, so these files are not served or imported into browser bundles. Shared engines remain in their original locations because the current CIVanta Excel exporter and historical report exports use them.

To restore a former tool, copy its route file back to `src/routes/` and, for the embedded CI/credit tools, copy the matching HTML and JavaScript files back to `public/tools/`. Restore menu links deliberately. `civanta-new-before-promotion.tsx` preserves the current workspace wrapper before its route became `/civanta`. No saved plant data or account history was deleted.
