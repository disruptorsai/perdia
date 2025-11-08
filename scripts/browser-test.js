/**
 * Browser testing script for automated debugging
 * Run with: node scripts/browser-test.js <url>
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testDeployment(url) {
  console.log(`🔍 Testing deployment: ${url}`);

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
      console.error(`❌ Console Error: ${text}`);
    } else if (type === 'warning') {
      warnings.push({ type, text });
      console.warn(`⚠️  Console Warning: ${text}`);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    errors.push({
      type: 'pageerror',
      text: error.message,
      stack: error.stack
    });
    console.error(`❌ Page Error: ${error.message}`);
  });

  // Capture network failures
  page.on('requestfailed', request => {
    errors.push({
      type: 'network',
      text: `Failed to load: ${request.url()}`,
      failure: request.failure()
    });
    console.error(`❌ Network Error: ${request.url()}`);
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

    console.log('\n📊 Test Results:');
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Warnings: ${warnings.length}`);

    const report = {
      url,
      timestamp: new Date().toISOString(),
      errors,
      warnings,
      screenshot: 'screenshots/deployment-test.png'
    };

    fs.writeFileSync('test-results.json', JSON.stringify(report, null, 2));

    let markdown = `# Browser Test Report\n\n`;
    markdown += `**URL**: ${url}\n`;
    markdown += `**Timestamp**: ${report.timestamp}\n\n`;
    markdown += `## Summary\n- Errors: ${errors.length}\n- Warnings: ${warnings.length}\n\n`;

    if (errors.length > 0) {
      markdown += `## Errors\n\n`;
      errors.forEach((error, i) => {
        markdown += `### Error ${i + 1}\n`;
        markdown += `- **Type**: ${error.type}\n`;
        markdown += `- **Message**: ${error.text}\n`;
        if (error.stack) markdown += `- **Stack**: \`\`\`\n${error.stack}\n\`\`\`\n`;
        if (error.location) markdown += `- **Location**: ${JSON.stringify(error.location)}\n`;
        markdown += `\n`;
      });
    }

    fs.writeFileSync('test-results.md', markdown);
    console.log('\n✅ Report saved to test-results.json and test-results.md');

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
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
