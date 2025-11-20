-- ==============================================================
-- FIX: Add source_idea_id column to articles table
-- ==============================================================
-- This adds the missing source_idea_id column that's causing
-- PGRST204 errors when creating articles from content ideas
-- ==============================================================

-- 1. Add the source_idea_id column to articles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'source_idea_id'
  ) THEN
    ALTER TABLE articles ADD COLUMN source_idea_id UUID;
    RAISE NOTICE '✅ Added articles.source_idea_id column';
  ELSE
    RAISE NOTICE '⏭️  articles.source_idea_id column already exists';
  END IF;
END $$;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_articles_source_idea_id ON articles(source_idea_id);

-- 3. Add foreign key constraint to content_ideas table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'articles_source_idea_id_fkey'
  ) THEN
    ALTER TABLE articles
    ADD CONSTRAINT articles_source_idea_id_fkey
    FOREIGN KEY (source_idea_id) REFERENCES content_ideas(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added foreign key constraint';
  ELSE
    RAISE NOTICE '⏭️  Foreign key constraint already exists';
  END IF;
END $$;

-- ==============================================================
-- DONE!
-- The articles table now has source_idea_id column and can
-- track which content idea was used to create each article
-- ==============================================================
