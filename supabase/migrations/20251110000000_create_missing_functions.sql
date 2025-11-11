/**
 * Create Missing Database Functions
 *
 * This migration creates utility functions that should exist before Sprint 1 migration.
 * Run this BEFORE 20251110000001_sprint1_production_ready_schema.sql
 */

-- ============================================================================
-- CREATE update_updated_date_column() FUNCTION
-- ============================================================================

-- This function automatically updates the updated_date column to NOW()
-- Used by triggers on tables with updated_date columns
CREATE OR REPLACE FUNCTION update_updated_date_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Missing functions created successfully';
  RAISE NOTICE 'Function created: update_updated_date_column()';
  RAISE NOTICE 'You can now run: 20251110000001_sprint1_production_ready_schema.sql';
END $$;
