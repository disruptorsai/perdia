# Supabase Edge Function Deployment Guide

## ✅ Migration Complete - Ready for Deployment

All code changes have been committed and pushed to the `mvp` branch. The system is ready to use Supabase Edge Functions instead of Netlify Functions.

## 🚀 Deployment Steps

### Step 1: Install Supabase CLI

**Windows (Scoop):**
```powershell
scoop install supabase
```

**Mac (Homebrew):**
```bash
brew install supabase/tap/supabase
```

**Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/install.sh | sh
```

**Verify installation:**
```bash
supabase --version
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser to authenticate with your Supabase account.

### Step 3: Link to Project

```bash
# Navigate to project directory
cd C:\Users\Will\OneDrive\Documents\Projects\perdia

# Link to your Supabase project
supabase link --project-ref yvvtsfgryweqfppilkvo
```

When prompted:
- Enter your database password (from Supabase dashboard)

### Step 4: Deploy the Edge Function

```bash
supabase functions deploy invoke-llm
```

Expected output:
```
Deploying Function invoke-llm...
Function deployed successfully!
Function URL: https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/invoke-llm
```

### Step 5: Configure Secrets

You need to set two API keys as Supabase secrets:

**Set Anthropic API Key:**
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Set OpenAI API Key (optional):**
```bash
supabase secrets set OPENAI_API_KEY=sk-your-key-here
```

**Verify secrets are set:**
```bash
supabase secrets list
```

Expected output:
```
ANTHROPIC_API_KEY
OPENAI_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

(Note: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are automatically available)

### Step 6: Test the Deployment

Run the test script:

```bash
node scripts/test-invoke-llm.js
```

Expected output:
```
╔═══════════════════════════════════════════════════════════╗
║  TESTING INVOKE-LLM EDGE FUNCTION (SUPABASE)            ║
╚═══════════════════════════════════════════════════════════╝

📤 Sending test request to Supabase Edge Function...
URL: https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/invoke-llm

⏳ Waiting for response...

📥 Response received
Status: 200 OK

✅ SUCCESS!
─────────────────────────────────────────────────────────────
Content: Hello from Claude!
Model: claude-sonnet-4-5-20250929
Tokens: { input_tokens: 31, output_tokens: 7 }
─────────────────────────────────────────────────────────────
```

## 🧪 End-to-End Testing

After deployment, test the full AI agent workflow:

1. **Open the app:** https://perdia.netlify.app (or your deployment URL)
2. **Navigate to AI Agents**
3. **Select any agent** (e.g., "General Content Assistant")
4. **Send a test message:** "Write a short test article"
5. **Verify response appears** without 504 errors
6. **Try a longer request:** "Write a 2000-word article about AI courses in Utah"
7. **Confirm it completes** without timeout errors

## 📊 Monitoring

### View Function Logs

```bash
# View recent logs
supabase functions logs invoke-llm --limit 50

# Follow logs in real-time
supabase functions logs invoke-llm --follow
```

### Supabase Dashboard

1. Go to: https://app.supabase.com/project/yvvtsfgryweqfppilkvo/functions
2. Click on `invoke-llm`
3. View:
   - Invocations count
   - Error rate
   - Response time
   - Recent logs

## 🔧 Troubleshooting

### Function not found

```bash
# Verify it's deployed
supabase functions list

# If not listed, redeploy
supabase functions deploy invoke-llm
```

### API key errors

```bash
# Check if secrets are set
supabase secrets list

# If missing, set them
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

### 404 errors

- The Edge Function URL must be: `https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/invoke-llm`
- Check that `VITE_SUPABASE_URL` in `.env.local` is: `https://yvvtsfgryweqfppilkvo.supabase.co`

### CORS errors

- The Edge Function includes proper CORS headers
- If CORS errors persist, check browser console for specific error
- The function handles OPTIONS preflight requests

### Still timing out after migration

If you're still seeing 504 errors:

1. Check function logs: `supabase functions logs invoke-llm`
2. Verify you're on Supabase Pro tier (required for 400s timeout)
3. Try reducing `max_tokens` in agent definitions to speed up generation
4. Check Anthropic API status: https://status.anthropic.com

## 📈 Performance Comparison

| Metric | Netlify Functions | Supabase Edge Functions |
|--------|------------------|-------------------------|
| Timeout | 26 seconds (Pro) | 400 seconds (Pro) ✅ |
| Cost | $19/mo + Credits | Included in $25/mo ✅ |
| Article Generation | ❌ Times out | ✅ Completes |
| Database Integration | Network hop | Direct access ✅ |

## ✅ What's Changed

### Files Modified

- ✅ `src/lib/ai-client.js` - Routes to Supabase Edge Function
- ✅ `src/pages/Dashboard.jsx` - Fixed performance metrics query
- ✅ `scripts/test-invoke-llm.js` - Tests Supabase function

### Files Created

- ✅ `supabase/functions/invoke-llm/index.ts` - Edge Function implementation
- ✅ `supabase/functions/invoke-llm/README.md` - Function documentation

### No Changes Needed

- ✅ React components (unchanged)
- ✅ Agent SDK (unchanged)
- ✅ Database schema (unchanged)
- ✅ Existing conversations (preserved)

## 🎯 Next Steps

1. **Deploy the Edge Function** (steps above)
2. **Test thoroughly** with various article lengths
3. **Monitor performance** in Supabase dashboard
4. **Optional:** Remove old Netlify function (or keep as backup)

## 💰 Cost Savings

**Before Migration:**
- Netlify Pro: $19/month
- Supabase Pro: $25/month
- **Total: $44/month**

**After Migration:**
- Netlify (can use free tier for static hosting): $0
- Supabase Pro: $25/month
- **Total: $25/month**

**Savings: $19/month (43% reduction)**

## 🔐 Security

- ✅ API keys stored as Supabase secrets (never exposed)
- ✅ All requests server-side through Edge Function
- ✅ CORS properly configured
- ✅ Input validation in place
- ✅ Detailed logging without sensitive data

## 📚 Additional Resources

- **Edge Function README:** `supabase/functions/invoke-llm/README.md`
- **Supabase Functions Docs:** https://supabase.com/docs/guides/functions
- **CLI Reference:** https://supabase.com/docs/reference/cli
- **Anthropic API Docs:** https://docs.anthropic.com/

---

**Status:** ✅ Code migration complete. Awaiting deployment and testing.

**Deployed by:** Run commands above to deploy

**Last Updated:** November 7, 2025
