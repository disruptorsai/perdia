# End-to-End Testing Guide - Perdia MVP

**Date:** 2025-11-07
**Test Environment:** http://localhost:5173/
**Status:** Ready for Testing
**Estimated Time:** 2-3 hours

---

## 🎯 Testing Objectives

Verify the complete MVP workflow works flawlessly:
1. Keyword management (CSV import)
2. DataForSEO keyword data fetching
3. AI article generation
4. Content editing with auto-save
5. WordPress connection testing
6. WordPress publishing
7. Error handling scenarios

---

## ✅ Pre-Testing Checklist

Before starting tests, verify:

- [x] Dev server running at http://localhost:5173/
- [ ] Supabase connection working
- [ ] Authentication working (can login)
- [ ] Database has test data (keywords, content)
- [ ] Environment variables configured:
  - [ ] VITE_SUPABASE_URL
  - [ ] VITE_SUPABASE_ANON_KEY
  - [ ] VITE_ANTHROPIC_API_KEY
  - [ ] VITE_DATAFORSEO_LOGIN
  - [ ] VITE_DATAFORSEO_PASSWORD
- [ ] WordPress test site available (optional but recommended)

---

## 📋 Test Scenarios

### Test 1: Authentication & Access

**Goal:** Verify users can login and access protected routes

**Steps:**
1. Open http://localhost:5173/
2. If redirected to /login, enter credentials
3. Verify redirect to /dashboard
4. Check all navigation links work
5. Verify protected routes require auth

**Expected Results:**
- ✅ Login page loads without errors
- ✅ Can login with valid credentials
- ✅ Redirects to dashboard after login
- ✅ All menu items are clickable
- ✅ Cannot access protected routes without login

**Actual Results:**
- [ ] PASS / [ ] FAIL
- Notes: _______________

---

### Test 2: Keyword CSV Import

**Goal:** Verify CSV import works correctly

**Test Data:** Create a test CSV file named `test-keywords.csv`:
```csv
keyword,search_volume,difficulty,category
online mba programs,12000,65,degree-programs
best online colleges,8900,72,colleges
nursing degree online,5400,58,nursing
teaching certificate online,3200,45,education
```

**Steps:**
1. Navigate to /keywords
2. Click "Upload CSV" under "Currently Ranked" tab
3. Select test-keywords.csv
4. Wait for upload to complete

**Expected Results:**
- ✅ Upload button is visible
- ✅ File selection dialog opens
- ✅ CSV uploads without errors
- ✅ Success toast shows "4 keywords imported"
- ✅ Keywords appear in table
- ✅ All columns populated (keyword, volume, difficulty, category)

**Actual Results:**
- [ ] PASS / [ ] FAIL
- Keywords imported: ___
- Notes: _______________

---

### Test 3: DataForSEO Keyword Data Fetch

**Goal:** Verify DataForSEO integration works

**Prerequisites:**
- Keywords imported from Test 2
- DataForSEO credentials in .env.local

**Steps:**
1. Stay on /keywords page
2. Find first keyword in table
3. Click "Get Data" button (blue outlined button)
4. Wait for API call to complete
5. Check toast notification
6. Verify keyword data updated in table

**Expected Results:**
- ✅ "Get Data" button visible on each row
- ✅ Button shows loading state (spinner, "Fetching...")
- ✅ Loading toast appears
- ✅ Success toast shows volume and CPC
- ✅ Table refreshes with new data
- ✅ Search volume updated
- ✅ Difficulty updated
- ✅ No errors in console

**Actual Results:**
- [ ] PASS / [ ] FAIL
- Search volume retrieved: ___
- CPC value: ___
- Difficulty score: ___
- Notes: _______________

**Error Scenarios to Test:**
- [ ] Test with invalid credentials (should show auth error)
- [ ] Test with network disconnected (should show network error)

---

### Test 4: AI Article Generation

**Goal:** Verify AI can generate full SEO articles

