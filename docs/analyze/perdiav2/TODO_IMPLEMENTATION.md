# Perdia V2 Implementation TODO

**Created:** 2025-11-11
**Sprint:** Sprint 1 Completion
**Priority Items:** Pipeline Migration, 5-Day SLA Auto-Publish, Quote Scraping

---

## 1. Apply Pipeline System Migration

**Status:** ⏳ Ready to Execute
**Estimated Time:** 30 minutes
**Priority:** HIGH

### What It Does

The migration `supabase/migrations/20251111000001_add_pipeline_system.sql` introduces a **modular, composable AI pipeline system** that enables:

- A/B testing different content generation strategies
- Toggle individual AI models, enhancements, and post-processing steps on/off
- Track performance metrics per pipeline (cost, time, quality, manual edits)
- 100% backwards compatible with current system via default configuration

### New Database Tables

#### `pipeline_configurations`
Stores composable pipeline configs with:
- **Inputs:** Keywords, topic questions, trend sweeps (toggleable)
- **Generators:** Claude Sonnet 4.5, GPT-4o, Grok (toggleable with fallback support)
- **Enhancements:** SEO optimizer, internal links, external citations, quotes, images, Perplexity fact-checking
- **Post-Processing:** Shortcode transformation, readability checks, AI detection avoidance
- **Performance Metrics:** Total articles, avg cost, avg time, avg manual edits, avg SEO score, success rate

#### `topic_questions`
Monthly/weekly ingested questions about higher education:
- Question text, category, source (monthly-ingest/weekly-trend/manual)
- Priority, search volume, trending score
- Usage tracking (times used, last used)
- Status workflow (pending → in-progress → completed → archived)

#### `scraped_quotes`
Real quotes from Reddit, Twitter, GetEducated forums:
- Quote text, author, source platform, source URL
- Topic category, relevance score, sentiment
- Usage tracking, quality control flags
- RLS ensures only appropriate quotes shown to users

#### Enhanced `content_queue`
New columns:
- `pipeline_config_id` - Which pipeline was used
- `generation_metadata` - Step-by-step generation details (steps, cost, time, models used)

### Implementation Steps

1. **Run the Migration:**
   ```bash
   npx supabase db push --project-ref yvvtsfgryweqfppilkvo
   ```

2. **Verify Schema Changes:**
   ```bash
   node scripts/verify-pipeline-schema.js  # Need to create this
   ```

3. **Update SDK (`src/lib/perdia-sdk.js`):**
   - Add `PipelineConfiguration` entity
   - Add `TopicQuestion` entity
   - Add `ScrapedQuote` entity
   - Update `ContentQueue` entity to include new columns

4. **Create Frontend Components:**
   - `PipelineConfigurator.jsx` - UI to create/edit pipeline configs
   - `PipelineComparison.jsx` - A/B test results dashboard
   - `TopicQuestionsManager.jsx` - Monthly question ingest UI
   - `QuoteLibrary.jsx` - Browse/manage scraped quotes

5. **Update Content Generation Flow:**
   - Modify `supabase/functions/invoke-llm/` to accept `pipeline_config_id`
   - Implement pipeline execution logic (inputs → generators → enhancements → post-processing)
   - Track generation metadata (steps, timing, costs per step)
   - Update performance metrics after each article

### Success Criteria

- [ ] Migration applied successfully (no errors)
- [ ] SDK entities created and tested
- [ ] Default pipeline config exists in database
- [ ] Can generate content using new pipeline system
- [ ] Performance metrics update correctly
- [ ] Backwards compatible (existing content generation still works)

### Files to Create/Modify

**New Files:**
- `scripts/verify-pipeline-schema.js`
- `src/components/pipelines/PipelineConfigurator.jsx`
- `src/components/pipelines/PipelineComparison.jsx`
- `src/components/topics/TopicQuestionsManager.jsx`
- `src/components/quotes/QuoteLibrary.jsx`

