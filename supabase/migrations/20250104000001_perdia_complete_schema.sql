-- =====================================================
-- PERDIA EDUCATION PLATFORM - COMPLETE DATABASE SCHEMA
-- =====================================================
-- Migration: Initial schema for Perdia Education SEO Content Platform
-- Generated: 2025-11-04
-- Database: Supabase PostgreSQL
-- Base44 Entities Migrated: 27
--
-- This migration creates all tables, relationships, indexes, and RLS policies
-- for the complete Perdia Education platform migration from Base44.
--
-- ARCHITECTURE DECISIONS:
-- - Database: Existing Supabase project "perdia"
-- - Auth: Supabase Auth (standalone)
-- - Storage: Supabase Storage
-- - AI: Claude + OpenAI
-- - Deployment: Netlify
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to auto-update updated_date timestamp
CREATE OR REPLACE FUNCTION update_updated_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CORE SEO CONTENT TABLES (PRIMARY - ACTIVE)
-- =====================================================

-- ============================
-- 1. KEYWORDS TABLE
-- ============================
-- Manages both currently ranked and new target keywords
-- Supports AI clustering, priority ranking, and performance tracking
CREATE TABLE IF NOT EXISTS keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Keyword data
    keyword TEXT NOT NULL,
    list_type TEXT NOT NULL CHECK (list_type IN ('currently_ranked', 'new_target')),
    search_volume INTEGER DEFAULT 0,
    difficulty INTEGER DEFAULT 0 CHECK (difficulty >= 0 AND difficulty <= 100),
    category TEXT,
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'in_progress', 'completed', 'paused')),
    current_ranking INTEGER CHECK (current_ranking > 0),
    keyword_type TEXT CHECK (keyword_type IN ('short_tail', 'long_tail', 'question')),

    -- Metadata
    notes TEXT,
    related_keywords TEXT[], -- Array of related keywords for clustering
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint: one keyword per list_type per user
    UNIQUE(user_id, keyword, list_type)
);

-- Indexes for keyword performance
CREATE INDEX idx_keywords_user_id ON keywords(user_id);
CREATE INDEX idx_keywords_list_type ON keywords(list_type);
CREATE INDEX idx_keywords_status ON keywords(status);
CREATE INDEX idx_keywords_category ON keywords(category);
CREATE INDEX idx_keywords_priority ON keywords(priority);
CREATE INDEX idx_keywords_search_volume ON keywords(search_volume DESC);
CREATE INDEX idx_keywords_difficulty ON keywords(difficulty);
CREATE INDEX idx_keywords_keyword_trgm ON keywords USING gin(keyword gin_trgm_ops); -- Text search

-- Auto-update updated_date
CREATE TRIGGER update_keywords_updated_date
    BEFORE UPDATE ON keywords
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date();

-- ============================
-- 2. CONTENT QUEUE TABLE
-- ============================
-- Manages generated content through approval workflow
-- Supports draft → review → approved → scheduled → published pipeline
CREATE TABLE IF NOT EXISTS content_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Content data
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- HTML/Markdown content
    content_type TEXT NOT NULL CHECK (content_type IN ('new_article', 'page_optimization', 'update')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'scheduled', 'published', 'rejected')),

    -- SEO data
    target_keywords TEXT[] NOT NULL DEFAULT '{}',
    word_count INTEGER DEFAULT 0,
    meta_description TEXT,
    slug TEXT,

    -- WordPress integration
    wordpress_post_id TEXT,
    wordpress_url TEXT,

    -- Automation tracking
    automation_mode TEXT CHECK (automation_mode IN ('manual', 'semi_auto', 'full_auto')),
    agent_name TEXT, -- Which AI agent generated this

    -- Approval workflow
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    rejected_reason TEXT,

    -- Scheduling
    scheduled_date TIMESTAMPTZ,
    published_date TIMESTAMPTZ,

    -- Metadata
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for content queue
CREATE INDEX idx_content_queue_user_id ON content_queue(user_id);
CREATE INDEX idx_content_queue_status ON content_queue(status);
CREATE INDEX idx_content_queue_content_type ON content_queue(content_type);
CREATE INDEX idx_content_queue_created_by ON content_queue(created_by);
CREATE INDEX idx_content_queue_scheduled_date ON content_queue(scheduled_date);
CREATE INDEX idx_content_queue_target_keywords ON content_queue USING gin(target_keywords);
CREATE INDEX idx_content_queue_title_trgm ON content_queue USING gin(title gin_trgm_ops);

