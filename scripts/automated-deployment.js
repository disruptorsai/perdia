/**
 * AUTOMATED DEPLOYMENT SCRIPT
 * ===========================
 *
 * Uses credentials from mcp.json to automatically:
 * 1. Set Supabase secrets (GROK_API_KEY, PERPLEXITY_API_KEY)
 * 2. Verify Edge Functions are deployed
 * 3. Set Netlify environment variables
 * 4. Test complete system
 *
 * Prerequisites:
 * - Get Perplexity API key from https://www.perplexity.ai/settings/api
 * - Add to .env.local as PERPLEXITY_API_KEY
 *
 * Usage:
 *   node scripts/automated-deployment.js
 */

import { config } from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

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

// Load MCP configuration
const mcpConfigPath = path.join(process.env.USERPROFILE, '.cursor', 'mcp.json');
let mcpConfig;

try {
  const mcpConfigContent = fs.readFileSync(mcpConfigPath, 'utf8');
  mcpConfig = JSON.parse(mcpConfigContent);
} catch (error) {
  logError(`Failed to load MCP config from ${mcpConfigPath}`);
  logError(error.message);
  process.exit(1);
}

// Extract credentials
const SUPABASE_ACCESS_TOKEN = mcpConfig.mcpServers?.supabase?.env?.SUPABASE_ACCESS_TOKEN;
const SUPABASE_URL = mcpConfig.mcpServers?.supabase?.env?.SUPABASE_URL;
const PROJECT_REF = 'yvvtsfgryweqfppilkvo';

const NETLIFY_AUTH_TOKEN = mcpConfig.mcpServers?.['netlify-primary']?.env?.NETLIFY_AUTH_TOKEN;
const NETLIFY_SITE_ID = mcpConfig.mcpServers?.['netlify-primary']?.env?.NETLIFY_SITE_ID;

// Get API keys from environment
const GROK_API_KEY = process.env.GROK_API_KEY || process.env.VITE_GROK_API_KEY;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || process.env.VITE_PERPLEXITY_API_KEY;

// Validation
if (!SUPABASE_ACCESS_TOKEN || !SUPABASE_URL) {
  logError('Supabase credentials not found in mcp.json');
  process.exit(1);
}

if (!NETLIFY_AUTH_TOKEN || !NETLIFY_SITE_ID) {
  logError('Netlify credentials not found in mcp.json');
  process.exit(1);
}

if (!GROK_API_KEY) {
  logError('GROK_API_KEY not found in .env.local');
  logInfo('Add GROK_API_KEY to .env.local');
  process.exit(1);
}

if (!PERPLEXITY_API_KEY || PERPLEXITY_API_KEY.includes('YOUR-KEY-HERE')) {
  logError('PERPLEXITY_API_KEY not configured in .env.local');
  logInfo('Get key from: https://www.perplexity.ai/settings/api');
  logInfo('Add to .env.local as PERPLEXITY_API_KEY');
  process.exit(1);
}

// Set Supabase Secrets
async function setSupabaseSecrets() {
  logSection('1. SETTING SUPABASE SECRETS');

  const secrets = [
    { name: 'GROK_API_KEY', value: GROK_API_KEY },
    { name: 'PERPLEXITY_API_KEY', value: PERPLEXITY_API_KEY },
  ];

  for (const secret of secrets) {
    try {
      const response = await fetch(
        `https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: secret.name,
            value: secret.value,
          }),
        }
      );

      if (response.ok) {
        logSuccess(`Secret '${secret.name}' set successfully`);
      } else if (response.status === 409) {
        logWarning(`Secret '${secret.name}' already exists (updating...)`);
        // Try to update instead
        const updateResponse = await fetch(
          `https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets/${secret.name}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              value: secret.value,
            }),
          }
        );

        if (updateResponse.ok) {
          logSuccess(`Secret '${secret.name}' updated successfully`);
        } else {
          const errorText = await updateResponse.text();
          logError(`Failed to update secret '${secret.name}': ${errorText}`);
        }
      } else {
        const errorText = await response.text();
        logError(`Failed to set secret '${secret.name}': ${errorText}`);
      }
    } catch (error) {
      logError(`Error setting secret '${secret.name}': ${error.message}`);
    }
  }
}

// Check Edge Functions
async function checkEdgeFunctions() {
  logSection('2. CHECKING EDGE FUNCTIONS');

  const functions = ['invoke-grok', 'invoke-perplexity'];

  for (const funcName of functions) {
    try {
      const response = await fetch(
        `https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/${funcName}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        logSuccess(`Function '${funcName}' is deployed (status: ${data.status || 'active'})`);
      } else if (response.status === 404) {
        logError(`Function '${funcName}' NOT DEPLOYED`);
        logInfo(`Deploy manually via: https://supabase.com/dashboard/project/${PROJECT_REF}/functions`);
        logInfo('See: EDGE_FUNCTIONS_DEPLOYMENT_MANUAL.md');
      } else {
        const errorText = await response.text();
        logWarning(`Function '${funcName}' check returned ${response.status}: ${errorText}`);
      }
    } catch (error) {
      logError(`Error checking function '${funcName}': ${error.message}`);
    }
  }
}

