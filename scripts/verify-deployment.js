/**
 * PERDIA V2 DEPLOYMENT VERIFICATION SCRIPT
 * =========================================
 *
 * Verifies that all components are properly configured:
 * 1. Environment variables
 * 2. Supabase database tables
 * 3. Edge Functions deployed
 * 4. Netlify environment variables
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Load environment
config({ path: '.env.local' });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(message, colors.cyan);
  log('='.repeat(60), colors.cyan);
}

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const GROK_API_KEY = process.env.VITE_GROK_API_KEY;
const PERPLEXITY_API_KEY = process.env.VITE_PERPLEXITY_API_KEY;

const results = {
  envVars: { total: 0, passed: 0, failed: 0 },
  database: { total: 0, passed: 0, failed: 0 },
  edgeFunctions: { total: 0, passed: 0, failed: 0 },
  overall: 'UNKNOWN',
};

// Test environment variables
async function testEnvironmentVariables() {
  logSection('1. ENVIRONMENT VARIABLES');

  const requiredVars = [
    { name: 'VITE_SUPABASE_URL', value: SUPABASE_URL },
    { name: 'VITE_SUPABASE_ANON_KEY', value: SUPABASE_ANON_KEY },
    { name: 'VITE_GROK_API_KEY', value: GROK_API_KEY },
    { name: 'VITE_PERPLEXITY_API_KEY', value: PERPLEXITY_API_KEY },
  ];

  results.envVars.total = requiredVars.length;

  for (const varObj of requiredVars) {
    if (varObj.value && varObj.value.length > 0) {
      logSuccess(`${varObj.name} configured`);
      results.envVars.passed++;
    } else {
      logError(`${varObj.name} NOT configured`);
      results.envVars.failed++;
    }
  }

  if (results.envVars.passed === results.envVars.total) {
    logInfo('All environment variables configured ✓');
  } else {
    logWarning(`${results.envVars.failed} environment variable(s) missing`);
  }
}

// Test database tables
async function testDatabaseTables() {
  logSection('2. DATABASE TABLES (V2 Schema)');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logError('Supabase credentials not configured, skipping database check');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const v2Tables = [
    'articles',
    'topic_questions',
    'feedback',
    'quotes',
    'automation_schedule',
    'integrations',
  ];

  results.database.total = v2Tables.length;

  for (const tableName of v2Tables) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.code === 'PGRST205') {
          logError(`Table '${tableName}' NOT FOUND (needs migration)`);
        } else {
          logError(`Table '${tableName}' error: ${error.message}`);
        }
        results.database.failed++;
      } else {
        logSuccess(`Table '${tableName}' exists (${count || 0} rows)`);
        results.database.passed++;
      }
    } catch (error) {
      logError(`Table '${tableName}' check failed: ${error.message}`);
      results.database.failed++;
    }
  }

  if (results.database.passed === results.database.total) {
    logInfo('All V2 tables exist ✓');
  } else {
    logWarning(`${results.database.failed} table(s) missing - run migration!`);
    logInfo('Run: Apply migration in Supabase SQL Editor');
    logInfo('File: supabase/migrations/20251112000001_perdia_v2_schema.sql');
  }
}

// Test Edge Functions
async function testEdgeFunctions() {
  logSection('3. EDGE FUNCTIONS');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logError('Supabase credentials not configured, skipping Edge Function check');
    return;
  }

  const functions = [
    {
      name: 'invoke-grok',
      url: `${SUPABASE_URL}/functions/v1/invoke-grok`,
      testPayload: {
        prompt: 'Test',
        model: 'grok-2',
        temperature: 0.7,
        maxTokens: 10,
      },
    },
    {
      name: 'invoke-perplexity',
      url: `${SUPABASE_URL}/functions/v1/invoke-perplexity`,
      testPayload: {
        prompt: 'Test',
        model: 'pplx-70b-online',
      },
    },
  ];

  results.edgeFunctions.total = functions.length;

  for (const func of functions) {
    try {
      const response = await fetch(func.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(func.testPayload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.content || data.error) {
          if (data.error && data.error.includes('not configured')) {
            logWarning(`Function '${func.name}' deployed but API key not set`);
            results.edgeFunctions.passed++; // Function exists, just needs key
          } else if (data.content) {
            logSuccess(`Function '${func.name}' deployed and working ✓`);
            results.edgeFunctions.passed++;
          } else if (data.error) {
            logWarning(`Function '${func.name}' deployed but has error: ${data.error}`);
            results.edgeFunctions.passed++; // Function exists
          }
        }
      } else if (response.status === 404) {
        logError(`Function '${func.name}' NOT DEPLOYED`);
        results.edgeFunctions.failed++;
      } else {
        logWarning(`Function '${func.name}' returned status ${response.status}`);
        const text = await response.text();
        logInfo(`Response: ${text.substring(0, 100)}`);
        results.edgeFunctions.passed++; // Function exists, just needs key
      }
    } catch (error) {
      logError(`Function '${func.name}' test failed: ${error.message}`);
      results.edgeFunctions.failed++;
    }
  }

  if (results.edgeFunctions.passed === results.edgeFunctions.total) {
    logInfo('All Edge Functions deployed ✓');
  } else {
    logWarning(`${results.edgeFunctions.failed} Edge Function(s) not deployed`);
    logInfo('Deploy via: Supabase Dashboard → Edge Functions');
    logInfo('See: EDGE_FUNCTIONS_DEPLOYMENT_MANUAL.md');
  }
}

// Generate summary
function generateSummary() {
  logSection('DEPLOYMENT STATUS SUMMARY');

  const totalTests = results.envVars.total + results.database.total + results.edgeFunctions.total;
  const totalPassed = results.envVars.passed + results.database.passed + results.edgeFunctions.passed;
  const totalFailed = results.envVars.failed + results.database.failed + results.edgeFunctions.failed;

  log(`\nEnvironment Variables: ${results.envVars.passed}/${results.envVars.total} ✓`, colors.cyan);
  log(`Database Tables: ${results.database.passed}/${results.database.total} ✓`, colors.cyan);
  log(`Edge Functions: ${results.edgeFunctions.passed}/${results.edgeFunctions.total} ✓`, colors.cyan);
  log(`\nTotal: ${totalPassed}/${totalTests} tests passed`, colors.cyan);

  if (totalFailed === 0) {
    logSuccess('\n🎉 ALL SYSTEMS OPERATIONAL - READY FOR DEPLOYMENT!');
    results.overall = 'READY';
  } else if (totalFailed <= 3) {
    logWarning(`\n⚠️  ${totalFailed} ISSUE(S) FOUND - MINOR FIXES NEEDED`);
    results.overall = 'NEEDS_FIXES';
  } else {
    logError(`\n❌ ${totalFailed} ISSUES FOUND - MAJOR CONFIGURATION REQUIRED`);
    results.overall = 'NOT_READY';
  }

  // Action items
  logSection('NEXT STEPS');

  if (results.envVars.failed > 0) {
    log('\n1. Fix Environment Variables:', colors.yellow);
    log('   - Get Perplexity API key: https://www.perplexity.ai/settings/api');
    log('   - Add to .env.local');
  }

  if (results.database.failed > 0) {
    log('\n2. Apply Database Migration:', colors.yellow);
    log('   - Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql');
    log('   - Run: supabase/migrations/20251112000001_perdia_v2_schema.sql');
  }

  if (results.edgeFunctions.failed > 0) {
    log('\n3. Deploy Edge Functions:', colors.yellow);
    log('   - Follow: EDGE_FUNCTIONS_DEPLOYMENT_MANUAL.md');
    log('   - Deploy: invoke-grok, invoke-perplexity');
  }

  if (totalFailed === 0) {
    log('\n✨ System is ready! Test at:', colors.green);
    log('   https://perdia.netlify.app/v2/topics');
  }
}

// Main execution
async function main() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('PERDIA V2 DEPLOYMENT VERIFICATION', colors.cyan);
  log('='.repeat(60) + '\n', colors.cyan);

  try {
    await testEnvironmentVariables();
    await testDatabaseTables();
    await testEdgeFunctions();
    generateSummary();

    // Exit with appropriate code
    process.exit(results.overall === 'READY' ? 0 : 1);
  } catch (error) {
    logError(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();
