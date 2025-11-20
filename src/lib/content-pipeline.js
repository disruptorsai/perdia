/**
 * PERDIA EDUCATION - CONTENT GENERATION PIPELINE
 * ===============================================
 * Two-stage AI content generation system:
 * 1. Grok-2 (xAI) - Human-like article generation with natural variation
 * 2. Perplexity Sonar Pro - Fact-checking, citations, and source verification
 *
 * This is the PRIMARY content generation system for the platform.
 */

import { InvokeLLM } from './perdia-sdk';
import { prePublishTransform } from './shortcode-transformer';

// =====================================================
// COST TRACKING
// =====================================================

const MODEL_COSTS = {
  'grok-2': { input: 0.000002, output: 0.000010 }, // $2/M input, $10/M output (estimated)
  'grok-2-1212': { input: 0.000002, output: 0.000010 },
  'sonar-pro': { input: 0.000003, output: 0.000015 }, // $3/M input, $15/M output (estimated)
  'claude-sonnet-4-5-20250929': { input: 0.000003, output: 0.000015 },
  'claude-haiku-4-5-20251001': { input: 0.00000025, output: 0.00000125 },
  'gemini-2.5-flash-image': { perImage: 0.001 },
};

function calculateCost(model, inputTokens, outputTokens) {
  const costs = MODEL_COSTS[model] || MODEL_COSTS['grok-2'];
  return (inputTokens * costs.input) + (outputTokens * costs.output);
}

// =====================================================
// PIPELINE STAGES
// =====================================================

/**
 * Stage 1: Generate draft with Grok-2
 * Returns content with [CITATION NEEDED] tags for claims requiring sources
 */
async function generateDraftWithGrok(topicQuestion, options, onProgress) {
  const { userInstructions = '', wordCountTarget = '1500-2500', contentType = 'guide' } = options;

  onProgress?.({ stage: 'generate', message: 'Generating article draft with Grok-2...', timestamp: Date.now() });

  // Build comprehensive prompt for Grok-2
  const prompt = `You are a professional content writer for GetEducated.com, a premium educational resource website.

Write a comprehensive, SEO-optimized article on the following topic:
"${topicQuestion}"

${userInstructions ? `Additional instructions: ${userInstructions}` : ''}

REQUIREMENTS:
- Target word count: ${wordCountTarget} words
- Content type: ${contentType}
- Use natural, human-like writing with personality and variation
- Write in an engaging, authoritative tone suitable for GetEducated.com
- Use [CITATION NEEDED] tags for any factual claims, statistics, or data points that require sources
- Include proper HTML structure with H2 and H3 headings
- Write compelling introduction (100-150 words)
- Create scannable content with short paragraphs (2-4 sentences)
- Use bullet points and numbered lists where appropriate
- Include actionable insights and practical examples
- End with a strong conclusion (100-150 words)

CRITICAL: Return ONLY the HTML article content. No title, no meta descriptions - just the content body starting with the introduction.

Structure:
<p>[Engaging introduction]</p>

<h2>[First Major Section]</h2>
<p>[Content with [CITATION NEEDED] tags where facts need sources]</p>

<h2>[Second Major Section]</h2>
<p>[Content]</p>

[Continue with 4-6 major sections...]

<h2>Conclusion</h2>
<p>[Summary and call-to-action]</p>`;

  const startTime = Date.now();

  const response = await InvokeLLM({
    prompt,
    provider: 'xai',
    model: 'grok-2-1212',
    temperature: 0.8, // Higher temperature for creative variation
    max_tokens: 8000,
  });

  const duration = (Date.now() - startTime) / 1000;
  onProgress?.({ stage: 'generate', message: `Draft generated in ${duration.toFixed(1)}s`, timestamp: Date.now() });

  // Estimate cost (rough calculation since we don't have exact token counts)
  const estimatedInputTokens = Math.floor(prompt.length / 4);
  const estimatedOutputTokens = Math.floor((response?.length || 0) / 4);
  const generationCost = calculateCost('grok-2', estimatedInputTokens, estimatedOutputTokens);

  return {
    content: response,
    generationCost,
    wordCount: (response?.match(/\w+/g) || []).length,
  };
}

