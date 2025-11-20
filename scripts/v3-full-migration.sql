
-- ============================================
-- PERDIA V3 MIGRATION - STEP 1: CLUSTERS TABLE
-- ============================================

-- Clusters table - Topic grouping for content planning
CREATE TABLE IF NOT EXISTS clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parent_cluster_id UUID REFERENCES clusters(id) ON DELETE SET NULL,
  keywords JSONB DEFAULT '[]'::jsonb,
  article_count INTEGER DEFAULT 0,
  keyword_count INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;

-- Create policies (drop first if exists)
DROP POLICY IF EXISTS "Users can view own clusters" ON clusters;
CREATE POLICY "Users can view own clusters" ON clusters
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own clusters" ON clusters;
CREATE POLICY "Users can create own clusters" ON clusters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own clusters" ON clusters;
CREATE POLICY "Users can update own clusters" ON clusters
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own clusters" ON clusters;
CREATE POLICY "Users can delete own clusters" ON clusters
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clusters_user_id ON clusters(user_id);
CREATE INDEX IF NOT EXISTS idx_clusters_status ON clusters(status);
CREATE INDEX IF NOT EXISTS idx_clusters_priority ON clusters(priority DESC);
CREATE INDEX IF NOT EXISTS idx_clusters_parent ON clusters(parent_cluster_id);

-- Create trigger for updated_date
CREATE OR REPLACE FUNCTION update_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clusters_updated_date ON clusters;
CREATE TRIGGER update_clusters_updated_date
  BEFORE UPDATE ON clusters
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();


-- ============================================
-- PERDIA V3 MIGRATION - STEP 2: V3 SCHEMA
-- ============================================
-- Perdia v3 Schema Updates
-- Adds tables and fields to match Base44 v3 export functionality
-- Created: 2025-11-19

-- ============================================
-- 1. CREATE NEW TABLES
-- ============================================

-- Shortcodes table - GetEducated.com shortcode system
CREATE TABLE IF NOT EXISTS shortcodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  syntax TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('monetization', 'links', 'media', 'other')),
  example TEXT,
  is_active BOOLEAN DEFAULT true,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Training data table - AI learning from editorial feedback
CREATE TABLE IF NOT EXISTS training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  article_title TEXT,
  content_type TEXT,
  pattern_type TEXT CHECK (pattern_type IN (
    'tone_adjustment', 'structure_improvement', 'seo_optimization',
    'compliance_fix', 'style_change', 'accuracy_correction', 'other'
  )),
  lesson_learned TEXT,
  feedback_items JSONB DEFAULT '[]'::jsonb,
  impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 10),
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'applied', 'rejected')),
  applied_to_system BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Site articles table - Existing GetEducated articles for internal linking context
CREATE TABLE IF NOT EXISTS site_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT,
  word_count INTEGER,
  last_verified TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Content ideas table - Topic/idea queue for generation
CREATE TABLE IF NOT EXISTS content_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  source TEXT CHECK (source IN ('keyword', 'cluster', 'trending', 'manual', 'ai_suggested')),
  keywords JSONB DEFAULT '[]'::jsonb,
  content_type TEXT CHECK (content_type IN ('ranking', 'career_guide', 'listicle', 'guide', 'faq')),
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'rejected')),
  trending_score REAL,
  notes TEXT,
  cluster_id UUID REFERENCES clusters(id) ON DELETE SET NULL,
  article_id UUID,  -- Will reference articles(id) after article is created
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- System settings table - App-wide configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB,
  setting_type TEXT CHECK (setting_type IN ('automation', 'quality', 'ai', 'workflow', 'general')),
  description TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, setting_key)
);

-- ============================================
-- 2. EXTEND ARTICLES TABLE
-- ============================================

