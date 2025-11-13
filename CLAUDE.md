# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Perdia Education** is an AI-powered SEO content automation platform designed to double-triple organic traffic for GetEducated.com. The platform was migrated from Base44 to a custom Supabase implementation.

**Key Capabilities:**
- **Two-Stage AI Content Pipeline:** Grok-2 (human-like generation) → Perplexity Sonar Pro (fact-checking & citations)
- **Zero-Typing Article Wizard:** Click-through UX with AI-powered suggestions from 4 sources
- **Smart Content Suggestions:** Auto-aggregates trending questions, high-priority keywords, topic clusters, and trending news
- Keyword management supporting 1000s of keywords
- Content workflow (draft → approve → publish)
- WordPress integration for automated publishing
- Performance tracking via Google Search Console
- Team collaboration with chat

**Scale Target:** From 6-8 pages/day manual → 100+ articles/week automated

**Important:** This is a separate project from Disruptors AI Marketing Hub with its own Supabase database.

## Technology Stack

- **Frontend:** React 18.2 + Vite 6.1 + TailwindCSS 3.4
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **AI Content Generation:**
  - **Stage 1:** Grok-2 (xAI) - Human-like article generation with natural variation
  - **Stage 2:** Perplexity Sonar Pro - Fact-checking, citations, and source verification
  - **Supporting:** Claude Sonnet 4.5 (SEO metadata), Claude Haiku 4.5 (titles), Gemini 2.5 Flash (images)
- **Deployment:** Netlify (Frontend) + Supabase (Backend & AI - 400s timeout)
- **Components:** Radix UI, Recharts, Framer Motion
- **Routing:** React Router v7

## Current Implementation State (Nov 2025)

**CRITICAL: Platform is 75% complete, not starting from zero.**

### ✅ What's Already Built (Production-Ready):

1. **WordPress Integration** - **75% Complete**
   - Full REST API client (`src/lib/wordpress-client.js` - 452 lines)
   - Featured image upload, categories/tags support
   - Retry logic and error handling
   - **Missing:** Direct database access, shortcode system (25%)

2. **Keyword Management** - **90% Complete**
   - CSV import/export fully functional (`KeywordManager.jsx` lines 111-157)
   - Auto-header detection, bulk operations
   - **Missing:** Keyword rotation algorithm (10%)

3. **Automation Backend** - **85% Complete**
   - Cron jobs configured (`20251107000003_setup_cron_jobs.sql`)
   - Edge Functions: `auto-schedule-content`, `publish-scheduled-content`
   - **Missing:** Frontend UI controls (15%)

4. **Content Queue & Approval** - **95% Complete**
   - Full ApprovalQueue.jsx with status workflow
   - **Missing:** 5-day SLA auto-publish timer (5%)

5. **Image Generation** - **100% Compliant**
   - Correctly uses Gemini 2.5 Flash Image + gpt-image-1 (no DALL-E 3)
   - Follows HARD RULES exactly

### 🚧 What Needs to Be Built (4-Week MVP):

**Sprint 1 (Week 1):**
- WordPress database connection (hybrid REST API + direct DB)
- Shortcode transformation system (MANDATORY per client)
- Pre-publish validator
- 5-day SLA auto-publish workflow

**Sprint 2 (Week 2):**
- Quote scraping (Reddit, Twitter, GetEducated forums)
- Cost monitoring middleware (<$10/article target)
- Keyword rotation algorithm

**Sprint 3 (Week 3):**
- Integration testing
- Sarah training (primary reviewer)
- Bug fixes

**Sprint 4 (Week 4):**
- Production deployment
- Monitor first 50 articles
- Client approval for scale-up

### 📖 New Documentation (Nov 2025):

**📁 Folder:** `docs/production-ready-plan/` - All new implementation docs organized here

- **`docs/production-ready-plan/README.md`** - Folder overview & quick start guide
- **`docs/production-ready-plan/PERDIA_PRD_CORRECTED.md`** - Master PRD with accurate implementation state
- **`docs/production-ready-plan/IMPLEMENTATION_GUIDE.md`** - Step-by-step developer guide (4-week sprints)
- **`docs/production-ready-plan/TECHNICAL_SPECS.md`** - WordPress integration, shortcodes, quotes, workflow, cost monitoring, DB access, testing

### 🔴 MANDATORY Client Requirements (Validated via Transcript):

1. **Shortcodes** - All links MUST use GetEducated.com shortcodes (monetization tracking)
   - Internal: `[ge_internal_link url="..."]text[/ge_internal_link]`
   - Affiliate: `[ge_affiliate_link url="..."]text[/ge_affiliate_link]`
   - External: `[ge_external_link url="..."]text[/ge_external_link]`

2. **5-Day SLA Auto-Publish** - Articles auto-publish if not reviewed within 5 days (validation must pass)

3. **Real Quote Sourcing** - Scrape Reddit, Twitter/X, GetEducated forums (60%+ real quotes, not fictional)

4. **WordPress Database Access** - Direct MySQL connection for complex queries (in addition to REST API)

5. **Cost Monitoring** - Track AI spend per article (target: <$10/article)

**See `docs/production-ready-plan/` folder for all implementation documentation:**
- **Complete requirements:** `PERDIA_PRD_CORRECTED.md`
- **Sprint-by-sprint plan:** `IMPLEMENTATION_GUIDE.md`
- **Technical specifications:** `TECHNICAL_SPECS.md`
- **Quick start:** `README.md`

## Project-Specific Agents

This project includes a **specialized Supabase Database Agent** that automatically assists with all database operations.

**Perdia Supabase Database Agent** - Automatically activates when:
- Database keywords detected (database, supabase, table, schema, migration, etc.)
- Storage operations mentioned (bucket, upload, file storage)
- Auth operations needed (authentication, RLS, policies)
- Performance issues reported (slow query, optimize, index)
- Database errors encountered (403, permission denied, query failed)

**What it knows:**
- Complete Perdia schema (16 tables, 4 storage buckets)
- Base44-compatible SDK architecture
- RLS policy patterns
- Migration procedures
- Performance optimization strategies
- All Supabase capabilities

**What it does:**
- Creates tables following project patterns
- Adds/modifies indexes for performance
- Manages RLS policies
- Integrates with SDK automatically
- Suggests Supabase features proactively
- Maintains documentation
- Uses Supabase MCP server automatically

**Documentation:**
- Full Spec: `.claude/agents/perdia-supabase-database-agent.md`
- Quick Reference: `docs/SUPABASE_AGENT_QUICK_REFERENCE.md`

**Example Usage:**
```
"Add a table for tracking user subscriptions"
"Why is this query slow?"
"Set up storage for PDF uploads"
"Optimize the keywords query"
```

The agent will automatically provide complete migrations, SDK updates, and documentation.

