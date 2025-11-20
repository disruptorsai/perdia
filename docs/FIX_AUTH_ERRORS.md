# Fix Authentication Errors - Development Mode

## Problem
The application shows repeated `401 Unauthorized` errors with message "Invalid API key" because:
1. The code uses **mock authentication** (see `src/lib/supabase-client.js` lines 91-107)
2. But **RLS (Row Level Security) is still enabled** on database tables
3. Database rejects requests because there's no valid JWT session token

## Solution
Run the **dev mode migration** to temporarily disable RLS for local development.

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new

2. **Copy and paste the entire contents** of:
   ```
   supabase/migrations/dev_mode_disable_rls.sql
   ```

3. **Click "Run"** to execute the migration

4. **Verify success** - You should see:
   ```
   ✅ Development Mode Enabled - RLS disabled on all tables
   ⚠️  Remember to re-enable RLS before deploying to production!
   ```

5. **Refresh your application** - The 401 errors should be gone

### Option 2: Supabase CLI (If installed)

```bash
cd "C:\Users\Disruptors\Documents\Disruptors Projects\perdia"

# Run the dev mode migration
supabase db execute --file supabase/migrations/dev_mode_disable_rls.sql
```

### Option 3: PostgreSQL Client (psql)

If you have direct database access:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.yvvtsfgryweqfppilkvo.supabase.co:5432/postgres" \
  -f supabase/migrations/dev_mode_disable_rls.sql
```

## What This Does

The migration disables RLS on these 16 tables:
- agent_conversations
- agent_definitions
- agent_feedback
- agent_messages
- automation_settings
- blog_posts
- chat_channels
- chat_messages
- content_queue
- file_documents
- keywords
- knowledge_base_documents
- page_optimizations
- performance_metrics
- social_posts
- wordpress_connections

This allows the mock user to access the database without authentication.

## Before Production Deployment

⚠️ **IMPORTANT:** Before deploying to production, you MUST re-enable RLS:

1. Run `supabase/migrations/dev_mode_enable_rls.sql` in Supabase SQL Editor
2. Set up proper authentication flow (uncomment lines 109-120 in `src/lib/supabase-client.js`)
3. Create test user accounts in Supabase Auth

## Alternative: Enable Real Authentication

If you prefer to use real authentication instead of mock mode:

1. **Uncomment real auth code** in `src/lib/supabase-client.js`:
   - Lines 109-120 in `getCurrentUser()`
   - Lines 131-134 in `isAuthenticated()`

2. **Comment out mock auth code** (lines 93-107 and 129)

3. **Create a test user** in Supabase:
   - Dashboard → Authentication → Users → Add User
   - Or use the sign-up form in the app

4. **Keep RLS enabled** (secure by default)

## Current Configuration

- **Environment**: Development
- **Auth Mode**: Mock user (no real authentication)
- **RLS Status**: Enabled (causing errors) → Need to disable for dev mode
- **Supabase Project**: yvvtsfgryweqfppilkvo

---

**Quick Fix:** Run the SQL from `dev_mode_disable_rls.sql` in Supabase dashboard, then refresh the app.
