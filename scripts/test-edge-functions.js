/**
 * Test Edge Functions with real API calls
 */

import { config } from 'dotenv';
import fetch from 'node-fetch';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function testGrok() {
  console.log('\n🧪 Testing invoke-grok Edge Function...');
  console.log('URL:', `${SUPABASE_URL}/functions/v1/invoke-grok`);

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/invoke-grok`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Write one sentence about online education.',
        model: 'grok-2',
        maxTokens: 50,
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);

    if (response.ok && data.content) {
      console.log('✅ Grok is WORKING!');
      console.log('Response:', data.content.substring(0, 150));
      console.log('Model:', data.model);
      console.log('Tokens used:', data.usage?.total_tokens || 'N/A');
      return true;
    } else {
      console.log('❌ Grok Error:', data.error || JSON.stringify(data));
      return false;
    }
  } catch (error) {
    console.log('❌ Grok Test Failed:', error.message);
    return false;
  }
}

async function testPerplexity() {
  console.log('\n🧪 Testing invoke-perplexity Edge Function...');
  console.log('URL:', `${SUPABASE_URL}/functions/v1/invoke-perplexity`);

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/invoke-perplexity`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'What is higher education?',
        model: 'pplx-70b-online',
        maxTokens: 100,
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);

    if (response.ok && data.content) {
      console.log('✅ Perplexity is WORKING!');
      console.log('Response:', data.content.substring(0, 150));
      console.log('Citations:', data.citations?.length || 0, 'citations provided');
      console.log('Model:', data.model);
      return true;
    } else {
      console.log('❌ Perplexity Error:', data.error || JSON.stringify(data));
      return false;
    }
  } catch (error) {
    console.log('❌ Perplexity Test Failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('PERDIA V2 EDGE FUNCTIONS TEST');
  console.log('='.repeat(60));

  const grokWorking = await testGrok();
  const perplexityWorking = await testPerplexity();

  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('Grok:', grokWorking ? '✅ WORKING' : '❌ FAILED');
  console.log('Perplexity:', perplexityWorking ? '✅ WORKING' : '❌ FAILED');

  if (grokWorking && perplexityWorking) {
    console.log('\n🎉 ALL EDGE FUNCTIONS WORKING!');
    console.log('✅ Deployment is 100% complete!');
    console.log('\nNext step: Test at https://perdia.netlify.app/v2/topics');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some Edge Functions are not working.');
    console.log('Check Supabase secrets vault and function logs.');
    process.exit(1);
  }
}

main();
