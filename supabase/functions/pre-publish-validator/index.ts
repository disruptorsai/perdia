/**
 * Pre-Publish Validator Edge Function
 *
 * Quality gates that MUST pass before content can be published to WordPress.
 * Enforces GetEducated.com content standards and prevents publishing issues.
 *
 * CRITICAL: This is the final checkpoint before content goes live.
 *
 * Quality Gates:
 * 1. Shortcode compliance (zero raw HTML <a> tags)
 * 2. JSON-LD structured data present and valid
 * 3. Internal links: 2-5 per article
 * 4. External authority links: ≥1
 * 5. Word count: 1500-3000
 * 6. FAQ section (if required by template)
 * 7. Meta description: 150-160 characters
 * 8. Title: 50-60 characters
 *
 * Returns actionable error messages for failed validations.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  metrics: {
    word_count: number;
    internal_link_count: number;
    external_link_count: number;
    shortcode_count: number;
    raw_html_link_count: number;
    has_json_ld: boolean;
    has_faq: boolean;
    meta_description_length: number;
    title_length: number;
  };
}

/**
 * Count words in HTML content (strips tags)
 */
function countWords(html: string): number {
  // Remove HTML tags
  const text = html.replace(/<[^>]*>/g, ' ');
  // Remove extra whitespace
  const cleaned = text.replace(/\s+/g, ' ').trim();
  // Count words
  const words = cleaned.split(' ').filter(word => word.length > 0);
  return words.length;
}

/**
 * Check for shortcode compliance
 * CRITICAL: GetEducated.com requires ALL links to be shortcodes
 */
function validateShortcodes(html: string): {
  passed: boolean;
  errors: string[];
  metrics: { shortcode_count: number; raw_html_link_count: number };
} {
  const errors: string[] = [];

  // Count shortcodes
  const internalShortcodes = (html.match(/\[ge_internal_link/g) || []).length;
  const affiliateShortcodes = (html.match(/\[ge_affiliate_link/g) || []).length;
  const externalShortcodes = (html.match(/\[ge_external_link/g) || []).length;
  const shortcode_count = internalShortcodes + affiliateShortcodes + externalShortcodes;

  // Check for raw HTML links (NOT ALLOWED)
  const rawLinks = html.match(/<a\s+[^>]*href=/gi) || [];
  const raw_html_link_count = rawLinks.length;

  if (raw_html_link_count > 0) {
    errors.push(
      `❌ CRITICAL: ${raw_html_link_count} raw HTML link(s) detected. ALL links must use GetEducated.com shortcodes ([ge_internal_link], [ge_affiliate_link], [ge_external_link]). Run content through shortcode-transformer first.`
    );
  }

  if (shortcode_count === 0) {
    errors.push(
      '⚠️ WARNING: No shortcodes found. Content should include internal and external links for SEO.'
    );
  }

  return {
    passed: raw_html_link_count === 0,
    errors,
    metrics: { shortcode_count, raw_html_link_count },
  };
}

/**
 * Validate internal linking (2-5 per article)
 */
function validateInternalLinks(html: string): {
  passed: boolean;
  errors: string[];
  count: number;
} {
  const errors: string[] = [];
  const internalLinks = (html.match(/\[ge_internal_link/g) || []).length;

  if (internalLinks < 2) {
    errors.push(
      `❌ Insufficient internal links (${internalLinks}). Requirement: 2-5 internal links for SEO. Add more [ge_internal_link] shortcodes.`
    );
  } else if (internalLinks > 5) {
    errors.push(
      `⚠️ WARNING: Too many internal links (${internalLinks}). Best practice: 2-5 links. Consider removing some to avoid keyword dilution.`
    );
  }

  return {
    passed: internalLinks >= 2 && internalLinks <= 5,
    errors,
    count: internalLinks,
  };
}

/**
 * Validate external authority links (≥1)
 */
function validateExternalLinks(html: string): {
  passed: boolean;
  errors: string[];
  count: number;
} {
  const errors: string[] = [];
  const externalLinks = (html.match(/\[ge_external_link/g) || []).length;

  if (externalLinks < 1) {
    errors.push(
      '❌ No external authority links found. Requirement: ≥1 external link to authoritative source (e.g., .gov, .edu, reputable publications) for credibility and SEO.'
    );
  }

  return {
    passed: externalLinks >= 1,
    errors,
    count: externalLinks,
  };
}

/**
 * Validate JSON-LD structured data
 */
function validateJsonLd(html: string): {
  passed: boolean;
  errors: string[];
  has_json_ld: boolean;
} {
  const errors: string[] = [];
  const hasJsonLd = html.includes('<script type="application/ld+json">');

  if (!hasJsonLd) {
    errors.push(
      '❌ Missing JSON-LD structured data. Required for Google Rich Results. Include at least one schema (Article, FAQPage, or BreadcrumbList).'
    );
  } else {
    // Try to validate JSON structure
    const jsonLdMatch = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i
    );
    if (jsonLdMatch) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1]);
        // Basic validation: should have @context and @type
        if (!jsonData['@context'] || !jsonData['@type']) {
          errors.push(
            '⚠️ WARNING: JSON-LD structure incomplete. Missing @context or @type. Validate with Google Rich Results Test.'
          );
        }
      } catch (e) {
        errors.push(
          '❌ Invalid JSON-LD syntax. Fix JSON structure before publishing. Test with Google Rich Results Test.'
        );
      }
    }
  }

  return {
    passed: hasJsonLd,
    errors,
    has_json_ld: hasJsonLd,
  };
}

/**
 * Validate FAQ section (if required)
 */
