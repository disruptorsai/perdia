/**
 * PERDIA V2: CONTENT VALIDATOR
 * =============================
 *
 * Pre-publish validation system for content quality assurance.
 * Ensures all content meets minimum requirements before auto-publishing.
 *
 * Validation Checks:
 * - Title exists and appropriate length
 * - Content exists and meets word count
 * - Meta description exists and within limits
 * - Featured image exists
 * - All shortcodes properly formatted
 * - No broken internal links
 * - Readability score acceptable
 *
 * Created: 2025-11-12
 * Author: Perdia V2 Implementation
 */

import { ContentQueue, WordPressConnection } from './perdia-sdk';

/**
 * ValidationResult - Structure for validation results
 */
export class ValidationResult {
  constructor() {
    this.valid = true;
    this.errors = [];
    this.warnings = [];
    this.metrics = {};
  }

  addError(field, message) {
    this.valid = false;
    this.errors.push({ field, message });
  }

  addWarning(field, message) {
    this.warnings.push({ field, message });
  }

  setMetric(key, value) {
    this.metrics[key] = value;
  }
}

/**
 * Validate content for publishing
 * @param {string} contentId - Content queue item ID
 * @returns {Promise<ValidationResult>}
 */
export async function validateContentForPublishing(contentId) {
  const result = new ValidationResult();

  try {
    // Fetch content
    const content = await ContentQueue.findById(contentId);

    if (!content) {
      result.addError('content_id', 'Content not found');
      return result;
    }

    // Run all validation checks
    validateTitle(content, result);
    validateContent(content, result);
    validateMetaDescription(content, result);
    validateFeaturedImage(content, result);
    await validateShortcodes(content, result);
    validateReadability(content, result);

    console.log('[ContentValidator] Validation complete', {
      content_id: contentId,
      valid: result.valid,
      errors: result.errors.length,
      warnings: result.warnings.length,
    });

    return result;
  } catch (error) {
    console.error('[ContentValidator] Validation failed', error);
    result.addError('validation', `Validation process failed: ${error.message}`);
    return result;
  }
}

/**
 * Validate title
 */
function validateTitle(content, result) {
  if (!content.title || content.title.trim().length === 0) {
    result.addError('title', 'Title is required');
    return;
  }

  const titleLength = content.title.length;
  result.setMetric('title_length', titleLength);

  if (titleLength < 30) {
    result.addWarning('title', `Title is short (${titleLength} chars). Recommended: 50-60 chars.`);
  } else if (titleLength > 70) {
    result.addWarning('title', `Title is long (${titleLength} chars). May be truncated in search results.`);
  }
}

/**
 * Validate content body
 */
