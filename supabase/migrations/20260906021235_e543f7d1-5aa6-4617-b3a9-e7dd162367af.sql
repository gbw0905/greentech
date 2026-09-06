REVOKE ALL ON public.flyer_generations FROM anon, authenticated;
REVOKE ALL ON public.linkedin_drafts FROM anon, authenticated;
REVOKE ALL ON public.linkedin_settings FROM anon, authenticated;

GRANT ALL ON public.flyer_generations TO service_role;
GRANT ALL ON public.linkedin_drafts TO service_role;
GRANT ALL ON public.linkedin_settings TO service_role;

CREATE POLICY "flyer_generations deny client access"
  ON public.flyer_generations AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "linkedin_drafts deny client access"
  ON public.linkedin_drafts AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "linkedin_settings deny client access"
  ON public.linkedin_settings AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);