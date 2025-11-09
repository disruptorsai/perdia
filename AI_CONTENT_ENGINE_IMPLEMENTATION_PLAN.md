# AI Content Engine Integration Implementation Plan

**Based on:** Base44 version mechanics  
**Target:** Current Supabase-based repo  
**Status:** Implementation Plan

---

## Analysis: Base44 vs Current Architecture

### Base44 Version (Reference)
**How it worked:**
1. **Backend Integration**: Base44 platform handled all context building server-side
2. **Message Flow**:
   - User sends message → Frontend calls `agentSDK.addMessage()`
   - Backend receives request → Fetches:
     - Agent instructions (from agent definition)
     - Client training data (`focus_keywords`, `ai_writing_directives`)
     - Knowledge base files (downloads and reads file content)
   - Backend builds enhanced system prompt with all context
   - Backend calls LLM with enhanced prompt
   - Response streamed back to frontend

### Current Repo Architecture
**How it works now:**
1. **Frontend Integration**: `agent-sdk.js` handles LLM calls directly
2. **Message Flow**:
   - User sends message → `agentSDK.sendMessage()`
   - Fetches agent definition (system_prompt only)
   - Calls `invokeLLM()` with static system_prompt
   - No training data or knowledge files included

### Gap Analysis
| Component | Base44 | Current | Gap |
|-----------|--------|---------|-----|
| Agent Instructions | ✅ Fetched | ✅ Fetched | None |
| Training Data | ✅ Fetched & Used | ❌ Not Used | **MISSING** |
| Knowledge Files | ✅ Fetched & Used | ❌ Not Used | **MISSING** |
| Context Building | ✅ Backend | ❌ Not Done | **MISSING** |
| System Prompt Enhancement | ✅ Dynamic | ❌ Static | **MISSING** |

---

## Implementation Strategy

### Approach: Frontend Integration (Phase 1)
**Rationale:**
- Faster to implement
- Uses existing architecture
- Can migrate to backend later if needed

### Architecture Decision: Two-Phase Implementation

#### Phase 1: Frontend Integration (Current)
- Modify `agent-sdk.js` to fetch training/knowledge data
- Build enhanced system prompt in frontend
- Pass enhanced prompt to `invokeLLM()`

#### Phase 2: Backend Integration (Future)
- Create new Supabase Edge Function: `invoke-agent-llm`
- Move context building to backend
- More secure, scalable, and handles file content extraction server-side

---

## Implementation Plan

### Step 1: Enhance `agent-sdk.js` - Fetch Training Data

**File:** `src/lib/agent-sdk.js`

**Changes:**
1. Add method to fetch Client training data
2. Modify `sendMessage()` to fetch and include training data

**Code:**
```javascript
// Add new method to fetch client training data
async getClientTrainingData() {
  try {
    const clients = await Client.list("name", 1);
    if (clients.length === 0) {
      return { focus_keywords: '', ai_writing_directives: '' };
    }
    const client = clients[0];
    return {
      focus_keywords: client.focus_keywords || '',
      ai_writing_directives: client.ai_writing_directives || ''
    };
  } catch (error) {
    console.error('Error fetching client training data:', error);
    return { focus_keywords: '', ai_writing_directives: '' };
  }
}

// Modify sendMessage() to include training data
async sendMessage(options) {
  // ... existing code ...
  
  // Get agent definition
  const agentDef = conversation.agent_definition;
  
  // ✨ NEW: Fetch client training data
  const trainingData = await this.getClientTrainingData();
  
  // ✨ NEW: Build enhanced system prompt
  const enhancedSystemPrompt = this.buildEnhancedSystemPrompt(
    agentDef.system_prompt,
    trainingData,
    [] // knowledge files (Step 2)
  );
  
  // Use enhanced system prompt
  const assistantResponse = await invokeLLM({
    // ... existing options ...
    systemPrompt: enhancedSystemPrompt, // ✨ Use enhanced prompt
  });
}
```

---

