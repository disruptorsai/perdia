/**
 * PERDIA V2 DEPLOYMENT TESTING SCRIPT
 * ====================================
 *
 * Tests all V2 functionality to ensure proper deployment
 *
 * Usage:
 *   node scripts/test-perdia-v2.js
 *
 * Environment:
 *   Requires .env.local with all V2 API keys configured
 *
 * Tests:
 *   1. Database schema validation
 *   2. Grok Edge Function
 *   3. Perplexity Edge Function
 *   4. Content pipeline (two-stage)
 *   5. Article creation workflow
 *   6. Auto-approve logic
 *   7. WordPress connection (optional)
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Load environment variables
config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const GROK_API_KEY = process.env.VITE_GROK_API_KEY;
const PERPLEXITY_API_KEY = process.env.VITE_PERPLEXITY_API_KEY;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
};

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
  results.passed++;
}

function logError(message, error = null) {
  log(`✗ ${message}`, colors.red);
  if (error) {
    console.error(error);
  }
  results.failed++;
}

function logSkip(message) {
  log(`⊘ ${message} (skipped)`, colors.yellow);
  results.skipped++;
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(message, colors.cyan);
  log('='.repeat(60), colors.cyan);
}

// Initialize Supabase clients
let supabase, supabaseAdmin;

try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
} catch (error) {
  logError('Failed to initialize Supabase clients', error);
  process.exit(1);
}

// Test functions
async function testEnvironmentVariables() {
  logSection('TEST 1: Environment Variables');
  results.total += 6;

  if (SUPABASE_URL) {
    logSuccess('VITE_SUPABASE_URL configured');
  } else {
    logError('VITE_SUPABASE_URL missing');
  }

  if (SUPABASE_ANON_KEY) {
    logSuccess('VITE_SUPABASE_ANON_KEY configured');
  } else {
    logError('VITE_SUPABASE_ANON_KEY missing');
  }

  if (SUPABASE_SERVICE_KEY) {
    logSuccess('VITE_SUPABASE_SERVICE_ROLE_KEY configured');
  } else {
    logError('VITE_SUPABASE_SERVICE_ROLE_KEY missing');
  }

  if (GROK_API_KEY) {
    logSuccess('VITE_GROK_API_KEY configured');
  } else {
    logError('VITE_GROK_API_KEY missing');
  }

  if (PERPLEXITY_API_KEY) {
    logSuccess('VITE_PERPLEXITY_API_KEY configured');
  } else {
    logError('VITE_PERPLEXITY_API_KEY missing');
  }

  if (process.env.VITE_DEFAULT_AI_PROVIDER === 'grok') {
    logSuccess('VITE_DEFAULT_AI_PROVIDER set to grok');
  } else {
    logError('VITE_DEFAULT_AI_PROVIDER not set to grok');
  }
}

async function testDatabaseSchema() {
  logSection('TEST 2: Database Schema (V2 Tables)');

  const v2Tables = [
    'articles',
    'topic_questions',
    'feedback',
    'quotes',
    'automation_schedule',
    'integrations',
  ];

  results.total += v2Tables.length;

  for (const tableName of v2Tables) {
    try {
      const { count, error } = await supabaseAdmin
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        logError(`Table '${tableName}' error: ${error.message}`);
      } else {
        logSuccess(`Table '${tableName}' exists (${count} rows)`);
      }
    } catch (error) {
      logError(`Table '${tableName}' check failed`, error);
    }
  }
}

async function testGrokEdgeFunction() {
  logSection('TEST 3: Grok Edge Function');
  results.total += 2;

  if (!GROK_API_KEY) {
    logSkip('Grok API key not configured');
    results.total -= 2;
    results.skipped += 2;
    return;
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/invoke-grok`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Write a single sentence about online education.',
          model: 'grok-2',
          temperature: 0.7,
          maxTokens: 50,
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();

      if (data.content && data.content.length > 0) {
        logSuccess('Grok Edge Function returns content');
        log(`  Sample: "${data.content.substring(0, 100)}..."`, colors.blue);
      } else {
        logError('Grok Edge Function returned empty content');
      }

      if (data.usage && data.usage.total_tokens > 0) {
        logSuccess(`Grok Edge Function tracks usage (${data.usage.total_tokens} tokens)`);
      } else {
        logError('Grok Edge Function missing usage data');
      }
    } else {
      const errorText = await response.text();
      logError(`Grok Edge Function failed: ${response.status} - ${errorText}`);
      results.total -= 1; // Only count the first test as failed
    }
  } catch (error) {
    logError('Grok Edge Function request failed', error);
    results.total -= 1;
  }
}

async function testPerplexityEdgeFunction() {
  logSection('TEST 4: Perplexity Edge Function');
  results.total += 2;

  if (!PERPLEXITY_API_KEY) {
    logSkip('Perplexity API key not configured');
    results.total -= 2;
    results.skipped += 2;
    return;
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/invoke-perplexity`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'What is higher education? Provide a one-sentence answer.',
          model: 'pplx-70b-online',
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();

      if (data.content && data.content.length > 0) {
        logSuccess('Perplexity Edge Function returns content');
        log(`  Sample: "${data.content.substring(0, 100)}..."`, colors.blue);
      } else {
        logError('Perplexity Edge Function returned empty content');
      }

      if (data.citations && Array.isArray(data.citations)) {
        logSuccess(`Perplexity Edge Function includes citations (${data.citations.length} found)`);
      } else {
        logError('Perplexity Edge Function missing citations');
      }
    } else {
      const errorText = await response.text();
      logError(`Perplexity Edge Function failed: ${response.status} - ${errorText}`);
      results.total -= 1;
    }
  } catch (error) {
    logError('Perplexity Edge Function request failed', error);
    results.total -= 1;
  }
}

async function testArticleCreation() {
  logSection('TEST 5: Article Creation Workflow');
  results.total += 4;

  try {
    // Get a test user (create if needed)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError || !user || user.length === 0) {
      logError('No users found. Create a user first via signup.');
      results.total -= 4;
      return;
    }

    const testUserId = user[0].id;
    log(`  Using test user: ${user[0].email}`, colors.blue);

    // Create test article
    const testArticle = {
      user_id: testUserId,
      title: 'Test Article: What is Online Education?',
      slug: 'test-article-online-education',
      body: '<p>This is a test article about online education. [CITATION NEEDED]</p><p>Online learning has grown significantly in recent years.</p>',
      status: 'draft',
      model_primary: 'grok-2',
      model_verify: 'pplx-70b-online',
      generation_cost: 0.05,
      verification_cost: 0.02,
      validation_status: 'valid',
      word_count: 50,
      meta_title: 'What is Online Education? | GetEducated.com',
      meta_description: 'Learn about online education and its benefits for modern learners.',
    };

    const { data: article, error: createError } = await supabaseAdmin
      .from('articles')
      .insert(testArticle)
      .select()
      .single();

    if (createError) {
      logError('Failed to create test article', createError);
      results.total -= 4;
      return;
    }

    logSuccess(`Test article created (ID: ${article.id})`);

    // Test status update to pending_review (should trigger auto_approve_at)
    const { data: updatedArticle, error: updateError } = await supabaseAdmin
      .from('articles')
      .update({ status: 'pending_review' })
      .eq('id', article.id)
      .select()
      .single();

    if (updateError) {
      logError('Failed to update article to pending_review', updateError);
    } else if (updatedArticle.auto_approve_at) {
      logSuccess(`Auto-approve trigger working (auto_approve_at: ${updatedArticle.auto_approve_at})`);
    } else {
      logError('Auto-approve trigger did not set auto_approve_at');
    }

    // Test total_cost calculation
    if (article.total_cost === 0.07) {
      logSuccess(`Cost calculation working (total: $${article.total_cost})`);
    } else {
      logError(`Cost calculation incorrect (expected $0.07, got $${article.total_cost})`);
    }

    // Cleanup: delete test article
    const { error: deleteError } = await supabaseAdmin
      .from('articles')
      .delete()
      .eq('id', article.id);

    if (deleteError) {
      logError('Failed to delete test article (manual cleanup needed)', deleteError);
    } else {
      logSuccess('Test article cleaned up');
    }

  } catch (error) {
    logError('Article creation workflow test failed', error);
    results.total -= 4;
  }
}

async function testTopicQuestionsTable() {
  logSection('TEST 6: Topic Questions Table');
  results.total += 2;

  try {
    // Get a test user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError || !user || user.length === 0) {
      logError('No users found. Create a user first via signup.');
      results.total -= 2;
      return;
    }

    const testUserId = user[0].id;

    // Create test question
    const testQuestion = {
      user_id: testUserId,
      question_text: 'What are the best online MBA programs in 2025?',
      source: 'test',
      keywords_extracted: ['online mba', 'best mba programs', 'mba 2025'],
      search_volume: 1200,
      priority: 5,
    };

    const { data: question, error: createError } = await supabaseAdmin
      .from('topic_questions')
      .insert(testQuestion)
      .select()
      .single();

    if (createError) {
      logError('Failed to create test question', createError);
      results.total -= 2;
      return;
    }

    logSuccess(`Test question created (ID: ${question.id})`);

    // Test discovery timestamp
    if (question.discovered_at) {
      logSuccess(`Question timestamp working (discovered_at: ${question.discovered_at})`);
    } else {
      logError('Question discovered_at not set');
    }

    // Cleanup
    const { error: deleteError } = await supabaseAdmin
      .from('topic_questions')
      .delete()
      .eq('id', question.id);

    if (deleteError) {
      logError('Failed to delete test question (manual cleanup needed)', deleteError);
    }

  } catch (error) {
    logError('Topic questions test failed', error);
    results.total -= 2;
  }
}

async function testAutoApproveEdgeFunction() {
  logSection('TEST 7: Auto-Approve Edge Function');
  results.total += 1;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/auto-approve-articles`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      logSuccess(`Auto-approve Edge Function deployed (approved: ${data.approved}, failed: ${data.failed})`);

      if (data.approved === 0 && data.failed === 0) {
        log('  No articles ready for auto-approve (expected)', colors.blue);
      }
    } else {
      const errorText = await response.text();
      logError(`Auto-approve Edge Function failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    logError('Auto-approve Edge Function request failed', error);
  }
}

async function testMonthlyIngestEdgeFunction() {
  logSection('TEST 8: Monthly Ingest Edge Function');
  results.total += 1;

  if (!PERPLEXITY_API_KEY) {
    logSkip('Perplexity API key not configured (required for monthly ingest)');
    results.total -= 1;
    results.skipped += 1;
    return;
  }

  log('  WARNING: This test will call Perplexity API and may incur costs', colors.yellow);
  log('  Press Ctrl+C to skip, or wait 5 seconds to continue...', colors.yellow);

  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/ingest-monthly-questions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      logSuccess(`Monthly ingest Edge Function deployed (inserted: ${data.inserted}, duplicates: ${data.duplicates})`);
    } else {
      const errorText = await response.text();
      logError(`Monthly ingest Edge Function failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    logError('Monthly ingest Edge Function request failed', error);
  }
}

async function testWordPressConnection() {
  logSection('TEST 9: WordPress Connection (Optional)');
  results.total += 1;

  const wpUrl = process.env.WORDPRESS_BASE_URL;
  const wpUsername = process.env.WORDPRESS_USERNAME;
  const wpPassword = process.env.WORDPRESS_PASSWORD;

  if (!wpUrl || !wpUsername || !wpPassword) {
    logSkip('WordPress credentials not configured');
    results.total -= 1;
    results.skipped += 1;
    return;
  }

  try {
    const credentials = Buffer.from(`${wpUsername}:${wpPassword}`).toString('base64');

    const response = await fetch(`${wpUrl}/wp-json/wp/v2/users/me`, {
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    });

    if (response.ok) {
      const user = await response.json();
      logSuccess(`WordPress connection successful (user: ${user.name})`);
    } else {
      const errorText = await response.text();
      logError(`WordPress connection failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    logError('WordPress connection test failed', error);
  }
}

// Main test runner
async function runAllTests() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('PERDIA V2 DEPLOYMENT TEST SUITE', colors.cyan);
  log('='.repeat(60) + '\n', colors.cyan);

  await testEnvironmentVariables();
  await testDatabaseSchema();
  await testGrokEdgeFunction();
  await testPerplexityEdgeFunction();
  await testArticleCreation();
  await testTopicQuestionsTable();
  await testAutoApproveEdgeFunction();
  await testMonthlyIngestEdgeFunction();
  await testWordPressConnection();

  // Summary
  logSection('TEST SUMMARY');
  log(`Total Tests: ${results.total}`, colors.cyan);
  log(`Passed: ${results.passed}`, colors.green);
  log(`Failed: ${results.failed}`, colors.red);
  log(`Skipped: ${results.skipped}`, colors.yellow);

  const passRate = ((results.passed / (results.total - results.skipped)) * 100).toFixed(1);
  log(`\nPass Rate: ${passRate}%`, passRate >= 80 ? colors.green : colors.red);

  if (results.failed === 0) {
    log('\n✓ All tests passed! Perdia V2 is ready for deployment.', colors.green);
    process.exit(0);
  } else {
    log(`\n✗ ${results.failed} test(s) failed. Review errors above.`, colors.red);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  logError('Fatal error running test suite', error);
  process.exit(1);
});