-- Auto-update updated_date
CREATE TRIGGER update_content_queue_updated_date
    BEFORE UPDATE ON content_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date();

-- ============================
-- 3. PERFORMANCE METRICS TABLE
-- ============================
-- Google Search Console metrics tracking
-- Daily metrics for keywords and pages
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Metric identification
    metric_date DATE NOT NULL,
    keyword TEXT,
    page_url TEXT,

    -- Google Search Console metrics
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    google_ranking NUMERIC(5,2), -- Average position
    ctr NUMERIC(5,4), -- Click-through rate (0.0000 to 1.0000)

    -- Metadata
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint: one metric per date/keyword/page combination
    UNIQUE(user_id, metric_date, keyword, page_url)
);

-- Indexes for performance metrics
CREATE INDEX idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX idx_performance_metrics_date ON performance_metrics(metric_date DESC);
CREATE INDEX idx_performance_metrics_keyword ON performance_metrics(keyword);
CREATE INDEX idx_performance_metrics_page_url ON performance_metrics(page_url);
CREATE INDEX idx_performance_metrics_clicks ON performance_metrics(clicks DESC);
CREATE INDEX idx_performance_metrics_impressions ON performance_metrics(impressions DESC);

-- ============================
-- 4. WORDPRESS CONNECTIONS TABLE
-- ============================
-- WordPress site credentials and connection status
-- Supports multiple WordPress sites per user
CREATE TABLE IF NOT EXISTS wordpress_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- WordPress site details
    site_name TEXT NOT NULL,
    site_url TEXT NOT NULL,
    username TEXT NOT NULL,
    application_password TEXT NOT NULL, -- Encrypted

    -- Connection status
    is_active BOOLEAN DEFAULT true,
    last_sync_date TIMESTAMPTZ,
    last_sync_status TEXT CHECK (last_sync_status IN ('success', 'failed', 'pending')),
    last_sync_error TEXT,

    -- Metadata
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for WordPress connections
CREATE INDEX idx_wordpress_connections_user_id ON wordpress_connections(user_id);
CREATE INDEX idx_wordpress_connections_is_active ON wordpress_connections(is_active);

-- Auto-update updated_date
CREATE TRIGGER update_wordpress_connections_updated_date
    BEFORE UPDATE ON wordpress_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date();

-- ============================
-- 5. AUTOMATION SETTINGS TABLE
-- ============================
-- User automation preferences and configuration
-- Controls manual/semi-auto/full-auto modes
CREATE TABLE IF NOT EXISTS automation_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Automation configuration
    automation_level TEXT NOT NULL DEFAULT 'manual' CHECK (automation_level IN ('manual', 'semi_auto', 'full_auto')),
    content_frequency TEXT DEFAULT 'daily', -- daily, weekly, custom
    articles_per_day INTEGER DEFAULT 3 CHECK (articles_per_day >= 0),
    articles_per_week INTEGER DEFAULT 20 CHECK (articles_per_week >= 0),

    -- Auto-approval settings
    auto_approve BOOLEAN DEFAULT false,
    auto_publish BOOLEAN DEFAULT false,
    require_review BOOLEAN DEFAULT true,

    -- Advanced settings (JSON for flexibility)
    settings JSONB DEFAULT '{}',

    -- Metadata
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for automation settings
CREATE INDEX idx_automation_settings_user_id ON automation_settings(user_id);

