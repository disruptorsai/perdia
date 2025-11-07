/**
 * PERDIA EDUCATION - AI CLIENT
 * ============================
 * Unified AI interface supporting both Anthropic Claude and OpenAI
 *
 * SECURITY: All AI API calls are routed through Netlify serverless functions
 * to prevent exposing API keys to the client.
 *
 * This module provides a single interface for LLM operations across
 * multiple providers, maintaining client-configurable AI provider selection.
 *
 * SUPPORTED PROVIDERS:
 * - Anthropic Claude (primary for content generation)
 * - OpenAI GPT (secondary for specialized tasks)
 *
 * Usage:
 *   import { invokeLLM, generateImage } from '@/lib/ai-client';
 *
 *   const response = await invokeLLM({
 *     prompt: 'Write an SEO article...',
 *     provider: 'claude', // or 'openai'
 *     responseSchema: { ... }
 *   });
 */

// =====================================================
// MODEL CONFIGURATIONS
// =====================================================

const CLAUDE_MODELS = {
  'claude-3-5-sonnet': 'claude-3-sonnet-20240229',
  'claude-3-5-haiku': 'claude-3-haiku-20240307',
  'claude-3-opus': 'claude-3-opus-20240229',
  'default': 'claude-3-sonnet-20240229',
};

const OPENAI_MODELS = {
  'gpt-4o': 'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
  'gpt-4-turbo': 'gpt-4-turbo-preview',
  'gpt-3.5-turbo': 'gpt-3.5-turbo',
  'default': 'gpt-4o',
};

// Get default provider from environment or fallback to claude
const DEFAULT_PROVIDER = import.meta.env.VITE_DEFAULT_AI_PROVIDER || 'claude';

// =====================================================
// INVOKE LLM (UNIFIED INTERFACE)
// =====================================================

/**
 * Invoke LLM with unified interface
 * Routes requests through Netlify serverless function for security
 *
 * @param {object} options - LLM invocation options
 * @param {string} [options.prompt] - Simple prompt string (for single-shot requests)
 * @param {string} [options.systemPrompt] - System prompt (for conversation-based requests)
 * @param {Array} [options.messages] - Message history (for conversation-based requests)
 * @param {object} [options.responseSchema] - JSON schema for structured output
 * @param {string} [options.provider='claude'] - 'claude' or 'openai'
 * @param {string} [options.model] - Specific model override
 * @param {number} [options.temperature=0.7] - Temperature (0-1)
 * @param {number} [options.maxTokens=4000] - Max tokens in response
 * @returns {Promise<string|object>} Response text or parsed JSON
 */
export async function invokeLLM(options) {
  const {
    prompt,
    systemPrompt,
    messages,
    responseSchema,
    provider = DEFAULT_PROVIDER,
    model,
    temperature = 0.7,
    maxTokens = 4000,
  } = options;

  // Support both simple prompt and conversation-based messages
  if (!prompt && !messages) {
    throw new Error('Either prompt or messages is required');
  }

  try {
    // Determine the actual model to use
    let actualModel;
    if (provider === 'claude' || provider === 'anthropic') {
      actualModel = model || CLAUDE_MODELS.default;
    } else if (provider === 'openai' || provider === 'gpt') {
      actualModel = model || OPENAI_MODELS.default;
    } else {
      // Default to Claude
      actualModel = CLAUDE_MODELS.default;
    }

    // Build request body - support both simple prompt and conversation messages
    const requestBody = {
      provider: provider === 'anthropic' ? 'claude' : provider,
      model: actualModel,
      temperature,
      max_tokens: maxTokens,
      response_json_schema: responseSchema,
    };

    // Add prompt OR messages + systemPrompt
    if (messages) {
      requestBody.messages = messages;
      if (systemPrompt) {
        requestBody.system_prompt = systemPrompt;
      }
    } else {
      requestBody.prompt = prompt;
    }

    // Call Netlify serverless function (secure - API keys on server)
    const response = await fetch('/.netlify/functions/invoke-llm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to invoke LLM');
    }

    const data = await response.json();

    // Parse JSON response if schema was provided
    if (responseSchema && data.content) {
      try {
        return JSON.parse(data.content);
      } catch (e) {
        console.warn('Failed to parse JSON response, returning raw text');
        return data.content;
      }
    }

    return data.content;
  } catch (error) {
    console.error('InvokeLLM error:', error);
    throw error;
  }
}

// =====================================================
// IMAGE GENERATION
// =====================================================

/**
 * Generate image using AI
 * Currently uses DALL-E 3 via OpenAI
 *
 * @param {object} options - Image generation options
 * @param {string} options.prompt - Description of the image
 * @param {string} [options.size='1024x1024'] - Image size
 * @param {string} [options.quality='standard'] - Image quality
 * @param {string} [options.style='natural'] - Image style
 * @returns {Promise<string>} Image URL
 */
export async function generateImage(options) {
  const {
    prompt,
    size = '1024x1024',
    quality = 'standard',
    style = 'natural',
  } = options;

  if (!prompt) {
    throw new Error('Prompt is required for image generation');
  }

  try {
    // TODO: Create a separate Netlify function for image generation
    // For now, return placeholder or throw error
    throw new Error('Image generation not yet implemented. Please create a Netlify function for this feature.');
  } catch (error) {
    console.error('GenerateImage error:', error);
    throw error;
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get available models for a provider
 * @param {string} provider - 'claude' or 'openai'
 * @returns {object} Available models
 */
export function getAvailableModels(provider = 'claude') {
  if (provider === 'claude' || provider === 'anthropic') {
    return CLAUDE_MODELS;
  } else if (provider === 'openai' || provider === 'gpt') {
    return OPENAI_MODELS;
  }
  return CLAUDE_MODELS;
}

/**
 * Get default provider
 * @returns {string} Default provider name
 */
export function getDefaultProvider() {
  return DEFAULT_PROVIDER;
}

// Export for backward compatibility
export default {
  invokeLLM,
  generateImage,
  getAvailableModels,
  getDefaultProvider,
};
