# src/lib - SDK & Core Utilities

This folder contains the core SDK, AI clients, and utility functions for Perdia Education.

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `perdia-sdk.js` | Main SDK (Base44-compatible) | 790 |
| `supabase-client.js` | Centralized Supabase client | - |
| `content-pipeline.js` | Two-stage AI content generation | 512 |
| `suggestion-service.js` | Content idea aggregation | 292 |
| `ai-client.js` | AI provider integration | - |
| `grok-client.js` | Grok-2 API client (xAI) | - |
| `perplexity-client.js` | Perplexity Sonar Pro client | - |
| `agent-sdk.js` | Agent conversation system | - |
| `utils.js` | Utility functions (cn, etc.) | - |

## Supabase Client (CRITICAL)

**Always import from here** - never create new clients:

```javascript
import {
  supabase,           // User ops with RLS
  supabaseAdmin,      // Admin ops (bypass RLS)
  getCurrentUser,     // Get auth user
  isAuthenticated,    // Check auth
  signIn, signUp, signOut,
  uploadFile, deleteFile, getSignedUrl, getPublicUrl
} from '@/lib/supabase-client';
```

## Perdia SDK (Base44-Compatible)

All entities follow the same API pattern:

```javascript
import { Keyword, ContentQueue, InvokeLLM } from '@/lib/perdia-sdk';

// Find records
const items = await Keyword.find(
  { list_type: 'currently_ranked' },  // filter
  {
    orderBy: { column: 'priority', ascending: false },
    limit: 100,
    offset: 0
  }
);

// Create record (auto-adds user_id)
const newItem = await Keyword.create({
  keyword: 'online education',
  search_volume: 5400,
  priority: 5
});

// Update record
await Keyword.update(id, { status: 'completed' });

// Delete record
await Keyword.delete(id);

// Count records
const count = await Keyword.count({ status: 'queued' });

// Realtime subscription
const subscription = Keyword.subscribe((payload) => {
  // payload.eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  // payload.new: new record
  // payload.old: old record
});

// Cleanup
subscription?.unsubscribe();
```

### Available Entities

**Primary (Active):**
- `Keyword` - Keyword research/tracking
- `ContentQueue` - Content workflow (V1)
- `TopicQuestion` - Content suggestions
- `Cluster` - Topic grouping
- `PerformanceMetric` - GSC data
- `WordPressConnection` - WordPress sites
- `AutomationSettings` - User preferences
- `KnowledgeBaseDocument` - AI training docs
- `AgentDefinition` - AI agent configs
- `AgentConversation` - AI conversations
- `AgentMessage` - Conversation messages

**V2 Entities:**
- `Article` - V2 article storage
- `Feedback` - Article comments
- `ArticleRevision` - Revision history

## AI Integration

### InvokeLLM (Generic)

```javascript
import { InvokeLLM } from '@/lib/perdia-sdk';

// Claude (default)
const response = await InvokeLLM({
  prompt: 'Write about...',
  provider: 'claude',
  model: 'claude-sonnet-4-5-20250929',
  temperature: 0.7,
  max_tokens: 4000
});

// OpenAI
const response = await InvokeLLM({
  prompt: 'Generate...',
  provider: 'openai',
  model: 'gpt-4o'
});

// Structured JSON output
const response = await InvokeLLM({
  prompt: 'Analyze...',
  response_json_schema: {
    type: 'object',
    properties: {
      search_volume: { type: 'number' },
      difficulty: { type: 'number' }
    }
  }
});
```

### Content Pipeline (Primary)

The main content generation system using Grok-2 + Perplexity:

```javascript
import { generateArticlePipeline, regenerateWithFeedback } from '@/lib/content-pipeline';

// Generate new article
const article = await generateArticlePipeline(topicQuestion, {
  userInstructions: 'Focus on career outcomes',
  wordCountTarget: '1500-2500',
  includeImages: true,
  runVerification: true,
  onProgress: ({ stage, message, timestamp }) => {
    console.log(`[${stage}] ${message}`);
  }
});

// Returns:
// - title, body, excerpt, featured_image_url
// - meta_title, meta_description, slug
// - target_keywords, word_count
// - validation_status, validation_errors
// - generation_cost, verification_cost

// Regenerate with feedback
const updated = await regenerateWithFeedback(
  originalContent,
  'Make it more concise',
  topicQuestion,
  { onProgress }
);
```

