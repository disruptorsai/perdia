# PERDIA EDUCATION - MVP ACTION PLAN

**Generated:** 2025-11-06
**Target:** Launch-ready platform in 6-8 weeks
**Based On:** Client specifications + Gap analysis

---

## 🎯 MVP Definition

**Goal:** Operational AI-powered SEO content automation platform capable of:
- ✅ Generating 10-20 articles per day using 9 AI agents
- ✅ Managing 1000+ keywords with CSV import
- ✅ Publishing directly to WordPress automatically
- ✅ Tracking performance via Google Search Console/Analytics
- ✅ Operating in manual, semi-auto, or full-auto modes
- ✅ Content approval workflow for human oversight

**Out of Scope for MVP:**
- ❌ Image/infographic generation (Phase 2)
- ❌ Video generation (Phase 3)
- ❌ Site crawler and AI training (Phase 2)
- ❌ Internal linking automation (Phase 2)
- ❌ AI keyword suggestions (Phase 2)

---

## 📅 6-Week Sprint Plan

### Week 1: WordPress Integration Foundation
**Sprint Goal:** Connect to WordPress and publish first article

#### Day 1-2: WordPress API Client
- [ ] Research WordPress REST API documentation
- [ ] Get admin access to GetEducated.com
- [ ] Test API authentication and connection
- [ ] Build WordPress API client class
- [ ] Implement error handling and retries

**Deliverable:** Can authenticate and list existing posts

#### Day 3-4: Basic Publishing
- [ ] Implement create post endpoint
- [ ] Implement update post endpoint
- [ ] Test with sample content
- [ ] Handle images and media
- [ ] Validate post structure

**Deliverable:** Can publish simple post to WordPress

#### Day 5: Content Formatting
- [ ] Document GetEducated.com content structure
- [ ] Map content_queue fields to WordPress fields
- [ ] Handle HTML formatting
- [ ] Preserve meta descriptions
- [ ] Test with complex content

**Deliverable:** Can publish formatted articles matching site style

**Week 1 Milestone:** ✅ First AI-generated article published to WordPress via platform

---

### Week 2: WordPress Integration Complete
**Sprint Goal:** Full WordPress automation ready

#### Day 1-2: Advanced Publishing Features
- [ ] Multi-section content support
- [ ] Category and tag mapping
- [ ] Featured image handling
- [ ] Custom fields support
- [ ] Schema preservation

**Deliverable:** Can publish complex multi-section articles

#### Day 3-4: Update and Revision Workflow
- [ ] Implement post update logic
- [ ] Handle content revisions
- [ ] Preserve existing comments/metadata
- [ ] Conflict resolution
- [ ] Rollback capability

**Deliverable:** Can update existing WordPress posts

#### Day 5: WordPress UI Integration
- [ ] Update WordPressConnection page
- [ ] Add connection testing
- [ ] Display publishing status
- [ ] Show published post links
- [ ] Error reporting UI

**Deliverable:** Complete WordPress integration with UI

**Week 2 Milestone:** ✅ Fully functional WordPress publishing system

---

### Week 3: Keyword Management System
**Sprint Goal:** Manage 1000+ keywords efficiently

#### Day 1-2: CSV Import
- [ ] Build CSV parser
- [ ] Validate keyword data
- [ ] Bulk insert to database
- [ ] Handle duplicates
- [ ] Progress indicator

**Deliverable:** Can import 1000+ keywords from CSV

#### Day 2-3: Keyword Operations
- [ ] Bulk edit functionality
- [ ] Bulk status changes
- [ ] Priority updates
- [ ] Category assignment
- [ ] Bulk delete

**Deliverable:** Can manage keywords at scale

#### Day 4: Keyword Rotation Algorithm
- [ ] Design rotation logic
- [ ] Implement round-robin system
- [ ] Priority-based selection
- [ ] Status tracking
- [ ] Cycle history

**Deliverable:** Keywords rotate automatically through content generation

#### Day 5: Keyword UI Enhancements
- [ ] Advanced filtering
- [ ] Sorting options
- [ ] Search functionality
- [ ] Bulk selection UI
- [ ] Export to CSV

**Deliverable:** Complete keyword management UI

**Week 3 Milestone:** ✅ Keyword system supporting 1000+ keywords with rotation

---

