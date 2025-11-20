# Agent Usage Guide - Perdia Education Platform

Quick reference for using Claude Code agents effectively in the Perdia project.

---

## 🎯 Available Agents

### 1. supabase-database-orchestrator (Global Agent)

**Purpose:** Comprehensive Supabase database management

**Capabilities:**
- Schema operations (tables, columns, indexes)
- Authentication setup
- Data migrations
- RLS policy management
- Performance optimization
- Real-time monitoring

**Auto-triggers on:**
- Mentions of "supabase", "database", "schema", "table", "RLS"
- Database-related tasks
- Performance issues

---

## 📋 Supabase Agent Command Templates

### Creating Tables

```
I need to add a [table_name] table to the Perdia database.

Follow Perdia Architecture Guide (ARCHITECTURE_GUIDE.md):
- UUID primary key with gen_random_uuid()
- Standard timestamps (created_at, updated_at, deleted_at)
- RLS enabled with [type] policies
- Indexes on [columns]

Fields:
- [field_name]: [type] [constraints] [description]
- [field_name]: [type] [constraints] [description]

[Additional requirements]
```

**Example:**
```
I need to add a content_performance table to track article metrics.

Follow Perdia Architecture Guide (ARCHITECTURE_GUIDE.md):
- UUID primary key with gen_random_uuid()
- Standard timestamps (created_at, updated_at)
- RLS enabled with team-based policies
- Indexes on content_id and date fields

Fields:
- content_id: UUID NOT NULL REFERENCES content_items(id) - The content being tracked
- date: DATE NOT NULL - Date of metrics
- views: INTEGER DEFAULT 0 - Page views
- clicks: INTEGER DEFAULT 0 - Click count
- impressions: INTEGER DEFAULT 0 - Search impressions
- ctr: DECIMAL(5,2) - Click-through rate
- position: DECIMAL(5,2) - Average search position

Create the migration file in supabase/migrations/ following the template.
```

### Adding RLS Policies

```
Create RLS policies for the [table_name] table following Perdia patterns.

Policy type: [public read / user-based / team-based / admin-only]

Requirements:
- [specific requirement]
- [specific requirement]

Reference ARCHITECTURE_GUIDE.md Section 4 for RLS patterns.
```

**Example:**
```
Create RLS policies for the content_items table following Perdia patterns.

Policy type: Team-based access

Requirements:
- Team members can read all team content
- Team members can create content for their team
- Only content creator or admin can update/delete
- Track user_id and team_id on all operations

Reference ARCHITECTURE_GUIDE.md Section 4 for RLS patterns.
```

### Performance Optimization

```
The [table_name] table is experiencing slow queries.

Current issue: [describe performance problem]

Query patterns:
- [common query 1]
- [common query 2]

Please analyze and optimize following Perdia performance patterns.
```

**Example:**
```
The keywords table is experiencing slow queries.

Current issue: Searching by keyword text and filtering by status takes 3-5 seconds

Query patterns:
- Search by keyword text (partial match)
- Filter by status (active/researched/drafting)
- Sort by search_volume DESC
- Common: status = 'active' AND keyword ILIKE '%education%'

Please analyze and add appropriate indexes following Perdia patterns.
```

### Schema Modifications

```
I need to modify the [table_name] table in the Perdia database.

Changes:
- [change description]
- [change description]

Follow Perdia migration patterns with rollback SQL at top.
```

**Example:**
```
I need to modify the agents table in the Perdia database.

Changes:
- Add system_prompt TEXT field for storing agent instructions
- Add model_config JSONB field for model parameters
- Add is_active BOOLEAN DEFAULT true for enabling/disabling agents

Follow Perdia migration patterns with rollback SQL at top.
Create migration file in supabase/migrations/
```

### Database Migrations

```
Create a database migration for [feature description].

Follow the migration template in ARCHITECTURE_GUIDE.md:
- Timestamped filename (YYYYMMDDHHMMSS_description.sql)
- Rollback SQL commented at top
- Wrapped in BEGIN/COMMIT transaction
- Idempotent (IF NOT EXISTS, IF EXISTS)

[Specific requirements]
```

### Authentication Setup

```
Set up authentication for [user type] in the Perdia database.

Requirements:
- [auth requirement]
- [auth requirement]

Use Supabase Auth patterns from ARCHITECTURE_GUIDE.md.
```

