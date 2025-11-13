# PERDIA V2 DEPLOYMENT STATUS REPORT

**Generated:** 2025-11-12
**Status:** 🟡 85% Complete - 3 Manual Steps Remaining

---

## ✅ COMPLETED (Automated)

### 1. Database Migration
- **Status:** ✅ Complete
- **All 6 V2 tables exist:**
  - `articles` - Generated blog posts
  - `topic_questions` - Monthly top 50 questions
  - `feedback` - User feedback on articles
  - `quotes` - Real quotes from social media
  - `automation_schedule` - Auto-publish scheduling
  - `integrations` - WordPress connections

### 2. UI/UX Simplification
- **Status:** ✅ Complete
- **Navigation simplified:** 9+ items → 3 core screens
  - Approval Queue (`/v2/approval`)
  - Topics & Questions (`/v2/topics`)
  - Settings (`/v2/settings`)
- **V2 is default:** Root `/` redirects to `/v2`
- **Components created:**
  - `AppLayoutV2.jsx` - Simplified navigation
  - `DashboardV2.jsx` - V2 landing page

### 3. Environment Variables (.env.local)
- **Status:** ✅ Grok configured, ⚠️ Perplexity missing
- **Configured:**
  - ✅ `GROK_API_KEY` - Set in .env.local (line 48)
  - ✅ `VITE_GROK_API_KEY` - Set in .env.local (line 49)
- **Missing:**
  - ⚠️ `PERPLEXITY_API_KEY` - Placeholder (pplx-YOUR-KEY-HERE)
  - ⚠️ `VITE_PERPLEXITY_API_KEY` - Placeholder

### 4. Code Committed & Pushed
- **Status:** ✅ Complete
- **Branch:** `perdiav2`
- **Last commit:** 8e05a32 (UI/UX V2 overhaul)
- **Files changed:** 27 files (10,635 insertions)

### 5. Edge Function Code
- **Status:** ✅ Code exists in repository
- **Files:**
  - `supabase/functions/invoke-grok/index.ts` (158 lines)
  - `supabase/functions/invoke-perplexity/index.ts` (157 lines)
- **Deployment:** ⚠️ Needs manual deployment via dashboard

---

## 🟡 REMAINING TASKS (Manual - ~20 minutes)

### Task 1: Get Perplexity API Key (5 min)

**Step-by-Step:**

1. **Open Perplexity API page:**
   ```
   https://www.perplexity.ai/settings/api
   ```

2. **Sign up / Log in** to Perplexity account

3. **Click "Generate API Key"** button

4. **Copy the key** (starts with `pplx-`)

5. **Update .env.local:**
   ```bash
   # Find these lines (around line 54):
   PERPLEXITY_API_KEY=pplx-YOUR-KEY-HERE
   VITE_PERPLEXITY_API_KEY=pplx-YOUR-KEY-HERE

   # Replace with your actual key:
   PERPLEXITY_API_KEY=pplx-ACTUAL-KEY-FROM-STEP-4
   VITE_PERPLEXITY_API_KEY=pplx-ACTUAL-KEY-FROM-STEP-4
   ```

6. **Save the file**

---

### Task 2: Set Supabase Secrets (10 min)

**Navigate to Supabase Secrets Vault:**
```
https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/vault
```

**Add 2 secrets:**

#### Secret 1: GROK_API_KEY
1. Click **"New secret"** button (top right)
2. **Name:** `GROK_API_KEY`
3. **Secret:** `<COPY-FROM-.env.local-LINE-48>`
4. **Note:** Copy the value from `GROK_API_KEY` in your `.env.local` file
5. Click **"Create secret"**

#### Secret 2: PERPLEXITY_API_KEY
1. Click **"New secret"** again
2. **Name:** `PERPLEXITY_API_KEY`
3. **Secret:** `pplx-YOUR-KEY-FROM-TASK-1`
4. Click **"Create secret"**

**✅ Checkpoint:** You should see 2 secrets in the vault list

---

### Task 3: Deploy Edge Functions (5 min each)

**Navigate to Supabase Edge Functions:**
```
https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/functions
```

#### Deploy Function 1: invoke-grok

1. **Click "Create a new function"** (or "New function" button)

2. **Settings:**
   - **Name:** `invoke-grok`
   - Leave all other settings as default

3. **Code:** Copy and paste this entire code:

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

4. **Click "Deploy function"** button (bottom right)

5. **Wait for deployment** (~30 seconds)

6. **Verify:** Status should show **"Healthy"** ✅

---

#### Deploy Function 2: invoke-perplexity

1. **Click "Create a new function"** again

2. **Settings:**
   - **Name:** `invoke-perplexity`
   - Leave all other settings as default

3. **Code:** Copy and paste this entire code:

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

4. **Click "Deploy function"** button

5. **Wait for deployment** (~30 seconds)

6. **Verify:** Status should show **"Healthy"** ✅

---

### Task 4: Set Netlify Environment Variables (3 min)

**Navigate to Netlify Environment Variables:**
```
https://app.netlify.com/sites/perdia-education/settings/deploys#environment-variables
```

**Add these variables:**

| Variable Name | Value |
|---------------|-------|
| `VITE_GROK_API_KEY` | `<COPY-FROM-.env.local-LINE-49>` |
| `VITE_PERPLEXITY_API_KEY` | `pplx-YOUR-KEY-FROM-TASK-1` |
| `VITE_DEFAULT_AI_PROVIDER` | `grok` |

