# Automation Functions Setup Guide

This guide provides complete setup instructions for all Perdia automation functions including Supabase Edge Functions, Netlify Edge Functions, and Netlify Serverless Functions.

## Overview

Perdia uses 7 automation functions to handle content publishing, monitoring, and optimization:

### Supabase Edge Functions (4)
1. **Scheduled Content Publisher** - Publishes approved content at scheduled time
2. **WordPress Auto-Publisher** - Posts content to WordPress automatically
3. **Content Analyzer** - Analyzes content for SEO metrics
4. **GSC Data Sync** - Syncs Google Search Console performance data

### Netlify Edge Functions (2)
5. **Rate Limiter** - Protects AI API from abuse
6. **Image Optimizer** - Optimizes images before upload (placeholder)

### Netlify Serverless Functions (1)
7. **WordPress Webhook Handler** - Receives callbacks from WordPress

---

## 1. Scheduled Content Publisher

**Location:** `supabase/functions/publish-scheduled-content/index.ts`

**Purpose:** Automatically publishes content that has reached its scheduled_publish_date

**Trigger:** Supabase Cron (runs hourly)

### Setup Steps

#### 1.1 Deploy the Function

```bash
# Navigate to project directory
cd C:\Users\Will\OneDrive\Documents\Projects\perdia

# Deploy to Supabase
supabase functions deploy publish-scheduled-content
```

#### 1.2 Configure Cron Job

1. Go to Supabase Dashboard → Database → Cron Jobs
2. Click "Create a new cron job"
3. Configure:
   - **Name:** `publish-scheduled-content`
   - **Schedule:** `0 * * * *` (every hour)
   - **Command:**
   ```sql
   SELECT net.http_post(
     url => 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/publish-scheduled-content',
     headers => jsonb_build_object(
       'Content-Type', 'application/json',
       'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
     ),
     body => '{}'::jsonb
   );
   ```

#### 1.3 Verify Setup

Test manually:
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/publish-scheduled-content \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

---

## 2. WordPress Auto-Publisher

**Location:** `supabase/functions/wordpress-publish/index.ts`

**Purpose:** Automatically posts approved content to WordPress

**Trigger:** Database trigger when content_queue status changes to 'published'

### Setup Steps

#### 2.1 Deploy the Function

```bash
supabase functions deploy wordpress-publish
```

#### 2.2 Create WordPress Connection

In the Perdia app:
1. Go to Settings → WordPress Connections
2. Add your WordPress site:
   - **Site Name:** Your site name
   - **Site URL:** `https://geteducated.com`
   - **Username:** Your WordPress username
   - **App Password:** Generate from WordPress (Users → Profile → Application Passwords)

#### 2.3 Create Database Trigger

Execute this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Function to trigger WordPress publishing
CREATE OR REPLACE FUNCTION trigger_wordpress_publish()
RETURNS trigger AS $$
BEGIN
  -- Only trigger when status changes to 'published'
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    -- Don't trigger if already published to WordPress
    IF NEW.wordpress_post_id IS NULL THEN
      PERFORM net.http_post(
        url => 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/wordpress-publish',
        headers => jsonb_build_object(
          'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
          'Content-Type', 'application/json'
        ),
        body => jsonb_build_object('content_id', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to content_queue table
CREATE TRIGGER auto_wordpress_publish
  AFTER INSERT OR UPDATE ON content_queue
  FOR EACH ROW
  EXECUTE FUNCTION trigger_wordpress_publish();
```

#### 2.4 Verify Setup

1. Create test content in Perdia
2. Set status to 'published'
3. Check that wordpress_post_id and wordpress_url are populated
4. Verify post appears in WordPress admin

---

## 3. Content Analyzer

**Location:** `supabase/functions/analyze-content/index.ts`

**Purpose:** Analyzes content for SEO metrics (readability, keyword density, SEO score)

**Trigger:** Manual invocation or database trigger

### Setup Steps

#### 3.1 Deploy the Function

```bash
supabase functions deploy analyze-content
```

#### 3.2 (Optional) Create Auto-Analysis Trigger

To automatically analyze new content:

```sql
-- Function to trigger content analysis
CREATE OR REPLACE FUNCTION trigger_content_analysis()
RETURNS trigger AS $$
BEGIN
  -- Analyze when content is created or updated with new content
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.content != OLD.content))
     AND NEW.status = 'draft'
     AND NEW.content IS NOT NULL
     AND LENGTH(NEW.content) > 100 THEN

    PERFORM net.http_post(
      url => 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/analyze-content',
      headers => jsonb_build_object(
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
        'Content-Type', 'application/json'
      ),
      body => jsonb_build_object('content_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
CREATE TRIGGER auto_content_analysis
  AFTER INSERT OR UPDATE ON content_queue
  FOR EACH ROW
  EXECUTE FUNCTION trigger_content_analysis();
```

#### 3.3 Manual Usage

Call from UI or API:
```javascript
const response = await fetch('https://YOUR_PROJECT_REF.supabase.co/functions/v1/analyze-content', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ content_id: 'uuid-here' })
});

