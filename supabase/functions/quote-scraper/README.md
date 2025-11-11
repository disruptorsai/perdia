# Quote Scraper Edge Function

## Overview

Scrapes real quotes from Reddit, Twitter/X, and GetEducated forums to achieve the **60%+ real quote attribution requirement** specified by the client.

## Features

- **Reddit Scraping:** Uses Reddit JSON API (no auth required) to scrape education-related subreddits
- **Twitter/X Integration:** Placeholder for Twitter API v2 integration (requires credentials)
- **Forum Scraping:** Placeholder for GetEducated forum scraping (requires forum URL)
- **Sentiment Analysis:** Simple keyword-based sentiment detection (positive/negative/neutral)
- **Database Storage:** Stores quotes in `quote_sources` table with full metadata
- **Deduplication:** Prevents duplicate quotes by checking existing records

## API Endpoint

```
POST https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/quote-scraper
```

## Request Format

```json
{
  "keyword": "online mba programs",
  "sources": ["reddit", "twitter", "forum"],
  "maxQuotes": 20,
  "includeNegative": true
}
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `keyword` | string | Yes | - | Search keyword for quote scraping |
| `sources` | array | No | `["reddit"]` | Sources to scrape: `reddit`, `twitter`, `forum` |
| `maxQuotes` | number | No | `20` | Maximum number of quotes to scrape |
| `includeNegative` | boolean | No | `true` | Whether to include negatively-sentimented quotes |

## Response Format

```json
{
  "success": true,
  "keyword": "online mba programs",
  "quotesScraped": 18,
  "quotesStored": 18,
  "sourceBreakdown": {
    "reddit": 15,
    "twitter": 0,
    "forum": 0
  },
  "sentimentBreakdown": {
    "positive": 8,
    "neutral": 7,
    "negative": 3
  },
  "quotes": [
    {
      "id": "uuid",
      "quote_text": "I completed my MBA online and it was amazing...",
      "attribution": "Reddit user u/example",
      "source_type": "reddit",
      "source_url": "https://reddit.com/r/college/comments/...",
      "sentiment": "positive",
      "reddit_subreddit": "college",
      "reddit_post_id": "abc123",
      "reddit_score": 45,
      "keyword": "online mba programs",
      "scraped_date": "2025-11-11T18:30:00.000Z",
      "is_verified": false,
      "is_fictional": false,
      "user_id": "uuid",
      "created_date": "2025-11-11T18:30:00.000Z"
    }
  ]
}
```

## Reddit Scraping

### Subreddits Searched

- r/college
- r/AskAcademia
- r/education
- r/OnlineEducation
- r/gradadmissions
- r/GradSchool
- r/GetStudying

### Rate Limiting

- 1 second delay between subreddit requests
- Respects Reddit's User-Agent requirements
- No authentication required (public API)

### Quote Selection Criteria

- Text length: 50-500 characters
- Includes post selftext, titles, and top comments
- Filters out deleted/removed content
- Sorts by upvote score (top posts first)

## Twitter/X Integration (TODO)

**Status:** Placeholder - requires Twitter API v2 credentials

### Requirements

1. Twitter API v2 access
2. Bearer token or OAuth credentials
3. Search tweets endpoint access

### Environment Variables Needed

```
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_BEARER_TOKEN=your_bearer_token
```

## GetEducated Forums (TODO)

**Status:** Placeholder - requires forum URL from client

### Requirements

1. GetEducated forum URL
2. Forum structure/CSS selectors for scraping
3. Authentication if required

## Deployment

```bash
# Deploy to Supabase
npx supabase functions deploy quote-scraper --project-ref yvvtsfgryweqfppilkvo

# Test deployment
curl -X POST \
  https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/quote-scraper \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"keyword": "online degrees", "sources": ["reddit"], "maxQuotes": 10}'
```

## Usage in Content Workflow

```javascript
import { supabase } from '@/lib/supabase-client';

