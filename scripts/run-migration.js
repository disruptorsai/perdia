import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://yvvtsfgryweqfppilkvo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    const sqlPath = join(__dirname, 'fix-source-idea-id.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    console.log('🚀 Executing SQL migration...');
    console.log('─'.repeat(60));

    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    console.log('─'.repeat(60));

    // Verify the column exists
    console.log('\n🔍 Verifying articles table schema...');
    const { data: tableInfo, error: schemaError } = await supabase
      .from('articles')
      .select('*')
      .limit(0);

    if (schemaError) {
      console.error('Warning: Could not verify schema:', schemaError.message);
    } else {
      console.log('✅ Articles table is accessible');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

runMigration();
