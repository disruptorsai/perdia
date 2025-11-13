#!/usr/bin/env node

/**
 * Apply Trigger Fix - Direct PostgreSQL Connection
 * Uses pg library to execute SQL directly
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse Supabase URL to get connection details
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

// Construct PostgreSQL connection string
// Format: postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
const connectionString = `postgresql://postgres.${projectRef}:${serviceKey}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

console.log('🔧 Applying trigger fix to Supabase database...\n');
console.log(`📡 Connecting to: ${projectRef}.supabase.co`);

const sql = `
-- Fix ambiguous column reference in set_auto_approve_at() trigger
CREATE OR REPLACE FUNCTION set_auto_approve_at()
RETURNS TRIGGER AS $$
DECLARE
  auto_approve_days INTEGER := 5; -- Default
  user_schedule RECORD;
BEGIN
  IF NEW.status = 'pending_review' AND (OLD.status IS NULL OR OLD.status != 'pending_review') THEN
    NEW.pending_since = NOW();

    -- Try to get user's custom auto_approve_days from automation_schedule
    -- FIX: Fully qualify column reference to avoid ambiguity
    SELECT automation_schedule.auto_approve_days INTO user_schedule
    FROM automation_schedule
    WHERE user_id = NEW.user_id AND enabled = true
    LIMIT 1;

    IF FOUND AND user_schedule.auto_approve_days IS NOT NULL THEN
      auto_approve_days := user_schedule.auto_approve_days;
    END IF;

    NEW.auto_approve_at = NOW() + (auto_approve_days || ' days')::INTERVAL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;

async function applyFix() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('⏳ Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('⏳ Executing trigger fix...');
    await client.query(sql);
    console.log('✅ Trigger function updated successfully!\n');

    // Verify the fix
    console.log('🔍 Verifying the fix...');
    const result = await client.query(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc
      WHERE proname = 'set_auto_approve_at'
    `);

    if (result.rows.length > 0) {
      const definition = result.rows[0].definition;
      if (definition.includes('automation_schedule.auto_approve_days')) {
        console.log('✅ Verification passed: Function contains explicit table reference');
      } else {
        console.log('⚠️  Warning: Function may not contain the fix');
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 What was fixed:');
    console.log('   Before: SELECT auto_approve_days INTO user_schedule');
    console.log('   After:  SELECT automation_schedule.auto_approve_days INTO user_schedule');
    console.log('\n✅ Article creation should now work without the 42702 error');

  } catch (error) {
    console.error('\n❌ Error applying fix:');
    console.error(error.message);

    if (error.message.includes('ENOTFOUND') || error.message.includes('connect')) {
      console.log('\n💡 Connection failed. Alternative approach:');
      console.log('\n📋 Manual execution in Supabase Dashboard:');
      console.log('1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new');
      console.log('2. Paste and execute this SQL:\n');
      console.log('─'.repeat(60));
      console.log(sql);
      console.log('─'.repeat(60));
    }

    process.exit(1);
  } finally {
    await client.end();
  }
}

applyFix();
