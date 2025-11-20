# supabase - Database & Edge Functions

Supabase backend for Perdia Education including PostgreSQL database, Edge Functions, and storage.

## Project Details

- **Project Ref:** `yvvtsfgryweqfppilkvo`
- **URL:** `https://yvvtsfgryweqfppilkvo.supabase.co`
- **Edge Function Timeout:** 400 seconds

## Folder Structure

```
supabase/
├── functions/          # Edge Functions
│   ├── invoke-llm/     # AI invocation (400s timeout)
│   └── generate-image/ # Image generation
└── migrations/         # Database migrations
    └── 20250104000001_perdia_complete_schema.sql
```

## Database Schema

### Schema Patterns

- **Primary Keys:** UUID with `uuid_generate_v4()`
- **Timestamps:** `created_date TIMESTAMPTZ DEFAULT NOW()`
- **Updates:** Auto-updating `updated_date` triggers
- **RLS:** Enabled on all tables with user isolation
- **Naming:** `lowercase_with_underscores`

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `keywords` | Keyword tracking | keyword, search_volume, difficulty, priority |
| `content_queue` | Content workflow | title, content, status, scheduled_publish_date |
| `topic_questions` | Content suggestions | question, search_volume, priority |
| `clusters` | Topic grouping | name, description, status |
| `performance_metrics` | GSC data | url, clicks, impressions, position |
| `wordpress_connections` | WordPress sites | site_url, api_key |
| `automation_settings` | User preferences | key, value |
| `knowledge_base_documents` | AI training | title, content, file_url |
| `agent_definitions` | AI agent configs | name, system_prompt, model |
| `agent_conversations` | AI conversations | agent_name, status |
| `agent_messages` | Conversation history | role, content |
| `articles` | V2 article storage | title, content, status |
| `feedback` | Article comments | article_id, content |
| `article_revisions` | Edit history | article_id, content |

### Storage Buckets

| Bucket | Visibility | Purpose |
|--------|------------|---------|
| `content-images` | Public | Blog/article images |
| `social-media` | Public | Social media assets |
| `knowledge-base` | Private | AI training documents |
| `uploads` | Private | General file uploads |

## Edge Functions

### invoke-llm

Main AI invocation endpoint with 400-second timeout.

**Location:** `functions/invoke-llm/index.ts`

**Supports:**
- Claude (Anthropic)
- OpenAI (GPT)
- Grok (xAI)
- Perplexity (Sonar)

**Request:**
```javascript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/invoke-llm`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: 'Write about...',
      provider: 'claude',
      model: 'claude-sonnet-4-5-20250929',
      temperature: 0.7,
      max_tokens: 4000
    })
  }
);
```

### generate-image

Image generation with Gemini 2.5 Flash.

**Location:** `functions/generate-image/index.ts`

**HARD RULE:** Never use DALL-E 3!

**Models:**
- ✅ `gemini-2.5-flash-image` (PRIMARY)
- ✅ `gpt-image-1` (FALLBACK)
- ❌ `dall-e-3` (FORBIDDEN)

## Deployment

### Link to Project

```bash
npx supabase link --project-ref yvvtsfgryweqfppilkvo
```

### Deploy Functions

```bash
# Deploy specific function
npx supabase functions deploy invoke-llm --project-ref yvvtsfgryweqfppilkvo

# Deploy all functions
npx supabase functions deploy --project-ref yvvtsfgryweqfppilkvo
```

### Configure Secrets

```bash
# Set secrets
npx supabase secrets set ANTHROPIC_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set OPENAI_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set XAI_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set PERPLEXITY_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo

# List secrets
npx supabase secrets list --project-ref yvvtsfgryweqfppilkvo
```

### Run Migrations

```bash
npm run db:migrate
# Or directly:
npx supabase db push --project-ref yvvtsfgryweqfppilkvo
```

## RLS Policies

All tables have Row Level Security (RLS) enabled:

```sql
-- Example policy pattern
CREATE POLICY "Users can view own records"
ON keywords
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records"
ON keywords
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records"
ON keywords
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own records"
ON keywords
FOR DELETE
USING (auth.uid() = user_id);
```

## Creating New Tables

Follow this pattern for new tables:

```sql
-- Create table
CREATE TABLE IF NOT EXISTS my_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Your fields here
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',

  -- Timestamps
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own records"
ON my_table FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create updated_date trigger
CREATE TRIGGER update_my_table_updated_date
  BEFORE UPDATE ON my_table
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date();

-- Create indexes
CREATE INDEX idx_my_table_user_id ON my_table(user_id);
CREATE INDEX idx_my_table_status ON my_table(status);
```

## Common Queries

### Performance Optimization

```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM keywords WHERE user_id = 'xxx';

-- Add index for slow queries
CREATE INDEX idx_keywords_priority ON keywords(priority DESC);
CREATE INDEX idx_content_queue_status ON content_queue(status);
```

### Debugging RLS

```sql
-- Check current user
SELECT auth.uid();

-- List policies for table
SELECT * FROM pg_policies WHERE tablename = 'keywords';
```

## MCP Server Access

The Supabase MCP server is configured for direct database access:

```javascript
// List tables
ListMcpResourcesTool({ server: "supabase" })

// Get table schema
ReadMcpResourceTool({
  server: "supabase",
  uri: "supabase://table/keywords"
})

// Execute SQL
mcp__supabase__run_sql({
  sql: "SELECT COUNT(*) FROM content_queue WHERE status = 'pending_review'"
})
```

## Troubleshooting

### 403 Errors (RLS)

1. Check user is authenticated
2. Verify RLS policies exist
3. Check user_id matches auth.uid()

```javascript
// Always check auth before operations
const user = await getCurrentUser();
if (!user) throw new Error('Not authenticated');
```

### Edge Function Timeouts

- Default: 400 seconds
- If timing out, check:
  - AI provider rate limits
  - Network issues
  - Large prompt sizes

### Migration Errors

```bash
# Reset and re-apply migrations (development only!)
npx supabase db reset --project-ref yvvtsfgryweqfppilkvo
```

## Best Practices

1. **Always use SDK** - Don't query Supabase directly in components
2. **Enable RLS** - On all tables, always
3. **Add indexes** - For frequently filtered columns
4. **Use triggers** - For updated_date and computed fields
5. **Test locally first** - Use `supabase start` for local dev
6. **Backup before migrations** - Especially in production

## Useful Commands

```bash
# Local development
npx supabase start        # Start local Supabase
npx supabase stop         # Stop local Supabase
npx supabase status       # Check status

# Database
npx supabase db diff      # Show schema changes
npx supabase db push      # Push migrations
npx supabase db reset     # Reset database (caution!)

# Functions
npx supabase functions serve  # Local function testing
npx supabase functions list   # List deployed functions

# Logs
npx supabase functions logs invoke-llm --project-ref yvvtsfgryweqfppilkvo
```
