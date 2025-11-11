# Sprint 1 Migrations - Application Guide

## Overview

This guide provides multiple methods for applying Sprint 1 database migrations to the Perdia Supabase database.

**Current Status:** Sprint 1 code is complete (80%). Only database migrations remain.

**Time Required:** 5-15 minutes

---

## 🎯 What These Migrations Do

### Migration 0: Create Missing Functions
- Creates `update_updated_date_column()` function required by other migrations

### Migration 1: Sprint 1 Production-Ready Schema
Creates:
- **3 New Tables:**
  - `shortcode_validation_logs` - Track validation results
  - `quote_sources` - Store scraped quotes from Reddit/Twitter/forums
  - `ai_usage_logs` - Track AI API usage and costs

- **Content Queue Updates:**
  - `pending_since` - When review started (SLA tracking)
  - `auto_approved` - Auto-approval flag
  - `auto_approved_date` - When auto-approved
  - `auto_approved_reason` - Why auto-approved

- **WordPress Connections Updates:**
  - `db_host`, `db_port`, `db_name`, `db_user` - Database connection details
  - `db_password_encrypted` - Encrypted database password
  - `db_ssl_enabled`, `db_connection_tested` - Connection settings

- **4 Views for Monitoring:**
  - `ai_cost_summary` - Aggregate AI costs
  - `content_cost_analysis` - Cost per article
  - `validation_metrics_summary` - Validation pass rates
  - `quote_sourcing_metrics` - Quote statistics

- **3 Utility Functions:**
  - `get_content_cost(content_id)` - Calculate AI cost for content
  - `is_content_within_budget(content_id)` - Check if <$10 budget met
  - `get_sla_status(content_id)` - Check auto-publish eligibility

### Migration 2: SLA Cron Job Setup
- Schedules daily job at 12:00 PM UTC (8:00 AM ET)
- Auto-publishes content pending review for 5+ days
- Creates `sla_cron_history` view for monitoring

---

## ✅ Method 1: Supabase Dashboard (Recommended - 5 minutes)

### Step 1: Open Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new

### Step 2: Copy Consolidated Migration File

**Windows PowerShell:**
```powershell
Get-Content supabase\migrations\APPLY_ALL_SPRINT1_MIGRATIONS.sql | clip
```

**Windows Command Prompt:**
```cmd
type supabase\migrations\APPLY_ALL_SPRINT1_MIGRATIONS.sql | clip
```

**Or manually:**
- Open: `supabase/migrations/APPLY_ALL_SPRINT1_MIGRATIONS.sql`
- Select All (Ctrl+A)
- Copy (Ctrl+C)

### Step 3: Paste and Execute

1. Paste into SQL Editor (Ctrl+V)
2. Click "Run" button or press Ctrl+Enter
3. Wait 10-30 seconds for completion
4. Look for green success message

### Step 4: Verify Success

You should see output like:
```
NOTICE: Sprint 1 Migrations Applied Successfully!
NOTICE: ✅ Migration 0: update_updated_date_column() function created
NOTICE: ✅ Migration 1: Tables, columns, views, functions created
NOTICE: ✅ Migration 2: SLA cron job scheduled
```

### Step 5: Set Service Role Key (Important!)

The cron job needs the service role key to call Edge Functions. Run this separately:

```sql
ALTER DATABASE postgres SET app.settings.service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dnRzZmdyeXdlcWZwcGlsa3ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI5MDM0MSwiZXhwIjoyMDc3ODY2MzQxfQ.XNbwVWQS5Vya10ee_PhEjWvRg-Gp8f3yWTzLMWBuCTU';
```

---

## 🔧 Method 2: PostgreSQL Direct Connection (10 minutes)

### Prerequisites

1. Get database password from Supabase Dashboard:
   - Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/database
   - Click "Reset Database Password"
   - Copy the new password

2. Add to `.env.local`:
   ```
   SUPABASE_DB_PASSWORD=your_password_here
   ```

### Run Migration Script

```bash
node scripts/apply-via-pg-direct.js
```

