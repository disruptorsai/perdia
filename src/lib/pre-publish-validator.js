/**
 * PERDIA EDUCATION - PRE-PUBLISH VALIDATOR
 * =========================================
 * Comprehensive validation before publishing to WordPress
 *
 * Validates:
 * - Word count (minimum 1000 words)
 * - Shortcodes (all links must use GetEducated shortcodes)
 * - Citations (no uncited claims)
 * - Structure (proper headings)
 * - Internal links (minimum 3-5)
 * - Quality score (>70%)
 */

import { validateShortcodes, getShortcodeStats } from './shortcode-transformer';

// =====================================================
// VALIDATION RULES
// =====================================================

const VALIDATION_RULES = {
  MIN_WORD_COUNT: 1000,
  MAX_WORD_COUNT: 5000,
  MIN_H2_HEADINGS: 3,
  MIN_INTERNAL_LINKS: 3,
  MAX_INTERNAL_LINKS: 10,
  MIN_QUALITY_SCORE: 70,
  MIN_PARAGRAPHS: 5,
};

// =====================================================
// INDIVIDUAL VALIDATORS
// =====================================================

/**
 * Validate word count
 */
function validateWordCount(content) {
  const text = content.replace(/<[^>]+>/g, ''); // Strip HTML
  const words = text.match(/\w+/g) || [];
  const wordCount = words.length;

  const isValid = wordCount >= VALIDATION_RULES.MIN_WORD_COUNT &&
                  wordCount <= VALIDATION_RULES.MAX_WORD_COUNT;

  return {
    valid: isValid,
    wordCount,
    errors: isValid ? [] : [
      wordCount < VALIDATION_RULES.MIN_WORD_COUNT
        ? `Article too short: ${wordCount} words (minimum ${VALIDATION_RULES.MIN_WORD_COUNT})`
        : `Article too long: ${wordCount} words (maximum ${VALIDATION_RULES.MAX_WORD_COUNT})`,
    ],
  };
}

/**
 * Validate HTML structure
 */
function validateStructure(content) {
  const errors = [];

  // Check for H2 headings
  const h2Count = (content.match(/<h2[^>]*>/g) || []).length;
  if (h2Count < VALIDATION_RULES.MIN_H2_HEADINGS) {
    errors.push(
      `Insufficient structure: ${h2Count} H2 headings (minimum ${VALIDATION_RULES.MIN_H2_HEADINGS})`
    );
  }

  // Check for paragraphs
  const paragraphCount = (content.match(/<p[^>]*>/g) || []).length;
  if (paragraphCount < VALIDATION_RULES.MIN_PARAGRAPHS) {
    errors.push(
      `Insufficient paragraphs: ${paragraphCount} paragraphs (minimum ${VALIDATION_RULES.MIN_PARAGRAPHS})`
    );
  }

  // Check for empty headings
  const emptyHeadings = content.match(/<h[1-6][^>]*>\s*<\/h[1-6]>/g) || [];
  if (emptyHeadings.length > 0) {
    errors.push(`Found ${emptyHeadings.length} empty headings`);
  }

  return {
    valid: errors.length === 0,
    h2Count,
    paragraphCount,
    errors,
  };
}

/**
 * Validate shortcodes
 */
function validateShortcodesPresent(content) {
  const shortcodeValidation = validateShortcodes(content);
  const stats = getShortcodeStats(content);

  const errors = [...shortcodeValidation.errors];

  // Check for minimum internal links
  if (stats.internal < VALIDATION_RULES.MIN_INTERNAL_LINKS) {
    errors.push(
      `Insufficient internal links: ${stats.internal} links (minimum ${VALIDATION_RULES.MIN_INTERNAL_LINKS})`
    );
  }

  // Warn if too many internal links (not an error, just a warning)
  if (stats.internal > VALIDATION_RULES.MAX_INTERNAL_LINKS) {
    errors.push(
      `⚠️ Warning: Many internal links (${stats.internal}). Consider reducing for better UX.`
    );
  }

  return {
    valid: shortcodeValidation.valid && stats.internal >= VALIDATION_RULES.MIN_INTERNAL_LINKS,
    stats,
    errors,
  };
}

/**
 * Validate citations
 */