function validateFaq(html: string): {
  has_faq: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const hasFaq = html.includes('<h2>FAQ</h2>') || html.includes('<h2>Frequently Asked Questions</h2>');

  // FAQ is not always required, but if present, validate structure
  if (hasFaq) {
    const faqJsonLd = html.includes('"@type": "FAQPage"');
    if (!faqJsonLd) {
      errors.push(
        '⚠️ WARNING: FAQ section found but missing FAQPage schema. Add JSON-LD FAQPage schema for Rich Results.'
      );
    }
  }

  return {
    has_faq: hasFaq,
    errors,
  };
}

/**
 * Validate word count (1500-3000)
 */
function validateWordCount(html: string): {
  passed: boolean;
  errors: string[];
  word_count: number;
} {
  const errors: string[] = [];
  const word_count = countWords(html);

  if (word_count < 1500) {
    errors.push(
      `❌ Content too short (${word_count} words). Minimum: 1500 words for SEO ranking. Expand content with more detailed information, examples, or sections.`
    );
  } else if (word_count > 3000) {
    errors.push(
      `⚠️ WARNING: Content very long (${word_count} words). Optimal: 1500-3000 words. Consider splitting into multiple articles or removing redundant content.`
    );
  }

  return {
    passed: word_count >= 1500 && word_count <= 3000,
    errors,
    word_count,
  };
}

/**
 * Validate meta description
 */
function validateMetaDescription(metaDescription: string | null): {
  passed: boolean;
  errors: string[];
  length: number;
} {
  const errors: string[] = [];
  const length = metaDescription?.length || 0;

  if (!metaDescription || length === 0) {
    errors.push('❌ Missing meta description. Required for SEO and search result snippets.');
  } else if (length < 150) {
    errors.push(
      `⚠️ Meta description too short (${length} chars). Optimal: 150-160 characters for full search snippet display.`
    );
  } else if (length > 160) {
    errors.push(
      `⚠️ Meta description too long (${length} chars). Will be truncated in search results. Shorten to 150-160 characters.`
    );
  }

  return {
    passed: length >= 150 && length <= 160,
    errors,
    length,
  };
}

/**
 * Validate title
 */
function validateTitle(title: string | null): {
  passed: boolean;
  errors: string[];
  length: number;
} {
  const errors: string[] = [];
  const length = title?.length || 0;

  if (!title || length === 0) {
    errors.push('❌ Missing title. Required for publishing.');
  } else if (length < 50) {
    errors.push(
      `⚠️ Title too short (${length} chars). Optimal: 50-60 characters for SEO. Consider adding relevant keywords.`
    );
  } else if (length > 60) {
    errors.push(
      `⚠️ Title too long (${length} chars). Will be truncated in search results. Shorten to 50-60 characters.`
    );
  }

  return {
    passed: length >= 50 && length <= 60,
    errors,
    length,
  };
}

/**
 * Run all validation checks
 */
function validateContent(
  html: string,
  title: string | null,
  metaDescription: string | null
): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Critical validations (must pass)
  const shortcodeValidation = validateShortcodes(html);
  allErrors.push(...shortcodeValidation.errors);

  const internalLinkValidation = validateInternalLinks(html);
  allErrors.push(...internalLinkValidation.errors);

  const externalLinkValidation = validateExternalLinks(html);
  allErrors.push(...externalLinkValidation.errors);

  const jsonLdValidation = validateJsonLd(html);
  allErrors.push(...jsonLdValidation.errors);

  const wordCountValidation = validateWordCount(html);
  allErrors.push(...wordCountValidation.errors);

  // Meta validations
  const metaDescValidation = validateMetaDescription(metaDescription);
  allErrors.push(...metaDescValidation.errors);

  const titleValidation = validateTitle(title);
  allErrors.push(...titleValidation.errors);

  // FAQ validation (warnings only)
  const faqValidation = validateFaq(html);
  allWarnings.push(...faqValidation.errors);

  // Separate errors and warnings
  const errors = allErrors.filter(e => e.startsWith('❌'));
  const warnings = allErrors.filter(e => e.startsWith('⚠️')).concat(allWarnings);

  return {
    passed: errors.length === 0, // Must have zero errors to pass
    errors,
    warnings,
    metrics: {
      word_count: wordCountValidation.word_count,
      internal_link_count: internalLinkValidation.count,
      external_link_count: externalLinkValidation.count,
      shortcode_count: shortcodeValidation.metrics.shortcode_count,
      raw_html_link_count: shortcodeValidation.metrics.raw_html_link_count,
      has_json_ld: jsonLdValidation.has_json_ld,
      has_faq: faqValidation.has_faq,
      meta_description_length: metaDescValidation.length,
      title_length: titleValidation.length,
    },
  };
}

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      html,
      title = null,
      meta_description = null,
      content_id = null,
    } = await req.json();

    // Validation
    if (!html || typeof html !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Invalid input: html string required',
          usage:
            'POST { "html": "<article>...</article>", "title": "...", "meta_description": "...", "content_id": "optional-uuid" }',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Run validation
    const result = validateContent(html, title, meta_description);

    // Log validation for monitoring
    console.log('[Pre-Publish Validator]', {
      content_id: content_id || 'unknown',
      passed: result.passed,
      error_count: result.errors.length,
      warning_count: result.warnings.length,
      metrics: result.metrics,
    });

    return new Response(
      JSON.stringify({
        success: true,
        content_id,
        ...result,
        message: result.passed
          ? '✅ All quality gates passed. Content ready for publishing.'
          : '❌ Validation failed. Fix errors before publishing.',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Pre-Publish Validator] Error:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
