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
