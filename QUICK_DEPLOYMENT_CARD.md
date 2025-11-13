# ⚡ PERDIA V2 - QUICK DEPLOYMENT CARD

**Total Time:** ~15 minutes | **Status:** Ready to complete

---

## 🔑 STEP 1: Update .env.local with Perplexity Key

**File:** `C:\Users\Disruptors\Documents\Disruptors Projects\perdia\.env.local`

**Find line 54-55 and replace with your actual Perplexity key:**

```bash
PERPLEXITY_API_KEY=<YOUR-PERPLEXITY-KEY-HERE>
VITE_PERPLEXITY_API_KEY=<YOUR-PERPLEXITY-KEY-HERE>
```

**Save the file** (Ctrl+S)

---

## 🗄️ STEP 2: Add Supabase Secrets (5 min)

### Open Supabase Vault:
```
https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/vault
```

### Click "New secret" - Add Secret #1:
```
Name: GROK_API_KEY
Secret: <COPY-FROM-.env.local-LINE-48>
```
**Note:** Copy the value from `GROK_API_KEY` in your `.env.local` file (line 48)

**Click "Create secret"**

### Click "New secret" - Add Secret #2:
```
Name: PERPLEXITY_API_KEY
Secret: <YOUR-PERPLEXITY-KEY-FROM-STEP-1>
```
**Click "Create secret"**

✅ **Checkpoint:** You should see 2 secrets in the vault

---

## ⚙️ STEP 3: Deploy Edge Functions (10 min)

### Open Supabase Functions:
```
https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/functions
```

---

### 📦 Deploy Function 1: invoke-grok

1. **Click "Create a new function"** or **"New function"**

2. **Settings:**
   - Name: `invoke-grok`
   - Leave other settings as default

3. **Paste this code:**

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

4. **Click "Deploy function"** (bottom right)

5. **Wait ~30 seconds** - Status should show "Healthy" ✅

---

### 📦 Deploy Function 2: invoke-perplexity

1. **Click "Create a new function"** again

2. **Settings:**
   - Name: `invoke-perplexity`

3. **Paste this code:**

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

4. **Click "Deploy function"**

5. **Wait ~30 seconds** - Status should show "Healthy" ✅

✅ **Checkpoint:** Both functions show "Healthy" status

---

## 🌐 STEP 4: Add Netlify Environment Variables (3 min)

### Open Netlify Settings:
```
https://app.netlify.com/sites/perdia-education/settings/deploys#environment-variables
```

### Click "Add a variable" for each of these:

**Variable 1:**
```
Key: VITE_GROK_API_KEY
Value: <COPY-FROM-.env.local-LINE-49>
```
**Note:** Copy the value from `VITE_GROK_API_KEY` in `.env.local`

**Variable 2:**
```
Key: VITE_PERPLEXITY_API_KEY
Value: <YOUR-PERPLEXITY-KEY-FROM-STEP-1>
```

**Variable 3:**
```
Key: VITE_DEFAULT_AI_PROVIDER
Value: grok
```

**Click "Save"** for each

✅ **Netlify will auto-redeploy** (~2 minutes)

---

## ✅ STEP 5: Verify Deployment (2 min)

### Wait for Netlify Deploy

**Check status:**
```
https://app.netlify.com/sites/perdia-education/deploys
```

**Wait for:** Latest deploy shows "Published" ✅

### Test the Application

1. **Open Perdia V2:**
   ```
   https://perdia.netlify.app/v2/topics
   ```

2. **Click "Find New Questions"** button

3. **Expected:** Should work without CORS errors! ✅

4. **Press F12** to open browser console - should see no red errors

---

## 🧪 (Optional) Run Verification Script

```bash
cd "C:\Users\Disruptors\Documents\Disruptors Projects\perdia"
node scripts/verify-deployment.js
```

**Expected:**
```
Environment Variables: 4/4 ✓
Database Tables: 6/6 ✓
Edge Functions: 2/2 ✓
Total: 12/12 tests passed

🎉 ALL SYSTEMS OPERATIONAL!
```

---

## ✅ DEPLOYMENT CHECKLIST

Track your progress:

- [ ] Step 1: Updated .env.local with Perplexity key
- [ ] Step 2: Added 2 secrets to Supabase vault
  - [ ] GROK_API_KEY
  - [ ] PERPLEXITY_API_KEY
- [ ] Step 3: Deployed 2 Edge Functions
  - [ ] invoke-grok (Status: Healthy)
  - [ ] invoke-perplexity (Status: Healthy)
- [ ] Step 4: Added 3 Netlify environment variables
  - [ ] VITE_GROK_API_KEY
  - [ ] VITE_PERPLEXITY_API_KEY
  - [ ] VITE_DEFAULT_AI_PROVIDER
- [ ] Step 5: Netlify deploy completed (Status: Published)
- [ ] Test: "Find New Questions" works in browser
- [ ] Test: No CORS errors in console

---

## 🔗 QUICK LINKS

| Resource | URL |
|----------|-----|
| **Supabase Vault** | https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/vault |
| **Supabase Functions** | https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/functions |
| **Netlify Env Vars** | https://app.netlify.com/sites/perdia-education/settings/deploys#environment-variables |
| **Netlify Deploys** | https://app.netlify.com/sites/perdia-education/deploys |
| **Perdia V2 App** | https://perdia.netlify.app/v2/topics |
| **Perplexity API** | https://www.perplexity.ai/settings/api |

---

## 🎉 AFTER DEPLOYMENT

Once complete, you can:

1. **Generate test articles:**
   - Go to: https://perdia.netlify.app/v2/topics
   - Click "Find New Questions"
   - Select a question and generate an article

2. **Check approval queue:**
   - Go to: https://perdia.netlify.app/v2/approval
   - Review generated articles
   - Approve or request changes

3. **Monitor costs:**
   - Check Settings page for cost tracking
   - Target: <$10 per article

4. **Train team:**
   - Show Sarah (primary reviewer) the approval workflow
   - Document the 5-day SLA auto-approve process

---

**Last Updated:** 2025-11-12
**Estimated Completion Time:** 15-20 minutes
**Status:** ✅ Ready to deploy!
