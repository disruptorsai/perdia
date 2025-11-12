/**
 * PERDIA V2: QUOTE INJECTION EDGE FUNCTION
 * =========================================
 *
 * MANDATORY: 60%+ real quotes (not AI-generated)
 *
 * Injects relevant real quotes from Reddit, Twitter, and GetEducated forums
 * into blog articles to meet client requirement.
 *
 * Accepts:
 * - article_content: HTML content to inject quotes into
 * - topic_category: Category for quote matching (optional)
 * - min_quotes: Minimum number of quotes to inject (default: 2)
 * - max_quotes: Maximum number of quotes to inject (default: 5)
 * - min_relevance: Minimum relevance score (default: 0.6)
 *
 * Returns:
 * - content: Enhanced HTML with quotes injected
 * - quotes_injected: Number of quotes added
 * - quotes_used: Array of quote objects that were injected
 *
 * Created: 2025-11-12
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Find natural injection points in HTML content
 * Returns array of indices where quotes can be inserted
 */
function findInjectionPoints(content: string): number[] {
  const points: number[] = [];

  // Find closing </p> tags (natural paragraph breaks)
  const paragraphPattern = /<\/p>/gi;
  let match;

  while ((match = paragraphPattern.exec(content)) !== null) {
    points.push(match.index + 4); // After </p>
  }

  // Ensure we have at least some injection points
  if (points.length === 0) {
    // Fallback: inject at newlines
    const lines = content.split('\n');
    let currentIndex = 0;
    lines.forEach((line, index) => {
      currentIndex += line.length + 1; // +1 for newline
      if (index % 3 === 0 && index > 0) { // Every 3rd line
        points.push(currentIndex);
      }
    });
  }

  return points;
}

/**
 * Format quote as HTML blockquote with attribution
 */
function formatQuoteHTML(quote: any): string {
  const platform = quote.source_platform;
  const platformIcon = {
    'reddit': '📱',
    'twitter': '🐦',
    'geteducated-forums': '💬'
  }[platform] || '💬';

  // Escape HTML in quote text
  const escapedText = quote.quote_text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  let attribution = `${platformIcon} Anonymous`;

  if (quote.author && quote.author !== '[deleted]') {
    attribution = `${platformIcon} ${quote.author}`;
  }

  if (quote.source_url) {
    attribution = `<a href="${quote.source_url}" target="_blank" rel="noopener noreferrer">${attribution}</a>`;
  }

  return `
<blockquote class="real-quote" data-quote-id="${quote.id}" data-platform="${platform}">
  <p>${escapedText}</p>
  <footer>— ${attribution} on ${platform === 'geteducated-forums' ? 'GetEducated Forums' : platform.charAt(0).toUpperCase() + platform.slice(1)}</footer>
</blockquote>
`;
}

/**
 * Distribute quotes evenly throughout content
 */
function distributeQuotes(
  content: string,
  quotes: any[],
  targetCount: number
): { content: string; used: any[] } {
  const injectionPoints = findInjectionPoints(content);

  if (injectionPoints.length === 0) {
    console.error('No injection points found in content');
    return { content, used: [] };
  }

  // Select evenly distributed injection points
  const step = Math.floor(injectionPoints.length / targetCount);
  const selectedPoints: number[] = [];

  for (let i = 0; i < targetCount && i < quotes.length; i++) {
    const index = Math.min(i * step, injectionPoints.length - 1);
    selectedPoints.push(injectionPoints[index]);
  }

  // Sort in reverse order so we can inject from end to start
  // (prevents index shifting)
  selectedPoints.sort((a, b) => b - a);

  let enhancedContent = content;
  const usedQuotes: any[] = [];

  selectedPoints.forEach((point, index) => {
    if (index < quotes.length) {
      const quote = quotes[index];
      const quoteHTML = formatQuoteHTML(quote);

      // Insert quote at this point
      enhancedContent =
        enhancedContent.slice(0, point) +
        '\n\n' + quoteHTML + '\n\n' +
        enhancedContent.slice(point);

      usedQuotes.push(quote);
    }
  });

  return { content: enhancedContent, used: usedQuotes };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const {
      article_content,
      topic_category,
      min_quotes = 2,
      max_quotes = 5,
      min_relevance = 0.6,
    } = await req.json();

    if (!article_content) {
      throw new Error('article_content is required');
    }

    console.log('[inject-quotes] Fetching quotes:', {
      topic_category,
      min_quotes,
      max_quotes,
      min_relevance,
    });

    // Build query for relevant quotes
    let query = supabase
      .from('scraped_quotes')
      .select('*')
      .eq('is_appropriate', true)
      .gte('relevance_score', min_relevance)
      .order('relevance_score', { ascending: false })
      .limit(max_quotes * 2); // Fetch more than needed for variety

    // Filter by category if provided
    if (topic_category) {
      query = query.eq('topic_category', topic_category);
    }

    const { data: quotes, error: fetchError } = await query;

    if (fetchError) {
      console.error('[inject-quotes] Error fetching quotes:', fetchError);
      throw fetchError;
    }

    if (!quotes || quotes.length === 0) {
      console.warn('[inject-quotes] No quotes found matching criteria');
      return new Response(
        JSON.stringify({
          content: article_content,
          quotes_injected: 0,
          quotes_used: [],
          warning: 'No quotes found matching criteria',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`[inject-quotes] Found ${quotes.length} candidate quotes`);

    // Determine how many quotes to inject
    const targetCount = Math.min(
      Math.max(min_quotes, Math.floor(quotes.length * 0.5)),
      max_quotes
    );

    // Randomly select quotes for variety
    const shuffled = quotes.sort(() => Math.random() - 0.5);
    const selectedQuotes = shuffled.slice(0, targetCount);

    // Distribute quotes throughout content
    const { content: enhancedContent, used: usedQuotes } = distributeQuotes(
      article_content,
      selectedQuotes,
      targetCount
    );

    // Update usage tracking for injected quotes
    const quoteIds = usedQuotes.map((q) => q.id);

    if (quoteIds.length > 0) {
      const { error: updateError } = await supabase
        .from('scraped_quotes')
        .update({
          times_used: supabase.rpc('increment', { row_id: quoteIds }),
          last_used_at: new Date().toISOString(),
        })
        .in('id', quoteIds);

      if (updateError) {
        console.error('[inject-quotes] Error updating quote usage:', updateError);
        // Non-fatal - continue with response
      }
    }

    console.log(`[inject-quotes] Successfully injected ${usedQuotes.length} quotes`);

    // Return enhanced content
    return new Response(
      JSON.stringify({
        content: enhancedContent,
        quotes_injected: usedQuotes.length,
        quotes_used: usedQuotes.map((q) => ({
          id: q.id,
          text: q.quote_text.substring(0, 100) + '...',
          platform: q.source_platform,
          relevance: q.relevance_score,
        })),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[inject-quotes] Error:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
