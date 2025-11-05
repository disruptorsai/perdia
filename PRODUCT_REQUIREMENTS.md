# Perdia Education Platform - Product Requirements Document

**Version:** 1.0.0
**Date:** November 5, 2025
**Status:** Post-Migration - Core SDK Complete, UI Development Ready

---

## Executive Summary

**Perdia Education** is an AI-powered SEO content automation platform designed to scale organic traffic growth for GetEducated.com from 6-8 manually-created pages per day to 100+ automatically-generated, SEO-optimized articles per week. The platform leverages 9 specialized AI agents powered by Claude and OpenAI to automate the entire content lifecycle—from keyword research through publication to performance tracking.

**Current State:** Core SDK layer complete with full database schema, AI integration, and Base44-compatible API. Ready for UI development.

**Primary Goal:** 2-3x organic traffic growth through intelligent, scalable content automation.

---

## Problem Statement

### Current Challenges

1. **Manual Content Bottleneck**
   - GetEducated.com manually produces 6-8 articles per day
   - Process is labor-intensive and doesn't scale
   - Organic growth limited by human production capacity

2. **SEO Optimization Complexity**
   - Keyword research requires significant manual effort
   - Content optimization for search engines is time-consuming
   - Tracking 1000s of keywords manually is impractical

3. **Workflow Management**
   - No unified system for draft → review → publish workflow
   - WordPress publishing requires manual intervention
   - Performance tracking disconnected from content creation

4. **Platform Lock-in**
   - Previously built on Base44 platform (external dependency)
   - Limited customization and feature development
   - Migration complexity to own infrastructure

### Business Impact

- **Opportunity Cost:** Potential traffic growth limited by manual processes
- **Competitive Disadvantage:** Competitors with automation scale faster
- **Resource Inefficiency:** High-skilled writers doing repetitive SEO work
- **Data Silos:** Disconnected tools for research, writing, publishing, tracking

---

## Solution Overview

### Platform Vision

Perdia Education is a comprehensive content automation platform that:

1. **Automates Content Creation** using 9 specialized AI agents
2. **Manages Keyword Strategy** for 1000s of keywords simultaneously
3. **Orchestrates Workflow** from draft through approval to publication
4. **Integrates with WordPress** for seamless publishing
5. **Tracks Performance** via Google Search Console integration
6. **Enables Team Collaboration** through built-in chat and feedback systems

### Key Differentiators

- **Custom Infrastructure:** Migrated from Base44 to Supabase for full control
- **Dual AI Providers:** Claude (primary) + OpenAI (secondary) for optimal results
- **Agent Specialization:** 9 purpose-built AI agents vs. generic LLM usage
- **Base44 Compatibility:** Maintains familiar API patterns for easy transition
- **Scalable Architecture:** Handles 100+ articles/week with room for growth

---

## Key Features & Capabilities

### 1. AI-Powered Content Generation

**9 Specialized AI Agents:**

| Agent | Purpose | Output | Model |
|-------|---------|--------|-------|
| **SEO Content Writer** | Long-form SEO articles | 1500-2500 words | Claude Sonnet 4.5 |
| **Blog Post Generator** | Standard blog posts | 800-1200 words | Claude Sonnet 4.5 |
| **Page Optimizer** | Improve existing pages | Optimized HTML | Claude Sonnet 4.5 |
| **Meta Description Writer** | Search result snippets | 155 characters | Claude Sonnet 4.5 |
| **Social Media Specialist** | Social promotion | 280 characters | Claude Sonnet 4.5 |
| **Keyword Researcher** | Keyword analysis | Structured data | Claude Sonnet 4.5 |
| **Content Editor** | Review & improve | Editorial feedback | Claude Sonnet 4.5 |
| **Internal Linking Expert** | Strategic links | Link recommendations | Claude Sonnet 4.5 |
| **Content Strategist** | Strategy & planning | Content roadmap | Claude Sonnet 4.5 |

**Capabilities:**
- Multi-turn conversations with context retention
- Structured JSON output for data extraction
- Custom system prompts per agent
- Temperature and token controls
- Provider fallback (Claude → OpenAI)

### 2. Keyword Management System

**Features:**
- Track 1000s of keywords simultaneously
- Categorize by list type: `currently_ranked`, `new_target`, `competitor`
- Priority scoring (1-10)
- Search volume and difficulty tracking
- Category tagging
- Status management: `queued`, `in_progress`, `completed`
- Real-time updates via Supabase subscriptions

