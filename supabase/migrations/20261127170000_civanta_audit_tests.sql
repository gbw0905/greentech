-- Worked examples extracted from the reference document, run against the live engine on the admin page.
ALTER TABLE public.civanta_audit_reports
  ADD COLUMN IF NOT EXISTS tests jsonb NOT NULL DEFAULT '[]'::jsonb;
