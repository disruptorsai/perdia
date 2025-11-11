# Supabase Migrations

This folder contains all database migrations for the Perdia platform.

## Migration Files

### Initial Schema
- **20250104000001_perdia_complete_schema.sql** - Complete initial schema (16 tables, 4 storage buckets)

### Sprint 1 - Production Ready (Nov 2025)
- **20251110000001_sprint1_production_ready_schema.sql** - Production-ready features:
  - shortcode_validation_logs table
  - quote_sources table
  - ai_usage_logs table
  - SLA columns on content_queue
  - WordPress database connection columns
  - Cost monitoring views
  - Validation metrics views
- **20251110000002_setup_sla_cron_job.sql** - Cron job for SLA auto-publish checker

## Applying Migrations

### Local Development

```bash
# Apply all pending migrations
npm run db:migrate

# Or use Supabase CLI directly
npx supabase db push
```

### Production (Supabase Cloud)

**Option 1: Supabase Dashboard (Recommended for Production)**
1. Go to https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo
2. Navigate to SQL Editor
3. Copy migration file contents
4. Execute SQL
5. Verify no errors

**Option 2: Supabase CLI**
```bash
# Link to project
npx supabase link --project-ref yvvtsfgryweqfppilkvo

# Push migrations
npx supabase db push
```

**Option 3: psql**
```bash
# Connect to Supabase database
psql "postgresql://postgres:[password]@db.yvvtsfgryweqfppilkvo.supabase.co:5432/postgres"

# Run migration
\i supabase/migrations/20251110000001_sprint1_production_ready_schema.sql
```

## Migration Order

Migrations must be applied in chronological order (by timestamp):

1. 20250104000001 - Initial schema (✅ Already applied)
2. 20251110000001 - Sprint 1 schema (📝 New)
3. 20251110000002 - SLA cron job (📝 New)

## Verifying Migrations

### Check Tables Exist

```sql
-- Check new tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('shortcode_validation_logs', 'quote_sources', 'ai_usage_logs');

-- Expected: 3 rows
```

### Check Columns Added

```sql
-- Check content_queue SLA columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'content_queue'
  AND column_name IN ('pending_since', 'auto_approved', 'auto_approved_date', 'auto_approved_reason');

-- Expected: 4 rows
```

### Check Views Created

```sql
-- List views
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('ai_cost_summary', 'content_cost_analysis', 'validation_metrics_summary', 'quote_sourcing_metrics');

-- Expected: 4 rows
```

### Check Functions Created

```sql
-- List functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_content_cost', 'is_content_within_budget', 'get_sla_status');

-- Expected: 3 rows
```

### Check Cron Jobs

```sql
-- List cron jobs
SELECT jobname, schedule, command
FROM cron.job
WHERE jobname LIKE '%sla%';

-- Expected: 1 row (sla-autopublish-checker-daily)
```

## Rollback Procedures

### Rollback Sprint 1 Schema (If Needed)

```sql
-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS shortcode_validation_logs CASCADE;
DROP TABLE IF EXISTS quote_sources CASCADE;
DROP TABLE IF EXISTS ai_usage_logs CASCADE;

-- Remove columns from content_queue
ALTER TABLE content_queue
DROP COLUMN IF EXISTS pending_since,
DROP COLUMN IF EXISTS auto_approved,
DROP COLUMN IF EXISTS auto_approved_date,
DROP COLUMN IF EXISTS auto_approved_reason;

-- Remove columns from wordpress_connections
ALTER TABLE wordpress_connections
DROP COLUMN IF EXISTS db_host,
DROP COLUMN IF EXISTS db_port,
DROP COLUMN IF EXISTS db_name,
DROP COLUMN IF EXISTS db_user,
DROP COLUMN IF EXISTS db_password_encrypted,
DROP COLUMN IF EXISTS db_ssl_enabled,
DROP COLUMN IF EXISTS db_connection_tested,
DROP COLUMN IF EXISTS db_last_test_date,
DROP COLUMN IF EXISTS db_test_error;

-- Drop views
DROP VIEW IF EXISTS ai_cost_summary CASCADE;
DROP VIEW IF EXISTS content_cost_analysis CASCADE;
DROP VIEW IF EXISTS validation_metrics_summary CASCADE;
DROP VIEW IF EXISTS quote_sourcing_metrics CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_content_cost(UUID);
DROP FUNCTION IF EXISTS is_content_within_budget(UUID);
DROP FUNCTION IF EXISTS get_sla_status(UUID);
DROP FUNCTION IF EXISTS set_pending_since();

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_set_pending_since ON content_queue;
```

### Rollback Cron Job

```sql
-- Unschedule cron job
SELECT cron.unschedule('sla-autopublish-checker-daily');
```

## Testing Migrations

### Test in Local Supabase First

```bash
# Start local Supabase
npx supabase start

# Apply migrations
npx supabase db push

# Verify tables
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\dt"

# Test insert
psql postgresql://postgres:postgres@localhost:54322/postgres -c "
INSERT INTO ai_usage_logs (user_id, provider, model, input_tokens, output_tokens, input_cost_per_token, output_cost_per_token)
VALUES ('00000000-0000-0000-0000-000000000000', 'claude', 'claude-sonnet-4-5', 1000, 500, 0.000003, 0.000015);

SELECT * FROM ai_usage_logs;
"

# Test cost calculation
psql postgresql://postgres:postgres@localhost:54322/postgres -c "
SELECT total_cost FROM ai_usage_logs;
"

# Expected: 0.0105 (1000 * 0.000003 + 500 * 0.000015)
```

## Common Issues

### Issue: "relation already exists"
**Solution:** Migration was already applied. Check with:
```sql
SELECT * FROM information_schema.tables WHERE table_name = 'ai_usage_logs';
```

### Issue: "column already exists"
**Solution:** Column was already added. Migrations use `IF NOT EXISTS` to prevent this.

### Issue: RLS policy blocks inserts
**Solution:** Ensure you're authenticated:
```javascript
const { data: user } = await supabase.auth.getUser();
console.log('Current user:', user);
```

### Issue: Cron job not running
**Solution:**
```sql
-- Check cron job exists
SELECT * FROM cron.job WHERE jobname = 'sla-autopublish-checker-daily';

-- Check recent runs
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sla-autopublish-checker-daily')
ORDER BY start_time DESC
LIMIT 5;
```

## Migration Best Practices

1. **Always test locally first** using `npx supabase start`
2. **Backup production** before applying migrations
3. **Use transactions** (migrations run in transaction by default)
4. **Add `IF NOT EXISTS`** to prevent errors on re-run
5. **Document changes** in migration comments
6. **Version control** all migrations (never modify existing migrations)
7. **Test rollback** procedures before production deployment

## Next Migrations

Future migrations will be added in chronological order:
- Sprint 2: Quote scraping enhancements
- Sprint 2: Cost monitoring dashboard tables
- Sprint 3: Analytics and reporting tables
- Sprint 4: Production optimizations

## Support

**Questions about migrations?**
- Check this README first
- Review migration file comments
- Test in local Supabase
- Check Supabase logs for errors
- Reference: [Supabase Migrations Docs](https://supabase.com/docs/guides/database/migrations)

---

**Last Updated:** 2025-11-10
**Status:** Sprint 1 migrations ready for deployment
