# Architecture Guide - Perdia Education Platform

This guide documents the architecture patterns, best practices, and design decisions for the Perdia Education platform. These patterns are proven in production and should be followed when working with database agents and code generation.

---

## 🏗️ Core Architecture Principles

### 1. Centralized Supabase Client Pattern

**CRITICAL**: Always use a centralized Supabase client to avoid "Multiple GoTrueClient instances" warnings.

**Implementation:**

```javascript
// src/lib/supabase-client.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// Main client for user operations (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'perdia-education-auth', // Unique key per project
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Admin client for service-level operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// Export as aliases for compatibility
export const supabaseClient = supabase
```

**Rules:**
- ✅ **DO**: Import from `@/lib/supabase-client`
- ❌ **DON'T**: Create new clients with `createClient()` elsewhere
- ✅ **DO**: Use unique `storageKey` per project
- ❌ **DON'T**: Share storage keys across projects

**Usage throughout app:**
```javascript
// Everywhere in the app
import { supabase, supabaseAdmin } from '@/lib/supabase-client'

// Use supabase for user operations
const { data } = await supabase.from('keywords').select('*')

// Use supabaseAdmin for admin operations (bypasses RLS)
const { data } = await supabaseAdmin.from('keywords').insert({ ... })
```

---

## 🔌 Custom SDK Layer Pattern

### Why Custom SDK?

Provides a Base44-compatible API layer while using Supabase under the hood. Benefits:
- Consistent API across client/server code
- Easy to swap backends
- Encapsulates Supabase-specific logic
- Maintains Base44 migration path

### Implementation Structure

```javascript
// src/lib/perdia-sdk.js
import { supabase, supabaseAdmin } from './supabase-client'

export const PerdiaSDK = {
  // Entity methods (Base44-compatible API)
  keywords: {
    getAll: async (filters = {}) => {
      let query = supabase.from('keywords').select('*')

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('keywords')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },

    create: async (keywordData) => {
      const { data, error } = await supabase
        .from('keywords')
        .insert(keywordData)
        .select()
        .single()

      if (error) throw error
      return data
    },

    update: async (id, updates) => {
      const { data, error } = await supabase
        .from('keywords')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('keywords')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    }
  },

  // Repeat for other entities: contentItems, agents, wordpress, etc.

  contentItems: {
    getAll: async () => { /* ... */ },
    getById: async (id) => { /* ... */ },
    create: async (data) => { /* ... */ },
    update: async (id, updates) => { /* ... */ },
    delete: async (id) => { /* ... */ }
  },

  // Authentication helpers
  auth: {
    getCurrentUser: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },

    signIn: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      return data
    },

    signOut: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    }
  }
}

// Default export for convenience
export default PerdiaSDK
```

**Usage in components:**
```javascript
import PerdiaSDK from '@/lib/perdia-sdk'

// Get all keywords
const keywords = await PerdiaSDK.keywords.getAll({ status: 'active' })

// Create new keyword
const newKeyword = await PerdiaSDK.keywords.create({
  keyword: 'online education',
  search_volume: 5000,
  difficulty: 45
})

// Update keyword
await PerdiaSDK.keywords.update(keywordId, { status: 'researched' })
```

---

## 🗄️ Database Schema Patterns

### Table Naming Conventions

- **Lowercase with underscores**: `content_items`, `wordpress_connections`
- **Plural names**: `keywords`, `agents`, `teams`
- **Descriptive names**: `google_search_console_metrics` not `gsc_metrics`

### Standard Columns

Every table should have:
```sql
CREATE TABLE example_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Entity-specific columns here

  -- Soft delete (optional but recommended)
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Auto-update updated_at trigger
CREATE TRIGGER update_example_table_updated_at
  BEFORE UPDATE ON example_table
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### UUID vs Integer IDs

- ✅ **Use UUIDs** for primary keys (better for distributed systems, no sequential guessing)
- ✅ **Use gen_random_uuid()** for defaults
- ❌ **Avoid serial/integer IDs** unless you have a specific reason

### Timestamp Standards

- **Use TIMESTAMPTZ** (timestamp with time zone)
- **Default to NOW()** for created_at
- **Use trigger** for updated_at auto-update
- **Use NULL for soft deletes** (deleted_at)

---

## 🔐 Row Level Security (RLS) Patterns

### Enable RLS on All Tables

```sql
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
```

### Standard RLS Policies

**1. Public Read (for public data)**
```sql
CREATE POLICY "Allow public read access"
ON keywords
FOR SELECT
TO public
USING (true);
```

**2. Authenticated Users (for user-specific data)**
```sql
-- Users can read their own data
CREATE POLICY "Users can read own keywords"
ON keywords
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own data
CREATE POLICY "Users can insert own keywords"
ON keywords
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own data
CREATE POLICY "Users can update own keywords"
ON keywords
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own data
CREATE POLICY "Users can delete own keywords"
ON keywords
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