/**
 * Stage 2: Fact-check and add citations with Perplexity Sonar Pro
 * Replaces [CITATION NEEDED] tags with real source citations
 */
async function verifyCitationsWithPerplexity(content, topicQuestion, onProgress) {
  onProgress?.({ stage: 'verify', message: 'Fact-checking with Perplexity Sonar Pro...', timestamp: Date.now() });

  // Extract all sections that need citations
  const citationMatches = content.match(/([^<]+)\[CITATION NEEDED\]/g) || [];

  if (citationMatches.length === 0) {
    onProgress?.({ stage: 'verify', message: 'No citations needed - skipping verification', timestamp: Date.now() });
    return {
      content,
      verificationCost: 0,
      citationCount: 0,
    };
  }

  onProgress?.({ stage: 'citations', message: `Adding citations for ${citationMatches.length} claims...`, timestamp: Date.now() });

  // Build verification prompt
  const prompt = `You are a fact-checker for GetEducated.com. Your job is to verify factual claims and add proper citations.

Original topic: "${topicQuestion}"

The following article contains claims marked with [CITATION NEEDED]. For each claim:
1. Verify the factual accuracy
2. Find authoritative sources (prefer .edu, .gov, industry reports)
3. Replace [CITATION NEEDED] with a proper citation link

Article content:
${content}

CRITICAL RULES:
- Return the COMPLETE article with citations added
- Replace ALL [CITATION NEEDED] tags with: <a href="[source-url]" target="_blank" rel="noopener">[source-name]</a>
- Only use authoritative sources (.edu, .gov, industry associations, peer-reviewed studies)
- If a claim cannot be verified, flag it with [UNVERIFIED - REMOVE THIS CLAIM]
- Maintain the exact same HTML structure
- Do not modify any other content

Return the complete article with all citations added.`;

  const startTime = Date.now();

  const response = await InvokeLLM({
    prompt,
    provider: 'perplexity',
    model: 'sonar-pro',
    temperature: 0.3, // Lower temperature for accuracy
    max_tokens: 8000,
  });

  const duration = (Date.now() - startTime) / 1000;
  onProgress?.({ stage: 'citations', message: `Citations added in ${duration.toFixed(1)}s`, timestamp: Date.now() });

  // Estimate cost
  const estimatedInputTokens = Math.floor(prompt.length / 4);
  const estimatedOutputTokens = Math.floor((response?.length || 0) / 4);
  const verificationCost = calculateCost('sonar-pro', estimatedInputTokens, estimatedOutputTokens);

  // Count how many citations were added
  const citationCount = (response?.match(/<a href=/g) || []).length;

  return {
    content: response,
    verificationCost,
    citationCount,
  };
}

/**
 * Stage 3: Generate featured image
 */
async function generateFeaturedImage(title, onProgress) {
  onProgress?.({ stage: 'image', message: 'Generating featured image...', timestamp: Date.now() });

  // Call the generate-image Edge Function
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const functionUrl = `${supabaseUrl}/functions/v1/generate-image`;

  // Get auth token
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    console.warn('[content-pipeline] No session - skipping image generation');
    return { imageUrl: null, imageCost: 0 };
  }

  try {
    const imagePrompt = `Professional blog header image for article: "${title}". Style: Modern, clean, professional, suitable for educational website. 16:9 aspect ratio.`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        provider: 'gemini',
        aspectRatio: '16:9',
      }),
    });

    if (!response.ok) {
      console.error('[content-pipeline] Image generation failed:', await response.text());
      return { imageUrl: null, imageCost: 0 };
    }

    const data = await response.json();
    onProgress?.({ stage: 'image', message: 'Featured image generated', timestamp: Date.now() });

    return {
      imageUrl: data.imageUrl,
      imageCost: MODEL_COSTS['gemini-2.5-flash-image'].perImage,
    };
  } catch (error) {
    console.error('[content-pipeline] Image generation error:', error);
    return { imageUrl: null, imageCost: 0 };
  }
}

/**
 * Stage 4: Extract SEO metadata
 */
