/**
 * PERDIA V2: MASTER QUOTE SCRAPER
 * ================================
 *
 * Orchestrates all quote scrapers (Reddit, Twitter, Forums).
 * Runs all scrapers and provides combined statistics.
 *
 * Usage:
 *   node scripts/scrapers/master-scraper.js
 *
 * Created: 2025-11-12
 */

import { scrapeReddit } from './reddit-scraper.js';
import { scrapeTwitter } from './twitter-scraper.js';
import { scrapeGetEducatedForums } from './geteducated-forums-scraper.js';

/**
 * Run all scrapers
 */
async function runAllScrapers() {
  console.log('='.repeat(60));
  console.log('PERDIA V2: MASTER QUOTE SCRAPER');
  console.log('='.repeat(60));
  console.log('');

  const results = {
    reddit: null,
    twitter: null,
    forums: null,
    total_scraped: 0,
    total_saved: 0,
    errors: [],
  };

  // Run Reddit scraper
  console.log('\n📱 REDDIT SCRAPER');
  console.log('-'.repeat(60));
  try {
    results.reddit = await scrapeReddit();
    if (results.reddit.success) {
      results.total_scraped += results.reddit.scraped || 0;
      results.total_saved += results.reddit.saved || 0;
    }
  } catch (error) {
    console.error('❌ Reddit scraper failed:', error.message);
    results.errors.push({ source: 'reddit', error: error.message });
    results.reddit = { success: false, error: error.message };
  }

  // Run Twitter scraper
  console.log('\n🐦 TWITTER SCRAPER');
  console.log('-'.repeat(60));
  try {
    results.twitter = await scrapeTwitter();
    if (results.twitter.success) {
      results.total_scraped += results.twitter.scraped || 0;
      results.total_saved += results.twitter.saved || 0;
    }
  } catch (error) {
    console.error('❌ Twitter scraper failed:', error.message);
    results.errors.push({ source: 'twitter', error: error.message });
    results.twitter = { success: false, error: error.message };
  }

  // Run Forums scraper
  console.log('\n💬 GETEDUCATED FORUMS SCRAPER');
  console.log('-'.repeat(60));
  try {
    results.forums = await scrapeGetEducatedForums();
    if (results.forums.success) {
      results.total_scraped += results.forums.scraped || 0;
      results.total_saved += results.forums.saved || 0;
    }
  } catch (error) {
    console.error('❌ Forums scraper failed:', error.message);
    results.errors.push({ source: 'forums', error: error.message });
    results.forums = { success: false, error: error.message };
  }

  // Summary
  console.log('\n');
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('');
  console.log(`Total Quotes Scraped: ${results.total_scraped}`);
  console.log(`Total Quotes Saved:   ${results.total_saved}`);
  console.log('');

  if (results.reddit?.success) {
    console.log(`✅ Reddit:  ${results.reddit.saved || 0} quotes saved`);
  } else {
    console.log(`❌ Reddit:  Failed - ${results.reddit?.error || 'Unknown error'}`);
  }

  if (results.twitter?.success) {
    console.log(`✅ Twitter: ${results.twitter.saved || 0} quotes saved`);
  } else {
    console.log(`❌ Twitter: Failed - ${results.twitter?.error || 'Unknown error'}`);
  }

  if (results.forums?.success) {
    console.log(`✅ Forums:  ${results.forums.saved || 0} quotes saved`);
  } else {
    console.log(`❌ Forums:  Failed - ${results.forums?.error || 'Unknown error'}`);
  }

  console.log('');

  if (results.errors.length > 0) {
    console.log('⚠️  ERRORS:');
    results.errors.forEach(err => {
      console.log(`   - ${err.source}: ${err.error}`);
    });
    console.log('');
  }

  console.log('='.repeat(60));

  return results;
}

/**
 * CLI execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllScrapers()
    .then(results => {
      const success = results.total_saved > 0;
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

export default runAllScrapers;
