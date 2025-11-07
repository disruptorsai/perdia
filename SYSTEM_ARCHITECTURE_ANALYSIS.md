# Perdia AI Content Engine - System Architecture Analysis

**Analysis Date:** November 7, 2025
**Status:** ✅ SYSTEM PROPERLY CONFIGURED
**Issue:** Working model IDs now deployed

---

## 📊 Database Architecture

### Agent Tables Structure

#### 1. `agent_definitions` Table
**Purpose:** Stores configuration for the 9 AI agents

```sql
CREATE TABLE agent_definitions (
    id UUID PRIMARY KEY,
    agent_name TEXT UNIQUE NOT NULL,          -- e.g., 'seo_content_writer'
    display_name TEXT NOT NULL,                -- e.g., 'SEO Content Writer'
    description TEXT NOT NULL,
    system_prompt TEXT NOT NULL,               -- AI instructions
    icon TEXT,
    color TEXT,
    default_model TEXT,                        -- NOW: 'claude-sonnet-4-5'
    temperature NUMERIC(2,1) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 4000,
    capabilities TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);
```

**Current Agents (9 total):**
1. seo_content_writer
2. content_optimizer
3. keyword_researcher
4. general_content_assistant
5. emma_promoter
6. enrollment_strategist
7. history_storyteller
8. resource_expander
9. social_engagement_booster

#### 2. `agent_conversations` Table
**Purpose:** Stores conversation sessions between user and agent

```sql
CREATE TABLE agent_conversations (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    agent_name TEXT NOT NULL,                  -- Which agent
    title TEXT,                                 -- Auto-generated from first message
    context JSONB DEFAULT '{}',
    is_archived BOOLEAN DEFAULT false,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    last_message_date TIMESTAMPTZ
);
```

**Indexes:**
- `idx_agent_conversations_user_id` on user_id
- `idx_agent_conversations_agent_name` on agent_name
- `idx_agent_conversations_created_date` on created_date DESC

#### 3. `agent_messages` Table
**Purpose:** Stores ALL messages (user questions + AI responses)

```sql
CREATE TABLE agent_messages (
    id UUID PRIMARY KEY,
    conversation_id UUID REFERENCES agent_conversations(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,                     -- THE ACTUAL MESSAGE/RESPONSE
    model_used TEXT,                           -- Which AI model generated this
    tokens_used INTEGER,                       -- Cost tracking
    created_date TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_agent_messages_conversation_id` on conversation_id
- `idx_agent_messages_created_date` on created_date DESC

**This is where AI responses are stored!**

---

## 🔒 Row Level Security (RLS) Policies

### Agent Definitions
```sql
-- Anyone can view active agents (public access)
CREATE POLICY "Anyone can view active agent definitions"
    ON agent_definitions FOR SELECT
    USING (is_active = true);
```

### Agent Conversations
```sql
-- Users can only see their own conversations
CREATE POLICY "Users can view their own conversations"
    ON agent_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
    ON agent_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
    ON agent_conversations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
    ON agent_conversations FOR DELETE
    USING (auth.uid() = user_id);
```

### Agent Messages
```sql
-- Users can only access messages in their own conversations
CREATE POLICY "Users can view messages in their conversations"
    ON agent_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM agent_conversations
            WHERE agent_conversations.id = agent_messages.conversation_id
            AND agent_conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in their conversations"
    ON agent_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM agent_conversations
            WHERE agent_conversations.id = conversation_id
            AND agent_conversations.user_id = auth.uid()
        )
    );
```

**Status:** ✅ Properly secured - users can only access their own data

---

## 🔄 Message Flow Architecture

