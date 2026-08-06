CREATE TABLE public.policy_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT '',
  published_at timestamptz,
  region text NOT NULL DEFAULT 'Global',
  country_slug text,
  country_name text,
  fuels text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.policy_updates TO anon;
GRANT SELECT ON public.policy_updates TO authenticated;
GRANT ALL ON public.policy_updates TO service_role;

ALTER TABLE public.policy_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Policy updates are publicly readable"
  ON public.policy_updates FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX policy_updates_published_idx ON public.policy_updates (published_at DESC NULLS LAST);
CREATE INDEX policy_updates_country_idx ON public.policy_updates (country_slug);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_policy_updates_updated_at
  BEFORE UPDATE ON public.policy_updates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'ingest-bioenergy-policy',
  '17 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--401a2000-6cee-45a4-88fd-aaa10b540f19.lovable.app/api/public/ingest-policy',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_Qw3RagQ7Q0Fl4vun40wCHg_LCBcpKEy"}'::jsonb,
    body := '{"source":"cron"}'::jsonb
  );
  $$
);