async function extractSEOMetadata(title, content, topicQuestion, onProgress) {
  onProgress?.({ stage: 'seo', message: 'Extracting SEO metadata...', timestamp: Date.now() });

  const prompt = `Extract SEO metadata for the following article:

Title: ${title}
Topic: ${topicQuestion}

Content preview:
${content.substring(0, 1000)}...

Generate:
1. Meta title (50-60 characters, include primary keyword)
2. Meta description (150-160 characters, compelling and keyword-rich)
3. URL slug (lowercase, hyphens, 3-5 words)
4. Target keywords (5-8 keywords, comma-separated)

Return as JSON:
{
  "meta_title": "...",
  "meta_description": "...",
  "slug": "...",
  "target_keywords": ["keyword1", "keyword2", ...]
}`;

  const response = await InvokeLLM({
    prompt,
    provider: 'claude',
    model: 'claude-haiku-4-5-20251001', // Fast and cheap for metadata
    temperature: 0.5,
    max_tokens: 500,
    response_json_schema: {
      type: 'object',
      properties: {
        meta_title: { type: 'string' },
        meta_description: { type: 'string' },
        slug: { type: 'string' },
        target_keywords: { type: 'array', items: { type: 'string' } },
      },
    },
  });

  onProgress?.({ stage: 'seo', message: 'SEO metadata extracted', timestamp: Date.now() });

  // Parse JSON response
  let metadata = {};
  try {
    metadata = typeof response === 'string' ? JSON.parse(response) : response;
  } catch (e) {
    console.warn('[content-pipeline] Failed to parse SEO metadata:', e);
    // Generate fallback metadata
    metadata = {
      meta_title: title.substring(0, 60),
      meta_description: content.replace(/<[^>]+>/g, '').substring(0, 160),
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50),
      target_keywords: [],
    };
  }

  return metadata;
}

/**
 * Stage 5: Validate article quality
 */
