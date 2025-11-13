/**
 * GROK EDGE FUNCTION
 * ==================
 * Supabase Edge Function for invoking Grok AI (xAI)
 *
 * Purpose: Securely call Grok API without exposing keys to client
 * Timeout: 400 seconds (Supabase Pro tier)
 *
 * Environment Variables Required:
 *   - GROK_API_KEY: xAI API key
 *
 * Deploy:
 *   npx supabase functions deploy invoke-grok --project-ref yvvtsfgryweqfppilkvo
 *
 * Set Secrets:
 *   npx supabase secrets set GROK_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GROK_API_KEY = Deno.env.get('GROK_API_KEY');
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

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
    if (!GROK_API_KEY) {
      console.error('[Grok] GROK_API_KEY not set');
      return new Response(
        JSON.stringify({ error: 'Grok API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const { prompt, systemPrompt, messages, model, temperature, maxTokens, responseSchema } = await req.json();

    console.log('[Grok] Request:', { model, temperature, maxTokens });

    // Build messages array
    const apiMessages = [];

    if (systemPrompt) {
      apiMessages.push({ role: 'system', content: systemPrompt });
    }

    if (messages && Array.isArray(messages)) {
      apiMessages.push(...messages);
    } else if (prompt) {
      apiMessages.push({ role: 'user', content: prompt });
    }

    if (apiMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No prompt or messages provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build request body
    const requestBody: any = {
      model: model || 'grok-2',
      messages: apiMessages,
      temperature: temperature || 0.7,
      max_tokens: maxTokens || 4000,
    };

    // Add response format if schema provided (if Grok supports structured outputs)
    if (responseSchema) {
      requestBody.response_format = {
        type: 'json_schema',
        json_schema: responseSchema,
      };
    }

    console.log('[Grok] Calling API:', {
      model: requestBody.model,
      messages: apiMessages.length,
      temperature: requestBody.temperature,
      max_tokens: requestBody.max_tokens,
    });

    // Call Grok API
    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Grok] API error:', response.status, errorText);
      return new Response(
        JSON.stringify({
          error: `Grok API error: ${response.status}`,
          details: errorText,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();

    console.log('[Grok] Success:', {
      model: data.model,
      usage: data.usage,
    });

    // Return response
    return new Response(
      JSON.stringify({
        content: data.choices[0].message.content,
        model: data.model,
        usage: data.usage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[Grok] Error:', error);
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
