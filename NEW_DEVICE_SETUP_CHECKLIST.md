# Perdia - New Device Setup Checklist

Use this checklist to verify your setup is complete.

---

## ✅ Pre-Setup Verification

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm 9+ installed (`npm --version`)
- [ ] Git installed (`git --version`)
- [ ] GitHub CLI installed (`gh --version`)
- [ ] Claude Code installed and working
- [ ] Access to Supabase project (can log in to dashboard)
- [ ] Access to Netlify account (can log in to dashboard)
- [ ] Anthropic Claude API key obtained
- [ ] OpenAI API key obtained

---

## ✅ Repository Setup

- [ ] Repository cloned: `git clone https://github.com/your-org/perdia.git`
- [ ] Changed into directory: `cd perdia`
- [ ] Dependencies installed: `npm install` (no errors)
- [ ] `.env.local` file created from `.env.example`
- [ ] `.claude/mcp.json` file exists with correct credentials

---

## ✅ Environment Configuration

### Check `.env.local` contains:

- [ ] `VITE_SUPABASE_URL=https://yvvtsfgryweqfppilkvo.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY=eyJhbGci...` (full key)
- [ ] `VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...` (full key)
- [ ] `ANTHROPIC_API_KEY=sk-ant-...` (your personal key)
- [ ] `VITE_ANTHROPIC_API_KEY=sk-ant-...` (your personal key)
- [ ] `OPENAI_API_KEY=sk-...` (your personal key)
- [ ] `VITE_OPENAI_API_KEY=sk-...` (your personal key)
- [ ] `VITE_CLOUDINARY_CLOUD_NAME=dvcvxhzmt`
- [ ] `VITE_CLOUDINARY_API_KEY=935251962635945`
- [ ] `VITE_CLOUDINARY_API_SECRET=CNppaSbbi...` (full key)

---

## ✅ MCP Configuration

### Check `.claude/mcp.json` contains:

- [ ] Supabase MCP server configured
  - [ ] Project ref: `yvvtsfgryweqfppilkvo`
  - [ ] Access token: `sbp_56a2e431ef...`

- [ ] Netlify MCP server configured
  - [ ] Auth token: `nfp_MLwjLNbFh8c...`
  - [ ] Site ID: `371d61d6-ad3d-4c13-8455-52ca33d1c0d4`

- [ ] Cloudinary MCP server configured
  - [ ] Cloud name: `dvcvxhzmt`
  - [ ] API key and secret present

- [ ] DataForSEO MCP server configured
  - [ ] Username: `will@disruptorsmedia.com`
  - [ ] Password present

---

## ✅ Database Setup

- [ ] Migration run successfully: `npm run db:migrate` (or `npm run setup`)
- [ ] Agents seeded: `npm run db:seed` (or included in setup)
- [ ] Verification passed: `node scripts/verify-migration.js`
  - [ ] Shows 16 tables created
  - [ ] Shows 4 storage buckets
  - [ ] Shows 9 AI agents seeded

---

## ✅ Development Server

- [ ] Dev server starts: `npm run dev` (no errors)
- [ ] Port assigned (note the port number): `____________`
- [ ] Can access in browser: `http://localhost:____`
- [ ] Homepage loads without errors
- [ ] Console shows: "🔓 Auth disabled - using mock user for testing"
- [ ] No red errors in browser console

---

## ✅ Application Testing

- [ ] AI Agents page loads: `/ai-agents` or nav menu
- [ ] Can see 9 agents in dropdown/list:
  - [ ] General Assistant
  - [ ] EMMA Promoter
  - [ ] Enrollment Strategist
  - [ ] History Storyteller
  - [ ] Resource Expander
  - [ ] Social Engagement Booster
  - [ ] SEO Content Writer
  - [ ] Content Optimizer
  - [ ] Keyword Researcher

- [ ] All tabs accessible:
  - [ ] Chat tab
  - [ ] Training tab
  - [ ] Knowledge tab
  - [ ] Feedback tab

---

## ✅ MCP Server Testing (in Claude Code)

Open the project in Claude Code and test each MCP:

- [ ] **Supabase MCP works**
  - Test: "Hey Claude, show me the tables in the Perdia database"
  - Expected: Lists 16 tables

