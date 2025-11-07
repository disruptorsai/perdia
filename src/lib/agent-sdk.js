/**
 * PERDIA EDUCATION - AGENT SDK
 * ============================
 * Custom implementation of AI agent conversation system
 *
 * This module replaces the missing Base44 agentSDK with a custom implementation
 * that maintains the same API interface used throughout the Perdia app.
 *
 * CRITICAL: The Base44 app imported `agentSDK` from '@/agents', but this file
 * didn't exist in the export. This implementation provides that missing functionality.
 *
 * Usage:
 *   import { agentSDK } from '@/lib/agent-sdk';
 *
 *   // Same API as Base44
 *   const conversations = await agentSDK.listConversations({ agent_name: 'seo_content_writer' });
 *   const response = await agentSDK.sendMessage({ conversation_id, message: 'Write an article...' });
 */

import { supabase, getCurrentUser } from './supabase-client';
import { invokeLLM } from './ai-client';
import {
  AgentDefinition,
  AgentConversation,
  AgentMessage,
} from './perdia-sdk';

// =====================================================
// AGENT SDK CLASS
// =====================================================

class AgentSDK {
  constructor() {
    this.defaultModel = 'claude-3-sonnet-20240229';
    this.defaultProvider = 'claude';
  }

  // ===================================================
  // CONVERSATION MANAGEMENT
  // ===================================================

  /**
   * List conversations for a specific agent
   * @param {object} options
   * @param {string} options.agent_name - Agent name
   * @param {boolean} [options.include_archived=false] - Include archived
   * @param {number} [options.limit=50] - Max conversations to return
   * @returns {Promise<Array>}
   */
  async listConversations(options) {
    const {
      agent_name,
      include_archived = false,
      limit = 50,
    } = options;

    try {
      const { user } = await getCurrentUser();
      // Auth is now mocked for development, user will always exist
      if (!user) {
        console.warn('No user found - this should not happen with mock auth');
        return null;
      }

      // Build filters
      const filters = {
        agent_name,
      };

      if (!include_archived) {
        filters.is_archived = false;
      }

      // Fetch conversations
      const conversations = await AgentConversation.find(filters, {
        limit,
        orderBy: { column: 'updated_date', ascending: false },
      });

      // Load last message for each conversation
      const conversationsWithMessages = await Promise.all(
        conversations.map(async (conv) => {
          const messages = await AgentMessage.find(
            { conversation_id: conv.id },
            { limit: 1, orderBy: { column: 'created_date', ascending: false } }
          );

          return {
            ...conv,
            last_message: messages[0] || null,
            message_count: await AgentMessage.count({ conversation_id: conv.id }),
          };
        })
      );

      return conversationsWithMessages;
    } catch (error) {
      console.error('Error listing conversations:', error);
      throw error;
    }
  }

