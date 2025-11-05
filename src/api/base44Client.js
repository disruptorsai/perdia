/**
 * PERDIA SDK CLIENT
 * Replaces Base44 SDK with custom Supabase-based implementation
 */

import { createPerdiaClient } from '@/lib/perdia-sdk';

// Create Perdia client (replaces Base44 createClient)
export const base44 = createPerdiaClient();

// Export for compatibility
export default base44;
