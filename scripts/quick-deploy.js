/**
 * QUICK DEPLOYMENT SCRIPT
 * ========================
 *
 * Interactive script that:
 * 1. Prompts for Perplexity API key
 * 2. Updates .env.local automatically
 * 3. Provides manual steps for Supabase/Netlify (API limitations)
 * 4. Tests everything
 *
 * Usage:
 *   node scripts/quick-deploy.js
 */

import { config } from 'dotenv';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
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
  log(`\n${'='.repeat(70)}`, colors.cyan);
  log(message, colors.cyan + colors.bold);
  log('='.repeat(70), colors.cyan);
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

// Main deployment function
async function main() {
  log('\n' + '='.repeat(70), colors.cyan);
  log('PERDIA V2 QUICK DEPLOYMENT', colors.cyan + colors.bold);
  log('='.repeat(70) + '\n', colors.cyan);

  logInfo('This script will help you complete the Perdia V2 deployment.');
  logInfo('It will guide you through each step interactively.\n');

  // Load current .env.local
  const envPath = path.join(__dirname, '..', '.env.local');
  let envContent;

  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    logError(`Failed to read .env.local: ${error.message}`);
    process.exit(1);
  }

  // Check if Perplexity key is already set
  const hasPerplexityKey = envContent.match(/PERPLEXITY_API_KEY=pplx-[a-zA-Z0-9]+/);

  if (hasPerplexityKey) {
    logSuccess('Perplexity API key already configured in .env.local');
  } else {
    logSection('STEP 1: ADD PERPLEXITY API KEY');

    logInfo('You mentioned you have the Perplexity API key.');
    logInfo('Please paste it below (starts with pplx-):\n');

    const perplexityKey = await question('Perplexity API Key: ');

    if (!perplexityKey || !perplexityKey.startsWith('pplx-')) {
      logError('Invalid Perplexity API key. Must start with "pplx-"');
      logInfo('Get your key from: https://www.perplexity.ai/settings/api');
      rl.close();
      process.exit(1);
    }

    // Update .env.local
    envContent = envContent.replace(
      /PERPLEXITY_API_KEY=pplx-YOUR-KEY-HERE/g,
      `PERPLEXITY_API_KEY=${perplexityKey}`
    );
    envContent = envContent.replace(
      /VITE_PERPLEXITY_API_KEY=pplx-YOUR-KEY-HERE/g,
      `VITE_PERPLEXITY_API_KEY=${perplexityKey}`
    );

    fs.writeFileSync(envPath, envContent, 'utf8');
    logSuccess('Perplexity API key added to .env.local ✓');
  }

  // Reload environment with new key
  config({ path: envPath, override: true });

  const GROK_API_KEY = process.env.GROK_API_KEY || process.env.VITE_GROK_API_KEY;
  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || process.env.VITE_PERPLEXITY_API_KEY;

  logSection('STEP 2: MANUAL SUPABASE SECRETS SETUP');

  log('\n📋 You need to add 2 secrets to Supabase vault:\n', colors.yellow);

  log('1. Open this URL in your browser:', colors.blue);
  log('   https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/vault\n');

  log('2. Click "New secret" and add:', colors.blue);
  log(`   Name: GROK_API_KEY`);
  log(`   Secret: ${GROK_API_KEY}\n`);

  log('3. Click "New secret" again and add:', colors.blue);
  log(`   Name: PERPLEXITY_API_KEY`);
  log(`   Secret: ${PERPLEXITY_API_KEY}\n`);

  const supabaseReady = await question('✅ Have you added both secrets to Supabase? (yes/no): ');

  if (supabaseReady.toLowerCase() !== 'yes' && supabaseReady.toLowerCase() !== 'y') {
    logWarning('Please add the Supabase secrets first, then run this script again.');
    rl.close();
    process.exit(0);
  }

  logSection('STEP 3: MANUAL EDGE FUNCTIONS DEPLOYMENT');

  log('\n📋 You need to deploy 2 Edge Functions:\n', colors.yellow);

  log('1. Open this URL in your browser:', colors.blue);
  log('   https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/functions\n');

  log('2. Follow the deployment guide:', colors.blue);
  log('   - Open: DEPLOYMENT_STATUS_REPORT.md');
  log('   - Go to: "Task 3: Deploy Edge Functions"');
  log('   - Copy/paste the code for invoke-grok');
  log('   - Copy/paste the code for invoke-perplexity\n');

  logInfo('💡 TIP: You can keep DEPLOYMENT_STATUS_REPORT.md open in another window');
  logInfo('    and copy/paste the function code from there.\n');

  const functionsReady = await question('✅ Have you deployed both Edge Functions? (yes/no): ');

  if (functionsReady.toLowerCase() !== 'yes' && functionsReady.toLowerCase() !== 'y') {
    logWarning('Please deploy the Edge Functions first, then run this script again.');
    rl.close();
    process.exit(0);
  }

  logSection('STEP 4: MANUAL NETLIFY ENVIRONMENT VARIABLES');

  log('\n📋 You need to add 3 environment variables to Netlify:\n', colors.yellow);

  log('1. Open this URL in your browser:', colors.blue);
  log('   https://app.netlify.com/sites/perdia-education/settings/deploys#environment-variables\n');

  log('2. Click "Add a variable" and add each of these:\n', colors.blue);

  log('   Variable 1:');
  log(`   Key: VITE_GROK_API_KEY`);
  log(`   Value: ${GROK_API_KEY}\n`);

  log('   Variable 2:');
  log(`   Key: VITE_PERPLEXITY_API_KEY`);
  log(`   Value: ${PERPLEXITY_API_KEY}\n`);

  log('   Variable 3:');
  log(`   Key: VITE_DEFAULT_AI_PROVIDER`);
  log(`   Value: grok\n`);

  const netlifyReady = await question('✅ Have you added all 3 Netlify variables? (yes/no): ');

  if (netlifyReady.toLowerCase() !== 'yes' && netlifyReady.toLowerCase() !== 'y') {
    logWarning('Please add the Netlify variables first, then run this script again.');
    rl.close();
    process.exit(0);
  }

  logSection('STEP 5: WAITING FOR NETLIFY REDEPLOY');

  logInfo('Netlify automatically redeploys when you add environment variables.');
  logInfo('This usually takes about 2 minutes.\n');

  log('Check deployment status at:', colors.blue);
  log('https://app.netlify.com/sites/perdia-education/deploys\n');

  const deployComplete = await question('✅ Is the latest deploy "Published"? (yes/no): ');

  if (deployComplete.toLowerCase() !== 'yes' && deployComplete.toLowerCase() !== 'y') {
    logWarning('Wait for the deployment to complete, then run this script again.');
    rl.close();
    process.exit(0);
  }

  logSection('STEP 6: TESTING DEPLOYMENT');

  logInfo('Running verification tests...\n');

  // Test Edge Functions
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logError('Supabase credentials not found in .env.local');
    rl.close();
    process.exit(1);
  }

  const testFunctions = async () => {
    const functions = [
      {
        name: 'invoke-grok',
        url: `${SUPABASE_URL}/functions/v1/invoke-grok`,
        payload: {
          prompt: 'Write one sentence about online education.',
          model: 'grok-2',
          maxTokens: 50,
        },
      },
      {
        name: 'invoke-perplexity',
        url: `${SUPABASE_URL}/functions/v1/invoke-perplexity`,
        payload: {
          prompt: 'What is higher education?',
          model: 'pplx-70b-online',
        },
      },
    ];

    let allPassed = true;

    for (const func of functions) {
      try {
        const response = await fetch(func.url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(func.payload),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.content) {
            logSuccess(`${func.name}: Working! ✓`);
          } else {
            logWarning(`${func.name}: Responded but no content`);
            allPassed = false;
          }
        } else {
          const errorText = await response.text();
          logError(`${func.name}: ${response.status} - ${errorText.substring(0, 100)}`);
          allPassed = false;
        }
      } catch (error) {
        logError(`${func.name}: ${error.message}`);
        allPassed = false;
      }
    }

    return allPassed;
  };

  const testsPassed = await testFunctions();

  logSection('🎉 DEPLOYMENT COMPLETE!');

  if (testsPassed) {
    logSuccess('\nAll tests passed! ✓');
    log('\n📱 Next steps:\n', colors.green);
    log('1. Open Perdia V2:', colors.blue);
    log('   https://perdia.netlify.app/v2/topics\n');
    log('2. Click "Find New Questions" button', colors.blue);
    log('3. Generate your first article!', colors.blue);
    log('\n💡 TIP: Check browser console (F12) for any errors\n');
  } else {
    logWarning('\nSome tests failed. Check the errors above.');
    log('\n🔧 Troubleshooting:\n', colors.yellow);
    log('1. Wait 2 minutes for functions to warm up', colors.blue);
    log('2. Verify secrets are set in Supabase vault', colors.blue);
    log('3. Check Edge Functions status in Supabase dashboard', colors.blue);
    log('4. Run this script again to re-test\n', colors.blue);
  }

  rl.close();
  process.exit(testsPassed ? 0 : 1);
}

// Run
main().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  rl.close();
  process.exit(1);
});
