/**
 * Test the invoke-llm Supabase Edge Function directly
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testInvokeLLM() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  TESTING INVOKE-LLM EDGE FUNCTION (SUPABASE)            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('❌ VITE_SUPABASE_URL not found in environment variables');
    process.exit(1);
  }

  const functionUrl = `${supabaseUrl}/functions/v1/invoke-llm`;

  const testPayload = {
    provider: 'claude',
    model: 'claude-sonnet-4-5',  // Claude 4.5 Sonnet (latest)
    messages: [
      {
        role: 'user',
        content: 'Write a very short test response - just say "Hello from Claude!" and nothing else.'
      }
    ],
    system_prompt: 'You are a helpful assistant.',
    temperature: 0.7,
    max_tokens: 100
  };

  console.log('📤 Sending test request to Supabase Edge Function...');
  console.log('URL:', functionUrl);
  console.log('Payload:', JSON.stringify(testPayload, null, 2));
  console.log('\n⏳ Waiting for response...\n');

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    console.log('📥 Response received');
    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ SUCCESS!');
      console.log('─────────────────────────────────────────────────────────────');
      console.log('Content:', data.content);
      console.log('Model:', data.model);
      console.log('Tokens:', data.usage);
      console.log('─────────────────────────────────────────────────────────────');
    } else {
      console.log('\n❌ ERROR!');
      console.log('─────────────────────────────────────────────────────────────');
      console.log('Error:', data.error);
      console.log('Message:', data.message);
      console.log('Status:', data.status);
      console.log('Details:', data.details);
      console.log('─────────────────────────────────────────────────────────────');
      console.log('\n🔍 Next steps:');
      console.log('1. Check Supabase Edge Function logs in dashboard');
      console.log('2. Verify function is deployed: supabase functions list');
      console.log('3. Verify ANTHROPIC_API_KEY secret: supabase secrets list');
      console.log('4. Check function logs: supabase functions logs invoke-llm');
    }

  } catch (error) {
    console.log('\n❌ REQUEST FAILED');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
    console.log('─────────────────────────────────────────────────────────────');
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

testInvokeLLM().catch(console.error);
