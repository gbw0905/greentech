select cron.schedule('daily-bioenergy-flyer', '30 6 * * *', $$
  select net.http_post(
    url:='https://project--401a2000-6cee-45a4-88fd-aaa10b540f19.lovable.app/api/public/daily-flyer-email',
    headers:='{"Content-Type": "application/json"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
$$);