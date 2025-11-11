-- ============================================================================
-- SPRINT 1 CONSOLIDATED MIGRATIONS
-- ============================================================================
--
-- This file consolidates all Sprint 1 migrations for easy manual execution.
-- Apply this via Supabase Dashboard SQL Editor in one go.
--
-- INSTRUCTIONS:
-- 1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new
-- 2. Copy this ENTIRE file
-- 3. Paste into SQL Editor
-- 4. Click "Run" (or press Ctrl+Enter)
-- 5. Wait for completion (should take 10-30 seconds)
-- 6. Check for green success message
--
-- If you see any "already exists" errors, that's OK - it means the migration
-- was previously applied.
--
-- ============================================================================

-- ============================================================================
-- MIGRATION 0: CREATE MISSING FUNCTIONS
-- ============================================================================

-- This function automatically updates the updated_date column to NOW()
-- Used by triggers on tables with updated_date columns
CREATE OR REPLACE FUNCTION update_updated_date_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION 1: SPRINT 1 PRODUCTION-READY SCHEMA
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SHORTCODE VALIDATION LOGS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS shortcode_validation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID REFERENCES content_queue(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  -- Validation results
  validation_passed BOOLEAN NOT NULL,
  errors JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,

  -- Metrics
  word_count INTEGER,
  internal_link_count INTEGER DEFAULT 0,
  external_link_count INTEGER DEFAULT 0,
  shortcode_count INTEGER DEFAULT 0,
  raw_html_link_count INTEGER DEFAULT 0,
  has_json_ld BOOLEAN DEFAULT FALSE,
  has_faq BOOLEAN DEFAULT FALSE,
  meta_description_length INTEGER DEFAULT 0,
  title_length INTEGER DEFAULT 0,

  -- Metadata
  validator_version TEXT DEFAULT '1.0',
  validation_duration_ms INTEGER,

  created_date TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_word_count_positive CHECK (word_count >= 0),
  CONSTRAINT chk_link_counts_positive CHECK (
    internal_link_count >= 0 AND
    external_link_count >= 0 AND
    shortcode_count >= 0 AND
    raw_html_link_count >= 0
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_validation_logs_content_id ON shortcode_validation_logs(content_id);
CREATE INDEX IF NOT EXISTS idx_validation_logs_user_id ON shortcode_validation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_validation_logs_passed ON shortcode_validation_logs(validation_passed);
CREATE INDEX IF NOT EXISTS idx_validation_logs_created ON shortcode_validation_logs(created_date DESC);

-- RLS Policies
ALTER TABLE shortcode_validation_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'shortcode_validation_logs' AND policyname = 'Users can view their own validation logs'
  ) THEN
    CREATE POLICY "Users can view their own validation logs"
      ON shortcode_validation_logs FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'shortcode_validation_logs' AND policyname = 'Users can insert their own validation logs'
  ) THEN
    CREATE POLICY "Users can insert their own validation logs"
      ON shortcode_validation_logs FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. QUOTE SOURCES
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS quote_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID REFERENCES content_queue(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),

  -- Quote content
  quote_text TEXT NOT NULL,
  attribution TEXT,
  source_type TEXT NOT NULL,
  source_url TEXT,

  -- Metadata
  scraped_date TIMESTAMPTZ,
  keyword TEXT,
  sentiment TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_fictional BOOLEAN DEFAULT FALSE,

  -- Reddit-specific
  reddit_subreddit TEXT,
  reddit_post_id TEXT,
  reddit_comment_id TEXT,
  reddit_score INTEGER,

  -- Twitter-specific
  twitter_tweet_id TEXT,
  twitter_username TEXT,
  twitter_retweet_count INTEGER,
  twitter_like_count INTEGER,

  -- Forum-specific
  forum_thread_id TEXT,
  forum_post_id TEXT,
  forum_username TEXT,

  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_source_type CHECK (source_type IN ('reddit', 'twitter', 'forum', 'manual', 'fictional')),
  CONSTRAINT chk_sentiment CHECK (sentiment IN ('positive', 'negative', 'neutral', NULL)),
  CONSTRAINT chk_quote_not_empty CHECK (char_length(quote_text) > 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quote_sources_content_id ON quote_sources(content_id);
CREATE INDEX IF NOT EXISTS idx_quote_sources_user_id ON quote_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_sources_type ON quote_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_quote_sources_keyword ON quote_sources(keyword);
CREATE INDEX IF NOT EXISTS idx_quote_sources_created ON quote_sources(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_quote_sources_verified ON quote_sources(is_verified) WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_quote_sources_text_search ON quote_sources USING gin(to_tsvector('english', quote_text));

-- RLS Policies
ALTER TABLE quote_sources ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'quote_sources' AND policyname = 'Users can view all quote sources'
  ) THEN
    CREATE POLICY "Users can view all quote sources"
      ON quote_sources FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'quote_sources' AND policyname = 'Users can insert their own quote sources'
  ) THEN
    CREATE POLICY "Users can insert their own quote sources"
      ON quote_sources FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'quote_sources' AND policyname = 'Users can update their own quote sources'
  ) THEN
    CREATE POLICY "Users can update their own quote sources"
      ON quote_sources FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'quote_sources' AND policyname = 'Users can delete their own quote sources'
  ) THEN
    CREATE POLICY "Users can delete their own quote sources"
      ON quote_sources FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_quote_sources_updated_date ON quote_sources;
