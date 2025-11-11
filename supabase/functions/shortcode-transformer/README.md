# Shortcode Transformer Edge Function

**Purpose:** Transform HTML `<a>` tags to GetEducated.com shortcodes for monetization tracking

**Status:** ✅ Implemented (Sprint 1, Week 1)

---

## Why This Exists

**Client Requirement (Kaylee, Nov 10 transcript):**
> "we set up hyperlinks through short codes and we set up monetization through short codes... We've really worked hard to have our hyperlinking be a very certain way on the site for various reasons."

**CRITICAL:** This is MANDATORY for affiliate link tracking and monetization.

---

## What It Does

Transforms all HTML links in content to GetEducated.com shortcodes:

1. **Internal Links** → `[ge_internal_link url="..."]text[/ge_internal_link]`
2. **Affiliate Links** → `[ge_affiliate_link url="..."]text[/ge_affiliate_link]`
3. **External Links** → `[ge_external_link url="..."]text[/ge_external_link]`

---

## Usage

### API Request

```bash
curl -X POST \
  https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/shortcode-transformer \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<p>Check out <a href=\"https://geteducated.com/programs\">our programs</a> and <a href=\"https://shareasale.com/offer\">this deal</a>.</p>",
    "content_id": "optional-uuid-for-logging"
  }'
```

### Response

```json
{
  "success": true,
  "content_id": "optional-uuid-for-logging",
  "content": "<p>Check out [ge_internal_link url=\"https://geteducated.com/programs\"]our programs[/ge_internal_link] and [ge_affiliate_link url=\"https://shareasale.com/offer\" rel=\"sponsored nofollow\"]this deal[/ge_affiliate_link].</p>",
  "transformations": {
    "total": 2,
    "internal": 1,
    "affiliate": 1,
    "external": 0
  },
  "issues": [],
  "timestamp": "2025-11-10T12:00:00.000Z"
}
```

---

## Link Detection Rules

### Internal Links (→ `ge_internal_link`)
- Starts with `/` (relative URLs)
- Hostname is `geteducated.com` or `www.geteducated.com`

**Examples:**
```
<a href="/programs">Programs</a>
→ [ge_internal_link url="/programs"]Programs[/ge_internal_link]

<a href="https://geteducated.com/about">About Us</a>
→ [ge_internal_link url="https://geteducated.com/about"]About Us[/ge_internal_link]
```

### Affiliate Links (→ `ge_affiliate_link`)
- Hostname includes known affiliate domains:
  - shareasale.com
  - cj.com
  - impact.com
  - partnerstack.com
  - awin1.com
  - tkqlhce.com
  - (see full list in code)

**Examples:**
```
<a href="https://shareasale.com/offer">Special Offer</a>
→ [ge_affiliate_link url="https://shareasale.com/offer" rel="sponsored nofollow"]Special Offer[/ge_affiliate_link]
```

**Auto-Additions:**
- `rel="sponsored nofollow"` (if not already present)

### External Links (→ `ge_external_link`)
- Everything else (not internal, not affiliate)

**Examples:**
```
<a href="https://bls.gov/data">BLS Data</a>
→ [ge_external_link url="https://bls.gov/data" rel="nofollow" target="_blank"]BLS Data[/ge_external_link]
```

**Auto-Additions:**
- `rel="nofollow"` (if not already present)
- `target="_blank"` (if not already present)

---

## Attribute Preservation

All existing HTML attributes are preserved in shortcodes:

```
<a href="/test" class="button" data-tracking="123">Link</a>
→ [ge_internal_link url="/test" class="button" data-tracking="123"]Link[/ge_internal_link]
```

---

## Integration with Workflow

### From Content Generation (AI)

```javascript
// In content-workflow.js
import { transformContentLinks } from '@/lib/content-workflow';

// After AI generates HTML content
const transformedContent = await transformContentLinks(contentId, htmlContent);

// Now transformedContent has all shortcodes
```

### Pre-Publish Validation

The pre-publish validator MUST check for raw HTML links:

```javascript
// Validator checks
if (content.match(/<a\s+/gi)) {
  return { passed: false, error: 'Raw HTML links detected - must use shortcodes' };
}
```

---

## WordPress Shortcode Handlers

