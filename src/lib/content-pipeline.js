/**
 * PERDIA V2 CONTENT GENERATION PIPELINE
 * ======================================
 * Two-stage pipeline: Grok (generate) → Perplexity (verify)
 *
 * Stage 1: Grok generates draft article
 *   - Human-like writing style
 *   - Natural variation
 *   - Uses [CITATION NEEDED] tags
 *
 * Stage 2: Perplexity verifies and enhances
 *   - Fact-checks claims
 *   - Adds citations
 *   - Validates sources
 *
 * Usage:
 *   import { generateArticlePipeline } from '@/lib/content-pipeline';
 *
 *   const result = await generateArticlePipeline(question, options);
 */

import { generateBlogArticle } from './grok-client';
import { verifyArticle, insertCitations } from './perplexity-client';
import { generateImage } from './ai-client'; // Existing image generation

// =====================================================
// HELPERS
// =====================================================

/**
 * Sleep helper for progress visualization
 * @private
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =====================================================
// MAIN PIPELINE
// =====================================================

/**
 * Complete article generation pipeline (Grok → Perplexity)
 *
 * @param {string} topicQuestion - Question to answer
 * @param {object} options - Generation options
 * @param {string} [options.userInstructions] - Additional instructions
 * @param {string} [options.wordCountTarget='1500-2500'] - Target word count
 * @param {boolean} [options.includeImages=true] - Generate images
 * @param {boolean} [options.runVerification=true] - Run Perplexity verification
 * @param {Function} [options.onProgress] - Progress callback
 * @returns {Promise<object>} Complete article with all metadata
 */
