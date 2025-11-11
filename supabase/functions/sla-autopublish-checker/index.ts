/**
 * SLA Auto-Publish Checker Edge Function
 *
 * Enforces 5-day Service Level Agreement for content review.
 * Automatically publishes content that passes validation after 5 days in review queue.
 *
 * CRITICAL: Client requirement (Tony & Kaylee, Nov 10 transcript):
 * Tony: "could we have the review process built in and if a piece of content
 *        is not reviewed within five days it automatically gets posted"
 * Kaylee: "I think that would be good."
 *
 * This function runs as a scheduled cron job (daily or hourly).
 *
 * Workflow:
 * 1. Find content with status='pending_review' AND pending_since >= 5 days ago
 * 2. Re-run pre-publish validator on each item
 * 3. Auto-approve if validation passes
 * 4. Send notification to Sarah (review team)
 * 5. Update status to 'approved' and schedule publishing
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  meta_description: string | null;
  status: string;
  pending_since: string;
  user_id: string;
}

interface ProcessingResult {
  content_id: string;
  title: string;
  action: 'auto_approved' | 'validation_failed' | 'error';
  validation_passed?: boolean;
  errors?: string[];
  warnings?: string[];
  pending_days: number;
}

/**
 * Calculate days since content entered pending_review
 */
