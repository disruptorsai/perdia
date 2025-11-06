/**
 * PERDIA EDUCATION - SUPABASE CLIENT CONFIGURATION
 * ================================================
 * Centralized Supabase client setup for Perdia Education platform
 *
 * CRITICAL: This file creates a SINGLE instance of the Supabase client to prevent
 * the "Multiple GoTrueClient instances" warning. All other modules should
 * import from this file, never create their own clients.
 *
 * Usage:
 *   import { supabase, getCurrentUser } from '@/lib/supabase-client';
 *
 * Architecture:
 * - Single storage key: 'perdia-auth'
 * - User client with anon key (RLS enforced)
 * - Auto-refresh enabled
 * - Persistent sessions across page reloads
 *
 * Note: Service role operations should be done in serverless functions,
 * not in client-side code.
 */

import { createClient } from '@supabase/supabase-js';

// =====================================================
// ENVIRONMENT VARIABLES VALIDATION
// =====================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// =====================================================
// SUPABASE CLIENT (USER OPERATIONS)
// =====================================================

/**
 * Main Supabase client for user operations
 * - Uses anon key (public, safe for client-side)
 * - RLS policies enforce user data isolation
 * - Auto-refresh enabled for persistent sessions
 * - Single storage key prevents multiple client instances
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'perdia-auth', // Single consistent key
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'perdia-education-platform',
    },
  },
});

// =====================================================
// ADMIN CLIENT NOTE
// =====================================================
// The admin client (supabaseAdmin) has been removed from client-side code
// for security reasons. Service role keys should NEVER be exposed to the browser.
//
// For admin operations:
// 1. Use Netlify serverless functions with SUPABASE_SERVICE_ROLE_KEY env var
// 2. Use migration scripts (scripts/migrate-database.js, scripts/seed-agents.js)
//
// Migration scripts already have their own admin client setup using process.env
// =====================================================

// =====================================================
// AUTHENTICATION HELPERS
// =====================================================

/**
 * Get the current authenticated user
 * @returns {Promise<{user: User | null, session: Session | null}>}
 */
export async function getCurrentUser() {
  // DEVELOPMENT MODE: Auth disabled for testing
  // Return a mock user so the app works without authentication
  const mockUser = {
    id: 'dev-user-123',
    email: 'dev@perdia.test',
    user_metadata: { name: 'Dev User' },
    aud: 'authenticated',
    role: 'authenticated',
  };

  const mockSession = {
    user: mockUser,
    access_token: 'dev-token',
  };

  console.log('🔓 Auth disabled - using mock user for testing');
  return { user: mockUser, session: mockSession };

  /* ORIGINAL CODE - Uncomment when ready to enable auth
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Error fetching current user:', error);
    return { user: null, session: null };
  }

  const { data: { session } } = await supabase.auth.getSession();

  return { user, session };
  */
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  // DEVELOPMENT MODE: Always return true for testing
  return true;

  /* ORIGINAL CODE - Uncomment when ready to enable auth
  const { user } = await getCurrentUser();
  return !!user;
  */
}

/**
 * Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: User | null, session: Session | null, error: Error | null}>}
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Sign in error:', error);
    return { user: null, session: null, error };
  }

  return { user: data.user, session: data.session, error: null };
}

/**
 * Sign up with email and password
 * @param {string} email
 * @param {string} password
 * @param {object} metadata - Additional user metadata
 * @returns {Promise<{user: User | null, session: Session | null, error: Error | null}>}
 */
export async function signUp(email, password, metadata = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) {
    console.error('Sign up error:', error);
    return { user: null, session: null, error };
  }

  return { user: data.user, session: data.session, error: null };
}

/**
 * Sign out current user
 * @returns {Promise<{error: Error | null}>}
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Sign out error:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Reset password for email
 * @param {string} email
 * @returns {Promise<{error: Error | null}>}
 */
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    console.error('Password reset error:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Update user password
 * @param {string} newPassword
 * @returns {Promise<{user: User | null, error: Error | null}>}
 */
export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error('Update password error:', error);
    return { user: null, error };
  }

  return { user: data.user, error: null };
}

/**
 * Update user metadata
 * @param {object} metadata
 * @returns {Promise<{user: User | null, error: Error | null}>}
 */
export async function updateUserMetadata(metadata) {
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  });

  if (error) {
    console.error('Update metadata error:', error);
    return { user: null, error };
  }

  return { user: data.user, error: null };
}

/**
 * Subscribe to auth state changes
 * @param {function} callback - Called when auth state changes
 * @returns {function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    }
  );

  return () => subscription.unsubscribe();
}

// =====================================================
// STORAGE HELPERS
// =====================================================

/**
 * Upload file to Supabase Storage
 * @param {string} bucket - Bucket name
 * @param {string} path - File path (e.g., 'user_id/filename.jpg')
 * @param {File} file - File object
 * @param {object} options - Upload options
 * @returns {Promise<{url: string | null, path: string | null, error: Error | null}>}
 */
