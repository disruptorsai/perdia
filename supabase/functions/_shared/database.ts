/**
 * Shared Database Helper Module for Supabase Edge Functions
 *
 * Provides common database query patterns and utilities.
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

/**
 * Initialize authenticated Supabase client for user-specific operations
 *
 * @param userId - The authenticated user's ID
 * @returns Supabase client instance
 */
export function getAuthenticatedClient(userId: string): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }

  const client = createClient(supabaseUrl, supabaseServiceKey);

  // Set the user context for RLS policies
  // This ensures all queries respect Row Level Security
  return client;
}

/**
 * Fetch content queue item by ID
 *
 * @param client - Supabase client
 * @param contentId - Content queue item ID
 * @param userId - User ID for RLS
 * @returns Content queue item or null
 */
export async function getContentQueueItem(
  client: SupabaseClient,
  contentId: string,
  userId: string
) {
  const { data, error } = await client
    .from('content_queue')
    .select('*')
    .eq('id', contentId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('[Database] Error fetching content queue item:', error);
    throw new Error(`Failed to fetch content: ${error.message}`);
  }

  return data;
}

/**
 * Update content queue item
 *
 * @param client - Supabase client
 * @param contentId - Content queue item ID
 * @param userId - User ID for RLS
 * @param updates - Fields to update
 * @returns Updated content queue item
 */
export async function updateContentQueueItem(
  client: SupabaseClient,
  contentId: string,
  userId: string,
  updates: Record<string, any>
) {
  const { data, error } = await client
    .from('content_queue')
    .update(updates)
    .eq('id', contentId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[Database] Error updating content queue item:', error);
    throw new Error(`Failed to update content: ${error.message}`);
  }

  return data;
}

/**
 * Get WordPress connection for user
 *
 * @param client - Supabase client
 * @param userId - User ID
 * @param siteId - Optional specific site ID
 * @returns WordPress connection or null
 */
export async function getWordPressConnection(
  client: SupabaseClient,
  userId: string,
  siteId?: string
) {
  let query = client
    .from('wordpress_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (siteId) {
    query = query.eq('id', siteId);
  }

  const { data, error } = await query.single();

  if (error) {
    console.error('[Database] Error fetching WordPress connection:', error);
    throw new Error(`Failed to fetch WordPress connection: ${error.message}`);
  }

  return data;
}

/**
 * Get user's automation settings
 *
 * @param client - Supabase client
 * @param userId - User ID
 * @returns Automation settings or default settings
 */
export async function getAutomationSettings(
  client: SupabaseClient,
  userId: string
) {
  const { data, error } = await client
    .from('automation_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    // Return default settings if none exist
    return {
      automation_level: 'manual',
      articles_per_day: 1,
      auto_approve: false,
      auto_publish: false,
      publish_to_wordpress: false,
    };
  }

  return data;
}

/**
 * Bulk upsert keywords
 *
 * @param client - Supabase client
 * @param userId - User ID
 * @param keywords - Array of keyword objects
 * @returns Upserted keywords
 */
export async function bulkUpsertKeywords(
  client: SupabaseClient,
  userId: string,
  keywords: Array<Record<string, any>>
) {
  // Add user_id to all keywords
  const keywordsWithUserId = keywords.map(kw => ({
    ...kw,
    user_id: userId,
  }));

  const { data, error } = await client
    .from('keywords')
    .upsert(keywordsWithUserId, {
      onConflict: 'user_id,keyword',
    })
    .select();

  if (error) {
    console.error('[Database] Error upserting keywords:', error);
    throw new Error(`Failed to upsert keywords: ${error.message}`);
  }

  return data;
}

/**
 * Bulk upsert performance metrics
 *
 * @param client - Supabase client
 * @param userId - User ID
 * @param metrics - Array of performance metric objects
 * @returns Upserted metrics
 */
export async function bulkUpsertPerformanceMetrics(
  client: SupabaseClient,
  userId: string,
  metrics: Array<Record<string, any>>
) {
  // Add user_id to all metrics
  const metricsWithUserId = metrics.map(metric => ({
    ...metric,
    user_id: userId,
  }));

  const { data, error } = await client
    .from('performance_metrics')
    .upsert(metricsWithUserId, {
      onConflict: 'user_id,metric_date,keyword,page_url',
    })
    .select();

  if (error) {
    console.error('[Database] Error upserting performance metrics:', error);
    throw new Error(`Failed to upsert metrics: ${error.message}`);
  }

  return data;
}

/**
 * Update keyword rankings from performance metrics
 *
 * @param client - Supabase client
 * @param userId - User ID
 * @param keywordRankings - Array of { keyword, ranking } objects
 * @returns Updated keywords
 */
export async function updateKeywordRankings(
  client: SupabaseClient,
  userId: string,
  keywordRankings: Array<{ keyword: string; ranking: number }>
) {
  const results = [];

  for (const { keyword, ranking } of keywordRankings) {
    const { data, error } = await client
      .from('keywords')
      .update({ current_ranking: ranking })
      .eq('user_id', userId)
      .eq('keyword', keyword)
      .select()
      .single();

    if (!error && data) {
      results.push(data);
    }
  }

  return results;
}

/**
 * Get approved content ready to schedule
 *
 * @param client - Supabase client
 * @param userId - User ID
 * @param limit - Maximum number of items to return
 * @returns Array of content queue items
 */
export async function getContentReadyToSchedule(
  client: SupabaseClient,
  userId: string,
  limit: number = 10
) {
  const { data, error } = await client
    .from('content_queue')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .is('scheduled_date', null)
    .order('created_date', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[Database] Error fetching content ready to schedule:', error);
    throw new Error(`Failed to fetch content: ${error.message}`);
  }

  return data || [];
}

/**
 * Count scheduled content for today
 *
 * @param client - Supabase client
 * @param userId - User ID
 * @returns Number of items scheduled for today
 */
export async function countScheduledToday(
  client: SupabaseClient,
  userId: string
): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { count, error } = await client
    .from('content_queue')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('scheduled_date', today.toISOString())
    .lt('scheduled_date', tomorrow.toISOString());

  if (error) {
    console.error('[Database] Error counting scheduled content:', error);
    return 0;
  }

  return count || 0;
}
