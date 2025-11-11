# Perdia Supabase Database Agent - Quick Reference

This document provides a quick reference for the Perdia Supabase Database Agent.

## Agent Activation

The agent **automatically activates** when these keywords are detected:
- database, supabase, postgres, sql, table, schema, migration
- rls, query, index, storage, bucket, auth
- optimize, performance, slow query, error

## MCP Server Integration

The Perdia project has a **Supabase MCP server** configured for direct database access.

### Configuration Location
`.claude/mcp.json` (project-level configuration)

### MCP Server Details
- **Server Name:** `supabase`
- **Package:** `@supabase/mcp-server-supabase@latest`
- **Project Ref:** `yvvtsfgryweqfppilkvo`
- **Project URL:** `https://yvvtsfgryweqfppilkvo.supabase.co`

### Quick MCP Commands

**List all tables:**
```javascript
ListMcpResourcesTool({ server: "supabase" })
// or
ReadMcpResourceTool({ server: "supabase", uri: "supabase://tables" })
```

**Get table schema:**
```javascript
ReadMcpResourceTool({
  server: "supabase",
  uri: "supabase://table/keywords"
})
```

**Execute SQL query:**
```javascript
mcp__supabase__run_sql({
  sql: "SELECT * FROM keywords WHERE status = 'queued' LIMIT 5"
})
```

**Check storage buckets:**
```javascript
ReadMcpResourceTool({
  server: "supabase",
  uri: "supabase://storage-buckets"
})
```

**Analyze query performance:**
```javascript
mcp__supabase__run_sql({
  sql: "EXPLAIN ANALYZE SELECT * FROM content_queue WHERE status = 'pending_review'"
})
```

**Check RLS policies:**
```javascript
ReadMcpResourceTool({
  server: "supabase",
  uri: "supabase://rls-policies"
})
```

### Available MCP Resources
- `supabase://tables` - List all database tables
- `supabase://table/{table_name}` - Get specific table schema
- `supabase://storage-buckets` - List all storage buckets
- `supabase://functions` - List Edge Functions
- `supabase://rls-policies` - List RLS policies

### Available MCP Tools
- `mcp__supabase__run_sql` - Execute SQL queries
- `mcp__supabase__get_table_schema` - Get table schema details
- `mcp__supabase__list_tables` - List all tables
- `mcp__supabase__execute_query` - Execute parameterized queries
- `mcp__supabase__get_storage_info` - Get storage bucket information

### When to Use MCP

**Always use MCP before:**
1. Creating new tables (check if exists)
2. Modifying schema (inspect current structure)
3. Adding indexes (verify query patterns)
4. Creating migrations (test SQL syntax)
5. Debugging queries (test directly)
6. Checking RLS policies (verify security)

**Example Workflow:**
```javascript
// Step 1: Check if table exists
ReadMcpResourceTool({ server: "supabase", uri: "supabase://tables" })

// Step 2: Inspect existing structure (if modifying)
ReadMcpResourceTool({ server: "supabase", uri: "supabase://table/keywords" })

// Step 3: Test query performance
mcp__supabase__run_sql({
  sql: "EXPLAIN ANALYZE SELECT * FROM keywords WHERE category = 'degree-programs'"
})

// Step 4: Apply migration
// (create migration file following Perdia patterns)

// Step 5: Verify via MCP
ReadMcpResourceTool({ server: "supabase", uri: "supabase://table/new_table" })
```

## Quick Commands

### Asking for Help

```
"Can you add a table for tracking X?"
"How do I optimize this query?"
"Set up storage for user uploads"
"Why is this query slow?"
"Add an index for better performance"
"Create a migration for X"
```

## Project Schema at a Glance

### 16 Active Tables

1. **keywords** - Keyword tracking (currently_ranked + new_target lists)
2. **content_queue** - Content workflow (draft → published)
3. **performance_metrics** - Google Search Console data
4. **wordpress_connections** - WordPress site credentials
5. **automation_settings** - User automation preferences
6. **page_optimizations** - Page improvement tracking
7. **blog_posts** - Blog content
8. **social_posts** - Social media scheduling
9. **knowledge_base_documents** - AI training docs
10. **agent_feedback** - AI response feedback
11. **file_documents** - File storage metadata
12. **chat_channels** - Team channels
13. **chat_messages** - Team messages
14. **agent_definitions** - AI agent configs (9 pre-seeded)
15. **agent_conversations** - AI conversations
16. **agent_messages** - Conversation messages

