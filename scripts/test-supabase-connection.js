// Test Supabase connection and list tables
import https from 'https';

const SUPABASE_URL = 'yvvtsfgryweqfppilkvo.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dnRzZmdyeXdlcWZwcGlsa3ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTAzNDEsImV4cCI6MjA3Nzg2NjM0MX0._Axuo5yYtZTj2df0Azau8zExvZHeQgKYlJ90B3WJRdk';

// Get schema to list tables
const options = {
  hostname: SUPABASE_URL,
  port: 443,
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'apikey': ANON_KEY
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const tables = Object.keys(json.paths)
        .filter(p => p !== '/')
        .map(p => p.replace('/', ''));

      console.log('='.repeat(60));
      console.log('SUPABASE MCP SERVER CONNECTION TEST');
      console.log('='.repeat(60));
      console.log('');
      console.log('Connection Status: SUCCESS');
      console.log(`Project URL: https://${SUPABASE_URL}`);
      console.log(`Project Ref: yvvtsfgryweqfppilkvo`);
      console.log('');
      console.log(`Tables found (${tables.length}):`);
      tables.forEach(t => console.log(`  - ${t}`));
      console.log('');
      console.log('='.repeat(60));
    } catch (e) {
      console.error('Error parsing response:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('Connection Error:', e.message);
});

req.end();
