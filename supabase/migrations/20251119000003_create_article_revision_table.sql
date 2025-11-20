-- =====================================================
-- PERDIA EDUCATION - ARTICLE REVISION TABLE
-- =====================================================
-- Purpose: Track editorial comments and revision history for articles
-- Created: 2025-11-19
-- =====================================================

-- Create article_revisions table
CREATE TABLE IF NOT EXISTS article_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Relations (supports both content_queue and articles tables)
  article_id UUID NOT NULL, -- Can reference either content_queue.id or articles.id
  article_source TEXT DEFAULT 'content_queue' CHECK (article_source IN ('content_queue', 'articles')),

  -- Revision data
  content TEXT NOT NULL,
  comment TEXT,
  revision_type TEXT DEFAULT 'edit' CHECK (revision_type IN ('edit', 'comment', 'approval', 'rejection')),

  -- Metadata
  changes_summary JSONB, -- JSON object describing what changed

  -- Timestamps
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE article_revisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (support both content_queue and articles tables)
CREATE POLICY "Users can view all revisions for articles they can view"
ON article_revisions FOR SELECT
USING (
  (
    article_source = 'content_queue' AND
    EXISTS (
      SELECT 1 FROM content_queue
      WHERE content_queue.id = article_revisions.article_id
      AND content_queue.user_id = auth.uid()
    )
  ) OR (
    article_source = 'articles' AND
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_revisions.article_id
      AND articles.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create revisions for their articles"
ON article_revisions FOR INSERT
WITH CHECK (
  (
    article_source = 'content_queue' AND
    EXISTS (
      SELECT 1 FROM content_queue
      WHERE content_queue.id = article_revisions.article_id
      AND content_queue.user_id = auth.uid()
    )
  ) OR (
    article_source = 'articles' AND
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_revisions.article_id
      AND articles.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their own revisions"
ON article_revisions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own revisions"
ON article_revisions FOR DELETE
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_article_revisions_article_id ON article_revisions(article_id);
CREATE INDEX idx_article_revisions_user_id ON article_revisions(user_id);
CREATE INDEX idx_article_revisions_created_date ON article_revisions(created_date DESC);
CREATE INDEX idx_article_revisions_type ON article_revisions(revision_type);

-- Trigger for updated_date
CREATE TRIGGER update_article_revisions_updated_date
  BEFORE UPDATE ON article_revisions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

-- Add comment
COMMENT ON TABLE article_revisions IS 'Editorial comments and revision history for articles';
COMMENT ON COLUMN article_revisions.revision_type IS 'Type of revision: edit, comment, approval, rejection';
COMMENT ON COLUMN article_revisions.changes_summary IS 'JSON object describing what changed in this revision';
