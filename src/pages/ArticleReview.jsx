/**
 * Article Review Page
 *
 * Features:
 * - Highlight text to add comments
 * - Floating comment button
 * - Comment dialog with categories and severity
 * - Comments sidebar
 * - AI revision based on feedback
 * - GetEducated-style article preview
 * - View mode toggle (Preview | HTML)
 * - Approve/Delete actions
 *
 * Based on: Reference app ArticleReview.jsx
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MessageSquare,
  CheckCircle2,
  Trash2,
  Loader2,
  Send,
  Eye,
  Code,
  Sparkles,
  AlertCircle
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// SDK
import { ContentQueue, ArticleRevision, TrainingData } from '@/lib/perdia-sdk';
import { regenerateWithFeedback } from '@/lib/content-pipeline';

export default function ArticleReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const articleContentRef = useRef(null);

  // Article data
  const [article, setArticle] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Text selection state
  const [selectedText, setSelectedText] = useState('');
  const [floatingButtonPos, setFloatingButtonPos] = useState({ x: 0, y: 0, show: false });

  // Comment dialog state
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [commentData, setCommentData] = useState({
    comment: '',
    category: 'style',
    severity: 'moderate'
  });

  // AI Revision state
  const [isRevising, setIsRevising] = useState(false);
  const [revisionStatus, setRevisionStatus] = useState('');

  // View mode state
  const [viewMode, setViewMode] = useState('preview');

  // Load article and revisions
  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      // Load article
      const [articleData] = await ContentQueue.find({ id }, { limit: 1 });
      setArticle(articleData);

      // Load pending revisions
      const revisionsData = await ArticleRevision.find(
        { article_id: id, status: 'pending' },
        { orderBy: { column: 'created_date', ascending: false } }
      );
      setRevisions(revisionsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load article');
    } finally {
      setLoading(false);
    }
  }

  // Text selection handler
  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (text.length > 0 && articleContentRef.current?.contains(selection.anchorNode)) {
        setSelectedText(text);

        // Get selection position
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Position button near the selection
        setFloatingButtonPos({
          x: rect.right + 10,
          y: rect.top + window.scrollY,
          show: true
        });
      } else {
        setSelectedText('');
        setFloatingButtonPos({ x: 0, y: 0, show: false });
      }
    };

    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('selectionchange', handleTextSelection);

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('selectionchange', handleTextSelection);
    };
  }, []);

  // Handle comment submission
  async function handleSubmitComment() {
    if (!commentData.comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      await ArticleRevision.create({
        article_id: id,
        revision_type: 'comment',
        selected_text: selectedText,
        comment: commentData.comment,
        category: commentData.category,
        severity: commentData.severity,
        status: 'pending'
      });

      toast.success('Comment added');
      setShowCommentDialog(false);
      setSelectedText('');
      setFloatingButtonPos({ x: 0, y: 0, show: false });
      setCommentData({ comment: '', category: 'style', severity: 'moderate' });

      // Reload revisions
      loadData();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  }

  // Handle AI revision
  async function handleAIRevise() {
    if (revisions.length === 0) {
      toast.error('No feedback to apply. Add comments first.');
      return;
    }

    setIsRevising(true);
    setRevisionStatus('Analyzing feedback...');

    try {
      // Build feedback items
      const feedbackItems = revisions.map(r => ({
        selected_text: r.selected_text,
        comment: r.comment,
        category: r.category,
        severity: r.severity
      }));

      setRevisionStatus('Building revision prompt...');

      // Combine all feedback into a single instruction string
      const feedbackInstructions = revisions.map((r, i) =>
        `${i + 1}. [${r.category.toUpperCase()} - ${r.severity}]\n   Selected Text: "${r.selected_text}"\n   Feedback: ${r.comment}`
      ).join('\n\n');

      setRevisionStatus('Generating revised article...');

      // Call regenerateWithFeedback
      const result = await regenerateWithFeedback(
        article.body,
        feedbackInstructions,
        article.title,
        {
          onProgress: (progress) => {
            setRevisionStatus(progress.message);
          }
        }
      );

      setRevisionStatus('Creating training data...');

      // Create TrainingData for AI learning
      await TrainingData.create({
        article_id: id,
        article_title: article.title,
        content_type: article.type || 'article',
        original_content: article.body,
        revised_content: result.body,
        feedback_items: feedbackItems,
        pattern_type: getMostCommonCategory(revisions),
        lesson_learned: `Revised based on ${revisions.length} editorial comments focusing on ${getMostCommonCategory(revisions)}`,
        status: 'pending_review',
        impact_score: calculateImpactScore(revisions)
      });

      setRevisionStatus('Saving revised article...');

      // Update article
      await ContentQueue.update(id, {
        body: result.body,
        word_count: result.word_count
      });

      // Mark all revisions as addressed
      await Promise.all(
        revisions.map(r => ArticleRevision.update(r.id, { status: 'addressed' }))
      );

      toast.success('Article revised successfully!');
      setIsRevising(false);
      setRevisionStatus('');

      // Reload data
      loadData();
    } catch (error) {
      console.error('Error revising article:', error);
      toast.error('Failed to revise article: ' + error.message);
      setIsRevising(false);
      setRevisionStatus('');
    }
  }

  // Helper: Get most common category
  function getMostCommonCategory(revisions) {
    const categories = revisions.map(r => r.category);
    const counts = {};
    categories.forEach(c => counts[c] = (counts[c] || 0) + 1);
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || 'style_change';
  }

  // Helper: Calculate impact score
  function calculateImpactScore(revisions) {
    const severityScores = { minor: 1, moderate: 3, major: 5, critical: 10 };
    const total = revisions.reduce((sum, r) => sum + (severityScores[r.severity] || 3), 0);
    return Math.min(10, Math.ceil(total / revisions.length));
  }

  // Handle approve
  async function handleApprove() {
    try {
      await ContentQueue.update(id, { status: 'approved' });
      toast.success('Article approved');
      navigate('/v2/approval');
    } catch (error) {
      console.error('Error approving article:', error);
      toast.error('Failed to approve article');
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      await ContentQueue.update(id, { status: 'deleted' });
      toast.success('Article deleted');
      navigate('/v2/approval');
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article');
    }
  }

  // Severity colors
  const severityColors = {
    minor: 'bg-blue-100 text-blue-700 border-blue-300',
    moderate: 'bg-amber-100 text-amber-700 border-amber-300',
    major: 'bg-orange-100 text-orange-700 border-orange-300',
    critical: 'bg-red-100 text-red-700 border-red-300'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Article not found</p>
          <Button onClick={() => navigate('/v2/approval')} className="mt-4">
            Back to Review Queue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Floating Comment Button */}
        <AnimatePresence>
          {floatingButtonPos.show && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                position: 'absolute',
                left: floatingButtonPos.x,
                top: floatingButtonPos.y,
                zIndex: 1000
              }}
            >
              <Button
                onClick={() => setShowCommentDialog(true)}
                className="bg-primary hover:bg-primary/90 shadow-2xl gap-2"
                size="sm"
              >
                <MessageSquare className="w-4 h-4" />
                Add Comment
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Revision Loading Overlay */}
        <AnimatePresence>
          {isRevising && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
              >
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      AI Revising Article
                    </h3>
                    <p className="text-primary font-medium">
                      {revisionStatus}
                    </p>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>✓ Analyzing {revisions.length} editorial comments</p>
                    <p>✓ Preserving structure and citations</p>
                    <p>✓ Creating training data for AI learning</p>
                  </div>
                  <p className="text-xs text-gray-500">This takes 30-60 seconds...</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comment Dialog */}
        <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Comment</DialogTitle>
              <DialogDescription>
                Provide feedback on the selected text
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Selected Text Display */}
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm font-medium text-gray-900 mb-1">Selected Text:</p>
                <p className="text-sm text-gray-700 italic">
                  "{selectedText.substring(0, 200)}{selectedText.length > 200 ? '...' : ''}"
                </p>
              </div>

              {/* Category Select */}
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select
                  value={commentData.category}
                  onValueChange={(value) => setCommentData({ ...commentData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accuracy">Accuracy</SelectItem>
                    <SelectItem value="tone">Tone</SelectItem>
                    <SelectItem value="structure">Structure</SelectItem>
                    <SelectItem value="seo">SEO</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="grammar">Grammar</SelectItem>
                    <SelectItem value="style">Style</SelectItem>
                    <SelectItem value="formatting">Formatting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Severity Select */}
              <div>
                <label className="text-sm font-medium mb-2 block">Severity</label>
                <Select
                  value={commentData.severity}
                  onValueChange={(value) => setCommentData({ ...commentData, severity: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Comment Textarea */}
              <div>
                <label className="text-sm font-medium mb-2 block">Your Feedback</label>
                <Textarea
                  placeholder="Explain what needs to be changed..."
                  value={commentData.comment}
                  onChange={(e) => setCommentData({ ...commentData, comment: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCommentDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitComment}
                  className="flex-1 gap-2"
                >
                  <Send className="w-4 h-4" />
                  Submit Comment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
              onClick={() => navigate('/v2/approval')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Review Article</h1>
              <p className="text-gray-600 mt-1">
                Select text to add comments • {viewMode === 'preview' ? 'Preview Mode' : 'HTML Source'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Bar */}
        <Card className="border-none shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* Left Side: Badges and View Toggle */}
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {revisions.length} comment{revisions.length !== 1 ? 's' : ''}
                </Badge>
                {selectedText && (
                  <Badge className="bg-primary text-white">
                    Text Selected
                  </Badge>
                )}
                <div className="flex gap-1 ml-2">
                  <Button
                    variant={viewMode === 'preview' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('preview')}
                    className="gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </Button>
                  <Button
                    variant={viewMode === 'html' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('html')}
                    className="gap-1"
                  >
                    <Code className="w-3 h-3" />
                    HTML
                  </Button>
                </div>
              </div>

              {/* Right Side: Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleAIRevise}
                  disabled={revisions.length === 0 || isRevising}
                  className="gap-2"
                  variant="secondary"
                >
                  <Sparkles className="w-4 h-4" />
                  AI Revise ({revisions.length})
                </Button>
                <Button
                  onClick={handleApprove}
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="text-red-600 border-red-200 hover:bg-red-50 gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Article Content (2 columns) */}
          <div className="lg:col-span-2">
            <Card className="border-none shadow-lg overflow-hidden">
              {viewMode === 'preview' ? (
                <>
                  {/* Article Header - GetEducated Style */}
                  <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-8">
                    <div className="max-w-4xl">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-white/70 text-sm font-medium uppercase tracking-wider">
                          {article.type || 'Article'}
                        </span>
                        <span className="text-white/50">•</span>
                        <span className="text-white/70 text-sm">
                          {new Date(article.created_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                        {article.title}
                      </h1>
                      {article.excerpt && (
                        <p className="text-xl text-white/90 leading-relaxed">
                          {article.excerpt}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Article Body */}
                  <CardContent className="p-0">
                    <div className="max-w-4xl mx-auto px-8 py-12">
                      <style>{`
                        .article-content {
                          font-family: Georgia, 'Times New Roman', serif;
                          font-size: 18px;
                          line-height: 1.8;
                          color: #1f2937;
                        }

                        .article-content h2 {
                          font-size: 32px;
                          font-weight: 700;
                          margin-top: 48px;
                          margin-bottom: 24px;
                          color: #111827;
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                          line-height: 1.2;
                          border-bottom: 2px solid #e5e7eb;
                          padding-bottom: 12px;
                        }

                        .article-content h3 {
                          font-size: 24px;
                          font-weight: 600;
                          margin-top: 36px;
                          margin-bottom: 16px;
                          color: #1f2937;
                        }

                        .article-content p {
                          margin-bottom: 20px;
                          line-height: 1.8;
                        }

                        .article-content a {
                          color: var(--primary);
                          text-decoration: none;
                          border-bottom: 1px solid currentColor;
                          transition: all 0.2s;
                        }

                        .article-content a:hover {
                          opacity: 0.8;
                        }

                        .article-content strong,
                        .article-content b {
                          font-weight: 700;
                          color: #111827;
                        }

                        .article-content ul,
                        .article-content ol {
                          margin-bottom: 24px;
                          padding-left: 32px;
                        }

                        .article-content li {
                          margin-bottom: 12px;
                          line-height: 1.8;
                        }

                        .article-content ::selection {
                          background-color: #bfdbfe;
                          color: #1e40af;
                        }
                      `}</style>
                      <div
                        ref={articleContentRef}
                        className="article-content select-text"
                        dangerouslySetInnerHTML={{ __html: article.body }}
                      />
                    </div>
                  </CardContent>

                  {/* Article Footer */}
                  <div className="border-t bg-gray-50 px-8 py-6">
                    <div className="max-w-4xl mx-auto">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <span>📝 {article.word_count?.toLocaleString() || 0} words</span>
                          <span>•</span>
                          <span>Updated {new Date(article.updated_date || article.created_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* HTML Source View */
                <CardContent className="p-6">
                  <div className="bg-gray-900 rounded-lg p-6 overflow-auto max-h-[800px]">
                    <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap break-words">
                      {article.body}
                    </pre>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Comments Sidebar (1 column) */}
          <div className="space-y-4">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Comments ({revisions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revisions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium">No comments yet</p>
                    <p className="text-xs mt-2">💡 Highlight any text in the article</p>
                    <p className="text-xs text-primary mt-1">A floating button will appear!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {revisions.map((revision) => (
                      <div key={revision.id} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {revision.category}
                          </Badge>
                          <Badge variant="outline" className={`${severityColors[revision.severity]} border text-xs`}>
                            {revision.severity}
                          </Badge>
                        </div>
                        {revision.selected_text && (
                          <p className="text-xs text-gray-600 italic mb-2 border-l-2 border-primary pl-2">
                            "{revision.selected_text.substring(0, 100)}{revision.selected_text.length > 100 ? '...' : ''}"
                          </p>
                        )}
                        <p className="text-sm text-gray-900">
                          {revision.comment}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(revision.created_date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Revision Ready Card */}
            {revisions.length > 0 && (
              <Card className="border-none shadow-lg bg-primary/5 border-2 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        Ready to revise
                      </p>
                      <p className="text-xs text-gray-700 mt-1">
                        Click "AI Revise" to let AI rewrite the article based on all {revisions.length} comment{revisions.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
