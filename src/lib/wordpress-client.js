/**
 * WORDPRESS REST API CLIENT
 * ===========================
 * Client library for publishing content to WordPress via REST API
 *
 * Follows Perdia SDK patterns for consistency
 * Supports WordPress 5.0+ REST API v2
 *
 * Usage:
 *   import { WordPressClient } from '@/lib/wordpress-client';
 *
 *   const wp = new WordPressClient(siteUrl, username, applicationPassword);
 *   await wp.testConnection();
 *   const post = await wp.createPost({ title, content, status });
 */

/**
 * WordPress REST API Client
 * Handles authentication and API requests to WordPress sites
 */
export class WordPressClient {
  /**
   * Initialize WordPress API client
   *
   * @param {string} siteUrl - WordPress site URL (e.g., https://geteducated.com)
   * @param {string} username - WordPress username
   * @param {string} applicationPassword - WordPress application password
   */
  constructor(siteUrl, username, applicationPassword) {
    // Remove trailing slash from site URL
    this.siteUrl = siteUrl.replace(/\/$/, '');
    this.baseUrl = `${this.siteUrl}/wp-json/wp/v2`;
    this.username = username;
    this.applicationPassword = applicationPassword;

    // Create base64 encoded auth header
    this.authHeader = this.createAuthHeader(username, applicationPassword);
  }

  /**
   * Create authorization header
   * @private
   */
  createAuthHeader(username, password) {
    const credentials = btoa(`${username}:${password}`);
    return `Basic ${credentials}`;
  }

