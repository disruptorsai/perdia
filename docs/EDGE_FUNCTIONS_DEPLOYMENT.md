# Edge Functions Deployment Guide

Complete guide for deploying and configuring all Perdia Supabase Edge Functions.

## Overview

Perdia uses **5 Supabase Edge Functions** for backend operations:

1. **wordpress-publish** - Publish content to WordPress with images and retry logic
2. **keyword-research** - Batch keyword research using DataForSEO API
3. **sync-gsc-data** - Google Search Console data sync with ranking updates
4. **optimize-content-ai** - AI-powered content analysis and optimization
5. **auto-schedule-content** - Intelligent content scheduling

Plus existing functions:
- **invoke-llm** - AI invocation (Claude + OpenAI)
- **analyze-content** - Basic content analysis
- **publish-scheduled-content** - Publish scheduled items

## Prerequisites

1. **Supabase Project**: Active project with project ref `yvvtsfgryweqfppilkvo`
2. **Supabase CLI**: Installed and authenticated
3. **Environment Variables**: All required secrets configured
4. **External API Accounts**:
   - Anthropic API key (Claude)
   - OpenAI API key
   - DataForSEO account (for keyword research)
   - Google Cloud service account (for GSC sync)

## Step 1: Link to Supabase Project

```bash
# Navigate to project directory
cd C:\Users\Will\OneDrive\Documents\Projects\perdia

# Link to Supabase project
npx supabase link --project-ref yvvtsfgryweqfppilkvo
```

## Step 2: Configure Supabase Secrets

All Edge Functions require environment variables. Set them using Supabase secrets:

```bash
# AI Services (REQUIRED for invoke-llm, optimize-content-ai)
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key-here --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set OPENAI_API_KEY=sk-your-key-here --project-ref yvvtsfgryweqfppilkvo

# DataForSEO (REQUIRED for keyword-research)
npx supabase secrets set DATAFORSEO_LOGIN=your-email@example.com --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set DATAFORSEO_PASSWORD=your-password-here --project-ref yvvtsfgryweqfppilkvo

# Google Search Console (REQUIRED for sync-gsc-data)
npx supabase secrets set GSC_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour key here\n-----END PRIVATE KEY-----" --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set GSC_PROPERTY_URL=https://geteducated.com/ --project-ref yvvtsfgryweqfppilkvo

# Supabase Configuration (AUTO-SET by platform, verify only)
npx supabase secrets set SUPABASE_URL=https://yvvtsfgryweqfppilkvo.supabase.co --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set SUPABASE_ANON_KEY=your-anon-key --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key --project-ref yvvtsfgryweqfppilkvo
```

### Verify Secrets

```bash
# List all configured secrets
npx supabase secrets list --project-ref yvvtsfgryweqfppilkvo
```

Expected output:
```
ANTHROPIC_API_KEY
OPENAI_API_KEY
DATAFORSEO_LOGIN
DATAFORSEO_PASSWORD
GSC_CLIENT_EMAIL
GSC_PRIVATE_KEY
GSC_PROPERTY_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

## Step 3: Deploy Edge Functions

Deploy all functions in sequence:

```bash
# Deploy all functions
npx supabase functions deploy wordpress-publish --project-ref yvvtsfgryweqfppilkvo
npx supabase functions deploy keyword-research --project-ref yvvtsfgryweqfppilkvo
npx supabase functions deploy sync-gsc-data --project-ref yvvtsfgryweqfppilkvo
npx supabase functions deploy optimize-content-ai --project-ref yvvtsfgryweqfppilkvo
npx supabase functions deploy auto-schedule-content --project-ref yvvtsfgryweqfppilkvo
npx supabase functions deploy invoke-llm --project-ref yvvtsfgryweqfppilkvo

# Or deploy all at once (if supported)
npx supabase functions deploy --project-ref yvvtsfgryweqfppilkvo
```

### Verify Deployment

```bash
# List deployed functions
npx supabase functions list --project-ref yvvtsfgryweqfppilkvo
```

Expected output:
```
wordpress-publish (deployed)
keyword-research (deployed)
sync-gsc-data (deployed)
optimize-content-ai (deployed)
auto-schedule-content (deployed)
invoke-llm (deployed)
```

## Step 4: Test Edge Functions

Use the provided test scripts to verify each function:

```bash
# Test WordPress publishing
node scripts/test-wordpress-publish.js

# Test keyword research
node scripts/test-keyword-research.js

# Test GSC sync
node scripts/test-sync-gsc.js

# Test content optimization
node scripts/test-optimize-content.js

