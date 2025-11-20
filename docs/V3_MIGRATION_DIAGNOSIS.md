# V3 Migration Diagnosis Report

**Date:** 2025-11-19
**Issue:** Column 'user_id' does not exist error during V3 migration
**Status:** Root cause identified, fix script created

## Executive Summary

The V3 migration (`20251119000001_perdia_v3_schema_updates.sql`) was **partially executed**, creating tables with missing `user_id` columns. The error occurs when the migration attempts to create RLS policies that reference the missing column.

## Database State Analysis

### Tables Created (6 total)

| Table | Exists | Has user_id | Row Count | Status |
|-------|--------|-------------|-----------|---------|
| `clusters` | ✅ Yes | ✅ Yes | 0 | OK |
| `training_data` | ✅ Yes | ✅ Yes | 0 | OK |
| `shortcodes` | ✅ Yes | ❌ Unknown | 0 | BROKEN |
| `site_articles` | ✅ Yes | ❌ Unknown | 0 | BROKEN |
| `content_ideas` | ✅ Yes | ❌ Unknown | 0 | BROKEN |
| `system_settings` | ✅ Yes | ❌ **NO** | **2** | BROKEN (HAS DATA) |

### Current system_settings Schema

```
Columns: id, setting_key, setting_value, setting_type, description, editable_by, created_date, updated_date
Missing: user_id ← CRITICAL!
```

### Migration Failure Point

The migration fails at **line 224** when creating RLS policies:

```sql
-- Line 224-225: This fails because user_id doesn't exist
CREATE POLICY "Users can view own system_settings" ON system_settings
  FOR SELECT USING (auth.uid() = user_id);  -- ← ERROR: column "user_id" does not exist
```

## Root Cause

The `CREATE TABLE` statements completed, but the `user_id` column was not created on 4 of the 6 tables. Possible causes:

1. **Interrupted transaction** - Migration was partially rolled back
2. **Schema conflict** - Tables existed from a previous attempt with different schema
3. **Permission issue** - Service role key may have been restricted
4. **IF NOT EXISTS behavior** - Tables existed without `user_id`, so they were not recreated

## Data Impact

### Critical: system_settings has 2 rows

These rows will be lost if we drop and recreate the table. The fix script backs them up and restores them with a default `user_id`.

### Safe: All other tables are empty

No data loss for the other 5 tables.

## Recommended Fix

### Step 1: Apply Fix Migration

The fix script is ready at:
```
supabase/migrations/20251119000001_fix_v3_tables.sql
```

This script:
1. Backs up `system_settings` data to a temp table
2. Drops the 4 broken tables (shortcodes, site_articles, content_ideas, system_settings)
3. Recreates them with correct schema (including `user_id`)
4. Re-enables RLS
5. Recreates policies
6. Recreates indexes and triggers
7. Restores `system_settings` data with first user's ID

### Step 2: Apply Using Scripts

**Option A: Using Node.js Script (Recommended)**
```bash
node scripts/apply-v3-migration.js
```

**Option B: Using PostgreSQL Script**
```bash
node scripts/apply-v3-migration-pg.js
```

**Option C: Direct SQL (Manual)**
```bash
npx supabase db push --project-ref yvvtsfgryweqfppilkvo
```

### Step 3: Verify Fix

After applying the fix, run the verification script:
```bash
node scripts/check-v3-tables.js
```

Expected output:
```
Total V3 tables checked: 6
  ✅ Existing tables: 6
  ❌ Missing tables: 0
  ✅ Tables WITH user_id: 6  ← Should be 6, not 2
  ❌ Tables WITHOUT user_id: 0  ← Should be 0
```

## Alternative: Clean Slate Approach

If the 2 rows in `system_settings` are not important, you can drop all V3 tables and re-run the original migration:

```bash
# Drop all V3 tables
node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const tables = ['shortcodes', 'site_articles', 'content_ideas', 'system_settings', 'clusters', 'training_data'];
for (const table of tables) {
  await supabase.rpc('exec_sql', { sql: \`DROP TABLE IF EXISTS \${table} CASCADE;\` });
}
"

# Re-run original migration
node scripts/apply-v3-migration.js
```

## Prevention for Future Migrations

1. **Test migrations locally first**
   ```bash
   npx supabase start
   npx supabase db reset
   # Test migration
   ```

2. **Use transactions explicitly**
   ```sql
   BEGIN;
   -- Your migration here
   COMMIT;
   ```

3. **Add validation checks**
   ```sql
   DO $$
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'user_id') THEN
       RAISE EXCEPTION 'Migration failed: user_id column not created';
     END IF;
   END $$;
   ```

4. **Always check schema after creation**
   ```sql
   SELECT column_name FROM information_schema.columns WHERE table_name = 'system_settings';
   ```

## Files Created

1. **Diagnosis Script:** `scripts/check-v3-tables.js`
   - Checks schema of all V3 tables
   - Identifies missing `user_id` columns
   - Reports data impact

2. **Fix Migration:** `supabase/migrations/20251119000001_fix_v3_tables.sql`
   - Drops broken tables
   - Recreates with correct schema
   - Restores `system_settings` data

3. **This Report:** `docs/V3_MIGRATION_DIAGNOSIS.md`

## Next Steps

1. Review the fix migration script
2. Backup database (optional, but recommended)
3. Apply fix migration using one of the methods above
4. Verify with `node scripts/check-v3-tables.js`
5. Test application functionality
6. Continue with seed data migration if needed

## Questions?

If you encounter issues:
1. Check Supabase project ref is correct: `yvvtsfgryweqfppilkvo`
2. Verify service role key is set in `.env.local`
3. Check database logs in Supabase dashboard
4. Run `node scripts/check-v3-tables.js` to see current state

---

**Report Generated:** 2025-11-19
**Generated By:** Perdia Infrastructure Manager
**Status:** Ready to fix
