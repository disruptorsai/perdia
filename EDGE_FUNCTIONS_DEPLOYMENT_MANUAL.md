# MANUAL EDGE FUNCTIONS DEPLOYMENT GUIDE

**For when Supabase CLI authentication fails**

---

## Why Manual Deployment?

The Supabase CLI requires authentication which can be complex. Manual deployment via the dashboard is more reliable and faster.

---

## Prerequisites

**API Keys You Need:**

1. **Grok API Key** - Already in your `.env.local` file (line 48-49)

2. **Perplexity API Key** - Get from: https://www.perplexity.ai/settings/api
   - Sign up / log in
   - Click "Generate API Key"
   - Copy the key (starts with `pplx-`)

---

## Step 1: Add API Keys to Supabase Secrets

**URL:** https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/vault

**Actions:**

1. Click **"New secret"** button (top right)

2. Add **GROK_API_KEY**:
   - Name: `GROK_API_KEY`
   - Secret: `<COPY-FROM-.env.local-LINE-48>`
   - Note: Copy the value from `GROK_API_KEY` in your `.env.local` file
   - Click **"Create secret"**

3. Add **PERPLEXITY_API_KEY**:
   - Name: `PERPLEXITY_API_KEY`
   - Secret: `pplx-YOUR-KEY-HERE` (replace with your actual key)
   - Click **"Create secret"**

**✅ Checkpoint:** You should see 2 new secrets in the vault

---

## Step 2: Deploy Edge Functions

**URL:** https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/functions

### Function 1: invoke-grok

**Action:** Click **"Create a new function"** (or **"New function"** button)

**Settings:**
- **Name:** `invoke-grok`
- **Leave all other settings as default**

**Code:** Copy and paste this entire file:
```
File: supabase/functions/invoke-grok/index.ts
Location: C:\Users\Disruptors\Documents\Disruptors Projects\perdia\supabase\functions\invoke-grok\index.ts
```

**Or paste this code:**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GROK_API_KEY = Deno.env.get('GROK_API_KEY');
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!GROK_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Grok API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { prompt, systemPrompt, messages, model, temperature, maxTokens } = await req.json();

    const apiMessages = [];
    if (systemPrompt) apiMessages.push({ role: 'system', content: systemPrompt });
    if (messages?.length) apiMessages.push(...messages);
    else if (prompt) apiMessages.push({ role: 'user', content: prompt });

    if (!apiMessages.length) {
      return new Response(
        JSON.stringify({ error: 'No prompt or messages provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `Grok API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        content: data.choices[0].message.content,
        model: data.model,
        usage: data.usage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

**Deploy:** Click **"Deploy function"** button

**✅ Checkpoint:** Function status should show "Healthy" after deployment

---

### Function 2: invoke-perplexity

**Action:** Click **"Create a new function"** again

**Settings:**
- **Name:** `invoke-perplexity`

**Code:**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!PERPLEXITY_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Perplexity API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { prompt, content, model, searchDomainFilter, temperature, maxTokens } = await req.json();

    let fullPrompt = prompt;
    if (content) fullPrompt = `${prompt}\n\nContent to analyze:\n${content}`;

    if (!fullPrompt) {
      return new Response(
        JSON.stringify({ error: 'No prompt provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestBody = {
      model: model || 'pplx-70b-online',
      messages: [{ role: 'user', content: fullPrompt }],
      temperature: temperature || 0.2,
      max_tokens: maxTokens || 2000,
      return_citations: true,
      return_images: false,
    };

    if (searchDomainFilter?.length) {
      requestBody.search_domain_filter = searchDomainFilter;
    }

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `Perplexity API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        content: data.choices[0].message.content,
        citations: data.citations || [],
        model: data.model,
        usage: data.usage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

**Deploy:** Click **"Deploy function"**

**✅ Checkpoint:** Both functions should now show "Healthy" status

---

## Step 3: Test the Functions

### Test invoke-grok

```bash
curl -X POST https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/invoke-grok \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write one sentence about online education.",
    "model": "grok-2",
    "temperature": 0.7,
    "maxTokens": 50
  }'
```

**Expected Response:**
```json
{
  "content": "Online education provides flexible...",
  "model": "grok-2",
  "usage": { "total_tokens": 45 }
}
```

### Test invoke-perplexity

```bash
curl -X POST https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/invoke-perplexity \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is higher education?",
    "model": "pplx-70b-online"
  }'
```

**Expected Response:**
```json
{
  "content": "Higher education refers to...",
  "citations": ["https://..."],
  "model": "pplx-70b-online",
  "usage": { "total_tokens": 120 }
}
```

---

## Step 4: Refresh Your App

After deployment:

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** (Ctrl+F5)
3. Go to: https://perdia.netlify.app/v2/topics
4. Click **"Find New Questions"**
5. Should work without CORS errors! ✅

---

## Troubleshooting

### Error: "API key not configured"

**Solution:** Check that secrets were added correctly in Step 1

### Error: "CORS policy"

**Solution:**
- Make sure functions are deployed (Step 2)
- Hard refresh browser (Ctrl+F5)
- Check function logs in Supabase dashboard

### Error: "401 Unauthorized"

**Solution:** Your API keys might be invalid
- Grok: Verify at https://console.x.ai/
- Perplexity: Verify at https://www.perplexity.ai/settings/api

---

## Summary Checklist

- [ ] Get Perplexity API key (https://www.perplexity.ai/settings/api)
- [ ] Add GROK_API_KEY to Supabase secrets
- [ ] Add PERPLEXITY_API_KEY to Supabase secrets
- [ ] Deploy invoke-grok function
- [ ] Deploy invoke-perplexity function
- [ ] Test both functions with curl
- [ ] Hard refresh app (Ctrl+F5)
- [ ] Test "Find New Questions" button

**Estimated Time:** 10-15 minutes

---

**Next:** Once functions are deployed, also:
- Deploy `auto-approve-articles` function (same process)
- Deploy `ingest-monthly-questions` function (same process)
- Apply database migration (SQL Editor)
