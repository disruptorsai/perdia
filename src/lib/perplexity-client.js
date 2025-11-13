/**
 * PERPLEXITY API CLIENT
 * ======================
 * Client for Perplexity AI (fact-checking & research)
 *
 * Purpose: Stage 2 of content pipeline - verify facts, add citations
 * Why Perplexity?
 *   - Live web search capabilities
 *   - Source citations
 *   - Fact verification
 *   - Link validation
 *
 * API Documentation: https://docs.perplexity.ai/
 *
 * SECURITY: All API calls route through Supabase Edge Functions
 * to prevent exposing API keys to the client.
 *
 * Usage:
 *   import { invokePerplexity, verifyArticle } from '@/lib/perplexity-client';
 *
 *   const result = await verifyArticle(articleContent, title);
 */

import { supabase } from './supabase-client';

// =====================================================
// MODEL CONFIGURATIONS
// =====================================================

// Perplexity updated models in January 2025
// https://docs.perplexity.ai/getting-started/models
export const PERPLEXITY_MODELS = {
  'sonar': 'sonar',                           // Fast, lightweight with citations
  'sonar-pro': 'sonar-pro',                   // Advanced with more citations (RECOMMENDED)
  'sonar-reasoning': 'sonar-reasoning',       // For problem-solving tasks
  'sonar-reasoning-pro': 'sonar-reasoning-pro', // Advanced reasoning
  'sonar-deep-research': 'sonar-deep-research', // Expert-level research

  // Legacy aliases (auto-converted to new names)
  'pplx-7b-online': 'sonar',                  // Deprecated -> sonar
  'pplx-70b-online': 'sonar-pro',             // Deprecated -> sonar-pro
  'pplx-7b-chat': 'sonar',                    // Deprecated -> sonar
  'pplx-70b-chat': 'sonar-pro',               // Deprecated -> sonar-pro

  'default': 'sonar-pro'                      // Use sonar-pro for best quality
};

// Perplexity pricing (January 2025 - official pricing)
// Source: https://www.perplexity.ai/hub/blog/introducing-the-sonar-pro-api
const PRICING = {
  'sonar': 1.0,              // $1 per 1M I/O tokens + $5-12 per 1000 requests
  'sonar-pro': 9.0,          // $3/1M input + $15/1M output + $6-14 per 1000 requests (avg ~$9)
  'sonar-reasoning': 5.0,    // Estimated pricing
  'sonar-reasoning-pro': 12.0, // Estimated pricing
  'sonar-deep-research': 20.0, // Estimated pricing
};

// =====================================================
// INVOKE PERPLEXITY
// =====================================================

/**
 * Invoke Perplexity AI via Supabase Edge Function
 *
 * @param {object} options - Perplexity invocation options
 * @param {string} options.prompt - Prompt/question to ask
 * @param {string} [options.content] - Content to analyze (optional)
 * @param {string} [options.model='pplx-70b-online'] - Model to use
 * @param {Array<string>} [options.searchDomainFilter] - Domain restrictions (e.g., ['edu', 'gov'])
 * @param {number} [options.temperature=0.2] - Temperature (lower for factual tasks)
 * @param {number} [options.maxTokens=2000] - Max tokens in response
 * @returns {Promise<object>} Response with content, citations, model, usage, and cost
 */
export async function invokePerplexity(options) {
  const {
    prompt,
    content = null,
    model = 'sonar-pro', // Default to sonar-pro (best quality with citations)
    searchDomainFilter = [],
    temperature = 0.2, // Low temperature for factual accuracy
    maxTokens = 2000,
  } = options;

  console.log('[Perplexity] Invoking model:', model);

  try {
    // Call via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('invoke-perplexity', {
      body: {
        prompt,
        content,
        model: PERPLEXITY_MODELS[model] || model,
        searchDomainFilter,
        temperature,
        maxTokens,
      }
    });

    if (error) {
      console.error('[Perplexity] API error:', error);
      throw new Error(`Perplexity API failed: ${error.message}`);
    }

    if (!data || !data.content) {
      throw new Error('Perplexity API returned empty response');
    }

    const cost = calculatePerplexityCost(data.model, data.usage);

    console.log('[Perplexity] Success:', {
      model: data.model,
      tokens: data.usage?.total_tokens || 0,
      citations: data.citations?.length || 0,
      cost: `$${cost.toFixed(4)}`
    });

    return {
      content: data.content,
      citations: data.citations || [],
      model: data.model,
      usage: data.usage,
      cost,
    };
  } catch (error) {
    console.error('[Perplexity] Invocation failed:', error);
    throw error;
  }
}

