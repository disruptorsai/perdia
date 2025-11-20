-- ============================================
-- PERDIA V3 COMPLETE FIX MIGRATION
-- Apply this entire file in Supabase SQL Editor
-- ============================================

-- Current Status:
-- ✅ training_data - EXISTS (has user_id)
-- ✅ system_settings - EXISTS (missing user_id - will fix)
-- ❌ clusters - NOT FOUND (will create)
-- ❌ shortcodes - NOT FOUND (will create)
-- ❌ site_articles - NOT FOUND (will create)
-- ❌ content_ideas - NOT FOUND (will create)

-- ============================================
-- STEP 1: Backup existing data
-- ============================================

-- Backup system_settings (has 2 rows but missing user_id)
CREATE TEMP TABLE IF NOT EXISTS system_settings_backup AS
SELECT * FROM system_settings;

-- ============================================
-- STEP 2: Drop broken tables
-- ============================================

DROP TABLE IF EXISTS content_ideas CASCADE;
DROP TABLE IF EXISTS site_articles CASCADE;
DROP TABLE IF EXISTS shortcodes CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS clusters CASCADE;

-- ============================================
-- STEP 3: Create clusters table FIRST (dependency)
-- ============================================

CREATE TABLE clusters (
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

ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clusters" ON clusters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own clusters" ON clusters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clusters" ON clusters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clusters" ON clusters FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_clusters_user_id ON clusters(user_id);
CREATE INDEX idx_clusters_status ON clusters(status);
CREATE INDEX idx_clusters_priority ON clusters(priority DESC);
CREATE INDEX idx_clusters_parent ON clusters(parent_cluster_id);

-- ============================================
-- STEP 4: Create other V3 tables
-- ============================================

-- Shortcodes table
CREATE TABLE shortcodes (
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

-- Site articles table
CREATE TABLE site_articles (
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

-- Content ideas table (references clusters)
CREATE TABLE content_ideas (
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
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB,
  setting_type TEXT CHECK (setting_type IN ('automation', 'quality', 'ai', 'workflow', 'general')),
  description TEXT,
  editable_by TEXT CHECK (editable_by IN ('system', 'admin', 'user')),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, setting_key)
);

-- ============================================
-- STEP 5: Enable RLS on all tables
-- ============================================

ALTER TABLE shortcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: Create RLS policies
-- ============================================

-- Shortcodes
CREATE POLICY "Users can view own shortcodes" ON shortcodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own shortcodes" ON shortcodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shortcodes" ON shortcodes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shortcodes" ON shortcodes FOR DELETE USING (auth.uid() = user_id);

-- Site articles
CREATE POLICY "Users can view own site_articles" ON site_articles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own site_articles" ON site_articles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own site_articles" ON site_articles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own site_articles" ON site_articles FOR DELETE USING (auth.uid() = user_id);

-- Content ideas
CREATE POLICY "Users can view own content_ideas" ON content_ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own content_ideas" ON content_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own content_ideas" ON content_ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own content_ideas" ON content_ideas FOR DELETE USING (auth.uid() = user_id);

-- System settings
CREATE POLICY "Users can view own system_settings" ON system_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own system_settings" ON system_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own system_settings" ON system_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own system_settings" ON system_settings FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- STEP 7: Create indexes
-- ============================================

-- Shortcodes
CREATE INDEX idx_shortcodes_user_id ON shortcodes(user_id);
CREATE INDEX idx_shortcodes_category ON shortcodes(category);
CREATE INDEX idx_shortcodes_is_active ON shortcodes(is_active);

-- Site articles
CREATE INDEX idx_site_articles_user_id ON site_articles(user_id);
CREATE INDEX idx_site_articles_category ON site_articles(category);
CREATE INDEX idx_site_articles_is_active ON site_articles(is_active);

-- Content ideas
CREATE INDEX idx_content_ideas_user_id ON content_ideas(user_id);
CREATE INDEX idx_content_ideas_status ON content_ideas(status);
CREATE INDEX idx_content_ideas_source ON content_ideas(source);
CREATE INDEX idx_content_ideas_priority ON content_ideas(priority DESC);
CREATE INDEX idx_content_ideas_cluster_id ON content_ideas(cluster_id);

-- System settings
CREATE INDEX idx_system_settings_user_id ON system_settings(user_id);
CREATE INDEX idx_system_settings_setting_type ON system_settings(setting_type);

-- ============================================
-- STEP 8: Create triggers
-- ============================================

-- Ensure update_updated_date function exists
CREATE OR REPLACE FUNCTION update_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_clusters_updated_date
  BEFORE UPDATE ON clusters
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER update_shortcodes_updated_date
  BEFORE UPDATE ON shortcodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER update_site_articles_updated_date
  BEFORE UPDATE ON site_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER update_content_ideas_updated_date
  BEFORE UPDATE ON content_ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER update_system_settings_updated_date
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

-- ============================================
-- STEP 9: Add foreign keys
-- ============================================

ALTER TABLE content_ideas
ADD CONSTRAINT content_ideas_article_id_fkey
FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL;

-- ============================================
-- STEP 10: Restore system_settings data
-- ============================================

DO $$
DECLARE
  default_user_id UUID;
  backup_count INT;
BEGIN
  -- Get first user from auth.users
  SELECT id INTO default_user_id FROM auth.users LIMIT 1;

  -- Check if we have backup data
  SELECT COUNT(*) INTO backup_count FROM system_settings_backup;

  -- Only restore if we have data and a user
  IF default_user_id IS NOT NULL AND backup_count > 0 THEN
    -- Restore with proper type casting for JSONB
    INSERT INTO system_settings (
      setting_key,
      setting_value,
      setting_type,
      description,
      editable_by,
      user_id
    )
    SELECT
      setting_key,
      -- Cast to JSONB if it's TEXT, otherwise use as-is
      CASE
        WHEN pg_typeof(setting_value) = 'text'::regtype THEN setting_value::jsonb
        ELSE setting_value
      END,
      setting_type,
      description,
      editable_by,
      default_user_id
    FROM system_settings_backup;

    RAISE NOTICE 'Restored % rows to system_settings with user_id=%',
      backup_count, default_user_id;
  ELSIF default_user_id IS NULL THEN
    RAISE WARNING 'No users found in auth.users. System settings not restored.';
  ELSE
    RAISE NOTICE 'No backup data found. System settings not restored.';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to restore system_settings: %. Skipping restore.', SQLERRM;
END $$;

-- ============================================
-- STEP 11: Add table comments
-- ============================================

COMMENT ON TABLE clusters IS 'Topic clusters for content planning and organization';
COMMENT ON TABLE shortcodes IS 'GetEducated.com shortcode definitions for content compliance';
COMMENT ON TABLE site_articles IS 'Existing GetEducated articles for internal linking context';
COMMENT ON TABLE content_ideas IS 'Topic and idea queue for article generation';
COMMENT ON TABLE system_settings IS 'App-wide configuration settings';

-- ============================================
-- STEP 12: Verify migration
-- ============================================

SELECT
  table_name,
  CASE WHEN table_name IN (
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
  VALUES
    ('clusters'),
    ('shortcodes'),
    ('site_articles'),
    ('content_ideas'),
    ('system_settings'),
    ('training_data')
) AS t(table_name)
ORDER BY table_name;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