This script:
- Connects directly to PostgreSQL using `pg` package
- Executes the consolidated migration file
- Handles errors gracefully
- Provides detailed output

---

## 🔍 Method 3: Individual Migrations (15 minutes)

If you prefer to apply migrations one-by-one for debugging:

### Migration 0
```bash
# Copy to clipboard
type supabase\migrations\20251110000000_create_missing_functions.sql | clip
```
Then paste into SQL Editor and run.

### Migration 1
```bash
# Copy to clipboard
type supabase\migrations\20251110000001_sprint1_production_ready_schema.sql | clip
```
Then paste into SQL Editor and run.

### Migration 2
```bash
# Copy to clipboard
type supabase\migrations\20251110000002_setup_sla_cron_job.sql | clip
```

**Before running Migration 2:** Edit the service role key line (see Method 1, Step 5).

---

## ✅ Verification Steps

After applying migrations, verify they worked:

### 1. Check Tables Created

Run in SQL Editor:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('shortcode_validation_logs', 'quote_sources', 'ai_usage_logs');
```
**Expected:** 3 rows

### 2. Check Content Queue Columns

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'content_queue'
  AND column_name IN ('pending_since', 'auto_approved');
```
**Expected:** 2 rows

### 3. Check Cron Job Scheduled

```sql
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname = 'sla-autopublish-checker-daily';
```
**Expected:** 1 row with `active = true`

### 4. Run Verification Script

```bash
node scripts/verify-sprint1-migrations.js
```

---

## 🚨 Troubleshooting

### "already exists" Errors
✅ **Normal!** This means the migration was previously applied. Ignore these.

### Permission Denied
❌ Make sure you're using service role key, not anon key.

### Function Not Found
❌ Run Migration 0 first - it creates required functions.

### Cron Job Not Working
1. Check service role key was set (Method 1, Step 5)
2. Verify Edge Function is deployed:
   ```bash
   npx supabase functions list --project-ref yvvtsfgryweqfppilkvo
   ```
3. Check cron job history:
   ```sql
   SELECT * FROM sla_cron_history ORDER BY start_time DESC LIMIT 5;
   ```

---

## 📋 Next Steps After Migration

Once migrations are applied successfully:

1. **✅ Mark as Complete in Status Doc**
   - Update `docs/analyze/SPRINT1_STATUS.md`
   - Change status from 80% → 100%

2. **🧪 Test Edge Functions**
   ```bash
   # Test shortcode transformer
   curl -X POST \
     https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/shortcode-transformer \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     -H "Content-Type: application/json" \
     -d '{"html": "<p><a href=\"/test\">Link</a></p>"}'
   ```

3. **🚀 Start Sprint 2 Implementation**
   - Quote Scraper Edge Function
   - Cost Monitoring Middleware
   - WordPress Publishing Integration

4. **📊 Monitor System**
   - Check validation logs: `SELECT * FROM shortcode_validation_logs LIMIT 10;`
   - Check AI costs: `SELECT * FROM ai_cost_summary;`
   - Check SLA status: `SELECT * FROM cron.job;`

---

## 📚 Reference

- **Supabase Dashboard:** https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo
- **SQL Editor:** https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new
- **Database Settings:** https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/database
- **Edge Functions:** https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/functions

- **Sprint 1 Status:** `docs/analyze/SPRINT1_STATUS.md`
- **Implementation Guide:** `docs/production-ready-plan/IMPLEMENTATION_GUIDE.md`
- **Technical Specs:** `docs/production-ready-plan/TECHNICAL_SPECS.md`

---

## 🎯 Quick Summary

**Fastest Method:** Use Method 1 (Supabase Dashboard) - 5 minutes
1. Open SQL Editor
2. Copy/paste `APPLY_ALL_SPRINT1_MIGRATIONS.sql`
3. Run
4. Set service role key
5. Verify

**Done!** Sprint 1 will be 100% complete. 🎉

---

**Last Updated:** 2025-11-11
**Status:** Ready for execution
**Estimated Time:** 5-15 minutes depending on method chosen
