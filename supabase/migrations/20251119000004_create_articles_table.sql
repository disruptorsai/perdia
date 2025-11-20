-- =====================================================
-- PERDIA EDUCATION - ARTICLES TABLE (V2 DATA SOURCE)
-- =====================================================
-- Purpose: Primary articles table for V2 interface (ReviewQueue, ArticleEditor, etc.)
-- Note: This is separate from content_queue (V1 interface)
-- Created: 2025-11-19
-- =====================================================

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Article content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  slug TEXT,

  -- SEO metadata
  meta_title TEXT,
  meta_description TEXT,
  target_keywords TEXT[],

  -- Featured image
  featured_image_url TEXT,

  -- Status workflow
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'scheduled', 'published', 'rejected')),

  -- Auto-publish SLA (5 days)
  auto_publish_at TIMESTAMPTZ,

  -- Publishing
  scheduled_publish_date TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  wordpress_post_id TEXT,
  wordpress_url TEXT,

  -- Quality metrics
  word_count INTEGER DEFAULT 0,
  readability_score DECIMAL(5,2),
  seo_score DECIMAL(5,2),

  -- AI generation tracking
  model_primary TEXT, -- e.g., "grok-2"
  model_verify TEXT, -- e.g., "sonar-pro"
  generation_cost DECIMAL(10,4) DEFAULT 0,
  verification_cost DECIMAL(10,4) DEFAULT 0,

  -- Validation
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid')),
  validation_errors JSONB,

  -- Review tracking
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,

  -- Timestamps
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own articles"
ON articles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own articles"
ON articles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own articles"
ON articles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own articles"
ON articles FOR DELETE
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_articles_user_id ON articles(user_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_created_date ON articles(created_date DESC);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_auto_publish ON articles(auto_publish_at) WHERE auto_publish_at IS NOT NULL;

-- Trigger for updated_date
CREATE TRIGGER update_articles_updated_date
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

-- Trigger to auto-set auto_publish_at when status changes to 'approved'
CREATE OR REPLACE FUNCTION set_auto_publish_date()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to 'approved' and auto_publish_at is not set
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.auto_publish_at IS NULL THEN
    -- Set auto-publish to 5 days from now
    NEW.auto_publish_at = NOW() + INTERVAL '5 days';
  END IF;

  -- If status changed from 'approved' to something else, clear auto_publish_at
  IF NEW.status != 'approved' AND OLD.status = 'approved' THEN
    NEW.auto_publish_at = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_auto_publish_trigger
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION set_auto_publish_date();

-- Add comment
COMMENT ON TABLE articles IS 'Primary articles table for V2 interface (ReviewQueue, ArticleEditor)';
COMMENT ON COLUMN articles.auto_publish_at IS 'Auto-publish date (5 days after approval)';
COMMENT ON COLUMN articles.validation_status IS 'Validation result: pending, valid, invalid';
COMMENT ON COLUMN articles.generation_cost IS 'Cost in USD for content generation';
COMMENT ON COLUMN articles.verification_cost IS 'Cost in USD for fact-checking/verification';
