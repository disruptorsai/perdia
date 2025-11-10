/**
 * Execute migrations via Supabase SQL execution
 * Uses the Supabase Management API
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_PROJECT_REF = 'yvvtsfgryweqfppilkvo';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dnRzZmdyeXdlcWZwcGlsa3ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI5MDM0MSwiZXhwIjoyMDc3ODY2MzQxfQ.XNbwVWQS5Vya10ee_PhEjWvRg-Gp8f3yWTzLMWBuCTU';

async function executeSqlDirect(sql) {
  const url = `https://${SUPABASE_PROJECT_REF}.supabase.co/rest/v1/rpc/exec`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });

    const data = await response.text();

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${data}` };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

const migrations = [
  {
    name: 'clients_table',
    file: '../supabase/migrations/20251107000002_create_clients_table.sql'
  },
  {
    name: 'featured_images',
    file: '../supabase/migrations/20251107000003_add_featured_image_to_content_queue.sql'
  },
  {
    name: 'ai_training',
    file: '../supabase/migrations/20251109000001_add_ai_training_settings.sql'
  }
];

async function main() {
  console.log('📋 Reading migration files...\n');

  for (const migration of migrations) {
    const filePath = path.join(__dirname, migration.file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`Migration: ${migration.name}`);
    console.log('SQL to execute:');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    console.log();
  }

  console.log('\n✅ Migration files read successfully');
  console.log('\n🔧 To apply these migrations:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new');
  console.log('   2. Copy each SQL block above');
  console.log('   3. Paste and execute in the SQL Editor');
  console.log('   4. Verify no errors');
}

main().catch(console.error);
