/**
 * PERDIA EDUCATION - AI CLIENT
 * ============================
 * Unified AI interface supporting both Anthropic Claude and OpenAI
 *
 * This module provides a single interface for LLM operations across
 * multiple providers, maintaining client-configurable AI provider selection
 * as designed in the Base44 app.
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

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// =====================================================
// CLIENT INITIALIZATION
// =====================================================

// Anthropic Claude client
let anthropicClient = null;
function getAnthropicClient() {
  if (!anthropicClient) {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_ANTHROPIC_API_KEY environment variable not set');
    }
    anthropicClient = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }
  return anthropicClient;
}

// OpenAI client
let openaiClient = null;
function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_OPENAI_API_KEY environment variable not set');
    }
    openaiClient = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }
  return openaiClient;
}

// =====================================================
// MODEL CONFIGURATIONS
// =====================================================

const CLAUDE_MODELS = {
  'claude-3-5-sonnet': 'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku': 'claude-3-5-haiku-20241022',
  'claude-3-opus': 'claude-3-opus-20240229',
  'default': 'claude-3-5-sonnet-20241022',
};

const OPENAI_MODELS = {
  'gpt-4o': 'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
  'gpt-4-turbo': 'gpt-4-turbo-preview',
  'gpt-3.5-turbo': 'gpt-3.5-turbo',
  'default': 'gpt-4o',
};

// =====================================================
// INVOKE LLM (UNIFIED INTERFACE)
// =====================================================

/**
 * Invoke LLM with unified interface
 *
 * @param {object} options - LLM invocation options
 * @param {string} options.prompt - The prompt to send to the LLM
 * @param {object} [options.responseSchema] - JSON schema for structured output
 * @param {string} [options.provider='claude'] - 'claude' or 'openai'
 * @param {string} [options.model] - Specific model override
 * @param {number} [options.temperature=0.7] - Temperature (0-1)
 * @param {number} [options.maxTokens=4000] - Max tokens in response
 * @param {boolean} [options.stream=false] - Enable streaming
 * @param {array} [options.messages] - Full message history (optional)
 * @param {string} [options.systemPrompt] - System prompt (optional)
 * @returns {Promise<string|object>} Response text or parsed JSON
 */
export async function invokeLLM(options) {
  const {
    prompt,
    responseSchema,
    provider = 'claude',
    model,
    temperature = 0.7,
    maxTokens = 4000,
    stream = false,
    messages,
    systemPrompt,
  } = options;

  try {
    // Route to appropriate provider
    if (provider === 'claude' || provider === 'anthropic') {
      return await invokeClaud(options);
    } else if (provider === 'openai' || provider === 'gpt') {
      return await invokeOpenAI(options);
    } else {
      // Default to Claude
      console.warn(`Unknown provider: ${provider}, defaulting to Claude`);
      return await invokeClaude(options);
    }
  } catch (error) {
    console.error('InvokeLLM error:', error);
    throw error;
  }
}

// =====================================================
// CLAUDE IMPLEMENTATION
// =====================================================

/**
 * Invoke Anthropic Claude
 * @param {object} options - Same as invokeLLM
 * @returns {Promise<string|object>}
 */
async function invokeClaude(options) {
  const {
    prompt,
    responseSchema,
    model,
    temperature = 0.7,
    maxTokens = 4000,
    stream = false,
    messages,
    systemPrompt,
  } = options;

  const client = getAnthropicClient();

  // Build messages array
  let messageArray;
  if (messages && Array.isArray(messages)) {
    // Use provided message history
    messageArray = messages;
  } else {
    // Single user message
    messageArray = [{ role: 'user', content: prompt }];
  }

  // Build request parameters
  const requestParams = {
    model: model || CLAUDE_MODELS.default,
    max_tokens: maxTokens,
    temperature,
    messages: messageArray,
  };

  // Add system prompt if provided
  if (systemPrompt) {
    requestParams.system = systemPrompt;
  }

  // Handle structured output (JSON schema)
  if (responseSchema) {
    // Claude doesn't have native JSON mode like OpenAI, so we add instructions
    const jsonInstruction = `\n\nRespond ONLY with valid JSON matching this schema:\n${JSON.stringify(responseSchema, null, 2)}`;

    // Append to last user message
    const lastMessage = messageArray[messageArray.length - 1];
    if (lastMessage.role === 'user') {
      lastMessage.content += jsonInstruction;
    } else {
      messageArray.push({ role: 'user', content: jsonInstruction });
    }
  }

  // Make API call
  if (stream) {
    // Streaming not implemented in this version
    throw new Error('Streaming not yet implemented for Claude');
  } else {
    const response = await client.messages.create(requestParams);

    // Extract text content
    const textContent = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    // Parse JSON if schema was provided
    if (responseSchema) {
      try {
        return JSON.parse(textContent);
      } catch (error) {
        console.error('Failed to parse Claude JSON response:', textContent);
        throw new Error('Claude returned invalid JSON');
      }
    }

    return textContent;
  }
}

