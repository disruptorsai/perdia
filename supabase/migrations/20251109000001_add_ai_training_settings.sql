-- Migration: Add AI training settings to automation_settings table
-- Created: 2025-11-09
-- Purpose: Add ai_writing_directives and focus_keywords fields to support AI training

ALTER TABLE automation_settings
ADD COLUMN IF NOT EXISTS ai_writing_directives TEXT,
ADD COLUMN IF NOT EXISTS focus_keywords TEXT;

-- Add comment to document the fields
COMMENT ON COLUMN automation_settings.ai_writing_directives IS 'Global writing directives for all AI agents';
COMMENT ON COLUMN automation_settings.focus_keywords IS 'Global focus keywords for all AI agents';
