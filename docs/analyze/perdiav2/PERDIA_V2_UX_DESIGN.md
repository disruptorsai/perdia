# Perdia V2 - UX Design Specification
**Date:** 2025-11-11
**Status:** Design Phase
**Philosophy:** Radical Simplicity Meets Power User Efficiency

---

## Table of Contents
1. [Design Principles](#design-principles)
2. [User Personas & Workflows](#user-personas--workflows)
3. [Information Architecture](#information-architecture)
4. [Screen-by-Screen Design](#screen-by-screen-design)
5. [Interaction Patterns](#interaction-patterns)
6. [Visual Design System](#visual-design-system)
7. [Responsive & Performance](#responsive--performance)
8. [Accessibility](#accessibility)

---

## Design Principles

### 1. **Default to Action**
- Most common action (Approve) is always one click away
- No confirmation dialogs for reversible actions
- Undo buffer for safety (30 seconds)

### 2. **Progressive Disclosure**
- Show essentials by default
- Reveal complexity only when needed
- Power features don't clutter beginner experience

### 3. **Spatial Consistency**
- Same action always in same place
- Persistent navigation
- Predictable behavior

### 4. **Immediate Feedback**
- Every action shows instant response
- Optimistic UI updates
- Clear loading states

### 5. **Keyboard-First, Mouse-Friendly**
- Everything accessible via keyboard
- Power users can fly through reviews
- Mouse users get visual cues and tooltips

### 6. **Zero Empty States**
- Every screen useful from day one
- Sample data and helpful prompts
- Clear next steps

---

## User Personas & Workflows

### Primary User: Sarah (Content Reviewer)
**Goal:** Review and approve 5-10 articles per day
**Time per article:** 3-5 minutes
**Pain points:**
- Too many clicks to see content
- Can't make quick edits
- Unclear what's already published

**Ideal Workflow:**
1. Opens app → sees Approval Queue (no navigation needed)
2. Scans list of pending articles (thumbnails, titles, ages)
3. Clicks one → preview drawer slides open
4. Reads article in clean, distraction-free view
5. Makes inline edits if needed (2-3 typos, style tweaks)
6. Clicks "Approve & Publish" (one button)
7. Article instantly moves to "Published" column
8. Notification confirms WordPress publish
9. Next article auto-selected (optional)

**Power user additions:**
- Uses `j/k` keys to navigate
- Uses `a` to approve, `e` to edit, `r` to regenerate
- Bulk approves 3 articles at once
- Sets personal review preferences

### Secondary User: Admin (Will)
**Goal:** Configure automation, monitor performance, tune pipelines
**Time spent:** 15 minutes per week
**Pain points:**
- Unclear which pipeline performs best
- Can't see cost per article
- Automation settings buried

**Ideal Workflow:**
1. Lands on Dashboard (weekly digest)
2. Sees performance metrics (approval rate, avg cost, published count)
3. Clicks Settings → Automation
4. Adjusts posting frequency slider (daily → 3x/week)
5. Toggles auto-approve (5 days → 7 days)
6. Clicks Settings → Pipeline (Advanced)
7. Compares V1 vs V2 performance
8. Switches to better-performing preset

---

## Information Architecture

### Navigation Structure
```
┌─────────────────────────────────────────────────────────┐
│  PERDIA                                     [User Menu] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Sidebar (Left - Always Visible):                       │
│                                                          │
│  🏠 Dashboard                                           │
│  ✅ Approval Queue ← PRIMARY (80% of time here)         │
│  📝 All Articles                                        │
│  💡 Topics & Questions                                  │
│  ⚙️  Settings                                           │
│                                                          │
│  ─────────────────                                      │
│                                                          │
│  📊 Analytics (Future)                                  │
│  👥 Team (Future)                                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### URL Structure
```
/                           → Redirects to /approval-queue
/approval-queue             → Main screen (default)
/approval-queue/:id         → Article detail drawer
/articles                   → All articles (published, approved, drafts)
/articles/:id               → Full-page article view
/topics                     → Topics & Questions manager
/topics/questions           → Question bank
/topics/keywords            → Keyword manager
/topics/trends              → Trend monitoring
/settings                   → Settings home
/settings/automation        → Automation controls
/settings/integrations      → WordPress, APIs
/settings/pipeline          → Pipeline configuration (advanced)
/settings/team              → Team management (future)
```

---

## Screen-by-Screen Design

### 1. APPROVAL QUEUE (Primary Screen)

#### Layout: Hybrid List + Drawer + Kanban

**Default View: List + Drawer**
```
┌──────────────────────────────────────────────────────────────────┐
│  Approval Queue                                    [View: List ▾] │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Filters: [All ▾] [Status ▾] [Age ▾]          🔍 Search articles │
│                                                                   │
│  ┌─ Pending Review (3) ──────────────┬─ Preview ──────────────┐ │
│  │                                    │                         │ │
│  │  ┌──────────────────────────────┐ │  [X] Close              │ │
│  │  │ 🖼️  Best Online MBA Programs  │ │                         │ │
│  │  │     2025 Ranking Guide       │ │  # Best Online MBA...   │ │
│  │  │                               │ │                         │ │
│  │  │  📝 1,847 words               │ │  Lead paragraph shows   │ │
│  │  │  🎯 online mba, mba programs  │ │  here with proper...    │ │
│  │  │  📅 Created 2 days ago        │ │                         │ │
│  │  │  ⏱️  Auto-approves in 3 days  │ │  ## Section Heading     │ │
│  │  │                               │ │                         │ │
│  │  │  [👁️ Preview] [✏️ Edit]       │ │  Body content renders   │ │
│  │  └──────────────────────────────┘ │  in clean reading...    │ │
│  │                                    │                         │ │
│  │  ┌──────────────────────────────┐ │  ─────────────────────  │ │
│  │  │ 🖼️  Why Get a Nursing Degree │ │                         │ │
│  │  │     in 2025?                  │ │  [Comments (0)]         │ │
│  │  │                               │ │  [SEO Score: 87/100]    │ │
│  │  │  📝 2,134 words               │ │                         │ │
│  │  │  🎯 nursing degree, RN        │ │  ─────────────────────  │ │
│  │  │  📅 Created 5 hours ago       │ │                         │ │
│  │  │  ⏱️  Auto-approves in 5 days  │ │  [🔄 Regenerate]        │ │
│  │  │                               │ │  [✏️  Quick Edit]       │ │
│  │  │  [👁️ Preview] [✏️ Edit]       │ │  [✅ Approve & Publish] │ │
│  │  └──────────────────────────────┘ │                         │ │
│  │                                    │                         │ │
│  │  ┌──────────────────────────────┐ │                         │ │
│  │  │ 🖼️  Top 10 Affordable Online │ │                         │ │
│  │  │     Colleges                  │ │                         │ │
│  │  │  ... (continues)              │ │                         │ │
│  │                                    │                         │ │
│  └────────────────────────────────────┴─────────────────────────┘ │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Article Card Design (in list):**
```
┌────────────────────────────────────────────────────────┐
│ 🖼️ [Featured Image]    Best Online MBA Programs 2025  │
│    120x80px                                            │
│                        📝 1,847 words  📊 SEO: 87/100  │
│                        🎯 online mba, mba programs     │
│                        📅 2 days ago  ⏱️ Auto: 3 days  │
│                                                        │
│    Status: [Pending Review ●]  Model: Grok + Perplex  │
│                                                        │
│    [👁️ Preview]  [✏️ Edit]  [⋮ More]                  │
└────────────────────────────────────────────────────────┘
```

**Alternative View: Kanban Board**
```
┌────────────────────────────────────────────────────────────────┐
│  Approval Queue                              [View: Kanban ▾]  │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Draft (2) ──┬─ Pending (3) ─┬─ Approved (1) ┬─ Pub (12) ┐│
│  │               │                │                │           ││
│  │ ┌───────────┐ │ ┌───────────┐ │ ┌───────────┐ │ ┌────────┐││
│  │ │ 🖼️        │ │ │ 🖼️        │ │ │ 🖼️        │ │ │ 🖼️     │││
│  │ │ MBA Guide │ │ │ Nursing   │ │ │ Afford... │ │ │ Top... │││
│  │ │           │ │ │ Degree    │ │ │           │ │ │        │││
│  │ │ 1.8K wd   │ │ │ 2.1K wd   │ │ │ 1.5K wd   │ │ │ 2.3K   │││
│  │ │ 2 days    │ │ │ 5 hrs     │ │ │ just now  │ │ │ 3 days │││
│  │ └───────────┘ │ └───────────┘ │ └───────────┘ │ └────────┘││
│  │               │                │                │           ││
│  │ ┌───────────┐ │ ┌───────────┐ │                │ ┌────────┐││
│  │ │ 🖼️        │ │ │ 🖼️        │ │                │ │ 🖼️     │││
│  │ │ Another   │ │ │ Article   │ │                │ │ More   │││
│  │ └───────────┘ │ └───────────┘ │                │ └────────┘││
│  │               │                │                │           ││
│  └───────────────┴────────────────┴────────────────┴───────────┘│
│                                                                 │
│  Drag cards between columns to change status                   │
└────────────────────────────────────────────────────────────────┘
```

#### Drawer: Article Preview + Actions

**Reading Mode (Default):**
```
┌─────────────────────────────────────────────────────────┐
│  [← Back to List]                        [✕ Close]      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Best Online MBA Programs 2025: Complete Ranking Guide  │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  [🖼️ Featured Image - Full Width]                       │
│                                                          │
│  Choosing the right MBA program can transform your      │
│  career trajectory. In 2025, online MBA programs...     │
│                                                          │
│  ## Top 10 Online MBA Programs                          │
│                                                          │
│  1. **University of North Carolina (Kenan-Flagler)**    │
│     - Accreditation: AACSB                              │
│     - Tuition: $58,000                                  │
│     - [Learn more about UNC's MBA program →]            │
│                                                          │
│  2. **Indiana University (Kelley School)**              │
│     ...                                                 │
│                                                          │
│  [Content continues with clean typography, spacing]     │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Sidebar (Right) - Always Visible:                      │
│                                                          │
│  📊 METADATA                                            │
│  ────────────                                           │
│  Words: 1,847                                           │
│  Reading: 7 min                                         │
│  SEO Score: 87/100                                      │
│  Created: 2 days ago                                    │
│  Model: Grok + Perplexity                               │
│  Cost: $0.23                                            │
│                                                          │
│  🎯 KEYWORDS                                            │
│  ────────────                                           │
│  • online mba                                           │
│  • best mba programs                                    │
│  • mba ranking 2025                                     │
│  • accredited mba online                                │
│                                                          │
│  🔗 LINKS                                               │
│  ────────────                                           │
│  Internal: 4                                            │
│  External: 8                                            │
│  Affiliate: 2                                           │
│                                                          │
│  💬 COMMENTS (0)                                        │
│  ────────────                                           │
│  No comments yet                                        │
│  [+ Add comment]                                        │
│                                                          │
│  ⚡ ACTIONS                                             │
│  ────────────                                           │
│  [✅ Approve & Publish]  ← PRIMARY                      │
│  [✏️  Quick Edit]                                       │
│  [🔄 Regenerate]                                        │
│  [💾 Save Draft]                                        │
│  [🗑️  Delete]                                          │
│                                                          │
│  ⏱️  Auto-approves in 3 days                           │
│  ────────────                                           │
│  [⏸️  Pause timer]                                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Editing Mode (Inline):**
```
┌─────────────────────────────────────────────────────────┐
│  [← Cancel]  Editing: Best Online MBA...  [💾 Save]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Best Online MBA Programs 2025: Complete Ranking   │ │
│  │ Guide                                               │ │
│  └────────────────────────────────────────────────────┘ │
│  [Edit Title]                                           │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [🖼️ Click to replace image]                        │ │
│  │                                                     │ │
│  │ Or: [🎨 Regenerate Image with AI]                  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Choosing the right MBA program can transform your  │ │
│  │ career trajectory. In 2025, online MBA programs... │ │
│  │                                                     │ │
│  │ [Rich text editor with formatting toolbar]         │ │
│  │ [B] [I] [Link] [H1-H3] [List] [Quote]             │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  💡 Click any paragraph to edit inline                  │
│  💡 Cmd/Ctrl+S to save, Esc to cancel                   │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  [💾 Save Changes]  [❌ Discard]                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Commenting Mode (Google Docs style):**
```
┌─────────────────────────────────────────────────────────┐
│  [Comments: 2]                            [✕ Close]     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Best Online MBA Programs 2025: Complete Ranking Guide  │
│                                                          │
│  Choosing the right MBA program can transform your      │
│  career trajectory. In 2025, online MBA programs...     │
│  ┌─────────────────────────────────────────────┐       │
│  │ 💬 Sarah: "Trajectory" feels too formal     │       │
│  │    2 hours ago                               │       │
│  │    [Reply] [Resolve]                         │       │
│  └─────────────────────────────────────────────┘       │
│                                                          │
│  ## Top 10 Online MBA Programs                          │
│                                                          │
│  1. **University of North Carolina (Kenan-Flagler)**    │
│     - Accreditation: AACSB                              │
│  ┌─────────────────────────────────────────────┐       │
│  │ 💬 Will: "Add tuition comparison table?"    │       │
│  │    1 day ago                                 │       │
│  │    │                                         │       │
│  │    └─ 💬 Sarah: "Good idea!"                │       │
│  │       5 hours ago                            │       │
│  │    [Reply] [Resolve]                         │       │
│  └─────────────────────────────────────────────┘       │
│                                                          │
│  💡 Select text to add a comment                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Key Features: Approval Queue

1. **Status Badges with Auto-Approve Timer**
   ```
   [Pending Review ●]  ⏱️ Auto-approves in 3 days
   ```
   - Visual countdown (progress ring)
   - Hover shows exact timestamp
   - Click to pause/resume timer

2. **Bulk Actions**
   ```
   [☑️ Select All]  [✅ Approve Selected (3)]  [✏️ Bulk Edit]
   ```
   - Keyboard: Shift+Click to select range
   - Cmd/Ctrl+A to select all visible
   - Actions only appear when items selected

3. **Smart Filters**
   ```
   Filters: [All ▾] [Status ▾] [Model Used ▾] [Age ▾] [Keywords ▾]
   ```
   - Saved filter presets
   - "My Reviews" (articles I commented on)
   - "Urgent" (auto-approve in < 1 day)

4. **Keyboard Shortcuts** (Always visible via `?` key)
   ```
   j/k         Navigate up/down
   Enter       Open article
   a           Approve current article
   e           Edit current article
   r           Regenerate current article
   c           Add comment
   Esc         Close drawer
   /           Focus search
   ?           Show all shortcuts
   ```

---

### 2. TOPICS & QUESTIONS MANAGER

#### Layout: Tabbed Interface with Action Panel

```
┌──────────────────────────────────────────────────────────────────┐
│  Topics & Questions                                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [💡 Questions]  [🎯 Keywords]  [📈 Trends]                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                   │
│  🔍 Search questions...              [+ Add Question]  [Import] │
│                                                                   │
│  Showing 47 questions from November 2025    Sort by: [Priority▾]│
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 💡 What are the best online MBA programs for working       │ │
│  │    professionals?                                          │ │
│  │                                                            │ │
│  │    Source: Monthly Ingest (Nov 1)    Priority: ⭐⭐⭐⭐⭐  │ │
│  │    Status: ✅ Published (3 days ago)                      │ │
│  │    Keywords: online mba, working professionals, flexible  │ │
│  │                                                            │ │
│  │    [📝 View Article]  [🔄 Generate New Version]  [⋮ More] │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 💡 How much does an online nursing degree cost?           │ │
│  │                                                            │ │
│  │    Source: Monthly Ingest (Nov 1)    Priority: ⭐⭐⭐⭐   │ │
│  │    Status: 📝 Draft (in Approval Queue)                   │ │
│  │    Keywords: nursing degree, cost, tuition                │ │
│  │                                                            │ │
│  │    [👁️ Preview Draft]  [✏️ Edit]  [⋮ More]               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 💡 Is a bachelor's degree in psychology worth it?         │ │
│  │                                                            │ │
│  │    Source: Manual Entry    Priority: ⭐⭐⭐               │ │
│  │    Status: ⏳ Not Started                                  │ │
│  │    Keywords: psychology degree, worth it, career          │ │
│  │                                                            │ │
│  │    [✨ Generate Article]  [✏️ Edit Question]  [⋮ More]    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ... (more questions)                                             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### Question Detail Panel (Click to expand)

```
┌──────────────────────────────────────────────────────────────────┐
│  💡 What are the best online MBA programs for working            │
│     professionals?                                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📊 DETAILS                                                      │
│  ────────────                                                    │
│  Source: Monthly Ingest (Nov 1, 2025)                            │
│  Priority: ⭐⭐⭐⭐⭐ (5/5)                                        │
│  Status: ✅ Published                                            │
│  Search Volume: ~8,100/month (via DataForSEO)                    │
│  Difficulty: Medium (52/100)                                     │
│                                                                   │
│  🎯 LINKED KEYWORDS                                              │
│  ────────────                                                    │
│  • online mba (primary)                                          │
│  • working professionals mba                                     │
│  • flexible mba programs                                         │
│  • executive mba online                                          │
│                                                                   │
│  📝 CONTENT GENERATED                                            │
│  ────────────                                                    │
│  ✅ "Best Online MBA Programs 2025: Complete Ranking Guide"      │
│     Published 3 days ago                                         │
│     WordPress ID: 12345                                          │
│     [📝 View Article]  [📊 View Analytics]                       │
│                                                                   │
│  💡 SUGGESTED ANGLES (AI-Generated)                              │
│  ────────────                                                    │
│  • Focus on part-time schedules                                  │
│  • Compare asynchronous vs synchronous programs                  │
│  • Highlight evening/weekend options                             │
│  • Interview working professionals who completed MBA             │
│                                                                   │
│  ⚡ ACTIONS                                                       │
│  ────────────                                                    │
│  [✨ Generate New Article (Different Angle)]                     │
│  [🔄 Update Existing Article]                                    │
│  [🎨 Generate Comparison Table]                                  │
│  [✏️  Edit Question]                                             │
│  [🗑️  Archive Question]                                          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### Keywords Tab (Existing, Refined)

```
┌──────────────────────────────────────────────────────────────────┐
│  🎯 Keywords                                  [+ Add]  [Import]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🔍 Search keywords...           Filter: [All Lists ▾]  [CSV ↓] │
│                                                                   │
│  List: Currently Ranked (247 keywords)      Sort by: [Priority▾]│
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [☑️] online mba programs                                   │ │
│  │                                                            │ │
│  │      Search Vol: 8,100/mo   Difficulty: 52   Priority: 5  │ │
│  │      Category: MBA    Current Rank: #4                     │ │
│  │      Linked Question: "Best online MBA programs for..."    │ │
│  │                                                            │ │
│  │      [✨ Generate Article]  [🔗 Link Question]  [⋮ More]  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ... (continues with keyword list)                                │
│                                                                   │
│  💡 Innovation: Link keywords to questions for hybrid strategy   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### Trends Tab (Optional, Future)

```
┌──────────────────────────────────────────────────────────────────┐
│  📈 Trends                                                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🔍 Monitor trending topics...                [Configure Feed]   │
│                                                                   │
│  Weekly Sweep: Enabled (Runs every Monday 5:00 AM)               │
│  Sources: Reddit r/college, Twitter #highereducation              │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🔥 "Community college transfer paths gaining popularity"   │ │
│  │                                                            │ │
│  │    Detected: 2 hours ago    Mentions: 47 (↑ 230%)         │ │
│  │    Sentiment: Positive    Sources: Reddit, Twitter        │ │
│  │                                                            │ │
│  │    [✨ Generate Hot Take Article]  [💾 Save as Question]  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ... (more trends)                                                │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

### 3. SETTINGS

#### Layout: Sidebar Navigation + Content Panels

```
┌──────────────────────────────────────────────────────────────────┐
│  Settings                                                        │
├─────────────────┬────────────────────────────────────────────────┤
│                 │                                                 │
│  General        │  🤖 AUTOMATION                                 │
│  ━━━━━━━━       │  ─────────────                                │
│  Automation     │                                                 │
│  Integrations   │  📅 Publishing Schedule                        │
│  Pipeline       │  ────────────────────                          │
│  Team           │                                                 │
│  Notifications  │  How often should articles publish?            │
│  Advanced       │  [Daily ●] [3x/Week ○] [Weekly ○] [Custom ○]  │
│                 │                                                 │
│                 │  What time should articles publish?            │
│                 │  [05:00] AM  Timezone: [Mountain Time ▾]      │
│                 │                                                 │
│                 │  ─────────────────────────────────────────────  │
│                 │                                                 │
│                 │  ✅ APPROVAL WORKFLOW                           │
│                 │  ─────────────────                              │
│                 │                                                 │
│                 │  ☑️ Require manual approval before publishing   │
│                 │     (Turn off for fully automated publishing)   │
│                 │                                                 │
│                 │  ☑️ Auto-approve after [5 ▾] days if no review │
│                 │     (Safety net to prevent articles from        │
│                 │      getting stuck in queue forever)            │
│                 │                                                 │
│                 │  Notification: Send reminder [24] hours before │
│                 │                auto-approve                     │
│                 │                                                 │
│                 │  ─────────────────────────────────────────────  │
│                 │                                                 │
│                 │  📊 CONTENT GENERATION                          │
│                 │  ────────────────────                           │
│                 │                                                 │
│                 │  Articles to keep in queue: [10 ▾]             │
│                 │  Generate new articles: [As needed ▾]          │
│                 │                                                 │
│                 │  ☑️ Generate on schedule (next batch in 2 days)│
│                 │  ☐ Generate when queue drops below 5           │
│                 │                                                 │
│                 │  ─────────────────────────────────────────────  │
│                 │                                                 │
│                 │  [💾 Save Changes]    Last saved: Just now     │
│                 │                                                 │
└─────────────────┴────────────────────────────────────────────────┘
```

#### Integrations Panel

```
┌──────────────────────────────────────────────────────────────────┐
│  🔌 INTEGRATIONS                                                 │
│  ──────────────                                                  │
│                                                                   │
│  WordPress Connection                                            │
│  ──────────────────────                                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ✅ Connected to GetEducated.com                            │ │
│  │                                                            │ │
│  │    Site URL: https://geteducated.com                       │ │
│  │    Connection: REST API + Direct DB (Plugin)               │ │
│  │    Last tested: 2 minutes ago                              │ │
│  │                                                            │ │
│  │    [🔧 Configure]  [🧪 Test Connection]  [🔌 Disconnect]  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Publishing Settings                                             │
│  ─────────────────────                                           │
│  Default Category: [Articles ▾]                                 │
│  Default Tags: education, online learning, degree programs      │
│  Default Author: Sarah Mitchell                                 │
│  Post Status: Publish immediately (not draft)                   │
│  ☑️ Use shortcodes for all links (required)                     │
│  ☑️ Add featured images automatically                           │
│                                                                   │
│  ─────────────────────────────────────────────────────────────   │
│                                                                   │
│  API Keys                                                        │
│  ────────                                                        │
│                                                                   │
│  ✅ Anthropic (Claude)          [🔑 •••••••••• Change]          │
│  ✅ OpenAI (GPT)                [🔑 •••••••••• Change]          │
│  ✅ xAI (Grok)                  [🔑 •••••••••• Change]          │
│  ✅ Perplexity                  [🔑 •••••••••• Change]          │
│  ✅ Google Gemini (Images)      [🔑 •••••••••• Change]          │
│  ⚠️  DataForSEO (Optional)      [+ Add API Key]                 │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### Pipeline Configuration (Advanced - Hidden by default)

```
┌──────────────────────────────────────────────────────────────────┐
│  ⚙️  PIPELINE CONFIGURATION                                      │
│  ─────────────────────────                                       │
│                                                                   │
│  💡 Experiment with different content generation approaches      │
│                                                                   │
│  Active Pipeline: [V2: Grok + Perplexity (Recommended) ▾]       │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Preset Pipelines:                                          │ │
│  │                                                            │ │
│  │  ● V2: Grok + Perplexity (Question-Driven)                │ │
│  │    ├─ Topic: Questions first, fallback to keywords        │ │
│  │    ├─ Draft: Grok-2                                        │ │
│  │    ├─ Verify: Perplexity (fact-check + citations)         │ │
│  │    ├─ Enhance: SEO, quotes, links, style variation        │ │
│  │    └─ Output: Image, meta, WordPress format               │ │
│  │                                                            │ │
│  │    Performance: ⭐⭐⭐⭐ (4.2/5 avg rating)                │ │
│  │    Avg Cost: $0.31/article    Approval Rate: 87%          │ │
│  │                                                            │ │
│  │  ○ V1: Claude Sonnet (Keyword-Driven)                     │ │
│  │    ├─ Topic: Keywords only                                 │ │
│  │    ├─ Draft: Claude Sonnet 4.5                            │ │
│  │    └─ Enhance: SEO, links, image                          │ │
│  │                                                            │ │
│  │    Performance: ⭐⭐⭐⭐ (4.0/5 avg rating)                │ │
│  │    Avg Cost: $0.28/article    Approval Rate: 82%          │ │
│  │                                                            │ │
│  │  ○ Hybrid: Best of Both                                    │ │
│  │    Uses questions + keywords, Claude + Perplexity         │ │
│  │    Performance: Not enough data yet                        │ │
│  │                                                            │ │
│  │  ○ Custom Pipeline (experimental)                          │ │
│  │    [🔧 Configure Custom Pipeline →]                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  [👁️ View Pipeline Diagram]  [📊 Compare Performance]          │
│  [✨ Create Custom Pipeline]                                     │
│                                                                   │
│  ─────────────────────────────────────────────────────────────   │
│                                                                   │
│  Stage-Level Configuration (Advanced)                            │
│  ───────────────────────────────────                             │
│  [🔍 Click to expand →]                                          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### Visual Pipeline Editor (Modal)

```
┌──────────────────────────────────────────────────────────────────┐
│  Pipeline Editor: V2 Grok + Perplexity            [✕ Close]     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Drag stages to reorder. Toggle switches to enable/disable.      │
│  Click stage to configure. Changes saved automatically.          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  1. TOPIC SOURCE             [ON ●]     [⚙️]   [⋮]       │   │
│  │     Module: Question Source                               │   │
│  │     Priority: Monthly questions → Keywords fallback       │   │
│  │     ──────────────────────────────────────────────────    │   │
│  │                              ↓                            │   │
│  │  2. DRAFT GENERATOR          [ON ●]     [⚙️]   [⋮]       │   │
│  │     Model: Grok-2                                         │   │
│  │     Temperature: 0.7   Max Tokens: 3000                   │   │
│  │     Style: Conversational, human-like                     │   │
│  │     ──────────────────────────────────────────────────    │   │
│  │                              ↓                            │   │
│  │  3. FACT VERIFIER            [ON ●]     [⚙️]   [⋮]       │   │
│  │     Model: Perplexity                                     │   │
│  │     Actions: Check facts, add citations, update links     │   │
│  │     ──────────────────────────────────────────────────    │   │
│  │                              ↓                            │   │
│  │  4. SEO OPTIMIZER            [ON ●]     [⚙️]   [⋮]       │   │
│  │     Target keyword density: Natural (2-3%)                │   │
│  │     Add meta description: Yes                             │   │
│  │     ──────────────────────────────────────────────────    │   │
│  │                              ↓                            │   │
│  │  5. QUOTE INTEGRATOR         [ON ●]     [⚙️]   [⋮]       │   │
│  │     Sources: Reddit, Twitter, Forums                      │   │
│  │     Min real quotes: 2                                    │   │
│  │     ──────────────────────────────────────────────────    │   │
│  │                              ↓                            │   │
│  │  6. LINK INSERTER            [ON ●]     [⚙️]   [⋮]       │   │
│  │     Internal links: 2-4   Use shortcodes: Required       │   │
│  │     ──────────────────────────────────────────────────    │   │
│  │                              ↓                            │   │
│  │  7. STYLE VARIATOR           [ON ●]     [⚙️]   [⋮]       │   │
│  │     Vary sentence length: Yes                             │   │
│  │     Add colloquialisms: Yes                               │   │
│  │     Avoid AI patterns: Yes                                │   │
│  │     ──────────────────────────────────────────────────    │   │
│  │                              ↓                            │   │
│  │  8. IMAGE GENERATOR          [ON ●]     [⚙️]   [⋮]       │   │
│  │     Model: Gemini 2.5 Flash Image                         │   │
│  │     Images per article: 1                                 │   │
│  │     ──────────────────────────────────────────────────    │   │
│  │                              ↓                            │   │
│  │  9. WORDPRESS FORMATTER      [ON ●]     [⚙️]   [⋮]       │   │
│  │     Use shortcodes: Required                              │   │
│  │     Add categories/tags: Yes                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  [+ Add Stage]    [💾 Save Pipeline]    [🗑️ Delete Pipeline]    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Interaction Patterns

### 1. Micro-Interactions & Feedback

#### Button States
```
Normal:     [✅ Approve & Publish]
Hover:      [✅ Approve & Publish] (subtle lift, shadow increase)
Click:      [⏳ Publishing...] (spinner, disabled)
Success:    [✓ Published!] (green, checkmark, 2s fade)
Error:      [⚠️  Failed] (red, shake animation)
```

#### Loading States
- **Skeleton Screens** - Show layout structure while loading
- **Progressive Loading** - Show content as it arrives (title → body → images)
- **Optimistic Updates** - Update UI immediately, rollback if fails

#### Transitions
- **Page Navigation** - Smooth fade (200ms)
- **Drawer Open/Close** - Slide from right (300ms ease-out)
- **Status Changes** - Color fade (400ms)
- **List Updates** - Slide in/out (250ms)

### 2. Drag & Drop

#### Articles (Kanban View)
```
Dragging:   Card lifts, cursor changes, drop zones highlight
Drop Zone:  Highlight with dashed border + color
Drop:       Smooth animation to new position
Feedback:   Status badge updates, toast notification
```

#### Images (Article Editor)
```
Drag Over:  "Drop image to replace" overlay appears
Drop:       Image uploads, preview updates immediately
Progress:   Linear progress bar during upload
Complete:   Success animation, AI regeneration option appears
```

### 3. Keyboard Navigation

#### Global Shortcuts
```
/           Focus search
?           Show keyboard shortcuts
Cmd/Ctrl+K  Quick command palette
Esc         Close modals/drawers
```

#### List Navigation
```
j           Move down
k           Move up
Enter       Open selected item
Shift+↑/↓   Multi-select
Cmd/Ctrl+A  Select all
```

#### Article Actions
```
a           Approve
e           Edit
c           Comment
r           Regenerate
d           Delete (with confirmation)
s           Save
```

### 4. Smart Defaults & Auto-Save

#### Auto-Save Strategy
- Save draft every 2 seconds when editing
- Show "Saving..." indicator (subtle, non-intrusive)
- "Saved at 3:47 PM" confirmation
- Conflict resolution if multiple users edit simultaneously

#### Smart Defaults
- New articles default to current pipeline preset
- Auto-select next article after approving
- Remember filter preferences per user
- Auto-fill WordPress metadata from article content

### 5. Inline Editing Modes

#### Click to Edit
```
Normal View:        "Choosing the right MBA program..."
Hover:              [Light background highlight]
Click:              [Contenteditable, formatting toolbar appears]
Typing:             Auto-save indicator appears
Click Outside:      Saves automatically
```

#### Formatting Toolbar (Appears on text selection)
```
┌─────────────────────────────────────────┐
│ B  I  U  Link  H1  H2  H3  •  1.  "   │
└─────────────────────────────────────────┘
  ↑ Floats above selected text
  Includes: Bold, Italic, Underline, Link,
           Headings, Lists, Quote
```

### 6. Commenting System

#### Add Comment (Select text)
```
Selected Text: "trajectory"
              ↓
        [💬 Add Comment]
              ↓
  ┌─────────────────────────┐
  │ 💬 New Comment          │
  │                         │
  │ [Type your comment...] │
  │                         │
  │ [Cancel]  [Post]        │
  └─────────────────────────┘
```

#### View Comments
- Yellow highlight on commented text
- Hover → Show comment tooltip
- Click → Open comment thread in sidebar
- Resolve → Remove highlight, keep in history

### 7. Undo/Redo System

#### Undo Buffer (30 seconds)
```
Action:     Approve article
Undo:       Toast appears with [↶ Undo] button
Timeout:    After 30s, undo option disappears
Undo:       Article returns to previous state
Feedback:   "Approval undone" toast
```

#### Supported Undo Actions
- Approve/Reject decisions
- Content edits (up to 10 revisions)
- Status changes
- Bulk operations
- Regenerations

### 8. Bulk Actions

#### Multi-Select
```
┌────────────────────────────────────────┐
│ [☑️ 3 Selected]                        │
│                                        │
│ [✅ Approve All]  [✏️ Bulk Edit]       │
│ [🗑️ Delete]  [⋮ More Actions]         │
└────────────────────────────────────────┘
```

#### Bulk Edit Modal
```
┌─────────────────────────────────────────┐
│ Edit 3 Articles                         │
├─────────────────────────────────────────┤
│                                          │
│ Apply changes to:                        │
│ • Best Online MBA Programs               │
│ • Why Get a Nursing Degree               │
│ • Top 10 Affordable Online Colleges      │
│                                          │
│ ☑️ Change Status to: [Approved ▾]       │
│ ☐ Add Keywords: [online, education]     │
│ ☐ Assign to: [Sarah ▾]                  │
│ ☐ Change Pipeline: [V2 Grok ▾]          │
│                                          │
│ [Cancel]  [Apply Changes]                │
└─────────────────────────────────────────┘
```

---

## Visual Design System

### Color Palette

#### Primary Colors
```
Brand Blue:     #3B82F6  (Primary actions, links)
Brand Purple:   #8B5CF6  (Published content, success states)
Brand Green:    #10B981  (Approved, positive feedback)
Brand Orange:   #F59E0B  (Warnings, auto-approve countdown)
Brand Red:      #EF4444  (Errors, destructive actions)
```

#### Status Colors
```
Draft:          #6B7280  (Gray - neutral)
Pending:        #3B82F6  (Blue - attention needed)
Approved:       #10B981  (Green - positive)
Published:      #8B5CF6  (Purple - complete)
Rejected:       #EF4444  (Red - negative)
```

#### Neutral Palette
```
Gray 50:    #F9FAFB  (Backgrounds)
Gray 100:   #F3F4F6  (Subtle backgrounds)
Gray 200:   #E5E7EB  (Borders)
Gray 300:   #D1D5DB  (Dividers)
Gray 400:   #9CA3AF  (Placeholders)
Gray 500:   #6B7280  (Secondary text)
Gray 600:   #4B5563  (Body text)
Gray 700:   #374151  (Headings)
Gray 800:   #1F2937  (Strong emphasis)
Gray 900:   #111827  (Primary text)
```

### Typography

#### Font Stack
```
Headings:   "Inter", system-ui, sans-serif
Body:       -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
Mono:       "JetBrains Mono", "Fira Code", monospace
```

#### Type Scale
```
Display:    48px / 56px (3rem / 3.5rem) - Hero headings
H1:         36px / 44px (2.25rem / 2.75rem) - Page titles
H2:         30px / 38px (1.875rem / 2.375rem) - Section headings
H3:         24px / 32px (1.5rem / 2rem) - Subsections
H4:         20px / 28px (1.25rem / 1.75rem) - Card titles
H5:         18px / 26px (1.125rem / 1.625rem) - Small headings
Body:       16px / 24px (1rem / 1.5rem) - Main text
Small:      14px / 20px (0.875rem / 1.25rem) - Secondary text
Tiny:       12px / 16px (0.75rem / 1rem) - Labels, meta
```

#### Font Weights
```
Light:      300 - Rarely used
Regular:    400 - Body text
Medium:     500 - Emphasis, buttons
Semibold:   600 - Headings, strong emphasis
Bold:       700 - Headlines, very strong emphasis
```

### Spacing System

#### Base Unit: 4px
```
1x:  4px   (xs)  - Tight spacing
2x:  8px   (sm)  - Compact elements
3x:  12px  (md)  - Default spacing
4x:  16px  (lg)  - Comfortable spacing
6x:  24px  (xl)  - Section separation
8x:  32px  (2xl) - Major sections
12x: 48px  (3xl) - Page-level spacing
16x: 64px  (4xl) - Hero spacing
```

### Component Styles

#### Buttons

**Primary Button (Main actions)**
```
Normal:   bg-blue-600, text-white, shadow-sm
Hover:    bg-blue-700, shadow-md, slight lift
Active:   bg-blue-800, shadow-sm
Disabled: bg-gray-300, text-gray-500, no pointer
```

**Secondary Button (Alternative actions)**
```
Normal:   bg-white, border-gray-300, text-gray-700
Hover:    bg-gray-50, border-gray-400
Active:   bg-gray-100
```

**Danger Button (Destructive actions)**
```
Normal:   bg-red-600, text-white
Hover:    bg-red-700
Active:   bg-red-800
```

#### Cards

**Article Card**
```
Background:    white
Border:        1px solid gray-200
Radius:        8px (rounded-lg)
Shadow:        sm (subtle)
Hover:         shadow-md, border-gray-300
Padding:       16px (p-4)
```

**Content Card**
```
Background:    white
Border:        none
Radius:        12px (rounded-xl)
Shadow:        lg (elevated)
Padding:       24px (p-6)
```

#### Inputs

**Text Input**
```
Border:        1px solid gray-300
Radius:        6px (rounded-md)
Padding:       8px 12px
Focus:         border-blue-500, ring-2 ring-blue-100
Error:         border-red-500, ring-2 ring-red-100
Disabled:      bg-gray-50, text-gray-400
```

**Select/Dropdown**
```
Similar to text input
Icon:          chevron-down (gray-400)
Hover:         border-gray-400
Open:          border-blue-500, ring-2 ring-blue-100
```

#### Badges/Chips

**Status Badge**
```
Pending:       bg-blue-100, text-blue-800, border-blue-200
Approved:      bg-green-100, text-green-800, border-green-200
Published:     bg-purple-100, text-purple-800, border-purple-200
Draft:         bg-gray-100, text-gray-800, border-gray-200
```

**Keyword Chip**
```
Background:    gray-100
Text:          gray-700
Border:        gray-200
Radius:        full (rounded-full)
Padding:       4px 12px
Removable:     X icon on hover
```

#### Shadows

```
xs:   0 1px 2px rgba(0,0,0,0.05)       - Subtle
sm:   0 1px 3px rgba(0,0,0,0.1)        - Cards
md:   0 4px 6px rgba(0,0,0,0.1)        - Hover states
lg:   0 10px 15px rgba(0,0,0,0.1)      - Modals, drawers
xl:   0 20px 25px rgba(0,0,0,0.1)      - Popovers
2xl:  0 25px 50px rgba(0,0,0,0.25)     - Full-screen modals
```

### Iconography

**Icon Library:** Lucide React (consistent, modern)

**Icon Sizes:**
```
xs:   12px  - Inline with small text
sm:   16px  - Inline with body text
md:   20px  - Buttons, cards
lg:   24px  - Headings, emphasis
xl:   32px  - Hero sections
2xl:  48px  - Empty states
```

**Icon Usage:**
```
Actions:       Paired with button text
Status:        Colored to match status
Navigation:    Left of menu item
Meta:          Small, gray, before metrics
Decorative:    Rarely used, subtle
```

### Layout & Grid

#### Container Widths
```
Default:       1280px (max-w-7xl) - Main content
Narrow:        768px (max-w-3xl) - Reading content
Wide:          1536px (max-w-screen-2xl) - Dashboard
Full:          100% - Special cases
```

#### Grid System
```
Columns:       12-column grid
Gutter:        24px (gap-6)
Responsive:
  - Mobile:    1 column
  - Tablet:    2-4 columns
  - Desktop:   4-6 columns
  - Wide:      6-12 columns
```

#### Breakpoints
```
sm:   640px   - Mobile landscape
md:   768px   - Tablet portrait
lg:   1024px  - Tablet landscape / small desktop
xl:   1280px  - Desktop
2xl:  1536px  - Large desktop
```

### Animation & Motion

#### Timing Functions
```
Ease Out:      cubic-bezier(0, 0, 0.2, 1)    - Default (most UI)
Ease In:       cubic-bezier(0.4, 0, 1, 1)    - Exits
Ease In Out:   cubic-bezier(0.4, 0, 0.2, 1)  - Complex movements
Sharp:         cubic-bezier(0.4, 0, 0.6, 1)  - Snappy interactions
```

#### Duration
```
Instant:       0ms    - Immediate feedback (optimistic updates)
Fast:          150ms  - Quick interactions (button press)
Normal:        300ms  - Standard (drawer open, page transition)
Slow:          500ms  - Deliberate (full-screen modal)
Very Slow:     1000ms - Special effects only
```

#### Motion Principles
1. **Purposeful** - Motion communicates, doesn't distract
2. **Responsive** - Instant feedback to user actions
3. **Natural** - Ease-out for most UI (feels organic)
4. **Consistent** - Same transition for same action type
5. **Accessible** - Respect prefers-reduced-motion

---

## Responsive Design

### Mobile-First Approach

#### Approval Queue (Mobile)
```
┌─────────────────────────┐
│ ☰  Approval Queue    🔍 │
├─────────────────────────┤
│                          │
│ 📱 Swipe left to approve│
│ 📱 Swipe right for menu │
│                          │
│ ┌──────────────────────┐│
│ │🖼️ Best Online MBA    ││
│ │   Programs 2025      ││
│ │                      ││
│ │ 📝 1,847 words       ││
│ │ 📅 2 days ago        ││
│ │ ⏱️ Auto: 3 days      ││
│ │                      ││
│ │ [Tap to preview →]   ││
│ └──────────────────────┘│
│                          │
│ ┌──────────────────────┐│
│ │🖼️ Why Get a Nursing  ││
│ │   Degree?            ││
│ │ ...                  ││
│                          │
└─────────────────────────┘

Swipe left on card:
┌─────────────────────────┐
│  ←  MBA Programs   [✅] │  ← Approve button revealed
└─────────────────────────┘

Swipe right on card:
┌─────────────────────────┐
│ [✏️] [🔄] [🗑️] → MBA Programs │  ← Action menu revealed
└─────────────────────────┘
```

#### Article Detail (Mobile)
```
┌─────────────────────────┐
│ [←]  MBA Programs   [⋮] │
├─────────────────────────┤
│                          │
│ Best Online MBA Programs│
│ 2025: Complete Ranking  │
│                          │
│ [🖼️ Featured Image]     │
│                          │
│ Choosing the right MBA  │
│ program can transform   │
│ your career...          │
│                          │
│ [Scroll to read]        │
│                          │
│ ─────────────────────── │
│                          │
│ Sticky Bottom Bar:       │
│ [✅ Approve] [⋮ More]   │
└─────────────────────────┘
```

### Tablet Optimization

**Landscape Mode:**
- Split view: List on left, preview on right (60/40)
- Sidebar navigation remains visible
- Touch targets: 44x44px minimum

**Portrait Mode:**
- Full-width list
- Drawer overlays from bottom (sheet style)
- Larger cards with more metadata visible

### Desktop Enhancements

**Multi-Column Layouts:**
- Kanban view: 4 columns visible
- Article list: 2-3 columns of cards
- Settings: Sidebar + content panel

**Hover States:**
- Rich tooltips
- Preview on hover (quick peek)
- Context menus (right-click)

**Keyboard Focus:**
- Clear focus indicators (blue ring)
- Tab order logical and intuitive
- Shortcuts always available

---

## Accessibility (WCAG 2.1 AA)

### Color & Contrast

**Text Contrast:**
- Body text on white: 4.5:1 minimum (using gray-700)
- Large text on white: 3:1 minimum (using gray-600)
- White text on primary: Always >4.5:1

**Focus Indicators:**
- Blue ring: 2px solid, visible against all backgrounds
- Offset: 2px for clarity
- Never remove focus styles (unless custom replacement)

### Keyboard Navigation

**Focus Management:**
- Tab order follows visual order
- Skip links: "Skip to main content"
- Focus trap in modals (Esc to close)

**Custom Controls:**
- Drawer: Arrow keys navigate, Enter opens
- Kanban: Arrow keys move between columns/cards
- Inline edit: Tab through form fields

### Screen Reader Support

**Semantic HTML:**
```html
<main role="main">
  <nav aria-label="Primary">
  <article aria-labelledby="title-1">
  <button aria-label="Approve article">✅</button>
```

**ARIA Attributes:**
```html
<div role="status" aria-live="polite">Article approved</div>
<button aria-expanded="true" aria-controls="drawer">
<input aria-describedby="hint-text" aria-invalid="true">
```

**Dynamic Content:**
- Live regions for status updates
- Loading states announced
- Error messages associated with inputs

### Visual Accessibility

**Text Sizing:**
- Respects user browser zoom (up to 200%)
- Relative units (rem, em) not px
- Line height: 1.5 for body text

**Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Color Independence:**
- Status conveyed by icon + text + color
- Never rely on color alone
- Patterns/shapes supplement color

---

## Performance Optimization

### Loading Strategy

**Critical Path:**
1. HTML shell (< 14KB)
2. Critical CSS (inline, < 14KB)
3. React + essential JS
4. Content API call (parallel)

**Code Splitting:**
```javascript
// Lazy load routes
const ApprovalQueue = lazy(() => import('./pages/ApprovalQueue'));
const Settings = lazy(() => import('./pages/Settings'));

// Lazy load heavy components
const PipelineEditor = lazy(() => import('./components/PipelineEditor'));
const RichTextEditor = lazy(() => import('./components/Editor'));
```

**Data Fetching:**
- React Query for caching
- Optimistic updates (instant UI)
- Background refetch on window focus
- Infinite scroll (load 20, fetch next 20)

### Image Optimization

**Responsive Images:**
```html
<img
  src="image-800w.jpg"
  srcset="image-400w.jpg 400w, image-800w.jpg 800w, image-1200w.jpg 1200w"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  loading="lazy"
  decoding="async"
/>
```

**Cloudinary Integration:**
- Auto format (WebP, AVIF)
- Quality: auto (smart compression)
- CDN delivery
- Responsive breakpoints

### Perceived Performance

**Skeleton Screens:**
- Show layout structure immediately
- Animate pulse (subtle)
- Replace with real content smoothly

**Optimistic UI:**
- Approve button → Immediately move to "Approved" column
- If fails → Rollback with error toast + retry option
- User never waits for server response

**Progressive Enhancement:**
- Core functionality works without JS
- Enhanced features layer on top
- Graceful degradation

---

## Empty States & Onboarding

### Empty Approval Queue

```
┌──────────────────────────────────────────────────────────┐
│                                                           │
│               ✅                                          │
│          You're all caught up!                           │
│                                                           │
│     No articles pending review at the moment.            │
│                                                           │
│     Next article will be generated in 2 days             │
│     based on your automation settings.                   │
│                                                           │
│     [⚙️ Adjust Schedule]  [✨ Generate Now]             │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Empty Topics/Questions

```
┌──────────────────────────────────────────────────────────┐
│                                                           │
│               💡                                          │
│          Let's add some topics!                          │
│                                                           │
│     Questions and keywords drive your content strategy.  │
│                                                           │
│     [📥 Import Monthly Questions]                        │
│     [🎯 Import Keywords CSV]                             │
│     [✍️  Add Manually]                                   │
│                                                           │
│     💡 Tip: Start with 20-30 questions for best results │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### First-Time User Onboarding

**Step 1: Welcome Modal**
```
┌──────────────────────────────────────────────────────────┐
│  Welcome to Perdia! 🎉                      [Skip Tour]  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  We'll help you publish 100+ articles per week with AI.  │
│                                                           │
│  Quick setup (3 steps, 2 minutes):                       │
│                                                           │
│  1. ✅ Connect WordPress                                 │
│  2. ⏰ Set publishing schedule                           │
│  3. 💡 Import topics/questions                           │
│                                                           │
│  [Let's Go! →]                                           │
│                                                           │
│  Step 1 of 3                                             │
│  ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░                         │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**Step 2: WordPress Connection**
```
┌──────────────────────────────────────────────────────────┐
│  Connect WordPress                   [← Back] [Skip]     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  WordPress Site URL                                       │
│  ┌─────────────────────────────────────────────────────┐│
│  │ https://geteducated.com                             ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
│  Connection Method: [REST API + Plugin ▾]                │
│                                                           │
│  API Username                                             │
│  ┌─────────────────────────────────────────────────────┐│
│  │                                                      ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
│  Application Password                                     │
│  ┌─────────────────────────────────────────────────────┐│
│  │                                                      ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
│  [📚 How to get credentials?]                            │
│                                                           │
│  [Test Connection]  [Next: Set Schedule →]               │
│                                                           │
│  Step 1 of 3                                             │
│  ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░                         │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Error States & Recovery

### Network Error

```
┌──────────────────────────────────────────────────────────┐
│  ⚠️  Connection Error                                    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Couldn't connect to the server.                         │
│  Your changes are saved locally.                         │
│                                                           │
│  [🔄 Retry Now]  [Work Offline]                         │
│                                                           │
│  Retrying automatically in 5 seconds...                  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### WordPress Publish Failed

```
┌──────────────────────────────────────────────────────────┐
│  ⚠️  Publishing Failed                                   │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Article: "Best Online MBA Programs 2025"                │
│                                                           │
│  Error: WordPress returned 401 Unauthorized              │
│                                                           │
│  Possible causes:                                         │
│  • API credentials expired                                │
│  • Network timeout                                        │
│  • WordPress site unavailable                             │
│                                                           │
│  [🔧 Check WordPress Settings]                           │
│  [🔄 Retry Publishing]                                   │
│  [💾 Keep as Approved]                                   │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### AI Generation Failed

```
┌──────────────────────────────────────────────────────────┐
│  ⚠️  Article Generation Failed                           │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Topic: "How much does an online nursing degree cost?"   │
│  Model: Grok-2                                            │
│                                                           │
│  Error: API rate limit exceeded                           │
│                                                           │
│  [🔄 Retry with Same Model]                              │
│  [🔀 Try Different Model (Claude Sonnet)]                │
│  [⏱️  Wait 15 minutes]                                   │
│                                                           │
│  💡 Tip: Consider upgrading AI tier to avoid limits      │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Toast Notifications

### Success Toasts
```
┌─────────────────────────────────┐
│ ✅ Article approved and published│
│    "Best Online MBA Programs"    │
│    [View on WordPress →]  [×]   │
└─────────────────────────────────┘
Duration: 4 seconds, bottom-right
```

### Info Toasts
```
┌─────────────────────────────────┐
│ ℹ️  Auto-save enabled            │
│    Changes saved every 2 seconds│
│    [×]                          │
└─────────────────────────────────┘
Duration: 3 seconds, bottom-right
```

### Warning Toasts
```
┌─────────────────────────────────┐
│ ⚠️  Slow connection detected     │
│    Some features may be delayed │
│    [Switch to Offline Mode]     │
│    [×]                          │
└─────────────────────────────────┘
Duration: 6 seconds, bottom-right
```

### Error Toasts
```
┌─────────────────────────────────┐
│ ❌ Failed to delete article      │
│    Please try again              │
│    [Retry]  [×]                 │
└─────────────────────────────────┘
Duration: 8 seconds, bottom-right
```

---

## Implementation Notes

### Component Library Choices

**UI Framework:** React 18.2 + TailwindCSS 3.4
**Component Base:** Radix UI (headless, accessible)
**Icons:** Lucide React (consistent, tree-shakeable)
**Forms:** React Hook Form + Zod validation
**Routing:** React Router v7
**State:** React Query (server state) + Zustand (client state)
**Animations:** Framer Motion (complex) + TailwindCSS transitions (simple)
**Rich Text:** TipTap (extensible, modern)
**Drag & Drop:** dnd-kit (modern, accessible)

### Performance Budgets

**Initial Load:**
- HTML: < 14KB
- Critical CSS: < 14KB
- Critical JS: < 50KB (gzipped)
- Total: < 100KB (gzipped)
- Time to Interactive: < 3s (3G network)

**Page Metrics:**
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

### Browser Support

**Minimum Support:**
- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile: iOS Safari 14+, Chrome Android 90+

**Progressive Enhancement:**
- Core functionality: All browsers
- Advanced features: Modern browsers only
- Polyfills: Only if < 5% user impact

---

## Conclusion

This UX design prioritizes:

1. **Speed** - Sarah reviews 5-10 articles in under 30 minutes
2. **Clarity** - Status always visible, no confusion
3. **Power** - Keyboard shortcuts, bulk actions, advanced features
4. **Simplicity** - 80% of features accessible to beginners
5. **Delight** - Smooth animations, helpful feedback, smart defaults

The design supports both the simplified V2 workflow (questions → Grok → Perplexity → approve) while maintaining flexibility for experimentation with different pipelines.

**Next Steps:**
1. Create Figma mockups for visual review
2. Build component library (Storybook)
3. Implement Approval Queue first (80% of value)
4. Add Topics Manager
5. Add Settings/Pipeline config
6. User testing with Sarah

