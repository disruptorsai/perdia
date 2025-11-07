# Perdia Education Platform

> AI-Powered SEO Content Automation for GetEducated.com

[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)]()
[![Migration](https://img.shields.io/badge/Migration-Complete-blue)]()
[![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Supabase-orange)]()

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev
```

**Access:** http://localhost:5173

### 🧪 Testing Without Authentication

Want to test the app without setting up authentication? See **[TESTING_WITHOUT_AUTH.md](./TESTING_WITHOUT_AUTH.md)** for instructions on enabling development mode.

**Quick version:**
1. Go to your Supabase SQL Editor
2. Run the SQL from `supabase/migrations/dev_mode_disable_rls.sql`
3. Restart dev server

The app will work with a mock user - no login required!

---

## 📖 What is Perdia?

Perdia Education is a sophisticated AI-powered SEO content automation platform designed to **double to triple organic traffic** for GetEducated.com. The platform combines:

- **9 Specialized AI Agents** for content generation
- **Keyword Management** supporting 1000s of keywords
- **Content Workflow** (draft → approve → publish)
- **WordPress Integration** for automated publishing
- **Performance Tracking** via Google Search Console
- **Team Collaboration** with chat and approval workflows

### Scale Capabilities

- **From:** 6-8 pages/day manual content creation
- **To:** 100+ articles/week automated generation
- **Goal:** 4,000-6,000 daily visitors within 12 months

---

## 🏗️ Architecture

### Technology Stack

- **Frontend:** React 18.2, Vite 6.1, TailwindCSS 3.4
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **AI:** Anthropic Claude + OpenAI (via Supabase Edge Functions)
- **Deployment:** Netlify (Frontend) + Supabase (Backend & AI)
- **Components:** Radix UI, Recharts, Framer Motion

### Project Structure

```
perdia/
├── src/
│   ├── lib/                    # Core libraries
│   │   ├── supabase-client.js  # Centralized Supabase client
│   │   ├── perdia-sdk.js       # Custom SDK (Base44-compatible)
│   │   ├── ai-client.js        # AI integration layer
│   │   └── agent-sdk.js        # Agent conversation system
│   ├── components/             # React components (189 files)
│   ├── pages/                  # Route components (13 pages)
│   └── ...
├── supabase/
│   ├── functions/              # Supabase Edge Functions
│   │   └── invoke-llm/         # AI invocation endpoint (400s timeout)
│   └── migrations/             # Database schema
├── scripts/                    # Setup and utility scripts
├── docs/                       # Documentation
└── netlify.toml                # Frontend deployment config
```

---

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm 9+
- Supabase account
- Anthropic API key
- OpenAI API key

### Setup Steps

**1. Clone and Install**
```bash
git clone <repository-url>
cd perdia
npm install
```

**2. Configure Environment**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI
VITE_ANTHROPIC_API_KEY=sk-ant-your-key
VITE_OPENAI_API_KEY=sk-your-key
```

**3. Database Migration**

Option A - Supabase Dashboard (Recommended):
1. Go to: Supabase Dashboard → SQL Editor
2. Copy contents of: `supabase/migrations/20250104000001_perdia_complete_schema.sql`
3. Paste and click "Run"

Option B - CLI:
```bash
supabase db push
```

**4. Seed AI Agents**
```bash
npm run db:seed
```

**5. Start Development**
```bash
npm run dev
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Setup Guide](docs/SETUP_GUIDE.md) | Complete setup instructions |
| [Anthropic API Guide](docs/ANTHROPIC_API_GUIDE.md) | **⚠️ CRITICAL: Complete Claude API reference** |
| [Anthropic Migration Checklist](docs/ANTHROPIC_MIGRATION_CHECKLIST.md) | Claude 4.5 migration guide |
| [CLAUDE.md](CLAUDE.md) | Claude Code assistant instructions |
| [Migration Complete](docs/PERDIA_MIGRATION_COMPLETE.md) | Full migration report |
| [Migration Analysis](docs/BASE44_PERDIA_MIGRATION_ANALYSIS.md) | Base44 analysis |
| [Software Specs](docs/perdia%20Software%20Specifications.md) | Original requirements |

---

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run linter

# Database
npm run db:migrate   # Apply database migration
npm run db:seed      # Seed AI agents
npm run setup        # Complete setup (install + migrate + seed)
```

---

## 🚢 Deployment

### Netlify Project Information

- **Project ID:** `371d61d6-ad3d-4c13-8455-52ca33d1c0d4`
- **Account:** Perdia Education (New Netlify Account)
- **MCP Account:** `netlify-primary` (DisruptorsAI)
- **Dashboard:** https://app.netlify.com/sites/perdia-education/overview
- **Status:** ✅ Repository Connected

### Deploy to Netlify

1. ✅ Repository already connected to Netlify
2. Configure build settings (automated via [netlify.toml](netlify.toml)):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** 18
3. Set environment variables in [Netlify dashboard](https://app.netlify.com/sites/perdia-education/configuration/env):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ANTHROPIC_API_KEY`
   - `VITE_OPENAI_API_KEY`
4. Push to `main` branch → auto-deploy!

**Netlify CLI Commands:**
```bash
netlify deploy --prod        # Deploy to production
netlify env:list             # List environment variables
netlify open:site            # Open deployed site
netlify open:admin           # Open Netlify dashboard
```

See [netlify.toml](netlify.toml) for complete configuration.

### Deploy Supabase Edge Function

The AI invocation endpoint runs on Supabase Edge Functions (400-second timeout for long-form content generation).

**1. Link to Supabase Project:**
```bash
npx supabase link --project-ref yvvtsfgryweqfppilkvo
```

**2. Deploy the Function:**
```bash
npx supabase functions deploy invoke-llm --project-ref yvvtsfgryweqfppilkvo
```

**3. Configure Secrets:**
```bash
npx supabase secrets set ANTHROPIC_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set OPENAI_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo
```

**4. Verify Deployment:**
```bash
# List secrets
npx supabase secrets list --project-ref yvvtsfgryweqfppilkvo

# Test function
node scripts/test-invoke-llm.js
```

See [SUPABASE_EDGE_FUNCTION_DEPLOYMENT.md](./SUPABASE_EDGE_FUNCTION_DEPLOYMENT.md) for detailed deployment guide.

---

## 🏛️ Migration Status

### Base44 → Supabase: COMPLETE ✅

- ✅ **Database:** 16 tables with RLS policies
- ✅ **SDK Layer:** Custom Base44-compatible API
- ✅ **AI Integration:** Supabase Edge Functions (400s timeout)
- ✅ **Agent System:** Custom conversation management
- ✅ **Storage:** Supabase Storage (4 buckets)
- ✅ **Deployment:** Netlify (frontend) + Supabase (backend/AI)

### Infrastructure Consolidation (Nov 2025) ✅

- ✅ **Migrated:** AI invocation from Netlify Functions → Supabase Edge Functions
- ✅ **Benefit:** 400-second timeout (vs 26s on Netlify)
- ✅ **Cost Savings:** Consolidated infrastructure ($25/mo vs $44/mo)
- ✅ **Performance:** No more 504 timeout errors on long-form content

See [Migration Complete Report](docs/PERDIA_MIGRATION_COMPLETE.md) for full details.

---

## 📞 Support

**Questions?** Contact development team or create GitHub issue

**Documentation:** See `docs/` folder for complete guides

---

**Version:** 1.0.0
**Last Updated:** 2025-11-05
**Status:** ✅ Production Ready
**Netlify Project:** 371d61d6-ad3d-4c13-8455-52ca33d1c0d4
