import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WordPressConnection } from '@/api/entities';
import { ContentQueue } from '@/api/entities';
import { Loader2, Upload, CheckCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PublishToWordPress({ content, onPublished }) {
  const [publishing, setPublishing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [postStatus, setPostStatus] = useState('publish');
  const [categoryId, setCategoryId] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [publishedUrl, setPublishedUrl] = useState(null);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      // Get WordPress connection
      const connections = await WordPressConnection.list('-created_date', 1);
      if (connections.length === 0) {
        toast.error('WordPress not connected', {
          description: 'Please configure WordPress connection first'
        });
        setPublishing(false);
        return;
      }

      const wpConnection = connections[0];
      if (wpConnection.connection_status !== 'connected') {
        toast.error('WordPress connection error', {
          description: 'Please test and verify your WordPress connection'
        });
        setPublishing(false);
        return;
      }

      // Prepare post data
      const postData = {
        title: content.title,
        content: content.content,
        status: postStatus,
        categories: categoryId ? [parseInt(categoryId)] : (wpConnection.default_category_id ? [parseInt(wpConnection.default_category_id)] : []),
        author: authorId ? parseInt(authorId) : (wpConnection.default_author_id ? parseInt(wpConnection.default_author_id) : undefined),
      };

      // Add meta description if available
      if (content.meta_description) {
        postData.meta = {
          description: content.meta_description
        };
      }

      // Publish to WordPress
      const auth = btoa(`${wpConnection.username}:${wpConnection.application_password}`);
      const response = await fetch(`${wpConnection.api_url}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to publish to WordPress');
      }

      const result = await response.json();
      
      // Update content queue with WordPress post ID
      await ContentQueue.update(content.id, {
        status: 'published',
        wordpress_post_id: result.id.toString(),
        scheduled_publish_date: new Date().toISOString()
      });

      setPublishedUrl(result.link);
      
      toast.success('Published to WordPress!', {
        description: `"${content.title}" is now live on your site`,
        duration: 5000
      });

      if (onPublished) {
        onPublished(result);
      }
    } catch (error) {
      console.error('Publishing error:', error);
      toast.error('Failed to publish', {
        description: error.message || 'Could not publish to WordPress'
      });
    } finally {
      setPublishing(false);
      setShowDialog(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        disabled={publishing}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {publishing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Publishing...
          </>
        ) : publishedUrl ? (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Published
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Publish to WordPress
          </>
        )}
      </Button>

      {publishedUrl && (
        <Button
          variant="outline"
          onClick={() => window.open(publishedUrl, '_blank')}
          className="ml-2"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View Live
        </Button>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish to WordPress</DialogTitle>
            <DialogDescription>
              Configure publishing options for "{content.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="post-status">Post Status</Label>
              <Select value={postStatus} onValueChange={setPostStatus}>
                <SelectTrigger id="post-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publish">Publish (live immediately)</SelectItem>
                  <SelectItem value="draft">Draft (save but don't publish)</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category ID (Optional)</Label>
              <Input
                id="category"
                placeholder="Leave blank for default"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              />
              <p className="text-xs text-slate-500">WordPress category ID number</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Author ID (Optional)</Label>
              <Input
                id="author"
                placeholder="Leave blank for default"
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
              />
              <p className="text-xs text-slate-500">WordPress author ID number</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePublish} disabled={publishing}>
              {publishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Publish Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}