GetEducated.com WordPress must have these shortcode handlers registered:

```php
// wp-content/themes/geteducated/functions.php

// Internal link shortcode
add_shortcode('ge_internal_link', function($atts, $content = null) {
    $atts = shortcode_atts(array(
        'url' => '#',
        'class' => 'internal-link',
        'target' => '_self'
    ), $atts);

    return sprintf(
        '<a href="%s" class="%s" target="%s">%s</a>',
        esc_url($atts['url']),
        esc_attr($atts['class']),
        esc_attr($atts['target']),
        $content
    );
});

// Affiliate link shortcode (with tracking)
add_shortcode('ge_affiliate_link', function($atts, $content = null) {
    $atts = shortcode_atts(array(
        'url' => '#',
        'rel' => 'sponsored nofollow',
        'target' => '_blank'
    ), $atts);

    // Track affiliate click
    // do_action('ge_affiliate_click', $atts['url']);

    return sprintf(
        '<a href="%s" class="affiliate-link" rel="%s" target="%s">%s</a>',
        esc_url($atts['url']),
        esc_attr($atts['rel']),
        esc_attr($atts['target']),
        $content
    );
});

// External link shortcode
add_shortcode('ge_external_link', function($atts, $content = null) {
    $atts = shortcode_atts(array(
        'url' => '#',
        'rel' => 'nofollow',
        'target' => '_blank'
    ), $atts);

    return sprintf(
        '<a href="%s" class="external-link" rel="%s" target="%s">%s</a>',
        esc_url($atts['url']),
        esc_attr($atts['rel']),
        esc_attr($atts['target']),
        $content
    );
});
```

**ACTION REQUIRED:** Confirm with Kaylee that these shortcode handlers exist on GetEducated.com WordPress.

---

## Configuration

### Update Affiliate Domains

Edit `AFFILIATE_DOMAINS` array in `index.ts` with GetEducated.com's actual affiliate partners:

```typescript
const AFFILIATE_DOMAINS = [
  'shareasale.com',
  'cj.com',
  // Add GetEducated.com specific partners
  'partner1.com',
  'partner2.com',
];
```

**ACTION REQUIRED:** Get list of affiliate domains from Kaylee.

---

## Deployment

```bash
# Deploy to Supabase
npx supabase functions deploy shortcode-transformer --project-ref yvvtsfgryweqfppilkvo

# Test deployment
curl -X POST \
  https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/shortcode-transformer \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"html": "<a href=\"/test\">Test</a>"}'
```

---

## Monitoring

Check Supabase Edge Function logs for transformation statistics:

```
[Shortcode Transformer] {
  content_id: "uuid",
  transformations: { total: 5, internal: 2, affiliate: 2, external: 1 },
  issues: []
}
```

---

## Testing

### Unit Test

```javascript
import { transformLinks } from './index.ts';

// Test internal link
const result = transformLinks('<a href="/test">Link</a>');
assert(result.content.includes('[ge_internal_link'));
assert(result.transformations.internal === 1);

// Test affiliate link
const result2 = transformLinks('<a href="https://shareasale.com/offer">Deal</a>');
assert(result2.content.includes('[ge_affiliate_link'));
assert(result2.transformations.affiliate === 1);
```

### Integration Test

See `docs/production-ready-plan/IMPLEMENTATION_GUIDE.md` Section 4.1

---

## Known Limitations

1. **Nested links:** HTML doesn't support nested `<a>` tags - transformer won't handle this (invalid HTML)
2. **Malformed HTML:** Links without proper closing tags may not transform (reported in `issues` array)
3. **JavaScript links:** `href="javascript:void(0)"` are not transformed (should avoid in content)

---

## Troubleshooting

**Issue:** Some links not transforming

**Solution:**
- Check HTML is valid (proper closing tags)
- Check link has `href` attribute
- Check logs for specific issues

**Issue:** Wrong shortcode type assigned

**Solution:**
- Verify affiliate domains list is up to date
- Check URL format (relative vs. absolute)

---

**Version:** 1.0
**Created:** 2025-11-10
**Status:** ✅ Ready for deployment
**Next Steps:** Deploy, test with sample content, confirm WordPress shortcode handlers exist