-- Auto-update updated_date
CREATE TRIGGER update_automation_settings_updated_date
    BEFORE UPDATE ON automation_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date();

-- ============================
-- 6. PAGE OPTIMIZATION TABLE
-- ============================
-- Tracks optimization of existing pages
-- Links to performance metrics and content queue
CREATE TABLE IF NOT EXISTS page_optimizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Page identification
    page_url TEXT NOT NULL,
    page_title TEXT,

    -- Optimization tracking
    target_keywords TEXT[] DEFAULT '{}',
    optimization_status TEXT DEFAULT 'pending' CHECK (optimization_status IN ('pending', 'in_progress', 'completed', 'scheduled')),

    -- Analysis results
    current_word_count INTEGER,
    recommended_word_count INTEGER,
    improvements JSONB DEFAULT '{}', -- AI suggestions

    -- Content queue link
    content_queue_id UUID REFERENCES content_queue(id),

    -- Metadata
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint
    UNIQUE(user_id, page_url)
);

-- Indexes for page optimizations
CREATE INDEX idx_page_optimizations_user_id ON page_optimizations(user_id);
CREATE INDEX idx_page_optimizations_status ON page_optimizations(optimization_status);
CREATE INDEX idx_page_optimizations_content_queue_id ON page_optimizations(content_queue_id);
CREATE INDEX idx_page_optimizations_target_keywords ON page_optimizations USING gin(target_keywords);

-- Auto-update updated_date
CREATE TRIGGER update_page_optimizations_updated_date
    BEFORE UPDATE ON page_optimizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date();

-- ============================
-- 7. BLOG POSTS TABLE
-- ============================
-- Alternative content storage (overlaps with content_queue but used in BlogLibrary)
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Blog post data
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image_url TEXT,

    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_date TIMESTAMPTZ,

    -- SEO
    slug TEXT,
    meta_description TEXT,
    tags TEXT[] DEFAULT '{}',

    -- Metadata
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for blog posts
CREATE INDEX idx_blog_posts_user_id ON blog_posts(user_id);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published_date ON blog_posts(published_date DESC);
CREATE INDEX idx_blog_posts_tags ON blog_posts USING gin(tags);
CREATE INDEX idx_blog_posts_title_trgm ON blog_posts USING gin(title gin_trgm_ops);

-- Auto-update updated_date
CREATE TRIGGER update_blog_posts_updated_date
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date();

-- ============================
-- 8. SOCIAL POSTS TABLE
-- ============================
-- Social media content scheduling and tracking
CREATE TABLE IF NOT EXISTS social_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Social post data
    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'linkedin', 'twitter', 'threads')),
    content TEXT NOT NULL,
    media_urls TEXT[] DEFAULT '{}',

    -- Scheduling
    scheduled_time TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
    published_date TIMESTAMPTZ,

    -- Analytics
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,

    -- Metadata
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for social posts
CREATE INDEX idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX idx_social_posts_platform ON social_posts(platform);
CREATE INDEX idx_social_posts_status ON social_posts(status);
CREATE INDEX idx_social_posts_scheduled_time ON social_posts(scheduled_time);

-- Auto-update updated_date
CREATE TRIGGER update_social_posts_updated_date
    BEFORE UPDATE ON social_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date();

-- ============================
-- 9. KNOWLEDGE BASE DOCUMENTS TABLE
-- ============================
-- AI agent training documents and knowledge base
-- Supports file uploads and text content
CREATE TABLE IF NOT EXISTS knowledge_base_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Document data
    title TEXT NOT NULL,
    content TEXT, -- Extracted text content
    file_url TEXT, -- Link to Supabase Storage
    file_name TEXT,
    file_type TEXT, -- pdf, docx, txt, md
    file_size INTEGER, -- bytes

    -- Categorization
    agent_name TEXT, -- Which agent uses this knowledge
    document_type TEXT CHECK (document_type IN ('training', 'reference', 'example', 'guideline')),
    tags TEXT[] DEFAULT '{}',

    -- Processing status
    is_processed BOOLEAN DEFAULT false,
    processing_status TEXT,

    -- Metadata
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for knowledge base documents
CREATE INDEX idx_knowledge_base_documents_user_id ON knowledge_base_documents(user_id);
CREATE INDEX idx_knowledge_base_documents_agent_name ON knowledge_base_documents(agent_name);
CREATE INDEX idx_knowledge_base_documents_document_type ON knowledge_base_documents(document_type);
CREATE INDEX idx_knowledge_base_documents_tags ON knowledge_base_documents USING gin(tags);
CREATE INDEX idx_knowledge_base_documents_title_content_trgm ON knowledge_base_documents USING gin((title || ' ' || COALESCE(content, '')) gin_trgm_ops);

