import https from 'https';
import fs from 'fs';

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dnRzZmdyeXdlcWZwcGlsa3ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI5MDM0MSwiZXhwIjoyMDc3ODY2MzQxfQ.XNbwVWQS5Vya10ee_PhEjWvRg-Gp8f3yWTzLMWBuCTU';
const PROJECT_REF = 'yvvtsfgryweqfppilkvo';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

const sql = fs.readFileSync('scripts/fix-source-idea-id.sql', 'utf8');

console.log('🚀 Applying database migration...');
console.log('─'.repeat(60));
console.log('📄 SQL Script: scripts/fix-source-idea-id.sql');
console.log('🗄️  Database: yvvtsfgryweqfppilkvo');
console.log('─'.repeat(60));

// We need to execute this via RPC or direct SQL execution
// Since we can't use the Management API, let's try using the REST API with a custom function

const options = {
  hostname: `${PROJECT_REF}.supabase.co`,
  path: '/rest/v1/rpc/exec',
  method: 'POST',
  headers: {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
};

const payload = JSON.stringify({ sql_query: sql });

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('\n📡 Response Status:', res.statusCode);
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Migration applied successfully!');
    } else if (res.statusCode === 404) {
      console.log('⚠️  RPC function not found. This is expected.');
      console.log('ℹ️  Please apply the migration manually using Supabase SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new');
      console.log('\n📋 Copy and paste this SQL:\n');
      console.log(sql);
    } else {
      console.log('❌ Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
  console.log('\n💡 Alternative: Apply migration manually');
  console.log('   1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new');
  console.log('   2. Copy and paste the SQL from scripts/fix-source-idea-id.sql');
  console.log('   3. Click "Run"');
});

req.write(payload);
req.end();
