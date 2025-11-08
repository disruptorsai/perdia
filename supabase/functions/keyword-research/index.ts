/**
 * Supabase Edge Function: Keyword Research Engine
 *
 * PURPOSE: Batch keyword research using DataForSEO API
 *
 * FEATURES:
 * - JWT authentication required
 * - Batch processing (up to 100 keywords per request)
 * - DataForSEO API integration
 * - Search volume, difficulty, competition metrics
 * - Related keyword suggestions
 * - Priority score calculation
 * - Bulk database upsert
 *
 * REQUEST BODY:
 * {
 *   keywords: string[];           // Required: Array of seed keywords (max 100)
 *   location?: number;            // Optional: DataForSEO location code (default: 2840 = US)
 *   language?: string;            // Optional: Language code (default: 'en')
 *   include_suggestions?: boolean; // Optional: Include related keywords (default: true)
 * }
 *
 * RESPONSE:
 * {
 *   success: true,
 *   data: {
 *     keywords: Array<{
 *       keyword: string,
 *       search_volume: number,
 *       difficulty: number,
 *       competition: number,
 *       priority: number,
 *       cpc: number,
 *       trend: number[]
 *     }>,
 *     suggestions: string[],
 *     summary: {
 *       total_keywords: number,
 *       avg_search_volume: number,
 *       high_priority_count: number
 *     }
 *   }
 * }
 *
 * ENVIRONMENT VARIABLES REQUIRED:
 * - DATAFORSEO_LOGIN
 * - DATAFORSEO_PASSWORD
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
import { getAuthenticatedClient, bulkUpsertKeywords } from '../_shared/database.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('keyword-research');

interface KeywordData {
  keyword: string;
  search_volume: number;
  difficulty: number;
  competition: number;
  cpc?: number;
  trend?: number[];
  priority?: number;
}

interface DataForSEOResponse {
  status_code: number;
  tasks: Array<{
    result: Array<{
      keyword: string;
      search_volume: number;
      keyword_difficulty: number;
      competition?: number;
      cpc?: number;
      monthly_searches?: Array<{ search_volume: number }>;
    }>;
  }>;
}

/**
 * Call DataForSEO Keyword Research API
 */
async function fetchKeywordData(
  keywords: string[],
  location = 2840,
  language = 'en'
): Promise<KeywordData[]> {
  const login = Deno.env.get('DATAFORSEO_LOGIN');
  const password = Deno.env.get('DATAFORSEO_PASSWORD');

  if (!login || !password) {
    throw new Error('DataForSEO credentials not configured');
  }

  logger.info('Fetching keyword data from DataForSEO', {
    keywordCount: keywords.length,
    location,
    language,
  });

  // DataForSEO API endpoint
  const apiUrl = 'https://api.dataforseo.com/v3/keywords_data/google/search_volume/live';

  // Prepare request body
  const requestBody = [{
    keywords,
    location_code: location,
    language_code: language,
  }];

  // Make API request
  const authString = btoa(`${login}:${password}`);
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authString}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DataForSEO API error: ${response.status} ${errorText}`);
  }

  const data: DataForSEOResponse = await response.json();

  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO API returned status: ${data.status_code}`);
  }

  // Parse results
  const results = data.tasks[0]?.result || [];
  const keywordDataArray: KeywordData[] = results.map(item => {
    // Calculate trend from monthly searches
    const trend = item.monthly_searches?.map(m => m.search_volume) || [];

    // Calculate difficulty (normalize to 0-100)
    const difficulty = item.keyword_difficulty || 0;

    // Calculate priority score (search volume / difficulty ratio)
    const priority = difficulty > 0
      ? Math.round((item.search_volume / difficulty) * 10)
      : item.search_volume > 0 ? 100 : 0;

    return {
      keyword: item.keyword,
      search_volume: item.search_volume || 0,
      difficulty: Math.round(difficulty),
      competition: item.competition || 0,
      cpc: item.cpc || 0,
      trend,
      priority,
    };
  });

  logger.info('Keyword data fetched successfully', {
    resultCount: keywordDataArray.length,
  });

  return keywordDataArray;
}

/**
 * Get keyword suggestions from DataForSEO
 */
async function fetchKeywordSuggestions(
  seedKeyword: string,
  location = 2840,
  language = 'en',
  limit = 20
): Promise<string[]> {
  const login = Deno.env.get('DATAFORSEO_LOGIN');
  const password = Deno.env.get('DATAFORSEO_PASSWORD');

  if (!login || !password) {
    return [];
  }

  logger.info('Fetching keyword suggestions', { seedKeyword, limit });

  const apiUrl = 'https://api.dataforseo.com/v3/keywords_data/google/keyword_suggestions/live';

  const requestBody = [{
    keyword: seedKeyword,
    location_code: location,
    language_code: language,
    limit,
  }];

  const authString = btoa(`${login}:${password}`);
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authString}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    logger.warn('Failed to fetch suggestions', { status: response.status });
    return [];
  }

  const data: DataForSEOResponse = await response.json();
  const results = data.tasks[0]?.result || [];

  return results.map(item => item.keyword);
}

/**
 * Calculate summary statistics
 */
function calculateSummary(keywords: KeywordData[]) {
  const totalKeywords = keywords.length;
  const avgSearchVolume = keywords.reduce((sum, kw) => sum + kw.search_volume, 0) / totalKeywords;
  const highPriorityCount = keywords.filter(kw => (kw.priority || 0) >= 50).length;

  return {
    total_keywords: totalKeywords,
    avg_search_volume: Math.round(avgSearchVolume),
    high_priority_count: highPriorityCount,
  };
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
    validateRequiredFields(body, ['keywords']);

    const {
      keywords,
      location = 2840,
      language = 'en',
      include_suggestions = true,
    } = body;

    // Validate keywords array
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return createErrorResponse(
        'Keywords must be a non-empty array',
        ErrorTypes.VALIDATION_ERROR
      );
    }

    if (keywords.length > 100) {
      return createErrorResponse(
        'Maximum 100 keywords per request',
        ErrorTypes.VALIDATION_ERROR
      );
    }

    // Fetch keyword data from DataForSEO
    const keywordData = await fetchKeywordData(keywords, location, language);

    // Fetch suggestions for first keyword if requested
    let suggestions: string[] = [];
    if (include_suggestions && keywords.length > 0) {
      suggestions = await fetchKeywordSuggestions(keywords[0], location, language);
    }

    // Save to database
    const client = getAuthenticatedClient(user.id);
    const keywordsToSave = keywordData.map(kw => ({
      keyword: kw.keyword,
      search_volume: kw.search_volume,
      difficulty: kw.difficulty,
      competition: kw.competition,
      cpc: kw.cpc,
      trend_data: kw.trend,
      priority: kw.priority,
      list_type: 'research',
      status: 'researched',
    }));

    await bulkUpsertKeywords(client, user.id, keywordsToSave);

    // Calculate summary
    const summary = calculateSummary(keywordData);

    logger.complete({
      keywordsProcessed: keywordData.length,
      suggestionsFound: suggestions.length,
    });

    return createSuccessResponse(
      {
        keywords: keywordData,
        suggestions,
        summary,
      },
      `Successfully researched ${keywordData.length} keywords`
    );
  } catch (error) {
    logger.failed(error);
    return handleError(error, 'keyword-research');
  }
});