-- Auto-update updated_date
CREATE TRIGGER update_knowledge_base_documents_updated_date
    BEFORE UPDATE ON knowledge_base_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date();

-- ============================
-- 10. AGENT FEEDBACK TABLE
-- ============================
-- User feedback on AI agent responses for improvement
CREATE TABLE IF NOT EXISTS agent_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Feedback data
    agent_name TEXT NOT NULL,
    conversation_id UUID, -- Link to conversations table
    message_id UUID, -- Link to specific message

    -- Feedback type
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative', 'neutral')),
    feedback_text TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),

    -- Categories
    feedback_categories TEXT[] DEFAULT '{}', -- accuracy, tone, length, relevance

    -- Metadata
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for agent feedback
CREATE INDEX idx_agent_feedback_user_id ON agent_feedback(user_id);
CREATE INDEX idx_agent_feedback_agent_name ON agent_feedback(agent_name);
CREATE INDEX idx_agent_feedback_conversation_id ON agent_feedback(conversation_id);
CREATE INDEX idx_agent_feedback_feedback_type ON agent_feedback(feedback_type);
CREATE INDEX idx_agent_feedback_created_date ON agent_feedback(created_date DESC);

-- ============================
-- 11. FILE DOCUMENTS TABLE
-- ============================
-- General file storage and management
CREATE TABLE IF NOT EXISTS file_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- File data
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER, -- bytes
    mime_type TEXT,

    -- Categorization
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    description TEXT,

    -- Upload tracking
    uploaded_by UUID REFERENCES auth.users(id),
    upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Access control
    is_public BOOLEAN DEFAULT false,

    -- Metadata
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for file documents
CREATE INDEX idx_file_documents_user_id ON file_documents(user_id);
CREATE INDEX idx_file_documents_category ON file_documents(category);
CREATE INDEX idx_file_documents_tags ON file_documents USING gin(tags);
CREATE INDEX idx_file_documents_uploaded_by ON file_documents(uploaded_by);
CREATE INDEX idx_file_documents_upload_date ON file_documents(upload_date DESC);

-- ============================
-- 12. CHAT CHANNELS TABLE
-- ============================
-- Team collaboration channels
CREATE TABLE IF NOT EXISTS chat_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Channel data
    name TEXT NOT NULL,
    description TEXT,
    channel_type TEXT NOT NULL DEFAULT 'team' CHECK (channel_type IN ('team', 'project', 'direct')),

    -- Access control
    is_private BOOLEAN DEFAULT false,
    members UUID[] DEFAULT '{}', -- Array of user IDs
    admins UUID[] DEFAULT '{}', -- Array of admin user IDs

    -- Channel settings
    settings JSONB DEFAULT '{}',

    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for chat channels
CREATE INDEX idx_chat_channels_members ON chat_channels USING gin(members);
CREATE INDEX idx_chat_channels_created_by ON chat_channels(created_by);
CREATE INDEX idx_chat_channels_channel_type ON chat_channels(channel_type);

-- Auto-update updated_date
CREATE TRIGGER update_chat_channels_updated_date
    BEFORE UPDATE ON chat_channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date();

