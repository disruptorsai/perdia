-- ============================================
-- PERDIA V3 MIGRATION - CORRECTED VERSION
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: Create clusters table (dependency)
-- ============================================

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

-- Enable RLS on clusters
ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clusters
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

-- Create indexes for clusters
CREATE INDEX IF NOT EXISTS idx_clusters_user_id ON clusters(user_id);
CREATE INDEX IF NOT EXISTS idx_clusters_status ON clusters(status);
CREATE INDEX IF NOT EXISTS idx_clusters_priority ON clusters(priority DESC);
CREATE INDEX IF NOT EXISTS idx_clusters_parent ON clusters(parent_cluster_id);

-- ============================================
-- STEP 2: Create V3 tables
-- ============================================

-- Shortcodes table
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

-- Training data table
CREATE TABLE IF NOT EXISTS training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID,
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

-- Site articles table
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

-- Content ideas table
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
  article_id UUID,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- System settings table
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
-- STEP 3: Enable RLS on new tables
-- ============================================

ALTER TABLE shortcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create RLS policies
-- ============================================

-- Shortcodes policies
DROP POLICY IF EXISTS "Users can view own shortcodes" ON shortcodes;
CREATE POLICY "Users can view own shortcodes" ON shortcodes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own shortcodes" ON shortcodes;
CREATE POLICY "Users can create own shortcodes" ON shortcodes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own shortcodes" ON shortcodes;
CREATE POLICY "Users can update own shortcodes" ON shortcodes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own shortcodes" ON shortcodes;
CREATE POLICY "Users can delete own shortcodes" ON shortcodes
  FOR DELETE USING (auth.uid() = user_id);

-- Training data policies
DROP POLICY IF EXISTS "Users can view own training_data" ON training_data;
CREATE POLICY "Users can view own training_data" ON training_data
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own training_data" ON training_data;
CREATE POLICY "Users can create own training_data" ON training_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own training_data" ON training_data;
CREATE POLICY "Users can update own training_data" ON training_data
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own training_data" ON training_data;
CREATE POLICY "Users can delete own training_data" ON training_data
  FOR DELETE USING (auth.uid() = user_id);

-- Site articles policies
DROP POLICY IF EXISTS "Users can view own site_articles" ON site_articles;
CREATE POLICY "Users can view own site_articles" ON site_articles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own site_articles" ON site_articles;
CREATE POLICY "Users can create own site_articles" ON site_articles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own site_articles" ON site_articles;
CREATE POLICY "Users can update own site_articles" ON site_articles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own site_articles" ON site_articles;
CREATE POLICY "Users can delete own site_articles" ON site_articles
  FOR DELETE USING (auth.uid() = user_id);

-- Content ideas policies
DROP POLICY IF EXISTS "Users can view own content_ideas" ON content_ideas;
CREATE POLICY "Users can view own content_ideas" ON content_ideas
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own content_ideas" ON content_ideas;
CREATE POLICY "Users can create own content_ideas" ON content_ideas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own content_ideas" ON content_ideas;
CREATE POLICY "Users can update own content_ideas" ON content_ideas
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own content_ideas" ON content_ideas;
CREATE POLICY "Users can delete own content_ideas" ON content_ideas
  FOR DELETE USING (auth.uid() = user_id);

-- System settings policies
DROP POLICY IF EXISTS "Users can view own system_settings" ON system_settings;
CREATE POLICY "Users can view own system_settings" ON system_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own system_settings" ON system_settings;
CREATE POLICY "Users can create own system_settings" ON system_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own system_settings" ON system_settings;
CREATE POLICY "Users can update own system_settings" ON system_settings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own system_settings" ON system_settings;
CREATE POLICY "Users can delete own system_settings" ON system_settings
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- STEP 5: Create indexes
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

-- ============================================
-- STEP 6: Create triggers
-- ============================================

-- Function to update updated_date (create if not exists)
CREATE OR REPLACE FUNCTION update_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for new tables
DROP TRIGGER IF EXISTS update_clusters_updated_date ON clusters;
CREATE TRIGGER update_clusters_updated_date
  BEFORE UPDATE ON clusters
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

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
-- MIGRATION COMPLETE
-- ============================================

-- Verify tables were created
SELECT
  'clusters' as table_name,
  COUNT(*) as exists
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'clusters'
UNION ALL
SELECT 'shortcodes', COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shortcodes'
UNION ALL
SELECT 'training_data', COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'training_data'
UNION ALL
SELECT 'site_articles', COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_articles'
UNION ALL
SELECT 'content_ideas', COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'content_ideas'
UNION ALL
SELECT 'system_settings', COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_settings';
