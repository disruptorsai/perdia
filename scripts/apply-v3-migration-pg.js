/**
 * Apply V3 Migration Script using PostgreSQL direct connection
 * Runs the v3 schema updates directly against Supabase PostgreSQL
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase PostgreSQL connection string
// Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
const DATABASE_URL = 'postgresql://postgres.yvvtsfgryweqfppilkvo:Disruptors2025!@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

async function applyMigration() {
  console.log('Starting V3 Migration via PostgreSQL...\n');

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Connect to database
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('Connected successfully!\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251119000001_perdia_v3_schema_updates.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration SQL...\n');

    // Execute the full migration
    await client.query(migrationSQL);

    console.log('Migration executed successfully!\n');

    // Verify the migration
    console.log('Verifying migration results...\n');

    // Check tables
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('shortcodes', 'training_data', 'site_articles', 'content_ideas', 'system_settings')
      ORDER BY table_name
    `);

    console.log('V3 Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    console.log(`  Total: ${tablesResult.rows.length}/5 tables\n`);

    // Check articles columns
    const columnsResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'articles'
      AND column_name IN (
        'type', 'editor_score', 'risk_flags', 'faqs', 'schema_markup',
        'schema_valid', 'shortcode_valid', 'internal_links', 'external_links',
        'images', 'auto_publish_at', 'source_idea_id'
      )
      ORDER BY column_name
    `);

    console.log('V3 Articles columns added:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });
    console.log(`  Total: ${columnsResult.rows.length}/12 columns\n`);

    // Now apply the seed data migration
    console.log('Applying seed data migration...\n');
    const seedPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251119000002_perdia_v3_seed_data.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    await client.query(seedSQL);
    console.log('Seed data functions created!\n');

    console.log('=== MIGRATION COMPLETE ===\n');
    console.log('Summary:');
    console.log(`  - Tables: ${tablesResult.rows.length}/5 created`);
    console.log(`  - Articles columns: ${columnsResult.rows.length}/12 added`);
    console.log('  - Seed functions: Created\n');

    if (tablesResult.rows.length === 5 && columnsResult.rows.length === 12) {
      console.log('Status: SUCCESS - All V3 schema updates applied');
    } else {
      console.log('Status: PARTIAL - Some items may be missing, check above');
    }

  } catch (error) {
    console.error('Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

// Run migration
applyMigration();