-- Add new columns to articles table for v3 compatibility
DO $$
BEGIN
  -- Article type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'type') THEN
    ALTER TABLE articles ADD COLUMN type TEXT CHECK (type IN ('ranking', 'career_guide', 'listicle', 'guide', 'faq'));
  END IF;

  -- Editor score (quality rating)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'editor_score') THEN
    ALTER TABLE articles ADD COLUMN editor_score INTEGER CHECK (editor_score >= 0 AND editor_score <= 100);
  END IF;

  -- Risk flags (issues identified)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'risk_flags') THEN
    ALTER TABLE articles ADD COLUMN risk_flags JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- FAQs for schema markup
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'faqs') THEN
    ALTER TABLE articles ADD COLUMN faqs JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Schema markup (FAQ, HowTo, etc.)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'schema_markup') THEN
    ALTER TABLE articles ADD COLUMN schema_markup JSONB;
  END IF;

  -- Schema validation status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'schema_valid') THEN
    ALTER TABLE articles ADD COLUMN schema_valid BOOLEAN DEFAULT false;
  END IF;

  -- Shortcode validation status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'shortcode_valid') THEN
    ALTER TABLE articles ADD COLUMN shortcode_valid BOOLEAN DEFAULT false;
  END IF;

  -- Internal links array
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'internal_links') THEN
    ALTER TABLE articles ADD COLUMN internal_links JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- External links array
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'external_links') THEN
    ALTER TABLE articles ADD COLUMN external_links JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Images array
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'images') THEN
    ALTER TABLE articles ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Auto-publish timestamp
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'auto_publish_at') THEN
    ALTER TABLE articles ADD COLUMN auto_publish_at TIMESTAMPTZ;
  END IF;

  -- Source idea reference
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'source_idea_id') THEN
    ALTER TABLE articles ADD COLUMN source_idea_id UUID;
  END IF;
END $$;

-- ============================================
-- 3. ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE shortcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Shortcodes policies
CREATE POLICY "Users can view own shortcodes" ON shortcodes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own shortcodes" ON shortcodes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shortcodes" ON shortcodes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shortcodes" ON shortcodes
  FOR DELETE USING (auth.uid() = user_id);

-- Training data policies
CREATE POLICY "Users can view own training_data" ON training_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own training_data" ON training_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training_data" ON training_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own training_data" ON training_data
  FOR DELETE USING (auth.uid() = user_id);

-- Site articles policies
CREATE POLICY "Users can view own site_articles" ON site_articles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own site_articles" ON site_articles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own site_articles" ON site_articles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own site_articles" ON site_articles
  FOR DELETE USING (auth.uid() = user_id);

-- Content ideas policies
CREATE POLICY "Users can view own content_ideas" ON content_ideas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own content_ideas" ON content_ideas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content_ideas" ON content_ideas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own content_ideas" ON content_ideas
  FOR DELETE USING (auth.uid() = user_id);

-- System settings policies
CREATE POLICY "Users can view own system_settings" ON system_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own system_settings" ON system_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own system_settings" ON system_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own system_settings" ON system_settings
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 5. CREATE INDEXES
-- ============================================

-- Shortcodes indexes
CREATE INDEX IF NOT EXISTS idx_shortcodes_user_id ON shortcodes(user_id);
CREATE INDEX IF NOT EXISTS idx_shortcodes_category ON shortcodes(category);
CREATE INDEX IF NOT EXISTS idx_shortcodes_is_active ON shortcodes(is_active);

-- Training data indexes
CREATE INDEX IF NOT EXISTS idx_training_data_user_id ON training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_training_data_article_id ON training_data(article_id);
CREATE INDEX IF NOT EXISTS idx_training_data_status ON training_data(status);
CREATE INDEX IF NOT EXISTS idx_training_data_pattern_type ON training_data(pattern_type);

-- Site articles indexes
CREATE INDEX IF NOT EXISTS idx_site_articles_user_id ON site_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_site_articles_category ON site_articles(category);
CREATE INDEX IF NOT EXISTS idx_site_articles_is_active ON site_articles(is_active);

-- Content ideas indexes
CREATE INDEX IF NOT EXISTS idx_content_ideas_user_id ON content_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_content_ideas_status ON content_ideas(status);
CREATE INDEX IF NOT EXISTS idx_content_ideas_source ON content_ideas(source);
CREATE INDEX IF NOT EXISTS idx_content_ideas_priority ON content_ideas(priority DESC);
CREATE INDEX IF NOT EXISTS idx_content_ideas_cluster_id ON content_ideas(cluster_id);

-- System settings indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_user_id ON system_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_setting_type ON system_settings(setting_type);

-- Articles new column indexes
CREATE INDEX IF NOT EXISTS idx_articles_type ON articles(type);
CREATE INDEX IF NOT EXISTS idx_articles_auto_publish_at ON articles(auto_publish_at);
CREATE INDEX IF NOT EXISTS idx_articles_source_idea_id ON articles(source_idea_id);