**Note:** Copy the Grok key value from `VITE_GROK_API_KEY` in your `.env.local` file (line 49)

**Steps:**
1. Click **"Add a variable"** for each row above
2. Enter **Key** (variable name) and **Value**
3. Leave scope as "All scopes" (default)
4. Click **"Save"** for each variable

**After adding:**
- Netlify will automatically redeploy (~2 minutes)
- Wait for "Published" status

---

## 🧪 TESTING (2 min)

### Test 1: Run Verification Script

```bash
cd "C:\Users\Disruptors\Documents\Disruptors Projects\perdia"
node scripts/verify-deployment.js
```

**Expected Output:**
```
Environment Variables: 4/4 ✓
Database Tables: 6/6 ✓
Edge Functions: 2/2 ✓
Total: 12/12 tests passed

🎉 ALL SYSTEMS OPERATIONAL - READY FOR DEPLOYMENT!
```

### Test 2: Test in Browser

1. **Open:** https://perdia.netlify.app/v2/topics

2. **Click "Find New Questions"** button

3. **Expected:** Should work without CORS errors! ✅

4. **Check console:** No red errors

---

## 📊 FINAL DEPLOYMENT CHECKLIST

Use this to track your progress:

- [ ] Task 1: Get Perplexity API key (5 min)
- [ ] Task 2: Set Supabase secrets (10 min)
  - [ ] GROK_API_KEY secret added
  - [ ] PERPLEXITY_API_KEY secret added
- [ ] Task 3: Deploy Edge Functions (10 min)
  - [ ] invoke-grok deployed and "Healthy"
  - [ ] invoke-perplexity deployed and "Healthy"
- [ ] Task 4: Set Netlify env vars (3 min)
  - [ ] VITE_GROK_API_KEY added
  - [ ] VITE_PERPLEXITY_API_KEY added
  - [ ] VITE_DEFAULT_AI_PROVIDER added
  - [ ] Netlify auto-redeploy completed
- [ ] Test 1: Verification script passes 12/12
- [ ] Test 2: "Find New Questions" works in browser

**Total Time:** ~20-25 minutes

---

## 🆘 TROUBLESHOOTING

### Issue: "Function still not working"
- **Solution:**
  - Clear browser cache (Ctrl+Shift+Delete)
  - Hard refresh (Ctrl+F5)
  - Wait 2 minutes for Netlify deployment

### Issue: "Can't find Perplexity API key page"
- **Solution:**
  - Go to: https://www.perplexity.ai/
  - Click your profile (top right)
  - Click "API" in the menu
  - Click "Generate API Key"

### Issue: "Supabase secrets not saving"
- **Solution:**
  - Make sure you're logged into the correct Supabase account
  - Try incognito browser if issues persist
  - Verify project ID is `yvvtsfgryweqfppilkvo`

### Issue: "CORS errors persist after deployment"
- **Solution:**
  - Verify both Edge Functions show "Healthy" status
  - Check that secrets are set in Supabase vault
  - Wait 2 minutes for function cold start
  - Hard refresh browser

---

## 🔗 QUICK LINKS

| Resource | URL |
|----------|-----|
| **Perplexity API** | https://www.perplexity.ai/settings/api |
| **Supabase Secrets Vault** | https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/vault |
| **Supabase Edge Functions** | https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/functions |
| **Netlify Environment Variables** | https://app.netlify.com/sites/perdia-education/settings/deploys#environment-variables |
| **Netlify Dashboard** | https://app.netlify.com/sites/perdia-education/overview |
| **Perdia V2 App** | https://perdia.netlify.app/v2/topics |

---

## 📖 WHY MCPs DIDN'T WORK

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

**3. API Authentication:**
- MCP tokens are for MCP server usage, not direct Management API access
- Management APIs require different authentication scopes

### How to Make MCPs Work in Future:

**Option 1: Restart Cursor/Claude Code**
1. Close Cursor/Claude Code completely
2. Ensure `mcp.json` is in: `C:\Users\Disruptors\.cursor\mcp.json`
3. Restart Cursor/Claude Code
4. MCPs should auto-load (check status bar for MCP indicators)

**Option 2: Use MCP Commands in Cursor**
In Cursor IDE, you can run MCP commands directly:
```
/mcp supabase list-functions
/mcp netlify list-sites
```

**Option 3: Manual Dashboard (What We Did)**
Since MCPs weren't loading, we used direct dashboard access - **THIS WORKS JUST AS WELL!**

---

## ✅ NEXT STEPS

Once you complete the 4 manual tasks above:

1. **Test the application:**
   ```
   https://perdia.netlify.app/v2/topics
   ```

2. **Monitor first articles:**
   - Generate 2-3 test articles
   - Verify quality and citations
   - Check cost per article (target: <$10)

3. **Train Sarah (primary reviewer):**
   - Show approval queue workflow
   - Explain 5-day SLA auto-approve
   - Document feedback process

4. **Production scale-up:**
   - Start with 10 articles/week
   - Monitor quality and cost
   - Scale to 100 articles/week

---

**Last Updated:** 2025-11-12
**Status:** 🟡 85% Complete - Ready for Final Steps
