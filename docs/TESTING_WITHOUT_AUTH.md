# Testing Without Authentication

This guide explains how to set up the Perdia platform for testing **without requiring login**.

## Quick Start (Recommended)

### Option 1: Run SQL in Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/editor
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/dev_mode_disable_rls.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see: "✅ Development Mode Enabled"

**That's it!** Your app will now work without authentication.

### Option 2: Use the Script

```bash
npm run dev:mode
```

This will automatically disable RLS (Row Level Security) on all tables.

## What This Does

The development mode:
- ✅ Disables Row Level Security (RLS) on all database tables
- ✅ Allows the app to work with mock authentication
- ✅ Lets anyone test the app without logging in
- ✅ Bypasses 401 Unauthorized errors

## Current Mock User

The app uses a mock user for testing:
- **Email**: `dev@perdia.test`
- **User ID**: `dev-user-123`
- **Name**: `Dev User`

You'll see this message in the console: `🔓 Auth disabled - using mock user for testing`

## Troubleshooting

### Still Getting 401 Errors?

If you still see 401 errors after disabling RLS, verify your `.env.local` credentials:

1. Check that `VITE_SUPABASE_URL` is correct: `https://yvvtsfgryweqfppilkvo.supabase.co`
2. Verify your `VITE_SUPABASE_ANON_KEY` is valid:
   - Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/api
   - Copy the **anon** **public** key (not the service_role key!)
   - Update it in `.env.local`
   - Restart your dev server: `npm run dev`

### Database Connection Failed?

Make sure:
1. Your Supabase project is active (not paused)
2. You've run migrations: `npm run db:migrate`
3. You've seeded agents: `npm run db:seed`

## Re-enabling Authentication (For Production)

**⚠️ IMPORTANT**: Before deploying to production, you MUST re-enable RLS!

### Option 1: Run SQL in Dashboard
1. Open SQL Editor in Supabase Dashboard
2. Copy and paste contents of `supabase/migrations/dev_mode_enable_rls.sql`
3. Click **Run**

### Option 2: Manually in Code
1. Open `src/lib/supabase-client.js`
2. Find the `getCurrentUser()` function (around line 90)
3. Comment out the mock user code (lines 91-107)
4. Uncomment the original auth code (lines 109-120)

## Files Changed for Dev Mode

- ✅ `src/lib/supabase-client.js` - Mock authentication already enabled
- ✅ `supabase/migrations/dev_mode_disable_rls.sql` - SQL to disable RLS
- ✅ `supabase/migrations/dev_mode_enable_rls.sql` - SQL to re-enable RLS
- ✅ `scripts/enable-dev-mode.js` - Script to automate dev mode

## Security Warning

⚠️ **DO NOT deploy with dev mode enabled!**

Development mode disables all security policies. This is ONLY for local testing.

Before deploying:
1. Re-enable RLS policies
2. Enable real authentication
3. Remove mock user code
4. Test with real login credentials

---

**Questions?** Check the [CLAUDE.md](./CLAUDE.md) file for more details on the architecture.
