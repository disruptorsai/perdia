# Unsplash Stock Image Integration

## Overview

The Perdia platform includes AI-powered stock image search using Unsplash. When users click "Find Stock" in the image upload modal, the system:

1. **AI analyzes the article** to generate an optimal 2-4 word search query
2. **Searches Unsplash** via Edge Function for relevant images
3. **Displays 6 landscape images** with photographer attribution
4. **Downloads and uploads** selected image to Supabase Storage
5. **Tracks downloads** with Unsplash (API compliance)

## Features

- ✅ **AI-powered search**: Claude Haiku analyzes article content to generate perfect search queries
- ✅ **High-quality images**: Landscape orientation, professional content filter
- ✅ **Photographer attribution**: Proper credits and links
- ✅ **API compliance**: Automatic download tracking per Unsplash terms
- ✅ **Fallback to AI generation**: If no results, redirects to Gemini image generation

## Setup Instructions

### 1. Get Unsplash API Access

1. Go to [Unsplash Developers](https://unsplash.com/developers)
2. Sign up or log in
3. Create a new application:
   - Name: "Perdia Education Platform"
   - Description: "AI-powered SEO content platform for educational content"
   - Accept terms of service
4. Copy your **Access Key** (starts with `Client-ID`)

### 2. Configure Supabase Secrets

```bash
# Set Unsplash API key
npx supabase secrets set UNSPLASH_ACCESS_KEY=your_access_key_here --project-ref yvvtsfgryweqfppilkvo

# Verify secrets are set
npx supabase secrets list --project-ref yvvtsfgryweqfppilkvo
```

### 3. Deploy Edge Functions

```bash
# Deploy stock image search function
npx supabase functions deploy search-stock-images --project-ref yvvtsfgryweqfppilkvo

# Deploy download tracker function
npx supabase functions deploy track-unsplash-download --project-ref yvvtsfgryweqfppilkvo

# Verify deployment
npx supabase functions list --project-ref yvvtsfgryweqfppilkvo
```

### 4. Test the Integration

1. Go to Content Library in your app
2. Create or edit an article
3. Click "Add Featured Image"
4. Click the "Find Stock" tab
5. Click "Find Perfect Image"
6. Select an image from the results

## API Compliance

Per [Unsplash API Guidelines](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines):

- ✅ **Attribution required**: We display "Photo by [Name] on Unsplash" with links
- ✅ **Download tracking**: We ping the `download_location` endpoint when images are used
- ✅ **Rate limits**: Free tier = 50 requests/hour (sufficient for typical usage)
- ✅ **Hotlinking prohibited**: We download and upload to our own storage (Supabase)

## Architecture

### Edge Functions

**`search-stock-images`** - Main search function
- Accepts: `{ query: string, perPage: number }`
- Returns: Array of image objects with URLs, attribution, etc.
- Filters: Landscape orientation, high-quality content

**`track-unsplash-download`** - Download tracker
- Accepts: `{ downloadLocation: string }`
- Purpose: API compliance (required by Unsplash)
- Graceful failure: Doesn't block user flow if tracking fails

### Frontend Flow

1. User clicks "Find Perfect Image"
2. `ImageUploadModal.jsx:203-279` handles the flow:
   - Calls `invokeLLM()` with Claude Haiku to generate search query
   - Calls `search-stock-images` Edge Function
   - Displays results in a grid
3. User selects an image:
   - Tracks download with Unsplash
   - Downloads high-res image
   - Uploads to `content-images` bucket
   - Adds to article with attribution

## Configuration

### Search Parameters

Located in `ImageUploadModal.jsx:250`:
```javascript
perPage: 6  // Number of results (1-30)
```

Located in `search-stock-images/index.ts:56-57`:
```javascript
orientation: 'landscape'  // Best for article heroes
content_filter: 'high'    // High-quality images only
```

### AI Search Query

Located in `ImageUploadModal.jsx:210-221`:
- Model: `claude-haiku-4-5-20251001` (fast, cheap)
- Temperature: 0.5 (balanced creativity)
- Max tokens: 50 (just need 2-4 words)

## Rate Limits

**Unsplash Free Tier:**
- 50 requests per hour
- Sufficient for ~8 articles/hour with stock images
- Use AI generation for higher volumes

**Upgrade to Production:**
- 5,000 requests per hour
- Apply at https://unsplash.com/developers

## Troubleshooting

### "Unsplash API not configured"
```bash
# Check if secret is set
npx supabase secrets list --project-ref yvvtsfgryweqfppilkvo

# If missing, set it
npx supabase secrets set UNSPLASH_ACCESS_KEY=your_key --project-ref yvvtsfgryweqfppilkvo
```

### "No images found"
- AI generates too specific search query
- Try manually in Unsplash to verify results exist
- Falls back to AI image generation automatically

### Rate limit exceeded (429 error)
- Wait 1 hour for rate limit reset
- Or upgrade Unsplash app to production tier
- Or use AI image generation (Gemini) instead

## Cost Analysis

**Unsplash:**
- Free tier: $0
- Production: Contact for pricing

**AI Query Generation:**
- Claude Haiku: ~$0.0001 per search query
- Negligible cost

**Storage:**
- Supabase Storage: First 1GB free
- Typical image: 200-500KB
- ~2000-5000 images free

## Alternative Providers

If needed, the Edge Function pattern can be adapted for:
- **Pexels** - Similar free API
- **Pixabay** - Free, no attribution required
- **Freepik API** - Larger library, paid

## Related Files

- `supabase/functions/search-stock-images/index.ts` - Main search function
- `supabase/functions/track-unsplash-download/index.ts` - Download tracker
- `src/components/content/ImageUploadModal.jsx` - Frontend UI
- `supabase/functions/generate-image/index.ts` - AI generation fallback (Gemini only)

---

**Last Updated:** 2025-11-09
**Status:** ✅ Ready for deployment
