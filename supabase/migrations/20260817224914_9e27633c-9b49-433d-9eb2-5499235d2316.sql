ALTER TABLE public.alert_subscribers
  ADD COLUMN IF NOT EXISTS cadence text NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS last_weekly_sent_at timestamptz;

ALTER TABLE public.alert_subscribers
  DROP CONSTRAINT IF EXISTS alert_subscribers_cadence_check;
ALTER TABLE public.alert_subscribers
  ADD CONSTRAINT alert_subscribers_cadence_check CHECK (cadence IN ('instant','daily','weekly'));

ALTER TABLE public.policy_updates
  ADD COLUMN IF NOT EXISTS ai_brief text,
  ADD COLUMN IF NOT EXISTS ai_brief_at timestamptz;

CREATE TABLE IF NOT EXISTS public.brief_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid REFERENCES public.alert_subscribers(id) ON DELETE CASCADE,
  email text NOT NULL,
  update_id uuid REFERENCES public.policy_updates(id) ON DELETE CASCADE,
  cadence text NOT NULL DEFAULT 'ondemand',
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS brief_sends_email_update_uidx
  ON public.brief_sends (email, update_id);

GRANT ALL ON public.brief_sends TO service_role;

ALTER TABLE public.brief_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct client access to brief_sends" ON public.brief_sends;
CREATE POLICY "No direct client access to brief_sends"
  ON public.brief_sends AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);