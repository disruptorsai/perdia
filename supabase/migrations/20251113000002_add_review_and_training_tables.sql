-- ============================================================================
-- MIGRATION: Add Article Review and AI Training Tables
-- Date: 2025-11-13
-- Purpose: Enable article review with comments and AI training feedback loop
-- ============================================================================

-- ============================================================================
-- TABLE: article_revisions
-- Purpose: Store editorial comments and feedback on articles
-- ============================================================================
CREATE TABLE IF NOT EXISTS article_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES content_queue(id) ON DELETE CASCADE,
  revision_type TEXT NOT NULL CHECK(revision_type IN ('comment', 'revision_request', 'approval', 'rejection')),
  selected_text TEXT,
  comment TEXT,
  section TEXT,
  position INTEGER,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'addressed', 'ignored')),
  reviewer_email TEXT,
  severity TEXT CHECK(severity IN ('minor', 'moderate', 'major', 'critical')),
  category TEXT CHECK(category IN ('accuracy', 'tone', 'structure', 'seo', 'compliance', 'grammar', 'style', 'formatting')),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Comments
COMMENT ON TABLE article_revisions IS 'Editorial comments and feedback on articles';
COMMENT ON COLUMN article_revisions.revision_type IS 'Type of revision: comment, revision_request, approval, or rejection';
COMMENT ON COLUMN article_revisions.selected_text IS 'Text that was highlighted when comment was made';
COMMENT ON COLUMN article_revisions.comment IS 'Editorial feedback or comment';
COMMENT ON COLUMN article_revisions.status IS 'Status of revision: pending, addressed, or ignored';
COMMENT ON COLUMN article_revisions.severity IS 'Severity level: minor, moderate, major, or critical';
COMMENT ON COLUMN article_revisions.category IS 'Feedback category: accuracy, tone, structure, seo, compliance, grammar, style, or formatting';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_article_revisions_article_id ON article_revisions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_revisions_status ON article_revisions(status);
CREATE INDEX IF NOT EXISTS idx_article_revisions_created_date ON article_revisions(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_article_revisions_user_id ON article_revisions(user_id);
CREATE INDEX IF NOT EXISTS idx_article_revisions_category ON article_revisions(category);
CREATE INDEX IF NOT EXISTS idx_article_revisions_severity ON article_revisions(severity);

-- RLS Policies
ALTER TABLE article_revisions ENABLE ROW LEVEL SECURITY;

-- Users can view their own revisions
CREATE POLICY "Users can view their own revisions"
  ON article_revisions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create revisions
CREATE POLICY "Users can create revisions"
  ON article_revisions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own revisions
CREATE POLICY "Users can update their own revisions"
  ON article_revisions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own revisions
CREATE POLICY "Users can delete their own revisions"
  ON article_revisions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE: training_data
-- Purpose: Store AI training data from editorial feedback for continuous improvement
-- ============================================================================
CREATE TABLE IF NOT EXISTS training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES content_queue(id) ON DELETE CASCADE,
  article_title TEXT,
  content_type TEXT,
  original_content TEXT,
  revised_content TEXT,
  feedback_items JSONB,
  pattern_type TEXT,
  lesson_learned TEXT,
  applied_to_system BOOLEAN DEFAULT FALSE,
  impact_score INTEGER DEFAULT 5 CHECK(impact_score >= 1 AND impact_score <= 10),
  status TEXT DEFAULT 'pending_review' CHECK(status IN ('pending_review', 'approved', 'applied', 'archived')),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Comments
COMMENT ON TABLE training_data IS 'AI training data from editorial feedback for continuous improvement';
COMMENT ON COLUMN training_data.feedback_items IS 'Array of feedback items (JSON): [{selected_text, comment, category, severity}]';
COMMENT ON COLUMN training_data.pattern_type IS 'Common pattern identified: tone_adjustment, structure_improvement, seo_optimization, compliance_fix, style_change, accuracy_correction';
COMMENT ON COLUMN training_data.lesson_learned IS 'Summary of what was learned from this revision';
COMMENT ON COLUMN training_data.applied_to_system IS 'Whether this training data has been applied to system prompts';
COMMENT ON COLUMN training_data.impact_score IS 'Impact score from 1-10 indicating importance of this training data';
COMMENT ON COLUMN training_data.status IS 'Status: pending_review, approved, applied, or archived';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_data_article_id ON training_data(article_id);
CREATE INDEX IF NOT EXISTS idx_training_data_status ON training_data(status);
CREATE INDEX IF NOT EXISTS idx_training_data_pattern_type ON training_data(pattern_type);
CREATE INDEX IF NOT EXISTS idx_training_data_created_date ON training_data(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_training_data_user_id ON training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_training_data_applied ON training_data(applied_to_system);

-- GIN index for JSONB feedback_items
CREATE INDEX IF NOT EXISTS idx_training_data_feedback_items ON training_data USING GIN (feedback_items);

-- RLS Policies
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;

-- Users can view their own training data
CREATE POLICY "Users can view their own training data"
  ON training_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create training data
CREATE POLICY "Users can create training data"
  ON training_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own training data
CREATE POLICY "Users can update their own training data"
  ON training_data
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own training data
CREATE POLICY "Users can delete their own training data"
  ON training_data
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE: system_settings
-- Purpose: Store system configuration and AI improvements
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT, -- JSON string for complex values
  setting_type TEXT DEFAULT 'other' CHECK(setting_type IN ('workflow', 'quality', 'throughput', 'integration', 'ai', 'other')),
  description TEXT,
  editable_by TEXT DEFAULT 'admin' CHECK(editable_by IN ('admin', 'editor', 'system')),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE system_settings IS 'System configuration and AI improvement settings';
COMMENT ON COLUMN system_settings.setting_key IS 'Unique key for the setting';
COMMENT ON COLUMN system_settings.setting_value IS 'Setting value (JSON string for complex values)';
COMMENT ON COLUMN system_settings.setting_type IS 'Type of setting: workflow, quality, throughput, integration, ai, or other';
COMMENT ON COLUMN system_settings.editable_by IS 'Who can edit this setting: admin, editor, or system';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_type ON system_settings(setting_type);
CREATE INDEX IF NOT EXISTS idx_system_settings_created_date ON system_settings(created_date DESC);

-- RLS Policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings
CREATE POLICY "Anyone can view settings"
  ON system_settings
  FOR SELECT
  USING (true);

-- Only authenticated users can create settings
CREATE POLICY "Authenticated users can create settings"
  ON system_settings
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only authenticated users can update settings
CREATE POLICY "Authenticated users can update settings"
  ON system_settings
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- TRIGGERS: Auto-update updated_date columns
-- ============================================================================

-- Trigger for article_revisions (uses existing update_updated_date function from schema)
CREATE OR REPLACE TRIGGER update_article_revisions_updated_date
  BEFORE UPDATE ON article_revisions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

-- Trigger for training_data
CREATE OR REPLACE TRIGGER update_training_data_updated_date
  BEFORE UPDATE ON training_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

-- Trigger for system_settings
CREATE OR REPLACE TRIGGER update_system_settings_updated_date
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

-- ============================================================================
-- SEED DATA: Default system settings
-- ============================================================================

-- AI content guidelines (will be updated by training)
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, editable_by)
VALUES (
  'ai_content_guidelines',
  '{"version": "1.0.0", "guidelines": "Default AI content generation guidelines"}',
  'ai',
  'Latest AI content generation guidelines from training',
  'system'
) ON CONFLICT (setting_key) DO NOTHING;

-- Default quality thresholds
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, editable_by)
VALUES (
  'quality_thresholds',
  '{"min_word_count": 1500, "max_word_count": 2500, "min_accuracy_score": 70, "max_citations_needed": 5}',
  'quality',
  'Quality thresholds for article validation',
  'admin'
) ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'article_revisions') THEN
    RAISE EXCEPTION 'Table article_revisions was not created';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'training_data') THEN
    RAISE EXCEPTION 'Table training_data was not created';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'system_settings') THEN
    RAISE EXCEPTION 'Table system_settings was not created';
  END IF;

  RAISE NOTICE '✓ All tables created successfully';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