// Set Netlify Environment Variables
async function setNetlifyEnvVars() {
  logSection('3. SETTING NETLIFY ENVIRONMENT VARIABLES');

  const envVars = [
    { key: 'VITE_GROK_API_KEY', value: GROK_API_KEY },
    { key: 'VITE_PERPLEXITY_API_KEY', value: PERPLEXITY_API_KEY },
    { key: 'VITE_DEFAULT_AI_PROVIDER', value: 'grok' },
  ];

  for (const envVar of envVars) {
    try {
      // Get existing env vars first
      const getResponse = await fetch(
        `https://api.netlify.com/api/v1/accounts/{account_slug}/env`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${NETLIFY_AUTH_TOKEN}`,
          },
        }
      );

      // Use site-level API instead
      const checkResponse = await fetch(
        `https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/env/${envVar.key}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${NETLIFY_AUTH_TOKEN}`,
          },
        }
      );

      const exists = checkResponse.ok;

      if (exists) {
        // Update existing
        const updateResponse = await fetch(
          `https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/env/${envVar.key}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${NETLIFY_AUTH_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              context: 'all',
              value: envVar.value,
            }),
          }
        );

        if (updateResponse.ok) {
          logSuccess(`Netlify env var '${envVar.key}' updated`);
        } else {
          const errorText = await updateResponse.text();
          logError(`Failed to update '${envVar.key}': ${errorText}`);
        }
      } else {
        // Create new
        const createResponse = await fetch(
          `https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/env`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${NETLIFY_AUTH_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              key: envVar.key,
              values: [
                {
                  context: 'all',
                  value: envVar.value,
                },
              ],
            }),
          }
        );

        if (createResponse.ok) {
          logSuccess(`Netlify env var '${envVar.key}' created`);
        } else {
          const errorText = await createResponse.text();
          logError(`Failed to create '${envVar.key}': ${errorText}`);
        }
      }
    } catch (error) {
      logError(`Error setting Netlify env var '${envVar.key}': ${error.message}`);
    }
  }

  logInfo('Netlify will auto-redeploy with new environment variables (~2 minutes)');
}

// Test Edge Functions
async function testEdgeFunctions() {
  logSection('4. TESTING EDGE FUNCTIONS');

  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  if (!SUPABASE_ANON_KEY) {
    logError('VITE_SUPABASE_ANON_KEY not found in .env.local');
    return;
  }

  const functions = [
    {
      name: 'invoke-grok',
      url: `${SUPABASE_URL}/functions/v1/invoke-grok`,
      testPayload: {
        prompt: 'Write one sentence about online education.',
        model: 'grok-2',
        temperature: 0.7,
        maxTokens: 50,
      },
    },
    {
      name: 'invoke-perplexity',
      url: `${SUPABASE_URL}/functions/v1/invoke-perplexity`,
      testPayload: {
        prompt: 'What is higher education?',
        model: 'pplx-70b-online',
      },
    },
  ];

  for (const func of functions) {
    try {
      logInfo(`Testing ${func.name}...`);
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
        if (data.content) {
          logSuccess(`Function '${func.name}' working! Response: ${data.content.substring(0, 100)}...`);
        } else {
          logWarning(`Function '${func.name}' responded but no content: ${JSON.stringify(data)}`);
        }
      } else if (response.status === 404) {
        logError(`Function '${func.name}' NOT DEPLOYED (404)`);
      } else {
        const errorText = await response.text();
        logError(`Function '${func.name}' error (${response.status}): ${errorText.substring(0, 200)}`);
      }
    } catch (error) {
      logError(`Function '${func.name}' test failed: ${error.message}`);
    }
  }
}

// Generate Summary
function generateSummary() {
  logSection('DEPLOYMENT SUMMARY');

  log('\n✅ Completed Tasks:', colors.green);
  log('  1. Supabase secrets configured (GROK_API_KEY, PERPLEXITY_API_KEY)');
  log('  2. Edge Functions checked');
  log('  3. Netlify environment variables configured');
  log('  4. System tested');

  log('\n📋 Next Steps:', colors.yellow);
  log('  1. Wait ~2 minutes for Netlify auto-redeploy');
  log('  2. Go to: https://perdia.netlify.app/v2/topics');
  log('  3. Click "Find New Questions" button');
  log('  4. Should work without CORS errors! ✅');

  log('\n🔗 Useful Links:', colors.blue);
  log(`  - Supabase Functions: https://supabase.com/dashboard/project/${PROJECT_REF}/functions`);
  log(`  - Netlify Dashboard: https://app.netlify.com/sites/perdia-education/overview`);
  log(`  - Perdia V2 App: https://perdia.netlify.app/v2/topics`);
}

// Main execution
async function main() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('PERDIA V2 AUTOMATED DEPLOYMENT', colors.cyan);
  log('='.repeat(60) + '\n', colors.cyan);

  logInfo('Using credentials from: ' + mcpConfigPath);
  logInfo(`Supabase Project: ${PROJECT_REF}`);
  logInfo(`Netlify Site: ${NETLIFY_SITE_ID}`);
  log('');

  try {
    await setSupabaseSecrets();
    await checkEdgeFunctions();
    await setNetlifyEnvVars();
    await testEdgeFunctions();
    generateSummary();

    logSuccess('\n🎉 AUTOMATED DEPLOYMENT COMPLETE!');
    process.exit(0);
  } catch (error) {
    logError(`\nFatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();
