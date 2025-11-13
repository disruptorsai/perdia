# Reference App Analysis & Implementation Guide
**Date:** 2025-11-13
**Purpose:** Analyze the reference GetEducated Content Engine and replicate its features in Perdia

---

## 📋 Executive Summary

I've analyzed the complete reference app (GetEducated Content Engine). It has **three major features** that perfectly match the PRD you provided:

1. **✅ Article Generation Wizard** - Multi-step wizard with modular components
2. **✅ Article Review System** - Highlight-and-comment with AI revision
3. **✅ AI Training Dashboard** - Learn from editorial feedback

**Good News:** Your current Perdia app already has 60% of Feature #1 implemented! I'll show you exactly how to complete it and add Features #2 and #3.

---

## 🎯 Feature 1: Article Generation Wizard (Enhanced)

### Current Perdia Implementation

**File:** `src/components/wizard/ArticleGenerationWizard.jsx` (544 lines)

**What's Already Perfect:**
- ✅ 5-step wizard flow
- ✅ Topic selection from 4 sources
- ✅ Article type selection (5 types)
- ✅ Title generation with Claude Haiku
- ✅ Terminal-style progress indicator
- ✅ Success screen with navigation

### Reference App Improvements

**File:** `reference-app/src/pages/ArticleWizard.jsx` (629 lines)

**Key Enhancements:**

#### 1. **Modular Component Structure**

Reference app splits wizard into separate components:

```
src/pages/ArticleWizard.jsx (main orchestrator)
├── src/components/wizard/IdeaSelection.jsx
├── src/components/wizard/ContentTypeSelection.jsx
├── src/components/wizard/TitleSelection.jsx
├── src/components/wizard/DetailedProgressIndicator.jsx
└── src/components/wizard/GenerationSuccess.jsx
```

**Benefits:**
- Easier to maintain
- Reusable components
- Better code organization
- Easier testing

#### 2. **Enhanced Idea Selection**

**Reference app:** `IdeaSelection.jsx` (379 lines)

**Features:**
- Tabbed interface (Smart Suggestions | Custom Idea)
- Real-time news fetching via LLM
- Priority sorting
- Rich card design with badges
- Keyword inference from topic
- Target audience inference

**Key Code Patterns:**

```javascript
// Tabbed Interface
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="smart">Smart Suggestions</TabsTrigger>
    <TabsTrigger value="custom">Custom Idea</TabsTrigger>
  </TabsList>

  <TabsContent value="smart">
    {/* Smart suggestions from keywords, clusters, ideas, news */}
  </TabsContent>

  <TabsContent value="custom">
    {/* Custom input form */}
  </TabsContent>
</Tabs>

// News Fetching
const fetchNewsIdeas = async () => {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Find 5 trending, newsworthy topics...`,
    add_context_from_internet: true,
    response_json_schema: { ... }
  });
  // Returns: Breaking news ideas
};
```

**Perdia Equivalent:**
- Your `getAllSuggestions()` already does this
- Just need to add tabbed UI and custom idea form

#### 3. **Detailed Progress Indicator**

**Reference app:** `DetailedProgressIndicator.jsx` (168 lines)

**Features:**
- Auto-scrolling to latest step
- Color-coded messages (green=success, red=error, yellow=in-progress)
- Animated dots for current step
- Blinking cursor
- Info panel showing: Steps completed, Status, Quality indicator
- "What's Happening?" explanation card

**Key Code Patterns:**

```javascript
export default function DetailedProgressIndicator({ steps, isComplete }) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  return (
    <div ref={scrollRef} className="bg-gray-900 p-6 max-h-[600px] overflow-y-auto">
      {steps.map((step, index) => (
        <div className="mb-3 flex items-start gap-3">
          <span className="text-cyan-400">[{step.timestamp}]</span>
          <div className="flex-1">
            {/* Color-coded based on message content */}
            {step.message.includes('✓') ? (
              <span className="text-green-400">{step.message}</span>
            ) : step.message.includes('✗') ? (
              <span className="text-red-400">{step.message}</span>
            ) : (
              <span className="text-gray-300">{step.message}</span>
            )}
          </div>
          {/* Animated dots for current step */}
          {index === steps.length - 1 && !isComplete && <AnimatedDots />}
        </div>
      ))}

      {/* Blinking cursor */}
      {!isComplete && <motion.div animate={{ opacity: [1, 0] }} />}
    </div>
  );
}
```

**Perdia Equivalent:**
- Your progress indicator is already great!
- Just need to add: auto-scroll, color coding, info panel

#### 4. **Comprehensive Prompts**

**Reference app:** Lines 263-503 of `ArticleWizard.jsx`

The reference app has **highly detailed prompt templates** for each article type:

```javascript
const templates = {
  ranking: `...2000+ character prompt with specific instructions...`,
  career_guide: `...2500+ character prompt with step-by-step requirements...`,
  listicle: `...2000+ character prompt with BLS data requirements...`,
  guide: `...1500+ character prompt...`,
  faq: `...1500+ character prompt...`
};
```

**Key Elements in Each Prompt:**
- Exact structure requirements (H2 headings with IDs)
- BLS citation format with dates
- Internal linking requirements
- FAQ section requirements
- Word count targets
- JSON response schema
- GetEducated tone and style

**Perdia Equivalent:**
- Your `content-pipeline.js` uses Grok → Perplexity (better!)
- But you should add these detailed prompt templates to `grok-client.js`

#### 5. **Better Error Handling**

**Reference app:** Lines 246-260

```javascript
try {
  // Generation logic
} catch (error) {
  console.error('💥 Article Generation Error:', error);
  console.error('Error Stack:', error.stack);

  addStep(`✗ Error: ${error.message}`);
  addStep('Generation failed. Please try again...');

  // Keep user on progress screen to see errors
  setIsGenerating(false);

  // Show alert after delay
  setTimeout(() => {
    alert(`Article generation failed: ${error.message}\n\nPlease try again.`);
  }, 1000);
}
```

**Perdia Equivalent:**
- Your error handling is good
- Consider adding error display in progress UI instead of just toast

---

## 🎯 Feature 2: Article Review System (NEW)

### Reference App Implementation

**File:** `reference-app/src/pages/ArticleReview.jsx` (946 lines)

This is the **most important missing feature** in Perdia. Let me break it down completely:

### Core Features

#### 1. **Text Selection with Floating Button**

**How it works:**
1. User highlights any text in article
2. Floating button appears near selection
3. User clicks button
4. Comment dialog opens with selected text pre-filled

**Code Pattern:**

```javascript
const [selectedText, setSelectedText] = useState('');
const [floatingButtonPos, setFloatingButtonPos] = useState({ x: 0, y: 0, show: false });