-- ============================
-- 13. CHAT MESSAGES TABLE
-- ============================
-- Team chat messages within channels
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Message data
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),

    -- Attachments
    attachments JSONB DEFAULT '[]', -- Array of {name, url, type}

    -- Threading
    parent_message_id UUID REFERENCES chat_messages(id),

    -- Reactions
    reactions JSONB DEFAULT '{}', -- {emoji: [user_ids]}

    -- Metadata
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false
);

-- Indexes for chat messages
CREATE INDEX idx_chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_parent_message_id ON chat_messages(parent_message_id);
CREATE INDEX idx_chat_messages_created_date ON chat_messages(created_date DESC);

-- Auto-update updated_date
CREATE TRIGGER update_chat_messages_updated_date
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date();

-- =====================================================
-- AI AGENT SYSTEM TABLES (CUSTOM IMPLEMENTATION)
-- =====================================================

-- ============================
-- 14. AGENT DEFINITIONS TABLE
-- ============================
-- Defines the 9 specialized AI agents
CREATE TABLE IF NOT EXISTS agent_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Agent identification
    agent_name TEXT NOT NULL UNIQUE, -- e.g., "seo_content_writer"
    display_name TEXT NOT NULL, -- e.g., "SEO Content Writer"

    -- Agent configuration
    description TEXT NOT NULL,
    system_prompt TEXT NOT NULL, -- AI instructions
    icon TEXT, -- Icon identifier
    color TEXT, -- UI color theme

    -- AI model settings
    default_model TEXT DEFAULT 'claude-3-5-sonnet-20241022', -- Claude or OpenAI model
    temperature NUMERIC(2,1) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 4000,

    -- Capabilities
    capabilities TEXT[] DEFAULT '{}', -- content_generation, optimization, research

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for agent definitions
CREATE INDEX idx_agent_definitions_agent_name ON agent_definitions(agent_name);
CREATE INDEX idx_agent_definitions_is_active ON agent_definitions(is_active);

-- Insert the 9 default agents
INSERT INTO agent_definitions (agent_name, display_name, description, system_prompt, icon, color, capabilities) VALUES
('seo_content_writer', 'SEO Content Writer', 'Creates comprehensive, SEO-optimized long-form articles',
 'You are an expert SEO content writer. Create comprehensive, well-researched articles optimized for search engines while maintaining readability and engagement. Include proper headings, internal linking opportunities, and natural keyword integration.',
 'FileText', 'blue', ARRAY['content_generation', 'seo_optimization']),

('content_optimizer', 'Content Optimizer', 'Analyzes and improves existing content for better SEO performance',
 'You are a content optimization specialist. Analyze existing content and provide specific recommendations for improvement, including keyword optimization, structure improvements, readability enhancements, and SEO best practices.',
 'Sparkles', 'purple', ARRAY['optimization', 'analysis']),

('keyword_researcher', 'Keyword Researcher', 'Discovers and analyzes keyword opportunities',
 'You are a keyword research expert. Generate relevant keyword suggestions, analyze search intent, cluster related keywords, and provide strategic recommendations for keyword targeting.',
 'Search', 'green', ARRAY['research', 'analysis']),

('general_content_assistant', 'General Content Assistant', 'General-purpose content creation and editing',
 'You are a versatile content assistant. Help with various content creation tasks including writing, editing, brainstorming, and formatting across different content types.',
 'MessageSquare', 'gray', ARRAY['content_generation', 'editing']),

('emma_promoter', 'EMMA Promoter', 'Creates promotional content for EMMA mobile enrollment app',
 'You are a promotional content specialist for EMMA (mobile enrollment app). Create engaging promotional content highlighting the benefits of mobile enrollment and EMMA''s features.',
 'Smartphone', 'pink', ARRAY['content_generation', 'promotion']),

('enrollment_strategist', 'Enrollment Strategist', 'Develops enrollment strategy guides and resources',
 'You are an enrollment strategy expert. Create comprehensive guides and resources about enrollment strategies, best practices, and optimization techniques for educational institutions.',
 'Target', 'orange', ARRAY['content_generation', 'strategy']),

