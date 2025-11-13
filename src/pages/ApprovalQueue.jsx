/**
 * PERDIA V1: APPROVAL QUEUE (Full Features)
 * ==========================================
 *
 * ⚠️ ARCHITECTURE NOTE: This is the V1 version used at route /v1/approvals
 * - Uses ContentQueue entity (content_queue table) ✓ ACTIVE DATA SOURCE
 * - For V2 version, see ApprovalQueueV2.jsx (uses Article entity)
 * - CONFLICT: V1 and V2 use different tables - data won't sync!
 *
 * PRIMARY SCREEN - Users spend 80% of time here
 *
 * Features:
 * - 5-day SLA countdown timer (MANDATORY)
 * - Validation status badges
 * - Quick actions (approve/reject without opening)
 * - Article drawer with full editing
 * - List and Kanban views
 * - Bulk operations
 *
 * Created: 2025-11-12
 * Updated: 2025-11-13 (added architecture notes)
 */

import React, { useState, useEffect } from 'react';
import { ContentQueue } from '@/lib/perdia-sdk';
import { validateContentForPublishing } from '@/lib/content-validator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Calendar,
  Image as ImageIcon,
  Layers,
  List as ListIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, formatDistanceToNow, differenceInHours } from 'date-fns';
import ArticleDrawer from '@/components/content/ArticleDrawer';

