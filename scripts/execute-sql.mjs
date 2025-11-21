import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://yvvtsfgryweqfppilkvo.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dnRzZmdyeXdlcWZwcGlsa3ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI5MDM0MSwiZXhwIjoyMDc3ODY2MzQxfQ.XNbwVWQS5Vya10ee_PhEjWvRg-Gp8f3yWTzLMWBuCTU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function executeSql() {
  try {
    const sql = fs.readFileSync('scripts/fix-source-idea-id.sql', 'utf8');

    console.log('🚀 Applying database migration...');
    console.log('─'.repeat(60));
    console.log('📄 SQL Script: scripts/fix-source-idea-id.sql');
    console.log('🗄️  Database: yvvtsfgryweqfppilkvo');
    console.log('─'.repeat(60));
    console.log('');

    // Split SQL into individual statements and execute them
    const statements = sql
      .split(/;\s*$/m)
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s !== '');

    let successCount = 0;
    let failCount = 0;

    for (const statement of statements) {
      if (!statement || statement.length < 10) continue;

      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          query: statement + ';'
        });

        if (error) {
          // Try direct query if RPC doesn't exist
          const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            method: 'POST',
            headers: {
              'apikey': SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: statement })
          });

          if (!response.ok) {
            console.log(`⚠️  Statement skipped (${response.status}):`,
              statement.substring(0, 50) + '...');
            failCount++;
            continue;
          }
        }

        console.log(`✅ Statement executed successfully`);
        successCount++;
      } catch (err) {
        console.log(`❌ Error:`, err.message);
        failCount++;
      }
    }

    console.log('');
    console.log('─'.repeat(60));
    console.log(`📊 Results: ${successCount} succeeded, ${failCount} failed/skipped`);

    if (failCount > 0) {
      console.log('');
      console.log('⚠️  Some statements could not be executed via API.');
      console.log('💡 Please apply the migration manually:');
      console.log('');
      console.log('   1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new');
      console.log('   2. Copy and paste this SQL:');
      console.log('');
      console.log(sql);
      console.log('');
      console.log('   3. Click "Run" to execute');
    } else {
      console.log('✅ Migration completed successfully!');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.log('');
    console.log('💡 Please apply the migration manually via Supabase SQL Editor');
    process.exit(1);
  }
}

executeSql();
