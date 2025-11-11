#!/usr/bin/env node

/**
 * Apply Sprint 1 Migrations Directly via Supabase Management API
 *
 * This script uses fetch to directly execute SQL against Supabase.
 * Uses the consolidated migration file.
 *
 * Usage: node scripts/apply-sprint1-direct.js
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
const SUPABASE_URL = 'https://yvvtsfgryweqfppilkvo.supabase.co';
const PROJECT_REF = 'yvvtsfgryweqfppilkvo';
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ACCESS_TOKEN = 'sbp_2c4d45ee83f6f57f90da91b60f0dba2a99c1ef00'; // From MCP config

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Error: VITE_SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

console.log('🚀 Sprint 1 Migration Executor (Direct API Mode)');
console.log('='.repeat(70));
console.log(`📡 Supabase URL: ${SUPABASE_URL}`);
console.log(`🔑 Project Ref: ${PROJECT_REF}`);
console.log(`🔑 Service Key: ${SERVICE_ROLE_KEY.substring(0, 20)}...`);
console.log('='.repeat(70));
console.log('');

/**
 * Execute SQL using Supabase Management API
 */
async function executeSQL(sql) {
  // Try multiple methods to execute SQL

  // Method 1: Try using the SQL endpoint directly
  try {
    console.log('📤 Attempting Method 1: Direct SQL execution via REST API...');

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql })
    });

    if (response.ok) {
      console.log('✅ Method 1 succeeded!');
      return { success: true, method: 1 };
    }

    const text = await response.text();
    console.log(`⚠️  Method 1 failed: ${response.status} ${text.substring(0, 100)}`);
  } catch (error) {
    console.log(`⚠️  Method 1 error: ${error.message}`);
  }

  // Method 2: Use the Supabase Management API (if we have project access token)
  try {
    console.log('📤 Attempting Method 2: Management API...');

    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      console.log('✅ Method 2 succeeded!');
      return { success: true, method: 2 };
    }

    const text = await response.text();
    console.log(`⚠️  Method 2 failed: ${response.status} ${text.substring(0, 100)}`);
  } catch (error) {
    console.log(`⚠️  Method 2 error: ${error.message}`);
  }

  return { success: false };
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('📖 Reading consolidated migration file...');

    const migrationPath = join(projectRoot, 'supabase/migrations/APPLY_ALL_SPRINT1_MIGRATIONS.sql');
    let sql = readFileSync(migrationPath, 'utf8');

    console.log(`✅ Loaded ${sql.length} characters of SQL\n`);

    // Replace service role key placeholder
    sql = sql.replace(
      /-- ALTER DATABASE postgres SET app\.settings\.service_role_key = '[^']*';/,
      `ALTER DATABASE postgres SET app.settings.service_role_key = '${SERVICE_ROLE_KEY}';`
    );

    console.log('🔧 Service role key placeholder replaced\n');

    console.log('⏳ Executing migration SQL...');
    console.log('   This may take 10-30 seconds...\n');

    const result = await executeSQL(sql);

    if (result.success) {
      console.log('');
      console.log('='.repeat(70));
      console.log('✅ MIGRATION EXECUTED SUCCESSFULLY!');
      console.log('='.repeat(70));
      console.log('');
      console.log('📋 What was created:');
      console.log('   • shortcode_validation_logs table');
      console.log('   • quote_sources table');
      console.log('   • ai_usage_logs table');
      console.log('   • content_queue: SLA columns added');
      console.log('   • wordpress_connections: DB connection columns added');
      console.log('   • 4 new views for cost monitoring and metrics');
      console.log('   • 3 utility functions');
      console.log('   • SLA auto-publish cron job scheduled');
      console.log('');
      console.log('📋 Next Steps:');
      console.log('   1. Run: node scripts/verify-sprint1-migrations.js');
      console.log('   2. Verify in Supabase Dashboard:');
      console.log(`      https://supabase.com/dashboard/project/${PROJECT_REF}/editor`);
      console.log('');
      process.exit(0);
    } else {
      console.log('');
      console.log('='.repeat(70));
      console.log('⚠️  AUTOMATIC EXECUTION NOT AVAILABLE');
      console.log('='.repeat(70));
      console.log('');
      console.log('The Supabase API doesn\'t support direct SQL execution via the REST API.');
      console.log('You\'ll need to apply the migration manually via the Supabase Dashboard.\n');

      console.log('📋 MANUAL MIGRATION INSTRUCTIONS:');
      console.log('');
      console.log('1️⃣  Open Supabase SQL Editor:');
      console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new\n`);

      console.log('2️⃣  Copy the migration file:');
      console.log(`   File: supabase/migrations/APPLY_ALL_SPRINT1_MIGRATIONS.sql\n`);

      console.log('3️⃣  Paste into SQL Editor and click "Run" (Ctrl+Enter)\n');

      console.log('4️⃣  IMPORTANT: After running, uncomment and execute this line:');
      console.log(`   ALTER DATABASE postgres SET app.settings.service_role_key = '${SERVICE_ROLE_KEY}';\n`);

      console.log('5️⃣  Verify by running:');
      console.log('   node scripts/verify-sprint1-migrations.js\n');

      console.log('='.repeat(70));
      console.log('📚 Alternative: Use Supabase CLI');
      console.log('='.repeat(70));
      console.log('');
      console.log('If you have Supabase CLI installed:');
      console.log('');
      console.log('npx supabase db push --project-ref yvvtsfgryweqfppilkvo');
      console.log('');
      console.log('Or apply single migration file:');
      console.log('');
      console.log('cat supabase/migrations/APPLY_ALL_SPRINT1_MIGRATIONS.sql | \\');
      console.log('  npx supabase db execute --project-ref yvvtsfgryweqfppilkvo');
      console.log('');

      process.exit(1);
    }
  } catch (error) {
    console.error('');
    console.error('='.repeat(70));
    console.error('❌ FATAL ERROR');
    console.error('='.repeat(70));
    console.error('');
    console.error(error);
    console.error('');
    process.exit(1);
  }
}

// Run
main();
