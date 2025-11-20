/**
 * PERDIA EDUCATION - SHORTCODE TRANSFORMATION SYSTEM
 * ===================================================
 * Transforms standard HTML links into GetEducated.com shortcodes
 *
 * MANDATORY CLIENT REQUIREMENT:
 * All links MUST use GetEducated shortcodes for monetization tracking
 *
 * Shortcode Types:
 * - [ge_internal_link url="..."]text[/ge_internal_link] - Internal site links
 * - [ge_affiliate_link url="..."]text[/ge_affiliate_link] - Affiliate links
 * - [ge_external_link url="..."]text[/ge_external_link] - External references
 */

import { Shortcode } from './perdia-sdk';

// =====================================================
// SHORTCODE PATTERNS
// =====================================================

const SHORTCODE_TYPES = {
  INTERNAL: 'ge_internal_link',
  AFFILIATE: 'ge_affiliate_link',
  EXTERNAL: 'ge_external_link',
};

// Patterns to identify link types
const GETEDUCATED_DOMAINS = [
  'geteducated.com',
  'www.geteducated.com',
];

const AFFILIATE_DOMAINS = [
  'shareasale.com',
  'cj.com',
  'impact.com',
  'partnerstack.com',
  // Add more affiliate domains as needed
];

// =====================================================
// SHORTCODE DATABASE
// =====================================================

let shortcodeCache = null;

/**
 * Load shortcodes from database and cache them
 */
async function loadShortcodes() {
  if (shortcodeCache) {
    return shortcodeCache;
  }

  try {
    const shortcodes = await Shortcode.find({});
    shortcodeCache = shortcodes.reduce((acc, sc) => {
      acc[sc.shortcode_tag] = sc;
      return acc;
    }, {});
    return shortcodeCache;
  } catch (error) {
    console.error('[shortcode-transformer] Error loading shortcodes:', error);
    return {};
  }
}

/**
 * Determine link type based on URL
 */
function determineLinkType(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Check if it's an internal GetEducated link
    if (GETEDUCATED_DOMAINS.some((domain) => hostname.includes(domain))) {
      return SHORTCODE_TYPES.INTERNAL;
    }

    // Check if it's an affiliate link
    if (AFFILIATE_DOMAINS.some((domain) => hostname.includes(domain))) {
      return SHORTCODE_TYPES.AFFILIATE;
    }

    // Default to external link
    return SHORTCODE_TYPES.EXTERNAL;
  } catch (error) {
    // Invalid URL, default to external
    return SHORTCODE_TYPES.EXTERNAL;
  }
}

// =====================================================
// TRANSFORMATION FUNCTIONS
// =====================================================

/**
 * Transform a single HTML link to GetEducated shortcode
 *
 * @param {string} href - Link URL
 * @param {string} text - Link text
 * @param {string} [forceType] - Force specific shortcode type
 * @returns {string} Shortcode
 */
export function transformLink(href, text, forceType = null) {
  const type = forceType || determineLinkType(href);

  switch (type) {
    case SHORTCODE_TYPES.INTERNAL:
      return `[ge_internal_link url="${href}"]${text}[/ge_internal_link]`;
    case SHORTCODE_TYPES.AFFILIATE:
      return `[ge_affiliate_link url="${href}"]${text}[/ge_affiliate_link]`;
    case SHORTCODE_TYPES.EXTERNAL:
      return `[ge_external_link url="${href}"]${text}[/ge_external_link]`;
    default:
      return `[ge_external_link url="${href}"]${text}[/ge_external_link]`;
  }
}

/**
 * Transform all HTML links in content to shortcodes
 *
 * @param {string} content - HTML content
 * @returns {string} Content with shortcodes
 */
export function transformAllLinks(content) {
  if (!content) return content;

  // Regex to match HTML anchor tags
  // Matches: <a href="url">text</a>
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi;

  return content.replace(linkRegex, (match, href, text) => {
    // Preserve other attributes if needed (could be enhanced later)
    return transformLink(href, text);
  });
}

/**
 * Transform content with citation links
 * Preserves existing citation links while transforming others
 *
 * @param {string} content - HTML content with citations
 * @returns {string} Content with transformed links
 */
export function transformWithCitations(content) {
  if (!content) return content;

  // More sophisticated regex that captures attributes
  const linkRegex = /<a\s+([^>]*?)>(.*?)<\/a>/gi;

  return content.replace(linkRegex, (match, attributes, text) => {
    // Extract href
    const hrefMatch = attributes.match(/href=["']([^"']*)["']/);
    if (!hrefMatch) return match; // No href, leave as is

    const href = hrefMatch[1];

    // Check if it's a citation (external reference with noopener)
    const isExternal = attributes.includes('target="_blank"') ||
                       attributes.includes('rel="noopener"');

    // If it's a citation to an authoritative source, use external shortcode
    const isCitation = isExternal && (
      href.includes('.edu') ||
      href.includes('.gov') ||
      href.includes('doi.org') ||
      href.includes('ncbi.nlm.nih.gov')
    );

    if (isCitation) {
      return transformLink(href, text, SHORTCODE_TYPES.EXTERNAL);
    }

    // Otherwise, auto-detect type
    return transformLink(href, text);
  });
}

/**
 * Validate that all links in content use shortcodes
 *
 * @param {string} content - HTML content
 * @returns {Object} Validation result
 */
export function validateShortcodes(content) {
  if (!content) {
    return { valid: true, errors: [], htmlLinkCount: 0 };
  }

  // Find all remaining HTML links (not shortcodes)
  const htmlLinks = content.match(/<a\s+(?:[^>]*?\s+)?href=/gi) || [];

  return {
    valid: htmlLinks.length === 0,
    errors: htmlLinks.length > 0
      ? [`Found ${htmlLinks.length} HTML links that should be converted to shortcodes`]
      : [],
    htmlLinkCount: htmlLinks.length,
  };
}

/**
 * Get shortcode statistics from content
 *
 * @param {string} content - Content with shortcodes
 * @returns {Object} Statistics
 */
export function getShortcodeStats(content) {
  if (!content) {
    return { internal: 0, affiliate: 0, external: 0, total: 0 };
  }

  const internalCount = (content.match(/\[ge_internal_link/g) || []).length;
  const affiliateCount = (content.match(/\[ge_affiliate_link/g) || []).length;
  const externalCount = (content.match(/\[ge_external_link/g) || []).length;

  return {
    internal: internalCount,
    affiliate: affiliateCount,
    external: externalCount,
    total: internalCount + affiliateCount + externalCount,
  };
}

// =====================================================
// PRE-PUBLISH TRANSFORMATION
// =====================================================

/**
 * Full pre-publish transformation workflow
 * Transforms all links and validates
 *
 * @param {string} content - Article content
 * @returns {Object} Transformed content and validation
 */
export function prePublishTransform(content) {
  // Transform all links to shortcodes
  const transformedContent = transformAllLinks(content);

  // Validate
  const validation = validateShortcodes(transformedContent);

  // Get stats
  const stats = getShortcodeStats(transformedContent);

  return {
    content: transformedContent,
    validation,
    stats,
  };
}

// =====================================================
// EXPORTS
// =====================================================

export default {
  transformLink,
  transformAllLinks,
  transformWithCitations,
  validateShortcodes,
  getShortcodeStats,
  prePublishTransform,
  loadShortcodes,
};
