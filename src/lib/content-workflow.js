/**
 * Content Workflow Module
 *
 * Manages the complete content lifecycle from generation to WordPress publishing.
 * Integrates shortcode transformation, validation, and SLA enforcement.
 *
 * Workflow Stages:
 * 1. Draft → Generate content with AI
 * 2. Transform → Convert HTML links to shortcodes (MANDATORY)
 * 3. Validate → Run pre-publish quality gates
 * 4. Review → Submit for manual review (starts SLA timer)
 * 5. Approve → Manual or auto-approval after 5 days
 * 6. Publish → Publish to WordPress
 *
 * @module content-workflow
 */

import { supabase } from '@/lib/supabase-client';

/**
 * Transform HTML links to GetEducated.com shortcodes
 *
 * CRITICAL: This is MANDATORY before publishing (client requirement).
 * Kaylee (Nov 10): "we set up hyperlinks through short codes and we set up
 * monetization through short codes"
 *
 * @param {string} contentId - Content queue item ID
 * @param {string} htmlContent - HTML content with <a> tags
 * @returns {Promise<{success: boolean, content: string, transformations: Object, errors: string[]}>}
 *
 * @example
 * const result = await transformContentLinks('uuid', '<p><a href="/programs">Programs</a></p>');
 * // Returns: { success: true, content: '<p>[ge_internal_link url="/programs"]Programs[/ge_internal_link]</p>', ... }
 */
export async function transformContentLinks(contentId, htmlContent) {
  try {
    const { data, error } = await supabase.functions.invoke('shortcode-transformer', {
      body: {
        html: htmlContent,
        content_id: contentId,
      },
    });

    if (error) throw error;

    if (!data.success) {
      return {
        success: false,
        content: htmlContent,
        error: 'Shortcode transformation failed',
        issues: data.issues || [],
      };
    }

    return {
      success: true,
      content: data.content,
      transformations: data.transformations,
      issues: data.issues || [],
    };
  } catch (error) {
    console.error('[Content Workflow] Transform error:', error);
    return {
      success: false,
      content: htmlContent,
      error: error.message,
      issues: [],
    };
  }
}

/**
 * Validate content for publishing (runs all quality gates)
 *
 * Checks:
 * - Shortcode compliance (zero raw HTML links)
 * - JSON-LD structured data
 * - Internal links: 2-5
 * - External links: ≥1
 * - Word count: 1500-3000
 * - Meta description: 150-160 chars
 * - Title: 50-60 chars
 *
 * @param {string} contentId - Content queue item ID
 * @returns {Promise<{passed: boolean, errors: string[], warnings: string[], metrics: Object}>}
 *
 * @example
 * const validation = await validateContentForPublishing('uuid');
 * if (!validation.passed) {
 *   console.error('Validation failed:', validation.errors);
 * }
 */
export async function validateContentForPublishing(contentId) {
  try {
    // Get content from queue
    const { data: content, error: fetchError } = await supabase
      .from('content_queue')
      .select('content, title, meta_description')
      .eq('id', contentId)
      .single();

    if (fetchError) throw fetchError;

    // Call validator
    const { data, error } = await supabase.functions.invoke('pre-publish-validator', {
      body: {
        html: content.content,
        title: content.title,
        meta_description: content.meta_description,
        content_id: contentId,
      },
    });

    if (error) throw error;

    // Log validation result to database
    const { error: logError } = await supabase
      .from('shortcode_validation_logs')
      .insert({
        content_id: contentId,
        validation_passed: data.passed,
        errors: data.errors,
        warnings: data.warnings,
        ...data.metrics,
      });

    if (logError) {
      console.error('[Content Workflow] Failed to log validation:', logError);
    }

    return {
      passed: data.passed,
      errors: data.errors || [],
      warnings: data.warnings || [],
      metrics: data.metrics || {},
    };
  } catch (error) {
    console.error('[Content Workflow] Validation error:', error);
    return {
      passed: false,
      errors: [`Validation service error: ${error.message}`],
      warnings: [],
      metrics: {},
    };
  }
}

/**
 * Complete pre-publish pipeline: Transform + Validate
 *
 * This is the recommended function to call before submitting content for review.
 * It ensures content is transformed to shortcodes AND passes all quality gates.
 *
 * @param {string} contentId - Content queue item ID
 * @returns {Promise<{success: boolean, transformed: boolean, validated: boolean, errors: string[], warnings: string[]}>}
 *
 * @example
 * const result = await prepareForPublishing('uuid');
 * if (result.success) {
 *   await submitForReview('uuid');
 * } else {
 *   console.error('Cannot submit:', result.errors);
 * }
 */
