/**
 * PERDIA V2: APPROVAL QUEUE (Simplified Interface)
 * =================================================
 *
 * ⚠️ ARCHITECTURE WARNING: This is the V2 version used at route /v2/approval
 * - Uses Article entity (articles table) ⚠️ MAY BE EMPTY!
 * - For V1 version, see ApprovalQueue.jsx (uses ContentQueue entity)
 * - CRITICAL ISSUE: Articles created in V1 won't appear here! Different table!
 * - RECOMMENDATION: Verify data exists in 'articles' table before using this page
 *
 * Simplified, focused approval workflow for blog articles
 *
 * Features:
 * - 5-day SLA countdown timer (MANDATORY)
 * - Quick actions (approve/reject without opening)
 * - Article drawer with full editing
 * - Search and filters
 * - Validation status badges
 *
 * This is where editors spend 80% of their time (when using V2 interface).
 *
 * Created: 2025-11-12 (Perdia V2)
 * Updated: 2025-11-13 (added architecture warnings)
 */

import React, { useState, useEffect } from 'react';
import { Article, Feedback } from '@/lib/perdia-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Filter,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, formatDistanceToNow, differenceInHours, differenceInDays } from 'date-fns';
import ArticleDrawer from '@/components/content/ArticleDrawerV2';
import { WordPressClient } from '@/lib/wordpress-client';
import { Integration } from '@/lib/perdia-sdk';