// =====================================================
// OPENAI IMPLEMENTATION
// =====================================================

/**
 * Invoke OpenAI GPT
 * @param {object} options - Same as invokeLLM
 * @returns {Promise<string|object>}
 */
async function invokeOpenAI(options) {
  const {
    prompt,
    responseSchema,
    model,
    temperature = 0.7,
    maxTokens = 4000,
    stream = false,
    messages,
    systemPrompt,
  } = options;

  const client = getOpenAIClient();

  // Build messages array
  let messageArray = [];

  // Add system message if provided
  if (systemPrompt) {
    messageArray.push({ role: 'system', content: systemPrompt });
  }

  // Add message history or single prompt
  if (messages && Array.isArray(messages)) {
    messageArray = messageArray.concat(messages);
  } else {
    messageArray.push({ role: 'user', content: prompt });
  }

  // Build request parameters
  const requestParams = {
    model: model || OPENAI_MODELS.default,
    messages: messageArray,
    temperature,
    max_tokens: maxTokens,
  };

  // Handle structured output (JSON mode)
  if (responseSchema) {
    // OpenAI has native JSON mode
    requestParams.response_format = { type: 'json_object' };

    // Add JSON instruction to prompt
    const jsonInstruction = `\n\nRespond ONLY with valid JSON matching this schema:\n${JSON.stringify(responseSchema, null, 2)}`;
    const lastMessage = messageArray[messageArray.length - 1];
    if (lastMessage.role === 'user') {
      lastMessage.content += jsonInstruction;
    }
  }

  // Make API call
  if (stream) {
    // Streaming not implemented in this version
    throw new Error('Streaming not yet implemented for OpenAI');
  } else {
    const response = await client.chat.completions.create(requestParams);

    const textContent = response.choices[0].message.content;

    // Parse JSON if schema was provided
    if (responseSchema) {
      try {
        return JSON.parse(textContent);
      } catch (error) {
        console.error('Failed to parse OpenAI JSON response:', textContent);
        throw new Error('OpenAI returned invalid JSON');
      }
    }

    return textContent;
  }
}

// =====================================================
// IMAGE GENERATION
// =====================================================

/**
 * Generate image using AI
 *
 * @param {object} options - Image generation options
 * @param {string} options.prompt - Image description
 * @param {string} [options.size='1024x1024'] - Image size
 * @param {string} [options.quality='standard'] - Image quality
 * @param {string} [options.style='natural'] - Image style
 * @param {string} [options.provider='openai'] - 'openai' (more providers coming)
 * @returns {Promise<object>} { url, revisedPrompt }
 */
export async function generateImage(options) {
  const {
    prompt,
    size = '1024x1024',
    quality = 'standard',
    style = 'natural',
    provider = 'openai',
  } = options;

  try {
    if (provider === 'openai') {
      return await generateImageOpenAI(options);
    } else {
      throw new Error(`Unsupported image generation provider: ${provider}`);
    }
  } catch (error) {
    console.error('GenerateImage error:', error);
    throw error;
  }
}

/**
 * Generate image using OpenAI DALL-E
 * @param {object} options
 * @returns {Promise<object>}
 */
async function generateImageOpenAI(options) {
  const {
    prompt,
    size = '1024x1024',
    quality = 'standard',
    style = 'natural',
  } = options;

  const client = getOpenAIClient();

  const response = await client.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size,
    quality,
    style,
  });

  return {
    url: response.data[0].url,
    revisedPrompt: response.data[0].revised_prompt,
  };
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Count tokens in text (approximate)
 * @param {string} text
 * @returns {number}
 */