/**
 * Calculate cost for Perplexity API usage
 * @private
 */
function calculatePerplexityCost(model, usage) {
  if (!usage) return 0;

  const modelKey = Object.keys(PERPLEXITY_MODELS).find(k => PERPLEXITY_MODELS[k] === model) || 'pplx-70b-online';
  const pricing = PRICING[modelKey] || PRICING['pplx-70b-online'];

  return (usage.total_tokens / 1000000) * pricing;
}

// =====================================================
// SPECIALIZED FUNCTIONS
// =====================================================

/**
 * Verify article content for factual accuracy (Stage 2 of pipeline)
 *
 * @param {string} articleContent - Article HTML content
 * @param {string} title - Article title
 * @param {object} options - Additional options
 * @returns {Promise<object>} Verification results with citations
 */
export async function verifyArticle(articleContent, title, options = {}) {
  const {
    searchDomainFilter = ['edu', 'gov', 'org'], // Prefer authoritative sources
  } = options;

  const prompt = `
You are a fact-checking assistant. Review the following article for accuracy and provide citations.

TASKS:
1. Identify all factual claims that require verification
2. Find reliable sources (preferably .edu, .gov, or reputable news)
3. Check if statistics are current (flag anything older than 2 years)
4. Suggest citations with URLs for claims marked [CITATION NEEDED]
5. Flag any outdated or incorrect information
6. Provide an overall accuracy score (0-100)

Article Title: ${title}

Article Content:
${articleContent}

OUTPUT FORMAT (JSON):
{
  "accuracy_score": 85,
  "verified_claims": [
    { "claim": "...", "status": "verified|unverified|outdated", "source_url": "...", "source_title": "..." }
  ],
  "issues": [
    { "claim": "...", "issue": "outdated|incorrect|unsourced", "suggestion": "..." }
  ],
  "citations": [
    { "text": "citation text", "url": "https://...", "title": "Source title" }
  ],
  "recommendations": "Overall recommendations for improving accuracy..."
}

Return ONLY the JSON object, no additional text.
  `.trim();

  const response = await invokePerplexity({
    prompt,
    searchDomainFilter,
    temperature: 0.2, // Low for factual accuracy
    maxTokens: 2000,
  });

  // Try to parse JSON response
  let verificationData;
  try {
    verificationData = JSON.parse(response.content);
  } catch (error) {
    console.warn('[Perplexity] Failed to parse JSON, using raw response');
    verificationData = {
      accuracy_score: 50,
      verified_claims: [],
      issues: [],
      citations: response.citations || [],
      recommendations: response.content,
    };
  }

  return {
    ...verificationData,
    model: response.model,
    usage: response.usage,
    cost: response.cost,
  };
}

/**
 * Find top questions about a topic (for monthly ingest)
 *
 * @param {string} topic - Topic to search (e.g., "higher education", "college degrees")
 * @param {number} limit - Number of questions to return
 * @returns {Promise<Array>} List of questions with keywords, relevance, and priority
 */
