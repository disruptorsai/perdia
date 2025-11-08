# Google Search Console Setup Guide

Complete guide for setting up Google Search Console integration with Perdia.

## Prerequisites

- Google Cloud Platform account
- Access to Google Search Console for your website
- Supabase CLI installed

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Create Project**
3. Name it: `perdia-gsc-integration`
4. Click **Create**

## Step 2: Enable Search Console API

1. In your project, go to **APIs & Services** > **Library**
2. Search for "Google Search Console API"
3. Click on it and click **Enable**

## Step 3: Create Service Account

1. Go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Fill in details:
   - **Name**: `perdia-gsc-reader`
   - **Description**: `Read-only access to Google Search Console data`
4. Click **Create and Continue**
5. **Skip** the optional permissions sections
6. Click **Done**

## Step 4: Generate Service Account Key

1. Click on your newly created service account
2. Go to **Keys** tab
3. Click **Add Key** > **Create new key**
4. Choose **JSON** format
5. Click **Create**
6. **Save the downloaded JSON file securely** (you'll need it)

The JSON file looks like this:
```json
{
  "type": "service_account",
  "project_id": "perdia-gsc-integration",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "perdia-gsc-reader@perdia-gsc-integration.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

## Step 5: Add Service Account to Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your property (e.g., `https://geteducated.com`)
3. Click **Settings** (gear icon)
4. Click **Users and permissions**
5. Click **Add user**
6. Enter the **client_email** from your JSON file (e.g., `perdia-gsc-reader@...iam.gserviceaccount.com`)
7. Set permission to **Full** or **Restricted**
8. Click **Add**

## Step 6: Configure Supabase Secrets

From your downloaded JSON file, extract:
- `client_email`
- `private_key`

Set them as Supabase secrets:

```bash
# Set the client email
npx supabase secrets set GSC_CLIENT_EMAIL="perdia-gsc-reader@perdia-gsc-integration.iam.gserviceaccount.com" --project-ref yvvtsfgryweqfppilkvo

# Set the private key (keep the quotes and newlines)
npx supabase secrets set GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----" --project-ref yvvtsfgryweqfppilkvo

# Set your GSC property URL
npx supabase secrets set GSC_PROPERTY_URL="https://geteducated.com/" --project-ref yvvtsfgryweqfppilkvo
```

**Important Notes:**
- The `private_key` must include the full key with `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep the `\n` characters in the private key (they represent newlines)
- Use double quotes around the entire key

## Step 7: Verify Configuration

Check that all secrets are set:

```bash
npx supabase secrets list --project-ref yvvtsfgryweqfppilkvo
```

You should see:
- ✅ `GSC_CLIENT_EMAIL`
- ✅ `GSC_PRIVATE_KEY`
- ✅ `GSC_PROPERTY_URL`

## Step 8: Test GSC Sync

Test the Edge Function manually:

```bash
# Using Supabase CLI
npx supabase functions invoke sync-gsc-data --project-ref yvvtsfgryweqfppilkvo

# Or via browser console
const { data, error } = await supabase.functions.invoke('sync-gsc-data', {
  body: {
    days: 7  // Fetch last 7 days for testing
  }
});
console.log('GSC Sync Result:', data);
```

## Step 9: Enable Automated Daily Sync

Once testing is successful, enable the daily cron job:

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql
2. Run this SQL:

```sql
-- Enable daily GSC sync at 6am UTC
SELECT cron.schedule(
  'sync-gsc-data-daily',
  '0 6 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/sync-gsc-data',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{"days": 30}'::jsonb
    ) AS request_id;
  $$
);
```

## Step 10: Monitor Sync Jobs

View cron job execution history:

```sql
-- See all scheduled jobs
SELECT * FROM cron.job;

-- See recent execution history
SELECT
  job_name,
  status,
  start_time,
  end_time,
  EXTRACT(EPOCH FROM (end_time - start_time)) as duration_seconds
FROM cron.job_run_details
WHERE job_name = 'sync-gsc-data-daily'
ORDER BY start_time DESC
LIMIT 10;
```

## Troubleshooting

### Error: "GSC credentials not configured"
- Check that all 3 secrets are set (CLIENT_EMAIL, PRIVATE_KEY, PROPERTY_URL)
- Verify the private key includes BEGIN/END markers

### Error: "Permission denied"
- Make sure the service account email is added to Search Console
- Check the permission level is at least "Restricted"

### Error: "Invalid credentials"
- Verify the JSON key file is correct
- Make sure the private key has `\n` characters preserved
- Check project has Search Console API enabled

### Error: "Property not found"
- Verify the PROPERTY_URL matches exactly what's in Search Console
- Include protocol (https://) and trailing slash

### No data returned
- Check that your website has data in Search Console
- Try a longer date range (90 days instead of 30)
- Verify the property URL is correct

## What Gets Synced

The GSC sync function fetches:
- **Query data**: Keywords people searched for
- **Click data**: How many clicks each query got
- **Impressions**: How many times your site appeared
- **CTR**: Click-through rate
- **Position**: Average ranking position
- **Page URLs**: Which pages ranked

This data updates:
- `performance_metrics` table (raw GSC data)
- `keywords.current_ranking` (average positions)
- Ranking opportunities (high impressions + low CTR)

## Next Steps

Once GSC sync is working:
1. ✅ Monitor daily sync via `cron.job_run_details`
2. ✅ Review ranking opportunities in dashboard
3. ✅ Track keyword ranking improvements over time
4. ✅ Identify content optimization opportunities

---

**Need Help?**
- [Google Search Console API Docs](https://developers.google.com/webmaster-tools/search-console-api-original)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- Check function logs: `npx supabase functions logs sync-gsc-data --project-ref yvvtsfgryweqfppilkvo`
