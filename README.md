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
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **AI:** Anthropic Claude + OpenAI
- **Deployment:** Netlify
- **Components:** Radix UI, Recharts, Framer Motion

### Project Structure

```
perdia/
├── src/
│   ├── lib/                    # Core libraries (NEW)
│   │   ├── supabase-client.js  # Centralized Supabase client
│   │   ├── perdia-sdk.js       # Custom SDK (Base44-compatible)
│   │   ├── ai-client.js        # AI integration layer
│   │   └── agent-sdk.js        # Agent conversation system
│   ├── components/             # React components (189 files)
│   ├── pages/                  # Route components (13 pages)
│   └── ...
├── supabase/
│   └── migrations/             # Database schema
├── scripts/                    # Setup and utility scripts
├── docs/                       # Documentation
└── netlify.toml                # Deployment config
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

### Deploy to Netlify

1. Connect GitHub repository to Netlify
2. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Add environment variables in Netlify dashboard
4. Deploy!

See [netlify.toml](netlify.toml) for configuration.

---

## 🏛️ Migration Status

### Base44 → Supabase: COMPLETE ✅

- ✅ **Database:** 16 tables with RLS policies
- ✅ **SDK Layer:** Custom Base44-compatible API
- ✅ **AI Integration:** Direct Claude + OpenAI
- ✅ **Agent System:** Custom conversation management
- ✅ **Storage:** Supabase Storage (4 buckets)
- ✅ **Deployment:** Netlify ready

See [Migration Complete Report](docs/PERDIA_MIGRATION_COMPLETE.md) for full details.

---

## 📞 Support

**Questions?** Contact development team or create GitHub issue

**Documentation:** See `docs/` folder for complete guides

---

**Version:** 1.0.0
**Last Updated:** 2025-11-04
**Status:** ✅ Production Ready