**Modify:**
- `src/lib/perdia-sdk.js` (add 3 new entities, update ContentQueue)
- `supabase/functions/invoke-llm/index.ts` (pipeline execution logic)
- `src/pages/ContentLibrary.jsx` (show pipeline config used)
- `src/pages/Settings.jsx` (add pipeline settings tab)

---

## 4. Implement 5-Day SLA Auto-Publish Workflow

**Status:** ⏳ Not Started
**Estimated Time:** 4-6 hours
**Priority:** HIGHEST (MANDATORY per client)

### What It Does

Articles in `pending_review` status automatically publish to WordPress after 5 days if not acted upon. This ensures content doesn't get stuck in the queue and meets production targets.

### Requirements (from CLAUDE.md)

1. **Auto-Publish Timer:**
   - When article status changes to `pending_review`, record timestamp
   - After 5 days (configurable), change status to `approved` → `scheduled` → `published`
   - Must pass validation checks before publishing (see #3)

2. **Pre-Publish Validation:**
   - Title exists and non-empty
   - Content exists and non-empty
   - Meta description exists (max 155 chars)
   - At least 1 featured image
   - All shortcodes properly formatted
   - No broken internal links
   - Word count meets minimum (1500+ words for articles)

3. **Safety Controls:**
   - User can disable auto-publish globally (Settings)
   - User can disable auto-publish per article (Approval Queue)
   - Failed validation blocks auto-publish and sends notification
   - Manual approval always overrides timer

### Implementation Steps

#### A. Database Changes

1. **Add Columns to `content_queue`:**
   ```sql
   ALTER TABLE content_queue
     ADD COLUMN IF NOT EXISTS pending_review_since TIMESTAMPTZ,
     ADD COLUMN IF NOT EXISTS auto_publish_enabled BOOLEAN DEFAULT true,
     ADD COLUMN IF NOT EXISTS validation_errors JSONB DEFAULT '[]'::jsonb;

   CREATE INDEX idx_content_queue_auto_publish
     ON content_queue(pending_review_since)
     WHERE status = 'pending_review' AND auto_publish_enabled = true;
   ```

2. **Add to `automation_settings`:**
   ```sql
   ALTER TABLE automation_settings
     ADD COLUMN IF NOT EXISTS auto_publish_enabled BOOLEAN DEFAULT true,
     ADD COLUMN IF NOT EXISTS auto_publish_days INTEGER DEFAULT 5;
   ```

#### B. Create Validation Service

**File:** `src/lib/content-validator.js`

```javascript
export async function validateContentForPublishing(contentId) {
  const content = await ContentQueue.findById(contentId);
  const errors = [];

  // Title validation
  if (!content.title || content.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title is required' });
  }

  // Content validation
  if (!content.content || content.content.trim().length === 0) {
    errors.push({ field: 'content', message: 'Content is required' });
  }

  // Word count validation
  const wordCount = content.content.split(/\s+/).length;
  if (wordCount < 1500) {
    errors.push({ field: 'content', message: `Word count too low: ${wordCount} (minimum: 1500)` });
  }

  // Meta description validation
  if (!content.meta_description) {
    errors.push({ field: 'meta_description', message: 'Meta description is required' });
  } else if (content.meta_description.length > 155) {
    errors.push({ field: 'meta_description', message: 'Meta description exceeds 155 characters' });
  }

  // Featured image validation
  if (!content.featured_image_url) {
    errors.push({ field: 'featured_image_url', message: 'Featured image is required' });
  }

  // Shortcode validation
  const shortcodeErrors = validateShortcodes(content.content);
  errors.push(...shortcodeErrors);

  // Internal link validation
  const linkErrors = await validateInternalLinks(content.content);
  errors.push(...linkErrors);

  return {
    valid: errors.length === 0,
    errors
  };
}

function validateShortcodes(content) {
  const errors = [];
  const shortcodePatterns = [
    /\[ge_internal_link url="([^"]+)"\](.+?)\[\/ge_internal_link\]/g,
    /\[ge_affiliate_link url="([^"]+)"\](.+?)\[\/ge_affiliate_link\]/g,
    /\[ge_external_link url="([^"]+)"\](.+?)\[\/ge_external_link\]/g
  ];

  // Check for unclosed shortcodes
  const openTags = (content.match(/\[ge_\w+_link/g) || []).length;
  const closeTags = (content.match(/\[\/ge_\w+_link\]/g) || []).length;

  if (openTags !== closeTags) {
    errors.push({ field: 'content', message: 'Unclosed shortcode tags detected' });
  }

  return errors;
}

async function validateInternalLinks(content) {
  const errors = [];
  const internalLinkPattern = /\[ge_internal_link url="([^"]+)"\]/g;
  let match;

  while ((match = internalLinkPattern.exec(content)) !== null) {
    const url = match[1];
    // TODO: Check if URL exists in WordPress (future enhancement)
  }

  return errors;
}
```

#### C. Create Auto-Publish Cron Job

**File:** `supabase/functions/auto-publish-content/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find articles ready for auto-publish
    const { data: articlesToPublish, error } = await supabase
      .from('content_queue')
      .select('*')
      .eq('status', 'pending_review')
      .eq('auto_publish_enabled', true)
      .not('pending_review_since', 'is', null)
      .lt('pending_review_since', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const results = [];

    for (const article of articlesToPublish) {
      // Validate content
      const validation = await validateContent(article);

      if (!validation.valid) {
        // Update with validation errors
        await supabase
          .from('content_queue')
          .update({
            validation_errors: validation.errors,
            auto_publish_enabled: false // Disable auto-publish on failure
          })
          .eq('id', article.id);

        results.push({
          id: article.id,
          status: 'failed_validation',
          errors: validation.errors
        });
        continue;
      }

      // Publish to WordPress
      const publishResult = await publishToWordPress(article);

      if (publishResult.success) {
        await supabase
          .from('content_queue')
          .update({
            status: 'published',
            published_date: new Date().toISOString(),
            wordpress_post_id: publishResult.postId,
            wordpress_url: publishResult.url
          })
          .eq('id', article.id);

        results.push({
          id: article.id,
          status: 'published',
          wordpress_post_id: publishResult.postId
        });
      } else {
        results.push({
          id: article.id,
          status: 'publish_failed',
          error: publishResult.error
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
```

#### D. Configure Cron Job

**File:** `supabase/migrations/20251111000002_add_auto_publish_cron.sql`

```sql
-- Add auto-publish cron job (runs every 6 hours)
SELECT cron.schedule(
  'auto-publish-content',
  '0 */6 * * *',  -- Every 6 hours
  $$
  SELECT net.http_post(
    url := 'https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/auto-publish-content',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  ) as request_id;
  $$
);
```

#### E. Frontend Updates

**Modify:** `src/components/content/ApprovalQueue.jsx`

Add UI indicators:
- Show "Auto-publishes in X days" countdown
- Toggle to disable auto-publish per article
- Display validation errors if present
- Visual warning when approaching 5-day limit

**Modify:** `src/pages/Settings.jsx`

Add automation settings:
- Enable/disable auto-publish globally
- Configure auto-publish days (default: 5)
- Set validation rules (strict vs. lenient)

### Success Criteria

- [ ] Database columns added successfully
- [ ] Validation service catches all required issues
- [ ] Auto-publish cron job deployed and running
- [ ] Articles auto-publish after 5 days (tested with 5-minute interval for testing)
- [ ] Failed validation blocks publish and notifies user
- [ ] User can disable auto-publish globally and per-article
- [ ] Frontend shows countdown timer
- [ ] Manual approval overrides timer

### Testing Plan

1. Create test article with status `pending_review`
2. Set `pending_review_since` to 5 days ago (manually via SQL)
3. Run cron job manually
4. Verify article validates and publishes to WordPress
5. Test validation failures (missing title, short content, etc.)
6. Test disable auto-publish toggle

---

## 5. Implement Quote Scraping System

**Status:** ⏳ Not Started
**Estimated Time:** 8-12 hours
**Priority:** HIGH (MANDATORY per client - 60%+ real quotes)

### What It Does

Scrapes real quotes from Reddit, Twitter/X, and GetEducated forums to inject authentic student/educator perspectives into articles. This meets the client's requirement for 60%+ real quotes vs. AI-generated fictional quotes.

### Requirements (from CLAUDE.md & perdiav2.md)

1. **Quote Sources:**
   - Reddit: r/college, r/ApplyingToCollege, r/CollegeAdmissions, r/GradSchool
   - Twitter/X: Search API for higher education discussions
   - GetEducated Forums: Direct database scraping or API (need credentials)

2. **Quote Quality:**
   - Minimum relevance score: 0.6 (60%)
   - Sentiment analysis: positive, negative, neutral, mixed
   - Content moderation: filter inappropriate language
   - Verification: mark verified vs. unverified

3. **Usage Tracking:**
   - Track times used per quote (avoid repetition)
   - Rotate quotes intelligently
   - Update last_used_at timestamp

4. **Integration:**
   - Pipeline enhancement: `quotes.enabled = true`
   - Per article: 2 quotes minimum (configurable)
   - Placement: natural insertion into article body

### Implementation Steps

#### A. Database Setup (Already in Migration)

Table `scraped_quotes` already defined in `20251111000001_add_pipeline_system.sql`:
- Quote text, author, source platform, source URL
- Topic category, relevance score, sentiment
- Usage tracking, quality flags

#### B. Create Reddit Scraper

**File:** `scripts/scrapers/reddit-scraper.js`

```javascript
import snoowrap from 'snoowrap';
import { supabaseAdmin } from '@/lib/supabase-client';

const SUBREDDITS = [
  'college',
  'ApplyingToCollege',
  'CollegeAdmissions',
  'GradSchool',
  'OnlineEducation',
  'StudentLoans'
];

const RELEVANCE_KEYWORDS = [
  'degree', 'university', 'college', 'tuition', 'financial aid',
  'scholarship', 'online courses', 'career', 'major', 'accreditation'
];

async function scrapeReddit() {
  const reddit = new snoowrap({
    userAgent: 'Perdia Education Content Bot v1.0',
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD
  });

  const quotes = [];

  for (const subreddit of SUBREDDITS) {
    console.log(`Scraping r/${subreddit}...`);

    // Get hot posts from last month
    const posts = await reddit.getSubreddit(subreddit).getHot({ limit: 100 });

    for (const post of posts) {
      // Skip if post is too old (>30 days)
      const postAge = Date.now() - (post.created_utc * 1000);
      if (postAge > 30 * 24 * 60 * 60 * 1000) continue;

      // Get top comments
      await post.expandReplies({ limit: 10, depth: 1 });
      const comments = post.comments.slice(0, 20);

      for (const comment of comments) {
        if (typeof comment.body !== 'string') continue;
        if (comment.body.length < 50 || comment.body.length > 500) continue;

        // Calculate relevance score
        const relevanceScore = calculateRelevance(comment.body, RELEVANCE_KEYWORDS);
        if (relevanceScore < 0.3) continue;

        // Analyze sentiment
        const sentiment = analyzeSentiment(comment.body);

        // Check appropriateness
        const isAppropriate = checkAppropriate(comment.body);

        quotes.push({
          quote_text: comment.body,
          author: comment.author.name,
          source_platform: 'reddit',
          source_url: `https://reddit.com${comment.permalink}`,
          topic_category: categorizeTopic(comment.body),
          relevance_score: relevanceScore,
          sentiment: sentiment,
          is_verified: false,
          is_appropriate: isAppropriate,
          scraped_at: new Date().toISOString()
        });
      }
    }
  }

  // Insert quotes into database
  if (quotes.length > 0) {
    const { data, error } = await supabaseAdmin
      .from('scraped_quotes')
      .insert(quotes)
      .select();

    if (error) {
      console.error('Error inserting quotes:', error);
    } else {
      console.log(`Inserted ${data.length} Reddit quotes`);
    }
  }

  return quotes;
}

