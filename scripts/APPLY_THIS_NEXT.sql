-- ============================================
-- PERDIA V3 MIGRATION - PART 2
-- Add articles columns and seed data
-- Apply this in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: Add 12 new columns to articles table
-- ============================================

DO $$
BEGIN
  -- Article type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'type') THEN
    ALTER TABLE articles ADD COLUMN type TEXT CHECK (type IN ('ranking', 'career_guide', 'listicle', 'guide', 'faq'));
    RAISE NOTICE '✅ Added articles.type column';
  ELSE
    RAISE NOTICE '⏭️ articles.type column already exists';
  END IF;

  -- Editor score (quality rating)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'editor_score') THEN
    ALTER TABLE articles ADD COLUMN editor_score INTEGER CHECK (editor_score >= 0 AND editor_score <= 100);
    RAISE NOTICE '✅ Added articles.editor_score column';
  ELSE
    RAISE NOTICE '⏭️ articles.editor_score column already exists';
  END IF;

  -- Risk flags (issues identified)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'risk_flags') THEN
    ALTER TABLE articles ADD COLUMN risk_flags JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Added articles.risk_flags column';
  ELSE
    RAISE NOTICE '⏭️ articles.risk_flags column already exists';
  END IF;

  -- FAQs for schema markup
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'faqs') THEN
    ALTER TABLE articles ADD COLUMN faqs JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Added articles.faqs column';
  ELSE
    RAISE NOTICE '⏭️ articles.faqs column already exists';
  END IF;

  -- Schema markup (FAQ, HowTo, etc.)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'schema_markup') THEN
    ALTER TABLE articles ADD COLUMN schema_markup JSONB;
    RAISE NOTICE '✅ Added articles.schema_markup column';
  ELSE
    RAISE NOTICE '⏭️ articles.schema_markup column already exists';
  END IF;

  -- Schema validation status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'schema_valid') THEN
    ALTER TABLE articles ADD COLUMN schema_valid BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Added articles.schema_valid column';
  ELSE
    RAISE NOTICE '⏭️ articles.schema_valid column already exists';
  END IF;

  -- Shortcode validation status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'shortcode_valid') THEN
    ALTER TABLE articles ADD COLUMN shortcode_valid BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Added articles.shortcode_valid column';
  ELSE
    RAISE NOTICE '⏭️ articles.shortcode_valid column already exists';
  END IF;

  -- Internal links array
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'internal_links') THEN
    ALTER TABLE articles ADD COLUMN internal_links JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Added articles.internal_links column';
  ELSE
    RAISE NOTICE '⏭️ articles.internal_links column already exists';
  END IF;

  -- External links array
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'external_links') THEN
    ALTER TABLE articles ADD COLUMN external_links JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Added articles.external_links column';
  ELSE
    RAISE NOTICE '⏭️ articles.external_links column already exists';
  END IF;

  -- Images array
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'images') THEN
    ALTER TABLE articles ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Added articles.images column';
  ELSE
    RAISE NOTICE '⏭️ articles.images column already exists';
  END IF;

  -- Auto-publish timestamp (5-day SLA)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'auto_publish_at') THEN
    ALTER TABLE articles ADD COLUMN auto_publish_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Added articles.auto_publish_at column';
  ELSE
    RAISE NOTICE '⏭️ articles.auto_publish_at column already exists';
  END IF;

  -- Source idea reference
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'source_idea_id') THEN
    ALTER TABLE articles ADD COLUMN source_idea_id UUID;
    RAISE NOTICE '✅ Added articles.source_idea_id column';
  ELSE
    RAISE NOTICE '⏭️ articles.source_idea_id column already exists';
  END IF;
END $$;

-- ============================================
-- STEP 2: Create indexes for new articles columns
-- ============================================

CREATE INDEX IF NOT EXISTS idx_articles_type ON articles(type);
CREATE INDEX IF NOT EXISTS idx_articles_auto_publish_at ON articles(auto_publish_at);
CREATE INDEX IF NOT EXISTS idx_articles_source_idea_id ON articles(source_idea_id);

