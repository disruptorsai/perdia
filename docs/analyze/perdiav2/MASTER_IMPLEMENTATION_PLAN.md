# Perdia V2 - Master Implementation Plan

**Version:** 2.0
**Date:** November 11, 2025
**Status:** Planning Phase
**Estimated Total Time:** 4 weeks (160 hours)
**Team:** Will (Development), Sarah (Testing/Review)

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Project Scope](#project-scope)
3. [Phase Breakdown](#phase-breakdown)
4. [Dependencies & Prerequisites](#dependencies--prerequisites)
5. [Risk Management](#risk-management)
6. [Success Metrics](#success-metrics)
7. [Timeline & Milestones](#timeline--milestones)

---

## Executive Summary

Perdia V2 represents a **strategic pivot** from a complex multi-agent platform to a **focused, experimentation-driven blog automation system**. The new architecture maintains all existing capabilities while adding modular pipeline experimentation, question-driven content strategy, and simplified UX.

### Key Changes:
- **UI:** Simplified to 3 primary screens (Approval Queue, Topics Manager, Settings)
- **Content Strategy:** Questions-first with keyword fallback (hybrid approach)
- **AI Pipeline:** Modular, composable stages (toggle Grok, Perplexity, Claude, etc.)
- **Automation:** 5-day SLA auto-publish workflow
- **Quote System:** Real quotes from Reddit, Twitter, GetEducated forums
- **WordPress:** Enhanced integration with shortcodes (MANDATORY)

### What We Keep:
- ✅ All existing AI infrastructure (`ai-client.js`, `agent-sdk.js`)
- ✅ Keywords system (1000s of keywords, CSV import/export)
- ✅ WordPress client (452 lines, working)
- ✅ Authentication & database
- ✅ UI component library (shadcn/ui)
- ✅ Deployment configs

### What We Add:
- 🆕 Modular pipeline system (A/B testing different approaches)
- 🆕 Topic Questions database (monthly ingest)
- 🆕 Quote scraping system (Reddit, Twitter, forums)
- 🆕 5-day SLA auto-publish workflow
- 🆕 Simplified approval queue (list + drawer + kanban)
- 🆕 Pipeline performance dashboard

---

## Project Scope

### In Scope (MVP - 4 Weeks)

#### Phase 1: Foundation (Week 1 - 40 hours)
- Database migrations (pipeline system, questions, quotes)
- Core pipeline engine
- Approval Queue UI (80% of user value)
- 5-day SLA auto-publish workflow

#### Phase 2: Content Sources (Week 2 - 40 hours)
- Topic Questions manager UI
- Monthly question ingest system
- Quote scraping (Reddit, Twitter, GetEducated forums)
- Link keywords to questions (hybrid strategy)

#### Phase 3: Pipeline Experimentation (Week 3 - 40 hours)
- Add Grok & Perplexity providers to `ai-client.js`
- Pipeline configuration UI
- Visual pipeline editor (drag stages, toggle on/off)
- Performance comparison dashboard

#### Phase 4: Polish & Launch (Week 4 - 40 hours)
- WordPress shortcode system (MANDATORY)
- Settings UI (automation, integrations, pipeline)
- Testing & bug fixes
- User training (Sarah)
- Production deployment

### Out of Scope (Post-MVP)
- ❌ Trend monitoring (weekly sweep) - Optional future feature
- ❌ Multi-tenancy - Shared database for MVP
- ❌ Advanced analytics dashboard - Basic metrics only
- ❌ Mobile apps - Web-only for MVP
- ❌ API for external integrations - Internal use only

---

## Phase Breakdown

### Phase 1: Foundation (Week 1)

**Goal:** Core infrastructure + Approval Queue working

#### 1.1 Database Migrations (Day 1 - 8 hours)

**Files to Create:**
```
supabase/migrations/
├── 20251111000001_add_pipeline_system.sql
├── 20251111000002_add_topic_questions.sql
├── 20251111000003_add_scraped_quotes.sql
├── 20251111000004_add_auto_publish_columns.sql
└── 20251111000005_add_pipeline_performance.sql
```

**Changes:**
- Add `pipeline_configurations` table
- Add `topic_questions` table
- Add `scraped_quotes` table
- Add columns to `content_queue` (pipeline_config_id, generation_metadata, pending_review_since, auto_publish_enabled, validation_errors)
- Add `pipeline_performance_metrics` table
- Add indexes for performance

**Success Criteria:**
- [ ] All migrations apply cleanly
- [ ] No breaking changes to existing schema
- [ ] Indexes created for performance
- [ ] RLS policies applied correctly

#### 1.2 SDK Updates (Day 1-2 - 6 hours)

**Files to Modify:**
```
src/lib/perdia-sdk.js
```

**Changes:**
- Add `PipelineConfiguration` entity
- Add `TopicQuestion` entity
- Add `ScrapedQuote` entity
- Update `ContentQueue` entity (new columns)
- Add `PipelinePerformanceMetric` entity

**Success Criteria:**
- [ ] All CRUD operations work
- [ ] Realtime subscriptions functional
- [ ] Type safety maintained (JSDoc)
- [ ] Backwards compatible with existing code

#### 1.3 Core Pipeline Engine (Day 2-3 - 10 hours)

**Files to Create:**
```
src/lib/pipelines/
├── pipeline-engine.js          # Core orchestrator
├── pipeline-config.js          # Configuration loader
├── pipeline-validator.js       # Validate pipeline configs
└── stages/
    ├── base-stage.js           # Abstract base class
    ├── topic-sources/
    │   ├── keyword-source.js
    │   └── question-source.js
    ├── generators/
    │   ├── claude-generator.js
    │   └── gpt-generator.js
    └── outputs/
        ├── wordpress-formatter.js
        └── meta-generator.js
```

**Features:**
- Execute pipeline stages sequentially
- Track metrics per stage (time, cost, model used)
- Handle stage failures gracefully
- Support stage toggling (enabled/disabled)
- Rollback on critical failures

**Success Criteria:**
- [ ] Can execute simple pipeline (keyword → Claude → meta)
- [ ] Metrics tracked correctly
- [ ] Stage failures handled properly
- [ ] Performance metrics updated in database

#### 1.4 Approval Queue UI (Day 3-5 - 16 hours)

**Files to Create:**
```
src/pages/ApprovalQueue.jsx         # Main page
src/components/approval/
├── ApprovalList.jsx                # List of articles
├── ApprovalDrawer.jsx              # Article detail drawer
├── ApprovalCard.jsx                # Individual article card
├── KanbanBoard.jsx                 # Alternative view
├── ArticlePreview.jsx              # Clean reading view
├── InlineEditor.jsx                # Quick edits
├── CommentThread.jsx               # Google Docs-style comments
├── BulkActions.jsx                 # Multi-select actions
└── FilterBar.jsx                   # Search & filters
```

**Features:**
- List view with cards (title, word count, keywords, age, status)
- Drawer preview (slide from right, clean reading view)
- Kanban board view (drag & drop between statuses)
- Inline editing (click text to edit, auto-save)
- Google Docs-style comments (select text, add comment)
- Bulk actions (select multiple, approve all, delete)
- Keyboard shortcuts (j/k navigate, a approve, e edit)
- Status badges with auto-approve countdown
- Search & filters (status, model used, age, keywords)

**Success Criteria:**
- [ ] Can view list of pending articles
- [ ] Can open article in drawer
- [ ] Can approve article (one-click)
- [ ] Can edit article inline
- [ ] Can add comments
- [ ] Keyboard shortcuts work
- [ ] Auto-save functional
- [ ] Kanban drag & drop works

#### 1.5 5-Day SLA Auto-Publish (Day 5 - 8 hours)

**Files to Create:**
```
src/lib/content-validator.js                    # Pre-publish validation
supabase/functions/auto-publish-content/        # Cron job Edge Function
scripts/test-auto-publish.js                    # Testing script
```

**Features:**
- Auto-approve after 5 days (configurable)
- Pre-publish validation (title, content, meta, image, shortcodes)
- Failed validation blocks publish + notifies
- User can disable globally or per-article
- Visual countdown timer in UI
- Manual approval overrides timer

**Success Criteria:**
- [ ] Countdown timer shows in UI
- [ ] Articles auto-publish after 5 days (tested with short interval)
- [ ] Validation catches all required issues
- [ ] Failed validation shows clear errors
- [ ] User can disable per article
- [ ] Manual approval cancels timer

---

### Phase 2: Content Sources (Week 2)

**Goal:** Question system + Quote scraping operational

#### 2.1 Topic Questions Manager (Day 6-7 - 12 hours)

**Files to Create:**
```
src/pages/TopicsManager.jsx
src/components/topics/
├── QuestionList.jsx                # List of questions
├── QuestionDetail.jsx              # Question detail panel
├── QuestionImporter.jsx            # CSV import for questions
├── KeywordLinker.jsx               # Link keywords to questions
└── QuestionPrioritizer.jsx         # Drag to reorder priority
```

**Features:**
- List questions (monthly ingest, weekly trend, manual)
- Import questions via CSV
- Link questions to keywords (hybrid strategy)
- Priority system (1-5 stars, drag to reorder)
- Visual status (⏳ Not Started, 📝 Draft, ✅ Published)
- One-click "Generate Article" button per question
- Search & filter by category, source, status

**Success Criteria:**
- [ ] Can view list of questions
- [ ] Can import questions via CSV
- [ ] Can link question to keyword
- [ ] Can set priority (1-5 stars)
- [ ] Can generate article from question
- [ ] Search & filters work

#### 2.2 Monthly Question Ingest (Day 7-8 - 8 hours)

**Files to Create:**
```
scripts/ingest-monthly-questions.js             # Manual script
supabase/functions/ingest-questions/            # Edge Function
src/lib/question-ingestion.js                   # Client helper
```

**Features:**
- Fetch top 50 questions about higher education
- Sources: Google Search Console, Answer the Public, DataForSEO
- Auto-categorize (online-degrees, financial-aid, career, admissions)
- Calculate priority based on search volume
- Deduplicate similar questions
- Monthly cron job automation

**Success Criteria:**
- [ ] Script fetches top 50 questions
- [ ] Questions stored in database
- [ ] Auto-categorization works
- [ ] Priority calculated correctly
- [ ] Deduplication prevents duplicates

#### 2.3 Quote Scraping System (Day 8-10 - 20 hours)

**Files to Create:**
```
scripts/scrapers/
├── reddit-scraper.js               # Reddit API scraping
├── twitter-scraper.js              # Twitter API scraping
├── geteducated-forums-scraper.js   # Forum database scraping
└── master-scraper.js               # Orchestrator

supabase/functions/inject-quotes/  # Edge Function for quote injection

src/components/quotes/
├── QuoteLibrary.jsx                # Browse quotes
├── QuoteFilter.jsx                 # Filter by platform/category
└── QuoteCard.jsx                   # Individual quote display
```

**Features:**
- Scrape Reddit (r/college, r/ApplyingToCollege, etc.)
- Scrape Twitter (search API for education topics)
- Scrape GetEducated forums (direct database access)
- Calculate relevance score (0-1 based on keywords)
- Sentiment analysis (positive, negative, neutral, mixed)
- Content moderation (filter inappropriate language)
- Usage tracking (rotate quotes intelligently)
- Quote injection into articles (2+ quotes minimum)

**Success Criteria:**
- [ ] Reddit scraper functional (500+ quotes)
- [ ] Twitter scraper functional (300+ quotes)
- [ ] GetEducated forums scraper functional (200+ quotes)
- [ ] Relevance scoring works (60%+ relevant)
- [ ] Sentiment analysis accurate
- [ ] Inappropriate content filtered
- [ ] Quotes inject into articles
- [ ] Usage tracking updates correctly

**Dependencies:**
- Reddit API credentials (Client ID, Secret, Username, Password)
- Twitter API credentials (API Key, Secret, Access Token, Access Secret)
- GetEducated forum database access (Host, User, Password, Database)

---

### Phase 3: Pipeline Experimentation (Week 3)

**Goal:** Multiple AI models + Pipeline configuration UI

#### 3.1 Add Grok & Perplexity (Day 11-12 - 12 hours)

**Files to Modify:**
```
src/lib/ai-client.js                # Add Grok & Perplexity
supabase/functions/invoke-llm/      # Support new providers
```

**Changes:**
- Add Grok-2 model support (xAI API)
- Add Perplexity API support (fact-checking, citations)
- Update model registry
- Add provider-specific error handling
- Add cost tracking per provider

**Success Criteria:**
- [ ] Can invoke Grok for content generation
- [ ] Can invoke Perplexity for fact-checking
- [ ] Model registry updated
- [ ] Error handling works
- [ ] Cost tracking accurate

#### 3.2 Pipeline Stages (Day 12-14 - 16 hours)

**Files to Create:**
```
src/lib/pipelines/stages/
├── generators/
│   └── grok-generator.js           # Grok content generation
├── verifiers/
│   └── perplexity-verifier.js      # Perplexity fact-checking
├── enhancers/
│   ├── seo-optimizer.js            # SEO enhancements
│   ├── link-inserter.js            # Internal/external links
│   ├── quote-integrator.js         # Inject quotes
│   └── style-variator.js           # Vary writing style
└── outputs/
    └── shortcode-transformer.js    # WordPress shortcodes
```

**Features:**
- Grok generator (draft articles using Grok-2)
- Perplexity verifier (check facts, add citations, update links)
- SEO optimizer (keyword density, meta description)
- Link inserter (internal links with shortcodes)
- Quote integrator (inject real quotes from database)
- Style variator (vary sentence length, add colloquialisms)
- Shortcode transformer (convert links to GetEducated shortcodes)

**Success Criteria:**
- [ ] Each stage works independently
- [ ] Stages chain together in pipeline
- [ ] Metrics tracked per stage
- [ ] Stage failures handled gracefully

#### 3.3 Pipeline Configuration UI (Day 14-15 - 12 hours)

**Files to Create:**
```
src/pages/PipelineConfig.jsx
src/components/pipelines/
├── PipelinePresetSelector.jsx      # Choose preset (V1, V2, Hybrid)
├── PipelineEditor.jsx              # Visual editor (drag stages)
├── StageCard.jsx                   # Individual stage in editor
├── ModelSelector.jsx               # Choose model per stage
├── PerformanceDashboard.jsx        # Compare pipeline metrics
└── PipelineComparison.jsx          # A/B test results
```

**Features:**
- Preset selector (V1 Claude, V2 Grok, Hybrid, Custom)
- Visual pipeline editor (drag stages, toggle on/off)
- Model selector per stage (Claude Sonnet, GPT-4o, Grok-2, etc.)
- Performance dashboard (cost, time, approval rate, SEO score)
- A/B comparison (side-by-side metrics for V1 vs V2)

**Success Criteria:**
- [ ] Can select preset pipeline
- [ ] Can create custom pipeline
- [ ] Can drag stages to reorder
- [ ] Can toggle stages on/off
- [ ] Can swap models per stage
- [ ] Performance metrics display
- [ ] A/B comparison works

---

### Phase 4: Polish & Launch (Week 4)

**Goal:** WordPress shortcodes + Settings + Testing + Deploy

#### 4.1 WordPress Shortcode System (Day 16-17 - 12 hours)

**Files to Modify:**
```
src/lib/wordpress-client.js                      # Enhanced client
src/lib/shortcode-transformer.js                 # Convert links
src/lib/pipelines/stages/outputs/                # Shortcode stage
    shortcode-transformer.js
```

**Features:**
- Transform all links to GetEducated shortcodes (MANDATORY)
- Internal links: `[ge_internal_link url="..."]text[/ge_internal_link]`
- Affiliate links: `[ge_affiliate_link url="..."]text[/ge_affiliate_link]`
- External links: `[ge_external_link url="..."]text[/ge_external_link]`
- Validate shortcode syntax before publish
- Pre-publish validation catches malformed shortcodes

**Success Criteria:**
- [ ] All links convert to shortcodes
- [ ] Shortcode syntax validated
- [ ] Validation catches malformed shortcodes
- [ ] Articles publish to WordPress correctly

#### 4.2 Settings UI (Day 17-18 - 12 hours)

**Files to Create:**
```
src/pages/Settings.jsx
src/components/settings/
├── AutomationSettings.jsx          # Frequency, time, auto-approve
├── IntegrationSettings.jsx         # WordPress connection
├── PipelineSettings.jsx            # Pipeline config (advanced)
├── TeamSettings.jsx                # Future: team management
└── NotificationSettings.jsx        # Future: email alerts
```

**Features:**
- Automation: Posting frequency, time, auto-approve days
- Integrations: WordPress URL, credentials, test connection
- Pipeline: Active pipeline selector, performance comparison
- Notifications: Email alerts (future)

**Success Criteria:**
- [ ] Can configure posting schedule
- [ ] Can configure auto-approve days
- [ ] Can test WordPress connection
- [ ] Can select active pipeline
- [ ] Settings save correctly

#### 4.3 Testing & Bug Fixes (Day 19-20 - 16 hours)

**Testing Areas:**
1. **Approval Queue:**
   - Load 50+ articles, test performance
   - Test inline editing, comments, bulk actions
   - Test keyboard shortcuts
   - Test kanban drag & drop

2. **Topic Questions:**
   - Import 100 questions via CSV
   - Link questions to keywords
   - Generate articles from questions

3. **Quote System:**
   - Run scrapers, verify 1000+ quotes
   - Test quote injection (2+ per article)
   - Test rotation logic

4. **Pipeline System:**
   - Test V1 pipeline (Claude + Keywords)
   - Test V2 pipeline (Grok + Questions)
   - Compare performance metrics

5. **Auto-Publish:**
   - Test 5-day countdown
   - Test validation failures
   - Test manual override

6. **WordPress Integration:**
   - Publish 10 articles
   - Verify shortcodes work
   - Check featured images, categories, tags

**Success Criteria:**
- [ ] No critical bugs
- [ ] All features work end-to-end
- [ ] Performance acceptable (< 3s page loads)
- [ ] Mobile responsive
- [ ] Accessibility passes (WCAG 2.1 AA)

#### 4.4 User Training & Documentation (Day 20 - 4 hours)

**Deliverables:**
- **User Guide:** Step-by-step walkthrough for Sarah
- **Video Tutorial:** 15-minute screencast of key features
- **Quick Reference:** One-page cheat sheet (keyboard shortcuts, common tasks)
- **SOP:** Internal linking rules, content standards

**Success Criteria:**
- [ ] Sarah can review 10 articles in < 30 minutes
- [ ] Sarah understands approval workflow
- [ ] Sarah knows how to add questions
- [ ] Sarah knows how to configure automation

#### 4.5 Production Deployment (Day 20 - 4 hours)

**Steps:**
1. Run all database migrations on production Supabase
2. Deploy Edge Functions (auto-publish, invoke-llm, inject-quotes)
3. Configure cron jobs (auto-publish every 6 hours, quote scraping daily)
4. Deploy frontend to Netlify
5. Test production deployment end-to-end
6. Monitor first 24 hours

**Success Criteria:**
- [ ] All migrations applied successfully
- [ ] Edge Functions deployed and working
- [ ] Cron jobs configured
- [ ] Frontend deployed (green build)
- [ ] Production test article publishes correctly
- [ ] No errors in first 24 hours

---

## Dependencies & Prerequisites

### API Credentials Required

1. **Reddit API:**
   - Client ID
   - Client Secret
   - Username
   - Password
   - **Obtain:** https://www.reddit.com/prefs/apps

2. **Twitter API (X):**
   - API Key
   - API Secret
   - Access Token
   - Access Secret
   - **Obtain:** https://developer.twitter.com/

3. **xAI (Grok):**
   - API Key
   - **Obtain:** https://x.ai/api

4. **Perplexity:**
   - API Key
   - **Obtain:** https://www.perplexity.ai/api

5. **GetEducated Forums:**
   - Database Host
   - Database User
   - Database Password
   - Database Name
   - **Obtain:** Request from client

### NPM Packages to Install

```bash
npm install snoowrap twitter-api-v2 mysql2 @ai-sdk/grok @ai-sdk/perplexity
```

### External Services

- **DataForSEO:** Keyword research (optional, existing account)
- **Cloudinary:** Image optimization (existing account)
- **Netlify:** Frontend hosting (existing account)
- **Supabase:** Database & Edge Functions (existing project)

---

## Risk Management

### High Risk Items

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| GetEducated forum credentials unavailable | HIGH | MEDIUM | Use Reddit + Twitter only for MVP, add forums later |
| Quote scraping violates ToS | HIGH | LOW | Use official APIs, respect rate limits, add attribution |
| Grok/Perplexity API changes | MEDIUM | LOW | Abstract behind provider interface, easy to swap |
| 5-day auto-publish publishes bad content | HIGH | MEDIUM | Strict validation, manual disable option, Sarah reviews daily |
| WordPress shortcodes break | HIGH | LOW | Extensive testing, validation before publish |

### Medium Risk Items

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Performance issues with 1000+ keywords | MEDIUM | MEDIUM | Add pagination, virtual scrolling, indexing |
| Pipeline stages timeout (400s limit) | MEDIUM | LOW | Break into smaller stages, add retry logic |
| Quote database grows too large | LOW | HIGH | Rotate old quotes, archive unused ones |

### Low Risk Items

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| UI performance on mobile | LOW | MEDIUM | Progressive enhancement, lazy loading |
| Browser compatibility issues | LOW | LOW | Test on Chrome, Firefox, Safari |

---

## Success Metrics

### Sprint 1 (Week 1)
- [ ] Approval Queue functional (can approve 10 articles in < 30 minutes)
- [ ] 5-day auto-publish working (tested with short interval)
- [ ] Database migrations complete (no errors)

### Sprint 2 (Week 2)
- [ ] Topic Questions manager working (100 questions imported)
- [ ] Quote scraping operational (1000+ quotes total)
- [ ] Questions linked to keywords (hybrid strategy)

### Sprint 3 (Week 3)
- [ ] Grok & Perplexity integrated
- [ ] Pipeline configuration UI functional
- [ ] A/B comparison shows V1 vs V2 metrics

### Sprint 4 (Week 4)
- [ ] WordPress shortcodes working (100% of links)
- [ ] Settings UI complete
- [ ] Production deployment successful
- [ ] Sarah trained and comfortable with platform

### MVP Success Criteria (End of Week 4)
1. **Throughput:** Generate and publish 20+ articles per week
2. **Quality:** 80%+ approval rate (first review)
3. **Speed:** Sarah reviews 10 articles in < 30 minutes
4. **Cost:** < $10 per article average
5. **Automation:** 90%+ articles auto-publish (validation pass rate)
6. **Quotes:** 60%+ real quotes per article (not AI-generated)

---

## Timeline & Milestones

```
Week 1: Foundation
├─ Day 1:  Database migrations + SDK updates
├─ Day 2:  Core pipeline engine
├─ Day 3:  Approval Queue UI (list + drawer)
├─ Day 4:  Approval Queue UI (kanban + inline edit)
└─ Day 5:  5-day SLA auto-publish

Week 2: Content Sources
├─ Day 6:  Topic Questions manager UI
├─ Day 7:  Monthly question ingest
├─ Day 8:  Quote scraping (Reddit + Twitter)
├─ Day 9:  Quote scraping (GetEducated forums)
└─ Day 10: Quote injection + Library UI

Week 3: Pipeline Experimentation
├─ Day 11: Add Grok provider
├─ Day 12: Add Perplexity provider
├─ Day 13: Pipeline stages (verifier, enhancers)
├─ Day 14: Pipeline configuration UI
└─ Day 15: Performance dashboard + A/B comparison

Week 4: Polish & Launch
├─ Day 16: WordPress shortcode system
├─ Day 17: Settings UI (automation + integrations)
├─ Day 18: Settings UI (pipeline + notifications)
├─ Day 19: Testing & bug fixes (day 1)
└─ Day 20: Testing + Training + Deployment
```

### Critical Path

```
Database Migrations
    ↓
SDK Updates
    ↓
Pipeline Engine → Approval Queue UI → Auto-Publish
    ↓
Topic Questions → Quote Scraping
    ↓
Grok/Perplexity → Pipeline Stages → Pipeline UI
    ↓
WordPress Shortcodes → Settings UI
    ↓
Testing → Training → Deployment
```

---

## Next Steps

1. **Review this plan** - Ensure all requirements captured
2. **Obtain credentials** - Reddit, Twitter, xAI, Perplexity, GetEducated forums
3. **Create Technical Architecture document** - Component hierarchy, API changes
4. **Create Database Migration Strategy** - Detailed SQL migrations
5. **Create Testing Strategy** - Test cases, acceptance criteria
6. **Begin Phase 1** - Database migrations + SDK updates

---

**Document Status:** ✅ Complete - Ready for Review
**Next Document:** `TECHNICAL_ARCHITECTURE.md`
