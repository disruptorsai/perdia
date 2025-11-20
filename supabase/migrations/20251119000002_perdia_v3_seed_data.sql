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
