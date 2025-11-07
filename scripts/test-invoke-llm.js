/**
 * Test the invoke-llm Netlify function directly
 */

async function testInvokeLLM() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  TESTING INVOKE-LLM FUNCTION                             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const testPayload = {
    provider: 'claude',
    model: 'claude-3-5-sonnet-20241022',
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

  console.log('📤 Sending test request to Netlify function...');
  console.log('URL: https://perdia.netlify.app/.netlify/functions/invoke-llm');
  console.log('Payload:', JSON.stringify(testPayload, null, 2));
  console.log('\n⏳ Waiting for response...\n');

  try {
    const response = await fetch('https://perdia.netlify.app/.netlify/functions/invoke-llm', {
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
      console.log('1. Check Netlify function logs: https://app.netlify.com/sites/perdia-education/functions');
      console.log('2. Look for detailed error messages in the logs');
      console.log('3. Verify ANTHROPIC_API_KEY is set correctly in Netlify');
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