export async function uploadFile(bucket, path, file, options = {}) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      ...options,
    });

  if (error) {
    console.error('File upload error:', error);
    return { url: null, path: null, error };
  }

  // Get public URL for public buckets
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return { url: publicUrl, path: data.path, error: null };
}

/**
 * Delete file from Supabase Storage
 * @param {string} bucket - Bucket name
 * @param {string} path - File path
 * @returns {Promise<{error: Error | null}>}
 */
export async function deleteFile(bucket, path) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error('File deletion error:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Get signed URL for private file
 * @param {string} bucket - Bucket name
 * @param {string} path - File path
 * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<{url: string | null, error: Error | null}>}
 */
export async function getSignedUrl(bucket, path, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Signed URL error:', error);
    return { url: null, error };
  }

  return { url: data.signedUrl, error: null };
}

/**
 * Get public URL for file (public buckets only)
 * @param {string} bucket - Bucket name
 * @param {string} path - File path
 * @returns {string} Public URL
 */
export function getPublicUrl(bucket, path) {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
}

/**
 * List files in bucket path
 * @param {string} bucket - Bucket name
 * @param {string} path - Directory path (default: '')
 * @returns {Promise<{files: Array | null, error: Error | null}>}
 */
export async function listFiles(bucket, path = '') {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path);

  if (error) {
    console.error('List files error:', error);
    return { files: null, error };
  }

  return { files: data, error: null };
}

// =====================================================
// DATABASE HELPERS
// =====================================================

/**
 * Generic insert function
 * @param {string} table - Table name
 * @param {object} data - Data to insert
 * @returns {Promise<{data: object | null, error: Error | null}>}
 */
export async function insertOne(table, data) {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error(`Insert error in ${table}:`, error);
    return { data: null, error };
  }

  return { data: result, error: null };
}

/**
 * Generic insert multiple function
 * @param {string} table - Table name
 * @param {array} data - Array of objects to insert
 * @returns {Promise<{data: array | null, error: Error | null}>}
 */
export async function insertMany(table, data) {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select();

  if (error) {
    console.error(`Insert many error in ${table}:`, error);
    return { data: null, error };
  }

  return { data: result, error: null };
}

/**
 * Generic update function
 * @param {string} table - Table name
 * @param {string} id - Record ID
 * @param {object} data - Data to update
 * @returns {Promise<{data: object | null, error: Error | null}>}
 */
export async function updateOne(table, id, data) {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Update error in ${table}:`, error);
    return { data: null, error };
  }

  return { data: result, error: null };
}

/**
 * Generic delete function
 * @param {string} table - Table name
 * @param {string} id - Record ID
 * @returns {Promise<{error: Error | null}>}
 */
export async function deleteOne(table, id) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Delete error in ${table}:`, error);
    return { error };
  }

  return { error: null };
}

/**
 * Generic fetch one function
 * @param {string} table - Table name
 * @param {string} id - Record ID
 * @returns {Promise<{data: object | null, error: Error | null}>}
 */
export async function fetchOne(table, id) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Fetch error in ${table}:`, error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Generic fetch all function with filters
 * @param {string} table - Table name
 * @param {object} options - Query options (filters, order, limit)
 * @returns {Promise<{data: array | null, error: Error | null, count: number | null}>}
 */
export async function fetchAll(table, options = {}) {
  let query = supabase.from(table).select('*', { count: 'exact' });

  // Apply filters
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (value !== null && value !== undefined) {
        query = query.eq(key, value);
      }
    });
  }

  // Apply order
  if (options.orderBy) {
    const { column, ascending = true } = options.orderBy;
    query = query.order(column, { ascending });
  }

  // Apply limit and offset
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error(`Fetch all error in ${table}:`, error);
    return { data: null, error, count: null };
  }

  return { data, error: null, count };
}

// =====================================================
// REALTIME HELPERS
// =====================================================

/**
 * Subscribe to table changes
 * @param {string} table - Table name
 * @param {function} callback - Called on INSERT, UPDATE, DELETE
 * @param {object} filter - Optional filter (e.g., { column: 'user_id', value: '123' })
 * @returns {object} Subscription object with unsubscribe method
 */
export function subscribeToTable(table, callback, filter = null) {
  let channel = supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        ...(filter && { filter: `${filter.column}=eq.${filter.value}` }),
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

// =====================================================
// EXPORTS
// =====================================================

export default {
  supabase,
  // Auth
  getCurrentUser,
  isAuthenticated,
  signIn,
  signUp,
  signOut,
  resetPassword,
  updatePassword,
  updateUserMetadata,
  onAuthStateChange,
  // Storage
  uploadFile,
  deleteFile,
  getSignedUrl,
  getPublicUrl,
  listFiles,
  // Database
  insertOne,
  insertMany,
  updateOne,
  deleteOne,
  fetchOne,
  fetchAll,
  // Realtime
  subscribeToTable,
};
