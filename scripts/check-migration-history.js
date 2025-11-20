/**
 * Check Migration History
 *
 * Shows which migrations have been applied to the database
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
  console.log('🔍 Checking Migration History...\n');

  // Check if schema_migrations table exists
  const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'schema_migrations';
    `
  });

  if (tablesError) {
    console.log('⚠️  Unable to query schema_migrations table');
    console.log('   This table may not exist in Supabase by default\n');

    // Try alternate approach: check supabase_migrations table
    const { data: supabaseMigrations, error: supabaseMigrationsError } = await supabase
      .from('supabase_migrations')
      .select('*')
      .order('version', { ascending: true });

    if (supabaseMigrationsError) {
      console.log('⚠️  supabase_migrations table also not accessible');
      console.log('   Error:', supabaseMigrationsError.message);
      console.log('\n❌ Cannot determine migration history\n');
      return;
    }

    console.log('📋 Applied Migrations (from supabase_migrations):\n');
    console.log('─'.repeat(80));

    if (!supabaseMigrations || supabaseMigrations.length === 0) {
      console.log('No migrations found in supabase_migrations table');
    } else {
      supabaseMigrations.forEach((migration, idx) => {
        console.log(`${(idx + 1).toString().padStart(3)}. ${migration.version || migration.name || 'Unknown'}`);
        if (migration.statements) {
          console.log(`     Statements: ${migration.statements.length}`);
        }
      });
    }

    console.log('─'.repeat(80));
    console.log(`\nTotal Migrations: ${supabaseMigrations?.length || 0}\n`);

    return;
  }

  // If schema_migrations exists
  const { data: migrations, error: migrationsError } = await supabase
    .from('schema_migrations')
    .select('*')
    .order('version', { ascending: true });

  if (migrationsError) {
    console.error('❌ Error querying migrations:', migrationsError.message);
    return;
  }

  console.log('📋 Applied Migrations:\n');
  console.log('─'.repeat(80));

  if (!migrations || migrations.length === 0) {
    console.log('No migrations found');
  } else {
    migrations.forEach((migration, idx) => {
      console.log(`${(idx + 1).toString().padStart(3)}. ${migration.version}`);
      if (migration.dirty) {
        console.log('     ⚠️  DIRTY (migration failed or partially applied)');
      }
    });
  }

  console.log('─'.repeat(80));
  console.log(`\nTotal Migrations: ${migrations?.length || 0}\n`);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
