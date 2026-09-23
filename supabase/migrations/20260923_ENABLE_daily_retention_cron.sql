-- Execute after 20260923_privacy_retention.sql, in Supabase SQL Editor.
-- First enable the pg_cron extension in Supabase Dashboard > Integrations > Cron.
-- Default hosted pg_cron schedule is UTC; 03:15 UTC = 12:15 KST.
-- A previous v2.4 optional job may coexist; unschedule it to avoid duplicate runs.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'swuforce-mentor-retention') THEN
    PERFORM cron.unschedule('swuforce-mentor-retention');
  END IF;
END;
$$;
SELECT cron.schedule(
  'swuforce-daily-retention',
  '15 3 * * *',
  $$SELECT public.run_swuforce_retention();$$
);
-- Verify schedule and history on the Supabase Cron dashboard, or:
-- SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'swuforce-daily-retention';
-- SELECT * FROM public.privacy_retention_runs ORDER BY ran_at DESC LIMIT 10;
-- To test manually: SELECT public.run_swuforce_retention();
