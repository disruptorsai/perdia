# PERDIA V2 IMPLEMENTATION STATUS

**Last Updated:** 2025-11-12
**Implementation Phase:** Sprint 1 - Approval Core (75% Complete)

---

## ✅ COMPLETED (Sprint 0 + Sprint 1 Partial)

### Database & Infrastructure

1. **Database Migration** ✓
   - File: `supabase/migrations/20251112000001_perdia_v2_schema.sql`
   - Tables created: `articles`, `topic_questions`, `feedback`, `quotes`, `automation_schedule`, `integrations`
   - Auto-approve trigger logic (5-day SLA)
   - Data migration from `content_queue` → `articles`
   - RLS policies configured

2. **SDK Updates** ✓
   - File: `src/lib/perdia-sdk.js`
   - New entities: `Article`, `Feedback`, `Quote`, `AutomationSchedule`, `Integration`
   - Updated BaseEntity for `created_at` vs `created_date` handling

### API Integrations

3. **Grok API (xAI)** ✓
   - Client: `src/lib/grok-client.js`
   - Edge Function: `supabase/functions/invoke-grok/index.ts`
   - Functions:
     - `invokeGrok()` - Main API call
     - `generateBlogArticle()` - Stage 1 generation
     - `searchTrendingTopics()` - X/Twitter trends
     - `rewriteArticleWithFeedback()` - Regeneration

4. **Perplexity API** ✓
   - Client: `src/lib/perplexity-client.js`
   - Edge Function: `supabase/functions/invoke-perplexity/index.ts`
   - Functions:
     - `invokePerplexity()` - Main API call
     - `verifyArticle()` - Stage 2 fact-checking
     - `findTopQuestions()` - Monthly ingest
     - `findRealQuotes()` - Quote sourcing
     - `insertCitations()` - Citation insertion

5. **Content Pipeline** ✓
   - File: `src/lib/content-pipeline.js`
   - `generateArticlePipeline()` - Grok → Perplexity two-stage pipeline
   - `regenerateWithFeedback()` - Rewrite based on editor feedback
   - Automatic metadata extraction
   - Validation logic
   - Progress callbacks

### UI Components

6. **ApprovalQueueV2** ✓
   - File: `src/pages/ApprovalQueueV2.jsx`
   - Features:
     - 5-day SLA countdown timer
     - Quick approve/reject actions
     - Search and filters
     - Validation status badges
     - Cost tracking display
     - Model usage display
   - Integration with ArticleDrawer

7. **ArticleDrawerV2** ✓
   - File: `src/components/content/ArticleDrawerV2.jsx`
   - Tabs:
     - Preview: Rich HTML rendering
     - Edit: Inline content editing
     - SEO: Meta fields, keywords, slug
     - Feedback: Comments, rewrite, regenerate
     - Details: Models, costs, validation, timestamps
   - Actions: Approve, Reject, Rewrite, Save
   - WordPress publishing integration

8. **TopicQuestionsManagerV2** ✓
   - File: `src/pages/TopicQuestionsManagerV2.jsx`
   - Features:
     - Question list with search/filter
     - "Create Article" button per question
     - Manual question addition
     - "Find New Questions" (Perplexity ingest)
     - Priority and source badges
     - Usage tracking (shows if article created)

---

## 🚧 IN PROGRESS / REMAINING

### Sprint 1 Completion

9. **SettingsV2 Page** (30 min)
   - Tabs needed:
     - Automation (frequency, time, auto-approve days)
     - WordPress Integration (credentials, test connection)
     - Models Configuration (Grok/Perplexity settings)
     - Image Generation (Gemini settings)

10. **Routing Updates** (15 min)
    - Update `src/pages/Pages.jsx`
    - Replace old routes with V2 components
    - Simplified navigation (3 core screens)

### Sprint 2: Automation Jobs

11. **Auto-Approve Cron Job** (1 hour)
    - Supabase Edge Function or pg_cron
    - Query articles where `auto_approve_at < NOW()` and `status = 'pending_review'`
    - Validate before approving
    - Publish to WordPress
    - Send notification

12. **Monthly Questions Ingest Job** (30 min)
    - Supabase Edge Function or pg_cron
    - Runs 1st of each month
    - Calls Perplexity `findTopQuestions()`
    - Inserts into `topic_questions`

13. **Daily Trend Sweep Job** (Optional, 30 min)
    - Runs at 5am daily
    - Calls Grok `searchTrendingTopics()`
    - Inserts trending questions

### Sprint 3: Polish & Deploy

14. **Deployment Scripts** (1 hour)
    - `.env.example` updates (add Grok/Perplexity keys)
    - Supabase Edge Function deployment script
    - Database migration script
    - Setup documentation

15. **Testing & Documentation** (2 hours)
    - End-to-end workflow test
    - User guide for editors
    - Technical documentation
    - Troubleshooting guide

---

