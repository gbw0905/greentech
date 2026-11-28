-- Keep the existing schedules. The app and Supabase Vault share CRON_SECRET.
SELECT cron.schedule(job_name, job_schedule, format($job$
  SELECT net.http_post(
    url := %L,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || decrypted_secret
    ),
    timeout_milliseconds := 10000
  )
  FROM vault.decrypted_secrets
  WHERE name = 'gbw_cron_secret' AND decrypted_secret <> ''
  ORDER BY updated_at DESC
  LIMIT 1
$job$, 'https://www.globalbioenergywatch.org/api/public/' || endpoint))
FROM (VALUES
  ('ingest-bioenergy-policy', '17 * * * *', 'ingest-policy'),
  ('daily-policy-alerts', '0 8 * * *', 'policy-alert-digest'),
  ('weekly-policy-alerts', '0 7 * * 1', 'policy-alert-digest?cadence=weekly'),
  ('daily-bioenergy-flyer', '30 6 * * *', 'daily-flyer-email')
) AS jobs(job_name, job_schedule, endpoint);
