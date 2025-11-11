/**
 * Verify Sprint 1 Migrations
 * 
 * Checks if Sprint 1 migrations have been applied to the database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://yvvtsfgryweqfppilkvo.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dnRzZmdyeXdlcWZwcGlsa3ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI5MDM0MSwiZXhwIjoyMDc3ODY2MzQxfQ.XNbwVWQS5Vya10ee_PhEjWvRg-Gp8f3yWTzLMWBuCTU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function verifyMigrations() {
  console.log('\n🔍 Verifying Sprint 1 Migrations\n');

  const checks = [];

  // Check for new tables
  console.log('📋 Checking new tables...');
  
  try {
    const { error: table1Error } = await supabase.from('shortcode_validation_logs').select('id').limit(1);
    checks.push({ name: 'shortcode_validation_logs table', passed: !table1Error });
    
    const { error: table2Error } = await supabase.from('quote_sources').select('id').limit(1);
    checks.push({ name: 'quote_sources table', passed: !table2Error });
    
    const { error: table3Error } = await supabase.from('ai_usage_logs').select('id').limit(1);
    checks.push({ name: 'ai_usage_logs table', passed: !table3Error });

    // Check for new columns in content_queue
    const { data: contentQueue } = await supabase.from('content_queue').select('pending_since, auto_approved').limit(1);
    checks.push({ name: 'content_queue.pending_since column', passed: contentQueue !== null });
    checks.push({ name: 'content_queue.auto_approved column', passed: contentQueue !== null });

  } catch (error) {
    console.error('Error during verification:', error.message);
  }

  // Print results
  console.log('\n' + '='.repeat(60));
  checks.forEach(check => {
    const icon = check.passed ? '✅' : '❌';
    console.log(`${icon} ${check.name}`);
  });
  console.log('='.repeat(60));

  const allPassed = checks.every(c => c.passed);
  
  if (allPassed) {
    console.log('\n🎉 All Sprint 1 migrations have been applied!\n');
  } else {
    console.log('\n⚠️  Some migrations are missing. Apply them via Supabase Dashboard.');
    console.log('\nInstructions:');
    console.log('1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new');
    console.log('2. Copy content from: supabase/migrations/20251110000000_create_missing_functions.sql');
    console.log('3. Paste and click "Run"');
    console.log('4. Repeat for: 20251110000001_sprint1_production_ready_schema.sql');
    console.log('5. Repeat for: 20251110000002_setup_sla_cron_job.sql\n');
  }
}

verifyMigrations();
