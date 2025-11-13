# 🔧 TROUBLESHOOTING: Edge Functions Returning HTTP 500

**Issue:** Both `invoke-grok` and `invoke-perplexity` are returning HTTP 500 errors with message: "API key not configured"

**Error in browser console:**
```
Failed to load resource: the server responded with a status of 500
[Perplexity] API error: FunctionsHttpError: Edge Function returned a non-2xx status code
```

---

## 🔍 ROOT CAUSE

The Edge Functions are **deployed** but cannot access the API keys from environment variables. This happens when:

1. ❌ Secrets weren't added to Supabase vault
2. ❌ Secrets were added but functions need restart to pick them up
3. ❌ Secret names don't match what the functions expect

---

## ✅ SOLUTION: 3-Step Fix (5 minutes)

### Step 1: Verify Secrets in Supabase Vault (2 min)

**Open:** https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/vault

**You MUST see these 2 secrets:**

| Secret Name | Value Should Start With | Status |
|-------------|------------------------|--------|
| `GROK_API_KEY` | `xai-` | ❓ Check this |
| `PERPLEXITY_API_KEY` | `pplx-` | ❓ Check this |

**If BOTH secrets are there:** Go to Step 2 (restart functions)

**If either secret is MISSING:** Add them now:

#### Add GROK_API_KEY:
1. Click "New secret"
2. Name: `GROK_API_KEY`
3. Value: Open your `.env.local` file (line 48) and copy the value after `GROK_API_KEY=`
4. Click "Create secret"

#### Add PERPLEXITY_API_KEY:
1. Click "New secret"
2. Name: `PERPLEXITY_API_KEY`
3. Value: Your Perplexity API key (starts with `pplx-`)
   - If you don't have it yet: https://www.perplexity.ai/settings/api
4. Click "Create secret"

---

### Step 2: Restart Edge Functions (2 min)

Secrets are only loaded when functions start. After adding secrets, you MUST restart the functions.

**Open:** https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/functions

#### Restart invoke-grok:
1. Click on **invoke-grok** function name
2. Look for **"Redeploy"** or **"Restart"** button
3. Click it
4. Wait ~30 seconds
5. Status should show "Healthy" ✅

#### Restart invoke-perplexity:
1. Click on **invoke-perplexity** function name
2. Look for **"Redeploy"** or **"Restart"** button
3. Click it
4. Wait ~30 seconds
5. Status should show "Healthy" ✅

**Alternative if no Redeploy button:**

If you don't see a "Redeploy" button, you can trigger a restart by making a tiny edit:

1. Click on the function name
2. Click "Edit function" or similar
3. Add a space or comment at the end of the code
4. Click "Deploy function"
5. This will restart the function with the new secrets

---

### Step 3: Test Again (1 min)

**Run this command:**

```bash
cd "C:\Users\Disruptors\Documents\Disruptors Projects\perdia"
node scripts/test-edge-functions.js
```

**Expected output:**
```
✅ Grok is WORKING!
✅ Perplexity is WORKING!

🎉 ALL EDGE FUNCTIONS WORKING!
✅ Deployment is 100% complete!
```

**Or test in browser:**

1. Go to: https://perdia.netlify.app/v2/topics
2. Click "Find New Questions"
3. Should work without 500 errors! ✅

---

## 🚨 STILL NOT WORKING?

### Check Function Logs

**Open function logs to see exact error:**

1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/functions
2. Click on **invoke-perplexity** (or invoke-grok)
3. Click **"Logs"** tab
4. Look for error messages

**Common log errors:**

**Error: "PERPLEXITY_API_KEY is undefined"**
- **Fix:** Secret wasn't added to vault, go back to Step 1

**Error: "Invalid API key"**
- **Fix:** Wrong API key, verify it works at https://www.perplexity.ai/settings/api

**Error: "Rate limit exceeded"**
- **Fix:** Wait a few minutes, then try again

---

## 🔐 SECRET NAMES MUST MATCH EXACTLY

The Edge Functions look for these EXACT environment variable names:

| Function | Expected Variable Name |
|----------|----------------------|
| invoke-grok | `GROK_API_KEY` |
| invoke-perplexity | `PERPLEXITY_API_KEY` |

**Case-sensitive!** `GROK_API_KEY` ≠ `Grok_Api_Key` ≠ `grok_api_key`

If you named them differently in the vault, the functions won't find them.

---

## ✅ VERIFICATION CHECKLIST

Before running the test script, verify:

- [ ] ✅ Both secrets exist in Supabase vault
  - `GROK_API_KEY` (starts with `xai-`)
  - `PERPLEXITY_API_KEY` (starts with `pplx-`)

- [ ] ✅ Secret names match EXACTLY (case-sensitive)

- [ ] ✅ Both functions redeployed/restarted after adding secrets

- [ ] ✅ Function status shows "Healthy" in dashboard

- [ ] ✅ Waited at least 30 seconds after restart

---

## 📊 QUICK DIAGNOSTIC

**Run this to see exactly what's wrong:**

```bash
cd "C:\Users\Disruptors\Documents\Disruptors Projects\perdia"
node scripts/test-edge-functions.js
```

This will show:
- ✅ If functions are reachable
- ✅ Exact error messages from functions
- ✅ Whether API keys are being found

---

## 🎯 EXPECTED BEHAVIOR AFTER FIX

**Before Fix (Current):**
```javascript
// Function returns:
{
  "error": "Perplexity API key not configured"
}
// HTTP 500
```

**After Fix:**
```javascript
// Function returns:
{
  "content": "Higher education refers to...",
  "citations": ["https://..."],
  "model": "pplx-70b-online"
}
// HTTP 200
```

---

## 💡 WHY THIS HAPPENS

Supabase Edge Functions run in isolated Deno environments. They don't have access to:
- ❌ Your local `.env.local` file
- ❌ Your local environment variables
- ❌ Netlify environment variables

They ONLY have access to:
- ✅ Secrets set in Supabase Secrets Vault
- ✅ Only after the function restarts

**That's why secrets must be:**
1. Added to Supabase vault (not just .env.local)
2. Functions must restart after secrets are added

---

## 🔗 QUICK LINKS

| Action | URL |
|--------|-----|
| **Supabase Secrets** | https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/vault |
| **Supabase Functions** | https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/functions |
| **Get Perplexity Key** | https://www.perplexity.ai/settings/api |
| **Test in Browser** | https://perdia.netlify.app/v2/topics |

---

## ⏱️ TIME TO FIX

- **If secrets are already in vault:** 2 minutes (just restart functions)
- **If secrets are missing:** 5 minutes (add secrets + restart)

---

**Next Step:** Go to Step 1 and verify secrets in Supabase vault! 🚀
