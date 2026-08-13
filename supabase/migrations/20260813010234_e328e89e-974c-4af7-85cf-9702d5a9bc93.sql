ALTER TABLE public.site_visits ADD COLUMN IF NOT EXISTS country text;

DROP FUNCTION IF EXISTS public.record_visit(text, text, text);

CREATE OR REPLACE FUNCTION public.record_visit(_visitor_id text, _path text, _referrer text DEFAULT NULL, _country text DEFAULT NULL)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.site_visits (visitor_id, path, referrer, country)
  VALUES (left(_visitor_id, 64), left(coalesce(_path, '/'), 200), left(_referrer, 200), nullif(upper(left(_country, 2)), ''));
$$;

REVOKE EXECUTE ON FUNCTION public.record_visit(text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_visit(text, text, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.get_traffic_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_views', (SELECT count(*) FROM public.site_visits),
    'unique_visitors', (SELECT count(DISTINCT visitor_id) FROM public.site_visits),
    'views_today', (SELECT count(*) FROM public.site_visits WHERE created_at >= date_trunc('day', now())),
    'views_7d', (SELECT count(*) FROM public.site_visits WHERE created_at >= now() - interval '7 days'),
    'live_now', (SELECT count(DISTINCT visitor_id) FROM public.site_visits WHERE created_at >= now() - interval '5 minutes'),
    'daily', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'views', coalesce(v.c, 0)) ORDER BY d.day), '[]'::jsonb)
      FROM generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day') AS d(day)
      LEFT JOIN (
        SELECT date_trunc('day', created_at) AS day, count(*) AS c
        FROM public.site_visits
        WHERE created_at >= now() - interval '14 days'
        GROUP BY 1
      ) v ON v.day = d.day
    ),
    'top_paths', (
      SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM (
        SELECT path, count(*) AS views
        FROM public.site_visits GROUP BY path ORDER BY count(*) DESC LIMIT 6
      ) t
    ),
    'top_countries', (
      SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM (
        SELECT coalesce(country, 'ZZ') AS country,
               count(*) AS views,
               count(DISTINCT visitor_id) AS visitors
        FROM public.site_visits
        GROUP BY 1 ORDER BY count(*) DESC LIMIT 10
      ) t
    ),
    'top_sources', (
      SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM (
        SELECT CASE
                 WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
                 ELSE coalesce(nullif(regexp_replace(referrer, '^https?://(www\.)?([^/?#]+).*$', '\2'), ''), 'Direct')
               END AS source,
               count(*) AS views
        FROM public.site_visits
        GROUP BY 1 ORDER BY count(*) DESC LIMIT 8
      ) t
    )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.get_traffic_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_traffic_stats() TO service_role;