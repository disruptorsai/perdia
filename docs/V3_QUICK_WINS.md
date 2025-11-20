# V3 Quick Wins - Safe Features to Implement Now

**Status:** ✅ SAFE - No Breaking Changes
**Implementation Time:** 2-4 hours
**Risk Level:** ZERO to LOW

---

## 1. Perplexity JSON Truncation Fix ⭐⭐⭐⭐⭐

**Time:** 15 minutes
**Risk:** ZERO
**Value:** HIGH (fixes current bug)

### The Problem
When generating 50+ topic questions, Perplexity hits the 2000 token limit and returns truncated JSON, causing:
- "Expected ',' or ']' after array element" errors
- No questions displayed in UI
- Wasted API calls

### The Fix
```javascript
// src/lib/perplexity-client.js

// 1. Increase maxTokens
const maxTokens = 4000;  // Was: 2000

// 2. Add JSON repair function
function repairTruncatedJSON(text) {
  // Remove incomplete last entry
  let repaired = text.replace(/,\s*$/, '');

  // Count brackets
  const openBrackets = (text.match(/\[/g) || []).length;
  const closeBrackets = (text.match(/\]/g) || []).length;
  const openBraces = (text.match(/\{/g) || []).length;
  const closeBraces = (text.match(/\}/g) || []).length;

  // Close unclosed structures
  if (openBrackets > closeBrackets) {
    repaired += ']'.repeat(openBrackets - closeBrackets);
  }
  if (openBraces > closeBraces) {
    repaired += '}'.repeat(openBraces - closeBraces);
  }

  return repaired;
}

// 3. Use it in API call
try {
  const response = await perplexityAPI.chat(messages, { maxTokens });
  return JSON.parse(response.content);
} catch (error) {
  if (error.message.includes('JSON')) {
    const repaired = repairTruncatedJSON(response.content);
    return JSON.parse(repaired);
  }
  throw error;
}
```

### Implementation Steps
1. Open `src/lib/perplexity-client.js`
2. Find the `generateTopicQuestions` function
3. Change `maxTokens: 2000` to `maxTokens: 4000`
4. Add the `repairTruncatedJSON` function
5. Wrap JSON.parse in try-catch with repair logic
6. Test with large question sets

### Testing
```bash
# Test with 50 questions
node scripts/test-perplexity-questions.js
```

**Files to Change:** 1 file
**Lines of Code:** ~30 lines
**Backwards Compatible:** YES (pure improvement)

---

## 2. AI Cost Tracking Database Tables ⭐⭐⭐⭐⭐

**Time:** 30 minutes
**Risk:** ZERO (additive only)
**Value:** HIGH (enables cost monitoring)

### What You Get
- Track every AI API call
- Monitor costs per article, agent, user
- Identify expensive operations
- Budget alerts and optimization insights

### Implementation Steps

#### Step 1: Apply Migration (10 minutes)
```bash
# Create migration file
cat > supabase/migrations/20251120000001_ai_cost_tracking.sql << 'EOF'
-- AI Usage Logs Table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID REFERENCES content_queue(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),
  agent_name TEXT,

  -- Request details
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_length INTEGER,

  -- Token usage
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,

  -- Cost calculation
  input_cost_per_token NUMERIC(12, 8),
  output_cost_per_token NUMERIC(12, 8),
  total_cost NUMERIC(10, 6) GENERATED ALWAYS AS (
    (input_tokens * input_cost_per_token) + (output_tokens * output_cost_per_token)
  ) STORED,

  -- Performance metrics
  request_duration_ms INTEGER,
  response_success BOOLEAN DEFAULT TRUE,
  error_message TEXT,

  -- Cache metrics
  cache_hit BOOLEAN DEFAULT FALSE,
  cache_savings_pct NUMERIC(5, 2),

  created_date TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_provider CHECK (provider IN ('claude', 'openai', 'gemini')),
  CONSTRAINT chk_tokens_positive CHECK (input_tokens >= 0 AND output_tokens >= 0)
);

-- Indexes
CREATE INDEX idx_ai_usage_logs_content_id ON ai_usage_logs(content_id);
CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_provider ON ai_usage_logs(provider);
CREATE INDEX idx_ai_usage_logs_model ON ai_usage_logs(model);
CREATE INDEX idx_ai_usage_logs_created ON ai_usage_logs(created_date DESC);
CREATE INDEX idx_ai_usage_logs_cost ON ai_usage_logs(total_cost DESC);

-- RLS Policies
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI usage logs"
  ON ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI usage logs"
  ON ai_usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Cost Summary View
CREATE VIEW ai_cost_summary AS
SELECT
  DATE(created_date) AS date,
  provider,
  model,
  COUNT(*) AS request_count,
  SUM(input_tokens) AS total_input_tokens,
  SUM(output_tokens) AS total_output_tokens,
  SUM(total_cost) AS total_cost,
  AVG(total_cost) AS avg_cost_per_request
FROM ai_usage_logs
WHERE response_success = TRUE
GROUP BY DATE(created_date), provider, model
ORDER BY date DESC, total_cost DESC;

GRANT SELECT ON ai_cost_summary TO authenticated;
EOF

# Apply migration
npm run db:migrate
```

