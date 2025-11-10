-- =====================================================
-- ADD BATCH TRACKING COLUMNS TO KEYWORDS TABLE
-- =====================================================
-- Migration: Add batch tracking fields for keyword organization
-- Generated: 2025-11-10
-- Purpose: Support batch organization of keywords in KeywordManager

-- Add batch tracking columns to keywords table
ALTER TABLE keywords
ADD COLUMN IF NOT EXISTS batch_id UUID,
ADD COLUMN IF NOT EXISTS batch_name TEXT,
ADD COLUMN IF NOT EXISTS batch_source TEXT,
ADD COLUMN IF NOT EXISTS batch_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS batch_starred BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false;

-- Add index for batch_id lookups
CREATE INDEX IF NOT EXISTS idx_keywords_batch_id ON keywords(batch_id);

-- Add index for starred keywords
CREATE INDEX IF NOT EXISTS idx_keywords_is_starred ON keywords(is_starred);

-- Add index for batch_date ordering
CREATE INDEX IF NOT EXISTS idx_keywords_batch_date ON keywords(batch_date DESC);

-- Add comment explaining batch tracking
COMMENT ON COLUMN keywords.batch_id IS 'UUID grouping keywords imported or generated together';
COMMENT ON COLUMN keywords.batch_name IS 'Human-readable name for the batch (e.g., "Keyword Research - Jan 10, 2025")';
COMMENT ON COLUMN keywords.batch_source IS 'Source of the batch: keyword_researcher_agent, manual, csv_import';
COMMENT ON COLUMN keywords.batch_date IS 'Date when this batch was created';
COMMENT ON COLUMN keywords.batch_starred IS 'Whether the entire batch is starred/favorited';
COMMENT ON COLUMN keywords.is_starred IS 'Whether this individual keyword is starred/favorited';
