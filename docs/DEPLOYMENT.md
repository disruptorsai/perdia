# Perdia Education - Deployment Guide

**Last Updated:** 2025-11-05
**Status:** ✅ Connected to Netlify

---

## 📋 Table of Contents

1. [Netlify Project Information](#netlify-project-information)
2. [Quick Deployment](#quick-deployment)
3. [Environment Variables](#environment-variables)
4. [Netlify CLI Usage](#netlify-cli-usage)
5. [Manual Deployment](#manual-deployment)
6. [Custom Domain Setup](#custom-domain-setup)
7. [Troubleshooting](#troubleshooting)

---

## 🌐 Netlify Project Information

**Current Deployment Status:**
- **Project ID:** `371d61d6-ad3d-4c13-8455-52ca33d1c0d4`
- **Account:** Perdia Education (New Netlify Account)
- **Dashboard:** https://app.netlify.com/sites/perdia-education/overview
- **Status:** ✅ Repository Connected
- **Auto-Deploy:** ✅ Enabled on `main` branch

**Build Configuration:**
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Node Version:** 18
- **NPM Version:** 9
- **Configuration File:** `netlify.toml` (in project root)

---

## 🚀 Quick Deployment

### Automatic Deployment (Recommended)

The repository is configured for automatic deployment:

1. **Make Changes**
   ```bash
   # Make your code changes
   git add .
   git commit -m "Your commit message"
   ```

2. **Push to Main Branch**
   ```bash
   git push origin main
   ```

3. **Automatic Build Triggered**
   - Netlify automatically detects the push
   - Build starts within seconds
   - Takes 2-3 minutes to complete
   - Site is live after successful build

4. **Monitor Build**
   - View build logs: https://app.netlify.com/sites/perdia-education/deploys
   - Get notifications via email/Slack (if configured)

### Deploy Previews for Pull Requests

Every pull request automatically gets a preview deployment:

1. **Create Pull Request**
   ```bash
   git checkout -b feature/my-feature
   # Make changes
   git push origin feature/my-feature
   # Create PR on GitHub
   ```

2. **Preview Deployment**
   - Netlify builds a preview version
   - Unique URL generated for testing
   - Comment added to PR with preview link

---

## 🔐 Environment Variables

### Required Variables

Set these in the Netlify Dashboard:
https://app.netlify.com/sites/perdia-education/configuration/env

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key (public) | `eyJhbG...` |
| `VITE_ANTHROPIC_API_KEY` | Claude API key | `sk-ant-...` |
| `VITE_OPENAI_API_KEY` | OpenAI API key | `sk-...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Admin key (for functions only) | Not set |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary account name | Not set |
| `VITE_CLOUDINARY_API_KEY` | Cloudinary API key | Not set |
| `VITE_DEFAULT_AI_PROVIDER` | Default AI provider | `claude` |
| `VITE_APP_URL` | Production URL | Auto-detected |

### How to Set Environment Variables

**Via Netlify Dashboard:**
1. Go to: https://app.netlify.com/sites/perdia-education/configuration/env
2. Click **"Add a variable"**
3. Enter variable name and value
4. Select **"Same value for all deploy contexts"** or configure per context
5. Click **"Create variable"**

**Via Netlify CLI:**
```bash
# Set a single variable
netlify env:set VARIABLE_NAME "value"

# Import from .env file (careful with secrets!)
netlify env:import .env.local

# List all variables
netlify env:list
```

**Environment Contexts:**

Netlify supports different values for different contexts:
- **Production:** Main branch deployments
- **Deploy Previews:** Pull request deployments
- **Branch Deploys:** Other branch deployments

---

## 💻 Netlify CLI Usage

### Installation

```bash
# Install globally
npm install -g netlify-cli

# Verify installation
netlify --version
```

### Authentication

```bash
# Login to Netlify
netlify login

# Check login status
netlify status
```

### Link to Project

```bash
# Link to existing site
netlify link

# When prompted, select:
# → "Link this directory to an existing site"
# → Select account: "Perdia Education"
# → Select site: "perdia-education"

# Or link directly with site ID
netlify link --id 371d61d6-ad3d-4c13-8455-52ca33d1c0d4
```

### Common Commands

```bash
# Deploy to production
netlify deploy --prod

# Deploy for preview (generates unique URL)
netlify deploy

# Build and deploy
netlify deploy --prod --build

# Open deployed site in browser
netlify open:site

# Open Netlify dashboard
netlify open:admin

# View recent deployments
netlify deploy:list

# Watch for changes and auto-deploy
netlify watch

# View environment variables
netlify env:list

# Set environment variable
netlify env:set VAR_NAME "value"

# Get environment variable
netlify env:get VAR_NAME

# Run functions locally
netlify dev

# View build logs
netlify build:log
```

### Local Development with Netlify

```bash
# Start Netlify dev server (includes functions)
netlify dev

# This will:
# - Start Vite dev server on port 5173
# - Enable Netlify functions on /.netlify/functions/*
# - Inject environment variables from Netlify
# - Provide edge functions support
```

---

## 🔧 Manual Deployment

### Build Locally

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview build locally
npm run preview
```

### Deploy with Netlify CLI

```bash
# Deploy to preview (test before production)
netlify deploy

# Review the deploy preview URL
# Test thoroughly

# Deploy to production
netlify deploy --prod
```

### Deploy via Netlify Dashboard

1. Go to: https://app.netlify.com/sites/perdia-education/deploys
2. Click **"Trigger deploy"**
3. Select **"Deploy site"**
4. Wait for build to complete

---

## 🌍 Custom Domain Setup

### Add Custom Domain

1. **Purchase Domain** (if needed)
   - Recommended: Namecheap, Google Domains, Cloudflare

2. **Add to Netlify**
   - Go to: https://app.netlify.com/sites/perdia-education/configuration/domain
   - Click **"Add custom domain"**
   - Enter your domain: `perdia.yourdomain.com`
   - Click **"Verify"**

3. **Configure DNS**

   **Option A: Netlify DNS (Recommended)**
   - Click **"Set up Netlify DNS"**
   - Update nameservers at your registrar:
     - `dns1.p04.nsone.net`
     - `dns2.p04.nsone.net`
     - `dns3.p04.nsone.net`
     - `dns4.p04.nsone.net`

   **Option B: External DNS**
   - Add CNAME record:
     - **Name:** `perdia` (or `@` for apex domain)
     - **Value:** `perdia-education.netlify.app`

4. **Enable HTTPS**
   - Automatically enabled by Netlify
   - Uses Let's Encrypt SSL certificate
   - Auto-renewal every 90 days

5. **Update Environment Variables**
   ```bash
   netlify env:set VITE_APP_URL "https://your-custom-domain.com"
   ```

### Domain Verification

```bash
# Check DNS propagation
nslookup perdia.yourdomain.com

# Test HTTPS
curl -I https://perdia.yourdomain.com
```

---

## 🐛 Troubleshooting

### Build Fails

**Problem:** Build fails on Netlify but works locally

**Solutions:**
1. **Check build logs**
   - View at: https://app.netlify.com/sites/perdia-education/deploys
   - Look for specific error messages

2. **Verify Node version**
   ```toml
   # In netlify.toml
   [build.environment]
     NODE_VERSION = "18"
   ```

3. **Clear cache and retry**
   - Deploys → Click deploy → **"Options"** → **"Clear cache and retry with latest branch commit"**

4. **Check environment variables**
   - Ensure all required variables are set
   - Values don't have extra quotes or spaces

### Deploy Preview Not Working

**Problem:** PR doesn't generate deploy preview

**Solutions:**
1. **Check deploy settings**
   - Site settings → Build & deploy → Deploy contexts
   - Ensure "Deploy Previews" is enabled

2. **Branch name restrictions**
   - Check if branch is in excluded list

3. **Rebuild PR**
   - Add empty commit to trigger rebuild:
   ```bash
   git commit --allow-empty -m "Trigger rebuild"
   git push
   ```

### Environment Variables Not Working

**Problem:** App can't access environment variables

**Solutions:**
1. **Check variable names**
   - Must start with `VITE_` for Vite apps
   - Case-sensitive

2. **Redeploy after changes**
   - Environment variable changes require redeploy
   - Trigger manual deploy or push to branch

3. **Verify in build logs**
   - Check if variables are being injected
   - Look for "Environment variables" section

### Site Not Updating

**Problem:** Changes pushed but site shows old content

**Solutions:**
1. **Check deploy status**
   - View at: https://app.netlify.com/sites/perdia-education/deploys
   - Ensure latest deploy succeeded

2. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clear browser cache completely

3. **Check branch**
   - Ensure you pushed to `main` branch
   - Only `main` deploys to production

4. **Verify auto-deploy enabled**
   - Site settings → Build & deploy → Continuous deployment
   - "Auto publishing" should be enabled

### Function Errors

**Problem:** Netlify Functions return errors

**Solutions:**
1. **Check function logs**
   - Functions → Select function → View logs

2. **Test locally**
   ```bash
   netlify dev
   # Access function at: http://localhost:8888/.netlify/functions/function-name
   ```

3. **Environment variables**
   - Functions need service role key if bypassing RLS
   - Set `VITE_SUPABASE_SERVICE_ROLE_KEY`

### Getting Help

**Netlify Resources:**
- **Support Docs:** https://docs.netlify.com/
- **Community Forum:** https://answers.netlify.com/
- **Status Page:** https://www.netlifystatus.com/

**Project Resources:**
- **GitHub Issues:** Report bugs and issues
- **Documentation:** See `docs/` folder
- **Setup Guide:** `docs/SETUP_GUIDE.md`

**Emergency Contact:**
- **Dashboard:** https://app.netlify.com/sites/perdia-education/overview
- **Support:** support@netlify.com (Pro/Business plans)

---

## 📊 Deployment Monitoring

### Build Times

Normal build times:
- **Clean build:** 2-3 minutes
- **Cached build:** 1-2 minutes

If builds take longer:
- Check for dependency updates
- Review build logs for warnings
- Consider optimizing build process

### Deployment History

View all deployments:
- **URL:** https://app.netlify.com/sites/perdia-education/deploys
- **Rollback:** Click any previous deploy → "Publish deploy"

### Performance Monitoring

Netlify provides analytics:
- **Bandwidth usage:** Site settings → Usage and billing
- **Build minutes:** Site settings → Usage and billing
- **Function invocations:** Functions → Analytics

---

## 🔄 Deployment Workflow

### Standard Workflow

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and test locally
npm run dev

# 3. Build and test production build
npm run build
npm run preview

# 4. Commit changes
git add .
git commit -m "Add new feature"

# 5. Push to GitHub
git push origin feature/new-feature

# 6. Create Pull Request
# → Deploy preview automatically created

# 7. Review and test preview
# → Click preview link in PR

# 8. Merge PR
# → Automatic production deployment

# 9. Monitor deployment
# → https://app.netlify.com/sites/perdia-education/deploys

# 10. Verify production
# → Visit production URL
```

### Hotfix Workflow

```bash
# 1. Create hotfix branch from main
git checkout main
git pull
git checkout -b hotfix/critical-fix

# 2. Make fix
# ... edit files ...

# 3. Test locally
npm run dev

# 4. Deploy preview first
netlify deploy

# 5. Test preview URL thoroughly

# 6. Deploy to production
netlify deploy --prod

# 7. Commit and push
git add .
git commit -m "Fix critical issue"
git push origin hotfix/critical-fix

# 8. Create PR for record
# 9. Merge PR after approval
```

---

## 📝 Configuration Files

### netlify.toml

Location: `netlify.toml` (project root)

Key sections:
- **Build settings:** Commands, publish directory
- **Redirects:** SPA routing, API proxies
- **Headers:** Security headers, caching
- **Contexts:** Production, preview, branch deploys

See full configuration in `netlify.toml` file.

### .gitignore

Ensure these are ignored:
```
.env.local
.env.production
dist/
.netlify/
node_modules/
```

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Build succeeds locally (`npm run build`)
- [ ] Environment variables set in Netlify
- [ ] Database migrations applied
- [ ] No console errors in preview
- [ ] Responsive design tested
- [ ] Performance optimized (Lighthouse)
- [ ] Security headers configured
- [ ] Error tracking enabled (optional)
- [ ] Analytics configured (optional)

---

**Project ID:** `371d61d6-ad3d-4c13-8455-52ca33d1c0d4`
**Dashboard:** https://app.netlify.com/sites/perdia-education/overview
**Last Updated:** 2025-11-05
