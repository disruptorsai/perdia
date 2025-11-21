# Article Generation & Auto-Fix Gap Analysis

**Date:** 2025-11-20
**Purpose:** Compare PRD requirements against current Perdia implementation

---

## Executive Summary

**Current Status:** ✅ 75% Complete - Core pipeline functional, quality checks basic, auto-fix needs enhancement

**Missing Critical Features:**
1. H2 heading ID attribute validation and auto-generation
2. Image count validation
3. Keyword density and readability scoring
4. Multi-pass auto-fix with retry logic
5. Automated humanization in auto-fix
6. Table of contents auto-generation
7. Comprehensive pre-publish validation

---

## 1. Idea Generation & Initial Draft

### PRD Requirements vs Implementation

| Requirement | Status | Implementation | Gap |
|------------|--------|----------------|-----|
| **Topic Discovery** | ✅ Complete | `TopicDiscovery.jsx` - AI-powered search | None |
| **Article Wizard** | ✅ Complete | `ArticleWizard.jsx` - 3-step wizard | None |
| **Title Generation** | ✅ Complete | AI generates 3 SEO titles | None |
| **Content Generation** | ✅ Complete | `content-pipeline.js` Grok-2 → Perplexity | None |
| **Initial Cleaning** | ✅ Complete | Removes markdown fences, AI commentary | None |
| **Humanization** | ✅ Complete | Dedicated humanization prompt | None |
| **Final Cleaning** | ✅ Complete | Post-humanization cleanup | None |
| **Internet Context** | ✅ Complete | `add_context_from_internet: true` | None |

**Status:** ✅ **FULLY IMPLEMENTED**

---

## 2. Quality Checks & Validation

### PRD Requirements vs Implementation

| Requirement | Status | Implementation | Gap |
|------------|--------|----------------|-----|
| **Word Count** | ✅ Complete | `QualityChecklist.jsx:21` - 800+ words | None |
| **Internal Links** | ✅ Complete | `QualityChecklist.jsx:22` - 2+ links | None |
| **External Links** | ✅ Complete | `QualityChecklist.jsx:23` - 1+ links | None |
| **H2/H3 Headings** | ⚠️ Partial | Checks for H2 presence only | Missing H3 count |
| **H2 ID Attributes** | ❌ Missing | Not validated | **CRITICAL GAP** |
| **Image Count** | ❌ Missing | Not validated | **GAP** |
| **Schema Presence** | ✅ Complete | `QualityChecklist.jsx:55-62` - FAQ schema | None |
| **Keyword Density** | ❌ Missing | Conceptual only | **GAP** |
| **Readability Score** | ❌ Missing | Conceptual only | **GAP** |
| **Overall Score** | ✅ Complete | Percentage-based scoring | None |
| **Publishability Check** | ✅ Complete | Critical vs warning checks | None |

**Status:** ⚠️ **70% IMPLEMENTED** - Missing H2 IDs, images, keyword/readability

---

## 3. Content Improvement & Auto-Fix

### PRD Requirements vs Implementation

| Requirement | Status | Implementation | Gap |
|------------|--------|----------------|-----|
| **Issue Identification** | ✅ Complete | `ArticleEditor.jsx:162-172` | None |
| **Dynamic Prompt** | ✅ Complete | Multi-issue prompt construction | None |
| **Internal Links** | ✅ Complete | Uses `SiteArticle` context | None |
| **External Citations** | ✅ Complete | BLS, NCES, .gov guidance | None |
| **Word Count Expansion** | ⚠️ Partial | Basic expansion | Missing retry logic |
| **FAQ Generation** | ✅ Complete | Separate LLM call | None |
| **Post-AI Cleaning** | ✅ Complete | Removes meta-commentary | None |
| **Re-validation** | ❌ Missing | No re-check after fix | **CRITICAL GAP** |
| **Retry Logic** | ❌ Missing | Single-pass only | **CRITICAL GAP** |
| **Final Humanization** | ❌ Missing | Not in auto-fix | **GAP** |
| **Internet Context** | ❌ Missing | Auto-fix doesn't use | **GAP** |