function calculateRelevance(text, keywords) {
  const lowerText = text.toLowerCase();
  const matches = keywords.filter(keyword => lowerText.includes(keyword.toLowerCase()));
  return Math.min(matches.length / keywords.length * 2, 1.0);
}

function analyzeSentiment(text) {
  // Simple sentiment analysis (can be enhanced with Anthropic API later)
  const positive = ['great', 'excellent', 'amazing', 'helpful', 'recommend', 'worth it'];
  const negative = ['terrible', 'awful', 'waste', 'scam', 'regret', 'avoid'];

  const lowerText = text.toLowerCase();
  const posCount = positive.filter(word => lowerText.includes(word)).length;
  const negCount = negative.filter(word => lowerText.includes(word)).length;

  if (posCount > negCount) return 'positive';
  if (negCount > posCount) return 'negative';
  if (posCount === negCount && posCount > 0) return 'mixed';
  return 'neutral';
}

function checkAppropriate(text) {
  const inappropriate = ['fuck', 'shit', 'damn', 'ass', 'crap'];
  const lowerText = text.toLowerCase();
  return !inappropriate.some(word => lowerText.includes(word));
}

function categorizeTopic(text) {
  const categories = {
    'online-degrees': ['online', 'distance learning', 'virtual'],
    'financial-aid': ['scholarship', 'financial aid', 'loan', 'tuition'],
    'career': ['job', 'career', 'employment', 'salary'],
    'admissions': ['admissions', 'application', 'accepted', 'rejected'],
    'general': []
  };

  const lowerText = text.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }

  return 'general';
}

