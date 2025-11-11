-- =====================================================
-- PERDIA V2: MODULAR AI PIPELINE SYSTEM
-- =====================================================
-- This migration adds support for composable, toggleable AI pipelines
-- that allow A/B testing different content generation strategies.
--
-- Created: 2025-11-11
-- Sprint 0: Foundation

-- =====================================================
-- 1. PIPELINE CONFIGURATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS pipeline_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Configuration details
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL, -- Full pipeline configuration (inputs, generators, enhancements, post-processing)

  -- Status
  is_active BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,

  -- Performance tracking
  performance_metrics JSONB DEFAULT '{
    "total_articles": 0,
    "avg_generation_time_ms": 0,
    "avg_cost_usd": 0,
    "avg_manual_edits": 0,
    "avg_seo_score": 0,
    "success_rate": 1.0
  }'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_pipeline_configs_user_id ON pipeline_configurations(user_id);
CREATE INDEX idx_pipeline_configs_active ON pipeline_configurations(is_active) WHERE is_active = true;
CREATE INDEX idx_pipeline_configs_default ON pipeline_configurations(is_default) WHERE is_default = true;

-- RLS Policies
ALTER TABLE pipeline_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pipeline configs"
  ON pipeline_configurations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pipeline configs"
  ON pipeline_configurations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pipeline configs"
  ON pipeline_configurations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pipeline configs"
  ON pipeline_configurations FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_pipeline_configurations_updated_at
  BEFORE UPDATE ON pipeline_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. ADD PIPELINE TRACKING TO CONTENT QUEUE
-- =====================================================

-- Add columns to track which pipeline was used and detailed metadata
ALTER TABLE content_queue
  ADD COLUMN IF NOT EXISTS pipeline_config_id UUID REFERENCES pipeline_configurations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS generation_metadata JSONB DEFAULT '{
    "steps": [],
    "total_cost_usd": 0,
    "total_time_ms": 0,
    "models_used": []
  }'::jsonb;

-- Index for pipeline analytics
CREATE INDEX IF NOT EXISTS idx_content_queue_pipeline_config ON content_queue(pipeline_config_id);

-- =====================================================
-- 3. TOPIC QUESTIONS TABLE (NEW INPUT SOURCE)
-- =====================================================

CREATE TABLE IF NOT EXISTS topic_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Question details
  question_text TEXT NOT NULL,
  category TEXT, -- 'higher-ed', 'online-degrees', 'financial-aid', etc.
  source TEXT NOT NULL, -- 'monthly-ingest', 'weekly-trend', 'manual'
  source_url TEXT, -- Where the question was found

  -- Priority/ranking
  priority INTEGER DEFAULT 0,
  search_volume INTEGER,
  trending_score DECIMAL(3,2), -- 0.00 to 1.00

  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'in-progress', 'completed', 'archived'

  -- Timestamps
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_topic_questions_status ON topic_questions(status);
CREATE INDEX idx_topic_questions_priority ON topic_questions(priority DESC);
CREATE INDEX idx_topic_questions_category ON topic_questions(category);
CREATE INDEX idx_topic_questions_source ON topic_questions(source);
CREATE INDEX idx_topic_questions_trending_score ON topic_questions(trending_score DESC NULLS LAST);

-- RLS Policies (shared across all users in MVP)
ALTER TABLE topic_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view topic questions"
  ON topic_questions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage topic questions"
  ON topic_questions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_topic_questions_updated_at
  BEFORE UPDATE ON topic_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. SCRAPED QUOTES TABLE (NEW ENRICHMENT)
-- =====================================================

CREATE TABLE IF NOT EXISTS scraped_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Quote details
  quote_text TEXT NOT NULL,
  author TEXT,
  source_platform TEXT NOT NULL, -- 'reddit', 'twitter', 'geteducated-forums'
  source_url TEXT,

  -- Context
  topic_category TEXT, -- Match to topic_questions categories
  relevance_score DECIMAL(3,2), -- 0.00 to 1.00
  sentiment TEXT, -- 'positive', 'negative', 'neutral', 'mixed'

  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Quality control
  is_verified BOOLEAN DEFAULT false,
  is_appropriate BOOLEAN DEFAULT true,

  -- Timestamps
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_scraped_quotes_platform ON scraped_quotes(source_platform);
CREATE INDEX idx_scraped_quotes_category ON scraped_quotes(topic_category);
CREATE INDEX idx_scraped_quotes_relevance ON scraped_quotes(relevance_score DESC NULLS LAST);
CREATE INDEX idx_scraped_quotes_appropriate ON scraped_quotes(is_appropriate) WHERE is_appropriate = true;

-- RLS Policies
ALTER TABLE scraped_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view appropriate quotes"
  ON scraped_quotes FOR SELECT
  USING (auth.role() = 'authenticated' AND is_appropriate = true);

CREATE POLICY "Service role can manage quotes"
  ON scraped_quotes FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_scraped_quotes_updated_at
  BEFORE UPDATE ON scraped_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. INSERT DEFAULT PIPELINE CONFIGURATION
-- =====================================================

