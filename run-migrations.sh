#!/bin/bash
# Run migrations using Supabase connection string
# Usage: ./run-migrations.sh

echo "🔄 Running Perdia database migrations..."

# You'll need to get your database connection string from:
# Supabase Dashboard > Project Settings > Database > Connection string (URI)
# Format: postgresql://postgres:[PASSWORD]@db.yvvtsfgryweqfppilkvo.supabase.co:5432/postgres

echo ""
echo "📋 To run migrations manually:"
echo "1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/editor"
echo "2. Click 'SQL Editor' > 'New query'"
echo "3. Copy/paste each migration file and click 'Run':"
echo "   - supabase/migrations/20251119000003_create_article_revision_table.sql"
echo "   - supabase/migrations/20251119000004_create_articles_table.sql"
echo "   - supabase/migrations/20251119000005_create_auto_publish_cron.sql"
echo ""
echo "✅ After running, refresh your browser!"
