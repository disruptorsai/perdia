/**
 * Content Utility Functions
 * Shared utilities for content management across the app
 */

/**
 * Get badge color classes for content status
 * @param {string} status - Content status (draft, pending_review, approved, etc.)
 * @returns {string} Tailwind CSS classes for badge styling
 */
export function getStatusColor(status) {
  const colors = {
    draft: 'bg-gray-100 text-gray-800',
    pending_review: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    scheduled: 'bg-purple-100 text-purple-800',
    published: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    queued: 'bg-yellow-100 text-yellow-800',
  };

  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get badge color classes for content type
 * @param {string} type - Content type (new_article, update, etc.)
 * @returns {string} Tailwind CSS classes for badge styling
 */
export function getTypeColor(type) {
  const colors = {
    new_article: 'bg-green-100 text-green-800',
    update: 'bg-blue-100 text-blue-800',
    optimization: 'bg-purple-100 text-purple-800',
    rewrite: 'bg-orange-100 text-orange-800',
  };

  return colors[type] || 'bg-gray-100 text-gray-800';
}

/**
 * Get display label for status
 * @param {string} status - Content status
 * @returns {string} Human-readable status label
 */
export function getStatusLabel(status) {
  const labels = {
    draft: 'Draft',
    pending_review: 'Pending Review',
    approved: 'Approved',
    scheduled: 'Scheduled',
    published: 'Published',
    rejected: 'Rejected',
    in_progress: 'In Progress',
    completed: 'Completed',
    queued: 'Queued',
  };

  return labels[status] || status;
}

/**
 * Get display label for content type
 * @param {string} type - Content type
 * @returns {string} Human-readable type label
 */
export function getTypeLabel(type) {
  const labels = {
    new_article: 'New Article',
    update: 'Update',
    optimization: 'Optimization',
    rewrite: 'Rewrite',
  };

  return labels[type] || type;
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'relative')
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'short') {
  if (!date) return '-';

  const d = new Date(date);

  if (isNaN(d.getTime())) return '-';

  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

    case 'long':
      return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

    case 'relative':
      return getRelativeTime(d);

    default:
      return d.toLocaleDateString();
  }
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {Date} date - Date to compare
 * @returns {string} Relative time string
 */
function getRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

  return formatDate(date, 'short');
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text with ellipsis
 */
export function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Calculate reading time for content
 * @param {string} content - Content text (HTML or plain text)
 * @returns {number} Estimated reading time in minutes
 */
export function calculateReadingTime(content) {
  if (!content) return 0;

  // Remove HTML tags if present
  const text = content.replace(/<[^>]*>/g, '');

  // Average reading speed: 200 words per minute
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);

  return minutes;
}

/**
 * Get priority color for keywords
 * @param {number} priority - Priority level (1-5)
 * @returns {string} Tailwind CSS classes
 */
export function getPriorityColor(priority) {
  const colors = {
    1: 'bg-red-100 text-red-800',
    2: 'bg-orange-100 text-orange-800',
    3: 'bg-yellow-100 text-yellow-800',
    4: 'bg-blue-100 text-blue-800',
    5: 'bg-gray-100 text-gray-800',
  };

  return colors[priority] || colors[5];
}

/**
 * Format number with commas (e.g., 1000 -> 1,000)
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString();
}
