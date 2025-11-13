# PERDIA V2: COMPLETE APPLICATION OVERHAUL PLAN

**Date:** 2025-11-12
**Status:** Planning Phase
**Scope:** Major Simplification - Multi-Agent Platform → Single-Purpose Blog Writer
**Target:** 4-Week MVP Implementation

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Requirements Analysis](#requirements-analysis)
3. [Current State vs. New Direction](#current-state-vs-new-direction)
4. [Database Schema Redesign](#database-schema-redesign)
5. [API Integrations](#api-integrations)
6. [UI/UX Redesign](#uiux-redesign)
7. [Content Generation Pipeline](#content-generation-pipeline)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Risks & Mitigation](#risks--mitigation)
10. [Success Criteria](#success-criteria)

---

## EXECUTIVE SUMMARY

### The Big Pivot

Perdia is undergoing a **major simplification** from a complex 9-agent SEO platform to a **focused blog-writing system** for GetEducated.com. This isn't a feature addition—it's a fundamental architectural shift.

### Key Changes

| Aspect | Before (V1) | After (V2) |
|--------|-------------|------------|
| **Agents** | 9 specialized agents | 1 Blog Writer |
| **UI Complexity** | 15+ pages, multi-agent dropdown | 3 core screens |
| **Workflow** | Pre-draft chat → multiple queues | Direct to single queue |
| **Content Strategy** | Keyword-first | Questions-first |
| **AI Pipeline** | Claude → OpenAI (fallback) | Grok → Perplexity (verify) |
| **WordPress** | REST API | Plugin/MCP preferred |
| **Automation** | Complex settings | Frequency + time only |
| **Approval** | Manual required | 5-day auto-approve |

### Why This Matters

**Client Feedback:**
_"We don't need all this complexity. We just want the blog to work really well."_

**Business Impact:**
- Faster time-to-market (4 weeks vs. 12+ weeks)
- Reduced maintenance burden (80% less code)
- Better user experience (3 screens vs. 15)
- Focused value delivery (blog performance is the only KPI)

### Implementation Strategy

**"Carve-Out Refactor"** (not full rebuild):
1. Build Writer V2 alongside current app
2. Reuse auth, WordPress connector, database layer
3. Route new content through V2
4. Retire old UI after validation (2-3 weeks)

---

## REQUIREMENTS ANALYSIS

### Meeting Transcript Insights

**Key Quotes:**

> "That's all they want. It's just blog. The blog writer again, being able to analyze and update current content on the website so they could try to scan current content and present updates. That's it."

> "Everything should go to the approval page and then if they're not approved within five days, it auto-publishes. That's how it should work initially."

> "Pull the top user questions people are asking about college degrees or college education right now. We basically want to run this query once a month. Create content for those questions and maybe pull out the top 50 questions."

> "Grok is producing better results than Claude right now because it has more access to Reddit, local sticks, X and stuff, so it understands more about the newest SEO updates."

> "We should probably have it go through more than one [model]. We'll test to get results. Have Grok pull it originally and then throw it into Perplexity."

### Requirements Breakdown

#### 1. SINGLE AGENT FOCUS
- **Remove:** 9-agent system, agent picker dropdown, agent conversations
- **Keep:** 1 "Blog Writer" agent with customizable prompts
- **Impact:** 90% reduction in agent-related code

#### 2. SINGLE APPROVAL QUEUE
- **Feature:** All articles → one unified queue
- **SLA:** 5-day countdown timer (MANDATORY)
- **Auto-Approve:** Publish automatically if not reviewed in 5 days
- **Actions:** Approve, Reject, Rewrite, Regenerate, Comment
- **Feedback Loop:** Comments feed back to model for training

#### 3. QUESTIONS-FIRST STRATEGY
- **Monthly Ingest:** Pull "top 50 questions people are asking about college degrees/higher ed"
- **Source:** Grok/Perplexity queries, Answer the Public, forums
- **Workflow:** Question → Topic → Article → Keywords (byproduct)
- **Optional:** Daily 5am "trend sweep" of X/Twitter for hot topics

#### 4. TWO-MODEL PIPELINE
- **Stage 1 (Generate):** Grok creates draft
  - More human-like writing
  - Access to X/Twitter/Reddit
  - Natural stylistic variation
- **Stage 2 (Verify):** Perplexity fact-checks
  - Live data access
  - Source citations
  - Link validation

#### 5. WORDPRESS INTEGRATION
- **Preferred:** Plugin/MCP pattern
- **Fallback:** REST API (current implementation)
- **Avoid:** Saved browser login methods
- **Actions:** Publish, update, manage categories/tags, featured images

#### 6. MINIMAL AUTOMATION CONTROLS
- **Settings:**
  - Posting frequency (daily / 3×/week / weekly)
  - Post time (e.g., 5:00 AM MT)
  - Require approval before publishing (default: ON)
  - Auto-approve after N days (default: 5)
- **No Complexity:** Remove advanced scheduling, multi-site management, etc.

#### 7. HUMAN-IN-THE-LOOP FEEDBACK
- **Comment System:** Google Docs-style inline comments
- **Actions:** Approve, Rewrite (with instructions), Regenerate, Send back to Draft
- **Training Loop:** Store feedback in database, feed back to future prompts
- **Goal:** Self-improving system over time

#### 8. INTERNAL LINKING
- **Current Status:** Already working in V1
- **Action:** Document the process (anchor text variety, 2-4 links per article, cornerstone content)
- **Integration:** AI suggests internal links during generation

#### 9. AI DETECTION AVOIDANCE
- **Strategy:** Stylistic variation (NOT intentional errors)
- **Techniques:**
  - Varying sentence length
  - Narrative elements
  - Occasional colloquialisms
  - Longer, more verbose content
  - Pattern breaking (via Frizzly or similar)
- **Quote:** _"The way that the AI detectors in Google are detecting AI is by how flawless the articles are."_

#### 10. SHARED TENANCY (MVP)
- **Access:** Everyone sees the same content/database
- **Attribution:** Comments identify who said what
- **Future:** Add per-client isolation later

#### 11. QUOTE SOURCING
- **Sources:** Reddit, Twitter/X, GetEducated forums
- **Goal:** 60%+ real quotes (not fictional)
- **Storage:** Link quotes to articles in database

#### 12. COST MONITORING
- **Target:** <$10/article
- **Track:** Model usage, token counts per article
- **Display:** Show cost in approval queue

---

## CURRENT STATE VS. NEW DIRECTION

### Architecture Comparison

#### KEEP ✅
- Supabase backend (PostgreSQL + Auth + Storage)
- WordPress integration (improve to plugin/MCP)
- Approval workflow (simplify to single queue)
- Auth system
- Basic SDK patterns (`perdia-sdk.js`)
- Feedback system (enhance with training loop)
- Image generation (already uses Gemini 2.5 Flash)
- Storage buckets (content-images, uploads)

#### CUT ❌
**Tables to Remove/Archive:**
- `agent_definitions` (9 agents → 1 agent)
- `agent_conversations` (remove multi-turn chat)
- `agent_messages` (remove chat history)
- `blog_posts` (duplicate of content_queue)
- `social_posts` (out of scope)
- `page_optimizations` (out of scope)
- `knowledge_base_documents` (optional: keep for training)
- `chat_channels` (remove team chat)
- `chat_messages` (remove team chat)
- `agent_feedback` (replace with enhanced feedback table)

**Pages to Remove:**
- `AIAgents.jsx` (multi-agent UI)
- `BlogLibrary.jsx` (merged with Articles)
- `SocialPostLibrary.jsx` (out of scope)
- `ContentCalendar.jsx` (out of scope)
- `TeamChat.jsx` (out of scope)
- `PerformanceDashboard.jsx` (out of scope for MVP)
- `PipelineConfiguration.jsx` (absorbed into Settings)

**Components to Remove:**
- `AgentPicker.jsx`
- `ChatInterface.jsx`
- `ChatHistoryPanel.jsx`
- Multi-agent related components

#### ADD ➕
**New Tables:**
- `articles` (simplified from content_queue)
- `topic_questions` (monthly/weekly question ingest)
- `feedback` (enhanced with training loop)
- `quotes` (real quote sourcing)
- `article_costs` (cost tracking)
- `automation_schedule` (simplified settings)

**New API Integrations:**
- Grok API (xAI) for content generation
- Perplexity API for fact-checking
- X/Twitter API for trend monitoring (optional)

**New Features:**
- 5-day SLA countdown timer
- Auto-approve job (cron)
- Two-stage generation pipeline
- Topics & Questions system
- Daily trend sweep (optional)
- Cost tracking per article

**New Pages:**
- `ApprovalQueue.jsx` (redesigned as PRIMARY screen)
- `TopicQuestionsManager.jsx` (new)
- `Settings.jsx` (simplified)

---

## DATABASE SCHEMA REDESIGN

### Migration Strategy

**Approach:** Incremental schema evolution (not drop/recreate)

1. **Phase 1:** Add new tables (`articles`, `topic_questions`, `feedback`, `quotes`)
2. **Phase 2:** Migrate existing `content_queue` data to `articles`
3. **Phase 3:** Archive unused tables (don't drop immediately)
4. **Phase 4:** Drop archived tables after 30 days

### New Schema Design

#### 1. ARTICLES TABLE (replaces content_queue)

```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  body TEXT NOT NULL, -- HTML content
  excerpt TEXT,
  featured_image_url TEXT,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  target_keywords TEXT[] DEFAULT '{}',
  word_count INTEGER DEFAULT 0,

  -- Status & Workflow
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_review', 'approved', 'published', 'rejected')),

  -- SLA Tracking (MANDATORY for 5-day auto-approve)
  pending_since TIMESTAMPTZ, -- When article entered pending_review
  auto_approve_at TIMESTAMPTZ, -- Calculated: pending_since + 5 days

  -- AI Model Tracking
  model_primary TEXT, -- e.g., 'grok-2'
  model_verify TEXT, -- e.g., 'pplx-70b-online'
  generation_cost NUMERIC(10,4), -- USD cost for generation
  verification_cost NUMERIC(10,4), -- USD cost for verification
  total_cost NUMERIC(10,4), -- Sum of above

  -- WordPress Integration
  wordpress_post_id TEXT,
  wordpress_url TEXT,

  -- Validation
  validation_status TEXT CHECK (validation_status IN ('valid', 'invalid', 'pending')),
  validation_errors JSONB DEFAULT '[]',

  -- Source
  topic_question_id UUID REFERENCES topic_questions(id),
  trend_source TEXT, -- e.g., 'twitter:2025-11-12'

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_articles_user_id ON articles(user_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_pending_since ON articles(pending_since);
CREATE INDEX idx_articles_auto_approve_at ON articles(auto_approve_at);
CREATE INDEX idx_articles_target_keywords ON articles USING gin(target_keywords);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

-- Trigger for setting auto_approve_at when status changes to pending_review
CREATE OR REPLACE FUNCTION set_auto_approve_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending_review' AND OLD.status != 'pending_review' THEN
    NEW.pending_since = NOW();
    -- Get auto_approve_days from automation_schedule (default: 5)
    NEW.auto_approve_at = NOW() + INTERVAL '5 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_auto_approve_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION set_auto_approve_at();
```

#### 2. TOPIC_QUESTIONS TABLE (new)

```sql
CREATE TABLE topic_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Question Data
  question_text TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('monthly', 'weekly', 'daily_trend', 'manual')),
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Extracted Keywords
  keywords_extracted TEXT[] DEFAULT '{}',

  -- Prioritization
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  search_volume INTEGER DEFAULT 0,

  -- Usage Tracking
  used_for_article_id UUID REFERENCES articles(id),
  used_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(question_text, source)
);

-- Indexes
CREATE INDEX idx_topic_questions_source ON topic_questions(source);
CREATE INDEX idx_topic_questions_priority ON topic_questions(priority DESC);
CREATE INDEX idx_topic_questions_used_for_article_id ON topic_questions(used_for_article_id);
CREATE INDEX idx_topic_questions_discovered_at ON topic_questions(discovered_at DESC);
```

#### 3. FEEDBACK TABLE (enhanced)

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Feedback Type
  type TEXT NOT NULL CHECK (type IN ('comment', 'rewrite', 'regenerate', 'approve', 'reject')),

  -- Content
  payload JSONB NOT NULL, -- { text, instructions, rating, etc. }

  -- Training Loop
  used_for_training BOOLEAN DEFAULT false,
  training_impact TEXT, -- Description of how this affected future prompts

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_article_id ON feedback(article_id);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_type ON feedback(type);
CREATE INDEX idx_feedback_used_for_training ON feedback(used_for_training);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
```

#### 4. QUOTES TABLE (new)

```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,

  -- Quote Data
  quote_text TEXT NOT NULL,
  source_url TEXT,
  source_type TEXT CHECK (source_type IN ('reddit', 'twitter', 'forum', 'other')),
  author_name TEXT,

  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_quotes_article_id ON quotes(article_id);
CREATE INDEX idx_quotes_source_type ON quotes(source_type);
CREATE INDEX idx_quotes_verified ON quotes(verified);
```

#### 5. AUTOMATION_SCHEDULE TABLE (simplified)

```sql
CREATE TABLE automation_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Schedule Settings
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', '3x_week', 'weekly', 'custom')),
  post_time TIME NOT NULL DEFAULT '05:00:00', -- e.g., 5:00 AM
  timezone TEXT DEFAULT 'America/Denver', -- MT

  -- Approval Settings
  requires_approval BOOLEAN DEFAULT true,
  auto_approve_days INTEGER DEFAULT 5 CHECK (auto_approve_days >= 1),

  -- Status
  enabled BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger
CREATE TRIGGER update_automation_schedule_updated_at
  BEFORE UPDATE ON automation_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();
```

#### 6. INTEGRATIONS TABLE (simplified from wordpress_connections)

```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Integration Type
  type TEXT NOT NULL CHECK (type IN ('wordpress', 'mcp', 'other')),

  -- Connection Details
  base_url TEXT NOT NULL,
  credentials JSONB NOT NULL, -- Encrypted: { username, password/token }

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  last_checked TIMESTAMPTZ,
  last_error TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_integrations_type ON integrations(type);
CREATE INDEX idx_integrations_status ON integrations(status);
```

### Data Migration Script

```sql
-- Migration: content_queue → articles
INSERT INTO articles (
  id, user_id, title, slug, body,
  meta_title, meta_description, target_keywords, word_count,
  status, wordpress_post_id, wordpress_url,
  created_at, updated_at
)
SELECT
  id, user_id, title, slug, content,
  title AS meta_title, meta_description, target_keywords, word_count,
  status, wordpress_post_id, wordpress_url,
  created_date, updated_date
FROM content_queue
WHERE content_type = 'new_article'
ON CONFLICT (id) DO NOTHING;

-- Set pending_since for existing pending articles
UPDATE articles
SET pending_since = updated_at,
    auto_approve_at = updated_at + INTERVAL '5 days'
WHERE status = 'pending_review' AND pending_since IS NULL;
```

---

## API INTEGRATIONS

### 1. Grok API (xAI)

**Purpose:** Primary content generation (Stage 1 of pipeline)

**Why Grok?**
- More human-like writing style
- Access to X/Twitter data (real-time trends)
- Natural stylistic variation (helps avoid AI detection)
- Better understanding of recent SEO updates

**API Documentation:** https://docs.x.ai/

**Implementation:**

```javascript
// src/lib/grok-client.js

import { supabase } from './supabase-client';

/**
 * Grok API Client for xAI
 * Handles content generation requests
 */

const GROK_MODELS = {
  'grok-2': 'grok-2',                     // Full Grok 2
  'grok-2-mini': 'grok-2-mini',           // Faster, cheaper
  'grok-beta': 'grok-beta',               // Beta version
  'default': 'grok-2'
};

export async function invokeGrok(options) {
  const {
    prompt,
    systemPrompt,
    messages,
    model = 'grok-2',
    temperature = 0.7,
    maxTokens = 4000,
  } = options;

  // Call via Supabase Edge Function (400s timeout)
  const { data, error } = await supabase.functions.invoke('invoke-grok', {
    body: {
      prompt,
      systemPrompt,
      messages,
      model: GROK_MODELS[model] || model,
      temperature,
      maxTokens,
    }
  });

  if (error) {
    console.error('Grok API error:', error);
    throw new Error(`Grok API failed: ${error.message}`);
  }

  return {
    content: data.content,
    model: data.model,
    usage: data.usage,
    cost: calculateGrokCost(data.usage)
  };
}

function calculateGrokCost(usage) {
  // Grok pricing (as of Nov 2025)
  // $5 per 1M input tokens, $15 per 1M output tokens (example pricing)
  const inputCost = (usage.prompt_tokens / 1000000) * 5;
  const outputCost = (usage.completion_tokens / 1000000) * 15;
  return inputCost + outputCost;
}
```

**Edge Function:** `supabase/functions/invoke-grok/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GROK_API_KEY = Deno.env.get('GROK_API_KEY');
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

serve(async (req) => {
  const { prompt, systemPrompt, messages, model, temperature, maxTokens } = await req.json();

  // Build messages array
  const apiMessages = [];
  if (systemPrompt) {
    apiMessages.push({ role: 'system', content: systemPrompt });
  }
  if (messages) {
    apiMessages.push(...messages);
  } else if (prompt) {
    apiMessages.push({ role: 'user', content: prompt });
  }

  // Call Grok API
  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'grok-2',
      messages: apiMessages,
      temperature: temperature || 0.7,
      max_tokens: maxTokens || 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  const data = await response.json();

  return new Response(JSON.stringify({
    content: data.choices[0].message.content,
    model: data.model,
    usage: data.usage,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### 2. Perplexity API

**Purpose:** Fact-checking & verification (Stage 2 of pipeline)

**Why Perplexity?**
- Live web search capabilities
- Source citations
- Fact verification
- Link validation

**API Documentation:** https://docs.perplexity.ai/

**Implementation:**

```javascript
// src/lib/perplexity-client.js

import { supabase } from './supabase-client';

const PERPLEXITY_MODELS = {
  'pplx-7b-online': 'pplx-7b-online',       // Fast online model
  'pplx-70b-online': 'pplx-70b-online',     // Full online model
  'default': 'pplx-70b-online'
};

export async function invokePerplexity(options) {
  const {
    prompt,
    content, // Content to verify
    model = 'pplx-70b-online',
    searchDomainFilter = [], // Optional domain restrictions
  } = options;

  // Call via Supabase Edge Function
  const { data, error } = await supabase.functions.invoke('invoke-perplexity', {
    body: {
      prompt,
      content,
      model: PERPLEXITY_MODELS[model] || model,
      searchDomainFilter,
    }
  });

  if (error) {
    console.error('Perplexity API error:', error);
    throw new Error(`Perplexity API failed: ${error.message}`);
  }

  return {
    content: data.content,
    citations: data.citations || [],
    model: data.model,
    usage: data.usage,
    cost: calculatePerplexityCost(data.usage)
  };
}

function calculatePerplexityCost(usage) {
  // Perplexity pricing (as of Nov 2025)
  // $1 per 1M tokens (example pricing)
  return (usage.total_tokens / 1000000) * 1;
}

/**
 * Verify article content for factual accuracy
 */
export async function verifyArticle(articleContent, title) {
  const prompt = `
You are a fact-checking assistant. Review the following article for:
1. Factual accuracy
2. Up-to-date information
3. Broken or missing citations
4. Recommendations for reliable sources

Article Title: ${title}

Article Content:
${articleContent}

Provide:
- List of factual claims that need verification
- Suggested citations with URLs
- Any outdated information that should be updated
- Overall accuracy score (0-100)
`;

  return await invokePerplexity({
    prompt,
    content: articleContent,
  });
}
```

### 3. Two-Stage Pipeline

**Content Generation Workflow:**

```javascript
// src/lib/content-pipeline.js

import { invokeGrok } from './grok-client';
import { verifyArticle } from './perplexity-client';
import { Articles } from './perdia-sdk';

/**
 * Two-stage content generation pipeline
 * Stage 1: Grok generates draft
 * Stage 2: Perplexity verifies and enhances
 */
export async function generateArticle(topicQuestion, userInstructions = '') {
  // Stage 1: Generate draft with Grok
  console.log('Stage 1: Generating draft with Grok...');

  const grokPrompt = `
You are a blog writer for GetEducated.com, a higher education information website.

Topic Question: ${topicQuestion}

${userInstructions}

Write a comprehensive blog article (1500-2500 words) that:
- Directly answers the question
- Uses natural, conversational language
- Varies sentence structure and length
- Includes narrative elements and occasional colloquialisms
- Cites real examples and data (with placeholder [CITATION NEEDED] tags)
- Suggests 2-4 internal links to related GetEducated.com pages
- Avoids overly perfect or robotic language

Format: HTML with proper heading structure (H2, H3, etc.)
`;

  const grokResponse = await invokeGrok({
    prompt: grokPrompt,
    temperature: 0.8, // Higher for more natural variation
    maxTokens: 4000,
  });

  const draftContent = grokResponse.content;
  const grokCost = grokResponse.cost;

  // Stage 2: Verify with Perplexity
  console.log('Stage 2: Verifying with Perplexity...');

  const verificationResult = await verifyArticle(draftContent, topicQuestion);
  const perplexityCost = verificationResult.cost;

  // Merge verification results into content
  let finalContent = draftContent;

  // Replace [CITATION NEEDED] tags with actual citations
  if (verificationResult.citations && verificationResult.citations.length > 0) {
    verificationResult.citations.forEach((citation, index) => {
      finalContent = finalContent.replace(
        '[CITATION NEEDED]',
        `<sup><a href="${citation.url}" target="_blank">[${index + 1}]</a></sup>`
      );
    });
  }

  // Add verification notes
  const verificationNotes = `
<!-- Verification Results -->
<!-- Accuracy Score: ${verificationResult.accuracy || 'N/A'} -->
<!-- Citations Added: ${verificationResult.citations?.length || 0} -->
  `.trim();

  finalContent = verificationNotes + '\n\n' + finalContent;

  return {
    content: finalContent,
    grokCost,
    perplexityCost,
    totalCost: grokCost + perplexityCost,
    modelPrimary: 'grok-2',
    modelVerify: 'pplx-70b-online',
    verificationResult,
  };
}
```

---

## UI/UX REDESIGN

### Navigation Structure (Simplified)

**Before (15 pages):**
```
├── Dashboard
├── Keywords
├── Content Library
├── Approval Queue
├── AI Agents
├── Performance Dashboard
├── Blog Library
├── Social Posts
├── Content Calendar
├── Content Editor
├── Team Chat
├── WordPress Connection
├── Automation Controls
├── Pipeline Configuration
└── Settings
```

**After (3 core screens):**
```
├── Approval Queue (PRIMARY - 80% of time spent here)
├── Topics & Questions
└── Settings
    ├── Automation
    ├── WordPress Integration
    ├── Models Configuration
    └── Image Generation

(Optional/Hidden in MVP):
├── Articles (all published content)
```

### Screen Designs

#### 1. APPROVAL QUEUE (Primary Screen)

**Layout:** Full-screen table/kanban with drawer for article detail

**Features:**
- List view (default) or Kanban view toggle
- SLA countdown timer (prominent)
- Status badges (Valid/Invalid/Pending validation)
- Quick actions (Approve/Reject without opening)
- Search and filters
- Bulk operations
- Sort by: SLA urgency, created date, status

**Table Columns:**
| Column | Description |
|--------|-------------|
| Title | Article title (truncated) |
| Status | Badge (Draft, Pending, Approved, Published, Rejected) |
| SLA Timer | "3d 12h left" (red if <24h, yellow if <3d) |
| Model | "Grok → Perplexity" |
| Word Count | e.g., "1,847 words" |
| Cost | "$2.45" |
| Validation | ✓ Valid / ⚠ Warnings / ✗ Invalid |
| Updated | "2 hours ago" |
| Actions | 👁 View, ✓ Approve, ✗ Reject |

**Article Drawer (Right Side):**

Opens when clicking article title or View button

**Sections:**
1. **Header:**
   - Title (editable)
   - Status chip
   - SLA countdown (large, prominent)
   - Quick actions: Approve, Reject, Send to Draft

2. **Preview Tab:**
   - Rich HTML preview
   - Featured image
   - Meta title/description preview
   - Word count, reading time

3. **Edit Tab:**
   - Rich text editor (TipTap or similar)
   - Edit content inline
   - Save changes

4. **SEO Tab:**
   - Target keywords (chips)
   - Meta title (with character count)
   - Meta description (with character count)
   - Slug (editable)
   - Internal links (with suggestions)
   - Readability score

5. **Feedback Tab:**
   - Comment thread (like Google Docs)
   - Rewrite section (provide instructions)
   - Regenerate button (with/without keeping outline)
   - Feedback history

6. **Details Tab:**
   - Models used (Grok → Perplexity)
   - Generation cost breakdown
   - Source (topic question or trend)
   - Created/Updated timestamps
   - Validation errors (if any)
   - Citations (from Perplexity)

**Actions:**

```javascript
// Approve → Publish to WordPress
async function approveArticle(articleId) {
  // 1. Validate
  const validation = await validateArticle(articleId);
  if (!validation.valid) {
    toast.error('Cannot approve: validation errors');
    return;
  }

  // 2. Update status
  await Articles.update(articleId, { status: 'approved' });

  // 3. Publish to WordPress (async)
  await publishToWordPress(articleId);

  // 4. Record feedback
  await Feedback.create({
    article_id: articleId,
    type: 'approve',
    payload: { timestamp: new Date() }
  });

  toast.success('Article approved and published!');
}

// Rewrite with instructions
async function requestRewrite(articleId, instructions) {
  // 1. Record feedback
  await Feedback.create({
    article_id: articleId,
    type: 'rewrite',
    payload: { instructions, used_for_training: true }
  });

  // 2. Regenerate with feedback
  const article = await Articles.findOne({ id: articleId });
  const newContent = await generateArticle(
    article.topic_question_text,
    `Previous feedback: ${instructions}`
  );

  // 3. Update article
  await Articles.update(articleId, {
    body: newContent.content,
    status: 'draft'
  });

  toast.success('Article regenerated with feedback');
}

// Regenerate (full)
async function regenerateArticle(articleId, keepOutline = false) {
  // Similar to rewrite, but without specific instructions
}
```

#### 2. TOPICS & QUESTIONS

**Layout:** List of questions with search/filter

**Features:**
- Month selector (view questions from specific month)
- Source filter (monthly / weekly / daily_trend / manual)
- Priority tags
- Search questions
- "Create Article" button per question
- Batch operations

**Question Card:**
```
┌─────────────────────────────────────────────────────────┐
│ 🎯 Priority: High                   Source: Monthly Ingest │
│ Discovered: Nov 12, 2025                    Not Used Yet │
├─────────────────────────────────────────────────────────┤
│ What's the difference between college and university?   │
│                                                          │
│ Keywords: college, university, higher education          │
│                                                          │
│ [Create Article]  [Edit]  [Archive]                     │
└─────────────────────────────────────────────────────────┘
```

**Create Article Flow:**
1. Click "Create Article" on question
2. (Optional) Show brief options dialog:
   - Angle/perspective (default: neutral)
   - Word count target (default: 1500-2500)
   - Include images (default: yes)
3. Start generation (Grok → Perplexity pipeline)
4. Show progress: "Generating draft..." → "Verifying facts..."
5. Complete → Article added to Approval Queue

**Monthly Ingest Process:**
```javascript
// Automated job (runs 1st of each month)
async function ingestMonthlyQuestions() {
  // 1. Query Perplexity for top questions
  const prompt = `
What are the top 50 questions people are asking about college degrees,
higher education, and online learning in [current month/year]?

Format as JSON array: [{ question, search_volume, keywords }]
  `;

  const result = await invokePerplexity({ prompt });

  // 2. Parse and insert
  const questions = JSON.parse(result.content);
  for (const q of questions) {
    await TopicQuestions.create({
      question_text: q.question,
      source: 'monthly',
      keywords_extracted: q.keywords,
      search_volume: q.search_volume,
      priority: calculatePriority(q.search_volume)
    });
  }

  console.log(`Ingested ${questions.length} questions`);
}
```

#### 3. SETTINGS (Simplified)

**Tabs:**

**A. Automation**
```
┌─────────────────────────────────────────────────────────┐
│ Posting Schedule                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Frequency:   [Daily ▼]                              │ │
│ │ Post Time:   [05:00] MT                             │ │
│ │ Timezone:    [America/Denver ▼]                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Approval Settings                                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ☑ Require approval before publishing                │ │
│ │ Auto-approve after: [5] days                        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Status: ● Enabled                                        │
│ [Save Changes]                                          │
└─────────────────────────────────────────────────────────┘
```

**B. WordPress Integration**
```
┌─────────────────────────────────────────────────────────┐
│ WordPress Connection                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Site URL:     [https://geteducated.com            ] │ │
│ │ Username:     [admin                              ] │ │
│ │ App Password: [••••••••••••••••••••               ] │ │
│ │                                                     │ │
│ │ Status: ✓ Connected (last checked: 5 min ago)     │ │
│ │ [Test Connection]                                   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Publishing Defaults                                      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Default Category: [Blog ▼]                          │ │
│ │ Default Tags:     [higher-ed, college, online]      │ │
│ │ Default Author:   [Editor ▼]                        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [Save Changes]                                          │
└─────────────────────────────────────────────────────────┘
```

**C. Models Configuration**
```
┌─────────────────────────────────────────────────────────┐
│ Content Generation Pipeline                              │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Stage 1 (Generate):  [Grok 2 ▼]                    │ │
│ │ Temperature:         [0.8                          ] │ │
│ │ Max Tokens:          [4000                         ] │ │
│ │                                                     │ │
│ │ Stage 2 (Verify):    [Perplexity 70B Online ▼]    │ │
│ │ ☑ Enable fact-checking pass                        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Cost Monitoring                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Target: < $10/article                               │ │
│ │ Current Avg: $2.45/article                          │ │
│ │ ☑ Alert if cost exceeds $15                         │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [Save Changes]                                          │
└─────────────────────────────────────────────────────────┘
```

**D. Image Generation**
```
┌─────────────────────────────────────────────────────────┐
│ Featured Images                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ☑ Generate featured image for each article         │ │
│ │ Model: [Gemini 2.5 Flash ▼]                        │ │
│ │ Aspect Ratio: [16:9 ▼]                             │ │
│ │ Style: [Professional, educational                  ] │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [Save Changes]                                          │
└─────────────────────────────────────────────────────────┘
```

---

## CONTENT GENERATION PIPELINE

### End-to-End Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PERDIA V2 CONTENT PIPELINE                        │
└─────────────────────────────────────────────────────────────────────┘

1. TOPIC SELECTION
   ├─ Monthly Questions Ingest (1st of month)
   │  └─ Perplexity: "Top 50 questions about higher ed"
   ├─ Daily Trend Sweep (Optional, 5am)
   │  └─ Grok: "What's trending on X about colleges today?"
   └─ Manual Topic Entry

2. GENERATION (STAGE 1: GROK)
   ├─ Input: Topic question + user instructions
   ├─ Prompt Engineering:
   │  ├─ Answer the question directly
   │  ├─ Natural, conversational tone
   │  ├─ Vary sentence structure
   │  ├─ 1500-2500 words
   │  ├─ Use narrative elements
   │  ├─ Include [CITATION NEEDED] tags
   │  └─ Suggest 2-4 internal links
   ├─ Model: grok-2 (temperature: 0.8)
   └─ Output: Draft article (HTML)

3. VERIFICATION (STAGE 2: PERPLEXITY)
   ├─ Input: Draft article
   ├─ Tasks:
   │  ├─ Fact-check claims
   │  ├─ Verify statistics
   │  ├─ Find reliable citations
   │  ├─ Check for outdated info
   │  └─ Score accuracy (0-100)
   ├─ Model: pplx-70b-online
   └─ Output: Citations + accuracy score

4. MERGE & ENHANCE
   ├─ Replace [CITATION NEEDED] with real citations
   ├─ Add verification notes (HTML comment)
   ├─ Generate meta title/description
   ├─ Extract target keywords
   └─ Calculate total cost

5. IMAGE GENERATION
   ├─ Extract article theme
   ├─ Generate prompt for image
   ├─ Model: gemini-2.5-flash-image
   └─ Upload to Supabase Storage

6. QUOTE SOURCING (Optional)
   ├─ Search Reddit for relevant threads
   ├─ Search Twitter/X for opinions
   ├─ Extract quotes with attribution
   └─ Store in quotes table

7. VALIDATION
   ├─ Check required fields (title, body, meta)
   ├─ Validate internal links
   ├─ Check word count (min 1000)
   ├─ Verify shortcodes (GetEducated.com requirement)
   └─ Status: Valid / Invalid / Warnings

8. APPROVAL QUEUE
   ├─ Status: pending_review
   ├─ Set pending_since = NOW()
   ├─ Set auto_approve_at = NOW() + 5 days
   └─ Await human action

9. HUMAN REVIEW
   ├─ Actions:
   │  ├─ Approve → Publish to WordPress
   │  ├─ Reject → Archive
   │  ├─ Rewrite → Regenerate with feedback
   │  └─ Comment → Add to feedback loop
   └─ Auto-Approve (if 5 days elapsed)

10. PUBLISH TO WORDPRESS
    ├─ Upload featured image
    ├─ Create/update post
    ├─ Set categories/tags
    ├─ Set status: publish
    └─ Update article: status = published, wp_post_id, wp_url

11. FEEDBACK LOOP
    ├─ Store all comments/rewrites
    ├─ Flag for training (used_for_training = true)
    └─ Feed back to future prompts
```

### Prompt Engineering Best Practices

**Grok System Prompt (Blog Writer):**

```
You are a professional blog writer for GetEducated.com, a leading source of
information about higher education, college degrees, and online learning.

WRITING STYLE:
- Natural, conversational tone (like talking to a friend)
- Vary sentence length: mix short punchy sentences with longer, flowing ones
- Use occasional colloquialisms and relatable examples
- Include narrative elements (stories, scenarios) when appropriate
- Avoid overly perfect or robotic language
- Break patterns: don't follow the same structure every time

CONTENT STRUCTURE:
- Start with a clear introduction that addresses the question
- Use H2 and H3 headings to organize sections
- Include bullet points and numbered lists where helpful
- Add a brief conclusion or call-to-action
- Aim for 1500-2500 words

SEO & CITATIONS:
- Naturally incorporate relevant keywords (don't stuff)
- Use [CITATION NEEDED] tags where data or claims require sources
- Suggest 2-4 internal links to related GetEducated.com pages using format:
  <a href="/related-page">anchor text</a>
- Include at least one real-world example or case study

AVOID:
- Perfect grammar every time (occasional minor variations are human)
- Repetitive sentence structures
- Overused transitions ("Moreover", "Furthermore", "In conclusion")
- Overly formal academic language
- AI-sounding phrases like "It's important to note that..."

Your goal is to create content that is helpful, engaging, and passes as
human-written while maintaining high quality and accuracy.
```

**Perplexity Verification Prompt:**

```
You are a fact-checking assistant. Review the following article for accuracy.

TASKS:
1. Identify all factual claims that require verification
2. Find reliable sources (preferably .edu, .gov, or reputable news)
3. Check if statistics are current (flag anything older than 2 years)
4. Suggest citations with URLs for claims marked [CITATION NEEDED]
5. Flag any outdated or incorrect information

OUTPUT FORMAT (JSON):
{
  "accuracy_score": 85,
  "verified_claims": [
    { "claim": "...", "status": "verified", "source_url": "..." }
  ],
  "issues": [
    { "claim": "...", "issue": "outdated", "suggestion": "..." }
  ],
  "citations": [
    { "text": "citation text", "url": "https://..." }
  ]
}

Article to verify:
[ARTICLE CONTENT]
```

---

## IMPLEMENTATION ROADMAP

### Sprint 0: Foundations (Week 1)

**Goal:** Set up infrastructure for V2

**Tasks:**

1. **Database Migration**
   - [ ] Create new tables (`articles`, `topic_questions`, `feedback`, `quotes`, `automation_schedule`)
   - [ ] Write migration script: `content_queue` → `articles`
   - [ ] Add triggers for `auto_approve_at`
   - [ ] Test RLS policies

2. **API Integrations**
   - [ ] Set up Grok API access (xAI account)
   - [ ] Create `invoke-grok` Edge Function
   - [ ] Set up Perplexity API access
   - [ ] Create `invoke-perplexity` Edge Function
   - [ ] Test both APIs with sample prompts

3. **WordPress Plugin/MCP Research**
   - [ ] Research WordPress MCP options
   - [ ] Test plugin-based connection
   - [ ] Document setup process
   - [ ] Implement fallback to REST API if needed

4. **Cost Tracking**
   - [ ] Implement token usage tracking
   - [ ] Add cost calculation functions
   - [ ] Display cost in UI

**Deliverables:**
- New database tables live
- Grok & Perplexity APIs working
- WordPress connection tested
- Cost tracking functional

**Time Estimate:** 5-7 days

---

### Sprint 1: Approval Core (Weeks 2-3)

**Goal:** Build the primary Approval Queue screen

**Tasks:**

1. **Approval Queue UI**
   - [ ] Create new `ApprovalQueue.jsx` (simplified)
   - [ ] Table view with SLA timer
   - [ ] Status badges and validation indicators
   - [ ] Search and filter functionality
   - [ ] Bulk operations

2. **Article Drawer**
   - [ ] Right-side drawer component
   - [ ] Preview tab (rich HTML rendering)
   - [ ] Edit tab (inline editor)
   - [ ] SEO tab (keywords, meta, slug)
   - [ ] Feedback tab (comments, rewrite, regenerate)
   - [ ] Details tab (costs, models, validation)

3. **Actions Implementation**
   - [ ] Approve → Publish to WordPress
   - [ ] Reject → Archive
   - [ ] Rewrite (with instructions input)
   - [ ] Regenerate (with/without outline preservation)
   - [ ] Comment (Google Docs-style)

4. **Auto-Approve Job**
   - [ ] Create cron job (runs every hour)
   - [ ] Query articles where `auto_approve_at < NOW()`
   - [ ] Validate before auto-approving
   - [ ] Publish to WordPress
   - [ ] Send notification

5. **Publishing to WordPress**
   - [ ] Test REST API publishing
   - [ ] Handle featured images
   - [ ] Set categories/tags
   - [ ] Update article record with WP post ID

**Deliverables:**
- Fully functional Approval Queue
- Article drawer with all tabs
- Auto-approve job running
- WordPress publishing working

**Time Estimate:** 10-14 days

---

### Sprint 2: Topics & Pipeline (Weeks 3-4)

**Goal:** Implement question-first strategy and two-stage pipeline

**Tasks:**

1. **Topics & Questions UI**
   - [ ] Create `TopicQuestionsManager.jsx`
   - [ ] List view with month selector
   - [ ] Search and filter
   - [ ] "Create Article" button
   - [ ] Question card design

2. **Monthly Ingest Job**
   - [ ] Create cron job (runs 1st of month)
   - [ ] Perplexity query for top questions
   - [ ] Parse and insert into `topic_questions`
   - [ ] Extract keywords
   - [ ] Calculate priority

3. **Daily Trend Sweep (Optional)**
   - [ ] Create cron job (runs at 5am)
   - [ ] Grok query for X/Twitter trends
   - [ ] Insert trending topics
   - [ ] Flag as `source: 'daily_trend'`

4. **Two-Stage Generation Pipeline**
   - [ ] Create `content-pipeline.js`
   - [ ] Stage 1: Grok generates draft
   - [ ] Stage 2: Perplexity verifies
   - [ ] Merge citations into draft
   - [ ] Save article with both model references

5. **Image Generation**
   - [ ] Extract article theme
   - [ ] Generate image prompt
   - [ ] Call Gemini 2.5 Flash Image
   - [ ] Upload to Supabase Storage
   - [ ] Set as featured image

6. **Quote Sourcing (Optional)**
   - [ ] Reddit API integration
   - [ ] Twitter/X API integration (if available)
   - [ ] Extract quotes with attribution
   - [ ] Store in `quotes` table
   - [ ] Display in article

**Deliverables:**
- Topics & Questions page functional
- Monthly ingest job running
- Two-stage pipeline working
- Image generation integrated
- Quote sourcing (if time permits)

**Time Estimate:** 10-14 days

---

### Sprint 3: Polish & Handoff (Week 5)

**Goal:** Finalize settings, documentation, and observability

**Tasks:**

1. **Settings Page**
   - [ ] Create simplified `Settings.jsx`
   - [ ] Automation tab (frequency, time)
   - [ ] WordPress Integration tab
   - [ ] Models Configuration tab
   - [ ] Image Generation tab

2. **Internal Linking Documentation**
   - [ ] Document existing internal linking process
   - [ ] Create guide for editors
   - [ ] Add AI prompts for suggesting links

3. **Feedback Loop Enhancement**
   - [ ] Store all comments/rewrites in `feedback` table
   - [ ] Flag feedback for training (`used_for_training`)
   - [ ] Create mechanism to feed back to prompts
   - [ ] Track improvement over time

4. **Observability & Logging**
   - [ ] Create event log (generated, verified, approved, published)
   - [ ] Cost tracking dashboard
   - [ ] Error tracking and alerting
   - [ ] Performance metrics (time to generate, approval time)

5. **Testing & Bug Fixes**
   - [ ] End-to-end testing of full pipeline
   - [ ] Test edge cases (validation failures, API errors)
   - [ ] Fix bugs identified during testing
   - [ ] Performance optimization

6. **Documentation**
   - [ ] User guide for editors
   - [ ] Technical documentation
   - [ ] API integration guide
   - [ ] Troubleshooting guide

7. **Training & Handoff**
   - [ ] Train Sarah (primary reviewer)
   - [ ] Walkthrough of approval workflow
   - [ ] Explain feedback system
   - [ ] Monitor first 50 articles together

**Deliverables:**
- Settings page complete
- Internal linking documented
- Feedback loop functional
- Observability in place
- Documentation complete
- Client approval for scale-up

**Time Estimate:** 7-10 days

---

## RISKS & MITIGATION

### Technical Risks

#### 1. **Grok API Access & Stability**

**Risk:** Grok is relatively new; API may have limits or instability

**Mitigation:**
- Implement robust error handling and retry logic
- Keep Claude as fallback (already integrated)
- Monitor API status and rate limits closely
- Start with small batch testing before full deployment

#### 2. **Cost Overruns**

**Risk:** Two-model pipeline may exceed $10/article target

**Mitigation:**
- Track costs in real-time
- Alert if article exceeds threshold
- Optimize prompt length (use caching where possible)
- Consider Grok 2 Mini for cost-sensitive tasks
- Monitor average cost per week

#### 3. **Perplexity Fact-Check Accuracy**

**Risk:** Perplexity may not catch all inaccuracies or provide wrong citations

**Mitigation:**
- Human review is mandatory (not fully automated)
- Clearly label Perplexity results as "suggested citations"
- Implement confidence scoring
- Allow editors to override/correct

#### 4. **Auto-Approve Publishing Errors**

**Risk:** Auto-approve may publish low-quality or invalid content

**Mitigation:**
- Run validation before auto-approve
- Require passing validation score (e.g., >70)
- Send notification before auto-publishing (24h warning)
- Allow editors to "pause" auto-approve on specific articles
- Monitor quality of auto-approved articles closely in first month

#### 5. **WordPress Connection Failures**

**Risk:** Plugin/REST API may fail, blocking publishing

**Mitigation:**
- Implement retry logic (3 attempts with exponential backoff)
- Queue failed publishes for manual retry
- Alert on repeated failures
- Test connection daily (automated health check)

### Business Risks

#### 6. **Client Expectations Mismatch**

**Risk:** Client expects features not in MVP scope

**Mitigation:**
- Clear MVP definition document (this plan)
- Weekly check-ins with stakeholders
- Prioritize "must-haves" vs. "nice-to-haves"
- Demonstrate progress incrementally

#### 7. **Training Sarah (Primary Reviewer)**

**Risk:** Sarah may not adopt new workflow quickly

**Mitigation:**
- Provide comprehensive training
- Create video walkthroughs
- Offer 1-on-1 support during first 2 weeks
- Gather feedback and iterate on UX

#### 8. **Scale-Up Challenges**

**Risk:** System may not handle 100+ articles/week

**Mitigation:**
- Load testing before scale-up
- Monitor Supabase performance (RLS policies, indexes)
- Optimize queries (use `EXPLAIN ANALYZE`)
- Consider Supabase Pro tier if needed
- Implement rate limiting on AI APIs

### Data Risks

#### 9. **Data Migration Errors**

**Risk:** Migration from `content_queue` to `articles` may lose data

**Mitigation:**
- Test migration on staging database first
- Keep `content_queue` table (don't drop immediately)
- Verify record counts match
- Implement rollback plan

#### 10. **Quote Sourcing Legality**

**Risk:** Using quotes without permission may violate terms

**Mitigation:**
- Research fair use guidelines
- Attribute all quotes properly
- Link to original sources
- Consider adding "used with permission" notes
- Consult legal if uncertain

---

## SUCCESS CRITERIA

### MVP Launch Criteria

**Must be complete before launching:**

1. **Approval Queue:**
   - ✅ Displays all articles with SLA timer
   - ✅ Quick actions work (approve, reject)
   - ✅ Article drawer opens with all tabs
   - ✅ Auto-approve job runs correctly

2. **Two-Stage Pipeline:**
   - ✅ Grok generates drafts successfully
   - ✅ Perplexity verifies and adds citations
   - ✅ Cost tracking works (<$10/article average)

3. **WordPress Publishing:**
   - ✅ Articles publish correctly
   - ✅ Featured images upload
   - ✅ Categories/tags set properly
   - ✅ URL returned and stored

4. **Topics & Questions:**
   - ✅ Monthly ingest job runs
   - ✅ Questions displayed in UI
   - ✅ "Create Article" button works

5. **Settings:**
   - ✅ Automation settings save/load
   - ✅ WordPress connection tests successfully
   - ✅ Model configuration saves

### Performance Metrics (First 30 Days)

**Measure success by:**

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Time to Publish** | < 10 min from generation to approval | Track timestamps |
| **Cost per Article** | < $10 average | Sum model costs |
| **Approval Rate** | > 80% approved (not rejected) | Count approved vs rejected |
| **Auto-Approve Rate** | < 20% (most reviewed manually) | Count auto-approved |
| **Validation Pass Rate** | > 90% valid on first attempt | Check validation_status |
| **WordPress Publish Success** | > 95% (few errors) | Monitor publish failures |
| **User Satisfaction** | Positive feedback from Sarah | Survey + interviews |

### Quality Metrics

**Monitor content quality:**

- **Readability Score:** Target 60-80 (Flesch Reading Ease)
- **Word Count:** 1500-2500 words average
- **Citation Count:** At least 3 citations per article
- **Internal Links:** 2-4 per article
- **AI Detection:** <30% AI probability (use Originality.ai or similar)

### Scale-Up Readiness

**Before increasing to 100+ articles/week:**

1. ✅ First 50 articles published successfully
2. ✅ Zero critical bugs in 2 weeks
3. ✅ Sarah trained and comfortable with workflow
4. ✅ Average cost < $10/article maintained
5. ✅ Client approval granted
6. ✅ System performance stable (no slowdowns)

---

## NEXT STEPS

### Immediate Actions (This Week)

1. **Client Approval:**
   - [ ] Review this plan with client
   - [ ] Get sign-off on scope and timeline
   - [ ] Clarify any open questions

2. **Team Alignment:**
   - [ ] Share plan with development team
   - [ ] Assign sprint owners
   - [ ] Set up weekly check-ins

3. **Environment Setup:**
   - [ ] Create Grok API account
   - [ ] Create Perplexity API account
   - [ ] Set up staging environment for testing
   - [ ] Configure Supabase Edge Functions

4. **Sprint 0 Kickoff:**
   - [ ] Start database migration
   - [ ] Begin API integration work
   - [ ] Research WordPress plugin options

### Weekly Milestones

**Week 1 (Sprint 0):**
- Database migration complete
- Grok & Perplexity APIs working
- WordPress connection tested

**Week 2 (Sprint 1):**
- Approval Queue UI functional
- Article drawer complete
- Auto-approve job running

**Week 3 (Sprint 1 cont.):**
- WordPress publishing working
- Feedback system in place
- Sprint 1 demo to client

**Week 4 (Sprint 2):**
- Topics & Questions page live
- Two-stage pipeline functional
- Monthly ingest job running

**Week 5 (Sprint 3):**
- Settings page complete
- Documentation finished
- Training Sarah
- Client approval for scale-up

---

## APPENDIX

### A. Detailed Cost Estimates

**AI API Costs (Estimated):**

| Model | Cost per Article | Usage |
|-------|------------------|-------|
| Grok 2 (generate) | ~$1.50 | 3000 output tokens |
| Perplexity 70B (verify) | ~$0.50 | 1000 tokens |
| Gemini 2.5 Flash (image) | ~$0.10 | 1 image |
| **Total** | **~$2.10** | **Per article** |

**Infrastructure Costs:**

| Service | Monthly Cost |
|---------|--------------|
| Supabase Pro | $25 |
| Netlify Pro | $19 (frontend hosting) |
| **Total** | **$44/month** |

**Cost at Scale (100 articles/week):**

- AI costs: 100 articles × $2.10 = $210/week = ~$840/month
- Infrastructure: $44/month
- **Total: ~$884/month** (well under client budget)

### B. WordPress MCP Plugin Options

**Option 1: WordPress MCP Server**
- Plugin: `wordpress-mcp-server`
- Repo: https://github.com/example/wordpress-mcp
- Pros: Direct API access, better security
- Cons: Requires WordPress plugin installation

**Option 2: REST API (Fallback)**
- Use existing `wordpress-client.js`
- Pros: Already implemented, no plugin needed
- Cons: Less reliable, needs saved credentials

**Recommendation:** Start with REST API (already working), explore MCP plugin if issues arise

### C. Internal Linking Best Practices

**From Meeting Transcript:**

> "I can document it all." (Internal linking process already working)

**Rules to Document:**

1. **Anchor Text Variety:**
   - Use natural, descriptive anchor text
   - Avoid exact-match keywords every time
   - Mix branded, generic, and keyword-rich anchors

2. **Link Count:**
   - 2-4 internal links per article
   - At least 1 link to cornerstone content
   - 1-2 links to related blog posts

3. **Link Placement:**
   - Within first 500 words (at least 1)
   - Natural flow (not forced)
   - Relevant to context

4. **Shortcodes (MANDATORY for GetEducated.com):**
   - Internal: `[ge_internal_link url="..."]text[/ge_internal_link]`
   - Affiliate: `[ge_affiliate_link url="..."]text[/ge_affiliate_link]`
   - External: `[ge_external_link url="..."]text[/ge_external_link]`

5. **AI Prompt Addition:**
   - Include in system prompt: "Suggest 2-4 internal links using GetEducated.com shortcodes"

### D. AI Detection Avoidance Strategies

**From Meeting Transcript:**

> "What I was reading is that the way that the AI detectors in Google are detecting AI is by how flawless the articles are."

> "Maybe we just see if we can cut Perplexity [Frizzly] in. Getting Grok in the first place. Is it going to be good for the humanization aspect?"

**Strategies:**

1. **Stylistic Variation (Grok):**
   - Vary sentence length (short + long)
   - Use colloquialisms
   - Add narrative elements
   - Occasional minor grammar variations
   - Break repetitive patterns

2. **Longer, More Verbose Content:**
   - Target 1500-2500 words (not 800-1000)
   - Add more examples and stories
   - Expand on topics naturally

3. **Frizzly or Similar (Optional):**
   - Post-process articles to add variation
   - "Humanize" the text without adding errors
   - Note: Client mentioned they use this manually

4. **Real Quotes:**
   - Include quotes from Reddit, Twitter, forums
   - Adds authentic human voice
   - 60%+ real quotes (not AI-generated)

5. **Avoid AI-Sounding Phrases:**
   - Remove: "It's important to note that..."
   - Remove: "Moreover", "Furthermore" (overused)
   - Remove: Overly formal academic language

---

## CONCLUSION

This plan transforms Perdia from a complex 9-agent platform into a **focused, high-quality blog-writing system**. By simplifying the architecture, improving the AI pipeline, and streamlining the UX, we deliver exactly what the client needs: a reliable, scalable blog automation tool for GetEducated.com.

**Key Takeaways:**

1. **Simplicity wins:** 3 screens instead of 15
2. **Questions-first:** Monthly ingest of real user questions
3. **Two-model pipeline:** Grok (generate) → Perplexity (verify)
4. **5-day SLA:** Auto-approve ensures content ships
5. **Human-in-the-loop:** Feedback improves future outputs
6. **Cost-effective:** ~$2/article, well under $10 target

**Timeline:** 4-5 weeks to MVP launch

**Next Step:** Get client approval and start Sprint 0

---

**Document Version:** 1.0
**Last Updated:** 2025-11-12
**Author:** Perdia Development Team
**Status:** Awaiting Client Approval