### Week 4: Automation Controls
**Sprint Goal:** Manual, semi-auto, and full-auto modes operational

#### Day 1-2: Mode Selection & Logic
- [ ] Build automation_settings UI
- [ ] Implement manual mode (generate on demand)
- [ ] Implement semi-auto mode (generate + queue for approval)
- [ ] Implement full-auto mode (generate + auto-publish)
- [ ] Mode persistence and user preferences

**Deliverable:** Three automation modes functional

#### Day 3: Frequency Controls
- [ ] Articles per day limit
- [ ] Articles per week limit
- [ ] Hourly rate limiting
- [ ] Queue management
- [ ] Throttling logic

**Deliverable:** Can set generation frequency limits

#### Day 4: Scheduled Publishing
- [ ] Schedule post for future date/time
- [ ] Background job scheduler
- [ ] Schedule queue management
- [ ] Timezone handling
- [ ] Schedule cancellation

**Deliverable:** Can schedule articles for future publishing

#### Day 5: Automation Dashboard
- [ ] Display current automation mode
- [ ] Show generation queue
- [ ] Display scheduled posts
- [ ] Show daily/weekly limits
- [ ] Pause/resume controls

**Deliverable:** Complete automation control panel

**Week 4 Milestone:** ✅ Full automation modes with scheduling

---

### Week 5: Performance Dashboard (Part 1)
**Sprint Goal:** Google Search Console integration

#### Day 1-2: GSC API Setup
- [ ] Get Google Search Console API credentials
- [ ] Implement OAuth2 flow
- [ ] Test API connection
- [ ] Store credentials securely
- [ ] Handle token refresh

**Deliverable:** Connected to Google Search Console

#### Day 3-4: Metric Collection
- [ ] Fetch keyword rankings
- [ ] Fetch page impressions
- [ ] Fetch click data
- [ ] Store in performance_metrics table
- [ ] Automated daily collection

**Deliverable:** Daily metrics from GSC

#### Day 5: GSC Visualization
- [ ] Keyword ranking charts
- [ ] Impression trends
- [ ] Click-through rate graphs
- [ ] Top performing pages
- [ ] Ranking changes

**Deliverable:** GSC data visualized in dashboard

**Week 5 Milestone:** ✅ Google Search Console tracking operational

---

### Week 6: Performance Dashboard (Part 2) + Testing
**Sprint Goal:** Google Analytics + Comprehensive testing

#### Day 1-2: GA4 Integration
- [ ] Get Google Analytics API credentials
- [ ] Implement OAuth2 flow
- [ ] Fetch traffic data
- [ ] Fetch engagement metrics
- [ ] Store in database

**Deliverable:** Google Analytics data collection

#### Day 2-3: Analytics Visualization
- [ ] Traffic trends charts
- [ ] New vs. returning visitors
- [ ] Engagement metrics
- [ ] Conversion tracking (if available)
- [ ] Traffic sources

**Deliverable:** Complete performance dashboard

#### Day 4-5: End-to-End Testing
- [ ] Test keyword import
- [ ] Test content generation with all 9 agents
- [ ] Test WordPress publishing
- [ ] Test automation modes
- [ ] Test scheduled publishing
- [ ] Test performance tracking
- [ ] Test approval workflow

**Deliverable:** Fully tested MVP

**Week 6 Milestone:** ✅ MVP COMPLETE - Ready for launch

---

## 🔧 Technical Implementation Details

### 1. WordPress Integration

#### WordPress API Client (`src/lib/wordpress-client.js`)

```javascript
import axios from 'axios';

export class WordPressClient {
  constructor(siteUrl, username, applicationPassword) {
    this.baseUrl = `${siteUrl}/wp-json/wp/v2`;
    this.auth = {
      username,
      password: applicationPassword
    };
  }

  // Authenticate and test connection
  async testConnection() {
    try {
      const response = await axios.get(`${this.baseUrl}/users/me`, {
        auth: this.auth
      });
      return { success: true, user: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Create new post
  async createPost({ title, content, status = 'draft', categories = [], tags = [], featuredImage = null, meta = {} }) {
    const postData = {
      title,
      content,
      status, // 'draft', 'publish', 'future'
      categories,
      tags,
      featured_media: featuredImage,
      meta
    };

    const response = await axios.post(`${this.baseUrl}/posts`, postData, {
      auth: this.auth
    });

    return response.data;
  }

  // Update existing post
  async updatePost(postId, updates) {
    const response = await axios.post(`${this.baseUrl}/posts/${postId}`, updates, {
      auth: this.auth
    });
    return response.data;
  }

  // Get post by ID
  async getPost(postId) {
    const response = await axios.get(`${this.baseUrl}/posts/${postId}`, {
      auth: this.auth
    });
    return response.data;
  }

  // Upload media
  async uploadMedia(file, altText) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt_text', altText);

    const response = await axios.post(`${this.baseUrl}/media`, formData, {
      auth: this.auth,
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response.data;
  }
}
```