#### Step 2: Update invoke-llm Edge Function (20 minutes)

See `docs/PERDIA_V3_ANALYSIS.md` Section 2 for complete code.

Key changes:
1. Add TOKEN_PRICES constant
2. Add calculateCost() function
3. Add logAIUsage() function
4. Call logAIUsage() after successful API calls
5. Return cost in response

**Files to Change:**
- `supabase/migrations/20251120000001_ai_cost_tracking.sql` (new)
- `supabase/functions/invoke-llm/index.ts` (update)

**Backwards Compatible:** YES
- Works with/without content_id
- Non-blocking errors
- Old requests work unchanged

---

## 3. Perplexity Model Name Updates ⭐⭐⭐

**Time:** 30 minutes
**Risk:** LOW (with model mapping)
**Value:** MEDIUM (use latest models)

### What Changed
Perplexity renamed their models in 2025:
- `sonar-medium-online` → `sonar-pro`
- `sonar-small-online` → `sonar`

### Safe Implementation (Model Mapping)

```javascript
// src/lib/perplexity-client.js

// Add at top of file
const MODEL_MAPPING = {
  // Old names (2024)
  'sonar-medium-online': 'sonar-pro',
  'sonar-small-online': 'sonar',
  // New names (2025) - pass through
  'sonar-pro': 'sonar-pro',
  'sonar': 'sonar',
  'sonar-reasoning': 'sonar-reasoning'
};

function normalizeModel(model) {
  return MODEL_MAPPING[model] || model;
}

// Use in API calls
export async function callPerplexity(prompt, options = {}) {
  const model = normalizeModel(options.model || 'sonar-pro');

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,  // Now using normalized model name
      messages: [{ role: 'user', content: prompt }],
      ...options
    })
  });

  return response.json();
}
```

### Implementation Steps
1. Add MODEL_MAPPING constant
2. Add normalizeModel() function
3. Use normalizeModel() in all API calls
4. Test with both old and new model names
5. Update defaults to new model names

**Files to Change:** 1-2 files
- `src/lib/perplexity-client.js`
- `src/lib/agents/` (if any hard-coded model names)

**Backwards Compatible:** YES
- Old model names still work (mapped to new)
- New model names work directly
- Gradual migration possible

---

## 4. Content Queue SLA Tracking ⭐⭐⭐⭐

**Time:** 45 minutes
**Risk:** LOW (test trigger)
**Value:** HIGH (5-day auto-approve)

### What You Get
- Track how long content is in "pending_review"
- Auto-approve after 5 days (configurable)
- SLA dashboard showing days remaining
- Automated workflow compliance

### Implementation Steps

