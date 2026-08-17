select cron.schedule(
  'instant-policy-briefs',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := 'https://project--401a2000-6cee-45a4-88fd-aaa10b540f19.lovable.app/api/public/instant-brief-alerts',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

select cron.schedule(
  'weekly-policy-alerts',
  '0 7 * * 1',
  $$
  select net.http_post(
    url := 'https://project--401a2000-6cee-45a4-88fd-aaa10b540f19.lovable.app/api/public/policy-alert-digest?cadence=weekly',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);