---
name: deploy-test
description: Deploy current changes and test in browser
---

# Deploy and Test

## Step 1: Pre-Deployment Checks
1. Run local tests if available: `npm test` or `npm run type-check`
2. Check for uncommitted changes: `git status`
3. Verify all files are staged

## Step 2: Commit and Deploy
1. Commit staged changes with message: `git commit -m "feat: $ARGUMENTS"`
2. Push to remote: `git push origin mvp` (or current branch)
3. Display commit hash and message

## Step 3: Monitor Deployment
1. Use Netlify MCP to monitor deployment status
2. Wait for build to start (30 seconds)
3. Check build progress every 15 seconds
4. Maximum wait time: 5 minutes
5. Report build status (success, failed, or timeout)

## Step 4: Browser Testing
Once deployed:
1. Get the deployment URL from Netlify
2. Navigate to the deployed site using Playwright
3. Wait for page load
4. Check console for errors and warnings
5. Test key functionality
6. Take screenshot

## Step 5: Report
Provide a comprehensive deployment report:
- **Commit:** Hash and message
- **Branch:** Current branch name
- **Deployment Status:** Success/Failed
- **Deployment URL:** Live site URL
- **Build Time:** How long the build took
- **Browser Test Results:**
  - Errors found: Count and details
  - Warnings found: Count and details
  - Screenshot location
- **Overall Status:** PASS or FAIL

If deployment or tests fail, provide recommendations for fixes.
