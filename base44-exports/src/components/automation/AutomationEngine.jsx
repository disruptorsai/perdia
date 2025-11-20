import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Background automation engine that runs continuously
 * Handles auto-post and full automation workflows
 */
export default function AutomationEngine() {
  const queryClient = useQueryClient();

  const { data: settings = [] } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => base44.entities.SystemSetting.list(),
  });

  const { data: articles = [] } = useQuery({
    queryKey: ['articles-for-automation'],
    queryFn: () => base44.entities.Article.list('-updated_date', 200),
    refetchInterval: 60000, // Check every minute
  });

  const { data: ideas = [] } = useQuery({
    queryKey: ['ideas-for-automation'],
    queryFn: () => base44.entities.ContentIdea.filter({ status: 'approved' }),
    refetchInterval: 120000, // Check every 2 minutes
  });

  const { data: existingArticles = [] } = useQuery({
    queryKey: ['all-articles-for-duplicate-check'],
    queryFn: () => base44.entities.Article.list('-created_date', 500),
  });

  const { data: existingIdeas = [] } = useQuery({
    queryKey: ['all-ideas-for-duplicate-check'],
    queryFn: () => base44.entities.ContentIdea.list('-created_date', 200),
  });

  const updateArticleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Article.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles-for-automation'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const createArticleMutation = useMutation({
    mutationFn: (data) => base44.entities.Article.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles-for-automation'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const generateIdeasMutation = useMutation({
    mutationFn: async () => {
      const topPerformers = existingArticles
        .filter(a => a.views && a.views > 0)
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 10);

      const existingTopics = [
        ...existingArticles.map(a => a.title),
        ...existingIdeas.map(i => i.title)
      ];

      const coveredKeywords = [
        ...existingArticles.flatMap(a => a.target_keywords || []),
        ...existingIdeas.flatMap(i => i.keywords || [])
      ];

      const topPerformersText = topPerformers.length > 0 
        ? `\n\nTOP PERFORMING ARTICLES (learn from these):
${topPerformers.map((a, i) => `${i + 1}. "${a.title}" - ${a.views} views, Type: ${a.type}`).join('\n')}`
        : '';

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });
      
      const prompt = `Generate 5 trending, highly relevant article ideas for GetEducated.com, an education and career guidance website.

IMPORTANT - CURRENT DATE CONTEXT:
- Current year: ${currentYear}
- Current month: ${currentMonth} ${currentYear}
- Focus on CURRENT and UPCOMING trends (${currentYear} and ${currentYear + 1})
- DO NOT reference past years like 2023 or 2024 in titles
- Use "Latest", "Current", "This Year", or ${currentYear} when appropriate

${topPerformersText}

CRITICAL - AVOID DUPLICATE TOPICS:
We already have ${existingTopics.length} articles/ideas. DO NOT suggest topics similar to:
${existingTopics.slice(0, 30).map(t => `- ${t}`).join('\n')}

COVERED KEYWORDS:
${coveredKeywords.slice(0, 50).join(', ')}

For each NEW and UNIQUE idea, provide:
1. A compelling, SEO-friendly article title
2. A brief description
3. Target audience
4. Priority level (high/medium/low)
5. Suggested content type (ranking, career_guide, listicle, guide, or faq)

Return as JSON array with this structure:
{
  "ideas": [
    {
      "title": "Article title",
      "description": "Brief description",
      "target_audience": "Who this is for",
      "priority": "high/medium/low",
      "content_type": "ranking/career_guide/listicle/guide/faq",
      "keywords": ["keyword1", "keyword2"]
    }
  ]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            ideas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  target_audience: { type: "string" },
                  priority: { type: "string" },
                  content_type: { type: "string" },
                  keywords: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      const ideasToSave = (result.ideas || []).map(idea => ({
        title: idea.title,
        description: idea.description,
        source: "automated",
        keywords: idea.keywords || [],
        content_type: idea.content_type || "guide",
        priority: idea.priority || "medium",
        status: "approved",
        notes: `Target: ${idea.target_audience}`
      }));

      await base44.entities.ContentIdea.bulkCreate(ideasToSave);
      queryClient.invalidateQueries({ queryKey: ['ideas-for-automation'] });
    },
  });

  const { data: verifiedSiteArticles = [] } = useQuery({
    queryKey: ['verified-site-articles-automation'],
    queryFn: () => base44.entities.SiteArticle.filter({ is_active: true }),
  });

  const generateArticleMutation = useMutation({
    mutationFn: async (idea) => {
      const currentYear = new Date().getFullYear();
      
      const linkingContext = verifiedSiteArticles.slice(0, 25).map(a => 
        `"${a.title}" - ${a.url}`
      ).join('\n');
      
      const prompt = `Create a comprehensive ${idea.content_type} article for GetEducated.com.

