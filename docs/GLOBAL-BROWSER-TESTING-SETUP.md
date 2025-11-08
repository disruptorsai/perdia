# Global Browser Testing & Auto-Debug System

**A reusable browser testing system you can add to ANY project in 30 seconds.**

---

## 🎯 What Is This?

A complete automated browser testing and debugging system that:

- ✅ Tests deployed sites in real browsers (Chromium via Playwright)
- ✅ Detects console errors, warnings, and network failures
- ✅ **Automatically fixes errors** in your codebase
- ✅ Commits and pushes fixes
- ✅ Monitors deployments and re-tests
- ✅ Repeats until all errors are resolved (max 10 loops)

**Works with:**
- Netlify, Vercel, or any web host
- React, Next.js, Vite, or any frontend framework
- Any git-based repository

---

## 🚀 Quick Start (30 Seconds)

### For Perdia Project (Already Set Up!)
```bash
# Test the deployed site
claude /quick-test https://perdia-education.netlify.app

# Start automated debugging loop
claude /debug-loop https://perdia-education.netlify.app

# Deploy and test
git add .
claude /deploy-test "add new feature"
```

### For ANY New Project
```bash
# Navigate to your project
cd /path/to/your/project

# Run the setup script (from Perdia repo or download it)
node /path/to/perdia/scripts/global-browser-testing-setup.js

# Or download and run in one command:
curl -sSL https://raw.githubusercontent.com/yourusername/perdia-education/main/scripts/global-browser-testing-setup.js | node

# Restart Claude Desktop
# Done! Use the commands above
```

---

## 📋 Available Commands

### `/quick-test <url>`
**Quick browser test without making changes**

```bash
claude /quick-test https://your-app.netlify.app
```

**What it does:**
1. Opens site in Chromium browser
2. Checks console for errors and warnings
3. Monitors network requests for failures
4. Takes screenshot
5. Reports findings

**Output:**
- ✅ PASS or ❌ FAIL status
- Error count and details
- Warning count
- Screenshot location
- Recommendations for fixes

**Use when:**
- After deployment to verify no errors
- Before starting work to check current state
- Investigating reported issues
- Quick health check

---

### `/debug-loop <url>`
**Automated debugging loop - fixes errors until clean**

```bash
claude /debug-loop https://your-app.netlify.app
```

**What it does:**
1. Test site → find errors
2. Analyze error root causes
3. Fix code in repository
4. Commit: `git commit -m "fix: [error]"`
5. Push: `git push`
6. Wait for deployment
7. Re-test
8. Repeat until clean (max 10 loops)

**Loop Control:**
- Maximum 10 iterations (prevents infinite loops)
- Stops if error persists after 3 fix attempts
- Reports detailed summary at end

**Use when:**
- After major refactoring to catch all errors
- Deploying to production and want zero errors
- Fixing multiple related errors
- Want hands-off debugging

**⚠️ Warning:** Uses Claude API for each fix iteration. Monitor your API costs!

---

### `/deploy-test "<message>"`
**Deploy current changes and test immediately**

```bash
git add .
claude /deploy-test "add user authentication"
```

**What it does:**
1. Run local tests: `npm test` or `npm run type-check`
2. Commit staged changes
3. Push to remote
4. Monitor deployment status
5. Wait for build to complete (max 5 minutes)
6. Test deployed site with Playwright
7. Report results

**Output:**
- Commit hash and message
- Deployment URL
- Build time
- Browser test results (PASS/FAIL)
- Screenshot if errors found

**Use when:**
- Deploying new features
- Want immediate feedback on deployment
- Combining deploy + test in one command
- Verifying deployment succeeded

---

## 🛠️ How It Works

### Architecture

```
┌─────────────────────┐
│   Your Project      │
│                     │
│  .claude/           │
│    ├── mcp.json     │  ← Playwright MCP configured
│    └── commands/    │  ← Slash commands
│                     │
│  scripts/           │
│    └── browser-     │  ← Standalone test script
│        test.js      │
│                     │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Playwright MCP     │  ← Automates Chromium browser
│  @executeautomation │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Your Deployed Site │  ← Tests in real browser
│  (Netlify/Vercel)   │
└─────────────────────┘
```

### What Gets Installed

1. **Playwright** (`playwright`, `@playwright/test`) - Browser automation
2. **Playwright MCP** - Claude Code integration
3. **3 Slash Commands** - `/quick-test`, `/debug-loop`, `/deploy-test`
4. **Helper Scripts** - `scripts/browser-test.js`
5. **Package.json Scripts** - `npm run test:browser`
6. **.gitignore Updates** - Ignore test artifacts

---

## 🧪 Example Workflows

### Workflow 1: Post-Deployment Verification

```bash
# You just deployed to production
git push

# Wait 30 seconds, then test
claude /quick-test https://my-app.netlify.app

# ✅ PASS - no errors found
# or
# ❌ FAIL - 3 errors detected
#   Error 1: Cannot read property 'name' of undefined
#   Location: src/components/UserProfile.jsx:42
```

