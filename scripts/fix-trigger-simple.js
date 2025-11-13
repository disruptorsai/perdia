/**
 * SIMPLE TRIGGER FIX - Execute SQL directly
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixTrigger() {
  console.log('\n🔧 FIXING TRIGGER FUNCTION\n');

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
  `.trim();

  try {
    // Execute via RPC (if available)
    const { data, error } = await supabase.rpc('query', { query_text: sql });

    if (error) {
      console.log('ℹ️  RPC not available. Using dashboard instead.\n');
      console.log('📋 COPY THIS SQL AND RUN IN SUPABASE DASHBOARD:');
      console.log('=================================================\n');
      console.log(sql);
      console.log('\n=================================================\n');
      console.log('Steps:');
      console.log('1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new');
      console.log('2. Paste the SQL above');
      console.log('3. Click "Run"');
      console.log('4. Test article creation');
    } else {
      console.log('✅ Trigger function fixed!');
    }
  } catch (err) {
    console.log('\n📋 MANUAL FIX REQUIRED - Run this SQL in Supabase Dashboard:\n');
    console.log(sql);
    console.log('\n🔗 Dashboard URL: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new\n');
  }
}

fixTrigger();