### Complete Flow: User Question → AI Response → Database

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. USER ACTION                                                      │
│    - User types message in ChatInterface.jsx                        │
│    - Clicks "Send" or presses Enter                                 │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND (ChatInterface.jsx)                                     │
│    - Validates user is authenticated                                │
│    - Checks if conversation exists (or creates new one)             │
│    - Calls: agentSDK.sendMessage({ conversation_id, message })     │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. AGENT SDK (src/lib/agent-sdk.js)                                │
│    Line 278: async sendMessage(options)                             │
│                                                                      │
│    Steps:                                                            │
│    a) Get conversation with full history                            │
│    b) Get agent definition (system_prompt, model, etc.)             │
│    c) Save user message to database:                                │
│       AgentMessage.create({                                         │
│         conversation_id,                                            │
│         role: 'user',                                               │
│         content: message                                            │
│       })                                                            │
│    d) Build message history for context                             │
│    e) Call AI:                                                      │
│       const response = await invokeLLM({                            │
│         provider: 'claude',                                         │
│         model: 'claude-sonnet-4-5',                                 │
│         systemPrompt: agentDef.system_prompt,                       │
│         messages: messageHistory,                                   │
│         temperature: 0.7,                                           │
│         maxTokens: 4000                                             │
│       })                                                            │
│    f) Save assistant response to database:                          │
│       AgentMessage.create({                                         │
│         conversation_id,                                            │
│         role: 'assistant',                                          │
│         content: assistantResponse,                                 │
│         model_used: 'claude-sonnet-4-5'                            │
│       })                                                            │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. AI CLIENT (src/lib/ai-client.js)                                │
│    Line 64: async function invokeLLM(options)                       │
│                                                                      │
│    - Builds request payload with messages                           │
│    - Calls Netlify serverless function (for API key security):      │
│      fetch('/.netlify/functions/invoke-llm', {                      │
│        method: 'POST',                                              │
│        body: JSON.stringify({                                       │
│          provider: 'claude',                                        │
│          model: 'claude-sonnet-4-5',                               │
│          messages: [...],                                           │
│          system_prompt: '...',                                      │
│          temperature: 0.7,                                          │
│          max_tokens: 4000                                           │
│        })                                                           │
│      })                                                             │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. NETLIFY FUNCTION (netlify/functions/invoke-llm.js)              │
│    - Runs SERVER-SIDE (API keys secure)                             │
│    - Gets ANTHROPIC_API_KEY from env vars                           │
│    - Creates Anthropic SDK client:                                  │
│      const anthropic = new Anthropic({                              │
│        apiKey: process.env.ANTHROPIC_API_KEY                        │
│      })                                                             │
│    - Calls Anthropic API:                                           │
│      const response = await anthropic.messages.create({             │
│        model: 'claude-sonnet-4-5',                                 │
│        max_tokens: 4000,                                            │
│        temperature: 0.7,                                            │
│        messages: [...],                                             │
│        system: systemPrompt                                         │
│      })                                                             │
│    - Returns response to client                                     │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. ANTHROPIC API                                                    │
│    - Receives request with:                                         │
│      * Model: claude-sonnet-4-5                                    │
│      * System prompt (agent instructions)                           │
│      * Message history (for context)                                │
│      * User's current question                                      │
│    - Processes with Claude 4.5 Sonnet AI                           │
│    - Generates response text                                        │
│    - Returns:                                                       │
│      {                                                              │
│        content: "AI generated response...",                         │
│        usage: { input_tokens: 150, output_tokens: 500 }            │
│      }                                                              │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 7. RESPONSE FLOWS BACK                                              │
│    Netlify function → ai-client.js → agent-sdk.js                  │
│                                                                      │
│    agent-sdk.js saves to database:                                  │
│    INSERT INTO agent_messages (                                     │
│      conversation_id,                                               │
│      role,           -- 'assistant'                                 │
│      content,        -- AI response text                            │
│      model_used,     -- 'claude-sonnet-4-5'                        │
│      created_date                                                   │
│    )                                                                │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 8. UI UPDATES (ChatInterface.jsx)                                  │
│    - Realtime subscription detects new message in database          │
│    - OR: Returns from sendMessage() call                            │
│    - Adds assistant message to chat UI                              │
│    - User sees AI response                                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Where Responses Are Stored

### Database: Supabase PostgreSQL

**Table:** `agent_messages`