export function estimateTokens(text) {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to fit within token limit
 * @param {string} text
 * @param {number} maxTokens
 * @returns {string}
 */
export function truncateToTokens(text, maxTokens) {
  const estimatedTokens = estimateTokens(text);
  if (estimatedTokens <= maxTokens) {
    return text;
  }

  // Truncate to approximate character limit
  const maxChars = maxTokens * 4;
  return text.substring(0, maxChars) + '...';
}

/**
 * Build conversation context from message history
 * @param {array} messages - Array of {role, content}
 * @returns {array}
 */
export function buildConversationContext(messages) {
  // Filter and format messages
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * Extract JSON from markdown code blocks
 * Handles cases where LLM wraps JSON in ```json ... ```
 * @param {string} text
 * @returns {object}
 */
export function extractJSON(text) {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch (e) {
    // Look for JSON in code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    throw new Error('No valid JSON found in response');
  }
}

/**
 * Validate response against schema (basic validation)
 * @param {object} response
 * @param {object} schema
 * @returns {boolean}
 */
export function validateResponse(response, schema) {
  if (!schema || !schema.properties) {
    return true;
  }

  for (const [key, propSchema] of Object.entries(schema.properties)) {
    if (propSchema.required && !(key in response)) {
      console.error(`Missing required property: ${key}`);
      return false;
    }

    if (key in response) {
      const expectedType = propSchema.type;
      const actualType = typeof response[key];

      if (expectedType === 'array' && !Array.isArray(response[key])) {
        console.error(`Property ${key} should be array, got ${actualType}`);
        return false;
      }

      if (expectedType !== 'array' && expectedType !== actualType) {
        console.error(`Property ${key} should be ${expectedType}, got ${actualType}`);
        return false;
      }
    }
  }

  return true;
}

// =====================================================
// PRESET PROMPTS (PERDIA-SPECIFIC)
// =====================================================

/**
 * SEO article generation prompt
 * @param {string} keyword
 * @param {number} wordCount
 * @returns {string}
 */
export function seoArticlePrompt(keyword, wordCount = 2000) {
  return `Write a comprehensive, SEO-optimized article about "${keyword}".

Requirements:
- Target word count: ${wordCount} words
- Include H2 and H3 headings for structure
- Natural keyword integration (avoid keyword stuffing)
- Include internal linking opportunities (mark with [LINK: topic])
- Add FAQ section with 3-5 common questions
- Write in engaging, informative tone
- Include actionable takeaways

Format the article in markdown.`;
}

/**
 * Content optimization prompt
 * @param {string} existingContent
 * @param {array} targetKeywords
 * @returns {string}
 */
export function contentOptimizationPrompt(existingContent, targetKeywords) {
  return `Analyze and improve this content for SEO:

EXISTING CONTENT:
${existingContent}

TARGET KEYWORDS: ${targetKeywords.join(', ')}

Provide specific recommendations for:
1. Keyword optimization (where to add target keywords naturally)
2. Heading structure improvements
3. Content gaps (what's missing)
4. Readability enhancements
5. Internal linking opportunities

Return as JSON with structure:
{
  "keyword_optimization": [...],
  "heading_improvements": [...],
  "content_gaps": [...],
  "readability_suggestions": [...],
  "internal_links": [...]
}`;
}

/**
 * Keyword research prompt
 * @param {string} seedKeyword
 * @returns {string}
 */
export function keywordResearchPrompt(seedKeyword) {
  return `Generate 20-30 related keyword suggestions for the seed keyword: "${seedKeyword}"

Include:
- Long-tail variations
- Question-based keywords
- Related topics
- Semantic variations

Return as JSON array:
[
  {
    "keyword": "...",
    "keyword_type": "short_tail" | "long_tail" | "question",
    "estimated_difficulty": 1-100,
    "search_intent": "informational" | "transactional" | "navigational"
  },
  ...
]`;
}

/**
 * Keyword clustering prompt
 * @param {array} keywords
 * @returns {string}
 */
export function keywordClusteringPrompt(keywords) {
  return `Cluster these keywords into logical topic groups:

KEYWORDS:
${keywords.map((k, i) => `${i + 1}. ${k}`).join('\n')}

Return as JSON:
{
  "clusters": [
    {
      "category": "...",
      "keywords": [...]
    },
    ...
  ]
}`;
}

// =====================================================
// EXPORTS
// =====================================================

export default {
  invokeLLM,
  generateImage,
  estimateTokens,
  truncateToTokens,
  buildConversationContext,
  extractJSON,
  validateResponse,
  // Preset prompts
  seoArticlePrompt,
  contentOptimizationPrompt,
  keywordResearchPrompt,
  keywordClusteringPrompt,
};
