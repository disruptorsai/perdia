/**
 * PERDIA EDUCATION - CONTENT SUGGESTION SERVICE
 * =============================================
 * Aggregates content ideas from 4 different sources for the Article Generation Wizard
 *
 * Sources:
 * 1. Trending Questions (topic_questions table)
 * 2. High-Priority Keywords (keywords table)
 * 3. Active Topic Clusters (clusters table)
 * 4. Trending News/Topics (AI-generated)
 */

import { TopicQuestion, Keyword, Cluster, InvokeLLM } from './perdia-sdk';

// =====================================================
// SOURCE 1: TRENDING QUESTIONS
// =====================================================

/**
 * Get trending questions from topic_questions table
 * Filters out questions already used for articles
 */
export async function getTrendingQuestions(limit = 10) {
  try {
    const questions = await TopicQuestion.find(
      {
        used_for_article_id: null, // Only unused questions
      },
      {
        orderBy: [
          { column: 'priority', ascending: false },
          { column: 'search_volume', ascending: false },
        ],
        limit,
      }
    );

    return questions.map((q) => ({
      id: `question-${q.id}`,
      type: 'question',
      title: q.question,
      description: `Search volume: ${q.search_volume || 'Unknown'}`,
      keywords: q.extracted_keywords || [],
      priority: q.priority || 3,
      source: 'Trending Questions',
      sourceIcon: '❓',
      metadata: {
        questionId: q.id,
        searchVolume: q.search_volume,
        category: q.category,
      },
    }));
  } catch (error) {
    console.error('[suggestion-service] Error fetching trending questions:', error);
    return [];
  }
}

// =====================================================
// SOURCE 2: HIGH-PRIORITY KEYWORDS
// =====================================================

/**
 * Get high-priority keywords from keywords table
 */
export async function getHighPriorityKeywords(limit = 10) {
  try {
    const keywords = await Keyword.find(
      {
        priority: { gte: 3 }, // Priority 3, 4, or 5
        list_type: 'new_target',
      },
      {
        orderBy: [
          { column: 'priority', ascending: false },
          { column: 'search_volume', ascending: false },
        ],
        limit,
      }
    );

    return keywords.map((k) => ({
      id: `keyword-${k.id}`,
      type: 'keyword',
      title: `Write about: ${k.keyword}`,
      description: `Volume: ${k.search_volume || 'Unknown'} | Difficulty: ${k.difficulty || 'Unknown'} | Priority: ${k.priority}/5`,
      keywords: [k.keyword, ...(k.related_keywords || [])],
      priority: k.priority || 3,
      source: 'SEO Keywords',
      sourceIcon: '🎯',
      metadata: {
        keywordId: k.id,
        keyword: k.keyword,
        searchVolume: k.search_volume,
        difficulty: k.difficulty,
        intent: k.intent,
        category: k.category,
      },
    }));
  } catch (error) {
    console.error('[suggestion-service] Error fetching keywords:', error);
    return [];
  }
}

// =====================================================
// SOURCE 3: ACTIVE TOPIC CLUSTERS
// =====================================================

/**
 * Get active topic clusters from clusters table
 */
export async function getActiveClusters(limit = 5) {
  try {
    const clusters = await Cluster.find(
      {
        status: 'active',
      },
      {
        orderBy: { column: 'priority', ascending: false },
        limit,
      }
    );

    return clusters.map((c) => ({
      id: `cluster-${c.id}`,
      type: 'cluster',
      title: c.name,
      description: c.description || 'Explore this topic cluster',
      keywords: c.subtopics || [],
      priority: c.priority || 3,
      source: 'Topic Clusters',
      sourceIcon: '📚',
      metadata: {
        clusterId: c.id,
        name: c.name,
        subtopics: c.subtopics,
        articleCount: c.article_count || 0,
        keywordCount: c.keyword_count || 0,
      },
    }));
  } catch (error) {
    console.error('[suggestion-service] Error fetching clusters:', error);
    return [];
  }
}

// =====================================================
// SOURCE 4: TRENDING NEWS/TOPICS (AI-GENERATED)
// =====================================================

/**
 * Generate trending topics using AI
 * Analyzes current education industry trends
 */
