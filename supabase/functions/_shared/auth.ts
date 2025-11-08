/**
 * Shared Authentication Module for Supabase Edge Functions
 *
 * Provides JWT verification for all Edge Functions to ensure only
 * authenticated users can invoke them.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

/**
 * User object returned after successful authentication
 */
export interface AuthenticatedUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

/**
 * Authenticates a request by verifying the JWT token in the Authorization header
 *
 * @param req - The incoming HTTP request
 * @returns The authenticated user object
 * @throws Error if authentication fails
 *
 * @example
 * ```typescript
 * const user = await authenticateRequest(req);
 * console.log('User authenticated:', user.email);
 * ```
 */
export async function authenticateRequest(req: Request): Promise<AuthenticatedUser> {
  // Extract authorization header
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  // Extract JWT token
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new Error('No token provided');
  }

  // Initialize Supabase client with anon key (for JWT verification)
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Verify the JWT token
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error) {
    console.error('[Auth] Token verification failed:', error.message);
    throw new Error('Invalid or expired token');
  }

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
  };
}

/**
 * Optional authentication - returns user if authenticated, null otherwise
 * Use this for functions that can work with or without authentication
 *
 * @param req - The incoming HTTP request
 * @returns The authenticated user object or null
 */
export async function optionalAuth(req: Request): Promise<AuthenticatedUser | null> {
  try {
    return await authenticateRequest(req);
  } catch {
    return null;
  }
}

/**
 * Service role authentication - uses service role key for admin operations
 * Only use this for cron jobs or internal functions
 *
 * @returns Supabase client with service role privileges
 */
export function getServiceRoleClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase service role configuration missing');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}
