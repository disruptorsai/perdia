/**
 * Setup SLA Auto-Publish Cron Job
 *
 * Created: 2025-11-10
 * Purpose: Schedule daily SLA checker to auto-publish content after 5 days
 *
 * Client Requirement (Tony & Kaylee, Nov 10 transcript):
 * "could we have the review process built in and if a piece of content
 *  is not reviewed within five days it automatically gets posted"
 *
 * Cron Schedule: Daily at 8:00 AM ET (12:00 PM UTC)
 *
 * Dependencies:
 * - pg_cron extension (already enabled on Supabase)
 * - pg_net extension (for HTTP requests)
 * - sla-autopublish-checker Edge Function (must be deployed)
 */

-- ============================================================================
-- 1. ENSURE REQUIRED EXTENSIONS ARE ENABLED
-- ============================================================================

-- pg_cron: Scheduling extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- pg_net: HTTP client for calling Edge Functions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================================
-- 2. SCHEDULE SLA AUTO-PUBLISH CHECKER
-- ============================================================================

-- Remove existing job if it exists (for re-running migration)
SELECT cron.unschedule('sla-autopublish-checker-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'sla-autopublish-checker-daily'
);

-- Schedule daily job at 12:00 PM UTC (8:00 AM ET)
SELECT cron.schedule(
  'sla-autopublish-checker-daily',
  '0 12 * * *', -- Cron expression: minute hour day month weekday
  $$
  SELECT
    net.http_post(
      url := 'https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/sla-autopublish-checker',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- ============================================================================
-- 3. CONFIGURE SERVICE ROLE KEY (One-Time Setup)
-- ============================================================================

-- IMPORTANT: Run this in SQL Editor with service role key
-- Replace 'YOUR_SERVICE_ROLE_KEY' with actual service role key from Supabase dashboard

-- ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';

-- Note: This stores the key in database config. Alternative: Use Supabase Vault (more secure)

-- ============================================================================
-- 4. VERIFY CRON JOB SETUP
-- ============================================================================

-- Check job was created
DO $$
DECLARE
  job_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO job_count
  FROM cron.job
  WHERE jobname = 'sla-autopublish-checker-daily';

  IF job_count = 1 THEN
    RAISE NOTICE 'SLA cron job successfully created: sla-autopublish-checker-daily';
    RAISE NOTICE 'Schedule: Daily at 12:00 PM UTC (8:00 AM ET)';
  ELSE
    RAISE WARNING 'SLA cron job creation may have failed. Please verify manually.';
  END IF;
END $$;

-- Display job details
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'sla-autopublish-checker-daily';

-- ============================================================================
-- 5. MONITORING QUERIES
-- ============================================================================

-- View recent cron job runs
CREATE OR REPLACE VIEW sla_cron_history AS
SELECT
  jr.runid,
  jr.job_pid,
  jr.database,
  jr.username,
  jr.command,
  jr.status,
  jr.return_message,
  jr.start_time,
  jr.end_time,
  EXTRACT(EPOCH FROM (jr.end_time - jr.start_time)) AS duration_seconds
FROM cron.job_run_details jr
WHERE jr.jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'sla-autopublish-checker-daily'
)
ORDER BY jr.start_time DESC;

GRANT SELECT ON sla_cron_history TO authenticated;

-- ============================================================================
-- 6. ALTERNATIVE SCHEDULES (Choose One)
-- ============================================================================

/*
-- OPTION 1: Run every hour (more responsive)
SELECT cron.schedule(
  'sla-autopublish-checker-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
      url := 'https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/sla-autopublish-checker',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- OPTION 2: Run twice daily (morning and afternoon)
SELECT cron.schedule(
  'sla-autopublish-checker-morning',
  '0 12 * * *', -- 8:00 AM ET
  $$ ... $$
);

SELECT cron.schedule(
  'sla-autopublish-checker-afternoon',
  '0 21 * * *', -- 5:00 PM ET
  $$ ... $$
);

-- OPTION 3: Run on weekdays only
SELECT cron.schedule(
  'sla-autopublish-checker-weekdays',
  '0 12 * * 1-5', -- Monday-Friday at 12:00 PM UTC
  $$ ... $$
);
*/

-- ============================================================================
-- 7. TROUBLESHOOTING COMMANDS
-- ============================================================================

-- Manually trigger cron job (for testing)
/*
SELECT
  net.http_post(
    url := 'https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/sla-autopublish-checker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  ) AS request_id;
*/

-- View all cron jobs
-- SELECT * FROM cron.job;

-- View recent cron job runs
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Unschedule job (if needed)
-- SELECT cron.unschedule('sla-autopublish-checker-daily');

-- Check pg_net extension
-- SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'SLA Auto-Publish Cron Job Setup Complete';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Job Name: sla-autopublish-checker-daily';
  RAISE NOTICE 'Schedule: Daily at 12:00 PM UTC (8:00 AM ET)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Set service role key: ALTER DATABASE postgres SET app.settings.service_role_key = ''YOUR_KEY'';';
  RAISE NOTICE '2. Deploy Edge Function: npx supabase functions deploy sla-autopublish-checker';
  RAISE NOTICE '3. Test manually: Run query in section 7 (TROUBLESHOOTING COMMANDS)';
  RAISE NOTICE '4. Monitor runs: SELECT * FROM sla_cron_history;';
  RAISE NOTICE '';
  RAISE NOTICE 'For help: See supabase/functions/sla-autopublish-checker/README.md';
  RAISE NOTICE '=================================================================';
END $$;
