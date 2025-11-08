/**
 * PERDIA EDUCATION - CHAT UTILITIES
 * ==================================
 * Utility functions for chat operations, including AI-powered chat naming
 */

import { invokeLLM } from './ai-client';

/**
 * Generate a concise chat name from the first message using AI
 * Uses Claude Haiku 4.5 for fast, cost-effective naming
 *
 * @param {string} firstMessage - The first message content in the chat
 * @returns {Promise<string>} A 2-4 word summary to use as the chat name
 */
export async function generateChatName(firstMessage) {
  if (!firstMessage || firstMessage.trim().length === 0) {
    return 'New Chat';
  }

  try {
    // Use Claude Haiku 4.5 for fast, cost-effective generation
    const name = await invokeLLM({
      prompt: `Generate a concise 2-4 word title for a chat conversation that starts with this message:

"${firstMessage.trim()}"

Requirements:
- Maximum 4 words
- Descriptive and specific to the topic
- No quotes or special characters
- Capitalize each word
- Just return the title, nothing else`,
      provider: 'claude',
      model: 'claude-haiku-4-5-20251001', // Use Haiku 4.5 for speed
      temperature: 0.7,
      maxTokens: 50, // Very short response needed
    });

    // Clean up the response (remove any quotes, trim, capitalize)
    const cleanedName = name
      .trim()
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .split(' ')
      .slice(0, 4) // Ensure max 4 words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    return cleanedName || 'New Chat';
  } catch (error) {
    console.error('Failed to generate chat name:', error);
    // Fallback to simple truncation if AI fails
    return firstMessage.trim().slice(0, 30).split(' ').slice(0, 4).join(' ') || 'New Chat';
  }
}

/**
 * Check if a channel name is temporary (auto-generated placeholder)
 * @param {string} name - Channel name to check
 * @returns {boolean} True if the name is a temporary placeholder
 */
export function isTemporaryChannelName(name) {
  return name && name.startsWith('New Chat ');
}

/**
 * Format a channel name for display
 * @param {string} name - Raw channel name
 * @returns {string} Formatted name
 */
export function formatChannelName(name) {
  if (!name) return 'Unnamed Channel';

  // Remove common prefixes
  const cleaned = name.replace(/^(dm_|channel_)/i, '');

  // Format display
  return cleaned
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
