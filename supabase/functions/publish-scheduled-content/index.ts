/**
 * Supabase Edge Function: Scheduled Content Publisher
 *
 * PURPOSE: Automatically publishes content that has reached its scheduled publish date
 *
 * TRIGGER: Supabase Cron (runs every hour)
 *
 * WHAT IT DOES:
 * 1. Finds all content in content_queue with:
 *    - status = 'approved'
 *    - scheduled_publish_date <= NOW()
 * 2. Updates status to 'published'
 * 3. Sets published_date to current timestamp
 *
 * SETUP REQUIRED:
 * 1. Deploy this function: supabase functions deploy publish-scheduled-content
 * 2. Add cron schedule in Supabase Dashboard:
 *    - Go to Database > Cron Jobs
 *    - Create job: SELECT net.http_post(url => 'https://[project-ref].supabase.co/functions/v1/publish-scheduled-content', headers => '{"Authorization": "Bearer [anon-key]"}');
 *    - Schedule: 0 * * * * (every hour)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Scheduled Publisher] Running scheduled content check...');

    // Find content ready to publish
    const now = new Date().toISOString();
    const { data: contentToPublish, error: fetchError } = await supabase
      .from('content_queue')
      .select('id, title, scheduled_publish_date')
      .eq('status', 'approved')
      .lte('scheduled_publish_date', now)
      .not('scheduled_publish_date', 'is', null);

    if (fetchError) {
      console.error('[Scheduled Publisher] Error fetching content:', fetchError);
      throw fetchError;
    }

    if (!contentToPublish || contentToPublish.length === 0) {
      console.log('[Scheduled Publisher] No content ready to publish');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No content ready to publish',
          published: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Scheduled Publisher] Found ${contentToPublish.length} items to publish`);

    // Publish each item
    const published = [];
    const errors = [];

    for (const item of contentToPublish) {
      const { error: updateError } = await supabase
        .from('content_queue')
        .update({
          status: 'published',
          published_date: now,
        })
        .eq('id', item.id);

      if (updateError) {
        console.error(`[Scheduled Publisher] Error publishing ${item.id}:`, updateError);
        errors.push({ id: item.id, error: updateError.message });
      } else {
        console.log(`[Scheduled Publisher] Published: ${item.title} (${item.id})`);
        published.push(item);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Published ${published.length} items`,
        published: published.length,
        errors: errors.length,
        items: published.map(p => ({ id: p.id, title: p.title })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Scheduled Publisher] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
