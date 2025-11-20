/**
 * Execute V3 Migration via Supabase PostgreSQL Connection
 *
 * This script connects directly to the PostgreSQL database to run migrations.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

// Database connection string from Supabase
// Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
const databaseUrl = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL or VITE_DATABASE_URL in .env.local');
  console.log(`
To get the database URL:
1. Go to Supabase Dashboard > Project Settings > Database
2. Copy the "Connection string" (URI format)
3. Add to .env.local as DATABASE_URL=postgresql://...

Alternatively, you can run the SQL directly in the Supabase SQL Editor:
https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql
`);
  process.exit(1);
}

async function executeMigration() {
  console.log('\n');
  console.log('*'.repeat(60));
  console.log('*  PERDIA V3 DATABASE MIGRATION - DIRECT EXECUTION');
  console.log('*'.repeat(60));

  // Read the migration file
  const migrationPath = path.join(__dirname, 'v3-full-migration.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log(`\nMigration file: ${migrationPath}`);
  console.log(`SQL length: ${sql.length} characters`);

  // Create PostgreSQL connection pool
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('\nConnecting to database...');
    const client = await pool.connect();
    console.log('Connected successfully!');

    console.log('\nExecuting migration...');

    // Split SQL into statements and execute
    // Note: We execute the whole thing as a single transaction
    await client.query('BEGIN');

    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log('\nMigration executed successfully!');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    // Verify tables were created
    console.log('\nVerifying created tables...');
    const verifyResult = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('clusters', 'shortcodes', 'training_data',
                         'site_articles', 'content_ideas', 'system_settings')
      ORDER BY table_name;
    `);

    console.log('\nCreated tables:');
    verifyResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    const expectedTables = ['clusters', 'content_ideas', 'shortcodes', 'site_articles', 'system_settings', 'training_data'];
    const createdTables = verifyResult.rows.map(r => r.table_name);
    const missingTables = expectedTables.filter(t => !createdTables.includes(t));

    if (missingTables.length > 0) {
      console.log('\nWARNING: Missing tables:', missingTables.join(', '));
    } else {
      console.log('\nAll tables created successfully!');
    }

    await pool.end();

  } catch (err) {
    console.error('\nMigration failed:', err.message);
    if (err.detail) console.error('Detail:', err.detail);
    if (err.hint) console.error('Hint:', err.hint);
    await pool.end();
    process.exit(1);
  }
}

executeMigration();
