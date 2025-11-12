/**
 * PERDIA V2: REDDIT QUOTE SCRAPER
 * ================================
 *
 * Scrapes real quotes from Reddit to inject into articles.
 * MANDATORY: 60%+ real quotes (not AI-generated)
 *
 * Target Subreddits:
 * - r/college
 * - r/ApplyingToCollege
 * - r/CollegeAdmissions
 * - r/GradSchool
 * - r/OnlineEducation
 * - r/StudentLoans
 *
 * Created: 2025-11-12
 */

import snoowrap from 'snoowrap';
import { createClient } from '@supabase/supabase-js';

const SUBREDDITS = [
  'college',
  'ApplyingToCollege',
  'CollegeAdmissions',
  'GradSchool',
  'OnlineEducation',
  'StudentLoans',
  'gradadmissions',
  'highereducation',
];

const RELEVANCE_KEYWORDS = [
  // General education
  'degree', 'university', 'college', 'education', 'school',
  // Financial
  'tuition', 'financial aid', 'scholarship', 'student loan', 'cost', 'afford',
  // Types of programs
  'online courses', 'online degree', 'distance learning', 'mba', 'masters',
  // Career
  'career', 'job', 'employment', 'salary', 'worth it',
  // Accreditation
  'accreditation', 'accredited', 'legitimate', 'recognized',
];

/**
 * Initialize Reddit client
 */
function createRedditClient() {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const username = process.env.REDDIT_USERNAME;
  const password = process.env.REDDIT_PASSWORD;

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error('Missing Reddit API credentials. Set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD');
  }

  return new snoowrap({
    userAgent: 'Perdia Education Content Bot v2.0',
    clientId,
    clientSecret,
    username,
    password,
  });
}

/**
 * Initialize Supabase client
 */
function createSupabaseClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, key);
}

/**
 * Calculate relevance score based on keywords
 */
function calculateRelevance(text, keywords) {
  const lowerText = text.toLowerCase();
  const matches = keywords.filter(keyword =>
    lowerText.includes(keyword.toLowerCase())
  );

  // Score based on number of keyword matches
  const score = Math.min(matches.length / 3, 1.0); // Cap at 1.0, need 3+ keywords for max score
  return parseFloat(score.toFixed(2));
}

/**
 * Analyze sentiment (simple heuristic)
 */
function analyzeSentiment(text) {
  const lowerText = text.toLowerCase();

  const positiveWords = [
    'great', 'excellent', 'amazing', 'wonderful', 'helpful', 'recommend',
    'worth it', 'love', 'best', 'good', 'happy', 'satisfied', 'awesome'
  ];

  const negativeWords = [
    'terrible', 'awful', 'waste', 'scam', 'regret', 'avoid', 'worst',
    'disappointed', 'useless', 'bad', 'horrible', 'poor', 'rip off'
  ];

  const posCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negCount = negativeWords.filter(word => lowerText.includes(word)).length;

  if (posCount > negCount) return 'positive';
  if (negCount > posCount) return 'negative';
  if (posCount === negCount && posCount > 0) return 'mixed';
  return 'neutral';
}

/**
 * Check if content is appropriate
 */
