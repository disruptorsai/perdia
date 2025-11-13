# GROK API SETUP GUIDE

## Current Status: HTTP 403 - No Credits

**Error Message:**
```
"Your newly created teams doesn't have any credits yet.
You can purchase credits on https://console.x.ai/..."
```

**Root Cause:** The Grok API key is configured correctly in Supabase, but your xAI account has no billing/credits added.

---

## SOLUTION: Add Billing to xAI Account

### Step 1: Login to xAI Console
1. Go to: https://console.x.ai/
2. Login with your xAI account credentials

### Step 2: Add Billing/Credits
1. Navigate to your team page:
   - URL: https://console.x.ai/team/04003f1b-0ca2-4c08-bba2-54694da557f7
   - Or click "Team" → "Billing" in the console
2. Click "Purchase Credits" or "Add Payment Method"
3. Add a payment method (credit card)
4. Purchase credits (minimum amount)

### Step 3: Verify API Access
After adding billing, test the Grok API:

```bash
node scripts/test-grok.js
```

**Expected Result:**
```
✅ GROK API WORKING
Content: Online education provides flexible learning opportunities...
```

---

## Alternative: Switch to Claude or OpenAI

If you don't want to add billing to xAI, you can change the content generation provider:

### Option A: Use Claude (Recommended)
Claude Sonnet 4.5 is the primary model and works great for content generation.

**Change in UI:**
1. Go to Settings → AI Providers
2. Set Default Provider: `claude`

**Or edit your topics:**
- When creating articles, select "Claude" as the AI provider

### Option B: Use OpenAI
OpenAI GPT-4o also works well for content generation.

**Change in UI:**
1. Go to Settings → AI Providers
2. Set Default Provider: `openai`

---

## Grok Pricing Information

**xAI Grok API Pricing (as of Jan 2025):**
- **Grok-2:** ~$2-5 per 1M tokens (input + output)
- **Grok-2 Mini:** ~$0.50-1 per 1M tokens (faster, cheaper)

**Estimated Cost per Article:**
- 2500-word article: ~5000 tokens input + 3000 tokens output = 8000 tokens
- Cost per article: ~$0.03-0.05 (Grok-2) or ~$0.01 (Grok-2 Mini)
- 100 articles/week: ~$3-5/week ($12-20/month)

**Recommendation:**
- Start with $10-20 credit purchase
- Monitor usage for first week
- Set up billing alerts to avoid surprises

---

## Comparison: Claude vs Grok vs OpenAI

| Feature | Claude Sonnet 4.5 | Grok-2 | OpenAI GPT-4o |
|---------|-------------------|--------|---------------|
| **Quality** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Very Good | ⭐⭐⭐⭐⭐ Excellent |
| **Cost** | $3 input, $15 output per 1M | $2-5 per 1M | $2.50 input, $10 output per 1M |
| **Speed** | Fast | Very Fast | Fast |
| **SEO Content** | ⭐⭐⭐⭐⭐ Best | ⭐⭐⭐⭐ Great | ⭐⭐⭐⭐ Great |
| **Context** | 200k tokens | 128k tokens | 128k tokens |
| **Billing** | Already configured ✅ | Needs setup ❌ | Already configured ✅ |

**For Perdia Education:**
- **Primary:** Claude Sonnet 4.5 (best SEO content quality)
- **Secondary:** OpenAI GPT-4o (good alternative)
- **Optional:** Grok-2 (add billing if you want to use it)

---

## Testing After Setup

After adding billing to xAI, test all Edge Functions:

```bash
# Test Grok
node scripts/test-grok.js

# Test Perplexity (should already work)
node scripts/test-perplexity-detailed.js

# Test all Edge Functions
node scripts/test-edge-functions.js
```

---

## Troubleshooting

### Still Getting HTTP 403?
1. Wait 2-3 minutes after adding billing (account provisioning)
2. Redeploy Edge Function: `npx supabase functions deploy invoke-grok --project-ref yvvtsfgryweqfppilkvo`
3. Check xAI console for account status
4. Verify payment method was added successfully

### Need Help?
- xAI Support: https://x.ai/support
- xAI API Docs: https://docs.x.ai/
- Check Supabase logs: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/functions/invoke-grok

---

**Last Updated:** 2025-01-13
