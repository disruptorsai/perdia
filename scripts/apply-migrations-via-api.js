/**
 * Apply Sprint 1 Migrations via Supabase Management API
 *
 * This script uses Supabase's Management API to execute SQL migrations.
 * Requires: SUPABASE_ACCESS_TOKEN environment variable
 *
 * Usage: node scripts/apply-migrations-via-api.js
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

// Configuration
const PROJECT_REF = 'yvvtsfgryweqfppilkvo';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_2c4d45ee83f6f57f90da91b60f0dba2a99c1ef00';
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dnRzZmdyeXdlcWZwcGlsa3ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI5MDM0MSwiZXhwIjoyMDc3ODY2MzQxfQ.XNbwVWQS5Vya10ee_PhEjWvRg-Gp8f3yWTzLMWBuCTU';

/**
 * Execute SQL using Supabase Management API
 */
async function executeSQLViaAPI(sql, name) {
  console.log(`\n📄 Executing: ${name}`);
  console.log('━'.repeat(60));

  try {
    // Use Supabase Management API to execute SQL
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        query: sql
      })
    });

    const result = await response.json();

    if (!response.ok) {
      // Check if it's an "already exists" error
      if (result.error && (result.error.includes('already exists') || result.error.includes('duplicate'))) {
        console.log('⚠️  Objects already exist (migration was previously applied)');
        return true;
      }

      throw new Error(`API Error: ${JSON.stringify(result)}`);
    }

    console.log('✅ SQL executed successfully');
    if (result.result && result.result.length > 0) {
      console.log('📝 Rows affected:', result.result.length);
    }
    return true;
  } catch (error) {
    console.error('❌ Execution failed:', error.message);
    return false;
  }
}

/**
 * Execute migration file
 */
async function executeMigration(migrationPath, migrationName) {
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

    return await executeSQLViaAPI(sql, migrationName);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

/**
 * Main migration runner
 */
async function runMigrations() {
  console.log('\n🚀 Sprint 1 Migration Runner (Management API)');
  console.log('━'.repeat(60));
  console.log(`📍 Project: ${PROJECT_REF}`);
  console.log('🔑 Using Supabase access token');
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
    console.log('   1. Run verification: node scripts/verify-sprint1-migrations.js');
    console.log('   2. Test Edge Functions');
    console.log('   3. Continue Sprint 2');
  } else {
    console.log('\n⚠️  Some migrations failed.');
    console.log('   Try manual execution via Supabase Dashboard SQL Editor.');
  }

  console.log('━'.repeat(60));
  process.exit(failCount > 0 ? 1 : 0);
}

// Run migrations
runMigrations();
