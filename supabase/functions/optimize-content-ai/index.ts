/**
 * Supabase Edge Function: AI Content Optimizer
 *
 * PURPOSE: AI-powered content analysis and optimization using Claude
 *
 * FEATURES:
 * - JWT authentication required
 * - Content structure analysis
 * - Readability assessment
 * - Keyword density optimization
 * - Meta tag optimization
 * - Specific actionable recommendations
 * - Optional content rewriting
 * - Stores analysis in database
 *
 * REQUEST BODY:
 * {
 *   content_id: string;           // Required: Content queue item ID
 *   analysis_type?: string;       // Optional: 'full' | 'quick' | 'seo' (default: 'full')
 *   include_rewrite?: boolean;    // Optional: Generate rewritten sections (default: false)
 *   target_keywords?: string[];   // Optional: Specific keywords to optimize for
 * }
 *
 * RESPONSE:
 * {
 *   success: true,
 *   data: {
 *     content_id: string,
 *     analysis: {
 *       readability_score: number,
 *       keyword_density: Object,
 *       seo_score: number,
 *       recommendations: Array<{
 *         category: string,
 *         severity: 'low' | 'medium' | 'high',
 *         issue: string,
 *         suggestion: string
 *       }>,
 *       meta_optimization: {
 *         title: string,
 *         description: string,
 *         improvements: string[]
 *       },
 *       rewrites?: Object
 *     }
 *   }
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { authenticateRequest } from '../_shared/auth.ts';
import {
  createErrorResponse,
  createSuccessResponse,
  createCorsPreflightResponse,
  handleError,
  validateRequiredFields,
  ErrorTypes,
} from '../_shared/errors.ts';
import {
  getAuthenticatedClient,
  getContentQueueItem,
  updateContentQueueItem,
} from '../_shared/database.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('optimize-content-ai');

interface OptimizationRecommendation {
  category: 'seo' | 'readability' | 'structure' | 'keywords' | 'meta';
  severity: 'low' | 'medium' | 'high';
  issue: string;
  suggestion: string;
}

interface ContentAnalysis {
  readability_score: number;
  keyword_density: Record<string, number>;
  seo_score: number;
  word_count: number;
  recommendations: OptimizationRecommendation[];
  meta_optimization: {
    title: string;
    description: string;
    improvements: string[];
  };
  rewrites?: Record<string, string>;
}

/**
 * Call invoke-llm function for AI analysis
 */
async function invokeAI(prompt: string, systemPrompt: string): Promise<string> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const invokeUrl = `${supabaseUrl}/functions/v1/invoke-llm`;

  const response = await fetch(invokeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      system_prompt: systemPrompt,
      provider: 'claude',
      model: 'claude-sonnet-4-5-20250929',
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI invocation failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.response || data.content || '';
}

/**
 * Analyze content with AI
 */
async function analyzeContent(
  content: string,
  title: string,
  targetKeywords: string[],
  analysisType: string
): Promise<ContentAnalysis> {
  logger.info('Analyzing content with AI', { analysisType, wordCount: content.split(' ').length });

  const keywordsStr = targetKeywords.join(', ');

  const systemPrompt = `You are an expert SEO content analyst and optimizer.
Your role is to analyze content for SEO effectiveness, readability, structure, and provide specific, actionable recommendations.
Always provide constructive, detailed feedback with concrete examples.`;

  const analysisPrompt = `Analyze this SEO content and provide a comprehensive assessment.

TITLE: ${title}

TARGET KEYWORDS: ${keywordsStr}

CONTENT:
${content}

Provide your analysis in the following JSON structure:
{
  "readability_score": <0-100 score>,
  "seo_score": <0-100 score>,
  "word_count": <number>,
  "keyword_density": {
    "<keyword>": <percentage as decimal>
  },
  "recommendations": [
    {
      "category": "seo|readability|structure|keywords|meta",
      "severity": "low|medium|high",
      "issue": "<specific issue found>",
      "suggestion": "<actionable suggestion with examples>"
    }
  ],
  "meta_optimization": {
    "title": "<optimized title (60 chars max)>",
    "description": "<optimized meta description (155 chars max)>",
    "improvements": ["<specific improvement made>"]
  }
}

Focus on:
- Keyword optimization and density
- Content structure and headings
- Readability and engagement
- Meta tags optimization
- Internal linking opportunities
- SEO best practices`;

  const aiResponse = await invokeAI(analysisPrompt, systemPrompt);

  // Parse AI response (should be JSON)
  try {
    const analysis = JSON.parse(aiResponse);
    return analysis as ContentAnalysis;
  } catch (error) {
    logger.warn('Failed to parse AI response as JSON, using fallback');
    // Fallback: create basic analysis
    return {
      readability_score: 70,
      keyword_density: {},
      seo_score: 65,
      word_count: content.split(' ').length,
      recommendations: [{
        category: 'seo',
        severity: 'medium',
        issue: 'AI analysis parsing failed',
        suggestion: 'Review content manually for optimization opportunities',
      }],
      meta_optimization: {
        title,
        description: '',
        improvements: [],
      },
    };
  }
}

