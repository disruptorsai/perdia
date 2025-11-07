/**
 * Supabase Edge Function: Content Analyzer
 *
 * PURPOSE: Automatically analyzes content quality and SEO metrics
 *
 * TRIGGER: Database trigger when new content is added to content_queue
 *          OR manual invocation with content_id
 *
 * WHAT IT DOES:
 * 1. Receives content_id from trigger or request
 * 2. Analyzes content for:
 *    - Word count
 *    - Readability score (Flesch Reading Ease)
 *    - Keyword density
 *    - SEO recommendations
 * 3. Stores analysis results in content_queue metadata
 *
 * SETUP REQUIRED:
 * 1. Deploy function: supabase functions deploy analyze-content
 * 2. Optional: Create database trigger to auto-analyze new content
 *
 * DATABASE TRIGGER SQL (OPTIONAL):
 *
 * CREATE OR REPLACE FUNCTION trigger_content_analysis()
 * RETURNS trigger AS $$
 * BEGIN
 *   IF NEW.status = 'draft' AND NEW.content IS NOT NULL THEN
 *     PERFORM net.http_post(
 *       url => 'https://[project-ref].supabase.co/functions/v1/analyze-content',
 *       headers => '{"Authorization": "Bearer [service-role-key]", "Content-Type": "application/json"}',
 *       body => json_build_object('content_id', NEW.id)::text
 *     );
 *   END IF;
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql;
 *
 * CREATE TRIGGER auto_content_analysis
 *   AFTER INSERT OR UPDATE ON content_queue
 *   FOR EACH ROW
 *   EXECUTE FUNCTION trigger_content_analysis();
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentAnalysis {
  word_count: number;
  character_count: number;
  readability_score: number;
  readability_grade: string;
  keyword_density: Record<string, number>;
  seo_score: number;
  recommendations: string[];
  analyzed_at: string;
}

/**
 * Calculate Flesch Reading Ease score
 * Score ranges:
 * 90-100: Very Easy (5th grade)
 * 80-89: Easy (6th grade)
 * 70-79: Fairly Easy (7th grade)
 * 60-69: Standard (8th-9th grade)
 * 50-59: Fairly Difficult (10th-12th grade)
 * 30-49: Difficult (College)
 * 0-29: Very Confusing (College graduate)
 */
function calculateReadability(text: string): { score: number; grade: string } {
  // Remove HTML tags
  const plainText = text.replace(/<[^>]*>/g, ' ');

  // Count sentences
  const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length || 1;

  // Count words
  const words = plainText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length || 1;

  // Count syllables (simplified)
  let syllableCount = 0;
  for (const word of words) {
    const vowels = word.match(/[aeiouy]+/gi);
    syllableCount += vowels ? vowels.length : 1;
  }

  // Flesch Reading Ease formula
  const score = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);
  const clampedScore = Math.max(0, Math.min(100, score));

  // Determine grade level
  let grade;
  if (clampedScore >= 90) grade = 'Very Easy (5th grade)';
  else if (clampedScore >= 80) grade = 'Easy (6th grade)';
  else if (clampedScore >= 70) grade = 'Fairly Easy (7th grade)';
  else if (clampedScore >= 60) grade = 'Standard (8th-9th grade)';
  else if (clampedScore >= 50) grade = 'Fairly Difficult (High School)';
  else if (clampedScore >= 30) grade = 'Difficult (College)';
  else grade = 'Very Difficult (Graduate)';

  return { score: Math.round(clampedScore), grade };
}

/**
 * Calculate keyword density
 */
function calculateKeywordDensity(text: string, keywords: string[]): Record<string, number> {
  const plainText = text.toLowerCase().replace(/<[^>]*>/g, ' ');
  const words = plainText.split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;

  const density: Record<string, number> = {};

  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    const count = (plainText.match(new RegExp(keywordLower, 'g')) || []).length;
    density[keyword] = totalWords > 0 ? (count / totalWords) * 100 : 0;
  }

  return density;
}

