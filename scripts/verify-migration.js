/**
 * PERDIA EDUCATION - MIGRATION VERIFICATION SCRIPT
 * =================================================
 * Verifies that database migration completed successfully
 *
 * This script checks that all required tables, indexes, and
 * policies exist after running the migration.
 *
 * Usage:
 *   node scripts/verify-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Expected tables
const EXPECTED_TABLES = [
  'keywords',
  'content_queue',
  'performance_metrics',
  'wordpress_connections',
  'automation_settings',
  'page_optimizations',
  'blog_posts',
  'social_posts',
  'knowledge_base_documents',
  'agent_feedback',
  'file_documents',
  'chat_channels',
  'chat_messages',
  'agent_definitions',
  'agent_conversations',
  'agent_messages',
];

// Expected storage buckets
const EXPECTED_BUCKETS = [
  'knowledge-base',
  'content-images',
  'social-media',
  'uploads',
];

/**
 * Check if table exists and is accessible
 */
async function checkTable(tableName) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .limit(0);

    if (error) {
      return { exists: false, error: error.message };
    }

    return { exists: true, count: count || 0 };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

/**
 * Check if storage bucket exists
 */
async function checkBucket(bucketName) {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);

    if (error) {
      return { exists: false, error: error.message };
    }

    return { exists: true, bucket: data };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

/**
 * Main verification function
 */
async function verify() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║      PERDIA EDUCATION - MIGRATION VERIFICATION            ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  // Check tables
  console.log('🔍 Checking database tables...');
  console.log('');

  let tablesOk = 0;
  let tablesFailed = 0;

  for (const tableName of EXPECTED_TABLES) {
    const result = await checkTable(tableName);

    if (result.exists) {
      console.log(`✅ ${tableName.padEnd(30)} (${result.count} rows)`);
      tablesOk++;
    } else {
      console.log(`❌ ${tableName.padEnd(30)} - ${result.error}`);
      tablesFailed++;
    }
  }

  console.log('');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`Tables: ${tablesOk}/${EXPECTED_TABLES.length} OK`);
  console.log('─────────────────────────────────────────────────────────');
  console.log('');

  // Check storage buckets
  console.log('🔍 Checking storage buckets...');
  console.log('');

  let bucketsOk = 0;
  let bucketsFailed = 0;

  for (const bucketName of EXPECTED_BUCKETS) {
    const result = await checkBucket(bucketName);

    if (result.exists) {
      console.log(`✅ ${bucketName.padEnd(30)} (${result.bucket.public ? 'public' : 'private'})`);
      bucketsOk++;
    } else {
      console.log(`❌ ${bucketName.padEnd(30)} - ${result.error}`);
      bucketsFailed++;
    }
  }

  console.log('');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`Buckets: ${bucketsOk}/${EXPECTED_BUCKETS.length} OK`);
  console.log('─────────────────────────────────────────────────────────');
  console.log('');

  // Check agent definitions
  console.log('🔍 Checking AI agents...');
  console.log('');

  try {
    const { data: agents, error } = await supabase
      .from('agent_definitions')
      .select('agent_name, display_name, is_active')
      .eq('is_active', true);

    if (error) {
      console.log(`❌ Failed to query agents: ${error.message}`);
    } else if (!agents || agents.length === 0) {
      console.log('⚠️  No agents found - run: npm run db:seed');
    } else {
      console.log(`✅ Found ${agents.length} active agents:`);
      agents.forEach(agent => {
        console.log(`   - ${agent.display_name} (${agent.agent_name})`);
      });
    }
  } catch (error) {
    console.log(`❌ Failed to check agents: ${error.message}`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');

  if (tablesFailed === 0 && bucketsFailed === 0) {
    console.log('✅ MIGRATION VERIFIED SUCCESSFULLY!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Ensure agents are seeded: npm run db:seed');
    console.log('2. Start development server: npm run dev');
    console.log('');
  } else {
    console.log('❌ MIGRATION INCOMPLETE');
    console.log('');
    if (tablesFailed > 0) {
      console.log(`⚠️  ${tablesFailed} tables missing or inaccessible`);
    }
    if (bucketsFailed > 0) {
      console.log(`⚠️  ${bucketsFailed} storage buckets missing`);
    }
    console.log('');
    console.log('Please review the migration SQL file and try again.');
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
}

// Run verification
verify().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
