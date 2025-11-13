#!/usr/bin/env node

/**
 * Fix Ambiguous Column Reference in set_auto_approve_at() Trigger
 * Direct execution using Supabase Management API
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const sql = `
-- Fix ambiguous column reference in set_auto_approve_at() trigger
CREATE OR REPLACE FUNCTION set_auto_approve_at()
RETURNS TRIGGER AS $$
DECLARE
  auto_approve_days INTEGER := 5; -- Default
  user_schedule RECORD;
BEGIN
  IF NEW.status = 'pending_review' AND (OLD.status IS NULL OR OLD.status != 'pending_review') THEN
    NEW.pending_since = NOW();

    -- Try to get user's custom auto_approve_days from automation_schedule
    -- FIX: Fully qualify column reference to avoid ambiguity
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
  console.log('🔧 Fixing ambiguous column reference in trigger...\n');

  try {
    // Use Supabase REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // Try alternative approach using psql endpoint
      console.log('⚠️  Trying alternative execution method...');

      const postgrestUrl = `${supabaseUrl}/rest/v1/`;
      const execResponse = await fetch(postgrestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ sql })
      });

      if (!execResponse.ok) {
        const errorText = await execResponse.text();
        console.error('❌ Failed to execute SQL:', errorText);

        // Manual fallback instructions
        console.log('\n📋 MANUAL EXECUTION REQUIRED:');
        console.log('─'.repeat(60));
        console.log('Please execute this SQL in Supabase SQL Editor:');
        console.log('(Dashboard > SQL Editor > New Query)\n');
        console.log(sql);
        console.log('─'.repeat(60));
        return;
      }
    }

    console.log('✅ Trigger function updated successfully!\n');
    console.log('📝 The fix has been applied:');
    console.log('   - Changed: SELECT auto_approve_days');
    console.log('   - To: SELECT automation_schedule.auto_approve_days');
    console.log('\n✅ Article creation should now work without errors');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n📋 MANUAL EXECUTION REQUIRED:');
    console.log('─'.repeat(60));
    console.log('Please execute this SQL in Supabase SQL Editor:');
    console.log('(Dashboard > SQL Editor > New Query)\n');
    console.log(sql);
    console.log('─'.repeat(60));
  }
}

fixTrigger();