**Workflow:**
1. Import keyword lists from research tools
2. AI agent analyzes keyword opportunities
3. Prioritize based on volume/difficulty/strategic fit
4. Auto-queue for content generation
5. Track ranking improvements post-publication

### 3. Content Queue & Workflow

**Status Pipeline:**
```
draft → pending_review → approved → scheduled → published
```

**Features:**
- Multi-type support: `new_article`, `update_existing`, `landing_page`
- Target keyword assignment (multiple keywords per content)
- Word count tracking
- SEO metadata: title, meta description, slug
- WordPress integration: auto-publish or manual sync
- Scheduled publishing
- Content versioning

**Quality Controls:**
- AI-generated readability scores
- Keyword density analysis
- Internal linking suggestions
- Image optimization checks

### 4. WordPress Integration

**Connections:**
- Multiple WordPress site support
- OAuth authentication
- Custom post type mapping
- Category/tag synchronization
- Featured image upload
- Auto-format HTML for WordPress editor

**Publishing Flow:**
1. Content approved in Perdia
2. Schedule publish date/time
3. Auto-post to WordPress via API
4. Capture WordPress post ID and URL
5. Update content queue status
6. Monitor for publication errors

### 5. Performance Tracking

**Google Search Console Integration:**
- Import ranking data for tracked keywords
- Track impressions, clicks, CTR, position
- Historical performance comparisons
- Identify ranking improvements post-publication
- Alert on ranking drops

**Metrics Dashboard:**
- Traffic growth trends
- Content ROI (articles published vs. traffic gained)
- Top-performing keywords
- Agent performance analytics

### 6. Knowledge Base & Training

**Purpose:** Train AI agents on brand voice, style guidelines, and domain expertise

**Features:**
- Upload training documents (PDF, DOCX, TXT)
- Private storage in Supabase
- Tag documents by category
- Reference documents in agent conversations
- Version control for guidelines

**Use Cases:**
- Brand voice guidelines
- SEO best practices
- Industry research papers
- Competitor analysis
- Editorial standards

### 7. Team Collaboration

**Chat Channels:**
- Create channels by topic/project
- Real-time messaging
- @mentions and notifications
- File sharing
- Thread-based discussions

**Agent Feedback System:**
- Rate AI-generated content (1-5 stars)
- Provide improvement notes
- Track feedback over time
- Use feedback to refine prompts

### 8. File Management

**Storage System:**
- 4 Supabase Storage buckets:
  - `knowledge-base` (private) - Training documents
  - `content-images` (public) - Blog/article images
  - `social-media` (public) - Social assets
  - `uploads` (private) - General files

**Features:**
- Drag-and-drop upload
- Signed URLs for private files (1-hour expiry)
- Public URLs for images
- Automatic user isolation via RLS
- File metadata tracking

---

## Technical Architecture

### Technology Stack

**Frontend:**
- **React 18.2** - UI library
- **Vite 6.1** - Build tool and dev server
- **React Router v7** - Client-side routing
- **TailwindCSS 3.4** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animations
- **Recharts** - Data visualization

**Backend:**
- **Supabase** - Backend-as-a-Service
  - PostgreSQL 15 - Relational database
  - Auth - User authentication and sessions
  - Storage - File storage with RLS
  - Realtime - Live data subscriptions
  - Row Level Security - Data isolation

**AI Services:**
- **Anthropic Claude** - Primary LLM (Sonnet 4.5)
- **OpenAI** - Secondary LLM (GPT-4o)

**Deployment:**
- **Netlify** - Static hosting and serverless functions
- **GitHub** - Version control and CI/CD

### Architecture Patterns

#### 1. Custom SDK Layer (Base44 Compatible)

**Location:** `src/lib/perdia-sdk.js` (790 lines)

**Design Philosophy:**
- Maintain Base44 API surface for zero-refactor migration
- Abstract Supabase implementation details
- Provide familiar CRUD operations
- Auto-inject authentication and user context

