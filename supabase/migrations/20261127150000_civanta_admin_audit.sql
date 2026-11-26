-- Admin-only CIVanta audit: reference documents (manuals, review workbooks) and
-- AI comparison reports against the live engine. Only the server (service role)
-- reads or writes these; admin access is checked against ADMIN_EMAILS.

CREATE TABLE public.civanta_audit_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_email text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  file_path text,
  extracted_text text NOT NULL,
  characters integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.civanta_audit_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.civanta_audit_documents(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_email text NOT NULL,
  engine_version text NOT NULL,
  model text NOT NULL,
  summary text NOT NULL DEFAULT '',
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  matches jsonb NOT NULL DEFAULT '[]'::jsonb,
  token_usage jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.civanta_audit_documents TO service_role;
GRANT ALL ON public.civanta_audit_reports TO service_role;

-- RLS with no policies: signed-in users and anonymous visitors get nothing.
ALTER TABLE public.civanta_audit_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civanta_audit_reports ENABLE ROW LEVEL SECURITY;

CREATE INDEX civanta_audit_documents_created_idx
  ON public.civanta_audit_documents (created_at DESC);
CREATE INDEX civanta_audit_reports_document_created_idx
  ON public.civanta_audit_reports (document_id, created_at DESC);

-- Private bucket for the original files. No storage policies: server access only.
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-docs', 'admin-docs', false)
ON CONFLICT (id) DO NOTHING;
