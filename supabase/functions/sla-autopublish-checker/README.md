# SLA Auto-Publish Checker Edge Function

**Purpose:** Enforce 5-day Service Level Agreement for content review and auto-publish validated content

**Status:** ✅ Implemented (Sprint 1, Week 1)

---

## Why This Exists

**Client Requirement (Tony & Kaylee, Nov 10, 2025 transcript):**

**Tony:** "could we have the review process built in and if a piece of content is not reviewed within five days it automatically gets posted"

**Kaylee:** "I think that would be good."

**Why This Matters:**
- **Prevents bottlenecks:** Content doesn't sit indefinitely in review queue
- **Maintains velocity:** Ensures 77 articles/week publishing goal
- **Accountability:** Creates urgency for reviewers (Sarah)
- **Quality assurance:** Still validates content before auto-publishing

**Philosophy:** Trust the system. If content passes all quality gates after 5 days, publish it automatically.

---

## How It Works

### Workflow

```
Every Day (Cron Job)
    ↓
Find content: status='pending_review' AND pending_since >= 5 days ago
    ↓
For each content item:
    ↓
    ├─→ Re-run pre-publish validator
    │
    ├─→ Validation PASSED?
    │   └─→ YES:
    │       ├─→ Update status: 'approved'
    │       ├─→ Set scheduled_publish_date: NOW
    │       ├─→ Mark: auto_approved=true
    │       ├─→ Add notes: "Auto-approved by SLA after X days"
    │       └─→ Content will publish on next scheduled run
    │
    └─→ Validation FAILED?
        └─→ NO:
            ├─→ Keep status: 'pending_review'
            ├─→ Add notes: "SLA blocked - validation errors: ..."
            └─→ Requires manual review & fixes
    ↓
Send notification to Sarah:
    - X items auto-approved
    - Y items validation failed (need attention)
```

### Key Features

1. **Non-Destructive:** Never deletes or modifies content body
2. **Re-Validates:** Always runs fresh validation check before approval
3. **Transparent:** Logs all actions with reasons
4. **Notifies:** Alerts review team of auto-approvals
5. **Respects Quality:** Won't publish if validation fails

---

## Database Changes Required

### Add Columns to content_queue Table

```sql
-- Migration: Add SLA tracking columns
ALTER TABLE content_queue
ADD COLUMN IF NOT EXISTS pending_since TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_approved_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_approved_reason TEXT;

-- Backfill pending_since for existing records
UPDATE content_queue
SET pending_since = created_date
WHERE status = 'pending_review'
  AND pending_since IS NULL;

-- Create index for SLA queries
CREATE INDEX IF NOT EXISTS idx_content_queue_sla
ON content_queue (status, pending_since)
WHERE status = 'pending_review';
```

### Update Trigger for pending_since

```sql
-- Automatically set pending_since when status changes to pending_review
CREATE OR REPLACE FUNCTION set_pending_since()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending_review' AND (OLD.status IS NULL OR OLD.status != 'pending_review') THEN
    NEW.pending_since = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_pending_since
BEFORE UPDATE ON content_queue
FOR EACH ROW
EXECUTE FUNCTION set_pending_since();
```

---

## Setup Cron Job

### Supabase pg_cron Configuration

**Run Daily at 8:00 AM ET (12:00 PM UTC):**

```sql
-- Create cron job for SLA checker
SELECT cron.schedule(
  'sla-autopublish-checker-daily',
  '0 12 * * *', -- 12:00 PM UTC = 8:00 AM ET
  $$
  SELECT
    net.http_post(
      url := 'https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/sla-autopublish-checker',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Check cron job status
SELECT * FROM cron.job WHERE jobname = 'sla-autopublish-checker-daily';

-- View cron job history
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sla-autopublish-checker-daily')
ORDER BY start_time DESC
LIMIT 10;
```

**Alternative: Run Every Hour (More Responsive)**

```sql
-- Run every hour at minute 0
SELECT cron.schedule(
  'sla-autopublish-checker-hourly',
  '0 * * * *', -- Every hour
  $$
  SELECT
    net.http_post(
      url := 'https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/sla-autopublish-checker',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

**Recommendation:** Start with daily, switch to hourly if needed for responsiveness.

---

## Manual Testing

### Test via API

```bash
# Trigger SLA checker manually
curl -X POST \
  https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/sla-autopublish-checker \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Expected Response (Success)

```json
{
  "success": true,
  "message": "SLA check complete: 3 auto-approved, 1 validation failed, 0 errors",
  "checked_count": 4,
  "auto_approved_count": 3,
  "validation_failed_count": 1,
  "error_count": 0,
  "results": [
    {
      "content_id": "uuid-1",
      "title": "Best Online MBA Programs 2025",
      "action": "auto_approved",
      "validation_passed": true,
      "warnings": [],
      "pending_days": 6
    },
    {
      "content_id": "uuid-2",
      "title": "Top Nursing Degrees Online",
      "action": "validation_failed",
      "validation_passed": false,
      "errors": [
        "❌ CRITICAL: 2 raw HTML link(s) detected.",
        "❌ Insufficient internal links (1)."
      ],
      "pending_days": 7
    }
  ],
  "timestamp": "2025-11-10T12:00:00.000Z"
}
```