  /**
   * Get conversation by ID with full message history
   * @param {object} options
   * @param {string} options.conversation_id - Conversation ID
   * @returns {Promise<object>}
   */
  async getConversation(options) {
    const { conversation_id } = options;

    try {
      const { user } = await getCurrentUser();
      // Auth is now mocked for development, user will always exist
      if (!user) {
        console.warn('No user found - this should not happen with mock auth');
        return null;
      }

      // Fetch conversation
      const conversation = await AgentConversation.findOne(conversation_id);

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Fetch all messages
      const messages = await AgentMessage.find(
        { conversation_id },
        { orderBy: { column: 'created_date', ascending: true } }
      );

      // Fetch agent definition
      const agentDef = await this.getAgentDefinition(conversation.agent_name);

      return {
        ...conversation,
        messages,
        agent_definition: agentDef,
      };
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  /**
   * Create new conversation
   * @param {object} options
   * @param {string} options.agent_name - Agent name
   * @param {string} [options.initial_message] - Optional first message
   * @param {object} [options.context] - Optional context data
   * @returns {Promise<object>}
   */
  async createConversation(options) {
    const {
      agent_name,
      initial_message,
      context = {},
    } = options;

    try {
      const { user } = await getCurrentUser();
      // Auth is now mocked for development, user will always exist
      if (!user) {
        console.warn('No user found - this should not happen with mock auth');
        return null;
      }

      // Verify agent exists
      const agentDef = await this.getAgentDefinition(agent_name);
      if (!agentDef) {
        throw new Error(`Agent not found: ${agent_name}`);
      }

      // Create conversation
      const conversation = await AgentConversation.create({
        agent_name,
        title: initial_message
          ? this.generateTitle(initial_message)
          : `New ${agentDef.display_name} Conversation`,
        context,
      });

      // If initial message provided, send it
      if (initial_message) {
        await this.sendMessage({
          conversation_id: conversation.id,
          message: initial_message,
        });

        // Reload conversation with messages
        return await this.getConversation({ conversation_id: conversation.id });
      }

      return {
        ...conversation,
        messages: [],
        agent_definition: agentDef,
      };
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Delete conversation
   * @param {object} options
   * @param {string} options.conversation_id - Conversation ID
   * @returns {Promise<boolean>}
   */
  async deleteConversation(options) {
    const { conversation_id } = options;

    try {
      await AgentConversation.delete(conversation_id);
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  /**
   * Archive conversation
   * @param {object} options
   * @param {string} options.conversation_id - Conversation ID
   * @returns {Promise<object>}
   */
  async archiveConversation(options) {
    const { conversation_id } = options;

    try {
      const updated = await AgentConversation.update(conversation_id, {
        is_archived: true,
      });
      return updated;
    } catch (error) {
      console.error('Error archiving conversation:', error);
      throw error;
    }
  }

  /**
   * Unarchive conversation
   * @param {object} options
   * @param {string} options.conversation_id - Conversation ID
   * @returns {Promise<object>}
   */
  async unarchiveConversation(options) {
    const { conversation_id } = options;

    try {
      const updated = await AgentConversation.update(conversation_id, {
        is_archived: false,
      });
      return updated;
    } catch (error) {
      console.error('Error unarchiving conversation:', error);
      throw error;
    }
  }

  // ===================================================
  // MESSAGE MANAGEMENT
  // ===================================================

  /**
   * Send message to agent and get response
   * @param {object} options
   * @param {string} options.conversation_id - Conversation ID
   * @param {string} options.message - User message
   * @param {string} [options.provider] - AI provider override
   * @param {string} [options.model] - AI model override
   * @returns {Promise<object>} { user_message, assistant_message }
   */
  async sendMessage(options) {
    const {
      conversation_id,
      message,
      provider,
      model,
    } = options;

    try {
      const { user } = await getCurrentUser();
      // Auth is now mocked for development, user will always exist
      if (!user) {
        console.warn('No user found - this should not happen with mock auth');
        return null;
      }

      // Get conversation with full history
      const conversation = await this.getConversation({ conversation_id });

      // Get agent definition
      const agentDef = conversation.agent_definition;

      // Save user message
      const userMessage = await AgentMessage.create({
        conversation_id,
        role: 'user',
        content: message,
      });

      // Build message history for context
      const messageHistory = this.buildMessageHistory(conversation.messages);

      // Add new user message
      messageHistory.push({
        role: 'user',
        content: message,
      });

      // Get agent response from AI
      const assistantResponse = await invokeLLM({
        provider: provider || agentDef.default_model?.includes('gpt') ? 'openai' : 'claude',
        model: model || agentDef.default_model,
        systemPrompt: agentDef.system_prompt,
        messages: messageHistory,
        temperature: agentDef.temperature || 0.7,
        maxTokens: agentDef.max_tokens || 4000,
      });

      // Save assistant message
      const assistantMessage = await AgentMessage.create({
        conversation_id,
        role: 'assistant',
        content: assistantResponse,
        model_used: model || agentDef.default_model,
        // Token counting would go here
      });

      // Update conversation last_message_date
      await AgentConversation.update(conversation_id, {
        last_message_date: new Date().toISOString(),
      });

      // Generate title if this is the first exchange and no title set
      if (conversation.messages.length === 0 && !conversation.title) {
        const title = this.generateTitle(message);
        await AgentConversation.update(conversation_id, { title });
      }

      return {
        user_message: userMessage,
        assistant_message: assistantMessage,
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get message history for a conversation
   * @param {object} options
   * @param {string} options.conversation_id - Conversation ID
   * @param {number} [options.limit] - Max messages to return
   * @returns {Promise<Array>}
   */
  async getMessages(options) {
    const { conversation_id, limit } = options;

    try {
      const messages = await AgentMessage.find(
        { conversation_id },
        {
          orderBy: { column: 'created_date', ascending: true },
          limit,
        }
      );

      return messages;
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  /**
   * Delete a specific message
   * @param {object} options
   * @param {string} options.message_id - Message ID
   * @returns {Promise<boolean>}
   */
  async deleteMessage(options) {
    const { message_id } = options;

    try {
      await AgentMessage.delete(message_id);
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // ===================================================
  // AGENT MANAGEMENT
  // ===================================================

  /**
   * Get all active agent definitions
   * @returns {Promise<Array>}
   */
  async listAgents() {
    try {
      const agents = await AgentDefinition.find(
        { is_active: true },
        { orderBy: { column: 'display_name', ascending: true } }
      );

      return agents;
    } catch (error) {
      console.error('Error listing agents:', error);
      throw error;
    }
  }

  /**
   * Get specific agent definition by name
   * @param {string} agent_name - Agent name
   * @returns {Promise<object>}
   */
  async getAgentDefinition(agent_name) {
    try {
      const agents = await AgentDefinition.find({ agent_name });
      return agents[0] || null;
    } catch (error) {
      console.error('Error getting agent definition:', error);
      throw error;
    }
  }

  /**
   * Update agent definition (admin only)
   * @param {string} agent_name - Agent name
   * @param {object} updates - Fields to update
   * @returns {Promise<object>}
   */
  async updateAgentDefinition(agent_name, updates) {
    try {
      const agent = await this.getAgentDefinition(agent_name);
      if (!agent) {
        throw new Error(`Agent not found: ${agent_name}`);
      }

      const updated = await AgentDefinition.update(agent.id, updates);
      return updated;
    } catch (error) {
      console.error('Error updating agent definition:', error);
      throw error;
    }
  }

  // ===================================================
  // HELPER METHODS
  // ===================================================

  /**
   * Build message history in format expected by AI providers
   * @param {Array} messages - Database messages
   * @returns {Array}
   */
  buildMessageHistory(messages) {
    return messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
  }

  /**
   * Generate conversation title from first message
   * @param {string} message - First message
   * @returns {string}
   */
  generateTitle(message) {
    // Take first 50 characters or first sentence
    const firstSentence = message.split(/[.!?]/)[0];
    const title = (firstSentence || message).substring(0, 50);
    return title + (title.length < message.length ? '...' : '');
  }

  /**
   * Estimate cost of conversation (based on tokens)
   * @param {string} conversation_id - Conversation ID
   * @returns {Promise<object>}
   */
  async estimateCost(conversation_id) {
    try {
      const messages = await AgentMessage.find({ conversation_id });

      const totalTokens = messages.reduce((sum, msg) => {
        return sum + (msg.tokens_used || 0);
      }, 0);

      // Rough cost estimates (as of 2025)
      const costPerMillionTokens = {
        'claude-3-5-sonnet': 3.00, // $3 per 1M tokens (input)
        'gpt-4o': 2.50, // $2.50 per 1M tokens (input)
        'gpt-4o-mini': 0.15, // $0.15 per 1M tokens (input)
      };

      // Use average cost
      const avgCostPerMillionTokens = 2.00;
      const estimatedCost = (totalTokens / 1000000) * avgCostPerMillionTokens;

      return {
        total_tokens: totalTokens,
        estimated_cost_usd: estimatedCost.toFixed(4),
        message_count: messages.length,
      };
    } catch (error) {
      console.error('Error estimating cost:', error);
      return {
        total_tokens: 0,
        estimated_cost_usd: '0.0000',
        message_count: 0,
      };
    }
  }

  /**
   * Search conversations by content
   * @param {object} options
   * @param {string} options.agent_name - Agent name
   * @param {string} options.search_query - Search query
   * @returns {Promise<Array>}
   */
  async searchConversations(options) {
    const { agent_name, search_query } = options;

    try {
      // Search conversation titles
      const { data, error } = await supabase
        .from('agent_conversations')
        .select('*')
        .eq('agent_name', agent_name)
        .ilike('title', `%${search_query}%`)
        .order('updated_date', { ascending: false });

      if (error) throw error;

      // Also search message content
      const { data: messagesData } = await supabase
        .from('agent_messages')
        .select('conversation_id')
        .ilike('content', `%${search_query}%`);

      const conversationIds = new Set([
        ...data.map(c => c.id),
        ...(messagesData || []).map(m => m.conversation_id),
      ]);

      // Fetch full conversation objects
      const conversations = await Promise.all(
        Array.from(conversationIds).map(id =>
          this.getConversation({ conversation_id: id })
        )
      );

      return conversations;
    } catch (error) {
      console.error('Error searching conversations:', error);
      throw error;
    }
  }

  /**
   * Export conversation as markdown
   * @param {object} options
   * @param {string} options.conversation_id - Conversation ID
   * @returns {Promise<string>}
   */
  async exportConversation(options) {
    const { conversation_id } = options;

    try {
      const conversation = await this.getConversation({ conversation_id });

      let markdown = `# ${conversation.title}\n\n`;
      markdown += `**Agent:** ${conversation.agent_definition.display_name}\n`;
      markdown += `**Date:** ${new Date(conversation.created_date).toLocaleString()}\n\n`;
      markdown += `---\n\n`;

      for (const msg of conversation.messages) {
        const roleLabel = msg.role === 'user' ? 'You' : conversation.agent_definition.display_name;
        markdown += `### ${roleLabel}\n\n`;
        markdown += `${msg.content}\n\n`;
      }

      return markdown;
    } catch (error) {
      console.error('Error exporting conversation:', error);
      throw error;
    }
  }

  // ===================================================
  // STREAMING (FUTURE IMPLEMENTATION)
  // ===================================================

  /**
   * Send message with streaming response
   * NOT YET IMPLEMENTED - Placeholder for future enhancement
   * @param {object} options
   * @returns {Promise<AsyncGenerator>}
   */
  async sendMessageStreaming(options) {
    throw new Error('Streaming not yet implemented');
    // Future implementation would use Server-Sent Events or WebSockets
  }
}

// =====================================================
// SINGLETON INSTANCE
// =====================================================

export const agentSDK = new AgentSDK();

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default agentSDK;
