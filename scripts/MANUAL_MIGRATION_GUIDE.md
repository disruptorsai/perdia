# Sprint 1 Manual Migration Guide

Since automated SQL execution via API is not available, follow these steps to manually apply the Sprint 1 migrations to the Perdia Supabase database.

## Quick Option 1: Apply Consolidated Migration (RECOMMENDED)

**This is the fastest method - one file, one execution.**

### Steps:

1. **Open Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new
   ```

2. **Open the migration file:**
   - Location: `C:\Users\Will\OneDrive\Documents\Projects\perdia\supabase\migrations\APPLY_ALL_SPRINT1_MIGRATIONS.sql`
   - Select ALL text (Ctrl+A) and copy (Ctrl+C)

3. **Paste into SQL Editor:**
   - Paste the entire SQL content into the Supabase SQL Editor

4. **Execute the migration:**
   - Click "Run" button (or press Ctrl+Enter)
   - Wait 10-30 seconds for completion
   - Look for green success message

5. **Configure service role key:**
   After the migration completes, run this additional SQL statement separately:

   ```sql
   ALTER DATABASE postgres SET app.settings.service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dnRzZmdyeXdlcWZwcGlsa3ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI5MDM0MSwiZXhwIjoyMDc3ODY2MzQxfQ.XNbwVWQS5Vya10ee_PhEjWvRg-Gp8f3yWTzLMWBuCTU';
   ```

6. **Verify the migration:**
   ```bash
   node scripts/verify-sprint1-migrations.js
   ```

## Option 2: Apply Individual Migrations

If you prefer to apply migrations one at a time:

### Migration 0: Create Missing Functions
```
File: supabase/migrations/20251110000000_create_missing_functions.sql
```

1. Open SQL Editor
2. Copy/paste the file content
3. Run (Ctrl+Enter)

### Migration 1: Sprint 1 Production-Ready Schema
```
File: supabase/migrations/20251110000001_sprint1_production_ready_schema.sql
```

1. Open SQL Editor
2. Copy/paste the file content
3. Run (Ctrl+Enter)

### Migration 2: Setup SLA Cron Job
```
File: supabase/migrations/20251110000002_setup_sla_cron_job.sql
```

1. Open SQL Editor
2. Copy/paste the file content
3. **IMPORTANT:** Uncomment the service role key line and add the actual key
4. Run (Ctrl+Enter)

## What Gets Created

After successful migration, you will have:

### New Tables:
- `shortcode_validation_logs` - Tracks validation results for content
- `quote_sources` - Stores scraped quotes from Reddit, Twitter, forums
- `ai_usage_logs` - Monitors AI API costs per article

### Updated Tables:
- `content_queue` - Added SLA columns:
  - `pending_since` (timestamp when entered pending_review)
  - `auto_approved` (boolean flag)
  - `auto_approved_date` (timestamp)
  - `auto_approved_reason` (text explanation)

- `wordpress_connections` - Added database connection columns:
  - `db_host`, `db_port`, `db_name`
  - `db_user`, `db_password_encrypted`
  - `db_ssl_enabled`, `db_connection_tested`
  - `db_last_test_date`, `db_test_error`

### New Views:
- `ai_cost_summary` - Aggregated AI usage costs
- `content_cost_analysis` - Cost per content item
- `validation_metrics_summary` - Validation pass/fail rates
- `quote_sourcing_metrics` - Quote source statistics
- `sla_cron_history` - Cron job execution history

### New Functions:
- `update_updated_date_column()` - Auto-update timestamps
- `set_pending_since()` - Trigger for SLA tracking
- `get_content_cost(content_id)` - Calculate total cost
- `is_content_within_budget(content_id)` - Check <$10 target
- `get_sla_status(content_id)` - Check days pending/remaining

### New Cron Job:
- `sla-autopublish-checker-daily`
- Schedule: 12:00 PM UTC (8:00 AM ET) daily
- Calls Edge Function: `sla-autopublish-checker`

## Verification

After applying migrations, verify everything was created:

```bash
node scripts/verify-sprint1-migrations.js
```

Or manually check in Supabase Dashboard:

1. **Tables:** Database > Tables
   - Verify `shortcode_validation_logs`, `quote_sources`, `ai_usage_logs` exist

2. **Views:** Database > Views
   - Verify 5 new views exist

3. **Functions:** Database > Functions
   - Verify utility functions exist

4. **Cron Jobs:** Database > Cron Jobs (if available)
   - Verify `sla-autopublish-checker-daily` is scheduled

## Troubleshooting

### "Already exists" errors
- This is OK - it means the migration was previously applied
- The migration is idempotent (safe to run multiple times)

### Permission denied
- Ensure you're logged into Supabase Dashboard with admin access
- The SQL Editor should automatically use admin credentials

### Syntax errors
- Double-check you copied the ENTIRE file
- Make sure no characters were lost during copy/paste
- Try copying smaller sections if the file is too large

### Cron job not created
- Check if `pg_cron` extension is enabled
- May require Supabase Pro plan
- Contact Supabase support to enable cron jobs

## Next Steps After Migration

1. ✅ Run verification script
2. ✅ Test Edge Functions with new schema
3. ✅ Update frontend components to use new tables
4. ✅ Configure WordPress database connections
5. ✅ Test shortcode validation
6. ✅ Test quote scraping
7. ✅ Monitor AI cost tracking

## Support

If you encounter issues:

1. Check Supabase Dashboard for error messages
2. Review migration file for syntax errors
3. Verify service role key is correct
4. Check database logs in Supabase Dashboard
5. Run verification script for detailed diagnostics

## Database Access

- **Dashboard:** https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo
- **SQL Editor:** https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new
- **Project Ref:** yvvtsfgryweqfppilkvo
- **Region:** US East 1

---

**Status:** Ready for manual execution
**Last Updated:** 2025-11-11
**Sprint:** Sprint 1 (Week 1)
