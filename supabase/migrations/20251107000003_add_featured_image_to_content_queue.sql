-- Migration: Add featured image support to content_queue table
-- Created: 2025-11-07
-- Purpose: Add featured_image_url and featured_image_path fields to support article images

ALTER TABLE content_queue
ADD COLUMN IF NOT EXISTS featured_image_url TEXT,
ADD COLUMN IF NOT EXISTS featured_image_path TEXT,
ADD COLUMN IF NOT EXISTS featured_image_alt_text TEXT,
ADD COLUMN IF NOT EXISTS featured_image_source TEXT CHECK (
    featured_image_source IN ('upload', 'ai_generated', 'stock_image', 'manual')
);

-- Add comment to document the fields
COMMENT ON COLUMN content_queue.featured_image_url IS 'Public URL of the featured image (from Supabase Storage or external)';
COMMENT ON COLUMN content_queue.featured_image_path IS 'Internal storage path in Supabase Storage bucket';
COMMENT ON COLUMN content_queue.featured_image_alt_text IS 'Alt text for SEO and accessibility';
COMMENT ON COLUMN content_queue.featured_image_source IS 'How the image was obtained: upload, ai_generated, stock_image, or manual';