**3. Team-Based Access (for collaborative data)**
```sql
-- Users can read team data
CREATE POLICY "Users can read team keywords"
ON keywords
FOR SELECT
TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
);
```

**4. Role-Based Access (for admin operations)**
```sql
-- Admins can do anything
CREATE POLICY "Admins have full access"
ON keywords
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);
```

### RLS Helper Functions

Create reusable functions for common checks:

```sql
-- Check if user is team member
CREATE OR REPLACE FUNCTION is_team_member(check_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = auth.uid()
    AND team_id = check_team_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📁 File Organization

### Project Structure

```
src/
├── lib/                          # Core libraries and utilities
│   ├── supabase-client.js        # Centralized Supabase client
│   ├── perdia-sdk.js             # Custom SDK (Base44-compatible)
│   ├── ai-client.js              # AI integration layer
│   └── utils.js                  # Helper functions
├── components/
│   ├── ui/                       # Base UI components (Radix)
│   ├── shared/                   # Shared business components
│   └── [feature]/                # Feature-specific components
├── pages/                        # Route components
├── hooks/                        # React hooks
├── contexts/                     # React contexts
└── styles/                       # Global styles

supabase/
└── migrations/                   # Database migrations (timestamped)

scripts/
├── setup-database.js             # Initial setup
├── seed-database.js              # Seed data
└── verify-*.js                   # Verification scripts
```

### Path Aliases

Always use `@/` alias for imports:

```javascript
// ✅ Good
import { supabase } from '@/lib/supabase-client'
import PerdiaSDK from '@/lib/perdia-sdk'

// ❌ Bad
import { supabase } from '../../../lib/supabase-client'
```

Configure in `vite.config.js`:
```javascript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src')
  }
}
```

---

## 🗃️ Database Migration Patterns

### Migration File Naming

```
supabase/migrations/
├── 20250104000001_initial_schema.sql
├── 20250104000002_add_rls_policies.sql
├── 20250104000003_add_agents_table.sql
└── 20250104000004_add_team_features.sql
```

**Format**: `YYYYMMDDHHMMSS_description.sql`

### Migration Best Practices

1. **One migration per feature**: Don't combine unrelated changes
2. **Idempotent migrations**: Use `IF NOT EXISTS`, `IF EXISTS`
3. **Include rollback**: Comment rollback SQL at top of file
4. **Test locally first**: Always test before production

### Migration Template

```sql
-- Migration: [Description]
-- Created: [Date]
--
-- ROLLBACK:
-- DROP TABLE IF EXISTS new_table;
--

BEGIN;

-- Create table
CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data"
ON new_table
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_new_table_user_id
ON new_table(user_id);

-- Create trigger
CREATE TRIGGER update_new_table_updated_at
  BEFORE UPDATE ON new_table
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

---

## 🎣 React Hooks Pattern

### Custom Hooks for Data Fetching

```javascript
// src/hooks/useKeywords.js
import { useState, useEffect } from 'react'
import PerdiaSDK from '@/lib/perdia-sdk'

export function useKeywords(filters = {}) {
  const [keywords, setKeywords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchKeywords() {
      try {
        setLoading(true)
        const data = await PerdiaSDK.keywords.getAll(filters)
        setKeywords(data)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchKeywords()
  }, [JSON.stringify(filters)])

  const refetch = async () => {
    setLoading(true)
    try {
      const data = await PerdiaSDK.keywords.getAll(filters)
      setKeywords(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { keywords, loading, error, refetch }
}
```

**Usage:**
```javascript
function KeywordsPage() {
  const { keywords, loading, error, refetch } = useKeywords({ status: 'active' })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {keywords.map(keyword => (
        <div key={keyword.id}>{keyword.keyword}</div>
      ))}
    </div>
  )
}
```

---

## 🔌 AI Integration Pattern

### Supabase Edge Functions Architecture