useEffect(() => {
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text.length > 0 && articleContentRef.current?.contains(selection.anchorNode)) {
      setSelectedText(text);

      // Get selection position
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Position button near the selection
      setFloatingButtonPos({
        x: rect.right + 10,
        y: rect.top + window.scrollY,
        show: true
      });
    } else {
      setSelectedText('');
      setFloatingButtonPos({ x: 0, y: 0, show: false });
    }
  };

  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('selectionchange', handleTextSelection);

  return () => {
    document.removeEventListener('mouseup', handleTextSelection);
    document.removeEventListener('selectionchange', handleTextSelection);
  };
}, []);
```

**Floating Button UI:**

```javascript
<AnimatePresence>
  {floatingButtonPos.show && (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{
        position: 'absolute',
        left: floatingButtonPos.x,
        top: floatingButtonPos.y,
        zIndex: 1000
      }}
    >
      <Button onClick={handleComment}>
        <MessageSquare className="w-4 h-4" />
        Add Comment
      </Button>
    </motion.div>
  )}
</AnimatePresence>
```

#### 2. **Comment Dialog**

**Features:**
- Shows selected text in blue box
- Category dropdown (8 options: accuracy, tone, structure, seo, compliance, grammar, style, formatting)
- Severity dropdown (4 options: minor, moderate, major, critical)
- Comment textarea
- Submit button

**Code Pattern:**

```javascript
<Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add Comment</DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      {/* Selected Text Display */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm font-medium text-blue-900">Selected Text:</p>
        <p className="text-sm text-blue-700 italic">"{selectedText}"</p>
      </div>

      {/* Category Select */}
      <Select
        value={commentData.category}
        onValueChange={(value) => setCommentData({ ...commentData, category: value })}
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="accuracy">Accuracy</SelectItem>
          <SelectItem value="tone">Tone</SelectItem>
          <SelectItem value="structure">Structure</SelectItem>
          <SelectItem value="seo">SEO</SelectItem>
          <SelectItem value="compliance">Compliance</SelectItem>
          <SelectItem value="grammar">Grammar</SelectItem>
          <SelectItem value="style">Style</SelectItem>
          <SelectItem value="formatting">Formatting</SelectItem>
        </SelectContent>
      </Select>

      {/* Severity Select */}
      <Select
        value={commentData.severity}
        onValueChange={(value) => setCommentData({ ...commentData, severity: value })}
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="minor">Minor</SelectItem>
          <SelectItem value="moderate">Moderate</SelectItem>
          <SelectItem value="major">Major</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
        </SelectContent>
      </Select>

      {/* Comment Textarea */}
      <Textarea
        placeholder="Explain what needs to be changed..."
        value={commentData.comment}
        onChange={(e) => setCommentData({ ...commentData, comment: e.target.value })}
        rows={4}
      />

      {/* Submit Button */}
      <Button onClick={handleSubmitComment}>
        <Send className="w-4 h-4" />
        Submit Comment
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

#### 3. **AI Revision**

**How it works:**
1. User adds multiple comments
2. User clicks "AI Revise (X)" button
3. Loading overlay appears with status messages
4. AI processes all feedback and revises article
5. Creates TrainingData record for learning
6. Updates article content
7. Marks all revisions as "addressed"

**Code Pattern:**

```javascript
const reviseArticleMutation = useMutation({
  mutationFn: async () => {
    setRevisionStatus('Analyzing feedback...');

    // Gather all feedback
    const feedbackItems = revisions.map(r => ({
      selected_text: r.selected_text,
      comment: r.comment,
      category: r.category,
      severity: r.severity
    }));

    setRevisionStatus('Building revision prompt...');

    // Build comprehensive prompt
    const prompt = `You are revising an article based on editorial feedback.

ORIGINAL ARTICLE:
${article.content}

EDITORIAL FEEDBACK (${revisions.length} comments):
${revisions.map((r, i) => `
${i + 1}. [${r.category.toUpperCase()} - ${r.severity}]
   Selected Text: "${r.selected_text}"
   Feedback: ${r.comment}
`).join('\n')}

INSTRUCTIONS:
1. Address EVERY piece of feedback
2. Maintain professional tone
3. Keep all H2 headings and citations
4. Ensure 1500-2500 word count
5. Return revised content in HTML`;

    setRevisionStatus('Generating revised article...');

    // Call LLM
    const result = await InvokeLLM({ prompt, ... });

    setRevisionStatus('Creating training data...');

    // Create TrainingData for AI learning
    await TrainingData.create({
      article_id: articleId,
      article_title: article.title,
      content_type: article.type,
      original_content: article.content,
      revised_content: result,
      feedback_items: feedbackItems,
      pattern_type: getMostCommonCategory(revisions),
      lesson_learned: `Revised based on ${revisions.length} comments focusing on ${getMostCommonCategory(revisions)}`,
      status: 'pending_review',
      impact_score: calculateImpactScore(revisions)
    });

    setRevisionStatus('Saving revised article...');

    // Update article
    await Article.update(articleId, {
      content: result,
      status: 'in_review'
    });

    // Mark all revisions as addressed
    await Promise.all(
      revisions.map(r =>
        ArticleRevision.update(r.id, { status: 'addressed' })
      )
    );

    return result;
  },
  onSuccess: () => {
    queryClient.invalidateQueries();
    setIsRevising(false);
  }
});
```

**Loading Overlay:**

```javascript
<AnimatePresence>
  {isRevising && (
    <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <motion.div className="bg-white rounded-2xl p-8 max-w-md">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
          <h3 className="text-2xl font-bold">AI Revising Article</h3>
          <p className="text-blue-600 font-medium">{revisionStatus}</p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>✓ Analyzing {revisions.length} editorial comments</p>
            <p>✓ Preserving structure and citations</p>
            <p>✓ Creating training data for AI learning</p>
          </div>
          <p className="text-xs text-gray-500">This takes 30-60 seconds...</p>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

#### 4. **GetEducated-Style Article Preview**

**Features:**
- Blue gradient header with title and excerpt
- Professional typography (Georgia serif for body, sans-serif for headings)
- Styled H2 headings with borders
- Proper link styling
- Table styling
- Blockquote styling
- Code block styling
- Image styling
- Article footer with metadata

**Code Pattern:**

Reference app has **829 lines of CSS** (lines 580-829) for perfect article styling!

```javascript
<style>{`
  .article-content {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 18px;
    line-height: 1.8;
    color: #1f2937;
  }

  .article-content h2 {
    font-size: 32px;
    font-weight: 700;
    margin-top: 48px;
    margin-bottom: 24px;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 12px;
  }

  .article-content a {
    color: #2563eb;
    border-bottom: 1px solid #93c5fd;
    transition: all 0.2s;
  }

  /* ... 800+ more lines of styling ... */
`}</style>

<div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }} />
```

**Header:**

```javascript
<div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
  <div className="max-w-4xl">
    <div className="flex items-center gap-2 mb-4">
      <span className="text-blue-200 text-sm uppercase">
        {article.type.replace(/_/g, ' ')}
      </span>
      <span className="text-blue-300">•</span>
      <span className="text-blue-200 text-sm">
        {new Date(article.created_date).toLocaleDateString()}
      </span>
    </div>
    <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
      {article.title}
    </h1>
    {article.excerpt && (
      <p className="text-xl text-blue-100 leading-relaxed">
        {article.excerpt}
      </p>
    )}
  </div>
