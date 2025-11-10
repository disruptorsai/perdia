/**
 * PERDIA EDUCATION - STOCK IMAGE SEARCH EDGE FUNCTION
 * ====================================================
 * Searches Unsplash for high-quality stock images
 *
 * Uses Unsplash API to find relevant images for articles
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  // CORS headers - handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { query, perPage = 10 } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid query parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const unsplashAccessKey = Deno.env.get('UNSPLASH_ACCESS_KEY');
    if (!unsplashAccessKey) {
      return new Response(
        JSON.stringify({ error: 'Unsplash API not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[search-stock-images] Searching Unsplash:', { query, perPage });

    // Search Unsplash
    const unsplashUrl = new URL('https://api.unsplash.com/search/photos');
    unsplashUrl.searchParams.append('query', query);
    unsplashUrl.searchParams.append('per_page', perPage.toString());
    unsplashUrl.searchParams.append('orientation', 'landscape'); // Prefer landscape for article heroes
    unsplashUrl.searchParams.append('content_filter', 'high'); // High quality content only

    const response = await fetch(unsplashUrl.toString(), {
      headers: {
        'Authorization': `Client-ID ${unsplashAccessKey}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[Unsplash] API Error:', errorData);
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform Unsplash results to our format
    const images = data.results.map((photo: any) => ({
      id: photo.id,
      url: photo.urls.regular, // Regular size for preview
      downloadUrl: photo.urls.full, // Full size for download
      thumbnailUrl: photo.urls.small,
      altText: photo.alt_description || photo.description || query,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      downloadLocation: photo.links.download_location, // Required for Unsplash API compliance
      width: photo.width,
      height: photo.height,
    }));

    console.log('[search-stock-images] Found images:', images.length);

    return new Response(
      JSON.stringify({
        success: true,
        images,
        total: data.total,
        query,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('[search-stock-images] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Stock image search failed',
        message: error.message || 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
