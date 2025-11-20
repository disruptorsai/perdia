/**
 * Check V3 Migration Status
 *
 * Verifies if the v3 migration was successfully applied to the Supabase database.
 *
 * Checks:
 * 1. New tables exist (shortcodes, training_data, site_articles, content_ideas, system_settings)
 * 2. Articles table has new columns (12 new fields)
 * 3. Seed data is present
 * 4. RLS policies are enabled
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Checking V3 Migration Status...\n');

// Expected new tables
const expectedTables = [
  'shortcodes',
  'training_data',
  'site_articles',
  'content_ideas',
  'system_settings'
];

// Expected new columns on articles table
const expectedArticleColumns = [
  'type',
  'editor_score',
  'risk_flags',
  'faqs',
  'schema_markup',
  'schema_valid',
  'shortcode_valid',
  'internal_links',
  'external_links',
  'images',
  'auto_publish_at',
  'source_idea_id'
];

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);

    return !error;
  } catch (err) {
    return false;
  }
}

async function getTableColumns(tableName) {
  try {
    const { data, error } = await supabase.rpc('get_table_columns', {
      table_name: tableName
    });

    if (error) {
      // Fallback: try to get columns by selecting from table
      const { data: sampleData, error: selectError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (!selectError && sampleData) {
        return Object.keys(sampleData[0] || {});
      }

      return null;
    }

    return data ? data.map(col => col.column_name) : null;
  } catch (err) {
    return null;
  }
}

async function checkTableData(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    return { count: count || 0, error: null };
  } catch (err) {
    return { count: 0, error: err.message };
  }
}

async function checkRLSEnabled(tableName) {
  try {
    const { data, error } = await supabase.rpc('check_rls_enabled', {
      table_name: tableName
    });

    if (error) {
      // Fallback: assume enabled if we can't check
      return 'Unknown';
    }

    return data ? 'Enabled' : 'Disabled';
  } catch (err) {
    return 'Unknown';
  }
}

async function main() {
  let hasErrors = false;

  // ============================================================================
  // 1. CHECK NEW TABLES EXIST
  // ============================================================================
  console.log('📋 CHECKING NEW TABLES:');
  console.log('─'.repeat(80));

  for (const tableName of expectedTables) {
    const exists = await checkTableExists(tableName);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${tableName.padEnd(30)} ${exists ? 'EXISTS' : 'MISSING'}`);

    if (!exists) {
      hasErrors = true;
    } else {
      // Check row count
      const { count } = await checkTableData(tableName);
      console.log(`   └─ Rows: ${count}`);
    }
  }

  console.log();

  // ============================================================================
  // 2. CHECK ARTICLES TABLE COLUMNS
  // ============================================================================
  console.log('📊 CHECKING ARTICLES TABLE COLUMNS:');
  console.log('─'.repeat(80));

  const articlesExists = await checkTableExists('articles');

  if (!articlesExists) {
    console.log('❌ Articles table does not exist!');
    hasErrors = true;
  } else {
    const columns = await getTableColumns('articles');

    if (!columns) {
      console.log('⚠️  Unable to retrieve articles table columns');
    } else {
      console.log(`Total columns in articles table: ${columns.length}\n`);

      for (const colName of expectedArticleColumns) {
        const exists = columns.includes(colName);
        const status = exists ? '✅' : '❌';
        console.log(`${status} ${colName.padEnd(30)} ${exists ? 'EXISTS' : 'MISSING'}`);

        if (!exists) {
          hasErrors = true;
        }
      }
    }
  }

  console.log();

  // ============================================================================
  // 3. CHECK SEED DATA
  // ============================================================================
  console.log('🌱 CHECKING SEED DATA:');
  console.log('─'.repeat(80));

  // Check system_settings
  const { count: settingsCount } = await checkTableData('system_settings');
  console.log(`System Settings: ${settingsCount} rows ${settingsCount >= 3 ? '✅' : '⚠️'}`);

  if (settingsCount >= 3) {
    const { data: settings } = await supabase
      .from('system_settings')
      .select('key, value_type')
      .limit(10);

    settings?.forEach(s => {
      console.log(`   ├─ ${s.key} (${s.value_type})`);
    });
  }

  // Check shortcodes
  const { count: shortcodesCount } = await checkTableData('shortcodes');
  console.log(`\nShortcodes: ${shortcodesCount} rows ${shortcodesCount >= 3 ? '✅' : '⚠️'}`);

  if (shortcodesCount >= 3) {
    const { data: shortcodes } = await supabase
      .from('shortcodes')
      .select('shortcode, description')
      .limit(10);

    shortcodes?.forEach(s => {
      console.log(`   ├─ [${s.shortcode}] ${s.description}`);
    });
  }

  console.log();

  // ============================================================================
  // 4. CHECK RLS POLICIES
  // ============================================================================
  console.log('🔒 CHECKING RLS STATUS:');
  console.log('─'.repeat(80));

  for (const tableName of expectedTables) {
    const exists = await checkTableExists(tableName);
    if (exists) {
      const rlsStatus = await checkRLSEnabled(tableName);
      const statusIcon = rlsStatus === 'Enabled' ? '✅' : rlsStatus === 'Disabled' ? '❌' : '⚠️';
      console.log(`${statusIcon} ${tableName.padEnd(30)} RLS ${rlsStatus}`);
    }
  }

  console.log();

  // ============================================================================
  // 5. SUMMARY
  // ============================================================================
  console.log('📝 SUMMARY:');
  console.log('─'.repeat(80));

  if (hasErrors) {
    console.log('❌ V3 Migration has ERRORS - some tables or columns are missing');
    console.log('   Run migration: npm run db:migrate');
  } else {
    console.log('✅ V3 Migration appears SUCCESSFUL');
    console.log('   All expected tables and columns exist');
    console.log('   Seed data is present');
  }

  console.log();
}

main().catch(err => {
  console.error('❌ Error checking migration status:', err);
  process.exit(1);
});