</div>
```

#### 5. **Comments Sidebar**

**Features:**
- Shows all pending comments
- Color-coded severity badges
- Selected text preview
- Category and severity labels
- Empty state with helpful instructions

**Code Pattern:**

```javascript
<Card>
  <CardHeader>
    <CardTitle>Comments ({revisions.length})</CardTitle>
  </CardHeader>
  <CardContent>
    {revisions.length === 0 ? (
      <div className="text-center py-8">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm font-medium">No comments yet</p>
        <p className="text-xs mt-2">💡 Highlight any text in the article</p>
        <p className="text-xs text-blue-600 mt-1">A floating button will appear!</p>
      </div>
    ) : (
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {revisions.map((revision) => (
          <div key={revision.id} className="p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-start justify-between gap-2 mb-2">
              <Badge variant="outline">{revision.category}</Badge>
              <Badge className={severityColors[revision.severity]}>
                {revision.severity}
              </Badge>
            </div>
            <p className="text-xs text-gray-600 italic mb-2 border-l-2 pl-2">
              "{revision.selected_text.substring(0, 100)}..."
            </p>
            <p className="text-sm text-gray-900">{revision.comment}</p>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(revision.created_date).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    )}
  </CardContent>
</Card>
```

#### 6. **View Mode Toggle**

**Features:**
- Switch between "Preview" and "HTML Source"
- Preview shows styled article
- HTML shows raw code in terminal

**Code Pattern:**

```javascript
const [viewMode, setViewMode] = useState('preview');

<div className="flex gap-1">
  <Button
    variant={viewMode === 'preview' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setViewMode('preview')}
  >
    <Eye className="w-3 h-3" />
    Preview
  </Button>
  <Button
    variant={viewMode === 'html' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setViewMode('html')}
  >
    <Code className="w-3 h-3" />
    HTML
  </Button>
</div>

{/* Conditional rendering */}
{viewMode === 'preview' ? (
  <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }} />
) : (
  <div className="bg-gray-900 rounded-lg p-6">
    <pre className="text-sm text-green-400 font-mono">
      {article.content}
    </pre>
  </div>
)}
```

---

## 🎯 Feature 3: AI Training Dashboard (NEW)

### Reference App Implementation

**File:** `reference-app/src/pages/AITraining.jsx` (525 lines)

This is the **AI feedback loop** - the system that learns from editorial feedback.

### Core Features

#### 1. **Training Data Overview**

**Stats Cards:**
- Total Training Data
- Pending Review
- Applied to System
- Average Impact Score

**Code Pattern:**

```javascript
const { data: trainingData = [] } = useQuery({
  queryKey: ['training-data'],
  queryFn: () => TrainingData.find({}, { orderBy: { column: 'created_date', ascending: false } })
});

const pendingData = trainingData.filter(t => t.status === 'pending_review' || t.status === 'approved');
const appliedData = trainingData.filter(t => t.status === 'applied');

<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <Card>
    <div className="flex items-center gap-3">
      <Brain className="w-5 h-5 text-purple-600" />
      <div>
        <p className="text-sm text-gray-500">Total Training Data</p>
        <p className="text-2xl font-bold">{trainingData.length}</p>
      </div>
    </div>
  </Card>

  <Card>
    <div className="flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-amber-600" />
      <div>
        <p className="text-sm text-gray-500">Pending Review</p>
        <p className="text-2xl font-bold">{pendingData.length}</p>
      </div>
    </div>
  </Card>

  {/* ... more cards ... */}
</div>
```

#### 2. **Apply Training Button**

**How it works:**
1. Button shows count of pending training data
2. User clicks button
3. Confirmation dialog appears
4. Training process begins with overlay
5. AI analyzes all feedback patterns
6. System prompts are updated
7. Training data marked as applied

**Code Pattern:**

```javascript
const applyTrainingMutation = useMutation({
  mutationFn: async () => {
    setTrainingStatus('Analyzing all training data...');

    const pendingData = trainingData.filter(t =>
      t.status === 'pending_review' || t.status === 'approved'
    );

    setTrainingStatus(`Processing ${pendingData.length} training examples...`);

    // Aggregate feedback patterns
    const allFeedback = pendingData.flatMap(t => t.feedback_items || []);
    const categoryBreakdown = {};
    const severityBreakdown = {};

    allFeedback.forEach(item => {
      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
      severityBreakdown[item.severity] = (severityBreakdown[item.severity] || 0) + 1;
    });

    setTrainingStatus('Generating improved system prompts...');

    // Call LLM to analyze patterns
    const trainingPrompt = `You are analyzing editorial feedback to improve the AI system.

TRAINING DATA SUMMARY:
- Total revisions: ${pendingData.length}
- Total feedback items: ${allFeedback.length}

FEEDBACK BY CATEGORY:
${Object.entries(categoryBreakdown).map(([cat, count]) =>
  `- ${cat}: ${count} instances (${Math.round(count/allFeedback.length*100)}%)`
).join('\n')}

DETAILED FEEDBACK EXAMPLES:
${pendingData.slice(0, 10).map((t, i) => `
Example ${i + 1}: ${t.article_title}
Content Type: ${t.content_type}
Lesson: ${t.lesson_learned}
Key Feedback:
${(t.feedback_items || []).slice(0, 3).map((f, j) =>
  `  ${j + 1}. [${f.category}] ${f.comment}`
).join('\n')}
`).join('\n')}

YOUR TASK:
Generate specific, actionable improvements to system prompts.

Return JSON:
{
  "ranking_prompt_additions": "...",
  "career_guide_prompt_additions": "...",
  "general_guidelines": "...",
  "tone_adjustments": "...",
  "structure_improvements": "...",
  "compliance_rules": "...",
  "quality_checklist": ["item1", "item2"],
  "implementation_summary": "..."
}`;

    const improvements = await InvokeLLM({
      prompt: trainingPrompt,
      response_json_schema: { ... }
    });

    setTrainingStatus('Updating system prompts...');

    // Save improvements to system settings
    await SystemSetting.create({
      setting_key: `ai_training_applied_${timestamp}`,
      setting_value: JSON.stringify(improvements),
      setting_type: 'ai',
      description: `AI training applied on ${new Date().toLocaleDateString()}`
    });

    setTrainingStatus('Marking training data as applied...');

    // Mark all as applied
    await Promise.all(
      pendingData.map(t =>
        TrainingData.update(t.id, {
          status: 'applied',
          applied_to_system: true
        })
      )
    );

    return improvements;
  },
  onSuccess: (improvements) => {
    alert(`✨ AI Training Complete!\n\n${improvements.implementation_summary}`);
  }
});
```

#### 3. **Tabbed Interface**

**Three tabs:**
1. **Pending** - Training data waiting to be applied
2. **Applied** - Training data already used
3. **Insights** - Statistics and pattern distribution

**Code Pattern:**

```javascript
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="pending">Pending ({pendingData.length})</TabsTrigger>
    <TabsTrigger value="applied">Applied ({appliedData.length})</TabsTrigger>
    <TabsTrigger value="insights">Insights</TabsTrigger>
  </TabsList>

  <TabsContent value="pending">
    {/* List of pending training data cards */}
  </TabsContent>

  <TabsContent value="applied">
    {/* List of applied training data cards */}
  </TabsContent>

  <TabsContent value="insights">
    {/* Pattern distribution and statistics */}
  </TabsContent>
</Tabs>
```

#### 4. **Training Data Cards**

**Features:**
- Article title
- Pattern type badge (color-coded)
- Content type badge
- Impact score
- Feedback item count
- Lesson learned display
- Top 3 feedback items preview

**Code Pattern:**

```javascript
{pendingData.map((item, index) => (
  <Card key={item.id}>
    <CardContent className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg">{item.article_title}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={patternColors[item.pattern_type]}>
              {item.pattern_type?.replace(/_/g, ' ')}
            </Badge>
            <Badge variant="outline">{item.content_type}</Badge>
            <Badge variant="outline">Impact: {item.impact_score}/10</Badge>
            <Badge variant="outline">{item.feedback_items?.length || 0} feedback items</Badge>
          </div>
        </div>
      </div>

      {/* Lesson Learned */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
        <p className="text-sm font-medium text-blue-900">Lesson Learned:</p>
        <p className="text-sm text-blue-700">{item.lesson_learned}</p>
      </div>

      {/* Key Feedback */}
      {item.feedback_items && item.feedback_items.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Key Feedback:</p>
          {item.feedback_items.slice(0, 3).map((feedback, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded border text-sm">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">{feedback.category}</Badge>
                <Badge variant="outline" className="text-xs">{feedback.severity}</Badge>
              </div>
              <p className="text-gray-700">{feedback.comment}</p>
            </div>
          ))}
          {item.feedback_items.length > 3 && (
            <p className="text-xs text-gray-500 text-center">
              +{item.feedback_items.length - 3} more feedback items
            </p>
          )}
        </div>
      )}
    </CardContent>
  </Card>
))}
```

#### 5. **Pattern Distribution (Insights Tab)**

**Features:**
- Grid showing all pattern types
- Count for each pattern
- Color-coded badges
- System improvement stats

**Code Pattern:**

```javascript
<div>
  <h3 className="font-semibold mb-3">Pattern Distribution</h3>
  <div className="grid grid-cols-2 gap-3">
    {Object.entries(
      trainingData.reduce((acc, t) => {
        acc[t.pattern_type] = (acc[t.pattern_type] || 0) + 1;
        return acc;
      }, {})
    ).map(([pattern, count]) => (
      <div key={pattern} className="p-3 bg-gray-50 rounded-lg">
        <Badge className={patternColors[pattern]}>
          {pattern.replace(/_/g, ' ')}
        </Badge>
        <p className="text-2xl font-bold text-gray-900">{count}</p>
      </div>
    ))}
  </div>
</div>
```

---

## 📊 Database Schema Requirements

### New Tables Needed

#### 1. `article_revisions`

```sql
CREATE TABLE article_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES content_queue(id) ON DELETE CASCADE,
  revision_type TEXT CHECK(revision_type IN ('comment', 'revision_request', 'approval', 'rejection')),
  selected_text TEXT,
  comment TEXT,
  section TEXT,
  position INTEGER,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'addressed', 'ignored')),
  reviewer_email TEXT,
  severity TEXT CHECK(severity IN ('minor', 'moderate', 'major', 'critical')),
  category TEXT CHECK(category IN ('accuracy', 'tone', 'structure', 'seo', 'compliance', 'grammar', 'style', 'formatting')),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- RLS policies
