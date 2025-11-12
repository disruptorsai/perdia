# Perdia V2 - Complete Planning Package

**Status:** 📋 Ready for Implementation
**Version:** 2.0
**Date:** November 11, 2025

---

## 📚 Document Index

### 1. Requirements & Vision
- **`perdiav2.md`** - Original client requirements and vision document
- **Purpose:** Understand what the client wants and why

### 2. UX/UI Design
- **`PERDIA_V2_UX_DESIGN.md`** - Comprehensive UX design (1,700+ lines)
- **Purpose:** Complete UI/UX specifications, interaction patterns, design system

### 3. Implementation Plan
- **`MASTER_IMPLEMENTATION_PLAN.md`** - 4-week sprint breakdown
- **Purpose:** Phases, timeline, milestones, dependencies, risk management

### 4. Technical Documents (To Be Created)
- **`TECHNICAL_ARCHITECTURE.md`** - Component hierarchy, data flow, system design
- **`DATABASE_MIGRATION_STRATEGY.md`** - SQL migrations, schema changes
- **`API_BACKEND_CHANGES.md`** - Edge Functions, API modifications
- **`TESTING_STRATEGY.md`** - Test cases, acceptance criteria
- **`DEPLOYMENT_PLAN.md`** - Production deployment checklist

---

## 🎯 Quick Start (For Implementation)

### Phase 1: Foundation (Week 1)
1. Read `MASTER_IMPLEMENTATION_PLAN.md` → Phase 1 section
2. Read `DATABASE_MIGRATION_STRATEGY.md` → Create migrations
3. Read `TECHNICAL_ARCHITECTURE.md` → Understand component structure
4. **Start coding:** Database migrations → SDK updates → Approval Queue

### Phase 2: Content Sources (Week 2)
1. Read Phase 2 in Master Plan
2. **Start coding:** Topic Questions → Quote Scraping

### Phase 3: Pipeline Experimentation (Week 3)
1. Read Phase 3 in Master Plan
2. **Start coding:** Grok/Perplexity → Pipeline UI

### Phase 4: Polish & Launch (Week 4)
1. Read Phase 4 in Master Plan + Testing Strategy + Deployment Plan
2. **Start coding:** WordPress Shortcodes → Settings → Testing → Deploy

---

## ✅ Planning Checklist

- [x] Client requirements documented (`perdiav2.md`)
- [x] UX/UI design complete (`PERDIA_V2_UX_DESIGN.md`)
- [x] Master implementation plan created (`MASTER_IMPLEMENTATION_PLAN.md`)
- [ ] Technical architecture documented
- [ ] Database migrations planned
- [ ] API/backend changes documented
- [ ] Testing strategy created
- [ ] Deployment plan created
- [ ] **All documents reviewed by Will**
- [ ] **Ready to start Phase 1**

---

## 🔄 Current Status: Awaiting Remaining Documents

We have completed:
1. ✅ Client requirements analysis
2. ✅ Complete UX/UI design (every screen, interaction pattern, design system)
3. ✅ 4-week implementation plan with phases

**Still need:**
- Technical Architecture (component hierarchy, data flow)
- Database Migration Strategy (SQL scripts)
- API/Backend Changes (Edge Functions)
- Testing Strategy (test cases)
- Deployment Plan (production checklist)

**Recommendation:** Create remaining docs before starting implementation (1-2 hours total).

---

## 📊 Project Overview

### What We're Building
**Perdia V2** = Simplified blog automation platform with modular AI pipelines

### Key Features
1. **Approval Queue** - Simplified review workflow (list + drawer + kanban)
2. **Topic Questions** - Monthly question ingest + keyword hybrid strategy
3. **Quote Scraping** - Real quotes from Reddit, Twitter, forums (60%+ real)
4. **Modular Pipelines** - Toggle Grok, Perplexity, Claude, etc.
5. **5-Day SLA Auto-Publish** - Articles auto-publish if not reviewed
6. **WordPress Shortcodes** - MANDATORY link transformation

### What We Keep
- All existing AI infrastructure
- Keywords system (1000s of keywords)
- WordPress client
- Auth & database
- UI components

### Timeline
**4 weeks total** = 160 hours
- Week 1: Foundation (Approval Queue + Auto-Publish)
- Week 2: Content Sources (Questions + Quotes)
- Week 3: Pipeline Experimentation (Grok + Perplexity + UI)
- Week 4: Polish & Launch (Shortcodes + Settings + Testing + Deploy)

---

## 🎨 Design Highlights

From `PERDIA_V2_UX_DESIGN.md`:

### Primary Screen: Approval Queue
- **List View** with article cards (title, word count, age, status)
- **Drawer Preview** slides from right (clean reading view)
- **Kanban Board** alternative view (drag & drop between statuses)
- **Inline Editing** (click text to edit, auto-save every 2 seconds)
- **Google Docs Comments** (select text, add comment, reply)
- **Keyboard Shortcuts** (j/k navigate, a approve, e edit, r regenerate)
- **Auto-Approve Timer** visual countdown (⏱️ Auto-approves in 3 days)

