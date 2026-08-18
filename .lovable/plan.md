# Footer copyright update

## Goal
Replace the current footer copyright text with the requested wording and preserve the existing LinkedIn hyperlink on "Syed Asiful Alam, PhD".

## Change
- File: `src/components/PageShell.tsx`
- Replace the existing footer paragraph that currently reads:
  `© {new Date().getFullYear()} All rights reserved — <LinkedIn link>Syed Asiful Alam, PhD</LinkedIn link>`
- New text:
  `© 2026 All rights reserved — Global Bioenergy Watch — Syed Asiful Alam, PhD`
- Keep the existing `https://www.linkedin.com/in/asifulalam0905024/` hyperlink on "Syed Asiful Alam, PhD".

## Verification
- Build the project to confirm no syntax errors.
- Check the preview footer shows the updated line and the name remains clickable to LinkedIn.
