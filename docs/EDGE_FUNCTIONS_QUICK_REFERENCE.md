# Edge Functions Quick Reference

Quick reference for using Perdia's Supabase Edge Functions in your application.

## Frontend Usage

### Import Methods

```javascript
// Method 1: Use Edge Function Client (recommended)
import { EdgeFunctions } from '@/lib/edge-function-client';

// Method 2: Use Perdia SDK Wrappers
import {
  PublishToWordPress,
  ResearchKeywords,
  SyncGSCData,
  OptimizeContent,
  ScheduleContent
} from '@/lib/perdia-sdk';
```

## Function Reference

### 1. WordPress Publishing

**Publish content to WordPress with images, categories, and retry logic.**

```javascript
// Using Edge Functions
const result = await EdgeFunctions.publishToWordPress('content-id-123', {
  publish_status: 'publish', // or 'draft'
  wordpress_site_id: 'site-id', // optional
});

// Using SDK
const result = await PublishToWordPress({
  content_id: 'content-id-123',
  publish_status: 'publish',
});

// Response
{
  success: true,
  data: {
    wordpress_post_id: 456,
    wordpress_url: 'https://example.com/post-url',
    content_id: 'content-id-123'
  },
  message: 'Content published to WordPress successfully'
}
```

**Features:**
- Automatic image upload to WordPress Media Library
- Category and tag mapping from metadata
- Exponential backoff retry (3 attempts)
- Yoast SEO meta data integration

---

### 2. Keyword Research

**Batch keyword research using DataForSEO API.**

```javascript
// Using Edge Functions
const result = await EdgeFunctions.researchKeywords(['online education', 'elearning'], {
  location: 2840, // US
  language: 'en',
  include_suggestions: true,
});

// Using SDK
const result = await ResearchKeywords({
  keywords: ['online education', 'elearning'],
  include_suggestions: true,
});

// Response
{
  success: true,
  data: {
    keywords: [
      {
        keyword: 'online education',
        search_volume: 8100,
        difficulty: 67,
        competition: 0.82,
        cpc: 3.45,
        priority: 121,
        trend: [7500, 7900, 8100, ...]
      }
    ],
    suggestions: ['online learning', 'distance education', ...],
    summary: {
      total_keywords: 2,
      avg_search_volume: 6450,
      high_priority_count: 1
    }
  }
}
```

**Features:**
- Up to 100 keywords per request
- Search volume, difficulty, competition metrics
- Keyword suggestions
- Priority score calculation
- Automatic database upsert

---

### 3. Google Search Console Sync

**Sync GSC performance data and update keyword rankings.**

```javascript
// Using Edge Functions
const result = await EdgeFunctions.syncGSCData({
  days: 30, // default
  property_url: 'https://example.com', // optional
});

// Using SDK
const result = await SyncGSCData({
  days: 30,
});

// Response
{
  success: true,
  data: {
    stats: {
      total_rows: 15234,
      metrics_upserted: 15234,
      rankings_updated: 542,
      opportunities_found: 23
    },
    opportunities: [
      {
        keyword: 'online courses',
        impressions: 8500,
        ctr: 0.032,
        position: 12.3,
        potential_clicks: 425
      }
    ]
  }
}
```

**Features:**
- Fetches last 30 days of GSC data
- Bulk upsert to performance_metrics table
- Updates keyword.current_ranking
- Identifies ranking opportunities
- Calculates potential traffic gains

---

### 4. AI Content Optimization

**AI-powered content analysis and optimization.**

```javascript
// Using Edge Functions
const result = await EdgeFunctions.optimizeContent('content-id-123', {
  analysis_type: 'full', // 'full' | 'quick' | 'seo'
  include_rewrite: false,
  target_keywords: ['online education'],
});

// Using SDK
const result = await OptimizeContent({
  content_id: 'content-id-123',
  analysis_type: 'full',
  include_rewrite: true, // Generate rewritten sections
});

// Response
{
  success: true,
  data: {
    content_id: 'content-id-123',
    analysis: {
      readability_score: 78,
      seo_score: 85,
      word_count: 1850,
      keyword_density: {
        'online education': 0.027,
        'elearning': 0.015
      },
      recommendations: [
        {
          category: 'seo',
          severity: 'medium',
          issue: 'H2 headings missing target keywords',
          suggestion: 'Add "online education" to at least 2 H2 headings'
        }
      ],
      meta_optimization: {
        title: 'Best Online Education Platforms 2025 - Complete Guide',
        description: 'Discover the top online education platforms...',
        improvements: ['Added year for freshness', 'Included power word "Complete"']
      },
      rewrites: {
        introduction: '...',
        meta_description: '...'
      }
    }
  }
}
```

**Features:**
- Readability & SEO scoring
- Keyword density analysis
- Actionable recommendations
- Meta tag optimization
- Optional AI rewrites
- Stores analysis in database

---

### 5. Auto Schedule Content

**Intelligent content scheduling based on automation settings.**