### Topics & Questions
- **Tabbed Interface** (Questions | Keywords | Trends)
- **Hybrid Strategy** link questions to keywords
- **Priority System** (1-5 stars, drag to reorder)
- **One-Click Generate** button per question

### Settings (Simplified)
- **Automation** (frequency, time, auto-approve days)
- **Integrations** (WordPress connection, test button)
- **Pipeline Config** (preset selector, A/B comparison)

---

## 🚀 Success Metrics (MVP)

1. **Throughput:** 20+ articles per week
2. **Quality:** 80%+ approval rate
3. **Speed:** Sarah reviews 10 articles in < 30 minutes
4. **Cost:** < $10 per article
5. **Automation:** 90%+ auto-publish success rate
6. **Quotes:** 60%+ real quotes per article

---

## 📁 File Structure (New)

```
src/
├── pages/
│   ├── ApprovalQueue.jsx           🆕 PRIMARY SCREEN
│   ├── TopicsManager.jsx           🆕 Questions + Keywords
│   └── PipelineConfig.jsx          🆕 Pipeline experimentation
│
├── components/
│   ├── approval/                   🆕 Approval Queue components
│   ├── topics/                     🆕 Topics/Questions components
│   ├── pipelines/                  🆕 Pipeline configuration
│   └── quotes/                     🆕 Quote library
│
├── lib/
│   ├── pipelines/                  🆕 Modular pipeline system
│   │   ├── pipeline-engine.js
│   │   ├── stages/
│   │   └── presets/
│   ├── content-validator.js        🆕 Pre-publish validation
│   ├── shortcode-transformer.js    🆕 WordPress shortcodes
│   └── question-ingestion.js       🆕 Monthly question ingest
│
└── scripts/
    ├── scrapers/                   🆕 Quote scraping
    │   ├── reddit-scraper.js
    │   ├── twitter-scraper.js
    │   └── geteducated-forums-scraper.js
    └── ingest-monthly-questions.js 🆕 Question import

supabase/
├── migrations/
│   ├── 20251111000001_add_pipeline_system.sql          🆕
│   ├── 20251111000002_add_topic_questions.sql          🆕
│   ├── 20251111000003_add_scraped_quotes.sql           🆕
│   └── 20251111000004_add_auto_publish_columns.sql     🆕
│
└── functions/
    ├── auto-publish-content/       🆕 Auto-publish cron job
    └── inject-quotes/              🆕 Quote injection
```

---

## 🔐 Required Credentials

### Before Implementation Starts:
1. **Reddit API** (Client ID, Secret, Username, Password)
2. **Twitter API** (API Key, Secret, Access Token, Access Secret)
3. **xAI (Grok)** (API Key)
4. **Perplexity** (API Key)
5. **GetEducated Forums** (DB Host, User, Password, Database)

### Obtain From:
- Reddit: https://www.reddit.com/prefs/apps
- Twitter: https://developer.twitter.com/
- Grok: https://x.ai/api
- Perplexity: https://www.perplexity.ai/api
- Forums: Request from client (GetEducated.com)

---

## ⚠️ Critical Requirements (MANDATORY)

From client requirements (`perdiav2.md`):

1. **Shortcodes** - ALL links MUST use GetEducated shortcodes (monetization)
2. **5-Day SLA** - Auto-publish after 5 days (configurable, validation required)
3. **Real Quotes** - 60%+ real quotes from Reddit/Twitter/forums (not AI-generated)
4. **WordPress Database** - Direct MySQL access + REST API (hybrid approach)
5. **Cost Monitoring** - Track AI spend per article (< $10 target)

---

## 📖 How to Use This Package

### For Planning Review:
1. Read `perdiav2.md` (understand client needs)
2. Read `PERDIA_V2_UX_DESIGN.md` (understand UI/UX)
3. Read `MASTER_IMPLEMENTATION_PLAN.md` (understand phases)
4. Review remaining docs when created

### For Implementation:
1. Follow `MASTER_IMPLEMENTATION_PLAN.md` phase by phase
2. Reference `PERDIA_V2_UX_DESIGN.md` for UI specs
3. Reference `DATABASE_MIGRATION_STRATEGY.md` for schema changes
4. Reference `TECHNICAL_ARCHITECTURE.md` for component structure
5. Reference `TESTING_STRATEGY.md` for acceptance criteria
6. Reference `DEPLOYMENT_PLAN.md` for production deployment

---

## 🎯 Next Steps

1. **Create remaining technical documents** (1-2 hours)
2. **Review all documents with Will** (30 minutes)
3. **Obtain API credentials** (1 day wait for approvals)
4. **Begin Phase 1: Foundation** (Week 1 starts)

---

**Status:** 📋 Planning 60% Complete
**Next:** Create remaining technical documents
**Then:** Start Phase 1 implementation
