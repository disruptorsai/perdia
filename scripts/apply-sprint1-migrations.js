/**
 * Apply Sprint 1 Migrations to Supabase Database
 *
 * This script applies the Sprint 1 Production-Ready migrations to the Perdia Supabase database.
 * It connects directly to PostgreSQL using the service role key.
 *
 * Usage: node scripts/apply-sprint1-migrations.js
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

// Supabase connection
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Execute SQL migration file
 */
async function executeMigration(migrationPath, migrationName) {
  console.log(`\n📄 Applying: ${migrationName}`);
  console.log('━'.repeat(60));

  try {
    // Read migration file
    const sql = readFileSync(migrationPath, 'utf8');

    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct query if exec_sql doesn't exist
      console.log('   Trying direct SQL execution...');

      // Split by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement) continue;

        try {
          const { error: stmtError } = await supabase.from('_sql_exec').select('*').limit(0);
          // This is a workaround - we'll use Supabase REST API to execute SQL

          // Actually, let's use the PostgreSQL connection string method
          console.log(`   Statement ${i + 1}/${statements.length}...`);

          // For now, we'll need to use psql or the dashboard
          console.warn('   ⚠️  Direct SQL execution requires psql or Dashboard');
          break;
        } catch (err) {
          console.error(`   ❌ Statement ${i + 1} failed:`, err.message);
        }
      }

      throw error;
    }

    console.log('✅ Migration applied successfully');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);

    if (error.message.includes('does not exist')) {
      console.log('\n💡 SOLUTION:');
      console.log('   This migration requires functions/extensions that don\'t exist yet.');
      console.log('   Please apply this migration via Supabase Dashboard SQL Editor:');
      console.log(`   1. Go to: ${supabaseUrl.replace('supabase.co', 'supabase.co')}/project/yvvtsfgryweqfppilkvo/sql`);
      console.log(`   2. Open: ${migrationPath}`);
      console.log('   3. Copy the SQL content');
      console.log('   4. Paste into SQL Editor and click "Run"');
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
  console.log(`📍 Database: ${supabaseUrl}`);
  console.log('━'.repeat(60));

  const migrations = [
    {
      name: 'Create Missing Functions',
      path: join(projectRoot, 'supabase/migrations/20251110000000_create_missing_functions.sql'),
    },
    {
      name: 'Sprint 1 Production-Ready Schema',
      path: join(projectRoot, 'supabase/migrations/20251110000001_sprint1_production_ready_schema.sql'),
    },
    {
      name: 'Setup SLA Cron Job',
      path: join(projectRoot, 'supabase/migrations/20251110000002_setup_sla_cron_job.sql'),
      requiresServiceKey: true,
    },
  ];

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    if (migration.requiresServiceKey) {
      console.log(`\n⚠️  ${migration.name} requires service role key configuration`);
      console.log('   This migration must be applied manually via Dashboard');
      console.log('   See: supabase/migrations/README.md for instructions');
      continue;
    }

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
  console.log(`⚠️  Manual: 1 (SLA cron job)`);

  if (failCount === 0) {
    console.log('\n🎉 All automatic migrations applied successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Apply SLA cron job manually via Supabase Dashboard');
    console.log('   2. Test Edge Functions:');
    console.log('      npx supabase functions invoke shortcode-transformer');
    console.log('   3. Verify tables created:');
    console.log('      SELECT * FROM shortcode_validation_logs LIMIT 1;');
  } else {
    console.log('\n⚠️  Some migrations failed. See errors above.');
    console.log('   Apply failed migrations manually via Supabase Dashboard.');
  }

  process.exit(failCount > 0 ? 1 : 0);
}

// Run migrations
runMigrations().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
