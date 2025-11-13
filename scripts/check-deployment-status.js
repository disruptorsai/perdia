/**
 * Check Perdia V2 Deployment Status
 * Verifies database tables, Edge Functions, and configuration
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Checking Perdia V2 Deployment Status...\n');
console.log(`📡 Supabase URL: ${supabaseUrl}`);
console.log(`🔑 Using ${supabaseKey.includes('service_role') ? 'Service Role' : 'Anon'} Key\n`);

// Tables to check
const requiredTables = [
  'articles',
  'topic_questions',
  'feedback',
  'quotes',
  'automation_schedule',
  'integrations'
];

// Edge Functions to check (we'll check indirectly via environment)
const requiredEdgeFunctions = [
  'invoke-grok',
  'invoke-perplexity'
];

// Secrets to check
const requiredSecrets = [
  'GROK_API_KEY',
  'PERPLEXITY_API_KEY'
];

async function checkDeploymentStatus() {
  const results = {
    tables: {},
    edgeFunctions: {},
    secrets: {},
    overall: 'UNKNOWN'
  };

  // 1. Check Database Tables
  console.log('📊 Checking Database Tables...\n');
  for (const table of requiredTables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        results.tables[table] = {
          status: '❌ NOT FOUND',
          error: error.message
        };
        console.log(`  ❌ ${table}: NOT FOUND (${error.message})`);
      } else {
        results.tables[table] = {
          status: '✅ EXISTS',
          recordCount: count || 0
        };
        console.log(`  ✅ ${table}: EXISTS (${count || 0} records)`);
      }
    } catch (err) {
      results.tables[table] = {
        status: '❌ ERROR',
        error: err.message
      };
      console.log(`  ❌ ${table}: ERROR (${err.message})`);
    }
  }

  // 2. Check Edge Functions (indirect check via fetch)
  console.log('\n⚡ Checking Edge Functions...\n');
  for (const func of requiredEdgeFunctions) {
    try {
      const functionUrl = `${supabaseUrl}/functions/v1/${func}`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true })
      });

      if (response.status === 404) {
        results.edgeFunctions[func] = {
          status: '❌ NOT DEPLOYED',
          error: '404 Not Found'
        };
        console.log(`  ❌ ${func}: NOT DEPLOYED (404)`);
      } else if (response.status === 400 || response.status === 200) {
        results.edgeFunctions[func] = {
          status: '✅ DEPLOYED',
          statusCode: response.status
        };
        console.log(`  ✅ ${func}: DEPLOYED (HTTP ${response.status})`);
      } else {
        const text = await response.text();
        results.edgeFunctions[func] = {
          status: '⚠️  UNKNOWN',
          statusCode: response.status,
          response: text.substring(0, 100)
        };
        console.log(`  ⚠️  ${func}: HTTP ${response.status}`);
      }
    } catch (err) {
      results.edgeFunctions[func] = {
        status: '❌ ERROR',
        error: err.message
      };
      console.log(`  ❌ ${func}: ERROR (${err.message})`);
    }
  }

  // 3. Check Environment Variables / Secrets
  console.log('\n🔐 Checking Configuration...\n');
  for (const secret of requiredSecrets) {
    const envValue = process.env[secret] || process.env[`VITE_${secret}`];
    if (envValue && envValue !== `pplx-YOUR-KEY-HERE`) {
      results.secrets[secret] = {
        status: '✅ CONFIGURED',
        hasValue: true
      };
      console.log(`  ✅ ${secret}: CONFIGURED`);
    } else {
      results.secrets[secret] = {
        status: '❌ MISSING',
        hasValue: false
      };
      console.log(`  ❌ ${secret}: MISSING OR PLACEHOLDER`);
    }
  }

  // Determine overall status
  const allTablesExist = Object.values(results.tables).every(t => t.status === '✅ EXISTS');
  const allFunctionsDeployed = Object.values(results.edgeFunctions).every(f => f.status === '✅ DEPLOYED');
  const allSecretsConfigured = Object.values(results.secrets).every(s => s.status === '✅ CONFIGURED');

  if (allTablesExist && allFunctionsDeployed && allSecretsConfigured) {
    results.overall = '✅ FULLY DEPLOYED';
  } else if (allTablesExist) {
    results.overall = '⚠️  PARTIALLY DEPLOYED (Tables OK, Functions/Secrets Incomplete)';
  } else {
    results.overall = '❌ INCOMPLETE DEPLOYMENT';
  }

  // Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 DEPLOYMENT STATUS SUMMARY');
  console.log('='.repeat(60));
  console.log(`\n🎯 Overall Status: ${results.overall}\n`);

  console.log('Database Tables:');
  Object.entries(results.tables).forEach(([name, info]) => {
    console.log(`  ${info.status.split(' ')[0]} ${name}`);
  });

  console.log('\nEdge Functions:');
  Object.entries(results.edgeFunctions).forEach(([name, info]) => {
    console.log(`  ${info.status.split(' ')[0]} ${name}`);
  });

  console.log('\nConfiguration:');
  Object.entries(results.secrets).forEach(([name, info]) => {
    console.log(`  ${info.status.split(' ')[0]} ${name}`);
  });

  console.log('\n' + '='.repeat(60) + '\n');

  // Provide recommendations
  console.log('💡 Recommendations:\n');

  const missingTables = Object.entries(results.tables)
    .filter(([_, info]) => info.status !== '✅ EXISTS')
    .map(([name]) => name);

  if (missingTables.length > 0) {
    console.log(`  📌 Run migrations to create missing tables: ${missingTables.join(', ')}`);
    console.log(`     Command: npm run db:migrate\n`);
  }

  const missingFunctions = Object.entries(results.edgeFunctions)
    .filter(([_, info]) => info.status !== '✅ DEPLOYED')
    .map(([name]) => name);

  if (missingFunctions.length > 0) {
    console.log(`  📌 Deploy missing Edge Functions: ${missingFunctions.join(', ')}`);
    missingFunctions.forEach(func => {
      console.log(`     Command: npx supabase functions deploy ${func} --project-ref yvvtsfgryweqfppilkvo`);
    });
    console.log('');
  }

  const missingSecrets = Object.entries(results.secrets)
    .filter(([_, info]) => info.status !== '✅ CONFIGURED')
    .map(([name]) => name);

  if (missingSecrets.length > 0) {
    console.log(`  📌 Configure missing secrets: ${missingSecrets.join(', ')}`);
    console.log(`     1. Add to .env.local file`);
    console.log(`     2. Deploy to Supabase:`);
    missingSecrets.forEach(secret => {
      console.log(`        npx supabase secrets set ${secret}=your-key --project-ref yvvtsfgryweqfppilkvo`);
    });
    console.log('');
  }

  if (results.overall === '✅ FULLY DEPLOYED') {
    console.log('  🎉 Everything is deployed and configured correctly!\n');
  }

  return results;
}

// Run the check
checkDeploymentStatus()
  .then(() => {
    console.log('✅ Deployment check complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Deployment check failed:', error);
    process.exit(1);
  });
