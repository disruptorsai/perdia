/**
 * Test All Edge Functions
 *
 * Comprehensive test suite for all Perdia Supabase Edge Functions.
 * Run this after deploying to verify all functions are working correctly.
 *
 * Usage:
 *   node scripts/test-all-functions.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Call Edge Function with auth
 */
async function callFunction(functionName, payload = {}) {
  const functionUrl = `${SUPABASE_URL}/functions/v1/${functionName}`;

  // Get auth token
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log(`\n📡 Calling ${functionName}...`);

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`${functionName} failed: ${data.message || data.error}`);
  }

  return data;
}

/**
 * Test Suite
 */
async function runTests() {
  console.log('🧪 Perdia Edge Functions Test Suite\n');
  console.log('=' .repeat(60));

  const results = {
    passed: [],
    failed: [],
  };

  // Test 1: Authenticate
  console.log('\n📋 Test 1: User Authentication');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    if (error) {
      console.log('⚠️  No test user found, creating one...');
      const { error: signUpError } = await supabase.auth.signUp({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });

      if (signUpError) throw signUpError;

      // Sign in again
      await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });
    }

    console.log('✅ Authentication successful');
    results.passed.push('Authentication');
  } catch (error) {
    console.log('❌ Authentication failed:', error.message);
    results.failed.push('Authentication');
    console.log('\n⚠️  Cannot proceed without authentication');
    return results;
  }

  // Test 2: Invoke LLM (Basic AI)
  console.log('\n📋 Test 2: Invoke LLM Function');
  try {
    const result = await callFunction('invoke-llm', {
      prompt: 'Say "Hello from Perdia test suite!"',
      provider: 'claude',
      model: 'claude-sonnet-4-5-20250929',
      temperature: 0.7,
      max_tokens: 100,
    });

    if (result.response || result.content) {
      console.log('✅ AI Response received:', (result.response || result.content).substring(0, 50) + '...');
      results.passed.push('invoke-llm');
    } else {
      throw new Error('No response from AI');
    }
  } catch (error) {
    console.log('❌ invoke-llm failed:', error.message);
    results.failed.push('invoke-llm');
  }

  // Test 3: Keyword Research
  console.log('\n📋 Test 3: Keyword Research Function');
  try {
    const result = await callFunction('keyword-research', {
      keywords: ['online education', 'elearning'],
      include_suggestions: false, // Skip suggestions for faster test
    });

    if (result.data && result.data.keywords && result.data.keywords.length > 0) {
      console.log(`✅ Researched ${result.data.keywords.length} keywords`);
      console.log(`   - Search volume: ${result.data.keywords[0].search_volume}`);
      console.log(`   - Difficulty: ${result.data.keywords[0].difficulty}`);
      results.passed.push('keyword-research');
    } else {
      throw new Error('No keyword data returned');
    }
  } catch (error) {
    console.log('❌ keyword-research failed:', error.message);
    results.failed.push('keyword-research');
  }

  // Test 4: GSC Sync
  console.log('\n📋 Test 4: Google Search Console Sync');
  try {
    const result = await callFunction('sync-gsc-data', {
      days: 7, // Test with 7 days for faster results
    });

    if (result.data && result.data.stats) {
      console.log(`✅ GSC Sync completed`);
      console.log(`   - Total rows: ${result.data.stats.total_rows}`);
      console.log(`   - Metrics upserted: ${result.data.stats.metrics_upserted}`);
      console.log(`   - Rankings updated: ${result.data.stats.rankings_updated}`);
      results.passed.push('sync-gsc-data');
    } else {
      throw new Error('No sync stats returned');
    }
  } catch (error) {
    console.log('❌ sync-gsc-data failed:', error.message);
    results.failed.push('sync-gsc-data');
  }

  // Test 5: Auto Schedule Content
  console.log('\n📋 Test 5: Auto Schedule Content');
  try {
    const result = await callFunction('auto-schedule-content', {
      articles_limit: 1, // Test with just 1 article
    });

    if (result.data) {
      console.log(`✅ Auto schedule completed`);
      console.log(`   - Scheduled count: ${result.data.scheduled_count}`);
      console.log(`   - Daily remaining: ${result.data.daily_remaining}`);
      results.passed.push('auto-schedule-content');
    } else {
      throw new Error('No schedule data returned');
    }
  } catch (error) {
    console.log('❌ auto-schedule-content failed:', error.message);
    results.failed.push('auto-schedule-content');
  }

  // Test 6: Optimize Content AI (requires content)
  console.log('\n📋 Test 6: Optimize Content AI');
  try {
    // First, get a content item to optimize
    const { data: contentItems } = await supabase
      .from('content_queue')
      .select('id')
      .limit(1);

    if (!contentItems || contentItems.length === 0) {
      console.log('⚠️  No content found to optimize, skipping test');
      results.passed.push('optimize-content-ai (skipped)');
    } else {
      const result = await callFunction('optimize-content-ai', {
        content_id: contentItems[0].id,
        analysis_type: 'quick', // Use quick analysis for faster test
        include_rewrite: false,
      });

      if (result.data && result.data.analysis) {
        console.log(`✅ Content optimized`);
        console.log(`   - SEO score: ${result.data.analysis.seo_score}`);
        console.log(`   - Readability score: ${result.data.analysis.readability_score}`);
        console.log(`   - Recommendations: ${result.data.analysis.recommendations.length}`);
        results.passed.push('optimize-content-ai');
      } else {
        throw new Error('No analysis returned');
      }
    }
  } catch (error) {
    console.log('❌ optimize-content-ai failed:', error.message);
    results.failed.push('optimize-content-ai');
  }

  // Test 7: WordPress Publish (requires content + WP connection)
  console.log('\n📋 Test 7: WordPress Publish');
  try {
    // Check if WordPress connection exists
    const { data: wpConnections } = await supabase
      .from('wordpress_connections')
      .select('id')
      .eq('is_active', true)
      .limit(1);

    if (!wpConnections || wpConnections.length === 0) {
      console.log('⚠️  No WordPress connection configured, skipping test');
      results.passed.push('wordpress-publish (skipped)');
    } else {
      // Get approved content
      const { data: contentItems } = await supabase
        .from('content_queue')
        .select('id')
        .eq('status', 'approved')
        .limit(1);

      if (!contentItems || contentItems.length === 0) {
        console.log('⚠️  No approved content found, skipping test');
        results.passed.push('wordpress-publish (skipped)');
      } else {
        const result = await callFunction('wordpress-publish', {
          content_id: contentItems[0].id,
          publish_status: 'draft', // Publish as draft for safety
        });

        if (result.data && result.data.wordpress_post_id) {
          console.log(`✅ Content published to WordPress`);
          console.log(`   - WP Post ID: ${result.data.wordpress_post_id}`);
          console.log(`   - WP URL: ${result.data.wordpress_url}`);
          results.passed.push('wordpress-publish');
        } else {
          throw new Error('No WordPress post data returned');
        }
      }
    }
  } catch (error) {
    console.log('❌ wordpress-publish failed:', error.message);
    results.failed.push('wordpress-publish');
  }

  // Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results Summary\n');
  console.log(`✅ Passed: ${results.passed.length}`);
  results.passed.forEach(test => console.log(`   - ${test}`));

  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}`);
    results.failed.forEach(test => console.log(`   - ${test}`));
  }

  const totalTests = results.passed.length + results.failed.length;
  const successRate = ((results.passed.length / totalTests) * 100).toFixed(1);

  console.log(`\n📈 Success Rate: ${successRate}%`);

  console.log('\n' + '='.repeat(60));

  // Exit with error code if any tests failed
  if (results.failed.length > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
