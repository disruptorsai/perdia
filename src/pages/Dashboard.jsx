/**
 * PERDIA EDUCATION - DASHBOARD
 * Article Pipeline with Kanban workflow (v3 style)
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { TrendingUp, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { Article, ContentIdea, SystemSetting } from "@/lib/perdia-sdk";
import KanbanBoard from "@/components/workflow/KanbanBoard";
import SourceSelector from "@/components/workflow/SourceSelector";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [generatingIdeas, setGeneratingIdeas] = useState({});
  const [showSourceSelector, setShowSourceSelector] = useState(false);

  // Fetch articles
  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ['workflow-articles'],
    queryFn: async () => {
      const data = await Article.find({}, {
        orderBy: { column: 'created_date', ascending: false },
        limit: 100
      });
      return data;
    },
  });

  // Fetch approved content ideas
  const { data: ideas = [], isLoading: ideasLoading } = useQuery({
    queryKey: ['workflow-ideas'],
    queryFn: async () => {
      const data = await ContentIdea.find(
        { status: 'approved' },
        { orderBy: { column: 'priority', ascending: false }, limit: 50 }
      );
      return data;
    },
  });

  // Fetch system settings
  const { data: settings = [] } = useQuery({
    queryKey: ['system-settings-dashboard'],
    queryFn: async () => {
      const data = await SystemSetting.find({});
      return data;
    },
  });

  // Update article status mutation
  const updateArticleStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await Article.update(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-articles'] });
      toast.success('Article status updated');
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    }
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
      updateGenerationStep(idea.id, 'Starting article generation...', 'idea_queue');

      // Simulate generation steps (in real implementation, this would call the AI pipeline)
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateGenerationStep(idea.id, 'Analyzing content type...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Determine content type
      const ideaText = (idea.title + ' ' + (idea.description || '')).toLowerCase();
      let contentType = 'guide';
      if (ideaText.includes('top ') || ideaText.includes('best ') || /\d+/.test(ideaText)) {
        contentType = 'listicle';
      } else if (ideaText.includes('career') || ideaText.includes('job')) {
        contentType = 'career_guide';
      } else if (ideaText.includes('degree') || ideaText.includes('program')) {
        contentType = 'ranking';
      }

      updateGenerationStep(idea.id, `Content type: ${contentType.replace(/_/g, ' ')}`, 'generated');
      await new Promise(resolve => setTimeout(resolve, 1000));

      updateGenerationStep(idea.id, 'Generating content...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create article (simplified - in real implementation would use AI)
      const newArticle = await Article.create({
        title: idea.title,
        excerpt: idea.description || '',
        content: `<p>Content for: ${idea.title}</p>`,
        type: contentType,
        status: 'in_review',
        target_keywords: idea.keywords || [],
        word_count: 0,
        source_idea_id: idea.id
      });

      // Mark idea as completed
      await ContentIdea.update(idea.id, {
        status: 'completed',
        article_id: newArticle.id
      });

      updateGenerationStep(idea.id, 'Article created!', 'reviewed');
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

      toast.success('Article generated successfully!');

    } catch (error) {
      console.error('Generation error:', error);
      updateGenerationStep(idea.id, `Error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      setGeneratingIdeas(prev => {
        const updated = { ...prev };
        delete updated[idea.id];
        return updated;
      });
      toast.error('Failed to generate article');
    }
  };

  const isLoading = articlesLoading || ideasLoading;

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
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/article-wizard')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 gap-2 shadow-lg"
              size="lg"
            >
              <Plus className="w-5 h-5" />
              New Article
            </Button>
            <Button
              onClick={() => setShowSourceSelector(true)}
              variant="outline"
              className="gap-2"
              size="lg"
            >
              <TrendingUp className="w-5 h-5" />
              Find Ideas
            </Button>
          </div>
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-4"
        >
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <p className="text-sm text-gray-500">Ideas in Queue</p>
            <p className="text-2xl font-bold text-blue-600">{ideas.length}</p>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <p className="text-sm text-gray-500">Drafts</p>
            <p className="text-2xl font-bold text-sky-600">
              {articles.filter(a => a.status === 'draft').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <p className="text-sm text-gray-500">In Review</p>
            <p className="text-2xl font-bold text-indigo-600">
              {articles.filter(a => a.status === 'in_review').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">
              {articles.filter(a => a.status === 'approved').length}
            </p>
          </div>
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
              onComplete={() => {
                setShowSourceSelector(false);
                queryClient.invalidateQueries({ queryKey: ['workflow-ideas'] });
                toast.success('Ideas added to queue!');
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
