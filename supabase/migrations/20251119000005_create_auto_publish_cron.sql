-- =====================================================
-- PERDIA EDUCATION - 5-DAY SLA AUTO-PUBLISH CRON JOB
-- =====================================================
-- Purpose: Auto-publish approved articles after 5 days if not manually published
-- Runs: Daily at midnight (00:00 UTC)
-- Created: 2025-11-19
-- =====================================================

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to auto-publish articles past SLA
CREATE OR REPLACE FUNCTION auto_publish_articles()
RETURNS void AS $$
DECLARE
  v_published_count INTEGER := 0;
BEGIN
  -- Auto-publish articles from the articles table
  WITH updated_articles AS (
    UPDATE articles
    SET
      status = 'published',
      published_at = NOW()
    WHERE
      status = 'approved'
      AND auto_publish_at IS NOT NULL
      AND auto_publish_at <= NOW()
      AND validation_status = 'valid' -- Only publish if validation passed
    RETURNING id
  )
  SELECT COUNT(*) INTO v_published_count FROM updated_articles;

  -- Log the action
  RAISE NOTICE 'Auto-published % articles from articles table', v_published_count;

  -- Reset counter for content_queue table
  v_published_count := 0;

  -- Auto-publish articles from the content_queue table (V1 compatibility)
  WITH updated_queue AS (
    UPDATE content_queue
    SET
      status = 'published',
      published_at = NOW()
    WHERE
      status = 'approved'
      AND auto_publish_at IS NOT NULL
      AND auto_publish_at <= NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_published_count FROM updated_queue;

  -- Log the action
  RAISE NOTICE 'Auto-published % articles from content_queue table', v_published_count;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Auto-publish failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cron job to run daily at midnight UTC
SELECT cron.schedule(
  'auto-publish-sla',           -- Job name
  '0 0 * * *',                  -- Every day at midnight (cron format)
  $$SELECT auto_publish_articles();$$
);

-- Add comment
COMMENT ON FUNCTION auto_publish_articles() IS 'Auto-publishes approved articles after 5-day SLA expires';

-- Grant execute permission to authenticated users (for manual testing)
GRANT EXECUTE ON FUNCTION auto_publish_articles() TO authenticated;

-- NOTE: To manually test this function, run:
-- SELECT auto_publish_articles();

-- To check cron job status:
-- SELECT * FROM cron.job WHERE jobname = 'auto-publish-sla';

-- To remove the cron job (if needed):
-- SELECT cron.unschedule('auto-publish-sla');
