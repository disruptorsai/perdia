
import React, { useState, useEffect } from 'react';
import { ContentQueue } from '@/lib/perdia-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Search, Eye, Edit, Trash2, Loader2, Calendar, Image, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import PublishToWordPress from '../components/content/PublishToWordPress';
import ImageUploadModal from '../components/content/ImageUploadModal';
import ImageEnlargeDialog from '../components/content/ImageEnlargeDialog';

export default function ContentLibrary() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedContent, setSelectedContent] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedArticleForImage, setSelectedArticleForImage] = useState(null);
  const [enlargeImageOpen, setEnlargeImageOpen] = useState(false);
  const [enlargeImageData, setEnlargeImageData] = useState(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const data = await ContentQueue.list('-created_date');
      setContent(data);
    } catch (error) {
      console.error("Error loading content:", error);
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      await ContentQueue.delete(id);
      toast.success('Content deleted');
      loadContent();
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("Failed to delete content");
    }
  };

  const handleOpenImageModal = (article) => {
    setSelectedArticleForImage(article);
    setImageModalOpen(true);
  };

  const handleImageAdded = async (imageData) => {
    try {
      await ContentQueue.update(selectedArticleForImage.id, {
        featured_image_url: imageData.url,
        featured_image_path: imageData.path,
        featured_image_alt_text: imageData.altText,
        featured_image_source: imageData.source
      });

      toast.success('Featured image added successfully!');
      loadContent();
      setImageModalOpen(false);
      setSelectedArticleForImage(null);
    } catch (error) {
      console.error('Error adding image:', error);
      toast.error('Failed to add image');
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

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.target_keywords && item.target_keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesType = filterType === 'all' || item.content_type === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: content.length,
    new_articles: content.filter(c => c.content_type === 'new_article').length,
    optimizations: content.filter(c => c.content_type === 'page_optimization').length,
    published: content.filter(c => c.status === 'published').length
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'new_article': return 'bg-blue-50 text-blue-700';
      case 'page_optimization': return 'bg-purple-50 text-purple-700';
      case 'update': return 'bg-green-50 text-green-700';
      case 'promotional': return 'bg-pink-50 text-pink-700';
      case 'strategy_guide': return 'bg-orange-50 text-orange-700';
      case 'company_story': return 'bg-amber-50 text-amber-700';
      case 'lead_magnet': return 'bg-indigo-50 text-indigo-700';
      case 'social_content': return 'bg-rose-50 text-rose-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      'new_article': 'SEO Article',
      'page_optimization': 'Content Optimization',
      'update': 'Update',
      'promotional': 'Promotional Content',
      'strategy_guide': 'Strategy Guide',
      'company_story': 'Company Story',
      'lead_magnet': 'Lead Magnet',
      'social_content': 'Social Media'
    };
    return labels[type] || type.replace('_', ' ');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-purple-600" />
            Content Library
          </h1>
          <p className="text-slate-600 mt-1">Manage all generated and optimized content</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">New Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.new_articles}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-indigo-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Optimizations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.optimizations}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Content Items ({filteredContent.length})</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto flex-wrap">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="new_article">SEO Articles</SelectItem>
                  <SelectItem value="page_optimization">Optimizations</SelectItem>
                  <SelectItem value="promotional">Promotional</SelectItem>
                  <SelectItem value="strategy_guide">Strategy Guides</SelectItem>
                  <SelectItem value="company_story">Company Stories</SelectItem>
                  <SelectItem value="lead_magnet">Lead Magnets</SelectItem>
                  <SelectItem value="social_content">Social Content</SelectItem>
                  <SelectItem value="update">Updates</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Content Yet</h3>
              <p className="text-slate-500 mb-4">Use the AI Content Engine to generate your first article</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContent.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900 truncate">{item.title}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={getTypeColor(item.content_type)}>
                            {getTypeLabel(item.content_type)}
                          </Badge>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                          {item.agent_name && (
                            <Badge variant="outline" className="text-xs">
                              Generated by: {item.agent_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          )}
                          {item.automation_mode && (
                            <Badge variant="outline">{item.automation_mode}</Badge>
                          )}
                          {item.word_count && (
                            <Badge variant="outline">{item.word_count} words</Badge>
                          )}
                          {item.wordpress_post_id && (
                            <Badge className="bg-green-100 text-green-800">
                              Published to WP
                            </Badge>
                          )}
                        </div>
                        {item.target_keywords && item.target_keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {item.target_keywords.slice(0, 5).map((keyword, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {item.target_keywords.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{item.target_keywords.length - 5} more
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(item.created_date), 'MMM d, yyyy')}
                          </span>
                          {item.created_by && (
                            <span>By: {item.created_by}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {(item.status === 'approved' || item.status === 'scheduled') && !item.wordpress_post_id && (
                          <PublishToWordPress
                            content={item}
                            onPublished={() => loadContent()}
                          />
                        )}
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant={item.featured_image_url ? "outline" : "default"}
                            size="sm"
                            onClick={() => handleOpenImageModal(item)}
                            className={item.featured_image_url ? "" : "bg-purple-600 hover:bg-purple-700"}
                          >
                            <Image className="w-4 h-4 mr-1" />
                            {item.featured_image_url ? "Change" : "Add"} Image
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setSelectedContent(item)}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedContent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedContent(null)}>
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>{selectedContent.title}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedContent(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Featured Image */}
              {selectedContent.featured_image_url && (
                <div className="mb-6">
                  <div
                    className="relative w-full h-64 rounded-lg overflow-hidden bg-slate-100 cursor-pointer group"
                    onClick={() => handleEnlargeImage(selectedContent)}
                  >
                    <img
                      src={selectedContent.featured_image_url}
                      alt={selectedContent.featured_image_alt_text || selectedContent.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  {selectedContent.featured_image_alt_text && (
                    <p className="text-sm text-slate-500 mt-2 italic">{selectedContent.featured_image_alt_text}</p>
                  )}
                </div>
              )}
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedContent.content }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {imageModalOpen && selectedArticleForImage && (
        <ImageUploadModal
          isOpen={imageModalOpen}
          onClose={() => {
            setImageModalOpen(false);
            setSelectedArticleForImage(null);
          }}
          onImageAdded={handleImageAdded}
          articleData={selectedArticleForImage}
        />
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
