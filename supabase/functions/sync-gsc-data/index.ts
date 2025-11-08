/**
 * Supabase Edge Function: Enhanced Google Search Console Data Sync
 *
 * PURPOSE: Sync GSC data + update keyword rankings with trend analysis
 *
 * FEATURES:
 * - JWT authentication (optional for cron jobs - uses service role key)
 * - Fetch last 30 days of GSC performance data
 * - Bulk upsert to performance_metrics table
 * - Update keywords.current_ranking from GSC position data
 * - Calculate ranking trends (up/down/stable)
 * - Identify ranking opportunities (high impressions + low CTR)
 * - Detailed logging and error handling
 *
 * REQUEST BODY (all optional):
 * {
 *   days?: number;              // Number of days to sync (default: 30)
 *   property_url?: string;      // GSC property URL (uses env var if not provided)
 *   user_id?: string;          // Specific user ID for manual sync
 * }
 *
 * RESPONSE:
 * {
 *   success: true,
 *   data: {
 *     stats: {
 *       total_rows: number,
 *       metrics_upserted: number,
 *       rankings_updated: number,
 *       opportunities_found: number
 *     },
 *     opportunities: Array<{
 *       keyword: string,
 *       impressions: number,
 *       ctr: number,
 *       position: number,
 *       potential_clicks: number
 *     }>
 *   }
 * }
 *
 * ENVIRONMENT VARIABLES REQUIRED:
 * - GSC_CLIENT_EMAIL (Google service account email)
 * - GSC_PRIVATE_KEY (Google service account private key)
 * - GSC_PROPERTY_URL (default property URL)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { create } from 'https://deno.land/x/djwt@v2.8/mod.ts';
import { optionalAuth, getServiceRoleClient } from '../_shared/auth.ts';
import {
  createErrorResponse,
  createSuccessResponse,
  createCorsPreflightResponse,
  handleError,
  ErrorTypes,
} from '../_shared/errors.ts';
import {
  bulkUpsertPerformanceMetrics,
  updateKeywordRankings,
} from '../_shared/database.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('sync-gsc-data');

interface GSCRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface RankingOpportunity {
  keyword: string;
  impressions: number;
  ctr: number;
  position: number;
  potential_clicks: number;
}

/**
 * Generate JWT for Google API authentication
 */
async function getGoogleAccessToken(): Promise<string> {
  const clientEmail = Deno.env.get('GSC_CLIENT_EMAIL');
  const privateKey = Deno.env.get('GSC_PRIVATE_KEY');

  if (!clientEmail || !privateKey) {
    throw new Error('GSC credentials not configured');
  }

  logger.info('Generating Google access token');

  // Clean private key
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
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    )
  );

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Fetch GSC performance data
 */
async function fetchGSCData(
  accessToken: string,
  propertyUrl: string,
  startDate: string,
  endDate: string
): Promise<GSCRow[]> {
  logger.info('Fetching GSC data', { propertyUrl, startDate, endDate });

  const gscResponse = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
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
  return gscData.rows || [];
}

/**
 * Identify ranking opportunities (high impressions + low CTR)
 */
function identifyOpportunities(rows: GSCRow[]): RankingOpportunity[] {
  const keywordMap = new Map<string, GSCRow>();

  // Aggregate by keyword (sum across all pages/dates)
  for (const row of rows) {
    const keyword = row.keys[0];
    const existing = keywordMap.get(keyword);

    if (existing) {
      existing.clicks += row.clicks;
      existing.impressions += row.impressions;
      existing.ctr = existing.clicks / existing.impressions;
      existing.position = (existing.position + row.position) / 2; // Average position
    } else {
      keywordMap.set(keyword, { ...row });
    }
  }

  // Find opportunities: impressions > 100, CTR < 5%, position > 10
  const opportunities: RankingOpportunity[] = [];

  for (const [keyword, data] of keywordMap.entries()) {
    if (data.impressions > 100 && data.ctr < 0.05 && data.position > 10) {
      // Calculate potential clicks if CTR improved to 10%
      const potential_clicks = Math.round(data.impressions * 0.10 - data.clicks);

      opportunities.push({
        keyword,
        impressions: data.impressions,
        ctr: data.ctr,
        position: data.position,
        potential_clicks,
      });
    }
  }

  // Sort by potential clicks (highest first)
  return opportunities.sort((a, b) => b.potential_clicks - a.potential_clicks);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return createCorsPreflightResponse();
  }

  try {
    logger.start();

    // Optional authentication (supports both user auth and service role)
    const user = await optionalAuth(req);
    const userId = user?.id;

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const {
      days = 30,
      property_url,
      user_id,
    } = body;

    // Use provided user_id or authenticated user
    const targetUserId = user_id || userId;

    if (!targetUserId) {
      logger.warn('No user context - will use service role');
    }

    // Get Google access token
    const accessToken = await getGoogleAccessToken();

    // Get property URL
    const propertyUrl = property_url || Deno.env.get('GSC_PROPERTY_URL');
    if (!propertyUrl) {
      return createErrorResponse(
        'GSC property URL not configured',
        ErrorTypes.BAD_REQUEST
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch GSC data
    const rows = await fetchGSCData(accessToken, propertyUrl, startDateStr, endDateStr);
    logger.info('GSC data fetched', { rowCount: rows.length });

    // Prepare metrics for bulk upsert
    const metrics = rows.map(row => {
      const [query, page, date] = row.keys;
      return {
        metric_date: date,
        keyword: query,
        page_url: page,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        google_ranking: Math.round(row.position),
      };
    });

    // Use service role client for bulk operations
    const client = getServiceRoleClient();

    // Bulk upsert performance metrics
    const upsertedMetrics = targetUserId
      ? await bulkUpsertPerformanceMetrics(client, targetUserId, metrics)
      : [];

    logger.info('Metrics upserted', { count: upsertedMetrics.length });

    // Extract keyword rankings (average position per keyword)
    const rankingMap = new Map<string, number[]>();
    for (const row of rows) {
      const keyword = row.keys[0];
      const positions = rankingMap.get(keyword) || [];
      positions.push(row.position);
      rankingMap.set(keyword, positions);
    }

    const keywordRankings = Array.from(rankingMap.entries()).map(([keyword, positions]) => {
      const avgPosition = positions.reduce((sum, p) => sum + p, 0) / positions.length;
      return { keyword, ranking: Math.round(avgPosition) };
    });

    // Update keyword rankings
    let updatedRankings = 0;
    if (targetUserId) {
      const updated = await updateKeywordRankings(client, targetUserId, keywordRankings);
      updatedRankings = updated.length;
    }

    logger.info('Keyword rankings updated', { count: updatedRankings });

    // Identify opportunities
    const opportunities = identifyOpportunities(rows);
    logger.info('Opportunities identified', { count: opportunities.length });

    logger.complete({
      metricsUpserted: upsertedMetrics.length,
      rankingsUpdated: updatedRankings,
      opportunitiesFound: opportunities.length,
    });

    return createSuccessResponse(
      {
        stats: {
          total_rows: rows.length,
          metrics_upserted: upsertedMetrics.length,
          rankings_updated: updatedRankings,
          opportunities_found: opportunities.length,
        },
        opportunities: opportunities.slice(0, 20), // Top 20 opportunities
      },
      'GSC data synced successfully'
    );
  } catch (error) {
    logger.failed(error);
    return handleError(error, 'sync-gsc-data');
  }
});
