/**
 * Check if database has agents and seed if needed
 * Run with: node check-and-seed.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndSeed() {
  console.log('🔍 Checking database for agent definitions...\n');

  // Check if agents exist
  const { data: agents, error } = await supabase
    .from('agent_definitions')
    .select('agent_name, display_name')
    .eq('is_active', true);

  if (error) {
    console.error('❌ Error checking database:', error.message);
    console.log('\n📝 The agent_definitions table might not exist yet.');
    console.log('   Run migrations first: npm run db:migrate\n');
    process.exit(1);
  }

  if (agents && agents.length > 0) {
    console.log(`✅ Found ${agents.length} agents in database:\n`);
    agents.forEach((agent, i) => {
      console.log(`   ${i + 1}. ${agent.display_name} (${agent.agent_name})`);
    });
    console.log('\n✨ Database is already seeded! No action needed.\n');
    process.exit(0);
  } else {
    console.log('⚠️  No agents found in database.');
    console.log('\n🌱 Run seeding script: npm run db:seed\n');
    process.exit(1);
  }
}

checkAndSeed().catch(err => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