-- This default config matches the current system (100% backwards compatible)
INSERT INTO pipeline_configurations (
  name,
  description,
  config,
  is_active,
  is_default,
  user_id
) VALUES (
  'Classic Claude (Current System)',
  'Default configuration matching the existing AI pipeline. Uses Claude Sonnet 4.5 with keyword-driven content, SEO optimization, and internal linking.',
  '{
    "inputs": {
      "keywords": {
        "enabled": true,
        "weight": 1.0,
        "description": "Primary keyword targeting"
      },
      "topicQuestions": {
        "enabled": false,
        "weight": 0,
        "description": "Monthly question-based topics"
      },
      "trendSweep": {
        "enabled": false,
        "weight": 0,
        "description": "Daily trending topics"
      }
    },
    "generators": [
      {
        "model": "claude-sonnet-4-5-20250929",
        "provider": "claude",
        "enabled": true,
        "role": "primary",
        "temperature": 0.7,
        "max_tokens": 4000,
        "description": "Primary content generation"
      },
      {
        "model": "gpt-4o",
        "provider": "openai",
        "enabled": false,
        "role": "fallback",
        "temperature": 0.7,
        "max_tokens": 4000,
        "description": "Fallback generator"
      }
    ],
    "enhancements": {
      "perplexityFactCheck": {
        "enabled": false,
        "mode": "append",
        "description": "Verify facts with Perplexity"
      },
      "seoOptimizer": {
        "enabled": true,
        "description": "SEO optimization pass"
      },
      "internalLinks": {
        "enabled": true,
        "minLinks": 2,
        "maxLinks": 4,
        "description": "Add internal links to relevant content"
      },
      "externalLinks": {
        "enabled": true,
        "requireCitations": true,
        "description": "Add external citations"
      },
      "quotes": {
        "enabled": false,
        "sources": ["reddit", "twitter", "forums"],
        "minReal": 0.6,
        "perArticle": 2,
        "description": "Inject real scraped quotes"
      },
      "images": {
        "enabled": true,
        "model": "gemini-2.5-flash-image",
        "perArticle": 1,
        "description": "Generate article images"
      }
    },
    "postProcessing": {
      "shortcodeTransform": {
        "enabled": true,
        "description": "Transform links to GetEducated shortcodes"
      },
      "readabilityCheck": {
        "enabled": true,
        "targetGradeLevel": 8,
        "description": "Ensure readability"
      },
      "aiDetectionAvoidance": {
        "enabled": false,
        "strategy": "stylistic-variation",
        "description": "Add natural style variation"
      }
    }
  }'::jsonb,
  true,
  true,
  (SELECT id FROM auth.users LIMIT 1) -- Use first user, or NULL if no users yet
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to get active pipeline config
CREATE OR REPLACE FUNCTION get_active_pipeline_config(p_user_id UUID DEFAULT NULL)
RETURNS pipeline_configurations
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_config pipeline_configurations;
  v_user_id UUID;
BEGIN
  -- Use provided user_id or current user
  v_user_id := COALESCE(p_user_id, auth.uid());

  -- Try to get user's active config
  SELECT * INTO v_config
  FROM pipeline_configurations
  WHERE user_id = v_user_id AND is_active = true
  LIMIT 1;

  -- If no active config, get default
  IF v_config IS NULL THEN
    SELECT * INTO v_config
    FROM pipeline_configurations
    WHERE is_default = true
    LIMIT 1;
  END IF;

  RETURN v_config;
END;
$$;

-- Function to update pipeline performance metrics
CREATE OR REPLACE FUNCTION update_pipeline_metrics(
  p_pipeline_id UUID,
  p_generation_time_ms INTEGER,
  p_cost_usd DECIMAL(10,4),
  p_manual_edits INTEGER DEFAULT 0,
  p_seo_score INTEGER DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_metrics JSONB;
  v_total_articles INTEGER;
  v_avg_time DECIMAL;
  v_avg_cost DECIMAL;
  v_avg_edits DECIMAL;
  v_avg_seo DECIMAL;
BEGIN
  -- Get current metrics
  SELECT performance_metrics INTO v_current_metrics
  FROM pipeline_configurations
  WHERE id = p_pipeline_id;

  v_total_articles := (v_current_metrics->>'total_articles')::INTEGER + 1;

  -- Calculate running averages
  v_avg_time := (
    (v_current_metrics->>'avg_generation_time_ms')::DECIMAL * (v_total_articles - 1) + p_generation_time_ms
  ) / v_total_articles;

  v_avg_cost := (
    (v_current_metrics->>'avg_cost_usd')::DECIMAL * (v_total_articles - 1) + p_cost_usd
  ) / v_total_articles;

  v_avg_edits := (
    (v_current_metrics->>'avg_manual_edits')::DECIMAL * (v_total_articles - 1) + p_manual_edits
  ) / v_total_articles;

  IF p_seo_score IS NOT NULL THEN
    v_avg_seo := (
      (v_current_metrics->>'avg_seo_score')::DECIMAL * (v_total_articles - 1) + p_seo_score
    ) / v_total_articles;
  ELSE
    v_avg_seo := (v_current_metrics->>'avg_seo_score')::DECIMAL;
  END IF;

  -- Update metrics
  UPDATE pipeline_configurations
  SET
    performance_metrics = jsonb_build_object(
      'total_articles', v_total_articles,
      'avg_generation_time_ms', v_avg_time,
      'avg_cost_usd', v_avg_cost,
      'avg_manual_edits', v_avg_edits,
      'avg_seo_score', v_avg_seo,
      'success_rate', (v_current_metrics->>'success_rate')::DECIMAL
    ),
    last_used_at = NOW()
  WHERE id = p_pipeline_id;
END;
$$;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE pipeline_configurations IS 'Stores composable AI pipeline configurations for A/B testing different content generation strategies';
COMMENT ON TABLE topic_questions IS 'Monthly/weekly ingested questions about higher education to drive content topics';
COMMENT ON TABLE scraped_quotes IS 'Real quotes scraped from Reddit, Twitter, forums for article enrichment';
COMMENT ON COLUMN content_queue.pipeline_config_id IS 'Which pipeline configuration was used to generate this content';
COMMENT ON COLUMN content_queue.generation_metadata IS 'Detailed step-by-step metadata about the generation process';