**Status:** ⚠️ **60% IMPLEMENTED** - Missing retry, re-validation, humanization

---

## 4. Revision Management

### PRD Requirements vs Implementation

| Requirement | Status | Implementation | Gap |
|------------|--------|----------------|-----|
| **Feedback Tracking** | ⚠️ Partial | `ArticleRevision` entity exists | Not integrated in UI |
| **Comment System** | ❌ Missing | No UI implementation | **GAP** |
| **Revision History** | ❌ Missing | No UI implementation | **GAP** |
| **Reviewer Assignment** | ❌ Missing | No workflow | **GAP** |
| **Training Data** | ❌ Missing | `TrainingData` entity not used | **GAP** |

**Status:** ⚠️ **20% IMPLEMENTED** - Schema exists, no UI

---

## 5. Publishing Workflow

### PRD Requirements vs Implementation

| Requirement | Status | Implementation | Gap |
|------------|--------|----------------|-----|
| **Approved List** | ✅ Complete | `ApprovedArticles.jsx` | None |
| **WordPress Check** | ✅ Complete | Validates connection | None |
| **Publish Now** | ✅ Complete | Status update to published | None |
| **Schedule Publish** | ✅ Complete | `auto_publish_at` field | None |
| **API Integration** | ⚠️ Partial | Simulated in V1, real in V2 | Needs testing |

**Status:** ✅ **90% IMPLEMENTED** - WordPress integration needs verification

---

## Critical Gaps to Address

### 🔴 High Priority (Blocking Quality)

1. **H2 ID Attribute Validation & Auto-Generation**
   - **Current:** Not validated
   - **Required:** All H2 tags must have `id` attributes
   - **Solution:** Add to validation + auto-generate during article creation
   - **Files:** `QualityChecklist.jsx`, `content-pipeline.js`

2. **Auto-Fix Retry Logic**
   - **Current:** Single-pass improvement
   - **Required:** Re-validate after fix, retry if needed
   - **Solution:** Add validation loop with max 2 retries
   - **Files:** `ArticleEditor.jsx:144-310`

3. **Auto-Fix Re-Validation**
   - **Current:** No quality re-check after auto-fix
   - **Required:** Verify all issues resolved
   - **Solution:** Run quality check after improvement
   - **Files:** `ArticleEditor.jsx`

### 🟡 Medium Priority (Quality Enhancement)

4. **Automated H2 ID Generation in Pipeline**
   - **Current:** Manual/inconsistent
   - **Required:** Auto-generate during article creation
   - **Solution:** Add post-processing step in `content-pipeline.js`

5. **Final Humanization in Auto-Fix**
   - **Current:** Not included in auto-fix
   - **Required:** Humanize after all improvements
   - **Solution:** Add humanization step to auto-fix workflow

6. **Image Count Validation**
   - **Current:** Not validated
   - **Required:** Check for featured image + inline images
   - **Solution:** Add to quality checklist

7. **Keyword Density Calculation**
   - **Current:** Conceptual
   - **Required:** Actual calculation and scoring
   - **Solution:** Implement density algorithm

### 🟢 Low Priority (Nice-to-Have)

8. **Readability Score**
   - **Current:** Conceptual
   - **Required:** Flesch-Kincaid or similar
   - **Solution:** Use readability library

9. **Table of Contents Auto-Generation**
   - **Current:** Manual via `ArticleNavigationGenerator`
   - **Required:** Auto-insert during generation
   - **Solution:** Add to pipeline

10. **Revision Management UI**
    - **Current:** Schema only
    - **Required:** Full comment/feedback system
    - **Solution:** Build revision UI components

---

## Automation Checklist

### ✅ Already Automated
- [x] Topic discovery with AI
- [x] Title generation (3 options)
- [x] Article generation (Grok-2)
- [x] Fact-checking (Perplexity)
- [x] Image generation (Gemini)
- [x] SEO metadata extraction
- [x] Initial humanization
- [x] Word count calculation
- [x] Internal link counting
- [x] External link counting
- [x] FAQ schema validation
- [x] Overall quality scoring
- [x] Critical vs warning checks
- [x] Basic auto-fix (links, FAQs, content)

