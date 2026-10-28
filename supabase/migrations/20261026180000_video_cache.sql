-- Video search cache: persists YouTube API and Google News results in Supabase
-- so the app survives cold starts, deploys, and reduces external API calls.

CREATE TABLE video_cache (
  cache_key   TEXT        PRIMARY KEY,
  kind        TEXT        NOT NULL CHECK (kind IN ('youtube_search', 'news_search', 'youtube_related')),
  payload     JSONB       NOT NULL DEFAULT '[]'::jsonb,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_video_cache_kind_fetched ON video_cache (kind, fetched_at DESC);

ALTER TABLE video_cache ENABLE ROW LEVEL SECURITY;

-- Public read so the browser client can read cached results if needed in the future,
-- but writes are service-role only (server functions handle cache population).
CREATE POLICY "Video cache is publicly readable"
  ON video_cache FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Block client writes to video cache" ON video_cache
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

COMMENT ON TABLE video_cache IS 'Caches YouTube Data API and Google News RSS results to reduce external calls and survive cold starts.';
