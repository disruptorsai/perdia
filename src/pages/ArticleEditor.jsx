import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Save,
  Sparkles,
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle2,
  Wand2,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Article, Cluster, SystemSetting, SiteArticle, InvokeLLM } from "@/lib/perdia-sdk";

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
    status: 'draft',
    faqs: []
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [autoFixSteps, setAutoFixSteps] = useState([]);
  const [qualityStatus, setQualityStatus] = useState({
    canPublish: false,
    score: 0,
    checks: {}
  });

  const { data: article, isLoading: articleLoading } = useQuery({
    queryKey: ['article', articleId],
    queryFn: async () => {
      if (!articleId) return null;
      const articles = await Article.find({ id: articleId });
      return articles[0] || null;
    },
    enabled: !!articleId
  });

  const { data: clusters = [] } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => Cluster.find({}),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['system-settings-editor'],
    queryFn: () => SystemSetting.find({}),
  });

  const { data: publishedArticles = [] } = useQuery({
    queryKey: ['published-articles-linking'],
    queryFn: async () => {
      const articles = await Article.find({ status: 'published' }, {
        orderBy: { column: 'created_date', ascending: false },
        limit: 50
      });
      return articles;
    },
  });

  const { data: verifiedSiteArticles = [] } = useQuery({
    queryKey: ['verified-site-articles'],
    queryFn: async () => {
      const articles = await SiteArticle.find({ is_active: true });
      return articles;
    },
  });

  useEffect(() => {
    if (article) {
      console.log('📄 Loading article data:', article);
      setFormData({
        title: article.title || '',
        excerpt: article.excerpt || '',
        content: article.content || '',
        type: article.type || 'guide',
        status: article.status || 'draft',
        cluster_id: article.cluster_id || '',
        faqs: article.faqs || []
      });
    }
  }, [article]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (articleId) {
        return Article.update(articleId, data);
      }
      return Article.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article'] });
      alert('Article saved successfully!');
    },
  });

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handlePublish = () => {
    if (!qualityStatus.canPublish) {
      alert('Cannot publish: Article does not meet quality requirements. Check the Quality Checklist.');
      return;
    }

    if (confirm('Publish this article now?')) {
      saveMutation.mutate({
        ...formData,
        status: 'published',
        published_date: new Date().toISOString()
      });
      navigate('/content');
    }
  };

  // Helper function to generate H2 IDs
  const addH2Ids = (content) => {
    const usedIds = new Set();
    return content.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (match, attributes, headingText) => {
      if (/id\s*=\s*["'][^"']+["']/i.test(attributes)) {
        return match;
      }
      let baseId = headingText.toLowerCase().replace(/<[^>]*>/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 50);
      let id = baseId;
      let counter = 1;
      while (usedIds.has(id)) {
        id = `${baseId}-${counter}`;
        counter++;
      }
      usedIds.add(id);
      const newAttributes = attributes.trim() ? `${attributes} id="${id}"` : `id="${id}"`;
      return `<h2 ${newAttributes}>${headingText}</h2>`;
    });
  };

  // Helper function to calculate quality metrics
  const calculateQualityMetrics = (content, faqs) => {
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length;
    const internalLinks = (content.match(/geteducated\.com/gi) || []).length;
    const externalLinks = (content.match(/<a href="http/gi) || []).length - internalLinks;
    const h2Matches = content.match(/<h2[^>]*>/gi) || [];
    const h2WithIds = h2Matches.filter(tag => /id\s*=\s*["'][^"']+["']/i.test(tag));
    const hasFAQs = faqs && faqs.length >= 3;

    return {
      wordCount,
      internalLinks,
      externalLinks,
      h2Count: h2Matches.length,
      h2WithIds: h2WithIds.length,
      hasFAQs,
      issues: [
        wordCount < 800 && 'content_length',
        internalLinks < 2 && 'internal_links',
        externalLinks < 1 && 'external_links',
        h2WithIds.length < h2Matches.length && 'h2_ids',
        !hasFAQs && 'faqs'
      ].filter(Boolean)
    };
  };

  const handleAutoFix = async () => {
    setIsAutoFixing(true);
    setAutoFixSteps([]);

    const steps = [];
    const addStep = (message) => {
      steps.push({
        timestamp: new Date().toLocaleTimeString(),
        message
      });
      setAutoFixSteps([...steps]);
    };

    try {
      addStep('🔍 Analyzing article quality...');
      await delay(600);

      // Initial quality check
      const initialMetrics = calculateQualityMetrics(formData.content, formData.faqs);

      addStep(`📊 Current: ${initialMetrics.wordCount} words, ${initialMetrics.internalLinks} internal links, ${initialMetrics.externalLinks} external links`);

      if (initialMetrics.issues.length === 0) {
        addStep('✓ Article already meets all quality standards!');
        await delay(1000);
        setIsAutoFixing(false);
        return;
      }

      addStep(`📋 Found ${initialMetrics.issues.length} issue(s): ${initialMetrics.issues.join(', ')}`);
      await delay(400);

      const linkingContext = verifiedSiteArticles.slice(0, 20).map(a => ({
        title: a.title,
        url: a.url,
        excerpt: a.excerpt || '',
        topics: a.topics?.join(', ') || ''
      }));

      const currentYear = new Date().getFullYear();
      const modelSetting = settings.find(s => s.setting_key === 'default_model');
      const aiModel = modelSetting?.setting_value || 'grok-beta';

      let currentContent = formData.content;
      let currentFaqs = formData.faqs || [];
      let attempt = 0;
      const maxAttempts = 2;

      // Retry loop
      while (attempt < maxAttempts) {
        attempt++;
        const metrics = calculateQualityMetrics(currentContent, currentFaqs);

        if (metrics.issues.length === 0) {
          addStep('✓ All issues resolved!');
          break;
        }

        addStep(`🔄 Attempt ${attempt}/${maxAttempts}: Fixing ${metrics.issues.length} remaining issue(s)`);
        await delay(400);

        const wordsToAdd = Math.max(850 - metrics.wordCount, 0);
        const linksToAdd = Math.max(2 - metrics.internalLinks, 0);
        const externalLinksToAdd = Math.max(1 - metrics.externalLinks, 0);

        const prompt = `You are improving an article for GetEducated.com.

CURRENT ARTICLE TITLE: ${formData.title}
CURRENT WORD COUNT: ${metrics.wordCount} words (TARGET: 850+)
CURRENT INTERNAL LINKS: ${metrics.internalLinks} (TARGET: 2+)
CURRENT EXTERNAL LINKS: ${metrics.externalLinks} (TARGET: 1+)

YOUR TASK - FIX ALL ISSUES:
${metrics.issues.includes('content_length') ? `1. EXPAND to 850+ words by adding ${wordsToAdd}+ words\n   - Add new substantial sections like "Why This Matters in ${currentYear}", "Expert Tips", "Common Mistakes"\n   - Expand existing sections with more details, examples, and context\n` : ''}
${metrics.issues.includes('internal_links') ? `2. ADD ${linksToAdd} internal GetEducated.com link(s)\n   - AVAILABLE LINKS:\n${linkingContext.slice(0, 10).map((a, i) => `     ${i + 1}. ${a.url} - ${a.title}`).join('\n')}\n   - Use ONLY URLs from above, format: <a href="URL">anchor text</a>\n` : ''}
${metrics.issues.includes('external_links') ? `3. ADD ${externalLinksToAdd} authoritative external citation(s)\n   - Find ${currentYear} data from BLS.gov, NCES.ed.gov, .gov, .edu domains\n   - Format: <a href="URL" target="_blank" rel="noopener">Source Name (${currentYear})</a>\n` : ''}

EXISTING ARTICLE CONTENT:
${currentContent}

${attempt > 1 ? '\n⚠️ CRITICAL: Previous attempt failed to meet all requirements. Be MORE AGGRESSIVE with additions.\n' : ''}

STRICT OUTPUT REQUIREMENT: Return ONLY the complete HTML article content. NO explanations, NO meta-commentary.`;

        addStep('✨ AI is improving content...');
        await delay(800);

        const improvedContent = await InvokeLLM({
          prompt,
          provider: 'xai',
          model: aiModel,
          temperature: 0.7,
          max_tokens: 8000
        });

        currentContent = improvedContent
          .replace(/^```html\s*/gi, '')
          .replace(/^```\s*/gi, '')
          .replace(/\s*```$/gi, '')
          .replace(/^Here'?s? (?:a|the).*?version.*?:?\s*/gi, '')
          .replace(/^I'?ve.*?\.\s*/gi, '')
          .replace(/^Below is.*?:?\s*/gi, '')
          .trim();

        addStep('✓ Content improved');

        // Generate FAQs if needed (only on first attempt)
        if (attempt === 1 && metrics.issues.includes('faqs')) {
          addStep('❓ Generating FAQ schema...');
          await delay(800);

          const faqPrompt = `Generate 5-7 relevant, specific FAQs for this article: "${formData.title}".

Return ONLY this JSON structure:
{
  "faqs": [
    {"question": "Specific question?", "answer": "Detailed answer with facts"}
  ]
}`;

          const faqResult = await InvokeLLM({
            prompt: faqPrompt,
            provider: 'claude',
            model: 'claude-haiku-4-5-20251001',
            temperature: 0.7,
            max_tokens: 2000,
            response_json_schema: {
              type: "object",
              properties: {
                faqs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      answer: { type: "string" }
                    }
                  }
                }
              }
            }
          });

          currentFaqs = faqResult.faqs || [];
          addStep(`✓ Added ${currentFaqs.length} FAQs`);
        }

        // Re-validate
        const newMetrics = calculateQualityMetrics(currentContent, currentFaqs);
        addStep(`📊 After fix: ${newMetrics.wordCount} words, ${newMetrics.internalLinks} internal, ${newMetrics.externalLinks} external`);

        if (newMetrics.issues.length === 0) {
          addStep('✓ All requirements met!');
          break;
        } else if (attempt < maxAttempts) {
          addStep(`⚠️ ${newMetrics.issues.length} issue(s) remain, retrying...`);
          await delay(600);
        }
      }

      // Add H2 IDs
      addStep('🔗 Adding navigation IDs to H2 headings...');
      await delay(400);
      currentContent = addH2Ids(currentContent);
      addStep('✓ H2 IDs added');

      // Final humanization
      addStep('🎨 Applying final humanization pass...');
      await delay(600);

      const humanizationPrompt = `Humanize this educational article to sound naturally written by an experienced journalist.

ARTICLE:
${currentContent}

HUMANIZATION RULES:
1. SENTENCE VARIETY: Mix short punchy sentences (5-8 words) with longer complex ones (20-30 words)
2. CONVERSATIONAL TONE: Add contractions ("don't", "won't"), rhetorical questions, direct address ("you")
3. NATURAL IMPERFECTIONS: Start some sentences with "And" or "But", use em dashes for emphasis
4. REMOVE AI PATTERNS: Eliminate "Furthermore", "Moreover", "In conclusion", "It's worth noting"
5. ADD PERSONALITY: Use specific examples, industry analogies, occasional professional opinions
6. MAINTAIN QUALITY: Keep ALL H2/H3 headings unchanged, preserve ALL links and citations exactly, maintain professionalism

CRITICAL: Return ONLY the humanized HTML content. No explanations.`;

      const humanizedContent = await InvokeLLM({
        prompt: humanizationPrompt,
        provider: 'xai',
        model: aiModel,
        temperature: 0.8,
        max_tokens: 8000
      });

      currentContent = humanizedContent
        .replace(/^```html\s*/gi, '')
        .replace(/^```\s*/gi, '')
        .replace(/\s*```$/gi, '')
        .replace(/^Here'?s?.*?:?\s*/gi, '')
        .replace(/^I'?ve.*?\.\s*/gi, '')
        .trim();

      addStep('✓ Content humanized');
      await delay(400);

      // Final validation
      const finalMetrics = calculateQualityMetrics(currentContent, currentFaqs);
      addStep('');
      addStep('📊 FINAL RESULTS:');
      addStep(`   Word Count: ${initialMetrics.wordCount} → ${finalMetrics.wordCount} (${finalMetrics.wordCount >= 800 ? '✓' : '✗'})`);
      addStep(`   Internal Links: ${initialMetrics.internalLinks} → ${finalMetrics.internalLinks} (${finalMetrics.internalLinks >= 2 ? '✓' : '✗'})`);
      addStep(`   External Links: ${initialMetrics.externalLinks} → ${finalMetrics.externalLinks} (${finalMetrics.externalLinks >= 1 ? '✓' : '✗'})`);
      addStep(`   H2 IDs: ${initialMetrics.h2WithIds}/${initialMetrics.h2Count} → ${finalMetrics.h2WithIds}/${finalMetrics.h2Count} (${finalMetrics.h2WithIds === finalMetrics.h2Count ? '✓' : '✗'})`);
      addStep(`   FAQs: ${initialMetrics.hasFAQs ? 'Yes' : 'No'} → ${finalMetrics.hasFAQs ? 'Yes' : 'No'} (${finalMetrics.hasFAQs ? '✓' : '✗'})`);

      if (finalMetrics.issues.length === 0) {
        addStep('');
        addStep('✅ Auto-fix complete - All quality standards met!');
      } else {
        addStep('');
        addStep(`⚠️ Auto-fix complete - ${finalMetrics.issues.length} issue(s) still need manual attention: ${finalMetrics.issues.join(', ')}`);
      }

      await delay(500);

      setFormData({
        ...formData,
        content: currentContent,
        faqs: currentFaqs
      });

      setIsAutoFixing(false);

    } catch (error) {
      console.error('Auto-fix error:', error);
      addStep(`✗ Error: ${error.message}`);
      addStep('Please try again or fix manually.');
      setIsAutoFixing(false);
    }
  };

  const handleSchemaUpdate = (schema) => {
    console.log('Schema generated:', schema);
  };

  const handleNavigationGenerated = (nav) => {
    console.log('Navigation generated:', nav);
  };

  const handleInsertBLSCitation = (citation) => {
    console.log('BLS citation:', citation);
  };

  if (articleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

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
              onClick={() => navigate('/content')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {articleId ? 'Edit Article' : 'New Article'}
              </h1>
              <p className="text-gray-600 mt-1">
                {qualityStatus.score}% quality score
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </Button>
            <Button
              onClick={handlePublish}
              disabled={!qualityStatus.canPublish || saveMutation.isPending}
              className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700"
            >
              <Send className="w-4 h-4" />
              Publish
            </Button>
          </div>
        </motion.div>

        {/* Auto-Fix Progress Dialog */}
        <AnimatePresence>
          {isAutoFixing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            >
              <Card className="max-w-2xl w-full max-h-[600px] overflow-hidden">
                <CardHeader>
                  <CardTitle>Auto-Fixing Article</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 p-4 rounded-lg max-h-[400px] overflow-y-auto font-mono text-sm">
                    {autoFixSteps.map((step, i) => (
                      <div key={i} className="mb-2 text-gray-300">
                        [{step.timestamp}] {step.message}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quality Warning */}
        {!qualityStatus.canPublish && formData.content && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900">Cannot Publish</h4>
                <p className="text-sm text-red-700 mt-1">
                  Critical quality issues must be resolved. Check the Quality Checklist.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Production Preview */}
            <Card className="border-none shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
                <div className="max-w-4xl">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-blue-200 text-sm font-medium uppercase">
                      {formData.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                    {formData.title || 'Untitled Article'}
                  </h1>
                  {formData.excerpt && (
                    <p className="text-xl text-blue-100 leading-relaxed">
                      {formData.excerpt}
                    </p>
                  )}
                </div>
              </div>

              <CardContent className="p-0">
                <div className="max-w-4xl mx-auto px-8 py-12">
                  <div
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.content }}
                  />
                </div>
              </CardContent>

              <div className="border-t bg-gray-50 px-8 py-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-4">
                    <span>📝 {formData.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length.toLocaleString()} words</span>
                    <span>•</span>
                    <span>Internal Links: {(formData.content.match(/geteducated\.com/gi) || []).length}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Editor Tools */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Edit Content</CardTitle>
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
                  <Label>Excerpt</Label>
                  <Textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Brief description..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Content (HTML)</Label>
                  <ReactQuill
                    value={formData.content}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                    placeholder="Write your content..."
                    className="bg-white"
                    style={{ height: '500px', marginBottom: '60px' }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
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
                    <option value="ranking">Ranking</option>
                    <option value="career_guide">Career Guide</option>
                    <option value="listicle">Listicle</option>
                    <option value="guide">Guide</option>
                    <option value="faq">FAQ</option>
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

            {/* Auto-Fix */}
            {qualityStatus.score < 100 && formData.content && (
              <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-4">
                  <Button
                    onClick={handleAutoFix}
                    disabled={isAutoFixing}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 gap-2 py-6"
                  >
                    <Wand2 className="w-5 h-5" />
                    {isAutoFixing ? 'Fixing...' : 'Auto-Fix All Issues'}
                  </Button>
                  <p className="text-xs text-center text-gray-600 mt-3">
                    AI will add missing links, FAQs, and expand content
                  </p>
                </CardContent>
              </Card>
            )}

            <QualityChecklist
              article={article}
              content={formData.content}
              onQualityChange={setQualityStatus}
            />

            <SchemaGenerator
              article={{ ...article, ...formData }}
              onSchemaUpdate={handleSchemaUpdate}
            />

            <LinkComplianceChecker
              content={formData.content}
              onComplianceChange={(isCompliant) => {
                console.log('Link compliance:', isCompliant);
              }}
            />

            <ArticleNavigationGenerator
              content={formData.content}
              onNavigationGenerated={handleNavigationGenerated}
            />

            <BLSCitationHelper
              onInsertCitation={handleInsertBLSCitation}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
