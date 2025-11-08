-- Setup Cron Jobs for Perdia Edge Functions
-- These automate content scheduling, publishing, and GSC sync

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- 1. AUTO SCHEDULE CONTENT - Runs every hour
-- ============================================================================
-- Automatically schedules approved content based on automation settings
-- Runs at the top of every hour

SELECT cron.schedule(
  'auto-schedule-content-hourly',
  '0 * * * *', -- Every hour at :00
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
-- 2. PUBLISH SCHEDULED CONTENT - Runs every 15 minutes
-- ============================================================================
-- Publishes content that has reached its scheduled date
-- Runs every 15 minutes to ensure timely publishing

SELECT cron.schedule(
  'publish-scheduled-content-15min',
  '*/15 * * * *', -- Every 15 minutes
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
-- 3. GOOGLE SEARCH CONSOLE SYNC - Runs daily at 6am UTC
-- ============================================================================
-- Syncs GSC performance data and updates keyword rankings
-- NOTE: Requires GSC credentials to be configured
-- Uncomment when GSC credentials are set

/*
SELECT cron.schedule(
  'sync-gsc-data-daily',
  '0 6 * * *', -- Daily at 6am UTC
  $$
  SELECT
    net.http_post(
      url := 'https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/sync-gsc-data',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{"days": 30}'::jsonb
    ) AS request_id;
  $$
);
*/

-- ============================================================================
-- VERIFY CRON JOBS
-- ============================================================================
-- Run this query to see all scheduled jobs:
-- SELECT * FROM cron.job;

-- Run this query to see job execution history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- ============================================================================
-- DISABLE/REMOVE CRON JOBS (if needed)
-- ============================================================================
-- To disable a job:
-- SELECT cron.unschedule('job-name');

-- Examples:
-- SELECT cron.unschedule('auto-schedule-content-hourly');
-- SELECT cron.unschedule('publish-scheduled-content-15min');
-- SELECT cron.unschedule('sync-gsc-data-daily');

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Cron jobs run in UTC timezone
-- 2. Monitor execution in: SELECT * FROM cron.job_run_details
-- 3. Failed jobs will be logged with error details
-- 4. Edge Functions have 400-second timeout (plenty of time)
-- 5. Enable GSC sync cron when credentials are configured