export default function ApprovalQueue() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending_review');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [view, setView] = useState('list'); // 'list' or 'kanban'
  const [validationCache, setValidationCache] = useState({});

  useEffect(() => {
    loadArticles();

    // Refresh every minute to update SLA timers
    const interval = setInterval(() => {
      setArticles(prev => [...prev]); // Force re-render
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await ContentQueue.find(
        { content_type: 'new_article' },
        { orderBy: { column: 'pending_since', ascending: true }, limit: 200 }
      );
      setArticles(data);

      // Pre-validate pending articles
      data
        .filter(a => a.status === 'pending_review')
        .slice(0, 10) // Validate first 10 only
        .forEach(article => validateArticle(article.id));
    } catch (error) {
      console.error("Error loading articles:", error);
      toast.error("Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  const validateArticle = async (articleId) => {
    try {
      const result = await validateContentForPublishing(articleId);
      setValidationCache(prev => ({
        ...prev,
        [articleId]: result
      }));
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  const calculateSLAStatus = (article) => {
    if (!article.pending_since || article.status !== 'pending_review') {
      return null;
    }

    const pendingSince = new Date(article.pending_since);
    const now = new Date();
    const hoursElapsed = differenceInHours(now, pendingSince);
    const slaHours = 120; // 5 days = 120 hours

    const hoursRemaining = slaHours - hoursElapsed;
    const daysRemaining = Math.floor(hoursRemaining / 24);
    const hoursRemainingInDay = hoursRemaining % 24;

    return {
      hoursRemaining,
      daysRemaining,
      hoursRemainingInDay,
      percentage: Math.max(0, (hoursRemaining / slaHours) * 100),
      urgency: hoursRemaining <= 24 ? 'critical' : hoursRemaining <= 48 ? 'warning' : 'normal',
      expired: hoursRemaining <= 0
    };
  };

  const handleQuickApprove = async (articleId) => {
    try {
      // Validate first
      const validation = validationCache[articleId] || await validateContentForPublishing(articleId);

      if (!validation.isValid) {
        toast.error(`Cannot approve: ${validation.errors.length} validation errors`);
        return;
      }

      await ContentQueue.update(articleId, {
        status: 'approved',
        approved_date: new Date().toISOString()
      });

      toast.success('Article approved');
      loadArticles();
    } catch (error) {
      console.error("Error approving article:", error);
      toast.error("Failed to approve article");
    }
  };

  const handleQuickReject = async (articleId) => {
    try {
      await ContentQueue.update(articleId, {
        status: 'rejected',
        rejection_reason: 'Rejected from approval queue'
      });

      toast.success('Article rejected');
      loadArticles();
    } catch (error) {
      console.error("Error rejecting article:", error);
      toast.error("Failed to reject article");
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;

    try {
      await Promise.all(selectedIds.map(id => handleQuickApprove(id)));
      setSelectedIds([]);
      toast.success(`Approved ${selectedIds.length} articles`);
    } catch (error) {
      console.error("Error bulk approving:", error);
      toast.error("Failed to approve some articles");
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;

    if (!confirm(`Reject ${selectedIds.length} articles?`)) return;

    try {
      await Promise.all(selectedIds.map(id => handleQuickReject(id)));
      setSelectedIds([]);
      toast.success(`Rejected ${selectedIds.length} articles`);
    } catch (error) {
      console.error("Error bulk rejecting:", error);
      toast.error("Failed to reject some articles");
    }
  };

  const handleOpenDrawer = (article) => {
    setSelectedArticle(article);
    setDrawerOpen(true);
    if (!validationCache[article.id]) {
      validateArticle(article.id);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (article.target_keywords && article.target_keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesStatus = filterStatus === 'all' || article.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    pending: articles.filter(a => a.status === 'pending_review').length,
    approved: articles.filter(a => a.status === 'approved').length,
    scheduled: articles.filter(a => a.status === 'scheduled').length,
    slaExpiring: articles.filter(a => {
      const sla = calculateSLAStatus(a);
      return sla && sla.hoursRemaining <= 24 && sla.hoursRemaining > 0;
    }).length,
    slaExpired: articles.filter(a => {
      const sla = calculateSLAStatus(a);
      return sla && sla.expired;
    }).length
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-purple-600" />
            Approval Queue
          </h1>
          <p className="text-slate-600 mt-1">Review and approve AI-generated articles</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">SLA Expiring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.slaExpiring}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">SLA Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.slaExpired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Articles ({filteredArticles.length})</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto flex-wrap">
              {selectedIds.length > 0 && (
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-slate-600">{selectedIds.length} selected</span>
                  <Button size="sm" onClick={handleBulkApprove} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve All
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleBulkReject}>
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject All
                  </Button>
                </div>
              )}

              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>

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
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-1 border rounded-lg p-1">
                <Button
                  size="sm"
                  variant={view === 'list' ? 'default' : 'ghost'}
                  onClick={() => setView('list')}
                >
                  <ListIcon className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={view === 'kanban' ? 'default' : 'ghost'}
                  onClick={() => setView('kanban')}
                >
                  <Layers className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Articles</h3>
              <p className="text-slate-500 mb-4">No articles match your current filters</p>
            </div>
          ) : view === 'list' ? (
            <ArticleListView
              articles={filteredArticles}
              selectedIds={selectedIds}
              validationCache={validationCache}
              onToggleSelection={toggleSelection}
              onOpenDrawer={handleOpenDrawer}
              onQuickApprove={handleQuickApprove}
              onQuickReject={handleQuickReject}
              calculateSLAStatus={calculateSLAStatus}
            />
          ) : (
            <div className="text-center py-12 text-slate-500">
              Kanban view coming soon...
            </div>
          )}
        </CardContent>
      </Card>

      {drawerOpen && selectedArticle && (
        <ArticleDrawer
          article={selectedArticle}
          validation={validationCache[selectedArticle.id]}
          isOpen={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedArticle(null);
          }}
          onSave={() => {
            loadArticles();
            setDrawerOpen(false);
            setSelectedArticle(null);
          }}
        />
      )}
    </div>
  );
}

function ArticleListView({
  articles,
  selectedIds,
  validationCache,
  onToggleSelection,
  onOpenDrawer,
  onQuickApprove,
  onQuickReject,
  calculateSLAStatus
}) {
  return (
    <div className="space-y-4">
      {articles.map((article) => {
        const sla = calculateSLAStatus(article);
        const validation = validationCache[article.id];
        const isSelected = selectedIds.includes(article.id);

        return (
          <Card
            key={article.id}
            className={`hover:shadow-md transition-shadow ${
              sla?.urgency === 'critical' ? 'border-red-500 border-2' :
              sla?.urgency === 'warning' ? 'border-orange-500 border-2' : ''
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelection(article.id)}
                  className="mt-1"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3
                      className="text-lg font-semibold text-slate-900 cursor-pointer hover:text-purple-600"
                      onClick={() => onOpenDrawer(article)}
                    >
                      {article.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={getStatusColor(article.status)}>
                      {article.status.replace('_', ' ')}
                    </Badge>

                    {article.word_count && (
                      <Badge variant="outline">{article.word_count} words</Badge>
                    )}

                    {article.featured_image_url && (
                      <Badge variant="outline" className="bg-green-50">
                        <ImageIcon className="w-3 h-3 mr-1" />
                        Has Image
                      </Badge>
                    )}

                    {validation && (
                      <Badge
                        className={
                          validation.isValid ? 'bg-green-100 text-green-800' :
                          validation.errors.length > 0 ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {validation.isValid ? '✓ Valid' :
                         `${validation.errors.length} errors, ${validation.warnings.length} warnings`}
                      </Badge>
                    )}

                    {sla && !sla.expired && (
                      <Badge
                        className={
                          sla.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                          sla.urgency === 'warning' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {sla.daysRemaining}d {sla.hoursRemainingInDay}h until auto-publish
                      </Badge>
                    )}

                    {sla && sla.expired && (
                      <Badge className="bg-red-600 text-white">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        SLA EXPIRED - Auto-published
                      </Badge>
                    )}
                  </div>

                  {article.target_keywords && article.target_keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {article.target_keywords.slice(0, 3).map((keyword, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {article.target_keywords.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{article.target_keywords.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(article.created_date), 'MMM d, yyyy')}
                    </span>
                    {article.pending_since && (
                      <span>
                        Pending for {formatDistanceToNow(new Date(article.pending_since))}
                      </span>
                    )}
                  </div>
                </div>

                {article.status === 'pending_review' && (
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => onQuickApprove(article.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenDrawer(article)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onQuickReject(article.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function getStatusColor(status) {
  switch (status) {
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'pending_review': return 'bg-yellow-100 text-yellow-800';
    case 'approved': return 'bg-green-100 text-green-800';
    case 'scheduled': return 'bg-blue-100 text-blue-800';
    case 'published': return 'bg-purple-100 text-purple-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
