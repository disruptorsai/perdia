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

export const PERPLEXITY_MODELS = {
  'pplx-7b-online': 'pplx-7b-online',         // Fast online model
  'pplx-70b-online': 'pplx-70b-online',       // Full online model (recommended)
  'pplx-7b-chat': 'pplx-7b-chat',             // Chat model (no search)
  'pplx-70b-chat': 'pplx-70b-chat',           // Larger chat model
  'default': 'pplx-70b-online'
};

// Perplexity pricing (as of Nov 2025 - example pricing)
const PRICING = {
  'pplx-7b-online': 0.2,    // $ per 1M tokens
  'pplx-70b-online': 1.0,   // $ per 1M tokens
  'pplx-7b-chat': 0.2,
  'pplx-70b-chat': 1.0,
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
    model = 'pplx-70b-online',
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
 * @returns {Promise<Array>} List of questions with keywords and search volume
 */
export async function findTopQuestions(topic, limit = 50) {
  const prompt = `
What are the top ${limit} questions people are asking about "${topic}" right now?

For each question, provide:
- The question text
- Related keywords
- Estimated search volume (high/medium/low)
- Priority (1-5, where 5 is highest)

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "question": "What is the difference between college and university?",
      "keywords": ["college", "university", "higher education"],
      "search_volume": "high",
      "priority": 5
    }
  ]
}

Return ONLY the JSON object, no additional text.
Focus on questions that would make good blog article topics.
  `.trim();

  const response = await invokePerplexity({
    prompt,
    searchDomainFilter: [], // No restrictions for broader search
    temperature: 0.3,
    maxTokens: 2000,
  });

  // Try to parse JSON response
  let questionsData;
  try {
    questionsData = JSON.parse(response.content);
    return questionsData.questions || [];
  } catch (error) {
    console.warn('[Perplexity] Failed to parse questions JSON');
    return [];
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