ALTER TABLE article_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own revisions" ON article_revisions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create revisions" ON article_revisions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own revisions" ON article_revisions
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_article_revisions_article_id ON article_revisions(article_id);
CREATE INDEX idx_article_revisions_status ON article_revisions(status);
CREATE INDEX idx_article_revisions_created_date ON article_revisions(created_date DESC);

-- Trigger for updated_date
CREATE TRIGGER update_article_revisions_updated_date
  BEFORE UPDATE ON article_revisions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date_column();
```

#### 2. `training_data`

```sql
CREATE TABLE training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES content_queue(id) ON DELETE CASCADE,
  article_title TEXT,
  content_type TEXT,
  original_content TEXT,
  revised_content TEXT,
  feedback_items JSONB,
  pattern_type TEXT,
  lesson_learned TEXT,
  applied_to_system BOOLEAN DEFAULT FALSE,
  impact_score INTEGER DEFAULT 5 CHECK(impact_score >= 1 AND impact_score <= 10),
  status TEXT DEFAULT 'pending_review' CHECK(status IN ('pending_review', 'approved', 'applied', 'archived')),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- RLS policies
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own training data" ON training_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create training data" ON training_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training data" ON training_data
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_training_data_article_id ON training_data(article_id);
CREATE INDEX idx_training_data_status ON training_data(status);
CREATE INDEX idx_training_data_pattern_type ON training_data(pattern_type);
CREATE INDEX idx_training_data_created_date ON training_data(created_date DESC);

