#!/usr/bin/env node

/**
 * Global Browser Testing Setup Script
 *
 * This script adds browser testing capabilities to ANY project.
 * Run once per project to enable automated browser testing and debugging.
 *
 * Usage:
 *   node scripts/global-browser-testing-setup.js
 *
 * Or from any project:
 *   curl -sSL https://raw.githubusercontent.com/yourusername/perdia-education/main/scripts/global-browser-testing-setup.js | node
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Global Browser Testing & Auto-Debug System...\n');

// Detect project root
const projectRoot = process.cwd();
console.log(`📁 Project root: ${projectRoot}\n`);

// Step 1: Install Playwright
console.log('📦 Installing Playwright...');
try {
  execSync('npm install --save-dev playwright @playwright/test', { stdio: 'inherit' });
  console.log('✅ Playwright installed\n');
} catch (error) {
  console.error('❌ Failed to install Playwright:', error.message);
  process.exit(1);
}

// Step 2: Add Playwright MCP to project config
console.log('🔧 Configuring Playwright MCP...');

const claudeDir = path.join(projectRoot, '.claude');
if (!fs.existsSync(claudeDir)) {
  fs.mkdirSync(claudeDir, { recursive: true });
}

const mcpConfigPath = path.join(claudeDir, 'mcp.json');
let mcpConfig = { mcpServers: {} };

if (fs.existsSync(mcpConfigPath)) {
  mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
}

// Add Playwright MCP server
mcpConfig.mcpServers.playwright = {
  command: 'npx',
  args: ['-y', '@executeautomation/playwright-mcp-server'],
  env: {
    PLAYWRIGHT_HEADLESS: 'false'
  },
  description: 'Playwright for automated browser testing and debugging'
};

fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
console.log('✅ Playwright MCP configured\n');

// Step 3: Create slash commands
console.log('📝 Creating slash commands...');

const commandsDir = path.join(claudeDir, 'commands');
if (!fs.existsSync(commandsDir)) {
  fs.mkdirSync(commandsDir, { recursive: true });
}

// Quick Test Command
const quickTestCommand = `---
name: quick-test
description: Quick browser test of deployed site
---

# Quick Browser Test

1. Navigate to $ARGUMENTS in a browser using Playwright
2. Wait for page to fully load (networkidle)
3. Check browser console for any errors or warnings
4. Capture all console messages with their types and locations
5. Test key functionality (forms, navigation, API calls)
6. Take a screenshot of the current state
7. Report findings with error/warning counts
8. **IMPORTANT:** Do NOT make any code changes - just report status

## Output Format
- **URL Tested:** The deployment URL
- **Timestamp:** When the test was run
- **Status:** PASS or FAIL
- **Errors:** Count and details
- **Warnings:** Count and details
- **Screenshot:** Path to saved screenshot
`;

fs.writeFileSync(path.join(commandsDir, 'quick-test.md'), quickTestCommand);

// Debug Loop Command
const debugLoopCommand = `---
name: debug-loop
description: Automated debugging loop for deployed site
---

# Automated Debugging Loop

Execute the following steps in a loop until no errors remain (max 10 iterations):

## Phase 1: Navigate and Inspect
1. Navigate to the deployment URL: $ARGUMENTS
2. Wait for page to fully load (check for network idle)
3. Capture all console errors, warnings, and network failures
4. Take a screenshot of the current state

## Phase 2: Error Analysis
If console errors or network failures are detected:
1. Extract the full error message, stack trace, and line numbers
2. Identify the source file and specific code causing the error
3. Determine the root cause
4. Plan the fix required

## Phase 3: Fix Implementation
1. Locate the problematic file in the codebase
2. Implement the fix with proper error handling
3. Ensure the fix doesn't break existing functionality
4. Run local tests to verify: \`npm test\` or \`npm run type-check\`

## Phase 4: Deployment
1. Stage changes: \`git add .\`
2. Commit with descriptive message: \`git commit -m "fix: [error description]"\`
3. Push to remote: \`git push\`
4. Display commit hash and message

## Phase 5: Monitor Deployment
1. Wait 30 seconds for build to start
2. Check deployment status every 15 seconds (max 5 minutes)
3. Report when deployment is live
4. Get the new deployment URL

## Phase 6: Verification
1. Navigate to the newly deployed site
2. Check console for errors again
3. Verify the original error is resolved
4. Check for any new errors introduced

## Loop Control
- Maximum iterations: 10 loops
- If errors persist after 10 loops, stop and report detailed findings
- If no errors found, report success and create a summary
`;

fs.writeFileSync(path.join(commandsDir, 'debug-loop.md'), debugLoopCommand);

// Deploy Test Command
const deployTestCommand = `---
name: deploy-test
description: Deploy current changes and test in browser
---

# Deploy and Test

## Step 1: Pre-Deployment Checks
1. Run local tests if available
2. Check for uncommitted changes: \`git status\`
3. Verify all files are staged

## Step 2: Commit and Deploy
1. Commit staged changes: \`git commit -m "feat: $ARGUMENTS"\`
2. Push to remote: \`git push\`
3. Display commit hash and message

## Step 3: Monitor Deployment
1. Wait for build to start (30 seconds)
2. Check build progress every 15 seconds
3. Maximum wait time: 5 minutes
4. Report build status (success, failed, or timeout)

## Step 4: Browser Testing
Once deployed:
1. Get the deployment URL
2. Navigate to the deployed site using Playwright
3. Wait for page load
4. Check console for errors and warnings
5. Test key functionality
6. Take screenshot

## Step 5: Report
Provide a comprehensive deployment report including commit hash, deployment URL, browser test results, and overall status (PASS/FAIL).
`;

fs.writeFileSync(path.join(commandsDir, 'deploy-test.md'), deployTestCommand);

console.log('✅ Slash commands created\n');

// Step 4: Create helper scripts
console.log('🛠️  Creating helper scripts...');

const scriptsDir = path.join(projectRoot, 'scripts');
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

// Browser Test Script
const browserTestScript = `/**
 * Browser testing script for automated debugging
 * Run with: node scripts/browser-test.js <url>
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testDeployment(url) {
  console.log(\`🔍 Testing deployment: \${url}\`);

  const browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const warnings = [];

  // Capture console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      errors.push({ type, text, location: msg.location() });
      console.error(\`❌ Console Error: \${text}\`);
    } else if (type === 'warning') {
      warnings.push({ type, text });
      console.warn(\`⚠️  Console Warning: \${text}\`);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    errors.push({
      type: 'pageerror',
      text: error.message,
      stack: error.stack
    });
    console.error(\`❌ Page Error: \${error.message}\`);
  });

  // Capture network failures
  page.on('requestfailed', request => {
    errors.push({
      type: 'network',
      text: \`Failed to load: \${request.url()}\`,
      failure: request.failure()
    });
    console.error(\`❌ Network Error: \${request.url()}\`);
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    const screenshotsDir = path.join(process.cwd(), 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    await page.screenshot({
      path: path.join(screenshotsDir, 'deployment-test.png'),
      fullPage: true
    });

    console.log('\\n📊 Test Results:');
    console.log(\`   Errors: \${errors.length}\`);
    console.log(\`   Warnings: \${warnings.length}\`);

    const report = {
      url,
      timestamp: new Date().toISOString(),
      errors,
      warnings,
      screenshot: 'screenshots/deployment-test.png'
    };

    fs.writeFileSync('test-results.json', JSON.stringify(report, null, 2));

    let markdown = \`# Browser Test Report\\n\\n\`;
    markdown += \`**URL**: \${url}\\n\`;
    markdown += \`**Timestamp**: \${report.timestamp}\\n\\n\`;
    markdown += \`## Summary\\n- Errors: \${errors.length}\\n- Warnings: \${warnings.length}\\n\\n\`;

    if (errors.length > 0) {
      markdown += \`## Errors\\n\\n\`;
      errors.forEach((error, i) => {
        markdown += \`### Error \${i + 1}\\n\`;
        markdown += \`- **Type**: \${error.type}\\n\`;
        markdown += \`- **Message**: \${error.text}\\n\`;
        if (error.stack) markdown += \`- **Stack**: \\\`\\\`\\\`\\n\${error.stack}\\n\\\`\\\`\\\`\\n\`;
        if (error.location) markdown += \`- **Location**: \${JSON.stringify(error.location)}\\n\`;
        markdown += \`\\n\`;
      });
    }

    fs.writeFileSync('test-results.md', markdown);
    console.log('\\n✅ Report saved to test-results.json and test-results.md');

  } catch (error) {
    console.error(\`❌ Test failed: \${error.message}\`);
    process.exit(1);
  } finally {
    await browser.close();
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

const url = process.argv[2];
if (!url) {
  console.error('Usage: node scripts/browser-test.js <url>');
  process.exit(1);
}

testDeployment(url);
`;

fs.writeFileSync(path.join(scriptsDir, 'browser-test.js'), browserTestScript);
console.log('✅ Helper scripts created\n');

// Step 5: Update package.json
console.log('📄 Updating package.json...');

const packageJsonPath = path.join(projectRoot, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }

  packageJson.scripts['test:browser'] = 'node scripts/browser-test.js';
  packageJson.scripts['test:deployment'] = 'node scripts/browser-test.js';

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ package.json updated\n');
}

// Step 6: Update .gitignore
console.log('🚫 Updating .gitignore...');

const gitignorePath = path.join(projectRoot, '.gitignore');
let gitignoreContent = '';

if (fs.existsSync(gitignorePath)) {
  gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
}

const gitignoreAdditions = [
  '',
  '# Browser Testing Artifacts',
  'test-results.json',
  'test-results.md',
  'screenshots/',
  'playwright-report/',
  '.playwright/',
  ''
].join('\n');

if (!gitignoreContent.includes('test-results.json')) {
  fs.appendFileSync(gitignorePath, gitignoreAdditions);
  console.log('✅ .gitignore updated\n');
} else {
  console.log('ℹ️  .gitignore already contains browser testing entries\n');
}

// Step 7: Install Playwright browsers
console.log('🌐 Installing Playwright browsers...');
try {
  execSync('npx playwright install chromium', { stdio: 'inherit' });
  console.log('✅ Playwright browsers installed\n');
} catch (error) {
  console.warn('⚠️  Could not install browsers automatically. Run: npx playwright install chromium\n');
}

// Final summary
console.log('✨ Setup Complete!\n');
console.log('Available Commands:');
console.log('  • claude /quick-test <url>       - Quick browser test');
console.log('  • claude /debug-loop <url>       - Automated debugging loop');
console.log('  • claude /deploy-test <message>  - Deploy and test');
console.log('  • npm run test:browser <url>     - Run browser test script\n');
console.log('MCP Servers:');
console.log('  • playwright - Automated browser testing\n');
console.log('Next Steps:');
console.log('  1. Restart Claude Desktop to load new MCP configuration');
console.log('  2. Test with: claude /quick-test https://example.com');
console.log('  3. Enjoy automated browser testing! 🎉\n');
