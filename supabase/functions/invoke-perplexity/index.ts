/**
 * PERPLEXITY EDGE FUNCTION
 * =========================
 * Supabase Edge Function for invoking Perplexity AI
 *
 * Purpose: Securely call Perplexity API for fact-checking and citations
 * Timeout: 400 seconds (Supabase Pro tier)
 *
 * Environment Variables Required:
 *   - PERPLEXITY_API_KEY: Perplexity API key
 *
 * Deploy:
 *   npx supabase functions deploy invoke-perplexity --project-ref yvvtsfgryweqfppilkvo
 *
 * Set Secrets:
 *   npx supabase secrets set PERPLEXITY_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate API key
    if (!PERPLEXITY_API_KEY) {
      console.error('[Perplexity] PERPLEXITY_API_KEY not set');
      return new Response(
        JSON.stringify({ error: 'Perplexity API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const { prompt, content, model, searchDomainFilter, temperature, maxTokens } = await req.json();

    console.log('[Perplexity] Request:', { model, temperature, maxTokens });

    // Build prompt (combine content if provided)
    let fullPrompt = prompt;
    if (content) {
      fullPrompt = `${prompt}\n\nContent to analyze:\n${content}`;
    }

    if (!fullPrompt) {
      return new Response(
        JSON.stringify({ error: 'No prompt provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build request body
    // Note: Perplexity updated models in Jan 2025 - use 'sonar-pro' instead of 'pplx-70b-online'
    const requestBody: any = {
      model: model || 'sonar-pro',  // Default to sonar-pro (best quality with citations)
      messages: [
        { role: 'user', content: fullPrompt }
      ],
      temperature: temperature || 0.2,
      max_tokens: maxTokens || 2000,
      return_citations: true, // Request citations
      return_images: false,   // We don't need images for fact-checking
    };

    // Add domain filter if provided
    if (searchDomainFilter && searchDomainFilter.length > 0) {
      requestBody.search_domain_filter = searchDomainFilter;
    }

    console.log('[Perplexity] Calling API:', {
      model: requestBody.model,
      temperature: requestBody.temperature,
      max_tokens: requestBody.max_tokens,
      return_citations: requestBody.return_citations,
    });

    // Call Perplexity API
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Perplexity] API error:', response.status, errorText);
      return new Response(
        JSON.stringify({
          error: `Perplexity API error: ${response.status}`,
          details: errorText,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();

    console.log('[Perplexity] Success:', {
      model: data.model,
      usage: data.usage,
      citations: data.citations?.length || 0,
    });

    // Extract citations if available
    const citations = data.citations || [];

    // Return response
    return new Response(
      JSON.stringify({
        content: data.choices[0].message.content,
        citations,
        model: data.model,
        usage: data.usage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[Perplexity] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
