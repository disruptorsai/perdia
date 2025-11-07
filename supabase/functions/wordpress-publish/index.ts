/**
 * Supabase Edge Function: WordPress Auto-Publisher
 *
 * PURPOSE: Automatically publishes approved content to WordPress
 *
 * TRIGGER: Database trigger when content_queue.status changes to 'published'
 *          OR manual invocation with content_id
 *
 * WHAT IT DOES:
 * 1. Receives content_id from trigger or request body
 * 2. Fetches content from content_queue table
 * 3. Finds WordPress connection from wordpress_connections table
 * 4. Posts to WordPress REST API
 * 5. Updates content_queue with wordpress_post_id and wordpress_url
 *
 * SETUP REQUIRED:
 * 1. Add WordPress credentials to wordpress_connections table
 * 2. Deploy function: supabase functions deploy wordpress-publish
 * 3. Create database trigger (see SQL below)
 *
 * DATABASE TRIGGER SQL:
 *
 * CREATE OR REPLACE FUNCTION trigger_wordpress_publish()
 * RETURNS trigger AS $$
 * BEGIN
 *   IF NEW.status = 'published' AND OLD.status != 'published' THEN
 *     PERFORM net.http_post(
 *       url => 'https://[project-ref].supabase.co/functions/v1/wordpress-publish',
 *       headers => '{"Authorization": "Bearer [service-role-key]", "Content-Type": "application/json"}',
 *       body => json_build_object('content_id', NEW.id)::text
 *     );
 *   END IF;
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql;
 *
 * CREATE TRIGGER auto_wordpress_publish
 *   AFTER UPDATE ON content_queue
 *   FOR EACH ROW
 *   EXECUTE FUNCTION trigger_wordpress_publish();
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WordPressPost {
  title: string;
  content: string;
  status: 'publish' | 'draft';
  categories?: number[];
  tags?: number[];
  meta?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { content_id } = await req.json();

    if (!content_id) {
      throw new Error('content_id is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[WordPress Publisher] Processing content: ${content_id}`);

    // Fetch content
    const { data: content, error: contentError } = await supabase
      .from('content_queue')
      .select('*, wordpress_connections(*)')
      .eq('id', content_id)
      .single();

    if (contentError || !content) {
      throw new Error(`Failed to fetch content: ${contentError?.message}`);
    }

    // Get WordPress connection (use first active connection if not specified)
    let wpConnection;
    if (content.wordpress_connection_id) {
      const { data: conn } = await supabase
        .from('wordpress_connections')
        .select('*')
        .eq('id', content.wordpress_connection_id)
        .eq('is_active', true)
        .single();
      wpConnection = conn;
    } else {
      // Use first active WordPress connection
      const { data: conns } = await supabase
        .from('wordpress_connections')
        .select('*')
        .eq('is_active', true)
        .limit(1);
      wpConnection = conns?.[0];
    }

    if (!wpConnection) {
      throw new Error('No active WordPress connection found');
    }

    console.log(`[WordPress Publisher] Using WordPress site: ${wpConnection.site_url}`);

    // Prepare WordPress post data
    const wpPost: WordPressPost = {
      title: content.title,
      content: content.content,
      status: 'publish',
      meta: {
        _yoast_wpseo_metadesc: content.meta_description || '',
        _yoast_wpseo_focuskw: content.target_keywords?.join(', ') || '',
      },
    };

    // Post to WordPress REST API
    const wpApiUrl = `${wpConnection.site_url}/wp-json/wp/v2/posts`;
    const authString = btoa(`${wpConnection.username}:${wpConnection.app_password}`);

    console.log(`[WordPress Publisher] Posting to: ${wpApiUrl}`);

    const wpResponse = await fetch(wpApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
      body: JSON.stringify(wpPost),
    });

    if (!wpResponse.ok) {
      const errorText = await wpResponse.text();
      throw new Error(`WordPress API error: ${wpResponse.status} ${errorText}`);
    }

    const wpData = await wpResponse.json();

    console.log(`[WordPress Publisher] Posted successfully! WP ID: ${wpData.id}`);

    // Update content_queue with WordPress info
    const { error: updateError } = await supabase
      .from('content_queue')
      .update({
        wordpress_post_id: wpData.id.toString(),
        wordpress_url: wpData.link,
        published_date: new Date().toISOString(),
      })
      .eq('id', content_id);

    if (updateError) {
      console.error('[WordPress Publisher] Error updating content_queue:', updateError);
      // Don't throw - post was successful even if DB update failed
    }

    return new Response(
      JSON.stringify({
        success: true,
        wordpress_post_id: wpData.id,
        wordpress_url: wpData.link,
        content_id: content_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[WordPress Publisher] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
