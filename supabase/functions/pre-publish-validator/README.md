# Pre-Publish Validator Edge Function

**Purpose:** Quality gates that MUST pass before content can be published to WordPress

**Status:** ✅ Implemented (Sprint 1, Week 1)

---

## Why This Exists

**CRITICAL:** This is the **final checkpoint** before content goes live on GetEducated.com. It enforces content standards and prevents publishing issues that could affect:
- SEO ranking
- User experience
- Monetization tracking
- Google Rich Results eligibility

**Philosophy:** Fail fast, fail early. Better to catch issues in the approval queue than fix them in production.

---

## What It Validates

### 1. ✅ Shortcode Compliance (CRITICAL)

**Rule:** Zero raw HTML `<a>` tags allowed. ALL links must use GetEducated.com shortcodes.

**Why:**
- Client requirement (Kaylee, Nov 10 transcript): "we set up hyperlinks through short codes and we set up monetization through short codes"
- Affiliate link tracking depends on shortcodes
- Prevents monetization loss

**Fails If:**
- Any `<a href="...">` tags detected in content

**Fix:**
```bash
# Run content through shortcode transformer first
curl -X POST https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/shortcode-transformer \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{"html": "...", "content_id": "uuid"}'
```

---

### 2. ✅ Internal Links (2-5)

**Rule:** Content must include 2-5 internal links ([ge_internal_link] shortcodes).

**Why:**
- SEO: Internal linking distributes page authority
- User experience: Helps readers discover related content
- Site architecture: Creates content clusters

**Fails If:**
- Less than 2 internal links

**Warns If:**
- More than 5 internal links (keyword dilution risk)

**Fix:**
- Add 2-5 relevant internal links to related GetEducated.com pages
- Use [ge_internal_link url="/programs/online-mba"]text[/ge_internal_link]

---

### 3. ✅ External Authority Links (≥1)

**Rule:** Content must include at least 1 external link to authoritative source.

**Why:**
- SEO: Citing authoritative sources increases credibility
- Google E-A-T: Demonstrates research and expertise
- User trust: Shows content is well-researched

**Best Practices:**
- Link to .gov, .edu, or reputable industry publications
- Examples: BLS.gov (labor statistics), accreditation agencies, government education departments

**Fails If:**
- Zero external links found

**Fix:**
- Add 1-2 authoritative external links with [ge_external_link] shortcodes

---

### 4. ✅ JSON-LD Structured Data

**Rule:** Content must include valid JSON-LD structured data.

**Why:**
- Google Rich Results eligibility
- Enhanced search appearance (star ratings, FAQs, breadcrumbs)
- Better click-through rates

**Required Schemas:**
- **Article Schema:** (minimum requirement)
  - headline
  - author
  - datePublished
  - image
  - publisher

**Recommended Schemas:**
- **FAQPage Schema:** If FAQ section present
- **BreadcrumbList Schema:** For navigation context

**Fails If:**
- No `<script type="application/ld+json">` found
- Invalid JSON syntax

**Validates:**
- Presence of @context and @type
- Valid JSON structure

**Fix:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Best Online MBA Programs 2025",
  "author": {
    "@type": "Person",
    "name": "GetEducated.com"
  },
  "datePublished": "2025-11-10",
  "image": "https://geteducated.com/images/mba-programs.jpg",
  "publisher": {
    "@type": "Organization",
    "name": "GetEducated.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://geteducated.com/logo.png"
    }
  }
}
</script>
```

**Test:** [Google Rich Results Test](https://search.google.com/test/rich-results)

---

### 5. ✅ Word Count (1500-3000)

**Rule:** Content must be 1500-3000 words.

**Why:**
- SEO: Long-form content ranks better for competitive keywords
- User value: Comprehensive coverage of topic
- GetEducated.com standard: In-depth educational content

**Fails If:**
- Less than 1500 words

**Warns If:**
- More than 3000 words (consider splitting into series)

**Fix:**
- Expand content with:
  - More detailed explanations
  - Real-world examples
  - Case studies or student quotes
  - Comparison tables
  - FAQ section
  - Step-by-step guides

---

### 6. ✅ Meta Description (150-160 chars)

**Rule:** Meta description must be 150-160 characters.

**Why:**
- Search snippet display: Google truncates longer descriptions
- Click-through rate: Compelling description = more clicks
- Keyword relevance: Shows users what page is about

**Fails If:**
- Missing meta description
- Length <150 or >160 characters

**Fix:**
```javascript
// Good meta description (156 chars)
"Discover the best online MBA programs for 2025. Compare tuition, accreditation, and career outcomes from top-ranked universities. Find your perfect fit."