### Step 2: Enhance `agent-sdk.js` - Fetch Knowledge Files

**File:** `src/lib/agent-sdk.js`

**Changes:**
1. Add method to fetch knowledge files for agent
2. Add method to extract text content from files
3. Include knowledge content in enhanced system prompt

**Code:**
```javascript
// Add new method to fetch knowledge files
async getKnowledgeFilesForAgent(agentName) {
  try {
    // Fetch agent-specific files
    const agentFiles = await FileDocument.find(
      { agent_name: agentName },
      { orderBy: { column: 'created_date', ascending: false } }
    );
    
    // Fetch shared files
    const sharedFiles = await FileDocument.find(
      { agent_name: 'shared' },
      { orderBy: { column: 'created_date', ascending: false } }
    );
    
    // Combine and deduplicate
    const allFiles = [...agentFiles, ...sharedFiles];
    const uniqueFiles = Array.from(
      new Map(allFiles.map(f => [f.id, f])).values()
    );
    
    return uniqueFiles;
  } catch (error) {
    console.error('Error fetching knowledge files:', error);
    return [];
  }
}

// Add method to extract text from knowledge files
async extractKnowledgeContent(files) {
  const knowledgeContent = [];
  
  for (const file of files) {
    try {
      // Only process text-based files for now
      if (file.mime_type?.includes('text/') || 
          file.mime_type === 'application/json' ||
          file.file_name?.endsWith('.txt') ||
          file.file_name?.endsWith('.md')) {
        
        // Fetch file content
        const response = await fetch(file.file_url);
        const text = await response.text();
        
        knowledgeContent.push({
          filename: file.filename || file.file_name,
          content: text.substring(0, 5000) // Limit to 5000 chars per file
        });
      }
      // TODO: Add PDF, DOCX extraction in Phase 2
    } catch (error) {
      console.error(`Error extracting content from ${file.filename}:`, error);
    }
  }
  
  return knowledgeContent;
}

// Modify sendMessage() to include knowledge files
async sendMessage(options) {
  // ... existing code ...
  
  // ✨ NEW: Fetch knowledge files
  const knowledgeFiles = await this.getKnowledgeFilesForAgent(agentDef.agent_name);
  const knowledgeContent = await this.extractKnowledgeContent(knowledgeFiles);
  
  // ✨ NEW: Build enhanced system prompt with knowledge
  const enhancedSystemPrompt = this.buildEnhancedSystemPrompt(
    agentDef.system_prompt,
    trainingData,
    knowledgeContent
  );
}
```

---

### Step 3: Build Enhanced System Prompt

**File:** `src/lib/agent-sdk.js`

**Changes:**
1. Add method to combine all context into enhanced system prompt

**Code:**
```javascript
// Build enhanced system prompt with all context
buildEnhancedSystemPrompt(basePrompt, trainingData, knowledgeContent) {
  let enhancedPrompt = basePrompt;
  
  // Add training data section
  if (trainingData.focus_keywords || trainingData.ai_writing_directives) {
    enhancedPrompt += '\n\n=== CLIENT TRAINING DATA ===\n';
    
    if (trainingData.focus_keywords) {
      enhancedPrompt += `\nFOCUS KEYWORDS:\n${trainingData.focus_keywords}\n`;
    }
    
    if (trainingData.ai_writing_directives) {
      enhancedPrompt += `\nWRITING DIRECTIVES:\n${trainingData.ai_writing_directives}\n`;
    }
  }
  
  // Add knowledge base section
  if (knowledgeContent.length > 0) {
    enhancedPrompt += '\n\n=== KNOWLEDGE BASE CONTEXT ===\n';
    enhancedPrompt += 'The following reference materials are available for context:\n\n';
    
    knowledgeContent.forEach((file, index) => {
      enhancedPrompt += `\n[REFERENCE ${index + 1}: ${file.filename}]\n`;
      enhancedPrompt += `${file.content}\n`;
      enhancedPrompt += `[END REFERENCE ${index + 1}]\n`;
    });
    
    enhancedPrompt += '\nUse the information from these references to provide accurate, relevant responses.\n';
  }
  
  return enhancedPrompt;
}
```

