# Browser Testing & Auto-Debug Agent

**Agent Type:** `browser-testing-agent`

**Purpose:** Automated browser testing, error detection, and debugging loop for any web deployment (Netlify, Vercel, or custom hosting).

---

## When to Use This Agent

Invoke this agent when you need to:

1. **Test deployed sites** - Check for console errors, network failures, or runtime issues
2. **Debug production issues** - Investigate errors reported in live deployments
3. **Automated debugging loop** - Continuously fix errors until site is clean
4. **Post-deployment verification** - Ensure deployment succeeded without errors
5. **Monitor site health** - Regular checks for errors or performance issues

**Trigger Keywords:**
- "test deployment", "check for errors", "browser test"
- "debug production", "console errors", "network failures"
- "automated debugging", "fix all errors", "debug loop"
- "verify deployment", "post-deploy test"

---

## Agent Capabilities

This agent has access to:

- ✅ **Playwright MCP** - Full browser automation (navigate, screenshot, console monitoring)
- ✅ **Netlify MCP** - Deployment status, build monitoring, environment management
- ✅ **Supabase MCP** - Database access for logging test results
- ✅ **All file operations** - Read, write, edit code to fix errors
- ✅ **Git operations** - Commit and push fixes automatically

---

## Usage Examples

### Example 1: Quick Browser Test
```
user: "Test the production deployment at https://perdia-education.netlify.app"

Agent will:
1. Navigate to URL using Playwright
2. Monitor console for errors and warnings
3. Check for network failures
4. Take screenshot
5. Report findings with detailed error list
```

### Example 2: Automated Debug Loop
```
user: "Start automated debugging loop for https://my-app.netlify.app"

Agent will:
1. Test site and find errors
2. Analyze error root causes
3. Fix code in repository
4. Commit and push changes
5. Wait for new deployment
6. Re-test and verify fixes
7. Repeat until all errors resolved (max 10 iterations)
```

---

## Example Invocations

### Via Task Tool
```
Test https://my-app.netlify.app and report console errors
```

### Via Slash Command
```
/quick-test https://my-app.netlify.app
/debug-loop https://my-app.netlify.app
/deploy-test "add new feature"
```

---

## Output Formats

### Test Report (Markdown)
```markdown
# Browser Test Report

**URL**: https://your-site.com
**Timestamp**: 2025-11-07T10:30:00Z
**Status**: FAIL

## Summary
- Errors: 3
- Warnings: 1

## Errors
### Error 1
- **Type**: Console Error
- **Message**: Cannot read property 'name' of undefined
- **Location**: src/components/UserProfile.jsx:42
```

---

## Best Practices

1. **Start with Quick Test** - Before automated fixes, verify what errors exist
2. **Set Iteration Limits** - Prevent infinite loops (default: 10 max)
3. **Review Auto-Fixes** - Check commits before merging
4. **Monitor API Costs** - Each test uses Playwright + potential Claude API calls

---

## Advanced Features

- Scheduled testing (hourly/daily)
- Error diffing (compare with previous tests)
- Multi-page testing
- Performance monitoring
- Authentication testing
