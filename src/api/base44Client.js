/**
 * PERDIA SDK CLIENT
 * Replaces Base44 SDK with custom Supabase-based implementation
 */

import perdia from '@/lib/perdia-sdk';

// Export Perdia SDK as base44 for compatibility
export const base44 = perdia;

// Export for compatibility
export default base44;
