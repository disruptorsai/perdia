# invoke-llm Edge Function - Deployment Test Results

**Deployment Date:** 2025-11-07
**Project:** Perdia Education Platform
**Project Ref:** yvvtsfgryweqfppilkvo
**Function URL:** https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/invoke-llm

## Deployment Summary

✅ **Status:** SUCCESSFULLY DEPLOYED AND TESTED

### Deployment Steps Completed

1. **Project Linked:** Connected to Supabase project `yvvtsfgryweqfppilkvo`
2. **Function Deployed:** `invoke-llm` Edge Function (Version 3)
3. **Secrets Configured:**
   - `ANTHROPIC_API_KEY` - Set successfully
   - `OPENAI_API_KEY` - Set successfully
4. **Deployment Verified:** Function status is ACTIVE

## Test Results

### Test 1: Claude API (Anthropic)

**Request:**
```bash
curl -X POST "https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/invoke-llm" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ANON_KEY]" \
  -d '{
    "provider": "claude",
    "model": "claude-sonnet-4-5",
    "prompt": "Say hello in exactly 5 words",
    "max_tokens": 100
  }'
```

**Response:**
```json
{
  "content": "Hello to you right now.",
  "usage": {
    "input_tokens": 15,
    "output_tokens": 9
  },
  "model": "claude-sonnet-4-5-20250929"
}
```

**Status:** ✅ SUCCESS

### Test 2: OpenAI API

**Request:**
```bash
curl -X POST "https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/invoke-llm" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ANON_KEY]" \
  -d '{
    "provider": "openai",
    "model": "gpt-4o-mini",
    "prompt": "Count from 1 to 3",
    "max_tokens": 50
  }'
```

**Response:**
```json
{
  "content": "1, 2, 3.",
  "usage": {
    "input_tokens": 14,
    "output_tokens": 8
  },
  "model": "gpt-4o-mini-2024-07-18"
}
```

**Status:** ✅ SUCCESS

## Function Details

**Function ID:** 8b589173-94ca-4d18-8f29-b25423a7131f
**Function Name:** invoke-llm
**Function Slug:** invoke-llm
**Status:** ACTIVE
**Version:** 3
**Updated:** 2025-11-07 22:00:14 UTC

## Configured Secrets

- `ANTHROPIC_API_KEY` ✅
- `OPENAI_API_KEY` ✅
- `SUPABASE_ANON_KEY` ✅ (auto-configured)
- `SUPABASE_SERVICE_ROLE_KEY` ✅ (auto-configured)
- `SUPABASE_URL` ✅ (auto-configured)
- `SUPABASE_DB_URL` ✅ (auto-configured)

## Usage in Application

### JavaScript/TypeScript Example

```javascript
import { supabase } from '@/lib/supabase-client';

async function callAI(prompt, provider = 'claude') {
  const { data, error } = await supabase.functions.invoke('invoke-llm', {
    body: {
      provider: provider,
      model: provider === 'claude' ? 'claude-sonnet-4-5' : 'gpt-4o',
      prompt: prompt,
      temperature: 0.7,
      max_tokens: 4000
    }
  });

  if (error) {
    console.error('Error calling AI:', error);
    return null;
  }

  return data;
}

// Example usage
const response = await callAI('Write a blog post about education', 'claude');
console.log(response.content);
console.log('Tokens used:', response.usage);
```

### With Conversation History

```javascript
const { data } = await supabase.functions.invoke('invoke-llm', {
  body: {
    provider: 'claude',
    model: 'claude-sonnet-4-5',
    messages: [
      { role: 'user', content: 'What is AI?' },
      { role: 'assistant', content: 'AI stands for...' },
      { role: 'user', content: 'Tell me more about machine learning' }
    ],
    system_prompt: 'You are an expert educator',
    temperature: 0.7,
    max_tokens: 2000
  }
});
```

## Key Features

1. **Dual Provider Support:** Both Anthropic Claude and OpenAI
2. **Long Timeout:** 400 seconds (Supabase Pro tier)
3. **Secure:** API keys stored as secrets, not exposed to client
4. **Conversation Support:** Multi-turn conversations with message history
5. **System Prompts:** Custom system instructions
6. **Token Tracking:** Returns usage statistics
7. **CORS Enabled:** Works from browser applications

## Performance Notes

- **Claude Response Time:** ~4 seconds for simple queries
- **OpenAI Response Time:** ~1.5 seconds for simple queries
- **Timeout Limit:** 400 seconds (much better than Netlify's 26s)
- **Token Tracking:** Both providers return input/output token counts

## Next Steps

1. Update `src/lib/ai-client.js` to use Supabase Edge Function instead of Netlify
2. Test with longer content generation (1500-2500 word articles)
3. Monitor function logs in Supabase Dashboard
4. Consider adding caching for repeated queries
5. Add rate limiting if needed

## Dashboard Links

- **Function Dashboard:** https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/functions
- **Function Logs:** https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/logs/edge-functions
- **Secrets Management:** https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/vault

---

**Deployed By:** Claude Code
**Deployment Method:** Supabase CLI (npx)
**Test Status:** All tests passed ✅
