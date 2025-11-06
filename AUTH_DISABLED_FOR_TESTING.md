# Authentication Disabled for Testing

**Status:** Auth is currently DISABLED to allow testing without login credentials

## Changes Made

Authentication checks have been bypassed in the following files:

### 1. `src/lib/supabase-client.js`
- **Line ~90:** `getCurrentUser()` returns a mock user instead of calling Supabase auth
- **Line ~127:** `isAuthenticated()` always returns `true`

**Mock User Details:**
```javascript
{
  id: 'dev-user-123',
  email: 'dev@perdia.test',
  user_metadata: { name: 'Dev User' }
}
```

### 2. `src/lib/agent-sdk.js`
- All `Authentication required` errors replaced with warnings
- Functions return `null` or empty arrays instead of throwing errors

### 3. `src/pages/AIAgents.jsx`
- **Line ~113:** Auth check completely bypassed
- `User.me()` call is commented out

## How to Re-Enable Authentication

When ready to enable real authentication:

1. **In `src/lib/supabase-client.js`:**
   - Find the `getCurrentUser()` function (~line 90)
   - Comment out the mock user section
   - Uncomment the original Supabase auth code
   - Do the same for `isAuthenticated()` (~line 127)

2. **In `src/lib/agent-sdk.js`:**
   - Search for "Auth is now mocked for development"
   - Replace the warning returns with the original `throw new Error('Authentication required')`

3. **In `src/pages/AIAgents.jsx`:**
   - Find the useEffect hook (~line 112)
   - Comment out the direct calls
   - Uncomment the original `checkAuth()` function

## Testing Database Access

**Note:** Even with auth disabled, you may encounter RLS (Row Level Security) errors if:
- The Supabase database has strict RLS policies requiring real user IDs
- The mock user ID (`dev-user-123`) doesn't exist in the database

**To fix RLS issues:**
- Temporarily disable RLS on tables in Supabase dashboard, OR
- Create a test user with ID `dev-user-123` in the auth.users table

## Security Warning

⚠️ **DO NOT deploy to production with auth disabled!**

This is for local development/testing only. All authentication must be re-enabled before deploying to Netlify or any public environment.

---

**Last Updated:** November 6, 2025
**Purpose:** Allow testing without login credentials during development
