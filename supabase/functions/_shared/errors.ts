/**
 * Shared Error Handling Module for Supabase Edge Functions
 *
 * Provides standardized error responses and logging across all Edge Functions.
 */

/**
 * CORS headers for all responses
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
  details?: any;
}

/**
 * Standard success response structure
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Error types with HTTP status codes
 */
export const ErrorTypes = {
  // Client errors (400-499)
  UNAUTHORIZED: { status: 401, code: 'UNAUTHORIZED' },
  FORBIDDEN: { status: 403, code: 'FORBIDDEN' },
  NOT_FOUND: { status: 404, code: 'NOT_FOUND' },
  BAD_REQUEST: { status: 400, code: 'BAD_REQUEST' },
  VALIDATION_ERROR: { status: 422, code: 'VALIDATION_ERROR' },
  RATE_LIMIT: { status: 429, code: 'RATE_LIMIT_EXCEEDED' },

  // Server errors (500-599)
  INTERNAL_ERROR: { status: 500, code: 'INTERNAL_SERVER_ERROR' },
  DATABASE_ERROR: { status: 500, code: 'DATABASE_ERROR' },
  API_ERROR: { status: 502, code: 'EXTERNAL_API_ERROR' },
  TIMEOUT: { status: 504, code: 'TIMEOUT' },
};

/**
 * Create a standardized error response
 *
 * @param message - Human-readable error message
 * @param errorType - Error type from ErrorTypes
 * @param details - Optional additional error details
 * @returns HTTP Response with error
 *
 * @example
 * ```typescript
 * return createErrorResponse('User not found', ErrorTypes.NOT_FOUND);
 * ```
 */
export function createErrorResponse(
  message: string,
  errorType = ErrorTypes.INTERNAL_ERROR,
  details?: any
): Response {
  const errorResponse: ErrorResponse = {
    success: false,
    error: errorType.code,
    message,
    code: errorType.code,
  };

  if (details) {
    errorResponse.details = details;
  }

  return new Response(
    JSON.stringify(errorResponse),
    {
      status: errorType.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Create a standardized success response
 *
 * @param data - Response data
 * @param message - Optional success message
 * @returns HTTP Response with data
 *
 * @example
 * ```typescript
 * return createSuccessResponse({ id: '123', status: 'published' }, 'Content published successfully');
 * ```
 */
export function createSuccessResponse<T>(data: T, message?: string): Response {
  const successResponse: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    successResponse.message = message;
  }

  return new Response(
    JSON.stringify(successResponse),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Handle any error and return appropriate response
 *
 * @param error - The error object
 * @param functionName - Name of the function for logging
 * @returns HTTP Response with error
 *
 * @example
 * ```typescript
 * try {
 *   // Function logic
 * } catch (error) {
 *   return handleError(error, 'wordpress-publish');
 * }
 * ```
 */
export function handleError(error: unknown, functionName: string): Response {
  console.error(`[${functionName}] Error:`, error);

  // Handle specific error types
  if (error instanceof Error) {
    const message = error.message;

    // Authentication errors
    if (message.includes('authorization') || message.includes('token')) {
      return createErrorResponse(message, ErrorTypes.UNAUTHORIZED);
    }

    // Database errors
    if (message.includes('database') || message.includes('query')) {
      return createErrorResponse(
        'Database operation failed',
        ErrorTypes.DATABASE_ERROR,
        { originalError: message }
      );
    }

    // API errors
    if (message.includes('API') || message.includes('fetch')) {
      return createErrorResponse(
        'External API request failed',
        ErrorTypes.API_ERROR,
        { originalError: message }
      );
    }

    // Validation errors
    if (message.includes('required') || message.includes('invalid')) {
      return createErrorResponse(message, ErrorTypes.VALIDATION_ERROR);
    }

    // Default to internal error with message
    return createErrorResponse(message, ErrorTypes.INTERNAL_ERROR);
  }

  // Unknown error type
  return createErrorResponse(
    'An unexpected error occurred',
    ErrorTypes.INTERNAL_ERROR,
    { error: String(error) }
  );
}

/**
 * Validate required fields in request body
 *
 * @param body - Request body object
 * @param requiredFields - Array of required field names
 * @throws Error if any required field is missing
 *
 * @example
 * ```typescript
 * const body = await req.json();
 * validateRequiredFields(body, ['content_id', 'wordpress_site_id']);
 * ```
 */
export function validateRequiredFields(body: any, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !body[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

/**
 * Create CORS preflight response
 *
 * @returns HTTP Response for OPTIONS request
 */
export function createCorsPreflightResponse(): Response {
  return new Response('ok', { headers: corsHeaders });
}