### Expected Response (No Items)

```json
{
  "success": true,
  "message": "No content items pending >= 5 days",
  "checked_count": 0,
  "auto_approved_count": 0,
  "validation_failed_count": 0,
  "timestamp": "2025-11-10T12:00:00.000Z"
}
```

---

## Testing Scenarios

### Scenario 1: Create Test Content Pending 5 Days

```sql
-- Insert test content with pending_since = 6 days ago
INSERT INTO content_queue (
  user_id,
  title,
  content,
  meta_description,
  status,
  pending_since,
  created_date
) VALUES (
  'your-user-id',
  'Test Article for SLA Auto-Publish',
  '<article>
    <h1>Test Article</h1>
    <p>This is a test article with [ge_internal_link url="/page1"]internal link[/ge_internal_link] and more content...</p>
    ' || repeat('<p>More content here. ', 150) || '
    <p>[ge_external_link url="https://example.com" rel="nofollow" target="_blank"]External link[/ge_external_link]</p>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Test Article for SLA Auto-Publish System Testing"
    }
    </script>
  </article>',
  'Test meta description for article that is exactly one hundred fifty-six characters long for optimal search snippet.',
  'pending_review',
  NOW() - INTERVAL '6 days',
  NOW() - INTERVAL '6 days'
);
```

### Scenario 2: Run SLA Checker

```bash
curl -X POST \
  https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/sla-autopublish-checker \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

### Scenario 3: Verify Auto-Approval

```sql
-- Check if content was auto-approved
SELECT
  id,
  title,
  status,
  auto_approved,
  auto_approved_date,
  auto_approved_reason,
  scheduled_publish_date,
  notes
FROM content_queue
WHERE title = 'Test Article for SLA Auto-Publish';

-- Expected: status='approved', auto_approved=true
```

---

## Integration with Content Workflow

### Update content-workflow.js

```javascript
/**
 * Submit content for review (sets pending_since)
 */
export async function submitForReview(contentId) {
  const { error } = await supabase
    .from('content_queue')
    .update({
      status: 'pending_review',
      pending_since: new Date().toISOString(), // Start SLA timer
    })
    .eq('id', contentId);

  if (error) throw error;
}

/**
 * Manual approval (cancels SLA timer)
 */
export async function approveContent(contentId) {
  const { error } = await supabase
    .from('content_queue')
    .update({
      status: 'approved',
      pending_since: null, // Clear SLA timer
      auto_approved: false, // Manual approval
    })
    .eq('id', contentId);

  if (error) throw error;
}

/**
 * Get SLA status for content item
 */
export async function getSlaStatus(contentId) {
  const { data, error } = await supabase
    .from('content_queue')
    .select('pending_since, status')
    .eq('id', contentId)
    .single();

  if (error) throw error;

  if (!data.pending_since || data.status !== 'pending_review') {
    return { pending: false, days_remaining: null };
  }

  const pendingDate = new Date(data.pending_since);
  const now = new Date();
  const diffMs = now.getTime() - pendingDate.getTime();
  const daysPending = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const daysRemaining = 5 - daysPending;

  return {
    pending: true,
    days_pending: daysPending,
    days_remaining: Math.max(0, daysRemaining),
    auto_publish_eligible: daysPending >= 5,
  };
}
```

### UI Display (Approval Queue)

```javascript
// In ApprovalQueue.jsx component

const SlaIndicator = ({ contentId }) => {
  const [sla, setSla] = useState(null);

  useEffect(() => {
    async function loadSla() {
      const status = await getSlaStatus(contentId);
      setSla(status);
    }
    loadSla();
  }, [contentId]);

  if (!sla?.pending) return null;

  return (
    <div className={cn(
      "text-sm",
      sla.days_remaining <= 1 ? "text-red-600 font-bold" : "text-yellow-600"
    )}>
      {sla.auto_publish_eligible ? (
        <span>⚠️ Auto-publish eligible (will publish if validation passes)</span>
      ) : (
        <span>⏱️ {sla.days_remaining} day(s) until auto-publish</span>
      )}
    </div>
  );
};
```

---

## Notifications

### Current Implementation

Logs notification message to console:

```
SLA Auto-Publish Report - 11/10/2025

AUTO-APPROVED (3):
- Best Online MBA Programs 2025 (6 days pending) - Publishing automatically
- Top Nursing Degrees Online (7 days pending) - Publishing automatically
- Cybersecurity Certifications Guide (5 days pending) - Publishing automatically

VALIDATION FAILED (1):
- Data Science Bootcamps Review (8 days pending) - Requires manual review
   Errors: ❌ CRITICAL: 2 raw HTML link(s) detected.
