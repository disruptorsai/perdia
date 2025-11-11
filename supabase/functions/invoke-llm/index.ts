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
  provider: 'claude' | 'openai' | 'anthropic';
  model?: string;
  prompt?: string;
  messages?: Array<{ role: string; content: string }>;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  response_json_schema?: any;
  // Cost tracking fields
  content_id?: string;  // Link to content_queue item
  agent_name?: string;   // Which agent is making this call
}

interface LLMResponse {
  content: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  model: string;
  cost?: {
    input_cost: number;
    output_cost: number;
    total_cost: number;
  };
}

// Token pricing (per 1 million tokens)
const TOKEN_PRICES = {
  // Claude Sonnet 4.5 (2025-09-29)
  'claude-sonnet-4-5-20250929': { input: 3.00, output: 15.00 },
  'claude-sonnet-4-5': { input: 3.00, output: 15.00 },
  // Claude Haiku 4.5 (2025-10-01)
  'claude-haiku-4-5-20251001': { input: 1.00, output: 5.00 },
  'claude-haiku-4-5': { input: 1.00, output: 5.00 },
  // Claude Opus 4.1 (2025-08-05)
  'claude-opus-4-1-20250805': { input: 15.00, output: 75.00 },
  'claude-opus-4-1': { input: 15.00, output: 75.00 },
  // OpenAI GPT-4o
  'gpt-4o': { input: 5.00, output: 15.00 },
  'gpt-4o-2024-08-06': { input: 2.50, output: 10.00 },
  // OpenAI GPT-4o-mini
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4o-mini-2024-07-18': { input: 0.15, output: 0.60 },
};

/**
 * Calculate cost based on token usage
 */
function calculateCost(model: string, inputTokens: number, outputTokens: number) {
  const pricing = TOKEN_PRICES[model] || TOKEN_PRICES['claude-sonnet-4-5']; // Default to Sonnet pricing

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  const totalCost = inputCost + outputCost;

  return {
    input_cost: inputCost,
    output_cost: outputCost,
    total_cost: totalCost,
    input_cost_per_token: pricing.input / 1_000_000,
    output_cost_per_token: pricing.output / 1_000_000,
  };
}

/**
 * Log AI usage to database for cost monitoring
 */
async function logAIUsage(
  supabaseClient: any,
  userId: string | null,
  contentId: string | null,
  provider: string,
  model: string,
  agentName: string | null,
  inputTokens: number,
  outputTokens: number,
  requestDuration: number,
  promptLength: number,
  success: boolean,
  errorMessage?: string
) {
  try {
    const cost = calculateCost(model, inputTokens, outputTokens);

    const logEntry = {
      content_id: contentId || null,
      user_id: userId || null,
      agent_name: agentName || null,
      provider,
      model,
      prompt_length: promptLength,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      input_cost_per_token: cost.input_cost_per_token,
      output_cost_per_token: cost.output_cost_per_token,
      request_duration_ms: requestDuration,
      response_success: success,
      error_message: errorMessage || null,
      cache_hit: false,  // TODO: Implement cache detection
      cache_savings_pct: 0,
    };

    const { error } = await supabaseClient
      .from('ai_usage_logs')
      .insert(logEntry);

    if (error) {
      console.error('⚠️ Failed to log AI usage:', error.message);
    } else {
      console.log('💰 AI usage logged - Total cost: $' + cost.total_cost.toFixed(6));
    }
  } catch (error) {
    console.error('⚠️ Error logging AI usage:', error.message);
  }
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

    const { provider, model, prompt, messages, system_prompt, temperature, max_tokens, response_json_schema, content_id, agent_name } = body;

    // Calculate prompt length for cost tracking
    const promptLength = prompt?.length || messages?.reduce((sum, m) => sum + m.content.length, 0) || 0;

    // Validate required fields
    if (!provider || (!prompt && !messages)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: provider, and either prompt or messages' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let response: LLMResponse;

    // Create Supabase client for logging (if environment variables available)
    let supabaseClient = null;
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseServiceKey) {
      supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    }

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
      if (system_prompt) {
        requestParams.system = system_prompt;
        console.log('📋 System prompt length:', system_prompt.length);
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

      // Calculate cost
      const cost = calculateCost(
        anthropicResponse.model,
        anthropicResponse.usage.input_tokens,
        anthropicResponse.usage.output_tokens
      );

      response = {
        content: anthropicResponse.content[0].text,
        usage: {
          input_tokens: anthropicResponse.usage.input_tokens,
          output_tokens: anthropicResponse.usage.output_tokens,
        },
        model: anthropicResponse.model,
        cost: {
          input_cost: cost.input_cost,
          output_cost: cost.output_cost,
          total_cost: cost.total_cost,
        },
      };

      // Log usage to database (async, don't wait)
      const duration = Date.now() - startTime;
      if (authenticatedUser) {
        logAIUsage(
          supabaseClient,
          authenticatedUser.id,
          content_id || null,
          provider,
          anthropicResponse.model,
          agent_name || null,
          anthropicResponse.usage.input_tokens,
          anthropicResponse.usage.output_tokens,
          duration,
          promptLength,
          true
        ).catch(err => console.error('Failed to log usage:', err));
      }
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

      // Calculate cost
      const cost = calculateCost(
        openaiData.model,
        openaiData.usage.prompt_tokens,
        openaiData.usage.completion_tokens
      );

      response = {
        content: openaiData.choices[0].message.content,
        usage: {
          input_tokens: openaiData.usage.prompt_tokens,
          output_tokens: openaiData.usage.completion_tokens,
        },
        model: openaiData.model,
        cost: {
          input_cost: cost.input_cost,
          output_cost: cost.output_cost,
          total_cost: cost.total_cost,
        },
      };

      // Log usage to database (async, don't wait)
      const duration = Date.now() - startTime;
      if (authenticatedUser && supabaseClient) {
        logAIUsage(
          supabaseClient,
          authenticatedUser.id,
          content_id || null,
          provider,
          openaiData.model,
          agent_name || null,
          openaiData.usage.prompt_tokens,
          openaiData.usage.completion_tokens,
          duration,
          promptLength,
          true
        ).catch(err => console.error('Failed to log usage:', err));
      }
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

    // Log failed request to database
    try {
      const body = await req.clone().json();
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (supabaseUrl && supabaseServiceKey && authenticatedUser) {
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        await logAIUsage(
          supabaseClient,
          authenticatedUser.id,
          body.content_id || null,
          body.provider || 'unknown',
          body.model || 'unknown',
          body.agent_name || null,
          0, // No tokens on error
          0,
          duration,
          body.prompt?.length || 0,
          false,
          error.message
        );
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

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
