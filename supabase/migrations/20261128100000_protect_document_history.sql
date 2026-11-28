-- Document records and their storage paths are created by the API.
DROP POLICY IF EXISTS "Users insert own analyses" ON public.document_analyses;
DROP POLICY IF EXISTS "Users delete own analyses" ON public.document_analyses;
REVOKE INSERT, UPDATE, DELETE ON public.document_analyses FROM anon, authenticated;
