/**
 * Deploy Edge Function to Supabase using Management API
 */

import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function deployEdgeFunction() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  DEPLOYING EDGE FUNCTION TO SUPABASE                    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  if (!anthropicKey) {
    console.error('❌ Missing ANTHROPIC_API_KEY');
    process.exit(1);
  }

  // Extract project ref from URL
  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  console.log(`📋 Project Reference: ${projectRef}`);

  // Read the function code
  const functionPath = join(projectRoot, 'supabase/functions/invoke-llm/index.ts');
  const functionCode = readFileSync(functionPath, 'utf-8');
  console.log(`📄 Loaded function code (${functionCode.length} bytes)`);

  // Step 1: Set secrets first
  console.log('\n🔐 Setting secrets...');

  const secrets = [
    { name: 'ANTHROPIC_API_KEY', value: anthropicKey },
  ];

  if (openaiKey) {
    secrets.push({ name: 'OPENAI_API_KEY', value: openaiKey });
  }

  for (const secret of secrets) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/_commands/secrets/set`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: secret.name,
          value: secret.value,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.log(`⚠️  Warning setting ${secret.name}: ${error}`);
      } else {
        console.log(`✅ Set secret: ${secret.name}`);
      }
    } catch (error) {
      console.log(`⚠️  Warning: Could not set ${secret.name} via API:`, error.message);
    }
  }

  // Step 2: Deploy function using CLI (npx)
  console.log('\n📦 Deploying Edge Function using Supabase CLI...');
  console.log('This will use npx to run the deploy command...\n');

  // For Windows, we need to use npx supabase deploy
  const { spawn } = await import('child_process');

  return new Promise((resolve, reject) => {
    const deploy = spawn('npx', [
      'supabase@latest',
      'functions',
      'deploy',
      'invoke-llm',
      '--project-ref',
      projectRef,
      '--no-verify-jwt'
    ], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        SUPABASE_ACCESS_TOKEN: serviceRoleKey,
      }
    });

    deploy.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Edge Function deployed successfully!');
        console.log(`\n📍 Function URL: ${supabaseUrl}/functions/v1/invoke-llm`);
        console.log('\n🔍 Next steps:');
        console.log('1. Test the function: node scripts/test-invoke-llm.js');
        console.log('2. Check logs: npx supabase functions logs invoke-llm');
        console.log('3. Test in app: Open AI Agents and try generating content');
        resolve();
      } else {
        console.error(`\n❌ Deployment failed with code ${code}`);
        console.log('\n🔧 Manual deployment:');
        console.log('Run this command:');
        console.log(`npx supabase functions deploy invoke-llm --project-ref ${projectRef}`);
        reject(new Error(`Deployment failed with code ${code}`));
      }
    });

    deploy.on('error', (error) => {
      console.error('❌ Error spawning process:', error);
      reject(error);
    });
  });
}

deployEdgeFunction().catch((error) => {
  console.error('❌ Deployment script failed:', error);
  process.exit(1);
});