```

### Future Enhancements

**Option 1: Email Notifications (Recommended)**

```typescript
// Use Supabase Auth email or SendGrid
async function sendEmailNotification(items: ProcessingResult[]) {
  const { data, error } = await supabase.auth.admin.sendEmail({
    to: 'sarah@geteducated.com',
    subject: `SLA Auto-Publish Report - ${items.length} items processed`,
    html: generateEmailHtml(items),
  });
}
```

**Option 2: In-App Notifications**

```sql
-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'sla_auto_approved', 'sla_validation_failed'
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_date TIMESTAMPTZ DEFAULT NOW()
);
```

**Option 3: Slack Integration**

```typescript
// Post to Slack channel
async function sendSlackNotification(items: ProcessingResult[]) {
  await fetch(Deno.env.get('SLACK_WEBHOOK_URL'), {
    method: 'POST',
    body: JSON.stringify({
      text: `SLA Auto-Publish Report: ${items.length} items processed`,
      attachments: items.map(item => ({
        color: item.action === 'auto_approved' ? 'good' : 'danger',
        text: `${item.title} - ${item.action}`,
      })),
    }),
  });
}
```

---

## Monitoring

### Key Metrics to Track

```sql
-- Auto-approval rate (target: 80%+ pass validation)
SELECT
  COUNT(*) FILTER (WHERE auto_approved = true) AS auto_approved_count,
  COUNT(*) AS total_pending_reviews,
  ROUND(100.0 * COUNT(*) FILTER (WHERE auto_approved = true) / NULLIF(COUNT(*), 0), 1) AS auto_approval_rate_pct
FROM content_queue
WHERE status IN ('approved', 'published')
  AND created_date >= NOW() - INTERVAL '30 days';

-- Average days to review/approval
SELECT
  ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(auto_approved_date, updated_date) - pending_since)) / 86400), 1) AS avg_days_to_approval
FROM content_queue
WHERE status IN ('approved', 'published')
  AND pending_since IS NOT NULL
  AND created_date >= NOW() - INTERVAL '30 days';

-- Most common validation failures
-- (Requires logging validation errors to database)
SELECT
  error_message,
  COUNT(*) AS occurrence_count
FROM validation_logs
WHERE validation_passed = false
  AND created_date >= NOW() - INTERVAL '30 days'
GROUP BY error_message
ORDER BY occurrence_count DESC;
```

### Supabase Dashboard

- **Edge Function Logs:** Monitor sla-autopublish-checker invocations
- **Cron Job History:** Check `cron.job_run_details` for execution status
- **Error Alerts:** Set up alerts for function failures

---

## Troubleshooting

### Issue: SLA checker not running

**Possible Causes:**
1. Cron job not configured
2. Service role key not set
3. Edge Function deployment failed

**Solution:**
```sql
-- Check cron job exists
SELECT * FROM cron.job WHERE jobname LIKE '%sla%';

-- Check recent cron runs
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sla-autopublish-checker-daily')
ORDER BY start_time DESC;

-- Test function manually
-- (see Manual Testing section above)
```

### Issue: Content not auto-approving despite passing validation

**Possible Causes:**
1. `pending_since` not set correctly
2. Date calculation incorrect (timezone issues)
3. Validation service unreachable

**Solution:**
```sql
-- Check pending_since values
SELECT id, title, status, pending_since, NOW() - pending_since AS time_pending
FROM content_queue
WHERE status = 'pending_review'
ORDER BY pending_since;

-- Manually trigger for specific content
-- Update pending_since to 6 days ago for testing
UPDATE content_queue
SET pending_since = NOW() - INTERVAL '6 days'
WHERE id = 'your-content-id';
```

### Issue: Validation errors not being logged

**Solution:**
- Check pre-publish-validator function is deployed
- Verify function URL is correct in SLA checker code
- Check Edge Function logs for errors

---

## Deployment

```bash
# Deploy Edge Function
npx supabase functions deploy sla-autopublish-checker --project-ref yvvtsfgryweqfppilkvo

# Apply database migrations
psql $DATABASE_URL -f migrations/add_sla_columns.sql

# Set up cron job
psql $DATABASE_URL -f migrations/setup_sla_cron.sql

# Test deployment
curl -X POST \
  https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/sla-autopublish-checker \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

---

## Future Enhancements

**Phase 2 Improvements:**
- Configurable SLA window (5 days default, admin can adjust)
- Escalation: Notify manager if >10 items pending >7 days
- Retry logic: Auto-retry validation failures after X days
- Partial approval: Auto-approve sections, flag problem areas
- Analytics dashboard: SLA compliance metrics, trends

---

**Version:** 1.0
**Created:** 2025-11-10
**Status:** ✅ Ready for deployment
**Dependencies:** pre-publish-validator, content_queue table columns
**Next Steps:** Deploy, create cron job, test with real content, monitor metrics
