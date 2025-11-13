# PERDIA V2 DEPLOYMENT GUIDE

**Complete step-by-step guide for deploying Perdia V2**

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Required API Keys

- ✅ Supabase Project (existing: `yvvtsfgryweqfppilkvo`)
- ✅ Anthropic Claude API key
- ✅ OpenAI API key
- 🔲 **Grok API key** (xAI) - **NEW for V2**
- 🔲 **Perplexity API key** - **NEW for V2**
- ✅ WordPress credentials (GetEducated.com)
- ✅ Netlify account

### Get New API Keys

**Grok (xAI):**
1. Visit: https://x.ai/ or https://console.x.ai/
2. Sign up / log in
3. Create API key
4. Copy key (starts with `xai-`)

**Perplexity:**
1. Visit: https://www.perplexity.ai/settings/api
2. Sign up / log in
3. Create API key
4. Copy key (starts with `pplx-`)

---

## 🚀 DEPLOYMENT STEPS

### STEP 1: Update Environment Variables

**1.1 Local Development (.env.local)**

```bash
# Copy example file
cp .env.example .env.local

# Edit .env.local and add:
GROK_API_KEY=xai-your-key-here
VITE_GROK_API_KEY=xai-your-key-here

PERPLEXITY_API_KEY=pplx-your-key-here
VITE_PERPLEXITY_API_KEY=pplx-your-key-here
```

**1.2 Supabase Secrets (Production)**

```bash
# Set secrets for Edge Functions
npx supabase secrets set GROK_API_KEY=xai-your-key-here --project-ref yvvtsfgryweqfppilkvo

npx supabase secrets set PERPLEXITY_API_KEY=pplx-your-key-here --project-ref yvvtsfgryweqfppilkvo

# Verify secrets
npx supabase secrets list --project-ref yvvtsfgryweqfppilkvo
```

---

### STEP 2: Database Migration

**2.1 Run Migration**

```bash
# Option A: Via npm script
npm run db:migrate

# Option B: Manual via Supabase dashboard
# 1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/editor
# 2. Click "SQL Editor"
# 3. Copy contents of: supabase/migrations/20251112000001_perdia_v2_schema.sql
# 4. Paste and run
```

**2.2 Verify Tables**

```sql
-- Check new tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('articles', 'topic_questions', 'feedback', 'quotes', 'automation_schedule', 'integrations');

-- Should return 6 rows
```

---

### STEP 3: Deploy Supabase Edge Functions

**3.1 Deploy Grok Function**

```bash
npx supabase functions deploy invoke-grok --project-ref yvvtsfgryweqfppilkvo
```

**3.2 Deploy Perplexity Function**

```bash
npx supabase functions deploy invoke-perplexity --project-ref yvvtsfgryweqfppilkvo
```

**3.3 Deploy Auto-Approve Cron Job**

```bash
npx supabase functions deploy auto-approve-articles --project-ref yvvtsfgryweqfppilkvo
```

**3.4 Deploy Monthly Ingest Job**

```bash
npx supabase functions deploy ingest-monthly-questions --project-ref yvvtsfgryweqfppilkvo
```

**3.5 Verify Deployments**

```bash
# List deployed functions
npx supabase functions list --project-ref yvvtsfgryweqfppilkvo

# Test invoke-grok
curl -X POST https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/invoke-grok \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Test prompt","model":"grok-2","temperature":0.7,"maxTokens":100}'

# Test invoke-perplexity
curl -X POST https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/invoke-perplexity \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is higher education?","model":"pplx-70b-online"}'
```

---

### STEP 4: Setup Cron Jobs

**4.1 Configure Auto-Approve Job (Hourly)**

```sql
-- In Supabase SQL Editor
SELECT cron.schedule(
  'auto-approve-articles',
  '0 * * * *', -- Every hour
  $$
  SELECT net.http_post(
    url:='https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/auto-approve-articles',
    headers:=jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  );
  $$
);
```

**4.2 Configure Monthly Ingest Job (1st of Month)**

```sql
-- In Supabase SQL Editor
SELECT cron.schedule(
  'ingest-monthly-questions',
  '0 0 1 * *', -- 1st of month at midnight
  $$
  SELECT net.http_post(
    url:='https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/ingest-monthly-questions',
    headers:=jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  );
  $$
);
```

**4.3 Verify Cron Jobs**

```sql
-- List all cron jobs
SELECT * FROM cron.job;

-- Should show 2 jobs: auto-approve-articles, ingest-monthly-questions
```

---

### STEP 5: Frontend Deployment (Netlify)