function validateArticle(content, wordCount, citationCount) {
  const errors = [];

  // Word count validation
  if (wordCount < 1000) {
    errors.push(`Article too short: ${wordCount} words (minimum 1000)`);
  }

  // Structure validation
  const h2Count = (content.match(/<h2>/g) || []).length;
  if (h2Count < 3) {
    errors.push(`Insufficient structure: ${h2Count} H2 headings (minimum 3)`);
  }

  // Citation validation
  const uncitedClaims = (content.match(/\[CITATION NEEDED\]/g) || []).length;
  if (uncitedClaims > 0) {
    errors.push(`${uncitedClaims} claims still need citations`);
  }

  // Unverified claims check
  const unverifiedClaims = (content.match(/\[UNVERIFIED/g) || []).length;
  if (unverifiedClaims > 0) {
    errors.push(`${unverifiedClaims} claims could not be verified and must be removed`);
  }

  return {
    status: errors.length === 0 ? 'valid' : 'invalid',
    errors,
  };
}

// =====================================================
// MAIN PIPELINE
// =====================================================

/**
 * Generate complete article using two-stage pipeline
 *
 * @param {string} topicQuestion - Article topic/question
 * @param {Object} options - Generation options
 * @param {string} [options.userInstructions] - Additional instructions
 * @param {string} [options.wordCountTarget='1500-2500'] - Target word count
 * @param {string} [options.contentType='guide'] - Type of article
 * @param {boolean} [options.includeImages=true] - Generate featured image
 * @param {boolean} [options.runVerification=true] - Run Perplexity verification
 * @param {function} [options.onProgress] - Progress callback
 * @returns {Promise<Object>} Complete article with metadata
 */
export async function generateArticlePipeline(topicQuestion, options = {}) {
  const {
    userInstructions,
    wordCountTarget = '1500-2500',
    contentType = 'guide',
    includeImages = true,
    runVerification = true,
    onProgress,
  } = options;

  try {
    onProgress?.({ stage: 'init', message: 'Initializing content pipeline...', timestamp: Date.now() });

    // Extract/generate title from topic
    const title = topicQuestion.length > 100
      ? topicQuestion.substring(0, 97) + '...'
      : topicQuestion;

    // Stage 1: Generate draft with Grok-2
    const { content: draftContent, generationCost, wordCount: initialWordCount } = await generateDraftWithGrok(
      topicQuestion,
      { userInstructions, wordCountTarget, contentType },
      onProgress
    );

    // Stage 2: Verify and add citations with Perplexity (optional)
    let finalContent = draftContent;
    let verificationCost = 0;
    let citationCount = 0;

    if (runVerification) {
      const verifyResult = await verifyCitationsWithPerplexity(draftContent, topicQuestion, onProgress);
      finalContent = verifyResult.content;
      verificationCost = verifyResult.verificationCost;
      citationCount = verifyResult.citationCount;
    }

    // Calculate final word count
    const wordCount = (finalContent.match(/\w+/g) || []).length;

    // Stage 3: Generate featured image (optional)
    let imageUrl = null;
    let imageCost = 0;

    if (includeImages) {
      const imageResult = await generateFeaturedImage(title, onProgress);
      imageUrl = imageResult.imageUrl;
      imageCost = imageResult.imageCost;
    }

    // Stage 4: Transform shortcodes
    onProgress?.({ stage: 'shortcodes', message: 'Transforming links to GetEducated shortcodes...', timestamp: Date.now() });
    const shortcodeResult = prePublishTransform(finalContent);
    const publishableContent = shortcodeResult.content;
    const shortcodeStats = shortcodeResult.stats;

    // Stage 5: Extract SEO metadata
    const seoMetadata = await extractSEOMetadata(title, publishableContent, topicQuestion, onProgress);

    // Stage 6: Validate
    onProgress?.({ stage: 'validate', message: 'Running quality checks...', timestamp: Date.now() });
    const validation = validateArticle(publishableContent, wordCount, citationCount);

    // Calculate total cost
    const totalCost = generationCost + verificationCost + imageCost;

    onProgress?.({ stage: 'complete', message: 'Article generation complete!', timestamp: Date.now() });

    // Return complete article
    return {
      title,
      body: publishableContent, // Uses transformed content with shortcodes
      excerpt: publishableContent.replace(/<[^>]+>/g, '').substring(0, 200) + '...',
      featured_image_url: imageUrl,
      meta_title: seoMetadata.meta_title,
      meta_description: seoMetadata.meta_description,
      slug: seoMetadata.slug,
      target_keywords: seoMetadata.target_keywords,
      word_count: wordCount,
      generation_cost: generationCost,
      verification_cost: verificationCost,
      image_cost: imageCost,
      total_cost: totalCost,
      model_primary: 'grok-2-1212',
      model_verify: runVerification ? 'sonar-pro' : null,
      validation_status: validation.status,
      validation_errors: validation.errors,
      citation_count: citationCount,
      shortcode_stats: shortcodeStats, // Internal/affiliate/external link counts
    };
  } catch (error) {
    onProgress?.({ stage: 'error', message: `Error: ${error.message}`, timestamp: Date.now() });
    throw error;
  }
}

/**
 * Regenerate article with feedback
 *
 * @param {string} originalContent - Original article content
 * @param {string} feedback - User feedback for improvements
 * @param {string} topicQuestion - Original topic
 * @param {Object} options - Options (same as generateArticlePipeline)
 * @returns {Promise<Object>} Updated article
 */
export async function regenerateWithFeedback(originalContent, feedback, topicQuestion, options = {}) {
  const { onProgress } = options;

  onProgress?.({ stage: 'init', message: 'Regenerating with feedback...', timestamp: Date.now() });

  const prompt = `You are a professional content editor for GetEducated.com.

Original article:
${originalContent}

User feedback:
${feedback}

Revise the article based on the feedback while maintaining:
- The same HTML structure
- Professional tone and quality
- All citations (keep existing citations intact)
- SEO optimization

Return ONLY the revised HTML content.`;

  const response = await InvokeLLM({
    prompt,
    provider: 'xai',
    model: 'grok-2-1212',
    temperature: 0.7,
    max_tokens: 8000,
  });

  const wordCount = (response.match(/\w+/g) || []).length;
  const citationCount = (response.match(/<a href=/g) || []).length;

  // Re-run validation
  const validation = validateArticle(response, wordCount, citationCount);

  onProgress?.({ stage: 'complete', message: 'Regeneration complete!', timestamp: Date.now() });

  return {
    body: response,
    word_count: wordCount,
    citation_count: citationCount,
    validation_status: validation.status,
    validation_errors: validation.errors,
  };
}

export default {
  generateArticlePipeline,
  regenerateWithFeedback,
};
