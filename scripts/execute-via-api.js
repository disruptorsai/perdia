/**
 * Execute V3 Migration via Supabase REST API
 *
 * Uses the Supabase service role key to execute SQL directly.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('Could not extract project ref from URL:', supabaseUrl);
  process.exit(1);
}

console.log('Project ref:', projectRef);

// Build database connection string
// Using Supabase's pooled connection
const connectionString = `postgresql://postgres.${projectRef}:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

async function executeSQL(sql, description) {
  console.log(`\nExecuting: ${description}`);

  // Use Supabase's SQL API endpoint
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      // This won't work directly - Supabase doesn't expose raw SQL execution via REST
    })
  });

  return response;
}

async function main() {
  console.log('\n');
  console.log('*'.repeat(60));
  console.log('*  PERDIA V3 DATABASE MIGRATION');
  console.log('*'.repeat(60));
  console.log('\nTarget:', supabaseUrl);

  // Since we can't execute raw SQL via REST API without a custom function,
  // let's output the migration SQL in a format that's easy to copy-paste

  const migrationPath = path.join(__dirname, 'v3-full-migration.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split into manageable chunks for easier execution
  console.log('\n');
  console.log('='.repeat(60));
  console.log('MIGRATION EXECUTION OPTIONS');
  console.log('='.repeat(60));

  console.log(`
OPTION 1: Supabase SQL Editor (Recommended)
-------------------------------------------
1. Open: https://supabase.com/dashboard/project/${projectRef}/sql/new
2. Copy SQL from: ${migrationPath}
3. Paste and click "Run"

OPTION 2: psql Command Line
---------------------------
If you have the database password, run:

psql "postgresql://postgres:PASSWORD@db.${projectRef}.supabase.co:5432/postgres" -f "${migrationPath}"

OPTION 3: Using Supabase CLI with linked project
------------------------------------------------
npx supabase db push --local

Note: This requires the project to be linked, which needs proper authentication.

`);

  // Let's also verify what tables currently exist
  console.log('Current tables in database can be verified at:');
  console.log(`https://supabase.com/dashboard/project/${projectRef}/editor`);

  console.log('\n');
  console.log('VERIFICATION SQL');
  console.log('-'.repeat(60));
  console.log(`
After running the migration, verify with this query:

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('clusters', 'shortcodes', 'training_data',
                   'site_articles', 'content_ideas', 'system_settings')
ORDER BY table_name;

Expected result: 6 tables
- clusters
- content_ideas
- shortcodes
- site_articles
- system_settings
- training_data
`);
}

main().catch(console.error);
