import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68f7fb9301f466283d4de135", 
  requiresAuth: true // Ensure authentication is required for all operations
});
