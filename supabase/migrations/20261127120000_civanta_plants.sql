-- CIVanta plants saved to the member's account, plus an append-only history of
-- every CI calculation so the profile can show past results on any device.

CREATE TABLE public.civanta_plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  pathway_id text NOT NULL DEFAULT '',
  pathway_label text NOT NULL DEFAULT '',
  calculated boolean NOT NULL DEFAULT false,
  latest_ci numeric,
  model jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.civanta_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id uuid NOT NULL REFERENCES public.civanta_plants(id) ON DELETE CASCADE,
  plant_name text NOT NULL,
  pathway_id text NOT NULL,
  pathway_label text NOT NULL DEFAULT '',
  ci numeric NOT NULL,
  parts jsonb NOT NULL DEFAULT '{}'::jsonb,
  inputs jsonb NOT NULL,
  input_hash text NOT NULL,
  engine_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.civanta_plants TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.civanta_calculations TO authenticated;
GRANT ALL ON public.civanta_plants TO service_role;
GRANT ALL ON public.civanta_calculations TO service_role;

ALTER TABLE public.civanta_plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civanta_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage their own plants"
  ON public.civanta_plants FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- History rows are never edited; they disappear only with their plant or account.
CREATE POLICY "Members read their own calculations"
  ON public.civanta_calculations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Members record their own calculations"
  ON public.civanta_calculations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX civanta_plants_user_updated_idx ON public.civanta_plants (user_id, updated_at DESC);
CREATE INDEX civanta_calculations_plant_created_idx
  ON public.civanta_calculations (plant_id, created_at DESC);
CREATE INDEX civanta_calculations_user_created_idx
  ON public.civanta_calculations (user_id, created_at DESC);

CREATE TRIGGER update_civanta_plants_updated_at
  BEFORE UPDATE ON public.civanta_plants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
