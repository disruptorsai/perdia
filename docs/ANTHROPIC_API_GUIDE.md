# Anthropic Claude API - Comprehensive Guide

**Last Updated:** 2025-01-07
**Documentation Version:** 1.0.0
**Target Platform:** Perdia Education Platform

---

## Table of Contents

1. [Current Models (2025)](#current-models-2025)
2. [API Authentication & Headers](#api-authentication--headers)
3. [Messages API Structure](#messages-api-structure)
4. [Best Practices](#best-practices)
5. [Rate Limits & Optimization](#rate-limits--optimization)
6. [Error Handling](#error-handling)
7. [Cost Optimization](#cost-optimization)
8. [Migration from Old Models](#migration-from-old-models)
9. [Common Issues & Solutions](#common-issues--solutions)

---

## Current Models (2025)

### Active Models

As of January 2025, these are the **current, supported Claude models**:

| Model | Model ID | Context Window | Max Output | Pricing (Input/Output per 1M tokens) | Use Case |
|-------|----------|----------------|------------|--------------------------------------|----------|
| **Claude Sonnet 4.5** | `claude-sonnet-4-5-20250929` | 200K (1M with beta header) | 64K tokens | $3 / $15 | **PRIMARY**: Complex reasoning, coding, agents, content generation |
| **Claude Haiku 4.5** | `claude-haiku-4-5-20251001` | 200K tokens | 64K tokens | $1 / $5 | Speed-critical applications, simple tasks |
| **Claude Opus 4.1** | `claude-opus-4-1-20250805` | 200K tokens | 32K tokens | $15 / $75 | Advanced reasoning, specialized tasks |

### Legacy Models (Deprecated)

⚠️ **DO NOT USE THESE MODELS** - They are outdated and will be deprecated:

- ❌ `claude-3-5-sonnet-20241022` (OLD - Claude 3.5 Sonnet)
- ❌ `claude-3-opus-20240229` (OLD - Claude 3 Opus)
- ❌ `claude-3-haiku-20240307` (OLD - Claude 3 Haiku)
- ❌ `claude-sonnet-4-20250514` (OLD - Claude 4 Sonnet)
- ❌ `claude-3-7-sonnet-20250219` (OLD - Claude 3.7 Sonnet)

### Model Selection Strategy

**For Perdia Education Platform:**

✅ **Use `claude-sonnet-4-5-20250929` as the primary model** for:
- SEO content generation (1500-3000 word articles)
- Content optimization analysis
- Keyword research and clustering
- Multi-turn agent conversations
- Complex reasoning tasks

✅ **Use `claude-haiku-4-5-20251001` for**:
- Simple metadata generation (titles, descriptions)
- Quick keyword suggestions
- Real-time chat responses
- Tasks requiring low latency

🔴 **Avoid `claude-opus-4-1`** unless you need:
- Extreme reasoning capabilities
- Specialized analysis
- Tasks where cost is secondary to quality

---

## API Authentication & Headers

### Required Headers

Every API request to `https://api.anthropic.com/v1/messages` **must** include:

```javascript
{
  'x-api-key': process.env.ANTHROPIC_API_KEY,
  'anthropic-version': '2023-06-01',  // REQUIRED - Current API version
  'content-type': 'application/json'
}
```

### Optional Headers

**For 1M token context window** (Claude Sonnet 4.x only):

```javascript
{
  'anthropic-beta': 'context-1m-2025-08-07'
}
```

**For prompt caching** (HIGHLY RECOMMENDED):

```javascript
{
  'anthropic-beta': 'prompt-caching-2024-07-31'
}
```

---

## Messages API Structure

### Request Format

The Messages API uses a **conversation-based format** with alternating user/assistant messages.

#### Basic Request

```javascript
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 4000,
  "temperature": 0.7,
  "messages": [
    {
      "role": "user",
      "content": "Write an SEO article about online MBA programs"
    }
  ]
}
```

#### Request with System Prompt

```javascript
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 4000,
  "temperature": 0.7,
  "system": "You are an expert SEO content writer...",
  "messages": [
    {
      "role": "user",
      "content": "Write about online MBA programs"
    }
  ]
}
```

#### Multi-Turn Conversation

```javascript
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 4000,
  "messages": [
    {
      "role": "user",
      "content": "Write an article about online MBA programs"
    },
    {
      "role": "assistant",
      "content": "Here's a comprehensive article about online MBA programs..."
    },
    {
      "role": "user",
      "content": "Now make it more concise and add more statistics"
    }
  ]
}
```

#### Structured Output (JSON Schema)

For tasks requiring JSON responses (keyword research, analysis):

```javascript
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 4000,
  "temperature": 0.7,
  "messages": [
    {
      "role": "user",
      "content": "Analyze these keywords and return JSON with search_volume, difficulty, and intent"
    }
  ],
  "response_format": {
    "type": "json_object"
  }
}
```

**Note:** While Claude doesn't have native JSON schema enforcement like OpenAI, you can request JSON output in the prompt and parse the response.

### Response Format

```javascript
{
  "id": "msg_013Zva2CMHLNnXjNJJKqJ2EF",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Response text here..."
    }
  ],
  "model": "claude-sonnet-4-5-20250929",
  "stop_reason": "end_turn",  // or "max_tokens", "stop_sequence"
  "usage": {
    "input_tokens": 2095,
    "output_tokens": 503
  }
}
```

---

## Best Practices

### 1. Temperature Settings

| Task Type | Recommended Temperature | Reasoning |
|-----------|------------------------|-----------|
| SEO Content Writing | 0.7 - 0.8 | Creative yet consistent |
| Content Optimization | 0.5 - 0.6 | Analytical, structured recommendations |
| Keyword Research | 0.7 - 0.8 | Creative keyword discovery |
| Metadata Generation | 0.5 - 0.6 | Consistent, focused output |
| Chat Responses | 0.7 | Natural conversation |
| JSON/Structured Data | 0.3 - 0.5 | Deterministic output format |

### 2. Max Tokens Settings

| Content Type | Recommended max_tokens | Notes |
|--------------|----------------------|-------|
| Long-form articles (2500+ words) | 4000 - 8000 | Claude Sonnet 4.5 supports 64K max |
| Blog posts (800-1200 words) | 2000 - 3000 | Standard blog length |
| Meta descriptions | 200 - 300 | ~155 chars = ~50 tokens |
| Keyword suggestions | 1000 - 2000 | Lists and analysis |
| Content analysis | 2000 - 4000 | Detailed recommendations |

**Important:** `max_tokens` affects your **OTPM (Output Tokens Per Minute)** rate limit. Set it as low as feasible for your use case.

### 3. System Prompts

**DO:** Write clear, detailed system prompts that define:
- Role and expertise
- Output format expectations
- Tone and style guidelines
- Specific constraints or requirements

**DON'T:**
- Make system prompts longer than necessary (costs input tokens)
- Include task-specific instructions (put those in user messages)
- Repeat the same information in system and user prompts

**Example:**

```javascript
// ✅ GOOD
system: "You are an expert SEO content writer specializing in educational content. Write in an engaging, authoritative yet accessible tone. Use markdown formatting with clear H2/H3 structure."

// ❌ BAD
system: "You are an AI assistant that helps with content. Be helpful and nice. Write good content. Make it SEO friendly if needed. Use proper formatting."
```

### 4. Message Structure

**DO:**
- Use alternating user/assistant roles
- Keep conversation history concise (only include relevant context)
- Start conversations with clear, specific instructions

**DON'T:**
- Send consecutive messages with the same role (they'll be merged)
- Include unnecessarily long message history (costs input tokens)
- Put system-level instructions in user messages

### 5. Token Usage Optimization

**Monitor token usage:**
```javascript
const response = await anthropic.messages.create({...});
console.log('Input tokens:', response.usage.input_tokens);
console.log('Output tokens:', response.usage.output_tokens);
```

**Optimize input tokens:**
- Remove unnecessary conversation history in multi-turn chats
- Use prompt caching for repeated content (see below)
- Keep system prompts under 1000 tokens when possible

**Optimize output tokens:**
- Set `max_tokens` appropriately (don't default to 4000)
- Use stop sequences for predictable content formats
- Request concise formats when appropriate

---

## Rate Limits & Optimization

### Understanding Rate Limits

Anthropic uses a **token bucket algorithm** where capacity continuously replenishes rather than resetting at fixed intervals.

### Rate Limit Tiers

| Tier | Min Credit Purchase | Max Credit | RPM | ITPM | OTPM |
|------|---------------------|------------|-----|------|------|
| Tier 1 | $5 | $100 | 50 | 30,000 | 8,000 |
| Tier 2 | $40 | $500 | Higher | Higher | Higher |
| Tier 3 | $200 | $1,000 | Higher | Higher | Higher |
| Tier 4 | $400 | $5,000 | Higher | Higher | Higher |

**Rate Limit Types:**

1. **RPM (Requests Per Minute):** Raw API call count
2. **ITPM (Input Tokens Per Minute):** Uncached input tokens only
3. **OTPM (Output Tokens Per Minute):** Generated response tokens (estimated from `max_tokens`)

### Handling 429 Errors (Rate Limit Exceeded)

When you hit rate limits, the API returns a `429` status with helpful headers:

```javascript
// Response headers on 429 error
anthropic-ratelimit-requests-limit: 50
anthropic-ratelimit-requests-remaining: 0
anthropic-ratelimit-requests-reset: 2025-01-07T12:00:00Z
anthropic-ratelimit-tokens-limit: 30000
anthropic-ratelimit-tokens-remaining: 0
anthropic-ratelimit-tokens-reset: 2025-01-07T12:00:00Z
retry-after: 45  // Seconds to wait before retry
```

### Exponential Backoff Implementation

**ALWAYS implement exponential backoff for production:**

```javascript
async function callClaudeWithRetry(requestParams, maxRetries = 3) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await anthropic.messages.create(requestParams);
      return response;
    } catch (error) {
      if (error.status === 429) {
        attempt++;

        if (attempt >= maxRetries) {
          throw new Error('Max retries reached for rate limit');
        }

        // Calculate exponential backoff: 2^attempt seconds
        const waitTime = Math.pow(2, attempt) * 1000;

        // Use retry-after header if available
        const retryAfter = error.response?.headers?.['retry-after'];
        const actualWaitTime = retryAfter ? parseInt(retryAfter) * 1000 : waitTime;

        console.log(`Rate limited. Waiting ${actualWaitTime / 1000}s before retry ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, actualWaitTime));

        continue;
      }

      // Non-rate-limit error, throw immediately
      throw error;
    }
  }
}
```

### Prompt Caching (CRITICAL for Cost Reduction)

**Prompt caching can provide 90% cost savings and doesn't count toward rate limits.**

#### How It Works

1. Cached input tokens cost **10% of regular price** ($0.30 per 1M tokens instead of $3)
2. Cached input tokens **do NOT count toward ITPM rate limits**
3. Cache TTL: 5 minutes (refreshed on each use)
4. Works with system prompts, long context, and tool definitions

#### Implementation

```javascript
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 4000,
  "system": [
    {
      "type": "text",
      "text": "Long system prompt here...",
      "cache_control": { "type": "ephemeral" }
    }
  ],
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Frequently reused context...",
          "cache_control": { "type": "ephemeral" }
        },
        {
          "type": "text",
          "text": "Variable user request here"
        }
      ]
    }
  ]
}
```

**Use prompt caching for:**
- Agent system prompts (reused across conversations)
- Knowledge base documents
- Style guides and templates
- Long context that changes infrequently

**Example for Perdia:**

Cache the SEO Content Writer's system prompt since it's reused for every article:

```javascript
const cachedSystemPrompt = [
  {
    type: "text",
    text: agentDefinition.system_prompt,  // Long system prompt
    cache_control: { type: "ephemeral" }
  }
];