#### Integration with Content Queue

```javascript
// src/lib/perdia-sdk.js - Add WordPress publishing method

export const ContentQueue = {
  // ... existing methods ...

  async publishToWordPress(contentId) {
    // Get content item
    const content = await ContentQueue.findOne({ id: contentId });

    // Get WordPress connection
    const wpConnection = await WordPressConnection.findOne({ user_id: content.user_id });

    // Initialize WordPress client
    const wpClient = new WordPressClient(
      wpConnection.site_url,
      wpConnection.username,
      wpConnection.application_password
    );

    // Publish
    const wpPost = await wpClient.createPost({
      title: content.title,
      content: content.content,
      status: 'publish',
      categories: [/* map categories */],
      meta: {
        description: content.meta_description
      }
    });

    // Update content queue with WordPress details
    await ContentQueue.update(contentId, {
      status: 'published',
      wordpress_post_id: wpPost.id,
      wordpress_url: wpPost.link,
      published_date: new Date()
    });

    return wpPost;
  }
};
```

### 2. Keyword CSV Import

#### CSV Parser (`src/lib/csv-parser.js`)

```javascript
export async function parseKeywordCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());

      const keywords = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = lines[i].split(',').map(v => v.trim());
        const keyword = {};

        headers.forEach((header, index) => {
          keyword[header] = values[index];
        });

        // Validate and normalize
        if (keyword.keyword) {
          keywords.push({
            keyword: keyword.keyword,
            list_type: keyword.list_type || 'new_target',
            search_volume: parseInt(keyword.search_volume) || 0,
            difficulty: parseInt(keyword.difficulty) || 0,
            category: keyword.category || null,
            priority: parseInt(keyword.priority) || 3,
            status: 'queued'
          });
        }
      }

      resolve(keywords);
    };

    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Bulk import with progress
export async function importKeywords(keywords, userId, onProgress) {
  const batchSize = 100;
  const batches = [];

  for (let i = 0; i < keywords.length; i += batchSize) {
    batches.push(keywords.slice(i, i + batchSize));
  }

  let imported = 0;
  const errors = [];

  for (const batch of batches) {
    try {
      // Add user_id to each keyword
      const withUserId = batch.map(k => ({ ...k, user_id: userId }));

      // Bulk insert
      await Keyword.createMany(withUserId);

      imported += batch.length;
      onProgress?.(imported, keywords.length);
    } catch (error) {
      errors.push({ batch, error: error.message });
    }
  }

  return { imported, errors };
}
```

### 3. Automation Mode Logic

#### Automation Controller (`src/lib/automation-controller.js`)

