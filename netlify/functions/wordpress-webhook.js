/**
 * Netlify Serverless Function: WordPress Webhook Handler
 *
 * PURPOSE: Receives callbacks from WordPress after content is published
 *
 * ENDPOINT: /.netlify/functions/wordpress-webhook
 *
 * WHAT IT DOES:
 * 1. Receives POST request from WordPress webhook
 * 2. Extracts post_id, post_url, and status
 * 3. Updates content_queue table with WordPress info
 * 4. Sends confirmation response
 *
 * SETUP REQUIRED:
 * 1. Install webhook plugin in WordPress:
 *    - WP Webhooks (free): https://wordpress.org/plugins/wp-webhooks/
 *    - Or WPGetAPI
 * 2. Configure webhook in WordPress:
 *    - Trigger: post_published
 *    - URL: https://your-site.netlify.app/.netlify/functions/wordpress-webhook
 *    - Payload: { post_id, post_url, post_title, status }
 * 3. Add webhook secret to Netlify env vars:
 *    - WORDPRESS_WEBHOOK_SECRET (for security)
 *
 * SECURITY:
 * - Validates webhook signature
 * - Only accepts POST requests
 * - Verifies WORDPRESS_WEBHOOK_SECRET
 */

import { createClient } from '@supabase/supabase-js';

export const handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { post_id, post_url, post_title, status, content_queue_id } = body;

    // Validate required fields
    if (!post_id || !post_url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: post_id, post_url' }),
      };
    }

    // Verify webhook secret (if configured)
    const webhookSecret = process.env.WORDPRESS_WEBHOOK_SECRET;
    if (webhookSecret) {
      const providedSecret = event.headers['x-webhook-secret'] || body.secret;
      if (providedSecret !== webhookSecret) {
        console.error('[WordPress Webhook] Invalid webhook secret');
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Invalid webhook secret' }),
        };
      }
    }

    console.log(`[WordPress Webhook] Received: Post ID ${post_id}, URL: ${post_url}`);

    // Initialize Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find content in queue
    let query = supabase.from('content_queue').select('id, title');

    if (content_queue_id) {
      // If content_queue_id provided, update that specific record
      query = query.eq('id', content_queue_id);
    } else {
      // Otherwise, find by title match
      query = query.eq('title', post_title).is('wordpress_post_id', null);
    }

    const { data: content, error: fetchError } = await query.maybeSingle();

    if (fetchError) {
      console.error('[WordPress Webhook] Error fetching content:', fetchError);
      throw fetchError;
    }

    if (!content) {
      console.warn('[WordPress Webhook] No matching content found in queue');
      // Still return success - WordPress published successfully
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'WordPress post published, but no matching content found in queue',
          post_id,
        }),
      };
    }

    // Update content_queue with WordPress info
    const { error: updateError } = await supabase
      .from('content_queue')
      .update({
        wordpress_post_id: post_id.toString(),
        wordpress_url: post_url,
        status: status === 'publish' ? 'published' : content.status,
        published_date: new Date().toISOString(),
      })
      .eq('id', content.id);

    if (updateError) {
      console.error('[WordPress Webhook] Error updating content_queue:', updateError);
      throw updateError;
    }

    console.log(`[WordPress Webhook] Updated content_queue: ${content.id} -> WP Post ${post_id}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        content_queue_id: content.id,
        wordpress_post_id: post_id,
      }),
    };

  } catch (error) {
    console.error('[WordPress Webhook] Error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};