function calculatePendingDays(pendingSince: string): number {
  const pendingDate = new Date(pendingSince);
  const now = new Date();
  const diffMs = now.getTime() - pendingDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Send notification email to review team
 * NOTE: Requires Supabase email configuration or external email service
 */
async function sendNotification(
  items: ProcessingResult[],
  supabaseUrl: string,
  supabaseKey: string
): Promise<void> {
  const autoApproved = items.filter((i) => i.action === 'auto_approved');
  const failed = items.filter((i) => i.action === 'validation_failed');

  if (autoApproved.length === 0 && failed.length === 0) {
    return; // Nothing to notify
  }

  // Build notification message
  const message = `
SLA Auto-Publish Report - ${new Date().toLocaleDateString()}

AUTO-APPROVED (${autoApproved.length}):
${autoApproved
  .map(
    (item) =>
      `- ${item.title} (${item.pending_days} days pending) - Publishing automatically`
  )
  .join('\n')}

VALIDATION FAILED (${failed.length}):
${failed
  .map(
    (item) =>
      `- ${item.title} (${item.pending_days} days pending) - Requires manual review
   Errors: ${item.errors?.join('; ')}`
  )
  .join('\n')}

Review Dashboard: ${supabaseUrl.replace('supabase.co', 'supabase.co')}/content-library
`;

  console.log('[SLA Checker] Notification:', message);

  // TODO: Implement actual email sending
  // Options:
  // 1. Supabase Auth email templates
  // 2. SendGrid/Mailgun integration
  // 3. In-app notifications only

  // For now, log to console and create in-app notification
  // Could store in a 'notifications' table for UI display
}

/**
 * Validate content using pre-publish validator
 */
async function validateContent(
  content: ContentItem,
  supabaseUrl: string,
  supabaseKey: string
): Promise<{
  passed: boolean;
  errors: string[];
  warnings: string[];
}> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/pre-publish-validator`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: content.content,
        title: content.title,
        meta_description: content.meta_description,
        content_id: content.id,
      }),
    });

    const result = await response.json();
    return {
      passed: result.passed,
      errors: result.errors || [],
      warnings: result.warnings || [],
    };
  } catch (error) {
    console.error('[SLA Checker] Validation error:', error);
    return {
      passed: false,
      errors: [`Validation service error: ${error.message}`],
      warnings: [],
    };
  }
}

/**
 * Process a single content item
 */
async function processContentItem(
  content: ContentItem,
  supabase: any,
  supabaseUrl: string,
  supabaseKey: string
): Promise<ProcessingResult> {
  const pendingDays = calculatePendingDays(content.pending_since);

  try {
    // Re-run validation
    const validation = await validateContent(content, supabaseUrl, supabaseKey);

    if (validation.passed) {
      // Auto-approve: Update status to approved and schedule publishing
      const { error: updateError } = await supabase
        .from('content_queue')
        .update({
          status: 'approved',
          scheduled_publish_date: new Date().toISOString(), // Publish immediately
          auto_approved: true,
          auto_approved_date: new Date().toISOString(),
          auto_approved_reason: `SLA: ${pendingDays} days pending, validation passed`,
          notes: `Auto-approved by SLA checker after ${pendingDays} days. Validation: ${validation.warnings.length} warning(s).`,
        })
        .eq('id', content.id);

      if (updateError) {
        throw updateError;
      }

      console.log(`[SLA Checker] Auto-approved: ${content.title} (${pendingDays} days)`);

      return {
        content_id: content.id,
        title: content.title,
        action: 'auto_approved',
        validation_passed: true,
        warnings: validation.warnings,
        pending_days: pendingDays,
      };
    } else {
      // Validation failed: Keep in pending_review, add notes
      const { error: updateError } = await supabase
        .from('content_queue')
        .update({
          notes: `SLA: ${pendingDays} days pending. Auto-publish blocked by validation errors: ${validation.errors.join('; ')}`,
        })
        .eq('id', content.id);

      if (updateError) {
        console.error('[SLA Checker] Error updating notes:', updateError);
      }

      console.log(`[SLA Checker] Validation failed: ${content.title} (${pendingDays} days)`);

      return {
        content_id: content.id,
        title: content.title,
        action: 'validation_failed',
        validation_passed: false,
        errors: validation.errors,
        warnings: validation.warnings,
        pending_days: pendingDays,
      };
    }
  } catch (error) {
    console.error(`[SLA Checker] Error processing ${content.id}:`, error);
    return {
      content_id: content.id,
      title: content.title,
      action: 'error',
      errors: [error.message],
      pending_days: pendingDays,
    };
  }
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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Calculate cutoff date (5 days ago)
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const cutoffDate = fiveDaysAgo.toISOString();

    console.log(`[SLA Checker] Checking for content pending since: ${cutoffDate}`);

    // Find content items pending review for >= 5 days
    const { data: pendingContent, error: fetchError } = await supabase
      .from('content_queue')
      .select('id, title, content, meta_description, status, pending_since, user_id')
      .eq('status', 'pending_review')
      .lte('pending_since', cutoffDate)
      .order('pending_since', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingContent || pendingContent.length === 0) {
      console.log('[SLA Checker] No content items pending >= 5 days');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No content items pending >= 5 days',
          checked_count: 0,
          auto_approved_count: 0,
          validation_failed_count: 0,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[SLA Checker] Found ${pendingContent.length} items pending >= 5 days`);

    // Process each content item
    const results: ProcessingResult[] = [];
    for (const content of pendingContent) {
      const result = await processContentItem(
        content,
        supabase,
        supabaseUrl,
        supabaseServiceKey
      );
      results.push(result);
    }

    // Count results
    const autoApprovedCount = results.filter((r) => r.action === 'auto_approved').length;
    const validationFailedCount = results.filter(
      (r) => r.action === 'validation_failed'
    ).length;
    const errorCount = results.filter((r) => r.action === 'error').length;

    // Send notification to review team
    await sendNotification(results, supabaseUrl, supabaseServiceKey);

    // Return summary
    return new Response(
      JSON.stringify({
        success: true,
        message: `SLA check complete: ${autoApprovedCount} auto-approved, ${validationFailedCount} validation failed, ${errorCount} errors`,
        checked_count: pendingContent.length,
        auto_approved_count: autoApprovedCount,
        validation_failed_count: validationFailedCount,
        error_count: errorCount,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[SLA Checker] Fatal error:', error);

    return new Response(
      JSON.stringify({
        success: false,
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
