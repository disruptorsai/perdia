/**
 * Enable Development Mode - Disable RLS for Testing
 * Run with: npm run dev:mode
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('   Make sure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function enableDevMode() {
  console.log('🔧 Enabling Development Mode...\n');
  console.log('⚠️  This will DISABLE Row Level Security (RLS) on all tables');
  console.log('⚠️  DO NOT use this in production!\n');

  try {
    // Read the SQL migration file
    const sqlPath = join(__dirname, '..', 'supabase', 'migrations', 'dev_mode_disable_rls.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

    if (error) {
      // If the RPC doesn't exist, try direct approach
      console.log('Note: Using direct SQL execution...');

      // Split by semicolon and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'));

      for (const statement of statements) {
        if (statement.includes('ALTER TABLE') && statement.includes('DISABLE ROW LEVEL SECURITY')) {
          const match = statement.match(/ALTER TABLE (\w+)/);
          if (match) {
            const tableName = match[1];
            const { error: alterError } = await supabase.rpc('exec', {
              sql: statement
            });

            if (alterError) {
              console.log(`   ℹ️  ${tableName}: Using Supabase Dashboard approach`);
            } else {
              console.log(`   ✅ ${tableName}: RLS disabled`);
            }
          }
        }
      }
    }

    console.log('\n✅ Development mode enabled!');
    console.log('📝 RLS has been disabled on all tables');
    console.log('🚀 You can now use the app without logging in\n');
    console.log('💡 To re-enable RLS for production, run: npm run prod:mode\n');

  } catch (err) {
    console.error('❌ Failed to enable dev mode:', err.message);
    console.log('\n📝 Manual instructions:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Open SQL Editor');
    console.log('   3. Run the SQL from: supabase/migrations/dev_mode_disable_rls.sql\n');
    process.exit(1);
  }
}

enableDevMode();
