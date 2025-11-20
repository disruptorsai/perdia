/**
 * Run Perdia V3 Database Migrations
 *
 * This script applies the V3 schema updates to the Supabase database
 * using the service role key for admin access.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSQL(sql, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${description}`);
  console.log('='.repeat(60));

  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      // Try using the raw postgres approach via REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        },
        body: JSON.stringify({ query: sql })
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} - ${await response.text()}`);
      }

      console.log('SUCCESS (via REST)');
      return true;
    }

    console.log('SUCCESS');
    return true;
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    return false;
  }
}

async function runMigrations() {
  console.log('\n');
  console.log('*'.repeat(60));
  console.log('*  PERDIA V3 DATABASE MIGRATION');
  console.log('*'.repeat(60));
  console.log(`\nTarget: ${supabaseUrl}`);

  // Step 1: Create clusters table
  console.log('\n\nSTEP 1: Creating clusters table...');

  const clustersSQL = `
-- Clusters table - Topic grouping for content planning
CREATE TABLE IF NOT EXISTS clusters (
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

-- Enable RLS
ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;

-- Create policies (drop first if exists)
DROP POLICY IF EXISTS "Users can view own clusters" ON clusters;
CREATE POLICY "Users can view own clusters" ON clusters
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own clusters" ON clusters;
CREATE POLICY "Users can create own clusters" ON clusters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own clusters" ON clusters;
CREATE POLICY "Users can update own clusters" ON clusters
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own clusters" ON clusters;
CREATE POLICY "Users can delete own clusters" ON clusters
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clusters_user_id ON clusters(user_id);
CREATE INDEX IF NOT EXISTS idx_clusters_status ON clusters(status);
CREATE INDEX IF NOT EXISTS idx_clusters_priority ON clusters(priority DESC);
CREATE INDEX IF NOT EXISTS idx_clusters_parent ON clusters(parent_cluster_id);

-- Create trigger for updated_date
CREATE OR REPLACE FUNCTION update_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clusters_updated_date ON clusters;
CREATE TRIGGER update_clusters_updated_date
  BEFORE UPDATE ON clusters
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();
`;

  // Step 2: Read and apply the main V3 migration
  console.log('\n\nSTEP 2: Applying V3 schema updates...');

  const v3MigrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251119000001_perdia_v3_schema_updates.sql');
  const v3MigrationSQL = fs.readFileSync(v3MigrationPath, 'utf8');

  // Step 3: Read the seed data migration
  console.log('\n\nSTEP 3: Preparing seed data functions...');

  const seedDataPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251119000002_perdia_v3_seed_data.sql');
  const seedDataSQL = fs.readFileSync(seedDataPath, 'utf8');

  // Combine all SQL
  const fullSQL = `
-- ============================================
-- PERDIA V3 MIGRATION - STEP 1: CLUSTERS TABLE
-- ============================================
${clustersSQL}

-- ============================================
-- PERDIA V3 MIGRATION - STEP 2: V3 SCHEMA
-- ============================================
${v3MigrationSQL}

-- ============================================
-- PERDIA V3 MIGRATION - STEP 3: SEED FUNCTIONS
-- ============================================
${seedDataSQL}
`;

  // Save the full migration for manual execution if needed
  const outputPath = path.join(__dirname, 'v3-full-migration.sql');
  fs.writeFileSync(outputPath, fullSQL);
  console.log(`\nFull migration SQL saved to: ${outputPath}`);

  // Instructions for manual execution
  console.log('\n');
  console.log('='.repeat(60));
  console.log('MANUAL EXECUTION REQUIRED');
  console.log('='.repeat(60));
  console.log(`
Since direct SQL execution requires the Supabase dashboard or psql,
please follow these steps:

1. Open Supabase Dashboard:
   https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql

2. Copy the SQL from:
   ${outputPath}

3. Paste and run in the SQL Editor

4. Verify tables were created by running:
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('clusters', 'shortcodes', 'training_data',
                      'site_articles', 'content_ideas', 'system_settings')
   ORDER BY table_name;
`);

  return outputPath;
}

// Run the migrations
runMigrations()
  .then((outputPath) => {
    console.log('\nMigration SQL file generated successfully!');
    console.log(`File: ${outputPath}`);
  })
  .catch((err) => {
    console.error('\nMigration preparation failed:', err.message);
    process.exit(1);
  });
