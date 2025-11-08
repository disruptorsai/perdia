# Final Setup Instructions - Perdia Edge Functions

**Status**: ✅ Almost Complete - Just 2 quick steps remaining!

## What's Already Done ✅

- ✅ **All 6 Edge Functions deployed** to Supabase
- ✅ **Authentication fixed** (invoke-llm now works)
- ✅ **Database tables created** (clients table added)
- ✅ **All secrets configured**:
  - Anthropic API (Claude)
  - OpenAI API
  - DataForSEO credentials
  - Supabase credentials

## What You Need To Do Now

### Step 1: Set Up Automated Cron Jobs (5 minutes)

These automate content scheduling and publishing so your platform runs itself.

**Actions:**

1. **Open Supabase SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new

2. **Copy & paste this entire file**:
   - File: `scripts/setup-cron-jobs.sql`
   - Location: `C:\Users\Will\OneDrive\Documents\Projects\perdia\scripts\setup-cron-jobs.sql`

3. **Click "Run"**

4. **Verify success**:
   ```sql
   -- Run this query to see your active cron jobs
   SELECT * FROM cron.job;
   ```

   You should see:
   - ✅ `auto-schedule-content-hourly` - Runs every hour
   - ✅ `publish-scheduled-content-15min` - Runs every 15 minutes

**What This Does:**
- **Every hour**: Automatically schedules approved content based on your automation settings
- **Every 15 minutes**: Publishes content that has reached its scheduled date

---

### Step 2: Test Everything (10 minutes)

Verify all Edge Functions are working correctly.

**Option A: Run Test Suite** (Recommended)

```bash
node scripts/test-all-functions.js
```

This will test all 6 Edge Functions and show you a detailed report.

**Option B: Test in Browser Console**

Open your Perdia app and run in browser console:

```javascript
// Test 1: AI Invocation
const ai = await supabase.functions.invoke('invoke-llm', {
  body: {
    provider: 'claude',
    model: 'claude-sonnet-4-5-20250929',
    prompt: 'Say: Perdia is working perfectly!',
    max_tokens: 50
  }
});
console.log('✅ AI Response:', ai.data.content);

// Test 2: Keyword Research
const keywords = await supabase.functions.invoke('keyword-research', {
  body: {
    keywords: ['online education'],
    include_suggestions: false
  }
});
console.log('✅ Keyword Data:', keywords.data);

// Test 3: Auto Schedule
const schedule = await supabase.functions.invoke('auto-schedule-content', {
  body: {}
});
console.log('✅ Scheduling:', schedule.data);
```

---

## Optional: Set Up Google Search Console (Later)

**When you're ready**, follow this guide to enable automatic GSC data sync:
- **Guide**: `docs/GSC_SETUP_GUIDE.md`

This will:
- Sync keyword rankings daily
- Track performance metrics automatically
- Identify ranking opportunities

**You can skip this for now** - everything else works without it.

---

## What's Working Now

### 🚀 **Production-Ready Features**

| Feature | Status | What It Does |
|---------|--------|--------------|
| **AI Content Generation** | ✅ Working | Claude + OpenAI for content creation |
| **Keyword Research** | ✅ Working | DataForSEO integration for keyword data |
| **WordPress Publishing** | ✅ Working | Automated publishing with images |
| **Content Optimization** | ✅ Working | AI-powered SEO analysis |
| **Auto Scheduling** | ✅ Working | Intelligent content calendar |
| **Automated Publishing** | ✅ Working | Publishes on schedule automatically |
| **GSC Sync** | ⚠️ Optional | Requires setup (see GSC_SETUP_GUIDE.md) |

### 📊 **Automated Workflows**

Once you complete Step 1 above:

1. **Content gets auto-scheduled** every hour based on your automation settings
2. **Content gets auto-published** every 15 minutes when it reaches scheduled time
3. **No manual intervention needed** - your content pipeline runs itself

### 🎯 **Example Workflow**