('history_storyteller', 'History Storyteller', 'Crafts compelling company and founder stories',
 'You are a storytelling expert. Create engaging narratives about company history, founder stories, and organizational milestones that connect with audiences emotionally.',
 'BookOpen', 'amber', ARRAY['content_generation', 'storytelling']),

('resource_expander', 'Resource Expander', 'Creates lead magnets, white papers, and educational resources',
 'You are an educational content specialist. Create comprehensive lead magnets, white papers, guides, and educational resources that provide deep value to readers.',
 'FileDown', 'indigo', ARRAY['content_generation', 'education']),

('social_engagement_booster', 'Social Engagement Booster', 'Optimizes content for social media engagement',
 'You are a social media content expert. Create engaging social media posts, optimize content for different platforms, and develop strategies to boost engagement and reach.',
 'Share2', 'rose', ARRAY['content_generation', 'social_media']);

-- Auto-update updated_date
CREATE TRIGGER update_agent_definitions_updated_date
    BEFORE UPDATE ON agent_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date();

-- ============================
-- 15. AGENT CONVERSATIONS TABLE
-- ============================
-- Multi-turn conversations with AI agents
CREATE TABLE IF NOT EXISTS agent_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Conversation metadata
    agent_name TEXT NOT NULL, -- References agent_definitions.agent_name
    title TEXT, -- Auto-generated from first message

    -- Context
    context JSONB DEFAULT '{}', -- Additional context for the conversation

    -- Status
    is_archived BOOLEAN DEFAULT false,

    -- Metadata
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_date TIMESTAMPTZ
);

-- Indexes for agent conversations
CREATE INDEX idx_agent_conversations_user_id ON agent_conversations(user_id);
CREATE INDEX idx_agent_conversations_agent_name ON agent_conversations(agent_name);
CREATE INDEX idx_agent_conversations_updated_date ON agent_conversations(updated_date DESC);
CREATE INDEX idx_agent_conversations_is_archived ON agent_conversations(is_archived);

-- Auto-update updated_date
CREATE TRIGGER update_agent_conversations_updated_date
    BEFORE UPDATE ON agent_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date();

-- ============================
-- 16. AGENT MESSAGES TABLE
-- ============================
-- Individual messages within agent conversations
CREATE TABLE IF NOT EXISTS agent_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,

    -- Message data
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,

    -- AI model tracking
    model_used TEXT, -- Which AI model generated this response
    tokens_used INTEGER, -- Token count for cost tracking

    -- Metadata
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for agent messages
CREATE INDEX idx_agent_messages_conversation_id ON agent_messages(conversation_id);
CREATE INDEX idx_agent_messages_created_date ON agent_messages(created_date DESC);

-- =====================================================
-- UNUSED LEGACY TABLES (FROM BASE44 - OPTIONAL)
-- =====================================================
-- These tables are included for completeness but are NOT actively used
-- in the Perdia Education platform. They can be excluded if desired.

-- ============================
-- 17-31. PROJECT MANAGEMENT & EOS TABLES (DISABLED)
-- ============================
-- These would include: clients, projects, tasks, time_entries, eos_companies,
-- eos_rocks, eos_issues, eos_scorecards, eos_accountability_seats,
-- eos_person_assessments, eos_processes, eos_process_improvements,
-- eos_scorecard_metrics, eos_scorecard_entries, eos_quarterly_sessions,
-- eos_todos, meeting_notes, reports
--
-- NOT IMPLEMENTED - These entities exist in Base44 app but are not used
-- by Perdia Education. They were part of a broader project management
-- template that Perdia was built from.

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- All tables use user_id-based RLS for multi-tenant isolation

-- Enable RLS on all tables
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordpress_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

-- ============================
-- KEYWORDS POLICIES
-- ============================
CREATE POLICY "Users can view their own keywords"
    ON keywords FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own keywords"
    ON keywords FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own keywords"
    ON keywords FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keywords"
    ON keywords FOR DELETE
    USING (auth.uid() = user_id);