/**
 * Generate rewritten sections
 */
async function generateRewrites(
  content: string,
  title: string,
  recommendations: OptimizationRecommendation[]
): Promise<Record<string, string>> {
  logger.info('Generating content rewrites');

  // Find high-severity recommendations that need rewrites
  const rewriteNeeded = recommendations.filter(r => r.severity === 'high');

  if (rewriteNeeded.length === 0) {
    return {};
  }

  const systemPrompt = `You are an expert SEO content writer.
Rewrite content sections to address specific SEO and readability issues while maintaining the core message.`;

  const rewritePrompt = `Based on these recommendations, rewrite the relevant sections of this content:

TITLE: ${title}

RECOMMENDATIONS:
${rewriteNeeded.map(r => `- ${r.issue}: ${r.suggestion}`).join('\n')}

ORIGINAL CONTENT:
${content}

Provide your rewrites in JSON format:
{
  "introduction": "<rewritten intro if needed>",
  "conclusion": "<rewritten conclusion if needed>",
  "meta_description": "<optimized meta description>",
  "sections": {
    "<section_name>": "<rewritten section>"
  }
}`;

  const aiResponse = await invokeAI(rewritePrompt, systemPrompt);

  try {
    return JSON.parse(aiResponse);
  } catch (error) {
    logger.warn('Failed to parse rewrite response');
    return {};
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return createCorsPreflightResponse();
  }

  try {
    logger.start();

    // Authenticate request
    const user = await authenticateRequest(req);
    logger.info('User authenticated', { userId: user.id, email: user.email });

    // Parse request body
    const body = await req.json();
    validateRequiredFields(body, ['content_id']);

    const {
      content_id,
      analysis_type = 'full',
      include_rewrite = false,
      target_keywords,
    } = body;

    // Initialize database client
    const client = getAuthenticatedClient(user.id);

    // Fetch content
    logger.info('Fetching content', { contentId: content_id });
    const content = await getContentQueueItem(client, content_id, user.id);

    if (!content) {
      return createErrorResponse(
        'Content not found',
        ErrorTypes.NOT_FOUND
      );
    }

    // Extract target keywords
    const keywords = target_keywords || content.target_keywords || [];

    if (keywords.length === 0) {
      logger.warn('No target keywords specified');
    }

    // Analyze content with AI
    const analysis = await analyzeContent(
      content.content,
      content.title,
      keywords,
      analysis_type
    );

    // Generate rewrites if requested
    if (include_rewrite) {
      analysis.rewrites = await generateRewrites(
        content.content,
        content.title,
        analysis.recommendations
      );
    }

    // Save analysis to database
    await updateContentQueueItem(client, content_id, user.id, {
      analysis: analysis,
      optimization_score: analysis.seo_score,
    });

    logger.complete({
      seoScore: analysis.seo_score,
      readabilityScore: analysis.readability_score,
      recommendationCount: analysis.recommendations.length,
    });

    return createSuccessResponse(
      {
        content_id,
        analysis,
      },
      'Content analyzed successfully'
    );
  } catch (error) {
    logger.failed(error);
    return handleError(error, 'optimize-content-ai');
  }
});
