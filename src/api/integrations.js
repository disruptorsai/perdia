/**
 * PERDIA INTEGRATION EXPORTS
 * Replaces Base44 integrations with custom implementations
 */

import { invokeLLM, generateImage } from '@/lib/ai-client';
import { supabase } from '@/lib/supabase-client';

// ============================================================================
// AI INTEGRATIONS
// ============================================================================

/**
 * InvokeLLM - AI content generation
 * Replaces Base44's InvokeLLM with custom Claude/OpenAI implementation
 *
 * @param {Object} params
 * @param {string} params.prompt - The prompt to send to the AI
 * @param {string} [params.model] - Optional model override
 * @param {number} [params.temperature] - Optional temperature (0-1)
 * @param {number} [params.max_tokens] - Optional max tokens
 * @returns {Promise<string>} - AI-generated response
 */
export async function InvokeLLM({ prompt, model, temperature, max_tokens }) {
  return await invokeLLM({ prompt, model, temperature, maxTokens: max_tokens });
}

/**
 * GenerateImage - AI image generation
 * Currently not actively used in Perdia Education app
 */
export async function GenerateImage(params) {
  return await generateImage(params);
}

// ============================================================================
// FILE STORAGE INTEGRATIONS
// ============================================================================

/**
 * UploadFile - Upload file to Supabase Storage
 * Replaces Base44's file upload with Supabase Storage
 *
 * @param {Object} params
 * @param {File} params.file - The file to upload
 * @param {string} [params.bucket] - Optional bucket name (default: 'uploads')
 * @param {string} [params.folder] - Optional folder path
 * @returns {Promise<Object>} - { file_url, file_path }
 */
export async function UploadFile({ file, bucket = 'uploads', folder = '' }) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Create unique file path
    const timestamp = Date.now();
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = folder
      ? `${user.id}/${folder}/${timestamp}_${fileName}`
      : `${user.id}/${timestamp}_${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      file_url: urlData.publicUrl,
      file_path: data.path,
      bucket: bucket
    };
  } catch (error) {
    console.error('UploadFile error:', error);
    throw error;
  }
}

/**
 * CreateFileSignedUrl - Create signed URL for private file access
 *
 * @param {Object} params
 * @param {string} params.file_path - Path to file in storage
 * @param {string} [params.bucket] - Bucket name (default: 'uploads')
 * @param {number} [params.expiresIn] - Expiry in seconds (default: 3600)
 * @returns {Promise<Object>} - { signedUrl }
 */
export async function CreateFileSignedUrl({ file_path, bucket = 'uploads', expiresIn = 3600 }) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(file_path, expiresIn);

    if (error) throw error;

    return { signedUrl: data.signedUrl };
  } catch (error) {
    console.error('CreateFileSignedUrl error:', error);
    throw error;
  }
}

/**
 * UploadPrivateFile - Upload file to private bucket
 * Currently not actively used in Perdia Education app
 */
export async function UploadPrivateFile(params) {
  return await UploadFile({ ...params, bucket: 'knowledge-base' });
}

/**
 * ExtractDataFromUploadedFile - Extract data from uploaded file
 * Currently not actively used in Perdia Education app
 * Could be implemented with PDF parsing libraries if needed
 */
export async function ExtractDataFromUploadedFile(params) {
  console.warn('ExtractDataFromUploadedFile not yet implemented');
  return { extracted_text: '' };
}

// ============================================================================
// EMAIL INTEGRATIONS (Not actively used)
// ============================================================================

/**
 * SendEmail - Send email
 * Currently not actively used in Perdia Education app
 * Can be implemented with Resend or SendGrid if needed
 */
export async function SendEmail(params) {
  console.warn('SendEmail not yet implemented');
  return { success: false, message: 'Email integration not configured' };
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

// Export Core object for backward compatibility
export const Core = {
  InvokeLLM,
  GenerateImage,
  UploadFile,
  CreateFileSignedUrl,
  UploadPrivateFile,
  ExtractDataFromUploadedFile,
  SendEmail
};

export default {
  Core
};
