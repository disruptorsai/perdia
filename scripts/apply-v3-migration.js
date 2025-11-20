/**
 * Apply V3 Migration Script
 * Runs the v3 schema updates directly against Supabase using the service role key
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = 'https://yvvtsfgryweqfppilkvo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dnRzZmdyeXdlcWZwcGlsa3ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI5MDM0MSwiZXhwIjoyMDc3ODY2MzQxfQ.XNbwVWQS5Vya10ee_PhEjWvRg-Gp8f3yWTzLMWBuCTU';

// Create admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('Starting V3 Migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251119000001_perdia_v3_schema_updates.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Migration file loaded successfully.');
    console.log('Applying migration to database...\n');

    // Execute the SQL using Supabase's rpc or raw query
    // Note: Supabase doesn't have a direct SQL execution endpoint via JS client
    // We need to use the postgres connection or break down the SQL

    // Split by major sections and execute individually
    const sections = [
      // 1. Create shortcodes table
      `CREATE TABLE IF NOT EXISTS shortcodes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        syntax TEXT NOT NULL,
        description TEXT,
        category TEXT CHECK (category IN ('monetization', 'links', 'media', 'other')),
        example TEXT,
        is_active BOOLEAN DEFAULT true,
        created_date TIMESTAMPTZ DEFAULT NOW(),
        updated_date TIMESTAMPTZ DEFAULT NOW()
      )`,

      // 2. Create site_articles table
      `CREATE TABLE IF NOT EXISTS site_articles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        category TEXT,
        word_count INTEGER,
        last_verified TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT true,
        created_date TIMESTAMPTZ DEFAULT NOW(),
        updated_date TIMESTAMPTZ DEFAULT NOW()
      )`,

      // 3. Create content_ideas table
      `CREATE TABLE IF NOT EXISTS content_ideas (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        source TEXT CHECK (source IN ('keyword', 'cluster', 'trending', 'manual', 'ai_suggested')),
        keywords JSONB DEFAULT '[]'::jsonb,
        content_type TEXT CHECK (content_type IN ('ranking', 'career_guide', 'listicle', 'guide', 'faq')),
        priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'rejected')),
        trending_score REAL,
        notes TEXT,
        cluster_id UUID,
        article_id UUID,
        created_date TIMESTAMPTZ DEFAULT NOW(),
        updated_date TIMESTAMPTZ DEFAULT NOW()
      )`,

      // 4. Add columns to articles table
      `ALTER TABLE articles ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('ranking', 'career_guide', 'listicle', 'guide', 'faq'))`,
      `ALTER TABLE articles ADD COLUMN IF NOT EXISTS editor_score INTEGER CHECK (editor_score >= 0 AND editor_score <= 100)`,
      `ALTER TABLE articles ADD COLUMN IF NOT EXISTS risk_flags JSONB DEFAULT '[]'::jsonb`,
      `ALTER TABLE articles ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb`,
      `ALTER TABLE articles ADD COLUMN IF NOT EXISTS schema_markup JSONB`,
      `ALTER TABLE articles ADD COLUMN IF NOT EXISTS schema_valid BOOLEAN DEFAULT false`,
      `ALTER TABLE articles ADD COLUMN IF NOT EXISTS shortcode_valid BOOLEAN DEFAULT false`,
      `ALTER TABLE articles ADD COLUMN IF NOT EXISTS internal_links JSONB DEFAULT '[]'::jsonb`,
      `ALTER TABLE articles ADD COLUMN IF NOT EXISTS external_links JSONB DEFAULT '[]'::jsonb`,
      `ALTER TABLE articles ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb`,
      `ALTER TABLE articles ADD COLUMN IF NOT EXISTS auto_publish_at TIMESTAMPTZ`,
      `ALTER TABLE articles ADD COLUMN IF NOT EXISTS source_idea_id UUID`,

      // 5. Enable RLS
      `ALTER TABLE shortcodes ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE site_articles ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY`,

      // 6. Create RLS policies for shortcodes
      `CREATE POLICY IF NOT EXISTS "Users can view own shortcodes" ON shortcodes FOR SELECT USING (auth.uid() = user_id)`,
      `CREATE POLICY IF NOT EXISTS "Users can create own shortcodes" ON shortcodes FOR INSERT WITH CHECK (auth.uid() = user_id)`,
      `CREATE POLICY IF NOT EXISTS "Users can update own shortcodes" ON shortcodes FOR UPDATE USING (auth.uid() = user_id)`,
      `CREATE POLICY IF NOT EXISTS "Users can delete own shortcodes" ON shortcodes FOR DELETE USING (auth.uid() = user_id)`,

      // 7. Create RLS policies for site_articles
      `CREATE POLICY IF NOT EXISTS "Users can view own site_articles" ON site_articles FOR SELECT USING (auth.uid() = user_id)`,
      `CREATE POLICY IF NOT EXISTS "Users can create own site_articles" ON site_articles FOR INSERT WITH CHECK (auth.uid() = user_id)`,
      `CREATE POLICY IF NOT EXISTS "Users can update own site_articles" ON site_articles FOR UPDATE USING (auth.uid() = user_id)`,
      `CREATE POLICY IF NOT EXISTS "Users can delete own site_articles" ON site_articles FOR DELETE USING (auth.uid() = user_id)`,

      // 8. Create RLS policies for content_ideas
      `CREATE POLICY IF NOT EXISTS "Users can view own content_ideas" ON content_ideas FOR SELECT USING (auth.uid() = user_id)`,
      `CREATE POLICY IF NOT EXISTS "Users can create own content_ideas" ON content_ideas FOR INSERT WITH CHECK (auth.uid() = user_id)`,
      `CREATE POLICY IF NOT EXISTS "Users can update own content_ideas" ON content_ideas FOR UPDATE USING (auth.uid() = user_id)`,
      `CREATE POLICY IF NOT EXISTS "Users can delete own content_ideas" ON content_ideas FOR DELETE USING (auth.uid() = user_id)`,

      // 9. Create indexes
      `CREATE INDEX IF NOT EXISTS idx_shortcodes_user_id ON shortcodes(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_shortcodes_category ON shortcodes(category)`,
      `CREATE INDEX IF NOT EXISTS idx_site_articles_user_id ON site_articles(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_site_articles_category ON site_articles(category)`,
      `CREATE INDEX IF NOT EXISTS idx_content_ideas_user_id ON content_ideas(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_content_ideas_status ON content_ideas(status)`,
      `CREATE INDEX IF NOT EXISTS idx_content_ideas_priority ON content_ideas(priority DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_articles_type ON articles(type)`,
      `CREATE INDEX IF NOT EXISTS idx_articles_auto_publish_at ON articles(auto_publish_at)`,
      `CREATE INDEX IF NOT EXISTS idx_articles_source_idea_id ON articles(source_idea_id)`
    ];

    // Execute each section
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < sections.length; i++) {
      const sql = sections[i];
      const shortDesc = sql.substring(0, 60).replace(/\n/g, ' ') + '...';

      try {
        // Use fetch to call Supabase SQL endpoint directly
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            // This won't work directly, need to use postgres endpoint
          })
        });

        // Since Supabase doesn't expose raw SQL via REST, we'll report what needs to be done
        console.log(`[${i + 1}/${sections.length}] Would execute: ${shortDesc}`);
        successCount++;
      } catch (error) {
        console.error(`[${i + 1}/${sections.length}] Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n--- IMPORTANT ---');
    console.log('The Supabase JavaScript client does not support raw SQL execution.');
    console.log('Please apply the migration using one of these methods:\n');
    console.log('1. Supabase Dashboard SQL Editor:');
    console.log('   - Go to https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql');
    console.log('   - Copy and paste the contents of:');
    console.log('     supabase/migrations/20251119000001_perdia_v3_schema_updates.sql');
    console.log('   - Execute the SQL\n');
    console.log('2. Supabase CLI with proper access token:');
    console.log('   - Set SUPABASE_ACCESS_TOKEN environment variable');
    console.log('   - Run: npx supabase db push\n');
    console.log('3. Direct PostgreSQL connection:');
    console.log('   - Use pgAdmin or psql with the database connection string');
    console.log('   - Find connection string in Supabase Dashboard > Settings > Database\n');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
applyMigration();
