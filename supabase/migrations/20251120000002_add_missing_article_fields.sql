-- ==============================================================
-- Migration: Add missing fields to articles table
-- Date: 2025-11-20
-- ==============================================================
-- Adds fields that Article.create() is trying to use but don't
-- exist in the schema, causing 400 errors
-- ==============================================================

-- 1. Add type column (article content type)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'type'
  ) THEN
    ALTER TABLE articles ADD COLUMN type TEXT;
    RAISE NOTICE '✅ Added articles.type column';
  ELSE
    RAISE NOTICE '⏭️  articles.type column already exists';
  END IF;
END $$;

-- 2. Add faqs column (JSON array of FAQs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'faqs'
  ) THEN
    ALTER TABLE articles ADD COLUMN faqs JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Added articles.faqs column';
  ELSE
    RAISE NOTICE '⏭️  articles.faqs column already exists';
  END IF;
END $$;

-- 3. Add internal_links column (count)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'internal_links'
  ) THEN
    ALTER TABLE articles ADD COLUMN internal_links INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Added articles.internal_links column';
  ELSE
    RAISE NOTICE '⏭️  articles.internal_links column already exists';
  END IF;
END $$;

-- 4. Add external_links column (count)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'external_links'
  ) THEN
    ALTER TABLE articles ADD COLUMN external_links INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Added articles.external_links column';
  ELSE
    RAISE NOTICE '⏭️  articles.external_links column already exists';
  END IF;
END $$;

-- 5. Add schema_valid column (JSON-LD schema validation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'schema_valid'
  ) THEN
    ALTER TABLE articles ADD COLUMN schema_valid BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Added articles.schema_valid column';
  ELSE
    RAISE NOTICE '⏭️  articles.schema_valid column already exists';
  END IF;
END $$;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_type ON articles(type);
CREATE INDEX IF NOT EXISTS idx_articles_schema_valid ON articles(schema_valid) WHERE schema_valid = true;

-- 7. Add comments
COMMENT ON COLUMN articles.type IS 'Content type: ranking, career_guide, listicle, guide, faq';
COMMENT ON COLUMN articles.faqs IS 'FAQ questions and answers in JSON format';
COMMENT ON COLUMN articles.internal_links IS 'Count of internal GetEducated.com links';
COMMENT ON COLUMN articles.external_links IS 'Count of external citation links';
COMMENT ON COLUMN articles.schema_valid IS 'Whether JSON-LD schema is valid';

-- ==============================================================
-- Migration complete!
-- The articles table now has all fields needed by Article.create()
-- ==============================================================
