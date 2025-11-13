/**
 * GROK API TEST
 * ==============
 * Tests Grok Edge Function deployment and API key configuration
 */

import { config } from 'dotenv';
import fetch from 'node-fetch';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function testGrok() {
  console.log('\n🧪 TESTING GROK EDGE FUNCTION');
  console.log('==============================\n');

  console.log('Testing URL:', `${SUPABASE_URL}/functions/v1/invoke-grok`);
  console.log('');

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
        temperature: 0.7,
        maxTokens: 50,
      }),
    });

    console.log('Status Code:', response.status);
    console.log('Status Text:', response.statusText);

    const data = await response.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ GROK API WORKING');
      console.log('Content:', data.content?.substring(0, 100));
    } else if (response.status === 403) {
      console.log('\n❌ HTTP 403 FORBIDDEN');
      console.log('\nDIAGNOSTIC:');
      console.log('This error means the Grok API key is not properly configured.');
      console.log('');
      console.log('FIX (3 steps):');
      console.log('');
      console.log('1. ADD SECRET TO SUPABASE VAULT:');
      console.log('   Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/vault');
      console.log('   Click "New secret"');
      console.log('   Name: GROK_API_KEY');
      console.log('   Secret: <YOUR-GROK-API-KEY>  (starts with xai-)');
      console.log('   Click "Add secret"');
      console.log('');
      console.log('2. RESTART EDGE FUNCTION:');
      console.log('   npx supabase functions deploy invoke-grok --project-ref yvvtsfgryweqfppilkvo');
      console.log('');
      console.log('3. TEST AGAIN:');
      console.log('   node scripts/test-grok.js');
      console.log('');
      console.log('WHERE TO GET GROK API KEY:');
      console.log('   - Login to: https://console.x.ai/');
      console.log('   - Navigate to API Keys section');
      console.log('   - Create new API key (starts with xai-)');
      console.log('   - Copy the key and add to Supabase vault');
    } else if (response.status === 500) {
      console.log('\n❌ HTTP 500 INTERNAL SERVER ERROR');
      console.log('Error:', data.error);
      console.log('Details:', data.details);
    } else {
      console.log('\n❌ TEST FAILED');
      console.log('Error:', data.error);
      console.log('Details:', data.details);
    }
  } catch (error) {
    console.log('\n❌ TEST EXCEPTION');
    console.log('Error:', error.message);
  }

  console.log('\n');
}

testGrok();
