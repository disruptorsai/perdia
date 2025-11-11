# Perdia Technical Specifications

**Version:** 1.0
**Date:** 2025-11-10
**Consolidates:** WordPress Integration, Shortcodes, Quotes, Workflow, Cost Monitoring, DB Access, Testing

---

## Table of Contents

1. [WordPress Integration Specification](#1-wordpress-integration-specification)
2. [Shortcode System Specification](#2-shortcode-system-specification)
3. [Quote Sourcing Strategy](#3-quote-sourcing-strategy)
4. [Approval Workflow (5-Day SLA)](#4-approval-workflow-5-day-sla)
5. [Cost Monitoring System](#5-cost-monitoring-system)
6. [Database Access Patterns](#6-database-access-patterns)
7. [Testing Procedures](#7-testing-procedures)

---

## 1. WordPress Integration Specification

### 1.1 Hybrid Approach: REST API + Direct Database

**Primary Method:** WordPress REST API (existing, production-ready)
**Secondary Method:** Direct MySQL connection (for complex queries)

**When to Use Each:**

| Operation | Method | Reason |
|-----------|--------|--------|
| Create/Update posts | REST API | Triggers WordPress hooks, audit trail |
| Upload media | REST API | WordPress handles optimization, metadata |
| Set categories/tags | REST API | Standard WordPress flow |
| Fetch related posts | Database | Complex JOIN queries faster |
| Query custom taxonomies | Database | Avoid multiple REST API calls |
| Analytics queries | Database | Direct access to performance data |
| Batch operations | Database | Bypass REST API rate limits |

### 1.2 REST API Integration (Existing - 75% Complete)

**Current Implementation:** `src/lib/wordpress-client.js` (452 lines)

**Capabilities:**
- ✅ Create posts (title, content, excerpt, status)
- ✅ Upload featured images
- ✅ Set categories, tags, custom fields
- ✅ Update post status (draft → publish)
- ✅ Retry logic (3 attempts, exponential backoff)
- ✅ Error handling (429, 500, timeout)

**What to Add:**
- [ ] Inject JSON-LD structured data (via custom field or `<script>` tag in content)
- [ ] Set post author (map to GetEducated.com staff)
- [ ] Custom taxonomy support (degree types, categories)
- [ ] Bulk operations (publish multiple posts)

**Example Usage:**

```javascript
import { publishToWordPress } from '@/lib/wordpress-client';

const result = await publishToWordPress({
  title: 'Cheapest Online Accounting Degrees 2025',
  content: '[ge_internal_link url="/programs"]Check our programs[/ge_internal_link]',
  excerpt: 'Discover affordable online accounting degrees...',
  featured_image_url: 'https://cdn.example.com/image.jpg',
  categories: ['Accounting', 'Online Degrees'],
  tags: ['affordable', 'accredited'],
  status: 'publish',
  custom_fields: {
    '_yoast_wpseo_metadesc': 'SEO meta description...',
    'article_jsonld': JSON.stringify(articleSchema)
  }
});

// Returns: { success: true, post_id: 12345, url: 'https://...' }
```

### 1.3 Direct Database Access (NEW - 25% to Build)

**Configuration:**

```javascript
// src/lib/wordpress-db-client.js
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.VITE_WP_DB_HOST,
  port: 3306,
  user: process.env.VITE_WP_DB_USER, // READ-ONLY user
  password: process.env.VITE_WP_DB_PASSWORD,
  database: process.env.VITE_WP_DB_NAME,
  connectionLimit: 5,
  ssl: {
    ca: process.env.VITE_WP_DB_SSL_CA,
    rejectUnauthorized: true
  }
});
```

**Security Requirements:**

1. **Read-Only User** (for most operations)
   ```sql
   CREATE USER 'perdia_readonly'@'%' IDENTIFIED BY 'secure_password';
   GRANT SELECT ON wordpress_db.* TO 'perdia_readonly'@'%';
   FLUSH PRIVILEGES;
   ```

2. **SSL/TLS Encryption** (required for production)
3. **Query Timeout** (10 seconds max)
4. **Connection Pooling** (max 5 concurrent connections)
5. **Fallback to REST API** (if DB unavailable)

**Common Queries:**

```javascript
// Get related posts by category
async function getRelatedPosts(postId, limit = 5) {
  const sql = `
    SELECT p.ID, p.post_title, p.guid, p.post_date
    FROM wp_posts p
    INNER JOIN wp_term_relationships tr ON p.ID = tr.object_id
    INNER JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
    WHERE tt.taxonomy = 'category'
      AND tt.term_taxonomy_id IN (
        SELECT term_taxonomy_id FROM wp_term_relationships WHERE object_id = ?
      )
      AND p.post_status = 'publish'
      AND p.ID != ?
    GROUP BY p.ID
    ORDER BY p.post_date DESC
    LIMIT ?
  `;
  return await wpQuery(sql, [postId, postId, limit]);
}

// Get post meta fields
async function getPostMeta(postId, metaKey = null) {
  let sql = 'SELECT meta_key, meta_value FROM wp_postmeta WHERE post_id = ?';
  const params = [postId];
  if (metaKey) {
    sql += ' AND meta_key = ?';
    params.push(metaKey);
  }
  return await wpQuery(sql, params);
}

// Get top performing posts (last 30 days)
async function getTopPosts(limit = 10) {
  const sql = `
    SELECT p.ID, p.post_title, COUNT(*) as view_count
    FROM wp_posts p
    LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_post_views'
    WHERE p.post_status = 'publish'
      AND p.post_date > DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY p.ID
    ORDER BY view_count DESC
    LIMIT ?
  `;
  return await wpQuery(sql, [limit]);
}
```

### 1.4 JSON-LD Structured Data Injection

**Where to Inject:** As `<script type="application/ld+json">` in post content (end of article)

**Article Schema:**

```javascript
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": article.title,
  "description": article.meta_description,
  "image": article.featured_image_url,
  "author": {
    "@type": "Person",
    "name": "GetEducated.com Editorial Team",
    "url": "https://geteducated.com/about"
  },
  "publisher": {
    "@type": "Organization",
    "name": "GetEducated.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://geteducated.com/logo.png"
    }
  },
  "datePublished": article.published_date,
  "dateModified": article.updated_date || article.published_date,
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": article.wordpress_url
  }
};
```

**FAQ Schema (if FAQs present):**

```javascript
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": article.faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
};
```

**Inject in Post Content:**

```javascript
function injectStructuredData(content, schemas) {
  const scripts = schemas.map(schema =>
    `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`
  ).join('\n');

  return content + '\n\n' + scripts;
}

// Usage
const contentWithSchema = injectStructuredData(article.content, [
  articleSchema,
  ...(article.faqs.length > 0 ? [faqSchema] : [])
]);
```

---

## 2. Shortcode System Specification

### 2.1 GetEducated.com Shortcode Types

**Confirmed by Client (Kaylee, Transcript):**
> "we set up hyperlinks through short codes and we set up monetization through short codes"

**Three Shortcode Types:**

1. **Internal Links** - Links within GetEducated.com
   ```
   [ge_internal_link url="/programs/accounting-degrees" class="internal"]
   Accounting Degree Programs
   [/ge_internal_link]
   ```

2. **Affiliate Links** - Monetization partners (ShareASale, CJ, Impact, etc.)
   ```
   [ge_affiliate_link url="https://shareasale.com/offer" partner="shareasale" tracking="12345"]
   View This Offer
   [/ge_affiliate_link]
   ```

3. **External Links** - Authority sources (BLS, .gov, .edu)
   ```
   [ge_external_link url="https://www.bls.gov/ooh/business-and-financial/accountants-and-auditors.htm" rel="nofollow"]
   Bureau of Labor Statistics - Accountants
   [/ge_external_link]
   ```

### 2.2 Transformation Rules

**Input:** AI-generated HTML with standard `<a>` tags
**Output:** WordPress-compatible shortcodes

**Detection Logic:**

```javascript
function detectLinkType(url) {
  // Internal: geteducated.com or relative URLs
  if (url.startsWith('/') || url.includes('geteducated.com')) {
    return 'internal';
  }

  // Affiliate: known partner domains
  const affiliateDomains = [
    'shareasale.com',
    'cj.com',
    'impact.com',
    'partnerstack.com',
    'awin1.com',
    'tkqlhce.com'
    // Add client's specific partners
  ];

  for (const domain of affiliateDomains) {
    if (url.includes(domain)) {
      return 'affiliate';
    }
  }

  // External: everything else
  return 'external';
}

function transformLink(url, text, attributes = {}) {
  const type = detectLinkType(url);
  const shortcode = `ge_${type}_link`;

  // Build attributes string
  const attrs = Object.entries({ url, ...attributes })
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

  return `[${shortcode} ${attrs}]${text}[/${shortcode}]`;
}
```

**Example Transformations:**

```
INPUT:  <a href="/programs">Our Programs</a>
OUTPUT: [ge_internal_link url="/programs"]Our Programs[/ge_internal_link]

INPUT:  <a href="https://shareasale.com/offer" target="_blank">Special Offer</a>
OUTPUT: [ge_affiliate_link url="https://shareasale.com/offer" target="_blank"]Special Offer[/ge_affiliate_link]

INPUT:  <a href="https://bls.gov/data">BLS Data</a>
OUTPUT: [ge_external_link url="https://bls.gov/data"]BLS Data[/ge_external_link]
```

### 2.3 Validation Rules

**Pre-Publish Validator MUST Check:**

1. ❌ **ZERO raw HTML `<a>` tags** in content
   - Regex: `/<a\s+[^>]*>/gi`
   - If found: REJECT with error "Raw HTML links detected - must use shortcodes"

2. ✅ **All links use shortcodes**
   - Regex: `/\[ge_(internal|affiliate|external)_link[^\]]*\]/gi`
   - Count must match expected link count

3. ✅ **Shortcodes properly closed**
   - Each `[ge_*_link` must have matching `[/ge_*_link]`
   - Regex: `/\[ge_\w+_link[^\]]*\].*?\[\/ge_\w+_link\]/gs`

4. ✅ **URLs valid**
   - All `url="..."` attributes contain valid URLs
   - Internal URLs start with `/` or include `geteducated.com`

**Edge Cases:**

- **Nested links:** Not allowed (HTML/WordPress limitation)
- **Links in shortcodes:** Not allowed (would break transformation)
- **Special characters in URLs:** URL-encode properly
- **Query parameters:** Preserve `?` and `&` in URLs
- **Anchors:** Preserve `#section` in URLs

### 2.4 WordPress Shortcode Implementation

**Client's WordPress Site:** Must have shortcode handlers registered

```php
// wp-content/themes/geteducated/functions.php
// OR wp-content/plugins/geteducated-links/plugin.php

// Internal link shortcode
function ge_internal_link_shortcode($atts, $content = null) {
    $atts = shortcode_atts(array(
        'url' => '#',
        'class' => 'internal-link',
        'target' => '_self'
    ), $atts);

    return sprintf(
        '<a href="%s" class="%s" target="%s">%s</a>',
        esc_url($atts['url']),
        esc_attr($atts['class']),
        esc_attr($atts['target']),
        $content
    );
}
add_shortcode('ge_internal_link', 'ge_internal_link_shortcode');

// Affiliate link shortcode (with tracking)
function ge_affiliate_link_shortcode($atts, $content = null) {
    $atts = shortcode_atts(array(
        'url' => '#',
        'partner' => 'unknown',
        'tracking' => '',
        'target' => '_blank',
        'rel' => 'nofollow sponsored'
    ), $atts);

    // Track click (log to database or analytics)
    // do_action('ge_affiliate_click', $atts['partner'], $atts['tracking']);

    return sprintf(
        '<a href="%s" class="affiliate-link" target="%s" rel="%s" data-partner="%s" data-tracking="%s">%s</a>',
        esc_url($atts['url']),
        esc_attr($atts['target']),
        esc_attr($atts['rel']),
        esc_attr($atts['partner']),
        esc_attr($atts['tracking']),
        $content
    );
}
add_shortcode('ge_affiliate_link', 'ge_affiliate_link_shortcode');

// External link shortcode
function ge_external_link_shortcode($atts, $content = null) {
    $atts = shortcode_atts(array(
        'url' => '#',
        'rel' => 'nofollow',
        'target' => '_blank'
    ), $atts);

    return sprintf(
        '<a href="%s" class="external-link" rel="%s" target="%s">%s</a>',
        esc_url($atts['url']),
        esc_attr($atts['rel']),
        esc_attr($atts['target']),
        $content
    );
}
add_shortcode('ge_external_link', 'ge_external_link_shortcode');
```

**Action Item:** Verify with Kaylee that GetEducated.com WordPress has these shortcode handlers registered. If not, provide this code to install on their site.

---

## 3. Quote Sourcing Strategy

### 3.1 Quote Source Priority

**Confirmed by Client (Josh & Kaylee, Transcript):**
> **Josh:** "we can scrape Reddit, Twitter X... for people talking about their experience"
> **Kaylee:** "I will give you the URL for [forums]. Because there's some great firsthand dialogue"

**Priority Order:**

1. **GetEducated.com Forums** (PRIMARY)
   - URL: [To be provided by Kaylee]
   - Advantage: First-party content, already opted-in
   - Attribution: "Forum member [username], [date]"

2. **Reddit** (SECONDARY)
   - Subreddits: r/OnlineEducation, r/college, r/education, r/GradSchool, r/AskAcademia
   - API: Reddit API v1 with OAuth2
   - Attribution: "Reddit user u/[username], r/[subreddit], [date]"

3. **Twitter/X** (TERTIARY)
   - Hashtags: #OnlineDegree, #OnlineEducation, #HigherEd, #EdTech
   - API: Twitter API v2 (requires paid tier for historical search)
   - Attribution: "Twitter user @[handle], [date]"

4. **Fallback: Fictional Persona** (LAST RESORT)
   - **MUST be clearly labeled:** "Meet Sarah (fictional persona)..."
   - Footer disclosure: "Persona examples are fictional and for illustrative purposes."

**Target:** 60%+ articles with real quotes (not fictional)

### 3.2 Reddit API Integration

**Setup:**

1. Create Reddit app: https://www.reddit.com/prefs/apps
2. Get `client_id` and `client_secret`
3. Store in Supabase secrets: `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`

**OAuth2 Flow (Application-Only):**

```javascript
// Get access token
async function getRedditToken() {
  const auth = btoa(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`);
  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await response.json();
  return data.access_token;
}

// Search comments
async function searchReddit(query, subreddits, limit = 100) {
  const token = await getRedditToken();
  const subredditStr = subreddits.join('+');
  const url = `https://oauth.reddit.com/r/${subredditStr}/search.json?q=${encodeURIComponent(query)}&limit=${limit}&sort=relevance&restrict_sr=1`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'Perdia/1.0' }
  });

  const data = await response.json();
  return data.data.children.map(child => ({
    author: child.data.author,
    body: child.data.selftext || child.data.body,
    subreddit: child.data.subreddit,
    url: `https://reddit.com${child.data.permalink}`,
    created: new Date(child.data.created_utc * 1000)
  }));
}
```

**Example Usage:**

```javascript
const quotes = await searchReddit(
  'online accounting degree experience',
  ['OnlineEducation', 'college', 'education'],
  50
);

// Filter relevant quotes
const relevantQuotes = quotes.filter(q =>
  q.body.length > 100 && q.body.length < 500 && // Reasonable length
  q.body.toLowerCase().includes('degree') // Mention "degree"
);
```

### 3.3 Twitter/X API Integration

**Setup:**

1. Apply for Twitter Developer Account: https://developer.twitter.com/
2. Get Bearer Token (requires Essential+ tier for search)
3. Store in Supabase secrets: `TWITTER_BEARER_TOKEN`

**Search Tweets:**

```javascript
async function searchTwitter(query, maxResults = 100) {
  const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${maxResults}&tweet.fields=author_id,created_at`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}` }
  });

  const data = await response.json();
  return data.data || [];
}
```

**Example Usage:**

```javascript
const tweets = await searchTwitter('#OnlineDegree experience', 100);