## 📦 DEPLOYMENT CHECKLIST

### Environment Variables Needed

```bash
# Existing
VITE_SUPABASE_URL=https://yvvtsfgryweqfppilkvo.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_SERVICE_ROLE_KEY=...
VITE_ANTHROPIC_API_KEY=...
VITE_OPENAI_API_KEY=...

# NEW - Add these
VITE_GROK_API_KEY=...        # xAI Grok API key
VITE_PERPLEXITY_API_KEY=...  # Perplexity API key
```

### Supabase Edge Functions to Deploy

```bash
# 1. Deploy Grok Edge Function
npx supabase functions deploy invoke-grok --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set GROK_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo

# 2. Deploy Perplexity Edge Function
npx supabase functions deploy invoke-perplexity --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set PERPLEXITY_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo
```

### Database Migration

```bash
# Run migration (creates new tables)
npm run db:migrate

# Or manually via Supabase dashboard
# Copy contents of: supabase/migrations/20251112000001_perdia_v2_schema.sql
```

---

## 🎯 QUICK START (For Testing)

### 1. Update Environment Variables

Add to `.env.local`:
```bash
VITE_GROK_API_KEY=your_grok_key
VITE_PERPLEXITY_API_KEY=your_perplexity_key
```

### 2. Run Database Migration

```bash
npm run db:migrate
```

### 3. Deploy Edge Functions

```bash
# Deploy Grok
npx supabase functions deploy invoke-grok --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set GROK_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo

# Deploy Perplexity
npx supabase functions deploy invoke-perplexity --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set PERPLEXITY_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo
```

### 4. Update Routing (temporary)

Edit `src/pages/Pages.jsx` to add new routes:

```jsx
import ApprovalQueueV2 from './ApprovalQueueV2';
import TopicQuestionsManagerV2 from './TopicQuestionsManagerV2';

// Add routes
<Route path="/approval-v2" element={<ApprovalQueueV2 />} />
<Route path="/topics-v2" element={<TopicQuestionsManagerV2 />} />
```

### 5. Test Workflow

1. Navigate to `/topics-v2`
2. Click "Find New Questions"
3. Select a question and click "Create Article"
4. Wait for generation (Grok → Perplexity pipeline)
5. Navigate to `/approval-v2`
6. View article, review, and approve

---

## 📊 COMPLETION ESTIMATE

| Sprint | Tasks Remaining | Est. Time | Status |
|--------|----------------|-----------|--------|
| Sprint 1 | Settings page + Routing | 45 min | 🚧 75% Complete |
| Sprint 2 | 3 cron jobs | 2 hours | 📋 Not Started |
| Sprint 3 | Deploy + Test + Docs | 3 hours | 📋 Not Started |
| **Total** | | **~6 hours** | **60% Complete** |

---

## 🔄 MIGRATION STRATEGY

### Phase 1: Parallel Run (Current)
- V2 components available at `/approval-v2` and `/topics-v2`
- V1 components still accessible
- Test V2 workflow without disrupting V1

### Phase 2: Switchover (After Testing)
- Update `Pages.jsx` routing to use V2 by default
- Keep V1 accessible at `/approval-old` for 1 week
- Monitor for issues

### Phase 3: Cleanup (After 1 Week)
- Remove V1 components
- Archive old tables (don't drop)
- Update documentation

---

## 🚨 KNOWN LIMITATIONS (MVP)

1. **Shared Tenancy**: All users see same content (as specified)
2. **No Quote Scraping Yet**: Real quote sourcing not implemented
3. **No Daily Trends**: Optional feature not implemented
4. **Basic Validation**: Enhanced validation rules pending
5. **No Cost Alerts**: Monitoring dashboard pending

---

## 📞 SUPPORT

**Issues?**
- Check logs in Supabase Dashboard → Edge Functions
- Verify API keys in Supabase Dashboard → Secrets
- Test Edge Functions directly via Supabase UI

**Questions?**
- Review `PERDIA_V2_COMPLETE_OVERHAUL_PLAN.md` for full specification
- Check `docs/ANTHROPIC_API_GUIDE.md` for Claude API details

---

## ✨ WHAT'S WORKING NOW

You can:
- ✅ Generate articles via Topics & Questions page
- ✅ Review articles in Approval Queue with SLA timer
- ✅ Approve/reject articles
- ✅ Edit article content inline
- ✅ Rewrite articles with feedback
- ✅ Track costs per article
- ✅ See two-model pipeline (Grok → Perplexity)
- ✅ View validation status

What's NOT working yet:
- ❌ Auto-approve after 5 days (needs cron job)
- ❌ Monthly question ingest automation (manual only)
- ❌ Settings page UI (hardcoded defaults)
- ❌ WordPress publishing (integration exists but needs testing)

---

**Next Implementation Step:** Complete Settings page → Update routing → Deploy Edge Functions → Test end-to-end workflow
