/**
 * PERDIA EDUCATION CUSTOM SDK
 * ===========================
 * Base44-compatible SDK wrapper for Supabase
 *
 * This module provides a drop-in replacement for the Base44 SDK, maintaining
 * the same API interface while using Supabase as the backend.
 *
 * MIGRATION STRATEGY:
 * - Same entity API as Base44: Entity.find(), Entity.create(), etc.
 * - Same integration patterns: InvokeLLM, UploadFile, etc.
 * - Seamless replacement: just update imports, keep code structure
 *
 * Usage:
 *   import { Keyword, ContentQueue, InvokeLLM } from '@/lib/perdia-sdk';
 *
 *   // Same API as Base44
 *   const keywords = await Keyword.find({ list_type: 'currently_ranked' });
 *   const newKeyword = await Keyword.create({ keyword: 'test', list_type: 'new_target' });
 */

import { supabase, getCurrentUser } from './supabase-client';
import { invokeLLM, generateImage } from './ai-client';
import {
  uploadFile as uploadToStorage,
  deleteFile,
  getSignedUrl,
  getPublicUrl,
} from './supabase-client';

// =====================================================
// BASE ENTITY CLASS
// =====================================================

/**
 * Base class for all Supabase entities
 * Provides Base44-compatible CRUD operations
 */
class BaseEntity {
  constructor(tableName, schema = {}) {
    this.tableName = tableName;
    this.schema = schema;
  }

