# Base44 Patterns - Implementation Checklist for Perdia

## Component Checklist

### Step 1: Article Wizard Foundation
- [ ] IdeaSelection component
  - [ ] Keywords suggestion
  - [ ] Cluster suggestions
  - [ ] Trending ideas
  - [ ] Break news (LLM + internet)
  - [ ] Custom idea tab with form
  - [ ] Select Idea button triggers step 2

- [ ] ContentTypeSelection component
  - [ ] 5 content type cards
  - [ ] Structure, word count, best for info
  - [ ] Selected topic summary at top
  - [ ] Select Type button triggers step 3

- [ ] TitleSelection component
  - [ ] LLM title generation (5 options)
  - [ ] Display SEO rationale and difficulty
  - [ ] Custom title option
  - [ ] Select Title triggers generation

- [ ] DetailedProgressIndicator
  - [ ] 20+ step progress messages
  - [ ] Timed delays between steps
  - [ ] Full-screen modal during generation
  - [ ] Real LLM invocation with JSON schema

- [ ] GenerationSuccess
  - [ ] Article preview
  - [ ] Stats display

### Step 2: Article Review System
- [ ] ArticleReview page
  - [ ] Load article by ID from URL
  - [ ] Render article in GetEducated style
  - [ ] Preview mode (styled HTML)
  - [ ] HTML source mode
  - [ ] Text selection detection
  - [ ] Floating comment button

- [ ] Comment Dialog
  - [ ] Display selected text
  - [ ] Category dropdown (8 options)
  - [ ] Severity dropdown (4 options)
  - [ ] Feedback textarea
  - [ ] Submit creates ArticleRevision record

- [ ] Comments Sidebar
  - [ ] List all comments for article
  - [ ] Show selected text, category, severity
  - [ ] Display feedback text
  - [ ] Delete button

- [ ] AI Revise Feature
  - [ ] Button enabled only if comments exist
  - [ ] Full-screen modal during revision
  - [ ] Status messages
  - [ ] Revision prompt includes original + feedback
  - [ ] Auto-create TrainingData record
  - [ ] Update article with revised content
  - [ ] Mark comments as addressed

- [ ] Approve/Delete
  - [ ] Green Approve button
  - [ ] Red Delete button with confirmation
  - [ ] Navigation after action

### Step 3: Training System
- [ ] AITraining page
  - [ ] Tab interface: Pending, Approved, Applied
  - [ ] List TrainingData records
  - [ ] Show article title, content type, lesson
  - [ ] Feedback count, impact score
  - [ ] Status badges

- [ ] Apply Training button
  - [ ] Analyze approved training data
  - [ ] Group feedback by category
  - [ ] Build comprehensive training prompt
  - [ ] LLM generates improvements JSON
  - [ ] Save to SystemSettings
  - [ ] Mark training data as applied

### Step 4: Topic Discovery
- [ ] TopicDiscovery page
  - [ ] Search bar (large, purple gradient)
  - [ ] Search mutation with LLM
  - [ ] Returns 10-15 ideas

- [ ] Content Queue
  - [ ] Tab interface: Queue, Approved, Completed
  - [ ] List ContentIdea records
  - [ ] Status and priority badges
  - [ ] Approve/Reject buttons
  - [ ] Generate Article button

- [ ] Results Processing
  - [ ] Create ContentIdea for each idea
  - [ ] Set status and priority
  - [ ] Calculate trending_score
  - [ ] Store search_query

### Step 5: Quick Generate
- [ ] QuickGenerate page
  - [ ] Fetch top keywords, clusters, ideas
  - [ ] Display suggestion cards
  - [ ] Generate Now button for each

- [ ] Quick Generation
  - [ ] Start immediate generation
  - [ ] Infer content type
  - [ ] Show progress overlay
  - [ ] Add to review queue

### Step 6: Dashboard
- [ ] Dashboard page
  - [ ] Stats cards
  - [ ] Generate New Article button
  - [ ] Quick Generate CTA
  - [ ] Recent articles table
  - [ ] Activity feed
  - [ ] Topic queue

## Database Tables Required

- article_revisions (feedback comments)
- content_ideas (trending topics)
- training_data (before/after revisions)
- system_settings (versioned improvements)

## Key Prompts to Create

- Ranking article template (1500-2000 words)
- Career guide template (2000-2500 words)
- Listicle template (2500-3500 words)
- Comprehensive guide template (1500-2500 words)
- FAQ article template (2000-3000 words)
- Title generation prompt
- Topic discovery prompt
- Training analysis prompt
- Article revision prompt

## UI Components Needed

- Card components
- Badge components
- Progress indicators
- Modal dialogs
- Floating buttons
- Loading spinners
- Tab interfaces
- Gradient backgrounds
- Smooth animations

## Key Patterns

- Multi-source suggestions
- Text selection with floating buttons
- Category and severity structured feedback
- Before/after training capture
- Real-time progress indication
- AI improvement loop