## Perdia Infrastructure Agent

This project includes a **specialized Infrastructure Management Agent** that automatically manages all MCP server operations for deployment, database, image optimization, SEO research, and testing.

**Perdia Infrastructure Agent** - Automatically activates when:
- Deployment keywords detected (deploy, build, production, environment variables)
- Database operations needed (via Supabase MCP)
- Image operations mentioned (optimize, cloudinary, media)
- SEO research requested (keyword research, search volume, SERP)
- Testing & debugging needed (playwright, screenshot, browser automation)
- Infrastructure errors encountered (build failures, deployment errors)

**What it knows:**
- Complete MCP server configuration (5 servers)
- Supabase project ref and credentials
- Netlify site ID and deployment settings
- Cloudinary media optimization
- DataForSEO keyword research APIs
- Playwright browser automation

**What it does:**
- Manages deployments via Netlify MCP
- Executes database queries via Supabase MCP
- Optimizes images via Cloudinary MCP
- Researches keywords via DataForSEO MCP
- Tests deployed sites via Playwright MCP
- Monitors infrastructure health
- Handles error debugging

**MCP Servers Managed:**
1. `supabase` - Database operations, schema inspection, SQL queries
2. `netlify` - Deployment management, environment variables, builds
3. `cloudinary` - Image optimization, media asset management
4. `dataforseo` - Keyword research, SEO metrics, SERP data
5. `playwright` - Browser automation, testing, screenshots

**Documentation:**
- Full Spec: `.claude/agents/perdia-infrastructure-agent.md`
- Setup Guide: `.claude/docs/MCP_SETUP_GUIDE.md`

**Example Usage:**
```
"Deploy to production"
"Check database schema"
"Optimize blog images"
"Research keyword search volume"
"Test the deployed site"
"Debug production issue"
```

The agent will automatically use the appropriate MCP servers to complete infrastructure tasks.

## MCP Server Configuration

The Perdia project has **project-level MCP servers** configured for seamless integration with external services. These are configured in `.claude/mcp.json` and automatically available to Claude Code.

### Configured MCP Servers

#### 1. Supabase MCP Server
**Purpose:** Direct database access, schema inspection, SQL execution, storage management

**Configuration:**
```json
{
  "supabase": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-supabase@latest", "--project-ref=yvvtsfgryweqfppilkvo"],
    "env": {
      "SUPABASE_ACCESS_TOKEN": "sbp_...",
      "SUPABASE_URL": "https://yvvtsfgryweqfppilkvo.supabase.co"
    }
  }
}
```

**When to Use:**
- Checking database schema before creating tables
- Executing SQL queries for debugging
- Verifying RLS policies
- Inspecting table structure
- Analyzing query performance with EXPLAIN
- Managing storage buckets

**Usage Examples:**
```javascript
// List all tables
ListMcpResourcesTool({ server: "supabase" })

// Get specific table schema
ReadMcpResourceTool({ server: "supabase", uri: "supabase://table/keywords" })

// Execute SQL query
mcp__supabase__run_sql({ sql: "SELECT COUNT(*) FROM content_queue WHERE status = 'pending_review'" })

// Check storage buckets
ReadMcpResourceTool({ server: "supabase", uri: "supabase://storage-buckets" })
```

#### 2. Netlify MCP Server
**Purpose:** Deployment management, environment variables, build monitoring

**Configuration:**
```json
{
  "netlify": {
    "command": "npx",
    "args": ["-y", "@netlify/mcp@latest"],
    "env": {
      "NETLIFY_AUTH_TOKEN": "nfp_...",
      "NETLIFY_SITE_ID": "371d61d6-ad3d-4c13-8455-52ca33d1c0d4"
    }
  }
}
```

**When to Use:**
- Deploying to production
- Managing environment variables
- Checking build status
- Monitoring site health

#### 3. Cloudinary MCP Server
**Purpose:** Image optimization, media asset management

**Configuration:**
```json
{
  "cloudinary": {
    "command": "npx",
    "args": ["-y", "@felores/cloudinary-mcp-server@latest"],
    "env": {
      "CLOUDINARY_CLOUD_NAME": "dvcvxhzmt",
      "CLOUDINARY_API_KEY": "...",
      "CLOUDINARY_API_SECRET": "..."
    }
  }
}
```

**When to Use:**
- Optimizing images for blog posts
- Generating responsive image URLs
- Managing media assets

#### 4. DataForSEO MCP Server
**Purpose:** Keyword research, SEO metrics, SERP data

**Configuration:**
```json
{
  "dataforseo": {
    "command": "npx",
    "args": ["-y", "dataforseo-mcp-server"],
    "env": {
      "DATAFORSEO_USERNAME": "...",
      "DATAFORSEO_PASSWORD": "..."
    }
  }
}
```

**When to Use:**
- Fetching keyword search volume
- Analyzing keyword difficulty
- Getting SERP position data

#### 5. Playwright MCP Server
**Purpose:** Browser automation, testing, debugging deployed sites

**Configuration:**
```json
{
  "playwright": {
    "command": "npx",
    "args": ["-y", "@executeautomation/playwright-mcp-server"],
    "env": {
      "PLAYWRIGHT_HEADLESS": "false"
    }
  }
}
```

**When to Use:**
- Testing deployed features
- Debugging production issues
- Automated browser testing
- Screenshot capture

### MCP Best Practices for Perdia

1. **Always check database schema via MCP before creating tables**
   ```javascript
   ReadMcpResourceTool({ server: "supabase", uri: "supabase://tables" })
   ```

2. **Use MCP for SQL testing before committing migrations**
   ```javascript
   mcp__supabase__run_sql({ sql: "EXPLAIN ANALYZE SELECT ..." })
   ```

3. **Verify deployments via Netlify MCP**
   ```javascript
   // Check build status after deployment
   ```

4. **Optimize images via Cloudinary MCP**
   ```javascript
   // Generate responsive URLs
   ```

5. **Research keywords via DataForSEO MCP**
   ```javascript
   // Get real search volume data
   ```

**Documentation:**
- MCP Configuration: `.claude/mcp.json`
- MCP Setup Guide: `.claude/docs/MCP_SETUP_GUIDE.md` ⭐ **How to ensure MCP servers always work**
- Infrastructure Agent: `.claude/agents/perdia-infrastructure-agent.md`
- Database Agent: `.claude/agents/perdia-supabase-database-agent.md`
- Supabase Quick Reference: `docs/SUPABASE_AGENT_QUICK_REFERENCE.md`

## Essential Commands