Title: ${idea.title}
Description: ${idea.description}
Target Keywords: ${idea.keywords?.join(', ')}

CRITICAL - DATE CONTEXT:
- Current year: ${currentYear}
- Use CURRENT data and statistics (${currentYear})
- DO NOT use outdated years like 2023 or 2024
- Reference "latest", "current", or ${currentYear} data

CRITICAL - WORD COUNT REQUIREMENT:
- Article MUST be 2000-3000 words minimum
- This is a HARD requirement - do not generate shorter content
- Count carefully and ensure you meet this target
- Write detailed, comprehensive content - not filler

CRITICAL - INTERNAL LINKING RULES:
You MUST ONLY link to these VERIFIED GetEducated.com articles:
${linkingContext}

STRICT REQUIREMENTS FOR INTERNAL LINKS:
- ONLY use URLs from the list above
- DO NOT create fictional GetEducated.com URLs
- DO NOT guess or make up article URLs  
- Add 2-3 relevant internal links naturally in content

Write a complete, SEO-optimized article with:
- Engaging introduction (200-300 words)
- 5-7 well-structured sections with H2/H3 headings (use id attributes)
- Each section should be 300-500 words with detailed information
- 2-3 internal links to VERIFIED articles from the list above
- External citations to authoritative sources (BLS, NCES, .edu, .gov) with current ${currentYear} data
- Natural keyword integration
- Clear, actionable content with specific examples
- Compelling conclusion (150-200 words)

Return as JSON:
{
  "title": "Final title",
  "content": "Full HTML content",
  "excerpt": "Brief summary (150 chars)",
  "target_keywords": ["keyword1", "keyword2"],
  "word_count": 2500
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            excerpt: { type: "string" },
            target_keywords: { type: "array", items: { type: "string" } },
            word_count: { type: "number" }
          }
        }
      });

      const article = await base44.entities.Article.create({
        title: result.title || idea.title,
        content: result.content,
        excerpt: result.excerpt,
        type: idea.content_type,
        status: 'draft',
        target_keywords: result.target_keywords || idea.keywords,
        word_count: result.word_count || 0,
        cluster_id: idea.cluster_id,
      });

      await base44.entities.ContentIdea.update(idea.id, { 
        status: 'completed',
        article_id: article.id 
      });

      return article;
    },
  });

  // Get settings
  const getSettingValue = (key, defaultValue) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting ? setting.setting_value : defaultValue;
  };

  const automationLevel = getSettingValue('automation_level', 'manual');
  const autoPostEnabled = getSettingValue('auto_post_enabled', 'false') === 'true';
  const autoPostDays = parseInt(getSettingValue('auto_post_days', '5'));

  // Auto-post logic
  useEffect(() => {
    if (!autoPostEnabled) return;

    const approvedArticles = articles.filter(a => a.status === 'approved');
    
    approvedArticles.forEach(article => {
      const daysSinceApproved = article.updated_date 
        ? (Date.now() - new Date(article.updated_date).getTime()) / (1000 * 60 * 60 * 24)
        : 0;

      if (daysSinceApproved >= autoPostDays) {
        // Auto-publish this article
        updateArticleMutation.mutate({
          id: article.id,
          data: { status: 'published', publish_at: new Date().toISOString() }
        });
      }
    });
  }, [articles, autoPostEnabled, autoPostDays]);

  // Full automation logic
  useEffect(() => {
    if (automationLevel !== 'full_auto') return;

    // Generate ideas if queue is low
    if (ideas.length < 3) {
      generateIdeasMutation.mutate();
    }

    // Auto-generate articles from approved ideas
    const ideasToGenerate = ideas.slice(0, 2); // Generate 2 at a time
    ideasToGenerate.forEach(idea => {
      const alreadyGenerated = articles.some(a => 
        a.title.toLowerCase().includes(idea.title.toLowerCase().substring(0, 20))
      );
      
      if (!alreadyGenerated) {
        generateArticleMutation.mutate(idea);
      }
    });

    // Auto-approve high-quality drafts
    const draftsToReview = articles.filter(a => a.status === 'draft' && a.word_count > 1500);
    draftsToReview.forEach(article => {
      // Simple quality check
      const hasContent = article.content && article.content.length > 5000;
      const hasKeywords = article.target_keywords && article.target_keywords.length > 0;
      
      if (hasContent && hasKeywords) {
        updateArticleMutation.mutate({
          id: article.id,
          data: { status: 'approved', auto_publish_at: new Date(Date.now() + autoPostDays * 24 * 60 * 60 * 1000).toISOString() }
        });
      }
    });
  }, [automationLevel, ideas, articles]);

  // This component doesn't render anything
  return null;
}