```javascript
export class AutomationController {
  constructor(userId) {
    this.userId = userId;
  }

  async getSettings() {
    return await AutomationSettings.findOne({ user_id: this.userId });
  }

  async generateContent(keywordId, mode = 'manual') {
    const keyword = await Keyword.findOne({ id: keywordId });
    const settings = await this.getSettings();

    // Check rate limits
    if (!await this.checkRateLimits(settings)) {
      throw new Error('Rate limit exceeded');
    }

    // Generate content using AI
    const content = await this.generateWithAI(keyword);

    // Create in content queue
    const queueItem = await ContentQueue.create({
      user_id: this.userId,
      title: content.title,
      content: content.body,
      content_type: 'new_article',
      status: this.getInitialStatus(mode),
      target_keywords: [keyword.keyword],
      word_count: content.wordCount,
      meta_description: content.metaDescription,
      automation_mode: mode,
      agent_name: 'seo_content_writer'
    });

    // Auto-publish if full-auto mode
    if (mode === 'full_auto' && settings.auto_publish_enabled) {
      await this.publishContent(queueItem.id);
    }

    // Update keyword status
    await Keyword.update(keywordId, { status: 'completed' });

    return queueItem;
  }

  getInitialStatus(mode) {
    switch (mode) {
      case 'manual':
        return 'draft';
      case 'semi_auto':
        return 'pending_review';
      case 'full_auto':
        return 'approved';
      default:
        return 'draft';
    }
  }

  async checkRateLimits(settings) {
    // Check daily limit
    const today = new Date().toISOString().split('T')[0];
    const todayCount = await ContentQueue.count({
      user_id: this.userId,
      created_date: { gte: today }
    });

    if (todayCount >= settings.max_articles_per_day) {
      return false;
    }

    // Check weekly limit
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekCount = await ContentQueue.count({
      user_id: this.userId,
      created_date: { gte: weekAgo.toISOString() }
    });

    if (weekCount >= settings.max_articles_per_week) {
      return false;
    }

    return true;
  }

  async publishContent(contentId) {
    // Publish to WordPress
    await ContentQueue.publishToWordPress(contentId);
  }
}
```

### 4. Performance Tracking

#### Google Search Console Integration (`src/lib/gsc-client.js`)

```javascript
import { google } from 'googleapis';

export class GSCClient {
  constructor(credentials) {
    this.auth = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri
    );

    this.auth.setCredentials({
      refresh_token: credentials.refreshToken
    });

    this.searchconsole = google.searchconsole({ version: 'v1', auth: this.auth });
  }

  async getKeywordData(siteUrl, keyword, startDate, endDate) {
    const response = await this.searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query', 'page'],
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'query',
            expression: keyword,
            operator: 'contains'
          }]
        }]
      }
    });

    return response.data.rows || [];
  }

  async collectDailyMetrics(siteUrl, userId) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    // Get all keywords for user
    const keywords = await Keyword.find({ user_id: userId });

    // Collect metrics for each keyword
    for (const keyword of keywords) {
      try {
        const data = await this.getKeywordData(siteUrl, keyword.keyword, dateStr, dateStr);

        if (data.length > 0) {
          await PerformanceMetric.create({
            user_id: userId,
            keyword_id: keyword.id,
            date: dateStr,
            impressions: data[0].impressions,
            clicks: data[0].clicks,
            ctr: data[0].ctr,
            position: data[0].position,
            source: 'google_search_console'
          });
        }
      } catch (error) {
        console.error(`Error collecting metrics for ${keyword.keyword}:`, error);
      }
    }
  }
}
```

---

## 🧪 Testing Plan

### Week 6: Comprehensive Testing

#### 1. Keyword Management Tests
- [ ] Import CSV with 100 keywords
- [ ] Import CSV with 1000+ keywords
- [ ] Verify all fields parsed correctly
- [ ] Test duplicate handling
- [ ] Test bulk edit operations
- [ ] Test keyword rotation algorithm

#### 2. Content Generation Tests
- [ ] Generate article with each of 9 agents
- [ ] Verify content quality and length
- [ ] Test keyword integration
- [ ] Test meta description generation
- [ ] Test different content types

#### 3. WordPress Publishing Tests
- [ ] Publish simple article
- [ ] Publish article with images
- [ ] Publish article with multiple sections
- [ ] Update existing article
- [ ] Test error handling (invalid credentials)
- [ ] Verify post structure matches site

#### 4. Automation Mode Tests
- [ ] Test manual mode (generate on demand)
- [ ] Test semi-auto mode (generate + queue)
- [ ] Test full-auto mode (generate + publish)
- [ ] Test rate limiting (daily/weekly)
- [ ] Test pause/resume
- [ ] Test scheduled publishing

#### 5. Performance Tracking Tests
- [ ] Verify GSC connection
- [ ] Collect sample metrics
- [ ] Verify data accuracy
- [ ] Test visualization charts
- [ ] Test historical data retrieval

#### 6. Workflow Tests
- [ ] Complete end-to-end workflow:
  1. Import keywords
  2. Generate content (manual mode)
  3. Review in approval queue
  4. Approve content
  5. Publish to WordPress
  6. Track performance
- [ ] Test with multiple users
- [ ] Test concurrent operations