/**
 * Generate SEO recommendations
 */
function generateRecommendations(
  analysis: ContentAnalysis,
  content: any
): string[] {
  const recommendations: string[] = [];

  // Word count check
  if (analysis.word_count < 300) {
    recommendations.push('Content is too short. Aim for at least 300 words for better SEO.');
  } else if (analysis.word_count < 600) {
    recommendations.push('Consider adding more content. Articles with 600+ words typically rank better.');
  }

  // Readability check
  if (analysis.readability_score < 50) {
    recommendations.push('Content readability is low. Simplify sentences for better engagement.');
  }

  // Keyword density check
  const densities = Object.values(analysis.keyword_density);
  const avgDensity = densities.length > 0 ? densities.reduce((a, b) => a + b, 0) / densities.length : 0;
  if (avgDensity < 0.5) {
    recommendations.push('Target keyword density is low. Include keywords more naturally in content.');
  } else if (avgDensity > 3) {
    recommendations.push('Target keyword density is too high. Risk of keyword stuffing - reduce usage.');
  }

  // Meta description check
  if (!content.meta_description || content.meta_description.length < 120) {
    recommendations.push('Meta description is missing or too short. Aim for 120-160 characters.');
  }

  // Title check
  if (!content.title || content.title.length < 30) {
    recommendations.push('Title is too short. Use descriptive titles with 30-60 characters.');
  } else if (content.title.length > 70) {
    recommendations.push('Title is too long. It may be truncated in search results.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Content looks good! All SEO basics are covered.');
  }

  return recommendations;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { content_id } = await req.json();

    if (!content_id) {
      throw new Error('content_id is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[Content Analyzer] Analyzing content: ${content_id}`);

    // Fetch content
    const { data: content, error: fetchError } = await supabase
      .from('content_queue')
      .select('*')
      .eq('id', content_id)
      .single();

    if (fetchError || !content) {
      throw new Error(`Failed to fetch content: ${fetchError?.message}`);
    }

    // Analyze content
    const plainText = content.content.replace(/<[^>]*>/g, ' ');
    const words = plainText.split(/\s+/).filter((w: string) => w.length > 0);

    const readability = calculateReadability(content.content);
    const keywordDensity = calculateKeywordDensity(
      content.content,
      content.target_keywords || []
    );

    const analysis: ContentAnalysis = {
      word_count: words.length,
      character_count: plainText.length,
      readability_score: readability.score,
      readability_grade: readability.grade,
      keyword_density: keywordDensity,
      seo_score: 0, // Will be calculated below
      recommendations: [],
      analyzed_at: new Date().toISOString(),
    };

    // Calculate SEO score (0-100)
    let seoScore = 100;
    if (analysis.word_count < 300) seoScore -= 20;
    else if (analysis.word_count < 600) seoScore -= 10;

    if (analysis.readability_score < 50) seoScore -= 15;
    else if (analysis.readability_score < 60) seoScore -= 5;

    const avgDensity = Object.values(keywordDensity).reduce((a, b) => a + b, 0) / (Object.keys(keywordDensity).length || 1);
    if (avgDensity < 0.5 || avgDensity > 3) seoScore -= 15;

    if (!content.meta_description || content.meta_description.length < 120) seoScore -= 10;
    if (!content.title || content.title.length < 30 || content.title.length > 70) seoScore -= 10;

    analysis.seo_score = Math.max(0, Math.min(100, seoScore));
    analysis.recommendations = generateRecommendations(analysis, content);

    console.log(`[Content Analyzer] SEO Score: ${analysis.seo_score}/100`);

    // Update content with analysis
    const { error: updateError } = await supabase
      .from('content_queue')
      .update({
        word_count: analysis.word_count,
        analysis: analysis,
      })
      .eq('id', content_id);

    if (updateError) {
      console.error('[Content Analyzer] Error updating content:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        content_id,
        analysis,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Content Analyzer] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