-- ============================
-- CONTENT QUEUE POLICIES
-- ============================
CREATE POLICY "Users can view their own content"
    ON content_queue FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = created_by OR auth.uid() = approved_by);

CREATE POLICY "Users can insert their own content"
    ON content_queue FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content"
    ON content_queue FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = created_by);

CREATE POLICY "Users can delete their own content"
    ON content_queue FOR DELETE
    USING (auth.uid() = user_id);

-- ============================
-- PERFORMANCE METRICS POLICIES
-- ============================
CREATE POLICY "Users can view their own metrics"
    ON performance_metrics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics"
    ON performance_metrics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metrics"
    ON performance_metrics FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own metrics"
    ON performance_metrics FOR DELETE
    USING (auth.uid() = user_id);

-- ============================
-- WORDPRESS CONNECTIONS POLICIES
-- ============================
CREATE POLICY "Users can view their own WordPress connections"
    ON wordpress_connections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own WordPress connections"
    ON wordpress_connections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WordPress connections"
    ON wordpress_connections FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WordPress connections"
    ON wordpress_connections FOR DELETE
    USING (auth.uid() = user_id);

-- ============================
-- AUTOMATION SETTINGS POLICIES
-- ============================
CREATE POLICY "Users can view their own automation settings"
    ON automation_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automation settings"
    ON automation_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automation settings"
    ON automation_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automation settings"
    ON automation_settings FOR DELETE
    USING (auth.uid() = user_id);

-- ============================
-- PAGE OPTIMIZATIONS POLICIES
-- ============================
CREATE POLICY "Users can view their own page optimizations"
    ON page_optimizations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own page optimizations"
    ON page_optimizations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own page optimizations"
    ON page_optimizations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own page optimizations"
    ON page_optimizations FOR DELETE
    USING (auth.uid() = user_id);

-- ============================
-- BLOG POSTS POLICIES
-- ============================
CREATE POLICY "Users can view their own blog posts"
    ON blog_posts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own blog posts"
    ON blog_posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blog posts"
    ON blog_posts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blog posts"
    ON blog_posts FOR DELETE
    USING (auth.uid() = user_id);

-- ============================
-- SOCIAL POSTS POLICIES
-- ============================
CREATE POLICY "Users can view their own social posts"
    ON social_posts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social posts"
    ON social_posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social posts"
    ON social_posts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social posts"
    ON social_posts FOR DELETE
    USING (auth.uid() = user_id);

-- ============================
-- KNOWLEDGE BASE DOCUMENTS POLICIES
-- ============================
CREATE POLICY "Users can view their own knowledge base documents"
    ON knowledge_base_documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own knowledge base documents"
    ON knowledge_base_documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge base documents"
    ON knowledge_base_documents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge base documents"
    ON knowledge_base_documents FOR DELETE
    USING (auth.uid() = user_id);

-- ============================
-- AGENT FEEDBACK POLICIES
-- ============================
CREATE POLICY "Users can view their own agent feedback"
    ON agent_feedback FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent feedback"
    ON agent_feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent feedback"
    ON agent_feedback FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent feedback"
    ON agent_feedback FOR DELETE
    USING (auth.uid() = user_id);

-- ============================
-- FILE DOCUMENTS POLICIES
-- ============================
CREATE POLICY "Users can view their own file documents"
    ON file_documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own file documents"
    ON file_documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own file documents"
    ON file_documents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own file documents"
    ON file_documents FOR DELETE
    USING (auth.uid() = user_id);

-- ============================
-- CHAT CHANNELS POLICIES
-- ============================
CREATE POLICY "Users can view channels they are members of"
    ON chat_channels FOR SELECT
    USING (auth.uid() = ANY(members) OR created_by = auth.uid());

CREATE POLICY "Users can create channels"
    ON chat_channels FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Channel admins can update channels"
    ON chat_channels FOR UPDATE
    USING (auth.uid() = ANY(admins) OR created_by = auth.uid());