export async function getTrendingNews(limit = 5) {
  try {
    const prompt = `You are a content strategist for GetEducated.com, analyzing current trends in higher education.

Generate ${limit} trending article topics that would perform well on GetEducated.com right now.

Consider:
- Current events in higher education (2025)
- Emerging degree programs and online learning trends
- Student pain points and questions
- Career-focused educational content
- SEO opportunities with high search potential

For each topic, provide:
1. Title (compelling, SEO-optimized, 60-80 characters)
2. Description (why this topic is trending/relevant right now)
3. Target keywords (3-5 keywords)

Return as JSON array:
[
  {
    "title": "...",
    "description": "...",
    "keywords": ["keyword1", "keyword2", ...]
  }
]`;

    const response = await InvokeLLM({
      prompt,
      provider: 'claude',
      model: 'claude-sonnet-4-5-20250929',
      temperature: 0.7,
      max_tokens: 2000,
      response_json_schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    });

    let topics = [];
    try {
      topics = typeof response === 'string' ? JSON.parse(response) : response;
    } catch (e) {
      console.warn('[suggestion-service] Failed to parse trending topics:', e);
      return [];
    }

    return topics.slice(0, limit).map((t, index) => ({
      id: `news-${Date.now()}-${index}`,
      type: 'news',
      title: t.title,
      description: t.description,
      keywords: t.keywords || [],
      priority: 4, // High priority for trending topics
      source: 'Trending News',
      sourceIcon: '📰',
      metadata: {
        generatedAt: new Date().toISOString(),
        sourceUrl: null,
      },
    }));
  } catch (error) {
    console.error('[suggestion-service] Error generating trending topics:', error);
    return [];
  }
}

// =====================================================
// AGGREGATION FUNCTIONS
// =====================================================

/**
 * Get all suggestions from all sources
 *
 * @param {Object} options - Options
 * @param {boolean} [options.includeTrendingQuestions=true] - Include trending questions
 * @param {boolean} [options.includeKeywords=true] - Include keywords
 * @param {boolean} [options.includeClusters=true] - Include clusters
 * @param {boolean} [options.includeTrendingNews=true] - Include trending news
 * @param {number} [options.limit=30] - Total limit across all sources
 * @returns {Promise<Array>} Combined suggestions sorted by priority
 */
export async function getAllSuggestions(options = {}) {
  const {
    includeTrendingQuestions = true,
    includeKeywords = true,
    includeClusters = true,
    includeTrendingNews = true,
    limit = 30,
  } = options;

  // Fetch from all sources in parallel
  const [questions, keywords, clusters, news] = await Promise.all([
    includeTrendingQuestions ? getTrendingQuestions(10) : Promise.resolve([]),
    includeKeywords ? getHighPriorityKeywords(10) : Promise.resolve([]),
    includeClusters ? getActiveClusters(5) : Promise.resolve([]),
    includeTrendingNews ? getTrendingNews(5) : Promise.resolve([]),
  ]);

  // Combine all suggestions
  const allSuggestions = [...questions, ...keywords, ...clusters, ...news];

  // Sort by priority (highest first)
  allSuggestions.sort((a, b) => b.priority - a.priority);

  // Return limited results
  return allSuggestions.slice(0, limit);
}

/**
 * Get suggestions grouped by source
 *
 * @param {Object} options - Options
 * @param {number} [options.questionsLimit=10] - Limit for questions
 * @param {number} [options.keywordsLimit=10] - Limit for keywords
 * @param {number} [options.clustersLimit=5] - Limit for clusters
 * @param {number} [options.newsLimit=5] - Limit for news
 * @returns {Promise<Object>} Suggestions grouped by source
 */
export async function getSuggestionsGrouped(options = {}) {
  const {
    questionsLimit = 10,
    keywordsLimit = 10,
    clustersLimit = 5,
    newsLimit = 5,
  } = options;

  // Fetch from all sources in parallel
  const [questions, keywords, clusters, news] = await Promise.all([
    getTrendingQuestions(questionsLimit),
    getHighPriorityKeywords(keywordsLimit),
    getActiveClusters(clustersLimit),
    getTrendingNews(newsLimit),
  ]);

  // Combine for 'all' view
  const all = [...questions, ...keywords, ...clusters, ...news];
  all.sort((a, b) => b.priority - a.priority);

  return {
    questions,
    keywords,
    clusters,
    news,
    all,
  };
}

/**
 * Mark a suggestion as used after generating content
 *
 * @param {Object} suggestion - Suggestion object
 * @param {string} articleId - ID of the created article
 */
export async function markSuggestionAsUsed(suggestion, articleId) {
  try {
    if (suggestion.type === 'question' && suggestion.metadata.questionId) {
      await TopicQuestion.update(suggestion.metadata.questionId, {
        used_for_article_id: articleId,
        used_at: new Date().toISOString(),
      });
    }
    // Note: We don't mark keywords or clusters as "used" since they can be reused
    // for multiple articles
  } catch (error) {
    console.error('[suggestion-service] Error marking suggestion as used:', error);
  }
}

export default {
  getTrendingQuestions,
  getHighPriorityKeywords,
  getActiveClusters,
  getTrendingNews,
  getAllSuggestions,
  getSuggestionsGrouped,
  markSuggestionAsUsed,
};