```javascript
// Using Edge Functions
const result = await EdgeFunctions.scheduleContent({
  articles_limit: 5, // override user's articles_per_day
  publish_immediately: false,
});

// Using SDK
const result = await ScheduleContent({
  articles_limit: 3,
});

// Response
{
  success: true,
  data: {
    scheduled_count: 3,
    scheduled_items: [
      {
        content_id: 'abc-123',
        title: 'Best Online Courses 2025',
        scheduled_date: '2025-11-08T09:00:00Z',
        priority: 85
      },
      {
        content_id: 'def-456',
        title: 'Top Learning Platforms',
        scheduled_date: '2025-11-08T13:00:00Z',
        priority: 78
      }
    ],
    daily_remaining: 2,
    next_schedule_date: '2025-11-09T09:00:00Z'
  }
}
```

**Features:**
- Reads user automation_settings
- Respects daily/weekly limits
- Spreads publish times evenly (9am-5pm)
- Prioritizes by keyword score
- Optional immediate WordPress publish
- Skips weekends (optional)

---

## Error Handling

All functions return standardized error responses:

```javascript
{
  success: false,
  error: 'VALIDATION_ERROR',
  message: 'Missing required fields: content_id',
  code: 'VALIDATION_ERROR'
}
```

**Error Codes:**
- `UNAUTHORIZED` (401) - Missing/invalid auth token
- `FORBIDDEN` (403) - Permission denied
- `NOT_FOUND` (404) - Resource not found
- `BAD_REQUEST` (400) - Invalid request
- `VALIDATION_ERROR` (422) - Field validation failed
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_SERVER_ERROR` (500) - Server error
- `DATABASE_ERROR` (500) - Database operation failed
- `EXTERNAL_API_ERROR` (502) - External API failed

**Handle errors:**

```javascript
try {
  const result = await EdgeFunctions.publishToWordPress('content-id');
  console.log('Success:', result);
} catch (error) {
  console.error('Error:', error.message);

  // Check error type
  if (error.message.includes('UNAUTHORIZED')) {
    // Redirect to login
  } else if (error.message.includes('NOT_FOUND')) {
    // Show "content not found" message
  } else {
    // Show generic error
  }
}
```

---

## Advanced Usage

### Retry Failed Requests

```javascript
import { retryEdgeFunction } from '@/lib/edge-function-client';

const result = await retryEdgeFunction('wordpress-publish', {
  content_id: 'abc-123',
}, {
  maxRetries: 5,
  initialDelay: 2000, // 2 seconds
});
```

### Parallel Function Calls

```javascript
import { callEdgeFunctionsParallel } from '@/lib/edge-function-client';

const results = await callEdgeFunctionsParallel([
  { functionName: 'keyword-research', payload: { keywords: ['seo'] } },
  { functionName: 'sync-gsc-data', payload: { days: 7 } },
  { functionName: 'auto-schedule-content', payload: {} },
]);

console.log('All completed:', results);
```

### Custom Error Handling

```javascript
import { callEdgeFunction } from '@/lib/edge-function-client';

try {
  const result = await callEdgeFunction('wordpress-publish', {
    content_id: 'abc-123',
  });
} catch (error) {
  if (error.message.includes('Network error')) {
    // Handle network issues
    toast.error('Connection failed. Please check your internet.');
  } else {
    // Handle other errors
    toast.error(`Publishing failed: ${error.message}`);
  }
}
```

---

## React Component Examples

### WordPress Publish Button

```javascript
import { useState } from 'react';
import { PublishToWordPress } from '@/lib/perdia-sdk';
import { toast } from 'sonner';

function PublishButton({ contentId }) {
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    setPublishing(true);

    try {
      const result = await PublishToWordPress({
        content_id: contentId,
        publish_status: 'publish',
      });

      toast.success(`Published! View at: ${result.data.wordpress_url}`);
    } catch (error) {
      toast.error(`Publishing failed: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <button onClick={handlePublish} disabled={publishing}>
      {publishing ? 'Publishing...' : 'Publish to WordPress'}
    </button>
  );
}
```

### Keyword Research Form

```javascript
import { useState } from 'react';
import { ResearchKeywords } from '@/lib/perdia-sdk';

function KeywordResearchForm() {
  const [keywords, setKeywords] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const keywordArray = keywords.split(',').map(k => k.trim());
      const data = await ResearchKeywords({
        keywords: keywordArray,
        include_suggestions: true,
      });

      setResults(data.data);
    } catch (error) {
      toast.error(`Research failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
        placeholder="Enter keywords (comma-separated)"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Researching...' : 'Research Keywords'}
      </button>

      {results && (
        <div>
          <h3>Results: {results.summary.total_keywords} keywords</h3>
          {results.keywords.map(kw => (
            <div key={kw.keyword}>
              <strong>{kw.keyword}</strong>
              <p>Volume: {kw.search_volume} | Difficulty: {kw.difficulty}</p>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
```

---

## Testing Functions

Use the test script to verify all functions are working:

```bash
# Test all functions
node scripts/test-all-functions.js

# Test specific function via curl
curl -X POST https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/keyword-research \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"keywords": ["test"]}'
```

---

## Performance Tips

1. **Batch operations** - Research multiple keywords at once (max 100)
2. **Cache results** - Store keyword data, don't re-fetch unnecessarily
3. **Schedule syncs** - Use cron jobs for GSC sync instead of manual calls
4. **Optimize AI** - Use 'quick' analysis type for faster results
5. **Monitor costs** - Track API usage via DataForSEO and Anthropic dashboards

---

**Last Updated**: 2025-11-07
**Related Docs**: `EDGE_FUNCTIONS_DEPLOYMENT.md`, `CLAUDE.md`
