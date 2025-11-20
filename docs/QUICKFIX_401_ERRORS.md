# 🚨 QUICK FIX: 401 Unauthorized Errors

## Problem
Your app shows **401 Unauthorized errors** because:
- Mock authentication is enabled (`src/lib/supabase-client.js`)
- But RLS (Row Level Security) is blocking database access

## ⚡ Quick Solution (2 minutes)

### Step 1: Open Supabase SQL Editor
Click this link: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new

### Step 2: Copy & Paste This SQL

```sql
-- Disable RLS for development mode
ALTER TABLE agent_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_definitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE automation_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE file_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE keywords DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE page_optimizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE wordpress_connections DISABLE ROW LEVEL SECURITY;
```

### Step 3: Click "Run"

### Step 4: Refresh Your App
The 401 errors should be gone!

---

## Alternative: Use Migration File

Instead of copying SQL manually, you can run the entire migration file:

1. Open: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new
2. Click "Import" or paste contents of: `supabase/migrations/dev_mode_disable_rls.sql`
3. Click "Run"

---

## ⚠️ Important Notes

- **This is for DEVELOPMENT ONLY**
- Before production: Run `supabase/migrations/dev_mode_enable_rls.sql` to re-enable security
- Or set up proper authentication by uncommenting real auth code in `src/lib/supabase-client.js`

---

## Why This Happens

Your codebase uses a **mock user** for development (lines 91-107 in `src/lib/supabase-client.js`), which allows you to test without logging in. But the database tables still have RLS enabled, so they reject requests without a real authentication token.

Disabling RLS in development allows the mock user to access the database.

---

## ✅ Done!
After running the SQL, your app will work perfectly in development mode.