// This system prompt will be cached across all requests
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-5-20250929",
  max_tokens: 4000,
  system: cachedSystemPrompt,  // Cached - only pay 10% on cache hits
  messages: [{ role: "user", content: "Write about online MBA programs" }]
});
```

---

## Error Handling

### Common Error Codes

| Status Code | Error Type | Common Causes | Solution |
|-------------|-----------|---------------|----------|
| 400 | Bad Request | Invalid model ID, missing required fields, malformed JSON | Validate request structure |
| 401 | Unauthorized | Invalid or missing API key | Check `ANTHROPIC_API_KEY` env var |
| 403 | Forbidden | API key doesn't have access to requested resource | Verify API key permissions |
| 429 | Rate Limit | Exceeded RPM, ITPM, or OTPM limits | Implement exponential backoff |
| 500 | Server Error | Anthropic service issue | Retry with exponential backoff |
| 529 | Overloaded | Service temporarily overloaded | Wait and retry |

### Robust Error Handling Pattern

```javascript
async function invokeClaude(requestParams) {
  try {
    const response = await anthropic.messages.create(requestParams);

    // Check stop reason
    if (response.stop_reason === 'max_tokens') {
      console.warn('Response truncated due to max_tokens limit');
    }

    return {
      content: response.content[0].text,
      usage: response.usage,
      truncated: response.stop_reason === 'max_tokens'
    };

  } catch (error) {
    console.error('Claude API Error:', {
      status: error.status,
      type: error.error?.type,
      message: error.error?.message
    });

    // Handle specific error types
    if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a few moments.');
    } else if (error.status === 401) {
      throw new Error('Invalid API key. Please check your Anthropic API configuration.');
    } else if (error.status >= 500) {
      throw new Error('Anthropic service temporarily unavailable. Please try again.');
    }

    throw new Error(`Failed to invoke Claude: ${error.message}`);
  }
}
```

---

## Cost Optimization

### Pricing (Claude Sonnet 4.5)

- **Input:** $3 per 1M tokens
- **Output:** $15 per 1M tokens
- **Cached Input:** $0.30 per 1M tokens (90% savings)

### Cost Calculation Example

**Scenario:** Generate 100 SEO articles per week

- System prompt: 500 tokens (cached)
- User prompt: 200 tokens
- Output: 3000 tokens per article

**Without caching:**
```
Input:  (500 + 200) tokens × 100 articles = 70,000 tokens
Output: 3000 tokens × 100 articles = 300,000 tokens

