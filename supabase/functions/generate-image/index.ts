/**
 * PERDIA EDUCATION - IMAGE GENERATION EDGE FUNCTION
 * ==================================================
 * Generates article hero images using AI
 *
 * Primary: Google Gemini 2.5 Flash Image ("Nano Banana")
 * Backup: OpenAI gpt-image-1 (NEW IMAGE MODEL)
 *
 * ⚠️ HARD RULE: NEVER USE DALL-E 3! Only gpt-image-1 and Gemini 2.5 Flash!
 *
 * All generated images are optimized for article hero/featured images
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { prompt, provider = 'gemini', aspectRatio = '16:9' } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid prompt parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-image] Request:', { provider, prompt: prompt.substring(0, 100) + '...' });

    // Enhance prompt with system prompt guidance
    const enhancedPrompt = `${ARTICLE_IMAGE_SYSTEM_PROMPT}\n\nUser Request: ${prompt}`;

    let imageUrl: string;
    let usedProvider: string;

    // Try primary provider (Gemini)
    if (provider === 'gemini' || provider === 'google') {
      try {
        console.log('[generate-image] Attempting Gemini 2.5 Flash Image...');
        imageUrl = await generateWithGemini(enhancedPrompt, aspectRatio);
        usedProvider = 'gemini-2.5-flash-image';
      } catch (geminiError) {
        console.error('[generate-image] Gemini failed, falling back to gpt-image-1:', geminiError);
        // Fallback to gpt-image-1 (NOT DALL-E 3!)
        imageUrl = await generateWithGPT4o(enhancedPrompt);
        usedProvider = 'gpt-image-1';
      }
    } else {
      // Use gpt-image-1 directly (NOT DALL-E 3!)
      console.log('[generate-image] Using gpt-image-1 directly...');
      imageUrl = await generateWithGPT4o(enhancedPrompt);
      usedProvider = 'gpt-image-1';
    }

    console.log('[generate-image] Success:', { provider: usedProvider, imageUrl: imageUrl.substring(0, 50) + '...' });

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        provider: usedProvider,
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
 * Generate image using Google Gemini 2.5 Flash Image
 */
async function generateWithGemini(prompt: string, aspectRatio: string): Promise<string> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY not configured');
  }

  // Map aspect ratio to Gemini format
  const ratioMap: Record<string, string> = {
    '16:9': '16:9',
    '1:1': '1:1',
    '4:3': '4:3',
    '9:16': '9:16'
  };

  const geminiRatio = ratioMap[aspectRatio] || '16:9';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
          responseMimeType: 'image/jpeg',
          responseModalities: ['image'],
          // Image generation parameters
          aspectRatio: geminiRatio,
        }
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    console.error('[Gemini] API Error:', errorData);
    throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();

  // Extract image data from response
  // Gemini returns base64 image data in the response
  if (data.candidates && data.candidates[0]?.content?.parts) {
    const imagePart = data.candidates[0].content.parts.find((p: any) => p.inlineData);
    if (imagePart?.inlineData?.data) {
      // Return base64 data URL
      return `data:image/jpeg;base64,${imagePart.inlineData.data}`;
    }
  }

  throw new Error('No image data in Gemini response');
}

/**
 * Generate image using OpenAI gpt-image-1
 * ⚠️ HARD RULE: NEVER USE DALL-E 3! Only gpt-image-1!
 */
async function generateWithGPT4o(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-image-1', // OpenAI's NEW image generation model (NOT DALL-E 3!)
      prompt: prompt,
      n: 1,
      size: '1536x1024', // Supported size for hero images (16:9 aspect ratio)
      quality: 'high', // Fixed: OpenAI expects 'high' not 'hd'
      // NOTE: gpt-image-1 does NOT support 'style' parameter (removed)
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('[gpt-image-1] API Error:', errorData);
    throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();

  if (data.data && data.data[0]?.url) {
    return data.data[0].url;
  }

  throw new Error('No image URL in OpenAI response');
}
