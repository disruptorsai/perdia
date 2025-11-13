/**
 * DETAILED PERPLEXITY TEST
 * =========================
 * Tests Perplexity Edge Function and shows exact error details
 */

import { config } from 'dotenv';
import fetch from 'node-fetch';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function testPerplexityDetailed() {
  console.log('\n🧪 DETAILED PERPLEXITY EDGE FUNCTION TEST');
  console.log('==========================================\n');

  console.log('Testing URL:', `${SUPABASE_URL}/functions/v1/invoke-perplexity`);
  console.log('');

  // Test 1: Simple test
  console.log('TEST 1: Simple question (minimal payload)');
  console.log('------------------------------------------');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/invoke-perplexity`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'What is 2+2?',
        model: 'sonar-pro',  // Updated model name (Jan 2025)
      }),
    });

    console.log('Status Code:', response.status);
    console.log('Status Text:', response.statusText);

    const data = await response.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ TEST 1 PASSED');
      console.log('Content:', data.content?.substring(0, 100));
    } else {
      console.log('\n❌ TEST 1 FAILED');
      console.log('Error:', data.error);
      console.log('Details:', data.details);
    }
  } catch (error) {
    console.log('\n❌ TEST 1 EXCEPTION');
    console.log('Error:', error.message);
  }

  console.log('\n');

  // Test 2: With all parameters
  console.log('TEST 2: Full parameters');
  console.log('------------------------------------------');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/invoke-perplexity`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'What is higher education?',
        model: 'sonar-pro',  // Updated model name (Jan 2025)
        temperature: 0.2,
        maxTokens: 100,
        searchDomainFilter: ['edu'],
      }),
    });

    console.log('Status Code:', response.status);
    console.log('Status Text:', response.statusText);

    const data = await response.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ TEST 2 PASSED');
    } else {
      console.log('\n❌ TEST 2 FAILED');
      console.log('Error:', data.error);
      console.log('Details:', data.details);
    }
  } catch (error) {
    console.log('\n❌ TEST 2 EXCEPTION');
    console.log('Error:', error.message);
  }

  console.log('\n');
  console.log('==========================================');
  console.log('DIAGNOSTIC SUMMARY');
  console.log('==========================================\n');

  console.log('POSSIBLE CAUSES OF HTTP 400:');
  console.log('');
  console.log('1. Invalid Perplexity API Key');
  console.log('   - Check key is correct: https://www.perplexity.ai/settings/api');
  console.log('   - Starts with: pplx-');
  console.log('');
  console.log('2. Perplexity Account Not Activated');
  console.log('   - Need to add payment method');
  console.log('   - Need to verify email');
  console.log('');
  console.log('3. Invalid Model Name');
  console.log('   - pplx-70b-online might have been renamed');
  console.log('   - Check API docs: https://docs.perplexity.ai/');
  console.log('');
  console.log('4. Rate Limiting');
  console.log('   - Too many requests');
  console.log('   - Wait a few minutes');
  console.log('');
  console.log('NEXT STEPS:');
  console.log('1. Check Supabase function logs:');
  console.log('   https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/functions/invoke-perplexity');
  console.log('2. Verify Perplexity API key in vault:');
  console.log('   https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/vault');
  console.log('3. Test API key directly:');
  console.log('   curl -X POST https://api.perplexity.ai/chat/completions \\');
  console.log('     -H "Authorization: Bearer YOUR_KEY" \\');
  console.log('     -d \'{"model":"pplx-70b-online","messages":[{"role":"user","content":"test"}]}\'');
  console.log('');
}

testPerplexityDetailed();