// Filter relevant
const relevantTweets = tweets.filter(t =>
  t.text.length > 50 && t.text.length < 280 &&
  !t.text.includes('@') // Avoid replies/mentions
);
```

### 3.4 GetEducated Forums Scraping

**URL:** [To be provided by Kaylee]

**Approach:** Depends on forum software (phpBB, vBulletin, custom)

**Generic Scraper (Cheerio/Playwright):**

```javascript
import * as cheerio from 'cheerio';

async function scrapeForums(forumUrl, searchTerm) {
  // Navigate to forum search
  const searchUrl = `${forumUrl}/search.php?keywords=${encodeURIComponent(searchTerm)}`;
  const html = await fetch(searchUrl).then(r => r.text());

  const $ = cheerio.load(html);
  const posts = [];

  // Extract posts (adjust selectors based on forum software)
  $('.post').each((i, el) => {
    const author = $(el).find('.author').text().trim();
    const body = $(el).find('.content').text().trim();
    const date = $(el).find('.postdate').text().trim();
    const url = $(el).find('a.permalink').attr('href');

    if (body.length > 100) {
      posts.push({ author, body, date, url: forumUrl + url });
    }
  });

  return posts;
}
```

### 3.5 Quote Storage & Attribution

**Database Table:** `quote_sources`

```sql
CREATE TABLE quote_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID REFERENCES content_queue(id),
  quote_text TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN ('forum', 'reddit', 'twitter', 'fictional')),
  source_url TEXT,
  author_name TEXT,
  source_date TIMESTAMPTZ,
  is_fictional BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW()
);
```

**Attribution Format in Articles:**

```html
<!-- Real quote -->
<blockquote class="quote">
  <p>"I completed my online accounting degree while working full-time. The flexibility was amazing."</p>
  <cite>
    — <a href="https://reddit.com/r/OnlineEducation/..." target="_blank" rel="nofollow">
      Reddit user u/AccountingStudent22, r/OnlineEducation, Nov 2024
    </a>
  </cite>