**AI invocation runs on Supabase Edge Functions** (400-second timeout) instead of Netlify Functions (26-second timeout).

**Frontend Client** (`src/lib/ai-client.js`):
```javascript
// Calls Supabase Edge Function endpoint
import { supabase } from '@/lib/supabase-client';

export async function invokeLLM(params) {
  const { data, error } = await supabase.functions.invoke('invoke-llm', {
    body: params
  });

  if (error) throw error;
  return data;
}
```

**Backend Edge Function** (`supabase/functions/invoke-llm/index.ts`):
```typescript
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

Deno.serve(async (req) => {
  const { provider, model, messages, system_prompt, temperature, max_tokens } = await req.json();

  if (provider === 'claude') {
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')
    });

    const response = await anthropic.messages.create({
      model: model || 'claude-sonnet-4-5-20250929',
      max_tokens: max_tokens || 4000,
      temperature: temperature || 0.7,
      system: system_prompt,
      messages
    });

    return new Response(JSON.stringify({
      content: response.content[0].text,
      model: response.model,
      usage: response.usage
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (provider === 'openai') {
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

    const response = await openai.chat.completions.create({
      model: model || 'gpt-4o',
      messages,
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 4000
    });

    return new Response(JSON.stringify({
      content: response.choices[0].message.content,
      model: response.model,
      usage: response.usage
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

**Benefits:**
- ✅ **400-second timeout** (vs 26s on Netlify) - supports long-form content generation
- ✅ **No more 504 errors** on 2000+ word articles
- ✅ **Consolidated infrastructure** - all backend on Supabase ($25/mo vs $44/mo)
- ✅ **Secure** - API keys in Supabase secrets, not environment variables

**Deployment:**
```bash
# Deploy Edge Function
npx supabase functions deploy invoke-llm --project-ref yvvtsfgryweqfppilkvo

# Set secrets
npx supabase secrets set ANTHROPIC_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set OPENAI_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo

# Test
node scripts/test-invoke-llm.js
```

See [SUPABASE_EDGE_FUNCTION_DEPLOYMENT.md](./SUPABASE_EDGE_FUNCTION_DEPLOYMENT.md) for complete deployment guide.

---

## 🧪 Testing Patterns

### Database Connection Test

```javascript
// scripts/test-db-connection.js
import { supabase } from '../src/lib/supabase-client.js'

console.log('Testing Perdia database connection...')

const { data, error } = await supabase
  .from('keywords')
  .select('count')
  .limit(1)

if (error) {
  console.error('❌ Database connection failed:', error.message)
  process.exit(1)
}

console.log('✅ Database connection successful')
```

### SDK Test

```javascript
// scripts/test-sdk.js
import PerdiaSDK from '../src/lib/perdia-sdk.js'

console.log('Testing Perdia SDK...')

try {
  // Test keywords
  const keywords = await PerdiaSDK.keywords.getAll()
  console.log(`✅ Keywords: ${keywords.length} records`)

  // Test auth
  const user = await PerdiaSDK.auth.getCurrentUser()
  console.log(`✅ Auth: ${user ? 'User logged in' : 'No user'}`)

  console.log('✅ SDK test successful')
} catch (error) {
  console.error('❌ SDK test failed:', error.message)
  process.exit(1)
}
```

---

## 🚀 Deployment Patterns

### Hybrid Deployment Architecture

**Frontend:** Netlify (static hosting)
**Backend & AI:** Supabase (database, auth, storage, edge functions)

### Frontend Deployment (Netlify)

**Current Deployment:**
- **Project ID:** `371d61d6-ad3d-4c13-8455-52ca33d1c0d4`
- **Account:** Perdia Education (New Netlify Account)
- **Claude Code MCP:** `netlify-primary` (DisruptorsAI account)
- **Dashboard:** https://app.netlify.com/sites/perdia-education/overview
- **Status:** ✅ Connected and Auto-Deploy Enabled

> **Note for Claude Code:** Always use the `netlify-primary` MCP server when performing Netlify operations for this project.

### Environment Variables

**Required for Netlify:**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ANTHROPIC_API_KEY=sk-ant-your-key
VITE_OPENAI_API_KEY=sk-your-key
```

**Optional:**
```bash
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Only for serverless functions
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
```

**Set in Netlify Dashboard:**
- URL: https://app.netlify.com/sites/perdia-education/configuration/env
- Navigate to: Site settings → Environment variables
- Add each variable individually

