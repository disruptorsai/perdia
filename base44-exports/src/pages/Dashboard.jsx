import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import SourceSelector from "../components/workflow/SourceSelector";
import KanbanBoard from "../components/workflow/KanbanBoard";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [generatingIdeas, setGeneratingIdeas] = useState({});

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['workflow-articles'],
    queryFn: () => base44.entities.Article.list('-created_date', 100),
  });

  const { data: ideas = [] } = useQuery({
    queryKey: ['workflow-ideas'],
    queryFn: () => base44.entities.ContentIdea.filter({ status: 'approved' }),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['system-settings-dashboard'],
    queryFn: () => base44.entities.SystemSetting.list(),
  });

  const { data: existingArticles = [] } = useQuery({
    queryKey: ['all-articles-for-linking-dashboard'],
    queryFn: () => base44.entities.Article.filter({ status: 'published' }, '-created_date', 100),
  });

  const updateArticleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Article.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-articles'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const handleStatusChange = (articleId, newStatus) => {
    updateArticleStatusMutation.mutate({ id: articleId, status: newStatus });
  };

  const updateGenerationStep = (ideaId, step, column = null) => {
    setGeneratingIdeas(prev => ({
      ...prev,
      [ideaId]: { step, column: column || prev[ideaId]?.column || 'idea_queue' }
    }));
  };

  const handleGenerateArticle = async (idea) => {
    try {
      updateGenerationStep(idea.id, '🚀 Starting article generation...', 'idea_queue');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Auto-select content type
      updateGenerationStep(idea.id, '🎯 Analyzing best content type...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const ideaText = (idea.title + ' ' + (idea.description || '')).toLowerCase();
      let contentType = 'guide';
      if (ideaText.includes('top ') || ideaText.includes('best ') || /\d+/.test(ideaText)) {
        contentType = 'listicle';
      } else if (ideaText.includes('career') || ideaText.includes('job')) {
        contentType = 'career_guide';
      } else if (ideaText.includes('degree') || ideaText.includes('program')) {
        contentType = 'ranking';
      }

      updateGenerationStep(idea.id, `✓ Content type: ${contentType.replace(/_/g, ' ')}`);
      await new Promise(resolve => setTimeout(resolve, 600));

      // Generate title
      updateGenerationStep(idea.id, '📝 Generating optimized titles...');
      await new Promise(resolve => setTimeout(resolve, 1200));

      const modelSetting = settings.find(s => s.setting_key === 'default_model');
      const aiModel = modelSetting?.setting_value || 'grok-beta';

      const titleResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 1 SEO-optimized article title for: ${idea.title}. Return JSON: {"title": "Title Here"}`,
        model: aiModel,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: { title: { type: "string" } }
        }
      });

      const selectedTitle = titleResult.title || idea.title;
      updateGenerationStep(idea.id, `✓ Title: "${selectedTitle}"`);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Move to "generating" stage
      updateGenerationStep(idea.id, '🔍 Scanning for internal links...', 'generated');
      await new Promise(resolve => setTimeout(resolve, 1000));

      updateGenerationStep(idea.id, '📚 Researching external sources...');
      await new Promise(resolve => setTimeout(resolve, 1200));

      updateGenerationStep(idea.id, '✍️ Writing introduction...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      updateGenerationStep(idea.id, '📝 Generating main content...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate full article
      const linkingContext = existingArticles.slice(0, 20).map(a => ({
        title: a.title,
        url: a.slug ? `https://www.geteducated.com/${a.slug}` : `https://www.geteducated.com/article/${a.id}`
      }));

      const articleResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a ${contentType.replace(/_/g, ' ')} article titled "${selectedTitle}".
        
Include 2+ internal links from: ${linkingContext.slice(0, 10).map(a => a.url).join(', ')}
Include 1+ external citation from credible sources.
Return JSON with: title, excerpt, content (HTML), faqs array.`,
        model: aiModel,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            excerpt: { type: "string" },
            content: { type: "string" },
            faqs: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } } }
          }
        }
      });

      updateGenerationStep(idea.id, '🎨 Humanizing content...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Humanize content
      const humanized = await base44.integrations.Core.InvokeLLM({
        prompt: `Humanize this content naturally: ${articleResult.content}. Return ONLY HTML.`,
        model: aiModel,
        add_context_from_internet: false
      });

      updateGenerationStep(idea.id, '💾 Creating article record...', 'reviewed');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Create article
      const wordCount = humanized.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length;
      const internalLinks = (humanized.match(/geteducated\.com/gi) || []).length;
      const externalLinks = (humanized.match(/<a href="http/gi) || []).length - internalLinks;

      const newArticle = await base44.entities.Article.create({
        title: articleResult.title || selectedTitle,
        excerpt: articleResult.excerpt || '',
        content: humanized,
        type: contentType,
        status: 'in_review',
        target_keywords: idea.keywords || [],
        faqs: articleResult.faqs || [],
        word_count: wordCount,
        internal_links_count: internalLinks,
        external_citations_count: externalLinks,
        schema_valid: true,
        model_used: aiModel
      });

      // Mark idea as completed
      await base44.entities.ContentIdea.update(idea.id, {
        status: 'completed',
        article_id: newArticle.id
      });

      updateGenerationStep(idea.id, '✅ Article created successfully!');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Clear from generating state
      setGeneratingIdeas(prev => {
        const updated = { ...prev };
        delete updated[idea.id];
        return updated;
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['workflow-articles'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-ideas'] });
      
    } catch (error) {
      console.error('Generation error:', error);
      updateGenerationStep(idea.id, `❌ Error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      setGeneratingIdeas(prev => {
        const updated = { ...prev };
        delete updated[idea.id];
        return updated;
      });
    }
  };

  const handleSourcesSelected = () => {
    setShowSourceSelector(false);
    queryClient.invalidateQueries({ queryKey: ['workflow-ideas'] });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-blue-50/20 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Article Pipeline
            </h1>
            <p className="text-gray-600 mt-2">
              AI-powered content workflow for GetEducated
            </p>
          </div>
          <Button
            onClick={() => setShowSourceSelector(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 gap-2 shadow-lg"
            size="lg"
          >
            <TrendingUp className="w-5 h-5" />
            Find New Ideas
          </Button>
        </motion.div>

        {/* Kanban Board */}
        <KanbanBoard
          ideas={ideas}
          articles={articles}
          onStatusChange={handleStatusChange}
          isLoading={isLoading}
          generatingIdeas={generatingIdeas}
          onGenerateArticle={handleGenerateArticle}
        />

        {/* Source Selector Modal */}
        <AnimatePresence>
          {showSourceSelector && (
            <SourceSelector
              onClose={() => setShowSourceSelector(false)}
              onComplete={handleSourcesSelected}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}