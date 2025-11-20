# Deployment Checklist for Perdia Education

## 🚨 Current Issue: 401 Unauthorized Errors

**Status**: Documented fix available
**Action Required**: Manual SQL execution in Supabase dashboard

### Quick Fix (Do This First!)

1. **Open**: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new
2. **Run SQL** from: `supabase/migrations/dev_mode_disable_rls.sql`
3. **Restart** dev server: `npm run dev`
4. **Verify**: No more 401 errors!

See: `QUICKFIX_401_ERRORS.md` for detailed instructions.

---

## 📋 Pre-Deployment Checklist

### 1. Local Development Working
- [ ] SQL migration applied (dev_mode_disable_rls.sql)
- [ ] App loads without 401 errors
- [ ] All features tested and working
- [ ] No console errors (except expected warnings)

### 2. Environment Variables
- [ ] `.env.local` has correct Supabase credentials
- [ ] All required API keys present:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_ANTHROPIC_API_KEY`
  - `VITE_OPENAI_API_KEY`
- [ ] Service role key set (for migrations only)

### 3. Database Setup
- [ ] Main schema migration applied: `20250104000001_perdia_complete_schema.sql`
- [ ] Dev mode migration applied: `dev_mode_disable_rls.sql`
- [ ] Agent definitions seeded: `npm run db:seed`
- [ ] All 16 tables exist and accessible

### 4. Code Quality
- [ ] No TypeScript errors: `npm run type-check`
- [ ] No linting errors: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Preview works: `npm run preview`

### 5. Netlify Deployment

#### Configure Environment Variables in Netlify
Set these in: https://app.netlify.com/sites/perdia-education/configuration/env

**Required:**
```
VITE_SUPABASE_URL=https://yvvtsfgryweqfppilkvo.supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
VITE_ANTHROPIC_API_KEY=[your-claude-key]
VITE_OPENAI_API_KEY=[your-openai-key]
```

**Optional:**
```
VITE_SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
VITE_DEFAULT_AI_PROVIDER=claude
VITE_APP_URL=https://perdia-education.netlify.app
```

#### Build Settings
```
Build command: npm run build
Publish directory: dist
Node version: 18
```

### 6. Production Security (Before Public Launch)

⚠️ **CRITICAL**: Before making the site public:

- [ ] **Re-enable RLS**: Run `dev_mode_enable_rls.sql` in production database
- [ ] **Enable Real Auth**: Uncomment auth code in `src/lib/supabase-client.js`
- [ ] **Remove Mock User**: Delete lines 93-107 in `supabase-client.js`
- [ ] **Test Login Flow**: Create test user and verify authentication
- [ ] **Verify RLS Policies**: Test that users can only access their own data

---

## 🚀 Deployment Steps

### Step 1: Local Testing
```bash
# Ensure everything works locally
npm run dev

# Build for production
npm run build

# Test production build
npm run preview
```

### Step 2: Commit Changes
```bash
git add .
git commit -m "Fix: Add 401 error documentation and dev mode instructions"
git push origin main
```

### Step 3: Deploy to Netlify

**Option A: Automatic (Recommended)**
- Push to main branch
- Netlify auto-deploys
- Monitor: https://app.netlify.com/sites/perdia-education/deploys

**Option B: Manual**
```bash
npm run build
netlify deploy --prod
```

### Step 4: Verify Deployment
- [ ] Site loads: https://perdia-education.netlify.app
- [ ] No console errors
- [ ] Dashboard displays data
- [ ] AI agents accessible
- [ ] File uploads work
- [ ] All routes working

### Step 5: Post-Deployment

**If RLS is still disabled (dev mode):**
1. App works without authentication
2. Anyone can access all data
3. **Acceptable for testing**, but NOT for production

**To enable production security:**
1. Run `dev_mode_enable_rls.sql` in Supabase
2. Enable real authentication in code
3. Test login flow
4. Redeploy

---

## 🔄 Git Workflow

### Current Branch: main
```bash
# Check status
git status

# Pull latest changes
git pull origin main

# Make changes, then:
git add .
git commit -m "Your message"
git push origin main
```

### Merging Remote Changes
```bash
# Fetch latest from remote
git fetch origin

# View differences
git diff main origin/main

# Merge remote into local
git merge origin/main

# Resolve conflicts if any, then:
git add .
git commit -m "Merge remote changes"
git push origin main
```

---

## 📊 Monitoring

### Netlify Dashboard
- **Deploys**: https://app.netlify.com/sites/perdia-education/deploys
- **Logs**: https://app.netlify.com/sites/perdia-education/logs
- **Analytics**: https://app.netlify.com/sites/perdia-education/analytics

### Supabase Dashboard
- **Database**: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/editor
- **SQL Editor**: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new
- **Logs**: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/logs

---

## 🆘 Troubleshooting

### Deployment Fails
- Check build logs in Netlify
- Verify all environment variables set
- Test build locally: `npm run build`

### 401 Errors in Production
- Run dev mode SQL in production database (temporary)
- Or set up proper authentication
- Check Supabase API keys are correct

### Database Connection Issues
- Verify Supabase project is active
- Check API keys in Netlify env vars
- Ensure RLS policies allow access

---

## 📝 Current Status

- ✅ Local development configured
- ✅ Documentation complete
- ⏳ **Next**: Apply SQL migration (manual step required)
- ⏳ Test application
- ⏳ Commit and deploy
- ⏳ Set up production security

---

**Last Updated**: 2025-11-06
**Netlify Project**: perdia-education
**Supabase Project**: yvvtsfgryweqfppilkvo
