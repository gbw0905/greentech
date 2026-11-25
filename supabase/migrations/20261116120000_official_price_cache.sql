-- Official price cache: last good copy of public government price data
-- (EIA spot prices, CARB LCFS credit transfers, USDA AMS ethanol report).
-- Replaces the unofficial Yahoo Finance feed. Written by server functions
-- with the service role; readable by anyone because the data is public domain.

CREATE TABLE IF NOT EXISTS public.official_price_cache (
  cache_key   TEXT        PRIMARY KEY,
  payload     JSONB       NOT NULL,
  source_url  TEXT        NOT NULL,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.official_price_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Official price cache is publicly readable"
  ON public.official_price_cache FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Block client writes to official price cache" ON public.official_price_cache
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

COMMENT ON TABLE public.official_price_cache IS
  'Last successful fetch of EIA, CARB and USDA public price data, so pages survive cold starts and source outages.';
