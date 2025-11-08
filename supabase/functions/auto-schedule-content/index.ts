/**
 * Supabase Edge Function: Auto Content Scheduler
 *
 * PURPOSE: Intelligent content scheduling based on automation settings
 *
 * FEATURES:
 * - JWT authentication (optional for cron jobs)
 * - Reads user automation_settings (articles_per_day, auto_approve, auto_publish)
 * - Finds approved content ready to schedule
 * - Calculates optimal publish times (spread evenly throughout day)
 * - Respects daily/weekly limits
 * - Prioritizes by keyword priority score
 * - Optionally triggers immediate WordPress publish
 *
 * REQUEST BODY (all optional):
 * {
 *   user_id?: string;           // Specific user ID for manual scheduling
 *   articles_limit?: number;    // Override articles_per_day setting
 *   publish_immediately?: boolean; // Trigger WordPress publish (default: false)
 * }
 *
 * RESPONSE:
 * {
 *   success: true,
 *   data: {
 *     scheduled_count: number,
 *     scheduled_items: Array<{
 *       content_id: string,
 *       title: string,
 *       scheduled_date: string,
 *       priority: number
 *     }>,
 *     daily_remaining: number,
 *     next_schedule_date: string
 *   }
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { optionalAuth, getServiceRoleClient } from '../_shared/auth.ts';
import {
  createErrorResponse,
  createSuccessResponse,
  createCorsPreflightResponse,
  handleError,
  ErrorTypes,
} from '../_shared/errors.ts';
import {
  getAutomationSettings,
  getContentReadyToSchedule,
  countScheduledToday,
  updateContentQueueItem,
} from '../_shared/database.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('auto-schedule-content');

interface ScheduledItem {
  content_id: string;
  title: string;
  scheduled_date: string;
  priority: number;
}

/**
 * Calculate optimal publish times spread throughout the day
 */
function calculatePublishTimes(count: number, startDate: Date): Date[] {
  const times: Date[] = [];

  // Spread articles evenly between 9am and 5pm (8 hours = 480 minutes)
  const workingMinutes = 480;
  const intervalMinutes = count > 1 ? Math.floor(workingMinutes / (count - 1)) : 0;

  for (let i = 0; i < count; i++) {
    const publishTime = new Date(startDate);
    publishTime.setHours(9, 0, 0, 0); // Start at 9am
    publishTime.setMinutes(publishTime.getMinutes() + (i * intervalMinutes));
    times.push(publishTime);
  }

  return times;
}

/**
 * Get next available schedule date (avoid weekends if needed)
 */
function getNextScheduleDate(skipWeekends = false): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1); // Start with tomorrow
  date.setHours(9, 0, 0, 0); // 9am

  if (skipWeekends) {
    // Skip Saturday (6) and Sunday (0)
    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() + 1);
    }
  }

  return date;
}

/**
 * Trigger WordPress publish for scheduled content
 */
async function triggerWordPressPublish(contentId: string): Promise<boolean> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const publishUrl = `${supabaseUrl}/functions/v1/wordpress-publish`;

    const response = await fetch(publishUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content_id: contentId }),
    });

    if (!response.ok) {
      logger.warn('WordPress publish failed', { contentId, status: response.status });
      return false;
    }

    logger.info('WordPress publish triggered', { contentId });
    return true;
  } catch (error) {
    logger.error('Error triggering WordPress publish', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return createCorsPreflightResponse();
  }

  try {
    logger.start();

    // Optional authentication (supports both user auth and service role)
    const user = await optionalAuth(req);
    const userId = user?.id;

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const {
      user_id,
      articles_limit,
      publish_immediately = false,
    } = body;

    // Use provided user_id or authenticated user
    const targetUserId = user_id || userId;

    if (!targetUserId) {
      return createErrorResponse(
        'User ID required for scheduling',
        ErrorTypes.UNAUTHORIZED
      );
    }

    // Use service role client for operations
    const client = getServiceRoleClient();

    // Get automation settings
    logger.info('Fetching automation settings', { userId: targetUserId });
    const settings = await getAutomationSettings(client, targetUserId);

    // Determine how many articles to schedule today
    const dailyLimit = articles_limit || settings.articles_per_day || 1;

    // Count how many already scheduled today
    const scheduledToday = await countScheduledToday(client, targetUserId);
    const remainingToday = Math.max(0, dailyLimit - scheduledToday);

    logger.info('Daily scheduling status', {
      dailyLimit,
      scheduledToday,
      remainingToday,
    });

    if (remainingToday === 0) {
      logger.info('Daily limit reached, no more scheduling for today');
      return createSuccessResponse(
        {
          scheduled_count: 0,
          scheduled_items: [],
          daily_remaining: 0,
          next_schedule_date: getNextScheduleDate().toISOString(),
        },
        'Daily scheduling limit reached'
      );
    }

    // Get approved content ready to schedule (ordered by priority)
    const contentToSchedule = await getContentReadyToSchedule(
      client,
      targetUserId,
      remainingToday
    );

    if (contentToSchedule.length === 0) {
      logger.info('No content ready to schedule');
      return createSuccessResponse(
        {
          scheduled_count: 0,
          scheduled_items: [],
          daily_remaining: remainingToday,
          next_schedule_date: null,
        },
        'No content ready to schedule'
      );
    }

    logger.info('Content found for scheduling', { count: contentToSchedule.length });

    // Calculate publish times for today
    const publishTimes = calculatePublishTimes(contentToSchedule.length, new Date());

    // Schedule each content item
    const scheduledItems: ScheduledItem[] = [];

    for (let i = 0; i < contentToSchedule.length; i++) {
      const content = contentToSchedule[i];
      const scheduledDate = publishTimes[i];

      // Update content with scheduled date
      await updateContentQueueItem(client, content.id, targetUserId, {
        scheduled_date: scheduledDate.toISOString(),
        status: settings.auto_publish ? 'scheduled' : 'approved',
      });

      scheduledItems.push({
        content_id: content.id,
        title: content.title,
        scheduled_date: scheduledDate.toISOString(),
        priority: content.priority || 0,
      });

      // Trigger WordPress publish if auto_publish enabled and publish_immediately requested
      if (settings.auto_publish && publish_immediately) {
        await triggerWordPressPublish(content.id);
      }
    }

    // Calculate next schedule date
    const nextScheduleDate = getNextScheduleDate().toISOString();

    logger.complete({
      scheduledCount: scheduledItems.length,
      dailyRemaining: remainingToday - scheduledItems.length,
    });

    return createSuccessResponse(
      {
        scheduled_count: scheduledItems.length,
        scheduled_items: scheduledItems,
        daily_remaining: remainingToday - scheduledItems.length,
        next_schedule_date: nextScheduleDate,
      },
      `Successfully scheduled ${scheduledItems.length} content items`
    );
  } catch (error) {
    logger.failed(error);
    return handleError(error, 'auto-schedule-content');
  }
});