// Scrape quotes for keyword
const { data, error } = await supabase.functions.invoke('quote-scraper', {
  body: {
    keyword: 'online mba programs',
    sources: ['reddit'],
    maxQuotes: 15,
    includeNegative: false
  }
});

if (!error && data.success) {
  console.log(`Scraped ${data.quotesScraped} quotes`);
  console.log('Sentiment breakdown:', data.sentimentBreakdown);

  // Quotes are now stored in database
  // Retrieve them for content generation
  const { data: quotes } = await supabase
    .from('quote_sources')
    .select('*')
    .eq('keyword', 'online mba programs')
    .eq('is_fictional', false)
    .order('reddit_score', { ascending: false })
    .limit(5);

  // Use top quotes in article
  quotes.forEach(quote => {
    console.log(`"${quote.quote_text}" - ${quote.attribution}`);
  });
}
```

## Database Schema

Stores quotes in `quote_sources` table:

```sql
CREATE TABLE quote_sources (
  id UUID PRIMARY KEY,
  content_id UUID REFERENCES content_queue(id),
  user_id UUID REFERENCES auth.users(id),
  quote_text TEXT NOT NULL,
  attribution TEXT,
  source_type TEXT NOT NULL, -- 'reddit', 'twitter', 'forum'
  source_url TEXT,
  scraped_date TIMESTAMPTZ,
  keyword TEXT,
  sentiment TEXT, -- 'positive', 'negative', 'neutral'
  is_verified BOOLEAN DEFAULT FALSE,
  is_fictional BOOLEAN DEFAULT FALSE,
  -- Reddit-specific
  reddit_subreddit TEXT,
  reddit_post_id TEXT,
  reddit_comment_id TEXT,
  reddit_score INTEGER,
  -- Twitter-specific
  twitter_tweet_id TEXT,
  twitter_username TEXT,
  twitter_retweet_count INTEGER,
  twitter_like_count INTEGER,
  -- Forum-specific
  forum_thread_id TEXT,
  forum_post_id TEXT,
  forum_username TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);
```

## Error Handling

| Error | Status | Description |
|-------|--------|-------------|
| Missing keyword | 400 | `keyword` parameter is required |
| Unauthorized | 401 | Invalid or missing JWT token |
| Database error | 500 | Failed to store quotes in database |
| Scraping error | 500 | Failed to fetch from external source |

## Performance

- **Reddit scraping:** ~5-10 seconds for 20 quotes (depends on API response time)
- **Rate limiting:** 1 second delay per subreddit
- **Timeout:** 60 seconds maximum (configurable)

## Future Enhancements

1. **Twitter Integration:** Complete Twitter API v2 implementation
2. **Forum Scraping:** Add GetEducated forum URL and implement scraping logic
3. **Advanced Sentiment:** Use NLP library for better sentiment analysis
4. **Deduplication:** Check for duplicate quotes before inserting
5. **Quote Quality Scoring:** Rank quotes by relevance, engagement, sentiment
6. **Caching:** Cache scraped quotes to reduce API calls

## Testing

```bash
# Local testing (requires Deno)
deno run --allow-net --allow-env supabase/functions/quote-scraper/index.ts

# Integration test
node scripts/test-quote-scraper.js
```

## Monitoring

Check quote scraping metrics:

```sql
-- View quote sourcing metrics
SELECT * FROM quote_sourcing_metrics;

-- Count quotes by source
SELECT source_type, COUNT(*)
FROM quote_sources
GROUP BY source_type;

-- Check sentiment distribution
SELECT sentiment, COUNT(*)
FROM quote_sources
WHERE keyword = 'online degrees'
GROUP BY sentiment;

-- Find highest-scored Reddit quotes
SELECT quote_text, reddit_score, reddit_subreddit
FROM quote_sources
WHERE source_type = 'reddit'
ORDER BY reddit_score DESC
LIMIT 10;
```

---

**Created:** 2025-11-11
**Status:** Implemented (Reddit complete, Twitter/Forum pending)
**Dependencies:** `quote_sources` table (Migration 1)
