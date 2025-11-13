# NETLIFY vs SUPABASE SECRETS CONFIGURATION GUIDE

**Last Updated:** 2025-11-13
**Architecture:** Frontend (Netlify) + Backend (Supabase Edge Functions)
**Status:** ✅ Production Configuration

---

## 🎯 **Core Principle: Secrets Go Where They're Used**

| Location | Purpose | Security Level |
|----------|---------|----------------|
| **Netlify** | Frontend build-time variables | ⚠️ PUBLIC (embedded in browser JS) |
| **Supabase Secrets** | Backend runtime variables | 🔒 PRIVATE (server-side only) |

**Key Rule:** Only `VITE_*` variables in Netlify. Everything else goes to Supabase.

---

## 📊 **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React App (from Netlify CDN)                        │  │
│  │  - Contains all VITE_* variables (PUBLIC)            │  │
│  │  - VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY         │  │
│  └──────────────────────────────────────────────────────┘  │
│              ↓ (calls)                                      │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│               SUPABASE (Backend)                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Edge Functions (invoke-llm, wordpress-publish, etc) │  │
│  │  - Reads Supabase Secrets (PRIVATE)                  │  │
│  │  - ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.           │  │
│  └──────────────────────────────────────────────────────┘  │
│              ↓ (calls)                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  External APIs (Claude, OpenAI, WordPress, etc.)     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Critical:** Netlify doesn't run ANY backend functions. All AI calls happen in Supabase Edge Functions.

---

## ✅ **NETLIFY CONFIGURATION (Build-Time Only)**

### **What Should Be in Netlify**

```bash
# ============================================================================
# SUPABASE CONNECTION (PUBLIC - Safe for Browser)
# ============================================================================
VITE_SUPABASE_URL=https://yvvtsfgryweqfppilkvo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================================
# APPLICATION CONFIG (PUBLIC)
# ============================================================================
VITE_DEFAULT_AI_PROVIDER=claude
VITE_APP_URL=https://perdia-education.netlify.app

# ============================================================================
# FEATURE FLAGS (PUBLIC)
# ============================================================================
VITE_ENABLE_DEBUG_MODE=false
VITE_ENABLE_IMAGE_GENERATION=true
VITE_ENABLE_SOCIAL_POSTING=true
VITE_ENABLE_TEAM_CHAT=true

# ============================================================================
# FRONTEND-ONLY INTEGRATIONS (If Used Client-Side)
# ============================================================================
# DataForSEO (if keyword research happens in browser)
VITE_DATAFORSEO_LOGIN=your_email
VITE_DATAFORSEO_PASSWORD=your_password

# Cloudinary (PUBLIC read-only key for image URLs)
VITE_CLOUDINARY_CLOUD_NAME=dvcvxhzmt
VITE_CLOUDINARY_API_KEY=123456789012345  # Read-only public key

# ============================================================================
# BUILD CONFIGURATION (Netlify-Specific)
# ============================================================================
NODE_ENV=production
PORT=5173
BASE44_APP_ID=68f7fb9301f466283d4de135  # Legacy reference
SESSION_TIMEOUT=60
VITE_API_TIMEOUT=30000
VITE_MAX_FILE_SIZE=10
VITE_DEBUG=false
VITE_MIGRATION_MODE=false
```

**Why these are safe:**
- `VITE_*` variables are PUBLIC by design (Vite embeds them in JS)
- Supabase anon key is designed to be public (protected by RLS)
- Feature flags don't contain sensitive data
- DataForSEO credentials: If used client-side (consider moving to Edge Functions)

---

## 🔒 **SUPABASE SECRETS (Runtime - Private)**

### **What Should Be in Supabase**

**Set via CLI:**
```bash
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set OPENAI_API_KEY=sk-... --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set GROK_API_KEY=xai-... --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set PERPLEXITY_API_KEY=pplx-... --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set CLOUDINARY_API_SECRET=... --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ... --project-ref yvvtsfgryweqfppilkvo
```

**List current secrets:**
```bash
npx supabase secrets list --project-ref yvvtsfgryweqfppilkvo
```

**Complete list of Supabase secrets:**

| Secret Name | Purpose | Used By | Cost/Security |
|-------------|---------|---------|---------------|
| `ANTHROPIC_API_KEY` | Claude AI (Sonnet 4.5) | invoke-llm | 🔥 HIGH COST |
| `OPENAI_API_KEY` | OpenAI GPT-4o | invoke-llm | 🔥 HIGH COST |
| `GROK_API_KEY` | xAI Grok (V2 feature) | invoke-llm | 🔥 HIGH COST |
| `PERPLEXITY_API_KEY` | Fact-checking & citations | invoke-llm | 💰 MEDIUM COST |
| `CLOUDINARY_API_SECRET` | Image uploads (write access) | generate-image | 🔒 PRIVATE |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypass RLS (admin operations) | wordpress-publish, auto-schedule | 🚨 CRITICAL |
| `DATAFORSEO_USERNAME` | Keyword research API | keyword-research | 💰 MEDIUM COST |
| `DATAFORSEO_PASSWORD` | Keyword research API | keyword-research | 💰 MEDIUM COST |

