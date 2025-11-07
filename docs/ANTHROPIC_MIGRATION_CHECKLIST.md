# Anthropic API Migration Checklist

**Date:** 2025-01-07
**Purpose:** Update Perdia codebase from deprecated Claude 3.5 models to current Claude 4.5 models

---

## Overview

The Perdia codebase is currently using **deprecated Claude models** that need to be updated to the latest versions. This document provides a step-by-step checklist to ensure a complete migration.

### Current Issue

❌ **Using:** `claude-3-5-sonnet-20241022` (OLD - deprecated)
✅ **Should Use:** `claude-sonnet-4-5-20250929` (Claude Sonnet 4.5 - current model)

---

## Required Code Changes

### 1. Update `src/lib/ai-client.js`

**Location:** Lines 30-36

**Current Code:**
```javascript
const CLAUDE_MODELS = {
  'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-20241022',
  'claude-3-5-sonnet': 'claude-3-5-sonnet-20241022',
  'claude-3-opus': 'claude-3-opus-20240229',
  'claude-3-haiku': 'claude-3-haiku-20240307',
  'default': 'claude-3-5-sonnet-20241022',
};
```

**Updated Code:**
```javascript
const CLAUDE_MODELS = {
  // Current models (January 2025)
  'claude-sonnet-4-5-20250929': 'claude-sonnet-4-5-20250929',  // Claude Sonnet 4.5 (primary)
  'claude-haiku-4-5-20251001': 'claude-haiku-4-5-20251001',    // Claude Haiku 4.5 (fast)
  'claude-opus-4-1-20250805': 'claude-opus-4-1-20250805',      // Claude Opus 4.1 (advanced)

  // Convenient aliases
  'claude-sonnet-4.5': 'claude-sonnet-4-5-20250929',
  'claude-haiku-4.5': 'claude-haiku-4-5-20251001',
  'claude-opus-4.1': 'claude-opus-4-1-20250805',
  'claude-sonnet': 'claude-sonnet-4-5-20250929',
  'default': 'claude-sonnet-4-5-20250929',  // PRIMARY MODEL
};
```

**Action:** ✅ Update model constant definitions

---

### 2. Update `netlify/functions/invoke-llm.js`

**Location:** Line 74

**Current Code:**
```javascript
model: model || 'claude-3-5-sonnet-20241022',
```

**Updated Code:**
```javascript
model: model || 'claude-sonnet-4-5-20250929',  // Claude Sonnet 4.5
```

**Action:** ✅ Update default model fallback

---

**Location:** Lines 57-59 (Add API version header)

