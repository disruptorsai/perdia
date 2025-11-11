/**
 * Apply Sprint 1 Migrations to Supabase Database
 *
 * This script applies the Sprint 1 Production-Ready migrations to the Perdia Supabase database.
 * It connects directly to PostgreSQL using the pooler connection.
 *
 * Usage: node scripts/apply-sprint1-migrations.js
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

// Supabase connection - using direct database connection
const projectRef = 'yvvtsfgryweqfppilkvo';
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dnRzZmdyeXdlcWZwcGlsa3ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI5MDM0MSwiZXhwIjoyMDc3ODY2MzQxfQ.XNbwVWQS5Vya10ee_PhEjWvRg-Gp8f3yWTzLMWBuCTU';

// PostgreSQL direct connection (requires password from dashboard)
const connectionString = `postgresql://postgres.${projectRef}:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;

const client = new Client({ connectionString });

/**
 * Execute SQL migration file
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
        `ALTER DATABASE postgres SET app.settings.service_role_key = '${serviceRoleKey}';`
      );
    }

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
      return true; // Treat as success
    }

    console.error('❌ Migration failed:', error.message);

    if (error.message && error.message.includes('permission denied')) {
      console.log('\n💡 SOLUTION:');
      console.log('   Permission denied - make sure service role key is correct');
      console.log('   Check VITE_SUPABASE_SERVICE_ROLE_KEY in .env.local');
    }

    return false;
  }
}

/**
 * Main migration runner
 */
async function runMigrations() {
  console.log('\n🚀 Sprint 1 Migration Runner');
  console.log('━'.repeat(60));
  console.log(`📍 Database: postgres.${projectRef}@aws-0-us-east-1.pooler.supabase.com`);
  console.log('━'.repeat(60));

  try {
    // Connect to database
    console.log('\n🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

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
    }

    // Summary
    console.log('\n');
    console.log('━'.repeat(60));
    console.log('📊 Migration Summary');
    console.log('━'.repeat(60));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);

    if (failCount === 0) {
      console.log('\n🎉 All Sprint 1 migrations applied successfully!');
      console.log('\n📋 Next Steps:');
      console.log('   1. Verify tables created:');
      console.log('      • shortcode_validation_logs');
      console.log('      • quote_sources');
      console.log('      • ai_usage_logs');
      console.log('   2. Check content_queue new columns:');
      console.log('      • pending_since');
      console.log('      • auto_approved');
      console.log('   3. Verify SLA cron job scheduled:');
      console.log('      SELECT * FROM cron.job WHERE jobname = \'sla-autopublish-checker-daily\';');
    } else {
      console.log('\n⚠️  Some migrations failed. See errors above.');
    }

    await client.end();
    console.log('\n🔌 Connection closed.\n');

    process.exit(failCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
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