### Development
```bash
npm run dev          # Start dev server on http://localhost:5173
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Database
```bash
npm run db:migrate   # Apply database migrations
npm run db:seed      # Seed agent definitions (legacy system)
npm run setup        # Complete setup: install + migrate + seed
```

### First Time Setup
```bash
npm install
cp .env.example .env.local
# Edit .env.local with Perdia Supabase credentials
npm run setup
npm run dev
```

## Core Architecture Patterns

### 1. Custom SDK Layer (Base44 Compatible)

The platform uses a **custom SDK** that maintains Base44's API while using Supabase. This is located in `src/lib/perdia-sdk.js` (790 lines).

**Key Pattern:**
```javascript
// Import entities
import { Keyword, ContentQueue, InvokeLLM } from '@/lib/perdia-sdk';

// Find records (Base44-style API)
const keywords = await Keyword.find({ list_type: 'currently_ranked' });

// Create records
const newKeyword = await Keyword.create({
  keyword: 'test',
  list_type: 'new_target'
});

// Update records
await Keyword.update(id, { status: 'completed' });

// Delete records
await Keyword.delete(id);

// Count records
const count = await Keyword.count({ status: 'queued' });

// Subscribe to realtime updates
const subscription = Keyword.subscribe((payload) => {
  console.log('Change detected:', payload);
});
```

**16 Active Entities:**
- `Keyword` - Keyword research/tracking
- `ContentQueue` - Content workflow
- `PerformanceMetric` - GSC data
- `WordPressConnection` - WordPress sites
- `AutomationSettings` - User preferences
- `PageOptimization` - Page improvements
- `BlogPost` - Blog content
- `SocialPost` - Social media
- `KnowledgeBaseDocument` - AI training docs
- `AgentFeedback` - AI response feedback
- `FileDocument` - File storage
- `ChatChannel` - Team channels
- `ChatMessage` - Team messages
- `AgentDefinition` - AI agent configs
- `AgentConversation` - AI conversations
- `AgentMessage` - Conversation messages

**All entities automatically:**
- Enforce authentication via RLS
- Auto-add `user_id` on create
- Return data with `.count` property
- Support pagination, ordering, filtering

### 2. Centralized Supabase Client

**Location:** `src/lib/supabase-client.js`

**CRITICAL:** Always import from this centralized file to prevent "Multiple GoTrueClient instances" warnings.

```javascript
// ✅ ALWAYS do this
import { supabase, supabaseAdmin, getCurrentUser } from '@/lib/supabase-client';

// ❌ NEVER do this
import { createClient } from '@supabase/supabase-js';
const myClient = createClient(url, key);
```

**Two clients available:**
- `supabase` - User operations with RLS (anon key)
- `supabaseAdmin` - Admin operations bypassing RLS (service role key)

**Auth helpers:**
- `getCurrentUser()` - Get authenticated user
- `isAuthenticated()` - Check auth status
- `signIn(email, password)` - Sign in
- `signUp(email, password, metadata)` - Sign up
- `signOut()` - Sign out

**Storage helpers:**
- `uploadFile(bucket, path, file)` - Upload to Supabase Storage
- `deleteFile(bucket, path)` - Delete file
- `getSignedUrl(bucket, path, expiresIn)` - Get signed URL
- `getPublicUrl(bucket, path)` - Get public URL

### 3. Database Schema

**Migration:** `supabase/migrations/20250104000001_perdia_complete_schema.sql`

**Schema Patterns:**
- **Primary Keys:** UUID with `uuid_generate_v4()`
- **Timestamps:** `created_date TIMESTAMPTZ DEFAULT NOW()`
- **Updates:** Auto-updating `updated_date` triggers
- **RLS:** Enabled on all tables with user isolation
- **Naming:** `lowercase_with_underscores`

**4 Storage Buckets:**
- `knowledge-base` (private) - AI training documents
- `content-images` (public) - Blog/content images
- `social-media` (public) - Social media assets
- `uploads` (private) - General file uploads

### 4. AI Integration

**Location:** `src/lib/ai-client.js` (frontend) + `supabase/functions/invoke-llm/` (backend)

Unified interface supporting both Claude and OpenAI with a single `invokeLLM()` function. AI requests are routed through **Supabase Edge Functions** with a 400-second timeout for long-form content generation.

**⚠️ CRITICAL: Current Claude Models (2025)**

**ALWAYS use these model IDs:**
- ✅ `claude-sonnet-4-5-20250929` - PRIMARY model for content generation (Sonnet 4.5)
- ✅ `claude-haiku-4-5-20251001` - Fast model for simple tasks (Haiku 4.5)
- ✅ `claude-opus-4-1-20250805` - Advanced reasoning only (Opus 4.1)

**NEVER use these deprecated models:**
- ❌ `claude-3-5-sonnet-20241022` (OLD - deprecated)
- ❌ `claude-3-opus-20240229` (OLD - deprecated)
- ❌ `claude-3-haiku-20240307` (OLD - deprecated)

**📖 See `docs/ANTHROPIC_API_GUIDE.md` for comprehensive Claude API documentation, including:**
- Model specifications and pricing
- Rate limit handling and exponential backoff
- Prompt caching strategies (90% cost savings)
- Error handling patterns
- Migration guide from old models

**⚠️ CRITICAL: Image Generation Models - HARD RULE**

**ONLY use these image models:**
- ✅ `gemini-2.5-flash-image` - Google Gemini 2.5 Flash Image (PRIMARY)
- ✅ `gpt-image-1` - OpenAI's NEW image model (FALLBACK ONLY)

**NEVER EVER use DALL-E 3:**
- ❌ `dall-e-3` - FORBIDDEN! DO NOT USE!
- ❌ `dall-e-2` - FORBIDDEN! DO NOT USE!

This is a **hard rule** throughout the entire codebase. Image generation Edge Function: `supabase/functions/generate-image/`

```javascript
import { InvokeLLM } from '@/lib/perdia-sdk';

// Use Claude Sonnet 4.5 (default/primary) - CORRECT MODEL
const response = await InvokeLLM({
  prompt: 'Write an SEO article about...',
  provider: 'claude',
  model: 'claude-sonnet-4-5-20250929',  // Use exact model ID
  temperature: 0.7,
  max_tokens: 4000
});

// Use OpenAI
const response = await InvokeLLM({
  prompt: 'Generate keywords for...',
  provider: 'openai',
  model: 'gpt-4o'
});

