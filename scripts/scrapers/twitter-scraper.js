/**
 * PERDIA V2: TWITTER/X QUOTE SCRAPER
 * ===================================
 *
 * Scrapes real quotes from Twitter/X to inject into articles.
 * MANDATORY: 60%+ real quotes (not AI-generated)
 *
 * Search Queries:
 * - "online degree"
 * - "college tuition"
 * - "financial aid"
 * - "student loans"
 * - "higher education"
 * - "accredited university"
 *
 * Created: 2025-11-12
 */

import { TwitterApi } from 'twitter-api-v2';
import { createClient } from '@supabase/supabase-js';

const SEARCH_QUERIES = [
  'online degree',
  'college tuition',
  'financial aid',
  'student loans',
  'higher education',
  'accredited university',
  'online mba',
  'nursing degree',
  'masters degree',
  'bachelors degree worth it',
];

const RELEVANCE_KEYWORDS = [
  'degree', 'university', 'college', 'education', 'tuition',
  'financial aid', 'scholarship', 'online courses', 'career',
  'accredited', 'worth it', 'mba', 'masters', 'bachelors',
];

/**
 * Initialize Twitter client
 */
function createTwitterClient() {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    throw new Error('Missing Twitter API credentials. Set TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET');
  }

  return new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken,
    accessSecret,
  });
}

/**
 * Initialize Supabase client
 */
function createSupabaseClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(url, key);
}

/**
 * Calculate relevance score
 */
function calculateRelevance(text, keywords) {
  const lowerText = text.toLowerCase();
  const matches = keywords.filter(keyword =>
    lowerText.includes(keyword.toLowerCase())
  );
  return Math.min(matches.length / 3, 1.0);
}

/**
 * Analyze sentiment
 */
function analyzeSentiment(text) {
  const lowerText = text.toLowerCase();

  const positiveWords = [
    'great', 'excellent', 'amazing', 'recommend', 'worth it',
    'love', 'best', 'good', 'happy', 'satisfied'
  ];

  const negativeWords = [
    'terrible', 'awful', 'waste', 'scam', 'regret', 'avoid',
    'worst', 'disappointed', 'useless', 'bad'
  ];

  const posCount = positiveWords.filter(w => lowerText.includes(w)).length;
  const negCount = negativeWords.filter(w => lowerText.includes(w)).length;

  if (posCount > negCount) return 'positive';
  if (negCount > posCount) return 'negative';
  if (posCount === negCount && posCount > 0) return 'mixed';
  return 'neutral';
}

/**
 * Check if appropriate
 */
function checkAppropriate(text) {
  const inappropriate = [
    'fuck', 'shit', 'damn', 'ass', 'crap', 'bitch',
    'bastard', 'piss', 'hell'
  ];
  const lowerText = text.toLowerCase();
  return !inappropriate.some(word => lowerText.includes(word));
}

/**
 * Categorize topic
 */
function categorizeTopic(text) {
  const lowerText = text.toLowerCase();

  const categories = {
    'online-degrees': ['online', 'distance', 'virtual', 'remote'],
    'financial-aid': ['scholarship', 'financial aid', 'loan', 'tuition'],
    'career': ['job', 'career', 'employment', 'salary'],
    'admissions': ['admissions', 'application', 'accepted'],
    'mba-programs': ['mba', 'business school'],
    'nursing': ['nursing', 'rn', 'bsn'],
    'general': [],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }

  return 'general';
}

/**
 * Search Twitter for quotes
 */
