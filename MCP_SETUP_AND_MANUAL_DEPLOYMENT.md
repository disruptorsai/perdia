# MCP SETUP & MANUAL DEPLOYMENT GUIDE

**Why MCPs Aren't Working + How to Fix Everything**

---

## 🤔 Why Your MCP Servers Aren't Working

### The Issue:

Your MCP servers **ARE configured** in `C:\Users\Disruptors\.cursor\mcp.json`, but they're not loading in this Claude Code session.

### Why This Happens:

**1. MCP Servers are IDE-Specific:**
- MCPs work in **Cursor IDE**, **Claude.ai Desktop**, or **Claude Code CLI**
- Each session needs to **explicitly load** them from the config
- They don't automatically work in every environment

**2. Session Isolation:**
- This Claude Code session may not have loaded your Cursor MCP config
- MCP servers run as separate processes that need to be started

**3. Authentication:**
- Even when loaded, MCPs need proper authentication
- Your config has the tokens, but the session might not be using them

---

## ✅ Your MCP Configuration (FROM mcp.json):

### Supabase MCP:
```json
{
  "command": "npx",
  "args": ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref=yvvtsfgryweqfppilkvo"],
  "env": {
    "SUPABASE_ACCESS_TOKEN": "sbp_2c4d45ee83f6f57f90da91b60f0dba2a99c1ef00",
    "SUPABASE_URL": "https://yvvtsfgryweqfppilkvo.supabase.co"
  }
}
```

### Netlify MCP:
```json
{
  "command": "npx",
  "args": ["-y", "@netlify/mcp@latest"],
  "env": {
    "NETLIFY_AUTH_TOKEN": "nfp_MnQi8ZEPrTaGqoT9TBdhba5k3BuDaQLBfb06",
    "NETLIFY_SITE_ID": "371d61d6-ad3d-4c13-8455-52ca33d1c0d4"
  }
}
```

---

## 🎯 Current Deployment Status (From Verification):

### ✅ COMPLETE:
- **Database Migration** - All 6 V2 tables exist
- **Environment Variables** - Supabase, Claude, OpenAI, Grok configured
- **Grok Edge Function** - Deployed (needs secret key in Supabase)

### ❌ TODO:
1. **Get Perplexity API Key** (5 min)
2. **Add Perplexity Key to .env.local** (1 min)
3. **Deploy Perplexity Edge Function** (5 min)
4. **Set API Keys in Supabase Secrets** (5 min)
5. **Test Everything** (5 min)

**Total Time:** ~20 minutes

---

## 📋 COMPLETE SETUP CHECKLIST

### ☑️ Step 1: Get Perplexity API Key

1. Go to: https://www.perplexity.ai/settings/api
2. Sign up / Log in
3. Click **"Generate API Key"**
4. Copy the key (starts with `pplx-`)

---

### ☑️ Step 2: Add to .env.local

**File:** `C:\Users\Disruptors\Documents\Disruptors Projects\perdia\.env.local`

**Find these lines (around line 54):**
```bash
PERPLEXITY_API_KEY=pplx-YOUR-KEY-HERE
VITE_PERPLEXITY_API_KEY=pplx-YOUR-KEY-HERE
```

**Replace with:**
```bash
PERPLEXITY_API_KEY=pplx-ACTUAL-KEY-FROM-STEP-1
VITE_PERPLEXITY_API_KEY=pplx-ACTUAL-KEY-FROM-STEP-1
```

---

### ☑️ Step 3: Set Secrets in Supabase

**Go to:** https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/vault

**Add these 2 secrets:**

#### Secret 1: GROK_API_KEY
- Click **"New secret"**
- **Name:** `GROK_API_KEY`
- **Secret:** `<COPY-FROM-.env.local-LINE-48>`
- **Note:** Copy the value from `GROK_API_KEY` in your `.env.local` file
- Click **"Create secret"**

#### Secret 2: PERPLEXITY_API_KEY
- Click **"New secret"** again
- **Name:** `PERPLEXITY_API_KEY`
- **Secret:** `pplx-YOUR-KEY-FROM-STEP-1`
- Click **"Create secret"**

**✅ Checkpoint:** You should see 2 new secrets in the vault list

---

### ☑️ Step 4: Deploy Perplexity Edge Function

**Go to:** https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/functions

#### 4a. Create New Function
- Click **"Create a new function"** (top right)
- **Function name:** `invoke-perplexity`
- Leave other settings as default

#### 4b. Paste Function Code

**Copy this entire code:**

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

