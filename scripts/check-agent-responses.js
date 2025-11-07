/**
 * Check if agent responses are being saved to database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkAgentResponses() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  CHECKING AGENT RESPONSES IN DATABASE                    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // 1. Check total message counts
  console.log('📊 Message Statistics:');
  console.log('─────────────────────────────────────────────────────────────');

  const { data: messages, error: msgError } = await supabase
    .from('agent_messages')
    .select('role, created_date, content, model_used');

  if (msgError) {
    console.error('❌ Error fetching messages:', msgError);
  } else {
    const userMessages = messages.filter(m => m.role === 'user').length;
    const assistantMessages = messages.filter(m => m.role === 'assistant').length;
    const latestMessage = messages.length > 0 ?
      new Date(Math.max(...messages.map(m => new Date(m.created_date)))).toISOString() :
      'None';

    console.log(`Total Messages: ${messages.length}`);
    console.log(`User Messages: ${userMessages}`);
    console.log(`Assistant Messages: ${assistantMessages} ${assistantMessages === 0 ? '❌ NO RESPONSES!' : '✅'}`);
    console.log(`Latest Message: ${latestMessage}`);
  }

  // 2. Check recent conversations
  console.log('\n📝 Recent Conversations:');
  console.log('─────────────────────────────────────────────────────────────');

  const { data: conversations, error: convError } = await supabase
    .from('agent_conversations')
    .select('id, agent_name, title, created_date')
    .order('created_date', { ascending: false })
    .limit(10);

  if (convError) {
    console.error('❌ Error fetching conversations:', convError);
  } else {
    for (const conv of conversations) {
      const { data: convMessages } = await supabase
        .from('agent_messages')
        .select('role')
        .eq('conversation_id', conv.id);

      const userCount = convMessages?.filter(m => m.role === 'user').length || 0;
      const assistantCount = convMessages?.filter(m => m.role === 'assistant').length || 0;

      console.log(`\n  ID: ${conv.id}`);
      console.log(`  Agent: ${conv.agent_name}`);
      console.log(`  Title: ${conv.title}`);
      console.log(`  Created: ${new Date(conv.created_date).toLocaleString()}`);
      console.log(`  Messages: ${userCount} user, ${assistantCount} assistant ${assistantCount === 0 ? '❌' : '✅'}`);
    }
  }

  // 3. Show actual message contents
  console.log('\n💬 Recent Messages (last 10):');
  console.log('─────────────────────────────────────────────────────────────');

  const { data: recentMessages, error: recentError } = await supabase
    .from('agent_messages')
    .select('role, content, model_used, created_date, conversation_id')
    .order('created_date', { ascending: false })
    .limit(10);

  if (recentError) {
    console.error('❌ Error fetching recent messages:', recentError);
  } else {
    for (const msg of recentMessages) {
      console.log(`\n  [${msg.role.toUpperCase()}] ${new Date(msg.created_date).toLocaleString()}`);
      console.log(`  Model: ${msg.model_used || 'not specified'}`);
      console.log(`  Content: ${msg.content ? msg.content.substring(0, 200) + (msg.content.length > 200 ? '...' : '') : 'NULL/EMPTY ❌'}`);
      console.log(`  Conversation: ${msg.conversation_id}`);
    }
  }

  // 4. Check agent definitions
  console.log('\n🤖 Agent Definitions:');
  console.log('─────────────────────────────────────────────────────────────');

  const { data: agents, error: agentError } = await supabase
    .from('agent_definitions')
    .select('agent_name, display_name, default_model, is_active');

  if (agentError) {
    console.error('❌ Error fetching agents:', agentError);
  } else {
    agents.forEach(agent => {
      console.log(`  ${agent.display_name}: ${agent.default_model} ${agent.is_active ? '✅' : '❌ INACTIVE'}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

checkAgentResponses().catch(error => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});
