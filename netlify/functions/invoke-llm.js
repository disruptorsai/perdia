/**
 * Netlify Serverless Function: AI LLM Invocation
 *
 * This function securely handles AI API calls server-side,
 * preventing API keys from being exposed to the client.
 *
 * Supported providers:
 * - Anthropic Claude
 * - OpenAI
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export const handler = async (event) => {
  console.log('========================================');
  console.log('INVOKE-LLM FUNCTION CALLED');
  console.log('Time:', new Date().toISOString());
  console.log('========================================');

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('❌ Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    console.log('📥 Request body parsed');
    console.log('Provider:', body.provider);
    console.log('Model:', body.model);
    console.log('Has messages:', !!body.messages);
    console.log('Has prompt:', !!body.prompt);
    console.log('Message count:', body.messages?.length);

    const { provider, model, prompt, messages, system_prompt, temperature, max_tokens, response_json_schema } = body;

    // Validate required fields - support both simple prompt and conversation messages
    if (!provider || (!prompt && !messages)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: provider, and either prompt or messages' }),
      };
    }

    let response;

    // Handle Claude API
    if (provider === 'claude') {
      console.log('🤖 Using Claude provider');
      console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
      console.log('API Key prefix:', process.env.ANTHROPIC_API_KEY?.substring(0, 10) + '...');

      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY, // Server-side env var (no VITE_ prefix)
        defaultHeaders: {
          'anthropic-version': '2023-06-01'  // REQUIRED - Current API version
        }
      });

      // Build messages array - support both simple prompt and conversation messages
      let messagesToSend;
      if (messages) {
        // Conversation mode with message history
        messagesToSend = messages;
        console.log('📝 Using message history:', messages.length, 'messages');
      } else {
        // Simple prompt mode
        messagesToSend = [{ role: 'user', content: prompt }];
        console.log('📝 Using simple prompt');
      }

      const requestParams = {
        model: model || 'claude-sonnet-4-5-20250929',  // Claude Sonnet 4.5 (PRIMARY)
        max_tokens: max_tokens || 4000,
        temperature: temperature || 0.7,
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

      response = {
        content: anthropicResponse.content[0].text,
        usage: {
          input_tokens: anthropicResponse.usage.input_tokens,
          output_tokens: anthropicResponse.usage.output_tokens,
        },
        model: anthropicResponse.model,
      };
    }
    // Handle OpenAI API
    else if (provider === 'openai') {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY, // Server-side env var (no VITE_ prefix)
      });

      // Build messages array - support both simple prompt and conversation messages
      let messagesToSend;
      if (messages) {
        // Conversation mode with message history
        messagesToSend = messages;

        // Add system message at the beginning if system_prompt provided
        if (system_prompt) {
          messagesToSend = [
            { role: 'system', content: system_prompt },
            ...messages
          ];
        }
      } else {
        // Simple prompt mode
        messagesToSend = [{ role: 'user', content: prompt }];

        // Add system message if provided
        if (system_prompt) {
          messagesToSend.unshift({ role: 'system', content: system_prompt });
        }
      }

      const chatCompletion = await openai.chat.completions.create({
        model: model || 'gpt-4o',
        messages: messagesToSend,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 4000,
        ...(response_json_schema && { response_format: { type: 'json_object' } }),
      });

      response = {
        content: chatCompletion.choices[0].message.content,
        usage: {
          input_tokens: chatCompletion.usage.prompt_tokens,
          output_tokens: chatCompletion.usage.completion_tokens,
        },
        model: chatCompletion.model,
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Unsupported provider: ${provider}` }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('❌❌❌ ERROR INVOKING LLM ❌❌❌');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error status:', error.status);
    console.error('Error response:', error.error);
    console.error('Full error:', JSON.stringify(error, null, 2));
    console.error('Stack trace:', error.stack);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to invoke LLM',
        message: error.message,
        status: error.status,
        details: error.error,
      }),
    };
  }
};