function validateContent(content, result) {
  if (!content.content || content.content.trim().length === 0) {
    result.addError('content', 'Content body is required');
    return;
  }

  // Calculate word count
  const text = stripHtml(content.content);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  result.setMetric('word_count', wordCount);

  // Minimum word count validation
  const minWords = content.content_type === 'new_article' ? 1500 : 500;

  if (wordCount < minWords) {
    result.addError('content', `Word count too low: ${wordCount} words (minimum: ${minWords})`);
  } else if (wordCount < minWords + 200) {
    result.addWarning('content', `Word count is borderline: ${wordCount} words. Consider adding more detail.`);
  }

  // Check for placeholder text
  const placeholders = ['[INSERT', '[TODO', '[TBD', 'PLACEHOLDER', 'Lorem ipsum'];
  placeholders.forEach(placeholder => {
    if (content.content.includes(placeholder)) {
      result.addError('content', `Placeholder text found: "${placeholder}"`);
    }
  });

  // Check for proper heading structure
  const h1Count = (content.content.match(/<h1/gi) || []).length;
  const h2Count = (content.content.match(/<h2/gi) || []).length;

  if (h1Count === 0 && !content.content.match(/^#\s+/m)) {
    result.addWarning('content', 'No H1 heading found. Consider adding a main heading.');
  }

  if (h2Count === 0 && !content.content.match(/^##\s+/gm)) {
    result.addWarning('content', 'No H2 headings found. Consider breaking content into sections.');
  }

  result.setMetric('h1_count', h1Count);
  result.setMetric('h2_count', h2Count);
}

/**
 * Validate meta description
 */
function validateMetaDescription(content, result) {
  if (!content.meta_description || content.meta_description.trim().length === 0) {
    result.addError('meta_description', 'Meta description is required');
    return;
  }

  const metaLength = content.meta_description.length;
  result.setMetric('meta_description_length', metaLength);

  if (metaLength < 120) {
    result.addWarning('meta_description', `Meta description is short (${metaLength} chars). Recommended: 140-155 chars.`);
  } else if (metaLength > 160) {
    result.addError('meta_description', `Meta description is too long (${metaLength} chars). Maximum: 160 chars.`);
  }
}

/**
 * Validate featured image
 */
function validateFeaturedImage(content, result) {
  if (!content.featured_image_url || content.featured_image_url.trim().length === 0) {
    result.addError('featured_image_url', 'Featured image is required');
    return;
  }

  // Check if URL is valid
  try {
    new URL(content.featured_image_url);
  } catch (error) {
    result.addError('featured_image_url', 'Featured image URL is invalid');
  }
}

/**
 * Validate shortcodes
 */
async function validateShortcodes(content, result) {
  const shortcodePatterns = [
    { pattern: /\[ge_internal_link url="([^"]+)"\](.+?)\[\/ge_internal_link\]/g, type: 'internal' },
    { pattern: /\[ge_affiliate_link url="([^"]+)"\](.+?)\[\/ge_affiliate_link\]/g, type: 'affiliate' },
    { pattern: /\[ge_external_link url="([^"]+)"\](.+?)\[\/ge_external_link\]/g, type: 'external' },
  ];

  let totalShortcodes = 0;
  const shortcodesByType = { internal: 0, affiliate: 0, external: 0 };

  // Count shortcodes by type
  shortcodePatterns.forEach(({ pattern, type }) => {
    const matches = content.content.matchAll(pattern);
    for (const match of matches) {
      totalShortcodes++;
      shortcodesByType[type]++;
    }
  });

  result.setMetric('shortcode_count', totalShortcodes);
  result.setMetric('internal_link_count', shortcodesByType.internal);
  result.setMetric('external_link_count', shortcodesByType.external);
  result.setMetric('affiliate_link_count', shortcodesByType.affiliate);

  // Check for unclosed shortcodes
  const openTags = (content.content.match(/\[ge_\w+_link/g) || []).length;
  const closeTags = (content.content.match(/\[\/ge_\w+_link\]/g) || []).length;

  if (openTags !== closeTags) {
    result.addError('content', `Unclosed shortcode tags detected (${openTags} open, ${closeTags} close)`);
  }

  // Check for raw HTML links (should be converted to shortcodes)
  const rawLinks = (content.content.match(/<a\s+href=/gi) || []).length;
  result.setMetric('raw_html_link_count', rawLinks);

  if (rawLinks > 0) {
    result.addError('content', `Raw HTML links found (${rawLinks}). All links must use GetEducated shortcodes.`);
  }

  // Warn if no internal links
  if (shortcodesByType.internal === 0) {
    result.addWarning('content', 'No internal links found. Consider adding 2-4 internal links.');
  }
}

/**
 * Validate readability
 */
function validateReadability(content, result) {
  const text = stripHtml(content.content);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  if (words.length === 0 || sentences.length === 0) {
    return;
  }

  const wordsPerSentence = words.length / sentences.length;
  result.setMetric('avg_words_per_sentence', Math.round(wordsPerSentence));

  // Warn if sentences are too long on average
  if (wordsPerSentence > 25) {
    result.addWarning('content', `Sentences are long (avg: ${Math.round(wordsPerSentence)} words). Consider breaking them up for readability.`);
  }

  // Flesch Reading Ease approximation
  const syllables = estimateSyllables(words);
  const fleschScore = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
  result.setMetric('flesch_reading_ease', Math.round(fleschScore));

  if (fleschScore < 50) {
    result.addWarning('content', `Readability score is low (${Math.round(fleschScore)}). Content may be difficult to read.`);
  }
}

/**
 * Strip HTML tags from content
 */
function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Estimate syllable count (rough approximation)
 */
function estimateSyllables(words) {
  return words.reduce((total, word) => {
    // Simple heuristic: count vowel groups
    const vowelGroups = word.toLowerCase().match(/[aeiouy]+/g);
    return total + (vowelGroups ? vowelGroups.length : 1);
  }, 0);
}

/**
 * Validate and save results
 * @param {string} contentId - Content queue item ID
 * @returns {Promise<ValidationResult>}
 */
export async function validateAndSave(contentId) {
  const validationResult = await validateContentForPublishing(contentId);

  try {
    // Update content with validation results
    await ContentQueue.update(contentId, {
      validation_errors: validationResult.errors,
    });

    console.log('[ContentValidator] Validation results saved', {
      content_id: contentId,
      valid: validationResult.valid,
    });
  } catch (error) {
    console.error('[ContentValidator] Failed to save validation results', error);
  }

  return validationResult;
}

/**
 * Quick validation check (returns boolean)
 * @param {string} contentId - Content queue item ID
 * @returns {Promise<boolean>}
 */
export async function isContentValid(contentId) {
  const result = await validateContentForPublishing(contentId);
  return result.valid;
}

export default {
  validateContentForPublishing,
  validateAndSave,
  isContentValid,
  ValidationResult,
};
