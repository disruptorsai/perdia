# Perdia Setup Documentation - Index

**Quick access to all setup and configuration documents**

---

## 📋 Setup Documents (Created November 6, 2025)

### 1. **NEW_DEVICE_SETUP_GUIDE.md** ⭐ START HERE
**Purpose:** Complete step-by-step guide for setting up Perdia on a new device

**What's included:**
- ✅ Prerequisites and software installation
- ✅ Repository setup instructions
- ✅ Environment configuration (`.env.local`)
- ✅ MCP server configuration (`.claude/mcp.json`)
- ✅ Database setup and migration
- ✅ All credentials and API keys included
- ✅ Testing procedures
- ✅ Troubleshooting section

**When to use:** Setting up a brand new development machine

**Time required:** 30-45 minutes

---

### 2. **CREDENTIALS_QUICK_REFERENCE.md** 🔑
**Purpose:** Copy-paste ready credentials for all services

**What's included:**
- ✅ Complete `.env.local` file template
- ✅ Complete `.claude/mcp.json` file content
- ✅ Individual credential breakdowns
- ✅ Service login URLs
- ✅ Quick setup commands

**When to use:**
- Quick reference while setting up
- When you need to copy a specific credential
- Recovering from lost credentials

**⚠️ Security:** Keep this file secure and private!

---

### 3. **NEW_DEVICE_SETUP_CHECKLIST.md** ✅
**Purpose:** Verify your setup is complete and working

**What's included:**
- ✅ Checkbox list for every setup step
- ✅ Verification procedures
- ✅ MCP server testing
- ✅ Application testing checklist
- ✅ Security verification
- ✅ Quick troubleshooting

**When to use:**
- During setup to track progress
- After setup to verify everything works
- Troubleshooting a broken setup

---

### 4. **PERDIA_STATUS_REPORT.md** 📊
**Purpose:** Understand the current state of the app and what needs to be built

**What's included:**
- ✅ What's been built (foundation, agents, UI)
- ✅ What's missing (70-80% of spec features)
- ✅ Critical questions for Jeff/Josh
- ✅ Risks and concerns
- ✅ Phased approach recommendation

**When to use:**
- Understanding project status
- Planning what to build next
- Preparing for meetings with Jeff/Josh

---

### 5. **AUTH_DISABLED_FOR_TESTING.md** 🔓
**Purpose:** Document that authentication is temporarily disabled

**What's included:**
- ✅ What changes were made to disable auth
- ✅ How to re-enable authentication
- ✅ Security warnings
- ✅ Notes about RLS and database access

**When to use:**
- Understanding why login isn't required
- Re-enabling auth when ready
- Troubleshooting auth-related issues

---

## 📚 Existing Documentation

### Project Documentation

- **README.md** - Project overview, quick start, deployment info
- **CLAUDE.md** - Main instructions for Claude Code
- **ARCHITECTURE_GUIDE.md** - Architecture patterns and best practices
- **netlify.toml** - Netlify deployment configuration

### Migration Documentation

- **docs/PERDIA_MIGRATION_COMPLETE.md** - Full migration report from Base44
- **docs/SETUP_GUIDE.md** - Original setup guide (pre-migration)
- **docs/perdia Software Specifications.md** - Original project requirements

### Configuration Files

- **.env.example** - Environment variables template
- **.claude/mcp.json.example** - MCP configuration template
- **.claude/README.md** - Claude Code configuration guide

---

## 🚀 Quick Start Paths

### Path 1: Brand New Setup (Never worked on this before)

1. Read: `NEW_DEVICE_SETUP_GUIDE.md` (full guide)
2. Follow: `NEW_DEVICE_SETUP_CHECKLIST.md` (track progress)
3. Reference: `CREDENTIALS_QUICK_REFERENCE.md` (copy credentials)
4. Review: `PERDIA_STATUS_REPORT.md` (understand project state)
5. Read: `CLAUDE.md` (Claude Code workflow)

**Total time:** ~1 hour

---

### Path 2: Quick Credential Recovery (Lost .env.local or mcp.json)

1. Go to: `CREDENTIALS_QUICK_REFERENCE.md`
2. Copy complete `.env.local` content
3. Copy complete `.claude/mcp.json` content
4. Verify with: `NEW_DEVICE_SETUP_CHECKLIST.md`

**Total time:** ~5 minutes