  /**
   * Find records with optional filters
   * @param {object} filters - Query filters
   * @param {object} options - Query options (limit, offset, orderBy)
   * @returns {Promise<Array>}
   */
  async find(filters = {}, options = {}) {
    try {
      // Get current user for RLS
      const { user } = await getCurrentUser();
      if (!user) {
        // In development, return empty array instead of throwing error
        console.warn(`[${this.tableName}] No authenticated user - returning empty array`);
        const emptyResult = [];
        emptyResult.count = 0;
        return emptyResult;
      }

      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact' });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (value !== null && value !== undefined) {
          query = query.eq(key, value);
        }
      });

      // Apply ordering
      if (options.orderBy) {
        const { column, ascending = false } = options.orderBy;
        query = query.order(column, { ascending });
      } else {
        // Default: order by created_date DESC
        query = query.order('created_date', { ascending: false });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        );
      }

      const { data, error, count } = await query;

      if (error) {
        console.error(`Error fetching ${this.tableName}:`, error);
        throw error;
      }

      // Return array with count property (Base44 style)
      const result = data || [];
      result.count = count;
      return result;
    } catch (error) {
      console.error(`Error in ${this.tableName}.find():`, error);
      throw error;
    }
  }

  /**
   * Find one record by ID
   * @param {string} id - Record ID
   * @returns {Promise<object>}
   */
  async findOne(id) {
    try {
      const { user } = await getCurrentUser();
      if (!user) {
        console.warn(`[${this.tableName}] No authenticated user - returning null`);
        return null;
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Error fetching ${this.tableName} by ID:`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Error in ${this.tableName}.findOne():`, error);
      throw error;
    }
  }

  /**
   * List all records with optional ordering
   * Simplified version of find() that takes a single ordering parameter
   * @param {string} orderBy - Column name to order by. Prefix with '-' for descending (e.g., '-created_date')
   * @param {object} options - Query options (limit, offset)
   * @returns {Promise<Array>}
   */
  async list(orderBy = '-created_date', options = {}) {
    try {
      // Parse orderBy parameter
      let column = orderBy;
      let ascending = true;

      if (orderBy.startsWith('-')) {
        column = orderBy.substring(1);
        ascending = false;
      }

      // Call find with appropriate parameters
      return await this.find({}, {
        ...options,
        orderBy: { column, ascending }
      });
    } catch (error) {
      console.error(`Error in ${this.tableName}.list():`, error);
      throw error;
    }
  }

  /**
   * Create new record
   * @param {object} data - Record data
   * @returns {Promise<object>}
   */
  async create(data) {
    try {
      const { user } = await getCurrentUser();
      if (!user) {
        console.error(`[${this.tableName}] Cannot create without authentication`);
        throw new Error('Authentication required to create records');
      }

      // Auto-add user_id if not present
      const recordData = {
        ...data,
        user_id: data.user_id || user.id,
      };

      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(recordData)
        .select()
        .single();

      if (error) {
        console.error(`Error creating ${this.tableName}:`, error);
        throw error;
      }

      return result;
    } catch (error) {
      console.error(`Error in ${this.tableName}.create():`, error);
      throw error;
    }
  }

  /**
   * Update record by ID
   * @param {string} id - Record ID
   * @param {object} data - Update data
   * @returns {Promise<object>}
   */
  async update(id, data) {
    try {
      const { user } = await getCurrentUser();
      if (!user) {
        console.error(`[${this.tableName}] Cannot update without authentication`);
        throw new Error('Authentication required to update records');
      }

      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating ${this.tableName}:`, error);
        throw error;
      }

      return result;
    } catch (error) {
      console.error(`Error in ${this.tableName}.update():`, error);
      throw error;
    }
  }

  /**
   * Delete record by ID
   * @param {string} id - Record ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    try {
      const { user } = await getCurrentUser();
      if (!user) {
        console.error(`[${this.tableName}] Cannot delete without authentication`);
        throw new Error('Authentication required to delete records');
      }

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Error deleting ${this.tableName}:`, error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error(`Error in ${this.tableName}.delete():`, error);
      throw error;
    }
  }

  /**
   * Count records with filters
   * @param {object} filters - Query filters
   * @returns {Promise<number>}
   */
  async count(filters = {}) {
    try {
      const { user } = await getCurrentUser();
      if (!user) {
        console.warn(`[${this.tableName}] No authenticated user - returning 0`);
        return 0;
      }

      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (value !== null && value !== undefined) {
          query = query.eq(key, value);
        }
      });

      const { count, error } = await query;

      if (error) {
        console.error(`Error counting ${this.tableName}:`, error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error(`Error in ${this.tableName}.count():`, error);
      throw error;
    }
  }

  /**
   * Subscribe to realtime changes
   * @param {function} callback - Called on INSERT, UPDATE, DELETE
   * @param {object} filter - Optional filter
   * @returns {object} Subscription object
   */
  subscribe(callback, filter = null) {
    let channel = supabase
      .channel(`${this.tableName}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.tableName,
          ...(filter && { filter: `${filter.column}=eq.${filter.value}` }),
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  }
}

// =====================================================
// ENTITY DEFINITIONS
// =====================================================

// Core SEO Content Entities (PRIMARY - ACTIVE)
export const Keyword = new BaseEntity('keywords');
export const ContentQueue = new BaseEntity('content_queue');
export const PerformanceMetric = new BaseEntity('performance_metrics');
export const WordPressConnection = new BaseEntity('wordpress_connections');
export const AutomationSettings = new BaseEntity('automation_settings');
export const PageOptimization = new BaseEntity('page_optimizations');
export const BlogPost = new BaseEntity('blog_posts');
export const SocialPost = new BaseEntity('social_posts');
export const KnowledgeBaseDocument = new BaseEntity('knowledge_base_documents');
export const AgentFeedback = new BaseEntity('agent_feedback');
export const FileDocument = new BaseEntity('file_documents');
export const ChatChannel = new BaseEntity('chat_channels');
export const ChatMessage = new BaseEntity('chat_messages');

// AI Agent System Entities
export const AgentDefinition = new BaseEntity('agent_definitions');
export const AgentConversation = new BaseEntity('agent_conversations');
export const AgentMessage = new BaseEntity('agent_messages');

// Legacy Entities (NOT USED - kept for compatibility)
export const Client = new BaseEntity('clients'); // Not implemented
export const Project = new BaseEntity('projects'); // Not implemented
export const Task = new BaseEntity('tasks'); // Not implemented
export const TimeEntry = new BaseEntity('time_entries'); // Not implemented
export const EOSCompany = new BaseEntity('eos_companies'); // Not implemented
export const EOSRock = new BaseEntity('eos_rocks'); // Not implemented
export const EOSIssue = new BaseEntity('eos_issues'); // Not implemented
export const EOSScorecard = new BaseEntity('eos_scorecards'); // Not implemented
export const EOSAccountabilitySeat = new BaseEntity('eos_accountability_seats'); // Not implemented
export const EOSPersonAssessment = new BaseEntity('eos_person_assessments'); // Not implemented
export const EOSProcess = new BaseEntity('eos_processes'); // Not implemented
export const EOSProcessImprovement = new BaseEntity('eos_process_improvements'); // Not implemented
export const EOSScorecardMetric = new BaseEntity('eos_scorecard_metrics'); // Not implemented
export const EOSScorecardEntry = new BaseEntity('eos_scorecard_entries'); // Not implemented
export const EOSQuarterlySession = new BaseEntity('eos_quarterly_sessions'); // Not implemented
export const EOSToDo = new BaseEntity('eos_todos'); // Not implemented
export const MeetingNote = new BaseEntity('meeting_notes'); // Not implemented
export const Report = new BaseEntity('reports'); // Not implemented

// =====================================================
// USER / AUTH ENTITY
// =====================================================

/**
 * User authentication and profile management
 * Replaces Base44.auth
 */
export const User = {
  /**
   * Get current authenticated user
   * @returns {Promise<object>}
   */
  async me() {
    const { user, session } = await getCurrentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }
    return { ...user, session };
  },

  /**
   * Sign in with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>}
   */
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data.user;
  },

  /**
   * Sign up new user
   * @param {string} email
   * @param {string} password
   * @param {object} metadata
   * @returns {Promise<object>}
   */
  async signUp(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;
    return data.user;
  },

  /**
   * Sign out current user
   * @returns {Promise<void>}
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Update user profile
   * @param {object} updates
   * @returns {Promise<object>}
   */
  async updateProfile(updates) {
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    });

    if (error) throw error;
    return data.user;
  },

  /**
   * Reset password
   * @param {string} email
   * @returns {Promise<void>}
   */
  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  },

  /**
   * Update password
   * @param {string} newPassword
   * @returns {Promise<void>}
   */
  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  },

  /**
   * Subscribe to auth state changes
   * @param {function} callback
   * @returns {object} Subscription
   */
  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        callback(event, session);
      }
    );

    return subscription;
  },
};

// =====================================================
// CORE INTEGRATIONS
// =====================================================

/**
 * InvokeLLM Integration
 * Replaces Base44.integrations.Core.InvokeLLM
 *
 * Supports both Claude and OpenAI with unified interface
 */
export const InvokeLLM = async (options) => {
  try {
    const {
      prompt,
      response_json_schema,
      model,
      provider,
      temperature,
      max_tokens,
      stream = false,
    } = options;

    // Call AI client (supports Claude and OpenAI)
    const result = await invokeLLM({
      prompt,
      responseSchema: response_json_schema,
      model,
      provider,
      temperature,
      maxTokens: max_tokens,
      stream,
    });

    return result;
  } catch (error) {
    console.error('InvokeLLM error:', error);
    throw error;
  }
};

/**
 * UploadFile Integration
 * Replaces Base44.integrations.Core.UploadFile
 *
 * Uploads to Supabase Storage (default: uploads bucket)
 */
export const UploadFile = async (options) => {
  try {
    const { file, bucket = 'uploads', path, isPublic = false } = options;

    // Get current user for path prefix
    const { user } = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    // Auto-generate path if not provided
    const filePath = path || `${user.id}/${Date.now()}_${file.name}`;

    // Determine bucket based on isPublic flag
    const targetBucket = isPublic
      ? bucket === 'knowledge-base'
        ? 'content-images'
        : bucket
      : 'uploads';

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(targetBucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get URL (public or signed)
    let fileUrl;
    if (isPublic) {
      const { data: { publicUrl } } = supabase.storage
        .from(targetBucket)
        .getPublicUrl(data.path);
      fileUrl = publicUrl;
    } else {
      const { data: signedData, error: signedError } = await supabase.storage
        .from(targetBucket)
        .createSignedUrl(data.path, 3600); // 1 hour expiry

      if (signedError) throw signedError;
      fileUrl = signedData.signedUrl;
    }

    return {
      url: fileUrl,
      path: data.path,
      bucket: targetBucket,
    };
  } catch (error) {
    console.error('UploadFile error:', error);
    throw error;
  }
};

/**
 * UploadPrivateFile Integration
 * Replaces Base44.integrations.Core.UploadPrivateFile
 */
export const UploadPrivateFile = async (options) => {
  return await UploadFile({ ...options, isPublic: false });
};

/**
 * CreateFileSignedUrl Integration
 * Replaces Base44.integrations.Core.CreateFileSignedUrl
 *
 * Creates signed URL for private files
 */
export const CreateFileSignedUrl = async (options) => {
  try {
    const { path, bucket = 'uploads', expiresIn = 3600 } = options;

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;

    return {
      url: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  } catch (error) {
    console.error('CreateFileSignedUrl error:', error);
    throw error;
  }
};

/**
 * GenerateImage Integration
 * Replaces Base44.integrations.Core.GenerateImage
 *
 * Generates images using AI (OpenAI DALL-E or other providers)
 */
export const GenerateImage = async (options) => {
  try {
    const { prompt, size = '1024x1024', quality = 'standard', style = 'natural' } = options;

    const result = await generateImage({
      prompt,
      size,
      quality,
      style,
    });

    return result;
  } catch (error) {
    console.error('GenerateImage error:', error);
    throw error;
  }
};

/**
 * SendEmail Integration
 * Replaces Base44.integrations.Core.SendEmail
 *
 * NOTE: Not currently used in Perdia Education
 * Placeholder for future email integration (Resend/SendGrid)
 */
export const SendEmail = async (options) => {
  console.warn('SendEmail integration not implemented - email service not configured');
  throw new Error('Email service not configured. Set up Resend or SendGrid to enable email sending.');
};

/**
 * ExtractDataFromUploadedFile Integration
 * Replaces Base44.integrations.Core.ExtractDataFromUploadedFile
 *
 * Client-side file parsing (CSV, JSON, etc.)
 */
export const ExtractDataFromUploadedFile = async (options) => {
  try {
    const { file, fileType } = options;

    // CSV parsing
    if (fileType === 'csv' || file.name.endsWith('.csv')) {
      return await parseCSV(file);
    }

    // JSON parsing
    if (fileType === 'json' || file.name.endsWith('.json')) {
      const text = await file.text();
      return JSON.parse(text);
    }

    // Text file
    if (fileType === 'text' || file.name.endsWith('.txt')) {
      return await file.text();
    }

    throw new Error(`Unsupported file type: ${fileType || file.name}`);
  } catch (error) {
    console.error('ExtractDataFromUploadedFile error:', error);
    throw error;
  }
};

/**
 * Helper: Parse CSV file
 * @param {File} file
 * @returns {Promise<Array>}
 */
async function parseCSV(file) {
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    return [];
  }

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

  // Parse rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }

  return data;
}

// =====================================================
// CORE INTEGRATIONS OBJECT
// =====================================================

/**
 * Core integrations namespace
 * Matches Base44.integrations.Core structure
 */
export const Core = {
  InvokeLLM,
  UploadFile,
  UploadPrivateFile,
  CreateFileSignedUrl,
  GenerateImage,
  SendEmail,
  ExtractDataFromUploadedFile,
};

// =====================================================
// MAIN SDK OBJECT
// =====================================================

/**
 * Main Perdia SDK object
 * Matches Base44 SDK structure for seamless migration
 */
export const perdia = {
  // Entities
  entities: {
    // Core SEO Content Entities
    Keyword,
    ContentQueue,
    PerformanceMetric,
    WordPressConnection,
    AutomationSettings,
    PageOptimization,
    BlogPost,
    SocialPost,
    KnowledgeBaseDocument,
    AgentFeedback,
    FileDocument,
    ChatChannel,
    ChatMessage,
    // AI Agent Entities
    AgentDefinition,
    AgentConversation,
    AgentMessage,
    // Legacy Entities (not implemented)
    Client,
    Project,
    Task,
    TimeEntry,
    EOSCompany,
    EOSRock,
    EOSIssue,
    EOSScorecard,
    EOSAccountabilitySeat,
    EOSPersonAssessment,
    EOSProcess,
    EOSProcessImprovement,
    EOSScorecardMetric,
    EOSScorecardEntry,
    EOSQuarterlySession,
    EOSToDo,
    MeetingNote,
    Report,
  },

  // Integrations
  integrations: {
    Core,
  },

  // Auth
  auth: User,
};

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default perdia;
