SELECT cron.unschedule('daily-policy-alerts') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-policy-alerts');

SELECT cron.schedule(
  'daily-policy-alerts',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--401a2000-6cee-45a4-88fd-aaa10b540f19.lovable.app/api/public/policy-alert-digest',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_Qw3RagQ7Q0Fl4vun40wCHg_LCBcpKEy"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);