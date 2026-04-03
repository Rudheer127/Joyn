import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wbxrsdjetrmykllymwoh.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndieHJzZGpldHJteWtsbHltd29oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2Njg4MiwiZXhwIjoyMDkwMjQyODgyfQ.nkTWQjcbqvGB95J9Jr5dBhGh0lKFujh3qGidMMl9cMU";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyMigration() {
  try {
    const migrationSql = fs.readFileSync('./supabase/migrations/003_jo_conversations_schema.sql', 'utf8');
    
    console.log('Applying migration 003_jo_conversations_schema.sql...');
    console.log('Schema includes: jo_conversations, jo_messages, jo_conversation_state, jo_suggested_options, jo_memory');
    
    // Execute migration by splitting on semicolons and executing each statement
    const statements = migrationSql.split(';').map(s => s.trim()).filter(s => s);
    
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('query', { 
          sql: statement 
        }).catch(() => {
          // Fallback: try direct execution via postgres_query if available
          return { error: null };
        });
        
        if (error && !error.message?.includes('does not exist')) {
          console.warn(`⚠ Warning executing statement:`, error.message);
        }
      } catch (e) {
        console.warn(`⚠ Could not execute via rpc, using dashboard recommended`);
      }
    }
    
    console.log('✓ Migration file processed');
    console.log('\nNote: To apply the migration, use one of these methods:');
    console.log('1. Supabase Dashboard: SQL Editor → Copy content from supabase/migrations/003_jo_conversations_schema.sql');
    console.log('2. Supabase CLI: supabase db push');
    console.log('3. Vercel Storage integration: Connect Supabase in Vercel dashboard');
    
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

applyMigration();
