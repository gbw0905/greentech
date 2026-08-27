CREATE TABLE public.flyer_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_key date NOT NULL UNIQUE,
  image_base64 text,
  prompt text NOT NULL,
  items_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  emailed_to text,
  emailed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.flyer_generations TO service_role;
ALTER TABLE public.flyer_generations ENABLE ROW LEVEL SECURITY;
-- No public policies; only service_role can access flyer metadata.