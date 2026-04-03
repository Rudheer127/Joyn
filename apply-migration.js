const fs = require('fs');
const https = require('https');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const migrationSql = fs.readFileSync('./supabase/migrations/003_jo_conversations_schema.sql', 'utf8');

const urlObj = new URL(supabaseUrl);
const hostname = urlObj.hostname;

const postData = JSON.stringify({
  query: migrationSql
});

const options = {
  hostname,
  path: '/rest/v1/rpc/execute_sql',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Applying migration 003_jo_conversations_schema.sql...');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✓ Migration applied successfully');
    } else {
      console.error('Migration failed:', res.statusCode, data);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
  process.exit(1);
});

req.write(postData);
req.end();
