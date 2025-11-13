/**
 * AUTO-APPROVE ARTICLES EDGE FUNCTION
 * ====================================
 * Supabase Edge Function / Cron Job
 *
 * Purpose: Auto-approve and publish articles after 5 days (or configured SLA)
 *
 * Runs: Hourly via Supabase Cron or manual invocation
 *
 * Logic:
 * 1. Query articles where status='pending_review' AND auto_approve_at < NOW()
 * 2. Validate each article before approving
 * 3. Update status to 'approved'
 * 4. Publish to WordPress
 * 5. Log results
 *
 * Deploy:
 *   npx supabase functions deploy auto-approve-articles --project-ref yvvtsfgryweqfppilkvo
 *
 * Schedule (via Supabase Dashboard → Database → Cron Jobs):
 *   SELECT cron.schedule(
 *     'auto-approve-articles',
 *     '0 * * * *', -- Every hour
 *     $$ SELECT net.http_post(
 *       url:='https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/auto-approve-articles',
 *       headers:='{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
 *     ) $$
 *   );
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const WORDPRESS_BASE_URL = Deno.env.get('WORDPRESS_BASE_URL') || '';
const WORDPRESS_USERNAME = Deno.env.get('WORDPRESS_USERNAME') || '';
const WORDPRESS_PASSWORD = Deno.env.get('WORDPRESS_PASSWORD') || '';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[Auto-Approve] Starting auto-approve job...');

  try {
    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find articles ready for auto-approve
    const now = new Date().toISOString();
    const { data: articles, error: queryError } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'pending_review')
      .lte('auto_approve_at', now)
      .limit(50); // Process max 50 per run

    if (queryError) {
      console.error('[Auto-Approve] Query error:', queryError);
      throw queryError;
    }

    console.log(`[Auto-Approve] Found ${articles?.length || 0} articles ready for auto-approve`);

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, approved: 0, message: 'No articles to approve' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      approved: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Process each article
    for (const article of articles) {
      try {
        console.log(`[Auto-Approve] Processing article: ${article.id} - "${article.title}"`);

        // Validate article before approving
        const validationResult = validateArticle(article);
        if (!validationResult.valid) {
          console.warn(`[Auto-Approve] Article ${article.id} failed validation:`, validationResult.errors);

          // Update article with validation errors instead of approving
          await supabase
            .from('articles')
            .update({
              validation_status: 'invalid',
              validation_errors: validationResult.errors,
              status: 'rejected', // Reject invalid articles
            })
            .eq('id', article.id);

          results.failed++;
          results.errors.push({
            article_id: article.id,
            title: article.title,
            reason: 'Validation failed',
            errors: validationResult.errors,
          });

          continue;
        }

        // Approve article
        await supabase
          .from('articles')
          .update({ status: 'approved' })
          .eq('id', article.id);

        // Record feedback
        await supabase
          .from('feedback')
          .insert({
            article_id: article.id,
            user_id: article.user_id,
            type: 'approve',
            payload: {
              timestamp: new Date().toISOString(),
              method: 'auto_approve',
              reason: '5-day SLA expired',
            },
          });

        // Publish to WordPress (if integration configured)
        if (WORDPRESS_BASE_URL && WORDPRESS_USERNAME && WORDPRESS_PASSWORD) {
          try {
            const wpResult = await publishToWordPress(article);
            console.log(`[Auto-Approve] Published to WordPress: ${wpResult.link}`);

            // Update article with WordPress info
            await supabase
              .from('articles')
              .update({
                status: 'published',
                wordpress_post_id: wpResult.id.toString(),
                wordpress_url: wpResult.link,
                published_at: new Date().toISOString(),
              })
              .eq('id', article.id);
          } catch (wpError) {
            console.error(`[Auto-Approve] WordPress publish failed for ${article.id}:`, wpError);
            // Article is still approved, just not published
          }
        }

        results.approved++;
        console.log(`[Auto-Approve] Article ${article.id} auto-approved successfully`);

      } catch (error) {
        console.error(`[Auto-Approve] Error processing article ${article.id}:`, error);
        results.failed++;
        results.errors.push({
          article_id: article.id,
          title: article.title,
          reason: error.message,
        });
      }
    }

    console.log('[Auto-Approve] Job complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        message: `Auto-approved ${results.approved} articles, ${results.failed} failed`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[Auto-Approve] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Validate article before auto-approving
 */
function validateArticle(article: any): { valid: boolean; errors: any[] } {
  const errors = [];

  // Check required fields
  if (!article.title || article.title.trim().length === 0) {
    errors.push({ type: 'required', field: 'title', message: 'Title is required' });
  }

  if (!article.body || article.body.trim().length === 0) {
    errors.push({ type: 'required', field: 'body', message: 'Body is required' });
  }

  // Check word count
  const plainText = article.body.replace(/<[^>]*>/g, '');
  const wordCount = plainText.split(/\s+/).length;

  if (wordCount < 1000) {
    errors.push({
      type: 'word_count',
      message: `Article too short (${wordCount} words, minimum 1000)`,
      severity: 'error',
    });
  }

  // Check validation status (if already validated)
  if (article.validation_status === 'invalid') {
    errors.push({
      type: 'validation',
      message: 'Article previously marked as invalid',
      previous_errors: article.validation_errors || [],
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Publish article to WordPress
 */
async function publishToWordPress(article: any): Promise<any> {
  const wpUrl = `${WORDPRESS_BASE_URL}/wp-json/wp/v2/posts`;
  const credentials = btoa(`${WORDPRESS_USERNAME}:${WORDPRESS_PASSWORD}`);

  // Upload featured image if exists
  let featuredMediaId = null;
  if (article.featured_image_url) {
    try {
      featuredMediaId = await uploadFeaturedImage(article.featured_image_url, article.title);
    } catch (error) {
      console.warn('[WordPress] Featured image upload failed:', error);
    }
  }

  // Create post
  const postData: any = {
    title: article.title,
    content: article.body,
    status: 'publish',
    meta: {
      description: article.meta_description || '',
    },
  };

  if (featuredMediaId) {
    postData.featured_media = featuredMediaId;
  }

  const response = await fetch(wpUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WordPress API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Upload featured image to WordPress
 */
async function uploadFeaturedImage(imageUrl: string, title: string): Promise<number> {
  // Fetch image
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error('Failed to fetch image');
  }

  const imageBlob = await imageResponse.blob();
  const filename = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.jpg`;

  // Upload to WordPress
  const wpUrl = `${WORDPRESS_BASE_URL}/wp-json/wp/v2/media`;
  const credentials = btoa(`${WORDPRESS_USERNAME}:${WORDPRESS_PASSWORD}`);

  const formData = new FormData();
  formData.append('file', imageBlob, filename);

  const response = await fetch(wpUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload image to WordPress');
  }

  const result = await response.json();
  return result.id;
}
