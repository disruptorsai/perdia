/**
 * PERDIA V2: ARTICLE DRAWER
 * ==========================
 *
 * Detailed article view with tabs:
 * - Preview: Rich HTML rendering
 * - Edit: Inline content editing
 * - SEO: Meta fields, keywords, slug
 * - Feedback: Comments, rewrite, regenerate
 * - Details: Models, costs, validation
 *
 * Created: 2025-11-12
 */

import React, { useState } from 'react';
import { Article, Feedback } from '@/lib/perdia-sdk';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Edit3,
  Eye,
  Tag,
  DollarSign,
  Clock,
  AlertTriangle,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { regenerateWithFeedback } from '@/lib/content-pipeline';
import { WordPressClient } from '@/lib/wordpress-client';
import { Integration } from '@/lib/perdia-sdk';

export default function ArticleDrawerV2({ article, open, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('preview');
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(article.body);
  const [editedTitle, setEditedTitle] = useState(article.title);
  const [editedMetaTitle, setEditedMetaTitle] = useState(article.meta_title);
  const [editedMetaDesc, setEditedMetaDesc] = useState(article.meta_description);
  const [editedSlug, setEditedSlug] = useState(article.slug);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Feedback state
  const [feedbackText, setFeedbackText] = useState('');
  const [rewriteInstructions, setRewriteInstructions] = useState('');

  // Save edits
  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {
        title: editedTitle,
        body: editedContent,
        meta_title: editedMetaTitle,
        meta_description: editedMetaDesc,
        slug: editedSlug,
        // Recalculate word count
        word_count: editedContent.replace(/<[^>]*>/g, '').split(/\s+/).length,
      };

      await Article.update(article.id, updates);

      const updated = { ...article, ...updates };
      onUpdate(updated);
      setEditing(false);
      toast.success('Article saved');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  // Approve article
  const handleApprove = async () => {
    setActionLoading('approving');
    try {
      await Article.update(article.id, { status: 'approved' });

      await Feedback.create({
        article_id: article.id,
        type: 'approve',
        payload: { timestamp: new Date().toISOString(), from: 'drawer' },
      });

      // Publish to WordPress
      await publishToWordPress();

      toast.success('Article approved and published');
      onUpdate({ ...article, status: 'approved' });
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Failed to approve article');
    } finally {
      setActionLoading(null);
    }
  };

  // Reject article
  const handleReject = async () => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    setActionLoading('rejecting');
    try {
      await Article.update(article.id, {
        status: 'rejected',
        validation_errors: [{ type: 'rejected', message: reason }],
      });

      await Feedback.create({
        article_id: article.id,
        type: 'reject',
        payload: { timestamp: new Date().toISOString(), reason, from: 'drawer' },
      });

      toast.success('Article rejected');
      onUpdate({ ...article, status: 'rejected' });
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Failed to reject article');
    } finally {
      setActionLoading(null);
    }
  };

  // Regenerate with feedback
  const handleRewrite = async () => {
    if (!rewriteInstructions.trim()) {
      toast.error('Please provide rewrite instructions');
      return;
    }

    setActionLoading('rewriting');
    try {
      // Record feedback
      await Feedback.create({
        article_id: article.id,
        type: 'rewrite',
        payload: {
          instructions: rewriteInstructions,
          timestamp: new Date().toISOString(),
        },
        used_for_training: true,
      });

      toast.info('Regenerating article with feedback...');

      // Regenerate via pipeline
      const result = await regenerateWithFeedback(
        article.body,
        rewriteInstructions,
        article.title,
        {
          onProgress: (progress) => {
            console.log('[Rewrite Progress]', progress);
          },
        }
      );

      // Update article
      const updates = {
        body: result.body,
        word_count: result.word_count,
        target_keywords: result.target_keywords,
        generation_cost: (article.generation_cost || 0) + result.generation_cost,
        verification_cost: (article.verification_cost || 0) + result.verification_cost,
        validation_status: result.validation_status,
        validation_errors: result.validation_errors,
        status: 'draft', // Move back to draft for review
      };

      await Article.update(article.id, updates);

      const updated = { ...article, ...updates };
      onUpdate(updated);
      setEditedContent(result.body);
      setRewriteInstructions('');
      toast.success('Article regenerated');
    } catch (error) {
      console.error('Rewrite error:', error);
      toast.error('Failed to regenerate article');
    } finally {
      setActionLoading(null);
    }
  };

  // Add comment
  const handleAddComment = async () => {
    if (!feedbackText.trim()) return;

    try {
      await Feedback.create({
        article_id: article.id,
        type: 'comment',
        payload: {
          text: feedbackText,
          timestamp: new Date().toISOString(),
        },
      });

      setFeedbackText('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Comment error:', error);
      toast.error('Failed to add comment');
    }
  };

  // Publish to WordPress
  const publishToWordPress = async () => {
    try {
      const integrations = await Integration.find({ type: 'wordpress', status: 'active' });
      if (integrations.length === 0) {
        throw new Error('No active WordPress integration');
      }

      const wpIntegration = integrations[0];
      const wp = new WordPressClient(
        wpIntegration.base_url,
        wpIntegration.credentials.username,
        wpIntegration.credentials.password
      );

      const post = await wp.createPost({
        title: article.title,
        content: article.body,
        status: 'publish',
        featured_media_url: article.featured_image_url,
        meta: {
          description: article.meta_description,
        },
      });

      await Article.update(article.id, {
        status: 'published',
        wordpress_post_id: post.id.toString(),
        wordpress_url: post.link,
        published_at: new Date().toISOString(),
      });

      return post;
    } catch (error) {
      console.error('WordPress publish error:', error);
      throw error;
    }
  };

  // Calculate SLA status
  const getSLADisplay = () => {
    if (article.status !== 'pending_review' || !article.auto_approve_at) {
      return null;
    }

    const now = new Date();
    const autoApproveAt = new Date(article.auto_approve_at);
    const timeLeft = formatDistanceToNow(autoApproveAt, { addSuffix: true });

    return (
      <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <Clock className="h-4 w-4 text-yellow-600" />
        <span className="text-sm text-yellow-800">
          Auto-approve {timeLeft}
        </span>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-2xl mb-2">
                {editing ? (
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-2xl font-bold"
                  />
                ) : (
                  article.title
                )}
              </SheetTitle>
              <SheetDescription>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant={article.status === 'pending_review' ? 'default' : 'secondary'}>
                    {article.status.replace('_', ' ')}
                  </Badge>
                  {article.word_count && (
                    <span>{article.word_count} words</span>
                  )}
                  {article.total_cost > 0 && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${article.total_cost.toFixed(4)}
                    </span>
                  )}
                </div>
              </SheetDescription>
            </div>

            {/* Quick Actions */}
            {!editing && article.status === 'pending_review' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleApprove}
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'approving' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!!actionLoading}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            )}
          </div>

          {/* SLA Timer */}
          {getSLADisplay()}
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="edit">
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="seo">
                <Tag className="h-4 w-4 mr-1" />
                SEO
              </TabsTrigger>
              <TabsTrigger value="feedback">
                <MessageSquare className="h-4 w-4 mr-1" />
                Feedback
              </TabsTrigger>
              <TabsTrigger value="details">
                <DollarSign className="h-4 w-4 mr-1" />
                Details
              </TabsTrigger>
            </TabsList>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              {article.featured_image_url && (
                <img
                  src={article.featured_image_url}
                  alt={article.title}
                  className="w-full rounded-lg"
                />
              )}
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: article.body }}
              />
            </TabsContent>

            {/* Edit Tab */}
            <TabsContent value="edit" className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Content (HTML)</label>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditedContent(article.body);
                    setEditedTitle(article.title);
                  }}
                >
                  Reset
                </Button>
              </div>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Meta Title ({editedMetaTitle?.length || 0}/60)
                </label>
                <Input
                  value={editedMetaTitle}
                  onChange={(e) => setEditedMetaTitle(e.target.value)}
                  maxLength={60}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Meta Description ({editedMetaDesc?.length || 0}/160)
                </label>
                <Textarea
                  value={editedMetaDesc}
                  onChange={(e) => setEditedMetaDesc(e.target.value)}
                  maxLength={160}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Slug</label>
                <Input
                  value={editedSlug}
                  onChange={(e) => setEditedSlug(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Target Keywords</label>
                <div className="flex flex-wrap gap-2">
                  {article.target_keywords?.map((kw, i) => (
                    <Badge key={i} variant="outline">{kw}</Badge>
                  ))}
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                Save SEO Changes
              </Button>
            </TabsContent>

            {/* Feedback Tab */}
            <TabsContent value="feedback" className="space-y-4">
              {/* Rewrite Section */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Request Rewrite</h3>
                <Textarea
                  placeholder="Provide instructions for how to improve the article..."
                  value={rewriteInstructions}
                  onChange={(e) => setRewriteInstructions(e.target.value)}
                  rows={4}
                />
                <Button
                  className="mt-2"
                  onClick={handleRewrite}
                  disabled={!!actionLoading || !rewriteInstructions.trim()}
                >
                  {actionLoading === 'rewriting' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate Article
                    </>
                  )}
                </Button>
              </div>

              {/* Comment Section */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Add Comment</h3>
                <Textarea
                  placeholder="Add a comment for future reference..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={3}
                />
                <Button
                  className="mt-2"
                  variant="outline"
                  onClick={handleAddComment}
                  disabled={!feedbackText.trim()}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Primary Model</label>
                  <p className="font-mono text-sm">{article.model_primary || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Verify Model</label>
                  <p className="font-mono text-sm">{article.model_verify || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Generation Cost</label>
                  <p className="font-mono text-sm">${(article.generation_cost || 0).toFixed(4)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Verification Cost</label>
                  <p className="font-mono text-sm">${(article.verification_cost || 0).toFixed(4)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Cost</label>
                  <p className="font-mono text-sm font-semibold">${(article.total_cost || 0).toFixed(4)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Validation Status</label>
                  <Badge variant={article.validation_status === 'valid' ? 'success' : 'destructive'}>
                    {article.validation_status || 'pending'}
                  </Badge>
                </div>
              </div>

              {/* Validation Errors */}
              {article.validation_errors && article.validation_errors.length > 0 && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Validation Issues
                  </h3>
                  <ul className="space-y-1 text-sm text-red-700">
                    {article.validation_errors.map((error, i) => (
                      <li key={i}>• {error.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(article.created_at), 'PPpp')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{format(new Date(article.updated_at), 'PPpp')}</span>
                </div>
                {article.published_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Published</span>
                    <span>{format(new Date(article.published_at), 'PPpp')}</span>
                  </div>
                )}
              </div>

              {/* WordPress Info */}
              {article.wordpress_url && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-muted-foreground">WordPress URL</label>
                  <a
                    href={article.wordpress_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline block mt-1"
                  >
                    {article.wordpress_url}
                  </a>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