-- Trigger for updated_date
CREATE TRIGGER update_training_data_updated_date
  BEFORE UPDATE ON training_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date_column();
```

#### 3. `system_settings` (optional - for storing AI improvements)

```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT, -- JSON string for complex values
  setting_type TEXT CHECK(setting_type IN ('workflow', 'quality', 'throughput', 'integration', 'ai', 'other')),
  description TEXT,
  editable_by TEXT DEFAULT 'admin' CHECK(editable_by IN ('admin', 'editor', 'system')),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" ON system_settings
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify settings" ON system_settings
  FOR ALL USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

-- Indexes
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX idx_system_settings_type ON system_settings(setting_type);

-- Trigger for updated_date
CREATE TRIGGER update_system_settings_updated_date
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_date_column();
```

---

## 🚀 Implementation Roadmap

### Phase 1: Database Setup (1 hour)

**Priority:** HIGH
**Effort:** 1 hour

**Tasks:**
1. Create migration file: `supabase/migrations/20251113000001_add_review_and_training.sql`
2. Add tables: `article_revisions`, `training_data`, `system_settings`
3. Add RLS policies
4. Add indexes
5. Test migration locally
6. Apply to production

**Deliverable:**
- ✅ Database schema ready for review and training features

---

### Phase 2: SDK Entities (30 minutes)

**Priority:** HIGH
**Effort:** 30 minutes

**Tasks:**
1. Add `ArticleRevision` entity to `src/lib/perdia-sdk.js`
2. Add `TrainingData` entity
3. Add `SystemSetting` entity
4. Export all entities

**Code to Add:**

```javascript
// Add to src/lib/perdia-sdk.js