function validateCitations(content) {
  const errors = [];

  // Check for [CITATION NEEDED] tags
  const uncitedClaims = (content.match(/\[CITATION NEEDED\]/g) || []).length;
  if (uncitedClaims > 0) {
    errors.push(`${uncitedClaims} claims still need citations`);
  }

  // Check for [UNVERIFIED] tags
  const unverifiedClaims = (content.match(/\[UNVERIFIED/g) || []).length;
  if (unverifiedClaims > 0) {
    errors.push(`${unverifiedClaims} unverified claims must be removed`);
  }

  // Count total citations
  const citationCount = (content.match(/<a[^>]*href=[^>]*>/g) || []).length;

  return {
    valid: errors.length === 0,
    citationCount,
    uncitedClaims,
    unverifiedClaims,
    errors,
  };
}

/**
 * Validate SEO metadata
 */
function validateSEOMetadata(article) {
  const errors = [];

  // Meta title
  if (!article.meta_title || article.meta_title.length === 0) {
    errors.push('Missing meta title');
  } else if (article.meta_title.length > 60) {
    errors.push(`Meta title too long: ${article.meta_title.length} chars (max 60)`);
  } else if (article.meta_title.length < 30) {
    errors.push(`Meta title too short: ${article.meta_title.length} chars (min 30)`);
  }

  // Meta description
  if (!article.meta_description || article.meta_description.length === 0) {
    errors.push('Missing meta description');
  } else if (article.meta_description.length > 160) {
    errors.push(`Meta description too long: ${article.meta_description.length} chars (max 160)`);
  } else if (article.meta_description.length < 120) {
    errors.push(`Meta description too short: ${article.meta_description.length} chars (min 120)`);
  }

  // Slug
  if (!article.slug || article.slug.length === 0) {
    errors.push('Missing URL slug');
  } else if (!/^[a-z0-9-]+$/.test(article.slug)) {
    errors.push('Invalid slug format (use lowercase letters, numbers, and hyphens only)');
  }

  // Target keywords
  if (!article.target_keywords || article.target_keywords.length === 0) {
    errors.push('Missing target keywords');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate overall quality score
 */
function calculateQualityScore(validationResults) {
  let score = 100;

  // Deduct points for errors
  const totalErrors = Object.values(validationResults).reduce(
    (sum, result) => sum + (result.errors?.length || 0),
    0
  );

  score -= totalErrors * 5; // 5 points per error

  // Bonus for good word count
  const wordCount = validationResults.wordCount?.wordCount || 0;
  if (wordCount >= 1500 && wordCount <= 2500) {
    score += 10;
  }

  // Bonus for good structure
  const h2Count = validationResults.structure?.h2Count || 0;
  if (h2Count >= 5) {
    score += 5;
  }

  // Bonus for citations
  const citationCount = validationResults.citations?.citationCount || 0;
  if (citationCount >= 5) {
    score += 5;
  }

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

// =====================================================
// COMPREHENSIVE VALIDATOR
// =====================================================

/**
 * Run full pre-publish validation
 *
 * @param {Object} article - Article object with content and metadata
 * @returns {Object} Comprehensive validation result
 */
export function validateArticleForPublish(article) {
  const content = article.body || article.content || '';

  // Run all validators
  const results = {
    wordCount: validateWordCount(content),
    structure: validateStructure(content),
    shortcodes: validateShortcodesPresent(content),
    citations: validateCitations(content),
    seo: validateSEOMetadata(article),
  };

  // Calculate quality score
  const qualityScore = calculateQualityScore(results);

  // Aggregate errors
  const allErrors = Object.entries(results).reduce((errors, [key, result]) => {
    if (result.errors && result.errors.length > 0) {
      errors.push(
        ...result.errors.map((err) => ({
          category: key,
          message: err,
          severity: err.startsWith('⚠️') ? 'warning' : 'error',
        }))
      );
    }
    return errors;
  }, []);

  // Determine if article passes validation
  const criticalErrors = allErrors.filter((e) => e.severity === 'error');
  const isPassing = criticalErrors.length === 0 && qualityScore >= VALIDATION_RULES.MIN_QUALITY_SCORE;

  return {
    valid: isPassing,
    qualityScore,
    errors: allErrors,
    criticalErrorCount: criticalErrors.length,
    warningCount: allErrors.filter((e) => e.severity === 'warning').length,
    details: results,
    summary: {
      wordCount: results.wordCount.wordCount,
      h2Count: results.structure.h2Count,
      internalLinks: results.shortcodes.stats?.internal || 0,
      citations: results.citations.citationCount,
      qualityScore,
    },
  };
}

/**
 * Quick validation (lightweight check)
 * For use in real-time UI feedback
 */
export function quickValidate(content) {
  const wordCount = (content.match(/\w+/g) || []).length;
  const h2Count = (content.match(/<h2[^>]*>/g) || []).length;
  const shortcodeStats = getShortcodeStats(content);

  const issues = [];

  if (wordCount < VALIDATION_RULES.MIN_WORD_COUNT) {
    issues.push(`Need ${VALIDATION_RULES.MIN_WORD_COUNT - wordCount} more words`);
  }

  if (h2Count < VALIDATION_RULES.MIN_H2_HEADINGS) {
    issues.push(`Need ${VALIDATION_RULES.MIN_H2_HEADINGS - h2Count} more H2 headings`);
  }

  if (shortcodeStats.internal < VALIDATION_RULES.MIN_INTERNAL_LINKS) {
    issues.push(`Need ${VALIDATION_RULES.MIN_INTERNAL_LINKS - shortcodeStats.internal} more internal links`);
  }

  return {
    valid: issues.length === 0,
    issues,
    stats: {
      wordCount,
      h2Count,
      internalLinks: shortcodeStats.internal,
    },
  };
}

export default {
  validateArticleForPublish,
  quickValidate,
  VALIDATION_RULES,
};