-- ============================================
-- 6. CREATE UPDATED_DATE TRIGGERS
-- ============================================

-- Function to update updated_date (if not exists)
CREATE OR REPLACE FUNCTION update_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for new tables
DROP TRIGGER IF EXISTS update_shortcodes_updated_date ON shortcodes;
CREATE TRIGGER update_shortcodes_updated_date
  BEFORE UPDATE ON shortcodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

DROP TRIGGER IF EXISTS update_training_data_updated_date ON training_data;
CREATE TRIGGER update_training_data_updated_date
  BEFORE UPDATE ON training_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

DROP TRIGGER IF EXISTS update_site_articles_updated_date ON site_articles;
CREATE TRIGGER update_site_articles_updated_date
  BEFORE UPDATE ON site_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

DROP TRIGGER IF EXISTS update_content_ideas_updated_date ON content_ideas;
CREATE TRIGGER update_content_ideas_updated_date
  BEFORE UPDATE ON content_ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

DROP TRIGGER IF EXISTS update_system_settings_updated_date ON system_settings;
CREATE TRIGGER update_system_settings_updated_date
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

-- ============================================
-- 7. ADD FOREIGN KEY FOR CONTENT IDEAS -> ARTICLES
-- ============================================

-- Add FK constraint after both tables exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'content_ideas_article_id_fkey'
  ) THEN
    ALTER TABLE content_ideas
    ADD CONSTRAINT content_ideas_article_id_fkey
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add FK for articles.source_idea_id -> content_ideas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'articles_source_idea_id_fkey'
  ) THEN
    ALTER TABLE articles
    ADD CONSTRAINT articles_source_idea_id_fkey
    FOREIGN KEY (source_idea_id) REFERENCES content_ideas(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

COMMENT ON TABLE shortcodes IS 'GetEducated.com shortcode definitions for content compliance';
COMMENT ON TABLE training_data IS 'AI learning data from editorial feedback';
COMMENT ON TABLE site_articles IS 'Existing GetEducated articles for internal linking context';
COMMENT ON TABLE content_ideas IS 'Topic and idea queue for article generation';
COMMENT ON TABLE system_settings IS 'App-wide configuration settings';


-- ============================================
-- PERDIA V3 MIGRATION - STEP 3: SEED FUNCTIONS
-- ============================================
-- Perdia v3 Seed Data
-- Default shortcodes and system settings for GetEducated.com
-- Created: 2025-11-19

-- ============================================
-- NOTE: This seed data requires a user_id
-- Run this after user creation or modify to use a specific user
-- For now, we'll create a function that can be called with a user_id
-- ============================================

-- Function to seed default shortcodes for a user
CREATE OR REPLACE FUNCTION seed_default_shortcodes(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Monetization shortcodes
  INSERT INTO shortcodes (user_id, name, syntax, description, category, example, is_active)
  VALUES
    (p_user_id, 'Affiliate Link', '[ge_affiliate_link url="URL"]text[/ge_affiliate_link]',
     'Affiliate link with tracking for monetized recommendations', 'monetization',
     '[ge_affiliate_link url="https://partner.com/program"]Check out this program[/ge_affiliate_link]', true),

    (p_user_id, 'Sponsored Content', '[ge_sponsored]content[/ge_sponsored]',
     'Marks content as sponsored/paid placement', 'monetization',
     '[ge_sponsored]This program offers excellent value[/ge_sponsored]', true),

    (p_user_id, 'Product Link', '[ge_product id="ID"]',
     'Links to a specific product in the database', 'monetization',
     '[ge_product id="mba-online-123"]', true)
  ON CONFLICT DO NOTHING;

  -- Link shortcodes
  INSERT INTO shortcodes (user_id, name, syntax, description, category, example, is_active)
  VALUES
    (p_user_id, 'Internal Link', '[ge_internal_link url="URL"]text[/ge_internal_link]',
     'Internal link to other GetEducated.com pages', 'links',
     '[ge_internal_link url="/online-degrees/mba"]MBA programs[/ge_internal_link]', true),

    (p_user_id, 'External Link', '[ge_external_link url="URL"]text[/ge_external_link]',
     'External link with proper attributes (nofollow, target)', 'links',
     '[ge_external_link url="https://nces.ed.gov"]NCES data[/ge_external_link]', true),

    (p_user_id, 'Citation Link', '[ge_citation url="URL" source="SOURCE"]',
     'Citation with source attribution', 'links',
     '[ge_citation url="https://bls.gov/ooh" source="Bureau of Labor Statistics"]', true),

    (p_user_id, 'School Link', '[ge_school id="ID"]',
     'Links to a school profile page', 'links',
     '[ge_school id="university-phoenix"]', true)
  ON CONFLICT DO NOTHING;

  -- Media shortcodes
  INSERT INTO shortcodes (user_id, name, syntax, description, category, example, is_active)
  VALUES
    (p_user_id, 'Comparison Table', '[ge_comparison ids="ID1,ID2,ID3"]',
     'Renders a comparison table for programs/schools', 'media',
     '[ge_comparison ids="mba-1,mba-2,mba-3"]', true),

    (p_user_id, 'FAQ Schema', '[ge_faq question="Q"]answer[/ge_faq]',
     'FAQ with schema markup for SEO', 'media',
     '[ge_faq question="How long does an online MBA take?"]Typically 18-24 months[/ge_faq]', true),

    (p_user_id, 'Salary Data', '[ge_salary occupation="OCC" location="LOC"]',
     'Displays BLS salary data for occupation', 'media',
     '[ge_salary occupation="marketing-manager" location="national"]', true)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to seed default system settings for a user
CREATE OR REPLACE FUNCTION seed_default_system_settings(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Quality settings
  INSERT INTO system_settings (user_id, setting_key, setting_value, setting_type, description)
  VALUES
    (p_user_id, 'quality_rules', '{
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
    }'::jsonb, 'quality', 'Quality checklist rules for article validation')
  ON CONFLICT (user_id, setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

  -- Automation settings
  INSERT INTO system_settings (user_id, setting_key, setting_value, setting_type, description)
  VALUES
    (p_user_id, 'automation_config', '{
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
    }'::jsonb, 'automation', 'Automation engine configuration')
  ON CONFLICT (user_id, setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

  -- AI settings
  INSERT INTO system_settings (user_id, setting_key, setting_value, setting_type, description)
  VALUES
    (p_user_id, 'ai_config', '{
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
    }'::jsonb, 'ai', 'AI model and generation configuration')
  ON CONFLICT (user_id, setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

  -- Workflow settings
  INSERT INTO system_settings (user_id, setting_key, setting_value, setting_type, description)
  VALUES
    (p_user_id, 'workflow_config', '{
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
    }'::jsonb, 'workflow', 'Content workflow configuration')
  ON CONFLICT (user_id, setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

  -- WordPress settings
  INSERT INTO system_settings (user_id, setting_key, setting_value, setting_type, description)
  VALUES
    (p_user_id, 'wordpress_config', '{
      "default_status": "draft",
      "default_category": null,
      "auto_set_featured_image": true,
      "transform_shortcodes": true,
      "add_schema_markup": true,
      "add_tracking_params": true
    }'::jsonb, 'general', 'WordPress publishing configuration')
  ON CONFLICT (user_id, setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

  -- Content type configurations
  INSERT INTO system_settings (user_id, setting_key, setting_value, setting_type, description)
  VALUES
    (p_user_id, 'content_types', '{
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
    }'::jsonb, 'general', 'Content type definitions and requirements')
  ON CONFLICT (user_id, setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- USAGE INSTRUCTIONS
-- ============================================

-- To seed data for a specific user, run:
-- SELECT seed_default_shortcodes('user-uuid-here');
-- SELECT seed_default_system_settings('user-uuid-here');

-- Or create a trigger to auto-seed on user creation:

CREATE OR REPLACE FUNCTION auto_seed_user_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Seed shortcodes
  PERFORM seed_default_shortcodes(NEW.id);
  -- Seed system settings
  PERFORM seed_default_system_settings(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: This trigger should be created on auth.users table
-- which requires superuser access. For Supabase, you may need to
-- create this via the Supabase dashboard SQL editor:
--
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION auto_seed_user_defaults();

COMMENT ON FUNCTION seed_default_shortcodes IS 'Seeds default GetEducated.com shortcodes for a user';
COMMENT ON FUNCTION seed_default_system_settings IS 'Seeds default system settings for a user';
COMMENT ON FUNCTION auto_seed_user_defaults IS 'Automatically seeds defaults when a new user is created';

