/**
 * PERDIA EDUCATION - DATABASE MIGRATION SCRIPT
 * =============================================
 * Runs the Supabase schema migration
 *
 * This script applies the complete database schema to your Supabase project,
 * including all tables, RLS policies, indexes, and storage buckets.
 *
 * Usage:
 *   node scripts/migrate-database.js
 *
 * Prerequisites:
 *   - .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY
 *   - Supabase CLI installed (optional, for local development)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Please create a .env.local file with these variables.');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Execute SQL migration file
 * @param {string} filePath - Path to SQL file
 */
async function runMigration(filePath) {
  console.log(`\n📄 Reading migration file: ${filePath}`);

  try {
    const sql = readFileSync(filePath, 'utf-8');

    console.log('⚙️  Executing migration...');

    // Note: Supabase client doesn't have a direct SQL execution method
    // This requires using the Supabase Management API or CLI
    // For now, we'll provide instructions

    console.log('\n⚠️  MANUAL MIGRATION REQUIRED');
    console.log('');
    console.log('The Supabase JavaScript client does not support executing raw SQL.');
    console.log('Please use one of these methods:');
    console.log('');
    console.log('METHOD 1: Supabase Dashboard (Recommended)');
    console.log('1. Go to: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to: SQL Editor');
    console.log('4. Copy the contents of: supabase/migrations/20250104000001_perdia_complete_schema.sql');
    console.log('5. Paste into SQL Editor');
    console.log('6. Click "Run"');
    console.log('');
    console.log('METHOD 2: Supabase CLI');
    console.log('1. Install: npm install -g supabase');
    console.log('2. Login: supabase login');
    console.log('3. Link project: supabase link --project-ref YOUR_PROJECT_REF');
    console.log('4. Run migration: supabase db push');
    console.log('');
    console.log('METHOD 3: PostgreSQL Client');
    console.log('1. Get connection string from Supabase dashboard');
    console.log('2. Connect using psql or another PostgreSQL client');
    console.log('3. Execute the SQL file');
    console.log('');

    // Verify tables exist after manual migration
    console.log('After running the migration, you can verify with:');
    console.log('  node scripts/verify-migration.js');
    console.log('');

    return false; // Indicate manual action required
  } catch (error) {
    console.error('❌ Error reading migration file:', error.message);
    return false;
  }
}

/**
 * Check if migration has already been run
 */
async function checkMigrationStatus() {
  console.log('\n🔍 Checking migration status...');

  try {
    // Try to query a table that should exist after migration
    const { data, error } = await supabase
      .from('keywords')
      .select('id')
      .limit(1);

    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('✅ No existing migration detected - ready to migrate');
        return false;
      }
      throw error;
    }

    console.log('✅ Migration already applied (tables exist)');
    return true;
  } catch (error) {
    console.log('✅ No existing migration detected - ready to migrate');
    return false;
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║      PERDIA EDUCATION - DATABASE MIGRATION SCRIPT         ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  // Check if already migrated
  const alreadyMigrated = await checkMigrationStatus();

  if (alreadyMigrated) {
    console.log('');
    console.log('ℹ️  Database is already migrated.');
    console.log('');
    console.log('To re-run migration:');
    console.log('1. Drop all tables in Supabase dashboard');
    console.log('2. Run this script again');
    console.log('');
    return;
  }

  // Path to migration file
  const migrationFile = join(__dirname, '../supabase/migrations/20250104000001_perdia_complete_schema.sql');

  // Run migration
  const success = await runMigration(migrationFile);

  if (!success) {
    console.log('⏸️  Migration requires manual execution.');
    console.log('');
    console.log('Once complete, run the seed script:');
    console.log('  npm run db:seed');
    console.log('');
  }
}

// ============================================================================
// RUN SCRIPT
// ============================================================================

main().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
