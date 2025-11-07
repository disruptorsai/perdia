/**
 * Netlify Edge Function: Rate Limiter
 *
 * PURPOSE: Protect AI API from abuse and control costs
 *
 * APPLIES TO: /.netlify/functions/invoke-llm
 *
 * WHAT IT DOES:
 * 1. Tracks requests per user/IP address
 * 2. Enforces rate limits:
 *    - 20 requests per minute per user
 *    - 100 requests per hour per user
 * 3. Returns 429 Too Many Requests if limit exceeded
 *
 * SETUP REQUIRED:
 * 1. Deploy automatically with site (Netlify handles this)
 * 2. Configure in netlify.toml [[edge_functions]] section
 *
 * RATE LIMITS (adjustable):
 * - Per minute: 20 requests
 * - Per hour: 100 requests
 * - Per day: 500 requests
 */

import type { Context } from "https://edge.netlify.com";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory store (resets on cold start - good for edge functions)
const rateLimits = new Map<string, RateLimitRecord>();

// Rate limit configuration
const LIMITS = {
  perMinute: 20,
  perHour: 100,
  perDay: 500,
};

function getRateLimitKey(context: Context, window: string): string {
  // Use user ID if authenticated, otherwise IP
  const userId = context.cookies.get('sb-user-id') || context.ip;
  return `${userId}:${window}`;
}

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimits.get(key);

  if (!record || now > record.resetAt) {
    // New window
    rateLimits.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (record.count >= limit) {
    // Limit exceeded
    return false;
  }

  // Increment count
  record.count++;
  return true;
}

export default async (request: Request, context: Context) => {
  // Only apply to AI API calls
  const url = new URL(request.url);
  if (!url.pathname.includes('/.netlify/functions/invoke-llm')) {
    // Not an AI API call, pass through
    return;
  }

  // Only rate limit POST requests (actual invocations)
  if (request.method !== 'POST') {
    return;
  }

  // Check rate limits
  const minuteKey = getRateLimitKey(context, 'minute');
  const hourKey = getRateLimitKey(context, 'hour');

  const withinMinuteLimit = checkRateLimit(minuteKey, LIMITS.perMinute, 60 * 1000);
  const withinHourLimit = checkRateLimit(hourKey, LIMITS.perHour, 60 * 60 * 1000);

  if (!withinMinuteLimit) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${LIMITS.perMinute} per minute.`,
        retryAfter: 60,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          'X-RateLimit-Limit': LIMITS.perMinute.toString(),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  if (!withinHourLimit) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${LIMITS.perHour} per hour.`,
        retryAfter: 3600,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '3600',
          'X-RateLimit-Limit': LIMITS.perHour.toString(),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // Within limits, pass through
  const minuteRecord = rateLimits.get(minuteKey)!;
  const remaining = LIMITS.perMinute - minuteRecord.count;

  // Add rate limit headers to response
  const response = await context.next();
  response.headers.set('X-RateLimit-Limit', LIMITS.perMinute.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', minuteRecord.resetAt.toString());

  return response;
};

export const config = {
  path: "/.netlify/functions/invoke-llm",
};