async function searchTwitter(client, query, maxResults = 100) {
  console.log(`[Twitter] Searching for: "${query}"`);

  const quotes = [];

  try {
    const tweets = await client.v2.search(query, {
      max_results: maxResults,
      'tweet.fields': ['created_at', 'author_id', 'public_metrics'],
      'user.fields': ['username'],
    });

    for await (const tweet of tweets) {
      // Skip if too short or too long
      if (tweet.text.length < 50 || tweet.text.length > 280) {
        continue;
      }

      // Skip retweets and replies
      if (tweet.text.startsWith('RT @') || tweet.text.startsWith('@')) {
        continue;
      }

      // Calculate relevance
      const relevance = calculateRelevance(tweet.text, RELEVANCE_KEYWORDS);

      if (relevance >= 0.3) {
        quotes.push({
          quote_text: tweet.text,
          author: tweet.author_id, // Can be enhanced with username lookup
          source_platform: 'twitter',
          source_url: `https://twitter.com/i/web/status/${tweet.id}`,
          topic_category: categorizeTopic(tweet.text),
          relevance_score: parseFloat(relevance.toFixed(2)),
          sentiment: analyzeSentiment(tweet.text),
          is_verified: false,
          is_appropriate: checkAppropriate(tweet.text),
          twitter_tweet_id: tweet.id,
          twitter_retweet_count: tweet.public_metrics?.retweet_count || 0,
          twitter_like_count: tweet.public_metrics?.like_count || 0,
          scraped_at: new Date().toISOString(),
        });
      }
    }

    console.log(`[Twitter] "${query}": Found ${quotes.length} relevant tweets`);
    return quotes;

  } catch (error) {
    console.error(`[Twitter] Error searching "${query}":`, error.message);
    return [];
  }
}

/**
 * Main scraping function
 */
export async function scrapeTwitter(options = {}) {
  const {
    queries = SEARCH_QUERIES,
    maxResultsPerQuery = 100,
    minRelevance = 0.3,
  } = options;

  console.log('[Twitter] Starting scrape...');
  console.log(`[Twitter] Queries: ${queries.length}`);

  try {
    // Initialize clients
    const twitter = createTwitterClient();
    const supabase = createSupabaseClient();

    let allQuotes = [];

    // Search each query
    for (const query of queries) {
      const quotes = await searchTwitter(twitter, query, maxResultsPerQuery);
      allQuotes = allQuotes.concat(quotes);

      // Rate limiting: wait 1 second between queries
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`[Twitter] Total tweets scraped: ${allQuotes.length}`);

    // Filter by minimum relevance and appropriateness
    const filteredQuotes = allQuotes.filter(q =>
      q.relevance_score >= minRelevance && q.is_appropriate
    );

    // Remove duplicates by tweet_id
    const uniqueQuotes = Array.from(
      new Map(filteredQuotes.map(q => [q.twitter_tweet_id, q])).values()
    );

    console.log(`[Twitter] After filtering: ${uniqueQuotes.length} unique quotes`);

    if (uniqueQuotes.length === 0) {
      console.log('[Twitter] No quotes to save');
      return {
        success: true,
        scraped: allQuotes.length,
        saved: 0,
        filtered_out: allQuotes.length,
      };
    }

    // Insert into database
    const { data, error } = await supabase
      .from('scraped_quotes')
      .insert(uniqueQuotes)
      .select();

    if (error) {
      // Handle duplicate key errors gracefully
      if (error.code === '23505') {
        console.log('[Twitter] Some quotes already exist in database');
        return {
          success: true,
          scraped: allQuotes.length,
          saved: 0,
          already_exists: uniqueQuotes.length,
        };
      }
      throw error;
    }

    console.log(`[Twitter] Successfully saved ${data.length} quotes`);

    // Statistics
    const stats = {
      success: true,
      scraped: allQuotes.length,
      saved: data.length,
      filtered_out: allQuotes.length - uniqueQuotes.length,
      by_sentiment: {},
      by_category: {},
    };

    data.forEach(quote => {
      stats.by_sentiment[quote.sentiment] =
        (stats.by_sentiment[quote.sentiment] || 0) + 1;

      stats.by_category[quote.topic_category] =
        (stats.by_category[quote.topic_category] || 0) + 1;
    });

    console.log('[Twitter] Scrape complete:', stats);

    return stats;

  } catch (error) {
    console.error('[Twitter] Fatal error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * CLI execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeTwitter()
    .then(result => {
      console.log('\n=== Twitter Scrape Results ===');
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default scrapeTwitter;
