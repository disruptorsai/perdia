# PERDIA V2 QUICK START GUIDE

**Complete in 30 minutes** | Last Updated: November 12, 2025

---

## What is Perdia V2?

Perdia V2 is a **simplified, focused blog-writing system** for GetEducated.com that replaces the complex 9-agent V1 platform with:

- **Single Agent Focus**: Blog Writer only (no confusing multi-agent dropdown)
- **Questions-First Strategy**: Monthly ingest of top 50 real user questions
- **Two-Model Pipeline**: Grok (xAI) generates → Perplexity verifies
- **5-Day Auto-Approve**: Articles auto-publish if not reviewed within SLA
- **Human-in-the-Loop**: Feedback feeds back to model for continuous improvement

---

## Implementation Status

✅ **100% Complete** - Ready for Testing & Deployment

### What's Built:

#### Sprint 0 - Foundations (100%)
- ✅ Database migration (6 new tables)
- ✅ Grok API client + Edge Function
- ✅ Perplexity API client + Edge Function
- ✅ Two-stage content pipeline (Grok → Perplexity)
- ✅ SDK updates (5 new entities)

#### Sprint 1 - Approval Core (100%)
- ✅ ApprovalQueueV2.jsx (main screen with SLA timer)
- ✅ ArticleDrawerV2.jsx (5-tab detailed view)
- ✅ TopicQuestionsManagerV2.jsx (questions management)
- ✅ SettingsV2.jsx (simplified settings)
- ✅ Routing updates

#### Sprint 2 - Automation (100%)
- ✅ Auto-approve Edge Function (cron job)
- ✅ Monthly questions ingest Edge Function
- ✅ Environment configuration
- ✅ Comprehensive deployment guide
- ✅ Testing script

---

## Quick Start (3 Steps)

### Step 1: Get API Keys

**Required:**
1. **Grok API Key** (xAI): https://x.ai/ or https://console.x.ai/
   - Sign up → Create API key → Copy (starts with `xai-`)

2. **Perplexity API Key**: https://www.perplexity.ai/settings/api
   - Sign up → Create API key → Copy (starts with `pplx-`)

**Already Have:**
- ✅ Supabase project: `yvvtsfgryweqfppilkvo`
- ✅ Anthropic Claude key
- ✅ OpenAI key

### Step 2: Configure Environment

**Local Development:**
```bash
# Edit .env.local (already created from .env.example)
GROK_API_KEY=xai-your-key-here
VITE_GROK_API_KEY=xai-your-key-here

PERPLEXITY_API_KEY=pplx-your-key-here
VITE_PERPLEXITY_API_KEY=pplx-your-key-here

VITE_DEFAULT_AI_PROVIDER=grok
```

**Supabase Secrets (Production):**
```bash
npx supabase secrets set GROK_API_KEY=xai-your-key --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set PERPLEXITY_API_KEY=pplx-your-key --project-ref yvvtsfgryweqfppilkvo

# Verify
npx supabase secrets list --project-ref yvvtsfgryweqfppilkvo
```

### Step 3: Deploy & Test

**Deploy Database:**
```bash
npm run db:migrate
```

**Deploy Edge Functions:**
```bash
npx supabase functions deploy invoke-grok --project-ref yvvtsfgryweqfppilkvo
npx supabase functions deploy invoke-perplexity --project-ref yvvtsfgryweqfppilkvo
npx supabase functions deploy auto-approve-articles --project-ref yvvtsfgryweqfppilkvo
npx supabase functions deploy ingest-monthly-questions --project-ref yvvtsfgryweqfppilkvo
```

**Run Tests:**
```bash
npm run test:v2
```

**Start Development:**
```bash
npm run dev
```

**Access V2 Interface:**
- http://localhost:5173/v2/approval (Approval Queue)
- http://localhost:5173/v2/topics (Questions Manager)
- http://localhost:5173/v2/settings (Settings)

---

## Architecture Overview

### Database Schema (6 New Tables)

1. **`articles`** - Replaces `content_queue`
   - Simplified fields (title, slug, body, status)
   - SLA tracking (`pending_since`, `auto_approve_at`)
   - Cost tracking (`generation_cost`, `verification_cost`)
   - WordPress integration (`wordpress_post_id`, `wordpress_url`)

