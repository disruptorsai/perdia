
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Loader2, Edit, Search, Filter, Calendar, User, Bot, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function PostList({ posts, isLoading, onPostSelect, onPostDelete }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_date');
  const [deletingId, setDeletingId] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Needs Review': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'Approved': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Scheduled': return 'pcc-bg-coral bg-opacity-20 pcc-text-coral border border-current';
      case 'Published': return 'pcc-bg-green bg-opacity-20 pcc-text-green border border-current';
      default: return 'bg-slate-200 text-slate-800';
    }
  };

  const getSourceIcon = (post) => {
    const isAIGenerated = post.created_by && post.created_by.includes('system') || 
                          post.content && post.content.includes('✅ **Blog post automatically') ||
                          post.title && post.title.length > 50;
    
    return isAIGenerated ? <Bot className="w-3 h-3 text-blue-500" /> : <User className="w-3 h-3 text-slate-500" />;
  };

  const handleDeleteClick = async (e, post) => {
    e.stopPropagation();
    if (onPostDelete && !deletingId) {
      setDeletingId(post.id);
      try {
        await onPostDelete(post);
      } catch (error) {
        console.error("Delete failed:", error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const filteredAndSortedPosts = posts
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (post.keywords && post.keywords.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'updated_date':
          return new Date(b.updated_date) - new Date(a.updated_date);
        case 'created_date':
        default:
          return new Date(b.created_date) - new Date(a.created_date);
      }
    });

  return (
    <Card className="pcc-cultural-card border-0 shadow-xl">
      <CardHeader className="pcc-wave-divider">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="pcc-tribal-accent pl-6">
            <CardTitle className="flex items-center gap-2 font-sans text-xl">
              <FileText className="w-6 h-6 pcc-text-blue" />
              Content Library ({posts.length})
            </CardTitle>
            <p className="text-sm text-slate-600 mt-2">
              Manage all blog content including AI-generated drafts ready for editorial review
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-48 bg-white/80 border-slate-200 focus:pcc-text-blue"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32 bg-white/80">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Needs Review">Needs Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-32 bg-white/80">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_date">Newest</SelectItem>
                <SelectItem value="updated_date">Recently Updated</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : filteredAndSortedPosts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {posts.length === 0 ? (
                <div className="pcc-cultural-card p-8 rounded-xl">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2 font-sans">No blog posts found</p>
                  <p className="text-sm">Use the AI Blog Writer or Blog Content Writer agent to create your first post.</p>
                  <div className="mt-4 flex justify-center">
                    <div className="w-16 h-0.5 pcc-bg-coral rounded-full"></div>
                  </div>
                </div>
              ) : (
                <p>No posts match your search criteria.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedPosts.map((post) => (
                <div 
                  key={post.id} 
                  className="p-4 border rounded-xl pcc-cultural-card hover:bg-white/80 hover:shadow-md transition-all duration-300 cursor-pointer group relative"
                  onClick={() => onPostSelect(post)}
                >
                  <div className="absolute left-0 top-4 bottom-4 w-1 pcc-bg-coral rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="flex items-start justify-between pl-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {getSourceIcon(post)}
                          <h4 className="font-semibold text-slate-800 truncate pr-2 group-hover:pcc-text-blue flex-1 font-sans transition-colors">{post.title}</h4>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={`${getStatusColor(post.status)} font-sans`}>{post.status}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPostSelect(post);
                            }}
                            title="Edit post"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          {onPostDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`p-1 h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 ${deletingId === post.id ? 'opacity-50' : ''}`}
                              onClick={(e) => handleDeleteClick(e, post)}
                              title="Delete post"
                              disabled={deletingId === post.id}
                            >
                              {deletingId === post.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {post.keywords && (
                        <div className="mb-2">
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                            Keywords: {post.keywords.split(',').slice(0, 3).join(', ')}{post.keywords.split(',').length > 3 ? '...' : ''}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {post.status === 'Scheduled' && post.scheduled_date 
                            ? `Scheduled for ${format(new Date(post.scheduled_date), 'MMM d, yyyy')}`
                            : `Created ${format(new Date(post.created_date), 'MMM d, yyyy')}`
                          }
                        </span>
                        {post.updated_date && new Date(post.updated_date) > new Date(post.created_date) && (
                          <span className="text-amber-600">
                            Updated {format(new Date(post.updated_date), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
