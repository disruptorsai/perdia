/**
 * Quote Scraper Edge Function
 *
 * Scrapes real quotes from Reddit, Twitter/X, and GetEducated forums
 * to achieve 60%+ real quote attribution requirement.
 *
 * Client Requirement: Real quotes for authenticity and engagement
 *
 * Sources:
 * - Reddit via Pushshift API / Reddit JSON API
 * - Twitter/X via API (requires auth)
 * - GetEducated forums (web scraping)
 *
 * Stores quotes in: quote_sources table
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface QuoteScrapeRequest {
  keyword: string;
  sources?: ('reddit' | 'twitter' | 'forum')[];
  maxQuotes?: number;
  includeNegative?: boolean;
}

interface ScrapedQuote {
  quote_text: string;
  attribution: string;
  source_type: 'reddit' | 'twitter' | 'forum';
  source_url: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  // Reddit-specific
  reddit_subreddit?: string;
  reddit_post_id?: string;
  reddit_comment_id?: string;
  reddit_score?: number;
  // Twitter-specific
  twitter_tweet_id?: string;
  twitter_username?: string;
  twitter_retweet_count?: number;
  twitter_like_count?: number;
  // Forum-specific
  forum_thread_id?: string;
  forum_post_id?: string;
  forum_username?: string;
}

/**
 * Scrape quotes from Reddit
 */
async function scrapeReddit(keyword: string, maxQuotes: number = 10): Promise<ScrapedQuote[]> {
  const quotes: ScrapedQuote[] = [];

  try {
    // Use Reddit JSON API (no auth required for public posts)
    // Search in education-related subreddits
    const subreddits = [
      'college',
      'AskAcademia',
      'education',
      'OnlineEducation',
      'gradadmissions',
      'GradSchool',
      'GetStudying'
    ];

    for (const subreddit of subreddits) {
      if (quotes.length >= maxQuotes) break;

      // Reddit JSON API endpoint
      const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(keyword)}&restrict_sr=1&limit=25&sort=top`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'PerdiaEducation/1.0 (Content Research Bot)'
        }
      });

      if (!response.ok) continue;

      const data = await response.json();

      // Extract quotes from posts and top comments
      for (const post of data.data.children) {
        if (quotes.length >= maxQuotes) break;

        const postData = post.data;

        // Use post selftext or title as quote
        const text = postData.selftext || postData.title;
        if (text && text.length > 50 && text.length < 500) {
          quotes.push({
            quote_text: text.trim(),
            attribution: `Reddit user u/${postData.author}`,
            source_type: 'reddit',
            source_url: `https://reddit.com${postData.permalink}`,
            sentiment: determineSentiment(text),
            reddit_subreddit: subreddit,
            reddit_post_id: postData.id,
            reddit_score: postData.score
          });
        }

        // Fetch top comments
        try {
          const commentsUrl = `https://www.reddit.com${postData.permalink}.json`;
          const commentsResponse = await fetch(commentsUrl, {
            headers: {
              'User-Agent': 'PerdiaEducation/1.0 (Content Research Bot)'
            }
          });

          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            const comments = commentsData[1]?.data?.children || [];

            for (const comment of comments.slice(0, 3)) {
              if (quotes.length >= maxQuotes) break;

              const commentData = comment.data;
              const commentText = commentData.body;

              if (commentText && commentText.length > 50 && commentText.length < 500) {
                quotes.push({
                  quote_text: commentText.trim(),
                  attribution: `Reddit user u/${commentData.author}`,
                  source_type: 'reddit',
                  source_url: `https://reddit.com${postData.permalink}${commentData.id}`,
                  sentiment: determineSentiment(commentText),
                  reddit_subreddit: subreddit,
                  reddit_post_id: postData.id,
                  reddit_comment_id: commentData.id,
                  reddit_score: commentData.score
                });
              }
            }
          }
        } catch (e) {
          console.error('Failed to fetch comments:', e);
        }
      }

      // Rate limiting - wait 1 second between subreddit requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('Reddit scraping failed:', error);
  }

  return quotes;
}

/**
 * Scrape quotes from Twitter/X
 * Note: Requires Twitter API credentials (not implemented yet - placeholder)
 */
async function scrapeTwitter(keyword: string, maxQuotes: number = 10): Promise<ScrapedQuote[]> {
  const quotes: ScrapedQuote[] = [];

  // TODO: Implement Twitter API integration
  // Requires Twitter API v2 credentials
  // For now, return empty array

  console.log('Twitter scraping not yet implemented - requires API credentials');

  return quotes;
}

/**
 * Scrape quotes from GetEducated forums
 * Note: Requires forum URL from client (placeholder)
 */
async function scrapeForums(keyword: string, maxQuotes: number = 10): Promise<ScrapedQuote[]> {
  const quotes: ScrapedQuote[] = [];

  // TODO: Get GetEducated forum URL from client
  // Implement forum-specific scraping logic

  console.log('Forum scraping not yet implemented - requires forum URL from client');

  return quotes;
}

/**
 * Simple sentiment analysis
 */
function determineSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['great', 'excellent', 'love', 'best', 'amazing', 'helpful', 'recommend', 'worth'];
  const negativeWords = ['bad', 'terrible', 'worst', 'hate', 'waste', 'scam', 'poor', 'disappointing'];

  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword, sources = ['reddit'], maxQuotes = 20, includeNegative = true } = await req.json() as QuoteScrapeRequest;

    if (!keyword) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: keyword' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user ID from JWT
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Scrape quotes from requested sources
    let allQuotes: ScrapedQuote[] = [];

    if (sources.includes('reddit')) {
      const redditQuotes = await scrapeReddit(keyword, Math.ceil(maxQuotes * 0.7));
      allQuotes = [...allQuotes, ...redditQuotes];
    }

    if (sources.includes('twitter')) {
      const twitterQuotes = await scrapeTwitter(keyword, Math.ceil(maxQuotes * 0.2));
      allQuotes = [...allQuotes, ...twitterQuotes];
    }

    if (sources.includes('forum')) {
      const forumQuotes = await scrapeForums(keyword, Math.ceil(maxQuotes * 0.1));
      allQuotes = [...allQuotes, ...forumQuotes];
    }

    // Filter quotes by sentiment if needed
    if (!includeNegative) {
      allQuotes = allQuotes.filter(q => q.sentiment !== 'negative');
    }

    // Limit to maxQuotes
    allQuotes = allQuotes.slice(0, maxQuotes);

    // Store quotes in database
    const quotesToInsert = allQuotes.map(quote => ({
      ...quote,
      user_id: user.id,
      keyword,
      scraped_date: new Date().toISOString(),
      is_verified: false,
      is_fictional: false
    }));

    const { data: insertedQuotes, error: insertError } = await supabase
      .from('quote_sources')
      .insert(quotesToInsert)
      .select();

    if (insertError) {
      console.error('Failed to insert quotes:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store quotes', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        keyword,
        quotesScraped: allQuotes.length,
        quotesStored: insertedQuotes?.length || 0,
        sourceBreakdown: {
          reddit: allQuotes.filter(q => q.source_type === 'reddit').length,
          twitter: allQuotes.filter(q => q.source_type === 'twitter').length,
          forum: allQuotes.filter(q => q.source_type === 'forum').length
        },
        sentimentBreakdown: {
          positive: allQuotes.filter(q => q.sentiment === 'positive').length,
          neutral: allQuotes.filter(q => q.sentiment === 'neutral').length,
          negative: allQuotes.filter(q => q.sentiment === 'negative').length
        },
        quotes: insertedQuotes
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Quote scraper error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
