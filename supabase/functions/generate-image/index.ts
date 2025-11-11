/**
 * PERDIA EDUCATION - IMAGE GENERATION EDGE FUNCTION
 * ==================================================
 * Generates article hero images using AI
 *
 * ONLY uses: Google Gemini 2.5 Flash Image ("Nano Banana" 🍌)
 *
 * ⚠️ HARD RULE: ONLY Gemini! No OpenAI, no DALL-E!
 *
 * All generated images are optimized for article hero/featured images
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Professional system prompt for article-optimized images
const ARTICLE_IMAGE_SYSTEM_PROMPT = `You are an expert at creating professional, high-quality hero images for educational articles.

Your images should be:
- Professional and polished, suitable for a premium educational website
- Clean and uncluttered with clear focal points
- High contrast with readable text (if any)
- Visually appealing with balanced composition
- Relevant to the article topic without being too literal
- Modern and contemporary in style
- Suitable for 1200x630px (16:9 aspect ratio) hero images

Avoid:
- Overly busy or cluttered compositions
- Low contrast or muddy colors
- Generic stock photo aesthetics
- Cheesy or cliché imagery
- Text-heavy designs (minimal text if any)
- Dated or old-fashioned styles

The image should make the article look premium, authoritative, and engaging.`;

serve(async (req) => {
  // CORS headers - handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { prompt, aspectRatio = '16:9' } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid prompt parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-image] Request:', { prompt: prompt.substring(0, 100) + '...', aspectRatio });

    // Enhance prompt with system prompt guidance
    const enhancedPrompt = `${ARTICLE_IMAGE_SYSTEM_PROMPT}\n\nUser Request: ${prompt}`;

    // Generate with Gemini 2.5 Flash Image (Nano Banana 🍌)
    console.log('[generate-image] Generating with Nano Banana (Gemini 2.5 Flash Image)...');
    const imageUrl = await generateWithGemini(enhancedPrompt, aspectRatio);

    console.log('[generate-image] Success! Image generated:', imageUrl.substring(0, 50) + '...');

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        provider: 'gemini-2.5-flash-image',
        prompt: prompt // Return original prompt
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('[generate-image] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Image generation failed',
        message: error.message || 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

/**
 * Generate image using Google Gemini 2.5 Flash Image ("Nano Banana" 🍌)
 * Official docs: https://ai.google.dev/gemini-api/docs/image-generation
 */
async function generateWithGemini(prompt: string, aspectRatio: string): Promise<string> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY not configured in Supabase secrets');
  }

  // Map aspect ratio to Gemini format
  // Supported: 1:1, 3:2, 2:3, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
  const ratioMap: Record<string, string> = {
    '16:9': '16:9',
    '1:1': '1:1',
    '4:3': '4:3',
    '9:16': '9:16',
    '21:9': '21:9'
  };

  const geminiRatio = ratioMap[aspectRatio] || '16:9';

  console.log('[Gemini] Calling API with aspect ratio:', geminiRatio);

  // Official Gemini API endpoint for Gemini 2.5 Flash Image
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';

  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        role: 'USER',
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: geminiRatio
        }
      }
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('[Gemini] API Error Response:', errorData);
    throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  console.log('[Gemini] Response received, extracting image data...');

  // Extract image data from response
  // Gemini returns base64 image data in parts[].inlineData.data
  if (data.candidates && data.candidates[0]?.content?.parts) {
    for (const part of data.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        console.log('[Gemini] Image data found, size:', part.inlineData.data.length, 'chars');
        // Return base64 data URL
        const mimeType = part.inlineData.mimeType || 'image/jpeg';
        return `data:${mimeType};base64,${part.inlineData.data}`;
      }
    }
  }

  console.error('[Gemini] Response structure:', JSON.stringify(data, null, 2));
  throw new Error('No image data in Gemini response - check logs for response structure');
}

// OpenAI fallback removed - we only use Gemini 2.5 Flash Image (Nano Banana 🍌)