// Too short (95 chars)
"Best online MBA programs for 2025. Compare tuition and accreditation."

// Too long (185 chars)
"Discover the best online MBA programs for 2025 with our comprehensive guide. We compare tuition costs, accreditation status, career outcomes, and rankings from top universities worldwide."
```

---

### 7. ✅ Title (50-60 chars)

**Rule:** Title must be 50-60 characters.

**Why:**
- Search result display: Google truncates longer titles
- Mobile display: Limited screen space
- SEO: Front-load important keywords

**Fails If:**
- Missing title
- Length <50 or >60 characters

**Fix:**
```javascript
// Good title (54 chars)
"Best Online MBA Programs 2025: Top Rankings & Costs"

// Too short (28 chars)
"Best Online MBA Programs"

// Too long (78 chars)
"Best Online MBA Programs 2025: Compare Top Rankings, Tuition Costs & ROI Data"
```

---

### 8. ⚠️ FAQ Section (Warning Only)

**Rule:** FAQ section should include FAQPage schema if present.

**Why:**
- Rich results: FAQ rich snippets in search
- User experience: Quick answers to common questions
- Voice search: FAQ format matches voice queries

**Warns If:**
- FAQ section found but missing FAQPage schema

**Fix:**
```html
<h2>Frequently Asked Questions</h2>

<h3>What is the average cost of an online MBA?</h3>
<p>The average cost ranges from $30,000 to $120,000...</p>

<h3>How long does it take to complete an online MBA?</h3>
<p>Most programs take 18-24 months for full-time students...</p>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the average cost of an online MBA?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The average cost ranges from $30,000 to $120,000..."
      }
    },
    {
      "@type": "Question",
      "name": "How long does it take to complete an online MBA?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most programs take 18-24 months for full-time students..."
      }
    }
  ]
}
</script>
```

---

## Usage

### API Request

```bash
curl -X POST \
  https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/pre-publish-validator \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<article>Your content here...</article>",
    "title": "Best Online MBA Programs 2025",
    "meta_description": "Discover the best online MBA programs...",
    "content_id": "optional-uuid-for-logging"
  }'
```

### Response (Passed)

```json
{
  "success": true,
  "content_id": "uuid",
  "passed": true,
  "errors": [],
  "warnings": [
    "⚠️ WARNING: Too many internal links (6). Best practice: 2-5 links."
  ],
  "metrics": {
    "word_count": 2450,
    "internal_link_count": 6,
    "external_link_count": 2,
    "shortcode_count": 8,
    "raw_html_link_count": 0,
    "has_json_ld": true,
    "has_faq": true,
    "meta_description_length": 156,
    "title_length": 54
  },
  "message": "✅ All quality gates passed. Content ready for publishing.",
  "timestamp": "2025-11-10T12:00:00.000Z"
}
```

### Response (Failed)

```json
{
  "success": true,
  "content_id": "uuid",
  "passed": false,
  "errors": [
    "❌ CRITICAL: 3 raw HTML link(s) detected. ALL links must use GetEducated.com shortcodes.",
    "❌ Insufficient internal links (1). Requirement: 2-5 internal links for SEO.",
    "❌ Content too short (1245 words). Minimum: 1500 words for SEO ranking.",
    "❌ Missing JSON-LD structured data. Required for Google Rich Results."
  ],
  "warnings": [
    "⚠️ Meta description too short (142 chars). Optimal: 150-160 characters."
  ],
  "metrics": {
    "word_count": 1245,
    "internal_link_count": 1,
    "external_link_count": 2,
    "shortcode_count": 3,
    "raw_html_link_count": 3,
    "has_json_ld": false,
    "has_faq": false,
    "meta_description_length": 142,
    "title_length": 54
  },
  "message": "❌ Validation failed. Fix errors before publishing.",
  "timestamp": "2025-11-10T12:00:00.000Z"
}
```

---

## Integration with Workflow

### From Content Queue Approval

```javascript
// In src/lib/content-workflow.js

import { createClient } from '@supabase/supabase-js';

/**
 * Validate content before publishing
 */
