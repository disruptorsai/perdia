# Execute Sprint 1 Migrations - Quick Start Guide

**⚡ FASTEST METHOD: 2 minutes to complete**

## TL;DR

1. Open: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new
2. Copy all text from: `supabase/migrations/APPLY_ALL_SPRINT1_MIGRATIONS.sql`
3. Paste in SQL Editor → Click "Run" → Wait 30 seconds
4. Run this separately: `ALTER DATABASE postgres SET app.settings.service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dnRzZmdyeXdlcWZwcGlsa3ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI5MDM0MSwiZXhwIjoyMDc3ODY2MzQxfQ.XNbwVWQS5Vya10ee_PhEjWvRg-Gp8f3yWTzLMWBuCTU';`
5. Verify: `node scripts/verify-sprint1-migrations.js`

## Current Status

🔴 **NOT APPLIED** - All tables and columns are missing (verified via script)

## Why Manual Execution?

Attempted automated methods:
- ❌ Supabase REST API - No exec_sql function available
- ❌ Supabase Management API - 401 Unauthorized
- ❌ Supabase CLI - Requires interactive auth
- ❌ Direct PostgreSQL - No password available
- ✅ **Manual via Dashboard - WORKS!**

## Step-by-Step Instructions

### Step 1: Open SQL Editor

Click this link to open Supabase SQL Editor:
```
https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new
```

Or navigate manually:
1. Go to https://supabase.com/dashboard
2. Select project: yvvtsfgryweqfppilkvo (Perdia)
3. Click "SQL Editor" in left sidebar
4. Click "+ New query"

### Step 2: Copy Migration SQL

**File location:**
```
C:\Users\Will\OneDrive\Documents\Projects\perdia\supabase\migrations\APPLY_ALL_SPRINT1_MIGRATIONS.sql
```

**How to copy:**
1. Open the file in your text editor (VS Code, Notepad++, etc.)
2. Select ALL text: `Ctrl+A`
3. Copy: `Ctrl+C`

**File size:** 21,209 characters (should take < 1 second to copy)

### Step 3: Paste and Execute

1. Click in the SQL Editor textarea
2. Paste: `Ctrl+V`
3. Click "Run" button (bottom right) OR press `Ctrl+Enter`
4. Wait 10-30 seconds for execution
5. Look for green success message at bottom

**Expected output:**
```
=================================================================
Sprint 1 Migrations Applied Successfully!
=================================================================

✅ Migration 0: update_updated_date_column() function created
✅ Migration 1: Tables, columns, views, functions created
   • shortcode_validation_logs
   • quote_sources
   • ai_usage_logs
   • content_queue (SLA columns added)
   • wordpress_connections (DB columns added)
✅ Migration 2: SLA cron job scheduled
```

### Step 4: Set Service Role Key

Run this SQL statement **separately** (paste in a new query):

```sql
ALTER DATABASE postgres SET app.settings.service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dnRzZmdyeXdlcWZwcGlsa3ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI5MDM0MSwiZXhwIjoyMDc3ODY2MzQxfQ.XNbwVWQS5Vya10ee_PhEjWvRg-Gp8f3yWTzLMWBuCTU';
```

This configures the service role key for the SLA auto-publish cron job.

### Step 5: Verify Success

Run the verification script:

```bash
node scripts/verify-sprint1-migrations.js
```

**Expected output (SUCCESS):**
```
============================================================
✅ shortcode_validation_logs table
✅ quote_sources table
✅ ai_usage_logs table
✅ content_queue.pending_since column
✅ content_queue.auto_approved column
============================================================

🎉 All Sprint 1 migrations have been applied!
```

### Step 6: Visual Confirmation

Check Supabase Dashboard to see new tables:

1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/editor
2. Look in left sidebar under "Tables"
3. Should see:
   - ✅ shortcode_validation_logs
   - ✅ quote_sources
   - ✅ ai_usage_logs

## What Gets Created