### Netlify Configuration

```toml
# netlify.toml
# Project ID: 371d61d6-ad3d-4c13-8455-52ca33d1c0d4

[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### Netlify CLI Usage

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Link to project
netlify link  # Use project ID: 371d61d6-ad3d-4c13-8455-52ca33d1c0d4

# Deploy to production
netlify deploy --prod

# Manage environment variables
netlify env:list
netlify env:set VARIABLE_NAME value

# Open site/dashboard
netlify open:site
netlify open:admin
```

### Backend & AI Deployment (Supabase Edge Functions)

**AI invocation runs on Supabase Edge Functions** with 400-second timeout for long-form content generation.

**Project Information:**
- **Project Ref:** `yvvtsfgryweqfppilkvo`
- **URL:** https://yvvtsfgryweqfppilkvo.supabase.co
- **Function:** `invoke-llm`
- **Timeout:** 400 seconds (vs 26s on Netlify)
- **Dashboard:** https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/functions

**Deployment Steps:**

```bash
# 1. Link to Supabase project
npx supabase link --project-ref yvvtsfgryweqfppilkvo

# 2. Deploy the Edge Function
npx supabase functions deploy invoke-llm --project-ref yvvtsfgryweqfppilkvo

# 3. Set API key secrets
npx supabase secrets set ANTHROPIC_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set OPENAI_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo

# 4. Verify deployment
npx supabase secrets list --project-ref yvvtsfgryweqfppilkvo
node scripts/test-invoke-llm.js
```

**Edge Function Logs:**
```bash
# View real-time logs
npx supabase functions logs invoke-llm --project-ref yvvtsfgryweqfppilkvo

# List all functions
npx supabase functions list --project-ref yvvtsfgryweqfppilkvo
```

**Benefits:**
- ✅ **400-second timeout** - no more 504 errors on long content
- ✅ **Consolidated infrastructure** - all backend on Supabase
- ✅ **Cost savings** - $25/mo vs $44/mo (Netlify + Supabase)
- ✅ **Secure** - API keys in Supabase secrets

See [SUPABASE_EDGE_FUNCTION_DEPLOYMENT.md](./SUPABASE_EDGE_FUNCTION_DEPLOYMENT.md) for detailed deployment guide.

---

## 📝 Code Quality Standards

### ESLint

Always run before commits:
```bash
npm run lint
```

### Import Order

```javascript
// 1. External dependencies
import React from 'react'
import { useNavigate } from 'react-router-dom'

// 2. Internal libraries
import { supabase } from '@/lib/supabase-client'
import PerdiaSDK from '@/lib/perdia-sdk'

// 3. Components
import { Button } from '@/components/ui/button'
import Header from '@/components/shared/Header'

// 4. Utilities
import { cn } from '@/lib/utils'

// 5. Types (if TypeScript)
import type { Keyword } from '@/types'
```

### Naming Conventions

- **Components**: PascalCase (`KeywordCard`, `ContentEditor`)
- **Files**: kebab-case (`keyword-card.jsx`, `content-editor.jsx`)
- **Functions**: camelCase (`fetchKeywords`, `createContent`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `API_TIMEOUT`)
- **Hooks**: camelCase with `use` prefix (`useKeywords`, `useAuth`)

---

## 🎯 Agent Instructions

When working with database agents (supabase-database-orchestrator) or code generation:

### For Schema Operations

```
I need to add a [table name] table with these fields:
- [field name]: [type] [constraints]
- created_at and updated_at timestamps
- UUID primary key

Follow the Perdia Architecture Guide patterns:
- Use centralized supabase-client.js
- Enable RLS with authenticated user policies
- Create appropriate indexes
- Add updated_at trigger
```

### For SDK Operations

```
Add [entity name] methods to the Perdia SDK following the pattern in ARCHITECTURE_GUIDE.md:
- getAll, getById, create, update, delete methods
- Use centralized supabase client
- Base44-compatible API style
- Proper error handling
```

### For Component Generation

```
Create a [component name] component following Perdia patterns:
- Use custom hooks for data fetching
- Import from @/ path alias
- Use Radix UI components from @/components/ui
- Follow naming conventions
```

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Router v7](https://reactrouter.com/en/main)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Last Updated:** 2025-11-05
**Version:** 1.0.0
**Netlify Project:** 371d61d6-ad3d-4c13-8455-52ca33d1c0d4
