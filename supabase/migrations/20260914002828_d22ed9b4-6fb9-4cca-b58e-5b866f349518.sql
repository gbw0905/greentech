DROP POLICY "Block client writes to premium members" ON public.premium_members;
CREATE POLICY "Block client writes to premium members" ON public.premium_members AS RESTRICTIVE FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "Block client updates to premium members" ON public.premium_members AS RESTRICTIVE FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "Block client deletes from premium members" ON public.premium_members AS RESTRICTIVE FOR DELETE TO authenticated, anon USING (false);