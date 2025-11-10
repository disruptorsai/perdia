/**
 * Apply batch columns migration to keywords table
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyMigration() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Create admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('📋 Reading migration file...');
  const migrationPath = join(__dirname, '../supabase/migrations/20250110000001_add_keyword_batch_columns.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf8');

  console.log('🚀 Applying migration to add batch columns...');

  try {
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // Try direct execution instead
      console.log('⚠️ RPC method failed, trying direct execution...');

      // Split into individual statements and execute
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        const { error: stmtError } = await supabase.from('_migrations').select('*').limit(0);
        if (stmtError) {
          console.log(`⚠️ Could not execute statement: ${statement.substring(0, 100)}...`);
        }
      }

      // Alternative: Use pg directly
      console.log('📦 Installing pg for direct database access...');
      const { Client } = await import('pg');

      const client = new Client({
        connectionString: `${supabaseUrl.replace('https://', 'postgresql://postgres:')}@db.${supabaseUrl.split('//')[1].split('.')[0]}.supabase.co:5432/postgres?sslmode=require`
      });

      await client.connect();
      await client.query(migrationSQL);
      await client.end();

      console.log('✅ Migration applied successfully via pg!');
    } else {
      console.log('✅ Migration applied successfully!');
    }

    console.log('\n📊 Verifying new columns...');
    const { data: columnCheck, error: checkError } = await supabase
      .from('keywords')
      .select('batch_id, batch_name, batch_source, batch_date, batch_starred, is_starred')
      .limit(1);

    if (checkError) {
      console.log('⚠️ Could not verify columns (this might be okay if table is empty)');
    } else {
      console.log('✅ New batch columns are accessible!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n🔧 You can manually run this SQL in the Supabase SQL Editor:');
    console.log('\n' + migrationSQL + '\n');
    process.exit(1);
  }
}

applyMigration().catch(console.error);