CREATE TRIGGER update_quote_sources_updated_date
  BEFORE UPDATE ON quote_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date_column();

-- ----------------------------------------------------------------------------
-- 3. AI USAGE LOGS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID REFERENCES content_queue(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),
  agent_name TEXT,

  -- Request details
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_length INTEGER,

  -- Token usage
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,

  -- Cost calculation
  input_cost_per_token NUMERIC(12, 8),
  output_cost_per_token NUMERIC(12, 8),
  total_cost NUMERIC(10, 6) GENERATED ALWAYS AS (
    (input_tokens * input_cost_per_token) + (output_tokens * output_cost_per_token)
  ) STORED,

  -- Performance metrics
  request_duration_ms INTEGER,
  response_success BOOLEAN DEFAULT TRUE,
  error_message TEXT,

  -- Cache metrics
  cache_hit BOOLEAN DEFAULT FALSE,
  cache_savings_pct NUMERIC(5, 2),

  created_date TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_provider CHECK (provider IN ('claude', 'openai', 'gemini')),
  CONSTRAINT chk_tokens_positive CHECK (input_tokens >= 0 AND output_tokens >= 0),
  CONSTRAINT chk_duration_positive CHECK (request_duration_ms >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_content_id ON ai_usage_logs(content_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_provider ON ai_usage_logs(provider);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_model ON ai_usage_logs(model);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_agent ON ai_usage_logs(agent_name);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created ON ai_usage_logs(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_cost ON ai_usage_logs(total_cost DESC);

-- RLS Policies
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_usage_logs' AND policyname = 'Users can view their own AI usage logs'
  ) THEN
    CREATE POLICY "Users can view their own AI usage logs"
      ON ai_usage_logs FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_usage_logs' AND policyname = 'Users can insert their own AI usage logs'
  ) THEN
    CREATE POLICY "Users can insert their own AI usage logs"
      ON ai_usage_logs FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. UPDATE CONTENT_QUEUE TABLE (Add SLA Columns)
-- ----------------------------------------------------------------------------

ALTER TABLE content_queue
ADD COLUMN IF NOT EXISTS pending_since TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_approved_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_approved_reason TEXT;

-- Backfill pending_since for existing records
UPDATE content_queue
SET pending_since = created_date
WHERE status = 'pending_review'
  AND pending_since IS NULL;

-- Create index for SLA queries
CREATE INDEX IF NOT EXISTS idx_content_queue_sla
ON content_queue (status, pending_since)
WHERE status = 'pending_review';

-- Create trigger to automatically set pending_since
CREATE OR REPLACE FUNCTION set_pending_since()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending_review' AND (OLD.status IS NULL OR OLD.status != 'pending_review') THEN
    NEW.pending_since = NOW();
  END IF;
  IF OLD.status = 'pending_review' AND NEW.status != 'pending_review' THEN
    NEW.pending_since = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_pending_since ON content_queue;
CREATE TRIGGER trigger_set_pending_since
BEFORE UPDATE ON content_queue
FOR EACH ROW
EXECUTE FUNCTION set_pending_since();

-- ----------------------------------------------------------------------------
-- 5. UPDATE WORDPRESS_CONNECTIONS TABLE (Database Connection Columns)
-- ----------------------------------------------------------------------------

ALTER TABLE wordpress_connections
ADD COLUMN IF NOT EXISTS db_host TEXT,
ADD COLUMN IF NOT EXISTS db_port INTEGER DEFAULT 3306,
ADD COLUMN IF NOT EXISTS db_name TEXT,
ADD COLUMN IF NOT EXISTS db_user TEXT,
ADD COLUMN IF NOT EXISTS db_password_encrypted TEXT,
ADD COLUMN IF NOT EXISTS db_ssl_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS db_connection_tested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS db_last_test_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS db_test_error TEXT;

COMMENT ON COLUMN wordpress_connections.db_password_encrypted IS 'Encrypted database password. Must be encrypted before storage.';

-- ----------------------------------------------------------------------------
-- 6. VIEWS FOR COST MONITORING AND METRICS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW ai_cost_summary AS
SELECT
  content_id,
  user_id,
  provider,
  model,
  agent_name,
  COUNT(*) AS request_count,
  SUM(input_tokens) AS total_input_tokens,
  SUM(output_tokens) AS total_output_tokens,
  SUM(total_tokens) AS total_tokens,
  SUM(total_cost) AS total_cost,
  AVG(total_cost) AS avg_cost_per_request,
  AVG(request_duration_ms) AS avg_duration_ms,
  SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) AS cache_hit_count,
  ROUND(100.0 * SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) AS cache_hit_rate_pct,
  MIN(created_date) AS first_request,
  MAX(created_date) AS last_request
