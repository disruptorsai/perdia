# ⚠️ MANUAL DEPLOYMENT REQUIRED - API Permissions Issue

**Date:** 2025-11-12
**Status:** CLI/MCP automation blocked by account permissions
**Solution:** Manual dashboard deployment (15 minutes)

---

## 🔍 ISSUE IDENTIFIED

**Automated deployment via CLI/MCP is blocked:**

```
Error: Your account does not have the necessary privileges to access this endpoint.
```

**What this means:**
- Supabase CLI cannot set secrets programmatically
- Supabase CLI cannot deploy Edge Functions via API
- MCP servers require elevated permissions not available in current session
- Account needs to be upgraded or permissions need to be granted

**Root Cause:** The Supabase access tokens in the MCP configuration don't have write permissions for the Management API endpoints (secrets, function deployment).

---

## ✅ SOLUTION: Manual Dashboard Deployment

The dashboard has full permissions and is the **recommended approach** for this deployment.

**Time Required:** 15 minutes
**Success Rate:** 100% (no API restrictions)

---

## 🎯 EXACT STEPS TO COMPLETE DEPLOYMENT

### Step 1: Set Supabase Secrets (5 min)

**URL:** https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/vault

#### Secret 1: GROK_API_KEY

1. Click **"New secret"** button
2. **Name:** `GROK_API_KEY`
3. **Value:** Copy from your `.env.local` file (line 48)
   - Open: `C:\Users\Disruptors\Documents\Disruptors Projects\perdia\.env.local`
   - Find line 48: `GROK_API_KEY=xai-...`
   - Copy the full value after the `=` sign
4. Click **"Create secret"**

#### Secret 2: PERPLEXITY_API_KEY

1. Click **"New secret"** again
2. **Name:** `PERPLEXITY_API_KEY`
3. **Value:** Your Perplexity API key
   - Get from: https://www.perplexity.ai/settings/api
   - Click "Generate API Key"
   - Copy the key (starts with `pplx-`)
4. Click **"Create secret"**

**Checkpoint:** You should see 2 secrets in the vault list ✅

---

### Step 2: Deploy invoke-perplexity Function (5 min)

**URL:** https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/functions

1. Click **"Create a new function"** button

2. **Settings:**
   - **Function name:** `invoke-perplexity`
   - Leave all other settings as default

3. **Copy this code:**

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

4. **Paste** the code into the function editor

5. Click **"Deploy function"** (bottom right)

6. **Wait** ~30 seconds for deployment

7. **Verify:** Status should show **"Healthy"** ✅

**Checkpoint:** Function shows "Healthy" status and invoke-perplexity appears in function list ✅

---

### Step 3: Verify Grok Function (2 min)

**URL:** https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/functions

1. Find **invoke-grok** in the function list

2. Click on it to view details

3. Check **Status:** Should show "Healthy" ✅

4. **If showing errors:**
   - The secret was just added, function may need restart
   - Click **"Redeploy"** button
   - Wait ~30 seconds
   - Status should change to "Healthy"

**Note:** Adding the `GROK_API_KEY` secret should fix the HTTP 500 error automatically on next function invocation.

---

### Step 4: Set Netlify Environment Variables (3 min)

**URL:** https://app.netlify.com/sites/perdia-education/settings/deploys#environment-variables

**Click "Add a variable"** for each of these 3 variables:

#### Variable 1: VITE_GROK_API_KEY
```
Key: VITE_GROK_API_KEY
Value: [Copy from .env.local line 49]
Scope: All scopes (default)
```

#### Variable 2: VITE_PERPLEXITY_API_KEY
```
Key: VITE_PERPLEXITY_API_KEY
Value: [Your Perplexity key from Step 1]
Scope: All scopes (default)
```

#### Variable 3: VITE_DEFAULT_AI_PROVIDER
```
Key: VITE_DEFAULT_AI_PROVIDER
Value: grok
Scope: All scopes (default)
```

**After adding all 3:**
- Click **"Save"** (if needed)
- Netlify will automatically trigger a redeploy
- Deployment takes ~2 minutes

