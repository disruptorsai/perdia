/**
 * GROK API CLIENT (xAI)
 * =====================
 * Client for Grok AI model by xAI (Elon Musk's company)
 *
 * Purpose: Primary content generation for Perdia V2
 * Why Grok?
 *   - More human-like writing style
 *   - Access to X/Twitter data (real-time trends)
 *   - Natural stylistic variation (helps avoid AI detection)
 *   - Better understanding of recent SEO updates
 *
 * API Documentation: https://docs.x.ai/
 *
 * SECURITY: All API calls route through Supabase Edge Functions
 * to prevent exposing API keys to the client.
 *
 * Usage:
 *   import { invokeGrok, GROK_MODELS } from '@/lib/grok-client';
 *
 *   const response = await invokeGrok({
 *     prompt: 'Write a blog article about...',
 *     temperature: 0.8,
 *     maxTokens: 4000
 *   });
 */

import { supabase } from './supabase-client';

// =====================================================
// MODEL CONFIGURATIONS
// =====================================================

export const GROK_MODELS = {
  'grok-2': 'grok-2',                     // Full Grok 2 (recommended)
  'grok-2-mini': 'grok-2-mini',           // Faster, cheaper variant
  'grok-beta': 'grok-beta',               // Beta version
  'default': 'grok-2'
};

// Grok pricing (as of Nov 2025 - example pricing)
const PRICING = {
  'grok-2': {
    input: 5,    // $ per 1M tokens
    output: 15   // $ per 1M tokens
  },
  'grok-2-mini': {
    input: 2,    // $ per 1M tokens
    output: 6    // $ per 1M tokens
  },
  'grok-beta': {
    input: 5,
    output: 15
  }
};

// =====================================================
// INVOKE GROK
// =====================================================

/**
 * Invoke Grok AI model via Supabase Edge Function
 *
 * @param {object} options - Grok invocation options
 * @param {string} [options.prompt] - Simple prompt string (for single-shot requests)
 * @param {string} [options.systemPrompt] - System prompt (for conversation-based requests)
 * @param {Array} [options.messages] - Message history (for conversation-based requests)
 * @param {string} [options.model='grok-2'] - Model to use
 * @param {number} [options.temperature=0.7] - Temperature (0-1, higher = more random)
 * @param {number} [options.maxTokens=4000] - Max tokens in response
 * @param {object} [options.responseSchema] - JSON schema for structured output (if supported)
 * @returns {Promise<object>} Response with content, model, usage, and cost
 */
export async function invokeGrok(options) {
  const {
    prompt,
    systemPrompt,
    messages,
    model = 'grok-2',
    temperature = 0.7,
    maxTokens = 4000,
    responseSchema = null,
  } = options;

  console.log('[Grok] Invoking model:', model);

  try {
    // Call via Supabase Edge Function (400s timeout)
    const { data, error } = await supabase.functions.invoke('invoke-grok', {
      body: {
        prompt,
        systemPrompt,
        messages,
        model: GROK_MODELS[model] || model,
        temperature,
        maxTokens,
        responseSchema,
      }
    });

    if (error) {
      console.error('[Grok] API error:', error);
      throw new Error(`Grok API failed: ${error.message}`);
    }

    if (!data || !data.content) {
      throw new Error('Grok API returned empty response');
    }

    const cost = calculateGrokCost(data.model, data.usage);

    console.log('[Grok] Success:', {
      model: data.model,
      tokens: data.usage?.total_tokens || 0,
      cost: `$${cost.toFixed(4)}`
    });

    return {
      content: data.content,
      model: data.model,
      usage: data.usage,
      cost,
    };
  } catch (error) {
    console.error('[Grok] Invocation failed:', error);
    throw error;
  }
}

/**
 * Calculate cost for Grok API usage
 * @private
 */
function calculateGrokCost(model, usage) {
  if (!usage) return 0;

  const modelKey = Object.keys(GROK_MODELS).find(k => GROK_MODELS[k] === model) || 'grok-2';
  const pricing = PRICING[modelKey] || PRICING['grok-2'];

  const inputCost = (usage.prompt_tokens / 1000000) * pricing.input;
  const outputCost = (usage.completion_tokens / 1000000) * pricing.output;

  return inputCost + outputCost;
}

// =====================================================
// SPECIALIZED FUNCTIONS
// =====================================================

/**
 * Generate blog article with Grok (Stage 1 of pipeline)
 *
 * @param {string} topicQuestion - Question to answer
 * @param {string} userInstructions - Additional instructions
 * @param {object} options - Additional options
 * @returns {Promise<object>} Generated article
 */