**Why these MUST be in Supabase:**
- Direct billing cost (AI API calls)
- Bypass security (service role key)
- Write access to third-party services
- Never exposed to browser

---

## 🚨 **SECURITY VIOLATIONS TO FIX**

### **❌ DELETE FROM NETLIFY (Currently Exposed)**

These were auto-created by Netlify's old Supabase integration. You **no longer have Netlify Functions**, so these are:
1. Unused (no code reads them)
2. Exposed (visible in build logs)
3. Security holes

**DELETE THESE NOW:**

```bash
SUPABASE_JWT_SECRET          # 🚨 CRITICAL: Can forge auth tokens!
SUPABASE_SERVICE_ROLE_KEY    # 🚨 CRITICAL: Bypasses ALL RLS policies!
SUPABASE_DATABASE_URL        # ⚠️ Not needed (you use SDK)
SUPABASE_ANON_KEY           # ⚠️ Duplicate (you have VITE_SUPABASE_ANON_KEY)
```

**How to delete:**
1. Go to: https://app.netlify.com/sites/perdia-education/configuration/env
2. Find each variable
3. Click "Options" → "Delete"
4. Confirm

---

### **❌ MOVE FROM NETLIFY TO SUPABASE**

These are currently in Netlify with `VITE_` prefix (PUBLIC), but should be PRIVATE:

```bash
# Currently in Netlify (WRONG - exposed to browser):
VITE_GROK_API_KEY=xai-...
VITE_PERPLEXITY_API_KEY=pplx-...

# Should be in Supabase (CORRECT - private):
GROK_API_KEY=xai-...
PERPLEXITY_API_KEY=pplx-...
```

**Migration steps:**
1. Copy values from Netlify
2. Set in Supabase:
   ```bash
   npx supabase secrets set GROK_API_KEY=<value-from-netlify> --project-ref yvvtsfgryweqfppilkvo
   npx supabase secrets set PERPLEXITY_API_KEY=<value-from-netlify> --project-ref yvvtsfgryweqfppilkvo
   ```
3. Delete `VITE_GROK_API_KEY` and `VITE_PERPLEXITY_API_KEY` from Netlify
4. Update Edge Functions to read `Deno.env.get('GROK_API_KEY')` (not `VITE_GROK_API_KEY`)

---

## 📋 **MIGRATION CHECKLIST**

### **Step 1: Audit Current Netlify Config**

- [ ] Login to: https://app.netlify.com/sites/perdia-education/configuration/env
- [ ] Document all variables currently set
- [ ] Identify which are `VITE_*` (keep) vs non-`VITE_*` (review)

### **Step 2: Delete Dangerous Secrets from Netlify**

- [ ] Delete `SUPABASE_JWT_SECRET` 🚨
- [ ] Delete `SUPABASE_SERVICE_ROLE_KEY` 🚨
- [ ] Delete `SUPABASE_DATABASE_URL`
- [ ] Delete `SUPABASE_ANON_KEY` (you have `VITE_SUPABASE_ANON_KEY`)

### **Step 3: Move API Keys to Supabase**

- [ ] Copy `VITE_GROK_API_KEY` value from Netlify
- [ ] Copy `VITE_PERPLEXITY_API_KEY` value from Netlify
- [ ] Set in Supabase:
  ```bash
  npx supabase secrets set GROK_API_KEY=<value> --project-ref yvvtsfgryweqfppilkvo
  npx supabase secrets set PERPLEXITY_API_KEY=<value> --project-ref yvvtsfgryweqfppilkvo
  ```
- [ ] Verify with: `npx supabase secrets list --project-ref yvvtsfgryweqfppilkvo`
- [ ] Delete `VITE_GROK_API_KEY` from Netlify
- [ ] Delete `VITE_PERPLEXITY_API_KEY` from Netlify

### **Step 4: Verify Supabase Secrets**

- [ ] Run: `npx supabase secrets list --project-ref yvvtsfgryweqfppilkvo`
- [ ] Confirm all required secrets exist:
  - `ANTHROPIC_API_KEY`
  - `OPENAI_API_KEY`
  - `GROK_API_KEY`
  - `PERPLEXITY_API_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (if needed)
  - `CLOUDINARY_API_SECRET` (if used)

### **Step 5: Test Edge Functions**

- [ ] Test invoke-llm Edge Function:
  ```bash
  node scripts/test-invoke-llm.js
  ```
- [ ] Verify AI calls work with new secret configuration
- [ ] Check Edge Function logs for errors

### **Step 6: Deploy Frontend**

- [ ] Commit any code changes (if Edge Functions were updated)
- [ ] Push to main branch (triggers Netlify deploy)
- [ ] Verify build succeeds
- [ ] Test in production: https://perdia-education.netlify.app

---

## 🔍 **HOW TO ACCESS SECRETS IN CODE**

### **Frontend (React Components)**

```javascript
// ✅ CORRECT: Read VITE_* variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const defaultProvider = import.meta.env.VITE_DEFAULT_AI_PROVIDER;