// Structured JSON output
const response = await InvokeLLM({
  prompt: 'Analyze this keyword...',
  response_json_schema: {
    type: 'object',
    properties: {
      search_volume: { type: 'number' },
      difficulty: { type: 'number' },
      category: { type: 'string' }
    }
  }
});
```

**Model Selection Guidelines:**
- **Full Article Generation (1500-3000 words):** Use Content Pipeline (Grok-2 → Perplexity Sonar Pro)
- **Keyword Research & Analysis:** Use Sonnet 4.5 (complex reasoning)
- **Meta Descriptions & Titles:** Use Haiku 4.5 (fast, cost-effective)
- **Content Optimization:** Use Sonnet 4.5 (detailed analysis)
- **Chat/Quick Responses:** Use Haiku 4.5 (low latency)
- **Image Generation:** Use Gemini 2.5 Flash Image (primary)

**Unified Content Generation System:**
The platform uses a **two-stage content pipeline** (`src/lib/content-pipeline.js`) instead of multiple specialized agents:

1. **Stage 1 - Draft Generation (Grok-2):**
   - Generates human-like, naturally varied content
   - Uses `[CITATION NEEDED]` tags for claims requiring sources
   - Optimized for GetEducated.com's editorial style
   - Model: `grok-2` via xAI API

2. **Stage 2 - Fact-Checking & Citations (Perplexity Sonar Pro):**
   - Verifies factual accuracy of all claims
   - Adds real citations from authoritative sources
   - Replaces `[CITATION NEEDED]` tags with actual source links
   - Provides accuracy scores and flags issues
   - Model: `sonar-pro` via Perplexity API

3. **Stage 3 - Image Generation (Gemini 2.5 Flash):**
   - Generates professional featured images
   - Optimized for blog/SEO use (1200x630)
   - Model: `gemini-2.5-flash-image` via Google AI

**Legacy Agent System:** The `agent_definitions` table and agent conversation system (`src/lib/agent-sdk.js`) remain available for future specialized tasks, but the primary content generation flow now uses the unified pipeline.

**Best Practices:**
- Always use exact model IDs (not aliases)
- Set appropriate `max_tokens` for each use case (don't default to 4000)
- Implement exponential backoff for rate limit handling (see guide)
- Use prompt caching for system prompts to reduce costs by 90%
- Monitor token usage via response.usage
- Reference `docs/ANTHROPIC_API_GUIDE.md` for detailed implementation patterns

### 5. Content Generation Pipeline

**Location:** `src/lib/content-pipeline.js` (512 lines)

The **two-stage content pipeline** is the core of Perdia's content generation system, combining Grok's creative generation with Perplexity's fact-checking.

**Pipeline Flow:**
```javascript
import { generateArticlePipeline } from '@/lib/content-pipeline';

const article = await generateArticlePipeline(topicQuestion, {
  userInstructions: 'Focus on career outcomes',
  wordCountTarget: '1500-2500',
  includeImages: true,
  runVerification: true,
  onProgress: (progress) => {
    console.log(`[${progress.stage}] ${progress.message}`);
  }
});

// Returns complete article with:
// - title, body, excerpt, featured_image_url
// - meta_title, meta_description, slug
// - target_keywords, word_count
// - validation_status, validation_errors
// - generation_cost, verification_cost
// - model_primary: 'grok-2', model_verify: 'sonar-pro'
```

**Pipeline Stages:**

1. **Analyze & Prepare** (1-2 seconds)
   - Topic analysis and target audience identification
   - Keyword research and SEO analysis
   - Article structure planning

2. **Generate Draft (Grok-2)** (60-120 seconds)
   - Human-like writing with natural variation
   - Uses `[CITATION NEEDED]` placeholders for factual claims
   - Temperature: 0.8 for creative variety
   - Cost: ~$0.01-0.03 per article

3. **Fact-Check & Verify (Perplexity Sonar Pro)** (30-60 seconds)
   - Verifies all factual claims
   - Adds real citations from authoritative sources
   - Replaces `[CITATION NEEDED]` tags with actual links
   - Provides accuracy score (0-100%)
   - Flags incorrect/outdated/unsupported claims
   - Cost: ~$0.01-0.02 per article

4. **Generate Image (Gemini 2.5 Flash)** (5-10 seconds)
   - Professional featured image (1200x630)
   - Theme-based on article content
   - Cost: ~$0.001 per image

5. **SEO Metadata Extraction**
   - Auto-generates meta title (60 chars)
   - Auto-generates meta description (155 chars)
   - Extracts target keywords
   - Creates SEO-friendly slug

6. **Validation & Quality Checks**
   - Word count validation (1500-2500 target)
   - HTML structure verification
   - Readability analysis
   - Citation completeness check

**Progress Callback:**
The `onProgress` callback provides real-time updates during generation:

```javascript
onProgress: ({ stage, message, timestamp }) => {
  // stage: 'init', 'analyze', 'research', 'structure', 'generate',
  //        'verify', 'citations', 'image', 'seo', 'validate',
  //        'quality', 'save', 'complete', 'success', 'error'
  // message: Human-readable status message
  // timestamp: Unix timestamp in milliseconds
}
```

**Regeneration with Feedback:**
```javascript
import { regenerateWithFeedback } from '@/lib/content-pipeline';

const updatedArticle = await regenerateWithFeedback(
  originalContent,
  'Make it more concise and focus on career outcomes',
  topicQuestion,
  { onProgress }
);
```

**Error Handling:**
The pipeline includes comprehensive validation:
- Word count checks (minimum 1000 words)
- Structural validation (H2 headings required)
- Accuracy score thresholds (>70%)
- Citation completeness checks

Returns `validation_status: 'valid' | 'invalid'` and `validation_errors` array.

**Cost Tracking:**
Each article tracks AI costs separately:
- `generation_cost`: Grok-2 generation cost ($0.01-0.03)
- `verification_cost`: Perplexity verification cost ($0.01-0.02)
- Total target: <$0.10 per article

### 6. Article Generation Wizard

**Location:** `src/components/wizard/ArticleGenerationWizard.jsx` (544 lines)

The **Article Generation Wizard** provides a **zero-typing, click-through UX** for content creation. Users never type - they only click to select from AI-generated options.

**Wizard Flow:**

**Step 1: Select Topic/Idea**
- Displays 20+ auto-populated suggestions from 4 sources
- Sources: Trending Questions, SEO Keywords, Topic Clusters, Trending News
- Each suggestion shows:
  - Title and description
  - Source icon and label
  - Priority badge
  - Target keywords
- Click any suggestion to proceed

**Step 2: Select Article Type**
- 5 pre-defined article types:
  1. **Ranking Article** (🏆) - "Best programs, top schools, ranked lists"
  2. **Career Guide** (💼) - "Career paths, job outlooks, salary guides"
  3. **Listicle** (📝) - "Tips, strategies, actionable lists"
  4. **Comprehensive Guide** (📚) - "In-depth educational content"
  5. **FAQ Article** (❓) - "Question-answer format, common queries"
- Click any type to proceed

**Step 3: Select Title**
- AI auto-generates 5 SEO-optimized title options
- Uses Claude Haiku 4.5 for fast generation
- Titles are:
  - 50-70 characters (optimal for SEO)
  - Include primary keyword
  - Compelling and click-worthy
  - Match selected article type
- Click any title to auto-start generation

**Step 4: Generation Progress**
- Terminal-style progress visualization
- Real-time typing animation of pipeline steps
- Shows all stages:
  - 🎯 Initializing pipeline
  - 🔍 Analyzing topic
  - 📊 Keyword research
  - 📝 Planning structure
  - ✍️ Generating with Grok-2
  - 🔬 Fact-checking with Perplexity
  - 📚 Adding citations
  - 🎨 Generating image
  - 🔍 Extracting keywords
  - ✏️ Generating SEO metadata
  - 📏 Validation checks
  - 💾 Saving to database

**Step 5: Success**
- Displays success message with article details
- Shows word count, cost, and status
- Two action buttons:
  - **View Article** - Navigate to article editor
  - **Go to Review Queue** - Navigate to approval queue

**Usage:**
```javascript
import ArticleGenerationWizard from '@/components/wizard/ArticleGenerationWizard';

