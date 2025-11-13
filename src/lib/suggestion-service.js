/**
 * Suggestion Aggregation Service
 *
 * Aggregates content suggestions from 4 sources:
 * 1. Trending Questions (topic_questions table)
 * 2. High-Priority Keywords (keywords table)
 * 3. Trending News/Topics (via AI)
 * 4. Active Clusters (clusters table)
 *
 * All suggestions are formatted for zero-typing UX - user just clicks to select
 */

import { supabase } from '@/lib/supabase-client';
import { InvokeLLM } from '@/lib/perdia-sdk';

/**
 * Fetch trending questions from topic_questions table
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Trending questions formatted as suggestions
 */
export async function getTrendingQuestions(options = {}) {
  const { limit = 10 } = options;

  const { data, error } = await supabase
    .from('topic_questions')
    .select('*')
    .is('used_for_article_id', null) // Only unused questions
    .order('priority', { ascending: false })
    .order('search_volume', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching trending questions:', error);
    return [];
  }

  return (data || []).map(question => ({
    id: question.id,
    type: 'question',
    title: question.question_text,
    description: `${question.search_volume || 'Unknown'} monthly searches`,
    keywords: question.keywords_extracted || [],
    priority: question.priority || 3,
    source: 'Trending Questions',
    sourceIcon: '❓',
    metadata: {
      questionId: question.id,
      searchVolume: question.search_volume,
      source: question.source
    }
  }));
}

/**
 * Fetch high-priority keywords
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Keywords formatted as suggestions
 */
export async function getHighPriorityKeywords(options = {}) {
  const { limit = 10 } = options;

  const { data, error } = await supabase
    .from('keywords')
    .select('*')
    .gte('priority', 3) // Priority 3 or higher
    .order('priority', { ascending: false })
    .order('search_volume', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching keywords:', error);
    return [];
  }

  return (data || []).map(keyword => ({
    id: keyword.id,
    type: 'keyword',
    title: `Write about: ${keyword.keyword}`,
    description: `${keyword.search_volume || 0} searches/mo | Difficulty: ${keyword.difficulty || 'Unknown'}`,
    keywords: [keyword.keyword],
    priority: keyword.priority || 3,
    source: 'SEO Keywords',
    sourceIcon: '🎯',
    metadata: {
      keywordId: keyword.id,
      searchVolume: keyword.search_volume,
      difficulty: keyword.difficulty,
      intent: keyword.intent
    }
  }));
}

/**
 * Fetch active topic clusters
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Clusters formatted as suggestions
 */
export async function getActiveClusters(options = {}) {
  const { limit = 5 } = options;

  const { data, error } = await supabase
    .from('clusters')
    .select('*')
    .eq('status', 'active')
    .order('priority', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching clusters:', error);
    return [];
  }

  return (data || []).map(cluster => ({
    id: cluster.id,
    type: 'cluster',
    title: cluster.name,
    description: cluster.description || `${cluster.article_count || 0} articles | ${cluster.keyword_count || 0} keywords`,
    keywords: cluster.subtopics || [],
    priority: cluster.priority || 3,
    source: 'Topic Clusters',
    sourceIcon: '📚',
    metadata: {
      clusterId: cluster.id,
      targetAudience: cluster.target_audience,
      contentBrief: cluster.content_brief,
      internalLinkTargets: cluster.internal_link_targets
    }
  }));
}

/**
 * Generate trending news/topics via AI
 * @param {Object} options - Query options
 * @returns {Promise<Array>} AI-generated trending topics
 */
export async function getTrendingNews(options = {}) {
  const { limit = 5, category = 'higher education' } = options;

  try {
    const response = await InvokeLLM({
      prompt: `You are a content strategist for an education website. Find the top ${limit} trending topics in ${category} right now.

For each topic, provide:
1. A compelling article title (60-70 characters, SEO-optimized)
2. A brief description (why this is trending, relevance)
3. Target keywords (3-5 keywords)
4. Estimated search interest level (1-5)

Return ONLY a JSON array with this structure:
[
  {
    "title": "Article title here",
    "description": "Why this topic is trending",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "priority": 4,
    "source_url": "URL of trending source if available"
  }
]

Focus on topics that would interest students researching online degrees, career changes, or professional development.`,
      provider: 'claude',
      model: 'claude-sonnet-4-5-20250929',
      temperature: 0.7,
      max_tokens: 2000
    });

    // Parse JSON response
    let trendingTopics = [];
    try {
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        trendingTopics = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Error parsing trending topics:', parseError);
      return [];
    }

    return trendingTopics.map((topic, index) => ({
      id: `news-${Date.now()}-${index}`,
      type: 'news',
      title: topic.title,
      description: topic.description,
      keywords: topic.keywords || [],
      priority: topic.priority || 3,
      source: 'Trending News',
      sourceIcon: '📰',
      metadata: {
        sourceUrl: topic.source_url,
        generatedAt: new Date().toISOString()
      }
    }));
  } catch (error) {
    console.error('Error generating trending news:', error);
    return [];
  }
}

/**
 * Get all suggestions from all sources
 * @param {Object} options - Aggregation options
 * @returns {Promise<Array>} Combined suggestions from all sources
 */
export async function getAllSuggestions(options = {}) {
  const {
    includeTrendingQuestions = true,
    includeKeywords = true,
    includeClusters = true,
    includeTrendingNews = true,
    limit = 30
  } = options;

  const suggestions = [];

  // Fetch from all sources in parallel
  const promises = [];

  if (includeTrendingQuestions) {
    promises.push(getTrendingQuestions({ limit: 10 }));
  }

  if (includeKeywords) {
    promises.push(getHighPriorityKeywords({ limit: 10 }));
  }

  if (includeClusters) {
    promises.push(getActiveClusters({ limit: 5 }));
  }

  if (includeTrendingNews) {
    promises.push(getTrendingNews({ limit: 5 }));
  }

  const results = await Promise.all(promises);

  // Combine all results
  results.forEach(result => {
    suggestions.push(...result);
  });

  // Sort by priority (highest first)
  suggestions.sort((a, b) => b.priority - a.priority);

  // Return top N suggestions
  return suggestions.slice(0, limit);
}

/**
 * Get suggestions grouped by source
 * @param {Object} options - Aggregation options
 * @returns {Promise<Object>} Suggestions grouped by source type
 */
export async function getSuggestionsGrouped(options = {}) {
  const [questions, keywords, clusters, news] = await Promise.all([
    getTrendingQuestions({ limit: options.questionsLimit || 10 }),
    getHighPriorityKeywords({ limit: options.keywordsLimit || 10 }),
    getActiveClusters({ limit: options.clustersLimit || 5 }),
    getTrendingNews({ limit: options.newsLimit || 5 })
  ]);

  return {
    questions,
    keywords,
    clusters,
    news,
    all: [...questions, ...keywords, ...clusters, ...news].sort((a, b) => b.priority - a.priority)
  };
}

/**
 * Mark a suggestion as used (create article from it)
 * @param {Object} suggestion - The suggestion that was used
 * @param {string} articleId - The ID of the created article
 */
export async function markSuggestionAsUsed(suggestion, articleId) {
  if (!suggestion || !articleId) return;

  // If it's a question, mark it as used
  if (suggestion.type === 'question' && suggestion.metadata?.questionId) {
    await supabase
      .from('topic_questions')
      .update({
        used_for_article_id: articleId,
        used_at: new Date().toISOString()
      })
      .eq('id', suggestion.metadata.questionId);
  }

  // You could also track usage for keywords, clusters, etc.
  // Add more tracking as needed
}