---

### Path 3: Understanding Project Only (Not setting up)

1. Read: `README.md` (overview)
2. Read: `PERDIA_STATUS_REPORT.md` (current state)
3. Read: `docs/perdia Software Specifications.md` (full requirements)
4. Review: `CLAUDE.md` (how to work with Claude Code)

**Total time:** ~30 minutes

---

### Path 4: Troubleshooting Broken Setup

1. Check: `NEW_DEVICE_SETUP_CHECKLIST.md` (find what's missing)
2. Reference: `NEW_DEVICE_SETUP_GUIDE.md` → Troubleshooting section
3. Verify credentials: `CREDENTIALS_QUICK_REFERENCE.md`
4. Check auth status: `AUTH_DISABLED_FOR_TESTING.md`

**Total time:** ~15 minutes

---

## 🔐 Security Important Files

**NEVER commit these to git:**
- `.env.local` ❌
- `.claude/mcp.json` ❌
- `NEW_DEVICE_SETUP_GUIDE.md` ⚠️ (contains credentials)
- `CREDENTIALS_QUICK_REFERENCE.md` ⚠️ (contains credentials)

**Store securely:**
- Password manager (recommended)
- Encrypted drive
- Team shared secret vault (1Password, etc.)

**Already gitignored:**
- `.env.local` ✅
- `.claude/mcp.json` ✅
- `.claude/settings.local.json` ✅

---

## 📞 Getting Help

### Documentation Issues
- Credential not working → Check service dashboard
- Setup step failing → See troubleshooting in setup guide
- Understanding project → Read status report

### Technical Issues
- Build errors → Check `package.json` and `npm install`
- Database errors → Verify Supabase credentials and RLS
- MCP not working → Restart Claude Code, check mcp.json
- Auth issues → See `AUTH_DISABLED_FOR_TESTING.md`

### Project Questions
- What to build next → See `PERDIA_STATUS_REPORT.md`
- How features work → Ask Jeff/Josh (questions in status report)
- Architecture patterns → See `ARCHITECTURE_GUIDE.md`

---

## 🗂️ File Organization

```
perdia/
├── NEW_DEVICE_SETUP_GUIDE.md          ⭐ Main setup guide
├── CREDENTIALS_QUICK_REFERENCE.md     🔑 All credentials
├── NEW_DEVICE_SETUP_CHECKLIST.md      ✅ Verification checklist
├── PERDIA_STATUS_REPORT.md            📊 Current project status
├── AUTH_DISABLED_FOR_TESTING.md       🔓 Auth status
├── SETUP_DOCUMENTATION_INDEX.md       📋 This file
│
├── README.md                          📖 Project overview
├── CLAUDE.md                          🤖 Claude Code instructions
├── ARCHITECTURE_GUIDE.md              🏗️ Architecture patterns
│
├── .env.example                       📝 Env template
├── .env.local                         🔒 Your credentials (gitignored)
│
├── .claude/
│   ├── mcp.json                       🔒 Your MCP config (gitignored)
│   ├── mcp.json.example               📝 MCP template
│   ├── settings.local.json            🔒 Personal settings (gitignored)
│   └── README.md                      📖 Claude config guide
│
└── docs/
    ├── PERDIA_MIGRATION_COMPLETE.md   📜 Migration report
    ├── SETUP_GUIDE.md                 📜 Original setup guide
    └── perdia Software Specifications.md  📜 Project requirements
```

---

## ⚡ Essential Commands

```bash
# Setup
npm install                    # Install dependencies
npm run setup                  # Full setup (migrate + seed)

# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run lint                   # Run linter

# Database
npm run db:migrate             # Run migrations
npm run db:seed                # Seed AI agents
node scripts/verify-migration.js  # Verify database

# Git
git status                     # Check status
git pull                       # Get latest changes
gh auth switch --user disruptorsai  # Switch GitHub account
```

---

## 🎯 Next Steps After Setup

1. ✅ Complete setup using checklist
2. ✅ Verify all MCP servers work
3. ✅ Test the app in browser
4. ✅ Read the status report
5. ✅ Review what needs to be built
6. ✅ Schedule meeting with Jeff/Josh to answer project questions

---

**Index Version:** 1.0.0
**Last Updated:** November 6, 2025
**Documents Created:** 6 new setup guides
**Status:** ✅ Complete and ready for team use