export async function validateContentForPublishing(contentId) {
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  // Get content from queue
  const { data: content } = await supabase
    .from('content_queue')
    .select('*')
    .eq('id', contentId)
    .single();

  // Call validator
  const response = await supabase.functions.invoke('pre-publish-validator', {
    body: {
      html: content.content,
      title: content.title,
      meta_description: content.meta_description,
      content_id: contentId,
    },
  });

  if (!response.data.passed) {
    // Block publishing, show errors to user
    throw new Error(
      `Validation failed:\n${response.data.errors.join('\n')}`
    );
  }

  // Validation passed, proceed with publishing
  return response.data;
}
```

### From Approval Queue UI

```javascript
// In approval queue component

const handlePublish = async (contentId) => {
  try {
    // Validate first
    const validation = await validateContentForPublishing(contentId);

    if (!validation.passed) {
      toast.error('Cannot publish: Content failed quality gates');
      setValidationErrors(validation.errors);
      return;
    }

    // Show warnings but allow publishing
    if (validation.warnings.length > 0) {
      toast.warning(`${validation.warnings.length} warnings detected`);
    }

    // Proceed with WordPress publishing
    await publishToWordPress(contentId);
    toast.success('Content published successfully');
  } catch (error) {
    toast.error(error.message);
  }
};
```

---

## Deployment

```bash
# Deploy to Supabase
npx supabase functions deploy pre-publish-validator --project-ref yvvtsfgryweqfppilkvo

# Test deployment
curl -X POST \
  https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/pre-publish-validator \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<p>Test content with [ge_internal_link url=\"/test\"]link[/ge_internal_link]</p>",
    "title": "Test Article Title for Validation System Testing"
  }'
```

---

## Monitoring

Check Supabase Edge Function logs for validation statistics:

```
[Pre-Publish Validator] {
  content_id: "uuid",
  passed: false,
  error_count: 4,
  warning_count: 1,
  metrics: {
    word_count: 1245,
    raw_html_link_count: 3,
    ...
  }
}
```

**Key Metrics to Track:**
- Validation pass rate (target: >80%)
- Most common errors (focus improvement efforts)
- Average word count
- Shortcode compliance rate (target: 100%)

---

## Testing

### Unit Test

```javascript
// Test shortcode validation
const result1 = validateContent(
  '<p>This has <a href="/test">raw HTML link</a></p>',
  'Title',
  'Meta description'
);
assert(result1.passed === false);
assert(result1.errors.some(e => e.includes('raw HTML link')));

// Test successful validation
const result2 = validateContent(
  '<article>' +
    '<p>Content with [ge_internal_link url="/page1"]link1[/ge_internal_link]</p>'.repeat(50) +
    '<p>[ge_external_link url="https://bls.gov"]BLS[/ge_external_link]</p>' +
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article"}</script>' +
    '</article>',
  'Best Online MBA Programs 2025: Rankings & Costs Guide',
  'Discover the best online MBA programs for 2025. Compare tuition, accreditation, and career outcomes from top universities.'
);
assert(result2.passed === true);
```

---

## Troubleshooting

### Issue: Content keeps failing validation

**Solution:**
1. Check error messages for specific issues
2. Run content through shortcode transformer first
3. Use validation metrics to identify problem areas

### Issue: False positives on shortcode detection

**Solution:**
- Ensure shortcodes are properly formatted: `[ge_internal_link url="..."]text[/ge_internal_link]`
- Check for typos in shortcode names

### Issue: JSON-LD validation fails

**Solution:**
- Test JSON-LD with Google Rich Results Test
- Validate JSON syntax (use JSON linter)
- Ensure @context and @type are present

### Issue: Word count seems wrong

**Solution:**
- Word count strips HTML tags and counts plain text words
- Shortcodes and HTML comments don't count toward word count
- Check for hidden content or excessive whitespace

---

## Future Enhancements

**Phase 2 Additions:**
- Image alt text validation (accessibility + SEO)
- Heading structure validation (H1 → H2 → H3 hierarchy)
- Keyword density checks (avoid over-optimization)
- Readability score (Flesch-Kincaid)
- Plagiarism detection integration
- Broken link checking
- Mobile viewport validation

---

**Version:** 1.0
**Created:** 2025-11-10
**Status:** ✅ Ready for deployment
**Next Steps:** Deploy, integrate into approval workflow, monitor validation metrics
