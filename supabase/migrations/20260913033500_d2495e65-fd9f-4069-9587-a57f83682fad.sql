CREATE TABLE public.premium_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  note text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.premium_members TO authenticated;
GRANT ALL ON public.premium_members TO service_role;

ALTER TABLE public.premium_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read their own premium row"
ON public.premium_members
FOR SELECT
TO authenticated
USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

CREATE TRIGGER update_premium_members_updated_at
BEFORE UPDATE ON public.premium_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();