**Current Code:**
```javascript
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

**Updated Code:**
```javascript
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-version': '2023-06-01'  // REQUIRED - current API version
  }
});
```

**Action:** ✅ Add API version header to all Anthropic client instances

---

### 3. Update `scripts/seed-agents.js`

**Location:** Multiple lines (61, 84, 112, 134, and more)

**Current Code:**
```javascript
default_model: 'claude-3-5-sonnet-20241022',
```

**Updated Code for Content Agents:**
```javascript
default_model: 'claude-sonnet-4-5-20250929',  // Sonnet 4.5 for content generation
```

**Updated Code for Simple Tasks:**
```javascript
default_model: 'claude-haiku-4-5-20251001',  // Haiku 4.5 for meta descriptions, titles
```

**Specific Agent Updates:**

| Agent | Current Model | New Model | Reason |
|-------|---------------|-----------|--------|
| `seo_content_writer` | `claude-3-5-sonnet-20241022` | `claude-sonnet-4-5-20250929` | Complex content generation |
| `content_optimizer` | `claude-3-5-sonnet-20241022` | `claude-sonnet-4-5-20250929` | Detailed analysis |
| `keyword_researcher` | `claude-3-5-sonnet-20241022` | `claude-sonnet-4-5-20250929` | Complex reasoning |
| `general_content_assistant` | `claude-3-5-sonnet-20241022` | `claude-sonnet-4-5-20250929` | Versatile tasks |
| `emma_promoter` | `claude-3-5-sonnet-20241022` | `claude-sonnet-4-5-20250929` | Content generation |
| `blog_post_generator` | `claude-3-5-sonnet-20241022` | `claude-sonnet-4-5-20250929` | Blog content |
| `page_optimizer` | `claude-3-5-sonnet-20241022` | `claude-sonnet-4-5-20250929` | Page analysis |
| `content_editor` | `claude-3-5-sonnet-20241022` | `claude-sonnet-4-5-20250929` | Content review |
| `meta_description_writer` | `claude-3-5-sonnet-20241022` | `claude-haiku-4-5-20251001` | Simple, fast task |

**Action:** ✅ Update all agent model definitions

---

### 4. Re-seed Database

After updating `seed-agents.js`, re-seed the database to update agent definitions:

```bash
npm run db:seed
```

**Action:** ✅ Re-seed agent definitions with new models

---

### 5. Add Error Handling (Exponential Backoff)

**Location:** `netlify/functions/invoke-llm.js`

Add retry logic for rate limit handling (429 errors):

```javascript
// Add this helper function at the top of the file
async function callWithRetry(fn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Handle rate limits (429) with exponential backoff
      if (error.status === 429 && attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
        const retryAfter = error.response?.headers?.['retry-after'];
        const actualWaitTime = retryAfter ? parseInt(retryAfter) * 1000 : waitTime;

        console.log(`Rate limited. Waiting ${actualWaitTime / 1000}s before retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, actualWaitTime));
        continue;
      }

      // Non-retryable error or max retries reached
      throw error;
    }
  }
}

// Wrap the Anthropic API call
const anthropicResponse = await callWithRetry(() =>
  anthropic.messages.create(requestParams)
);
```

**Action:** ✅ Implement exponential backoff for rate limit handling

---

### 6. Add Prompt Caching (Cost Optimization)

For agents with long system prompts, implement prompt caching:

```javascript
// In invoke-llm.js, modify system prompt structure
if (system_prompt) {
  requestParams.system = [
    {
      type: "text",
      text: system_prompt,
      cache_control: { type: "ephemeral" }  // Enable caching
    }
  ];
}
```

**Benefits:**
- 90% cost reduction on cached input tokens
- Cached tokens don't count toward rate limits
- 10x effective throughput increase

**Action:** ✅ Enable prompt caching for system prompts

---

## Testing Checklist

### Test 1: Basic API Call

```bash
# Start dev server
npm run dev

# Test basic agent invocation in browser console
```

```javascript
import { InvokeLLM } from '@/lib/perdia-sdk';

const response = await InvokeLLM({
  prompt: 'Say hello in 10 words or less',
  provider: 'claude',
  model: 'claude-sonnet-4-5-20250929'
});

console.log('Response:', response);
```

**Expected:** Response from Claude Sonnet 4.5 model
**Action:** ✅ Test basic API call

---

### Test 2: Agent System Prompt

```javascript
const response = await InvokeLLM({
  systemPrompt: 'You are an expert SEO writer.',
  messages: [
    { role: 'user', content: 'Write a meta description for online MBA programs' }
  ],
  provider: 'claude',
  model: 'claude-sonnet-4-5-20250929',
  temperature: 0.7,
  maxTokens: 200
});

console.log('Response:', response);
console.log('Model used:', response.model);
```

**Expected:** Response showing `claude-sonnet-4-5-20250929` model
**Action:** ✅ Test system prompt functionality

---

### Test 3: Multi-Turn Conversation

```javascript
import { agentSDK } from '@/lib/agent-sdk';

const conv = await agentSDK.createConversation({
  agent_name: 'seo_content_writer',
  initial_message: 'Write about online MBA programs'
});

const response = await agentSDK.sendMessage({
  conversation_id: conv.id,
  message: 'Make it more concise'
});

console.log('Response:', response);
```

**Expected:** Multi-turn conversation working with new model
**Action:** ✅ Test conversation flow

---

### Test 4: Error Handling

```javascript
// Force a rate limit by making rapid requests
const promises = Array(100).fill().map(() =>
  InvokeLLM({
    prompt: 'Test',
    provider: 'claude'
  })
);

try {
  await Promise.all(promises);
} catch (error) {
  console.log('Error handled:', error.message);
}
```

**Expected:** Rate limit errors handled gracefully with retries
**Action:** ✅ Test error handling and exponential backoff

---

## Verification Checklist

After completing all changes:

- [ ] `src/lib/ai-client.js` updated with new model IDs
- [ ] `netlify/functions/invoke-llm.js` default model updated
- [ ] `netlify/functions/invoke-llm.js` API version header added
- [ ] `scripts/seed-agents.js` all agent models updated
- [ ] Database re-seeded with `npm run db:seed`
- [ ] Exponential backoff implemented for rate limits
- [ ] Prompt caching enabled for system prompts
- [ ] Basic API call test passes
- [ ] System prompt test passes
- [ ] Multi-turn conversation test passes
- [ ] Error handling test passes
- [ ] Documentation updated (`CLAUDE.md`, `docs/ANTHROPIC_API_GUIDE.md`)

---

## Deployment Steps

### 1. Local Testing

```bash
# Test locally
npm run dev

# Run type checking
npm run type-check

# Build production bundle
npm run build
```

### 2. Update Netlify Environment Variables

Ensure Netlify has the correct environment variables:

```
ANTHROPIC_API_KEY=your_actual_key
OPENAI_API_KEY=your_actual_key
```

**Note:** Do NOT use `VITE_` prefix for serverless function environment variables in production.

### 3. Deploy to Netlify

```bash
# Deploy to production
git add .
git commit -m "fix: Update to Claude Sonnet 4.5 and fix Anthropic API integration"
git push origin main

# Or use Netlify CLI
netlify deploy --prod
```

### 4. Monitor Production

After deployment:

1. Check Netlify function logs for any errors
2. Test AI agent responses in production
3. Monitor Anthropic Console for usage: https://console.anthropic.com/settings/usage
4. Verify no 400/429 errors in logs

---

## Cost Impact Analysis

### Before Migration (Claude 3.5 Sonnet)

- Input: $3 per 1M tokens
- Output: $15 per 1M tokens
- No caching available

### After Migration (Claude Sonnet 4.5)

- Input: $3 per 1M tokens (same)
- Output: $15 per 1M tokens (same)
- **Cached input: $0.30 per 1M tokens (90% savings)**
- **Cached tokens don't count toward rate limits**

### Example: 100 Articles/Week

**Without caching:**
- Input: 70,000 tokens × $3/1M = $0.21
- Output: 300,000 tokens × $15/1M = $4.50
- **Total: $4.71/week**

**With caching (80% cache hit rate):**
- Cached: 40,000 tokens × $0.30/1M = $0.012
- Uncached: 30,000 tokens × $3/1M = $0.09
- Output: 300,000 tokens × $15/1M = $4.50
- **Total: $4.60/week**

**At higher volumes (1000+ articles/week), caching provides significant savings.**

---

## Troubleshooting

### Issue: "Model not found" error

**Cause:** Using old model ID or typo in model name

**Solution:**
1. Verify exact model ID: `claude-sonnet-4-5-20250929`
2. Check `ai-client.js` CLAUDE_MODELS constant
3. Ensure no hardcoded old model IDs

### Issue: Rate limit errors (429)

**Cause:** Exceeding RPM, ITPM, or OTPM limits

**Solution:**
1. Verify exponential backoff is implemented
2. Enable prompt caching to increase effective throughput
3. Monitor usage at https://console.anthropic.com/settings/usage
4. Consider upgrading to higher tier if needed

### Issue: API version errors

**Cause:** Missing `anthropic-version` header

**Solution:**
1. Add `defaultHeaders` to Anthropic client instantiation
2. Include `'anthropic-version': '2023-06-01'`

### Issue: High costs

**Cause:** Not using prompt caching

**Solution:**
1. Implement prompt caching for system prompts
2. Set appropriate `max_tokens` for each use case
3. Use Haiku 4.5 for simple tasks (70% cheaper)

---

## Additional Resources

- **Comprehensive Guide:** `docs/ANTHROPIC_API_GUIDE.md`
- **Project Documentation:** `CLAUDE.md`
- **Official Docs:** https://docs.claude.com/
- **API Reference:** https://docs.claude.com/en/api/messages
- **Rate Limits:** https://docs.claude.com/en/api/rate-limits
- **Anthropic Console:** https://console.anthropic.com/

---

## Sign-off

When all checklist items are complete:

- [ ] All code changes implemented
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Successfully deployed to production
- [ ] Production monitoring shows no errors
- [ ] Cost optimization (caching) enabled

**Migration Status:** ⏳ IN PROGRESS

**Completed By:** _______________
**Date:** _______________
**Notes:** _______________

---

**End of Checklist**
