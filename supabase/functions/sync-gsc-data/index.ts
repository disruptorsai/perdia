/**
 * Supabase Edge Function: Google Search Console Data Sync
 *
 * PURPOSE: Automatically syncs performance metrics from Google Search Console
 *
 * TRIGGER: Supabase Cron (runs daily at 6am)
 *
 * WHAT IT DOES:
 * 1. Authenticates with Google Search Console API
 * 2. Fetches last 30 days of performance data (clicks, impressions, CTR, position)
 * 3. Syncs data to performance_metrics table
 * 4. Updates keyword rankings
 *
 * SETUP REQUIRED:
 * 1. Create Google Cloud Project: https://console.cloud.google.com/
 * 2. Enable Search Console API
 * 3. Create Service Account and download JSON credentials
 * 4. Add service account email to Search Console property
 * 5. Set environment variables:
 *    - GSC_CLIENT_EMAIL (from service account JSON)
 *    - GSC_PRIVATE_KEY (from service account JSON)
 *    - GSC_PROPERTY_URL (e.g., "https://geteducated.com/")
 * 6. Deploy function: supabase functions deploy sync-gsc-data
 * 7. Create cron job in Supabase Dashboard (runs daily at 6am UTC)
 *
 * GOOGLE SERVICE ACCOUNT SETUP:
 * 1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
 * 2. Create service account → Download JSON key
 * 3. In Search Console, add service account email as user
 * 4. Copy client_email and private_key to Supabase secrets
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { create } from 'https://deno.land/x/djwt@v2.8/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GSCRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/**
 * Generate JWT for Google API authentication
 */
async function getGoogleAccessToken(): Promise<string> {
  const clientEmail = Deno.env.get('GSC_CLIENT_EMAIL');
  const privateKey = Deno.env.get('GSC_PRIVATE_KEY');

  if (!clientEmail || !privateKey) {
    throw new Error('GSC_CLIENT_EMAIL and GSC_PRIVATE_KEY environment variables required');
  }

  // Clean private key (remove extra escapes)
  const cleanPrivateKey = privateKey.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const jwt = await create(
    { alg: 'RS256', typ: 'JWT' },
    {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    },
    await crypto.subtle.importKey(
      'pkcs8',
      new TextEncoder().encode(cleanPrivateKey),
      { name: 'RSASSA-PKSS-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    )
  );

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const propertyUrl = Deno.env.get('GSC_PROPERTY_URL') || 'https://geteducated.com/';

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[GSC Sync] Starting Google Search Console data sync...');
    console.log(`[GSC Sync] Property: ${propertyUrl}`);

    // Get access token
    const accessToken = await getGoogleAccessToken();

    // Calculate date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`[GSC Sync] Fetching data from ${startDateStr} to ${endDateStr}`);

    // Fetch data from GSC API
    const gscResponse = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDateStr,
          endDate: endDateStr,
          dimensions: ['query', 'page', 'date'],
          rowLimit: 25000,
        }),
      }
    );

    if (!gscResponse.ok) {
      const errorText = await gscResponse.text();
      throw new Error(`GSC API error: ${gscResponse.status} ${errorText}`);
    }

    const gscData = await gscResponse.json();
    const rows: GSCRow[] = gscData.rows || [];

    console.log(`[GSC Sync] Retrieved ${rows.length} rows from GSC`);

    // Insert/update performance metrics
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        const [query, page, date] = row.keys;

        // Check if metric already exists
        const { data: existing } = await supabase
          .from('performance_metrics')
          .select('id')
          .eq('keyword', query)
          .eq('url', page)
          .eq('date', date)
          .maybeSingle();

        const metricData = {
          keyword: query,
          url: page,
          date: date,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        };

        if (existing) {
          // Update existing
          await supabase
            .from('performance_metrics')
            .update(metricData)
            .eq('id', existing.id);
          updated++;
        } else {
          // Insert new
          await supabase
            .from('performance_metrics')
            .insert(metricData);
          inserted++;
        }
      } catch (error) {
        console.error(`[GSC Sync] Error processing row:`, error);
        errors++;
      }
    }

    console.log(`[GSC Sync] Complete! Inserted: ${inserted}, Updated: ${updated}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'GSC data synced successfully',
        stats: {
          total_rows: rows.length,
          inserted,
          updated,
          errors,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[GSC Sync] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
