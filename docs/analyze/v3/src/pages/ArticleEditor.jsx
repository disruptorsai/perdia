import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  Save, 
  Sparkles, 
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";

import QualityChecklist from "../components/article/QualityChecklist";
import SchemaGenerator from "../components/article/SchemaGenerator";
import LinkComplianceChecker from "../components/article/LinkComplianceChecker";
import ArticleNavigationGenerator from "../components/article/ArticleNavigationGenerator";
import BLSCitationHelper from "../components/article/BLSCitationHelper";

export default function ArticleEditor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id');

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    type: 'guide',
    status: 'draft'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [qualityStatus, setQualityStatus] = useState({
    canPublish: false,
    score: 0,
    checks: {}
  });

  const { data: article } = useQuery({
    queryKey: ['article', articleId],
    queryFn: () => articleId ? base44.entities.Article.filter({ id: articleId }).then(r => r[0]) : null,
    enabled: !!articleId
  });

  const { data: clusters = [] } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => base44.entities.Cluster.list(),
  });

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || '',
        excerpt: article.excerpt || '',
        content: article.content || '',
        type: article.type || 'guide',
        status: article.status || 'draft',
        cluster_id: article.cluster_id || ''
      });
    }
  }, [article]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (articleId) {
        return base44.entities.Article.update(articleId, data);
      }
      return base44.entities.Article.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const generateContentMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Write a comprehensive, SEO-optimized article about "${formData.title}".
      
      Requirements:
      - Create engaging, informative content
      - Include proper headings and structure
      - Add relevant facts and data points
      - Make it at least 800 words
      - Use professional tone appropriate for GetEducated audience
      - Focus on education-related content
      - Include H2 headings with descriptive IDs
      - Add internal links to related content
      - Cite Bureau of Labor Statistics data where relevant
      
      Format the response in HTML with proper tags.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      return result;
    },
    onSuccess: (content) => {
      setFormData(prev => ({ ...prev, content }));
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
    }
  });

  const handleSave = () => {
    const wordCount = formData.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    saveMutation.mutate({
      ...formData,
      word_count: wordCount
    });
  };

  const handleGenerate = () => {
    if (!formData.title) {
      alert('Please enter a title first');
      return;
    }
    setIsGenerating(true);
    generateContentMutation.mutate();
  };

  const handleSubmitForReview = () => {
    if (!qualityStatus.canPublish) {
      alert('Cannot submit for review. Please fix critical issues first.');
      return;
    }

    const wordCount = formData.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    saveMutation.mutate({
      ...formData,
      status: 'in_review',
      word_count: wordCount
    });
  };

  const handlePublish = () => {
    if (!qualityStatus.canPublish) {
      alert('Cannot publish. Critical issues detected:\n\n' +
            '• All monetization links must be wrapped in shortcodes\n' +
            '• Article must meet minimum word count (800 words)\n\n' +
            'Please fix these issues before publishing.');
      return;
    }

    if (qualityStatus.score < 60) {
      const proceed = confirm(
        `Quality score is ${qualityStatus.score.toFixed(0)}%.\n\n` +
        'Recommended improvements:\n' +
        '• Add more internal links (5+ required)\n' +
        '• Add external citations\n' +
        '• Include BLS data citations\n' +
        '• Add schema markup\n\n' +
        'Publish anyway?'
      );
      if (!proceed) return;
    }

    const wordCount = formData.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    saveMutation.mutate({
      ...formData,
      status: 'published',
      word_count: wordCount
    });
  };

  const handleSchemaUpdate = (faqs, schemas) => {
    setFormData(prev => ({ ...prev, faqs }));
    handleSave();
  };

  const handleNavigationGenerated = (navHtml) => {
    setFormData(prev => ({
      ...prev,
      content: navHtml + '\n\n' + prev.content
    }));
  };

  const handleInsertBLSCitation = (citation) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content + '\n\n' + citation
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate(createPageUrl('ContentLibrary'))}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                {articleId ? 'Edit Article' : 'New Article'}
              </h1>
              <p className="text-gray-600 mt-1">
                {articleId ? 'Make changes to your article' : 'Create AI-assisted content'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </Button>
            {formData.status !== 'published' && (
              <>
                <Button 
                  onClick={handleSubmitForReview}
                  disabled={saveMutation.isPending || !qualityStatus.canPublish}
                  className="bg-amber-600 hover:bg-amber-700 gap-2"
                >
                  <Send className="w-4 h-4" />
                  Submit for Review
                </Button>
                <Button 
                  onClick={handlePublish}
                  disabled={saveMutation.isPending || !qualityStatus.canPublish}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Publish Now
                </Button>
              </>
            )}
          </div>
        </motion.div>

        {/* Quality Alert */}
        {!qualityStatus.canPublish && formData.content && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">Cannot Publish - Critical Issues Detected</p>
                <p className="text-sm text-red-700 mt-1">
                  Publishing is blocked until critical quality issues are resolved. Check the Quality Checklist below.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Article Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter article title..."
                    className="text-lg"
                  />
                </div>

                <div>
                  <Label>Excerpt / Dek</Label>
                  <Textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Brief description of the article..."
                    rows={2}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Content</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate}
                      disabled={isGenerating || !formData.title}
                      className="gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {isGenerating ? 'Generating...' : 'Generate with AI'}
                    </Button>
                  </div>
                  <ReactQuill
                    value={formData.content}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                    placeholder="Write or generate your content..."
                    className="bg-white"
                    style={{ height: '500px', marginBottom: '60px' }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Quality Tools */}
          <div className="space-y-6">
            {/* Settings */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Content Type</Label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-2 border rounded-lg mt-1"
                  >
                    <option value="degree_page">Degree Page</option>
                    <option value="listicle">Listicle</option>
                    <option value="guide">Guide</option>
                    <option value="faq">FAQ</option>
                    <option value="ranking">Ranking</option>
                  </select>
                </div>

                <div>
                  <Label>Topic Cluster</Label>
                  <select
                    value={formData.cluster_id || ''}
                    onChange={(e) => setFormData({ ...formData, cluster_id: e.target.value })}
                    className="w-full p-2 border rounded-lg mt-1"
                  >
                    <option value="">None</option>
                    {clusters.map(cluster => (
                      <option key={cluster.id} value={cluster.id}>
                        {cluster.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Badge variant="outline" className="w-full justify-center py-2 capitalize">
                    {formData.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quality Checklist */}
            <QualityChecklist
              article={article}
              content={formData.content}
              onQualityChange={setQualityStatus}
            />

            {/* Schema Generator */}
            <SchemaGenerator
              article={{ ...article, ...formData }}
              onSchemaUpdate={handleSchemaUpdate}
            />

            {/* Link Compliance */}
            <LinkComplianceChecker
              content={formData.content}
              onComplianceChange={(isCompliant) => {
                console.log('Link compliance:', isCompliant);
              }}
            />

            {/* Article Navigation */}
            <ArticleNavigationGenerator
              content={formData.content}
              onNavigationGenerated={handleNavigationGenerated}
            />

            {/* BLS Citation Helper */}
            <BLSCitationHelper
              onInsertCitation={handleInsertBLSCitation}
            />
          </div>
        </div>
      </div>
    </div>
  );
}