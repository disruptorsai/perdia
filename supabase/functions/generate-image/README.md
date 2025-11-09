# Generate Image Edge Function

AI-powered image generation for article hero images using Google Gemini 2.5 Flash Image (primary) and OpenAI GPT-4o (backup).

## Required API Keys

This function requires at least one of these API keys:

- **GOOGLE_AI_API_KEY** (Primary) - For Google Gemini 2.5 Flash Image
- **OPENAI_API_KEY** (Backup) - For OpenAI GPT-4o Image Generation

## Deployment

### 1. Set up API Keys

```bash
# Set Google AI API Key (Primary)
npx supabase secrets set GOOGLE_AI_API_KEY=your_google_ai_api_key

# Set OpenAI API Key (Backup)
npx supabase secrets set OPENAI_API_KEY=your_openai_api_key
```

### 2. Deploy the Function

```bash
# Deploy generate-image function
npx supabase functions deploy generate-image
```

### 3. Verify Deployment

Test the function using curl or your application:

```bash
curl -X POST \
  https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/generate-image \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A professional hero image for an article about online education", "provider": "gemini"}'
```

## API Usage

### Request

```javascript
const response = await fetch(
  'https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/generate-image',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: 'A professional hero image for an article about online education',
      provider: 'gemini', // or 'openai'
      aspectRatio: '16:9' // '16:9', '1:1', '4:3', '9:16'
    })
  }
);

const { imageUrl, provider } = await response.json();
```

### Response

```json
{
  "success": true,
  "imageUrl": "data:image/jpeg;base64,..." or "https://...",
  "provider": "gemini-2.5-flash-image",
  "prompt": "original prompt"
}
```

## CORS Configuration

The function includes proper CORS headers:
- **Access-Control-Allow-Origin**: `*`
- **Access-Control-Allow-Methods**: `POST, OPTIONS`
- **Access-Control-Allow-Headers**: `authorization, x-client-info, apikey, content-type`

## Troubleshooting

### CORS Errors

If you see CORS errors:
1. Verify the function is deployed: `npx supabase functions list`
2. Check that the function is returning HTTP 200 for OPTIONS requests
3. Ensure API keys are set: `npx supabase secrets list`

### Missing API Keys

If you get "API_KEY not configured" errors:
1. Set the required secrets (see above)
2. Redeploy the function after setting secrets

### Authentication Errors

If you get 401 errors:
1. Ensure you're passing a valid Supabase auth token or anon key
2. Check that RLS policies allow access to the function

## Cost Estimates

- **Google Gemini 2.5 Flash Image**: ~$0.05 per image (estimated)
- **OpenAI GPT-4o Image**: ~$0.04 per image (1792x1024 HD)

Primary provider (Gemini) is used first, falling back to GPT-4o if Gemini fails.