### ❌ NOT Automated (Must Add)
- [ ] H2 ID attribute generation
- [ ] H2 ID validation
- [ ] Image count validation
- [ ] Keyword density calculation
- [ ] Readability scoring
- [ ] Auto-fix retry on failure
- [ ] Auto-fix re-validation
- [ ] Auto-fix humanization pass
- [ ] Table of contents insertion
- [ ] H3 heading validation
- [ ] Internet context in auto-fix

---

## Implementation Plan

### Phase 1: Critical Fixes (Today)

1. **Add H2 ID Validation to Quality Checklist**
   - Update `QualityChecklist.jsx` to check for `id` attributes
   - Mark as critical check

2. **Implement H2 ID Auto-Generation in Pipeline**
   - Add post-processing to `content-pipeline.js`
   - Generate slug-based IDs from heading text

3. **Add Auto-Fix Retry Logic**
   - Implement validation loop in `ArticleEditor.jsx`
   - Max 2 retries with targeted prompts

4. **Add Auto-Fix Re-Validation**
   - Calculate quality after improvement
   - Display before/after comparison

### Phase 2: Quality Enhancements (Next)

5. **Add Final Humanization to Auto-Fix**
   - Include humanization step
   - Use same prompt as ArticleWizard

6. **Implement Image Validation**
   - Check featured image presence
   - Count inline images

7. **Add Keyword Density**
   - Calculate target keyword frequency
   - Score based on 1-3% density

8. **Add Readability Score**
   - Integrate readability library
   - Target 8th-10th grade level

### Phase 3: Advanced Features (Later)

9. **Auto-Generate Table of Contents**
   - Insert TOC in pipeline
   - Link to H2/H3 IDs

10. **Build Revision Management UI**
    - Comment system
    - Feedback tracking
    - Revision history

---

## Verification Checklist

After implementation, verify each step:

### Article Generation
- [ ] Topic analysis runs automatically
- [ ] Title options generated (3 minimum)
- [ ] Content generated with Grok-2
- [ ] Citations verified with Perplexity
- [ ] Featured image generated
- [ ] SEO metadata extracted
- [ ] H2 IDs auto-generated
- [ ] Content humanized
- [ ] All quality checks pass
- [ ] Article created with `in_review` status

### Quality Validation
- [ ] Word count >= 800
- [ ] Internal links >= 2
- [ ] External links >= 1
- [ ] H2 headings present
- [ ] All H2s have IDs
- [ ] FAQ schema (3+ questions)
- [ ] Featured image present
- [ ] Quality score calculated
- [ ] Publishability determined

### Auto-Fix
- [ ] Identifies all issues
- [ ] Builds comprehensive prompt
- [ ] Uses internet context
- [ ] Fixes all issues in one pass
- [ ] Re-validates quality
- [ ] Retries if needed (max 2x)
- [ ] Applies final humanization
- [ ] Updates article content
- [ ] Shows before/after metrics

### Publishing
- [ ] Quality check blocks if failing
- [ ] WordPress connection verified
- [ ] Article published successfully
- [ ] Status updated to `published`

---

## Cost & Performance

**Current Pipeline Cost:** ~$0.03-0.05 per article

**Performance:**
- Topic analysis: 1-2s
- Draft generation: 60-120s
- Fact-checking: 30-60s
- Image generation: 5-10s
- SEO extraction: 2-5s
- **Total:** 2-3 minutes per article

**Auto-Fix Cost:** ~$0.01-0.02 per fix

**Target:** 100+ articles/week = $3-7/week in AI costs

---

## Conclusion

**Current Implementation:** Strong foundation with core pipeline complete

**Priority Actions:**
1. Add H2 ID validation and auto-generation ⚠️
2. Implement auto-fix retry logic ⚠️
3. Add auto-fix re-validation ⚠️
4. Include humanization in auto-fix 🟡
5. Add image and keyword validation 🟡

**Timeline:** Phase 1 fixes can be completed today (2-3 hours)

