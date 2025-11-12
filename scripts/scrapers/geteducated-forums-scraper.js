/**
 * PERDIA V2: GETEDUCATED FORUMS QUOTE SCRAPER
 * ============================================
 *
 * Scrapes real quotes from GetEducated.com forums.
 * These are the most valuable quotes (verified users, on-topic).
 * MANDATORY: 60%+ real quotes (not AI-generated)
 *
 * Requires: Direct MySQL database access to forum database
 *
 * Created: 2025-11-12
 */

import mysql from 'mysql2/promise';
import { createClient } from '@supabase/supabase-js';

const RELEVANCE_KEYWORDS = [
  'degree', 'university', 'college', 'education', 'tuition',
  'financial aid', 'scholarship', 'online', 'career', 'accredited',
];

/**
 * Initialize MySQL connection to forums
 */
async function createForumConnection() {
  const host = process.env.GETEDUCATED_FORUM_DB_HOST;
  const port = parseInt(process.env.GETEDUCATED_FORUM_DB_PORT || '3306');
  const user = process.env.GETEDUCATED_FORUM_DB_USER;
  const password = process.env.GETEDUCATED_FORUM_DB_PASSWORD;
  const database = process.env.GETEDUCATED_FORUM_DB_NAME;

  if (!host || !user || !password || !database) {
    throw new Error('Missing forum database credentials. Set GETEDUCATED_FORUM_DB_HOST, GETEDUCATED_FORUM_DB_USER, GETEDUCATED_FORUM_DB_PASSWORD, GETEDUCATED_FORUM_DB_NAME');
  }

  console.log(`[Forums] Connecting to database: ${host}:${port}/${database}`);

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
  });

  console.log('[Forums] Database connected');

  return connection;
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
    'love', 'best', 'good', 'happy', 'satisfied', 'helpful'
  ];

  const negativeWords = [
    'terrible', 'awful', 'waste', 'scam', 'regret', 'avoid',
    'worst', 'disappointed', 'useless', 'bad', 'poor'
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
    'financial-aid': ['scholarship', 'financial aid', 'loan', 'tuition', 'cost'],
    'career': ['job', 'career', 'employment', 'salary'],
    'admissions': ['admissions', 'application', 'accepted', 'apply'],
    'mba-programs': ['mba', 'business school'],
    'nursing': ['nursing', 'rn', 'bsn'],
    'accreditation': ['accredited', 'accreditation', 'legitimate'],
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
 * Scrape forum posts
 */
async function scrapeForumPosts(connection, options = {}) {
  const {
    daysBack = 90,
    minLength = 50,
    maxLength = 500,
    limit = 1000,
  } = options;

  console.log(`[Forums] Fetching posts from last ${daysBack} days...`);

  // NOTE: This query structure is generic and may need adjustment
  // based on actual forum database schema (phpBB, vBulletin, custom, etc.)
  const query = `
    SELECT
      p.post_id as id,
      p.post_text as content,
      u.username as author,
      p.topic_id,
      p.post_time as created_at,
      t.topic_title as topic
    FROM forum_posts p
    INNER JOIN forum_users u ON p.user_id = u.user_id
    LEFT JOIN forum_topics t ON p.topic_id = t.topic_id
    WHERE p.post_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
      AND LENGTH(p.post_text) BETWEEN ? AND ?
      AND p.post_deleted = 0
      AND u.user_active = 1
    ORDER BY p.post_time DESC
    LIMIT ?
  `;

  try {
    const [rows] = await connection.execute(query, [daysBack, minLength, maxLength, limit]);

    console.log(`[Forums] Retrieved ${rows.length} posts`);

    const quotes = [];

    for (const row of rows) {
      const relevance = calculateRelevance(row.content, RELEVANCE_KEYWORDS);

      if (relevance >= 0.4) { // Higher threshold for forums (more likely to be relevant)
        quotes.push({
          quote_text: row.content,
          author: row.author,
          source_platform: 'geteducated-forums',
          source_url: `https://geteducated.com/forums/topic/${row.topic_id}#post-${row.id}`,
          topic_category: categorizeTopic(row.content),
          relevance_score: parseFloat(relevance.toFixed(2)),
          sentiment: analyzeSentiment(row.content),
          is_verified: true, // Forum users are verified
          is_appropriate: checkAppropriate(row.content),
          forum_thread_id: row.topic_id?.toString(),
          forum_post_id: row.id?.toString(),
          forum_username: row.author,
          scraped_at: new Date().toISOString(),
        });
      }
    }

    console.log(`[Forums] Filtered to ${quotes.length} relevant quotes`);

    return quotes;

  } catch (error) {
    console.error('[Forums] Error fetching posts:', error.message);
    throw error;
  }
}

/**
 * Main scraping function
 */
export async function scrapeGetEducatedForums(options = {}) {
  const {
    daysBack = 90,
    minRelevance = 0.4,
  } = options;

  console.log('[Forums] Starting scrape...');

  let connection;

  try {
    // Initialize clients
    connection = await createForumConnection();
    const supabase = createSupabaseClient();

    // Scrape forum posts
    const quotes = await scrapeForumPosts(connection, options);

    if (quotes.length === 0) {
      console.log('[Forums] No quotes to save');
      return {
        success: true,
        scraped: 0,
        saved: 0,
      };
    }

    // Filter by minimum relevance and appropriateness
    const filteredQuotes = quotes.filter(q =>
      q.relevance_score >= minRelevance && q.is_appropriate
    );

    console.log(`[Forums] After filtering: ${filteredQuotes.length} quotes`);

    if (filteredQuotes.length === 0) {
      return {
        success: true,
        scraped: quotes.length,
        saved: 0,
        filtered_out: quotes.length,
      };
    }

    // Insert into database
    const { data, error } = await supabase
      .from('scraped_quotes')
      .insert(filteredQuotes)
      .select();

    if (error) {
      // Handle duplicate key errors
      if (error.code === '23505') {
        console.log('[Forums] Some quotes already exist in database');
        return {
          success: true,
          scraped: quotes.length,
          saved: 0,
          already_exists: filteredQuotes.length,
        };
      }
      throw error;
    }

    console.log(`[Forums] Successfully saved ${data.length} quotes`);

    // Statistics
    const stats = {
      success: true,
      scraped: quotes.length,
      saved: data.length,
      filtered_out: quotes.length - filteredQuotes.length,
      by_sentiment: {},
      by_category: {},
    };

    data.forEach(quote => {
      stats.by_sentiment[quote.sentiment] =
        (stats.by_sentiment[quote.sentiment] || 0) + 1;

      stats.by_category[quote.topic_category] =
        (stats.by_category[quote.topic_category] || 0) + 1;
    });

    console.log('[Forums] Scrape complete:', stats);

    return stats;

  } catch (error) {
    console.error('[Forums] Fatal error:', error);
    return {
      success: false,
      error: error.message,
    };
  } finally {
    // Close database connection
    if (connection) {
      await connection.end();
      console.log('[Forums] Database connection closed');
    }
  }
}

/**
 * CLI execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeGetEducatedForums()
    .then(result => {
      console.log('\n=== Forum Scrape Results ===');
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default scrapeGetEducatedForums;