### 3 New Tables
- `shortcode_validation_logs` - Pre-publish validation tracking
- `quote_sources` - Real quote source tracking (Reddit, Twitter, forums)
- `ai_usage_logs` - AI cost monitoring (<$10/article target)

### 2 Updated Tables
- `content_queue` - Added SLA columns (pending_since, auto_approved, etc.)
- `wordpress_connections` - Added DB connection columns (db_host, db_port, etc.)

### 4 New Views
- `ai_cost_summary` - Aggregated AI costs
- `content_cost_analysis` - Cost per content item
- `validation_metrics_summary` - Validation statistics
- `quote_sourcing_metrics` - Quote source breakdown

### 3 New Functions
- `get_content_cost()` - Calculate AI cost for content
- `is_content_within_budget()` - Check if <$10
- `get_sla_status()` - Get SLA status (days pending/remaining)

### 1 New Cron Job
- `sla-autopublish-checker-daily` - Runs daily at 12PM UTC (8AM ET)
- Auto-approves content pending > 5 days

## Troubleshooting

### "Already exists" errors
**Status:** ✅ OK
**Meaning:** Migration was previously applied
**Action:** Continue, this is normal

### Red error messages
**Status:** ❌ Check message
**Common causes:**
- Incomplete copy/paste (missing characters)
- Syntax error (unlikely - file is tested)
- Permission issue (ensure you're logged in)

### Nothing happens after clicking "Run"
**Status:** ⏳ Wait longer
**Action:** Large SQL files take 10-30 seconds
**Backup:** Refresh page and try again

### Verification script still shows ❌
**Possible causes:**
1. Migration didn't execute fully (check for errors)
2. Wrong database (check VITE_SUPABASE_URL in .env.local)
3. RLS policies blocking access (unlikely with service role key)

**Action:** Re-run migration (it's idempotent - safe to run multiple times)

## After Migration Success

### Immediate Next Steps
1. ✅ Update Perdia SDK to include new entities
2. ✅ Build UI components for new tables
3. ✅ Update Edge Functions to use new schema
4. ✅ Test shortcode validation workflow
5. ✅ Test AI cost tracking
6. ✅ Configure WordPress database connections

### Testing Checklist
- [ ] Create test content and validate shortcodes
- [ ] Add test quote sources (Reddit, Twitter, manual)
- [ ] Generate content and verify AI cost logging
- [ ] Test 5-day SLA by setting pending_since to 6 days ago
- [ ] Verify cron job scheduled in pg_cron.job table

## Files Reference

**Migration Files:**
- `supabase/migrations/APPLY_ALL_SPRINT1_MIGRATIONS.sql` - **Use this one!**
- `supabase/migrations/20251110000000_create_missing_functions.sql` - Individual (optional)
- `supabase/migrations/20251110000001_sprint1_production_ready_schema.sql` - Individual (optional)
- `supabase/migrations/20251110000002_setup_sla_cron_job.sql` - Individual (optional)

**Helper Scripts:**
- `scripts/verify-sprint1-migrations.js` - Verification script
- `scripts/apply-sprint1-direct.js` - Attempted automated execution (didn't work)
- `scripts/MANUAL_MIGRATION_GUIDE.md` - Detailed manual guide

**Documentation:**
- `SPRINT1_MIGRATION_STATUS.md` - Detailed status report
- `docs/production-ready-plan/PERDIA_PRD_CORRECTED.md` - Sprint 1 requirements
- `docs/production-ready-plan/TECHNICAL_SPECS.md` - Technical specifications

## Support

**Supabase Dashboard:**
- Project: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo
- SQL Editor: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new
- Tables: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/editor

**Need Help?**
- Check Supabase logs: Dashboard → Logs → Database
- Review error in SQL Editor (shows line numbers)
- Re-run verification: `node scripts/verify-sprint1-migrations.js`

---

**Time Required:** 2-5 minutes
**Difficulty:** Easy (copy/paste + click)
**Risk:** Low (idempotent, no data loss)
**Rollback:** Not needed (additive only)

**Status:** ⚠️ Ready for execution - awaiting your action!