**5.1 Environment Variables in Netlify**

Go to: https://app.netlify.com/sites/perdia-education/settings/env

Add these variables:
```
VITE_SUPABASE_URL=https://yvvtsfgryweqfppilkvo.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_ANTHROPIC_API_KEY=<your-claude-key>
VITE_OPENAI_API_KEY=<your-openai-key>
VITE_GROK_API_KEY=<your-grok-key>          # NEW
VITE_PERPLEXITY_API_KEY=<your-perplexity-key>  # NEW
VITE_DEFAULT_AI_PROVIDER=grok               # NEW
```

**5.2 Deploy to Netlify**

```bash
# Option A: Git push (auto-deploy)
git add .
git commit -m "feat: Deploy Perdia V2 with Grok/Perplexity pipeline"
git push origin perdiav2

# Option B: Manual deploy
npm run build
netlify deploy --prod --dir=dist
```

---

### STEP 6: Test Complete Workflow

**6.1 Access V2 Interface**

Navigate to:
- Approval Queue: `https://perdia-education.netlify.app/v2/approval`
- Topics & Questions: `https://perdia-education.netlify.app/v2/topics`
- Settings: `https://perdia-education.netlify.app/v2/settings`

**6.2 Configure Settings**

1. Go to `/v2/settings`
2. **WordPress Tab:**
   - Enter GetEducated.com credentials
   - Click "Test Connection"
   - Click "Save WordPress Settings"
3. **Automation Tab:**
   - Set frequency: Daily
   - Set time: 05:00
   - Auto-approve days: 5
   - Click "Save Automation Settings"

**6.3 Generate First Article**

1. Go to `/v2/topics`
2. Click "Find New Questions" (uses Perplexity)
3. Wait for questions to load
4. Click "Create Article" on any question
5. Wait for generation (Grok → Perplexity pipeline)
   - Progress: "Generating draft..." → "Verifying facts..." → "Complete"
6. Article appears in Approval Queue

**6.4 Review and Approve**

1. Go to `/v2/approval`
2. Find your article
3. Click "View" to open drawer
4. Review tabs: Preview, Edit, SEO, Feedback, Details
5. Click "Approve" button
6. Article publishes to WordPress

**6.5 Verify WordPress**

1. Check GetEducated.com for published article
2. Verify featured image uploaded
3. Check meta description set correctly

---

## ✅ POST-DEPLOYMENT VALIDATION

### Checklist

- [ ] Database migration successful (6 new tables exist)
- [ ] All 4 Edge Functions deployed
- [ ] Grok API working (test via Topics page)
- [ ] Perplexity API working (test via Topics page)
- [ ] WordPress connection successful (test in Settings)
- [ ] Auto-approve cron job scheduled
- [ ] Monthly ingest cron job scheduled
- [ ] Frontend deployed to Netlify
- [ ] Can generate article from question
- [ ] Can approve and publish to WordPress
- [ ] SLA timer displays correctly
- [ ] Cost tracking displays

### Test Commands

**Test Grok Generation:**
```bash
curl -X POST https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/invoke-grok \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a short paragraph about college degrees.",
    "model": "grok-2",
    "temperature": 0.8,
    "maxTokens": 200
  }'
```

**Test Perplexity Verification:**
```bash
curl -X POST https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/invoke-perplexity \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What are the top 3 questions people ask about college degrees?",
    "model": "pplx-70b-online"
  }'
```

**Test Auto-Approve (Manual):**
```bash
curl -X POST https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/auto-approve-articles \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

**Test Monthly Ingest (Manual):**
```bash
curl -X POST https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/ingest-monthly-questions \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

---

## 🔧 TROUBLESHOOTING

### Issue: "Grok API key not configured"

**Solution:**
```bash
# Check if secret is set
npx supabase secrets list --project-ref yvvtsfgryweqfppilkvo

# Set secret if missing
npx supabase secrets set GROK_API_KEY=your-key --project-ref yvvtsfgryweqfppilkvo

# Redeploy function
npx supabase functions deploy invoke-grok --project-ref yvvtsfgryweqfppilkvo
```

### Issue: "Function timeout"

**Cause:** Supabase Edge Functions have 400-second timeout (Pro tier)

**Solution:** Already configured. If still timing out, check model settings:
- Reduce `maxTokens` (try 2000 instead of 4000)
- Use `grok-2-mini` instead of `grok-2`

### Issue: "RLS policy error" on new tables

**Solution:**
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('articles', 'topic_questions');

-- Both should show rowsecurity=true