# Test auto scheduling
node scripts/test-auto-schedule.js
```

## Step 5: Configure Cron Jobs

Some functions should run automatically on a schedule.

### In Supabase Dashboard:

1. Go to **Database** > **Cron Jobs** (or use pg_cron extension)
2. Create the following cron jobs:

#### GSC Sync - Daily at 6am UTC

```sql
SELECT cron.schedule(
  'gsc-daily-sync',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/sync-gsc-data',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

#### Auto Schedule Content - Hourly

```sql
SELECT cron.schedule(
  'auto-schedule-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/auto-schedule-content',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

#### Publish Scheduled Content - Every 15 minutes

```sql
SELECT cron.schedule(
  'publish-scheduled-content',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/publish-scheduled-content',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

### Verify Cron Jobs

```sql
-- View all cron jobs
SELECT * FROM cron.job;

-- View cron job history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

## Step 6: Update Frontend Configuration

Ensure frontend environment variables are set:

### In Netlify Dashboard (or `.env.local` for development)

```bash
# Supabase
VITE_SUPABASE_URL=https://yvvtsfgryweqfppilkvo.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI Services
VITE_ANTHROPIC_API_KEY=sk-ant-your-key  # Optional for client-side
VITE_OPENAI_API_KEY=sk-your-key         # Optional for client-side

# Default AI Provider
VITE_DEFAULT_AI_PROVIDER=claude
```

## Architecture & Authentication

### Authentication Flow

All new Edge Functions use **JWT authentication**:

1. Frontend gets user session token from Supabase Auth
2. Token passed in `Authorization: Bearer <token>` header
3. Edge Function validates token via `authenticateRequest()`
4. User ID extracted for Row Level Security (RLS)

### Shared Modules

All functions use shared modules in `supabase/functions/_shared/`:

- **auth.ts** - JWT authentication & service role access
- **errors.ts** - Standardized error responses & CORS
- **database.ts** - Common database queries
- **logger.ts** - Structured logging

### Frontend Integration

Use the centralized Edge Function client:

```javascript
import { EdgeFunctions } from '@/lib/edge-function-client';

// Publish to WordPress
const result = await EdgeFunctions.publishToWordPress('content-id-123');

// Research keywords
const keywords = await EdgeFunctions.researchKeywords(['seo', 'marketing']);

// Sync GSC data
const gscData = await EdgeFunctions.syncGSCData({ days: 30 });

// Optimize content
const analysis = await EdgeFunctions.optimizeContent('content-id-123');

// Schedule content
const scheduled = await EdgeFunctions.scheduleContent();
```

Or use the Perdia SDK wrappers:

```javascript
import {
  PublishToWordPress,
  ResearchKeywords,
  SyncGSCData,
  OptimizeContent,
  ScheduleContent
} from '@/lib/perdia-sdk';

const result = await PublishToWordPress({ content_id: '123' });
```

## Troubleshooting

### Function Deployment Fails

```bash
# Check function logs
npx supabase functions logs <function-name> --project-ref yvvtsfgryweqfppilkvo

# Redeploy specific function
npx supabase functions deploy <function-name> --project-ref yvvtsfgryweqfppilkvo --no-verify-jwt
```

### Authentication Errors (401)

**Problem**: "Missing or invalid authorization header"

**Solution**:
1. Verify frontend is passing auth token in headers
2. Check `edge-function-client.js` is being used
3. Ensure user is authenticated before calling function

```javascript
// Check authentication
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // Redirect to login
}
```

### GSC Sync Fails

**Problem**: "GSC credentials not configured"

**Solution**:
1. Verify service account credentials are correct
2. Ensure service account email is added to Search Console property
3. Check private key format (should have `\n` for newlines)

```bash
# Test GSC credentials
curl -X POST https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/sync-gsc-data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{"days": 7}'
```

### DataForSEO API Errors

**Problem**: "DataForSEO credentials not configured"

**Solution**:
1. Verify DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD secrets
2. Check DataForSEO account has API credits
3. Test API credentials:

```bash
curl -u "your-email:your-password" \
  https://api.dataforseo.com/v3/keywords_data/google/search_volume/live
```

### CORS Errors

**Problem**: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution**: All functions include CORS headers. If errors persist:
1. Check `_shared/errors.ts` exports `corsHeaders`
2. Verify function includes OPTIONS handler
3. Clear browser cache

## Monitoring & Logs

### View Function Logs

```bash
# Real-time logs for specific function
npx supabase functions logs wordpress-publish --project-ref yvvtsfgryweqfppilkvo

# All functions
npx supabase functions logs --project-ref yvvtsfgryweqfppilkvo
```

### Monitor Cron Jobs

```sql
-- Check recent cron job runs
SELECT
  job_id,
  job_name,
  status,
  start_time,
  end_time,
  EXTRACT(EPOCH FROM (end_time - start_time)) as duration_seconds
FROM cron.job_run_details
WHERE start_time > NOW() - INTERVAL '24 hours'
ORDER BY start_time DESC;
```

### Performance Metrics

Monitor Edge Function performance in Supabase Dashboard:
- **Functions** > Select function > **Metrics**
- View invocation count, error rate, execution time

## Security Best Practices

1. **Never expose service role key** in frontend code
2. **Use RLS policies** for all database operations
3. **Validate all inputs** in Edge Functions
4. **Rate limit** expensive operations (keyword research, AI calls)
5. **Rotate API keys** regularly
6. **Monitor logs** for suspicious activity

## Cost Optimization

### Edge Function Pricing

- **Free tier**: 500K invocations/month, 400s timeout
- **Pro tier**: Unlimited invocations, 400s timeout

### AI API Costs

- **Claude Sonnet 4.5**: $3/1M input tokens, $15/1M output tokens
- **OpenAI GPT-4o**: $2.50/1M input tokens, $10/1M output tokens
- Use **prompt caching** to reduce costs by 90%

### DataForSEO Costs

- **Search Volume**: $0.0025 per keyword
- **Keyword Suggestions**: $0.005 per request
- Batch requests to minimize API calls

## Next Steps

1. ✅ Deploy all Edge Functions
2. ✅ Configure secrets
3. ✅ Set up cron jobs
4. ✅ Test each function
5. ✅ Update frontend to use new functions
6. 📊 Monitor performance and costs
7. 🔧 Optimize based on usage patterns

## Support

- **Supabase Docs**: https://supabase.com/docs/guides/functions
- **Edge Functions Guide**: https://supabase.com/docs/guides/functions/deploy
- **Perdia Issues**: Check project README for support contacts

---

**Last Updated**: 2025-11-07
**Version**: 1.0.0
**Status**: ✅ Production Ready
