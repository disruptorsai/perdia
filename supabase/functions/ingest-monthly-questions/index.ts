/**
 * INGEST MONTHLY QUESTIONS EDGE FUNCTION
 * =======================================
 * Supabase Edge Function / Cron Job
 *
 * Purpose: Pull top questions about higher education monthly
 *
 * Runs: 1st of each month via Supabase Cron or manual invocation
 *
 * Logic:
 * 1. Call Perplexity API to find top 50 questions about higher ed
 * 2. Extract keywords from each question
 * 3. Calculate priority based on search volume
 * 4. Insert into topic_questions table (skip duplicates)
 * 5. Log results
 *
 * Deploy:
 *   npx supabase functions deploy ingest-monthly-questions --project-ref yvvtsfgryweqfppilkvo
 *
 * Set Secrets:
 *   npx supabase secrets set PERPLEXITY_API_KEY=your_key --project-ref yvvtsfgryweqfppilkvo
 *
 * Schedule (via Supabase Dashboard → Database → Cron Jobs):
 *   SELECT cron.schedule(
 *     'ingest-monthly-questions',
 *     '0 0 1 * *', -- 1st of month at midnight
 *     $$ SELECT net.http_post(
 *       url:='https://yvvtsfgryweqfppilkvo.supabase.co/functions/v1/ingest-monthly-questions',
 *       headers:='{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
 *     ) $$
 *   );
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY') || '';
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[Monthly Ingest] Starting monthly questions ingest...');

  try {
    // Validate API key
    if (!PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY not configured');
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Call Perplexity to find top questions
    console.log('[Monthly Ingest] Querying Perplexity for top questions...');

    const prompt = `
What are the top 50 questions people are asking about higher education, college degrees, and online learning right now (in ${new Date().getFullYear()})?

For each question, provide:
- The exact question text
- Related keywords (3-5 keywords)
- Estimated search volume (high/medium/low)
- Priority (1-5, where 5 is highest priority for blog content)

OUTPUT FORMAT (JSON only, no additional text):
{
  "questions": [
    {
      "question": "What is the difference between college and university?",
      "keywords": ["college", "university", "higher education"],
      "search_volume": "high",
      "priority": 5
    }
  ]
}

Focus on questions that would make excellent blog article topics for GetEducated.com.
Return ONLY valid JSON.
    `.trim();

    const perplexityResponse = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'pplx-70b-online',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 2000,
        return_citations: true,
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      throw new Error(`Perplexity API error: ${perplexityResponse.status} - ${errorText}`);
    }

    const perplexityData = await perplexityResponse.json();
    const responseContent = perplexityData.choices[0].message.content;

    console.log('[Monthly Ingest] Perplexity response received');

    // Parse JSON response
    let questionsData;
    try {
      // Try to extract JSON from response (in case there's extra text)
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        questionsData = JSON.parse(jsonMatch[0]);
      } else {
        questionsData = JSON.parse(responseContent);
      }
    } catch (parseError) {
      console.error('[Monthly Ingest] Failed to parse Perplexity response:', responseContent);
      throw new Error('Failed to parse Perplexity response as JSON');
    }

    const questions = questionsData.questions || [];
    console.log(`[Monthly Ingest] Parsed ${questions.length} questions`);

    if (questions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, inserted: 0, message: 'No questions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert questions into database
    let insertedCount = 0;
    let duplicateCount = 0;
    const errors = [];

    for (const q of questions) {
      try {
        // Convert search volume to estimated number
        let searchVolumeNum = 500; // Default medium
        if (q.search_volume === 'high') searchVolumeNum = 1000;
        else if (q.search_volume === 'low') searchVolumeNum = 100;

        const { error } = await supabase
          .from('topic_questions')
          .insert({
            question_text: q.question,
            source: 'monthly',
            keywords_extracted: q.keywords || [],
            search_volume: searchVolumeNum,
            priority: q.priority || 3,
            discovered_at: new Date().toISOString(),
          });

        if (error) {
          // Check if duplicate (unique constraint violation)
          if (error.message.includes('unique') || error.code === '23505') {
            duplicateCount++;
            console.log(`[Monthly Ingest] Skipped duplicate: "${q.question}"`);
          } else {
            console.error(`[Monthly Ingest] Insert error for "${q.question}":`, error);
            errors.push({
              question: q.question,
              error: error.message,
            });
          }
        } else {
          insertedCount++;
          console.log(`[Monthly Ingest] Inserted: "${q.question}"`);
        }
      } catch (error) {
        console.error(`[Monthly Ingest] Error inserting question:`, error);
        errors.push({
          question: q.question,
          error: error.message,
        });
      }
    }

    console.log('[Monthly Ingest] Complete:', {
      total: questions.length,
      inserted: insertedCount,
      duplicates: duplicateCount,
      errors: errors.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        total: questions.length,
        inserted: insertedCount,
        duplicates: duplicateCount,
        errors: errors.length > 0 ? errors : undefined,
        message: `Ingested ${insertedCount} new questions (${duplicateCount} duplicates skipped)`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[Monthly Ingest] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