function checkAppropriate(text) {
  const inappropriate = [
    'fuck', 'shit', 'damn', 'ass', 'crap', 'bitch', 'bastard',
    'piss', 'hell', 'dick', 'pussy', 'cock'
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
    'online-degrees': ['online', 'distance learning', 'virtual', 'remote learning'],
    'financial-aid': ['scholarship', 'financial aid', 'loan', 'tuition', 'cost', 'afford'],
    'career': ['job', 'career', 'employment', 'salary', 'work'],
    'admissions': ['admissions', 'application', 'accepted', 'rejected', 'apply'],
    'mba-programs': ['mba', 'business school', 'masters business'],
    'nursing': ['nursing', 'rn', 'bsn', 'nurse'],
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
 * Scrape quotes from a single subreddit
 */
async function scrapeSubreddit(reddit, subredditName, limit = 100) {
  console.log(`[Reddit] Scraping r/${subredditName}...`);

  const quotes = [];

  try {
    const subreddit = reddit.getSubreddit(subredditName);

    // Get hot posts from last 30 days
    const posts = await subreddit.getHot({ limit });

    for (const post of posts) {
      // Skip if post is too old (>30 days)
      const postAge = Date.now() - (post.created_utc * 1000);
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;

      if (postAge > thirtyDays) {
        continue;
      }

      // Skip self posts that are too short
      if (post.is_self && post.selftext && post.selftext.length >= 50 && post.selftext.length <= 500) {
        const relevance = calculateRelevance(post.selftext, RELEVANCE_KEYWORDS);

        if (relevance >= 0.3) {
          quotes.push({
            quote_text: post.selftext.substring(0, 500),
            author: post.author.name,
            source_platform: 'reddit',
            source_url: `https://reddit.com${post.permalink}`,
            topic_category: categorizeTopic(post.selftext),
            relevance_score: relevance,
            sentiment: analyzeSentiment(post.selftext),
            is_verified: false,
            is_appropriate: checkAppropriate(post.selftext),
            reddit_subreddit: subredditName,
            reddit_post_id: post.id,
            reddit_score: post.score,
            scraped_at: new Date().toISOString(),
          });
        }
      }

      // Get top comments
      try {
        await post.expandReplies({ limit: 10, depth: 1 });
        const comments = post.comments.slice(0, 20);

        for (const comment of comments) {
          if (typeof comment.body !== 'string') continue;
          if (comment.body.length < 50 || comment.body.length > 500) continue;

          const relevance = calculateRelevance(comment.body, RELEVANCE_KEYWORDS);

          if (relevance >= 0.3) {
            quotes.push({
              quote_text: comment.body,
              author: comment.author.name,
              source_platform: 'reddit',
              source_url: `https://reddit.com${comment.permalink}`,
              topic_category: categorizeTopic(comment.body),
              relevance_score: relevance,
              sentiment: analyzeSentiment(comment.body),
              is_verified: false,
              is_appropriate: checkAppropriate(comment.body),
              reddit_subreddit: subredditName,
              reddit_post_id: post.id,
              reddit_comment_id: comment.id,
              reddit_score: comment.score,
              scraped_at: new Date().toISOString(),
            });
          }
        }
      } catch (commentError) {
        console.error(`[Reddit] Error fetching comments for post ${post.id}:`, commentError.message);
      }
    }

    console.log(`[Reddit] r/${subredditName}: Found ${quotes.length} relevant quotes`);
    return quotes;

  } catch (error) {
    console.error(`[Reddit] Error scraping r/${subredditName}:`, error.message);
    return [];
  }
}

/**
 * Main scraping function
 */
export async function scrapeReddit(options = {}) {
  const {
    subreddits = SUBREDDITS,
    postsPerSubreddit = 100,
    minRelevance = 0.3,
  } = options;

  console.log('[Reddit] Starting scrape...');
  console.log(`[Reddit] Subreddits: ${subreddits.join(', ')}`);

  try {
    // Initialize clients
    const reddit = createRedditClient();
    const supabase = createSupabaseClient();

    let allQuotes = [];

    // Scrape each subreddit
    for (const subreddit of subreddits) {
      const quotes = await scrapeSubreddit(reddit, subreddit, postsPerSubreddit);
      allQuotes = allQuotes.concat(quotes);

      // Rate limiting: wait 2 seconds between subreddits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`[Reddit] Total quotes scraped: ${allQuotes.length}`);

    // Filter by minimum relevance and appropriateness
    const filteredQuotes = allQuotes.filter(q =>
      q.relevance_score >= minRelevance && q.is_appropriate
    );

    console.log(`[Reddit] After filtering: ${filteredQuotes.length} quotes`);

    if (filteredQuotes.length === 0) {
      console.log('[Reddit] No quotes to save');
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
      .insert(filteredQuotes)
      .select();

    if (error) {
      console.error('[Reddit] Error saving quotes:', error);
      throw error;
    }

    console.log(`[Reddit] Successfully saved ${data.length} quotes`);

    // Statistics
    const stats = {
      success: true,
      scraped: allQuotes.length,
      saved: data.length,
      filtered_out: allQuotes.length - filteredQuotes.length,
      by_subreddit: {},
      by_sentiment: {},
      by_category: {},
    };

    // Calculate stats
    data.forEach(quote => {
      // By subreddit
      stats.by_subreddit[quote.reddit_subreddit] =
        (stats.by_subreddit[quote.reddit_subreddit] || 0) + 1;

      // By sentiment
      stats.by_sentiment[quote.sentiment] =
        (stats.by_sentiment[quote.sentiment] || 0) + 1;

      // By category
      stats.by_category[quote.topic_category] =
        (stats.by_category[quote.topic_category] || 0) + 1;
    });

    console.log('[Reddit] Scrape complete:', stats);

    return stats;

  } catch (error) {
    console.error('[Reddit] Fatal error:', error);
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
  scrapeReddit()
    .then(result => {
      console.log('\n=== Reddit Scrape Results ===');
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default scrapeReddit;