---

### Step 4: Handle File Content Extraction (Advanced)

**File:** New: `src/lib/knowledge-extractor.js`

**Purpose:** Extract text from various file formats

**Supported Formats (Phase 1):**
- Plain text files (`.txt`, `.md`)
- JSON files (`.json`)
- CSV files (`.csv`)

**Future Formats (Phase 2):**
- PDF files (requires PDF parsing library)
- Word documents (requires DOCX parsing)
- Images with OCR (requires OCR service)

**Implementation:**
```javascript
// src/lib/knowledge-extractor.js
export async function extractTextFromFile(file) {
  const mimeType = file.mime_type || '';
  const fileName = file.filename || file.file_name || '';
  
  try {
    // Fetch file
    const response = await fetch(file.file_url);
    
    // Handle text-based files
    if (mimeType.includes('text/') || 
        mimeType === 'application/json' ||
        fileName.endsWith('.txt') ||
        fileName.endsWith('.md') ||
        fileName.endsWith('.json')) {
      return await response.text();
    }
    
    // Handle CSV
    if (mimeType === 'text/csv' || fileName.endsWith('.csv')) {
      return await response.text();
    }
    
    // TODO: Add PDF, DOCX extraction
    // For now, return empty string for unsupported formats
    console.warn(`Unsupported file type: ${mimeType} for ${fileName}`);
    return '';
  } catch (error) {
    console.error(`Error extracting text from ${fileName}:`, error);
    return '';
  }
}
```

---

### Step 5: Update Feedback Integration (Future)

**File:** `src/lib/agent-sdk.js` (Future enhancement)

**Purpose:** Use feedback to improve agent responses

**Approach:**
1. Fetch recent feedback for agent
2. Analyze feedback patterns
3. Generate prompt adjustments based on feedback
4. Include feedback insights in system prompt

**Implementation (Future):**
```javascript
// Future: Analyze feedback and adjust prompts
async getFeedbackInsights(agentName) {
  try {
    const feedback = await AgentFeedback.find(
      { agent_name: agentName },
      { 
        orderBy: { column: 'created_date', ascending: false },
        limit: 50
      }
    );
    
    // Analyze feedback patterns
    const lowRatings = feedback.filter(f => f.rating < 3);
    const commonIssues = this.analyzeFeedbackIssues(lowRatings);
    
    // Generate prompt adjustments
    if (commonIssues.length > 0) {
      return this.generatePromptAdjustments(commonIssues);
    }
    
    return '';
  } catch (error) {
    console.error('Error fetching feedback insights:', error);
    return '';
  }
}
```

---

## Implementation Checklist

### Phase 1: Core Integration (Priority 1)
- [ ] **Step 1.1**: Add `getClientTrainingData()` method to `agent-sdk.js`
- [ ] **Step 1.2**: Modify `sendMessage()` to fetch training data
- [ ] **Step 1.3**: Add `buildEnhancedSystemPrompt()` method
- [ ] **Step 1.4**: Test training data integration

### Phase 2: Knowledge Base Integration (Priority 2)
- [ ] **Step 2.1**: Add `getKnowledgeFilesForAgent()` method
- [ ] **Step 2.2**: Create `knowledge-extractor.js` utility
- [ ] **Step 2.3**: Add text extraction for `.txt`, `.md`, `.json` files
- [ ] **Step 2.4**: Integrate knowledge content into enhanced prompt
- [ ] **Step 2.5**: Test knowledge base integration

### Phase 3: Advanced File Support (Priority 3)
- [ ] **Step 3.1**: Add PDF extraction (using PDF.js or similar)
- [ ] **Step 3.2**: Add DOCX extraction (using mammoth.js or similar)
- [ ] **Step 3.3**: Add file content caching to reduce API calls
- [ ] **Step 3.4**: Add file size limits and chunking for large files