FROM ai_usage_logs
WHERE response_success = TRUE
GROUP BY content_id, user_id, provider, model, agent_name;

CREATE OR REPLACE VIEW content_cost_analysis AS
SELECT
  cq.id AS content_id,
  cq.title,
  cq.status,
  cq.content_type,
  COALESCE(SUM(ai.total_cost), 0) AS total_ai_cost,
  COUNT(ai.id) AS ai_request_count,
  SUM(ai.input_tokens) AS total_input_tokens,
  SUM(ai.output_tokens) AS total_output_tokens,
  cq.created_date,
  cq.published_date
FROM content_queue cq
LEFT JOIN ai_usage_logs ai ON ai.content_id = cq.id
GROUP BY cq.id, cq.title, cq.status, cq.content_type, cq.created_date, cq.published_date
ORDER BY total_ai_cost DESC;

CREATE OR REPLACE VIEW validation_metrics_summary AS
SELECT
  DATE(created_date) AS validation_date,
  COUNT(*) AS total_validations,
  SUM(CASE WHEN validation_passed THEN 1 ELSE 0 END) AS passed_count,
  SUM(CASE WHEN NOT validation_passed THEN 1 ELSE 0 END) AS failed_count,
  ROUND(100.0 * SUM(CASE WHEN validation_passed THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) AS pass_rate_pct,
  AVG(word_count) AS avg_word_count,
  AVG(internal_link_count) AS avg_internal_links,
  AVG(external_link_count) AS avg_external_links,
  AVG(shortcode_count) AS avg_shortcodes,
  SUM(raw_html_link_count) AS total_raw_html_links_detected,
  SUM(CASE WHEN has_json_ld THEN 1 ELSE 0 END) AS json_ld_present_count,
  AVG(validation_duration_ms) AS avg_validation_duration_ms
FROM shortcode_validation_logs
GROUP BY DATE(created_date)
ORDER BY validation_date DESC;

CREATE OR REPLACE VIEW quote_sourcing_metrics AS
SELECT
  source_type,
  COUNT(*) AS total_quotes,
  COUNT(DISTINCT content_id) AS content_items_with_quotes,
  SUM(CASE WHEN is_verified THEN 1 ELSE 0 END) AS verified_count,
  SUM(CASE WHEN is_fictional THEN 1 ELSE 0 END) AS fictional_count,
  AVG(CASE
    WHEN sentiment = 'positive' THEN 1
    WHEN sentiment = 'neutral' THEN 0
    WHEN sentiment = 'negative' THEN -1
    ELSE NULL
  END) AS avg_sentiment_score,
  MIN(created_date) AS first_quote_date,
  MAX(created_date) AS last_quote_date
FROM quote_sources
GROUP BY source_type
ORDER BY total_quotes DESC;

-- ----------------------------------------------------------------------------
-- 7. UTILITY FUNCTIONS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_content_cost(p_content_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(total_cost), 0)
  FROM ai_usage_logs
  WHERE content_id = p_content_id
    AND response_success = TRUE;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION is_content_within_budget(p_content_id UUID)
RETURNS BOOLEAN AS $$
  SELECT get_content_cost(p_content_id) < 10.0;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_sla_status(p_content_id UUID)
RETURNS TABLE (
  days_pending INTEGER,
  days_remaining INTEGER,
  auto_publish_eligible BOOLEAN
) AS $$
  SELECT
    FLOOR(EXTRACT(EPOCH FROM (NOW() - pending_since)) / 86400)::INTEGER AS days_pending,
    GREATEST(0, 5 - FLOOR(EXTRACT(EPOCH FROM (NOW() - pending_since)) / 86400)::INTEGER) AS days_remaining,
    FLOOR(EXTRACT(EPOCH FROM (NOW() - pending_since)) / 86400) >= 5 AS auto_publish_eligible
  FROM content_queue
  WHERE id = p_content_id
    AND status = 'pending_review'
    AND pending_since IS NOT NULL;
$$ LANGUAGE SQL STABLE;

-- ----------------------------------------------------------------------------
-- 8. GRANTS
-- ----------------------------------------------------------------------------

GRANT SELECT ON ai_cost_summary TO authenticated;
GRANT SELECT ON content_cost_analysis TO authenticated;
GRANT SELECT ON validation_metrics_summary TO authenticated;
GRANT SELECT ON quote_sourcing_metrics TO authenticated;

-- ============================================================================
-- MIGRATION 2: SETUP SLA CRON JOB
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing job if it exists
SELECT cron.unschedule('sla-autopublish-checker-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'sla-autopublish-checker-daily'
);

-- Schedule daily job at 12:00 PM UTC (8:00 AM ET)
-- IMPORTANT: Replace SERVICE_ROLE_KEY_HERE with actual service role key before running
SELECT cron.schedule(
  'sla-autopublish-checker-daily',
  '0 12 * * *',
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

-- Set service role key in database settings
-- IMPORTANT: Uncomment and add service role key:
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dnRzZmdyeXdlcWZwcGlsa3ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI5MDM0MSwiZXhwIjoyMDc3ODY2MzQxfQ.XNbwVWQS5Vya10ee_PhEjWvRg-Gp8f3yWTzLMWBuCTU';

-- Create monitoring view
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
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Sprint 1 Migrations Applied Successfully!';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration 0: update_updated_date_column() function created';
  RAISE NOTICE '✅ Migration 1: Tables, columns, views, functions created';
  RAISE NOTICE '   • shortcode_validation_logs';
  RAISE NOTICE '   • quote_sources';
  RAISE NOTICE '   • ai_usage_logs';
  RAISE NOTICE '   • content_queue (SLA columns added)';
  RAISE NOTICE '   • wordpress_connections (DB columns added)';
  RAISE NOTICE '✅ Migration 2: SLA cron job scheduled';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Remember to set service role key:';
  RAISE NOTICE '   Run this command separately if not already done:';
  RAISE NOTICE '   ALTER DATABASE postgres SET app.settings.service_role_key = ''YOUR_KEY'';';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next Steps:';
  RAISE NOTICE '   1. Verify tables: SELECT * FROM shortcode_validation_logs LIMIT 1;';
  RAISE NOTICE '   2. Check cron job: SELECT * FROM cron.job WHERE jobname = ''sla-autopublish-checker-daily'';';
  RAISE NOTICE '   3. Test Edge Functions with new schema';
  RAISE NOTICE '   4. Run verification script: node scripts/verify-sprint1-migrations.js';
  RAISE NOTICE '';
  RAISE NOTICE '=================================================================';
END $$;
