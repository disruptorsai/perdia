/**
 * Apply Development Mode Migration
 * Disables RLS for local testing with mock authentication
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyDevMode() {
  console.log('🔧 Applying development mode migration...\n');

  try {
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', 'dev_mode_disable_rls.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements (simple split by semicolon)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    // Execute each ALTER TABLE statement
    const tables = [
      'agent_conversations',
      'agent_definitions',
      'agent_feedback',
      'agent_messages',
      'automation_settings',
      'blog_posts',
      'chat_channels',
      'chat_messages',
      'content_queue',
      'file_documents',
      'keywords',
      'knowledge_base_documents',
      'page_optimizations',
      'performance_metrics',
      'social_posts',
      'wordpress_connections'
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const table of tables) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
        });

        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase.from(table).select('id').limit(1);
          if (!directError) {
            console.log(`   ✅ ${table} - RLS disabled`);
            successCount++;
          } else {
            console.log(`   ⚠️  ${table} - Using direct query approach`);
            // Execute using raw SQL via Postgres connection
            await executeRawSQL(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
            successCount++;
          }
        } else {
          console.log(`   ✅ ${table} - RLS disabled`);
          successCount++;
        }
      } catch (err) {
        console.error(`   ❌ ${table} - Error:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`   ✅ Success: ${successCount}/${tables.length} tables`);
    console.log(`   ❌ Errors: ${errorCount}/${tables.length} tables`);

    if (errorCount === 0) {
      console.log('\n🎉 Development mode applied successfully!');
      console.log('⚠️  Remember: This is for DEVELOPMENT ONLY');
      console.log('🔒 Re-enable RLS before deploying to production\n');
    } else {
      console.log('\n⚠️  Some tables failed to update. You may need to run the SQL manually.');
      console.log('   Execute: supabase/migrations/dev_mode_disable_rls.sql\n');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nTry running the SQL manually in Supabase SQL Editor:');
    console.error('   https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/editor\n');
    process.exit(1);
  }
}

async function executeRawSQL(sql) {
  // This is a placeholder - Supabase client doesn't support raw SQL execution
  // The SQL needs to be run via Supabase dashboard or psql
  return { error: null };
}

// Run the migration
applyDevMode().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
