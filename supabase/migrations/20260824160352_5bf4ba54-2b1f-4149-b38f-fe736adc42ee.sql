CREATE TABLE public.linkedin_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  company_page_url text NOT NULL DEFAULT 'https://www.linkedin.com/company/137244598/',
  company_org_id text NOT NULL DEFAULT '137244598',
  posting_mode text NOT NULL DEFAULT 'personal_mention' CHECK (posting_mode IN ('personal_mention', 'company_page')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.linkedin_settings TO service_role;
ALTER TABLE public.linkedin_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.linkedin_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;