**API Pattern:**
```javascript
import { Keyword, ContentQueue } from '@/lib/perdia-sdk';

// Find with filters
const keywords = await Keyword.find({
  list_type: 'currently_ranked'
});

// Create
const newItem = await Keyword.create({
  keyword: 'test',
  priority: 5
});

// Update
await Keyword.update(id, { status: 'completed' });

// Delete
await Keyword.delete(id);

// Count
const count = await Keyword.count({ status: 'queued' });

// Subscribe to changes
const sub = Keyword.subscribe((payload) => {
  console.log('Change:', payload);
});
```

**16 Active Entities:**
1. `Keyword` - Keyword tracking
2. `ContentQueue` - Content workflow
3. `PerformanceMetric` - SEO metrics
4. `WordPressConnection` - WP sites
5. `AutomationSettings` - User preferences
6. `PageOptimization` - Page improvements
7. `BlogPost` - Blog content
8. `SocialPost` - Social media
9. `KnowledgeBaseDocument` - Training docs
10. `AgentFeedback` - AI feedback
11. `FileDocument` - File metadata
12. `ChatChannel` - Team channels
13. `ChatMessage` - Team messages
14. `AgentDefinition` - AI agent configs
15. `AgentConversation` - Conversations
16. `AgentMessage` - Conversation history

**Entity Features:**
- Automatic `user_id` injection on create
- RLS enforcement for data isolation
- `.count` property on all query results
- Pagination, sorting, filtering support
- Real-time subscriptions

#### 2. Centralized Supabase Client

**Location:** `src/lib/supabase-client.js`

**Problem Solved:** Prevents "Multiple GoTrueClient instances" warnings by ensuring single Supabase instance

**Exports:**
```javascript
// Clients
export const supabase;        // User operations (anon key)
export const supabaseAdmin;   // Admin operations (service role)

// Auth helpers
export const getCurrentUser();
export const isAuthenticated();
export const signIn(email, password);
export const signUp(email, password, metadata);
export const signOut();

// Storage helpers
export const uploadFile(bucket, path, file);
export const deleteFile(bucket, path);
export const getSignedUrl(bucket, path, expiresIn);
export const getPublicUrl(bucket, path);
```

**Usage Rule:** ALWAYS import from this file, NEVER call `createClient()` directly.

#### 3. AI Integration Layer

**Location:** `src/lib/ai-client.js`

**Unified Interface:**
```javascript
import { InvokeLLM } from '@/lib/perdia-sdk';

const response = await InvokeLLM({
  prompt: 'Write an article about...',
  provider: 'claude',  // or 'openai'
  model: 'claude-3-5-sonnet',
  temperature: 0.7,
  max_tokens: 4000,
  response_json_schema: { ... }  // Optional structured output
});
```

**Provider Support:**
- **Claude:** `claude-3-5-sonnet`, `claude-3-haiku`, `claude-opus`
- **OpenAI:** `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`

**Features:**
- Automatic API key management
- Error handling and retries
- Streaming support (future)
- Token usage tracking
- Cost estimation

#### 4. Agent Conversation System

**Location:** `src/lib/agent-sdk.js`