-- ============================================
-- STEP 3: Add foreign key constraint
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'articles_source_idea_id_fkey'
  ) THEN
    ALTER TABLE articles
    ADD CONSTRAINT articles_source_idea_id_fkey
    FOREIGN KEY (source_idea_id) REFERENCES content_ideas(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added FK: articles.source_idea_id -> content_ideas.id';
  ELSE
    RAISE NOTICE '⏭️ FK articles_source_idea_id_fkey already exists';
  END IF;
END $$;

-- ============================================
-- STEP 4: Seed default shortcodes
-- ============================================

DO $$
DECLARE
  default_user_id UUID;
  shortcode_count INT;
BEGIN
  -- Get first user from auth.users
  SELECT id INTO default_user_id FROM auth.users LIMIT 1;

  -- Check if shortcodes already exist
  SELECT COUNT(*) INTO shortcode_count FROM shortcodes;

  IF default_user_id IS NOT NULL AND shortcode_count = 0 THEN
    -- Monetization shortcodes
    INSERT INTO shortcodes (user_id, name, syntax, description, category, example, is_active)
    VALUES
      (default_user_id, 'Affiliate Link', '[ge_affiliate_link url="URL"]text[/ge_affiliate_link]',
       'Affiliate link with tracking for monetized recommendations', 'monetization',
       '[ge_affiliate_link url="https://partner.com/program"]Check out this program[/ge_affiliate_link]', true),

      (default_user_id, 'Sponsored Content', '[ge_sponsored]content[/ge_sponsored]',
       'Marks content as sponsored/paid placement', 'monetization',
       '[ge_sponsored]This program offers excellent value[/ge_sponsored]', true),

      (default_user_id, 'Product Link', '[ge_product id="ID"]',
       'Links to a specific product in the database', 'monetization',
       '[ge_product id="mba-online-123"]', true);

    -- Link shortcodes
    INSERT INTO shortcodes (user_id, name, syntax, description, category, example, is_active)
    VALUES
      (default_user_id, 'Internal Link', '[ge_internal_link url="URL"]text[/ge_internal_link]',
       'Internal link to other GetEducated.com pages', 'links',
       '[ge_internal_link url="/online-degrees/mba"]MBA programs[/ge_internal_link]', true),

      (default_user_id, 'External Link', '[ge_external_link url="URL"]text[/ge_external_link]',
       'External link with proper attributes (nofollow, target)', 'links',
       '[ge_external_link url="https://nces.ed.gov"]NCES data[/ge_external_link]', true),

      (default_user_id, 'Citation Link', '[ge_citation url="URL" source="SOURCE"]',
       'Citation with source attribution', 'links',
       '[ge_citation url="https://bls.gov/ooh" source="Bureau of Labor Statistics"]', true),

      (default_user_id, 'School Link', '[ge_school id="ID"]',
       'Links to a school profile page', 'links',
       '[ge_school id="university-phoenix"]', true);

    -- Media shortcodes
    INSERT INTO shortcodes (user_id, name, syntax, description, category, example, is_active)
    VALUES
      (default_user_id, 'Comparison Table', '[ge_comparison ids="ID1,ID2,ID3"]',
       'Renders a comparison table for programs/schools', 'media',
       '[ge_comparison ids="mba-1,mba-2,mba-3"]', true),

      (default_user_id, 'FAQ Schema', '[ge_faq question="Q"]answer[/ge_faq]',
       'FAQ with schema markup for SEO', 'media',
       '[ge_faq question="How long does an online MBA take?"]Typically 18-24 months[/ge_faq]', true),

      (default_user_id, 'Salary Data', '[ge_salary occupation="OCC" location="LOC"]',
       'Displays BLS salary data for occupation', 'media',
       '[ge_salary occupation="marketing-manager" location="national"]', true);

    RAISE NOTICE '✅ Inserted 10 default shortcodes for user: %', default_user_id;
  ELSIF default_user_id IS NULL THEN
    RAISE WARNING '❌ No users found in auth.users. Shortcodes not seeded.';
  ELSE
    RAISE NOTICE '⏭️ Shortcodes already exist (% rows). Skipping seed.', shortcode_count;
  END IF;
END $$;

-- ============================================
-- STEP 5: Seed system settings
-- ============================================

DO $$
DECLARE
  default_user_id UUID;
  settings_count INT;
BEGIN
  -- Get first user from auth.users
  SELECT id INTO default_user_id FROM auth.users LIMIT 1;

  -- Check if settings already exist
  SELECT COUNT(*) INTO settings_count FROM system_settings;

  IF default_user_id IS NOT NULL AND settings_count = 0 THEN
    -- Quality settings
    INSERT INTO system_settings (user_id, setting_key, setting_value, setting_type, description)
    VALUES
      (default_user_id, 'quality_rules', '{
        "content": {
          "min_word_count": 2000,
          "max_word_count": 4000,
          "min_headings": 5,
          "require_h2_structure": true,
          "require_intro_conclusion": true
        },
        "links": {
          "min_internal_links": 3,
          "max_internal_links": 10,
          "min_external_links": 2,
          "max_external_links": 8,
          "require_citation": true,
          "require_bls_citation": true
        },
        "seo": {
          "keyword_density_min": 0.5,
          "keyword_density_max": 2.5,
          "require_faq_schema": true,
          "require_meta_description": true,
          "enforce_shortcodes": true
        },
        "readability": {
          "target_score_min": 60,
          "target_score_max": 80,
          "max_paragraph_length": 150
        },
        "media": {
          "min_images": 1,
          "max_images": 5,
          "require_alt_text": true,
          "require_featured_image": true
        }
      }'::jsonb, 'quality', 'Quality checklist rules for article validation');

    -- Automation settings
    INSERT INTO system_settings (user_id, setting_key, setting_value, setting_type, description)
    VALUES
      (default_user_id, 'automation_config', '{
        "mode": "assisted",
        "auto_publish_days": 5,
        "auto_approve_enabled": false,
        "auto_approve_threshold": {
          "min_word_count": 1500,
          "has_keywords": true,
          "quality_score": 80,
          "shortcode_valid": true
        },
        "auto_generate_from_ideas": false,
        "max_daily_generations": 10,
        "working_hours_only": true,
        "working_hours": {
          "start": "09:00",
          "end": "17:00",
          "timezone": "America/New_York"
        }
      }'::jsonb, 'automation', 'Automation engine configuration');

    -- AI settings
    INSERT INTO system_settings (user_id, setting_key, setting_value, setting_type, description)
    VALUES
      (default_user_id, 'ai_config', '{
        "primary_model": "grok-2",
        "verification_model": "sonar-pro",
        "title_model": "claude-haiku-4-5-20251001",
        "image_model": "gemini-2.5-flash-image",
        "temperature": 0.7,
        "max_tokens": 8000,
        "add_internet_context": true,
        "require_citations": true,
        "target_audience": "Adult learners researching online education options",
        "brand_voice": "Professional, informative, encouraging, and data-driven"
      }'::jsonb, 'ai', 'AI model and generation configuration');

    -- Workflow settings
    INSERT INTO system_settings (user_id, setting_key, setting_value, setting_type, description)
    VALUES
      (default_user_id, 'workflow_config', '{
        "statuses": [
          {"id": "draft", "label": "Draft", "color": "gray"},
          {"id": "in_review", "label": "In Review", "color": "amber"},
          {"id": "needs_revision", "label": "Needs Revision", "color": "red"},
          {"id": "approved", "label": "Approved", "color": "blue"},
          {"id": "scheduled", "label": "Scheduled", "color": "purple"},
          {"id": "published", "label": "Published", "color": "emerald"}
        ],
        "require_review": true,
        "allow_self_approve": false,
        "notify_on_status_change": true,
        "default_reviewer": null
      }'::jsonb, 'workflow', 'Content workflow configuration');

    -- WordPress settings
    INSERT INTO system_settings (user_id, setting_key, setting_value, setting_type, description)
    VALUES
      (default_user_id, 'wordpress_config', '{
        "default_status": "draft",
        "default_category": null,
        "auto_set_featured_image": true,
        "transform_shortcodes": true,
        "add_schema_markup": true,
        "add_tracking_params": true
      }'::jsonb, 'general', 'WordPress publishing configuration');

    -- Content type configurations
    INSERT INTO system_settings (user_id, setting_key, setting_value, setting_type, description)
    VALUES
      (default_user_id, 'content_types', '{
        "ranking": {
          "label": "Ranking Article",
          "description": "Best X, Top Y lists with comparisons",
          "icon": "trophy",
          "default_word_count": 2500,
          "require_comparison_table": true,
          "require_bls_data": false
        },
        "career_guide": {
          "label": "Career Guide",
          "description": "Career paths, job outlooks, salary information",
          "icon": "briefcase",
          "default_word_count": 2000,
          "require_comparison_table": false,
          "require_bls_data": true
        },
        "listicle": {
          "label": "Listicle",
          "description": "Tips, strategies, actionable advice",
          "icon": "list",
          "default_word_count": 1800,
          "require_comparison_table": false,
          "require_bls_data": false
        },
        "guide": {
          "label": "Comprehensive Guide",
          "description": "In-depth educational content",
          "icon": "book",
          "default_word_count": 3000,
          "require_comparison_table": false,
          "require_bls_data": false
        },
        "faq": {
          "label": "FAQ Article",
          "description": "Question and answer format",
          "icon": "help-circle",
          "default_word_count": 1500,
          "require_comparison_table": false,
          "require_bls_data": false
        }
      }'::jsonb, 'general', 'Content type definitions and requirements');

    RAISE NOTICE '✅ Inserted 6 system settings for user: %', default_user_id;
  ELSIF default_user_id IS NULL THEN
    RAISE WARNING '❌ No users found in auth.users. System settings not seeded.';
  ELSE
    RAISE NOTICE '⏭️ System settings already exist (% rows). Skipping seed.', settings_count;
  END IF;
END $$;

-- ============================================
-- STEP 6: Verify migration
-- ============================================

SELECT '✅ MIGRATION VERIFICATION' AS status;

-- Check new articles columns
SELECT
  column_name,
  CASE WHEN column_name IN (
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'articles'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
  VALUES
    ('type'),
    ('editor_score'),
    ('risk_flags'),
    ('faqs'),
    ('schema_markup'),
    ('schema_valid'),
    ('shortcode_valid'),
    ('internal_links'),
    ('external_links'),
    ('images'),
    ('auto_publish_at'),
    ('source_idea_id')
) AS t(column_name)
ORDER BY column_name;

-- Check seed data
SELECT
  'shortcodes' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) >= 10 THEN '✅ SEEDED' ELSE '⚠️ EMPTY' END as status
FROM shortcodes
UNION ALL
SELECT
  'system_settings',
  COUNT(*),
  CASE WHEN COUNT(*) >= 6 THEN '✅ SEEDED' ELSE '⚠️ EMPTY' END
FROM system_settings;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

SELECT '🎉 V3 MIGRATION PART 2 COMPLETE!' AS message;