2. **`topic_questions`** - Questions-first strategy
   - Monthly ingest of top 50 questions
   - Keyword extraction
   - Priority ranking

3. **`feedback`** - Human-in-the-loop
   - User comments on articles
   - Rewrite requests
   - Training data for model improvement

4. **`quotes`** - Real quote sources
   - Reddit, Twitter, GetEducated forums
   - Attribution tracking

5. **`automation_schedule`** - Simplified automation
   - Frequency (daily/weekly)
   - Post time
   - Auto-approve days

6. **`integrations`** - WordPress connections
   - Site URL, credentials
   - Connection status

### Two-Stage Content Pipeline

```
User selects question
        ↓
[Stage 1: Grok Generation]
  - Generate 1500-2500 word draft
  - Natural, human-like writing (temp 0.8)
  - Mark [CITATION NEEDED] tags
        ↓
[Stage 2: Perplexity Verification]
  - Fact-check all claims
  - Find reliable sources (.edu, .gov)
  - Generate citations with URLs
        ↓
[Stage 3: Citation Insertion]
  - Replace [CITATION NEEDED] with real citations
  - Format as HTML <sup> tags
        ↓
[Stage 4: Image Generation]
  - Extract theme from content
  - Generate featured image (Gemini/gpt-image-1)
        ↓
Article created in Approval Queue (pending_review)
```

### UI Components (3 Main Screens)

**1. Approval Queue** (`/v2/approval`)
- Main screen where editors spend 80% of time
- SLA timer (green → yellow → red)
- Quick actions (Approve/Reject/View)
- Search/filter (status, keyword, date)
- Cost display per article

**2. Topic Questions** (`/v2/topics`)
- List of top 50 monthly questions
- Search/filter by keyword
- "Create Article" button (triggers pipeline)
- Track which questions used

**3. Settings** (`/v2/settings`)
- 4 tabs: Automation, WordPress, AI Models, Images
- Auto-approve days (default: 5)
- WordPress connection test
- Model selection (Grok, Perplexity)

### Edge Functions (4 Total)

**1. `invoke-grok`** - Content generation
- Model: grok-2 or grok-2-mini
- Temperature: 0.8 (natural variation)
- Max tokens: 4000
- Returns: content, model, usage, cost

**2. `invoke-perplexity`** - Fact-checking
- Model: pplx-70b-online
- Search domain filter: .edu, .gov, .org
- Temperature: 0.2 (factual accuracy)
- Returns: verification data, citations

**3. `auto-approve-articles`** - Cron job (hourly)
- Find articles where `auto_approve_at < NOW()`
- Validate (word count, required fields)
- Approve + publish to WordPress
- Log results

**4. `ingest-monthly-questions`** - Cron job (monthly)
- Query Perplexity for top 50 questions
- Extract keywords
- Calculate priority
- Insert into `topic_questions` (skip duplicates)

---

## Testing Checklist

Run `npm run test:v2` to validate:

- [ ] Environment variables configured
- [ ] Database schema deployed (6 tables exist)
- [ ] Grok Edge Function returns content
- [ ] Perplexity Edge Function returns citations
- [ ] Article creation workflow (status → auto_approve_at)
- [ ] Cost calculation (generation + verification)
- [ ] Auto-approve Edge Function deployed
- [ ] Monthly ingest Edge Function deployed
- [ ] WordPress connection (optional)

**Expected Pass Rate:** 90%+ (WordPress optional)

---

## Production Deployment

See **`DEPLOYMENT_GUIDE_V2.md`** for detailed step-by-step instructions.

**Summary:**

1. **Environment Variables**
   - Set in Netlify dashboard (frontend)
   - Set in Supabase secrets (Edge Functions)

2. **Database Migration**
   - Run via `npm run db:migrate` or Supabase dashboard

3. **Edge Functions**
   - Deploy all 4 functions
   - Verify with curl tests

4. **Cron Jobs**
   - Schedule auto-approve (hourly: `0 * * * *`)
   - Schedule monthly ingest (monthly: `0 0 1 * *`)

5. **Frontend**
   - Push to main branch → auto-deploy to Netlify

6. **Verify**
   - Test complete workflow (question → article → approval → publish)
   - Check SLA timer working
   - Verify auto-approve after 5 days

