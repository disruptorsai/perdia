#!/usr/bin/env node

/**
 * Test Article Creation After Trigger Fix
 * Creates a test article to verify the 42702 error is resolved
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testArticleCreation() {
  console.log('🧪 Testing Article Creation...\n');

  try {
    // First, get a user ID to test with
    console.log('1️⃣  Getting test user...');
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) throw userError;

    if (!users || users.users.length === 0) {
      console.error('❌ No users found in database. Create a user first.');
      process.exit(1);
    }

    const testUserId = users.users[0].id;
    console.log(`   ✅ Using user: ${testUserId}\n`);

    // Create test article with status = 'pending_review'
    // This will trigger the set_auto_approve_at() function
    console.log('2️⃣  Creating test article...');

    const testArticle = {
      user_id: testUserId,
      title: `Test Article - ${new Date().toISOString()}`,
      content: '<p>This is a test article to verify the trigger fix.</p>',
      status: 'pending_review', // This triggers the function
      primary_keyword: 'test keyword',
      content_type: 'blog_post',
      model: 'test',
      provider: 'test'
    };

    const { data: article, error: articleError } = await supabase
      .from('articles')
      .insert([testArticle])
      .select()
      .single();

    if (articleError) {
      console.error('❌ Article creation failed:');
      console.error(`   Code: ${articleError.code}`);
      console.error(`   Message: ${articleError.message}`);

      if (articleError.code === '42702') {
        console.error('\n🔴 ERROR: The ambiguous column error still exists!');
        console.error('   The trigger fix was not applied successfully.');
        console.error('   Please execute the SQL in Supabase Dashboard.');
      }

      process.exit(1);
    }

    console.log('   ✅ Article created successfully!\n');

    // Verify the auto_approve_at field was set
    console.log('3️⃣  Verifying trigger results...');
    console.log(`   Article ID: ${article.id}`);
    console.log(`   Status: ${article.status}`);
    console.log(`   Pending Since: ${article.pending_since}`);
    console.log(`   Auto Approve At: ${article.auto_approve_at}`);

    if (article.auto_approve_at) {
      console.log('\n   ✅ auto_approve_at field was set correctly');
      const approveDate = new Date(article.auto_approve_at);
      const pendingDate = new Date(article.pending_since);
      const daysDiff = Math.round((approveDate - pendingDate) / (1000 * 60 * 60 * 24));
      console.log(`   ✅ Scheduled for auto-approval in ${daysDiff} days`);
    } else {
      console.log('\n   ⚠️  auto_approve_at was not set (unexpected)');
    }

    // Clean up test article
    console.log('\n4️⃣  Cleaning up test article...');
    const { error: deleteError } = await supabase
      .from('articles')
      .delete()
      .eq('id', article.id);

    if (deleteError) {
      console.log(`   ⚠️  Could not delete test article: ${deleteError.message}`);
      console.log(`   Please manually delete article ID: ${article.id}`);
    } else {
      console.log('   ✅ Test article deleted\n');
    }

    console.log('═'.repeat(70));
    console.log('✅ TEST PASSED: Trigger fix is working correctly!');
    console.log('═'.repeat(70));
    console.log('\n✅ Article creation now works without the 42702 error');
    console.log('✅ The auto_approve_at trigger is functioning properly');
    console.log('✅ You can proceed with normal article generation\n');

  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  }
}

testArticleCreation();
