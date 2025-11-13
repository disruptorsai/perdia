# Article Generation Wizard - Step-by-Step Flow

## Complete User Journey: 3-5 Minutes

### Flow: IdeaSelection → ContentTypeSelection → TitleSelection → GenerationProgress → GenerationSuccess

---

## STEP 1: IDEA SELECTION (20-30 seconds)

### Purpose
User chooses what topic to write about

### Data Sources - 4 Types of Suggestions

#### 1. Smart Suggestions Tab (Default)

**From Keywords** - "SEO Optimized" badge
- Automatically generated article title from keyword
- Related keywords extracted via pattern matching
- Target audience inferred from keyword content

**From Content Clusters** - "Strategic" badge
- Uses cluster name, description, subtopics
- Shows existing article count in cluster

**From Trending Topics** - "Hot Topic" or "Trending" badge
- Sourced from approved ContentIdea records
- Trending score determines badge color

**From Breaking News** - "Breaking News" badge (top priority)
- AI-generated via LLM searching the internet
- Fetched real-time on page load
- Highest priority in sorting

#### 2. Custom Idea Tab

Manual entry fields:
- Article Title (required)
- Target Keywords (comma-separated, optional)
- Target Audience (freeform, optional)
- Additional Context (multiline, optional)

### Data Captured on Selection
- Complete selectedIdea object
- keywords array extracted
- targetAudience string preserved
- additionalContext string preserved

---

## STEP 2: CONTENT TYPE SELECTION (5-10 seconds)

### Purpose
User chooses the article format best suited to their topic

### 5 Content Types Available

Ranking (1500-2000 words): Degree rankings, school comparisons
Career Guide (2000-2500 words): Career paths, job information
Listicle (2500-3500 words): Job lists, degree options
Comprehensive Guide (1500-2500 words): Educational topics
FAQ Article (2000-3000 words): Common questions

---

## STEP 3: TITLE SELECTION (10-20 seconds)

### Purpose
Choose or customize SEO-optimized title

### AI Title Generation (Automatic)

AI generates 5 title options with:
- title: The suggested title
- seo_rationale: Why it's optimized
- primary_keyword: Main keyword targeted
- estimated_difficulty: Easy/Medium/Hard

### Custom Title Option

Button: "Write My Own Title"
Opens textarea for manual override

---

## STEP 4: GENERATION PROGRESS (1-3 minutes)

### Purpose
Visual feedback while AI generates article

### Progress Indicator Design

Full-screen modal overlay with:
- Blue spinning loader
- Current step message
- Activity checklist
- Disclaimer message

### Step Sequence

20+ detailed steps showing the generation process

---

## STEP 5: GENERATION SUCCESS (Completion)

### Purpose
Confirm generation and guide next actions

### Data Displayed

- Generated article preview
- Statistics (word count, FAQ count, reading time)
- Quick action buttons

