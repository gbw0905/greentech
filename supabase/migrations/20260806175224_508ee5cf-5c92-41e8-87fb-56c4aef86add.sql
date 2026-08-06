REVOKE EXECUTE ON FUNCTION public.get_traffic_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_visit(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_traffic_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.record_visit(text, text, text) TO service_role;

REVOKE ALL ON TABLE public.site_visits FROM anon, authenticated;
GRANT ALL ON TABLE public.site_visits TO service_role;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;