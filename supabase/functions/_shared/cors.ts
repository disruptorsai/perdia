/**
 * Shared CORS headers for Supabase Edge Functions
 *
 * Allows requests from any origin (for development and production).
 * Adjust 'Access-Control-Allow-Origin' for production if needed.
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