-- If false, enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_questions ENABLE ROW LEVEL SECURITY;
```

### Issue: "Cron job not running"

**Check Logs:**
```sql
-- View cron job history
SELECT * FROM cron.job_run_details
WHERE jobname IN ('auto-approve-articles', 'ingest-monthly-questions')
ORDER BY start_time DESC
LIMIT 10;
```

**Test Manually:**
```sql
-- Run auto-approve manually
SELECT cron.unschedule('auto-approve-articles');  -- Stop scheduled
SELECT net.http_post(
  url:='https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/auto-approve-articles',
  headers:='{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
);
SELECT cron.schedule(...);  -- Re-schedule
```

### Issue: "WordPress publish fails"

**Check:**
1. Test connection in Settings page
2. Verify application password (not regular password)
3. Check WordPress REST API enabled
4. Check logs in Supabase Dashboard → Edge Functions → Logs

---

## 📊 MONITORING

### Supabase Dashboard

**Check Edge Function Logs:**
1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo
2. Click "Edge Functions"
3. Select function
4. View "Logs" tab
5. Filter by error/success

**Check Database Usage:**
1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo
2. Click "Database"
3. View "Usage" tab
4. Monitor: Rows, Storage, Bandwidth

### Application Metrics

**Cost Tracking:**
```sql
-- Average cost per article
SELECT AVG(total_cost) as avg_cost,
       COUNT(*) as total_articles
FROM articles
WHERE total_cost > 0;

-- Total spend this month
SELECT SUM(total_cost) as monthly_cost
FROM articles
WHERE created_at >= date_trunc('month', NOW());
```

**Approval Queue Status:**
```sql
-- Articles by status
SELECT status, COUNT(*) as count
FROM articles
GROUP BY status
ORDER BY count DESC;

-- Articles nearing auto-approve
SELECT COUNT(*) as expiring_soon
FROM articles
WHERE status = 'pending_review'
AND auto_approve_at < NOW() + INTERVAL '24 hours';
```

---

## 🎯 SUCCESS METRICS

After 1 week, check:

| Metric | Target | Check |
|--------|--------|-------|
| Articles generated | > 10 | ✓ / ✗ |
| Approval rate | > 80% | ✓ / ✗ |
| Average cost/article | < $5 | ✓ / ✗ |
| WordPress publish success | > 95% | ✓ / ✗ |
| Auto-approve working | Yes | ✓ / ✗ |
| Monthly ingest working | Yes | ✓ / ✗ |

---

## 🆘 EMERGENCY ROLLBACK

If V2 has critical issues:

**1. Disable V2 Routes (Temporary)**

Edit `src/pages/Pages.jsx`:
```jsx
// Comment out V2 routes
// <Route path="/v2/approval" element={<ApprovalQueueV2 />} />
// <Route path="/v2/topics" element={<TopicQuestionsManagerV2 />} />
// <Route path="/v2/settings" element={<SettingsV2 />} />
```

**2. Disable Cron Jobs**

```sql
-- Unschedule cron jobs
SELECT cron.unschedule('auto-approve-articles');
SELECT cron.unschedule('ingest-monthly-questions');
```

**3. Use V1 Interface**

Revert to:
- Approval Queue: `/approvals` (old)
- Topics: `/topic-questions` (old)
- Settings: `/settings` (old)

**4. Report Issues**

Create detailed issue with:
- Error logs from Supabase
- Browser console errors
- Steps to reproduce
- Expected vs actual behavior

---

## 📚 ADDITIONAL RESOURCES

- **Full Specification:** `PERDIA_V2_COMPLETE_OVERHAUL_PLAN.md`
- **Implementation Status:** `IMPLEMENTATION_STATUS.md`
- **API Guide:** `docs/ANTHROPIC_API_GUIDE.md`
- **Supabase Agent Docs:** `.claude/agents/perdia-supabase-database-agent.md`

---

## ✨ WHAT'S NEXT

After successful deployment:

1. **Week 1:** Monitor closely, fix bugs
2. **Week 2:** Train Sarah (primary reviewer)
3. **Week 3:** Gather feedback, iterate
4. **Week 4:** Client approval for scale-up
5. **Month 2:** Scale to 100+ articles/week

**Future Enhancements:**
- Real quote scraping (Reddit/Twitter)
- Daily trend sweep (5am X/Twitter check)
- Advanced validation rules
- Cost monitoring dashboard
- Multi-user roles & permissions

---

**Deployment Date:** _________
**Deployed By:** _________
**Status:** □ Pending □ In Progress □ Complete □ Failed
**Notes:** _________________________________________
