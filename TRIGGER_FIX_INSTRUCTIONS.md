# Trigger Fix Instructions - Ambiguous Column Reference

## Problem Summary
PostgreSQL error 42702: "column reference 'auto_approve_days' is ambiguous"

This error blocks article creation because the `set_auto_approve_at()` trigger function has an ambiguous column reference.

## Solution
The migration file `supabase/migrations/20250113000001_fix_ambiguous_column.sql` contains the fix.

## Option 1: Manual Execution via Supabase Dashboard (RECOMMENDED)

This is the most reliable method and takes only 1 minute.

### Steps:

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new
   - Or navigate: Dashboard > SQL Editor > New Query

2. **Paste and Execute the SQL:**

```sql
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
```

3. **Click "Run" or press Ctrl+Enter**

4. **Verify Success:**
   - You should see: "Success. No rows returned"
   - This means the function was updated successfully

5. **Test Article Creation:**
   - Go to the Perdia app
   - Try creating a test article
   - Confirm no 42702 error occurs

## Option 2: Automated Execution via Script (Alternative)

If you prefer automation, you can use the prepared script:

```bash
# From project root
node scripts/apply-trigger-fix.mjs
```

**Note:** This requires a direct PostgreSQL connection which may need additional configuration.

## What the Fix Does

### Before (Ambiguous):
```sql
SELECT auto_approve_days INTO user_schedule
FROM automation_schedule
```

PostgreSQL doesn't know if `auto_approve_days` refers to:
- The local variable `auto_approve_days INTEGER := 5;`
- The table column `automation_schedule.auto_approve_days`

### After (Explicit):
```sql
SELECT automation_schedule.auto_approve_days INTO user_schedule
FROM automation_schedule
```

Now it's clear we want the table column, not the variable.

## Verification

After applying the fix, you can verify it worked by:

1. **Check the function definition:**
```sql
SELECT pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'set_auto_approve_at';
```

2. **Test article creation:**
   - Create a test article in the Perdia app
   - Confirm it saves to database successfully
   - No error 42702 should occur

## Files Involved

- **Migration:** `supabase/migrations/20250113000001_fix_ambiguous_column.sql`
- **Script:** `scripts/apply-trigger-fix.mjs`
- **This Document:** `TRIGGER_FIX_INSTRUCTIONS.md`

## Support

If you encounter any issues:
1. Check Supabase Dashboard > Database > Logs for detailed error messages
2. Verify you're executing the SQL with appropriate permissions
3. Ensure the `automation_schedule` table exists
4. Confirm the trigger `update_articles_auto_approve_at` exists on the `articles` table
