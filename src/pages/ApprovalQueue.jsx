
import React, { useState, useEffect } from 'react';
import { ContentQueue } from '@/lib/perdia-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Check, X, Eye, Loader2, AlertCircle, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import PublishToWordPress from '../components/content/PublishToWordPress';
import ImageEnlargeDialog from '../components/content/ImageEnlargeDialog';

export default function ApprovalQueue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [enlargeImageOpen, setEnlargeImageOpen] = useState(false);
  const [enlargeImageData, setEnlargeImageData] = useState(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await ContentQueue.find({ status: 'pending_review' }, { orderBy: { column: 'created_date', ascending: false } });
      setQueue(data);
    } catch (error) {
      console.error("Error loading queue:", error);
      toast.error("Failed to load approval queue");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item) => {
    setProcessing(true);
    try {
      await ContentQueue.update(item.id, {
        status: 'approved',
        review_notes: reviewNotes
      });
      toast.success('Content approved!', {
        description: 'Ready to publish to WordPress'
      });
      setSelectedItem(null);
      setReviewNotes('');
      loadQueue();
    } catch (error) {
      console.error("Error approving content:", error);
      toast.error("Failed to approve content");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (item) => {
    if (!reviewNotes.trim()) {
      toast.error('Please provide rejection notes');
      return;
    }

    setProcessing(true);
    try {
      await ContentQueue.update(item.id, {
        status: 'rejected',
        review_notes: reviewNotes
      });
      toast.success('Content rejected');
      setSelectedItem(null);
      setReviewNotes('');
      loadQueue();
    } catch (error) {
      console.error("Error rejecting content:", error);
      toast.error("Failed to reject content");
    } finally {
      setProcessing(false);
    }
  };

  const handleEnlargeImage = (item) => {
    setEnlargeImageData({
      url: item.featured_image_url,
      alt: item.featured_image_alt_text || item.title,
      title: item.title
    });
    setEnlargeImageOpen(true);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'new_article': return 'bg-blue-50 text-blue-700';
      case 'page_optimization': return 'bg-purple-50 text-purple-700';
      case 'update': return 'bg-green-50 text-green-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-orange-600" />
            Approval Queue
          </h1>
          <p className="text-slate-600 mt-1">Review and approve AI-generated content before publishing</p>
        </div>
        <Button variant="outline" onClick={loadQueue}>
          Refresh Queue
        </Button>
      </div>

      <Card className="border-l-4 border-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pending Review</span>
            <Badge variant="secondary" className="text-lg px-4 py-1">{queue.length}</Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : queue.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Content Pending Review</h3>
            <p className="text-slate-500">All content has been reviewed. Great job!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {queue.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* Thumbnail */}
                  {item.featured_image_url && (
                    <div
                      className="relative w-full sm:w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 cursor-pointer group"
                      onClick={() => handleEnlargeImage(item)}
                    >
                      <img
                        src={item.featured_image_url}
                        alt={item.featured_image_alt_text || item.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                        {item.featured_image_source === 'ai_generated' ? 'AI Generated' :
                         item.featured_image_source === 'upload' ? 'Uploaded' : 'Stock'}
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getTypeColor(item.content_type)}>
                        {item.content_type.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">
                        {item.word_count || 0} words
                      </Badge>
                      {item.automation_mode && (
                        <Badge variant="secondary">{item.automation_mode}</Badge>
                      )}
                    </div>
                    {item.target_keywords && item.target_keywords.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-slate-600 mb-1">Target Keywords:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.target_keywords.map((keyword, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-slate-500">
                      Generated: {format(new Date(item.created_date), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="flex sm:flex-col gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedItem(item)}
                      className="flex-1 sm:flex-none"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedItem(null)}>
          <Card className="w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="mb-2">{selectedItem.title}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getTypeColor(selectedItem.content_type)}>
                      {selectedItem.content_type.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">{selectedItem.word_count || 0} words</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Featured Image */}
              {selectedItem.featured_image_url && (
                <div className="mb-6">
                  <div
                    className="relative w-full h-64 rounded-lg overflow-hidden bg-slate-100 cursor-pointer group"
                    onClick={() => handleEnlargeImage(selectedItem)}
                  >
                    <img
                      src={selectedItem.featured_image_url}
                      alt={selectedItem.featured_image_alt_text || selectedItem.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  {selectedItem.featured_image_alt_text && (
                    <p className="text-sm text-slate-500 mt-2 italic">{selectedItem.featured_image_alt_text}</p>
                  )}
                </div>
              )}
              <div
                className="prose max-w-none mb-6"
                dangerouslySetInnerHTML={{ __html: selectedItem.content }}
              />
            </div>

            <div className="border-t p-6 flex-shrink-0 bg-slate-50">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Review Notes {!reviewNotes.trim() && <span className="text-red-500">(Required for rejection)</span>}
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
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedItem(null)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleReject(selectedItem)}
                  disabled={processing || !reviewNotes.trim()}
                >
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                  Reject
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(selectedItem)}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Approve
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {enlargeImageOpen && enlargeImageData && (
        <ImageEnlargeDialog
          isOpen={enlargeImageOpen}
          onClose={() => setEnlargeImageOpen(false)}
          imageUrl={enlargeImageData.url}
          imageAlt={enlargeImageData.alt}
          title={enlargeImageData.title}
        />
      )}
    </div>
  );
}