**Example Record (User Message):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "conversation_id": "660e8400-e29b-41d4-a716-446655440000",
  "role": "user",
  "content": "Write an article about AI courses in Utah",
  "model_used": null,
  "tokens_used": null,
  "created_date": "2025-11-07T20:42:00Z"
}
```

**Example Record (AI Response):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "conversation_id": "660e8400-e29b-41d4-a716-446655440000",
  "role": "assistant",
  "content": "# AI Courses in Utah: A Comprehensive Guide\n\nUtah has emerged as a growing hub for artificial intelligence education...",
  "model_used": "claude-sonnet-4-5",
  "tokens_used": 1247,
  "created_date": "2025-11-07T20:42:05Z"
}
```

**Query to View All Responses:**
```sql
SELECT
  am.content AS response,
  am.model_used,
  am.created_date,
  ac.agent_name,
  ac.title AS conversation_title
FROM agent_messages am
JOIN agent_conversations ac ON ac.id = am.conversation_id
WHERE am.role = 'assistant'
  AND ac.user_id = auth.uid()
ORDER BY am.created_date DESC;
```

---

## 🔑 API Key Flow

### Environment Variables

**Local Development (.env.local):**
```bash
VITE_ANTHROPIC_API_KEY=sk-ant-...    # For client-side reference only
ANTHROPIC_API_KEY=sk-ant-...          # For Netlify CLI local testing
```

**Production (Netlify Dashboard):**
```bash
ANTHROPIC_API_KEY=sk-ant-...          # SERVER-SIDE ONLY
```

**Security:**
- ✅ API keys NEVER sent to browser
- ✅ All AI calls go through Netlify serverless function
- ✅ Keys stored as environment variables in Netlify
- ✅ Client code has NO direct access to keys

---

## ⚙️ Current Configuration

### Model Settings (as of Nov 7, 2025)

**ALL 9 agents configured with:**
```javascript
{
  default_model: 'claude-sonnet-4-5',    // Claude 4.5 Sonnet
  temperature: 0.7,                       // Creativity level
  max_tokens: 4000,                       // Max response length
  provider: 'claude'                      // Anthropic
}
```

**Cost:**
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens

---

## ✅ System Status

### Database Configuration
- ✅ Tables created correctly
- ✅ RLS policies in place and working
- ✅ Indexes optimized for performance
- ✅ Foreign key constraints enforcing data integrity

### AI Integration
- ✅ Netlify function configured
- ✅ API keys in environment
- ✅ Model IDs updated to Claude 4.5
- ✅ All 9 agents using correct model

### Security
- ✅ Row Level Security enabled
- ✅ User data isolation working
- ✅ API keys server-side only
- ✅ Authentication required

---

## 🐛 Known Issues (RESOLVED)

### ~~Issue: Claude 3.5 Model Deprecated~~
**Status:** ✅ FIXED (Nov 7, 2025)

**Problem:**
- All agents were using `claude-3-5-sonnet-20241022`
- Anthropic deprecated ALL Claude 3.5 models on Oct 29, 2025
- API was returning 404 errors
- Zero assistant responses were being saved

**Solution:**
- Updated all agents to `claude-sonnet-4-5` (Claude 4.5 Sonnet)
- Re-seeded database with new model IDs
- Deployed to production

**Result:**
- ✅ AI agents now responding correctly
- ✅ Responses being saved to database
- ✅ Using latest and most capable Claude model

---

## 📈 Monitoring

### Check Agent Activity
```sql
-- Count messages by agent
SELECT
  ac.agent_name,
  COUNT(*) FILTER (WHERE am.role = 'user') as user_messages,
  COUNT(*) FILTER (WHERE am.role = 'assistant') as ai_responses
FROM agent_conversations ac
LEFT JOIN agent_messages am ON am.conversation_id = ac.id
GROUP BY ac.agent_name
ORDER BY ai_responses DESC;
```

### Check Recent Conversations
```sql
SELECT
  ac.id,
  ac.agent_name,
  ac.title,
  COUNT(am.id) as message_count,
  MAX(am.created_date) as last_activity
FROM agent_conversations ac
LEFT JOIN agent_messages am ON am.conversation_id = ac.id
WHERE ac.user_id = auth.uid()
GROUP BY ac.id, ac.agent_name, ac.title
ORDER BY last_activity DESC
LIMIT 20;
```

---

**Analysis Complete:** System is properly configured and working as designed. All AI responses flow through Netlify function to Anthropic API and are stored in the `agent_messages` table with proper RLS security.