---

## Key Files Reference

### Documentation
- `PERDIA_V2_COMPLETE_OVERHAUL_PLAN.md` - Master specification (15k+ words)
- `DEPLOYMENT_GUIDE_V2.md` - Step-by-step deployment (500+ lines)
- `IMPLEMENTATION_STATUS.md` - Progress tracker
- `PERDIA_V2_QUICK_START.md` - This file

### Database
- `supabase/migrations/20251112000001_perdia_v2_schema.sql` - Complete schema

### API Clients
- `src/lib/grok-client.js` - Grok API wrapper
- `src/lib/perplexity-client.js` - Perplexity API wrapper
- `src/lib/content-pipeline.js` - Two-stage generation

### Edge Functions
- `supabase/functions/invoke-grok/index.ts`
- `supabase/functions/invoke-perplexity/index.ts`
- `supabase/functions/auto-approve-articles/index.ts`
- `supabase/functions/ingest-monthly-questions/index.ts`

### UI Components
- `src/pages/ApprovalQueueV2.jsx` - Main approval screen
- `src/components/content/ArticleDrawerV2.jsx` - Article detail view
- `src/pages/TopicQuestionsManagerV2.jsx` - Questions management
- `src/pages/SettingsV2.jsx` - Settings

### Configuration
- `.env.example` - Environment variables template
- `src/lib/perdia-sdk.js` - SDK (added 5 V2 entities)
- `src/pages/Pages.jsx` - Routing (added V2 routes)

### Testing
- `scripts/test-perdia-v2.js` - Comprehensive test suite

---

## Troubleshooting

### Issue: "Grok API key not configured"
```bash
# Check secrets
npx supabase secrets list --project-ref yvvtsfgryweqfppilkvo

# Set if missing
npx supabase secrets set GROK_API_KEY=xai-your-key --project-ref yvvtsfgryweqfppilkvo

# Redeploy function
npx supabase functions deploy invoke-grok --project-ref yvvtsfgryweqfppilkvo
```

### Issue: "Function timeout"
- Reduce `maxTokens` (try 2000 instead of 4000)
- Use `grok-2-mini` instead of `grok-2`
- Check Supabase plan (Pro tier = 400s timeout)

### Issue: "RLS policy error"
```sql
-- Verify RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'articles';

-- If false, enable
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
```

### Issue: "Cron job not running"
```sql
-- View job history
SELECT * FROM cron.job_run_details
WHERE jobname = 'auto-approve-articles'
ORDER BY start_time DESC LIMIT 10;

-- Test manually
SELECT net.http_post(
  url:='https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/auto-approve-articles',
  headers:=jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
);
```

---

## Success Metrics (Week 1)

| Metric | Target | Status |
|--------|--------|--------|
| Articles generated | > 10 | ___ |
| Approval rate | > 80% | ___ |
| Average cost/article | < $5 | ___ |
| WordPress publish success | > 95% | ___ |
| Auto-approve working | Yes | ___ |
| Monthly ingest working | Yes | ___ |

---

## Support & Resources

**Documentation:**
- Full spec: `PERDIA_V2_COMPLETE_OVERHAUL_PLAN.md`
- Deployment: `DEPLOYMENT_GUIDE_V2.md`
- Implementation: `IMPLEMENTATION_STATUS.md`

**External Resources:**
- Grok API: https://docs.x.ai/
- Perplexity API: https://docs.perplexity.ai/
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Supabase Cron: https://supabase.com/docs/guides/database/extensions/pg_cron

**Contact:**
- Project: Perdia Education (GetEducated.com)
- Developer: Disruptors AI
- Repository: (add GitHub URL)

---

## What's Next?

After successful deployment:

**Week 1:** Monitor closely, fix bugs
**Week 2:** Train Sarah (primary reviewer)
**Week 3:** Gather feedback, iterate
**Week 4:** Client approval for scale-up
**Month 2:** Scale to 100+ articles/week

**Future Enhancements:**
- Real quote scraping (Reddit/Twitter)
- Daily trend sweep (5am X/Twitter check)
- Advanced validation rules
- Cost monitoring dashboard
- Multi-user roles & permissions

---

**Last Updated:** November 12, 2025
**Version:** 2.0.0
**Status:** ✅ Ready for Deployment