  /**
   * Make authenticated request to WordPress API
   * @private
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultHeaders = {
      'Authorization': this.authHeader,
      'Content-Type': 'application/json',
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`WordPress API returned ${response.status}: ${response.statusText}`);
        }
        const text = await response.text();
        throw new Error(`WordPress API returned non-JSON response: ${text.substring(0, 200)}`);
      }

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || data.code || 'Unknown error';
        throw new Error(`WordPress API error: ${errorMessage}`);
      }

      return data;
    } catch (error) {
      console.error('WordPress API request failed:', error);
      throw error;
    }
  }

  /**
   * Test connection to WordPress API
   *
   * @returns {Promise<Object>} - { success: boolean, user?: Object, error?: string }
   */
  async testConnection() {
    try {
      const user = await this.request('/users/me');
      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          capabilities: user.capabilities,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a new WordPress post
   *
   * @param {Object} params
   * @param {string} params.title - Post title
   * @param {string} params.content - Post content (HTML)
   * @param {string} [params.status='draft'] - Post status: 'draft', 'publish', 'pending', 'private'
   * @param {string} [params.excerpt] - Post excerpt/meta description
   * @param {number[]} [params.categories] - Category IDs
   * @param {number[]} [params.tags] - Tag IDs
   * @param {number} [params.featured_media] - Featured image ID
   * @param {Object} [params.meta] - Custom meta fields
   * @param {string} [params.slug] - URL slug
   * @param {string} [params.date] - Publication date (ISO 8601 format)
   *
   * @returns {Promise<Object>} - Created post object with id, link, status
   */
  async createPost({
    title,
    content,
    status = 'draft',
    excerpt = '',
    categories = [],
    tags = [],
    featured_media = null,
    meta = {},
    slug = '',
    date = null,
  }) {
    try {
      const postData = {
        title,
        content,
        status,
        excerpt,
      };

      // Add optional fields if provided
      if (categories.length > 0) postData.categories = categories;
      if (tags.length > 0) postData.tags = tags;
      if (featured_media) postData.featured_media = featured_media;
      if (Object.keys(meta).length > 0) postData.meta = meta;
      if (slug) postData.slug = slug;
      if (date) postData.date = date;

      const post = await this.request('/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      });

      return {
        success: true,
        post: {
          id: post.id,
          title: post.title.rendered,
          link: post.link,
          status: post.status,
          date: post.date,
          modified: post.modified,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update an existing WordPress post
   *
   * @param {number} postId - Post ID to update
   * @param {Object} updates - Fields to update (same as createPost params)
   * @returns {Promise<Object>} - Updated post object
   */
  async updatePost(postId, updates) {
    try {
      const post = await this.request(`/posts/${postId}`, {
        method: 'POST',
        body: JSON.stringify(updates),
      });

      return {
        success: true,
        post: {
          id: post.id,
          title: post.title.rendered,
          link: post.link,
          status: post.status,
          date: post.date,
          modified: post.modified,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get a WordPress post by ID
   *
   * @param {number} postId - Post ID
   * @returns {Promise<Object>} - Post object
   */
  async getPost(postId) {
    try {
      const post = await this.request(`/posts/${postId}`);
      return {
        success: true,
        post: {
          id: post.id,
          title: post.title.rendered,
          content: post.content.rendered,
          excerpt: post.excerpt.rendered,
          link: post.link,
          status: post.status,
          date: post.date,
          modified: post.modified,
          categories: post.categories,
          tags: post.tags,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete a WordPress post
   *
   * @param {number} postId - Post ID to delete
   * @param {boolean} [force=false] - Bypass trash and permanently delete
   * @returns {Promise<Object>} - Deletion result
   */
  async deletePost(postId, force = false) {
    try {
      const endpoint = force ? `/posts/${postId}?force=true` : `/posts/${postId}`;
      const result = await this.request(endpoint, {
        method: 'DELETE',
      });

      return {
        success: true,
        deleted: result.deleted || false,
        previous: result.previous,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Upload media file to WordPress
   *
   * @param {File} file - File object to upload
   * @param {string} [altText=''] - Alt text for the image
   * @param {string} [title=''] - Media title
   * @returns {Promise<Object>} - Uploaded media object with id and url
   */
  async uploadMedia(file, altText = '', title = '') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (altText) formData.append('alt_text', altText);
      if (title) formData.append('title', title);

      const url = `${this.baseUrl}/media`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.authHeader,
          // Don't set Content-Type - let browser set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const media = await response.json();

      return {
        success: true,
        media: {
          id: media.id,
          url: media.source_url,
          title: media.title.rendered,
          alt: media.alt_text,
          type: media.media_type,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get all categories
   *
   * @returns {Promise<Array>} - List of categories
   */
  async getCategories() {
    try {
      const categories = await this.request('/categories?per_page=100');
      return {
        success: true,
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          count: cat.count,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get all tags
   *
   * @returns {Promise<Array>} - List of tags
   */
  async getTags() {
    try {
      const tags = await this.request('/tags?per_page=100');
      return {
        success: true,
        tags: tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          count: tag.count,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Search for posts
   *
   * @param {string} query - Search query
   * @param {number} [perPage=10] - Results per page
   * @returns {Promise<Array>} - Search results
   */
  async searchPosts(query, perPage = 10) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const posts = await this.request(`/posts?search=${encodedQuery}&per_page=${perPage}`);
      return {
        success: true,
        posts: posts.map(post => ({
          id: post.id,
          title: post.title.rendered,
          excerpt: post.excerpt.rendered,
          link: post.link,
          date: post.date,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

/**
 * Helper function to create WordPress client from connection settings
 *
 * @param {Object} connection - WordPress connection from database
 * @returns {WordPressClient}
 */
export function createWordPressClient(connection) {
  if (!connection || !connection.site_url || !connection.username || !connection.application_password) {
    throw new Error('Invalid WordPress connection settings');
  }

  return new WordPressClient(
    connection.site_url,
    connection.username,
    connection.application_password
  );
}

/**
 * Validate WordPress connection settings
 *
 * @param {string} siteUrl - WordPress site URL
 * @param {string} username - WordPress username
 * @param {string} applicationPassword - Application password
 * @returns {Promise<Object>} - Validation result with success boolean
 */
export async function validateWordPressConnection(siteUrl, username, applicationPassword) {
  try {
    const client = new WordPressClient(siteUrl, username, applicationPassword);
    const result = await client.testConnection();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export default WordPressClient;
