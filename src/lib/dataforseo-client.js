/**
 * DATAFORSEO API CLIENT
 * =====================
 * Client library for keyword research and SEO metrics via DataForSEO API
 *
 * Follows Perdia SDK patterns for consistency
 * API Documentation: https://docs.dataforseo.com/v3/
 *
 * Usage:
 *   import { DataForSEOClient } from '@/lib/dataforseo-client';
 *
 *   const client = new DataForSEOClient(login, password);
 *   const keywords = await client.getKeywordData('online education');
 *   const volume = await client.getSearchVolume(['keyword1', 'keyword2']);
 */

/**
 * DataForSEO API Client
 * Handles authentication and API requests to DataForSEO services
 */
export class DataForSEOClient {
  /**
   * Initialize DataForSEO API client
   *
   * @param {string} login - DataForSEO login email
   * @param {string} password - DataForSEO password
   */
  constructor(login, password) {
    this.login = login || import.meta.env.VITE_DATAFORSEO_LOGIN;
    this.password = password || import.meta.env.VITE_DATAFORSEO_PASSWORD;
    this.baseUrl = 'https://api.dataforseo.com/v3';

    // Create base64 encoded auth header
    this.authHeader = this.createAuthHeader(this.login, this.password);
  }

  /**
   * Create authorization header
   * @private
   */
  createAuthHeader(login, password) {
    const credentials = btoa(`${login}:${password}`);
    return `Basic ${credentials}`;
  }

  /**
   * Make authenticated request to DataForSEO API
   * @private
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const config = {
      method: options.method || 'POST',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (options.body) {
      config.body = options.body;
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.status_message ||
          `DataForSEO API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // DataForSEO returns data in tasks array
      if (data.tasks && data.tasks.length > 0) {
        const task = data.tasks[0];

        if (task.status_code !== 20000) {
          throw new Error(task.status_message || 'DataForSEO API task failed');
        }

        return task.result || [];
      }

      return data;
    } catch (error) {
      console.error('DataForSEO API request failed:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive keyword data
   * Returns search volume, CPC, competition, and trends
   *
   * @param {string} keyword - Keyword to research
   * @param {string} location - Location code (default: 2840 for USA)
   * @param {string} language - Language code (default: en)
   * @returns {Promise<Object>} Keyword metrics
   */
  async getKeywordData(keyword, location = '2840', language = 'en') {
    try {
      const payload = JSON.stringify([{
        keywords: [keyword], // DataForSEO expects 'keywords' array, not 'keyword' string
        location_code: parseInt(location),
        language_code: language,
        search_partners: false,
        date_from: null,
        date_to: null
      }]);

      const result = await this.request('/keywords_data/google/search_volume/live', {
        method: 'POST',
        body: payload
      });

      if (result && result.length > 0 && result[0]) {
        const data = result[0];

        return {
          keyword: keyword,
          search_volume: data.search_volume || 0,
          competition: data.competition || 0,
          competition_level: data.competition_level || 'UNKNOWN',
          cpc: data.cpc || 0,
          low_top_of_page_bid: data.low_top_of_page_bid || 0,
          high_top_of_page_bid: data.high_top_of_page_bid || 0,
          monthly_searches: data.monthly_searches || [],
          trends: this.extractTrends(data.monthly_searches || [])
        };
      }

      return {
        keyword: keyword,
        search_volume: 0,
        competition: 0,
        competition_level: 'UNKNOWN',
        cpc: 0,
        error: 'No data available'
      };
    } catch (error) {
      console.error('Error getting keyword data:', error);
      throw new Error(`Failed to get keyword data: ${error.message}`);
    }
  }

  /**
   * Get search volume for multiple keywords (batch)
   *
   * @param {Array<string>} keywords - Array of keywords
   * @param {string} location - Location code (default: 2840 for USA)
   * @param {string} language - Language code (default: en)
   * @returns {Promise<Array>} Array of keyword data
   */
  async getSearchVolume(keywords, location = '2840', language = 'en') {
    try {
      // DataForSEO allows up to 100 keywords per request
      const batchSize = 100;
      const batches = [];

      for (let i = 0; i < keywords.length; i += batchSize) {
        batches.push(keywords.slice(i, i + batchSize));
      }

      const results = [];

      for (const batch of batches) {
        const payload = JSON.stringify([{
          keywords: batch,
          location_code: parseInt(location),
          language_code: language,
          search_partners: false
        }]);

        const batchResult = await this.request('/keywords_data/google/search_volume/live', {
          method: 'POST',
          body: payload
        });

        if (batchResult && batchResult.length > 0) {
          results.push(...batchResult);
        }
      }

      return results.map(item => ({
        keyword: item.keyword,
        search_volume: item.search_volume || 0,
        competition: item.competition || 0,
        competition_level: item.competition_level || 'UNKNOWN',
        cpc: item.cpc || 0
      }));
    } catch (error) {
      console.error('Error getting search volume:', error);
      throw new Error(`Failed to get search volume: ${error.message}`);
    }
  }

  /**
   * Get keyword suggestions and related keywords
   *
   * @param {string} keyword - Seed keyword
   * @param {string} location - Location code (default: 2840 for USA)
   * @param {string} language - Language code (default: en)
   * @param {number} limit - Maximum results (default: 100)
   * @returns {Promise<Array>} Array of keyword suggestions
   */
  async getKeywordSuggestions(keyword, location = '2840', language = 'en', limit = 100) {
    try {
      const payload = JSON.stringify([{
        keyword: keyword,
        location_code: parseInt(location),
        language_code: language,
        limit: limit
      }]);

      const result = await this.request('/keywords_data/google/keyword_suggestions/live', {
        method: 'POST',
        body: payload
      });

      if (result && result.length > 0 && result[0]) {
        return result[0].items || [];
      }

      return [];
    } catch (error) {
      console.error('Error getting keyword suggestions:', error);
      throw new Error(`Failed to get keyword suggestions: ${error.message}`);
    }
  }

