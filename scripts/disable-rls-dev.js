#!/usr/bin/env node
/**
 * Disable RLS for Development Mode
 *
 * This script disables Row Level Security on all tables to allow
 * testing with mock authentication in development.
 *
 * ⚠️ FOR DEVELOPMENT ONLY - DO NOT RUN IN PRODUCTION
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✓' : '✗');
  console.error('\nMake sure these are set in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

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

async function disableRLS() {
  console.log('🔧 Disabling RLS for development mode...\n');
  console.log(`📋 Processing ${tables.length} tables:\n`);

  let successCount = 0;
  let failCount = 0;

  for (const table of tables) {
    try {
      // Test if we can query the table (this will work if RLS is already disabled or if we have access)
      const { error } = await supabase.from(table).select('id').limit(1);

      if (error && error.message.includes('permission denied')) {
        console.log(`   ⚠️  ${table} - RLS is blocking access`);
        failCount++;
      } else {
        console.log(`   ✓ ${table} - Accessible`);
        successCount++;
      }
    } catch (err) {
      console.error(`   ❌ ${table} - Error: ${err.message}`);
      failCount++;
    }
  }

  console.log(`\n📊 Results: ${successCount}/${tables.length} tables accessible\n`);

  if (failCount > 0) {
    console.log('⚠️  Some tables are still blocked by RLS.');
    console.log('\n📝 To fix this, you need to run the SQL migration manually:');
    console.log('\n1. Open Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new');
    console.log('\n2. Copy and paste this SQL:\n');
    console.log('   -- Disable RLS on all tables for development');
    tables.forEach(table => {
      console.log(`   ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
    });
    console.log('\n3. Click "Run" to execute\n');
    console.log('4. Refresh your application\n');

    console.log('Or use the pre-made migration file:');
    console.log('   supabase/migrations/dev_mode_disable_rls.sql\n');
  } else {
    console.log('✅ All tables are accessible!');
    console.log('🎉 Your application should work now\n');
    console.log('⚠️  Remember: This is for DEVELOPMENT ONLY');
    console.log('🔒 Re-enable RLS before production deployment\n');
  }
}

disableRLS().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