**What to do:**
- If PASS → ship it! 🎉
- If FAIL → review errors, run `/debug-loop` to auto-fix

---

### Workflow 2: Automated Error Fixing

```bash
# Your site has errors in production
claude /debug-loop https://my-app.netlify.app

# Loop Iteration 1:
# → Found error: "Cannot read property 'name' of undefined"
# → Fixed by adding null check: if (user?.name)
# → Committed: fix: add null check for user in UserProfile
# → Pushed and deployed
# → Re-testing...

# Loop Iteration 2:
# → Found error: "Failed to load: https://api.example.com/users"
# → Fixed by updating API endpoint
# → Committed: fix: update API endpoint to new URL
# → Pushed and deployed
# → Re-testing...

# Loop Iteration 3:
# → No errors found!
# ✅ All errors resolved in 2 iterations

# Summary:
# - Total errors fixed: 2
# - Commits made: 2
# - Final deployment: https://my-app.netlify.app
# - Screenshot: screenshots/deployment-clean.png
```

---

### Workflow 3: Deploy and Test (One Command)

```bash
# You've made changes and want to deploy + test
git add .
claude /deploy-test "add dark mode toggle"

# → Running local tests... ✅ PASS
# → Committing: feat: add dark mode toggle
# → Pushing to remote...
# → Monitoring deployment... (build started)
# → Waiting for build... (45s elapsed)
# → Build complete! ✅
# → Deployment URL: https://my-app-git-main.netlify.app
# → Testing deployed site...
# → No errors found! ✅ PASS
# → Screenshot: screenshots/deploy-test-2025-11-07.png

# Overall Status: ✅ PASS
# Your feature is live and error-free!
```

---

## 📊 Output Examples

### Quick Test Output

```markdown
# Browser Test Report

**URL**: https://perdia-education.netlify.app
**Timestamp**: 2025-11-07T10:30:00Z
**Status**: FAIL

## Summary
- Errors: 2
- Warnings: 1
- Screenshot: screenshots/deployment-test.png

## Errors

### Error 1
- **Type**: Console Error
- **Message**: Cannot read property 'name' of undefined
- **Location**: src/components/UserProfile.jsx:42
- **Stack Trace**:
```
TypeError: Cannot read property 'name' of undefined
    at UserProfile (src/components/UserProfile.jsx:42:15)
    at renderWithHooks (react-dom.development.js:14985:18)
```

### Error 2
- **Type**: Network Failure
- **Message**: Failed to load: https://api.example.com/users
- **Failure**: net::ERR_NAME_NOT_RESOLVED

## Warnings

### Warning 1
- **Type**: Console Warning
- **Message**: React does not recognize the `customProp` prop on a DOM element
```

---

### Debug Loop Output

```markdown
# Automated Debugging Loop - Final Report

**URL**: https://my-app.netlify.app
**Started**: 2025-11-07 10:00 UTC
**Completed**: 2025-11-07 10:15 UTC
**Total Time**: 15 minutes

## Summary
- ✅ Status: SUCCESS
- 🔁 Iterations: 3
- 🐛 Errors Fixed: 5
- 📝 Commits Made: 5
- 📸 Final Screenshot: screenshots/final-clean.png

## Errors Fixed

1. **Iteration 1**
   - Error: Cannot read property 'name' of undefined
   - File: src/components/UserProfile.jsx:42
   - Fix: Added null check `if (user?.name)`
   - Commit: `fix: add null check for user in UserProfile`

2. **Iteration 1**
   - Error: Failed to load: https://api.example.com/users
   - Fix: Updated to new API endpoint
   - Commit: `fix: update API endpoint to api-v2.example.com`

3. **Iteration 2**
   - Error: Undefined variable 'config'
   - File: src/lib/api-client.js:12
   - Fix: Import config from environment
   - Commit: `fix: import config in api-client`

4. **Iteration 2**
   - Error: CORS error on /api/data endpoint
   - Fix: Added CORS headers to Netlify config
   - Commit: `fix: add CORS headers to Netlify config`

5. **Iteration 3**
   - Error: 404 on /assets/logo.png
   - Fix: Updated logo path to correct location
   - Commit: `fix: correct logo asset path`

## Final State
- Console Errors: 0
- Console Warnings: 0
- Network Failures: 0
- Deployment URL: https://my-app.netlify.app
- Screenshot: screenshots/final-clean.png

✅ Site is now error-free!
```

---

## ⚙️ Configuration

### Environment Variables

Create `.env.local` in your project:

```bash
# Browser Testing
PLAYWRIGHT_HEADLESS=false  # Set to true for CI/CD

# Deployment Monitoring (auto-detected from Netlify MCP)
NETLIFY_SITE_ID=your-site-id
NETLIFY_AUTH_TOKEN=your-auth-token

# Optional: Claude API
ANTHROPIC_API_KEY=your-api-key  # For debug loop
```

### MCP Configuration