#### Step 1: Apply Migration (15 minutes)
```sql
-- Add SLA columns to content_queue
ALTER TABLE content_queue
ADD COLUMN IF NOT EXISTS pending_since TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_approved_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_approved_reason TEXT;

-- Backfill existing records
UPDATE content_queue
SET pending_since = created_date
WHERE status = 'pending_review'
  AND pending_since IS NULL;

-- Create trigger
CREATE OR REPLACE FUNCTION set_pending_since()
RETURNS TRIGGER AS $$
BEGIN
  -- Set pending_since when status changes TO pending_review
  IF NEW.status = 'pending_review' AND (OLD.status IS NULL OR OLD.status != 'pending_review') THEN
    NEW.pending_since = NOW();
  END IF;

  -- Clear pending_since when status changes FROM pending_review
  IF OLD.status = 'pending_review' AND NEW.status != 'pending_review' THEN
    NEW.pending_since = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_pending_since
BEFORE UPDATE ON content_queue
FOR EACH ROW
EXECUTE FUNCTION set_pending_since();

-- Create SLA status function
CREATE OR REPLACE FUNCTION get_sla_status(p_content_id UUID)
RETURNS TABLE (
  days_pending INTEGER,
  days_remaining INTEGER,
  auto_publish_eligible BOOLEAN
) AS $$
  SELECT
    FLOOR(EXTRACT(EPOCH FROM (NOW() - pending_since)) / 86400)::INTEGER AS days_pending,
    GREATEST(0, 5 - FLOOR(EXTRACT(EPOCH FROM (NOW() - pending_since)) / 86400)::INTEGER) AS days_remaining,
    FLOOR(EXTRACT(EPOCH FROM (NOW() - pending_since)) / 86400) >= 5 AS auto_publish_eligible
  FROM content_queue
  WHERE id = p_content_id
    AND status = 'pending_review'
    AND pending_since IS NOT NULL;
$$ LANGUAGE SQL STABLE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_content_queue_sla
ON content_queue (status, pending_since)
WHERE status = 'pending_review';
```

#### Step 2: Update TypeScript Interface (10 minutes)
```typescript
// src/lib/perdia-sdk/entities/ContentQueue.ts

export interface ContentQueue {
  id: string;
  user_id: string;
  title: string;
  content: string;
  status: 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected';

  // ... existing fields

  // SLA tracking (V3 migration)
  pending_since?: Date;
  auto_approved?: boolean;
  auto_approved_date?: Date;
  auto_approved_reason?: string;
}
```

#### Step 3: Test Thoroughly (20 minutes)
```bash
# Test status transitions
node scripts/test-sla-tracking.js

# Test cases:
# 1. draft → pending_review (should set pending_since)
# 2. pending_review → approved (should clear pending_since)
# 3. draft → approved (should not set pending_since)
# 4. Update other fields (should not affect pending_since)
```

**Files to Change:**
- Migration file (new)
- `src/lib/perdia-sdk/entities/ContentQueue.ts` (interface update)

**Backwards Compatible:** YES
- New columns have defaults
- Trigger only acts when needed
- Existing queries work unchanged

**Testing Checklist:**
- [ ] Status transitions work correctly
- [ ] Trigger sets/clears pending_since appropriately
- [ ] get_sla_status() function works
- [ ] No impact on existing content operations
- [ ] Performance acceptable (<5ms overhead)

---

## 5. Keywords Batch Tracking ⭐⭐⭐

**Time:** 30 minutes
**Risk:** ZERO (additive only)
**Value:** MEDIUM (better organization)

### What You Get
- Group keywords by import batch
- Track source (CSV, agent, manual)
- Batch operations (delete all, update all)
- Starred/favorite keywords

### Implementation Steps

#### Step 1: Apply Migration (10 minutes)
```sql
-- Add batch tracking columns
ALTER TABLE keywords
ADD COLUMN IF NOT EXISTS batch_id UUID,
ADD COLUMN IF NOT EXISTS batch_name TEXT,
ADD COLUMN IF NOT EXISTS batch_source TEXT,
ADD COLUMN IF NOT EXISTS batch_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS batch_starred BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_keywords_batch_id ON keywords(batch_id);
CREATE INDEX IF NOT EXISTS idx_keywords_is_starred ON keywords(is_starred);
CREATE INDEX IF NOT EXISTS idx_keywords_batch_date ON keywords(batch_date DESC);

-- Add comments
COMMENT ON COLUMN keywords.batch_id IS 'UUID grouping keywords imported together';
COMMENT ON COLUMN keywords.batch_name IS 'Human-readable name (e.g., "Keyword Research - Nov 20, 2025")';
COMMENT ON COLUMN keywords.batch_source IS 'Source: keyword_researcher_agent, manual, csv_import';
```