export async function findTopQuestions(topic, limit = 50) {
  const prompt = `
Based on current online discussions, forums, and educational content about "${topic}", suggest ${limit} questions that would make excellent blog article topics.

For each question:
- Make it specific and actionable
- Include related keywords naturally
- Assess relevance to searchers (high/medium/low)
- Rate content priority (1-5, where 5 = most important)

Focus on questions that:
- Address real student/learner concerns
- Have educational value
- Would benefit from comprehensive answers

Return your response as a JSON object with this EXACT structure:
{
  "questions": [
    {
      "question": "What is the difference between college and university?",
      "keywords": ["college", "university", "higher education"],
      "relevance": "high",
      "priority": 5
    }
  ]
}

IMPORTANT: Return ONLY the JSON object wrapped in a code block. Do not include explanations before or after.
  `.trim();

  const response = await invokePerplexity({
    prompt,
    searchDomainFilter: [], // No restrictions for broader search
    temperature: 0.3,
    maxTokens: 4000, // Increased to support up to 50 questions
  });

  // Try to parse JSON response
  let questionsData;
  let jsonContent = response.content;

  // Extract from markdown code block if present
  const jsonMatch = jsonContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    jsonContent = jsonMatch[1];
  }

  try {
    // First try: Direct JSON parse
    questionsData = JSON.parse(jsonContent);
    return questionsData.questions || [];
  } catch (error) {
    // Handle truncated JSON (common when hitting token limit)
    console.warn('[Perplexity] JSON parse failed, attempting to fix truncated JSON:', error.message);

    try {
      // Fix truncated JSON by closing unclosed brackets/braces
      let fixedJson = jsonContent.trim();

      // If it ends mid-object, close it
      if (!fixedJson.endsWith('}') && !fixedJson.endsWith(']')) {
        // Remove incomplete last entry
        const lastComma = fixedJson.lastIndexOf(',');
        if (lastComma > 0) {
          fixedJson = fixedJson.substring(0, lastComma);
        }
      }

      // Count opening/closing brackets and braces
      const openBraces = (fixedJson.match(/\{/g) || []).length;
      const closeBraces = (fixedJson.match(/\}/g) || []).length;
      const openBrackets = (fixedJson.match(/\[/g) || []).length;
      const closeBrackets = (fixedJson.match(/\]/g) || []).length;

      // Add missing closing brackets/braces
      for (let i = 0; i < (openBrackets - closeBrackets); i++) {
        fixedJson += '\n  ]';
      }
      for (let i = 0; i < (openBraces - closeBraces); i++) {
        fixedJson += '\n}';
      }

      questionsData = JSON.parse(fixedJson);
      console.log('[Perplexity] Successfully fixed and parsed truncated JSON');
      return questionsData.questions || [];
    } catch (fixError) {
      console.warn('[Perplexity] Failed to fix truncated JSON:', fixError.message);
      console.log('[Perplexity] Response content:', response.content);
      return [];
    }
  }
}

/**
 * Search for real quotes about a topic (for quote sourcing)
 *
 * @param {string} topic - Topic to search quotes for
 * @param {Array<string>} sources - Sources to search (e.g., ['reddit', 'twitter'])
 * @param {number} limit - Number of quotes to return
 * @returns {Promise<Array>} List of quotes with sources
 */
export async function findRealQuotes(topic, sources = ['reddit'], limit = 5) {
  const sourcesStr = sources.join(', ');

  const prompt = `
Find ${limit} real quotes from ${sourcesStr} about "${topic}".

For each quote, provide:
- The exact quote text
- The source URL
- The author/username
- The source type (reddit/twitter/forum)

OUTPUT FORMAT (JSON):
{
  "quotes": [
    {
      "text": "Exact quote text...",
      "source_url": "https://...",
      "author": "username",
      "source_type": "reddit"
    }
  ]
}

Return ONLY the JSON object, no additional text.
Only include real, verifiable quotes - do NOT make up quotes.
  `.trim();

  const response = await invokePerplexity({
    prompt,
    temperature: 0.2, // Low to ensure accuracy
    maxTokens: 1500,
  });

  // Try to parse JSON response
  let quotesData;
  try {
    quotesData = JSON.parse(response.content);
    return quotesData.quotes || [];
  } catch (error) {
    console.warn('[Perplexity] Failed to parse quotes JSON');
    return [];
  }
}

/**
 * Replace [CITATION NEEDED] tags with actual citations
 *
 * @param {string} content - Article content with [CITATION NEEDED] tags
 * @param {Array} citations - Array of citations from verification
 * @returns {string} Content with citations inserted
 */
export function insertCitations(content, citations) {
  if (!citations || citations.length === 0) {
    return content;
  }

  let updatedContent = content;
  let citationIndex = 0;

  // Replace each [CITATION NEEDED] with an actual citation
  while (updatedContent.includes('[CITATION NEEDED]') && citationIndex < citations.length) {
    const citation = citations[citationIndex];
    const citationHtml = `<sup><a href="${citation.url}" target="_blank" rel="noopener noreferrer" title="${citation.title || 'Source'}">[${citationIndex + 1}]</a></sup>`;

    updatedContent = updatedContent.replace('[CITATION NEEDED]', citationHtml);
    citationIndex++;
  }

  // If there are leftover [CITATION NEEDED] tags, just remove them
  updatedContent = updatedContent.replace(/\[CITATION NEEDED\]/g, '');

  // Add citations list at the end
  if (citations.length > 0) {
    const citationsList = `
<div class="citations">
  <h3>References</h3>
  <ol>
    ${citations.map((c, i) => `<li><a href="${c.url}" target="_blank" rel="noopener noreferrer">${c.title || c.url}</a></li>`).join('\n    ')}
  </ol>
</div>
    `.trim();

    updatedContent += '\n\n' + citationsList;
  }

  return updatedContent;
}
