/**
 * PERDIA EDUCATION - EDGE FUNCTION CLIENT
 * ========================================
 * Wrappers for Supabase Edge Functions
 */

import { supabase } from './supabase-client';

async function invokeEdgeFunction(functionName, payload = {}) {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
    });

    if (error) {
      console.error(`Edge function ${functionName} error:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Failed to invoke edge function ${functionName}:`, error);
    throw error;
  }
}

export async function publishToWordPress(options) {
  return invokeEdgeFunction('wordpress-publish', options);
}

export async function researchKeywords(options) {
  return invokeEdgeFunction('keyword-research', options);
}

export async function syncGSCData(options) {
  return invokeEdgeFunction('sync-gsc-data', options);
}

export async function optimizeContent(options) {
  return invokeEdgeFunction('optimize-content-ai', options);
}

export async function scheduleContent(options) {
  return invokeEdgeFunction('auto-schedule-content', options);
}

export const EdgeFunctions = {
  publishToWordPress,
  researchKeywords,
  syncGSCData,
  optimizeContent,
  scheduleContent,
};

export default EdgeFunctions;