### 4 Storage Buckets

1. **knowledge-base** (private) - AI training documents
2. **content-images** (public) - Blog/content images
3. **social-media** (public) - Social media assets
4. **uploads** (private) - General uploads

## Standard Patterns

### Every Table Must Have

```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
created_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### Every Table Must Have

- RLS enabled
- Complete RLS policies (SELECT, INSERT, UPDATE, DELETE)
- Index on `user_id`
- Auto-update trigger for `updated_date`

### SDK Integration

```javascript
// Always use SDK entities
import { Keyword, ContentQueue } from '@/lib/perdia-sdk';

// Never bypass SDK
// ❌ const { data } = await supabase.from('keywords').select();
// ✅ const keywords = await Keyword.find({ status: 'queued' });
```

### Centralized Client

```javascript
// Always import from centralized location
import { supabase, supabaseAdmin } from '@/lib/supabase-client';

// Never create new clients
// ❌ const client = createClient(url, key);
```

## Common Requests

### "Add a new table"
Agent will:
1. Check schema via MCP
2. Create migration SQL following project patterns
3. Add entity to SDK
4. Update documentation
5. Provide usage examples

### "Optimize this query"
Agent will:
1. Analyze query pattern
2. Check existing indexes via MCP
3. Suggest new indexes
4. Recommend better Supabase features
5. Show optimized code

### "Set up file upload"
Agent will:
1. Verify storage bucket exists
2. Check RLS policies
3. Provide SDK upload code
4. Suggest optimization strategies

### "This query is slow"
Agent will:
1. Run EXPLAIN ANALYZE via MCP
2. Identify missing indexes
3. Suggest query optimization
4. Check for N+1 patterns
5. Recommend Supabase features (realtime vs polling)

## Agent Capabilities

### Automatic Actions
- ✅ Check schema before suggesting changes
- ✅ Verify RLS policies exist
- ✅ Test queries via MCP server
- ✅ Suggest optimizations proactively
- ✅ Update documentation automatically
- ✅ Follow project patterns consistently

### Proactive Suggestions
- Missing indexes
- N+1 query patterns
- Better Supabase features
- Storage optimization
- RLS policy improvements
- Performance enhancements

## Files the Agent Manages

- `supabase/migrations/*.sql` - Database migrations
- `src/lib/perdia-sdk.js` - SDK entity definitions
- `CLAUDE.md` - Schema documentation
- `ARCHITECTURE_GUIDE.md` - Architecture patterns

## MCP Server Integration

The agent automatically uses Supabase MCP server for:
- Schema inspection
- Query testing
- RLS policy verification
- Performance analysis
- Storage bucket management

## Example Interactions

### Adding a Table

**You:** "I need to track email campaigns"

**Agent:** Creates complete migration with:
- Table following project patterns
- All required indexes
- RLS policies
- SDK integration
- Usage examples
- Documentation updates

### Performance Issue

**You:** "The keywords dashboard is slow"

**Agent:**
- Analyzes query patterns
- Identifies missing indexes
- Provides optimization code
- Suggests Supabase Realtime
- Updates indexes automatically

### Storage Setup

**You:** "Need to store PDF documents"

**Agent:**
- Verifies bucket configuration
- Checks RLS policies
- Provides upload code using SDK
- Suggests signed URL patterns
- Documents usage

## Critical Rules

### ❌ Never Do
- Create new Supabase clients
- Bypass SDK for direct queries
- Skip RLS policies
- Forget indexes on foreign keys
- Hardcode credentials
- Use wrong project credentials (Disruptors AI vs Perdia)

### ✅ Always Do
- Use centralized client (`@/lib/supabase-client`)
- Use SDK entities (`@/lib/perdia-sdk`)
- Enable RLS on all tables
- Add indexes for filtered columns
- Include auto-update triggers
- Follow project patterns
- Use Perdia project credentials

## Getting Help

The agent is **always available** - just mention:
- Database-related tasks
- Supabase features
- Schema changes
- Performance issues
- Storage operations
- Query optimization

## Quick Reference Links

- Full Agent Documentation: `.claude/agents/perdia-supabase-database-agent.md`
- Project Guide: `CLAUDE.md`
- Architecture: `ARCHITECTURE_GUIDE.md`
- Migration Files: `supabase/migrations/`
- SDK Code: `src/lib/perdia-sdk.js`

---

**Remember:** The agent knows the complete Perdia schema, follows project patterns, and proactively suggests optimizations. Just ask!
