import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

// Supabase connection string format
const connectionString = 'postgresql://postgres.yvvtsfgryweqfppilkvo:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

// The password is derived from the service role key
// For Supabase, we can use the database password from the project settings
console.log('🚀 Applying database migration...');
console.log('─'.repeat(60));
console.log('📄 SQL Script: scripts/fix-source-idea-id.sql');
console.log('🗄️  Database: yvvtsfgryweqfppilkvo');
console.log('─'.repeat(60));
console.log('');

const sql = fs.readFileSync('scripts/fix-source-idea-id.sql', 'utf8');

console.log('⚠️  Direct database connection requires database password.');
console.log('💡 The migration SQL has been prepared. You have two options:');
console.log('');
console.log('Option 1: Apply via Supabase SQL Editor (Recommended)');
console.log('   1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new');
console.log('   2. Copy and paste the SQL below');
console.log('   3. Click "Run" to execute');
console.log('');
console.log('Option 2: Use Supabase CLI');
console.log('   Run: npx supabase db push --project-ref yvvtsfgryweqfppilkvo --include-all');
console.log('');
console.log('─'.repeat(60));
console.log('📋 SQL TO EXECUTE:');
console.log('─'.repeat(60));
console.log('');
console.log(sql);
console.log('');
console.log('─'.repeat(60));
console.log('');
console.log('ℹ️  After applying, verify with:');
console.log('   SELECT column_name, data_type FROM information_schema.columns');
console.log('   WHERE table_name = \'articles\' AND column_name = \'source_idea_id\';');
console.log('');