### Phase 4: Feedback Integration (Priority 4)
- [ ] **Step 4.1**: Add `getFeedbackInsights()` method
- [ ] **Step 4.2**: Implement feedback analysis logic
- [ ] **Step 4.3**: Generate prompt adjustments from feedback
- [ ] **Step 4.4**: Integrate feedback insights into enhanced prompt

### Phase 5: Backend Migration (Future)
- [ ] **Step 5.1**: Create `invoke-agent-llm` Supabase Edge Function
- [ ] **Step 5.2**: Move context building to backend
- [ ] **Step 5.3**: Implement server-side file content extraction
- [ ] **Step 5.4**: Update frontend to call new edge function
- [ ] **Step 5.5**: Add caching and optimization

---

## Technical Considerations

### 1. Token Limits
**Issue:** Adding training data and knowledge files increases token count  
**Solution:**
- Limit knowledge file content to first 5000 characters per file
- Prioritize most relevant files
- Implement intelligent truncation

### 2. Performance
**Issue:** Fetching training data and knowledge files on every message  
**Solution:**
- Cache training data (changes infrequently)
- Cache knowledge file content (with invalidation on update)
- Use React Query or similar for client-side caching

### 3. File Content Extraction
**Issue:** Extracting text from PDFs, DOCX requires libraries  
**Solution:**
- Phase 1: Support text-based files only
- Phase 2: Add PDF/DOCX extraction using browser-compatible libraries
- Phase 3: Move to server-side extraction in Edge Function

### 4. Security
**Issue:** File URLs may be public or require authentication  
**Solution:**
- Use Supabase signed URLs for private files
- Validate file access permissions
- Sanitize extracted content

### 5. Error Handling
**Issue:** File extraction or training data fetch may fail  
**Solution:**
- Graceful degradation: If training/knowledge fails, use base prompt only
- Log errors but don't break the flow
- Provide fallback behavior

---

## Testing Strategy

### Unit Tests
- Test `getClientTrainingData()` with various client configurations
- Test `getKnowledgeFilesForAgent()` with different agent assignments
- Test `buildEnhancedSystemPrompt()` with various inputs
- Test `extractTextFromFile()` with different file types

### Integration Tests
- Test full message flow with training data
- Test full message flow with knowledge files
- Test message flow with both training and knowledge
- Test error handling when data is missing

### Manual Tests
- Verify training data appears in agent responses
- Verify knowledge file content influences responses
- Verify system prompt enhancement works correctly
- Verify performance with large knowledge bases

---

## Migration Path from Base44

### Key Differences
1. **Base44**: Backend handled everything
2. **Current**: Frontend handles context building
3. **Future**: Backend Edge Function handles context building

### Migration Strategy
1. **Phase 1**: Implement frontend integration (matches Base44 behavior)
2. **Phase 2**: Optimize and add advanced features
3. **Phase 3**: Migrate to backend for better security/performance

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Training data (focus_keywords, ai_writing_directives) is included in all agent responses
- ✅ Agent responses reflect training directives
- ✅ System prompt is dynamically enhanced with training data

### Phase 2 Complete When:
- ✅ Knowledge base files are loaded and used as context
- ✅ Text-based files (`.txt`, `.md`, `.json`) are extracted and included
- ✅ Agent responses reference knowledge base content

### Phase 3 Complete When:
- ✅ PDF and DOCX files are supported
- ✅ Large files are handled efficiently
- ✅ File content is cached appropriately

### Phase 4 Complete When:
- ✅ Feedback influences agent improvements
- ✅ Common issues are automatically addressed
- ✅ Agent quality improves over time

---

## Next Steps

1. **Immediate**: Implement Phase 1 (Training Data Integration)
2. **Short-term**: Implement Phase 2 (Knowledge Base Integration)
3. **Medium-term**: Add advanced file support
4. **Long-term**: Migrate to backend Edge Function

---

**Created:** January 2025  
**Based on:** Base44 version mechanics  
**Target:** Supabase-based Perdia Education repo

