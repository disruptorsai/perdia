#!/usr/bin/env node

/**
 * Execute SQL Fix via Supabase Management API
 * This uses the Supabase Management API to execute SQL
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const projectRef = 'yvvtsfgryweqfppilkvo';
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ Missing VITE_SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const sql = `
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

async function executeFix() {
  console.log('🔧 Applying trigger fix via Supabase API...\n');

  try {
    // Use Supabase Management API
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ SQL executed successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));

    console.log('\n✅ Trigger function has been updated');
    console.log('✅ Article creation should now work without errors');

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    console.log('\n📋 ALTERNATIVE: Execute manually in Supabase Dashboard');
    console.log('─'.repeat(70));
    console.log('URL: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new');
    console.log('\nSQL to execute:');
    console.log('─'.repeat(70));
    console.log(sql);
    console.log('─'.repeat(70));
  }
}

executeFix();
