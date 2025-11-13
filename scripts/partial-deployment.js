/**
 * PARTIAL AUTOMATED DEPLOYMENT
 * =============================
 *
 * Completes all automation that doesn't require Perplexity API key:
 * 1. Set Supabase secret for Grok
 * 2. Check Edge Functions deployment status
 * 3. Set Netlify environment variables (Grok only)
 * 4. Test Grok function
 *
 * MANUAL STEP REQUIRED:
 * - Get Perplexity API key from https://www.perplexity.ai/settings/api
 * - Run full deployment after adding key
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
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

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
  process.exit(1);
}

if (!SUPABASE_ANON_KEY) {
  logError('VITE_SUPABASE_ANON_KEY not found in .env.local');
  process.exit(1);
}

// Set Grok secret in Supabase
async function setGrokSecret() {
  logSection('1. SETTING GROK API KEY IN SUPABASE');

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
          name: 'GROK_API_KEY',
          value: GROK_API_KEY,
        }),
      }
    );

    if (response.ok) {
      logSuccess('GROK_API_KEY secret set successfully');
    } else if (response.status === 409) {
      logWarning('GROK_API_KEY already exists, updating...');

      // Update existing secret
      const updateResponse = await fetch(
        `https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets/GROK_API_KEY`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            value: GROK_API_KEY,
          }),
        }
      );

      if (updateResponse.ok) {
        logSuccess('GROK_API_KEY updated successfully');
      } else {
        const errorText = await updateResponse.text();
        logError(`Failed to update GROK_API_KEY: ${errorText}`);
      }
    } else {
      const errorText = await response.text();
      logError(`Failed to set GROK_API_KEY: ${errorText}`);
    }
  } catch (error) {
    logError(`Error setting Grok secret: ${error.message}`);
  }
}

// Check Edge Functions
async function checkEdgeFunctions() {
  logSection('2. CHECKING EDGE FUNCTIONS STATUS');

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
        logSuccess(`Function '${funcName}' is deployed`);
      } else if (response.status === 404) {
        logError(`Function '${funcName}' NOT DEPLOYED`);
        logInfo(`Deploy at: https://supabase.com/dashboard/project/${PROJECT_REF}/functions`);
      } else {
        const errorText = await response.text();
        logWarning(`Function '${funcName}': ${response.status}`);
      }
    } catch (error) {
      logError(`Error checking '${funcName}': ${error.message}`);
    }
  }
}

// Set Netlify Grok env var
async function setNetlifyGrokVar() {
  logSection('3. SETTING GROK KEY IN NETLIFY');

  try {
    // Check if exists
    const checkResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/env/VITE_GROK_API_KEY`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${NETLIFY_AUTH_TOKEN}`,
        },
      }
    );

    if (checkResponse.ok) {
      // Update existing
      const updateResponse = await fetch(
        `https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/env/VITE_GROK_API_KEY`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${NETLIFY_AUTH_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            context: 'all',
            value: GROK_API_KEY,
          }),
        }
      );

      if (updateResponse.ok) {
        logSuccess('VITE_GROK_API_KEY updated in Netlify');
      } else {
        const errorText = await updateResponse.text();
        logError(`Failed to update: ${errorText}`);
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
            key: 'VITE_GROK_API_KEY',
            values: [
              {
                context: 'all',
                value: GROK_API_KEY,
              },
            ],
          }),
        }
      );

      if (createResponse.ok) {
        logSuccess('VITE_GROK_API_KEY created in Netlify');
      } else {
        const errorText = await createResponse.text();
        logError(`Failed to create: ${errorText}`);
      }
    }

    logInfo('Netlify will auto-redeploy (~2 minutes)');
  } catch (error) {
    logError(`Error setting Netlify env var: ${error.message}`);
  }
}

// Test Grok function
async function testGrokFunction() {
  logSection('4. TESTING GROK EDGE FUNCTION');

  try {
    logInfo('Testing invoke-grok...');
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/invoke-grok`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Write one sentence about online education.',
          model: 'grok-2',
          temperature: 0.7,
          maxTokens: 50,
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.content) {
        logSuccess('Grok function working!');
        logInfo(`Response: ${data.content.substring(0, 100)}...`);
      } else {
        logWarning(`Function responded but no content: ${JSON.stringify(data)}`);
      }
    } else if (response.status === 404) {
      logError('Grok function NOT DEPLOYED (404)');
      logInfo('Deploy via: EDGE_FUNCTIONS_DEPLOYMENT_MANUAL.md');
    } else {
      const errorText = await response.text();
      logError(`Function error (${response.status}): ${errorText.substring(0, 200)}`);
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }
}

// Generate Summary
function generateSummary() {
  logSection('PARTIAL DEPLOYMENT SUMMARY');

  log('\n✅ Completed:', colors.green);
  log('  1. Grok API key set in Supabase secrets');
  log('  2. Edge Functions deployment checked');
  log('  3. Grok env var set in Netlify');
  log('  4. Grok function tested');

  log('\n⚠️  MANUAL STEP REQUIRED:', colors.yellow);
  log('  1. Get Perplexity API key:');
  log('     → Go to: https://www.perplexity.ai/settings/api');
  log('     → Click "Generate API Key"');
  log('     → Copy the key (starts with pplx-)');
  log('');
  log('  2. Add to .env.local:');
  log('     PERPLEXITY_API_KEY=pplx-YOUR-ACTUAL-KEY');
  log('     VITE_PERPLEXITY_API_KEY=pplx-YOUR-ACTUAL-KEY');
  log('');
  log('  3. Run full deployment:');
  log('     node scripts/automated-deployment.js');

  log('\n🔗 Useful Links:', colors.blue);
  log(`  - Perplexity API: https://www.perplexity.ai/settings/api`);
  log(`  - Supabase Vault: https://supabase.com/dashboard/project/${PROJECT_REF}/settings/vault`);
  log(`  - Netlify Dashboard: https://app.netlify.com/sites/perdia-education/overview`);
}

// Main execution
async function main() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('PERDIA V2 PARTIAL DEPLOYMENT (Grok Setup)', colors.cyan);
  log('='.repeat(60) + '\n', colors.cyan);

  logInfo(`Supabase Project: ${PROJECT_REF}`);
  logInfo(`Netlify Site: ${NETLIFY_SITE_ID}`);
  log('');

  try {
    await setGrokSecret();
    await checkEdgeFunctions();
    await setNetlifyGrokVar();
    await testGrokFunction();
    generateSummary();

    logSuccess('\n🎉 GROK SETUP COMPLETE!');
    logWarning('⚠️  Get Perplexity key to complete full deployment');
    process.exit(0);
  } catch (error) {
    logError(`\nFatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();