**Prerequisites:**
- Keywords in database
- Anthropic API key configured

**Steps:**
1. Stay on /keywords page
2. Find keyword "online mba programs"
3. Click "Generate" button (green gradient button)
4. Wait for article generation (may take 30-60 seconds)
5. Verify redirect to ContentEditor
6. Check generated content

**Expected Results:**
- ✅ "Generate" button visible
- ✅ Button shows loading state (spinner, "Generating...")
- ✅ Loading toast appears
- ✅ Article generates without errors
- ✅ Success toast shows word count (1500-2500 words)
- ✅ Redirects to /content/edit/:id
- ✅ ContentEditor loads with generated content
- ✅ Title is populated
- ✅ Body has HTML content
- ✅ Meta description is populated
- ✅ Word count displays correctly (1500-2500)
- ✅ Keyword status updated to "in_progress"

**Expected Content Structure:**
- Introduction paragraph
- 6-8 H2 sections
- FAQ section with H3 questions
- Conclusion paragraph
- 1500-2500 words total

**Actual Results:**
- [ ] PASS / [ ] FAIL
- Article title: _______________
- Word count: ___
- Has FAQs: [ ] YES / [ ] NO
- Number of H2 sections: ___
- Quality rating (1-5): ___
- Notes: _______________

**Error Scenarios to Test:**
- [ ] Test with invalid API key (should show API error)
- [ ] Test generating for same keyword twice (should handle gracefully)

---

### Test 5: Content Editing & Auto-Save

**Goal:** Verify content editor works with auto-save

**Prerequisites:**
- Generated article from Test 4 loaded in editor

**Steps:**
1. ContentEditor should be loaded with article
2. Note the current timestamp
3. Edit the title (add " - Updated")
4. Wait 3 seconds
5. Check for "Auto-saved" indicator
6. Edit the body (add a paragraph)
7. Wait 3 seconds again
8. Refresh the page
9. Verify changes persisted

**Expected Results:**
- ✅ ContentEditor loads without errors
- ✅ Title input is editable
- ✅ React Quill editor is functional
- ✅ Meta description textarea works
- ✅ Word count updates in real-time
- ✅ After 3 seconds, "Auto-saved HH:MM:SS" appears
- ✅ Green checkmark icon visible
- ✅ Timestamp updates after each edit
- ✅ Changes persist after page refresh
- ✅ Manual "Save Draft" button works
- ✅ No console errors

**Actual Results:**
- [ ] PASS / [ ] FAIL
- Auto-save triggered: [ ] YES / [ ] NO
- Time to auto-save: ___ seconds
- Changes persisted: [ ] YES / [ ] NO
- Notes: _______________

**Auto-Save Edge Cases:**
- [ ] Test editing during auto-save (should queue next save)
- [ ] Test rapid editing (should debounce properly)
- [ ] Test leaving page before auto-save (data loss prevention)

---

### Test 6: WordPress Connection Testing

**Goal:** Verify WordPress connection test works

**Prerequisites:**
- WordPress test site available
- Application password created in WordPress