function MyPage() {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setWizardOpen(true)}>
        Generate Article
      </Button>

      <ArticleGenerationWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        preSelectedTopic={null} // Optional: pre-select a topic
      />
    </>
  );
}
```

**Features:**
- **Framer Motion animations** for smooth transitions
- **Automatic progression** through steps
- **Real-time progress updates** via pipeline callback
- **Automatic suggestion marking** (marks used questions/keywords)
- **Error recovery** (returns to title selection on failure)
- **Mobile responsive** (max-w-4xl dialog)

### 7. Content Suggestion Service

**Location:** `src/lib/suggestion-service.js` (292 lines)

The **Suggestion Service** aggregates content ideas from **4 different sources** to power the Article Generation Wizard's zero-typing UX.

**4 Suggestion Sources:**

**1. Trending Questions** (`getTrendingQuestions`)
- Source: `topic_questions` table
- Filters: Only unused questions (`used_for_article_id IS NULL`)
- Sorting: By priority DESC, then search volume DESC
- Returns: Question text, search volume, extracted keywords
- Icon: ❓
- Example: "What is the best online MBA program?"

**2. High-Priority Keywords** (`getHighPriorityKeywords`)
- Source: `keywords` table
- Filters: Priority >= 3
- Sorting: By priority DESC, then search volume DESC
- Returns: Keyword, search volume, difficulty score, intent
- Icon: 🎯
- Example: "Write about: online mba programs"

**3. Active Topic Clusters** (`getActiveClusters`)
- Source: `clusters` table
- Filters: Status = 'active'
- Sorting: By priority DESC
- Returns: Cluster name, description, subtopics, article/keyword counts
- Icon: 📚
- Example: "Graduate Degree Programs"

**4. Trending News/Topics** (`getTrendingNews`)
- Source: AI-generated via Claude Sonnet 4.5
- Uses: Real-time analysis of education industry trends
- Returns: Trending topic titles, descriptions, target keywords
- Icon: 📰
- Example: "AI's Impact on Higher Education in 2025"

**API Functions:**

```javascript
import {
  getAllSuggestions,
  getSuggestionsGrouped,
  markSuggestionAsUsed
} from '@/lib/suggestion-service';

// Get combined suggestions from all sources
const suggestions = await getAllSuggestions({
  includeTrendingQuestions: true,
  includeKeywords: true,
  includeClusters: true,
  includeTrendingNews: true,
  limit: 30
});
// Returns: Array of suggestions sorted by priority

// Get suggestions grouped by source
const grouped = await getSuggestionsGrouped({
  questionsLimit: 10,
  keywordsLimit: 10,
  clustersLimit: 5,
  newsLimit: 5
});
// Returns: { questions, keywords, clusters, news, all }

// Mark a suggestion as used (tracks usage)
await markSuggestionAsUsed(suggestion, articleId);
// Updates: topic_questions.used_for_article_id and used_at
```

**Suggestion Format:**
All suggestions are normalized to a common format:

```javascript
{
  id: 'unique-id',
  type: 'question' | 'keyword' | 'cluster' | 'news',
  title: 'Suggestion title',
  description: 'Why this is relevant',
  keywords: ['keyword1', 'keyword2'],
  priority: 1-5,
  source: 'Trending Questions' | 'SEO Keywords' | 'Topic Clusters' | 'Trending News',
  sourceIcon: '❓' | '🎯' | '📚' | '📰',
  metadata: {
    // Source-specific metadata
    questionId, keywordId, clusterId, sourceUrl, etc.
  }
}
```

**Usage Tracking:**
The service automatically tracks when suggestions are used:
- Updates `topic_questions.used_for_article_id` when a question is used
- Prevents duplicate content by filtering out used questions
- Timestamps usage with `used_at` field

**AI-Powered Trending Topics:**
The `getTrendingNews` function uses Claude to identify trending topics:
- Temperature: 0.7 for creativity
- Max tokens: 2000
- Prompt optimized for GetEducated.com's audience
- Returns 5 trending topics with SEO-optimized titles

### 8. Agent Conversation System

**Location:** `src/lib/agent-sdk.js`

Custom implementation for multi-turn AI conversations (Base44's agentSDK was missing).

```javascript
import { agentSDK } from '@/lib/agent-sdk';

// List conversations
const conversations = await agentSDK.listConversations({
  agent_name: 'seo_content_writer',
  limit: 50
});

// Create conversation
const conv = await agentSDK.createConversation({
  agent_name: 'seo_content_writer',
  initial_message: 'Write an article about...'
});

// Send message in conversation
const response = await agentSDK.sendMessage({
  conversation_id: conv.id,
  message: 'Make it more concise'
});

// Get conversation with history
const fullConv = await agentSDK.getConversation({
  conversation_id: conv.id
});
```

### 9. File Upload Integration

```javascript
import { UploadFile, CreateFileSignedUrl } from '@/lib/perdia-sdk';

// Upload public file (content images)
const result = await UploadFile({
  file: fileObject,
  bucket: 'content-images',
  isPublic: true
});
// Returns: { url, path, bucket }

// Upload private file (knowledge base)
const result = await UploadFile({
  file: fileObject,
  bucket: 'knowledge-base',
  isPublic: false
});
// Returns signed URL (1 hour expiry)

// Generate signed URL for existing private file
const { url } = await CreateFileSignedUrl({
  path: 'user_id/file.pdf',
  bucket: 'uploads',
  expiresIn: 3600
});
```

### 10. UI Components & React Patterns

**Component Library:** shadcn/ui (Radix UI primitives + TailwindCSS)

**Location:** `src/components/ui/`

**Available UI Components:**
- Form controls: Button, Input, Textarea, Select, Checkbox, Switch, RadioGroup, Slider
- Layout: Card, Separator, ScrollArea, Tabs, Accordion, Collapsible
- Overlay: Dialog, AlertDialog, Sheet, Popover, Tooltip, HoverCard, ContextMenu, DropdownMenu
- Feedback: Toast (sonner), Alert, Progress, Skeleton
- Data: Table, Avatar, Badge, Calendar, Command (cmdk)
- Advanced: Carousel, Resizable Panels, Charts (recharts)

**Styling Pattern:**
```javascript
import { cn } from '@/lib/utils';

