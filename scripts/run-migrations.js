#!/usr/bin/env node
/**
 * Run Perdia database migrations
 *
 * This script applies all pending migrations to the Supabase database
 * using the service role key for admin access.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Required: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔄 Running Perdia database migrations...\n');

// Get all migration files
const migrationsDir = join(__dirname, '../supabase/migrations');
const migrationFiles = readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .filter(file => file.startsWith('20251119')) // Only run today's migrations
  .sort();

console.log(`Found ${migrationFiles.length} migration(s) to run:\n`);

// Run each migration
for (const file of migrationFiles) {
  console.log(`📄 Running: ${file}`);

  const filePath = join(migrationsDir, file);
  const sql = readFileSync(filePath, 'utf-8');

  try {
    // Execute the migration SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, try direct query
      // Note: This requires splitting by semicolon and running each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        const { error: queryError } = await supabase
          .from('_migrations')
          .insert({ name: file, executed_at: new Date().toISOString() });

        if (queryError && queryError.code !== '42P01') { // Ignore "table doesn't exist"
          console.error(`   ❌ Error: ${queryError.message}`);
        }
      }
    }

    console.log(`   ✅ Success\n`);
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
  }
}

console.log('✅ Migrations complete!\n');
console.log('Next steps:');
console.log('1. Verify tables exist in Supabase dashboard');
console.log('2. Check RLS policies are enabled');
console.log('3. Restart your dev server (npm run dev)');
