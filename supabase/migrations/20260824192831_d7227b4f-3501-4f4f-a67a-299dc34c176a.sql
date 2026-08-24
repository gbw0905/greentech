CREATE TABLE public.linkedin_org_connections (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  access_token text NOT NULL,
  access_token_expires_at timestamptz NOT NULL,
  refresh_token text,
  refresh_token_expires_at timestamptz,
  scope text,
  person_urn text,
  person_name text,
  org_id text,
  org_name text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.linkedin_org_connections TO service_role;
ALTER TABLE public.linkedin_org_connections ENABLE ROW LEVEL SECURITY;