  /**
   * Get keyword difficulty score
   *
   * @param {string} keyword - Keyword to analyze
   * @param {string} location - Location code (default: 2840 for USA)
   * @param {string} language - Language code (default: en)
   * @returns {Promise<Object>} Difficulty metrics
   */
  async getKeywordDifficulty(keyword, location = '2840', language = 'en') {
    try {
      const payload = JSON.stringify([{
        keyword: keyword,
        location_code: parseInt(location),
        language_code: language
      }]);

      const result = await this.request('/dataforseo_labs/google/keyword_ideas/live', {
        method: 'POST',
        body: payload
      });

      if (result && result.length > 0 && result[0]) {
        const items = result[0].items || [];

        if (items.length > 0) {
          const data = items[0].keyword_info || {};

          return {
            keyword: keyword,
            difficulty: data.keyword_difficulty || 0,
            search_volume: data.search_volume || 0,
            cpc: data.cpc || 0,
            competition: data.competition || 0,
            competition_level: data.competition_level || 'UNKNOWN'
          };
        }
      }

      return {
        keyword: keyword,
        difficulty: 0,
        error: 'No difficulty data available'
      };
    } catch (error) {
      console.error('Error getting keyword difficulty:', error);
      throw new Error(`Failed to get keyword difficulty: ${error.message}`);
    }
  }

  /**
   * Get SERP analysis for a keyword
   *
   * @param {string} keyword - Keyword to analyze
   * @param {string} location - Location code (default: 2840 for USA)
   * @param {string} language - Language code (default: en)
   * @returns {Promise<Object>} SERP data
   */
  async getSERPData(keyword, location = '2840', language = 'en') {
    try {
      const payload = JSON.stringify([{
        keyword: keyword,
        location_code: parseInt(location),
        language_code: language,
        device: 'desktop',
        os: 'windows'
      }]);

      const result = await this.request('/serp/google/organic/live/advanced', {
        method: 'POST',
        body: payload
      });

      if (result && result.length > 0 && result[0]) {
        const items = result[0].items || [];

        return {
          keyword: keyword,
          total_results: result[0].total_count || 0,
          top_10_results: items.slice(0, 10).map(item => ({
            position: item.rank_group || 0,
            url: item.url || '',
            title: item.title || '',
            description: item.description || '',
            domain: item.domain || ''
          }))
        };
      }

      return {
        keyword: keyword,
        total_results: 0,
        top_10_results: []
      };
    } catch (error) {
      console.error('Error getting SERP data:', error);
      throw new Error(`Failed to get SERP data: ${error.message}`);
    }
  }

  /**
   * Test API connection and credentials
   *
   * @returns {Promise<Object>} Connection status
   */
  async testConnection() {
    try {
      // Use a simple request to verify credentials
      const result = await this.getKeywordData('test', '2840', 'en');

      return {
        success: true,
        message: 'Connection successful',
        credits_available: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  /**
   * Extract trend data from monthly searches
   * @private
   */
  extractTrends(monthlySearches) {
    if (!monthlySearches || monthlySearches.length === 0) {
      return {
        trend: 'stable',
        direction: 0,
        average: 0
      };
    }

    const volumes = monthlySearches.map(m => m.search_volume || 0);
    const average = volumes.reduce((a, b) => a + b, 0) / volumes.length;

    // Calculate trend (compare last 3 months to previous 3 months)
    const recent = volumes.slice(-3);
    const previous = volumes.slice(-6, -3);

    if (recent.length === 0 || previous.length === 0) {
      return { trend: 'stable', direction: 0, average: Math.round(average) };
    }

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;

    const percentChange = ((recentAvg - previousAvg) / previousAvg) * 100;

    let trend = 'stable';
    if (percentChange > 10) trend = 'rising';
    else if (percentChange < -10) trend = 'falling';

    return {
      trend: trend,
      direction: Math.round(percentChange),
      average: Math.round(average),
      recent_average: Math.round(recentAvg),
      previous_average: Math.round(previousAvg)
    };
  }

  /**
   * Calculate keyword difficulty from competition metrics
   * @private
   */
  calculateDifficulty(competition, competitionLevel) {
    // Map competition (0-1) to difficulty (0-100)
    let baseScore = competition * 100;

    // Adjust based on competition level
    const levelMultipliers = {
      'LOW': 0.7,
      'MEDIUM': 1.0,
      'HIGH': 1.3,
      'UNKNOWN': 1.0
    };

    const multiplier = levelMultipliers[competitionLevel] || 1.0;
    return Math.min(Math.round(baseScore * multiplier), 100);
  }
}

/**
 * Helper function to create DataForSEO client instance
 * Uses environment variables by default
 */
export function createDataForSEOClient(login, password) {
  return new DataForSEOClient(login, password);
}

/**
 * Helper function to get keyword data (convenience wrapper)
 */
export async function getKeywordMetrics(keyword, location = '2840', language = 'en') {
  const client = new DataForSEOClient();
  return await client.getKeywordData(keyword, location, language);
}

/**
 * Helper function to get bulk keyword data
 */
export async function getBulkKeywordMetrics(keywords, location = '2840', language = 'en') {
  const client = new DataForSEOClient();
  return await client.getSearchVolume(keywords, location, language);
}

// Export default instance for convenience
export default new DataForSEOClient();
