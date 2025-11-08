/**
 * Script to add featured image fields to content_queue table
 * Run with: node scripts/add-image-fields.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use admin client with service role key for migrations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addImageFields() {
  console.log('🔧 Adding featured image fields to content_queue table...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251107000003_add_featured_image_to_content_queue.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      // If exec_sql function doesn't exist, try direct execution
      console.log('⚠️  exec_sql function not available, trying alternative method...\n');

      // Split into individual statements and execute
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

      for (const statement of statements) {
        if (statement.includes('ALTER TABLE content_queue')) {
          console.log(`Executing: ${statement.substring(0, 80)}...`);
          const { error: execError } = await supabase.rpc('exec_sql', { sql_query: statement });
          if (execError) {
            console.log(`⚠️  Statement execution note: ${execError.message}`);
          }
        }
      }
    }

    // Verify the fields were added
    console.log('\n✅ Verifying fields were added...');
    const { data: testData, error: testError } = await supabase
      .from('content_queue')
      .select('id, featured_image_url, featured_image_path, featured_image_alt_text, featured_image_source')
      .limit(1);

    if (testError) {
      console.error('❌ Verification failed:', testError.message);
      console.log('\n💡 The fields may not have been added. You may need to run this migration manually in the Supabase SQL Editor:');
      console.log('\n' + migrationSQL);
      process.exit(1);
    }

    console.log('✅ Migration successful! Featured image fields added to content_queue table.');
    console.log('\nNew fields:');
    console.log('  - featured_image_url (TEXT)');
    console.log('  - featured_image_path (TEXT)');
    console.log('  - featured_image_alt_text (TEXT)');
    console.log('  - featured_image_source (TEXT with CHECK constraint)');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n💡 Please run this migration manually in the Supabase SQL Editor.');
    process.exit(1);
  }
}

addImageFields();
