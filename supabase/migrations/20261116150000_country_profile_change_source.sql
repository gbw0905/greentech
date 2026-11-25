-- Every automatic change to a country profile (map colour, mandates, pop-up
-- text) must point at the article that justified it. These columns hold the
-- latest such change so the map pop-up can show "Updated <date> · <source>".

ALTER TABLE public.country_profiles
  ADD COLUMN IF NOT EXISTS last_change_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_change_fields TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_change_source_url TEXT,
  ADD COLUMN IF NOT EXISTS last_change_source_title TEXT,
  ADD COLUMN IF NOT EXISTS last_change_source_name TEXT,
  ADD COLUMN IF NOT EXISTS last_change_quote TEXT;

-- Full history of proposed and applied changes, with the evidence used.
ALTER TABLE public.country_enrichment_log
  ADD COLUMN IF NOT EXISTS evidence JSONB;

COMMENT ON COLUMN public.country_profiles.last_change_source_url IS
  'Article that justified the latest automatic profile change (must be from the trusted news archive).';