**Pipeline Stages:**
1. `analyze` - Topic analysis (1-2s)
2. `generate` - Grok-2 draft with `[CITATION NEEDED]` (60-120s)
3. `verify` - Perplexity fact-checking (30-60s)
4. `citations` - Replace tags with real sources
5. `image` - Gemini 2.5 Flash image (5-10s)
6. `seo` - Claude metadata extraction
7. `validate` - Quality checks

**Cost:** ~$0.03-0.05 per article

### Suggestion Service

Aggregates content ideas from 4 sources:

```javascript
import {
  getAllSuggestions,
  getSuggestionsGrouped,
  markSuggestionAsUsed
} from '@/lib/suggestion-service';

// Get combined suggestions
const suggestions = await getAllSuggestions({
  includeTrendingQuestions: true,
  includeKeywords: true,
  includeClusters: true,
  includeTrendingNews: true,
  limit: 30
});

// Get grouped by source
const grouped = await getSuggestionsGrouped({
  questionsLimit: 10,
  keywordsLimit: 10,
  clustersLimit: 5,
  newsLimit: 5
});
// Returns: { questions, keywords, clusters, news, all }

// Mark as used after generating content
await markSuggestionAsUsed(suggestion, articleId);
```

**Suggestion Format:**
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
  metadata: { /* source-specific */ }
}
```

### Agent Conversation System

For multi-turn AI conversations:

```javascript
import { agentSDK } from '@/lib/agent-sdk';

// List conversations
const convos = await agentSDK.listConversations({
  agent_name: 'seo_content_writer',
  limit: 50
});

// Create conversation
const conv = await agentSDK.createConversation({
  agent_name: 'seo_content_writer',
  initial_message: 'Write an article about...'
});

// Send message
const response = await agentSDK.sendMessage({
  conversation_id: conv.id,
  message: 'Make it more concise'
});

// Get full conversation
const full = await agentSDK.getConversation({
  conversation_id: conv.id
});
```

## File Upload

```javascript
import { UploadFile, CreateFileSignedUrl } from '@/lib/perdia-sdk';

// Upload public file
const result = await UploadFile({
  file: fileObject,
  bucket: 'content-images',  // public bucket
  isPublic: true
});
// Returns: { url, path, bucket }

// Upload private file
const result = await UploadFile({
  file: fileObject,
  bucket: 'knowledge-base',  // private bucket
  isPublic: false
});
// Returns signed URL (1hr expiry)

// Get signed URL for existing file
const { url } = await CreateFileSignedUrl({
  path: 'user_id/file.pdf',
  bucket: 'uploads',
  expiresIn: 3600
});
```

**Buckets:**
- `content-images` (public) - Blog images
- `social-media` (public) - Social assets
- `knowledge-base` (private) - AI docs
- `uploads` (private) - General uploads

## Utility Functions

```javascript
import { cn } from '@/lib/utils';

// Merge Tailwind classes conditionally
<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  customClassName
)} />
```

## Model Selection Guide

| Use Case | Model | Why |
|----------|-------|-----|
| Article generation | `grok-2` | Human-like writing |
| Fact-checking | `sonar-pro` | Real citations |
| SEO metadata | `claude-sonnet-4-5` | Detailed analysis |
| Titles | `claude-haiku-4-5` | Fast, cost-effective |
| Images | `gemini-2.5-flash-image` | Quality, speed |
| Chat | `claude-haiku-4-5` | Low latency |

## Best Practices

1. **Always use centralized client** - Never `createClient()`
2. **Use SDK for data ops** - Not direct Supabase queries
3. **Handle subscriptions** - Always cleanup in useEffect
4. **Use path aliases** - `@/lib/...` not relative paths
5. **Check auth before ops** - RLS requires authenticated user
6. **Monitor costs** - Track `generation_cost` and `verification_cost`

## Debugging

**Common errors:**
- "Multiple GoTrueClient" → Use centralized client
- 403/RLS → Check auth, verify policies
- AI timeout → Increase `max_tokens` or use Edge Functions

**Debug mode:**
```bash
VITE_DEBUG=true npm run dev
```