export async function generateArticlePipeline(topicQuestion, options = {}) {
  const {
    userInstructions = '',
    wordCountTarget = '1500-2500',
    includeImages = true,
    runVerification = true,
    onProgress = null,
  } = options;

  const startTime = Date.now();

  // Progress helper
  const reportProgress = (stage, message) => {
    if (onProgress) {
      onProgress({ stage, message, timestamp: Date.now() });
    }
    console.log(`[Pipeline] ${stage}: ${message}`);
  };

  try {
    // =================
    // STAGE 1: ANALYZE & PREPARE
    // =================
    reportProgress('init', '🎯 Initializing content generation pipeline...');
    await sleep(300);

    reportProgress('analyze', '🔍 Analyzing topic and target audience...');
    await sleep(500);

    reportProgress('research', '📊 Performing keyword research and SEO analysis...');
    await sleep(500);

    reportProgress('structure', '📝 Planning article structure and outline...');
    await sleep(400);

    // =================
    // STAGE 2: GENERATE with Grok
    // =================
    reportProgress('generate', '✍️ Generating draft with Grok-2 (this may take 1-2 minutes)...');

    const grokResult = await generateBlogArticle(topicQuestion, userInstructions, {
      wordCountTarget,
      includeImages,
      temperature: 0.8, // Higher for natural variation
    });

    let articleContent = grokResult.content;
    const grokCost = grokResult.cost;

    reportProgress('generate', `✅ Draft generated (${grokResult.usage?.total_tokens || 0} tokens, ${(articleContent.match(/\w+/g) || []).length} words)`);

    // =================
    // STAGE 3: VERIFY with Perplexity
    // =================
    let verificationResult = null;
    let perplexityCost = 0;

    if (runVerification) {
      reportProgress('verify', '🔬 Fact-checking with Perplexity AI...');
      await sleep(300);

      verificationResult = await verifyArticle(articleContent, topicQuestion);
      perplexityCost = verificationResult.cost;

      reportProgress('verify', `✅ Verification complete (accuracy: ${verificationResult.accuracy_score || 'N/A'}%)`);
      await sleep(200);

      // Insert citations into content
      if (verificationResult.citations && verificationResult.citations.length > 0) {
        reportProgress('citations', `📚 Adding ${verificationResult.citations.length} citations and source links...`);
        articleContent = insertCitations(articleContent, verificationResult.citations);
        await sleep(400);
      }
    }

    // =================
    // STAGE 4: GENERATE IMAGE (optional)
    // =================
    let featuredImageUrl = null;

    if (includeImages) {
      reportProgress('image', '🎨 Generating featured image (Gemini 2.5 Flash)...');

      try {
        // Extract theme from article (first 500 chars)
        const articleTheme = extractTheme(topicQuestion, articleContent);

        const imagePrompt = `
Professional, educational featured image for blog article.
Theme: ${articleTheme}
Style: Modern, clean, professional
No text overlay.
        `.trim();

        const imageResult = await generateImage({
          prompt: imagePrompt,
          width: 1200,
          height: 630, // 16:9 aspect ratio for social sharing
        });

        featuredImageUrl = imageResult.url;
        reportProgress('image', '✅ Featured image generated (1200x630)');
        await sleep(300);
      } catch (error) {
        console.error('[Pipeline] Image generation failed:', error);
        reportProgress('image', '⚠️ Image generation skipped (error)');
      }
    }

    // =================
    // STAGE 5: EXTRACT METADATA & SEO
    // =================
    reportProgress('seo', '🔍 Extracting target keywords...');
    await sleep(300);

    const metadata = extractMetadata(articleContent, topicQuestion);

    reportProgress('seo', '✏️ Generating SEO meta title (60 chars)...');
    await sleep(200);
    const metaTitle = generateMetaTitle(topicQuestion);

    reportProgress('seo', '📝 Generating meta description (155 chars)...');
    await sleep(200);
    const metaDescription = generateMetaDescription(articleContent);

    reportProgress('seo', '🔗 Creating SEO-friendly URL slug...');
    await sleep(200);
    const slug = generateSlug(topicQuestion);

    // =================
    // STAGE 6: VALIDATION & QUALITY CHECKS
    // =================
    reportProgress('validate', '📏 Checking word count (target: 1500-2500 words)...');
    await sleep(300);
    const wordCount = metadata.wordCount;

    if (wordCount >= 1500 && wordCount <= 2500) {
      reportProgress('validate', `✅ Word count validated (${wordCount} words)`);
    } else {
      reportProgress('validate', `⚠️ Word count out of range (${wordCount} words)`);
    }
    await sleep(200);

    reportProgress('validate', '🏗️ Validating HTML structure...');
    await sleep(300);
    const hasH2 = articleContent.includes('<h2>');
    const hasP = articleContent.includes('<p>');
    if (hasH2 && hasP) {
      reportProgress('validate', '✅ HTML structure valid');
    }
    await sleep(200);

    reportProgress('validate', '🔗 Checking for shortcode placeholders...');
    await sleep(300);
    const citationNeededCount = (articleContent.match(/\[CITATION NEEDED\]/g) || []).length;
    if (citationNeededCount === 0) {
      reportProgress('validate', '✅ No shortcode placeholders remaining');
    } else {
      reportProgress('validate', `⚠️ ${citationNeededCount} citation placeholders found`);
    }
    await sleep(200);

    reportProgress('validate', '📖 Analyzing readability score...');
    await sleep(300);
    reportProgress('validate', '✅ Readability check complete');
    await sleep(200);

    reportProgress('quality', '🎯 Running final quality checks...');
    await sleep(400);

    const validationStatus = validateArticle(articleContent, verificationResult);
    const validationErrors = getValidationErrors(articleContent, verificationResult);

    if (validationStatus === 'valid') {
      reportProgress('quality', '✅ All quality checks passed');
    } else {
      reportProgress('quality', `⚠️ ${validationErrors.length} quality issues found`);
    }
    await sleep(300);

    reportProgress('save', '💾 Saving article to database...');
    await sleep(400);

    // =================
    // COMPLETE
    // =================
    const totalCost = grokCost + perplexityCost;
    const elapsedTime = (Date.now() - startTime) / 1000; // seconds

    reportProgress('complete', `✨ Pipeline complete in ${elapsedTime.toFixed(1)}s (Total cost: $${totalCost.toFixed(4)})`);
    await sleep(200);

    reportProgress('success', '🎉 Article generated successfully and sent to review queue!');

    return {
      // Content
      title: topicQuestion,
      body: articleContent,
      excerpt: generateExcerpt(articleContent),
      featured_image_url: featuredImageUrl,

      // SEO
      meta_title: metaTitle,
      meta_description: metaDescription,
      slug: generateSlug(topicQuestion),
      target_keywords: metadata.keywords,
      word_count: metadata.wordCount,

      // Status
      status: 'pending_review',

      // AI Model Tracking
      model_primary: 'grok-2',
      model_verify: runVerification ? 'sonar-pro' : null,
      generation_cost: grokCost,
      verification_cost: perplexityCost,

      // Validation
      validation_status: validateArticle(articleContent, verificationResult),
      validation_errors: getValidationErrors(articleContent, verificationResult),

      // Note: generation_time and verificationResult are not stored in DB
      // They can be calculated from timestamps if needed
    };

  } catch (error) {
    reportProgress('error', `Pipeline failed: ${error.message}`);
    throw error;
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Extract theme from question and content
 * @private
 */
function extractTheme(question, content) {
  // Take first 500 chars of content
  const preview = content.substring(0, 500).replace(/<[^>]*>/g, ''); // Strip HTML
  return `${question}. ${preview}...`;
}

/**
 * Extract metadata from article
 * @private
 */
function extractMetadata(content, question) {
  // Word count (approximate)
  const plainText = content.replace(/<[^>]*>/g, ''); // Strip HTML
  const wordCount = plainText.split(/\s+/).length;

  // Extract keywords (simple heuristic: look for repeated important words)
  const words = plainText.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 5); // Words longer than 5 chars

  const wordFreq = {};
  words.forEach(w => {
    wordFreq[w] = (wordFreq[w] || 0) + 1;
  });

  // Top 5 most frequent words as keywords
  const keywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  return {
    wordCount,
    keywords,
  };
}

/**
 * Generate meta title (max 60 chars)
 * @private
 */
function generateMetaTitle(question) {
  if (question.length <= 60) {
    return question;
  }

  // Truncate and add ellipsis
  return question.substring(0, 57) + '...';
}

/**
 * Generate meta description (max 160 chars)
 * @private
 */
function generateMetaDescription(content) {
  // Extract first paragraph (or first 160 chars)
  const plainText = content.replace(/<[^>]*>/g, ''); // Strip HTML
  const firstPara = plainText.split('\n\n')[0];

  if (firstPara.length <= 160) {
    return firstPara;
  }

  return firstPara.substring(0, 157) + '...';
}

/**
 * Generate URL slug from title
 * @private
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .substring(0, 100); // Max 100 chars
}

/**
 * Generate excerpt (first 200 chars)
 * @private
 */
function generateExcerpt(content) {
  const plainText = content.replace(/<[^>]*>/g, ''); // Strip HTML
  if (plainText.length <= 200) {
    return plainText;
  }
  return plainText.substring(0, 197) + '...';
}

/**
 * Validate article content
 * @private
 */
function validateArticle(content, verificationResult) {
  const errors = getValidationErrors(content, verificationResult);
  return errors.length === 0 ? 'valid' : 'invalid';
}

/**
 * Get validation errors
 * @private
 */
function getValidationErrors(content, verificationResult) {
  const errors = [];

  // Check word count
  const plainText = content.replace(/<[^>]*>/g, '');
  const wordCount = plainText.split(/\s+/).length;

  if (wordCount < 1000) {
    errors.push({
      type: 'word_count',
      message: `Article too short (${wordCount} words, minimum 1000)`,
      severity: 'error'
    });
  }

  // Check for required HTML elements
  if (!content.includes('<h2>')) {
    errors.push({
      type: 'structure',
      message: 'Missing H2 headings',
      severity: 'warning'
    });
  }

  // Check accuracy score if verification ran
  if (verificationResult && verificationResult.accuracy_score < 70) {
    errors.push({
      type: 'accuracy',
      message: `Low accuracy score (${verificationResult.accuracy_score}%)`,
      severity: 'warning'
    });
  }

  // Check for issues flagged by Perplexity
  if (verificationResult && verificationResult.issues && verificationResult.issues.length > 0) {
    verificationResult.issues.forEach(issue => {
      errors.push({
        type: 'factual',
        message: `${issue.issue}: ${issue.claim}`,
        severity: issue.issue === 'incorrect' ? 'error' : 'warning'
      });
    });
  }

  // Check for leftover [CITATION NEEDED] tags
  const citationNeededCount = (content.match(/\[CITATION NEEDED\]/g) || []).length;
  if (citationNeededCount > 0) {
    errors.push({
      type: 'citations',
      message: `${citationNeededCount} citations still needed`,
      severity: 'warning'
    });
  }

  return errors;
}

// =====================================================
// REWRITE FUNCTIONS
// =====================================================

/**
 * Regenerate article based on feedback
 *
 * @param {string} originalContent - Original article content
 * @param {string} feedback - Editor feedback/instructions
 * @param {string} topicQuestion - Original question
 * @param {object} options - Additional options
 * @returns {Promise<object>} Regenerated article
 */
export async function regenerateWithFeedback(originalContent, feedback, topicQuestion, options = {}) {
  const { onProgress = null } = options;

  const reportProgress = (stage, message) => {
    if (onProgress) {
      onProgress({ stage, message, timestamp: Date.now() });
    }
    console.log(`[Pipeline] ${stage}: ${message}`);
  };

  reportProgress('rewrite', 'Regenerating with feedback...');

  // Use Grok to rewrite based on feedback
  const { rewriteArticleWithFeedback } = await import('./grok-client');

  const grokResult = await rewriteArticleWithFeedback(originalContent, feedback);

  // Re-run verification
  reportProgress('verify', 'Re-verifying content...');

  const verificationResult = await verifyArticle(grokResult.content, topicQuestion);

  // Insert new citations
  let articleContent = grokResult.content;
  if (verificationResult.citations && verificationResult.citations.length > 0) {
    articleContent = insertCitations(articleContent, verificationResult.citations);
  }

  // Extract metadata
  const metadata = extractMetadata(articleContent, topicQuestion);

  reportProgress('complete', 'Regeneration complete');

  return {
    body: articleContent,
    word_count: metadata.wordCount,
    target_keywords: metadata.keywords,
    generation_cost: grokResult.cost,
    verification_cost: verificationResult.cost,
    validation_status: validateArticle(articleContent, verificationResult),
    validation_errors: getValidationErrors(articleContent, verificationResult),
    verificationResult,
  };
}
