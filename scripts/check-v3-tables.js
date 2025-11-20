/**
 * Check V3 Migration Tables Schema
 * Identifies which tables exist and which have user_id column
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://yvvtsfgryweqfppilkvo.supabase.co',
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const V3_TABLES = [
  'clusters',
  'shortcodes',
  'training_data',
  'site_articles',
  'content_ideas',
  'system_settings'
];

async function checkTableSchema(tableName) {
  try {
    // Try to query the table to see if it exists
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01') {
        return { exists: false, error: 'Table does not exist' };
      }
      return { exists: true, error: error.message };
    }

    return { exists: true, count: count || 0 };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function checkColumnExists(tableName, columnName) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = '${tableName}'
        AND column_name = '${columnName}';
      `
    });

    if (error && error.code !== '42883') {
      // Try direct query method
      const { error: testError } = await supabase
        .from(tableName)
        .select(columnName)
        .limit(0);

      if (testError) {
        if (testError.message.includes('column') && testError.message.includes('does not exist')) {
          return false;
        }
      } else {
        return true;
      }
    }

    return data && data.length > 0;
  } catch (err) {
    return false;
  }
}

async function getAllTableColumns(tableName) {
  try {
    // Try to get a single row to see all columns
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      return [];
    }

    if (data && data.length > 0) {
      return Object.keys(data[0]);
    }

    // If no rows, try to insert and rollback to get column info
    // This is just to get schema info
    return [];
  } catch (err) {
    return [];
  }
}

async function checkAllTables() {
  console.log('🔍 Checking V3 Migration Tables Schema\n');
  console.log('=' .repeat(80));

  const results = [];

  for (const tableName of V3_TABLES) {
    console.log(`\n📋 Checking table: ${tableName}`);
    console.log('-'.repeat(80));

    const tableStatus = await checkTableSchema(tableName);

    if (!tableStatus.exists) {
      console.log(`  ❌ Table does NOT exist`);
      console.log(`  Error: ${tableStatus.error}`);
      results.push({
        table: tableName,
        exists: false,
        hasUserId: null,
        columns: []
      });
      continue;
    }

    console.log(`  ✅ Table exists (${tableStatus.count || 0} rows)`);

    // Check for user_id column
    const hasUserId = await checkColumnExists(tableName, 'user_id');
    console.log(`  ${hasUserId ? '✅' : '❌'} Has user_id column: ${hasUserId}`);

    // Get all columns
    const columns = await getAllTableColumns(tableName);
    if (columns.length > 0) {
      console.log(`  📊 Columns found: ${columns.join(', ')}`);
    }

    results.push({
      table: tableName,
      exists: true,
      hasUserId,
      columns,
      rowCount: tableStatus.count
    });
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY\n');

  const existingTables = results.filter(r => r.exists);
  const missingTables = results.filter(r => !r.exists);
  const tablesWithUserId = results.filter(r => r.exists && r.hasUserId);
  const tablesWithoutUserId = results.filter(r => r.exists && !r.hasUserId);

  console.log(`Total V3 tables checked: ${V3_TABLES.length}`);
  console.log(`  ✅ Existing tables: ${existingTables.length}`);
  console.log(`  ❌ Missing tables: ${missingTables.length}`);
  console.log(`  ✅ Tables WITH user_id: ${tablesWithUserId.length}`);
  console.log(`  ❌ Tables WITHOUT user_id: ${tablesWithoutUserId.length}`);

  if (missingTables.length > 0) {
    console.log(`\n❌ Missing tables: ${missingTables.map(t => t.table).join(', ')}`);
  }

  if (tablesWithoutUserId.length > 0) {
    console.log(`\n⚠️  Tables WITHOUT user_id column:`);
    tablesWithoutUserId.forEach(t => {
      console.log(`  - ${t.table} (${t.columns.length} columns: ${t.columns.join(', ')})`);
    });
  }

  // Check if we have existing data that would be affected
  console.log('\n' + '='.repeat(80));
  console.log('🔍 DATA IMPACT ANALYSIS\n');

  const tablesWithData = existingTables.filter(t => t.rowCount && t.rowCount > 0);
  if (tablesWithData.length > 0) {
    console.log('⚠️  WARNING: The following tables contain data and may need special handling:');
    tablesWithData.forEach(t => {
      console.log(`  - ${t.table}: ${t.rowCount} rows`);
    });
  } else {
    console.log('✅ All tables are empty. Safe to drop and recreate.');
  }

  // Recommendations
  console.log('\n' + '='.repeat(80));
  console.log('💡 RECOMMENDATIONS\n');

  if (tablesWithoutUserId.length > 0 && tablesWithData.length === 0) {
    console.log('✅ SAFE TO DROP: All tables are empty. Recommend:');
    console.log('   1. Drop all V3 tables');
    console.log('   2. Re-run migration with corrected schema');
  } else if (tablesWithoutUserId.length > 0 && tablesWithData.length > 0) {
    console.log('⚠️  REQUIRES MIGRATION: Some tables have data. Recommend:');
    console.log('   1. Backup existing data');
    console.log('   2. Add user_id column with ALTER TABLE');
    console.log('   3. Populate user_id from existing records');
  } else {
    console.log('✅ Schema looks correct. The error may be in a different table.');
  }

  return results;
}

checkAllTables()
  .then(() => {
    console.log('\n✅ Schema check complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  });