#### 4c. Deploy
- Click **"Deploy function"** button (bottom right)
- Wait for deployment to complete (~30 seconds)
- Status should show **"Healthy"** ✅

---

### ☑️ Step 5: Add Environment Variables to Netlify

**Go to:** https://app.netlify.com/sites/perdia-education/settings/deploys#environment-variables

**Add these variables** (if not already present):

| Variable Name | Value |
|---------------|-------|
| `VITE_GROK_API_KEY` | `<COPY-FROM-.env.local-LINE-49>` |
| `VITE_PERPLEXITY_API_KEY` | `pplx-YOUR-KEY-FROM-STEP-1` |
| `VITE_DEFAULT_AI_PROVIDER` | `grok` |

**Note:** Copy the Grok key value from `VITE_GROK_API_KEY` in your `.env.local` file

**After adding:**
- Click **"Save"**
- Netlify will auto-redeploy (takes ~2 minutes)

---

### ☑️ Step 6: Test Everything

#### Test 1: Verify Environment Variables
```bash
cd "C:\Users\Disruptors\Documents\Disruptors Projects\perdia"
node scripts/verify-deployment.js
```

**Expected:** All 12 tests should pass ✅

#### Test 2: Test in Browser
1. Go to: https://perdia.netlify.app/v2/topics
2. Click **"Find New Questions"**
3. Should work without CORS errors! ✅

#### Test 3: Test Edge Functions Directly

**Test Perplexity:**
```bash
curl -X POST https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/invoke-perplexity \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dnRzZmdyeXdlcWZwcGlsa3ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTAzNDEsImV4cCI6MjA3Nzg2NjM0MX0._Axuo5yYtZTj2df0Azau8zExvZHeQgKYlJ90B3WJRdk" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is higher education?","model":"pplx-70b-online"}'
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

## 🎉 SUCCESS CRITERIA

After completing all steps:

- [ ] .env.local has Grok and Perplexity keys
- [ ] Supabase secrets vault shows 2 secrets (GROK_API_KEY, PERPLEXITY_API_KEY)
- [ ] Supabase Edge Functions shows 2 functions (invoke-grok, invoke-perplexity) - both "Healthy"
- [ ] Netlify environment variables include VITE_GROK_API_KEY and VITE_PERPLEXITY_API_KEY
- [ ] Verification script passes 12/12 tests
- [ ] "Find New Questions" button works in browser
- [ ] No CORS errors in browser console

---

## 🔧 Making MCPs Work (Future)

### Option 1: Restart Cursor/Claude Code

1. Close Cursor/Claude Code
2. Ensure `mcp.json` is in the right location: `C:\Users\Disruptors\.cursor\mcp.json`
3. Restart Cursor/Claude Code
4. MCPs should auto-load (check status bar)

### Option 2: Explicit MCP Commands

In Cursor, you can run MCP commands directly:
```
/mcp supabase list-functions
/mcp netlify list-sites
```

### Option 3: Use CLI Directly (What We Did)

Since MCPs weren't loading, we used direct CLI commands and manual dashboard setup instead - **THIS WORKS JUST AS WELL!**

---

## 📊 Final Deployment Checklist

| Component | Status | Notes |
|-----------|--------|-------|
| Database Migration | ✅ Complete | All 6 V2 tables exist |
| .env.local (Grok) | ✅ Complete | Key added |
| .env.local (Perplexity) | ⏳ Needs your key | Get from Perplexity.ai |
| Supabase Secrets (Grok) | ⏳ Do Step 3 | Add to vault |
| Supabase Secrets (Perplexity) | ⏳ Do Step 3 | Add to vault |
| Grok Edge Function | ✅ Deployed | Needs secret |
| Perplexity Edge Function | ⏳ Do Step 4 | Deploy via dashboard |
| Netlify Env Vars | ⏳ Do Step 5 | Add Grok & Perplexity |

**Time Remaining:** ~20 minutes if you follow the steps above!

---

## 🆘 If You Get Stuck

**Issue: "Function still not working"**
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)
- Wait 2 minutes for Netlify deployment

**Issue: "Can't find Perplexity API key page"**
- Go to: https://www.perplexity.ai/
- Click your profile (top right)
- Click "API" in the menu
- Click "Generate API Key"

**Issue: "Supabase secrets not saving"**
- Make sure you're logged into the correct Supabase account
- Try incognito browser if issues persist

---

**Next:** Once setup is complete, you can generate articles at:
https://perdia.netlify.app/v2/topics 🚀
