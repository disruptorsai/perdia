/**
 * PERDIA V2: CORE PIPELINE ENGINE
 * ================================
 *
 * Orchestrates modular, composable AI content generation pipelines.
 * Supports A/B testing different strategies by toggling stages on/off.
 *
 * Pipeline Flow:
 * 1. Input Sources → Select topic (keyword, question, trend)
 * 2. Generators → Create draft content (Claude, GPT, Grok)
 * 3. Verifiers → Fact-check and enhance (Perplexity)
 * 4. Enhancers → Add SEO, links, quotes, images
 * 5. Post-Processing → Transform shortcodes, validate, optimize
 *
 * Created: 2025-11-12
 * Author: Perdia V2 Implementation
 */

import { PipelineConfiguration, ContentQueue } from '../perdia-sdk';
import { InvokeLLM } from '../perdia-sdk';

/**
 * PipelineEngine - Main orchestrator for content generation
 */
export class PipelineEngine {
  constructor(pipelineConfig) {
    this.config = pipelineConfig;
    this.metadata = {
      steps: [],
      total_cost_usd: 0,
      total_time_ms: 0,
      models_used: [],
    };
  }

  /**
   * Execute the complete pipeline
   * @param {Object} input - Input data (keyword, question, or trend)
   * @returns {Promise<Object>} Generated content with metadata
   */
  async execute(input) {
    const startTime = Date.now();

    try {
      console.log('[PipelineEngine] Starting execution', {
        pipeline: this.config.name,
        input_type: input.type,
      });

      // Step 1: Topic Selection
      const topic = await this.selectTopic(input);

      // Step 2: Content Generation
      const draft = await this.generateContent(topic);

      // Step 3: Verification (if enabled)
      const verified = await this.verifyContent(draft);

      // Step 4: Enhancements
      const enhanced = await this.enhanceContent(verified);

      // Step 5: Post-Processing
      const final = await this.postProcess(enhanced);

      // Calculate total time
      this.metadata.total_time_ms = Date.now() - startTime;

      console.log('[PipelineEngine] Execution complete', {
        pipeline: this.config.name,
        time_ms: this.metadata.total_time_ms,
        cost_usd: this.metadata.total_cost_usd,
        steps: this.metadata.steps.length,
      });

      return {
        content: final,
        metadata: this.metadata,
        pipeline_config_id: this.config.id,
      };
    } catch (error) {
      console.error('[PipelineEngine] Execution failed', error);

      // Record failed step
      this.metadata.steps.push({
        stage: 'error',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Step 1: Select topic from inputs
   * @param {Object} input - Input data
   * @returns {Promise<Object>} Selected topic
   */
  async selectTopic(input) {
    const stepStart = Date.now();
    const inputsConfig = this.config.config.inputs;

    let topic = {
      source: input.type, // 'keyword', 'question', 'trend'
      data: input,
    };

    // Determine which input source to use based on config weights
    if (input.type === 'question' && inputsConfig.topicQuestions?.enabled) {
      topic.weight = inputsConfig.topicQuestions.weight;
    } else if (input.type === 'keyword' && inputsConfig.keywords?.enabled) {
      topic.weight = inputsConfig.keywords.weight;
    } else if (input.type === 'trend' && inputsConfig.trendSweep?.enabled) {
      topic.weight = inputsConfig.trendSweep.weight;
    }

    this.metadata.steps.push({
      stage: 'topic_selection',
      status: 'completed',
      duration_ms: Date.now() - stepStart,
      data: {
        source: topic.source,
        weight: topic.weight,
      },
    });

    return topic;
  }

  /**
   * Step 2: Generate content using configured generators
   * @param {Object} topic - Selected topic
   * @returns {Promise<Object>} Draft content
   */
  async generateContent(topic) {
    const stepStart = Date.now();
    const generators = this.config.config.generators;

    // Find enabled primary generator
    const primaryGenerator = generators.find(g => g.enabled && g.role === 'primary');

    if (!primaryGenerator) {
      throw new Error('No primary generator enabled in pipeline configuration');
    }

    console.log('[PipelineEngine] Generating content', {
      generator: primaryGenerator.model,
      provider: primaryGenerator.provider,
      topic: topic.data.keyword || topic.data.question_text,
    });

    // Build generation prompt
    const prompt = this.buildGenerationPrompt(topic);

    // Invoke AI model
    const response = await InvokeLLM({
      prompt,
      provider: primaryGenerator.provider,
      model: primaryGenerator.model,
      temperature: primaryGenerator.temperature,
      max_tokens: primaryGenerator.max_tokens,
    });

    // Track cost and model usage
    if (response.usage) {
      this.metadata.total_cost_usd += response.usage.estimated_cost || 0;
      this.metadata.models_used.push({
        provider: primaryGenerator.provider,
        model: primaryGenerator.model,
        tokens: response.usage.total_tokens,
      });
    }

    this.metadata.steps.push({
      stage: 'content_generation',
      status: 'completed',
      duration_ms: Date.now() - stepStart,
      model: primaryGenerator.model,
      provider: primaryGenerator.provider,
      tokens: response.usage?.total_tokens || 0,
      cost_usd: response.usage?.estimated_cost || 0,
    });

    return {
      title: this.extractTitle(response.content),
      content: response.content,
      meta_description: this.extractMetaDescription(response.content),
      raw_response: response,
    };
  }

  /**
   * Step 3: Verify content with Perplexity (if enabled)
   * @param {Object} draft - Draft content
   * @returns {Promise<Object>} Verified content
   */
  async verifyContent(draft) {
    const stepStart = Date.now();
    const verifierConfig = this.config.config.enhancements?.perplexityFactCheck;

    if (!verifierConfig || !verifierConfig.enabled) {
      console.log('[PipelineEngine] Skipping verification (disabled)');
      return draft;
    }

    console.log('[PipelineEngine] Verifying content with Perplexity');

    try {
      const verificationPrompt = `
Review the following article for factual accuracy and provide corrections if needed:

${draft.content}

Return your response as JSON with this structure:
{
  "facts_correct": true/false,
  "corrections": ["list of corrections if any"],
  "citations": ["list of authoritative sources"],
  "confidence_score": 0-1
}
      `.trim();

      const response = await InvokeLLM({
        prompt: verificationPrompt,
        provider: 'openai', // TODO: Add Perplexity provider
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 2000,
        response_json_schema: {
          type: 'object',
          properties: {
            facts_correct: { type: 'boolean' },
            corrections: { type: 'array' },
            citations: { type: 'array' },
            confidence_score: { type: 'number' },
          },
        },
      });

      // Parse verification results
      let verification = response.content;
      if (typeof verification === 'string') {
        verification = JSON.parse(verification);
      }

      // Track cost
      if (response.usage) {
        this.metadata.total_cost_usd += response.usage.estimated_cost || 0;
      }

      this.metadata.steps.push({
        stage: 'content_verification',
        status: 'completed',
        duration_ms: Date.now() - stepStart,
        verification: verification,
        tokens: response.usage?.total_tokens || 0,
        cost_usd: response.usage?.estimated_cost || 0,
      });

      // Add verification notes to content
      if (!verification.facts_correct && verification.corrections.length > 0) {
        draft.verification_notes = verification;
      }

      return draft;
    } catch (error) {
      console.error('[PipelineEngine] Verification failed', error);

      this.metadata.steps.push({
        stage: 'content_verification',
        status: 'failed',
        duration_ms: Date.now() - stepStart,
        error: error.message,
      });

      // Continue without verification
      return draft;
    }
  }

  /**
   * Step 4: Enhance content (SEO, links, quotes, images)
   * @param {Object} verified - Verified content
   * @returns {Promise<Object>} Enhanced content
   */
  async enhanceContent(verified) {
    const stepStart = Date.now();
    const enhancements = this.config.config.enhancements;

    let enhanced = { ...verified };

    // SEO Optimization (if enabled)
    if (enhancements.seoOptimizer?.enabled) {
      console.log('[PipelineEngine] Applying SEO optimization');
      enhanced = await this.applySEO(enhanced);
    }

    // Internal Links (if enabled)
    if (enhancements.internalLinks?.enabled) {
      console.log('[PipelineEngine] Adding internal links');
      enhanced = await this.addInternalLinks(enhanced, enhancements.internalLinks);
    }

    // External Links/Citations (if enabled)
    if (enhancements.externalLinks?.enabled) {
      console.log('[PipelineEngine] Adding external citations');
      enhanced = await this.addExternalLinks(enhanced);
    }

    // Real Quotes (if enabled)
    if (enhancements.quotes?.enabled) {
      console.log('[PipelineEngine] Injecting real quotes');
      enhanced = await this.injectQuotes(enhanced, enhancements.quotes);
    }

    // Images (if enabled)
    if (enhancements.images?.enabled) {
      console.log('[PipelineEngine] Generating featured image');
      enhanced = await this.generateImage(enhanced, enhancements.images);
    }

    this.metadata.steps.push({
      stage: 'content_enhancement',
      status: 'completed',
      duration_ms: Date.now() - stepStart,
      enhancements_applied: Object.keys(enhancements).filter(k => enhancements[k]?.enabled),
    });

    return enhanced;
  }

  /**
   * Step 5: Post-process content (shortcodes, validation)
   * @param {Object} enhanced - Enhanced content
   * @returns {Promise<Object>} Final content
   */
  async postProcess(enhanced) {
    const stepStart = Date.now();
    const postProcessing = this.config.config.postProcessing;

    let final = { ...enhanced };

    // Shortcode Transform (MANDATORY)
    if (postProcessing.shortcodeTransform?.enabled) {
      console.log('[PipelineEngine] Transforming links to shortcodes');
      final = await this.transformShortcodes(final);
    }

    // Readability Check (if enabled)
    if (postProcessing.readabilityCheck?.enabled) {
      console.log('[PipelineEngine] Checking readability');
      final = await this.checkReadability(final, postProcessing.readabilityCheck);
    }

    // AI Detection Avoidance (if enabled)
    if (postProcessing.aiDetectionAvoidance?.enabled) {
      console.log('[PipelineEngine] Applying style variation');
      final = await this.varyStyle(final);
    }

    this.metadata.steps.push({
      stage: 'post_processing',
      status: 'completed',
      duration_ms: Date.now() - stepStart,
    });

    return final;
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Build generation prompt based on topic
   */
  buildGenerationPrompt(topic) {
    if (topic.source === 'question') {
      return `
Write a comprehensive, SEO-optimized article answering this question:

"${topic.data.question_text}"

Requirements:
- 1500-2500 words
- Clear H2 and H3 headings
- Answer the question thoroughly
- Include specific examples and data
- Write in an engaging, informative style
- Target audience: Higher education students and professionals

Format your response with:
# [Title]

[Lead paragraph]

## [Section 1 Heading]
[Content]

## [Section 2 Heading]
[Content]

...and so on.
      `.trim();
    } else if (topic.source === 'keyword') {
      return `
Write a comprehensive, SEO-optimized article targeting the keyword: "${topic.data.keyword}"

Requirements:
- 1500-2500 words
- Focus on the keyword naturally (no stuffing)
- Clear H2 and H3 headings
- Include specific examples and data
- Write in an engaging, informative style
- Target audience: Higher education students and professionals

Format your response with:
# [Title]

[Lead paragraph]

## [Section 1 Heading]
[Content]

## [Section 2 Heading]
[Content]

...and so on.
      `.trim();
    }

    throw new Error(`Unknown topic source: ${topic.source}`);
  }

  /**
   * Extract title from generated content
   */
  extractTitle(content) {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : 'Untitled Article';
  }

  /**
   * Extract meta description from generated content
   */
  extractMetaDescription(content) {
    // Extract first paragraph
    const paragraphMatch = content.match(/^(?!#)(.{50,155})[.!?]/m);
    if (paragraphMatch) {
      return paragraphMatch[1].trim() + '.';
    }

    // Fallback: first 155 characters
    return content.substring(0, 152).trim() + '...';
  }

  /**
   * Apply SEO optimization
   */
  async applySEO(content) {
    // TODO: Implement SEO optimization logic
    // - Keyword density check
    // - Heading hierarchy
    // - Meta description optimization
    return content;
  }

  /**
   * Add internal links with shortcodes
   */
  async addInternalLinks(content, config) {
    // TODO: Implement internal linking logic
    // - Find relevant internal pages
    // - Insert links with [ge_internal_link] shortcodes
    // - Respect minLinks/maxLinks config
    return content;
  }

  /**
   * Add external citations
   */
  async addExternalLinks(content) {
    // TODO: Implement external linking logic
    // - Add authoritative sources
    // - Use [ge_external_link] shortcodes
    return content;
  }

  /**
   * Inject real scraped quotes
   */
  async injectQuotes(content, config) {
    // TODO: Implement quote injection logic
    // - Fetch relevant quotes from database
    // - Insert at natural points in content
    // - Respect config.perArticle
    return content;
  }

  /**
   * Generate featured image
   */
  async generateImage(content, config) {
    // TODO: Implement image generation
    // - Extract topic from content
    // - Generate with configured model (gemini-2.5-flash-image)
    // - Upload to Supabase Storage
    return content;
  }

  /**
   * Transform links to GetEducated shortcodes
   */
  async transformShortcodes(content) {
    // TODO: Implement shortcode transformation
    // - Convert <a href="internal">text</a> to [ge_internal_link]
    // - Convert affiliate links to [ge_affiliate_link]
    // - Convert external links to [ge_external_link]
    return content;
  }

  /**
   * Check and improve readability
   */
  async checkReadability(content, config) {
    // TODO: Implement readability check
    // - Calculate grade level
    // - Simplify if needed
    return content;
  }

  /**
   * Vary writing style for naturalness
   */
  async varyStyle(content) {
    // TODO: Implement style variation
    // - Vary sentence length
    // - Add colloquialisms
    // - Natural transitions
    return content;
  }
}

/**
 * Get active pipeline configuration for user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Active pipeline configuration
 */
export async function getActivePipelineConfig(userId) {
  try {
    // Try to get user's active config
    let configs = await PipelineConfiguration.find({
      user_id: userId,
      is_active: true,
    }, { limit: 1 });

    if (configs.length > 0) {
      return configs[0];
    }

    // Fallback to default config
    configs = await PipelineConfiguration.find({
      is_default: true,
    }, { limit: 1 });

    if (configs.length > 0) {
      return configs[0];
    }

    throw new Error('No pipeline configuration found');
  } catch (error) {
    console.error('[getActivePipelineConfig] Error:', error);
    throw error;
  }
}

/**
 * Update pipeline performance metrics
 * @param {string} pipelineId - Pipeline configuration ID
 * @param {Object} metadata - Generation metadata
 */
export async function updatePipelineMetrics(pipelineId, metadata) {
  try {
    const config = await PipelineConfiguration.findById(pipelineId);
    if (!config) {
      throw new Error(`Pipeline configuration not found: ${pipelineId}`);
    }

    const metrics = config.performance_metrics || {};
    const totalArticles = (metrics.total_articles || 0) + 1;

    // Calculate running averages
    const avgTime = ((metrics.avg_generation_time_ms || 0) * (totalArticles - 1) + metadata.total_time_ms) / totalArticles;
    const avgCost = ((metrics.avg_cost_usd || 0) * (totalArticles - 1) + metadata.total_cost_usd) / totalArticles;

    // Update metrics
    await PipelineConfiguration.update(pipelineId, {
      performance_metrics: {
        total_articles: totalArticles,
        avg_generation_time_ms: avgTime,
        avg_cost_usd: avgCost,
        avg_manual_edits: metrics.avg_manual_edits || 0,
        avg_seo_score: metrics.avg_seo_score || 0,
        success_rate: metrics.success_rate || 1.0,
      },
      last_used_at: new Date().toISOString(),
    });

    console.log('[updatePipelineMetrics] Metrics updated', {
      pipeline_id: pipelineId,
      total_articles: totalArticles,
      avg_cost_usd: avgCost,
    });
  } catch (error) {
    console.error('[updatePipelineMetrics] Error:', error);
    // Don't throw - metrics update failure shouldn't break content generation
  }
}

/**
 * Execute pipeline for given input
 * @param {Object} input - Input data (keyword, question, or trend)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Generated content with metadata
 */
export async function executePipeline(input, userId) {
  try {
    // Get active pipeline configuration
    const pipelineConfig = await getActivePipelineConfig(userId);

    // Create pipeline engine
    const engine = new PipelineEngine(pipelineConfig);

    // Execute pipeline
    const result = await engine.execute(input);

    // Update pipeline metrics
    await updatePipelineMetrics(pipelineConfig.id, result.metadata);

    return result;
  } catch (error) {
    console.error('[executePipeline] Error:', error);
    throw error;
  }
}

export default {
  PipelineEngine,
  getActivePipelineConfig,
  updatePipelineMetrics,
  executePipeline,
};
