/**
 * PERDIA V2: TOPICS & QUESTIONS MANAGER
 * ======================================
 *
 * Questions-first content strategy
 * Monthly ingest of top questions about higher education
 * Create articles directly from questions
 *
 * Created: 2025-11-12
 */

import React, { useState, useEffect } from 'react';
import { TopicQuestion, Article } from '@/lib/perdia-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Calendar,
  TrendingUp,
  FileText,
  Loader2,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { generateArticlePipeline } from '@/lib/content-pipeline';
import { findTopQuestions } from '@/lib/perplexity-client';

export default function TopicQuestionsManagerV2() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [generating, setGenerating] = useState({});
  const [ingesting, setIngesting] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [filterSource]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const filters = {};

      if (filterSource && filterSource !== 'all') {
        filters.source = filterSource;
      }

      const data = await TopicQuestion.find(filters, {
        orderBy: { column: 'priority', ascending: false },
        limit: 100,
      });

      setQuestions(data);
    } catch (error) {
      console.error("Error loading questions:", error);
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  // Filter by search query
  const filteredQuestions = questions.filter(q => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      q.question_text?.toLowerCase().includes(query) ||
      q.keywords_extracted?.some(kw => kw.toLowerCase().includes(query))
    );
  });

  // Create article from question
  const handleCreateArticle = async (question) => {
    setGenerating(prev => ({ ...prev, [question.id]: true }));

    try {
      toast.info('Generating article...', { duration: 2000 });

      // Generate article via pipeline (Grok → Perplexity)
      const result = await generateArticlePipeline(question.question_text, {
        onProgress: (progress) => {
          console.log('[Generation Progress]', progress);
          if (progress.stage === 'generate') {
            toast.info('Draft generation in progress...', { id: 'progress' });
          } else if (progress.stage === 'verify') {
            toast.info('Verifying facts...', { id: 'progress' });
          } else if (progress.stage === 'image') {
            toast.info('Generating image...', { id: 'progress' });
          }
        },
      });

      // Create article in database
      const article = await Article.create({
        ...result,
        topic_question_id: question.id,
      });

      // Mark question as used
      await TopicQuestion.update(question.id, {
        used_for_article_id: article.id,
        used_at: new Date().toISOString(),
      });

      toast.success('Article created and added to Approval Queue', { id: 'progress' });
      loadQuestions(); // Refresh to show "Used" status
    } catch (error) {
      console.error('Create article error:', error);
      toast.error('Failed to create article: ' + error.message, { id: 'progress' });
    } finally {
      setGenerating(prev => ({ ...prev, [question.id]: false }));
    }
  };

  // Ingest new questions (monthly job - can also run manually)
  const handleIngestQuestions = async () => {
    setIngesting(true);
    try {
      toast.info('Searching for top questions about higher education...');

      // Use Perplexity to find top questions
      const topQuestions = await findTopQuestions('higher education college degrees online learning', 50);

      if (topQuestions.length === 0) {
        toast.warning('No new questions found');
        return;
      }

      // Insert questions
      let insertedCount = 0;
      for (const q of topQuestions) {
        try {
          await TopicQuestion.create({
            question_text: q.question,
            source: 'manual', // Or 'monthly' if from automated job
            keywords_extracted: q.keywords || [],
            search_volume: q.search_volume === 'high' ? 1000 : q.search_volume === 'medium' ? 500 : 100,
            priority: q.priority || 3,
          });
          insertedCount++;
        } catch (error) {
          // Skip duplicates
          if (!error.message.includes('unique')) {
            console.error('Insert error:', error);
          }
        }
      }

      toast.success(`Ingested ${insertedCount} new questions`);
      loadQuestions();
    } catch (error) {
      console.error('Ingest error:', error);
      toast.error('Failed to ingest questions');
    } finally {
      setIngesting(false);
    }
  };

  // Add manual question
  const handleAddManual = async () => {
    const questionText = prompt('Enter question:');
    if (!questionText) return;

    try {
      await TopicQuestion.create({
        question_text: questionText,
        source: 'manual',
        priority: 3,
      });

      toast.success('Question added');
      loadQuestions();
    } catch (error) {
      console.error('Add error:', error);
      toast.error('Failed to add question');
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    if (priority >= 5) {
      return <Badge variant="destructive">High Priority</Badge>;
    } else if (priority >= 3) {
      return <Badge variant="default">Medium</Badge>;
    } else {
      return <Badge variant="secondary">Low</Badge>;
    }
  };

  // Get source badge
  const getSourceBadge = (source) => {
    const badges = {
      monthly: <Badge variant="default"><Calendar className="h-3 w-3 mr-1" />Monthly</Badge>,
      weekly: <Badge variant="default"><TrendingUp className="h-3 w-3 mr-1" />Weekly</Badge>,
      daily_trend: <Badge variant="destructive"><Sparkles className="h-3 w-3 mr-1" />Trending</Badge>,
      manual: <Badge variant="secondary"><Plus className="h-3 w-3 mr-1" />Manual</Badge>,
    };
    return badges[source] || badges.manual;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Topics & Questions</h1>
          <p className="text-muted-foreground">
            Questions-first content strategy - generate articles from real user questions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddManual} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
          <Button onClick={handleIngestQuestions} disabled={ingesting}>
            {ingesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Find New Questions
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Source filter */}
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="monthly">Monthly Ingest</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="daily_trend">Daily Trends</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredQuestions.length} Question{filteredQuestions.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No questions found</p>
              <Button className="mt-4" onClick={handleIngestQuestions}>
                Find Questions
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((question) => {
                const isGenerating = generating[question.id];
                const isUsed = !!question.used_for_article_id;

                return (
                  <div
                    key={question.id}
                    className={`border rounded-lg p-4 ${isUsed ? 'bg-muted/30' : 'hover:bg-muted/50'} transition-colors`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Question info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {question.question_text}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                          {/* Source */}
                          {getSourceBadge(question.source)}

                          {/* Priority */}
                          {getPriorityBadge(question.priority)}

                          {/* Used status */}
                          {isUsed && (
                            <Badge variant="success" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Used
                            </Badge>
                          )}

                          {/* Search volume */}
                          {question.search_volume > 0 && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {question.search_volume} searches/mo
                            </span>
                          )}

                          {/* Discovered date */}
                          <span>
                            {format(new Date(question.discovered_at || question.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>

                        {/* Keywords */}
                        {question.keywords_extracted && question.keywords_extracted.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {question.keywords_extracted.map((kw, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Action */}
                      <div>
                        {isUsed ? (
                          <Button size="sm" variant="outline" disabled>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Article Created
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleCreateArticle(question)}
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <FileText className="h-4 w-4 mr-1" />
                                Create Article
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
