-- PERDIA AUTOMATED TASKS - CRON JOB SETUP
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- CRON JOB 1: AUTO SCHEDULE CONTENT (Every Hour)
-- ============================================================================
-- Automatically finds approved content and schedules it based on automation settings
-- Runs at the top of every hour

DO $$
BEGIN
  -- Remove existing job if it exists
  PERFORM cron.unschedule('auto-schedule-content-hourly');
EXCEPTION
  WHEN undefined_function THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'auto-schedule-content-hourly',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/auto-schedule-content',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- ============================================================================
-- CRON JOB 2: PUBLISH SCHEDULED CONTENT (Every 15 Minutes)
-- ============================================================================
-- Publishes content that has reached its scheduled publish date
-- Runs every 15 minutes for timely publishing

DO $$
BEGIN
  PERFORM cron.unschedule('publish-scheduled-content-15min');
EXCEPTION
  WHEN undefined_function THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'publish-scheduled-content-15min',
  '*/15 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/publish-scheduled-content',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- ============================================================================
-- VERIFY SETUP
-- ============================================================================
-- View all scheduled cron jobs
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
ORDER BY jobname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Cron jobs successfully configured!';
  RAISE NOTICE '';
  RAISE NOTICE 'Active Jobs:';
  RAISE NOTICE '  1. auto-schedule-content-hourly - Runs every hour';
  RAISE NOTICE '  2. publish-scheduled-content-15min - Runs every 15 minutes';
  RAISE NOTICE '';
  RAISE NOTICE 'To enable GSC sync (requires Google Search Console credentials):';
  RAISE NOTICE '  See: docs/GSC_SETUP_GUIDE.md';
  RAISE NOTICE '';
  RAISE NOTICE 'Monitor job execution:';
  RAISE NOTICE '  SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;';
END $$;
