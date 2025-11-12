/**
 * PERDIA V2: ARTICLE DRAWER COMPONENT
 * ====================================
 *
 * Full-featured article review drawer with:
 * - Content preview and editing
 * - Validation feedback
 * - Quote injection controls
 * - Image management
 * - Approve/reject actions
 *
 * Created: 2025-11-12
 */

import React, { useState } from 'react';
import { ContentQueue } from '@/lib/perdia-sdk';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Check,
  X,
  AlertTriangle,
  CheckCircle,
  Image as ImageIcon,
  Quote,
  Edit,
  Save,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ArticleDrawer({ article, validation, isOpen, onClose, onSave }) {
  const [editMode, setEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState(article.title);
  const [editedContent, setEditedContent] = useState(article.content);
  const [editedMetaDescription, setEditedMetaDescription] = useState(article.meta_description || '');
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [injectingQuotes, setInjectingQuotes] = useState(false);

  const handleSave = async () => {
    setProcessing(true);
    try {
      await ContentQueue.update(article.id, {
        title: editedTitle,
        content: editedContent,
        meta_description: editedMetaDescription
      });

      toast.success('Changes saved');
      setEditMode(false);
      onSave();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save changes');
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async () => {
    // Check validation
    if (validation && !validation.isValid) {
      if (!confirm('Article has validation errors. Approve anyway?')) {
        return;
      }
    }

    setProcessing(true);
    try {
      await ContentQueue.update(article.id, {
        status: 'approved',
        approved_date: new Date().toISOString(),
        review_notes: reviewNotes
      });

      toast.success('Article approved');
      onSave();
    } catch (error) {
      console.error('Error approving:', error);
      toast.error('Failed to approve article');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!reviewNotes.trim()) {
      toast.error('Please provide rejection notes');
      return;
    }

    setProcessing(true);
    try {
      await ContentQueue.update(article.id, {
        status: 'rejected',
        rejection_reason: reviewNotes,
        review_notes: reviewNotes
      });

      toast.success('Article rejected');
      onSave();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('Failed to reject article');
    } finally {
      setProcessing(false);
    }
  };

  const handleInjectQuotes = async () => {
    setInjectingQuotes(true);
    try {
      // Call inject-quotes Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/inject-quotes`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          article_content: editedContent,
          topic_category: article.topic_category,
          min_quotes: 2,
          max_quotes: 5,
          min_relevance: 0.6
        })
      });

      if (!response.ok) {
        throw new Error('Failed to inject quotes');
      }

      const { content, quotes_injected } = await response.json();

      setEditedContent(content);
      toast.success(`Injected ${quotes_injected} real quotes into article`);
    } catch (error) {
      console.error('Error injecting quotes:', error);
      toast.error('Failed to inject quotes');
    } finally {
      setInjectingQuotes(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {editMode ? (
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-xl font-semibold"
                />
              ) : (
                <CardTitle className="mb-2">{article.title}</CardTitle>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className="bg-blue-100 text-blue-800">
                  {article.word_count || 0} words
                </Badge>
                {article.featured_image_url && (
                  <Badge className="bg-green-100 text-green-800">
                    <ImageIcon className="w-3 h-3 mr-1" />
                    Has Image
                  </Badge>
                )}
                {validation && (
                  <Badge
                    className={
                      validation.isValid
                        ? 'bg-green-100 text-green-800'
                        : validation.errors.length > 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {validation.isValid ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Valid
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {validation.errors.length} errors, {validation.warnings.length} warnings
                      </>
                    )}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <Button size="sm" onClick={handleSave} disabled={processing}>
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Validation Feedback */}
          {validation && !validation.isValid && (
            <div className="mb-6 space-y-2">
              {validation.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-1">Validation Errors:</div>
                    <ul className="list-disc list-inside text-sm">
                      {validation.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              {validation.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-1">Warnings:</div>
                    <ul className="list-disc list-inside text-sm">
                      {validation.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Quote Injection */}
          {editMode && (
            <div className="mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleInjectQuotes}
                disabled={injectingQuotes}
              >
                {injectingQuotes ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Injecting Quotes...
                  </>
                ) : (
                  <>
                    <Quote className="w-4 h-4 mr-2" />
                    Inject Real Quotes (60%+ Requirement)
                  </>
                )}
              </Button>
              <p className="text-xs text-slate-500 mt-1">
                Automatically injects 2-5 real quotes from Reddit, Twitter, and forums
              </p>
            </div>
          )}

          {/* Meta Description */}
          {editMode && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Meta Description (120-160 characters recommended)
              </label>
              <Textarea
                value={editedMetaDescription}
                onChange={(e) => setEditedMetaDescription(e.target.value)}
                rows={2}
                placeholder="Enter meta description..."
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">
                {editedMetaDescription.length} characters
              </p>
            </div>
          )}

          {/* Featured Image */}
          {article.featured_image_url && (
            <div className="mb-6">
              <img
                src={article.featured_image_url}
                alt={article.featured_image_alt_text || article.title}
                className="w-full h-64 object-cover rounded-lg"
              />
              {article.featured_image_alt_text && (
                <p className="text-sm text-slate-500 mt-2 italic">
                  {article.featured_image_alt_text}
                </p>
              )}
            </div>
          )}

          {/* Article Content */}
          {editMode ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Content (HTML)
              </label>
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={20}
                className="w-full font-mono text-sm"
              />
            </div>
          ) : (
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          )}
        </div>

        {/* Actions Footer */}
        <div className="border-t p-6 flex-shrink-0 bg-slate-50">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Review Notes
              {article.status === 'pending_review' && !reviewNotes.trim() && (
                <span className="text-red-500"> (Required for rejection)</span>
              )}
            </label>
            <Textarea
              placeholder="Add your feedback or notes..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
              className="w-full"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} disabled={processing}>
              Close
            </Button>
            {article.status === 'pending_review' && (
              <>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={processing || !reviewNotes.trim()}
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Approve
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
