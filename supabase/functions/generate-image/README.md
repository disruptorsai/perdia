# Image Generation Edge Function

## ⚠️ CRITICAL HARD RULE - NEVER USE DALL-E 3!

This Edge Function generates article hero images using AI.

### Approved Models ONLY

**PRIMARY:** Google Gemini 2.5 Flash Image ("Nano Banana")
- Model: `gemini-2.5-flash-image`
- Fast, high-quality image generation
- Supports aspect ratios: 16:9, 1:1, 4:3, 9:16

**FALLBACK:** OpenAI gpt-image-1 (NEW image model)
- Model: `gpt-image-1`
- Size: 1792x1024 (16:9 ratio)
- Quality: HD
- **DOES NOT SUPPORT** `style` parameter

### FORBIDDEN Models

❌ **NEVER EVER USE:**
- `dall-e-3` - FORBIDDEN!
- `dall-e-2` - FORBIDDEN!
- Any DALL-E model - FORBIDDEN!

This is a **HARD RULE** across the entire codebase. No exceptions.

## API Endpoint

```
POST /functions/v1/generate-image
```

### Request

```json
{
  "prompt": "Professional hero image description...",
  "provider": "gemini",  // "gemini" or "openai"
  "aspectRatio": "16:9"  // For Gemini only
}
```

### Response

```json
{
  "success": true,
  "imageUrl": "https://...",  // or data:image/jpeg;base64,...
  "provider": "gemini-2.5-flash-image",  // or "gpt-image-1"
  "prompt": "..."
}
```

## Environment Variables

Required in Supabase:
- `GOOGLE_AI_API_KEY` - Google AI API key for Gemini
- `OPENAI_API_KEY` - OpenAI API key for gpt-image-1

## Deployment

```bash
npx supabase functions deploy generate-image --project-ref yvvtsfgryweqfppilkvo
```

## Usage from Frontend

```javascript
import { supabase } from '@/lib/supabase-client';

const { data: { session } } = await supabase.auth.getSession();

const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      prompt: 'Professional article hero image...',
      provider: 'gemini',  // Try Gemini first
      aspectRatio: '16:9'
    }),
  }
);

const data = await response.json();
// data.imageUrl contains the image (URL or data URL)
```

## Notes

- Gemini returns base64 data URLs: `data:image/jpeg;base64,...`
- gpt-image-1 returns temporary URLs valid for 1 hour
- Frontend should upload generated images to Supabase Storage
- System prompt optimizes images for professional article hero images
- Always use 16:9 aspect ratio for hero images (1792x1024 or equivalent)

---

**Last Updated:** 2025-11-10
**Status:** ✅ Active - NEVER USE DALL-E 3!
