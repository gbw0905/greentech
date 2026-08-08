CREATE TABLE public.alert_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  fuels text[] NOT NULL DEFAULT '{}'::text[],
  confirm_token text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  confirmed_at timestamptz,
  last_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.alert_subscribers TO service_role;
ALTER TABLE public.alert_subscribers ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_alert_subscribers_updated_at
BEFORE UPDATE ON public.alert_subscribers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX alert_subscribers_confirmed_idx ON public.alert_subscribers (confirmed_at);
CREATE INDEX policy_updates_created_at_idx ON public.policy_updates (created_at DESC);