</blockquote>

<!-- Fictional persona (clearly labeled) -->
<blockquote class="quote fictional">
  <p>"I completed my online accounting degree while working full-time. The flexibility was amazing."</p>
  <cite>— Sarah (fictional persona), 42-year-old office manager, Texas</cite>
</blockquote>

<!-- Footer disclosure -->
<footer class="article-footer">
  <p><small>* Persona examples are fictional and for illustrative purposes.</small></p>
</footer>
```

---

## 4. Approval Workflow (5-Day SLA)

### 4.1 Workflow States

```
DRAFT → PENDING_REVIEW → APPROVED_FOR_PUBLISH → SCHEDULED → PUBLISHED
         ↓                ↓
         NEEDS_REVISION   NEEDS_ATTENTION (validation failed)
```

**State Definitions:**

- **draft:** Content generated, not yet validated
- **pending_review:** Passed validation, awaiting Sarah's approval (SLA timer starts)
- **approved_for_publish:** Sarah approved (or auto-approved after 5 days)
- **scheduled:** In publishing queue (respects daily/weekly quotas)
- **published:** Live on GetEducated.com
- **needs_revision:** Sarah rejected, sent back to AI with feedback
- **needs_attention:** Auto-publish attempted but validation failed (requires manual review)

### 4.2 5-Day SLA Timer

**Triggered When:** Article enters `pending_review` status

**Column:** `content_queue.pending_since TIMESTAMPTZ`

**Auto-Publish Logic:**

```sql
-- Articles eligible for auto-publish
SELECT *
FROM content_queue
WHERE status = 'pending_review'
  AND pending_since < NOW() - INTERVAL '5 days'
  AND NOT sla_timer_paused;