#### 7. UI/UX Tests
- [ ] All pages load correctly
- [ ] Navigation works
- [ ] Forms validate properly
- [ ] Error messages clear
- [ ] Loading states appropriate
- [ ] Responsive on mobile/tablet

---

## 🚀 Deployment Checklist

### Pre-Launch

- [ ] All MVP features tested and working
- [ ] Database migrations applied to production
- [ ] Environment variables configured in Netlify
- [ ] WordPress connection tested with GetEducated.com
- [ ] Google API credentials configured
- [ ] 9 AI agents seeded in production database
- [ ] Cost monitoring enabled

### Launch Day

- [ ] Deploy to production
- [ ] Smoke test all critical features
- [ ] Import initial keyword list
- [ ] Generate first test article
- [ ] Publish first article to WordPress
- [ ] Monitor error logs
- [ ] Monitor API costs

### Post-Launch (Week 1)

- [ ] Daily monitoring of:
  - Content generation rate
  - Publishing success rate
  - API costs
  - Error rates
  - User feedback
- [ ] Generate first 10 articles
- [ ] Verify WordPress integration stable
- [ ] Collect initial performance metrics
- [ ] Gather user feedback from Kaylee/Sarah

### Post-Launch (Week 2-4)

- [ ] Scale up to 20-30 articles per week
- [ ] Monitor quality and accuracy
- [ ] Adjust AI prompts as needed
- [ ] Begin planning Phase 2 features
- [ ] Collect ROI data

---

## 📊 Success Metrics

### MVP Launch KPIs

**Technical:**
- ✅ 99% uptime
- ✅ < 3 second page load times
- ✅ < 5% error rate
- ✅ WordPress publishing success rate > 95%

**Functional:**
- ✅ Generate 10-20 articles per day
- ✅ Import and manage 1000+ keywords
- ✅ All 9 AI agents operational
- ✅ Automation modes working
- ✅ Performance tracking active

**Business:**
- ✅ 50% reduction in manual content creation time
- ✅ Content approval rate > 80% (minimal edits)
- ✅ Cost per article < $10
- ✅ User satisfaction (Kaylee/Sarah feedback positive)

### Phase 1 Target (Weeks 7-12)

**Scale:**
- ✅ 100+ articles per week
- ✅ 90% content approval rate
- ✅ Full-auto mode handling 70%+ of content

**Impact:**
- ✅ Traffic increase of 20-30%
- ✅ New pages indexed by Google
- ✅ Keyword rankings improving

---

## 💰 Budget & Resources

### Development Team (Weeks 1-6)

**Minimum Team:**
- 1 Full-stack developer (40 hrs/week x 6 weeks = 240 hours)
- 1 QA/Testing (20 hrs/week x 2 weeks = 40 hours)

**Ideal Team:**
- 2 Full-stack developers (80 hrs/week x 6 weeks = 480 hours)
- 1 QA/Testing (20 hrs/week x 2 weeks = 40 hours)

### API Costs (Monthly)

**MVP Phase:**
- Supabase: $25/month (Pro plan)
- Claude API: ~$50-100/month (10-20 articles/day)
- OpenAI API: ~$20-50/month (secondary + images)
- Google APIs: Free (under limits)
- **Total: ~$95-175/month**

**Scale Phase (100+ articles/week):**
- Supabase: $25/month
- Claude API: ~$200-400/month
- OpenAI API: ~$50-100/month
- Google APIs: Free
- **Total: ~$275-525/month**

---

## 🎯 Next Steps

### This Week (Week 0 - Planning)

**Monday-Tuesday:**
- [ ] Review this action plan with client
- [ ] Get priority confirmation
- [ ] Secure WordPress admin access
- [ ] Set up Google API access
- [ ] Allocate development resources

**Wednesday-Thursday:**
- [ ] Set up development sprints
- [ ] Create detailed task tickets
- [ ] Begin WordPress API research
- [ ] Document GetEducated.com structure
- [ ] Prepare development environment

**Friday:**
- [ ] Sprint kickoff meeting
- [ ] Begin Week 1 development
- [ ] WordPress API client first commit

### Start of Week 1 (Development Begins)

- Development team begins WordPress integration
- Daily standup meetings
- Progress tracking
- Blocker identification and resolution

---

**Document Owner:** Development Team Lead
**Review Frequency:** Weekly during MVP development
**Last Updated:** 2025-11-06
**Status:** Ready for execution
