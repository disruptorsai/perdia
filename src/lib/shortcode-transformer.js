/**
 * PERDIA V2: WORDPRESS SHORTCODE TRANSFORMER
 * ===========================================
 *
 * ⚠️ MANDATORY CLIENT REQUIREMENT ⚠️
 *
 * Transforms all HTML links to GetEducated.com shortcodes for:
 * - Monetization tracking (affiliate clicks)
 * - Link management (update links centrally)
 * - Analytics (track internal vs external traffic)
 *
 * Shortcode Types:
 * - [ge_internal_link url="..."]text[/ge_internal_link] - Internal GetEducated pages
 * - [ge_affiliate_link url="..."]text[/ge_affiliate_link] - Affiliate partner links
 * - [ge_external_link url="..."]text[/ge_external_link] - External authority links
 *
 * Created: 2025-11-12
 * Author: Perdia V2 Implementation
 */

/**
 * Transform all HTML links to GetEducated shortcodes
 * @param {string} content - HTML content with <a> tags
 * @param {Object} options - Transformation options
 * @returns {Object} { content, stats }
 */
export function transformLinksToShortcodes(content, options = {}) {
  const {
    siteUrl = 'https://geteducated.com',
    affiliateDomains = ['coursera.org', 'udemy.com', 'edx.org', 'linkedin.com/learning'],
    preserveExisting = true,
  } = options;

  const stats = {
    total_links: 0,
    internal_links: 0,
    affiliate_links: 0,
    external_links: 0,
    already_shortcodes: 0,
    transformations: [],
  };

  // Skip if content already has shortcodes and preserveExisting is true
  if (preserveExisting && content.includes('[ge_')) {
    const shortcodeCount = (content.match(/\[ge_\w+_link/g) || []).length;
    stats.already_shortcodes = shortcodeCount;
    console.log('[ShortcodeTransformer] Content already has shortcodes', { count: shortcodeCount });
  }

  // Find all <a> tags
  const linkPattern = /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>(.*?)<\/a>/gi;
  let match;
  let transformedContent = content;

  while ((match = linkPattern.exec(content)) !== null) {
    const [fullMatch, beforeHref, url, afterHref, linkText] = match;
    stats.total_links++;

    // Parse URL
    let parsedUrl;
    try {
      // Handle relative URLs
      if (url.startsWith('/')) {
        parsedUrl = new URL(url, siteUrl);
      } else if (url.startsWith('#')) {
        // Skip anchor links
        continue;
      } else {
        parsedUrl = new URL(url);
      }
    } catch (error) {
      console.warn('[ShortcodeTransformer] Invalid URL, skipping:', url);
      continue;
    }

    // Extract additional attributes (class, id, title, etc.)
    const attrs = extractAttributes(beforeHref + ' ' + afterHref);

    // Determine link type
    const linkType = determineLinkType(parsedUrl, siteUrl, affiliateDomains);

    // Generate shortcode
    const shortcode = generateShortcode(linkType, url, linkText, attrs);

    // Replace in content
    transformedContent = transformedContent.replace(fullMatch, shortcode);

    // Update stats
    stats[`${linkType}_links`]++;
    stats.transformations.push({
      original: fullMatch,
      shortcode,
      type: linkType,
      url,
    });
  }

  console.log('[ShortcodeTransformer] Transformation complete', stats);

  return {
    content: transformedContent,
    stats,
  };
}

/**
 * Determine link type (internal, affiliate, external)
 */
function determineLinkType(parsedUrl, siteUrl, affiliateDomains) {
  const urlHost = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
  const siteHost = new URL(siteUrl).hostname.toLowerCase().replace(/^www\./, '');

  // Check if internal
  if (urlHost === siteHost) {
    return 'internal';
  }

  // Check if affiliate
  for (const domain of affiliateDomains) {
    const affiliateHost = domain.toLowerCase().replace(/^www\./, '');
    if (urlHost.includes(affiliateHost) || affiliateHost.includes(urlHost)) {
      return 'affiliate';
    }
  }

  // Default to external
  return 'external';
}

/**
 * Extract attributes from HTML tag
 */
function extractAttributes(attrString) {
  const attrs = {};

  // Extract class
  const classMatch = attrString.match(/class=["']([^"']+)["']/i);
  if (classMatch) {
    attrs.class = classMatch[1];
  }

  // Extract id
  const idMatch = attrString.match(/id=["']([^"']+)["']/i);
  if (idMatch) {
    attrs.id = idMatch[1];
  }

  // Extract title
  const titleMatch = attrString.match(/title=["']([^"']+)["']/i);
  if (titleMatch) {
    attrs.title = titleMatch[1];
  }

  // Extract target
  const targetMatch = attrString.match(/target=["']([^"']+)["']/i);
  if (targetMatch) {
    attrs.target = targetMatch[1];
  }

  // Extract rel
  const relMatch = attrString.match(/rel=["']([^"']+)["']/i);
  if (relMatch) {
    attrs.rel = relMatch[1];
  }

  return attrs;
}

/**
 * Generate GetEducated shortcode
 */
function generateShortcode(type, url, text, attrs = {}) {
  let shortcodeAttrs = `url="${url}"`;

  // Add optional attributes
  if (attrs.class) {
    shortcodeAttrs += ` class="${attrs.class}"`;
  }
  if (attrs.id) {
    shortcodeAttrs += ` id="${attrs.id}"`;
  }
  if (attrs.title) {
    shortcodeAttrs += ` title="${attrs.title}"`;
  }
  if (attrs.target) {
    shortcodeAttrs += ` target="${attrs.target}"`;
  }
  if (attrs.rel) {
    shortcodeAttrs += ` rel="${attrs.rel}"`;
  }

  // Generate shortcode based on type
  return `[ge_${type}_link ${shortcodeAttrs}]${text}[/ge_${type}_link]`;
}

/**
 * Validate shortcode syntax
 * @param {string} content - Content with shortcodes
 * @returns {Object} { valid, errors }
 */
export function validateShortcodes(content) {
  const errors = [];

  // Check for unclosed shortcodes
  const openTags = (content.match(/\[ge_\w+_link/g) || []).length;
  const closeTags = (content.match(/\[\/ge_\w+_link\]/g) || []).length;

  if (openTags !== closeTags) {
    errors.push({
      type: 'unclosed_tags',
      message: `Unclosed shortcode tags: ${openTags} open, ${closeTags} close`,
    });
  }

  // Check for malformed shortcodes (missing url attribute)
  const shortcodePattern = /\[ge_(\w+)_link\s+([^\]]+)\]/g;
  let match;

  while ((match = shortcodePattern.exec(content)) !== null) {
    const [fullMatch, linkType, attrs] = match;

    if (!attrs.includes('url=')) {
      errors.push({
        type: 'missing_url',
        message: `Shortcode missing url attribute: ${fullMatch}`,
        shortcode: fullMatch,
      });
    }

    // Validate link type
    if (!['internal', 'affiliate', 'external'].includes(linkType)) {
      errors.push({
        type: 'invalid_type',
        message: `Invalid link type "${linkType}": ${fullMatch}`,
        shortcode: fullMatch,
      });
    }
  }

  // Check for remaining HTML <a> tags
  const htmlLinks = (content.match(/<a\s+[^>]*href=/gi) || []).length;
  if (htmlLinks > 0) {
    errors.push({
      type: 'html_links_found',
      message: `Found ${htmlLinks} HTML <a> tags that should be shortcodes`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Convert shortcodes back to HTML (for preview/editing)
 * @param {string} content - Content with shortcodes
 * @param {Object} options - Conversion options
 * @returns {string} Content with HTML links
 */
export function convertShortcodesToHtml(content, options = {}) {
  const {
    addNofollow = true,
    openExternalInNewTab = true,
  } = options;

  // Convert all shortcodes to HTML
  const shortcodePattern = /\[ge_(\w+)_link\s+url="([^"]+)"([^\]]*?)\](.*?)\[\/ge_\1_link\]/g;

  return content.replace(shortcodePattern, (match, linkType, url, attrs, text) => {
    let htmlAttrs = [];

    // Extract optional attributes
    const classMatch = attrs.match(/class="([^"]+)"/);
    if (classMatch) {
      htmlAttrs.push(`class="${classMatch[1]}"`);
    }

    const idMatch = attrs.match(/id="([^"]+)"/);
    if (idMatch) {
      htmlAttrs.push(`id="${idMatch[1]}"`);
    }

    const titleMatch = attrs.match(/title="([^"]+)"/);
    if (titleMatch) {
      htmlAttrs.push(`title="${titleMatch[1]}"`);
    }

    // Add target for external links
    if (linkType === 'external' && openExternalInNewTab) {
      htmlAttrs.push('target="_blank"');
    }

    // Add nofollow for external/affiliate links
    if ((linkType === 'external' || linkType === 'affiliate') && addNofollow) {
      htmlAttrs.push('rel="nofollow noopener noreferrer"');
    }

    // Build HTML tag
    return `<a href="${url}" ${htmlAttrs.join(' ')}>${text}</a>`;
  });
}

/**
 * Get shortcode statistics from content
 * @param {string} content - Content with shortcodes
 * @returns {Object} Statistics object
 */
export function getShortcodeStats(content) {
  const stats = {
    total: 0,
    internal: 0,
    affiliate: 0,
    external: 0,
    by_url: {},
  };

  const shortcodePattern = /\[ge_(\w+)_link\s+url="([^"]+)"/g;
  let match;

  while ((match = shortcodePattern.exec(content)) !== null) {
    const [, linkType, url] = match;

    stats.total++;
    stats[linkType] = (stats[linkType] || 0) + 1;

    // Track URLs
    if (!stats.by_url[url]) {
      stats.by_url[url] = { type: linkType, count: 0 };
    }
    stats.by_url[url].count++;
  }

  return stats;
}

/**
 * Batch transform multiple content items
 * @param {Array} contentItems - Array of content objects
 * @param {Object} options - Transformation options
 * @returns {Promise<Array>} Transformed content items
 */
export async function batchTransform(contentItems, options = {}) {
  console.log('[ShortcodeTransformer] Starting batch transformation', {
    count: contentItems.length,
  });

  const results = [];

  for (const item of contentItems) {
    try {
      const result = transformLinksToShortcodes(item.content, options);
      results.push({
        id: item.id,
        success: true,
        content: result.content,
        stats: result.stats,
      });
    } catch (error) {
      console.error('[ShortcodeTransformer] Transformation failed', { id: item.id, error });
      results.push({
        id: item.id,
        success: false,
        error: error.message,
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log('[ShortcodeTransformer] Batch transformation complete', {
    total: contentItems.length,
    successful: successCount,
    failed: contentItems.length - successCount,
  });

  return results;
}

export default {
  transformLinksToShortcodes,
  validateShortcodes,
  convertShortcodesToHtml,
  getShortcodeStats,
  batchTransform,
};
