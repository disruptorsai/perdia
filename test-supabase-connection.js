/**
 * Test Supabase Connection
 * Run with: node test-supabase-connection.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING');
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local\n');
  process.exit(1);
}

// Create a test client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test 1: Try to query a table
    console.log('Test 1: Querying agent_definitions table...');
    const { data, error } = await supabase
      .from('agent_definitions')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database query failed:', error.message);
      console.error('   Error code:', error.code);
      console.error('   Details:', error.details);

      if (error.message.includes('JWT') || error.message.includes('API key')) {
        console.log('\n💡 The API key appears to be invalid or expired.');
        console.log('   Please verify your credentials at:');
        console.log('   https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/api\n');
      }

      return false;
    }

    console.log('✅ Database query successful!\n');
    return true;

  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
    return false;
  }
}

async function checkProjectStatus() {
  console.log('Test 2: Checking project status...');

  try {
    // Try to get the project health
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    console.log('   Response status:', response.status);

    if (response.status === 401) {
      console.error('❌ Authentication failed (401 Unauthorized)');
      console.log('\n💡 Possible issues:');
      console.log('   1. The ANON key is incorrect');
      console.log('   2. The Supabase project is paused or disabled');
      console.log('   3. The project URL is wrong');
      console.log('\n📝 To fix:');
      console.log('   1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/api');
      console.log('   2. Copy the "anon" public key');
      console.log('   3. Update VITE_SUPABASE_ANON_KEY in .env.local');
      console.log('   4. Restart the dev server\n');
      return false;
    }

    if (response.ok || response.status === 404) {
      console.log('✅ Project is reachable!\n');
      return true;
    }

    console.error('❌ Unexpected response:', response.status, response.statusText);
    return false;

  } catch (err) {
    console.error('❌ Network error:', err.message);
    console.log('\n💡 The Supabase URL might be incorrect or unreachable\n');
    return false;
  }
}

async function runTests() {
  const projectOk = await checkProjectStatus();

  if (projectOk) {
    const dbOk = await testConnection();

    if (dbOk) {
      console.log('🎉 All tests passed! Your Supabase connection is working.\n');
      process.exit(0);
    }
  }

  console.log('❌ Some tests failed. Please check your credentials.\n');
  process.exit(1);
}

runTests();
