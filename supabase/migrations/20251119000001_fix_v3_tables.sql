-- Fix V3 Tables Migration - Add Missing user_id Columns
-- This fixes the partially created tables from 20251119000001
-- Created: 2025-11-19

-- ============================================
-- 1. BACKUP EXISTING DATA
-- ============================================

-- Store system_settings data temporarily
CREATE TEMP TABLE system_settings_backup AS
SELECT * FROM system_settings;

-- ============================================
-- 2. DROP AND RECREATE PROBLEMATIC TABLES
-- ============================================

-- Drop tables with missing user_id column (and their policies/triggers)
DROP TABLE IF EXISTS shortcodes CASCADE;
DROP TABLE IF EXISTS site_articles CASCADE;
DROP TABLE IF EXISTS content_ideas CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;

-- ============================================
-- 3. RECREATE TABLES WITH CORRECT SCHEMA
-- ============================================

-- Shortcodes table - GetEducated.com shortcode system
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

-- Site articles table - Existing GetEducated articles for internal linking context
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

-- Content ideas table - Topic/idea queue for generation
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
  article_id UUID,  -- Will reference articles(id) after article is created
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- System settings table - App-wide configuration
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
-- 4. ENABLE RLS ON RECREATED TABLES
-- ============================================

ALTER TABLE shortcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE RLS POLICIES
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
-- 6. CREATE INDEXES
-- ============================================

-- Shortcodes indexes
CREATE INDEX idx_shortcodes_user_id ON shortcodes(user_id);
CREATE INDEX idx_shortcodes_category ON shortcodes(category);
CREATE INDEX idx_shortcodes_is_active ON shortcodes(is_active);

-- Site articles indexes
CREATE INDEX idx_site_articles_user_id ON site_articles(user_id);
CREATE INDEX idx_site_articles_category ON site_articles(category);
CREATE INDEX idx_site_articles_is_active ON site_articles(is_active);

-- Content ideas indexes
CREATE INDEX idx_content_ideas_user_id ON content_ideas(user_id);
CREATE INDEX idx_content_ideas_status ON content_ideas(status);
CREATE INDEX idx_content_ideas_source ON content_ideas(source);
CREATE INDEX idx_content_ideas_priority ON content_ideas(priority DESC);
CREATE INDEX idx_content_ideas_cluster_id ON content_ideas(cluster_id);

-- System settings indexes
CREATE INDEX idx_system_settings_user_id ON system_settings(user_id);
CREATE INDEX idx_system_settings_setting_type ON system_settings(setting_type);

-- ============================================
-- 7. CREATE UPDATED_DATE TRIGGERS
-- ============================================

-- Triggers for recreated tables
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
-- 8. RESTORE DATA WITH DEFAULT USER_ID
-- ============================================

-- Get the first user ID from auth.users (or use a specific user)
-- Note: You may need to manually set the correct user_id for system_settings
DO $$
DECLARE
  default_user_id UUID;
BEGIN
  -- Get first user from auth.users
  SELECT id INTO default_user_id FROM auth.users LIMIT 1;

  -- Only restore if we found a user
  IF default_user_id IS NOT NULL THEN
    -- Restore system_settings with user_id
    INSERT INTO system_settings (
      id, user_id, setting_key, setting_value, setting_type,
      description, editable_by, created_date, updated_date
    )
    SELECT
      id,
      default_user_id,  -- Use first user's ID
      setting_key,
      setting_value,
      setting_type,
      description,
      editable_by,
      created_date,
      updated_date
    FROM system_settings_backup;

    RAISE NOTICE 'Restored % rows to system_settings with user_id=%',
      (SELECT COUNT(*) FROM system_settings_backup), default_user_id;
  ELSE
    RAISE WARNING 'No users found in auth.users. System settings not restored.';
  END IF;
END $$;

-- ============================================
-- 9. ADD FOREIGN KEY CONSTRAINTS
-- ============================================

-- Add FK constraint for content_ideas -> articles
ALTER TABLE content_ideas
ADD CONSTRAINT content_ideas_article_id_fkey
FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL;

-- ============================================
-- 10. ADD TABLE COMMENTS
-- ============================================

COMMENT ON TABLE shortcodes IS 'GetEducated.com shortcode definitions for content compliance';
COMMENT ON TABLE site_articles IS 'Existing GetEducated articles for internal linking context';
COMMENT ON TABLE content_ideas IS 'Topic and idea queue for article generation';
COMMENT ON TABLE system_settings IS 'App-wide configuration settings';

-- ============================================
-- FIX COMPLETE
-- ============================================
