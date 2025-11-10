/**
 * PERDIA EDUCATION - UNSPLASH DOWNLOAD TRACKER
 * ============================================
 * Tracks Unsplash downloads (required by Unsplash API terms)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  // CORS headers
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
    const { downloadLocation } = await req.json();

    if (!downloadLocation) {
      return new Response(
        JSON.stringify({ error: 'Missing downloadLocation' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const unsplashAccessKey = Deno.env.get('UNSPLASH_ACCESS_KEY');
    if (!unsplashAccessKey) {
      // Don't fail if not configured, just log
      console.warn('[track-unsplash-download] Unsplash API key not configured');
      return new Response(
        JSON.stringify({ success: false, message: 'API key not configured' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Track the download with Unsplash
    const response = await fetch(downloadLocation, {
      headers: {
        'Authorization': `Client-ID ${unsplashAccessKey}`,
      },
    });

    if (!response.ok) {
      console.error('[track-unsplash-download] Failed to track download:', await response.text());
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('[track-unsplash-download] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 200, // Don't fail the user's flow
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
