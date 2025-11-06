-- ============================================================================
-- PRODUCTION MODE: Re-enable RLS
-- ============================================================================
-- This script re-enables Row Level Security (RLS) on all tables
-- Run this before deploying to production!
-- ============================================================================

-- Re-enable RLS on all tables
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordpress_connections ENABLE ROW LEVEL SECURITY;

-- Remove dev mode comment
COMMENT ON SCHEMA public IS NULL;

-- Log the change
DO $$
BEGIN
  RAISE NOTICE '✅ Production Mode Enabled - RLS re-enabled on all tables';
  RAISE NOTICE '🔒 Database is now secure for production use';
END $$;
