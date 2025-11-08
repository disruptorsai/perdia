/**
 * Supabase Edge Function: Enhanced WordPress Publisher
 *
 * PURPOSE: Publish content to WordPress with images, categories, tags, and retry logic
 *
 * FEATURES:
 * - JWT authentication required
 * - Featured image upload to WordPress
 * - Category and tag mapping
 * - Exponential backoff retry logic (3 attempts)
 * - Comprehensive error handling
 * - Detailed logging
 *
 * REQUEST BODY:
 * {
 *   content_id: string;           // Required: Content queue item ID
 *   wordpress_site_id?: string;   // Optional: Specific WordPress site
 *   publish_status?: 'publish' | 'draft'; // Optional: Defaults to 'publish'
 * }
 *
 * RESPONSE:
 * {
 *   success: true,
 *   data: {
 *     wordpress_post_id: number,
 *     wordpress_url: string,
 *     content_id: string
 *   }
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { authenticateRequest } from '../_shared/auth.ts';
import {
  createErrorResponse,
  createSuccessResponse,
  createCorsPreflightResponse,
  handleError,
  validateRequiredFields,
  ErrorTypes,
} from '../_shared/errors.ts';
import {
  getAuthenticatedClient,
  getContentQueueItem,
  getWordPressConnection,
  updateContentQueueItem,
} from '../_shared/database.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('wordpress-publish');

interface WordPressPost {
  title: string;
  content: string;
  status: 'publish' | 'draft';
  categories?: number[];
  tags?: number[];
  featured_media?: number;
  meta?: Record<string, any>;
}

/**
 * Upload image to WordPress Media Library
 */
async function uploadFeaturedImage(
  wpSiteUrl: string,
  wpUsername: string,
  wpPassword: string,
  imageUrl: string,
  fileName: string
): Promise<number | null> {
  try {
    logger.info('Uploading featured image', { imageUrl, fileName });

    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      logger.warn('Failed to fetch image', { status: imageResponse.status });
      return null;
    }

    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();

    // Upload to WordPress
    const wpMediaUrl = `${wpSiteUrl}/wp-json/wp/v2/media`;
    const authString = btoa(`${wpUsername}:${wpPassword}`);

    const uploadResponse = await fetch(wpMediaUrl, {
      method: 'POST',
      headers: {
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Authorization': `Basic ${authString}`,
      },
      body: imageBuffer,
    });

    if (!uploadResponse.ok) {
      logger.warn('Failed to upload image to WordPress', {
        status: uploadResponse.status,
      });
      return null;
    }

    const mediaData = await uploadResponse.json();
    logger.info('Image uploaded successfully', { mediaId: mediaData.id });
    return mediaData.id;
  } catch (error) {
    logger.error('Error uploading featured image', error);
    return null;
  }
}

/**
 * Publish post to WordPress with retry logic
 */
async function publishWithRetry(
  wpApiUrl: string,
  authString: string,
  wpPost: WordPressPost,
  maxRetries = 3
): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Publishing to WordPress (attempt ${attempt}/${maxRetries})`);

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
      logger.info('Published successfully', { wordpressId: wpData.id });
      return wpData;
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Attempt ${attempt} failed`, { error: error.message });

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        logger.info(`Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  // All retries failed
  throw lastError || new Error('Failed to publish after retries');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return createCorsPreflightResponse();
  }

  try {
    logger.start();

    // Authenticate request
    const user = await authenticateRequest(req);
    logger.info('User authenticated', { userId: user.id, email: user.email });

    // Parse request body
    const body = await req.json();
    validateRequiredFields(body, ['content_id']);

    const {
      content_id,
      wordpress_site_id,
      publish_status = 'publish',
    } = body;

    // Initialize database client
    const client = getAuthenticatedClient(user.id);

    // Fetch content
    logger.info('Fetching content', { contentId: content_id });
    const content = await getContentQueueItem(client, content_id, user.id);

    if (!content) {
      return createErrorResponse(
        'Content not found',
        ErrorTypes.NOT_FOUND
      );
    }

    // Get WordPress connection
    logger.info('Fetching WordPress connection', { siteId: wordpress_site_id });
    const wpConnection = await getWordPressConnection(
      client,
      user.id,
      wordpress_site_id
    );

    if (!wpConnection) {
      return createErrorResponse(
        'No active WordPress connection found',
        ErrorTypes.NOT_FOUND
      );
    }

    logger.info('Using WordPress site', { siteUrl: wpConnection.site_url });

    // Upload featured image if present
    let featuredMediaId: number | null = null;
    if (content.featured_image_url) {
      featuredMediaId = await uploadFeaturedImage(
        wpConnection.site_url,
        wpConnection.username,
        wpConnection.app_password,
        content.featured_image_url,
        `${content.title.toLowerCase().replace(/\s+/g, '-')}.jpg`
      );
    }

    // Prepare WordPress post
    const wpPost: WordPressPost = {
      title: content.title,
      content: content.content,
      status: publish_status as 'publish' | 'draft',
      meta: {
        _yoast_wpseo_metadesc: content.meta_description || '',
        _yoast_wpseo_focuskw: content.target_keywords?.[0] || '',
      },
    };

    // Add featured image if uploaded
    if (featuredMediaId) {
      wpPost.featured_media = featuredMediaId;
    }

    // Add categories if present in content metadata
    if (content.metadata?.categories) {
      wpPost.categories = content.metadata.categories;
    }

    // Add tags if present in content metadata
    if (content.metadata?.tags) {
      wpPost.tags = content.metadata.tags;
    }

    // Publish to WordPress with retry logic
    const wpApiUrl = `${wpConnection.site_url}/wp-json/wp/v2/posts`;
    const authString = btoa(`${wpConnection.username}:${wpConnection.app_password}`);

    const wpData = await publishWithRetry(wpApiUrl, authString, wpPost);

    // Update content queue with WordPress info
    await updateContentQueueItem(client, content_id, user.id, {
      wordpress_post_id: wpData.id.toString(),
      wordpress_url: wpData.link,
      published_date: new Date().toISOString(),
      status: 'published',
    });

    logger.complete({ wordpressPostId: wpData.id });

    return createSuccessResponse(
      {
        wordpress_post_id: wpData.id,
        wordpress_url: wpData.link,
        content_id: content_id,
      },
      'Content published to WordPress successfully'
    );
  } catch (error) {
    logger.failed(error);
    return handleError(error, 'wordpress-publish');
  }
});
