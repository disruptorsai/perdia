/**
 * WordPress Database Client
 *
 * Provides direct MySQL connection to WordPress database for complex queries
 * that are inefficient or impossible via REST API.
 *
 * SECURITY: Uses read-only database user by default. All write operations
 * should go through WordPress REST API to maintain audit trail and trigger hooks.
 *
 * @module wordpress-db-client
 */

// Note: mysql2 package required - install with: npm install mysql2
// This will be added to package.json

/**
 * WordPress database configuration
 * Set via environment variables in .env.local
 */
const dbConfig = {
  host: import.meta.env.VITE_WP_DB_HOST,
  port: parseInt(import.meta.env.VITE_WP_DB_PORT) || 3306,
  user: import.meta.env.VITE_WP_DB_USER,
  password: import.meta.env.VITE_WP_DB_PASSWORD,
  database: import.meta.env.VITE_WP_DB_NAME,
  waitForConnections: true,
  connectionLimit: 5, // Max 5 concurrent connections
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: import.meta.env.VITE_WP_DB_SSL_CA ? {
    ca: import.meta.env.VITE_WP_DB_SSL_CA,
    rejectUnauthorized: true
  } : undefined
};

// Lazy-loaded connection pool (only created when first query is made)
let pool = null;

/**
 * Get or create connection pool
 * @returns {Promise<mysql.Pool>}
 */
async function getPool() {
  if (!pool) {
    // Dynamic import to handle missing mysql2 package gracefully
    try {
      const mysql = await import('mysql2/promise');
      pool = mysql.createPool(dbConfig);
      console.log('[WP DB] Connection pool created');
    } catch (error) {
      console.error('[WP DB] Failed to create pool:', error.message);
      throw new Error('mysql2 package not installed. Run: npm install mysql2');
    }
  }
  return pool;
}

/**
 * Execute a SQL query with timeout enforcement
 *
 * @param {string} sql - SQL query string (use ? for parameters)
 * @param {Array} params - Query parameters (prevents SQL injection)
 * @param {number} timeout - Query timeout in milliseconds (default: 10000)
 * @returns {Promise<Array>} Query results
 *
 * @example
 * const posts = await wpQuery(
 *   'SELECT ID, post_title FROM wp_posts WHERE post_status = ? LIMIT ?',
 *   ['publish', 10],
 *   5000
 * );
 */
export async function wpQuery(sql, params = [], timeout = 10000) {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    // Set query timeout (in milliseconds, converted to seconds for MySQL)
    await connection.query('SET SESSION max_execution_time = ?', [Math.floor(timeout / 1000)]);

    const [rows] = await connection.query(sql, params);
    return rows;
  } catch (error) {
    console.error('[WP DB] Query failed:', error.message);
    console.error('[WP DB] SQL:', sql);
    console.error('[WP DB] Params:', params);
    throw new Error(`WordPress DB query failed: ${error.message}`);
  } finally {
    connection.release();
  }
}

/**
 * Get related posts by taxonomy (category, tag, custom taxonomy)
 *
 * @param {number} postId - WordPress post ID
 * @param {string} taxonomy - Taxonomy name (default: 'category')
 * @param {number} limit - Max number of related posts (default: 5)
 * @returns {Promise<Array>} Related posts with ID, title, URL, date
 *
 * @example
 * const relatedPosts = await getRelatedPosts(12345, 'category', 5);
 * // Returns: [{ ID, post_title, guid, post_date }, ...]
 */
export async function getRelatedPosts(postId, taxonomy = 'category', limit = 5) {
  const sql = `
    SELECT DISTINCT p.ID, p.post_title, p.guid, p.post_date
    FROM wp_posts p
    INNER JOIN wp_term_relationships tr ON p.ID = tr.object_id
    INNER JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
    WHERE tt.taxonomy = ?
      AND tt.term_taxonomy_id IN (
        SELECT term_taxonomy_id
        FROM wp_term_relationships
        WHERE object_id = ?
      )
      AND p.post_status = 'publish'
      AND p.ID != ?
    ORDER BY p.post_date DESC
    LIMIT ?
  `;

  return await wpQuery(sql, [taxonomy, postId, postId, limit]);
}

/**
 * Get post meta fields for a post
 *
 * @param {number} postId - WordPress post ID
 * @param {string} metaKey - Optional specific meta key to retrieve
 * @returns {Promise<Array>} Meta fields with key and value
 *
 * @example
 * // Get all meta fields
 * const allMeta = await getPostMeta(12345);
 *
 * // Get specific meta field
 * const seoMeta = await getPostMeta(12345, '_yoast_wpseo_metadesc');
 */
