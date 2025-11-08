# Browser Testing Quick Reference

**30-Second Cheat Sheet for Automated Browser Testing**

---

## 🚀 Quick Commands

```bash
# Quick test (read-only, no fixes)
claude /quick-test https://your-site.com

# Automated debug loop (fixes errors)
claude /debug-loop https://your-site.com

# Deploy and test
git add .
claude /deploy-test "your commit message"

# Direct script
npm run test:browser https://your-site.com
```

---

## 📦 Add to Any Project

```bash
# From Perdia repo directory
node scripts/global-browser-testing-setup.js

# Or download and run
curl -sSL https://raw.githubusercontent.com/yourusername/perdia-education/main/scripts/global-browser-testing-setup.js | node

# Restart Claude Desktop
# Done!
```

---

## 🔍 What Each Command Does

### `/quick-test <url>`
- ✅ Tests site in browser
- ✅ Reports errors and warnings
- ✅ Takes screenshot
- ❌ Does NOT fix anything

**Use:** Health checks, post-deploy verification

---

### `/debug-loop <url>`
- ✅ Tests site
- ✅ Finds errors
- ✅ Fixes code automatically
- ✅ Commits and pushes
- ✅ Re-tests until clean (max 10 loops)

**Use:** Automated error fixing

⚠️ **Costs:** Uses Claude API per fix (~$0.10-0.50/loop)

---

### `/deploy-test "<message>"`
- ✅ Commits staged changes
- ✅ Pushes to remote
- ✅ Monitors deployment
- ✅ Tests deployed site
- ✅ Reports results

**Use:** One-command deploy + verify

---

## 📁 Files Created

```
your-project/
├── .claude/
│   ├── mcp.json              ← Playwright MCP config
│   └── commands/
│       ├── quick-test.md     ← Quick test command
│       ├── debug-loop.md     ← Debug loop command
│       └── deploy-test.md    ← Deploy+test command
├── scripts/
│   └── browser-test.js       ← Standalone test script
├── .gitignore                ← Updated to ignore test artifacts
└── package.json              ← Updated with test scripts
```

---

## 🔧 Troubleshooting

### Playwright not working?
```bash
npx playwright install chromium --with-deps
```

### MCP not loading?
```bash
# Check config
cat .claude/mcp.json

# Restart Claude Desktop
```

### Commands not found?
```bash
# Verify commands exist
ls .claude/commands/

# Should see: quick-test.md, debug-loop.md, deploy-test.md
```

---

## 💡 Pro Tips

1. **Always start with `/quick-test`** before `/debug-loop`
2. **Review commits** before merging auto-fixes
3. **Set `PLAYWRIGHT_HEADLESS=false`** to watch browser
4. **Monitor API costs** when using `/debug-loop`
5. **Test locally first** with `npm test`

---

## 📊 Output Files

```bash
test-results.json      # Machine-readable results
test-results.md        # Human-readable report
screenshots/           # Browser screenshots
```

All in `.gitignore` - not committed to repo

---

## 🎯 Common Workflows

### After Deployment
```bash
git push
# Wait 30s
claude /quick-test https://my-app.netlify.app
```

### Fix All Errors
```bash
claude /debug-loop https://my-app.netlify.app
# Sit back and watch! ☕
```

### Deploy New Feature
```bash
git add .
claude /deploy-test "add user authentication"
# One command does it all!
```

---

## 🔗 Full Documentation

- **Complete Guide:** `docs/GLOBAL-BROWSER-TESTING-SETUP.md`
- **Agent Definition:** `.claude/agents/browser-testing-agent.md`
- **Commands:** `.claude/commands/*.md`

---

**Remember:** This works on ANY project after running the setup script!

Copy `scripts/global-browser-testing-setup.js` to any repo and run it. Boom! 💥