---

## 🔧 SDK Operations

### Adding Entity Methods to Perdia SDK

```
Add [entity_name] methods to the Perdia SDK (src/lib/perdia-sdk.js).

Follow the pattern in ARCHITECTURE_GUIDE.md Section 2:
- getAll(filters) - with filter support
- getById(id) - single record
- create(data) - insert new record
- update(id, updates) - update existing
- delete(id) - soft delete if supported

Use the centralized supabase client from @/lib/supabase-client
Base44-compatible API style
Proper error handling
```

**Example:**
```
Add contentPerformance methods to the Perdia SDK (src/lib/perdia-sdk.js).

Follow the pattern in ARCHITECTURE_GUIDE.md Section 2:
- getAll(filters) - support filtering by content_id, date range
- getByContentId(contentId) - get all metrics for a content item
- getLatest(contentId) - get most recent metrics for content
- create(data) - insert new metric record
- update(id, updates) - update existing metrics

Use the centralized supabase client from @/lib/supabase-client
Include proper error handling and validation
```

---

## 🎣 Creating Custom Hooks

```
Create a [use + EntityName] hook for [entity_name] in src/hooks/.

Follow the pattern in ARCHITECTURE_GUIDE.md Section 6:
- Use Perdia SDK (not direct Supabase)
- Return data, loading, error, refetch
- Support filters parameter
- Implement useEffect for automatic fetching
- Add refetch function for manual refresh

[Specific requirements]
```

**Example:**
```
Create a useContentPerformance hook in src/hooks/useContentPerformance.js.

Follow the pattern in ARCHITECTURE_GUIDE.md Section 6:
- Accept contentId and dateRange parameters
- Fetch metrics using PerdiaSDK.contentPerformance
- Auto-refetch when parameters change
- Return { metrics, loading, error, refetch }
- Handle empty states gracefully
```

---

## 🧪 Testing & Verification

### Database Connection Test

```
Create a test script to verify the [table_name] table is working correctly.

Test:
- Connection to Perdia Supabase project
- Table exists and is accessible
- RLS policies are working
- [specific test case]

Save to scripts/test-[table-name].js
```

### SDK Test

```
Create a test script for the [entity_name] SDK methods.

Test all CRUD operations:
- getAll with filters
- getById
- create
- update
- delete

Use Perdia SDK, not direct Supabase
Save to scripts/test-[entity-name]-sdk.js
```

---

## 📝 Component Generation

### Creating Data-Driven Components

```
Create a [ComponentName] component in src/components/[category]/.

Requirements:
- Use [use + EntityName] hook for data fetching
- Import from @/ path alias
- Use Radix UI components from @/components/ui/
- Follow naming conventions (PascalCase component, kebab-case file)
- Loading and error states
- [specific functionality]

Reference ARCHITECTURE_GUIDE.md for patterns.
```

**Example:**
```
Create a KeywordTable component in src/components/keywords/.

Requirements:
- Use useKeywords hook for data fetching
- Display keywords in a table with columns: keyword, search_volume, difficulty, status
- Filter by status (active/researched/drafting)
- Sort by search_volume or difficulty
- Click to navigate to keyword detail
- Loading skeleton and error display
- Use Radix UI Table component
- Follow Perdia naming conventions

Reference ARCHITECTURE_GUIDE.md Section 5 for file organization.
```

---

## 🚨 Safety Checks

### Before Database Operations

**Always verify:**
```bash
# 1. Check you're in Perdia directory
pwd
# Should show: C:\Users\Will\OneDrive\Documents\Projects\perdia

# 2. Verify Perdia database URL
node -e "console.log('DB:', process.env.VITE_SUPABASE_URL)"
# Should show: Perdia project URL (NOT Disruptors AI)

# 3. Test connection
npm run db:verify
```

### Preventing Cross-Project Confusion

If an agent operation seems wrong, STOP and:

1. Confirm working directory: `pwd`
2. Check environment variables: `node -e "console.log(process.env.VITE_SUPABASE_URL)"`
3. Look for Perdia-specific tables: keywords, content_items, agents
4. NOT Disruptors AI tables: modules, business_brain, telemetry_events

---

## 💡 Pro Tips

### 1. Always Reference the Architecture Guide

When invoking agents, include:
```
Follow patterns in ARCHITECTURE_GUIDE.md
```

