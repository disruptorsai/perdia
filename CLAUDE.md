# CLAUDE.md

Quick reference for Claude Code working with Perdia Education.

## Project Overview

**Perdia Education** - AI-powered SEO content automation for GetEducated.com. Migrated from Base44 to custom Supabase implementation.

**Goal:** Scale from 6-8 pages/day manual → 100+ articles/week automated

**Key Features:**
- Two-stage AI pipeline: Grok-2 (generation) → Perplexity Sonar Pro (fact-checking)
- Zero-typing Article Wizard with AI suggestions from 4 sources
- Keyword management (1000s of keywords)
- Content workflow (draft → approve → publish)
- WordPress integration
- Google Search Console tracking

## Tech Stack

- **Frontend:** React 18.2 + Vite 6.1 + TailwindCSS 3.4
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **AI Pipeline:** Grok-2 → Perplexity Sonar Pro → Claude Sonnet 4.5 (SEO) → Gemini 2.5 Flash (images)
- **Deployment:** Netlify (frontend) + Supabase (backend, 400s timeout)
- **UI:** Radix UI, Recharts, Framer Motion, React Router v7

## Essential Commands

```bash
# Development
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript checking

# Database
npm run db:migrate   # Apply migrations
npm run db:seed      # Seed agent definitions
npm run setup        # Full setup: install + migrate + seed

# First Time
npm install && cp .env.example .env.local
# Edit .env.local with credentials
npm run setup && npm run dev
```

## Critical Rules

### AI Models - ALWAYS USE:
- `claude-sonnet-4-5-20250929` - Primary (Sonnet 4.5)
- `claude-haiku-4-5-20251001` - Fast tasks (Haiku 4.5)
- `grok-2` - Article generation (xAI)
- `sonar-pro` - Fact-checking (Perplexity)
- `gemini-2.5-flash-image` - Image generation

### Image Generation - HARD RULE:
- ✅ `gemini-2.5-flash-image` (PRIMARY)
- ✅ `gpt-image-1` (FALLBACK ONLY)
- ❌ **NEVER use `dall-e-3` or `dall-e-2`**

### Supabase Client - ALWAYS:
```javascript
// ✅ CORRECT
import { supabase } from '@/lib/supabase-client';

// ❌ NEVER create new clients
import { createClient } from '@supabase/supabase-js';
const client = createClient(url, key); // Causes warnings!
```

### SDK Usage:
```javascript
import { Keyword, ContentQueue, InvokeLLM } from '@/lib/perdia-sdk';

// Find, create, update, delete
const items = await Keyword.find({ status: 'queued' });
await Keyword.create({ keyword: 'test' });
await Keyword.update(id, { status: 'done' });
await Keyword.delete(id);
```

## Project Structure

```
perdia/
├── src/
│   ├── lib/           # SDK, AI clients, utilities (see src/lib/CLAUDE.md)
│   ├── components/    # React components (see src/components/CLAUDE.md)
│   ├── pages/         # Route pages
│   └── hooks/         # Custom hooks
├── supabase/          # Database & Edge Functions (see supabase/CLAUDE.md)
├── docs/              # Detailed documentation (see docs/README.md)
└── .claude/           # Claude Code config & agents
```

## Environment Variables

**Required:**
```bash
VITE_SUPABASE_URL=https://yvvtsfgryweqfppilkvo.supabase.co
VITE_SUPABASE_ANON_KEY=your_key
VITE_XAI_API_KEY=xai-your-key          # Grok-2
VITE_PERPLEXITY_API_KEY=pplx-your-key  # Perplexity
VITE_ANTHROPIC_API_KEY=sk-ant-your-key # Claude
VITE_GOOGLE_AI_API_KEY=your-key        # Gemini
```

## Key Entities (SDK)

**Primary (Active):**
- `Keyword` - Keyword tracking
- `ContentQueue` - Content workflow (V1 data source)
- `TopicQuestion` - Content suggestions
- `Cluster` - Topic grouping
- `PerformanceMetric` - GSC data
- `WordPressConnection` - WordPress sites

**V2 (New):**
- `Article` - V2 data source (may conflict with ContentQueue)
- `Feedback`, `ArticleRevision`

## Deployment

**Netlify (Frontend):**
- Site ID: `371d61d6-ad3d-4c13-8455-52ca33d1c0d4`
- Auto-deploys on push to main

**Supabase (Backend):**
- Project: `yvvtsfgryweqfppilkvo`
- Edge Functions with 400s timeout

```bash
# Deploy Edge Function
npx supabase functions deploy invoke-llm --project-ref yvvtsfgryweqfppilkvo
```

## Common Issues

1. **"Multiple GoTrueClient"** - Import from `@/lib/supabase-client` only
2. **403/RLS errors** - Check user auth, verify RLS policies
3. **AI API errors** - Check `.env.local` API keys
4. **V1/V2 data conflict** - V1 uses `content_queue`, V2 uses `articles`

## Architecture Notes

**V1/V2 Dual Interface:**
- V1 (`/v1/*`): Full features, uses `ContentQueue`
- V2 (`/v2/*`): Simplified, uses `Article`
- Default: `/` → `/v1`

**Content Pipeline:** `src/lib/content-pipeline.js`
1. Grok-2 generates draft with `[CITATION NEEDED]` tags
2. Perplexity verifies facts and adds real citations
3. Gemini generates featured image
4. Claude extracts SEO metadata

## Documentation Index

- **SDK Patterns:** `src/lib/CLAUDE.md`
- **Components:** `src/components/CLAUDE.md`
- **Database:** `supabase/CLAUDE.md`
- **Full Docs:** `docs/README.md`
- **API Guide:** `docs/ANTHROPIC_API_GUIDE.md`
- **MCP Setup:** `.claude/docs/MCP_SETUP_GUIDE.md`

## Quick Patterns

**Generate Content:**
```javascript
import { generateArticlePipeline } from '@/lib/content-pipeline';
const article = await generateArticlePipeline(topic, { onProgress });
```

**Toast Notifications:**
```javascript
import { toast } from 'sonner';
toast.success('Done!');
toast.error('Failed');
```

**Path Aliases:**
- Always use `@/` → `src/`
- Example: `import { x } from '@/lib/utils'`

---

**Version:** 1.3.0 | **Status:** Production Ready
**Netlify:** 371d61d6-ad3d-4c13-8455-52ca33d1c0d4
**Supabase:** yvvtsfgryweqfppilkvo