```

**Cron Job:** Runs every 6 hours

```sql
SELECT cron.schedule(
  'check-sla-autopublish',
  '0 */6 * * *',
  $$
  -- Re-run validator on eligible articles
  -- If validation passes: status → 'approved_for_publish'
  -- If validation fails: status → 'needs_attention'
  $$
);
```

### 4.3 Sarah's Review Interface

**UI Components:**

1. **SLA Timer Badge**
   ```jsx
   <Badge variant={daysRemaining <= 1 ? 'destructive' : 'default'}>
     {daysRemaining} days remaining
   </Badge>
   ```

2. **Validation Status Indicators**
   ```jsx
   <div className="validation-checks">
     {checks.shortcode_compliance.passed ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
     <span>Shortcode Compliance</span>
   </div>
   ```

3. **Action Buttons**
   ```jsx
   <div className="actions">
     <Button variant="default" onClick={handleApprove}>✓ Approve</Button>
     <Button variant="destructive" onClick={handleReject}>✗ Reject</Button>
     <Button variant="outline" onClick={handleEdit}>✏️ Edit</Button>
   </div>
   ```

4. **Bulk Operations**
   ```jsx
   <Checkbox
     checked={selectedArticles.includes(article.id)}
     onCheckedChange={() => toggleSelection(article.id)}
   />
   // Select multiple → Bulk Approve button
   ```

### 4.4 Auto-Publish Notification

**Email Template:**

```
Subject: [Perdia] Article Auto-Published: [Title]

Hi Sarah,

An article was automatically published after the 5-day SLA:

Title: "Cheapest Online Accounting Degrees 2025"
URL: https://geteducated.com/articles/cheapest-accounting-degrees/
Pending Since: Nov 5, 2025
Auto-Published: Nov 10, 2025

Validation Result: ✅ PASSED
- Shortcode compliance: ✓
- Structured data: ✓
- Internal links: 3
- External links: 1

If you notice any issues, you can edit the post directly on WordPress or flag it in Perdia for revision.

— Perdia Automation
```

---

## 5. Cost Monitoring System

### 5.1 Cost Per Request Logging

**Middleware:** Add to `invoke-llm` Edge Function

```typescript
// After AI response
if (response.usage) {
  const { prompt_tokens, completion_tokens } = response.usage;
  const total_tokens = prompt_tokens + completion_tokens;

  // Calculate cost by model
  let cost = 0;
  if (model.includes('claude-sonnet-4-5')) {
    // $3 / $15 per million tokens
    cost = (prompt_tokens / 1_000_000 * 3) + (completion_tokens / 1_000_000 * 15);
  } else if (model.includes('claude-haiku-4-5')) {
    // $0.25 / $1.25 per million tokens
    cost = (prompt_tokens / 1_000_000 * 0.25) + (completion_tokens / 1_000_000 * 1.25);
  } else if (model.includes('gpt-4o')) {
    // $2.50 / $10 per million tokens
    cost = (prompt_tokens / 1_000_000 * 2.5) + (completion_tokens / 1_000_000 * 10);
  }

  // Log to database
  await supabase.from('ai_usage_logs').insert({
    content_id: body.content_id,
    model,
    provider: body.provider,
    prompt_tokens,
    completion_tokens,
    total_tokens,
    estimated_cost: cost,
    operation_type: body.operation_type || 'generation'
  });

  // Alert if high cost
  if (cost > 10) {
    console.warn(`⚠️ HIGH COST: $${cost.toFixed(2)} for content ${body.content_id}`);
    // TODO: Send Slack alert
  }
}
```

### 5.2 Cost Per Article Aggregation

**Query:**

```sql
-- Cost per article
SELECT
  content_id,
  SUM(estimated_cost) as total_cost,
  COUNT(*) as api_calls,
  SUM(total_tokens) as total_tokens
FROM ai_usage_logs
WHERE content_id IS NOT NULL
GROUP BY content_id
HAVING SUM(estimated_cost) > 5 -- Flag articles >$5
ORDER BY total_cost DESC;
```

**Dashboard Widget (recharts):**

```jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const costData = [
  { name: 'Generation', cost: 0.45 },
  { name: 'Optimization', cost: 0.30 },
  { name: 'Quotes', cost: 0.15 },
  { name: 'Total', cost: 0.90 }
];

<ResponsiveContainer width="100%" height={200}>
  <BarChart data={costData}>
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
    <Bar dataKey="cost" fill="#8884d8" />
  </BarChart>
</ResponsiveContainer>
```

### 5.3 Cost Optimization Strategies

**1. Prompt Caching (90% savings on repeated prompts)**

```javascript
// Cache system prompts (static content)
const systemPrompt = {
  type: "text",
  text: "You are an expert SEO content writer for GetEducated.com...",
  cache_control: { type: "ephemeral" } // Anthropic prompt caching
};

// First request: $3 input
// Subsequent requests (cache hit): $0.30 input (90% savings)
```

**2. Model Selection**

```javascript
// Use Haiku 4.5 for simple tasks ($0.25 input vs. $3 for Sonnet)
const operations = {
  'meta-description': 'claude-haiku-4-5', // 155 chars
  'title': 'claude-haiku-4-5', // 60 chars
  'long-form-article': 'claude-sonnet-4-5', // 2500 words
  'optimization': 'claude-sonnet-4-5' // Complex analysis
};
```

**3. Token Limit Tuning**

```javascript
// Don't default to max_tokens=4000 for everything
const tokenLimits = {
  'meta-description': 200,
  'title': 100,
  'article': 3500, // 2500 words ~3000 tokens
  'optimization': 2000
};
```

**4. Batch Operations**

```javascript
// Generate multiple sections in one request
const prompt = `
Generate 3 article sections:
1. Introduction
2. Main content
3. Conclusion
`;
// Saves 2 API calls (~$0.60)
```

### 5.4 Budget Alerts

**Daily Budget Check (Cron):**

```sql
SELECT cron.schedule(
  'daily-cost-report',
  '0 9 * * *', -- 9am daily
  $$
  SELECT
    DATE(created_date) as date,
    SUM(estimated_cost) as daily_cost,
    COUNT(DISTINCT content_id) as articles_generated
  FROM ai_usage_logs
  WHERE created_date >= CURRENT_DATE - INTERVAL '1 day'
  GROUP BY date;
  -- If daily_cost > $100, send alert
  $$
);
```

**Alert Thresholds:**

- **Warning:** $100/day or $700/week
- **Critical:** $150/day or $1000/week
- **Action:** Pause automation, investigate high-cost articles

---

## 6. Database Access Patterns

### 6.1 Connection Security Checklist

- [ ] Use SSL/TLS encrypted connection (required for production)
- [ ] Create read-only user for SELECT queries
- [ ] Separate write user (if needed) with limited permissions
- [ ] Enable connection pooling (max 5 connections)
- [ ] Set query timeout (10 seconds)
- [ ] Whitelist Supabase IP range in firewall
- [ ] Store credentials in Supabase Vault (encrypted)
- [ ] Test connection with health check endpoint
- [ ] Monitor connection failures (alert if >5% failure rate)
- [ ] Implement fallback to REST API if DB unavailable

### 6.2 Query Optimization Guidelines

**1. Always Use Indexes**

```sql
-- Check if query uses index
EXPLAIN SELECT * FROM wp_posts WHERE post_status = 'publish';

-- Create index if missing
CREATE INDEX idx_post_status ON wp_posts(post_status);
```

**2. Limit Result Sets**

```sql
-- BAD: Returns all posts (could be 100,000+)
SELECT * FROM wp_posts;

-- GOOD: Limits to recent posts
SELECT * FROM wp_posts
WHERE post_date > DATE_SUB(NOW(), INTERVAL 30 DAY)
LIMIT 100;
```

**3. Avoid SELECT \***

```sql
-- BAD: Returns all columns (slower)
SELECT * FROM wp_posts;

-- GOOD: Returns only needed columns
SELECT ID, post_title, post_date FROM wp_posts;
```

**4. Use JOINs Efficiently**

```sql
-- BAD: Multiple queries (N+1 problem)
-- Query 1: Get post
-- Query 2-N: Get categories for each post

-- GOOD: Single JOIN query
SELECT p.ID, p.post_title, t.name as category
FROM wp_posts p
LEFT JOIN wp_term_relationships tr ON p.ID = tr.object_id
LEFT JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
LEFT JOIN wp_terms t ON tt.term_id = t.term_id
WHERE tt.taxonomy = 'category';
```

### 6.3 Backup Before Write Operations

**If ever writing directly to WordPress DB:**

```sql
-- Backup table before update
CREATE TABLE wp_posts_backup_20251110 AS SELECT * FROM wp_posts;

-- Perform update
UPDATE wp_posts SET post_status = 'publish' WHERE ID = 12345;

-- Verify update
SELECT * FROM wp_posts WHERE ID = 12345;

-- If OK, drop backup
DROP TABLE wp_posts_backup_20251110;
```

**Recommendation:** Prefer REST API for all write operations (safer, triggers WordPress hooks).

---

## 7. Testing Procedures

### 7.1 Unit Tests

**Test Shortcode Transformation:**

```javascript
// tests/shortcode-transformer.test.js
import { transformLinks } from '@/lib/shortcode-transformer';

describe('Shortcode Transformer', () => {
  test('transforms internal link', () => {
    const html = '<a href="/programs">Programs</a>';
    const result = transformLinks(html);
    expect(result.content).toContain('[ge_internal_link url="/programs"]');
    expect(result.transformations.internal).toBe(1);
  });

  test('transforms affiliate link', () => {
    const html = '<a href="https://shareasale.com/offer">Offer</a>';
    const result = transformLinks(html);
    expect(result.content).toContain('[ge_affiliate_link url="https://shareasale.com/offer"]');
    expect(result.transformations.affiliate).toBe(1);
  });

  test('rejects raw HTML links', () => {
    const html = '<a href="http://example.com">Link</a>';
    const result = transformLinks(html);
    expect(result.transformations.total).toBeGreaterThan(0);
    expect(result.content).not.toContain('<a ');
  });
});
```

**Test Pre-Publish Validator:**

```javascript
// tests/validator.test.js
import { validateContent } from '@/lib/validator';

describe('Pre-Publish Validator', () => {
  test('passes valid content', () => {
    const content = {
      content: '[ge_internal_link url="/test"]Link[/ge_internal_link]',
      word_count: 2000,
      metadata: { schema: { article_jsonld: {} } }
    };
    const result = validateContent(content);
    expect(result.passed).toBe(true);
  });

  test('fails without shortcodes', () => {
    const content = {
      content: '<a href="/test">Link</a>',
      word_count: 2000
    };
    const result = validateContent(content);
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('Raw HTML links detected');
  });

  test('fails without JSON-LD', () => {
    const content = {
      content: '[ge_internal_link url="/test"]Link[/ge_internal_link]',
      word_count: 2000
    };
    const result = validateContent(content);
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('Missing Article JSON-LD');
  });
});
```

### 7.2 Integration Tests

**Test Full Workflow:**

```javascript
// tests/integration/full-workflow.test.js
import { createTestArticle, prepareForPublishing, publishToWordPress } from '@/lib/test-helpers';

describe('Full Content Workflow', () => {
  test('article goes from draft to published', async () => {
    // 1. Create draft
    const article = await createTestArticle({
      title: 'Test Article',
      content: '<p><a href="/test">Link</a></p>',
      word_count: 2000
    });

    // 2. Transform & validate
    const validation = await prepareForPublishing(article.id);
    expect(validation.passed).toBe(true);

    // 3. Approve
    await supabase.from('content_queue')
      .update({ status: 'approved_for_publish' })
      .eq('id', article.id);

    // 4. Publish to WordPress
    const result = await publishToWordPress(article.id);
    expect(result.success).toBe(true);
    expect(result.post_id).toBeDefined();

    // 5. Verify shortcodes in published content
    const publishedContent = await getWordPressPost(result.post_id);
    expect(publishedContent).not.toContain('<a ');
    expect(publishedContent).toContain('[ge_internal_link');

    // Cleanup
    await deleteWordPressPost(result.post_id);
    await deleteTestArticle(article.id);
  });
});
```

### 7.3 Manual Testing Checklist

**Before Production Deployment:**

- [ ] **WordPress DB Connection**
  - [ ] Test connection health check
  - [ ] Query related posts (verify results)
  - [ ] Test fallback to REST API on DB failure
  - [ ] Verify SSL encryption enabled

- [ ] **Shortcode Transformation**
  - [ ] Transform sample article (internal, affiliate, external links)
  - [ ] Verify 100% transformation (zero raw `<a>` tags)
  - [ ] Test edge cases (nested links, special characters, anchors)
  - [ ] Check affiliate domain detection accuracy

- [ ] **Pre-Publish Validator**
  - [ ] Test with valid article (all checks pass)
  - [ ] Test with invalid article (missing schema, raw links)
  - [ ] Verify error messages actionable
  - [ ] Check validation logs stored correctly

- [ ] **5-Day SLA Auto-Publish**
  - [ ] Set test article `pending_since` to 6 days ago
  - [ ] Manually trigger SLA checker Edge Function
  - [ ] Verify article auto-approved if validation passes
  - [ ] Verify article flagged if validation fails
  - [ ] Check email notification sent

- [ ] **Quote Scraping**
  - [ ] Test Reddit API (search, parse, store)
  - [ ] Test Twitter API (search, parse, store)
  - [ ] Test GetEducated forums scraper (once URL provided)
  - [ ] Verify attribution format correct
  - [ ] Test fallback to fictional persona

- [ ] **Cost Monitoring**
  - [ ] Generate test article, check cost logged
  - [ ] Verify cost calculation accuracy (manual vs. logged)
  - [ ] Test high-cost alert (>$10)
  - [ ] Check daily cost report query

- [ ] **WordPress Publishing**
  - [ ] Publish test article to staging site
  - [ ] Verify featured image uploaded
  - [ ] Check categories and tags set
  - [ ] Verify JSON-LD injected correctly
  - [ ] Test shortcodes render properly on site
  - [ ] Check affiliate link tracking works

- [ ] **Approval Queue UI**
  - [ ] Test SLA timer displays correctly
  - [ ] Test validation status indicators
  - [ ] Test approve/reject/edit actions
  - [ ] Test bulk operations (select multiple, approve all)
  - [ ] Verify cost per article displayed

### 7.4 Performance Testing

**Load Test: 100 Articles/Week**

```javascript
// tests/performance/load-test.js
import { generateArticles, measurePerformance } from '@/lib/test-helpers';

describe('Performance at Scale', () => {
  test('generates 100 articles without timeouts', async () => {
    const start = Date.now();

    // Generate 100 articles concurrently (batches of 10)
    const articles = await generateArticles(100, { batchSize: 10 });

    const duration = Date.now() - start;
    const avgTime = duration / articles.length;

    console.log(`Generated ${articles.length} articles in ${duration}ms`);
    console.log(`Average: ${avgTime}ms/article`);

    expect(articles.length).toBe(100);
    expect(avgTime).toBeLessThan(60000); // <60s per article
  });

  test('publishes 20 articles without rate limits', async () => {
    // Test WordPress REST API rate limits
    const articles = await generateArticles(20);
    const published = [];

    for (const article of articles) {
      const result = await publishToWordPress(article.id);
      expect(result.success).toBe(true);
      published.push(result);
    }

    expect(published.length).toBe(20);
    // Verify no 429 errors
  });
});
```

**Stress Test: Database Connections**

```javascript
// tests/performance/db-stress-test.js
import { wpQuery } from '@/lib/wordpress-db-client';

describe('Database Connection Pool', () => {
  test('handles 50 concurrent queries', async () => {
    const queries = Array(50).fill(null).map(() =>
      wpQuery('SELECT 1 as test')
    );

    const results = await Promise.all(queries);
    expect(results.length).toBe(50);
    // Verify no connection pool exhaustion
  });
});
```

---

## Appendix: Quick Reference

### Environment Variables Checklist

```bash
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_SERVICE_ROLE_KEY=

# AI
VITE_ANTHROPIC_API_KEY=
VITE_OPENAI_API_KEY=

# WordPress DB
VITE_WP_DB_HOST=
VITE_WP_DB_PORT=3306
VITE_WP_DB_NAME=
VITE_WP_DB_USER=
VITE_WP_DB_PASSWORD=
VITE_WP_DB_SSL_CA=

# Quote Scraping
VITE_REDDIT_CLIENT_ID=
VITE_REDDIT_CLIENT_SECRET=
VITE_TWITTER_BEARER_TOKEN=
VITE_GETEDUCATED_FORUMS_URL=
```

### Edge Functions to Deploy

```bash
# New functions
npx supabase functions deploy shortcode-transformer
npx supabase functions deploy pre-publish-validator
npx supabase functions deploy sla-autopublish-checker
npx supabase functions deploy quote-scraper
npx supabase functions deploy cost-monitor

# Updated functions
npx supabase functions deploy invoke-llm # (add cost tracking)
npx supabase functions deploy wordpress-publish # (add shortcode support)
```

### Database Migrations

```bash
# Apply all new migrations
npx supabase db push --project-ref yvvtsfgryweqfppilkvo

# Migrations to create:
# - 20251110000001_shortcode_validation.sql
# - 20251110000002_wordpress_connections_extended.sql
# - 20251110000003_quote_sources.sql
# - 20251110000004_ai_usage_logs.sql
# - 20251110000005_sla_autopublish_columns.sql
# - 20251110000006_sla_autopublish_cron.sql
```

### Key File Locations

```
src/lib/wordpress-db-client.js        # NEW - WordPress DB access
src/lib/content-workflow.js           # UPDATE - Add shortcode transform
src/lib/shortcode-transformer.js      # NEW - Link transformation
supabase/functions/shortcode-transformer/  # NEW - Edge Function
supabase/functions/pre-publish-validator/  # NEW - Edge Function
supabase/functions/sla-autopublish-checker/ # NEW - Edge Function
supabase/functions/quote-scraper/     # NEW - Edge Function
docs/SARAH_TRAINING_GUIDE.md          # NEW - Training documentation
scripts/test-integration.js           # NEW - Integration tests
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Next Review:** After Sprint 1 completion