Cost = (70,000 / 1,000,000 × $3) + (300,000 / 1,000,000 × $15)
     = $0.21 + $4.50
     = $4.71 per week
```

**With caching (80% cache hit rate):**
```
Cached input:  500 tokens × 80 articles = 40,000 tokens @ $0.30/1M
Uncached input: (500 + 200) × 20 + 200 × 80 = 30,000 tokens @ $3/1M
Output: 300,000 tokens @ $15/1M

Cost = (40,000 / 1,000,000 × $0.30) + (30,000 / 1,000,000 × $3) + (300,000 / 1,000,000 × $15)
     = $0.012 + $0.09 + $4.50
     = $4.60 per week (2% savings)
```

**At higher volumes (1000+ articles/week), caching provides significant savings.**

### Best Practices for Cost Reduction

1. **Use prompt caching** for system prompts and frequently reused context
2. **Set appropriate `max_tokens`** - don't default to high values
3. **Monitor token usage** via the Usage page in Anthropic Console
4. **Choose the right model:**
   - Use Haiku 4.5 for simple tasks (70% cheaper)
   - Use Sonnet 4.5 for complex content generation
   - Avoid Opus 4.1 unless absolutely necessary
5. **Optimize conversation history** - only include necessary context
6. **Use batch processing** when possible (50% cost savings on batch API)

---

## Migration from Old Models

### Current Issues in Perdia Codebase

❌ **Problem:** Codebase uses deprecated model `claude-3-5-sonnet-20241022`

**Files to Update:**

1. `src/lib/ai-client.js` - Line 31-36 (CLAUDE_MODELS)
2. `netlify/functions/invoke-llm.js` - Line 74 (default model)
3. `scripts/seed-agents.js` - All agent definitions (lines 61, 84, 112, 134, etc.)
4. Database `agent_definitions` table - All records

### Migration Steps

**Step 1: Update Model Constants**

```javascript
// OLD (in ai-client.js)
const CLAUDE_MODELS = {
  'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-20241022',
  'default': 'claude-3-5-sonnet-20241022',
};