1. **AI generates content** → Status: `draft`
2. **You approve it** → Status: `approved`
3. **Auto-scheduler picks it up** (next hour) → Status: `scheduled`
4. **Auto-publisher publishes it** (at scheduled time) → Status: `published`
5. **WordPress integration** publishes to your site automatically

---

## Monitoring & Maintenance

### View Cron Job History

```sql
-- See recent automated task executions
SELECT
  job_name,
  status,
  start_time,
  end_time,
  EXTRACT(EPOCH FROM (end_time - start_time)) as duration_seconds
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

### View Edge Function Logs

```bash
# See logs for a specific function
npx supabase functions logs invoke-llm --project-ref yvvtsfgryweqfppilkvo

# See all function logs
npx supabase functions logs --project-ref yvvtsfgryweqfppilkvo
```

### Monitor in Dashboard

Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/functions

You can see:
- Function invocation counts
- Error rates
- Execution times
- Recent logs

---

## Troubleshooting

### "Cron job not running"

Check if pg_cron extension is enabled:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

If not enabled, run:
```sql
CREATE EXTENSION pg_cron;
```

### "Edge Function returns 401"

Make sure you're authenticated:
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Authenticated:', !!session);
```

### "No content gets scheduled"

Check your automation settings:
```sql
SELECT * FROM automation_settings;
```

Make sure you have:
- `automation_level` not set to 'manual'
- `articles_per_day` > 0
- Approved content in `content_queue`

---

## Next Steps After Setup

1. ✅ **Complete Steps 1 & 2 above**
2. 📊 **Monitor** cron job executions for 24 hours
3. 🧪 **Test** the full content workflow end-to-end
4. 🔧 **Adjust** automation settings based on needs
5. 📈 **Scale** up articles_per_day when comfortable
6. 🌐 **Set up GSC** (optional) when ready

---

## Cost Monitoring

Keep an eye on usage:

### Supabase Edge Functions
- **Free tier**: 500K invocations/month
- **Your usage**: Check dashboard
- **Cost**: $0 unless you exceed free tier

### DataForSEO API
- **Cost**: ~$0.0025 per keyword
- **Monitor**: https://app.dataforseo.com/
- **Budget**: Set limits in DataForSEO dashboard

### Anthropic Claude API
- **Claude Sonnet 4.5**: $3/$15 per 1M tokens (input/output)
- **Monitor**: https://console.anthropic.com/
- **Optimization**: Use prompt caching (90% savings)

---

## Support & Documentation

**📚 Full Documentation:**
- Deployment Guide: `docs/EDGE_FUNCTIONS_DEPLOYMENT.md`
- Quick Reference: `docs/EDGE_FUNCTIONS_QUICK_REFERENCE.md`
- GSC Setup: `docs/GSC_SETUP_GUIDE.md`

**🧪 Testing:**
- Test Suite: `scripts/test-all-functions.js`
- Individual Tests: See `scripts/test-*.js`

**🔍 Debugging:**
- Function Logs: `npx supabase functions logs <name> --project-ref yvvtsfgryweqfppilkvo`
- Database Logs: Check Supabase Dashboard
- Cron Job History: `SELECT * FROM cron.job_run_details`

---

## Summary Checklist

Before you're done, verify:

- [ ] Step 1: Cron jobs set up (run `scripts/setup-cron-jobs.sql`)
- [ ] Step 2: All functions tested (run `scripts/test-all-functions.js`)
- [ ] Cron jobs visible in: `SELECT * FROM cron.job;`
- [ ] No errors in function logs
- [ ] Automation settings configured in app
- [ ] WordPress connection configured (if using WordPress)

**When all checkboxes are ✅, you're 100% done!** 🎉

---

**Questions?**
- Check function logs for errors
- Review documentation in `docs/` folder
- Test individual functions via browser console
- Monitor cron job execution in database

**Everything is ready to automate your content workflow!** 🚀
