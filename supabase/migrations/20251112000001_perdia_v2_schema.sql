-- =====================================================
-- PERDIA V2 DATABASE MIGRATION
-- =====================================================
-- Migration: Add new tables for simplified V2 architecture
-- Date: 2025-11-12
-- Changes:
--   - Add articles table (simplified from content_queue)
--   - Add topic_questions table (questions-first strategy)
--   - Add feedback table (enhanced with training loop)
--   - Add quotes table (real quote sourcing)
--   - Add automation_schedule table (simplified settings)
--   - Add integrations table (simplified from wordpress_connections)
-- =====================================================

-- ============================
-- 1. ARTICLES TABLE (replaces content_queue for V2)
-- ============================
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  body TEXT NOT NULL, -- HTML content
  excerpt TEXT,
  featured_image_url TEXT,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  target_keywords TEXT[] DEFAULT '{}',
  word_count INTEGER DEFAULT 0,

  -- Status & Workflow
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_review', 'approved', 'published', 'rejected')),

  -- SLA Tracking (MANDATORY for 5-day auto-approve)
  pending_since TIMESTAMPTZ, -- When article entered pending_review
  auto_approve_at TIMESTAMPTZ, -- Calculated: pending_since + N days

  -- AI Model Tracking
  model_primary TEXT, -- e.g., 'grok-2'
  model_verify TEXT, -- e.g., 'pplx-70b-online'
  generation_cost NUMERIC(10,4), -- USD cost for generation
  verification_cost NUMERIC(10,4), -- USD cost for verification
  total_cost NUMERIC(10,4) GENERATED ALWAYS AS (COALESCE(generation_cost, 0) + COALESCE(verification_cost, 0)) STORED,

  -- WordPress Integration
  wordpress_post_id TEXT,
  wordpress_url TEXT,

  -- Validation
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('valid', 'invalid', 'pending')),
  validation_errors JSONB DEFAULT '[]',

  -- Source
  topic_question_id UUID, -- References topic_questions(id), added after table creation
  trend_source TEXT, -- e.g., 'twitter:2025-11-12'

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Indexes for articles
CREATE INDEX idx_articles_user_id ON articles(user_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_pending_since ON articles(pending_since);
CREATE INDEX idx_articles_auto_approve_at ON articles(auto_approve_at);
CREATE INDEX idx_articles_target_keywords ON articles USING gin(target_keywords);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_validation_status ON articles(validation_status);

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

-- Trigger for setting auto_approve_at when status changes to pending_review
CREATE OR REPLACE FUNCTION set_auto_approve_at()
RETURNS TRIGGER AS $$
DECLARE
  auto_approve_days INTEGER := 5; -- Default
  user_schedule RECORD;
BEGIN
  IF NEW.status = 'pending_review' AND (OLD.status IS NULL OR OLD.status != 'pending_review') THEN
    NEW.pending_since = NOW();

    -- Try to get user's custom auto_approve_days from automation_schedule
    SELECT auto_approve_days INTO user_schedule
    FROM automation_schedule
    WHERE user_id = NEW.user_id AND enabled = true
    LIMIT 1;

    IF FOUND AND user_schedule.auto_approve_days IS NOT NULL THEN
      auto_approve_days := user_schedule.auto_approve_days;
    END IF;

    NEW.auto_approve_at = NOW() + (auto_approve_days || ' days')::INTERVAL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_auto_approve_at
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION set_auto_approve_at();

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for articles
CREATE POLICY "Users can view their own articles"
  ON articles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own articles"
  ON articles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own articles"
  ON articles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own articles"
  ON articles FOR DELETE
  USING (auth.uid() = user_id);

-- ============================
-- 2. TOPIC_QUESTIONS TABLE (new)
-- ============================
CREATE TABLE IF NOT EXISTS topic_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Question Data
  question_text TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('monthly', 'weekly', 'daily_trend', 'manual')),
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Extracted Keywords
  keywords_extracted TEXT[] DEFAULT '{}',

  -- Prioritization
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  search_volume INTEGER DEFAULT 0,

  -- Usage Tracking
  used_for_article_id UUID, -- References articles(id), added after
  used_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(question_text, source)
);

-- Indexes
CREATE INDEX idx_topic_questions_source ON topic_questions(source);
CREATE INDEX idx_topic_questions_priority ON topic_questions(priority DESC);
CREATE INDEX idx_topic_questions_used_for_article_id ON topic_questions(used_for_article_id);
CREATE INDEX idx_topic_questions_discovered_at ON topic_questions(discovered_at DESC);
CREATE INDEX idx_topic_questions_keywords ON topic_questions USING gin(keywords_extracted);

-- Enable RLS (shared data in MVP - all users see same questions)
ALTER TABLE topic_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for topic_questions (public read, authenticated write)
CREATE POLICY "Anyone authenticated can view topic questions"
  ON topic_questions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert topic questions"
  ON topic_questions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update topic questions"
  ON topic_questions FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete topic questions"
  ON topic_questions FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================
-- 3. FEEDBACK TABLE (enhanced)
-- ============================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Feedback Type
  type TEXT NOT NULL CHECK (type IN ('comment', 'rewrite', 'regenerate', 'approve', 'reject')),

  -- Content
  payload JSONB NOT NULL, -- { text, instructions, rating, etc. }

  -- Training Loop
  used_for_training BOOLEAN DEFAULT false,
  training_impact TEXT, -- Description of how this affected future prompts

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_article_id ON feedback(article_id);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_type ON feedback(type);
CREATE INDEX idx_feedback_used_for_training ON feedback(used_for_training);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback
CREATE POLICY "Users can view feedback on their articles"
  ON feedback FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM articles WHERE articles.id = feedback.article_id AND articles.user_id = auth.uid())
  );