// NEW
const CLAUDE_MODELS = {
  // Current models (2025)
  'claude-sonnet-4-5': 'claude-sonnet-4-5-20250929',
  'claude-haiku-4-5': 'claude-haiku-4-5-20251001',
  'claude-opus-4-1': 'claude-opus-4-1-20250805',

  // Aliases for convenience
  'claude-sonnet-4.5': 'claude-sonnet-4-5-20250929',
  'claude-sonnet': 'claude-sonnet-4-5-20250929',
  'default': 'claude-sonnet-4-5-20250929',
};
```

**Step 2: Update Netlify Function**

```javascript
// OLD (in invoke-llm.js line 74)
model: model || 'claude-3-5-sonnet-20241022',

// NEW
model: model || 'claude-sonnet-4-5-20250929',
```

**Step 3: Update Agent Seeds**

```javascript
// OLD (in seed-agents.js)
default_model: 'claude-3-5-sonnet-20241022',

// NEW
default_model: 'claude-sonnet-4-5-20250929',
```

**Step 4: Re-seed Database**

```bash
npm run db:seed
```

**Step 5: Add API Version Header**

In `netlify/functions/invoke-llm.js`, update the Anthropic client initialization:

```javascript
// OLD
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// NEW
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-version': '2023-06-01'
  }
});
```

---

## Common Issues & Solutions

### Issue 1: "Model not found" error

**Cause:** Using deprecated model ID

**Solution:** Update to current model IDs (`claude-sonnet-4-5-20250929`)

### Issue 2: Responses are truncated

**Cause:** `max_tokens` too low or hitting context window limit

**Solution:**
- Increase `max_tokens` if output is genuinely truncated
- Check `stop_reason` in response - if `max_tokens`, increase the limit
- For long content, break into multiple requests or use higher `max_tokens`

### Issue 3: Rate limit errors (429)

**Cause:** Exceeding RPM, ITPM, or OTPM limits

**Solution:**
- Implement exponential backoff (see example above)
- Use prompt caching to increase effective throughput
- Reduce `max_tokens` to lower OTPM estimate
- Upgrade to higher tier if consistently hitting limits

### Issue 4: High costs

**Cause:** Not using prompt caching, unnecessary tokens

**Solution:**
- Enable prompt caching for system prompts
- Optimize conversation history (remove old messages)
- Set appropriate `max_tokens` per use case
- Use Haiku 4.5 for simple tasks

### Issue 5: Inconsistent JSON output

**Cause:** Temperature too high, unclear instructions

**Solution:**
- Lower temperature to 0.3-0.5 for structured output
- Provide explicit JSON schema in prompt
- Add examples of expected format
- Request Claude to output ONLY valid JSON

### Issue 6: "Multiple GoTrueClient instances" warning

**Cause:** (This is Supabase-related, not Anthropic)

**Solution:** Always import from `@/lib/supabase-client`, never create new clients

---

## Testing Your Implementation

### 1. Test Basic Request

```javascript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1000,
  messages: [
    { role: 'user', content: 'Say hello in 10 words or less' }
  ]
});