**Purpose:** Enable multi-turn conversations with AI agents (Base44's agentSDK equivalent)

**API:**
```javascript
import { agentSDK } from '@/lib/agent-sdk';

// Create conversation
const conv = await agentSDK.createConversation({
  agent_name: 'seo_content_writer',
  initial_message: 'Write about online degrees'
});

// Continue conversation
const response = await agentSDK.sendMessage({
  conversation_id: conv.id,
  message: 'Make it more concise'
});

// Get full history
const fullConv = await agentSDK.getConversation({
  conversation_id: conv.id
});

// List conversations
const conversations = await agentSDK.listConversations({
  agent_name: 'seo_content_writer',
  limit: 50
});
```

**Conversation Context:**
- Full message history maintained
- Context passed to AI on each turn
- User-scoped via RLS
- Soft delete support

#### 5. File Upload System

**Integration:**
```javascript
import { UploadFile, CreateFileSignedUrl } from '@/lib/perdia-sdk';

// Public file (images)
const result = await UploadFile({
  file: fileObject,
  bucket: 'content-images',
  isPublic: true
});
// Returns: { url, path, bucket }

// Private file (documents)
const result = await UploadFile({
  file: fileObject,
  bucket: 'knowledge-base',
  isPublic: false
});
// Returns signed URL (1-hour expiry)

// Generate signed URL later
const { url } = await CreateFileSignedUrl({
  path: 'user_id/file.pdf',
  bucket: 'uploads',
  expiresIn: 3600
});
```

**Storage Buckets:**
- `knowledge-base` (private) - AI training documents
- `content-images` (public) - Blog/content images
- `social-media` (public) - Social media assets
- `uploads` (private) - General file uploads

### Database Schema

**Migration:** `supabase/migrations/20250104000001_perdia_complete_schema.sql`

**Schema Design Principles:**
- **Primary Keys:** UUID with `uuid_generate_v4()`
- **Timestamps:** `created_date`, `updated_date` (auto-updating)
- **User Isolation:** `user_id` foreign key on all tables
- **RLS Enabled:** All tables have row-level security
- **Naming Convention:** `lowercase_with_underscores`

**Core Tables:**

1. **keywords** - Keyword tracking and management
   - `id`, `user_id`, `keyword`, `list_type`, `search_volume`, `difficulty`, `priority`, `category`, `status`, `notes`, `created_date`, `updated_date`

2. **content_queue** - Content workflow management
   - `id`, `user_id`, `title`, `content`, `content_type`, `status`, `target_keywords`, `word_count`, `meta_description`, `slug`, `scheduled_publish_date`, `wordpress_post_id`, `wordpress_url`, `created_date`, `updated_date`

3. **performance_metrics** - Google Search Console data
   - `id`, `user_id`, `keyword`, `page_url`, `impressions`, `clicks`, `ctr`, `position`, `date`, `created_date`

4. **wordpress_connections** - WordPress site integrations
   - `id`, `user_id`, `site_name`, `site_url`, `auth_token`, `is_active`, `created_date`, `updated_date`

5. **automation_settings** - User automation preferences
   - `id`, `user_id`, `auto_publish_enabled`, `daily_article_limit`, `preferred_ai_provider`, `default_content_type`, `notification_email`, `created_date`, `updated_date`

6. **page_optimizations** - Page improvement tracking
   - `id`, `user_id`, `page_url`, `original_content`, `optimized_content`, `optimization_notes`, `status`, `created_date`, `updated_date`

7. **blog_posts** - Blog content storage
   - `id`, `user_id`, `title`, `content`, `excerpt`, `featured_image_url`, `tags`, `categories`, `status`, `published_date`, `created_date`, `updated_date`

8. **social_posts** - Social media content
   - `id`, `user_id`, `platform`, `content`, `media_urls`, `scheduled_post_date`, `status`, `post_url`, `created_date`, `updated_date`

9. **knowledge_base_documents** - AI training documents
   - `id`, `user_id`, `title`, `file_path`, `file_type`, `tags`, `description`, `created_date`, `updated_date`

10. **agent_feedback** - AI response feedback
    - `id`, `user_id`, `agent_name`, `prompt`, `response`, `rating`, `feedback_notes`, `created_date`

11. **file_documents** - File metadata tracking
    - `id`, `user_id`, `file_name`, `file_path`, `bucket`, `file_size`, `file_type`, `is_public`, `created_date`

12. **chat_channels** - Team collaboration channels
    - `id`, `name`, `description`, `created_by`, `created_date`, `updated_date`

13. **chat_messages** - Team messages
    - `id`, `channel_id`, `user_id`, `message`, `created_date`

14. **agent_definitions** - AI agent configurations
    - `id`, `name`, `display_name`, `description`, `system_prompt`, `model`, `provider`, `temperature`, `max_tokens`, `is_active`, `created_date`, `updated_date`

15. **agent_conversations** - AI conversation threads
    - `id`, `user_id`, `agent_name`, `title`, `is_active`, `created_date`, `updated_date`

16. **agent_messages** - Conversation message history
    - `id`, `conversation_id`, `role`, `content`, `created_date`

**RLS Policies:**
- All tables: `user_id = auth.uid()` for read/write
- Chat tables: Membership-based access
- Agent definitions: Public read, admin write
- Storage: User-scoped file access

### Security Architecture

**Authentication:**
- Supabase Auth with email/password
- JWT tokens with automatic refresh
- Session management via `supabase-client.js`

**Authorization:**
- Row Level Security (RLS) on all tables
- User data isolation via `user_id`
- Storage bucket policies
- Service role key for admin operations

**Data Protection:**
- Environment variables for secrets (never committed)
- Signed URLs for private file access (1-hour expiry)
- RLS prevents unauthorized data access
- HTTPS-only in production

**API Security:**
- Supabase anon key (RLS-protected endpoints)
- Service role key (admin operations only)
- AI API keys server-side only (Netlify Functions)

---

## Development Workflow

### Environment Setup

1. **Clone Repository:**
```bash
git clone <repo-url>
cd perdia
```

2. **Install Dependencies:**
```bash
npm install
```

3. **Configure Environment:**
```bash
cp .env.example .env.local
# Edit .env.local with your credentials:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_ANTHROPIC_API_KEY
# - VITE_OPENAI_API_KEY
```

4. **Setup Database:**
```bash
npm run setup  # Runs migrate + seed
```

5. **Start Development Server:**
```bash
npm run dev  # http://localhost:5173
```

### Available Commands

```bash
# Development
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Database
npm run db:migrate   # Apply migrations
npm run db:seed      # Seed agent definitions
npm run setup        # Install + migrate + seed

# Deployment
npm run deploy       # Deploy to Netlify
```

### Code Style & Conventions

**File Structure:**
```javascript
// ✅ Use path aliases
import { supabase } from '@/lib/supabase-client';
import { Keyword } from '@/lib/perdia-sdk';

// ❌ Avoid relative imports
import { supabase } from '../../../lib/supabase-client';
```

**Naming Conventions:**
- **Components:** `PascalCase.jsx`
- **Utilities:** `camelCase.js`
- **Database:** `snake_case`
- **Constants:** `UPPER_SNAKE_CASE`

**Entity Usage:**
```javascript
// ✅ Use SDK entities
const keywords = await Keyword.find({ status: 'queued' });

// ❌ Avoid direct Supabase queries
const { data } = await supabase.from('keywords').select();
```

**Supabase Client:**
```javascript
// ✅ Import centralized client
import { supabase } from '@/lib/supabase-client';

// ❌ Never create new clients
import { createClient } from '@supabase/supabase-js';
const myClient = createClient(url, key);  // Causes warnings!
```

### Testing Strategy

**Unit Tests:** (TODO)
- SDK entity methods
- AI client functions
- Utility functions

**Integration Tests:** (TODO)
- API endpoints
- Database operations
- File uploads

**E2E Tests:** (TODO)
- User workflows
- Content generation pipeline
- WordPress publishing

**Manual Testing Checklist:**
- [ ] User authentication flow
- [ ] Keyword CRUD operations
- [ ] Content generation with AI agents
- [ ] File uploads to storage
- [ ] Real-time subscriptions
- [ ] WordPress publishing
- [ ] Performance metric imports

---

## Deployment

### Netlify Configuration

**Project Details:**
- **Project ID:** `371d61d6-ad3d-4c13-8455-52ca33d1c0d4`
- **Account:** Perdia Education (New Netlify Account)
- **Site Name:** perdia-education
- **Dashboard:** https://app.netlify.com/sites/perdia-education/overview

**Build Settings:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
```

**Environment Variables (Netlify Dashboard):**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ANTHROPIC_API_KEY=sk-ant-your-key
VITE_OPENAI_API_KEY=sk-your-key
```

**Deployment Process:**
1. Push to `main` branch → auto-deploy
2. Or use Netlify CLI: `netlify deploy --prod`
3. Monitor build logs in Netlify dashboard
4. Verify environment variables set correctly

**Custom Domain:** (TODO)
- Configure DNS settings
- Add custom domain in Netlify
- Enable HTTPS (automatic)

### Supabase Configuration

**Project Setup:**
1. Create Supabase project for Perdia
2. Copy project URL and anon key to `.env.local`
3. Run migrations: `npm run db:migrate`
4. Seed agent definitions: `npm run db:seed`
5. Configure RLS policies (done via migration)
6. Create storage buckets (done via migration)

**Production Checklist:**
- [ ] RLS policies enabled on all tables
- [ ] Storage buckets created with correct policies
- [ ] Database backup schedule configured
- [ ] Connection pooling enabled (if needed)
- [ ] Monitoring and alerts set up

---

## Migration Context

### Base44 → Perdia Migration

**Completed:** January 4, 2025

**Migration Approach:**
1. **SDK Compatibility Layer** - Maintained Base44 API to minimize refactoring
2. **Database Schema Recreation** - Rebuilt all tables in Supabase
3. **Custom Agent System** - Implemented missing `agentSDK` functionality
4. **Storage Migration** - Moved file storage to Supabase Storage
5. **Auth Migration** - Switched to Supabase Auth

**What Changed:**
- Infrastructure: Base44 → Supabase
- Auth: Base44 Auth → Supabase Auth
- Storage: Base44 Storage → Supabase Storage
- Real-time: Base44 subscriptions → Supabase Realtime

**What Stayed the Same:**
- API patterns (find, create, update, delete)
- Entity names and structures
- Application logic and workflows

**Benefits Gained:**
- Full infrastructure control
- No external platform dependency
- Customizable at every level
- Open-source stack
- Cost optimization potential
- Faster feature development

**Documentation:**
- Full migration report: `docs/PERDIA_MIGRATION_COMPLETE.md`
- Architecture details: `ARCHITECTURE_GUIDE.md`
- Setup guide: `docs/SETUP_GUIDE.md`

---

## Known Issues & Limitations

### Current Limitations

1. **UI Not Yet Built**
   - Only SDK layer exists
   - No React components yet
   - Ready for UI development

2. **WordPress Integration Partial**
   - API structure defined
   - Actual integration code pending
   - Requires WordPress plugin or API setup

3. **Google Search Console Integration**
   - Schema ready
   - Import logic not implemented
   - Requires GSC API integration

4. **No Testing Suite**
   - No unit tests
   - No integration tests
   - Manual testing required

5. **Agent System Basic**
   - No advanced features (memory, RAG)
   - Simple prompt-response model
   - No fine-tuning support

### Technical Debt

- [ ] Add TypeScript types for SDK
- [ ] Implement error boundary components
- [ ] Add request rate limiting
- [ ] Implement caching layer
- [ ] Add comprehensive logging
- [ ] Create admin dashboard
- [ ] Build analytics dashboard
- [ ] Add webhooks for external integrations

### Future Enhancements

**Phase 2 - UI Development:**
- Build React component library
- Create page layouts
- Implement routing
- Add responsive design
- Build admin interface

**Phase 3 - Advanced Features:**
- RAG (Retrieval Augmented Generation) for AI agents
- Agent memory and context persistence
- Fine-tuned models for specific tasks
- A/B testing for content variations
- Predictive analytics for keyword opportunities

**Phase 4 - Integrations:**
- Ahrefs/SEMrush keyword import
- Automatic Google Search Console sync
- Slack/Discord notifications
- Zapier integration
- API for external tools

**Phase 5 - Scaling:**
- Multi-tenant support
- White-label options
- Enterprise features
- Advanced analytics
- Team permissions and roles

---

## Success Metrics

### Key Performance Indicators (KPIs)

**Content Production:**
- Target: 100+ articles/week (vs. 40-56 currently)
- Average time per article: <30 minutes (vs. 2-4 hours manual)
- Content quality score: 80%+ (AI + human review)

**SEO Performance:**
- Organic traffic growth: 2-3x within 6 months
- Keyword rankings: 50%+ of targets in top 10
- Average position improvement: +10 positions
- Click-through rate: 5%+ improvement

**Operational Efficiency:**
- Content team time saved: 70%+
- Cost per article: <$5 (vs. $50-100 manual)
- Publication frequency: Daily → Multiple daily
- Error rate: <5%

**User Adoption:**
- Active users: 10+ content team members
- Daily active usage: 80%+ of team
- Feature adoption: 70%+ using AI agents
- User satisfaction: 4.5+/5 rating

### Analytics Dashboard (Future)

**Real-Time Metrics:**
- Articles in queue
- Active AI conversations
- Keywords being tracked
- Scheduled publications

**Historical Trends:**
- Traffic growth over time
- Content output per week/month
- ROI per content piece
- Agent performance comparison

**Alerts:**
- Ranking drops
- Publication errors
- AI API failures
- WordPress connection issues

---

## Support & Maintenance

### Documentation Resources

**Essential Files:**
- `README.md` - Quick start guide
- `CLAUDE.md` - AI assistant instructions
- `ARCHITECTURE_GUIDE.md` - Technical deep dive
- `PRODUCT_REQUIREMENTS.md` - This document
- `.env.example` - Environment variable reference

**Migration Documentation:**
- `docs/PERDIA_MIGRATION_COMPLETE.md` - Full migration report
- `MIGRATION_GUIDE.md` - Base44 migration patterns
- `QUICK_START.md` - 3-step migration workflow

**API Documentation:**
- SDK patterns in `CLAUDE.md`
- Agent API in `src/lib/agent-sdk.js`
- Supabase client in `src/lib/supabase-client.js`

### Common Issues

**1. "Multiple GoTrueClient instances" Warning**
- **Cause:** Creating multiple Supabase clients
- **Fix:** Always import from `@/lib/supabase-client`

**2. RLS Policy Errors (403)**
- **Cause:** User not authenticated or missing policies
- **Fix:** Check `getCurrentUser()` returns user, verify RLS policies

**3. AI API Errors**
- **Cause:** Invalid or missing API keys
- **Fix:** Verify `.env.local` has valid keys

**4. Upload Failures**
- **Cause:** Bucket doesn't exist or RLS denies access
- **Fix:** Check bucket exists, verify RLS policies on `storage.objects`

**5. Wrong Database Connection**
- **Cause:** Using Disruptors AI credentials instead of Perdia
- **Fix:** Verify `VITE_SUPABASE_URL` points to correct project

### Development Support

**Resources:**
- [Supabase Documentation](https://supabase.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [OpenAI API](https://platform.openai.com/docs)
- [React Router v7](https://reactrouter.com/)
- [Vite Documentation](https://vitejs.dev/)

**Community:**
- Supabase Discord
- React Discord
- Stack Overflow

---

## Appendix

### Environment Variables Reference

```bash
# Supabase (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Admin Operations (migrations, seeding)
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services (REQUIRED)
VITE_ANTHROPIC_API_KEY=sk-ant-your-key
VITE_OPENAI_API_KEY=sk-your-key

# Configuration (OPTIONAL)
VITE_DEFAULT_AI_PROVIDER=claude  # or 'openai'

# Cloudinary (OPTIONAL - image optimization)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_API_SECRET=your_api_secret
```

### Database Entity Reference

**16 Active Entities:**
1. Keyword
2. ContentQueue
3. PerformanceMetric
4. WordPressConnection
5. AutomationSettings
6. PageOptimization
7. BlogPost
8. SocialPost
9. KnowledgeBaseDocument
10. AgentFeedback
11. FileDocument
12. ChatChannel
13. ChatMessage
14. AgentDefinition
15. AgentConversation
16. AgentMessage

**11 Legacy Entities** (not implemented):
- EOSCompany, EOSRock, EOSIssue, EOSTask
- Client, Project, Task, Sprint, Retrospective
- TeamMember, UserProfile

### AI Agent Configurations

**Default Settings:**
- Model: `claude-3-5-sonnet-20241022`
- Provider: `claude`
- Temperature: `0.7`
- Max Tokens: `4000`

**Agent-Specific Settings:**
- SEO Content Writer: max_tokens=6000 (longer content)
- Meta Description Writer: max_tokens=200 (short output)
- Keyword Researcher: temperature=0.3 (more deterministic)

### Storage Bucket Policies

**knowledge-base (private):**
- Owner: Read/Write
- Others: No access
- Signed URLs: 1 hour expiry

**content-images (public):**
- Owner: Read/Write
- Public: Read
- No authentication required for viewing

**social-media (public):**
- Owner: Read/Write
- Public: Read
- Optimized for CDN delivery

**uploads (private):**
- Owner: Read/Write
- Others: No access
- Signed URLs: 1 hour expiry

---

## Conclusion

Perdia Education represents a complete transformation of content creation for GetEducated.com. By leveraging specialized AI agents, a robust Supabase backend, and a Base44-compatible SDK layer, the platform is positioned to achieve 2-3x organic traffic growth through intelligent automation.

**Current Status:** Core infrastructure complete, ready for UI development

**Next Steps:**
1. Build React component library
2. Implement page layouts and routing
3. Connect UI to SDK layer
4. Deploy to Netlify
5. Begin production content generation

**Long-Term Vision:** An industry-leading content automation platform that combines AI intelligence with human oversight to produce high-quality, SEO-optimized content at unprecedented scale.

---

**For Questions or Support:**
- Review documentation in `/docs` folder
- Check `CLAUDE.md` for development guidance
- Consult `ARCHITECTURE_GUIDE.md` for technical details

**Version History:**
- v1.0.0 (Nov 5, 2025) - Initial PRD post-migration
