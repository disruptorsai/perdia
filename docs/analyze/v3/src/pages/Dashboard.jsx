import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  AlertCircle,
  Zap,
  Plus,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";

import StatsCard from "../components/dashboard/StatsCard";
import RecentArticles from "../components/dashboard/RecentArticles";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import TopicQueue from "../components/dashboard/TopicQueue";

export default function Dashboard() {
  const { data: articles = [], isLoading: loadingArticles } = useQuery({
    queryKey: ['articles'],
    queryFn: () => base44.entities.Article.list('-created_date', 100),
  });

  const { data: keywords = [] } = useQuery({
    queryKey: ['keywords'],
    queryFn: () => base44.entities.Keyword.list('-created_date', 50),
  });

  const { data: clusters = [] } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => base44.entities.Cluster.list('-created_date', 50),
  });

  const { data: contentIdeas = [] } = useQuery({
    queryKey: ['content-ideas'],
    queryFn: () => base44.entities.ContentIdea.list('-created_date', 50),
  });

  const stats = {
    totalArticles: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    inReview: articles.filter(a => a.status === 'in_review').length,
    needsRevision: articles.filter(a => a.status === 'needs_revision').length,
    thisWeek: articles.filter(a => {
      const created = new Date(a.created_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created > weekAgo;
    }).length,
    avgScore: articles.filter(a => a.editor_score).length > 0
      ? (articles.filter(a => a.editor_score).reduce((sum, a) => sum + a.editor_score, 0) / 
         articles.filter(a => a.editor_score).length).toFixed(1)
      : 'N/A',
  };

  const pendingIdeasCount = contentIdeas.filter(i => i.status === 'pending').length;
  const targetKeywordsCount = keywords.filter(k => k.target_flag).length;
  const activeClustersCount = clusters.filter(c => c.status === 'active').length;
  const totalSuggestions = targetKeywordsCount + activeClustersCount + contentIdeas.filter(i => i.status === 'approved').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Content Engine Dashboard
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              AI-assisted content production for GetEducated
            </p>
          </div>
          <div className="flex gap-2">
            <Link to={createPageUrl("ArticleWizard")}>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/30 gap-2" size="lg">
                <Sparkles className="w-5 h-5" />
                Generate New Article
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Quick Generate CTA */}
        {totalSuggestions > 0 && (
          <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-600 to-emerald-700 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/50 to-transparent" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Zap className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl mb-1">
                      {totalSuggestions} AI-Powered Suggestions Ready
                    </h3>
                    <p className="text-emerald-100">
                      Start the wizard to choose from keywords, clusters, and trending topics
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span>✨ {targetKeywordsCount} from keywords</span>
                      <span>📁 {activeClustersCount} from clusters</span>
                      <span>🔥 {contentIdeas.filter(i => i.status === 'approved').length} trending</span>
                    </div>
                  </div>
                </div>
                <Link to={createPageUrl("ArticleWizard")}>
                  <Button size="lg" variant="secondary" className="bg-white text-emerald-700 hover:bg-emerald-50 gap-2">
                    Start Wizard
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Topic Queue Alert */}
        {pendingIdeasCount > 0 && (
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">
                      {pendingIdeasCount} trending topic{pendingIdeasCount > 1 ? 's' : ''} need review
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Approve topics to add them to the wizard suggestions
                    </p>
                  </div>
                </div>
                <Link to={createPageUrl("TopicDiscovery")}>
                  <Button variant="secondary" className="bg-white text-blue-700 hover:bg-blue-50">
                    Review Topics
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Articles"
            value={stats.totalArticles}
            icon={FileText}
            trend={`${stats.thisWeek} this week`}
            color="blue"
          />
          <StatsCard
            title="Published"
            value={stats.published}
            icon={CheckCircle2}
            trend={`${((stats.published / stats.totalArticles) * 100 || 0).toFixed(0)}% completion`}
            color="green"
          />
          <StatsCard
            title="In Review"
            value={stats.inReview}
            icon={Clock}
            trend="Awaiting approval"
            color="amber"
          />
          <StatsCard
            title="Avg Quality Score"
            value={stats.avgScore}
            icon={TrendingUp}
            trend="Out of 10"
            color="cyan"
          />
        </div>

        {/* Quick Actions */}
        {stats.inReview > 0 && (
          <Card className="border-none shadow-lg bg-gradient-to-br from-amber-600 to-amber-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Action Required</h3>
                    <p className="text-amber-100 text-sm">
                      {stats.inReview} article{stats.inReview > 1 ? 's' : ''} awaiting review
                    </p>
                  </div>
                </div>
                <Link to={createPageUrl("ReviewQueue")}>
                  <Button variant="secondary" className="bg-white text-amber-700 hover:bg-amber-50">
                    Review Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecentArticles articles={articles} isLoading={loadingArticles} />
            <TopicQueue ideas={contentIdeas} />
          </div>
          <div>
            <ActivityFeed articles={articles} />
          </div>
        </div>

        {/* System Health */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-gray-400" />
              System Health & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Schema Validation</span>
                </div>
                <span className="text-sm text-green-700 font-semibold">
                  {articles.filter(a => a.schema_valid).length}/{articles.length} passing
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Shortcode Compliance</span>
                </div>
                <span className="text-sm text-green-700 font-semibold">
                  {articles.filter(a => a.shortcode_valid).length}/{articles.length} compliant
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Active Keywords</span>
                </div>
                <span className="text-sm text-blue-700 font-semibold">
                  {keywords.length} tracked
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-gray-900">Topic Clusters</span>
                </div>
                <span className="text-sm text-emerald-700 font-semibold">
                  {clusters.length} active
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}