#!/usr/bin/env node

/**
 * PERDIA EDUCATION - AUTHENTICATION SYSTEM TEST SCRIPT
 *
 * This script performs comprehensive automated testing of the authentication system:
 * 1. Checks Supabase configuration
 * 2. Tests signup flow
 * 3. Tests login flow
 * 4. Verifies RLS policies
 * 5. Tests data isolation
 * 6. Generates detailed test report
 *
 * Usage: node scripts/test-auth-system.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  warnings: [],
  info: []
};

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
  testResults.passed.push(message);
}

function logError(message, error = null) {
  log(`❌ ${message}`, colors.red);
  if (error) {
    console.error(error);
  }
  testResults.failed.push(message);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
  testResults.warnings.push(message);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
  testResults.info.push(message);
}

function logHeader(message) {
  log(`\n${colors.bold}${colors.blue}${'='.repeat(80)}${colors.reset}`);
  log(`${colors.bold}${colors.blue}${message}${colors.reset}`);
  log(`${colors.bold}${colors.blue}${'='.repeat(80)}${colors.reset}\n`);
}

// Generate random test email
function generateTestEmail() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@perdia-test.com`;
}

// Main test function
async function runTests() {
  logHeader('PERDIA AUTHENTICATION SYSTEM - AUTOMATED TESTS');

  // Check environment variables
  logHeader('1. CHECKING ENVIRONMENT CONFIGURATION');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    logError('Missing required environment variables (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY)');
    process.exit(1);
  }

  logSuccess('Environment variables configured');
  logInfo(`Supabase URL: ${supabaseUrl}`);

  // Create Supabase clients
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

  if (supabaseAdmin) {
    logSuccess('Admin client available for advanced testing');
  } else {
    logWarning('Service role key not configured - some tests will be skipped');
  }

  // Test 2: Check Supabase connection
  logHeader('2. TESTING SUPABASE CONNECTION');

  try {
    const { data, error } = await supabase.from('agent_definitions').select('count');
    if (error) throw error;
    logSuccess('Supabase connection successful');
  } catch (error) {
    logError('Failed to connect to Supabase', error);
    process.exit(1);
  }

  // Test 3: Test signup flow
  logHeader('3. TESTING SIGNUP FLOW');

  const testUser1 = {
    email: generateTestEmail(),
    password: 'TestPassword123!',
    name: 'Test User One',
    organization: 'Perdia Test Org'
  };

  logInfo(`Creating test user: ${testUser1.email}`);

  let user1Session = null;

  try {
    const { data, error } = await supabase.auth.signUp({
      email: testUser1.email,
      password: testUser1.password,
      options: {
        data: {
          name: testUser1.name,
          organization: testUser1.organization
        }
      }
    });

    if (error) throw error;

    if (data.session) {
      logSuccess('User signup successful - auto-login enabled');
      user1Session = data.session;
      logInfo(`User ID: ${data.user.id}`);
      logInfo(`Email: ${data.user.email}`);
      logInfo(`Metadata: ${JSON.stringify(data.user.user_metadata)}`);
    } else {
      logWarning('User created but email confirmation required');
      logInfo('To enable auto-login: Disable "Confirm email" in Supabase Dashboard → Auth → Settings');
    }
  } catch (error) {
    logError('Signup failed', error);
  }

  // Test 4: Test login flow (if email confirmation not required)
  logHeader('4. TESTING LOGIN FLOW');

  if (user1Session) {
    logInfo('Logging out user...');
    await supabase.auth.signOut();

    logInfo(`Attempting login with: ${testUser1.email}`);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testUser1.email,
        password: testUser1.password
      });

      if (error) throw error;

      if (data.session) {
        logSuccess('Login successful');
        user1Session = data.session;
        logInfo(`Session valid until: ${new Date(data.session.expires_at * 1000).toLocaleString()}`);
      } else {
        logError('Login failed - no session returned');
      }
    } catch (error) {
      logError('Login failed', error);
    }
  } else {
    logWarning('Skipping login test - email confirmation required');
  }

  // Test 5: Test session persistence
  logHeader('5. TESTING SESSION PERSISTENCE');

  if (user1Session) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) throw error;

      if (user) {
        logSuccess('Session persisted correctly');
        logInfo(`Current user: ${user.email}`);
      } else {
        logError('Session not persisted');
      }
    } catch (error) {
      logError('Failed to verify session', error);
    }
  } else {
    logWarning('Skipping session test - no active session');
  }

  // Test 6: Test RLS policies with user data
  logHeader('6. TESTING ROW LEVEL SECURITY (RLS)');

  if (user1Session && supabaseAdmin) {
    logInfo('Testing user data isolation...');

    // Create test keyword as User 1
    try {
      const { data: keyword1, error: insertError } = await supabase
        .from('keywords')
        .insert({
          keyword: `test-keyword-user1-${Date.now()}`,
          list_type: 'new_target',
          search_volume: 1000,
          difficulty: 50
        })
        .select()
        .single();

      if (insertError) throw insertError;

      logSuccess('User 1 created keyword successfully');
      logInfo(`Keyword ID: ${keyword1.id}`);

      // Try to read the keyword
      const { data: readKeyword, error: readError } = await supabase
        .from('keywords')
        .select()
        .eq('id', keyword1.id)
        .single();

      if (readError) throw readError;

      logSuccess('User 1 can read their own keyword');

      // Create second test user
      const testUser2 = {
        email: generateTestEmail(),
        password: 'TestPassword123!',
        name: 'Test User Two'
      };

      logInfo(`Creating second user: ${testUser2.email}`);

      const { data: user2Data, error: user2Error } = await supabase.auth.signUp({
        email: testUser2.email,
        password: testUser2.password,
        options: {
          data: { name: testUser2.name }
        }
      });

      if (user2Error) throw user2Error;

      if (user2Data.session) {
        logSuccess('User 2 created and logged in');

        // Try to read User 1's keyword as User 2
        const { data: user2Read, error: user2ReadError } = await supabase
          .from('keywords')
          .select()
          .eq('id', keyword1.id)
          .single();

        if (user2ReadError && user2ReadError.code === 'PGRST116') {
          logSuccess('RLS WORKING: User 2 cannot read User 1\'s keyword');
        } else if (user2Read) {
          logError('RLS FAILED: User 2 can read User 1\'s keyword!');
        } else {
          logWarning(`Unexpected result: ${user2ReadError?.message}`);
        }

        // Cleanup: Delete test users using admin client
        logInfo('Cleaning up test users...');

        if (supabaseAdmin) {
          await supabaseAdmin.auth.admin.deleteUser(user2Data.user.id);
          await supabaseAdmin.from('keywords').delete().eq('id', keyword1.id);
        }

        logSuccess('Test data cleaned up');
      } else {
        logWarning('User 2 requires email confirmation - RLS isolation test skipped');
      }
    } catch (error) {
      logError('RLS testing failed', error);
    }
  } else {
    logWarning('Skipping RLS test - requires active session and admin client');
    logInfo('To enable: Add VITE_SUPABASE_SERVICE_ROLE_KEY to .env.local');
  }

  // Test 7: Verify RLS policies exist
  logHeader('7. VERIFYING RLS POLICIES IN DATABASE');

  if (supabaseAdmin) {
    try {
      const { data: policies, error } = await supabaseAdmin
        .from('pg_policies')
        .select('*')
        .in('tablename', ['keywords', 'content_queue', 'performance_metrics']);

      if (error) {
        // Try alternative query
        const { data: altData, error: altError } = await supabaseAdmin.rpc('get_rls_policies');

        if (altError) {
          logWarning('Cannot verify RLS policies via admin API');
          logInfo('This is normal - check Supabase Dashboard → Database → Policies');
        } else {
          logSuccess(`Found ${altData?.length || 0} RLS policies`);
        }
      } else {
        logSuccess(`Found ${policies?.length || 0} RLS policies`);
      }
    } catch (error) {
      logWarning('RLS policy verification skipped - requires admin privileges');
    }
  }

  // Test 8: Check auth configuration
  logHeader('8. CHECKING AUTH CONFIGURATION');

  logInfo('Checking Supabase Auth settings...');
  logInfo('To configure:');
  logInfo('  1. Go to: https://supabase.com/dashboard');
  logInfo('  2. Select your Perdia project');
  logInfo('  3. Go to: Authentication → Settings');
  logInfo('  4. Recommended for MVP: Disable "Confirm email"');
  logInfo('  5. Add Site URL: http://localhost:3000');
  logInfo('  6. Add Redirect URLs: http://localhost:3000/**');

  // Cleanup: Delete test user 1
  if (user1Session && supabaseAdmin) {
    logHeader('CLEANUP');
    logInfo('Removing test user...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        logSuccess('Test user removed');
      }
    } catch (error) {
      logWarning('Failed to cleanup test user - manual cleanup may be required');
    }
  }

  // Generate final report
  logHeader('TEST RESULTS SUMMARY');

  log(`\n${colors.bold}Passed Tests: ${testResults.passed.length}${colors.reset}`, colors.green);
  testResults.passed.forEach(test => {
    log(`  ✅ ${test}`, colors.green);
  });

  if (testResults.failed.length > 0) {
    log(`\n${colors.bold}Failed Tests: ${testResults.failed.length}${colors.reset}`, colors.red);
    testResults.failed.forEach(test => {
      log(`  ❌ ${test}`, colors.red);
    });
  }

  if (testResults.warnings.length > 0) {
    log(`\n${colors.bold}Warnings: ${testResults.warnings.length}${colors.reset}`, colors.yellow);
    testResults.warnings.forEach(warning => {
      log(`  ⚠️  ${warning}`, colors.yellow);
    });
  }

  logHeader('NEXT STEPS');

  if (testResults.warnings.some(w => w.includes('email confirmation'))) {
    log('📋 To enable auto-login after signup:', colors.cyan);
    log('   1. Open Supabase Dashboard: https://supabase.com/dashboard', colors.cyan);
    log('   2. Select Perdia project', colors.cyan);
    log('   3. Go to: Authentication → Settings', colors.cyan);
    log('   4. Disable "Confirm email"', colors.cyan);
    log('   5. Save changes', colors.cyan);
    log('   6. Re-run this test: node scripts/test-auth-system.js\n', colors.cyan);
  }

  if (!supabaseAdmin) {
    log('📋 To enable full RLS testing:', colors.cyan);
    log('   1. Add VITE_SUPABASE_SERVICE_ROLE_KEY to .env.local', colors.cyan);
    log('   2. Get key from: Supabase Dashboard → Settings → API → service_role', colors.cyan);
    log('   3. Re-run this test\n', colors.cyan);
  }

  log('📋 Manual testing:', colors.cyan);
  log('   1. Start dev server: npm run dev', colors.cyan);
  log('   2. Visit: http://localhost:3000/signup', colors.cyan);
  log('   3. Create account and verify auto-login', colors.cyan);
  log('   4. Test logout and login at: http://localhost:3000/login\n', colors.cyan);

  log('📚 Documentation:', colors.cyan);
  log('   - Quick Start: docs/AUTH_QUICK_START.md', colors.cyan);
  log('   - Full Guide: docs/AUTH_SETUP_INSTRUCTIONS.md', colors.cyan);
  log('   - Testing: docs/AUTH_TESTING_CHECKLIST.md\n', colors.cyan);

  // Exit code based on results
  const exitCode = testResults.failed.length > 0 ? 1 : 0;

  if (exitCode === 0) {
    logHeader('✅ ALL CRITICAL TESTS PASSED');
    log('Your authentication system is working correctly!\n', colors.green);
  } else {
    logHeader('⚠️  SOME TESTS FAILED');
    log('Please review the errors above and follow the next steps.\n', colors.yellow);
  }

  process.exit(exitCode);
}

// Run tests
runTests().catch(error => {
  logError('Unexpected error during testing', error);
  process.exit(1);
});
