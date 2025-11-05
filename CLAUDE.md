# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Perdia Education** is an AI-powered SEO content automation platform designed to double-triple organic traffic for GetEducated.com. The platform was migrated from Base44 to a custom Supabase implementation.

**Key Capabilities:**
- 9 specialized AI agents for content generation (Claude + OpenAI)
- Keyword management supporting 1000s of keywords
- Content workflow (draft → approve → publish)
- WordPress integration for automated publishing
- Performance tracking via Google Search Console
- Team collaboration with chat

**Scale Target:** From 6-8 pages/day manual → 100+ articles/week automated

**Important:** This is a separate project from Disruptors AI Marketing Hub with its own Supabase database.

## Technology Stack

- **Frontend:** React 18.2 + Vite 6.1 + TailwindCSS 3.4
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **AI:** Anthropic Claude (primary) + OpenAI (secondary)
- **Deployment:** Netlify
- **Components:** Radix UI, Recharts, Framer Motion
- **Routing:** React Router v7

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
npm run db:seed      # Seed 9 AI agent definitions
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

**Location:** `src/lib/ai-client.js`

Unified interface supporting both Claude and OpenAI with a single `invokeLLM()` function.

```javascript
import { InvokeLLM } from '@/lib/perdia-sdk';

// Use Claude (default/primary)
const response = await InvokeLLM({
  prompt: 'Write an SEO article about...',
  provider: 'claude',
  model: 'claude-3-5-sonnet',
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

**9 Specialized AI Agents** (in database):
1. `seo_content_writer` - SEO articles (1500-2500 words)
2. `blog_post_generator` - Blog posts (800-1200 words)
3. `page_optimizer` - Optimize existing pages
4. `meta_description_writer` - Meta descriptions (155 chars)
5. `social_media_specialist` - Social posts (280 chars)
6. `keyword_researcher` - Keyword analysis
7. `content_editor` - Review/improve content
8. `internal_linking_expert` - Strategic internal links
9. `content_strategist` - Content strategy

All use `claude-3-5-sonnet-20241022` by default with temperature 0.7.

### 5. Agent Conversation System

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

### 6. File Upload Integration

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

## Environment Variables

**Required:**
```bash
# Supabase (REQUIRED)
VITE_SUPABASE_URL=https://your-perdia-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# AI Services (REQUIRED)
VITE_ANTHROPIC_API_KEY=sk-ant-your-key
VITE_OPENAI_API_KEY=sk-your-key
```

**Optional:**
```bash
# Admin operations (migrations, seeding)
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Image optimization (not required)
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_API_KEY=
VITE_CLOUDINARY_API_SECRET=

# Defaults
VITE_DEFAULT_AI_PROVIDER=claude  # or 'openai'
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
│   └── lib/                        # Core SDK files (only directory with code so far)
│       ├── supabase-client.js      # Centralized Supabase client ⚠️ ALWAYS USE THIS
│       ├── perdia-sdk.js           # Custom SDK (Base44-compatible, 790 lines)
│       ├── ai-client.js            # AI integration (Claude + OpenAI)
│       └── agent-sdk.js            # Agent conversation system
├── supabase/
│   └── migrations/
│       └── 20250104000001_perdia_complete_schema.sql  # Complete DB schema
├── scripts/
│   ├── migrate-database.js         # Apply migrations
│   └── seed-agents.js              # Seed 9 AI agents
├── docs/
│   ├── PERDIA_MIGRATION_COMPLETE.md      # Migration report
│   └── SETUP_GUIDE.md                    # Complete setup guide
├── .env.example                    # Environment variables template
├── package.json                    # Dependencies and scripts
├── netlify.toml                    # Deployment configuration
└── README.md                       # Project overview
```

**Note:** Most React components not yet created - only the core SDK layer exists. This is a post-migration project ready for UI development.

## Migration Context

This codebase was **migrated from Base44** platform. Key architectural decisions:

1. **SDK Compatibility Layer** - Maintains Base44's API to minimize code changes
2. **Custom Agent System** - Replaces missing Base44 agentSDK with custom implementation
3. **Dual AI Support** - Claude (primary for content) + OpenAI (secondary for specialized tasks)
4. **Supabase Stack** - PostgreSQL + Auth + Storage + RLS
5. **Netlify Deployment** - Serverless functions + static hosting

**Legacy Tables:** 11 entities defined but not implemented (EOSCompany, EOSRock, EOSIssue, Client, Project, Task, etc.) - kept in SDK for future compatibility, not used by current platform.

## Common Development Workflows

### Adding a New Feature with AI Agent

1. **Define the agent** (if new):
```javascript
// Insert into agent_definitions table
await AgentDefinition.create({
  name: 'my_custom_agent',
  display_name: 'My Custom Agent',
  description: 'Does something specific',
  system_prompt: 'You are an expert at...',
  model: 'claude-3-5-sonnet-20241022',
  provider: 'claude',
  temperature: 0.7,
  max_tokens: 4000
});
```

2. **Create conversation**:
```javascript
import { agentSDK } from '@/lib/agent-sdk';

const conv = await agentSDK.createConversation({
  agent_name: 'my_custom_agent',
  initial_message: 'Generate content for...'
});
```

3. **Get response**:
```javascript
const response = await agentSDK.sendMessage({
  conversation_id: conv.id,
  message: 'Follow-up instruction...'
});
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

// Create draft content
const draft = await ContentQueue.create({
  title: 'Best Online MBA Programs 2025',
  content: '<article>...</article>',
  content_type: 'new_article',
  status: 'draft',
  target_keywords: ['online mba', 'best mba programs'],
  word_count: 2500,
  meta_description: 'Discover the best online MBA programs...'
});

// Submit for review
await ContentQueue.update(draft.id, {
  status: 'pending_review'
});

// Approve and schedule
await ContentQueue.update(draft.id, {
  status: 'approved',
  scheduled_publish_date: '2025-11-15T10:00:00Z'
});

// Publish to WordPress
await ContentQueue.update(draft.id, {
  status: 'published',
  wordpress_post_id: '12345',
  wordpress_url: 'https://geteducated.com/articles/...'
});
```

## Deployment

### Netlify Configuration

**Location:** `netlify.toml`

**Build Settings:**
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 18+

**Environment Variables:**
Set all `VITE_*` variables in Netlify dashboard (same as `.env.local`).

**Deployment Process:**
1. Connect GitHub repo to Netlify
2. Configure build settings (or use netlify.toml)
3. Set environment variables
4. Push to master branch → auto-deploy

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
- `.env.example` - Environment variables reference

**Migration Context:**
- `MIGRATION_GUIDE.md` - Base44 migration workflow
- `QUICK_START.md` - 3-step migration guide
- `AGENT_COMMANDS.md` - base44-migration-specialist commands

**External Resources:**
- [Supabase Docs](https://supabase.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [OpenAI API](https://platform.openai.com/docs)
- [React Router v7](https://reactrouter.com/)
- [Radix UI](https://www.radix-ui.com/)
- [TailwindCSS](https://tailwindcss.com/)

---

**Last Updated:** 2025-11-04
**Version:** 1.0.0
**Status:** ✅ Post-Migration - SDK Layer Complete, Ready for UI Development