export default function ApprovalQueueV2() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending_review');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Load articles
  useEffect(() => {
    loadArticles();

    // Refresh every minute to update SLA timers
    const interval = setInterval(() => {
      setArticles(prev => [...prev]); // Force re-render for timer updates
    }, 60000);

    return () => clearInterval(interval);
  }, [filterStatus]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const filters = {};

      if (filterStatus && filterStatus !== 'all') {
        filters.status = filterStatus;
      }

      const data = await Article.find(filters, {
        orderBy: { column: 'pending_since', ascending: true }, // Oldest first (most urgent)
        limit: 100,
      });

      setArticles(data);
    } catch (error) {
      console.error("Error loading articles:", error);
      toast.error("Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  // Filter articles by search query
  const filteredArticles = articles.filter(article => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      article.title?.toLowerCase().includes(query) ||
      article.target_keywords?.some(kw => kw.toLowerCase().includes(query))
    );
  });

  // Quick approve action
  const handleQuickApprove = async (articleId) => {
    setActionLoading(prev => ({ ...prev, [articleId]: 'approving' }));

    try {
      // Update status to approved
      await Article.update(articleId, { status: 'approved' });

      // Record feedback
      await Feedback.create({
        article_id: articleId,
        type: 'approve',
        payload: { timestamp: new Date().toISOString(), method: 'quick_approve' },
      });

      // Publish to WordPress (async - happens in background)
      publishToWordPress(articleId);

      toast.success('Article approved and queued for publishing');

      // Refresh list
      loadArticles();
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Failed to approve article');
    } finally {
      setActionLoading(prev => ({ ...prev, [articleId]: null }));
    }
  };

  // Quick reject action
  const handleQuickReject = async (articleId) => {
    const reason = prompt('Reason for rejection (optional):');

    setActionLoading(prev => ({ ...prev, [articleId]: 'rejecting' }));

    try {
      await Article.update(articleId, {
        status: 'rejected',
        validation_errors: [{ type: 'rejected', message: reason || 'Rejected by editor' }],
      });

      await Feedback.create({
        article_id: articleId,
        type: 'reject',
        payload: { timestamp: new Date().toISOString(), reason, method: 'quick_reject' },
      });

      toast.success('Article rejected');
      loadArticles();
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Failed to reject article');
    } finally {
      setActionLoading(prev => ({ ...prev, [articleId]: null }));
    }
  };

  // Publish to WordPress (async)
  const publishToWordPress = async (articleId) => {
    try {
      const article = await Article.findOne({ id: articleId });

      // Get WordPress integration
      const integrations = await Integration.find({ type: 'wordpress', status: 'active' });
      if (integrations.length === 0) {
        console.warn('No active WordPress integration found');
        return;
      }

      const wpIntegration = integrations[0];
      const wp = new WordPressClient(
        wpIntegration.base_url,
        wpIntegration.credentials.username,
        wpIntegration.credentials.password
      );

      // Publish post
      const post = await wp.createPost({
        title: article.title,
        content: article.body,
        status: 'publish',
        featured_media_url: article.featured_image_url,
        meta: {
          description: article.meta_description,
        },
      });

      // Update article with WP post ID
      await Article.update(articleId, {
        status: 'published',
        wordpress_post_id: post.id.toString(),
        wordpress_url: post.link,
        published_at: new Date().toISOString(),
      });

      toast.success('Article published to WordPress');
    } catch (error) {
      console.error('WordPress publish error:', error);
      toast.error('Failed to publish to WordPress');
    }
  };

  // Open article in drawer
  const handleViewArticle = (article) => {
    setSelectedArticle(article);
    setDrawerOpen(true);
  };

  // Calculate SLA status
  const getSLAStatus = (article) => {
    if (article.status !== 'pending_review' || !article.auto_approve_at) {
      return null;
    }

    const now = new Date();
    const autoApproveAt = new Date(article.auto_approve_at);
    const hoursLeft = differenceInHours(autoApproveAt, now);
    const daysLeft = differenceInDays(autoApproveAt, now);

    if (hoursLeft < 0) {
      return { status: 'expired', color: 'red', text: 'Auto-approved' };
    } else if (hoursLeft < 24) {
      return { status: 'urgent', color: 'red', text: `${hoursLeft}h left` };
    } else if (daysLeft < 3) {
      return { status: 'warning', color: 'yellow', text: `${daysLeft}d left` };
    } else {
      return { status: 'ok', color: 'green', text: `${daysLeft}d left` };
    }
  };

  // Get status badge variant
  const getStatusBadge = (status) => {
    const variants = {
      draft: { variant: 'secondary', icon: FileText },
      pending_review: { variant: 'default', icon: Clock },
      approved: { variant: 'success', icon: CheckCircle },
      published: { variant: 'success', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: XCircle },
    };
    return variants[status] || variants.draft;
  };

  // Get validation badge
  const getValidationBadge = (article) => {
    if (article.validation_status === 'valid') {
      return <Badge variant="success" className="text-xs">✓ Valid</Badge>;
    } else if (article.validation_status === 'invalid') {
      return <Badge variant="destructive" className="text-xs">✗ Invalid</Badge>;
    } else {
      return <Badge variant="secondary" className="text-xs">⋯ Pending</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Approval Queue</h1>
          <p className="text-muted-foreground">Review and approve blog articles</p>
        </div>
        <Button onClick={loadArticles} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles by title or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Articles</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Articles Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredArticles.length} Article{filteredArticles.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No articles found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredArticles.map((article) => {
                const sla = getSLAStatus(article);
                const statusBadge = getStatusBadge(article.status);
                const StatusIcon = statusBadge.icon;
                const isLoading = actionLoading[article.id];

                return (
                  <div
                    key={article.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Article info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3
                            className="font-semibold text-lg truncate cursor-pointer hover:text-primary"
                            onClick={() => handleViewArticle(article)}
                          >
                            {article.title}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          {/* Status */}
                          <Badge variant={statusBadge.variant} className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {article.status.replace('_', ' ')}
                          </Badge>

                          {/* Validation */}
                          {getValidationBadge(article)}

                          {/* SLA Timer */}
                          {sla && (
                            <Badge
                              variant={sla.color === 'red' ? 'destructive' : sla.color === 'yellow' ? 'warning' : 'success'}
                              className="flex items-center gap-1"
                            >
                              <Clock className="h-3 w-3" />
                              {sla.text}
                            </Badge>
                          )}

                          {/* Word count */}
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {article.word_count || 0} words
                          </span>

                          {/* Cost */}
                          {article.total_cost > 0 && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${article.total_cost.toFixed(2)}
                            </span>
                          )}

                          {/* Model */}
                          {article.model_primary && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {article.model_primary}
                              {article.model_verify && ` → ${article.model_verify}`}
                            </span>
                          )}

                          {/* Updated */}
                          <span>
                            {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true })}
                          </span>
                        </div>

                        {/* Keywords */}
                        {article.target_keywords && article.target_keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {article.target_keywords.slice(0, 5).map((kw, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewArticle(article)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>

                        {article.status === 'pending_review' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleQuickApprove(article.id)}
                              disabled={!!isLoading}
                            >
                              {isLoading === 'approving' ? (
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
                              onClick={() => handleQuickReject(article.id)}
                              disabled={!!isLoading}
                            >
                              {isLoading === 'rejecting' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </>
                              )}
                            </Button>
                          </>
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

      {/* Article Drawer */}
      {selectedArticle && (
        <ArticleDrawer
          article={selectedArticle}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedArticle(null);
            loadArticles(); // Refresh list after closing drawer
          }}
          onUpdate={(updatedArticle) => {
            setSelectedArticle(updatedArticle);
            // Update article in list
            setArticles(prev =>
              prev.map(a => a.id === updatedArticle.id ? updatedArticle : a)
            );
          }}
        />
      )}
    </div>
  );
}