console.log(response.content[0].text);
console.log('Input tokens:', response.usage.input_tokens);
console.log('Output tokens:', response.usage.output_tokens);
```

### 2. Test with System Prompt

```javascript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 2000,
  system: 'You are an expert SEO content writer.',
  messages: [
    { role: 'user', content: 'Write a meta description for an article about online MBA programs' }
  ]
});
```

### 3. Test Multi-Turn Conversation

```javascript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 2000,
  messages: [
    { role: 'user', content: 'What are the benefits of online MBA programs?' },
    { role: 'assistant', content: 'Online MBA programs offer flexibility...' },
    { role: 'user', content: 'Now list the top 5 most important benefits' }
  ]
});
```

### 4. Test Error Handling

```javascript
try {
  const response = await anthropic.messages.create({
    model: 'invalid-model-name',
    max_tokens: 1000,
    messages: [{ role: 'user', content: 'test' }]
  });
} catch (error) {
  console.log('Error status:', error.status);
  console.log('Error message:', error.error?.message);
}
```

---

## Additional Resources

- **Official Docs:** https://docs.claude.com/
- **API Reference:** https://docs.claude.com/en/api/messages
- **Rate Limits:** https://docs.claude.com/en/api/rate-limits
- **Prompt Caching:** https://docs.claude.com/en/docs/build-with-claude/prompt-caching
- **Anthropic Console:** https://console.anthropic.com/
- **Usage Dashboard:** https://console.anthropic.com/settings/usage

---

## Quick Reference

### Model IDs (Copy-Paste Ready)

```javascript
// PRIMARY (use this)
const PRIMARY_MODEL = 'claude-sonnet-4-5-20250929';

// FAST (for simple tasks)
const FAST_MODEL = 'claude-haiku-4-5-20251001';

// ADVANCED (specialized reasoning only)
const ADVANCED_MODEL = 'claude-opus-4-1-20250805';
```

### Standard Request Template

```javascript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 4000,
  temperature: 0.7,
  system: 'Your system prompt here',
  messages: [
    { role: 'user', content: 'Your user message here' }
  ]
});

const text = response.content[0].text;
const usage = response.usage;
```

### Exponential Backoff (Copy-Paste Ready)

```javascript
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const waitTime = Math.pow(2, i + 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
}

// Usage
const response = await withRetry(() =>
  anthropic.messages.create({...})
);
```

---

**End of Guide**

For questions or issues specific to Perdia implementation, reference this guide and check `src/lib/ai-client.js` and `netlify/functions/invoke-llm.js`.