The setup script automatically adds this to `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"],
      "env": {
        "PLAYWRIGHT_HEADLESS": "false"
      },
      "description": "Playwright for automated browser testing"
    }
  }
}
```

---

## 🧩 Integration with CI/CD

### GitHub Actions

The setup includes a GitHub Actions workflow (`.github/workflows/auto-debug.yml`) that:

1. Triggers on deployment success
2. Waits for site to be ready
3. Runs browser tests automatically
4. Creates GitHub issue if errors found
5. Attempts auto-fix and creates PR

**To enable:**
1. Add `ANTHROPIC_API_KEY` to GitHub Secrets
2. Push the workflow file to your repo
3. GitHub Actions will auto-test every deployment

---

## 💰 Cost Considerations

### API Usage

Each `/debug-loop` iteration uses:
- **~5,000 tokens** for testing and error analysis
- **~20,000 tokens** per fix iteration
- **Estimated cost: $0.10-0.50 per full debug loop**

### Tips to Minimize Costs

1. **Use `/quick-test` first** - Free (no LLM calls), just reports errors
2. **Fix simple errors manually** - Use `/debug-loop` for complex issues
3. **Set iteration limits** - Default is 10 max
4. **Review before enabling CI/CD** - Avoid auto-triggering on every deploy

---

## 🔒 Security & Privacy

### What Data Is Collected?

- **Browser test results** (errors, warnings, URLs)
- **Screenshots** (stored locally only)
- **No user data** or sensitive information

### What Gets Committed?

- Code fixes only (standard git commits)
- Test results are **not** committed (in `.gitignore`)
- Screenshots are local only

### API Keys Required

- **Anthropic API Key** (for `/debug-loop` only)
- **Netlify Auth Token** (if using Netlify MCP)
- All stored in `.env.local` (never committed)

---

## 🐛 Troubleshooting

### Playwright Not Opening Browser

```bash
# Reinstall Playwright browsers
npx playwright install chromium --with-deps

# Check HEADLESS setting
export PLAYWRIGHT_HEADLESS=false
```

### MCP Not Working

```bash
# Verify MCP configuration
cat .claude/mcp.json

# Restart Claude Desktop
# MCP servers reload on restart

# Test manually
npx @executeautomation/playwright-mcp-server
```

### Slash Commands Not Found

```bash
# Check commands directory
ls .claude/commands/

# Should see:
# - quick-test.md
# - debug-loop.md
# - deploy-test.md

# Restart Claude Code CLI
claude --version
```

### Tests Timing Out

```bash
# Increase timeout in browser-test.js
# Change: timeout: 30000
# To: timeout: 60000

# Or set environment variable
export TEST_TIMEOUT=60000
```

---

## 📚 Advanced Usage

### Test Multiple Pages

```javascript
// Modify scripts/browser-test.js to test multiple routes
const routes = ['/', '/about', '/contact', '/dashboard'];
for (const route of routes) {
  await testDeployment(baseUrl + route);
}
```

### Add Authentication Testing

```javascript
// Add login flow before testing
await page.goto(url + '/login');
await page.fill('input[name="email"]', 'test@example.com');
await page.fill('input[name="password"]', 'password123');
await page.click('button[type="submit"]');
await page.waitForURL(url + '/dashboard');
// Now test authenticated pages
```

### Performance Monitoring

```javascript
// Add performance metrics
const metrics = await page.evaluate(() => {
  const navigation = performance.getEntriesByType('navigation')[0];
  return {
    loadTime: navigation.loadEventEnd - navigation.fetchStart,
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
    firstPaint: performance.getEntriesByType('paint')[0].startTime
  };
});
console.log('Performance:', metrics);
```

---

## 🎓 Best Practices

1. **Start with `/quick-test`** - Understand errors before auto-fixing
2. **Review auto-fix commits** - Before merging to production
3. **Use in development** - Catch errors early
4. **Monitor API costs** - Set budget alerts for Claude API
5. **Keep iteration limits** - Prevent infinite loops (max 10)
6. **Test locally first** - Use `npm test` before deploying
7. **Screenshot everything** - Visual proof of state

---

## 📞 Support

### Documentation
- This file: `docs/GLOBAL-BROWSER-TESTING-SETUP.md`
- Agent definition: `.claude/agents/browser-testing-agent.md`
- Slash commands: `.claude/commands/*.md`

### Issues
If you encounter problems:
1. Check troubleshooting section above
2. Review error messages carefully
3. Ensure Playwright is installed: `npx playwright --version`
4. Verify MCP config: `cat .claude/mcp.json`

---

## 🚀 Next Steps

1. **Test the setup** - Run `/quick-test` on a deployed site
2. **Try debug loop** - Use `/debug-loop` to auto-fix errors
3. **Integrate with CI/CD** - Enable GitHub Actions
4. **Customize for your project** - Modify scripts as needed
5. **Share with team** - Add setup to any project

---

**Happy Testing! 🎉**

This system is designed to save you hours of manual debugging. Use it wisely, monitor costs, and enjoy automated browser testing across all your projects!
