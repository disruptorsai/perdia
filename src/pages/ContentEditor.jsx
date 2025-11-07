import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Upload, ArrowLeft, ExternalLink, Check } from 'lucide-react';
import { ContentQueue, WordPressConnection } from '@/api/entities';
import { WordPressClient } from '@/lib/wordpress-client';
import { toast } from 'sonner';

export default function ContentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [content, setContent] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [wordCount, setWordCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    loadContent();
  }, [id]);

  useEffect(() => {
    // Calculate word count whenever body changes
    if (body) {
      const text = body.replace(/<[^>]*>?/gm, ' ');
      const words = text.match(/\b\w+\b/g);
      setWordCount(words ? words.length : 0);
    } else {
      setWordCount(0);
    }
  }, [body]);

  // Auto-save effect
  useEffect(() => {
    // Don't auto-save if content hasn't loaded yet
    if (!content || loading) return;

    // Don't auto-save if nothing has changed
    if (
      title === (content.title || '') &&
      body === (content.content || '') &&
      metaDescription === (content.meta_description || '')
    ) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Set new timeout to save after 3 seconds of inactivity
    const timeout = setTimeout(async () => {
      if (title.trim() && body.trim()) {
        try {
          await ContentQueue.update(id, {
            title: title.trim(),
            content: body,
            meta_description: metaDescription.trim(),
            slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            word_count: wordCount,
            updated_date: new Date().toISOString()
          });

          setLastSaved(new Date());
          setContent(prev => ({
            ...prev,
            title,
            content: body,
            meta_description: metaDescription,
            slug,
            word_count: wordCount
          }));
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, 3000);

    setAutoSaveTimeout(timeout);

    // Cleanup on unmount
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [title, body, metaDescription, content, loading]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const item = await ContentQueue.get(id);
      if (!item) {
        toast.error('Content not found');
        navigate('/content');
        return;
      }

      setContent(item);
      setTitle(item.title || '');
      setBody(item.content || '');
      setMetaDescription(item.meta_description || '');
      setSlug(item.slug || '');
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!body.trim()) {
      toast.error('Please add some content');
      return;
    }

    setSaving(true);
    try {
      await ContentQueue.update(id, {
        title: title.trim(),
        content: body,
        meta_description: metaDescription.trim(),
        slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        word_count: wordCount,
        updated_date: new Date().toISOString()
      });

      toast.success('Draft saved successfully');
      setContent(prev => ({
        ...prev,
        title,
        content: body,
        meta_description: metaDescription,
        slug,
        word_count: wordCount
      }));
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    // Save first
    if (!title.trim() || !body.trim()) {
      toast.error('Please add title and content before publishing');
      return;
    }

    setPublishing(true);

    try {
      // Save current changes
      await handleSave();

      toast.loading('Publishing to WordPress...', { id: 'publish' });

      // Get WordPress connection
      const connections = await WordPressConnection.list();
      const wpConnection = connections[0]; // Use first connection

      if (!wpConnection) {
        toast.error('Please configure WordPress connection first', { id: 'publish' });
        navigate('/wordpress');
        return;
      }

      // Create WordPress client
      const wp = new WordPressClient(
        wpConnection.site_url,
        wpConnection.username,
        wpConnection.application_password
      );

      // Test connection first
      const testResult = await wp.testConnection();
      if (!testResult.success) {
        toast.error(`WordPress connection failed: ${testResult.error}`, { id: 'publish' });
        return;
      }

      // Publish to WordPress
      const publishResult = await wp.createPost({
        title: title.trim(),
        content: body,
        status: 'publish',
        excerpt: metaDescription.trim(),
        slug: slug.trim() || undefined
      });

      if (!publishResult.success) {
        toast.error(`Publishing failed: ${publishResult.error}`, { id: 'publish' });
        return;
      }

      // Update content queue with WordPress details
      await ContentQueue.update(id, {
        status: 'published',
        wordpress_post_id: publishResult.post.id.toString(),
        wordpress_url: publishResult.post.link,
        published_date: new Date().toISOString()
      });

      toast.success('Published to WordPress!', { id: 'publish' });

      // Update local state
      setContent(prev => ({
        ...prev,
        status: 'published',
        wordpress_post_id: publishResult.post.id.toString(),
        wordpress_url: publishResult.post.link
      }));

    } catch (error) {
      console.error('Error publishing:', error);
      toast.error(`Publishing failed: ${error.message}`, { id: 'publish' });
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading content...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-600">Content not found</p>
          <Button onClick={() => navigate('/content')} className="mt-4">
            Back to Content Library
          </Button>
        </div>
      </div>
    );
  }

  const isPublished = content.status === 'published';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/content')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Content Library
          </Button>

          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-sm text-slate-500 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Auto-saved {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
            <Badge variant={isPublished ? 'default' : 'outline'}>
              {content.status || 'draft'}
            </Badge>
            {isPublished && content.wordpress_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(content.wordpress_url, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View on WordPress
              </Button>
            )}
          </div>
        </div>

        {/* Editor Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Content Editor</span>
              <div className="flex items-center gap-2 text-sm font-normal text-slate-600">
                <span>{wordCount} words</span>
                {content.target_keywords && content.target_keywords.length > 0 && (
                  <Badge variant="outline">
                    {content.target_keywords[0]}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter article title..."
                className="text-lg font-semibold"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                URL Slug (optional)
              </label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated-from-title"
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                Leave empty to auto-generate from title
              </p>
            </div>

            {/* Meta Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Meta Description
                <span className="ml-2 text-xs text-slate-500">
                  ({metaDescription.length}/155 characters)
                </span>
              </label>
              <Textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Write a compelling meta description for search engines..."
                maxLength={155}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Content Editor */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Content
              </label>
              <div className="bg-white rounded-lg border relative">
                <style>
                {`
                  .ql-container {
                    height: 600px;
                    overflow-y: auto;
                    font-size: 16px;
                  }
                `}
                </style>

                <ReactQuill
                  theme="snow"
                  value={body}
                  onChange={setBody}
                  modules={{
                    toolbar: [
                      [{ 'header': [2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link', 'blockquote'],
                      ['clean']
                    ]
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-slate-600">
                {content.agent_name && (
                  <span>Generated by <strong>{content.agent_name}</strong></span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={saving || publishing}
                  className="gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Draft
                    </>
                  )}
                </Button>

                <Button
                  onClick={handlePublish}
                  disabled={publishing || saving || isPublished}
                  className={
                    isPublished
                      ? 'bg-green-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                  }
                >
                  {publishing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : isPublished ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Published
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Publish to WordPress
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Keywords Card */}
        {content.target_keywords && content.target_keywords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Target Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {content.target_keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
