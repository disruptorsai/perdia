# Invoke-LLM Edge Function

Supabase Edge Function for securely handling AI API calls to Anthropic Claude and OpenAI.

## Why Supabase Edge Functions?

**Migrated from Netlify Functions (Nov 2025)** for better performance:

- **400-second timeout** (Supabase Pro) vs 26-second (Netlify Pro)
- Already paying $25/month for Supabase Pro
- Consolidated infrastructure (one platform vs two)
- Better integration with Supabase database
- 15x longer timeout allows full article generation

## Deployment

### Prerequisites

1. Supabase CLI installed: `npm install -g supabase`
2. Logged in: `supabase login`
3. Linked to project: `supabase link --project-ref your-project-ref`

### Deploy Function

```bash
# Deploy invoke-llm function
supabase functions deploy invoke-llm

# Verify deployment
supabase functions list
```

### Configure Secrets

```bash
# Set Anthropic API key
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# Set OpenAI API key (optional)
supabase secrets set OPENAI_API_KEY=sk-...

# Verify secrets
supabase secrets list
```

## Usage

### From Client (via ai-client.js)

```javascript
import { invokeLLM } from '@/lib/ai-client';

const response = await invokeLLM({
  provider: 'claude',
  model: 'claude-sonnet-4-5',
  prompt: 'Write an SEO article...',
  temperature: 0.7,
  maxTokens: 4000
});
```

### Direct API Call

```bash
# Using curl
curl -X POST https://your-project-ref.supabase.co/functions/v1/invoke-llm \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "claude",
    "model": "claude-sonnet-4-5",
    "messages": [{"role": "user", "content": "Hello!"}],
    "temperature": 0.7,
    "max_tokens": 100
  }'
```

## Testing

```bash
# Run test script
node scripts/test-invoke-llm.js

# View function logs
supabase functions logs invoke-llm

# Follow logs in real-time
supabase functions logs invoke-llm --follow
```

## Supported Providers

### Anthropic Claude (Primary)

- **claude-sonnet-4-5** - Latest Claude 4.5 Sonnet (recommended)
- **claude-haiku-4-5** - Fast, cost-effective
- **claude-opus-4-1** - Most capable, higher cost

### OpenAI (Secondary)

- **gpt-4o** - Latest GPT-4 (recommended)
- **gpt-4o-mini** - Cost-effective
- **gpt-3.5-turbo** - Fast, lower cost

## Request Format

```typescript
{
  provider: 'claude' | 'openai',
  model?: string,  // Optional, defaults set
  prompt?: string,  // Simple mode
  messages?: Array<{role: string, content: string}>,  // Conversation mode
  system_prompt?: string,
  temperature?: number,  // 0-1, default 0.7
  max_tokens?: number,  // Default 4000
  response_json_schema?: object  // For structured output
}
```

## Response Format

```typescript
{
  content: string,  // AI-generated text
  usage: {
    input_tokens: number,
    output_tokens: number
  },
  model: string  // Actual model used
}
```

## Timeout Limits

- **Request timeout**: 150 seconds (waiting for API response)
- **Wall clock timeout**: 400 seconds (total function execution)
- **CPU time**: 2 seconds (not including async I/O)

These limits are more than sufficient for article generation (typically 15-60 seconds).

## Error Handling

The function returns detailed error information:

```typescript
{
  error: string,  // Error type
  message: string,  // Error message
  details: string  // Additional context
}
```

## Monitoring

```bash
# View recent logs
supabase functions logs invoke-llm --limit 50

# Follow logs in real-time
supabase functions logs invoke-llm --follow

# View function stats in dashboard
# https://app.supabase.com/project/your-project-ref/functions
```

## Cost Optimization

### Claude 4.5 Sonnet
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens
- Typical 2000-word article: ~$0.10-0.20

### OpenAI GPT-4o
- Input: $2.50 per 1M tokens
- Output: $10 per 1M tokens
- Similar costs to Claude

### Tips
- Use `max_tokens` to limit response length
- Cache system prompts when possible
- Use Haiku/Mini models for simple tasks
- Monitor token usage in function logs

## Troubleshooting

### Function not responding

```bash
# Check if deployed
supabase functions list

# Check logs
supabase functions logs invoke-llm --limit 100

# Redeploy
supabase functions deploy invoke-llm
```

### API Key errors

```bash
# Verify secrets are set
supabase secrets list

# Reset if needed
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

### Timeout errors

- Edge Functions have 400s timeout (Pro tier)
- If timing out, check for:
  - Very large `max_tokens` values
  - Network connectivity issues
  - API provider outages

### CORS errors

- Function includes proper CORS headers
- Handles OPTIONS preflight requests
- Allows all origins (can be restricted if needed)

## Development

### Local Testing

```bash
# Serve function locally
supabase functions serve invoke-llm

# Test against local function
# Update test script URL to: http://localhost:54321/functions/v1/invoke-llm
```

### File Structure

```
supabase/functions/invoke-llm/
├── index.ts       # Main function code
└── README.md      # This file
```

## Security

- ✅ API keys stored as Supabase secrets (never exposed to client)
- ✅ All requests go through Edge Function (server-side)
- ✅ CORS headers properly configured
- ✅ Input validation for all parameters
- ✅ Detailed error logging without exposing sensitive data

## Migration Notes

**From Netlify Functions:**
- Updated `ai-client.js` to use Supabase function URL
- Secrets moved from Netlify env vars to Supabase secrets
- No code changes needed in React components
- Test script updated for Supabase

**Benefits:**
- 15x longer timeout (26s → 400s)
- No additional infrastructure costs
- Better database integration
- Simplified deployment workflow