CREATE POLICY "Channel creators can delete channels"
    ON chat_channels FOR DELETE
    USING (auth.uid() = created_by);

-- ============================
-- CHAT MESSAGES POLICIES
-- ============================
CREATE POLICY "Users can view messages in their channels"
    ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chat_channels
            WHERE chat_channels.id = chat_messages.channel_id
            AND (auth.uid() = ANY(chat_channels.members) OR auth.uid() = chat_channels.created_by)
        )
    );

CREATE POLICY "Users can insert messages in their channels"
    ON chat_messages FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM chat_channels
            WHERE chat_channels.id = channel_id
            AND (auth.uid() = ANY(chat_channels.members) OR auth.uid() = chat_channels.created_by)
        )
    );

CREATE POLICY "Users can update their own messages"
    ON chat_messages FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
    ON chat_messages FOR DELETE
    USING (auth.uid() = user_id);

-- ============================
-- AGENT DEFINITIONS POLICIES
-- ============================
CREATE POLICY "Anyone can view active agent definitions"
    ON agent_definitions FOR SELECT
    USING (is_active = true);

-- Only admins can modify agent definitions (handled at app level)

-- ============================
-- AGENT CONVERSATIONS POLICIES
-- ============================
CREATE POLICY "Users can view their own conversations"
    ON agent_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
    ON agent_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
    ON agent_conversations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
    ON agent_conversations FOR DELETE
    USING (auth.uid() = user_id);

-- ============================
-- AGENT MESSAGES POLICIES
-- ============================
CREATE POLICY "Users can view messages in their conversations"
    ON agent_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM agent_conversations
            WHERE agent_conversations.id = agent_messages.conversation_id
            AND auth.uid() = agent_conversations.user_id
        )
    );

CREATE POLICY "Users can insert messages in their conversations"
    ON agent_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM agent_conversations
            WHERE agent_conversations.id = conversation_id
            AND auth.uid() = agent_conversations.user_id
        )
    );

-- =====================================================
-- SUPABASE STORAGE BUCKETS
-- =====================================================
-- Create storage buckets for file uploads

-- Knowledge base documents bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-base', 'knowledge-base', false)
ON CONFLICT (id) DO NOTHING;

-- Blog/content images bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-images', 'content-images', true)
ON CONFLICT (id) DO NOTHING;

-- Social media assets bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('social-media', 'social-media', true)
ON CONFLICT (id) DO NOTHING;

-- General file uploads bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;

-- ============================
-- STORAGE BUCKET POLICIES
-- ============================

-- Knowledge base bucket policies (private)
CREATE POLICY "Users can upload their own knowledge base files"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'knowledge-base' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own knowledge base files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'knowledge-base' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own knowledge base files"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'knowledge-base' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Content images bucket policies (public read, authenticated write)
CREATE POLICY "Anyone can view content images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'content-images');

CREATE POLICY "Authenticated users can upload content images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'content-images' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete their own content images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'content-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Social media bucket policies (public read, authenticated write)
CREATE POLICY "Anyone can view social media assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'social-media');

CREATE POLICY "Authenticated users can upload social media assets"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'social-media' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete their own social media assets"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'social-media' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Uploads bucket policies (private)
CREATE POLICY "Users can upload their own files"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'uploads' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own uploads"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'uploads' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own uploads"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'uploads' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration creates:
-- - 16 active tables for Perdia Education platform
-- - Complete RLS policies for multi-tenant security
-- - Comprehensive indexes for performance
-- - 4 Supabase Storage buckets with policies
-- - 9 pre-configured AI agent definitions
-- - Triggers for auto-updating timestamps
--
-- Next steps:
-- 1. Run this migration: supabase db push
-- 2. Verify tables in Supabase dashboard
-- 3. Test RLS policies
-- 4. Configure storage buckets
-- 5. Begin frontend migration
-- =====================================================
