/**
 * Inspect Articles Table Schema
 *
 * Shows all actual columns in the articles table
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 Inspecting Articles Table Schema...\n');

  // Get a sample row to see all columns
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error querying articles table:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('⚠️  Articles table is empty. Fetching schema via information_schema...\n');

    // Query information_schema
    const { data: schemaData, error: schemaError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'articles'
        ORDER BY ordinal_position;
      `
    });

    if (schemaError) {
      console.error('❌ Error querying schema:', schemaError.message);

      // Fallback: use raw SQL query via service role
      console.log('\nTrying direct SQL query...\n');

      const { data: sqlData, error: sqlError } = await supabase
        .from('articles')
        .select('*')
        .limit(0);

      if (sqlError) {
        console.error('❌ SQL Error:', sqlError.message);
        process.exit(1);
      }

      console.log('Table exists but schema query failed.');
      console.log('This likely means RLS is blocking the query.');
    } else {
      console.log('📊 Articles Table Columns:\n');
      console.log('─'.repeat(100));
      console.log('Column Name                      Type                 Nullable    Default');
      console.log('─'.repeat(100));

      schemaData?.forEach(col => {
        console.log(
          `${col.column_name.padEnd(32)} ${col.data_type.padEnd(20)} ${col.is_nullable.padEnd(11)} ${(col.column_default || 'NULL').substring(0, 30)}`
        );
      });

      console.log('─'.repeat(100));
      console.log(`\nTotal Columns: ${schemaData?.length || 0}\n`);
    }
  } else {
    const columns = Object.keys(data[0]);

    console.log('📊 Articles Table Columns (from sample row):\n');
    console.log('─'.repeat(80));

    columns.forEach((col, idx) => {
      const value = data[0][col];
      const type = typeof value;
      console.log(`${(idx + 1).toString().padStart(3)}. ${col.padEnd(35)} (${type})`);
    });

    console.log('─'.repeat(80));
    console.log(`\nTotal Columns: ${columns.length}\n`);
  }
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