// Use cn() to merge Tailwind classes
<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  customClassName
)} />
```

**Common Patterns:**

**1. Page Layout:**
```javascript
import { AppLayout } from '@/components/layout/AppLayout';

export default function MyPage() {
  return (
    <AppLayout>
      <div className="p-6">
        {/* Page content */}
      </div>
    </AppLayout>
  );
}
```

**2. Data Fetching:**
```javascript
import { useState, useEffect } from 'react';
import { Keyword } from '@/lib/perdia-sdk';

function KeywordList() {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadKeywords() {
      const data = await Keyword.find({}, { limit: 50 });
      setKeywords(data);
      setLoading(false);
    }
    loadKeywords();
  }, []);

  // Component render...
}
```

**3. Realtime Subscriptions:**
```javascript
useEffect(() => {
  // Subscribe to changes
  const subscription = Keyword.subscribe((payload) => {
    if (payload.eventType === 'INSERT') {
      setKeywords(prev => [...prev, payload.new]);
    }
    if (payload.eventType === 'UPDATE') {
      setKeywords(prev => prev.map(k =>
        k.id === payload.new.id ? payload.new : k
      ));
    }
    if (payload.eventType === 'DELETE') {
      setKeywords(prev => prev.filter(k => k.id !== payload.old.id));
    }
  });

  // Cleanup
  return () => subscription?.unsubscribe();
}, []);
```

**4. Forms with react-hook-form + zod:**
```javascript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  keyword: z.string().min(1, 'Required'),
  search_volume: z.number().min(0)
});

function KeywordForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { keyword: '', search_volume: 0 }
  });

  const onSubmit = async (values) => {
    await Keyword.create(values);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

**5. Toast Notifications:**
```javascript
import { toast } from 'sonner';

// Success
toast.success('Keyword created successfully');

// Error
toast.error('Failed to create keyword');

// Loading
toast.loading('Creating keyword...');
```

### 11. Routing Patterns

**Router:** React Router v7

**Configuration:** `src/pages/Pages.jsx`

**Route Structure:**
```javascript
// Protected routes require authentication
<Route element={<Layout />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/keywords" element={<KeywordManager />} />
  <Route path="/content" element={<ContentLibrary />} />
  <Route path="/agents" element={<AIAgents />} />
  {/* ... */}
</Route>

// Public routes
<Route path="/login" element={<Login />} />
```

**Navigation:**
```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/keywords');
```

**Route Protection:**
Routes are wrapped in `<Layout />` which handles authentication checks. Unauthenticated users are redirected to login.

## Environment Variables

**Required:**
```bash
# Supabase (REQUIRED)
VITE_SUPABASE_URL=https://your-perdia-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# AI Services - Content Generation Pipeline (REQUIRED)
VITE_XAI_API_KEY=xai-your-key                    # Grok-2 for article generation
VITE_PERPLEXITY_API_KEY=pplx-your-key            # Perplexity Sonar Pro for fact-checking

# AI Services - Supporting (REQUIRED)
VITE_ANTHROPIC_API_KEY=sk-ant-your-key           # Claude for titles/metadata
VITE_GOOGLE_AI_API_KEY=your-key                  # Gemini 2.5 Flash for images

# AI Services - Legacy/Optional
VITE_OPENAI_API_KEY=sk-your-key                  # Optional, for specialized tasks
```

**Optional:**
```bash
# Admin operations (migrations, seeding)
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Image optimization (optional, handled by Gemini by default)
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_API_KEY=
VITE_CLOUDINARY_API_SECRET=

# Defaults
VITE_DEFAULT_AI_PROVIDER=grok  # Primary: 'grok', Secondary: 'claude', Legacy: 'openai'
```

**Setup:**
1. Copy `.env.example` to `.env.local`
2. Fill in your Perdia Supabase credentials (NOT Disruptors AI)
3. Add AI API keys
4. Never commit `.env.local`

See `.env.example` for complete list with detailed comments.

## Project Structure

```
perdia/
├── src/
│   ├── lib/                        # Core SDK files ⚠️ CRITICAL
│   │   ├── supabase-client.js      # Centralized Supabase client - ALWAYS USE THIS
│   │   ├── perdia-sdk.js           # Custom SDK (Base44-compatible, 790 lines)
│   │   ├── content-pipeline.js     # Two-stage generation pipeline (Grok → Perplexity) - 512 lines
│   │   ├── suggestion-service.js   # Content idea aggregation from 4 sources - 292 lines
│   │   ├── grok-client.js          # Grok-2 API client (xAI)
│   │   ├── perplexity-client.js    # Perplexity Sonar Pro API client
│   │   ├── ai-client.js            # AI integration (Claude + OpenAI + Gemini)
│   │   ├── agent-sdk.js            # Agent conversation system (legacy)
│   │   └── utils.js                # Utility functions (cn, etc.)
│   ├── components/                 # React components (100+ files)
│   │   ├── ui/                     # shadcn/ui components (Radix-based)
│   │   ├── wizard/                 # Article Generation Wizard
│   │   │   └── ArticleGenerationWizard.jsx  # Zero-typing content wizard - 544 lines
│   │   ├── agents/                 # AI agent interfaces (legacy)
│   │   ├── content/                # Content queue, editor
│   │   ├── dashboard/              # Dashboard widgets
│   │   ├── layout/                 # App layout components
│   │   └── ...                     # Other feature components
│   ├── pages/                      # Route pages (16 pages)
│   │   ├── Pages.jsx               # Router configuration
│   │   ├── Layout.jsx              # Main layout wrapper
│   │   ├── Dashboard.jsx           # Main dashboard
│   │   ├── AIAgents.jsx            # Agent interface
│   │   ├── KeywordManager.jsx      # Keyword management
│   │   ├── ContentLibrary.jsx      # Content queue
│   │   └── ...                     # Other pages
│   ├── hooks/                      # Custom React hooks
│   ├── App.jsx                     # Root component
│   └── main.jsx                    # Entry point
├── supabase/
│   ├── functions/                  # Supabase Edge Functions
│   │   └── invoke-llm/             # AI invocation endpoint (400s timeout)
│   │       ├── index.ts            # Edge Function code
│   │       └── README.md           # Function documentation
│   └── migrations/
│       └── 20250104000001_perdia_complete_schema.sql  # Complete DB schema
├── scripts/
│   ├── migrate-database.js         # Apply migrations
│   ├── seed-agents.js              # Seed agent definitions (legacy)
│   └── test-invoke-llm.js          # Test Edge Function deployment
├── docs/                           # Documentation
├── .env.example                    # Environment variables template
├── vite.config.js                  # Vite configuration (path aliases)
├── package.json                    # Dependencies and scripts
├── netlify.toml                    # Frontend deployment configuration
└── README.md                       # Project overview
```

**Path Aliases:**
- `@/` → `src/` (defined in vite.config.js)
- Always use `@/lib/supabase-client` not relative paths
- Example: `import { supabase } from '@/lib/supabase-client'`

## Migration Context

This codebase was **migrated from Base44** platform. Key architectural decisions:

1. **SDK Compatibility Layer** - Maintains Base44's API to minimize code changes
2. **Custom Agent System** - Replaces missing Base44 agentSDK with custom implementation
3. **Dual AI Support** - Claude (primary for content) + OpenAI (secondary for specialized tasks)
4. **Supabase Stack** - PostgreSQL + Auth + Storage + RLS + Edge Functions
5. **Hybrid Deployment** - Netlify (frontend) + Supabase (backend & AI with 400s timeout)

**Infrastructure Consolidation (Nov 2025):**
- Migrated AI invocation from Netlify Functions → Supabase Edge Functions
- Benefits: 400-second timeout (vs 26s), consolidated infrastructure, cost savings ($25/mo vs $44/mo)
- No more 504 timeout errors on long-form content generation

**Legacy Tables:** 11 entities defined but not implemented (EOSCompany, EOSRock, EOSIssue, Client, Project, Task, etc.) - kept in SDK for future compatibility, not used by current platform.

## Type Safety

**Type Checking:** TypeScript (tsconfig.json) + JSDoc for JavaScript files

**Run Type Check:**
```bash
npm run type-check
```

**JSDoc Patterns for SDK Functions:**
```javascript
/**
 * Finds records matching the filter
 * @param {Object} filter - Query filters
 * @param {Object} options - Query options (orderBy, limit, offset)
 * @returns {Promise<Array>} Records with .count property
 */
async function find(filter = {}, options = {}) {
  // Implementation
}
```

**Type Safety Best Practices:**
- Run `npm run type-check` before commits
- Add JSDoc comments for all exported functions
- Use Zod schemas for form validation and runtime type checking
- TypeScript configured for type checking .jsx files via JSDoc

## Common Development Workflows

### Generating Content with the Pipeline

**Using the Article Generation Wizard (Recommended):**

```javascript
import ArticleGenerationWizard from '@/components/wizard/ArticleGenerationWizard';

// Open wizard - user clicks through 5 steps
<ArticleGenerationWizard
  open={wizardOpen}
  onClose={() => setWizardOpen(false)}
/>
```

**Direct Pipeline Usage (Advanced):**

```javascript
import { generateArticlePipeline } from '@/lib/content-pipeline';

const article = await generateArticlePipeline(
  'What are the best online MBA programs?',
  {
    userInstructions: 'Focus on career outcomes and ROI',
    wordCountTarget: '2000',
    includeImages: true,
    runVerification: true,
    onProgress: ({ stage, message }) => {
      console.log(`${stage}: ${message}`);
    }
  }
);

// Save to content queue
await ContentQueue.create({
  title: article.title,
  content: article.body,
  meta_title: article.meta_title,
  meta_description: article.meta_description,
  target_keywords: article.target_keywords,
  word_count: article.word_count,
  featured_image_url: article.featured_image_url,
  status: 'pending_review',
  generation_cost: article.generation_cost,
  verification_cost: article.verification_cost,
  validation_status: article.validation_status
});
```

**Regenerating with Feedback:**

```javascript
import { regenerateWithFeedback } from '@/lib/content-pipeline';

const updatedArticle = await regenerateWithFeedback(
  originalContent,
  'Make it more concise and add more career statistics',
  topicQuestion,
  { onProgress }
);
```

### Working with Keywords

```javascript
import { Keyword } from '@/lib/perdia-sdk';

// Get all currently ranked keywords
const rankedKeywords = await Keyword.find({
  list_type: 'currently_ranked'
}, {
  orderBy: { column: 'priority', ascending: false },
  limit: 100
});

// Add new target keyword
const newKeyword = await Keyword.create({
  keyword: 'online education degrees',
  list_type: 'new_target',
  search_volume: 5400,
  difficulty: 45,
  priority: 5,
  category: 'degree-programs'
});

// Update keyword status
await Keyword.update(keywordId, {
  status: 'in_progress',
  notes: 'Content generation started'
});

// Subscribe to changes
const subscription = Keyword.subscribe((payload) => {
  console.log('Keyword changed:', payload.new);
});
```

### Content Queue Workflow

```javascript
import { ContentQueue } from '@/lib/perdia-sdk';

// Articles are automatically created by the pipeline
// in 'pending_review' status

// Fetch pending articles
const pendingArticles = await ContentQueue.find({
  status: 'pending_review'
}, {
  orderBy: { column: 'created_date', ascending: false }
});

// Review and approve
await ContentQueue.update(articleId, {
  status: 'approved',
  reviewer_notes: 'Looks good!',
  reviewed_by: userId,
  reviewed_at: new Date().toISOString()
});

// Schedule for publishing
await ContentQueue.update(articleId, {
  status: 'scheduled',
  scheduled_publish_date: '2025-11-15T10:00:00Z'
});

// Auto-publish via cron job or manual publish
await ContentQueue.update(articleId, {
  status: 'published',
  wordpress_post_id: '12345',
  wordpress_url: 'https://geteducated.com/articles/...',
  published_at: new Date().toISOString()
});
```

### Working with Content Suggestions

```javascript
import { getAllSuggestions, markSuggestionAsUsed } from '@/lib/suggestion-service';

// Get suggestions from all sources
const suggestions = await getAllSuggestions({
  limit: 20
});

// Display suggestions to user
suggestions.forEach(suggestion => {
  console.log(`${suggestion.sourceIcon} ${suggestion.title}`);
  console.log(`  Source: ${suggestion.source}`);
  console.log(`  Keywords: ${suggestion.keywords.join(', ')}`);
  console.log(`  Priority: ${suggestion.priority}/5`);
});

// When user selects a suggestion and generates content
const article = await generateArticlePipeline(suggestion.title, options);

// Mark suggestion as used
await markSuggestionAsUsed(suggestion, article.id);
```

## Deployment

### Frontend Deployment (Netlify)

**Location:** `netlify.toml`

**Project Information:**
- **Project ID:** `371d61d6-ad3d-4c13-8455-52ca33d1c0d4`
- **Account:** Perdia Education (New Netlify Account)
- **Dashboard:** https://app.netlify.com/sites/perdia-education/overview

**🔧 Claude Code MCP Configuration:**
- **MCP Account:** `netlify-primary` (DisruptorsAI)
- **Token:** (stored securely in MCP configuration)
- **Usage:** Always use `netlify-primary` MCP server for this project

**Build Settings:**
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 18+

**Environment Variables:**
Set all `VITE_*` variables in Netlify dashboard (same as `.env.local`).

**Deployment Process:**
1. Repository already connected to Netlify (Project ID: 371d61d6-ad3d-4c13-8455-52ca33d1c0d4)
2. Configure build settings (or use netlify.toml)
3. Set environment variables in Netlify dashboard
4. Push to main branch → auto-deploy

**Netlify CLI:**
```bash
netlify deploy --prod        # Deploy to production
netlify env:list             # List environment variables
netlify open:site            # Open deployed site
netlify open:admin           # Open Netlify dashboard
```

**Important for Claude Code:**
When working with Netlify operations via MCP, always use the `netlify-primary` server (DisruptorsAI account). This ensures all deployment, environment variable, and build commands target the correct Netlify account for this project.

### Backend & AI Deployment (Supabase Edge Functions)

**AI invocation runs on Supabase Edge Functions** (400-second timeout for long-form content generation).

**Deployment Steps:**

1. **Link to Supabase Project:**
```bash
npx supabase link --project-ref yvvtsfgryweqfppilkvo
```

2. **Deploy the Function:**
```bash
npx supabase functions deploy invoke-llm --project-ref yvvtsfgryweqfppilkvo
```

3. **Configure Secrets:**
```bash
npx supabase secrets set ANTHROPIC_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set OPENAI_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo
```

4. **Verify Deployment:**
```bash
# List secrets
npx supabase secrets list --project-ref yvvtsfgryweqfppilkvo

# Test function
node scripts/test-invoke-llm.js
```

See [SUPABASE_EDGE_FUNCTION_DEPLOYMENT.md](./SUPABASE_EDGE_FUNCTION_DEPLOYMENT.md) for detailed deployment guide.

## Common Pitfalls

### ❌ Don't Do This

```javascript
// Creating new Supabase clients
import { createClient } from '@supabase/supabase-js';
const myClient = createClient(url, key);  // ❌ Causes "Multiple GoTrueClient" warnings

// Hardcoding credentials
const url = 'https://...';  // ❌ Use environment variables

// Direct Supabase queries
const { data } = await supabase.from('keywords').select();  // ❌ Use SDK instead

// Relative imports
import { supabase } from '../../../lib/supabase-client';  // ❌ Use @/ alias

// Wrong project credentials
VITE_SUPABASE_URL=https://disruptors-ai-project.supabase.co  // ❌ Use Perdia project
```

### ✅ Do This Instead

```javascript
// Use centralized client
import { supabase, supabaseAdmin } from '@/lib/supabase-client';

// Use environment variables
const url = import.meta.env.VITE_SUPABASE_URL;

// Use SDK for data operations
import { Keyword } from '@/lib/perdia-sdk';
const keywords = await Keyword.find({ status: 'queued' });

// Use path aliases
import { supabase } from '@/lib/supabase-client';

// Use Perdia project credentials
VITE_SUPABASE_URL=https://perdia-project.supabase.co
```

## Debugging

**Common Issues:**

1. **"Multiple GoTrueClient instances" warning**
   - Cause: Creating multiple Supabase clients
   - Fix: Always import from `@/lib/supabase-client`, never call `createClient()` directly

2. **RLS Policy Errors (403/insufficient privileges)**
   - Cause: User not authenticated or missing RLS policies
   - Fix: Ensure `getCurrentUser()` returns user before entity operations
   - Check: RLS policies exist and allow operation

3. **AI API Errors**
   - Cause: Missing or invalid API keys
   - Fix: Check `.env.local` has valid `VITE_ANTHROPIC_API_KEY` and `VITE_OPENAI_API_KEY`

4. **Upload Failures**
   - Cause: Bucket doesn't exist or RLS denies access
   - Fix: Verify bucket in Supabase dashboard, check RLS policies on storage

5. **Wrong Database (Disruptors AI instead of Perdia)**
   - Cause: Using wrong Supabase credentials
   - Fix: Verify `VITE_SUPABASE_URL` points to Perdia project

**Debug Mode:**
```bash
VITE_DEBUG=true npm run dev
```

## Documentation Resources

**Essential Reading:**
- `README.md` - Project overview and quick start
- `ARCHITECTURE_GUIDE.md` - Detailed architecture patterns
- `docs/PERDIA_MIGRATION_COMPLETE.md` - Full migration report
- `docs/ANTHROPIC_API_GUIDE.md` - **⚠️ CRITICAL: Comprehensive Anthropic Claude API reference**
- `.env.example` - Environment variables reference

**Migration Context:**
- `MIGRATION_GUIDE.md` - Base44 migration workflow
- `QUICK_START.md` - 3-step migration guide
- `AGENT_COMMANDS.md` - base44-migration-specialist commands

**External Resources:**
- [Supabase Docs](https://supabase.com/docs)
- [Anthropic Claude API Official Docs](https://docs.claude.com/) - Updated URL (docs.claude.com)
- [Claude Messages API Reference](https://docs.claude.com/en/api/messages)
- [Claude Rate Limits](https://docs.claude.com/en/api/rate-limits)
- [Anthropic Console](https://console.anthropic.com/) - API keys and usage monitoring
- [OpenAI API](https://platform.openai.com/docs)
- [React Router v7](https://reactrouter.com/)
- [Radix UI](https://www.radix-ui.com/)
- [TailwindCSS](https://tailwindcss.com/)

---

**Last Updated:** 2025-11-13
**Version:** 1.3.0
**Status:** ✅ Production Ready - Two-Stage Content Pipeline (Grok-2 → Perplexity Sonar Pro)
**Netlify Project:** 371d61d6-ad3d-4c13-8455-52ca33d1c0d4
**Supabase Project:** yvvtsfgryweqfppilkvo

**⚠️ IMPORTANT:** Always reference `docs/ANTHROPIC_API_GUIDE.md` for Claude API implementation details to ensure correct model usage, rate limit handling, and cost optimization.

**🚀 NEW FEATURES (v1.3.0):**
- **Content Generation Pipeline:** Two-stage system combining Grok-2's human-like generation with Perplexity's fact-checking
- **Article Generation Wizard:** Zero-typing, 5-step click-through UX for content creation
- **Smart Suggestion Service:** Auto-aggregates content ideas from 4 sources (questions, keywords, clusters, news)
- **Cost Optimization:** Target <$0.10 per article with transparent cost tracking
- **Real-time Progress:** Terminal-style visualization of all generation stages
