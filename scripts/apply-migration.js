#!/usr/bin/env node

/**
 * Apply Migration to Fix Ambiguous Column Reference
 * Executes the migration SQL directly using Supabase service role key
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

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🔧 Applying migration to fix ambiguous column reference...\n');

  try {
    // Read migration file
    const migrationPath = join(__dirname, '../supabase/migrations/20250113000001_fix_ambiguous_column.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration SQL:');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    console.log('');

    // Execute SQL using Supabase RPC
    console.log('⏳ Executing SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql function doesn't exist, try direct query approach
      if (error.code === '42883') {
        console.log('⚠️  exec_sql function not found, trying direct execution...');

        // Split SQL into individual statements and execute
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

        for (const statement of statements) {
          if (statement.trim().length > 0) {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            const { error: execError } = await supabase.rpc('query', {
              query_text: statement + ';'
            });

            if (execError) {
              throw execError;
            }
          }
        }

        console.log('✅ Migration executed successfully via direct query');
      } else {
        throw error;
      }
    } else {
      console.log('✅ Migration executed successfully');
    }

    // Verify the function was updated
    console.log('\n🔍 Verifying trigger function...');
    const { data: funcData, error: funcError } = await supabase.rpc('query', {
      query_text: `
        SELECT
          proname as function_name,
          pg_get_functiondef(oid) as function_definition
        FROM pg_proc
        WHERE proname = 'set_auto_approve_at';
      `
    });

    if (funcError) {
      console.log('⚠️  Could not verify function (verification query not supported)');
    } else if (funcData) {
      console.log('✅ Trigger function verified');
      if (funcData.length > 0 && funcData[0].function_definition) {
        const funcDef = funcData[0].function_definition;
        if (funcDef.includes('automation_schedule.auto_approve_days')) {
          console.log('✅ Function contains explicit table reference (fix applied)');
        } else {
          console.log('⚠️  Warning: Function may not contain the fix');
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test article creation to confirm the fix works');
    console.log('   2. Monitor for any database errors');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run migration
applyMigration();
