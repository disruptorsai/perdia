/**
 * Run Sprint 1 Migrations via Supabase REST API
 *
 * This script executes SQL migrations using Supabase's REST API with service role key.
 * No database password required.
 *
 * Usage: node scripts/run-sprint1-migrations.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Supabase configuration
const SUPABASE_URL = 'https://yvvtsfgryweqfppilkvo.supabase.co';
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dnRzZmdyeXdlcWZwcGlsa3ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI5MDM0MSwiZXhwIjoyMDc3ODY2MzQxfQ.XNbwVWQS5Vya10ee_PhEjWvRg-Gp8f3yWTzLMWBuCTU';

/**
 * Execute SQL query via Supabase REST API query endpoint
 */
async function executeSQL(sql, name) {
  console.log(`\n📄 Executing: ${name}`);
  console.log('━'.repeat(60));

  try {
    // Use Supabase's query endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        query: sql
      })
    });

    const result = await response.text();

    if (!response.ok) {
      // Check if it's an "already exists" error
      if (result.includes('already exists') || result.includes('duplicate')) {
        console.log('⚠️  Objects already exist (migration was previously applied)');
        return true;
      }

      throw new Error(`HTTP ${response.status}: ${result}`);
    }

    console.log('✅ SQL executed successfully');
    if (result && result.length > 0 && result !== 'null') {
      console.log('📝 Result:', result.substring(0, 200));
    }
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

    console.error('❌ Execution failed:', error.message);
    return false;
  }
}

/**
 * Execute migration file by splitting into statements
 */
async function executeMigration(migrationPath, migrationName) {
  console.log(`\n📄 Applying: ${migrationName}`);
  console.log('━'.repeat(60));

  try {
    // Read migration file
    let sql = readFileSync(migrationPath, 'utf8');

    // For the SLA cron job migration, replace the service role key placeholder
    if (migrationPath.includes('setup_sla_cron_job')) {
      sql = sql.replace(
        /-- ALTER DATABASE postgres SET app\.settings\.service_role_key = 'YOUR_SERVICE_ROLE_KEY';/,
        `ALTER DATABASE postgres SET app.settings.service_role_key = '${SERVICE_ROLE_KEY}';`
      );
    }

    // Execute the entire SQL file as one statement
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        query: sql
      })
    });

    const result = await response.text();

    if (!response.ok) {
      // Log more details about the error
      console.log('Response status:', response.status);
      console.log('Response:', result);

      // Check if it's an "already exists" error
      if (result.includes('already exists') || result.includes('duplicate')) {
        console.log('⚠️  Objects already exist (migration was previously applied)');
        return true;
      }

      // If the RPC endpoint doesn't exist, provide instructions
      if (response.status === 404 || result.includes('not found')) {
        console.log('\n❌ Direct SQL execution not available via REST API');
        console.log('\n📋 MANUAL MIGRATION REQUIRED:');
        console.log('1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new');
        console.log(`2. Copy the contents of: ${migrationPath}`);
        console.log('3. Paste into SQL Editor');
        console.log('4. Click "Run" (or press Ctrl+Enter)');
        console.log('\nOr use: node scripts/apply-sprint1-via-supabase.js for detailed instructions');
        return false;
      }

      throw new Error(`HTTP ${response.status}: ${result}`);
    }

    console.log('✅ Migration applied successfully');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);

    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      console.log('\n💡 Network error. Check your internet connection.');
    }

    return false;
  }
}

/**
 * Main migration runner
 */
async function runMigrations() {
  console.log('\n🚀 Sprint 1 Migration Runner (REST API Mode)');
  console.log('━'.repeat(60));
  console.log('📍 Database: Perdia Supabase (yvvtsfgryweqfppilkvo)');
  console.log('🔑 Using service role key for authentication');
  console.log('━'.repeat(60));

  const migrations = [
    {
      name: 'Migration 0: Create Missing Functions',
      path: join(projectRoot, 'supabase/migrations/20251110000000_create_missing_functions.sql'),
    },
    {
      name: 'Migration 1: Sprint 1 Production-Ready Schema',
      path: join(projectRoot, 'supabase/migrations/20251110000001_sprint1_production_ready_schema.sql'),
    },
    {
      name: 'Migration 2: Setup SLA Cron Job',
      path: join(projectRoot, 'supabase/migrations/20251110000002_setup_sla_cron_job.sql'),
    },
  ];

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    const success = await executeMigration(migration.path, migration.name);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    console.log(''); // Blank line between migrations
  }

  // Summary
  console.log('━'.repeat(60));
  console.log('📊 Migration Summary');
  console.log('━'.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);

  if (failCount === 0) {
    console.log('\n🎉 All Sprint 1 migrations applied successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Run verification script: node scripts/verify-sprint1-migrations.js');
    console.log('   2. Test Edge Functions with new schema');
    console.log('   3. Continue with Sprint 2 implementation');
  } else {
    console.log('\n⚠️  Some migrations require manual execution.');
    console.log('   See instructions above for manual migration steps.');
  }

  console.log('━'.repeat(60));
  console.log('');

  process.exit(failCount > 0 ? 1 : 0);
}

// Run migrations
runMigrations();
