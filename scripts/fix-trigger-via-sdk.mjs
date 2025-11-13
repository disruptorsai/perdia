#!/usr/bin/env node

/**
 * Fix Trigger via Supabase SDK
 * Uses @supabase/supabase-js to execute raw SQL
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const fixSQL = `
CREATE OR REPLACE FUNCTION set_auto_approve_at()
RETURNS TRIGGER AS $$
DECLARE
  auto_approve_days INTEGER := 5;
  user_schedule RECORD;
BEGIN
  IF NEW.status = 'pending_review' AND (OLD.status IS NULL OR OLD.status != 'pending_review') THEN
    NEW.pending_since = NOW();

    SELECT automation_schedule.auto_approve_days INTO user_schedule
    FROM automation_schedule
    WHERE user_id = NEW.user_id AND enabled = true
    LIMIT 1;

    IF FOUND AND user_schedule.auto_approve_days IS NOT NULL THEN
      auto_approve_days := user_schedule.auto_approve_days;
    END IF;

    NEW.auto_approve_at = NOW() + (auto_approve_days || ' days')::INTERVAL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;

async function fixTrigger() {
  console.log('🔧 Fixing trigger function via Supabase SDK...\n');

  try {
    // Try using RPC if available, otherwise provide manual instructions
    console.log('⏳ Attempting to execute SQL...');

    // Try to execute via raw SQL through Supabase
    // Note: This may not work if there's no RPC function to execute arbitrary SQL
    const { data, error } = await supabase.rpc('exec_raw_sql', {
      sql: fixSQL
    });

    if (error) {
      if (error.code === '42883') {
        console.log('⚠️  No exec_raw_sql function available (this is normal)');
        throw new Error('Need manual execution');
      } else {
        throw error;
      }
    }

    console.log('✅ SQL executed successfully!');
    console.log('✅ Trigger function updated');

  } catch (error) {
    console.log('\n📋 Manual Execution Required');
    console.log('═'.repeat(70));
    console.log('\nSupabase does not allow arbitrary SQL execution via SDK for security.');
    console.log('Please execute the SQL manually in the Supabase Dashboard.\n');

    console.log('🔗 Quick Link:');
    console.log('   https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new\n');

    console.log('📝 Steps:');
    console.log('   1. Click the link above (opens Supabase SQL Editor)');
    console.log('   2. Paste the SQL below');
    console.log('   3. Click "Run" or press Ctrl+Enter');
    console.log('   4. Verify you see "Success. No rows returned"\n');

    console.log('📄 SQL to Execute:');
    console.log('─'.repeat(70));
    console.log(fixSQL);
    console.log('─'.repeat(70));

    console.log('\n✅ After execution, article creation will work without the 42702 error');
  }
}

fixTrigger();