- [ ] **Netlify MCP works**
  - Test: "Hey Claude, what's the deployment status?"
  - Expected: Shows perdia-education site info

- [ ] **Cloudinary MCP works**
  - Test: "Hey Claude, list recent Cloudinary uploads"
  - Expected: Shows media assets or confirms connection

- [ ] **DataForSEO MCP works**
  - Test: "Hey Claude, get keyword data for 'online education'"
  - Expected: Returns keyword metrics

---

## ✅ GitHub Integration (Optional)

If using DisruptorsAI GitHub account:

- [ ] Authenticated with GitHub: `gh auth login`
- [ ] DisruptorsAI account added to gh cli
- [ ] Can switch accounts: `gh auth switch --user disruptorsai`
- [ ] `.claude/settings.local.json` created with SessionStart hook
- [ ] Hook tested: Claude Code auto-switches account on project open

---

## ✅ Build & Deployment Test

- [ ] Production build works: `npm run build` (no errors)
- [ ] Build preview works: `npm run preview`
- [ ] Linter passes: `npm run lint` (or shows expected warnings only)

---

## ✅ Documentation Review

- [ ] Read `NEW_DEVICE_SETUP_GUIDE.md` (this was your main setup guide)
- [ ] Reviewed `CREDENTIALS_QUICK_REFERENCE.md` (saved for future reference)
- [ ] Reviewed `PERDIA_STATUS_REPORT.md` (understand what's built and what's not)
- [ ] Reviewed `CLAUDE.md` (main Claude Code instructions)
- [ ] Reviewed `README.md` (project overview)
- [ ] Reviewed `AUTH_DISABLED_FOR_TESTING.md` (understand mock auth setup)

---

## ✅ Access Verification

Verify you can log into each service:

- [ ] Supabase Dashboard: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo
- [ ] Netlify Dashboard: https://app.netlify.com/sites/perdia-education/overview
- [ ] Cloudinary Dashboard: https://console.cloudinary.com/console/c-dvcvxhzmt
- [ ] Anthropic Console: https://console.anthropic.com/
- [ ] OpenAI Platform: https://platform.openai.com/

---

## ✅ Security Checklist

- [ ] `.env.local` exists and is in `.gitignore`
- [ ] `.claude/mcp.json` is in `.gitignore`
- [ ] No credentials committed to git (`git status` shows no sensitive files)
- [ ] `NEW_DEVICE_SETUP_GUIDE.md` stored securely (encrypted or password manager)
- [ ] `CREDENTIALS_QUICK_REFERENCE.md` stored securely

---

## 🎯 Setup Complete!

If all items above are checked, your development environment is fully configured and ready.

### Next Steps:

1. Start working on features (see `PERDIA_STATUS_REPORT.md` for what needs to be built)
2. Test AI agent conversations (note: actual AI calls won't work until Netlify functions are built)
3. Review architecture documentation (`ARCHITECTURE_GUIDE.md`)
4. Schedule meeting with Jeff/Josh to answer project questions

---

## ❌ Troubleshooting

If any items above failed, refer to:

- **Setup Guide:** `NEW_DEVICE_SETUP_GUIDE.md` (troubleshooting section)
- **Credentials:** `CREDENTIALS_QUICK_REFERENCE.md` (verify all values)
- **Quick Reference:** See individual service dashboards for verification

Common issues:
- Missing environment variables → Check `.env.local` exists and has all keys
- MCP not working → Restart Claude Code, verify `.claude/mcp.json`
- Database errors → Run `npm run setup` again
- Port in use → Vite auto-assigns next port (5174, 5175, etc.)

---

**Checklist Version:** 1.0.0
**Last Updated:** November 6, 2025
**Time to Complete:** ~30-45 minutes (for first-time setup)

---

## Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run linter

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed AI agents
npm run setup            # Full setup (install + migrate + seed)

# Verification
node scripts/verify-migration.js  # Check database setup
npm run preview          # Preview production build

# Git
git status              # Check what's staged
git pull                # Get latest changes
git push                # Push your changes

# GitHub CLI
gh auth status          # Check which account is active
gh auth switch --user disruptorsai  # Switch to DisruptorsAI
```

---

✅ **Setup complete? You're ready to build!**