export { scrapeReddit };
```

#### C. Create Twitter/X Scraper

**File:** `scripts/scrapers/twitter-scraper.js`

```javascript
import { TwitterApi } from 'twitter-api-v2';
import { supabaseAdmin } from '@/lib/supabase-client';

const SEARCH_QUERIES = [
  'online degree',
  'college tuition',
  'financial aid',
  'student loans',
  'higher education',
  'accredited university'
];

async function scrapeTwitter() {
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET
  });

  const quotes = [];

  for (const query of SEARCH_QUERIES) {
    console.log(`Searching Twitter for: "${query}"...`);

    try {
      const tweets = await client.v2.search(query, {
        max_results: 100,
        'tweet.fields': ['created_at', 'author_id', 'public_metrics'],
        'user.fields': ['username']
      });

      for await (const tweet of tweets) {
        if (tweet.text.length < 50 || tweet.text.length > 280) continue;

        // Skip retweets and replies
        if (tweet.text.startsWith('RT @') || tweet.text.startsWith('@')) continue;

        const relevanceScore = calculateRelevance(tweet.text);
        if (relevanceScore < 0.3) continue;

        quotes.push({
          quote_text: tweet.text,
          author: tweet.author_id, // Can enhance with username lookup
          source_platform: 'twitter',
          source_url: `https://twitter.com/i/web/status/${tweet.id}`,
          topic_category: categorizeTopic(tweet.text),
          relevance_score: relevanceScore,
          sentiment: analyzeSentiment(tweet.text),
          is_verified: false,
          is_appropriate: checkAppropriate(tweet.text),
          scraped_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(`Error searching Twitter for "${query}":`, error);
    }
  }

  // Insert quotes
  if (quotes.length > 0) {
    const { data, error } = await supabaseAdmin
      .from('scraped_quotes')
      .insert(quotes)
      .select();

    if (error) {
      console.error('Error inserting Twitter quotes:', error);
    } else {
      console.log(`Inserted ${data.length} Twitter quotes`);
    }
  }

  return quotes;
}

// Reuse helper functions from reddit-scraper
```

#### D. Create GetEducated Forums Scraper

**File:** `scripts/scrapers/geteducated-forums-scraper.js`

**NOTE:** This requires GetEducated forum credentials and database access details.

```javascript
import mysql from 'mysql2/promise';
import { supabaseAdmin } from '@/lib/supabase-client';

async function scrapeGetEducatedForums() {
  // Connect to GetEducated forum database
  const connection = await mysql.createConnection({
    host: process.env.GETEDUCATED_FORUM_DB_HOST,
    user: process.env.GETEDUCATED_FORUM_DB_USER,
    password: process.env.GETEDUCATED_FORUM_DB_PASSWORD,
    database: process.env.GETEDUCATED_FORUM_DB_NAME
  });

  // Query recent forum posts (last 30 days)
  const [posts] = await connection.execute(`
    SELECT
      p.post_text,
      u.username,
      p.post_id,
      p.topic_id,
      p.created_at
    FROM forum_posts p
    JOIN forum_users u ON p.user_id = u.user_id
    WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      AND LENGTH(p.post_text) BETWEEN 50 AND 500
    ORDER BY p.created_at DESC
    LIMIT 500
  `);

  const quotes = [];

  for (const post of posts) {
    const relevanceScore = calculateRelevance(post.post_text);
    if (relevanceScore < 0.4) continue;

    quotes.push({
      quote_text: post.post_text,
      author: post.username,
      source_platform: 'geteducated-forums',
      source_url: `https://geteducated.com/forums/topic/${post.topic_id}#post-${post.post_id}`,
      topic_category: categorizeTopic(post.post_text),
      relevance_score: relevanceScore,
      sentiment: analyzeSentiment(post.post_text),
      is_verified: true, // GetEducated forums are trusted
      is_appropriate: checkAppropriate(post.post_text),
      scraped_at: new Date().toISOString()
    });
  }

  await connection.end();

  // Insert quotes
  if (quotes.length > 0) {
    const { data, error } = await supabaseAdmin
      .from('scraped_quotes')
      .insert(quotes)
      .select();

    if (error) {
      console.error('Error inserting forum quotes:', error);
    } else {
      console.log(`Inserted ${data.length} GetEducated forum quotes`);
    }
  }

  return quotes;
}
```

#### E. Create Master Scraper Orchestrator

**File:** `scripts/run-quote-scraper.js`

```javascript
import { scrapeReddit } from './scrapers/reddit-scraper.js';
import { scrapeTwitter } from './scrapers/twitter-scraper.js';
import { scrapeGetEducatedForums } from './scrapers/geteducated-forums-scraper.js';

async function runAllScrapers() {
  console.log('Starting quote scraping...\n');

  const results = {
    reddit: 0,
    twitter: 0,
    forums: 0,
    total: 0,
    errors: []
  };

  try {
    const redditQuotes = await scrapeReddit();
    results.reddit = redditQuotes.length;
    console.log(`✓ Reddit: ${redditQuotes.length} quotes\n`);
  } catch (error) {
    console.error('✗ Reddit scraper failed:', error.message);
    results.errors.push({ source: 'reddit', error: error.message });
  }

  try {
    const twitterQuotes = await scrapeTwitter();
    results.twitter = twitterQuotes.length;
    console.log(`✓ Twitter: ${twitterQuotes.length} quotes\n`);
  } catch (error) {
    console.error('✗ Twitter scraper failed:', error.message);
    results.errors.push({ source: 'twitter', error: error.message });
  }

  try {
    const forumQuotes = await scrapeGetEducatedForums();
    results.forums = forumQuotes.length;
    console.log(`✓ GetEducated Forums: ${forumQuotes.length} quotes\n`);
  } catch (error) {
    console.error('✗ Forum scraper failed:', error.message);
    results.errors.push({ source: 'forums', error: error.message });
  }

  results.total = results.reddit + results.twitter + results.forums;

  console.log('\n=== Scraping Complete ===');
  console.log(`Total quotes scraped: ${results.total}`);
  console.log(`Reddit: ${results.reddit}`);
  console.log(`Twitter: ${results.twitter}`);
  console.log(`Forums: ${results.forums}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(err => {
      console.log(`  - ${err.source}: ${err.error}`);
    });
  }

  return results;
}

runAllScrapers().catch(console.error);
```

#### F. Create Supabase Edge Function for Quote Injection

**File:** `supabase/functions/inject-quotes/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { article_content, topic_category, num_quotes = 2 } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch relevant quotes
    const { data: quotes, error } = await supabase
      .from('scraped_quotes')
      .select('*')
      .eq('is_appropriate', true)
      .eq('topic_category', topic_category)
      .gte('relevance_score', 0.6)
      .order('times_used', { ascending: true })
      .order('relevance_score', { ascending: false })
      .limit(num_quotes);

    if (error) throw error;

    // Inject quotes into article content
    let enhancedContent = article_content;
    const injectionPoints = findQuoteInjectionPoints(article_content);

    for (let i = 0; i < Math.min(quotes.length, injectionPoints.length); i++) {
      const quote = quotes[i];
      const quoteHtml = formatQuote(quote);

      // Insert quote at injection point
      enhancedContent = insertAtPosition(
        enhancedContent,
        injectionPoints[i],
        quoteHtml
      );

      // Update usage tracking
      await supabase
        .from('scraped_quotes')
        .update({
          times_used: quote.times_used + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', quote.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        enhanced_content: enhancedContent,
        quotes_used: quotes.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function findQuoteInjectionPoints(content: string): number[] {
  // Find paragraph breaks (<p> tags) for quote injection
  const regex = /<\/p>/g;
  const positions: number[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    positions.push(match.index + 4); // After </p>
  }

  // Return evenly spaced positions (e.g., 25%, 50%, 75% through article)
  const step = Math.floor(positions.length / 3);
  return [
    positions[step],
    positions[step * 2]
  ];
}

function formatQuote(quote: any): string {
  return `
<blockquote class="scraped-quote" data-source="${quote.source_platform}">
  <p>${quote.quote_text}</p>
  <footer>
    <cite>— ${quote.author || 'Anonymous'}, via ${quote.source_platform}</cite>
  </footer>
</blockquote>
`;
}

function insertAtPosition(content: string, position: number, insertion: string): string {
  return content.slice(0, position) + insertion + content.slice(position);
}
```

#### G. Add Quote Management UI

**File:** `src/components/quotes/QuoteLibrary.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { ScrapedQuote } from '@/lib/perdia-sdk';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export function QuoteLibrary() {
  const [quotes, setQuotes] = useState([]);
  const [filter, setFilter] = useState({ platform: 'all', category: 'all' });

  useEffect(() => {
    loadQuotes();
  }, [filter]);

  async function loadQuotes() {
    const query = {
      is_appropriate: true,
      ...(filter.platform !== 'all' && { source_platform: filter.platform }),
      ...(filter.category !== 'all' && { topic_category: filter.category })
    };

    const data = await ScrapedQuote.find(query, {
      orderBy: { column: 'relevance_score', ascending: false },
      limit: 100
    });

    setQuotes(data);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Quote Library</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filter.platform}
          onChange={(e) => setFilter({ ...filter, platform: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="all">All Platforms</option>
          <option value="reddit">Reddit</option>
          <option value="twitter">Twitter</option>
          <option value="geteducated-forums">GetEducated Forums</option>
        </select>

        <select
          value={filter.category}
          onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="all">All Categories</option>
          <option value="online-degrees">Online Degrees</option>
          <option value="financial-aid">Financial Aid</option>
          <option value="career">Career</option>
          <option value="admissions">Admissions</option>
        </select>
      </div>

      {/* Quote Grid */}
      <div className="grid gap-4">
        {quotes.map((quote) => (
          <Card key={quote.id} className="p-4">
            <blockquote className="mb-2">"{quote.quote_text}"</blockquote>
            <div className="flex gap-2 text-sm text-gray-600">
              <Badge>{quote.source_platform}</Badge>
              <Badge variant="outline">{quote.sentiment}</Badge>
              <span>Relevance: {(quote.relevance_score * 100).toFixed(0)}%</span>
              <span>Used: {quote.times_used} times</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

#### H. Schedule Daily Scraping

**File:** `supabase/migrations/20251111000003_add_quote_scraping_cron.sql`

```sql
-- Add daily quote scraping cron job (runs at 2 AM)
SELECT cron.schedule(
  'scrape-quotes-daily',
  '0 2 * * *',  -- 2 AM every day
  $$
  -- This will trigger a script that runs the Node.js scrapers
  -- Implementation depends on hosting setup
  $$
);
```

### Success Criteria

- [ ] Reddit scraper deployed and tested
- [ ] Twitter scraper deployed and tested
- [ ] GetEducated forums scraper deployed and tested (needs credentials)
- [ ] Quotes stored in database with metadata
- [ ] Quote injection Edge Function working
- [ ] At least 500 quotes scraped initially
- [ ] 60%+ relevance score on scraped quotes
- [ ] Quote Library UI functional
- [ ] Daily scraping cron job configured
- [ ] Quotes rotate intelligently (least-used first)

### Dependencies & Credentials Needed

**Reddit API:**
- Client ID: `process.env.REDDIT_CLIENT_ID`
- Client Secret: `process.env.REDDIT_CLIENT_SECRET`
- Username: `process.env.REDDIT_USERNAME`
- Password: `process.env.REDDIT_PASSWORD`

**Twitter API:**
- API Key: `process.env.TWITTER_API_KEY`
- API Secret: `process.env.TWITTER_API_SECRET`
- Access Token: `process.env.TWITTER_ACCESS_TOKEN`
- Access Secret: `process.env.TWITTER_ACCESS_SECRET`

**GetEducated Forums:**
- DB Host: `process.env.GETEDUCATED_FORUM_DB_HOST`
- DB User: `process.env.GETEDUCATED_FORUM_DB_USER`
- DB Password: `process.env.GETEDUCATED_FORUM_DB_PASSWORD`
- DB Name: `process.env.GETEDUCATED_FORUM_DB_NAME`

**NPM Packages to Install:**
```bash
npm install snoowrap twitter-api-v2 mysql2
```

### Testing Plan

1. Run scrapers manually: `node scripts/run-quote-scraper.js`
2. Verify quotes in database via Supabase Studio
3. Test quote injection with sample article content
4. Verify relevance scoring and filtering
5. Test rotation logic (least-used quotes prioritized)
6. Test inappropriate content filtering
7. Verify usage tracking updates correctly

---

## Summary

These three tasks are the **highest priority** for Sprint 1 completion:

1. **Pipeline Migration** - Enables modular AI system (30 min)
2. **5-Day SLA Auto-Publish** - MANDATORY client requirement (4-6 hours)
3. **Quote Scraping** - MANDATORY 60%+ real quotes (8-12 hours)

**Total Estimated Time:** 13-19 hours (2-3 days of focused work)

**Blockers:**
- GetEducated forum credentials needed for scraper #5
- Reddit/Twitter API keys needed for scrapers

**Next Steps After Completion:**
- Sprint 2: Keyword rotation algorithm, cost monitoring
- Sprint 3: Integration testing, Sarah training
- Sprint 4: Production deployment, first 50 articles monitoring
