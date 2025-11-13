/**
 * APPLY TRIGGER FIX FOR AMBIGUOUS COLUMN REFERENCE
 * ==================================================
 * Fixes the set_auto_approve_at() trigger function
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyFix() {
  console.log('\n🔧 APPLYING TRIGGER FIX');
  console.log('======================\n');

  const sql = `
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

  try {
    console.log('Executing SQL fix...');

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct query instead
      console.log('Trying direct query...');
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({ sql_query: sql })
      });

      if (!response.ok) {
        console.error('❌ Direct query failed, applying via Supabase CLI...\n');
        console.log('Run this command:');
        console.log('npx supabase db execute --file supabase/migrations/20250113000001_fix_ambiguous_column.sql --project-ref yvvtsfgryweqfppilkvo');
        process.exit(1);
      }
    }

    console.log('✅ Trigger function updated successfully!\n');
    console.log('Test by creating an article now.');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📝 Manual fix required:');
    console.log('Run: npx supabase db execute --file supabase/migrations/20250113000001_fix_ambiguous_column.sql --project-ref yvvtsfgryweqfppilkvo');
  }
}

applyFix();
