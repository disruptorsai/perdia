/**
 * Supabase Edge Function: AI LLM Invocation
 *
 * PURPOSE: Securely handles AI API calls server-side to prevent API key exposure
 *
 * SUPPORTED PROVIDERS:
 * - Anthropic Claude (primary for content generation)
 * - OpenAI GPT (secondary for specialized tasks)
 *
 * TIMEOUT: 400 seconds (Supabase Pro tier) - 15x longer than Netlify
 *
 * SETUP:
 * 1. Deploy: supabase functions deploy invoke-llm
 * 2. Set secrets:
 *    supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *    supabase secrets set OPENAI_API_KEY=sk-...
 *
 * USAGE:
 * POST https://[project-ref].supabase.co/functions/v1/invoke-llm
 * {
 *   "provider": "claude",
 *   "model": "claude-sonnet-4-5",
 *   "messages": [...],
 *   "system_prompt": "...",
 *   "temperature": 0.7,
 *   "max_tokens": 4000
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Anthropic from 'npm:@anthropic-ai/sdk@0.32.1';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LLMRequest {
  provider: 'claude' | 'openai' | 'anthropic' | 'xai' | 'grok' | 'perplexity';
  model?: string;
  prompt?: string;
  messages?: Array<{ role: string; content: string }>;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  response_json_schema?: any;
}

interface LLMResponse {
  content: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  model: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const startTime = Date.now();
  console.log('========================================');
  console.log('INVOKE-LLM EDGE FUNCTION CALLED');
  console.log('Time:', new Date().toISOString());
  console.log('========================================');

  try {
    // Optional authentication - verify if auth header is present
    const authHeader = req.headers.get('Authorization');
    console.log('🔐 Auth header present:', !!authHeader);

    let authenticatedUser = null;

    if (authHeader) {
      // Log environment variables (without exposing values)
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
      console.log('🔧 Environment check:', {
        hasSupabaseUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        urlPrefix: supabaseUrl?.substring(0, 20)
      });

      // Only verify JWT if environment variables are available
      if (supabaseUrl && supabaseAnonKey) {
        try {
          // Create Supabase client to verify JWT
          console.log('🔐 Creating Supabase client for JWT verification...');
          const supabaseClient = createClient(
            supabaseUrl,
            supabaseAnonKey,
            {
              global: {
                headers: { Authorization: authHeader },
              },
            }
          );

          // Verify the user is authenticated
          console.log('🔐 Verifying JWT token...');
          const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

          if (authError) {
            console.warn('⚠️ JWT verification failed (continuing anyway):', {
              message: authError.message,
              status: authError.status,
            });
          } else if (user) {
            authenticatedUser = user;
            console.log('✅ User authenticated:', user.email);
          } else {
            console.warn('⚠️ No user returned from JWT verification (continuing anyway)');
          }
        } catch (verificationError) {
          console.warn('⚠️ JWT verification error (continuing anyway):', verificationError.message);
        }
      } else {
        console.warn('⚠️ Supabase environment variables not set - skipping JWT verification');
      }
    } else {
      console.log('ℹ️ No auth header provided - proceeding without authentication');
    }

    const body: LLMRequest = await req.json();
    console.log('📥 Request body parsed');
    console.log('Provider:', body.provider);
    console.log('Model:', body.model);
    console.log('Has messages:', !!body.messages);
    console.log('Has prompt:', !!body.prompt);
    console.log('Message count:', body.messages?.length);

    const { provider, model, prompt, messages, system_prompt, temperature, max_tokens, response_json_schema } = body;

    // Validate required fields
    if (!provider || (!prompt && !messages)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: provider, and either prompt or messages' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let response: LLMResponse;

    // Handle Anthropic Claude API
    if (provider === 'claude' || provider === 'anthropic') {
      console.log('🤖 Using Claude provider');

      const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not configured in Supabase secrets');
      }

      console.log('API Key exists:', !!apiKey);
      console.log('API Key prefix:', apiKey.substring(0, 10) + '...');

      const anthropic = new Anthropic({
        apiKey: apiKey,
        defaultHeaders: {
          'anthropic-version': '2023-06-01'  // Required API version header
        }
      });

      // Build messages array
      let messagesToSend;
      if (messages) {
        messagesToSend = messages;
        console.log('📝 Using message history:', messages.length, 'messages');
      } else {
        messagesToSend = [{ role: 'user', content: prompt! }];
        console.log('📝 Using simple prompt');
      }

      const requestParams: any = {
        model: model || 'claude-sonnet-4-5-20250929',  // Dated version (recommended for production)
        max_tokens: max_tokens || 4000,
        temperature: temperature ?? 0.7,
        messages: messagesToSend,
      };

      // Add system prompt if provided
      let finalSystemPrompt = system_prompt || '';

      // If JSON schema is requested, add JSON instructions to system prompt
      if (response_json_schema) {
        console.log('📋 JSON schema requested, adding JSON output instructions');
        const jsonInstruction = '\n\nIMPORTANT: You must respond with ONLY valid JSON matching this schema:\n' +
          JSON.stringify(response_json_schema, null, 2) +
          '\n\nDo not include any explanatory text, markdown formatting, or code blocks. Return ONLY the raw JSON object.';
        finalSystemPrompt = finalSystemPrompt ? finalSystemPrompt + jsonInstruction : jsonInstruction.trim();
      }

      if (finalSystemPrompt) {
        requestParams.system = finalSystemPrompt;
        console.log('📋 System prompt length:', finalSystemPrompt.length);
      }

      console.log('🚀 Calling Anthropic API...');
      console.log('Model:', requestParams.model);
      console.log('Max tokens:', requestParams.max_tokens);
      console.log('Temperature:', requestParams.temperature);

      const anthropicResponse = await anthropic.messages.create(requestParams);

      console.log('✅ Anthropic response received');
      console.log('Content length:', anthropicResponse.content[0].text.length);
      console.log('Input tokens:', anthropicResponse.usage.input_tokens);
      console.log('Output tokens:', anthropicResponse.usage.output_tokens);

      // Clean response content if JSON schema was requested
      let responseContent = anthropicResponse.content[0].text;
      if (response_json_schema) {
        // Strip markdown code blocks (```json ... ``` or ``` ... ```)
        responseContent = responseContent
          .replace(/^```(?:json)?\s*/i, '')  // Remove opening ```json or ```
          .replace(/\s*```\s*$/i, '')        // Remove closing ```
          .trim();
        console.log('🧹 Cleaned JSON response (removed markdown code blocks)');
      }

      response = {
        content: responseContent,
        usage: {
          input_tokens: anthropicResponse.usage.input_tokens,
          output_tokens: anthropicResponse.usage.output_tokens,
        },
        model: anthropicResponse.model,
      };
    }
    // Handle OpenAI API
    else if (provider === 'openai') {
      console.log('🤖 Using OpenAI provider');

      const apiKey = Deno.env.get('OPENAI_API_KEY');
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured in Supabase secrets');
      }

      // Build messages array
      let messagesToSend;
      if (messages) {
        messagesToSend = messages;
        if (system_prompt) {
          messagesToSend = [
            { role: 'system', content: system_prompt },
            ...messages
          ];
        }
      } else {
        messagesToSend = [{ role: 'user', content: prompt! }];
        if (system_prompt) {
          messagesToSend.unshift({ role: 'system', content: system_prompt });
        }
      }

      const requestBody: any = {
        model: model || 'gpt-4o',
        messages: messagesToSend,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens || 4000,
      };

      if (response_json_schema) {
        requestBody.response_format = { type: 'json_object' };
      }

      console.log('🚀 Calling OpenAI API...');
      console.log('Model:', requestBody.model);

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const openaiData = await openaiResponse.json();

      console.log('✅ OpenAI response received');
      console.log('Content length:', openaiData.choices[0].message.content.length);

      response = {
        content: openaiData.choices[0].message.content,
        usage: {
          input_tokens: openaiData.usage.prompt_tokens,
          output_tokens: openaiData.usage.completion_tokens,
        },
        model: openaiData.model,
      };
    }
    // Handle xAI/Grok API
    else if (provider === 'xai' || provider === 'grok') {
      console.log('🤖 Using xAI/Grok provider');

      // Check for both XAI_API_KEY and GROK_API_KEY (legacy fallback)
      const apiKey = Deno.env.get('XAI_API_KEY') || Deno.env.get('GROK_API_KEY');
      if (!apiKey) {
        console.error('❌ Missing xAI API key in Supabase environment');
        throw new Error('XAI_API_KEY not configured in Supabase secrets. Please set it in: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/functions');
      }

      console.log('✅ xAI API key found');

      // Build messages array
      let messagesToSend;
      if (messages) {
        messagesToSend = messages;
        if (system_prompt) {
          messagesToSend = [
            { role: 'system', content: system_prompt },
            ...messages
          ];
        }
      } else {
        messagesToSend = [{ role: 'user', content: prompt! }];
        if (system_prompt) {
          messagesToSend.unshift({ role: 'system', content: system_prompt });
        }
      }

      const requestBody: any = {
        model: model || 'grok-2-1212',
        messages: messagesToSend,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens || 8000,
        stream: false,
      };

      console.log('🚀 Calling xAI API...');
      console.log('Model:', requestBody.model);

      const xaiResponse = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!xaiResponse.ok) {
        const errorText = await xaiResponse.text();
        console.error('❌ xAI API error response:', {
          status: xaiResponse.status,
          statusText: xaiResponse.statusText,
          body: errorText
        });

        let errorMessage = 'Unknown error';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorData.message || JSON.stringify(errorData);
        } catch (e) {
          errorMessage = errorText || xaiResponse.statusText;
        }

        throw new Error(`xAI API error (${xaiResponse.status}): ${errorMessage}`);
      }

      const xaiData = await xaiResponse.json();

      console.log('✅ xAI response received');
      console.log('Content length:', xaiData.choices[0].message.content.length);

      response = {
        content: xaiData.choices[0].message.content,
        usage: {
          input_tokens: xaiData.usage.prompt_tokens || 0,
          output_tokens: xaiData.usage.completion_tokens || 0,
        },
        model: xaiData.model,
      };
    }
    // Handle Perplexity API
    else if (provider === 'perplexity') {
      console.log('🤖 Using Perplexity provider');

      const apiKey = Deno.env.get('PERPLEXITY_API_KEY');
      if (!apiKey) {
        throw new Error('PERPLEXITY_API_KEY not configured in Supabase secrets');
      }

      // Build messages array
      let messagesToSend;
      if (messages) {
        messagesToSend = messages;
        if (system_prompt) {
          messagesToSend = [
            { role: 'system', content: system_prompt },
            ...messages
          ];
        }
      } else {
        messagesToSend = [{ role: 'user', content: prompt! }];
        if (system_prompt) {
          messagesToSend.unshift({ role: 'system', content: system_prompt });
        }
      }

      const requestBody: any = {
        model: model || 'sonar-pro',
        messages: messagesToSend,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens || 4000,
      };

      console.log('🚀 Calling Perplexity API...');
      console.log('Model:', requestBody.model);

      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!perplexityResponse.ok) {
        const errorData = await perplexityResponse.json();
        throw new Error(`Perplexity API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const perplexityData = await perplexityResponse.json();

      console.log('✅ Perplexity response received');
      console.log('Content length:', perplexityData.choices[0].message.content.length);

      response = {
        content: perplexityData.choices[0].message.content,
        usage: {
          input_tokens: perplexityData.usage.prompt_tokens || 0,
          output_tokens: perplexityData.usage.completion_tokens || 0,
        },
        model: perplexityData.model,
      };
    } else {
      return new Response(
        JSON.stringify({ error: `Unsupported provider: ${provider}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`⏱️ Total duration: ${duration}ms`);
    console.log('========================================');

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌❌❌ ERROR INVOKING LLM ❌❌❌');
    console.error('Error type:', error.constructor?.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error(`⏱️ Failed after: ${duration}ms`);
    console.error('========================================');

    return new Response(
      JSON.stringify({
        error: 'Failed to invoke LLM',
        message: error.message,
        details: error.toString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
