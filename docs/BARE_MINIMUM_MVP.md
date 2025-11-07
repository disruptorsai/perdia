# PERDIA EDUCATION - BARE MINIMUM MVP

**Generated:** 2025-11-06
**Authority:** Client specifications in `perdia Software Specifications.md`
**Goal:** Get to **6-8 pages/day + 2-3 new articles/day** as fast as possible

---

## 🎯 Bare Minimum MVP Definition

**What the client actually needs to start:**
> Generate AI content and get it published to WordPress with minimal friction

**NOT trying to build:**
- ❌ Fully autonomous system (that's 6-12 months out)
- ❌ Perfect automation
- ❌ Advanced features

**IS trying to build:**
- ✅ AI generates content
- ✅ Human reviews/edits it
- ✅ One-click publish to WordPress
- ✅ Track basic metrics

---

## 📋 Core User Journey (Day 1 User)

```
1. User logs in
2. User adds target keywords (paste or type, maybe CSV later)
3. User clicks "Generate Article" for a keyword
4. AI generates 1500-2500 word article
5. User reviews article in editor
6. User clicks "Publish to WordPress"
7. Article appears on GetEducated.com
8. Repeat 6-8 times per day
```

That's it. That's the MVP.

---

## ✅ What MUST Work (Non-Negotiable)

### 1. AI Content Generation ✅ ALREADY WORKS
**Status:** 95% complete

**What exists:**
- ✅ 9 AI agents configured
- ✅ Claude Sonnet 4.5 integration
- ✅ Agent conversation system
- ✅ Can generate content right now

**What's needed:**
- [ ] Simple "Generate" button on keyword
- [ ] Show generation progress
- [ ] Display generated content in editor

**Effort:** 1 day

---

### 2. Content Editor & Review 🟡 PARTIAL
**Status:** 70% complete

**What exists:**
- ✅ ContentLibrary page
- ✅ Content queue table
- ✅ Rich text display
- ⚠️ No editing capability

**What's needed:**
- [ ] Add simple content editor (React Quill already installed)
- [ ] Save edits to database
- [ ] Basic formatting (bold, italic, headings, links)

**Effort:** 2 days

---

### 3. WordPress Publishing ❌ MISSING
**Status:** 0% complete

**What's needed:**
- [ ] WordPress REST API client
- [ ] Connection setup page (URL + credentials)
- [ ] "Publish" button
- [ ] Create post via API
- [ ] Show success/error message
- [ ] Store WordPress post ID

**Effort:** 3-4 days

---

### 4. Basic Keyword Management 🟡 PARTIAL
**Status:** 60% complete

**What exists:**
- ✅ Keywords table
- ✅ KeywordManager page
- ✅ Can view keywords
- ⚠️ Manual entry only (no CSV yet)

**What's needed:**
- [ ] Add keyword form (simple text input)
- [ ] Bulk add (paste multiple keywords, one per line)
- [ ] Delete keywords
- [ ] Mark keyword as "used"

**Effort:** 1 day

**CSV import:** Phase 2 (not needed for Day 1)

---

### 5. Authentication ✅ ALREADY WORKS
**Status:** 100% complete

**What exists:**
- ✅ Supabase Auth
- ✅ Login page
- ✅ RLS policies
- ✅ User sessions

**What's needed:**
- Nothing. Already works.

**Effort:** 0 days

---

## ❌ What Can Wait (Phase 2)

### NOT Needed for MVP:
- ❌ CSV import (can add keywords manually for now)
- ❌ Automation modes (manual/semi-auto/full-auto) - just do manual first
- ❌ Scheduled publishing - publish immediately
- ❌ Frequency controls - trust humans to pace themselves
- ❌ Performance dashboard - use Google Analytics directly
- ❌ Google Search Console integration - not needed Day 1
- ❌ Image generation - use stock photos or skip images
- ❌ Site crawler - not needed to start generating
- ❌ Internal linking - can add manually
- ❌ Keyword rotation algorithm - humans pick keywords
- ❌ Approval workflow - single user for now, they approve themselves
- ❌ Team collaboration - one user initially
- ❌ Infographics/videos - Phase 3

**Why these can wait:**
- They're optimization features
- Don't block core content generation → publish workflow
- Can be added once the basics work

---

## 🏗️ Implementation: 5-Day Sprint

### Day 1: Content Generation UI
**Goal:** Click "Generate" and see AI content

**Tasks:**
- [ ] Add "Generate Article" button to KeywordManager
- [ ] Show loading spinner during generation
- [ ] Call AI agent with keyword
- [ ] Save to content_queue
- [ ] Show success message
- [ ] Redirect to content editor

**Deliverable:** Can generate article from keyword

---

### Day 2: Content Editor
**Goal:** Edit generated content before publishing

**Tasks:**
- [ ] Add React Quill editor to ContentLibrary
- [ ] Load content from content_queue
- [ ] Save edits to database
- [ ] Add title editing
- [ ] Add meta description editing
- [ ] Add basic formatting toolbar

**Deliverable:** Can edit AI-generated content

---

### Day 3: WordPress Connection Setup
**Goal:** Connect to GetEducated.com WordPress

**Tasks:**
- [ ] Create WordPressConnection page form
- [ ] Store WordPress URL, username, app password
- [ ] Test connection to WordPress API
- [ ] Show connection status
- [ ] Handle authentication errors

**Deliverable:** Connected to WordPress

---

### Day 4: WordPress Publishing
**Goal:** Publish content to WordPress with one click

**Tasks:**
- [ ] Build WordPress API client
- [ ] Add "Publish" button to content editor
- [ ] Create post via WordPress REST API
- [ ] Handle success/failure
- [ ] Update content_queue with WordPress post ID
- [ ] Show link to published post
- [ ] Handle errors gracefully

**Deliverable:** Can publish to WordPress

---

### Day 5: Polish & Testing
**Goal:** Make sure it all works end-to-end

**Tasks:**
- [ ] End-to-end test: keyword → generate → edit → publish
- [ ] Fix bugs
- [ ] Add error messages
- [ ] Add loading states
- [ ] Improve UX
- [ ] Test with real GetEducated.com content

**Deliverable:** Working MVP

---

## 📐 MVP Architecture (Simplified)

```
┌─────────────────────────────────────────────┐
│           PERDIA MVP FLOW                   │
└─────────────────────────────────────────────┘

1. USER ADDS KEYWORDS
   ┌──────────────────┐
   │ KeywordManager   │
   │ - Add keyword    │
   │ - List keywords  │
   └──────────────────┘
            │
            ▼
2. USER GENERATES CONTENT
   ┌──────────────────┐
   │ AI Agent         │
   │ (Claude Sonnet)  │
   │ - Generate 1500+ │
   │   word article   │
   └──────────────────┘
            │
            ▼
3. USER EDITS CONTENT
   ┌──────────────────┐
   │ Content Editor   │
   │ (React Quill)    │
   │ - Edit text      │
   │ - Edit title     │
   │ - Edit meta      │
   └──────────────────┘
            │
            ▼
4. USER PUBLISHES
   ┌──────────────────┐
   │ WordPress API    │
   │ - Create post    │
   │ - Return URL     │
   └──────────────────┘
            │
            ▼
5. DONE
   Article live on GetEducated.com
```

**Data Flow:**
```
keywords table
    ↓
AI generates content
    ↓
content_queue table
    ↓
User edits
    ↓
content_queue updated
    ↓
WordPress API
    ↓
wordpress_post_id stored
```

---

## 🛠️ Technical Implementation

### Required Code Changes

#### 1. Add "Generate" Button to KeywordManager

```jsx
// src/pages/KeywordManager.jsx

import { useState } from 'react';
import { Keyword, ContentQueue } from '@/lib/perdia-sdk';
import { agentSDK } from '@/lib/agent-sdk';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function KeywordManager() {
  const [generating, setGenerating] = useState(null);

  const handleGenerate = async (keyword) => {
    setGenerating(keyword.id);

    try {
      // Create conversation with SEO content writer agent
      const conversation = await agentSDK.createConversation({
        agent_name: 'seo_content_writer',
        initial_message: `Write a comprehensive 1500-2500 word SEO-optimized article about "${keyword.keyword}".

Target audience: People researching online education options.
Tone: Professional, helpful, informative.
Include: Introduction, key sections with H2/H3 headings, conclusion, and compelling meta description.`
      });

      // Get the AI response
      const content = conversation.messages[1].content; // AI's response

      // Parse content (assuming structured output)
      const article = parseArticleContent(content);

      // Save to content queue
      const queueItem = await ContentQueue.create({
        title: article.title,
        content: article.body,
        content_type: 'new_article',
        status: 'draft',
        target_keywords: [keyword.keyword],
        word_count: article.wordCount,
        meta_description: article.metaDescription,
        agent_name: 'seo_content_writer'
      });

      // Mark keyword as in progress
      await Keyword.update(keyword.id, { status: 'in_progress' });

      // Redirect to content editor
      navigate(`/content/edit/${queueItem.id}`);

    } catch (error) {
      console.error('Generation failed:', error);
      toast.error('Failed to generate content');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div>
      {/* Keywords list */}
      {keywords.map(keyword => (
        <div key={keyword.id}>
          <span>{keyword.keyword}</span>
          <Button
            onClick={() => handleGenerate(keyword)}
            disabled={generating === keyword.id}
          >
            {generating === keyword.id ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Article'
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}
```

#### 2. WordPress API Client

```javascript
// src/lib/wordpress-client.js

import axios from 'axios';

export class WordPressClient {
  constructor(siteUrl, username, applicationPassword) {
    this.baseUrl = `${siteUrl}/wp-json/wp/v2`;
    this.auth = {
      username,
      password: applicationPassword
    };
  }

  async testConnection() {
    try {
      const response = await axios.get(`${this.baseUrl}/users/me`, {
        auth: this.auth
      });
      return { success: true, user: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async createPost({ title, content, status = 'publish', meta_description = '' }) {
    try {
      const postData = {
        title,
        content,
        status,
        excerpt: meta_description,
        meta: {
          description: meta_description
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/posts`,
        postData,
        { auth: this.auth }
      );

      return {
        success: true,
        postId: response.data.id,
        url: response.data.link
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}
```

#### 3. Publish Button in Content Editor

```jsx
// src/pages/ContentEditor.jsx