This ensures agents use your established patterns.

### 2. Be Specific with Requirements

Bad:
```
Add a performance table
```

Good:
```
Add a content_performance table with fields for views, clicks, CTR,
following Perdia schema patterns with UUID, timestamps, and RLS
```

### 3. Request Complete Outputs

Ask for:
- Migration files with rollback SQL
- Test scripts
- Updated SDK methods
- Documentation updates

### 4. Use Project Context

Start requests with:
```
In the Perdia Education project...
```

This reminds agents of project-specific context.

### 5. Test Immediately

After agent generates code:
```bash
# Test database changes
npm run db:verify

# Test SDK methods
node scripts/test-[entity]-sdk.js

# Lint check
npm run lint

# Build check
npm run build
```

---

## 🔄 Common Workflows

### Adding a New Entity (Complete Workflow)

**Step 1: Create Database Table**
```
I need to add a [entity_name] table to Perdia database.
[Follow template above with all details]
```

**Step 2: Create Migration**
Agent generates: `supabase/migrations/YYYYMMDDHHMMSS_add_[entity]_table.sql`

**Step 3: Apply Migration**
```bash
# Apply via Supabase Dashboard SQL Editor
# or
npm run db:migrate
```

**Step 4: Add SDK Methods**
```
Add [entity_name] methods to Perdia SDK following ARCHITECTURE_GUIDE.md
```

**Step 5: Create Custom Hook**
```
Create use[EntityName] hook following ARCHITECTURE_GUIDE.md Section 6
```

**Step 6: Create Component**
```
Create [EntityName]Table component using use[EntityName] hook
```

**Step 7: Test**
```bash
node scripts/test-[entity]-sdk.js
npm run lint
npm run build
npm run dev
```

### Optimizing Existing Tables

**Step 1: Identify Problem**
```
The [table_name] table has performance issues:
[describe query patterns and slow queries]
```

**Step 2: Agent Analysis**
Agent analyzes schema, queries, and suggests indexes

**Step 3: Create Migration**
```
Create a migration to add the suggested indexes
```

**Step 4: Apply & Test**
```bash
# Apply migration
npm run db:migrate

# Test queries
node scripts/benchmark-[table].js
```

---

## 📚 Reference Documents

When working with agents, reference these documents:

1. **ARCHITECTURE_GUIDE.md** - Complete architecture patterns (PRIMARY)
2. **CLAUDE.md** - Project instructions and agent guidelines
3. **.env.example** - Environment variable documentation
4. **README.md** - Project overview and quick start
5. **supabase/migrations/** - Existing migration examples

---

## ⚠️ Troubleshooting

### Agent Uses Wrong Database

**Symptom:** Agent references Disruptors AI tables or different schema

**Solution:**
1. Stop the agent
2. Verify directory: `pwd`
3. Check environment: `node -e "console.log(process.env.VITE_SUPABASE_URL)"`
4. Restart and explicitly say: "In the Perdia Education project..."

### Agent Doesn't Follow Patterns

**Symptom:** Generated code doesn't match ARCHITECTURE_GUIDE.md

**Solution:**
Be explicit in request:
```
Follow the exact pattern in ARCHITECTURE_GUIDE.md Section [X].
Use centralized supabase-client from @/lib/supabase-client.
Match the style of existing [similar file].
```

### Migration Fails

**Symptom:** Migration errors when applied

**Solution:**
1. Check syntax in Supabase SQL Editor
2. Ensure idempotent (IF NOT EXISTS)
3. Verify foreign key references exist
4. Check RLS policies don't conflict

---

**Last Updated:** 2025-11-04
**Version:** 1.0.0

---

## Quick Reference Card

```
🏗️ CREATE TABLE
"Add [table] to Perdia following ARCHITECTURE_GUIDE.md patterns"

🔐 ADD RLS
"Create RLS policies for [table] with [access type] following Perdia patterns"

⚡ OPTIMIZE
"Optimize [table] queries: [describe query patterns]"

📦 ADD SDK
"Add [entity] methods to Perdia SDK following ARCHITECTURE_GUIDE.md Section 2"

🎣 CREATE HOOK
"Create use[Entity] hook following ARCHITECTURE_GUIDE.md Section 6"

🧪 TEST
npm run db:verify && npm run lint && npm run build
```