// ❌ WRONG: Can't access non-VITE variables
const apiKey = import.meta.env.ANTHROPIC_API_KEY;  // undefined
```

### **Supabase Edge Functions (TypeScript/Deno)**

```typescript
// ✅ CORRECT: Read from Deno.env
const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
const openaiKey = Deno.env.get('OPENAI_API_KEY');
const grokKey = Deno.env.get('GROK_API_KEY');
const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');

// ❌ WRONG: VITE_ variables don't exist in Edge Functions
const provider = Deno.env.get('VITE_DEFAULT_AI_PROVIDER');  // undefined
```

---

## 🛡️ **SECURITY BEST PRACTICES**

### **1. Never Commit Secrets to Git**

```bash
# ✅ These are safe to commit:
.env.example          # Template with placeholders
CLAUDE.md            # Documentation
package.json         # Dependencies

# ❌ NEVER commit these:
.env.local           # Local development secrets
.env.production      # Production secrets
```

### **2. Use Different Keys for Dev/Prod**

```bash
# Development (local .env.local)
VITE_SUPABASE_URL=https://local-dev-project.supabase.co
ANTHROPIC_API_KEY=sk-ant-dev-...

# Production (Netlify + Supabase)
VITE_SUPABASE_URL=https://yvvtsfgryweqfppilkvo.supabase.co
ANTHROPIC_API_KEY=sk-ant-prod-...
```

### **3. Rotate Keys Regularly**

- [ ] Rotate AI API keys every 90 days
- [ ] Rotate Supabase service role key if exposed
- [ ] Update both Supabase secrets and local .env.local

### **4. Monitor Usage**

- [ ] Check Anthropic Console: https://console.anthropic.com/
- [ ] Check OpenAI Dashboard: https://platform.openai.com/usage
- [ ] Set billing alerts to prevent surprise charges

---

## 📖 **REFERENCE: COMPLETE VARIABLE LIST**

### **Netlify (VITE_* Only)**

| Variable | Value Example | Purpose |
|----------|---------------|---------|
| `VITE_SUPABASE_URL` | `https://...supabase.co` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Public anon key (RLS enforced) |
| `VITE_DEFAULT_AI_PROVIDER` | `claude` | Default AI provider |
| `VITE_APP_URL` | `https://perdia-education.netlify.app` | App URL |
| `VITE_CLOUDINARY_CLOUD_NAME` | `dvcvxhzmt` | Cloudinary cloud name |
| `VITE_CLOUDINARY_API_KEY` | `123...` | Public read-only key |
| `VITE_DATAFORSEO_LOGIN` | `email@example.com` | DataForSEO login |
| `VITE_DATAFORSEO_PASSWORD` | `password` | DataForSEO password |
| `VITE_ENABLE_*` | `true/false` | Feature flags |
| `VITE_DEBUG` | `false` | Debug mode |
| `NODE_ENV` | `production` | Build environment |
| `PORT` | `5173` | Dev server port |

### **Supabase Secrets (No VITE_ Prefix)**

| Secret | Value Example | Purpose |
|--------|---------------|---------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Claude AI API key |
| `OPENAI_API_KEY` | `sk-...` | OpenAI API key |
| `GROK_API_KEY` | `xai-...` | xAI Grok API key |
| `PERPLEXITY_API_KEY` | `pplx-...` | Perplexity API key |
| `CLOUDINARY_API_SECRET` | `secret...` | Cloudinary write key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Admin key (bypass RLS) |
| `DATAFORSEO_USERNAME` | `email` | DataForSEO username |
| `DATAFORSEO_PASSWORD` | `pass` | DataForSEO password |

---

## 🚨 **EMERGENCY: SECRETS LEAKED**

If you accidentally commit secrets to Git:

### **1. Immediately Rotate Keys**

```bash
# Generate new keys at:
# - Anthropic: https://console.anthropic.com/settings/keys
# - OpenAI: https://platform.openai.com/api-keys
# - Supabase: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/api

# Update Supabase secrets:
npx supabase secrets set ANTHROPIC_API_KEY=<new-key> --project-ref yvvtsfgryweqfppilkvo
```

### **2. Remove from Git History**

```bash
# Use BFG Repo-Cleaner or git-filter-repo
# (Beyond scope of this guide - contact DevOps)
```

### **3. Verify No Charges**

- Check Anthropic Console usage
- Check OpenAI billing
- Set up billing alerts

---

## 📞 **SUPPORT**

**Questions about this configuration?**
- Slack: #perdia-dev
- Email: dev@disruptors.ai
- Docs: `CLAUDE.md`, `README.md`

**Last Reviewed:** 2025-11-13
**Next Review:** 2026-02-13 (quarterly)