#### Step 2: Update TypeScript Interface (10 minutes)
```typescript
// src/lib/perdia-sdk/entities/Keyword.ts

export interface Keyword {
  id: string;
  user_id: string;
  keyword: string;
  search_volume?: number;
  difficulty?: number;
  priority?: number;
  status: string;

  // ... existing fields

  // Batch tracking (V3 migration)
  batch_id?: string;
  batch_name?: string;
  batch_source?: 'keyword_researcher_agent' | 'manual' | 'csv_import';
  batch_date?: Date;
  batch_starred?: boolean;
  is_starred?: boolean;
}
```

#### Step 3: Use in Components (10 minutes)
```javascript
// src/pages/KeywordManager.jsx

// When creating keywords from agent
const batchId = crypto.randomUUID();
const keywords = await Keyword.createMany(
  keywordList.map(kw => ({
    ...kw,
    batch_id: batchId,
    batch_name: `AI Research - ${new Date().toLocaleDateString()}`,
    batch_source: 'keyword_researcher_agent',
    batch_date: new Date()
  }))
);

// Filter by batch
const batchKeywords = await Keyword.find({ batch_id: batchId });

// Delete batch
await Keyword.deleteMany({ batch_id: batchId });
```

**Files to Change:**
- Migration file (new)
- `src/lib/perdia-sdk/entities/Keyword.ts` (interface)
- `src/pages/KeywordManager.jsx` (optional, use batch tracking)

**Backwards Compatible:** YES
- All columns nullable or have defaults
- Existing keyword operations work unchanged

---

## Implementation Order

### Day 1: Foundation (1 hour)
1. ✅ Perplexity JSON truncation fix (15 min)
2. ✅ AI cost tracking migration (30 min)
3. ✅ Test both features (15 min)

### Day 2: Cost Tracking (2 hours)
4. ✅ Update invoke-llm Edge Function (1 hour)
5. ✅ Deploy and test cost tracking (30 min)
6. ✅ Verify logging works (30 min)

### Day 3: Enhancements (2 hours)
7. ✅ Content queue SLA tracking (45 min)
8. ✅ Keywords batch tracking (30 min)
9. ✅ Perplexity model updates (30 min)
10. ✅ Test all features together (15 min)

**Total Time:** 4-5 hours
**Risk:** ZERO to LOW
**Value:** VERY HIGH

---

## Testing Strategy

### After Each Feature
```bash
# 1. Build succeeds
npm run build

# 2. Type checking passes
npm run type-check

# 3. Dev server runs
npm run dev

# 4. No console errors in browser
# Open: http://localhost:5173
# Check browser console

# 5. Critical paths work
# - Login
# - Create keyword
# - Create content
# - Generate questions
```

### Rollback If Needed
```bash
# Each feature is isolated
# If something breaks:
git checkout HEAD~1 <problematic-file>
npm run build
```

---

## Success Metrics

After implementation, you should see:

### 1. Perplexity Fix
- ✅ 50+ topic questions generated successfully
- ✅ No more JSON parse errors
- ✅ Questions display in UI

### 2. Cost Tracking
- ✅ New entries in `ai_usage_logs` table
- ✅ Cost information in API responses
- ✅ Ability to query: "How much did this article cost?"

### 3. SLA Tracking
- ✅ `pending_since` automatically set when status = 'pending_review'
- ✅ `get_sla_status()` returns days pending
- ✅ Dashboard shows SLA status

### 4. Batch Tracking
- ✅ Keywords grouped by batch
- ✅ Batch operations work (delete all in batch)
- ✅ Source attribution tracked

---

## Next Steps After Quick Wins

Once these are stable, consider:

1. **Infrastructure Agents** (Medium risk)
   - Deployment automation
   - Database management
   - Testing automation

2. **Additional Schema** (Low risk)
   - Validation logs
   - Quote sources

3. **Advanced Features** (Higher risk)
   - Automated deployment scripts
   - WordPress database integration

But start with these quick wins first!

---

**Version:** 1.0
**Status:** ✅ READY TO IMPLEMENT
**Risk Level:** ZERO to LOW
**Estimated Time:** 4-5 hours