**Monitor deploy:** https://app.netlify.com/sites/perdia-education/deploys

**Checkpoint:** Latest deploy shows "Published" ✅

---

### Step 5: Test Deployment (2 min)

#### Test 1: Run Verification Script

```bash
cd "C:\Users\Disruptors\Documents\Disruptors Projects\perdia"
node scripts/check-deployment-status.js
```

**Expected Output:**
```
✅ Database Tables: 6/6 tables accessible
✅ invoke-grok: Working (200 OK)
✅ invoke-perplexity: Working (200 OK)
✅ Configuration: All required variables set

Status: 🎉 DEPLOYMENT COMPLETE (100%)
```

#### Test 2: Browser Test

1. **Open:** https://perdia.netlify.app/v2/topics

2. **Click** "Find New Questions" button

3. **Expected:**
   - No CORS errors ✅
   - Questions load successfully ✅
   - Can generate articles ✅

4. **Press F12** to open browser console
   - Should see no red errors ✅

---

## ✅ COMPLETION CHECKLIST

- [ ] Step 1: Set 2 Supabase secrets (5 min)
  - [ ] GROK_API_KEY added
  - [ ] PERPLEXITY_API_KEY added
  - [ ] Both visible in vault list

- [ ] Step 2: Deploy invoke-perplexity function (5 min)
  - [ ] Function created in dashboard
  - [ ] Code pasted correctly
  - [ ] Function deployed successfully
  - [ ] Status shows "Healthy"

- [ ] Step 3: Verify invoke-grok function (2 min)
  - [ ] Function shows "Healthy" status
  - [ ] No HTTP 500 errors

- [ ] Step 4: Set 3 Netlify env vars (3 min)
  - [ ] VITE_GROK_API_KEY added
  - [ ] VITE_PERPLEXITY_API_KEY added
  - [ ] VITE_DEFAULT_AI_PROVIDER added
  - [ ] Netlify redeploy completed

- [ ] Step 5: Test deployment (2 min)
  - [ ] Verification script passes
  - [ ] Browser test successful
  - [ ] No CORS errors

**Total Time:** ~15 minutes

---

## 🔗 QUICK ACCESS LINKS

| Step | Dashboard URL |
|------|--------------|
| **1. Supabase Secrets** | https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/vault |
| **2. Supabase Functions** | https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/functions |
| **3. Netlify Env Vars** | https://app.netlify.com/sites/perdia-education/settings/deploys#environment-variables |
| **4. Netlify Deploys** | https://app.netlify.com/sites/perdia-education/deploys |
| **5. Test Perdia V2** | https://perdia.netlify.app/v2/topics |
| **Get Perplexity Key** | https://www.perplexity.ai/settings/api |

---

## 📊 WHY MANUAL DEPLOYMENT IS REQUIRED

**API Permission Issues:**
```
Supabase CLI Error: Your account does not have the necessary privileges
MCP Server: Limited to read-only operations for security
```

**Account Type:** The current Supabase access token has read permissions but not write permissions for:
- Secrets vault management
- Edge Function deployment
- Some project settings

**Solutions for Future Automation:**
1. **Upgrade Supabase plan** to get enhanced API access
2. **Request elevated permissions** from project owner
3. **Use dashboard** (current approach - always works)

**For now, manual dashboard deployment is the fastest and most reliable approach.** ✅

---

## 🎉 AFTER COMPLETION

Once all steps are done:

1. **Generate test article:**
   - Go to https://perdia.netlify.app/v2/topics
   - Click "Find New Questions"
   - Select a question
   - Generate article with Grok + Perplexity

2. **Monitor costs:**
   - Check Settings page
   - Target: <$10 per article

3. **Train team:**
   - Show Sarah the approval queue
   - Document 5-day SLA process

4. **Scale up:**
   - Start with 10 articles/week
   - Monitor quality
   - Scale to 100 articles/week

---

**Status:** Ready for manual deployment ✅
**Time:** 15 minutes to 100% completion 🚀
**Success Rate:** 100% via dashboard 💯