const analysis = await response.json();
console.log('SEO Score:', analysis.analysis.seo_score);
console.log('Recommendations:', analysis.analysis.recommendations);
```

---

## 4. GSC Data Sync

**Location:** `supabase/functions/sync-gsc-data/index.ts`

**Purpose:** Syncs Google Search Console performance data daily

**Trigger:** Supabase Cron (runs daily at 6am UTC)

### Setup Steps

#### 4.1 Create Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable **Google Search Console API**
4. Go to **IAM & Admin → Service Accounts**
5. Click **Create Service Account**:
   - Name: `perdia-gsc-sync`
   - Role: None needed
6. Create key → JSON → Download
7. Open JSON file and copy:
   - `client_email`
   - `private_key`

#### 4.2 Add Service Account to Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your property (e.g., geteducated.com)
3. Settings → Users and permissions
4. Add user: Paste the `client_email` from service account JSON
5. Permission level: **Owner**

#### 4.3 Set Environment Variables

In Supabase Dashboard → Project Settings → Edge Functions → Manage secrets:

```bash
# Service account credentials
GSC_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"

# Your Search Console property URL
GSC_PROPERTY_URL=https://geteducated.com/
```

#### 4.4 Deploy the Function

```bash
supabase functions deploy sync-gsc-data
```

#### 4.5 Configure Cron Job

Create cron job in Supabase Dashboard (runs daily at 6am UTC):

```sql
SELECT net.http_post(
  url => 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-gsc-data',
  headers => jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
  ),
  body => '{}'::jsonb
);
```

Schedule: `0 6 * * *`

#### 4.6 Test Manually

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-gsc-data \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

---

## 5. Rate Limiter

**Location:** `netlify/edge-functions/rate-limit.ts`

**Purpose:** Protects AI API from abuse and controls costs

**Applies to:** `/.netlify/functions/invoke-llm`

### Setup Steps

#### 5.1 Deploy Automatically with Site

Rate limiter deploys automatically when you push to Netlify. It's configured in `netlify.toml`:

```toml
[[edge_functions]]
  function = "rate-limit"
  path = "/.netlify/functions/invoke-llm"
```

#### 5.2 Configure Rate Limits (Optional)

Edit `netlify/edge-functions/rate-limit.ts` to adjust limits:

```typescript
const LIMITS = {
  perMinute: 20,   // Requests per minute
  perHour: 100,    // Requests per hour
  perDay: 500,     // Requests per day (not currently enforced)
};
```

#### 5.3 Verify Setup

After deployment, test rate limiting:

```bash
# Should work
curl -X POST https://your-site.netlify.app/.netlify/functions/invoke-llm \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "provider": "claude"}'

# After 20+ requests in a minute, should return 429
# Response: {"error": "Rate limit exceeded", "message": "Too many requests..."}
```

Check response headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Timestamp when limit resets

---

## 6. Image Optimizer

**Location:** `netlify/edge-functions/optimize-images.ts`

**Purpose:** Image optimization before upload (currently placeholder)

**Status:** Placeholder implementation - recommends using Cloudinary or Netlify Background Function

### Current Implementation

The function currently returns a message recommending external image optimization:

```json
{
  "message": "Image optimization skipped - use Cloudinary integration for full optimization",
  "original_size": 1234567,
  "file_name": "image.jpg"
}
```

### Production Options

Choose one of these approaches:

#### Option A: Use Cloudinary (Recommended)

Environment variables already configured in `.env.example`:
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_API_KEY`
- `VITE_CLOUDINARY_API_SECRET`

Upload directly to Cloudinary from client, get optimized URLs automatically.

#### Option B: Netlify Background Function with Sharp

Create `netlify/functions/optimize-image.js`:

```javascript
const sharp = require('sharp');

exports.handler = async (event) => {
  const image = Buffer.from(event.body, 'base64');

  const optimized = await sharp(image)
    .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  // Upload to Supabase Storage
  return {
    statusCode: 200,
    body: JSON.stringify({ optimized_size: optimized.length })
  };
};
```

#### Option C: Supabase Storage Transformations