import { useState, useEffect } from 'react';
import { ContentQueue, WordPressConnection } from '@/lib/perdia-sdk';
import { WordPressClient } from '@/lib/wordpress-client';
import { Button } from '@/components/ui/button';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function ContentEditor({ contentId }) {
  const [content, setContent] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    loadContent();
  }, [contentId]);

  const loadContent = async () => {
    const item = await ContentQueue.findOne({ id: contentId });
    setContent(item);
    setTitle(item.title);
    setBody(item.content);
    setMetaDescription(item.meta_description || '');
  };

  const handleSave = async () => {
    await ContentQueue.update(contentId, {
      title,
      content: body,
      meta_description: metaDescription
    });
    toast.success('Saved');
  };

  const handlePublish = async () => {
    setPublishing(true);

    try {
      // Save first
      await handleSave();

      // Get WordPress connection
      const wpConn = await WordPressConnection.findOne({
        user_id: content.user_id
      });

      if (!wpConn) {
        toast.error('Please connect WordPress first');
        return;
      }

      // Initialize WordPress client
      const wpClient = new WordPressClient(
        wpConn.site_url,
        wpConn.username,
        wpConn.application_password
      );

      // Publish
      const result = await wpClient.createPost({
        title,
        content: body,
        status: 'publish',
        meta_description: metaDescription
      });

      if (result.success) {
        // Update content queue
        await ContentQueue.update(contentId, {
          status: 'published',
          wordpress_post_id: result.postId,
          wordpress_url: result.url,
          published_date: new Date()
        });

        toast.success('Published!');
        window.open(result.url, '_blank'); // Open published post
      } else {
        toast.error(`Publish failed: ${result.error}`);
      }

    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Article</h1>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        {/* Meta Description */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Meta Description (155 chars)
          </label>
          <textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            maxLength={155}
            rows={2}
            className="w-full px-3 py-2 border rounded"
          />
          <p className="text-sm text-gray-500 mt-1">
            {metaDescription.length}/155 characters
          </p>
        </div>

        {/* Content Editor */}
        <div>
          <label className="block text-sm font-medium mb-2">Content</label>
          <ReactQuill
            value={body}
            onChange={setBody}
            modules={{
              toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'header': [2, 3, false] }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link'],
                ['clean']
              ]
            }}
            className="bg-white"
            style={{ height: '500px', marginBottom: '50px' }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-8">
          <Button onClick={handleSave} variant="outline">
            Save Draft
          </Button>
          <Button
            onClick={handlePublish}
            disabled={publishing}
            className="bg-green-600 hover:bg-green-700"
          >
            {publishing ? 'Publishing...' : 'Publish to WordPress'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ MVP Success Criteria

### Technical Checklist
- [ ] User can add keywords manually
- [ ] User can click "Generate" on a keyword
- [ ] AI generates 1500+ word article in < 30 seconds
- [ ] User can edit title, content, meta description
- [ ] User can save drafts
- [ ] User can publish to WordPress with one click
- [ ] Published post appears on GetEducated.com
- [ ] System stores WordPress post ID and URL
- [ ] Error messages are clear and helpful

### Business Checklist
- [ ] User can generate 6-8 articles in a day
- [ ] Content quality requires minimal editing
- [ ] Publishing takes < 30 seconds
- [ ] No manual WordPress admin needed
- [ ] Reduces content creation time by 50%+

### User Acceptance
- [ ] Kaylee/Sarah can use it without training
- [ ] Workflow is intuitive
- [ ] Faster than current manual process
- [ ] Content quality meets expectations

---

## 🚀 Launch Plan

### Week 1: Development (5 days)
- Days 1-5: Build as described above
- Focus: Get it working, not perfect

### Week 2: Testing & Refinement (3 days)
- Day 6: Internal testing
- Day 7: Fix critical bugs
- Day 8: User acceptance testing with Kaylee/Sarah

### Week 2: Launch (2 days)
- Day 9: Deploy to production
- Day 10: First 5 real articles generated and published

### Week 3-4: Usage & Feedback
- Generate 6-8 articles per day
- Collect feedback
- Fix issues
- Plan Phase 2 features

---

## 📊 What This Gets You

**Immediate Value:**
- ✅ 6-8 optimized pages per day
- ✅ 2-3 new articles per day
- ✅ 50% reduction in content creation time
- ✅ Consistent quality
- ✅ One-click publishing

**What It Proves:**
- ✅ AI can generate quality content
- ✅ WordPress integration works
- ✅ Workflow is viable
- ✅ ROI is positive

**Foundation for Phase 2:**
- ✅ Core workflow established
- ✅ Users trained on system
- ✅ Can add automation on top
- ✅ Can add advanced features

---

## 💡 Why This Is The Right MVP

### What Makes This "Minimal"
1. **No CSV import** - Add keywords manually (10 seconds each)
2. **No automation modes** - Manual only for now
3. **No scheduling** - Publish immediately
4. **No performance tracking** - Use Google Analytics directly
5. **No image generation** - Skip images or use stock photos
6. **No advanced features** - Just content generation + publishing

### What Makes This "Viable"
1. **Solves core problem** - Get AI content onto website
2. **Saves time** - Faster than manual writing
3. **Actually usable** - Simple, clear workflow
4. **Proves value** - Can measure time savings immediately
5. **Foundation for growth** - Can build on top of this

### What Makes This "Product"
1. **Complete workflow** - Keyword → Generate → Edit → Publish
2. **Production quality** - Works with real website
3. **User-friendly** - No technical knowledge needed
4. **Reliable** - Error handling, saves work
5. **Measurable** - Can track articles generated

---

## 🎯 Next Steps

### Today (Day 0)
- [ ] Review this MVP plan
- [ ] Get approval on scope
- [ ] Confirm WordPress access available
- [ ] Assign developer(s)

### Tomorrow (Day 1)
- [ ] Start development
- [ ] Generation UI (Day 1 task)
- [ ] Daily standup

### This Week
- [ ] Complete Days 1-5 tasks
- [ ] Daily progress updates
- [ ] Fix blockers immediately

### Next Week
- [ ] Testing
- [ ] Refinement
- [ ] Launch

---

## 📝 Phase 2 Planning (After MVP Works)

Once the MVP is working and generating 6-8 articles/day, THEN add:

**Phase 2A (Weeks 3-4):**
- CSV keyword import
- Bulk operations
- Basic automation (schedule publishing)

**Phase 2B (Weeks 5-6):**
- Performance dashboard
- Google Search Console integration
- Keyword rotation

**Phase 2C (Weeks 7-8):**
- Image generation
- Automation modes (semi-auto, full-auto)
- Frequency controls

**Phase 3 (Months 3-6):**
- Site crawler
- Internal linking
- Advanced features from specs

---

**Document Version:** 1.0
**Status:** Ready for Development
**Timeline:** 5 days to working MVP
**Next Review:** After MVP launch

---

*This is the absolute minimum to get value. Start here. Add features once this works.*