export async function prepareForPublishing(contentId) {
  try {
    // Step 1: Get current content
    const { data: content, error: fetchError } = await supabase
      .from('content_queue')
      .select('content, title, meta_description')
      .eq('id', contentId)
      .single();

    if (fetchError) throw fetchError;

    // Step 2: Transform links to shortcodes
    const transformResult = await transformContentLinks(contentId, content.content);

    if (!transformResult.success) {
      return {
        success: false,
        transformed: false,
        validated: false,
        errors: [transformResult.error || 'Shortcode transformation failed'],
        warnings: [],
      };
    }

    // Step 3: Update content with transformed version
    const { error: updateError } = await supabase
      .from('content_queue')
      .update({
        content: transformResult.content,
        notes: `Shortcodes: ${transformResult.transformations.total} transformed (${transformResult.transformations.internal} internal, ${transformResult.transformations.affiliate} affiliate, ${transformResult.transformations.external} external)`,
      })
      .eq('id', contentId);

    if (updateError) throw updateError;

    // Step 4: Validate transformed content
    const validationResult = await validateContentForPublishing(contentId);

    // Step 5: Return combined result
    return {
      success: validationResult.passed,
      transformed: true,
      validated: validationResult.passed,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      transformations: transformResult.transformations,
      metrics: validationResult.metrics,
    };
  } catch (error) {
    console.error('[Content Workflow] Prepare for publishing error:', error);
    return {
      success: false,
      transformed: false,
      validated: false,
      errors: [`Workflow error: ${error.message}`],
      warnings: [],
    };
  }
}

/**
 * Submit content for review (starts 5-day SLA timer)
 *
 * Changes status to 'pending_review' and sets pending_since timestamp.
 * After 5 days, content will auto-publish if validation passes (SLA requirement).
 *
 * @param {string} contentId - Content queue item ID
 * @returns {Promise<void>}
 *
 * @example
 * await submitForReview('uuid');
 * // Content is now in approval queue, SLA timer started
 */
export async function submitForReview(contentId) {
  const { error } = await supabase
    .from('content_queue')
    .update({
      status: 'pending_review',
      pending_since: new Date().toISOString(), // Start SLA timer
    })
    .eq('id', contentId);

  if (error) {
    console.error('[Content Workflow] Submit for review error:', error);
    throw new Error(`Failed to submit for review: ${error.message}`);
  }
}

/**
 * Manually approve content (reviewer action)
 *
 * Changes status to 'approved' and clears SLA timer.
 * Content will be published on next scheduled publishing run.
 *
 * @param {string} contentId - Content queue item ID
 * @param {string} reviewerNotes - Optional notes from reviewer
 * @returns {Promise<void>}
 *
 * @example
 * await approveContent('uuid', 'Great article, approved for publishing');
 */
export async function approveContent(contentId, reviewerNotes = null) {
  const updates = {
    status: 'approved',
    pending_since: null, // Clear SLA timer
    auto_approved: false, // This is manual approval
    scheduled_publish_date: new Date().toISOString(), // Publish ASAP
  };

  if (reviewerNotes) {
    updates.notes = reviewerNotes;
  }

  const { error } = await supabase
    .from('content_queue')
    .update(updates)
    .eq('id', contentId);

  if (error) {
    console.error('[Content Workflow] Approve content error:', error);
    throw new Error(`Failed to approve content: ${error.message}`);
  }
}

/**
 * Reject content (send back for edits)
 *
 * Changes status to 'draft' and adds rejection notes.
 * Clears SLA timer.
 *
 * @param {string} contentId - Content queue item ID
 * @param {string} rejectionReason - Why content was rejected
 * @returns {Promise<void>}
 *
 * @example
 * await rejectContent('uuid', 'Needs more examples and internal links');
 */
export async function rejectContent(contentId, rejectionReason) {
  const { error } = await supabase
    .from('content_queue')
    .update({
      status: 'draft',
      pending_since: null, // Clear SLA timer
      notes: `REJECTED: ${rejectionReason}`,
    })
    .eq('id', contentId);

  if (error) {
    console.error('[Content Workflow] Reject content error:', error);
    throw new Error(`Failed to reject content: ${error.message}`);
  }
}

/**
 * Get SLA status for content item
 *
 * Returns information about how long content has been pending review
 * and whether it's eligible for auto-publish.
 *
 * @param {string} contentId - Content queue item ID
 * @returns {Promise<{pending: boolean, days_pending: number, days_remaining: number, auto_publish_eligible: boolean}>}
 *
 * @example
 * const sla = await getSlaStatus('uuid');
 * if (sla.auto_publish_eligible) {
 *   console.warn('Content will auto-publish soon!');
 * }
 */
