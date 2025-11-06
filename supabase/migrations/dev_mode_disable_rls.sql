-- ============================================================================
-- DEVELOPMENT MODE: Disable RLS for Testing
-- ============================================================================
-- This script TEMPORARILY disables Row Level Security (RLS) on all tables
-- to allow testing without authentication.
--
-- ⚠️  WARNING: ONLY USE IN DEVELOPMENT!
-- ⚠️  DO NOT RUN THIS IN PRODUCTION!
--
-- To enable RLS again, run: dev_mode_enable_rls.sql
-- ============================================================================

-- Disable RLS on all tables
ALTER TABLE agent_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_definitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE automation_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE file_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE keywords DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE page_optimizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE wordpress_connections DISABLE ROW LEVEL SECURITY;

-- Add comment to track dev mode status
COMMENT ON SCHEMA public IS 'RLS DISABLED FOR DEVELOPMENT - DO NOT USE IN PRODUCTION';

-- Log the change
DO $$
BEGIN
  RAISE NOTICE '✅ Development Mode Enabled - RLS disabled on all tables';
  RAISE NOTICE '⚠️  Remember to re-enable RLS before deploying to production!';
END $$;
