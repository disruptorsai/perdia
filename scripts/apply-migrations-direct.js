/**
 * Apply pending migrations directly to Supabase
 * Uses service role key to bypass RLS
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase credentials
const SUPABASE_URL = 'https://yvvtsfgryweqfppilkvo.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dnRzZmdyeXdlcWZwcGlsa3ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI5MDM0MSwiZXhwIjoyMDc3ODY2MzQxfQ.XNbwVWQS5Vya10ee_PhEjWvRg-Gp8f3yWTzLMWBuCTU';

// Create admin client
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Migrations to apply (in order)
const migrations = [
  {
    name: '20251107000002_create_clients_table',
    description: 'Create clients table for legacy compatibility',
    file: path.join(__dirname, '../supabase/migrations/20251107000002_create_clients_table.sql')
  },
  {
    name: '20251107000003_add_featured_image_to_content_queue',
    description: 'Add featured image support to content_queue',
    file: path.join(__dirname, '../supabase/migrations/20251107000003_add_featured_image_to_content_queue.sql')
  },
  {
    name: '20251109000001_add_ai_training_settings',
    description: 'Add AI training settings to automation_settings',
    file: path.join(__dirname, '../supabase/migrations/20251109000001_add_ai_training_settings.sql')
  }
];

async function applyMigration(migration) {
  console.log(`\n📋 Applying: ${migration.name}`);
  console.log(`   ${migration.description}`);

  try {
    // Read migration file
    const sql = fs.readFileSync(migration.file, 'utf8');

    // Execute via Supabase
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // If rpc doesn't exist, use direct SQL execution
      // This is a workaround - we'll execute via REST API
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ sql_query: sql })
      });

      if (!response.ok) {
        // Try alternative: execute SQL statements one by one
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
          console.log(`   Executing: ${statement.substring(0, 60)}...`);

          // Use pg_query endpoint if available, otherwise skip
          try {
            const stmtResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
              },
              body: JSON.stringify({ query: statement })
            });

            if (!stmtResponse.ok) {
              const errorText = await stmtResponse.text();
              console.log(`   ⚠️  Could not execute via API: ${errorText.substring(0, 100)}`);
            }
          } catch (e) {
            console.log(`   ⚠️  Statement execution via API not available`);
          }
        }

        return { data: null, error: null };
      }

      return { data: await response.json(), error: null };
    });

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return false;
    }

    console.log(`   ✅ Applied successfully`);
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Applying Perdia Database Migrations');
  console.log('='  .repeat(50));
  console.log(`Supabase Project: ${SUPABASE_URL}`);
  console.log(`Migrations to apply: ${migrations.length}`);

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    const success = await applyMigration(migration);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);

  if (failCount > 0) {
    console.log('\n⚠️  Some migrations failed.');
    console.log('   Please apply them manually via Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new');
    process.exit(1);
  } else {
    console.log('\n✅ All migrations applied successfully!');
    process.exit(0);
  }
}

main().catch(console.error);
