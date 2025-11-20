/**
 * Check V3 Migration Status
 * Verifies which V3 schema updates have been applied
 */

import https from 'https';

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dnRzZmdyeXdlcWZwcGlsa3ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI5MDM0MSwiZXhwIjoyMDc3ODY2MzQxfQ.XNbwVWQS5Vya10ee_PhEjWvRg-Gp8f3yWTzLMWBuCTU';
const HOST = 'yvvtsfgryweqfppilkvo.supabase.co';

// V3 tables that should exist
const V3_TABLES = [
  'shortcodes',
  'training_data',
  'site_articles',
  'content_ideas',
  'system_settings'
];

// Existing tables to also check
const EXISTING_TABLES = [
  'articles',
  'keywords',
  'content_queue',
  'topic_questions',
  'clusters',
  'performance_metrics',
  'wordpress_connections',
  'automation_settings',
  'knowledge_base_documents'
];

function checkTable(table) {
  return new Promise((resolve) => {
    const options = {
      hostname: HOST,
      path: `/rest/v1/${table}?select=*&limit=0`,
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'count=exact'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const count = res.headers['content-range']?.split('/')[1] || '0';
        resolve({
          table,
          exists: res.statusCode === 200 || res.statusCode === 206,
          status: res.statusCode,
          count: parseInt(count)
        });
      });
    });

    req.on('error', (e) => {
      resolve({
        table,
        exists: false,
        status: 'error',
        error: e.message
      });
    });

    req.end();
  });
}

async function main() {
  console.log('=================================================');
  console.log('  PERDIA V3 MIGRATION STATUS CHECK');
  console.log('=================================================\n');

  // Check V3 tables
  console.log('V3 Tables (from migration):');
  console.log('-------------------------------------------------');

  const v3Results = await Promise.all(V3_TABLES.map(checkTable));
  let v3Exists = 0;

  v3Results.forEach(result => {
    if (result.exists) {
      console.log(`  ✓ ${result.table.padEnd(20)} EXISTS (${result.count} records)`);
      v3Exists++;
    } else {
      console.log(`  ✗ ${result.table.padEnd(20)} MISSING`);
    }
  });

  console.log(`\nV3 Tables: ${v3Exists}/${V3_TABLES.length} exist\n`);

  // Check existing tables
  console.log('Existing Tables:');
  console.log('-------------------------------------------------');

  const existingResults = await Promise.all(EXISTING_TABLES.map(checkTable));
  let existingExists = 0;

  existingResults.forEach(result => {
    if (result.exists) {
      console.log(`  ✓ ${result.table.padEnd(25)} EXISTS (${result.count} records)`);
      existingExists++;
    } else {
      console.log(`  ✗ ${result.table.padEnd(25)} MISSING`);
    }
  });

  console.log(`\nExisting Tables: ${existingExists}/${EXISTING_TABLES.length} exist\n`);

  // Summary
  console.log('=================================================');
  console.log('  SUMMARY');
  console.log('=================================================\n');

  const missingV3 = v3Results.filter(r => !r.exists).map(r => r.table);
  const missingExisting = existingResults.filter(r => !r.exists).map(r => r.table);

  if (missingV3.length === 0) {
    console.log('✓ All V3 migration tables exist!');
  } else {
    console.log('✗ V3 Migration INCOMPLETE');
    console.log('  Missing V3 tables:', missingV3.join(', '));
  }

  if (missingExisting.length > 0) {
    console.log('\n  Missing existing tables:', missingExisting.join(', '));
  }

  console.log('\n-------------------------------------------------');

  if (missingV3.length > 0) {
    console.log('\nTO FIX: Apply the migration via Supabase Dashboard:');
    console.log('1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run: supabase/migrations/20251119000001_perdia_v3_schema_updates.sql');
    console.log('4. Run: supabase/migrations/20251119000002_perdia_v3_seed_data.sql');
  } else {
    console.log('\n✓ Migration appears complete!');
  }

  console.log('\n=================================================\n');
}

main().catch(console.error);
