ALTER TABLE public.policy_updates ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'policy';
CREATE INDEX IF NOT EXISTS policy_updates_category_idx ON public.policy_updates (category);