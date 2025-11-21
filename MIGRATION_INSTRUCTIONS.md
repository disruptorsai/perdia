# Database Migration Instructions

## Status: Migration Required

The `source_idea_id` column is **MISSING** from the `articles` table and needs to be added.

## Verification

✅ **Confirmed:** The column does not exist (verified 2025-11-20)

Error message when attempting to insert:
```
Could not find the 'source_idea_id' column of 'articles' in the schema cache
```

## How to Apply the Migration

### Option 1: Supabase SQL Editor (Recommended - Fastest)

1. **Open the SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new

2. **Copy and paste the following SQL:**

```sql
-- ==============================================================
-- FIX: Add source_idea_id column to articles table
-- ==============================================================

-- 1. Add the source_idea_id column to articles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'source_idea_id'
  ) THEN
    ALTER TABLE articles ADD COLUMN source_idea_id UUID;
    RAISE NOTICE '✅ Added articles.source_idea_id column';
  ELSE
    RAISE NOTICE '⏭️  articles.source_idea_id column already exists';
  END IF;
END $$;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_articles_source_idea_id ON articles(source_idea_id);

-- 3. Add foreign key constraint to content_ideas table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'articles_source_idea_id_fkey'
  ) THEN
    ALTER TABLE articles
    ADD CONSTRAINT articles_source_idea_id_fkey
    FOREIGN KEY (source_idea_id) REFERENCES content_ideas(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added foreign key constraint';
  ELSE
    RAISE NOTICE '⏭️  Foreign key constraint already exists';
  END IF;
END $$;
```

3. **Click "Run"** to execute the SQL

4. **Verify success** by checking for these messages in the Results tab:
   - ✅ Added articles.source_idea_id column
   - ✅ Added foreign key constraint

### Option 2: Using Supabase CLI (If you have database password)

```bash
npx supabase db push --db-url "postgresql://postgres:[YOUR_PASSWORD]@db.yvvtsfgryweqfppilkvo.supabase.co:5432/postgres"
```

Note: This requires the database password from Supabase project settings.

## Post-Migration Verification

After applying the migration, verify it worked:

```bash
node scripts/check-schema.mjs
```

Expected output:
```
✅ source_idea_id column EXISTS!
   Successfully inserted test record
🧹 Cleaning up test record...
✅ Test record removed
```

## What This Migration Does

1. **Adds `source_idea_id` column** to the `articles` table (UUID type)
2. **Creates an index** on `source_idea_id` for faster queries
3. **Adds foreign key constraint** to link articles back to `content_ideas` table
4. **Sets ON DELETE SET NULL** so deleting a content idea won't delete the article

## Why This Is Needed

The application is attempting to create articles with a `source_idea_id` field, but the database schema is missing this column, causing PGRST204 errors:

```
Could not find the 'source_idea_id' column of 'articles' in the schema cache
```

This prevents articles from being created from content ideas in the V2 interface.

## Files Involved

- **Migration SQL:** `C:\Users\Disruptors\Documents\Disruptors Projects\perdia\perdia\scripts\fix-source-idea-id.sql`
- **Supabase Migration:** `C:\Users\Disruptors\Documents\Disruptors Projects\perdia\perdia\supabase\migrations\20251120000001_add_source_idea_id_to_articles.sql`
- **Verification Script:** `C:\Users\Disruptors\Documents\Disruptors Projects\perdia\perdia\scripts\check-schema.mjs`

## Troubleshooting

**If you see "column already exists":**
- Migration is already applied, no action needed

**If foreign key constraint fails:**
- Check that `content_ideas` table exists
- Verify RLS policies allow the operation

**If you don't have access to SQL Editor:**
- Contact your Supabase project owner
- Or provide database password for CLI approach

---

**Database:** yvvtsfgryweqfppilkvo
**Table:** articles
**Column to add:** source_idea_id (UUID)
**Status:** Awaiting manual application
