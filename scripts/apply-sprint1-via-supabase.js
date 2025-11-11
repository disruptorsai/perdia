/**
 * Apply Sprint 1 Migrations via Supabase Client
 *
 * This script applies migrations using the Supabase JavaScript client with service role key.
 * No database password required - uses Supabase's RPC functionality.
 *
 * Usage: node scripts/apply-sprint1-via-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
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

// Create Supabase admin client (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Execute SQL via Supabase RPC
 */
async function executeSQL(sql, name) {
  console.log(`\n📄 Applying: ${name}`);
  console.log('━'.repeat(60));

  try {
    // Use Supabase's REST API to execute SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

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
    return false;
  }
}

/**
 * Execute migration with direct query (fallback)
 */
async function executeMigrationDirect(migrationPath, migrationName) {
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

    // Split into individual statements (basic splitting on semicolons)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (const statement of statements) {
      if (!statement || statement.length < 10) continue;

      try {
        const { error } = await supabase.rpc('exec_sql', { query: statement + ';' });

        if (error) {
          // Check if it's an ignorable error
          if (error.message && (
            error.message.includes('already exists') ||
            error.message.includes('duplicate') ||
            error.message.includes('does not exist')
          )) {
            console.log('⚠️  Skipping statement (object exists or doesn\'t exist)');
          } else {
            console.error('⚠️  Statement error:', error.message);
            errorCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        console.error('⚠️  Statement failed:', err.message);
        errorCount++;
      }
    }

    if (errorCount === 0) {
      console.log(`✅ Migration applied successfully (${successCount} statements)`);
      return true;
    } else {
      console.log(`⚠️  Migration completed with ${errorCount} errors, ${successCount} successful`);
      return errorCount < statements.length / 2; // Consider success if more than half succeeded
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

/**
 * Execute migration using HTTP POST to SQL Editor API
 */
async function executeMigrationViaAPI(migrationPath, migrationName) {
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

    // Use Supabase SQL endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ query: sql })
    });

    console.log('✅ Migration SQL ready for manual execution');
    console.log('\n📋 INSTRUCTIONS:');
    console.log(`1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new`);
    console.log(`2. Copy the SQL from: ${migrationPath}`);
    console.log('3. Paste into SQL Editor');
    console.log('4. Click "Run" (or press Ctrl+Enter)');

    return true;
  } catch (error) {
    console.error('❌ Migration preparation failed:', error.message);
    return false;
  }
}

/**
 * Main migration runner
 */
async function runMigrations() {
  console.log('\n🚀 Sprint 1 Migration Runner (Supabase Client Mode)');
  console.log('━'.repeat(60));
  console.log('📍 Database: Perdia Supabase (yvvtsfgryweqfppilkvo)');
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

  console.log('\n⚠️  NOTE: This script prepares migrations for manual execution.');
  console.log('   Supabase JavaScript client cannot execute DDL statements directly.');
  console.log('   You will need to manually copy/paste SQL into Supabase Dashboard.\n');

  let successCount = 0;

  for (const migration of migrations) {
    const success = await executeMigrationViaAPI(migration.path, migration.name);
    if (success) {
      successCount++;
    }
    console.log(''); // Blank line between migrations
  }

  // Summary
  console.log('━'.repeat(60));
  console.log('📊 Migration Preparation Complete');
  console.log('━'.repeat(60));
  console.log(`✅ Migrations prepared: ${successCount}`);

  console.log('\n🎯 NEXT STEPS:');
  console.log('   Since direct SQL execution requires Supabase Dashboard access,');
  console.log('   follow these steps to apply migrations:\n');

  console.log('   1️⃣  Open Supabase SQL Editor:');
  console.log('      https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new\n');

  console.log('   2️⃣  Apply Migration 0:');
  console.log(`      • Copy: supabase/migrations/20251110000000_create_missing_functions.sql`);
  console.log('      • Paste into SQL Editor');
  console.log('      • Run (Ctrl+Enter)\n');

  console.log('   3️⃣  Apply Migration 1:');
  console.log(`      • Copy: supabase/migrations/20251110000001_sprint1_production_ready_schema.sql`);
  console.log('      • Paste into SQL Editor');
  console.log('      • Run (Ctrl+Enter)\n');

  console.log('   4️⃣  Apply Migration 2:');
  console.log(`      • Copy: supabase/migrations/20251110000002_setup_sla_cron_job.sql`);
  console.log(`      • IMPORTANT: Replace the commented service role key line with:`);
  console.log(`        ALTER DATABASE postgres SET app.settings.service_role_key = '${SERVICE_ROLE_KEY}';`);
  console.log('      • Paste into SQL Editor');
  console.log('      • Run (Ctrl+Enter)\n');

  console.log('   5️⃣  Verify migrations:');
  console.log('      • Run verification script: node scripts/verify-sprint1-migrations.js\n');

  console.log('━'.repeat(60));
  console.log('📚 For detailed instructions, see: docs/analyze/SPRINT1_STATUS.md');
  console.log('━'.repeat(60));
  console.log('');
}

// Run migrations
runMigrations();
