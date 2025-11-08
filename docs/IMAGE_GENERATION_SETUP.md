# Image Generation Setup Guide

This guide covers deploying and configuring the AI-powered image generation feature for Perdia Education.

## Features

- **Upload** - Manual image upload with drag & drop
- **Generate** - AI image generation with Gemini 2.5 Flash Image + GPT-4o fallback
- **Find Stock** - AI-powered stock image search via Unsplash

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 ImageUploadModal (React)                │
└─────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   [Upload]        [Generate]        [Stock]
   Direct          Edge Function     Unsplash API
   to Storage      └─> Gemini 2.5    Free API
                       Flash Image
                       (Nano Banana)
                       └─> GPT-4o
                           Fallback
```

## Step 1: Database Migration

Apply the migration to add image fields to `content_queue`:

### Option A: Run Script
```bash
node scripts/add-image-fields.js
```

### Option B: Manual SQL (Supabase Dashboard)
1. Go to Supabase SQL Editor
2. Run the migration from:
   ```
   supabase/migrations/20251107000003_add_featured_image_to_content_queue.sql
   ```

### Verify Migration
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'content_queue'
  AND column_name LIKE 'featured_image%';
```

Should return:
- `featured_image_url` (TEXT)
- `featured_image_path` (TEXT)
- `featured_image_alt_text` (TEXT)
- `featured_image_source` (TEXT)

## Step 2: Get API Keys

### Google AI API Key (for Gemini 2.5 Flash Image)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Get API Key"
3. Create a new API key
4. Copy the key (starts with `AIza...`)

**Note:** Gemini 2.5 Flash Image requires the Blaze (pay-as-you-go) plan.

### OpenAI API Key (for GPT-4o fallback)

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy the key (starts with `sk-...`)

**Note:** GPT-4o image generation is billed separately from text generation.

## Step 3: Deploy Edge Function

### Deploy to Supabase

```bash
# Link to your project
npx supabase link --project-ref yvvtsfgryweqfppilkvo

# Deploy the function
npx supabase functions deploy generate-image --project-ref yvvtsfgryweqfppilkvo

# Set secrets
npx supabase secrets set GOOGLE_AI_API_KEY=your_google_key_here --project-ref yvvtsfgryweqfppilkvo
npx supabase secrets set OPENAI_API_KEY=your_openai_key_here --project-ref yvvtsfgryweqfppilkvo

# Verify secrets are set
npx supabase secrets list --project-ref yvvtsfgryweqfppilkvo
```

Should show:
- `GOOGLE_AI_API_KEY` ✓
- `OPENAI_API_KEY` ✓
- `ANTHROPIC_API_KEY` (already set for text generation)

### Test the Function

Create a test file `test-image-generation.js`:

```javascript
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testImageGeneration() {
  // Sign in first
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'your-email@example.com',
    password: 'your-password'
  });

  if (!authData.session) {
    console.error('Authentication failed');
    return;
  }

  // Call the function
  const { data, error } = await supabase.functions.invoke('generate-image', {
    body: {
      prompt: 'A professional hero image for an educational article about online learning, modern and clean design',
      provider: 'gemini',
      aspectRatio: '16:9'
    }
  });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', data);
    console.log('Image URL:', data.imageUrl);
    console.log('Provider used:', data.provider);
  }
}

testImageGeneration();
```

Run:
```bash
node test-image-generation.js
```

## Step 4: Frontend Configuration

No changes needed! The ImageUploadModal already integrates with the Edge Function.

## Step 5: Verify Storage Bucket

Ensure the `content-images` bucket exists and is public:

1. Go to Supabase Dashboard → Storage
2. Check for `content-images` bucket
3. If it doesn't exist:
   ```bash
   npx supabase storage create content-images --public
   ```

## Usage

### In the App

1. Go to **Content Library**
2. Find an article
3. Click **"Add Image"** button
4. Choose one of three options:

#### Option 1: Upload
- Click or drag & drop
- Max 10MB
- Supports PNG, JPG, GIF

#### Option 2: Generate (AI)
- Click **"I'm Feeling Lucky"** for auto-prompt
- Or enter custom prompt
- Click **"Generate Image with AI"**
- Wait 10-30 seconds
- Image is automatically uploaded

#### Option 3: Find Stock
- Click **"Find Perfect Image"**
- AI searches Unsplash based on article title
- Click **"Use This Image"**
- Image is downloaded and uploaded

## System Prompt

The Edge Function includes a professional system prompt that ensures all generated images are:

- Professional and polished
- Clean and uncluttered
- High contrast
- Modern and contemporary
- 16:9 aspect ratio (1200x630px)
- Suitable for article hero images

## Pricing

### Google Gemini 2.5 Flash Image
- **Pricing:** ~$0.04 per image (Blaze plan required)
- **Speed:** 10-20 seconds per image
- **Quality:** High quality, professional

### OpenAI GPT-4o Image
- **Pricing:** ~$0.04-0.08 per image (HD quality)
- **Speed:** 15-30 seconds per image
- **Quality:** Excellent quality, realistic

### Unsplash Stock Images
- **Pricing:** FREE (attribution recommended but not required)
- **Speed:** 1-2 seconds
- **Quality:** Professional photography

## Troubleshooting

### "GOOGLE_AI_API_KEY not configured"
```bash
npx supabase secrets set GOOGLE_AI_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo
```

### "Gemini API error: 403"
- Ensure Blaze plan is enabled in Google AI Studio
- Verify API key has image generation permissions

### "OpenAI API error: 429"
- Rate limit exceeded
- Wait or upgrade OpenAI plan

### "Failed to upload image"
- Check `content-images` bucket exists
- Verify bucket is public
- Check RLS policies allow uploads

### Image not showing after upload
- Check `featured_image_url` field in database
- Verify Supabase Storage public URL is correct
- Clear browser cache

## Cost Optimization

**Best Practice:** Use stock images when possible (free), generate with AI only for unique needs.

**Recommended workflow:**
1. Try **Find Stock** first (FREE)
2. If no good match, use **Generate** (paid)
3. **Upload** for custom images

## Support

- **Gemini Docs:** https://ai.google.dev/gemini-api/docs/image-generation
- **OpenAI Docs:** https://platform.openai.com/docs/guides/images
- **Supabase Storage:** https://supabase.com/docs/guides/storage

---

**Last Updated:** 2025-11-07
**Version:** 1.0.0