**Test Site Options:**
1. Local WordPress (http://localhost:8000)
2. Staging site (https://staging.geteducated.com)
3. GetEducated.com production (use with caution)

**Steps:**
1. Navigate to /wordpress-connection
2. Enter WordPress site URL
3. Enter WordPress username
4. Enter application password
5. Click "Test Connection"
6. Wait for test to complete
7. Verify user information displays

**Expected Results:**
- ✅ All input fields are functional
- ✅ "Test Connection" button is visible
- ✅ Button shows loading state during test
- ✅ Loading toast appears
- ✅ Success toast shows "Connected as [Name]"
- ✅ Green user information card appears with:
  - Display name
  - Email address
  - Username
  - User ID
  - Roles (badges)
  - Website URL (if available)
- ✅ Connection status saved to database
- ✅ Green success alert shows at top
- ✅ No console errors

**Actual Results:**
- [ ] PASS / [ ] FAIL
- WordPress site: _______________
- User name retrieved: _______________
- User email: _______________
- Roles: _______________
- Notes: _______________

**Error Scenarios to Test:**
- [ ] Invalid URL (should show "REST API not found")
- [ ] Invalid credentials (should show "Invalid username or password")
- [ ] Non-WordPress URL (should show appropriate error)
- [ ] Network disconnected (should show network error)

---

### Test 7: WordPress Publishing

**Goal:** Verify one-click publishing to WordPress works

**Prerequisites:**
- WordPress connection tested and working (Test 6)
- Generated article in ContentEditor (Test 4)

**Steps:**
1. Return to ContentEditor (or generate new article)
2. Review content (optional: make edits)
3. Click "Publish to WordPress" button
4. Wait for publishing to complete
5. Click "View on WordPress" link
6. Verify article on WordPress site

**Expected Results:**
- ✅ "Publish to WordPress" button is visible
- ✅ Button shows loading state during publish
- ✅ Loading toast appears
- ✅ Success toast shows "Published to WordPress!"
- ✅ Status badge updates to "published"
- ✅ "View on WordPress" button appears
- ✅ WordPress URL is correct
- ✅ Article appears on WordPress site with:
  - Correct title
  - Full HTML content
  - Proper formatting (H2, H3, paragraphs, lists)
  - Meta description (as excerpt)
- ✅ Content queue status updated to "published"
- ✅ WordPress post ID stored in database
- ✅ No console errors

**Actual Results:**
- [ ] PASS / [ ] FAIL
- WordPress post ID: ___
- WordPress URL: _______________
- Article formatting on WordPress: [ ] GOOD / [ ] ISSUES
- Notes: _______________

**Error Scenarios to Test:**
- [ ] Test publishing without WordPress connection (should show error)
- [ ] Test publishing same article twice (should handle gracefully)
- [ ] Test publishing with empty content (should validate)

---

### Test 8: Complete Workflow End-to-End

**Goal:** Test complete workflow from keyword to published article

**Steps:**
1. Start at /keywords
2. Upload CSV with 3 new keywords
3. Click "Get Data" on first keyword
4. Wait for DataForSEO data
5. Click "Generate" on same keyword
6. Wait for article generation
7. Edit article in ContentEditor (change title)
8. Wait for auto-save
9. Click "Publish to WordPress"
10. Verify article on WordPress

**Expected Results:**
- ✅ Complete workflow works without errors
- ✅ Each step transitions smoothly
- ✅ No data loss at any step
- ✅ Final article matches expectations
- ✅ Total time: 2-5 minutes (excluding AI generation)

**Actual Results:**
- [ ] PASS / [ ] FAIL
- Total workflow time: ___ minutes
- Any issues encountered: _______________
- User experience rating (1-5): ___

---

### Test 9: Error Handling & Edge Cases

**Goal:** Verify all error scenarios are handled gracefully

**Scenarios to Test:**

**A. API Errors:**
- [ ] Test with invalid Anthropic API key
  - Expected: Clear error message about invalid API key
  - Actual: _______________

- [ ] Test with invalid DataForSEO credentials
  - Expected: Error message about invalid credentials
  - Actual: _______________

- [ ] Test with rate-limited API
  - Expected: Rate limit error message
  - Actual: _______________

**B. Network Errors:**
- [ ] Disconnect internet during article generation
  - Expected: Network error message
  - Actual: _______________

- [ ] Disconnect internet during WordPress publish
  - Expected: Network error message, content saved locally
  - Actual: _______________

**C. Validation Errors:**
- [ ] Try to publish with empty title
  - Expected: Validation error
  - Actual: _______________

- [ ] Try to publish with empty content
  - Expected: Validation error
  - Actual: _______________

- [ ] Try to test WordPress connection with empty URL
  - Expected: Validation error
  - Actual: _______________

**D. State Management:**
- [ ] Refresh page during article generation
  - Expected: Generation continues or shows appropriate state
  - Actual: _______________

- [ ] Navigate away from editor without saving
  - Expected: Auto-save should have saved changes
  - Actual: _______________

- [ ] Click "Generate" button multiple times rapidly
  - Expected: Button disabled, only one generation runs
  - Actual: _______________

---

### Test 10: Multi-Keyword Batch Testing

**Goal:** Test handling multiple keywords in sequence

**Steps:**
1. Import CSV with 5 keywords
2. Fetch DataForSEO data for all 5 (one by one)
3. Generate articles for 3 keywords
4. Edit and publish all 3 articles

**Expected Results:**
- ✅ All DataForSEO fetches succeed
- ✅ All article generations succeed
- ✅ No degradation in quality or speed
- ✅ Database properly tracks all statuses
- ✅ No memory leaks or performance issues

**Actual Results:**
- [ ] PASS / [ ] FAIL
- Keywords processed: ___ / 5
- Articles generated: ___ / 3
- Articles published: ___ / 3
- Any issues: _______________

---

## 🐛 Bug Tracking

Use this section to document any bugs found during testing:

### Bug #1
**Severity:** [ ] Critical / [ ] High / [ ] Medium / [ ] Low
**Area:** _______________
**Description:** _______________
**Steps to Reproduce:**
1. _______________
2. _______________
3. _______________
**Expected:** _______________
**Actual:** _______________
**Workaround:** _______________

### Bug #2
**Severity:** [ ] Critical / [ ] High / [ ] Medium / [ ] Low
**Area:** _______________
**Description:** _______________
**Steps to Reproduce:**
1. _______________
2. _______________
3. _______________
**Expected:** _______________
**Actual:** _______________
**Workaround:** _______________

### Bug #3
(Add more as needed)

---

## 📊 Test Summary

**Total Tests:** 10
**Tests Passed:** ___ / 10
**Tests Failed:** ___ / 10
**Bugs Found:** ___
**Critical Bugs:** ___

**Overall Status:** [ ] PASS / [ ] FAIL

**MVP Ready for Production:** [ ] YES / [ ] NO

---

## ✅ Final Checklist

Before marking MVP as complete:

- [ ] All 10 test scenarios pass
- [ ] No critical bugs found
- [ ] All error messages are user-friendly
- [ ] Performance is acceptable (no lag)
- [ ] No console errors during normal operation
- [ ] Auto-save works reliably
- [ ] WordPress publishing works consistently
- [ ] DataForSEO integration works
- [ ] Complete workflow tested successfully
- [ ] User experience is smooth and intuitive

---

## 🚀 Next Steps After Testing

**If All Tests Pass:**
1. Create production deployment plan
2. Configure Netlify environment variables
3. Deploy to production
4. Run smoke tests on production
5. Begin user acceptance testing

**If Tests Fail:**
1. Document all bugs
2. Prioritize critical issues
3. Fix critical bugs first
4. Re-test failed scenarios
5. Repeat until all tests pass

---

## 📝 Testing Notes

**Environment Details:**
- Node version: _______________
- Browser: _______________
- Operating System: _______________
- Test Date: _______________
- Tester: _______________

**General Observations:**
_______________________________________________
_______________________________________________
_______________________________________________

**Performance Notes:**
_______________________________________________
_______________________________________________

**UX Feedback:**
_______________________________________________
_______________________________________________

---

## 🎯 Success Criteria

**MVP is production-ready when:**
- [x] All core features implemented
- [x] All code committed to GitHub
- [x] Comprehensive error handling
- [x] Auto-save prevents data loss
- [ ] All tests pass
- [ ] No critical bugs
- [ ] User workflow is smooth

**Current Status:** Testing in progress

---

**Document Version:** 1.0
**Created:** 2025-11-07
**Purpose:** Guide end-to-end testing of Perdia MVP
**Status:** Ready for use
