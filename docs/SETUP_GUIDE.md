# Perdia Education Platform - Complete Setup Guide

**Version:** 1.0
**Last Updated:** 2025-11-04
**Migration Status:** Base44 → Supabase Complete

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start (5 Minutes)](#quick-start-5-minutes)
4. [Detailed Setup](#detailed-setup)
5. [Database Migration](#database-migration)
6. [Environment Configuration](#environment-configuration)
7. [Development Workflow](#development-workflow)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)
10. [Next Steps](#next-steps)

---

## Overview

Perdia Education is an AI-powered SEO content automation platform designed to scale content creation from 6-8 pages/day to 100+ articles/week. This setup guide covers the complete migration from Base44 to a custom Supabase implementation.

### What This Guide Covers

- ✅ Supabase database setup
- ✅ Environment configuration
- ✅ AI API key setup (Claude + OpenAI)
- ✅ Local development environment
- ✅ Database migration and seeding
- ✅ Production deployment to Netlify

### Architecture Stack

**Frontend:**
- React 18.2.0
- Vite 6.1.0
- TailwindCSS 3.4.17
- Radix UI components

**Backend:**
- Supabase (PostgreSQL + Auth + Storage)
- Custom SDK layer (Base44-compatible API)

**AI/LLM:**
- Anthropic Claude (primary)
- OpenAI GPT (secondary)

**Deployment:**
- Netlify (auto-deploy from Git)

---

## Prerequisites

Before starting, ensure you have:

### Required Accounts

- [ ] **Supabase Account** - [Sign up free](https://supabase.com)
- [ ] **Anthropic Account** - [Get API key](https://console.anthropic.com)
- [ ] **OpenAI Account** - [Get API key](https://platform.openai.com)
- [ ] **Netlify Account** (for deployment) - [Sign up free](https://netlify.com)
- [ ] **GitHub Account** (for version control)

### Required Software

- [ ] **Node.js 18+** - [Download](https://nodejs.org/)
- [ ] **npm 9+** (comes with Node.js)
- [ ] **Git** - [Download](https://git-scm.com/)
- [ ] **Code Editor** (VS Code recommended)

### Optional Tools

- [ ] **Supabase CLI** - `npm install -g supabase` (for advanced DB management)
- [ ] **PostgreSQL Client** - [Postico](https://eggerapps.at/postico/) or [pgAdmin](https://www.pgadmin.org/)

### Verify Installation

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version (should be 9+)
npm --version

# Check Git
git --version
```

---

## Quick Start (5 Minutes)

**If you already have:**
- Supabase project created
- API keys ready
- Database migrated

**Then:**

```bash
# 1. Clone repository (if not already)
git clone <repository-url>
cd perdia

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Edit .env.local with your credentials
# (Add: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ANTHROPIC_API_KEY, VITE_OPENAI_API_KEY)

# 5. Start development server
npm run dev
```

**Access:** http://localhost:5173

---

## Detailed Setup

### Step 1: Create Supabase Project

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Click "New Project"

2. **Project Configuration**
   - **Project Name:** `perdia` (or your choice)
   - **Database Password:** Choose a strong password (save this!)
   - **Region:** Choose closest to your location
   - **Pricing Plan:** Free tier works for development

3. **Wait for Provisioning**
   - Takes 2-3 minutes to set up database
   - You'll see a success message when ready

4. **Get API Credentials**
   - Go to: **Project Settings** → **API**
   - Copy these values:
     - **Project URL** (e.g., `https://abcdefg.supabase.co`)
     - **anon public** key (safe for client-side)
     - **service_role** key (keep secret!)

### Step 2: Get AI API Keys

#### Anthropic Claude (Primary)

1. Visit: https://console.anthropic.com/
2. Sign up or log in
3. Go to: **API Keys**
4. Click: **Create Key**
5. Name: `Perdia Education Development`
6. Copy the key (starts with `sk-ant-...`)

**Free Tier:** $5 credit, then pay-as-you-go
**Pricing:** ~$3 per 1M tokens (Claude Sonnet 3.5)

#### OpenAI (Secondary)

1. Visit: https://platform.openai.com/
2. Sign up or log in
3. Go to: **API Keys**
4. Click: **Create new secret key**
5. Name: `Perdia Education Development`
6. Copy the key (starts with `sk-...`)

**Free Tier:** $5 credit for new accounts
**Pricing:** ~$2.50 per 1M tokens (GPT-4o)

### Step 3: Clone Repository

```bash
# Clone the repository
git clone <repository-url>
cd perdia

# Verify you're in the right directory
ls -la
# Should see: package.json, src/, supabase/, docs/, etc.
```

### Step 4: Install Dependencies

```bash
# Install all required packages
npm install

# This installs:
# - React and UI libraries
# - Supabase client
# - Anthropic SDK
# - OpenAI SDK
# - Development tools
```

**Time:** 2-3 minutes depending on internet speed

### Step 5: Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env.local
```

**Edit `.env.local`:** (use your favorite editor)

```bash
# REQUIRED - Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# REQUIRED - AI
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
VITE_OPENAI_API_KEY=sk-your-key-here

# OPTIONAL - Defaults
VITE_DEFAULT_AI_PROVIDER=claude
VITE_APP_URL=http://localhost:5173
NODE_ENV=development
```

**Security Notes:**
- ✅ `.env.local` is in `.gitignore` (never committed)
- ❌ Never share your `service_role` key
- ❌ Never commit API keys to Git

---

## Database Migration

### Method 1: Supabase Dashboard (Recommended)

**This is the easiest method for first-time setup.**

1. **Open SQL Editor**
   - Go to: Supabase Dashboard → Your Project
   - Click: **SQL Editor** (left sidebar)

2. **Copy Migration SQL**
   - Open file: `supabase/migrations/20250104000001_perdia_complete_schema.sql`
   - Copy the entire contents (Ctrl+A, Ctrl+C)

3. **Paste and Execute**
   - Paste into Supabase SQL Editor
   - Click: **Run** (bottom right)
   - Wait ~5-10 seconds

4. **Verify Success**
   - You should see: "Success. No rows returned"
   - Check **Table Editor** - you should see 16 new tables

5. **Verify Migration**
   ```bash
   node scripts/verify-migration.js
   ```

   Expected output:
   ```
   ✅ keywords                     (0 rows)
   ✅ content_queue                (0 rows)
   ✅ performance_metrics          (0 rows)
   ...
   ✅ MIGRATION VERIFIED SUCCESSFULLY!
   ```

### Method 2: Supabase CLI (Advanced)

**For users comfortable with command line:**

```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref
# (Find project ref in: Project Settings → General → Reference ID)

# Push migration to remote database
supabase db push

# Verify
node scripts/verify-migration.js
```

### Seed AI Agents

After migration, seed the 9 AI agent definitions:

```bash
npm run db:seed
```

Expected output:
```
✅ Created: SEO Content Writer
✅ Created: Content Optimizer
✅ Created: Keyword Researcher
...
🎉 All agents seeded successfully!
```

**Verify Agents:**

1. Go to Supabase Dashboard → **Table Editor**
2. Open table: `agent_definitions`
3. You should see 9 rows

---

## Environment Configuration

### Complete Environment Variables

Refer to `.env.example` for all available configuration options.

**Required (minimum to run):**
```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ANTHROPIC_API_KEY=
VITE_OPENAI_API_KEY=
```

**Optional but recommended:**
```bash
VITE_SUPABASE_SERVICE_ROLE_KEY=  # For admin operations
VITE_CLOUDINARY_*=               # For advanced image optimization
VITE_GA_MEASUREMENT_ID=          # Google Analytics
```

### Feature Flags

Enable/disable features during development:

```bash
VITE_ENABLE_SOCIAL_POSTING=true
VITE_ENABLE_IMAGE_GENERATION=true
VITE_ENABLE_TEAM_CHAT=true
VITE_ENABLE_DEBUG_MODE=false
```

---

## Development Workflow

### Start Development Server

```bash
npm run dev
```

**Output:**
```
VITE v6.1.0  ready in 1234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**Access:** http://localhost:5173

### Project Structure

```
perdia/
├── src/
│   ├── api/                    # Legacy Base44 API (to be replaced)
│   ├── components/             # React components (189 files)
│   │   ├── agents/            # AI agent interface
│   │   ├── dashboard/         # Analytics widgets
│   │   ├── ui/                # Radix UI components
│   │   └── ...
│   ├── lib/                   # Core libraries (NEW)
│   │   ├── supabase-client.js # Supabase client setup
│   │   ├── perdia-sdk.js      # Custom SDK (Base44-compatible)
│   │   ├── ai-client.js       # AI integration layer
│   │   └── agent-sdk.js       # Agent conversation system
│   ├── pages/                 # Route components
│   │   ├── AIAgents.jsx       # Main AI interface
│   │   ├── KeywordManager.jsx # Keyword research
│   │   ├── ContentLibrary.jsx # Content management
│   │   └── ...
│   ├── hooks/                 # Custom React hooks
│   ├── utils/                 # Helper functions
│   └── main.jsx               # App entry point
├── supabase/
│   └── migrations/            # Database migrations
├── scripts/                   # Setup and utility scripts
├── docs/                      # Documentation
├── .env.example              # Environment template
├── package.json              # Dependencies
├── netlify.toml              # Deployment config
└── vite.config.js            # Vite configuration
```

### Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Database operations
npm run db:migrate    # Apply database migration
npm run db:seed       # Seed AI agents
npm run setup         # Complete setup (install + migrate + seed)
```

### Making Changes

1. **Edit files in `src/`**
2. **Hot reload** - Changes appear instantly
3. **Check browser console** for errors
4. **Commit frequently** to Git

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub
```

---

## Deployment

### Deploy to Netlify

#### One-Time Setup

1. **Connect Repository**
   - Go to: https://app.netlify.com/
   - Click: **Add new site** → **Import an existing project**
   - Choose: **GitHub**
   - Select repository: `perdia-education`

2. **Configure Build Settings**
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions` (optional)

3. **Add Environment Variables**
   - Go to: **Site settings** → **Environment variables**
   - Click: **Add a variable**
   - Add all variables from `.env.local`:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_ANTHROPIC_API_KEY`
     - `VITE_OPENAI_API_KEY`
     - (DO NOT add `SERVICE_ROLE_KEY` unless needed for functions)

4. **Deploy!**
   - Click: **Deploy site**
   - Wait 2-3 minutes for build
   - Access your live site!

#### Automatic Deploys

**After setup:**
- ✅ Push to `master` branch → Auto-deploy to production
- ✅ Create pull request → Auto-deploy preview
- ✅ Every commit triggers a build

#### Custom Domain

1. Go to: **Domain settings**
2. Click: **Add custom domain**
3. Enter your domain: `perdia.yourdomain.com`
4. Follow DNS configuration instructions
5. Enable HTTPS (automatic)

### Manual Build

Test production build locally:

```bash
# Build for production
npm run build

# Preview build
npm run preview

# Access at: http://localhost:4173
```

---

## Troubleshooting

### Common Issues

#### 1. "Multiple GoTrueClient instances detected"

**Cause:** Multiple Supabase clients being created

**Solution:**
- Always import from `src/lib/supabase-client.js`
- Never create new `createClient()` calls
- Check for duplicate imports

#### 2. Database Connection Failed

**Symptoms:**
- API errors
- Empty data
- Auth not working

**Solutions:**
```bash
# 1. Verify environment variables
cat .env.local | grep SUPABASE

# 2. Check Supabase project status
# Visit dashboard, ensure project is "Active"

# 3. Verify migration
node scripts/verify-migration.js

# 4. Check RLS policies
# Go to: Supabase Dashboard → Authentication → Policies
# Ensure policies exist for all tables
```

#### 3. AI API Errors

**Symptoms:**
- "API key not found"
- 401 Unauthorized
- Rate limit errors

**Solutions:**
```bash
# 1. Verify API keys
cat .env.local | grep API_KEY

# 2. Check API key format
# Claude: starts with sk-ant-
# OpenAI: starts with sk-

# 3. Test API key manually
# Claude: https://console.anthropic.com/
# OpenAI: https://platform.openai.com/playground

# 4. Check billing/credits
# Ensure your account has available credits
```

#### 4. Build Errors

**Symptoms:**
- `npm run build` fails
- Missing dependencies
- Import errors

**Solutions:**
```bash
# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Clear Vite cache
rm -rf node_modules/.vite

# 3. Check Node version
node --version  # Should be 18+

# 4. Update dependencies
npm update
```

#### 5. Netlify Deploy Fails

**Symptoms:**
- Build fails on Netlify
- Works locally but not in production

**Solutions:**
1. **Check build logs** in Netlify dashboard
2. **Verify environment variables** are set in Netlify
3. **Check Node version** matches (set in netlify.toml)
4. **Clear cache and redeploy**:
   - Netlify Dashboard → Deploys → Options → Clear cache and retry

### Getting Help

**Documentation:**
- This setup guide
- API Reference: `docs/API_REFERENCE.md`
- Migration Analysis: `docs/BASE44_PERDIA_MIGRATION_ANALYSIS.md`

**Community:**
- GitHub Issues: Report bugs or ask questions
- Team Chat: Contact development team

**Supabase Support:**
- Documentation: https://supabase.com/docs
- Community: https://github.com/supabase/supabase/discussions

---

## Next Steps

### After Setup

- [ ] **Create First User**
  - Sign up at: http://localhost:5173
  - Verify email (check Supabase Auth)

- [ ] **Test AI Agents**
  - Go to: AI Agents page
  - Select: "SEO Content Writer"
  - Send test message

- [ ] **Import Keywords**
  - Go to: Keyword Manager
  - Upload CSV with keywords
  - Test AI clustering

- [ ] **Configure WordPress**
  - Go to: WordPress Connection
  - Add site URL and credentials
  - Test connection

### Recommended Reading

1. **API Reference** - Learn custom SDK usage
2. **Architecture Design** - Understand system design
3. **Migration Analysis** - See what changed from Base44

### Production Checklist

Before going live:

- [ ] All environment variables set in Netlify
- [ ] Custom domain configured and HTTPS enabled
- [ ] Database backups enabled (Supabase Pro)
- [ ] Error tracking setup (optional: Sentry)
- [ ] Analytics configured (optional: Google Analytics)
- [ ] Team members added to Netlify and Supabase
- [ ] WordPress credentials tested and working
- [ ] AI API billing alerts configured
- [ ] RLS policies reviewed and tested

### Monitoring & Maintenance

**Weekly:**
- Check AI API usage and costs
- Review error logs in Netlify
- Backup database (Supabase auto-backups on Pro)

**Monthly:**
- Update dependencies: `npm update`
- Review and optimize database indexes
- Analyze performance metrics

---

## Support

**Questions?** Contact the development team or create an issue on GitHub.

**Found a bug?** Please report it with:
- Description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Browser and OS information

---

**Version:** 1.0
**Last Updated:** 2025-11-04
**Author:** Disruptors Media Development Team