Use URL parameters for on-the-fly optimization:
```
https://project.supabase.co/storage/v1/object/public/bucket/image.jpg?width=800&quality=85
```

### Setup (if implementing)

No setup required for placeholder. For production implementation, follow one of the options above.

---

## 7. WordPress Webhook Handler

**Location:** `netlify/functions/wordpress-webhook.js`

**Purpose:** Receives callbacks from WordPress after content is published

**Endpoint:** `/.netlify/functions/wordpress-webhook`

### Setup Steps

#### 7.1 Deploy with Netlify

Function deploys automatically with your site.

#### 7.2 Set Webhook Secret (Recommended)

In Netlify Dashboard → Site settings → Environment variables:

```bash
WORDPRESS_WEBHOOK_SECRET=your-random-secret-key-here
```

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 7.3 Install WordPress Webhook Plugin

Choose one:

**Option A: WP Webhooks (Recommended)**
1. Install from [wordpress.org/plugins/wp-webhooks](https://wordpress.org/plugins/wp-webhooks/)
2. Go to WP Webhooks → Send Data
3. Add webhook:
   - **Trigger:** `post_published`
   - **URL:** `https://your-perdia-site.netlify.app/.netlify/functions/wordpress-webhook`
   - **Payload:**
   ```json
   {
     "post_id": "{post_id}",
     "post_url": "{post_url}",
     "post_title": "{post_title}",
     "status": "{post_status}",
     "secret": "your-random-secret-key-here"
   }
   ```

**Option B: WPGetAPI**
1. Install WPGetAPI plugin
2. Configure similar webhook setup

#### 7.4 WordPress Plugin Code (Alternative)

Add to your theme's `functions.php`:

```php
<?php
add_action('publish_post', 'perdia_webhook_on_publish', 10, 2);

function perdia_webhook_on_publish($ID, $post) {
    $webhook_url = 'https://your-perdia-site.netlify.app/.netlify/functions/wordpress-webhook';
    $secret = 'your-random-secret-key-here';

    $data = array(
        'post_id' => $ID,
        'post_url' => get_permalink($ID),
        'post_title' => get_the_title($ID),
        'status' => 'publish',
        'secret' => $secret
    );

    wp_remote_post($webhook_url, array(
        'method' => 'POST',
        'headers' => array(
            'Content-Type' => 'application/json',
            'X-Webhook-Secret' => $secret
        ),
        'body' => json_encode($data)
    ));
}
```

#### 7.5 Test the Webhook

1. Publish a test post in WordPress
2. Check Netlify function logs:
   ```
   [WordPress Webhook] Received: Post ID 123, URL: https://...
   [WordPress Webhook] Updated content_queue: uuid -> WP Post 123
   ```
3. Verify content_queue table has updated wordpress_post_id and wordpress_url

---

## Testing Checklist

### Pre-Deployment Tests

- [ ] All Supabase Edge Functions deploy without errors
- [ ] Environment variables are set in Supabase secrets
- [ ] Netlify Edge Functions included in `netlify.toml`
- [ ] Netlify environment variables configured

### Post-Deployment Tests

#### Scheduled Content Publisher
- [ ] Cron job is scheduled and running
- [ ] Manual test publishes scheduled content
- [ ] Check function logs for errors

#### WordPress Auto-Publisher
- [ ] WordPress connection configured in Perdia
- [ ] Database trigger created
- [ ] Test content publishes to WordPress
- [ ] wordpress_post_id and wordpress_url update correctly

#### Content Analyzer
- [ ] Manual analysis returns valid SEO metrics
- [ ] Auto-analysis trigger works (if configured)
- [ ] Recommendations are actionable

#### GSC Data Sync
- [ ] Service account has Search Console access
- [ ] Manual sync retrieves data
- [ ] performance_metrics table populates
- [ ] Daily cron job runs successfully

#### Rate Limiter
- [ ] 20+ requests/minute returns 429
- [ ] Rate limit headers present
- [ ] IP/user identification works

#### WordPress Webhook
- [ ] Webhook receives POST from WordPress
- [ ] Secret validation works
- [ ] content_queue updates correctly
- [ ] Function logs show successful updates

---

## Troubleshooting

### Supabase Functions

**Error: "Failed to deploy function"**
- Check function syntax: `deno check function-name/index.ts`
- Verify imports are using Deno-compatible URLs
- Check Supabase CLI version: `supabase --version`

**Error: "CORS error"**
- Ensure `corsHeaders` are set in response
- Handle OPTIONS preflight requests

**Error: "Supabase credentials not configured"**
- Verify environment variables in Supabase Dashboard
- Check variable names match code (no typos)

### Netlify Functions

**Error: "Function not found"**
- Check `netlify.toml` configuration
- Verify function path matches deployment
- Check Netlify function logs

**Error: "Rate limit not working"**
- Verify edge function is deployed to correct path
- Check `netlify.toml` edge function configuration
- Test with curl to see rate limit headers

### WordPress Integration

**Error: "WordPress API authentication failed"**
- Verify application password is correct
- Check username is correct (not email)
- Ensure WordPress REST API is enabled

**Error: "Webhook not received"**
- Check webhook URL is correct
- Verify webhook plugin is active
- Check WordPress error logs
- Test webhook with curl

### Google Search Console

**Error: "Service account not authorized"**
- Verify service account email added to Search Console
- Check permission level is "Owner"
- Ensure correct property URL

**Error: "Invalid JWT signature"**
- Check private key includes full text with `\n` escapes
- Verify client_email matches service account
- Regenerate service account key if needed

---

## Monitoring and Maintenance

### View Function Logs

**Supabase:**
```bash
supabase functions logs publish-scheduled-content
supabase functions logs wordpress-publish
supabase functions logs analyze-content
supabase functions logs sync-gsc-data
```

Or in Supabase Dashboard → Edge Functions → Select function → Logs

**Netlify:**
- Dashboard → Functions → Select function → Function log
- Real-time logs: `netlify functions:log`

### Monitor Performance

**Key Metrics to Track:**
- Function invocation count
- Error rate
- Execution time
- Rate limit hit frequency
- WordPress publish success rate
- GSC sync data volume

### Maintenance Schedule

**Daily:**
- Check GSC sync completed successfully
- Monitor rate limit hits

**Weekly:**
- Review function error logs
- Verify WordPress publishing working
- Check content analysis quality

**Monthly:**
- Review and adjust rate limits if needed
- Update WordPress app passwords if expiring
- Check Google service account key expiration

---

## Environment Variables Summary

### Supabase Secrets

Required for Edge Functions:

```bash
# Supabase (auto-configured)
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY

# Google Search Console (for sync-gsc-data)
GSC_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GSC_PROPERTY_URL=https://geteducated.com/
```

### Netlify Environment Variables

Required for Functions and Edge Functions:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# WordPress Webhook (optional but recommended)
WORDPRESS_WEBHOOK_SECRET=your-random-secret-key

# AI Services (already configured)
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_OPENAI_API_KEY=sk-...
```

---

## Cost Estimates

### Supabase Edge Functions

**Free Tier:** 500K invocations/month, 200 hours execution time

**Expected Usage:**
- Scheduled Publisher: ~720/month (hourly)
- WordPress Publisher: ~100-500/month (per published article)
- Content Analyzer: ~100-500/month (per article)
- GSC Sync: ~30/month (daily)

**Total:** ~1,000-2,000 invocations/month (well within free tier)

### Netlify Functions

**Free Tier:** 125K invocations/month, 100 hours execution time

**Expected Usage:**
- Rate Limiter: Runs on every AI API call (10K-50K/month)
- Image Optimizer: Currently minimal (placeholder)
- WordPress Webhook: ~100-500/month

**Total:** 10K-50K invocations/month (within free tier)

### External APIs

**Anthropic Claude:** Pay per token (~$3-15/1M tokens depending on model)
**OpenAI:** Pay per token (~$2.50-15/1M tokens depending on model)
**Google Search Console API:** Free (no quota limits for Search Console API)

---

## Security Best Practices

1. **Always use webhook secrets** for WordPress webhook handler
2. **Never expose service role keys** in client-side code
3. **Use RLS policies** to restrict database access
4. **Rotate API keys** regularly (quarterly recommended)
5. **Monitor rate limit hits** for potential abuse
6. **Use HTTPS only** for all webhook endpoints
7. **Validate all webhook payloads** before processing
8. **Log security events** (authentication failures, rate limit exceeded)

---

## Support and Resources

**Supabase Edge Functions:**
- [Documentation](https://supabase.com/docs/guides/functions)
- [Examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions)

**Netlify Functions:**
- [Documentation](https://docs.netlify.com/functions/overview/)
- [Edge Functions](https://docs.netlify.com/edge-functions/overview/)

**WordPress REST API:**
- [Documentation](https://developer.wordpress.org/rest-api/)
- [Authentication](https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/)

**Google Search Console API:**
- [Documentation](https://developers.google.com/webmaster-tools/v1/how-tos/search-analytics)
- [Service Account Setup](https://cloud.google.com/iam/docs/service-accounts)

---

**Last Updated:** 2025-01-06
**Version:** 1.0.0
**Status:** Production Ready