/**
 * ArticleRevision entity - Editorial comments and feedback
 */
export const ArticleRevision = {
  tableName: 'article_revisions',

  async find(filter = {}, options = {}) {
    let query = supabase.from(this.tableName).select('*');

    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return data || [];
  },

  async create(data) {
    const user = await getCurrentUser();
    const { data: created, error } = await supabase
      .from(this.tableName)
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return created;
  },

  async update(id, data) {
    const { data: updated, error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  async delete(id) {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};

/**
 * TrainingData entity - AI learning from editorial feedback
 */
export const TrainingData = {
  tableName: 'training_data',

  async find(filter = {}, options = {}) {
    let query = supabase.from(this.tableName).select('*');

    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  },

  async create(data) {
    const user = await getCurrentUser();
    const { data: created, error } = await supabase
      .from(this.tableName)
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return created;
  },

  async update(id, data) {
    const { data: updated, error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  }
};

/**
 * SystemSetting entity - System configuration
 */
export const SystemSetting = {
  tableName: 'system_settings',

  async find(filter = {}, options = {}) {
    let query = supabase.from(this.tableName).select('*');

    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  },

  async create(data) {
    const { data: created, error } = await supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return created;
  },

  async get(key) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('setting_key', key)
      .single();

    if (error) return null;
    return data;
  },

  async set(key, value, type = 'other', description = '') {
    const existing = await this.get(key);

    if (existing) {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({ setting_value: value, setting_type: type, description })
        .eq('setting_key', key)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      return this.create({
        setting_key: key,
        setting_value: value,
        setting_type: type,
        description
      });
    }
  }
};
```

**Deliverable:**
- ✅ SDK entities ready for use in React components

---

### Phase 3: Article Review Page (4-6 hours)

**Priority:** HIGH
**Effort:** 4-6 hours

**Tasks:**
1. Create `src/pages/ArticleReview.jsx` (new file)
2. Implement text selection handler
3. Implement floating button
4. Implement comment dialog
5. Implement comments sidebar
6. Implement AI revision
7. Implement GetEducated styling
8. Add route to `src/pages/Pages.jsx`

**File to Create:** `src/pages/ArticleReview.jsx`

**Pseudo-code:**
```javascript
// 1. State management
const [selectedText, setSelectedText] = useState('');
const [floatingButtonPos, setFloatingButtonPos] = useState({});
const [showCommentDialog, setShowCommentDialog] = useState(false);
const [commentData, setCommentData] = useState({});
const [isRevising, setIsRevising] = useState(false);

// 2. Load article and revisions
const { data: article } = useQuery({
  queryKey: ['article', articleId],
  queryFn: () => ContentQueue.find({ id: articleId }).then(r => r[0])
});

const { data: revisions = [] } = useQuery({
  queryKey: ['revisions', articleId],
  queryFn: () => ArticleRevision.find({ article_id: articleId, status: 'pending' })
});

// 3. Text selection handler (reference app lines 71-102)
useEffect(() => {
  const handleTextSelection = () => {
    // Get selection
    // Calculate position
    // Show floating button
  };

  document.addEventListener('mouseup', handleTextSelection);
  return () => document.removeEventListener('mouseup', handleTextSelection);
}, []);

// 4. Comment submission
const handleSubmitComment = async () => {
  await ArticleRevision.create({
    article_id: articleId,
    selected_text: selectedText,
    comment: commentData.comment,
    category: commentData.category,
    severity: commentData.severity,
    revision_type: 'comment',
    status: 'pending'
  });

  // Refresh revisions
  queryClient.invalidateQueries(['revisions']);
};

// 5. AI Revision
const handleAIRevise = async () => {
  setIsRevising(true);

  // Build feedback prompt
  const feedbackItems = revisions.map(r => ({
    selected_text: r.selected_text,
    comment: r.comment,
    category: r.category,
    severity: r.severity
  }));

  const feedback = feedbackItems.map((f, i) =>
    `${i + 1}. [${f.category.toUpperCase()} - ${f.severity}]\n   Text: "${f.selected_text}"\n   Feedback: ${f.comment}`
  ).join('\n\n');

  // Call regenerateWithFeedback
  const result = await regenerateWithFeedback(
    article.body,
    feedback,
    article.title,
    { onProgress: (p) => console.log(p.message) }
  );

  // Create TrainingData
  await TrainingData.create({
    article_id: articleId,
    article_title: article.title,
    content_type: article.type,
    original_content: article.body,
    revised_content: result.body,
    feedback_items: feedbackItems,
    pattern_type: getMostCommonCategory(revisions),
    lesson_learned: `Revised based on ${revisions.length} comments`,
    status: 'pending_review',
    impact_score: calculateImpactScore(revisions)
  });

  // Update article
  await ContentQueue.update(articleId, {
    body: result.body,
    word_count: result.word_count
  });

  // Mark revisions as addressed
  await Promise.all(
    revisions.map(r => ArticleRevision.update(r.id, { status: 'addressed' }))
  );

  setIsRevising(false);
};

// 6. Render
return (
  <div>
    {/* Floating Button */}
    <AnimatePresence>
      {floatingButtonPos.show && (
        <motion.div style={{ position: 'absolute', ... }}>
          <Button onClick={handleComment}>Add Comment</Button>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Comment Dialog */}
    <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
      {/* Category, Severity, Comment fields */}
    </Dialog>

    {/* Loading Overlay */}
    <AnimatePresence>
      {isRevising && <RevisionOverlay status={revisionStatus} />}
    </AnimatePresence>

    {/* Main Content */}
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Article Preview (2 columns) */}
      <div className="lg:col-span-2">
        <Card>
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
            <h1>{article.title}</h1>
            <p>{article.excerpt}</p>
          </div>

          {/* Article Body */}
          <style>{/* GetEducated CSS from reference app */}</style>
          <div
            ref={articleContentRef}
            className="article-content"
            dangerouslySetInnerHTML={{ __html: article.body }}
          />
        </Card>
      </div>

      {/* Comments Sidebar (1 column) */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Comments ({revisions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {revisions.map(revision => (
              <div key={revision.id} className="p-3 bg-gray-50 rounded-lg mb-3">
                <Badge>{revision.category}</Badge>
                <Badge className={severityColors[revision.severity]}>
                  {revision.severity}
                </Badge>
                <p className="text-xs italic">"{revision.selected_text.substring(0, 100)}..."</p>
                <p className="text-sm">{revision.comment}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);
```

**Deliverable:**
- ✅ Full article review page with highlight-and-comment
- ✅ AI revision integration
- ✅ TrainingData creation

---

### Phase 4: AI Training Dashboard (3-4 hours)

**Priority:** MEDIUM
**Effort:** 3-4 hours

**Tasks:**
1. Create `src/pages/AITraining.jsx` (new file)
2. Implement stats cards
3. Implement "Apply Training" button
4. Implement training overlay
5. Implement tabbed interface (Pending | Applied | Insights)
6. Implement training data cards
7. Implement pattern distribution
8. Add route

**File to Create:** `src/pages/AITraining.jsx`

**Pseudo-code:**
```javascript
// 1. Load training data
const { data: trainingData = [] } = useQuery({
  queryKey: ['training-data'],
  queryFn: () => TrainingData.find({}, { orderBy: { column: 'created_date', ascending: false } })
});

const pendingData = trainingData.filter(t => t.status === 'pending_review' || t.status === 'approved');
const appliedData = trainingData.filter(t => t.status === 'applied');

// 2. Apply training mutation
const applyTrainingMutation = useMutation({
  mutationFn: async () => {
    // Aggregate feedback patterns
    const allFeedback = pendingData.flatMap(t => t.feedback_items || []);

    // Build training prompt
    const trainingPrompt = `Analyze ${allFeedback.length} feedback items...`;

    // Call LLM
    const improvements = await InvokeLLM({
      prompt: trainingPrompt,
      provider: 'claude',
      model: 'claude-sonnet-4-5-20250929',
      response_json_schema: { ... }
    });

    // Save to system settings
    await SystemSetting.create({
      setting_key: `ai_training_applied_${Date.now()}`,
      setting_value: JSON.stringify(improvements),
      setting_type: 'ai'
    });

    // Mark all as applied
    await Promise.all(
      pendingData.map(t => TrainingData.update(t.id, { status: 'applied', applied_to_system: true }))
    );

    return improvements;
  }
});

// 3. Render
return (
  <div>
    {/* Stats Cards */}
    <div className="grid grid-cols-4 gap-4">
      <Card><Brain /> Total: {trainingData.length}</Card>
      <Card><AlertCircle /> Pending: {pendingData.length}</Card>
      <Card><CheckCircle2 /> Applied: {appliedData.length}</Card>
      <Card><TrendingUp /> Avg Impact: {avgImpact}</Card>
    </div>

    {/* Apply Training Button */}
    <Button onClick={() => applyTrainingMutation.mutate()}>
      <Zap /> Apply Training ({pendingData.length})
    </Button>

    {/* Tabs */}
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="pending">Pending ({pendingData.length})</TabsTrigger>
        <TabsTrigger value="applied">Applied ({appliedData.length})</TabsTrigger>
        <TabsTrigger value="insights">Insights</TabsTrigger>
      </TabsList>

      <TabsContent value="pending">
        {pendingData.map(item => (
          <Card key={item.id}>
            <h3>{item.article_title}</h3>
            <Badge>{item.pattern_type}</Badge>
            <p>Lesson: {item.lesson_learned}</p>
            {item.feedback_items.map(f => (
              <div>
                <Badge>{f.category}</Badge>
                <Badge>{f.severity}</Badge>
                <p>{f.comment}</p>
              </div>
            ))}
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="applied">
        {/* Applied data cards */}
      </TabsContent>

      <TabsContent value="insights">
        {/* Pattern distribution */}
      </TabsContent>
    </Tabs>
  </div>
);
```

**Deliverable:**
- ✅ AI Training dashboard
- ✅ Pattern analysis
- ✅ System improvement tracking

---

### Phase 5: Enhanced Wizard (Optional - 2-3 hours)

**Priority:** LOW (Optional Enhancement)
**Effort:** 2-3 hours

**Tasks:**
1. Split wizard into modular components
2. Add tabbed interface to IdeaSelection
3. Add custom idea form
4. Enhance progress indicator
5. Add "What's Happening?" info panel

**Deliverable:**
- ✅ Modular wizard components
- ✅ Better UX

---

## 📝 Complete Implementation Checklist

### ✅ Phase 1: Database Setup
- [ ] Create migration file
- [ ] Add `article_revisions` table
- [ ] Add `training_data` table
- [ ] Add `system_settings` table
- [ ] Add RLS policies
- [ ] Add indexes
- [ ] Test migration locally
- [ ] Apply to production

### ✅ Phase 2: SDK Entities
- [ ] Add `ArticleRevision` entity to SDK
- [ ] Add `TrainingData` entity to SDK
- [ ] Add `SystemSetting` entity to SDK
- [ ] Export all entities
- [ ] Test CRUD operations

### ✅ Phase 3: Article Review Page
- [ ] Create `ArticleReview.jsx`
- [ ] Implement text selection handler
- [ ] Implement floating button
- [ ] Implement comment dialog
- [ ] Implement comments sidebar
- [ ] Implement AI revision
- [ ] Add GetEducated styling (829 lines of CSS)
- [ ] Add view mode toggle (Preview | HTML)
- [ ] Add route to `Pages.jsx`
- [ ] Test complete flow

### ✅ Phase 4: AI Training Dashboard
- [ ] Create `AITraining.jsx`
- [ ] Add stats cards
- [ ] Add "Apply Training" button
- [ ] Add training overlay
- [ ] Add tabbed interface
- [ ] Add training data cards
- [ ] Add pattern distribution
- [ ] Add route to `Pages.jsx`
- [ ] Test apply training flow

### ✅ Phase 5: Enhanced Wizard (Optional)
- [ ] Split wizard into components
- [ ] Create `IdeaSelection.jsx`
- [ ] Create `ContentTypeSelection.jsx`
- [ ] Create `TitleSelection.jsx`
- [ ] Create `DetailedProgressIndicator.jsx`
- [ ] Create `GenerationSuccess.jsx`
- [ ] Add tabbed interface to IdeaSelection
- [ ] Add custom idea form
- [ ] Test complete wizard flow

---

## 🎯 Success Metrics

**After implementation, you'll have:**

1. **Complete PRD Match** (100%)
   - ✅ Article generation wizard
   - ✅ Zero-typing UX
   - ✅ Highlight-and-comment review
   - ✅ AI revision
   - ✅ AI training feedback loop

2. **User Experience**
   - <5 clicks to generate article
   - <30 seconds to add comment
   - <60 seconds for AI revision
   - Real-time progress visualization

3. **AI Improvement Loop**
   - Automatic training data capture
   - Pattern analysis
   - System prompt updates
   - Continuous quality improvement

---

## 🚀 Next Steps

**Ready to implement?** Here's what I recommend:

**Option 1: Full Implementation (12-16 hours)**
- Implement all 5 phases
- Complete PRD alignment
- Launch with all features

**Option 2: MVP First (6-8 hours)**
- Phase 1: Database
- Phase 2: SDK
- Phase 3: Article Review
- Launch and gather feedback
- Add Phase 4 later

**Option 3: Start Now**
- I can implement Phase 1 (Database) right now (1 hour)
- Show you the migration file
- Apply to production
- Then move to Phase 2

**Which option would you like?** 🚀
