-- Move every subscriber to the daily digest.
UPDATE public.alert_subscribers
SET cadence = 'daily'
WHERE cadence IN ('instant', 'weekly');

-- Remove the old cadence check constraint so the column can hold only daily going forward.
ALTER TABLE public.alert_subscribers
DROP CONSTRAINT IF EXISTS alert_subscribers_cadence_check;

-- Replace alert automation with a single daily digest at 08:00 UTC.
SELECT cron.unschedule('instant-policy-briefs');
SELECT cron.unschedule('weekly-policy-alerts');

SELECT cron.schedule(
  'daily-policy-alerts',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://www.globalbioenergywatch.org/api/public/policy-alert-digest',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
