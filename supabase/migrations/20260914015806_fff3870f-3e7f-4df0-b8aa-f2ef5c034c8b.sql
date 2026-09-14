CREATE TABLE public.ci_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled scenario',
  pathway_id text NOT NULL,
  pathway_label text NOT NULL,
  feedstock_label text NOT NULL DEFAULT '',
  region_label text NOT NULL DEFAULT '',
  ci_total numeric NOT NULL,
  gross_ci numeric NOT NULL DEFAULT 0,
  credits_ci numeric NOT NULL DEFAULT 0,
  annual_energy_mj numeric NOT NULL DEFAULT 0,
  annual_tonnes_co2e numeric NOT NULL DEFAULT 0,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  programs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ci_runs TO authenticated;
GRANT ALL ON public.ci_runs TO service_role;

ALTER TABLE public.ci_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage their own saved results"
  ON public.ci_runs FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX ci_runs_user_created_idx ON public.ci_runs (user_id, created_at DESC);

CREATE TRIGGER update_ci_runs_updated_at
  BEFORE UPDATE ON public.ci_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();