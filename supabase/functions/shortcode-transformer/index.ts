/**
 * Shortcode Transformer Edge Function
 *
 * Transforms HTML <a> tags to GetEducated.com shortcodes for:
 * - Internal links: [ge_internal_link]...[/ge_internal_link]
 * - Affiliate links: [ge_affiliate_link]...[/ge_affiliate_link]
 * - External links: [ge_external_link]...[/ge_external_link]
 *
 * CRITICAL: Client requirement (Kaylee, Nov 10 transcript):
 * "we set up hyperlinks through short codes and we set up monetization through short codes"
 *
 * This is MANDATORY for monetization tracking.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Affiliate domains that should use [ge_affiliate_link]
// TODO: Update this list with actual GetEducated.com affiliate partners
const AFFILIATE_DOMAINS = [
  'shareasale.com',
  'cj.com',
  'commission-junction.com',
  'impact.com',
  'impactradius.com',
  'partnerstack.com',
  'awin1.com',
  'tkqlhce.com',
  'jdoqocy.com',
  'anrdoezrs.net',
  'dpbolvw.net',
  'affiliatetechnology.com',
  // Add GetEducated.com specific partners here
];

// GetEducated.com domains for internal links
const INTERNAL_DOMAINS = [
  'geteducated.com',
  'www.geteducated.com',
];

interface TransformResult {
  content: string;
  transformations: {
    total: number;
    internal: number;
    affiliate: number;
    external: number;
  };
  issues: string[];
}

/**
 * Check if URL is an internal link
 */
function isInternalLink(url: string): boolean {
  try {
    // Relative URLs (starts with /) are internal
    if (url.startsWith('/')) {
      return true;
    }

    const urlObj = new URL(url);
    return INTERNAL_DOMAINS.some(domain =>
      urlObj.hostname.toLowerCase() === domain.toLowerCase()
    );
  } catch {
    // If URL parsing fails, treat as relative/internal
    return url.startsWith('/');
  }
}

/**
 * Check if URL is an affiliate link
 */
function isAffiliateLink(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    return AFFILIATE_DOMAINS.some(domain =>
      hostname.includes(domain.toLowerCase())
    );
  } catch {
    return false;
  }
}

/**
 * Extract attributes from HTML tag
 */
function extractAttributes(beforeHref: string, afterHref: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const fullAttributes = beforeHref + ' ' + afterHref;

  // Match attributes like: attribute="value" or attribute='value'
  const attrRegex = /(\w+)=["']([^"']+)["']/g;
  let match;

  while ((match = attrRegex.exec(fullAttributes)) !== null) {
    const [, key, value] = match;
    // Skip href as we handle it separately
    if (key !== 'href') {
      attributes[key] = value;
    }
  }

  return attributes;
}

/**
 * Transform all <a> tags to shortcodes
 */
function transformLinks(html: string): TransformResult {
  const transformations = {
    total: 0,
    internal: 0,
    affiliate: 0,
    external: 0,
  };
  const issues: string[] = [];

  // Regex to match <a> tags with href
  // Matches: <a [attributes] href="url" [attributes]>text</a>
  const linkRegex = /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>(.*?)<\/a>/gi;

  const transformed = html.replace(linkRegex, (match, before, url, after, text) => {
    transformations.total++;

    // Extract other attributes (class, target, rel, etc.)
    const attributes = extractAttributes(before, after);

    // Determine shortcode type
    let shortcode: string;
    if (isInternalLink(url)) {
      shortcode = 'ge_internal_link';
      transformations.internal++;
    } else if (isAffiliateLink(url)) {
      shortcode = 'ge_affiliate_link';
      transformations.affiliate++;

      // Auto-add rel="sponsored nofollow" for affiliate links if not present
      if (!attributes.rel) {
        attributes.rel = 'sponsored nofollow';
      }
    } else {
      shortcode = 'ge_external_link';
      transformations.external++;

      // Auto-add rel="nofollow" for external links if not present
      if (!attributes.rel) {
        attributes.rel = 'nofollow';
      }

      // Auto-add target="_blank" for external links if not present
      if (!attributes.target) {
        attributes.target = '_blank';
      }
    }

    // Build shortcode attributes string
    const attrs = Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    // Return shortcode
    return `[${shortcode} url="${url}" ${attrs}]${text}[/${shortcode}]`;
  });

  // Check for remaining raw <a> tags (malformed HTML)
  const remainingLinks = (transformed.match(/<a\s+/gi) || []).length;
  if (remainingLinks > 0) {
    issues.push(`${remainingLinks} malformed links could not be transformed (check HTML syntax)`);
  }

  return { content: transformed, transformations, issues };
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
    const { html, content_id } = await req.json();

    // Validation
    if (!html || typeof html !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Invalid input: html string required',
          usage: 'POST { "html": "<p>Your HTML content...</p>", "content_id": "optional-uuid" }',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Transform links
    const result = transformLinks(html);

    // Log transformation for monitoring
    console.log('[Shortcode Transformer]', {
      content_id: content_id || 'unknown',
      transformations: result.transformations,
      issues: result.issues,
    });

    return new Response(
      JSON.stringify({
        success: true,
        content_id,
        ...result,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Shortcode Transformer] Error:', error);

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
