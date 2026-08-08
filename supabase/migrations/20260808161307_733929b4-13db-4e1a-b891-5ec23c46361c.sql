-- Explicitly deny all direct Data API access to sensitive tables.
REVOKE ALL ON public.site_visits FROM anon, authenticated;
REVOKE ALL ON public.alert_subscribers FROM anon, authenticated;
GRANT ALL ON public.site_visits TO service_role;
GRANT ALL ON public.alert_subscribers TO service_role;

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visits FORCE ROW LEVEL SECURITY;
ALTER TABLE public.alert_subscribers FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct client access to site_visits" ON public.site_visits;
CREATE POLICY "No direct client access to site_visits"
  ON public.site_visits
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "No direct client access to alert_subscribers" ON public.alert_subscribers;
CREATE POLICY "No direct client access to alert_subscribers"
  ON public.alert_subscribers
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);