CREATE POLICY "Users can insert feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON feedback FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback"
  ON feedback FOR DELETE
  USING (auth.uid() = user_id);

-- ============================
-- 4. QUOTES TABLE (new)
-- ============================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,

  -- Quote Data
  quote_text TEXT NOT NULL,
  source_url TEXT,
  source_type TEXT CHECK (source_type IN ('reddit', 'twitter', 'forum', 'other')),
  author_name TEXT,

  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_quotes_article_id ON quotes(article_id);
CREATE INDEX idx_quotes_source_type ON quotes(source_type);
CREATE INDEX idx_quotes_verified ON quotes(verified);

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quotes
CREATE POLICY "Users can view quotes on their articles"
  ON quotes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM articles WHERE articles.id = quotes.article_id AND articles.user_id = auth.uid())
  );

CREATE POLICY "Users can insert quotes"
  ON quotes FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM articles WHERE articles.id = article_id AND articles.user_id = auth.uid())
  );

CREATE POLICY "Users can update quotes on their articles"
  ON quotes FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM articles WHERE articles.id = quotes.article_id AND articles.user_id = auth.uid())
  );

CREATE POLICY "Users can delete quotes on their articles"
  ON quotes FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM articles WHERE articles.id = quotes.article_id AND articles.user_id = auth.uid())
  );

-- ============================
-- 5. AUTOMATION_SCHEDULE TABLE (simplified)
-- ============================
CREATE TABLE IF NOT EXISTS automation_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Schedule Settings
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', '3x_week', 'weekly', 'custom')),
  post_time TIME NOT NULL DEFAULT '05:00:00', -- e.g., 5:00 AM
  timezone TEXT DEFAULT 'America/Denver', -- MT

  -- Approval Settings
  requires_approval BOOLEAN DEFAULT true,
  auto_approve_days INTEGER DEFAULT 5 CHECK (auto_approve_days >= 1),

  -- Status
  enabled BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_automation_schedule_user_id ON automation_schedule(user_id);
CREATE INDEX idx_automation_schedule_enabled ON automation_schedule(enabled);

-- Trigger
CREATE TRIGGER update_automation_schedule_updated_at
  BEFORE UPDATE ON automation_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

-- Enable RLS
ALTER TABLE automation_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own schedule"
  ON automation_schedule FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedule"
  ON automation_schedule FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedule"
  ON automation_schedule FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedule"
  ON automation_schedule FOR DELETE
  USING (auth.uid() = user_id);

-- ============================
-- 6. INTEGRATIONS TABLE (simplified from wordpress_connections)
-- ============================
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Integration Type
  type TEXT NOT NULL CHECK (type IN ('wordpress', 'mcp', 'other')),

  -- Connection Details
  name TEXT NOT NULL, -- e.g., "GetEducated.com"
  base_url TEXT NOT NULL,
  credentials JSONB NOT NULL, -- Encrypted: { username, password/token }

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  last_checked TIMESTAMPTZ,
  last_error TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_integrations_type ON integrations(type);
CREATE INDEX idx_integrations_status ON integrations(status);

-- Trigger
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

-- Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own integrations"
  ON integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
  ON integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
  ON integrations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================
-- ADD FOREIGN KEY CONSTRAINTS (after table creation)
-- ============================

-- Add foreign key from articles to topic_questions
ALTER TABLE articles
  ADD CONSTRAINT fk_articles_topic_question
  FOREIGN KEY (topic_question_id)
  REFERENCES topic_questions(id)
  ON DELETE SET NULL;

-- Add foreign key from topic_questions to articles
ALTER TABLE topic_questions
  ADD CONSTRAINT fk_topic_questions_article
  FOREIGN KEY (used_for_article_id)
  REFERENCES articles(id)
  ON DELETE SET NULL;

-- =====================================================
-- DATA MIGRATION: content_queue → articles
-- =====================================================

-- Migrate existing content_queue data to articles table
INSERT INTO articles (
  id, user_id, title, slug, body,
  meta_title, meta_description, target_keywords, word_count,
  status, wordpress_post_id, wordpress_url,
  created_at, updated_at, published_at
)
SELECT
  id,
  user_id,
  title,
  slug,
  content AS body,
  title AS meta_title,
  meta_description,
  target_keywords,
  word_count,
  status,
  wordpress_post_id,
  wordpress_url,
  created_date AS created_at,
  updated_date AS updated_at,
  published_date AS published_at
FROM content_queue
WHERE content_type = 'new_article'
ON CONFLICT (id) DO NOTHING;

-- Set pending_since and auto_approve_at for existing pending articles
UPDATE articles
SET
  pending_since = updated_at,
  auto_approve_at = updated_at + INTERVAL '5 days'
WHERE status = 'pending_review' AND pending_since IS NULL;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration creates:
-- - 6 new tables for Perdia V2
-- - Complete RLS policies
-- - Comprehensive indexes
-- - Auto-approve trigger logic
-- - Data migration from content_queue
--
-- Next steps:
-- 1. Run migration: npm run db:migrate
-- 2. Verify tables in Supabase dashboard
-- 3. Test RLS policies
-- 4. Deploy Edge Functions for Grok & Perplexity
-- =====================================================