export async function getPostMeta(postId, metaKey = null) {
  let sql = 'SELECT meta_key, meta_value FROM wp_postmeta WHERE post_id = ?';
  const params = [postId];

  if (metaKey) {
    sql += ' AND meta_key = ?';
    params.push(metaKey);
  }

  return await wpQuery(sql, params);
}

/**
 * Get top performing posts by view count (last 30 days)
 * Requires a post views tracking plugin that stores views in post meta
 *
 * @param {number} limit - Max number of posts to return (default: 10)
 * @param {number} days - Number of days to look back (default: 30)
 * @returns {Promise<Array>} Top posts with view counts
 *
 * @example
 * const topPosts = await getTopPosts(10, 30);
 */
export async function getTopPosts(limit = 10, days = 30) {
  const sql = `
    SELECT
      p.ID,
      p.post_title,
      p.guid,
      CAST(pm.meta_value AS UNSIGNED) as view_count
    FROM wp_posts p
    LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_post_views'
    WHERE p.post_status = 'publish'
      AND p.post_type = 'post'
      AND p.post_date > DATE_SUB(NOW(), INTERVAL ? DAY)
    ORDER BY view_count DESC
    LIMIT ?
  `;

  return await wpQuery(sql, [days, limit]);
}

/**
 * Get posts by category name
 *
 * @param {string} categoryName - Category name or slug
 * @param {number} limit - Max number of posts (default: 10)
 * @returns {Promise<Array>} Posts in the category
 *
 * @example
 * const accountingPosts = await getPostsByCategory('accounting-degrees', 20);
 */
export async function getPostsByCategory(categoryName, limit = 10) {
  const sql = `
    SELECT DISTINCT p.ID, p.post_title, p.guid, p.post_date
    FROM wp_posts p
    INNER JOIN wp_term_relationships tr ON p.ID = tr.object_id
    INNER JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
    INNER JOIN wp_terms t ON tt.term_id = t.term_id
    WHERE tt.taxonomy = 'category'
      AND (t.name = ? OR t.slug = ?)
      AND p.post_status = 'publish'
    ORDER BY p.post_date DESC
    LIMIT ?
  `;

  return await wpQuery(sql, [categoryName, categoryName, limit]);
}

/**
 * Search posts by keyword (title and content)
 *
 * @param {string} keyword - Search keyword
 * @param {number} limit - Max number of results (default: 10)
 * @returns {Promise<Array>} Matching posts
 *
 * @example
 * const results = await searchPosts('online mba', 20);
 */
export async function searchPosts(keyword, limit = 10) {
  const searchTerm = `%${keyword}%`;
  const sql = `
    SELECT ID, post_title, guid, post_date
    FROM wp_posts
    WHERE post_status = 'publish'
      AND post_type = 'post'
      AND (post_title LIKE ? OR post_content LIKE ?)
    ORDER BY post_date DESC
    LIMIT ?
  `;

  return await wpQuery(sql, [searchTerm, searchTerm, limit]);
}

/**
 * Test database connection
 * Health check endpoint for monitoring
 *
 * @returns {Promise<Object>} Connection status
 *
 * @example
 * const status = await testConnection();
 * if (status.success) {
 *   console.log('WordPress DB connected');
 * }
 */
export async function testConnection() {
  try {
    await wpQuery('SELECT 1 as test');
    return {
      success: true,
      message: 'WordPress database connection successful',
      config: {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.user
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'WordPress database connection failed'
    };
  }
}

/**
 * Close connection pool
 * Call when application shuts down
 *
 * @example
 * // On application shutdown
 * await closePool();
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[WP DB] Connection pool closed');
  }
}

/**
 * Get custom field value from post meta (helper function)
 *
 * @param {number} postId - WordPress post ID
 * @param {string} fieldName - Custom field name
 * @param {any} defaultValue - Default value if field doesn't exist
 * @returns {Promise<any>} Field value or default
 */
export async function getCustomField(postId, fieldName, defaultValue = null) {
  const meta = await getPostMeta(postId, fieldName);
  if (meta && meta.length > 0) {
    return meta[0].meta_value;
  }
  return defaultValue;
}

// Export configuration for debugging/testing
export const config = dbConfig;