export async function getSlaStatus(contentId) {
  const { data, error } = await supabase
    .from('content_queue')
    .select('pending_since, status')
    .eq('id', contentId)
    .single();

  if (error) {
    console.error('[Content Workflow] Get SLA status error:', error);
    return { pending: false, days_pending: 0, days_remaining: 0, auto_publish_eligible: false };
  }

  if (!data.pending_since || data.status !== 'pending_review') {
    return { pending: false, days_pending: 0, days_remaining: 0, auto_publish_eligible: false };
  }

  const pendingDate = new Date(data.pending_since);
  const now = new Date();
  const diffMs = now.getTime() - pendingDate.getTime();
  const daysPending = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 5 - daysPending);

  return {
    pending: true,
    days_pending: daysPending,
    days_remaining: daysRemaining,
    auto_publish_eligible: daysPending >= 5,
  };
}

/**
 * Publish content to WordPress
 *
 * NOTE: This is a placeholder. Actual WordPress publishing logic will depend on:
 * - WordPress REST API client implementation
 * - Authentication method (username/password, JWT, application password)
 * - Post metadata requirements (categories, tags, featured image)
 *
 * @param {string} contentId - Content queue item ID
 * @returns {Promise<{success: boolean, wordpress_post_id: number, wordpress_url: string}>}
 *
 * @example
 * const result = await publishToWordPress('uuid');
 * if (result.success) {
 *   console.log('Published:', result.wordpress_url);
 * }
 */
export async function publishToWordPress(contentId) {
  try {
    // Get content from queue
    const { data: content, error: fetchError } = await supabase
      .from('content_queue')
      .select('*')
      .eq('id', contentId)
      .single();

    if (fetchError) throw fetchError;

    // TODO: Implement WordPress REST API publishing
    // const wordpressClient = new WordPressClient();
    // const post = await wordpressClient.createPost({
    //   title: content.title,
    //   content: content.content,
    //   excerpt: content.meta_description,
    //   status: 'publish',
    //   categories: [...],
    //   tags: content.target_keywords,
    // });

    // Placeholder response
    console.warn('[Content Workflow] WordPress publishing not implemented yet');

    // Update content_queue with published status
    const { error: updateError } = await supabase
      .from('content_queue')
      .update({
        status: 'published',
        published_date: new Date().toISOString(),
        wordpress_post_id: null, // TODO: Set actual post ID
        wordpress_url: null, // TODO: Set actual URL
      })
      .eq('id', contentId);

    if (updateError) throw updateError;

    return {
      success: true,
      wordpress_post_id: null,
      wordpress_url: null,
    };
  } catch (error) {
    console.error('[Content Workflow] Publish to WordPress error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get content cost (AI usage)
 *
 * Calculates total AI cost for generating this content.
 * Target: <$10 per article
 *
 * @param {string} contentId - Content queue item ID
 * @returns {Promise<number>} Total cost in USD
 *
 * @example
 * const cost = await getContentCost('uuid');
 * if (cost > 10) {
 *   console.warn('Content exceeded $10 budget:', cost);
 * }
 */
export async function getContentCost(contentId) {
  const { data, error } = await supabase
    .from('ai_usage_logs')
    .select('total_cost')
    .eq('content_id', contentId)
    .eq('response_success', true);

  if (error) {
    console.error('[Content Workflow] Get content cost error:', error);
    return 0;
  }

  const totalCost = data.reduce((sum, log) => sum + (log.total_cost || 0), 0);
  return totalCost;
}

/**
 * Check if content is within budget (<$10)
 *
 * @param {string} contentId - Content queue item ID
 * @returns {Promise<boolean>}
 *
 * @example
 * const withinBudget = await isContentWithinBudget('uuid');
 * if (!withinBudget) {
 *   console.warn('Content exceeded $10 budget');
 * }
 */
export async function isContentWithinBudget(contentId) {
  const cost = await getContentCost(contentId);
  return cost < 10.0;
}

/**
 * Get validation history for content
 *
 * @param {string} contentId - Content queue item ID
 * @returns {Promise<Array>} Validation log entries
 *
 * @example
 * const history = await getValidationHistory('uuid');
 * console.log('Validation attempts:', history.length);
 */
export async function getValidationHistory(contentId) {
  const { data, error } = await supabase
    .from('shortcode_validation_logs')
    .select('*')
    .eq('content_id', contentId)
    .order('created_date', { ascending: false });

  if (error) {
    console.error('[Content Workflow] Get validation history error:', error);
    return [];
  }

  return data || [];
}

// Export all functions for easy imports
export default {
  transformContentLinks,
  validateContentForPublishing,
  prepareForPublishing,
  submitForReview,
  approveContent,
  rejectContent,
  getSlaStatus,
  publishToWordPress,
  getContentCost,
  isContentWithinBudget,
  getValidationHistory,
};
