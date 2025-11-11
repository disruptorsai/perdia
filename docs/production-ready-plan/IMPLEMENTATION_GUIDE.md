# Perdia Implementation Guide

**Version:** 1.0
**Date:** 2025-11-10
**For:** Development Team
**Prerequisites:** Access to Perdia codebase, Supabase project, GetEducated.com WordPress

---

## Table of Contents

1. [Development Environment Setup](#1-development-environment-setup)
2. [Sprint 1: Core Integration](#2-sprint-1-core-integration)
3. [Sprint 2: Content Pipeline](#3-sprint-2-content-pipeline)
4. [Sprint 3: Testing & Training](#4-sprint-3-testing--training)
5. [Sprint 4: Production Deployment](#5-sprint-4-production-deployment)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Development Environment Setup

### 1.1 Clone & Install

```bash
cd C:\Users\Will\OneDrive\Documents\Projects\perdia
npm install
cp .env.example .env.local
```

### 1.2 Environment Variables

Edit `.env.local`:

```bash
# Supabase (REQUIRED)
VITE_SUPABASE_URL=https://yvvtsfgryweqfppilkvo.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services (REQUIRED)
VITE_ANTHROPIC_API_KEY=sk-ant-your-key
VITE_OPENAI_API_KEY=sk-your-key

# WordPress Integration (NEW - from client)
VITE_WP_DB_HOST=wordpress-db-host.example.com
VITE_WP_DB_PORT=3306
VITE_WP_DB_NAME=wordpress_database
VITE_WP_DB_USER=readonly_user
VITE_WP_DB_PASSWORD=secure_password
VITE_WP_DB_SSL_CA=path/to/ca-cert.pem

# Quote Scraping APIs (NEW)
VITE_REDDIT_CLIENT_ID=your_reddit_client_id
VITE_REDDIT_CLIENT_SECRET=your_reddit_secret
VITE_TWITTER_BEARER_TOKEN=your_twitter_bearer_token
VITE_GETEDUCATED_FORUMS_URL=https://forums.geteducated.com # From Kaylee
```

### 1.3 Database Setup

```bash
# Run migrations
npm run db:migrate

# Seed AI agents
npm run db:seed

# Verify setup
npm run dev
```

### 1.4 Supabase Edge Function Setup

```bash
# Link to Supabase project
npx supabase link --project-ref yvvtsfgryweqfppilkvo

# Deploy existing functions (test)
npx supabase functions deploy invoke-llm --project-ref yvvtsfgryweqfppilkvo

# Set secrets
npx supabase secrets set ANTHROPIC_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set OPENAI_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo
```

---

## 2. Sprint 1: Core Integration (Week 1)

### 2.1 WordPress Database Connection

**File:** `src/lib/wordpress-db-client.js` (NEW)

```javascript
import mysql from 'mysql2/promise';

// Connection pool for WordPress database
const pool = mysql.createPool({
  host: import.meta.env.VITE_WP_DB_HOST,
  port: parseInt(import.meta.env.VITE_WP_DB_PORT) || 3306,
  user: import.meta.env.VITE_WP_DB_USER,
  password: import.meta.env.VITE_WP_DB_PASSWORD,
  database: import.meta.env.VITE_WP_DB_NAME,
  waitForConnections: true,
  connectionLimit: 5, // Max 5 concurrent connections
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: import.meta.env.VITE_WP_DB_SSL_CA ? {
    ca: import.meta.env.VITE_WP_DB_SSL_CA,
    rejectUnauthorized: true
  } : undefined
});

// Query wrapper with timeout enforcement
export async function wpQuery(sql, params = [], timeout = 10000) {
  const connection = await pool.getConnection();
  try {
    // Set query timeout
    await connection.query('SET SESSION max_execution_time = ?', [timeout]);

    const [rows] = await connection.query(sql, params);
    return rows;
  } catch (error) {
    console.error('WordPress DB query failed:', error);
    throw new Error(`WP DB Error: ${error.message}`);
  } finally {
    connection.release();
  }
}

// Get related posts by taxonomy
export async function getRelatedPosts(postId, taxonomy = 'category', limit = 5) {
  const sql = `
    SELECT p.ID, p.post_title, p.guid, p.post_date
    FROM wp_posts p
    INNER JOIN wp_term_relationships tr ON p.ID = tr.object_id
    INNER JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
    INNER JOIN wp_term_relationships tr2 ON tt.term_taxonomy_id = tr2.term_taxonomy_id
    WHERE tr2.object_id = ?
      AND tt.taxonomy = ?
      AND p.post_status = 'publish'
      AND p.ID != ?
    GROUP BY p.ID
    ORDER BY p.post_date DESC
    LIMIT ?
  `;

  return await wpQuery(sql, [postId, taxonomy, postId, limit]);
}

// Get post meta fields
export async function getPostMeta(postId, metaKey = null) {
  let sql = 'SELECT meta_key, meta_value FROM wp_postmeta WHERE post_id = ?';
  const params = [postId];

  if (metaKey) {
    sql += ' AND meta_key = ?';
    params.push(metaKey);
  }

  return await wpQuery(sql, params);
}

// Health check
export async function testConnection() {
  try {
    await wpQuery('SELECT 1 as test');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**Testing:**

```javascript
// Test in browser console or Node script
import { testConnection, getRelatedPosts } from '@/lib/wordpress-db-client';

// Health check
const health = await testConnection();
console.log('WordPress DB:', health);

// Get related posts
const related = await getRelatedPosts(12345, 'category', 5);
console.log('Related posts:', related);
```

---

### 2.2 Shortcode Transformation System

**File:** `supabase/functions/shortcode-transformer/index.ts` (NEW)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Affiliate domains that should use [ge_affiliate_link]
const AFFILIATE_DOMAINS = [
  'shareasale.com',
  'cj.com',
  'impact.com',
  'partnerstack.com',
  // Add client's affiliate networks
];

// GetEducated.com domains for internal links
const INTERNAL_DOMAINS = [
  'geteducated.com',
  'www.geteducated.com'
];

interface TransformResult {
  content: string;
  transformations: {
    total: number;
    internal: number;
    affiliate: number;
    external: number;
  };
  issues: string[];
}

function isInternalLink(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return INTERNAL_DOMAINS.includes(urlObj.hostname.toLowerCase());
  } catch {
    // Relative URL (starts with /)
    return url.startsWith('/');
  }
}

function isAffiliateLink(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return AFFILIATE_DOMAINS.some(domain =>
      urlObj.hostname.toLowerCase().includes(domain)
    );
  } catch {
    return false;
  }
}

function transformLinks(html: string): TransformResult {
  const transformations = {
    total: 0,
    internal: 0,
    affiliate: 0,
    external: 0
  };
  const issues: string[] = [];

  // Regex to match <a> tags
  const linkRegex = /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>(.*?)<\/a>/gi;

  const transformed = html.replace(linkRegex, (match, before, url, after, text) => {
    transformations.total++;

    // Extract other attributes (class, target, etc.)
    const attributes: Record<string, string> = {};
    const attrRegex = /(\w+)=["']([^"']+)["']/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(before + after)) !== null) {
      if (attrMatch[1] !== 'href') {
        attributes[attrMatch[1]] = attrMatch[2];
      }
    }

    // Determine shortcode type
    let shortcode: string;
    if (isInternalLink(url)) {
      shortcode = 'ge_internal_link';
      transformations.internal++;
    } else if (isAffiliateLink(url)) {
      shortcode = 'ge_affiliate_link';
      transformations.affiliate++;
    } else {
      shortcode = 'ge_external_link';
      transformations.external++;
    }

    // Build shortcode attributes
    const attrs = Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    return `[${shortcode} url="${url}" ${attrs}]${text}[/${shortcode}]`;
  });

  // Check for remaining raw <a> tags (malformed HTML)
  const remainingLinks = (transformed.match(/<a\s+/gi) || []).length;
  if (remainingLinks > 0) {
    issues.push(`${remainingLinks} malformed links could not be transformed`);
  }

  return { content: transformed, transformations, issues };
}

serve(async (req) => {
  try {
    const { html } = await req.json();

    if (!html || typeof html !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid input: html string required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = transformLinks(html);

    return new Response(
      JSON.stringify({
        success: true,
        ...result
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Shortcode transformation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

**Deploy:**

```bash
npx supabase functions deploy shortcode-transformer --project-ref yvvtsfgryweqfppilkvo
```

**Test:**

```bash
curl -X POST \
  https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/shortcode-transformer \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<p>Check out <a href=\"https://geteducated.com/programs\">our programs</a> and <a href=\"https://shareasale.com/offer\">this deal</a>.</p>"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "content": "<p>Check out [ge_internal_link url=\"https://geteducated.com/programs\"]our programs[/ge_internal_link] and [ge_affiliate_link url=\"https://shareasale.com/offer\"]this deal[/ge_affiliate_link].</p>",
  "transformations": {
    "total": 2,
    "internal": 1,
    "affiliate": 1,
    "external": 0
  },
  "issues": []
}
```

---

### 2.3 Pre-Publish Validator

**File:** `supabase/functions/pre-publish-validator/index.ts` (NEW)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface ValidationResult {
  passed: boolean;
  checks: Record<string, {
    passed: boolean;
    message?: string;
  }>;
  errors: string[];
  warnings: string[];
}

function validateContent(content: any): ValidationResult {
  const checks: ValidationResult['checks'] = {};
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check for raw HTML <a> tags (must use shortcodes)
  const rawLinks = (content.content || '').match(/<a\s+[^>]*>/gi);
  checks.shortcode_compliance = {
    passed: !rawLinks || rawLinks.length === 0,
    message: rawLinks ? `Found ${rawLinks.length} raw HTML links - must use shortcodes` : 'All links use shortcodes'
  };
  if (!checks.shortcode_compliance.passed) {
    errors.push(checks.shortcode_compliance.message!);
  }

  // 2. Check for JSON-LD structured data
  const hasArticleSchema = content.metadata?.schema?.article_jsonld;
  checks.article_schema = {
    passed: !!hasArticleSchema,
    message: hasArticleSchema ? 'Article JSON-LD present' : 'Missing Article JSON-LD structured data'
  };
  if (!checks.article_schema.passed) {
    errors.push(checks.article_schema.message!);
  }

  // 3. Check FAQ schema if FAQs present
  const hasFaqs = content.sections?.faqs && content.sections.faqs.length > 0;
  if (hasFaqs) {
    const hasFaqSchema = content.metadata?.schema?.faq_jsonld;
    checks.faq_schema = {
      passed: !!hasFaqSchema,
      message: hasFaqSchema ? 'FAQ JSON-LD present' : 'FAQs detected but missing FAQ JSON-LD'
    };
    if (!checks.faq_schema.passed) {
      errors.push(checks.faq_schema.message!);
    }
  }

  // 4. Check internal links (2-5 recommended)
  const internalLinks = (content.content || '').match(/\[ge_internal_link/gi) || [];
  checks.internal_links = {
    passed: internalLinks.length >= 2 && internalLinks.length <= 5,
    message: `${internalLinks.length} internal links (recommended: 2-5)`
  };
  if (internalLinks.length === 0) {
    errors.push('No internal links found - add at least 2');
  } else if (internalLinks.length < 2) {
    warnings.push(checks.internal_links.message!);
  }

  // 5. Check external authority link (at least 1)
  const externalLinks = (content.content || '').match(/\[ge_external_link/gi) || [];
  checks.external_authority = {
    passed: externalLinks.length >= 1,
    message: externalLinks.length >= 1
      ? `${externalLinks.length} external links present`
      : 'No external authority links - add at least 1 (e.g., BLS, .gov, .edu)'
  };
  if (!checks.external_authority.passed) {
    errors.push(checks.external_authority.message!);
  }

  // 6. Check word count (1500-3000)
  const wordCount = content.word_count || 0;
  checks.word_count = {
    passed: wordCount >= 1500 && wordCount <= 3000,
    message: `${wordCount} words (target: 1500-3000)`
  };
  if (wordCount < 1500) {
    errors.push('Word count too low (minimum: 1500 words)');
  } else if (wordCount > 3000) {
    warnings.push('Word count high (maximum: 3000 words)');
  }

  // 7. Check readability (optional warning)
  if (content.metadata?.readability_grade) {
    const grade = parseFloat(content.metadata.readability_grade);
    checks.readability = {
      passed: grade >= 10 && grade <= 12,
      message: `Reading level: Grade ${grade} (target: 10-12)`
    };
    if (grade < 10 || grade > 12) {
      warnings.push(checks.readability.message!);
    }
  }

  return {
    passed: errors.length === 0,
    checks,
    errors,
    warnings
  };
}

serve(async (req) => {
  try {
    const { content_id, content } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Invalid input: content object required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = validateContent(content);

    return new Response(
      JSON.stringify({
        content_id,
        ...result,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

**Deploy:**

```bash
npx supabase functions deploy pre-publish-validator --project-ref yvvtsfgryweqfppilkvo
```

---

### 2.4 Integration with Content Workflow

**File:** `src/lib/content-workflow.js` (UPDATE)

```javascript
import { supabase } from '@/lib/supabase-client';

// Transform content before validation
export async function transformContentLinks(contentId, html) {
  const { data, error } = await supabase.functions.invoke('shortcode-transformer', {
    body: { html }
  });

  if (error) throw new Error(`Shortcode transformation failed: ${error.message}`);

  // Log transformation results
  await supabase.from('shortcode_validation_logs').insert({
    content_id: contentId,
    validation_result: data.transformations,
    issues_found: data.issues,
    auto_fixed: data.transformations.total > 0
  });

  return data.content;
}

// Validate content before approval/publishing
export async function validateContent(contentId, content) {
  const { data, error } = await supabase.functions.invoke('pre-publish-validator', {
    body: { content_id: contentId, content }
  });

  if (error) throw new Error(`Validation failed: ${error.message}`);

  // Store validation result
  await supabase.from('content_queue').update({
    last_validation_result: data
  }).eq('id', contentId);

  return data;
}

// Full pre-publish workflow
export async function prepareForPublishing(contentId) {
  // 1. Get content from queue
  const { data: content, error: fetchError } = await supabase
    .from('content_queue')
    .select('*')
    .eq('id', contentId)
    .single();

  if (fetchError) throw fetchError;

  // 2. Transform links to shortcodes
  const transformedContent = await transformContentLinks(contentId, content.content);

  // 3. Update content with transformed version
  await supabase.from('content_queue').update({
    content: transformedContent
  }).eq('id', contentId);

  // 4. Validate
  const validation = await validateContent(contentId, {
    ...content,
    content: transformedContent
  });

  // 5. Update status based on validation
  if (validation.passed) {
    await supabase.from('content_queue').update({
      status: 'pending_review',
      pending_since: new Date().toISOString()
    }).eq('id', contentId);
  } else {
    await supabase.from('content_queue').update({
      status: 'needs_revision',
      review_notes: `Validation failed:\n${validation.errors.join('\n')}`
    }).eq('id', contentId);
  }

  return validation;
}
```

---

## 3. Sprint 2: Content Pipeline (Week 2)

### 3.1 Quote Scraping Service

See `docs/QUOTE_SOURCING_STRATEGY.md` for full implementation.

**File:** `supabase/functions/quote-scraper/index.ts` (NEW)

```typescript
// Quote scraping from Reddit, Twitter, GetEducated forums
// Full implementation in QUOTE_SOURCING_STRATEGY.md
```

---

### 3.2 Cost Monitoring Middleware

**File:** `supabase/functions/invoke-llm/index.ts` (UPDATE)

Add cost tracking to existing function:

```typescript
// After AI request completes
if (response.usage) {
  const { prompt_tokens, completion_tokens } = response.usage;
  const total_tokens = prompt_tokens + completion_tokens;

  // Calculate cost based on model
  let cost = 0;
  if (model.includes('claude-sonnet-4-5')) {
    cost = (prompt_tokens / 1000000 * 3) + (completion_tokens / 1000000 * 15);
  } else if (model.includes('gpt-4o')) {
    cost = (prompt_tokens / 1000000 * 2.5) + (completion_tokens / 1000000 * 10);
  }

  // Log to Supabase
  await supabaseClient.from('ai_usage_logs').insert({
    content_id: body.content_id,
    model,
    provider: body.provider,
    prompt_tokens,
    completion_tokens,
    total_tokens,
    estimated_cost: cost,
    operation_type: body.operation_type || 'generation'
  });

  // Alert if exceeds budget
  if (cost > 10) {
    console.warn(`HIGH COST ALERT: $${cost.toFixed(2)} for content ${body.content_id}`);
  }
}
```

---

### 3.3 5-Day SLA Auto-Publish

**File:** `supabase/functions/sla-autopublish-checker/index.ts` (NEW)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  try {
    // Find articles pending review for >5 days
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const { data: eligibleArticles, error } = await supabase
      .from('content_queue')
      .select('*')
      .eq('status', 'pending_review')
      .lt('pending_since', fiveDaysAgo.toISOString());

    if (error) throw error;

    const results = [];

    for (const article of eligibleArticles || []) {
      // Re-run validator
      const validationResponse = await fetch(
        `${supabaseUrl}/functions/v1/pre-publish-validator`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceRoleKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content_id: article.id,
            content: article
          })
        }
      );

      const validation = await validationResponse.json();

      if (validation.passed) {
        // Auto-approve
        await supabase.from('content_queue').update({
          status: 'approved_for_publish',
          auto_publish_eligible: true,
          last_validation_result: validation,
          review_notes: 'Auto-approved after 5-day SLA (validation passed)'
        }).eq('id', article.id);

        results.push({ article_id: article.id, action: 'auto-approved' });

        // TODO: Send email notification to Sarah
      } else {
        // Flag for manual review
        await supabase.from('content_queue').update({
          status: 'needs_attention',
          last_validation_result: validation,
          review_notes: `Auto-publish attempted but validation failed:\n${validation.errors.join('\n')}`
        }).eq('id', article.id);

        results.push({ article_id: article.id, action: 'flagged' });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('SLA checker error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

**Cron Job:** `supabase/migrations/20251110000001_sla_autopublish_cron.sql`

```sql
-- Run every 6 hours to check for SLA-eligible articles
SELECT cron.schedule(
  'check-sla-autopublish',
  '0 */6 * * *', -- Every 6 hours
  $$
  SELECT
    net.http_post(
      url:='https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/sla-autopublish-checker',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

---

## 4. Sprint 3: Testing & Training (Week 3)

### 4.1 Integration Testing Script

**File:** `scripts/test-integration.js` (NEW)

```javascript
import { supabase } from './src/lib/supabase-client.js';
import { prepareForPublishing } from './src/lib/content-workflow.js';

async function testFullWorkflow() {
  console.log('=== Perdia Integration Test ===\n');

  // 1. Create test article
  console.log('1. Creating test article...');
  const { data: article, error: createError } = await supabase
    .from('content_queue')
    .insert({
      title: 'Test Article: Cheapest Online Accounting Degrees',
      content: `
        <p>This is a test article with <a href="https://geteducated.com/programs">internal link</a>
        and <a href="https://bls.gov">external link</a>.</p>
      `,
      content_type: 'new_article',
      status: 'draft',
      target_keywords: ['test', 'accounting'],
      word_count: 2000
    })
    .select()
    .single();

  if (createError) throw createError;
  console.log(`✅ Article created: ${article.id}\n`);

  // 2. Test shortcode transformation
  console.log('2. Testing shortcode transformation...');
  const validation = await prepareForPublishing(article.id);
  console.log(`   Shortcodes: ${validation.checks.shortcode_compliance.passed ? '✅' : '❌'}`);
  console.log(`   Article schema: ${validation.checks.article_schema.passed ? '✅' : '❌'}`);
  console.log(`   Internal links: ${validation.checks.internal_links.passed ? '✅' : '❌'}`);
  console.log(`   External links: ${validation.checks.external_authority.passed ? '✅' : '❌'}\n`);

  // 3. Check transformed content
  const { data: updated } = await supabase
    .from('content_queue')
    .select('content')
    .eq('id', article.id)
    .single();

  console.log('3. Transformed content preview:');
  console.log(updated.content.substring(0, 200) + '...\n');

  // 4. Cleanup
  await supabase.from('content_queue').delete().eq('id', article.id);
  console.log('✅ Test complete. Article deleted.\n');
}

testFullWorkflow().catch(console.error);
```

**Run:**

```bash
node scripts/test-integration.js
```

---

### 4.2 Sarah Training Checklist

**File:** `docs/SARAH_TRAINING_GUIDE.md` (NEW)

```markdown
# Sarah's Approval Queue Training Guide

## Daily Workflow (10-15 articles/day, ~30 min/article)

1. **Login to Perdia:** https://perdia-education.netlify.app
2. **Navigate to Approval Queue**
3. **For each article:**
   - [ ] Click article to open full view
   - [ ] Check SLA timer (days remaining)
   - [ ] Review validation status (green checkmarks)
   - [ ] Read content for quality, tone, accuracy
   - [ ] Verify shortcodes present (no raw HTML links)
   - [ ] Check FAQs (if applicable)
   - [ ] Look for real quotes with attribution

4. **Actions:**
   - ✅ **Approve:** Article ready for publishing
   - ❌ **Reject:** Send back to AI with feedback notes
   - ✏️ **Edit:** Make inline edits, then approve

5. **Bulk Operations:**
   - Select multiple articles (checkbox)
   - Approve all at once (if similar quality)

## Quality Checklist

- [ ] Title is compelling and includes target keyword
- [ ] Introduction hooks the reader
- [ ] Content is accurate and helpful
- [ ] FAQs answer common questions
- [ ] Internal links relevant (2-5 per article)
- [ ] External link to authority source (BLS, .gov, .edu)
- [ ] Quotes attributed properly (or clearly labeled as fictional)
- [ ] No spelling/grammar errors
- [ ] Tone matches GetEducated.com brand

## When to Reject

- Factual errors or misleading information
- Poor writing quality (confusing, repetitive)
- Off-brand tone (too salesy, too casual)
- Missing required sections (FAQs, intro, conclusion)
- Raw HTML links (should never happen after validator)

## Tips

- **Use bulk approve** for similar articles (saves time)
- **5-day SLA:** Don't worry if you miss a day - articles auto-publish if validator passes
- **Cost visible:** Check cost/article (goal: <$10)
- **Questions?** Slack #perdia or Monday calls
```

---

## 5. Sprint 4: Production Deployment (Week 4)

### 5.1 Production Deployment Checklist

```bash
# 1. Deploy all Edge Functions
npx supabase functions deploy shortcode-transformer --project-ref yvvtsfgryweqfppilkvo
npx supabase functions deploy pre-publish-validator --project-ref yvvtsfgryweqfppilkvo
npx supabase functions deploy sla-autopublish-checker --project-ref yvvtsfgryweqfppilkvo
npx supabase functions deploy quote-scraper --project-ref yvvtsfgryweqfppilkvo

# 2. Apply database migrations
npx supabase db push --project-ref yvvtsfgryweqfppilkvo

# 3. Set production secrets
npx supabase secrets set \
  WP_DB_HOST=production-host \
  WP_DB_USER=readonly_user \
  WP_DB_PASSWORD=secure_password \
  REDDIT_CLIENT_ID=your_client_id \
  REDDIT_CLIENT_SECRET=your_secret \
  TWITTER_BEARER_TOKEN=your_token \
  --project-ref yvvtsfgryweqfppilkvo

# 4. Enable cron jobs
# Already configured in migrations - verify in Supabase dashboard

# 5. Deploy frontend to Netlify
git push origin main # Auto-deploys via Netlify
```

### 5.2 Post-Deployment Verification

```bash
# 1. Test WordPress DB connection
curl -X POST https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/test-wp-connection \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# 2. Test shortcode transformer
curl -X POST https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/shortcode-transformer \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"html": "<a href=\"/test\">Test</a>"}'

# 3. Test validator
curl -X POST https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/pre-publish-validator \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content": {"content": "Test", "word_count": 2000}}'

# 4. Verify cron jobs
# Check Supabase Dashboard > Database > Cron Jobs > Verify last run times
```

---

## 6. Troubleshooting

### 6.1 WordPress Database Connection Fails

**Symptoms:** `WP DB Error: Connection timeout`

**Solutions:**
1. Verify credentials in `.env.local`
2. Check firewall allows connections from Supabase IP range
3. Test with `telnet WP_DB_HOST 3306`
4. Verify SSL certificate path is correct
5. Fallback: Use REST API only (disable DB queries)

### 6.2 Shortcode Transformation Not Working

**Symptoms:** Articles still have raw `<a>` tags

**Solutions:**
1. Check Edge Function logs: Supabase Dashboard > Edge Functions > Logs
2. Verify affiliate domains list includes client's partners
3. Test transformer with sample HTML (see test script above)
4. Check pre-publish validator is rejecting non-shortcode articles

### 6.3 5-Day SLA Not Triggering

**Symptoms:** Articles stuck in `pending_review` >5 days

**Solutions:**
1. Check cron job is enabled: Supabase Dashboard > Database > Cron Jobs
2. Verify `pending_since` timestamp is set when article enters queue
3. Check Edge Function logs for errors
4. Manually trigger: `curl -X POST https://.../sla-autopublish-checker`

### 6.4 Cost Per Article >$10

**Symptoms:** High AI costs

**Solutions:**
1. Check `ai_usage_logs` table for outliers
2. Identify which operation is expensive (generation, optimization, etc.)
3. Reduce `max_tokens` in prompts (default 4000 → 3000)
4. Enable prompt caching for system prompts (90% cost reduction)
5. Switch to Haiku 4.5 for simpler operations (meta descriptions, titles)

### 6.5 Quote Scraping Returns No Results

**Symptoms:** All articles use fictional personas

**Solutions:**
1. Verify API credentials (Reddit, Twitter) are set
2. Check API rate limits (Reddit: 60 req/min, Twitter: depends on tier)
3. Test individual scrapers with sample keywords
4. Fallback: Use GetEducated forums exclusively (client's own content)

---

## Next Steps

After Sprint 4 completion:
1. Monitor first 50 articles published
2. Gather feedback from Sarah and Kaylee
3. Iterate based on real usage patterns
4. Plan Phase 2: Vector linking, advanced analytics, scale to 100/week

**Questions?** Slack #perdia or Monday 12:30 ET calls

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Next Review:** After Sprint 1 (Week 1)
