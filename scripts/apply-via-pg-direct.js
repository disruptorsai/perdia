/**
 * Apply Sprint 1 Migrations via PostgreSQL Direct Connection
 *
 * This script uses the pg package to connect directly to Supabase PostgreSQL.
 * Requires database password from Supabase Dashboard.
 *
 * Usage: node scripts/apply-via-pg-direct.js
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const { Client } = pg;

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Database configuration
const PROJECT_REF = 'yvvtsfgryweqfppilkvo';
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || 'ENTER_PASSWORD_HERE';

// Connection string
const connectionString = `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;

/**
 * Execute migration file
 */
async function executeMigration(client, migrationPath, migrationName) {
  console.log(`\n📄 Applying: ${migrationName}`);
  console.log('━'.repeat(60));

  try {
    // Read migration file
    const sql = readFileSync(migrationPath, 'utf8');

    // Execute the SQL
    await client.query(sql);

    console.log('✅ Migration applied successfully');
    return true;
  } catch (error) {
    // Check if error is because object already exists
    if (error.message && (
      error.message.includes('already exists') ||
      error.message.includes('duplicate')
    )) {
      console.log('⚠️  Objects already exist (migration was previously applied)');
      return true;
    }

    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

/**
 * Main migration runner
 */
async function runMigrations() {
  console.log('\n🚀 Sprint 1 Migration Runner (PostgreSQL Direct)');
  console.log('━'.repeat(60));
  console.log(`📍 Database: postgres.${PROJECT_REF}@aws-0-us-east-1.pooler.supabase.com`);
  console.log('━'.repeat(60));

  if (DB_PASSWORD === 'ENTER_PASSWORD_HERE') {
    console.log('\n❌ Database password not set!');
    console.log('\n📋 TO GET YOUR DATABASE PASSWORD:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/database');
    console.log('   2. Click "Reset Database Password"');
    console.log('   3. Copy the new password');
    console.log('   4. Add to .env.local: SUPABASE_DB_PASSWORD=your_password');
    console.log('   5. Run this script again');
    console.log('\n   OR use the consolidated SQL file via Dashboard:');
    console.log('   • File: supabase/migrations/APPLY_ALL_SPRINT1_MIGRATIONS.sql');
    console.log('   • Dashboard: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new');
    console.log('');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    // Connect to database
    console.log('\n🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Use the consolidated migration file
    const consolidatedMigration = {
      name: 'All Sprint 1 Migrations (Consolidated)',
      path: join(projectRoot, 'supabase/migrations/APPLY_ALL_SPRINT1_MIGRATIONS.sql'),
    };

    const success = await executeMigration(client, consolidatedMigration.path, consolidatedMigration.name);

    // Summary
    console.log('\n━'.repeat(60));
    console.log('📊 Migration Summary');
    console.log('━'.repeat(60));

    if (success) {
      console.log('✅ All Sprint 1 migrations applied successfully!');
      console.log('\n📋 Next Steps:');
      console.log('   1. Run verification: node scripts/verify-sprint1-migrations.js');
      console.log('   2. Test Edge Functions with new schema');
      console.log('   3. Continue Sprint 2 implementation');
    } else {
      console.log('❌ Migration failed.');
      console.log('   Try manual execution via Supabase Dashboard SQL Editor.');
    }

    console.log('━'.repeat(60));
    console.log('');

    await client.end();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);

    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Invalid database password.');
      console.log('   Reset password in Supabase Dashboard and update .env.local');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Connection failed. Check:');
      console.log('   • Internet connection');
      console.log('   • Supabase project is active');
      console.log('   • Firewall/VPN settings');
    }

    try {
      await client.end();
    } catch (e) {
      // Ignore cleanup errors
    }
    process.exit(1);
  }
}

// Run migrations
runMigrations();
