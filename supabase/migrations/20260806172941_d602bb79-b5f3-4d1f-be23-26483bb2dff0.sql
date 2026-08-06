CREATE TABLE public.site_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path TEXT NOT NULL DEFAULT '/',
  visitor_id TEXT NOT NULL,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX site_visits_created_at_idx ON public.site_visits (created_at DESC);
CREATE INDEX site_visits_visitor_idx ON public.site_visits (visitor_id);

GRANT ALL ON public.site_visits TO service_role;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.record_visit(_path TEXT, _visitor_id TEXT, _referrer TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _visitor_id IS NULL OR length(_visitor_id) = 0 OR length(_visitor_id) > 64 THEN
    RETURN;
  END IF;
  INSERT INTO public.site_visits (path, visitor_id, referrer)
  VALUES (left(coalesce(_path, '/'), 200), _visitor_id, left(_referrer, 200));
END;
$$;

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
        FROM public.site_visits
        GROUP BY path
        ORDER BY count(*) DESC
        LIMIT 6
      ) t
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.record_visit(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_traffic_stats() TO anon, authenticated;