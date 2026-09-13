CREATE POLICY "Block client writes to premium members"
ON public.premium_members
AS RESTRICTIVE
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);