export async function generateBlogArticle(topicQuestion, userInstructions = '', options = {}) {
  const {
    wordCountTarget = '1500-2500',
    includeImages = true,
    temperature = 0.8, // Higher for more natural variation
  } = options;

  const systemPrompt = `
You are a professional blog writer for GetEducated.com, a leading source of
information about higher education, college degrees, and online learning.

WRITING STYLE:
- Natural, conversational tone (like talking to a friend)
- Vary sentence length: mix short punchy sentences with longer, flowing ones
- Use occasional colloquialisms and relatable examples
- Include narrative elements (stories, scenarios) when appropriate
- Avoid overly perfect or robotic language
- Break patterns: don't follow the same structure every time

CONTENT STRUCTURE:
- Start with a clear introduction that addresses the question
- Use H2 and H3 headings to organize sections
- Include bullet points and numbered lists where helpful
- Add a brief conclusion or call-to-action
- Aim for ${wordCountTarget} words

SEO & CITATIONS:
- Naturally incorporate relevant keywords (don't stuff)
- Use [CITATION NEEDED] tags where data or claims require sources
- Suggest 2-4 internal links to related GetEducated.com pages using format:
  [ge_internal_link url="/related-page"]anchor text[/ge_internal_link]
- Include at least one real-world example or case study

AVOID:
- Perfect grammar every time (occasional minor variations are human)
- Repetitive sentence structures
- Overused transitions ("Moreover", "Furthermore", "In conclusion")
- Overly formal academic language
- AI-sounding phrases like "It's important to note that..."

Your goal is to create content that is helpful, engaging, and passes as
human-written while maintaining high quality and accuracy.
  `.trim();

  const prompt = `
Topic Question: ${topicQuestion}

${userInstructions ? `Additional Instructions: ${userInstructions}` : ''}

Write a comprehensive blog article that directly answers this question.

Format: HTML with proper heading structure (H2, H3, etc.)
${includeImages ? '\nInclude [IMAGE: description] tags where you think images would enhance the content.' : ''}
  `.trim();

  const response = await invokeGrok({
    systemPrompt,
    prompt,
    temperature,
    maxTokens: 4000,
  });

  return {
    content: response.content,
    model: response.model,
    usage: response.usage,
    cost: response.cost,
  };
}

/**
 * Search X/Twitter for trending topics (using Grok's native access)
 *
 * @param {string} topic - Topic to search (e.g., "college degrees", "higher education")
 * @param {number} limit - Number of trends to return
 * @returns {Promise<Array>} List of trending topics with context
 */
export async function searchTrendingTopics(topic, limit = 10) {
  const prompt = `
Search X (Twitter) for the most talked-about topics related to "${topic}" in the last 24 hours.

Return a JSON array of the top ${limit} trending topics/questions with this format:
[
  {
    "topic": "Brief topic or question",
    "context": "Why it's trending (1-2 sentences)",
    "sentiment": "positive|neutral|negative",
    "volume": "high|medium|low"
  }
]

Only return the JSON array, no additional text.
  `.trim();

  const response = await invokeGrok({
    prompt,
    temperature: 0.3, // Lower for more focused results
    maxTokens: 2000,
  });

  try {
    // Try to parse JSON response
    const trends = JSON.parse(response.content);
    return trends;
  } catch (error) {
    console.error('[Grok] Failed to parse trending topics:', error);
    // Fallback: return raw content
    return [{
      topic: response.content.substring(0, 200),
      context: 'Failed to parse structured data',
      sentiment: 'neutral',
      volume: 'unknown'
    }];
  }
}

/**
 * Rewrite article based on feedback
 *
 * @param {string} originalContent - Original article content
 * @param {string} feedback - Feedback/instructions for rewrite
 * @returns {Promise<object>} Rewritten article
 */
export async function rewriteArticleWithFeedback(originalContent, feedback) {
  const prompt = `
Here is an article that needs to be rewritten based on editor feedback:

ORIGINAL ARTICLE:
${originalContent}

EDITOR FEEDBACK:
${feedback}

Please rewrite the article addressing the feedback while maintaining:
- The core message and structure
- Natural, human-like writing style
- Proper HTML formatting

Return only the rewritten article content.
  `.trim();

  const response = await invokeGrok({
    prompt,
    temperature: 0.8,
    maxTokens: 4000,
  });

  return {
    content: response.content,
    model: response.model,
    usage: response.usage,
    cost: response.cost,
  };
}
