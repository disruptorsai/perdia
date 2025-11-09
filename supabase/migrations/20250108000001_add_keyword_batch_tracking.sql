-- =====================================================
-- ADD KEYWORD BATCH TRACKING
-- =====================================================
-- Migration: Add batch organization and favorites to keywords
-- Date: 2025-11-08
-- Purpose: Enable batch management for keyword research agent results
--
-- Changes:
-- - Add batch_id, batch_name, batch_source, batch_date fields
-- - Add is_starred field for favorites
-- - Add indexes for batch queries
-- - Add batch_starred field for batch-level starring
-- =====================================================

-- Add batch tracking fields to keywords table
ALTER TABLE keywords
ADD COLUMN IF NOT EXISTS batch_id UUID,
ADD COLUMN IF NOT EXISTS batch_name TEXT,
ADD COLUMN IF NOT EXISTS batch_source TEXT CHECK (batch_source IN ('keyword_researcher_agent', 'csv_upload', 'manual', 'ai_suggestion')),
ADD COLUMN IF NOT EXISTS batch_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS batch_starred BOOLEAN DEFAULT false;

-- Add indexes for batch queries
CREATE INDEX IF NOT EXISTS idx_keywords_batch_id ON keywords(batch_id);
CREATE INDEX IF NOT EXISTS idx_keywords_batch_date ON keywords(batch_date DESC);
CREATE INDEX IF NOT EXISTS idx_keywords_is_starred ON keywords(is_starred) WHERE is_starred = true;
CREATE INDEX IF NOT EXISTS idx_keywords_batch_starred ON keywords(batch_starred) WHERE batch_starred = true;
CREATE INDEX IF NOT EXISTS idx_keywords_batch_source ON keywords(batch_source);

-- Add comment for documentation
COMMENT ON COLUMN keywords.batch_id IS 'Groups keywords generated together (e.g., from same AI research session)';
COMMENT ON COLUMN keywords.batch_name IS 'User-friendly batch name (e.g., "Keyword Research - Nov 8, 2025")';
COMMENT ON COLUMN keywords.batch_source IS 'How the batch was created: keyword_researcher_agent, csv_upload, manual, ai_suggestion';
COMMENT ON COLUMN keywords.batch_date IS 'When the batch was created';
COMMENT ON COLUMN keywords.is_starred IS 'Whether this individual keyword is starred/favorited';
COMMENT ON COLUMN keywords.batch_starred IS 'Whether the entire batch is starred (applied to all keywords in batch)';
